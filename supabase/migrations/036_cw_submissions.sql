-- Миграция 036: результаты контрольных работ для учителя
--
-- Зачем. Учитель (администратор) видит в админке, кто какую контрольную
-- сдал: ник, работа, верных из скольких, оценка, время и разбор по задачам.
-- До сих пор результат жил только на экране и в браузере ученика.
--
-- Кто пишет. Браузер сюда не пишет: только воркер сайта (служебная роль)
-- через функцию cw_submission_save — у воркера есть счётчик частоты по
-- адресу и проверка, что запрос пришёл со страницы самого сайта.
-- Повторная отправка той же попытки (ученик отметил «Ответ всё же совпал»)
-- обновляет строку по её uuid, а не добавляет новую — в течение 2 часов.
-- От мусора: строка пишется, только если работа (тема) существует и все
-- задачи ответа из неё; новых строк — не больше 200 в час на весь сайт.
--
-- Дети. Хранится только ник, который ученик вписал сам, результат и его
-- ответы (до 80 знаков каждый). Ни имени, ни почты, ни IP-адреса. Строки
-- старше 12 месяцев удаляются при следующей записи и при открытии раздела
-- в админке. Администратор может удалить любую строку (например, по обращению со страницы /privacy).
--
-- Запускать в Supabase: SQL Editor → New query → Run. Воркеру нужен секрет
-- SUPABASE_SERVICE_ROLE_KEY (тот же, что у дуэлей); без него приём выключен.

create table if not exists public.cw_submissions (
  id bigint generated always as identity primary key,
  attempt uuid not null unique,
  nick text not null check (char_length(nick) between 2 and 24),
  kind text not null check (kind in ('topic', 'paper')),
  paper_id bigint references public.exam_papers(id) on delete set null,
  topic_id bigint references public.topics(id) on delete set null,
  slug text not null check (char_length(slug) between 1 and 160),
  title text check (title is null or char_length(title) <= 200),
  score smallint not null check (score between 0 and 60),
  total smallint not null check (total between 1 and 60 and score <= total),
  percent smallint not null check (percent between 0 and 100),
  grade smallint check (grade is null or grade between 0 and 10),
  time_sec int check (time_sec is null or time_sec between 0 and 86400),
  violations smallint check (violations is null or violations between 0 and 1000),
  lang text check (lang is null or lang in ('ru', 'lv')),
  answers jsonb not null default '[]'::jsonb check (jsonb_typeof(answers) = 'array' and jsonb_array_length(answers) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cw_submissions_created on public.cw_submissions (created_at desc);
create index if not exists idx_cw_submissions_slug on public.cw_submissions (slug, created_at desc);

-- Прямого доступа у посетителей нет; администратор читает и удаляет.
alter table public.cw_submissions enable row level security;

drop policy if exists "Admins read cw submissions" on public.cw_submissions;
create policy "Admins read cw submissions" on public.cw_submissions
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins delete cw submissions" on public.cw_submissions;
create policy "Admins delete cw submissions" on public.cw_submissions
  for delete to authenticated using (public.is_admin());

revoke all on public.cw_submissions from anon, authenticated;
grant select, delete on public.cw_submissions to authenticated;

-- ── Только воркер (служебная роль) ──────────────────────────────────────

create or replace function public.cw_submission_save(
  p_attempt uuid, p_nick text, p_kind text, p_paper_id bigint, p_topic_id bigint, p_slug text, p_title text,
  p_score int, p_total int, p_percent int, p_grade int, p_time_sec int, p_violations int, p_lang text, p_answers jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  paper bigint := null;
  topic bigint := null;
  ids bigint[];
begin
  -- Старые результаты не копятся (и ещё раз — при открытии раздела в админке).
  delete from public.cw_submissions where created_at < now() - interval '12 months';

  if jsonb_typeof(p_answers) is distinct from 'array' or jsonb_array_length(p_answers) <> p_total then
    return false;
  end if;
  select array_agg((a->>'task_id')::bigint) into ids from jsonb_array_elements(p_answers) a;

  -- Работа или тема должна существовать, а задачи ответа — быть из неё:
  -- иначе это не сдача, а мусор, и строка не пишется.
  if p_kind = 'paper' then
    select p.id into paper from public.exam_papers p where p.id = p_paper_id and p.is_published;
    if paper is null then return false; end if;
    if exists (select 1 from unnest(ids) as t(id)
               where not exists (select 1 from public.exam_paper_items i where i.paper_id = paper and i.task_id = t.id)) then
      return false;
    end if;
    if p_topic_id is not null then
      select t.id into topic from public.topics t where t.id = p_topic_id;
    end if;
  else
    select t.id into topic from public.topics t where t.id = p_topic_id;
    if topic is null then return false; end if;
    if exists (select 1 from unnest(ids) as x(id)
               where not exists (select 1 from public.tasks k where k.id = x.id and k.topic_id = topic and k.is_published)) then
      return false;
    end if;
  end if;
  if (select count(distinct x) from unnest(ids) as x) <> p_total then
    return false;
  end if;

  -- Общий потолок новых строк: цикл из консоли не забьёт базу (200 в час —
  -- с запасом на шесть классов разом). Это ошибка, а не false: воркер ответит
  -- 502, браузер ученика оставит результат в ящике и дошлёт позже.
  -- Обновление уже сданной попытки под потолок не попадает.
  if not exists (select 1 from public.cw_submissions s where s.attempt = p_attempt)
     and (select count(*) from public.cw_submissions s where s.created_at > now() - interval '1 hour') >= 200 then
    raise exception 'cw_submissions: hourly cap reached';
  end if;

  -- Слаг и название — из базы, а не со слов браузера.
  if paper is not null then
    select p.slug, coalesce(nullif(p.title, ''), p.title_lv) into p_slug, p_title from public.exam_papers p where p.id = paper;
  elsif topic is not null then
    select t.slug, coalesce(nullif(t.title, ''), t.title_lv) into p_slug, p_title from public.topics t where t.id = topic;
  end if;

  insert into public.cw_submissions as s (attempt, nick, kind, paper_id, topic_id, slug, title, score, total, percent,
    grade, time_sec, violations, lang, answers)
  values (p_attempt, left(trim(p_nick), 24), p_kind, paper, topic, left(p_slug, 160), left(p_title, 200), p_score, p_total,
    p_percent, p_grade, p_time_sec, p_violations, p_lang, p_answers)
  on conflict (attempt) do update
    set score = excluded.score, percent = excluded.percent, grade = excluded.grade, answers = excluded.answers,
        updated_at = now()
    where s.created_at > now() - interval '2 hours' and s.total = excluded.total and s.nick = excluded.nick;
  return found;
end;
$$;

revoke all on function public.cw_submission_save(uuid, text, text, bigint, bigint, text, text, int, int, int, int, int, int, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.cw_submission_save(uuid, text, text, bigint, bigint, text, text, int, int, int, int, int, int, text, jsonb)
  to service_role;
