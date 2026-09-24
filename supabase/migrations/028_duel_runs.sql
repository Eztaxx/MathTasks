-- Миграция 028: записи дуэлей для «Случайного соперника»
--
-- Зачем. Кнопка «Случайный соперник» сначала ищет живого игрока онлайн
-- (Supabase Realtime, без таблиц). Если за 15 секунд никого нет, ученик
-- играет против записи — настоящей попытки другого игрока на тех же
-- примерах. Записи и хранятся здесь.
--
-- Честность. Счёт в таблице не хранится как истина: хранятся сами ответы
-- и время каждого ответа, а счёт соперника пересчитывает браузер
-- следующего игрока — из того же зерна генерируются те же примеры.
-- Подделать «60 из 60» можно только, вписав верные ответы, а на это
-- база ставит время: запись закрывается не раньше чем через 50 секунд
-- после начала и не позже чем через 2 минуты, ответов — не больше 80.
-- Для дружеской игры этого барьера достаточно.
--
-- Дети. Хранится ник (его видит соперник, а показывается он только после
-- фильтра на странице), ответы и время. Ни имени, ни почты, ни
-- идентификатора устройства. Записи старше 60 дней удаляются сами.
--
-- Запускать в Supabase: SQL Editor → New query → Run. Пока миграция не
-- применена, живые дуэли работают, а запасной вариант «против записи»
-- просто недоступен.

create table if not exists public.duel_runs (
  id bigint generated always as identity primary key,
  cat text not null check (cat in ('addsub2', 'addsub3', 'multdiv', 'fractions', 'decimals', 'negatives', 'mix')),
  diff text not null check (diff in ('normal', 'hard', 'expert')),
  gen smallint not null check (gen between 1 and 1000),
  seed bigint not null check (seed between 0 and 4294967295),
  nick text check (nick is null or char_length(nick) between 2 and 24),
  answers jsonb,
  times jsonb,
  correct smallint check (correct is null or correct between 0 and 80),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists idx_duel_runs_pick on public.duel_runs (cat, diff, gen, finished_at desc)
  where finished_at is not null;

-- Прямого доступа к таблице нет ни у кого, кроме функций ниже.
alter table public.duel_runs enable row level security;

-- Начало попытки: база запоминает время старта — по нему проверяется конец.
create or replace function public.duel_begin(p_cat text, p_diff text, p_gen int, p_seed bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  run_id bigint;
begin
  -- Брошенные попытки и старые записи не копятся.
  delete from public.duel_runs where finished_at is null and started_at < now() - interval '10 minutes';
  delete from public.duel_runs where finished_at < now() - interval '60 days';
  insert into public.duel_runs (cat, diff, gen, seed) values (p_cat, p_diff, p_gen, p_seed) returning id into run_id;
  return run_id;
end;
$$;

-- Конец попытки: ответы, время каждого ответа (мс от старта) и счёт для подбора по уровню.
create or replace function public.duel_finish(p_run bigint, p_nick text, p_answers jsonb, p_times jsonb, p_correct int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  run public.duel_runs%rowtype;
  n int;
  elapsed interval;
begin
  select * into run from public.duel_runs where id = p_run and finished_at is null;
  if not found then return false; end if;
  elapsed := now() - run.started_at;
  if elapsed < interval '50 seconds' or elapsed > interval '2 minutes' then return false; end if;
  if jsonb_typeof(p_answers) <> 'array' or jsonb_typeof(p_times) <> 'array' then return false; end if;
  n := jsonb_array_length(p_answers);
  if n > 80 or n <> jsonb_array_length(p_times) then return false; end if;
  if exists (select 1 from jsonb_array_elements(p_answers) a where jsonb_typeof(a) <> 'string' or char_length(a #>> '{}') > 16) then return false; end if;
  if exists (select 1 from jsonb_array_elements(p_times) t where jsonb_typeof(t) <> 'number' or (t #>> '{}')::numeric < 0 or (t #>> '{}')::numeric > 61000) then return false; end if;
  if p_correct is null or p_correct < 0 or p_correct > n then return false; end if;
  update public.duel_runs
    set nick = nullif(left(trim(coalesce(p_nick, '')), 24), ''),
        answers = p_answers, times = p_times, correct = p_correct, finished_at = now()
    where id = p_run;
  return true;
end;
$$;

-- Соперник-запись: из свежих попыток той же категории, сложности и версии
-- генератора — ближайшая по уровню к игроку, случайная из восьми ближайших.
create or replace function public.duel_ghost(p_cat text, p_diff text, p_gen int, p_target int, p_exclude bigint[])
returns table (id bigint, seed bigint, nick text, answers jsonb, times jsonb, correct smallint, finished_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select r.id, r.seed, r.nick, r.answers, r.times, r.correct, r.finished_at
  from (
    select * from public.duel_runs
    where cat = p_cat and diff = p_diff and gen = p_gen and finished_at is not null
      and jsonb_array_length(answers) >= 3
      and not (id = any(coalesce(p_exclude, array[]::bigint[])))
    order by finished_at desc
    limit 300
  ) r
  order by abs(r.correct - coalesce(p_target, 10)), random()
  limit 8
$$;

revoke all on function public.duel_begin(text, text, int, bigint), public.duel_finish(bigint, text, jsonb, jsonb, int),
  public.duel_ghost(text, text, int, int, bigint[]) from public;
grant execute on function public.duel_begin(text, text, int, bigint), public.duel_finish(bigint, text, jsonb, jsonb, int),
  public.duel_ghost(text, text, int, int, bigint[]) to anon, authenticated;
