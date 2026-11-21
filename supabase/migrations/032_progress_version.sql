-- Миграция 032: версия снимка прогресса — два устройства не затирают друг друга
--
-- Зачем. Синхронизация читает снимок, сливает его с местным и пишет обратно.
-- Если два устройства делают это одновременно, запись второго затирает то,
-- что успело добавить первое: upsert ничего не проверял. Теперь запись идёт
-- через save_progress с номером версии: не совпал — клиент читает снимок
-- заново и сливает ещё раз (progress-sync.js). Время изменения ставит сервер,
-- а не часы телефона.
--
-- Страницы, оставшиеся в кэше у учеников, ещё пишут upsert'ом — триггер
-- поднимает версию и у их записей, так что новые клиенты такую запись
-- заметят. Прямую запись в таблицу можно будет закрыть отдельной миграцией,
-- когда старых страниц не останется.
--
-- Запускать в Supabase: SQL Editor → New query → Run (после 031).
-- Пока миграция не применена, сайт пишет прогресс как раньше.

alter table public.student_progress add column if not exists version bigint not null default 0;

create or replace function public.student_progress_bump()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists student_progress_bump on public.student_progress;
create trigger student_progress_bump before update on public.student_progress
  for each row execute function public.student_progress_bump();

-- Записать снимок, если с прошлого чтения его никто не менял. Возвращает
-- новую версию или null: строку успели поменять — прочитайте и слейте заново.
create or replace function public.save_progress(p_data jsonb, p_version bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  pid uuid := public.my_profile_id();
  result bigint;
begin
  if pid is null then raise exception 'no_profile'; end if;
  insert into public.student_progress as sp (profile_id, data)
    values (pid, coalesce(p_data, '{}'::jsonb))
  on conflict (profile_id) do update set data = excluded.data
    where sp.version = p_version
  returning sp.version into result;
  return result;
end;
$$;

revoke all on function public.save_progress(jsonb, bigint) from public, anon;
grant execute on function public.save_progress(jsonb, bigint) to authenticated;
