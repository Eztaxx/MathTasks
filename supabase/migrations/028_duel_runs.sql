-- Миграция 028: дуэли — записи попыток и таблица лидеров
--
-- Зачем. Две вещи на одной таблице:
--   1. «Случайный соперник»: если живого игрока онлайн нет, ученик играет
--      против записи — настоящей попытки другого игрока на тех же примерах.
--   2. Таблица лидеров по категориям и сложностям: за неделю и за всё время.
--
-- Честность. Как только результат виден всем, его хочется подделать,
-- поэтому браузер сюда не пишет вовсе. Писать может только воркер сайта
-- (служебная роль Supabase): он сам генерирует те же примеры по зерну,
-- сам проверяет ответы, берёт время попытки у базы, отсеивает
-- неправдоподобный темп и спрашивает Cloudflare Turnstile «не робот ли».
-- Браузер присылает только ответы и время каждого ответа.
--
-- Дети. Хранится ник (его фильтрует воркер, а страница — ещё раз при
-- показе), случайный номер игрока из браузера — чтобы в таблице был один
-- лучший результат на игрока, — ответы и время. Ни имени, ни почты, ни
-- IP-адреса. Записи старше 60 дней удаляются сами, кроме попавших в
-- таблицу «за всё время» (их не больше 20 на категорию). Администратор
-- может скрыть любую запись.
--
-- Запускать в Supabase: SQL Editor → New query → Run. Потом воркеру
-- нужны секреты SUPABASE_SERVICE_ROLE_KEY, TURNSTILE_SITE_KEY и
-- TURNSTILE_SECRET_KEY (docs/ROADMAP.md, раздел 5.7).
-- Пока их нет, дуэли работают как раньше, а в таблицу ничего не пишется.

create table if not exists public.duel_runs (
  id bigint generated always as identity primary key,
  cat text not null check (cat in ('addsub2', 'addsub3', 'multdiv', 'fractions', 'decimals', 'negatives', 'mix')),
  diff text not null check (diff in ('normal', 'hard', 'expert')),
  gen smallint not null check (gen between 1 and 1000),
  seed bigint not null check (seed between 0 and 4294967295),
  player text check (player is null or player ~ '^[a-z0-9]{8,32}$'),
  nick text check (nick is null or char_length(nick) between 2 and 24),
  answers jsonb,
  times jsonb,
  correct smallint check (correct is null or correct between 0 and 80),
  attempted smallint check (attempted is null or attempted between 0 and 80),
  verified boolean not null default false,   -- счёт посчитан воркером, темп правдоподобен
  ranked boolean not null default false,     -- попадает в таблицу лидеров
  hidden boolean not null default false,     -- скрыто администратором
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  week date                                  -- понедельник недели по рижскому времени
);

create index if not exists idx_duel_runs_ghost on public.duel_runs (cat, diff, gen, finished_at desc)
  where verified and not hidden;
create index if not exists idx_duel_runs_board on public.duel_runs (cat, diff, week, correct desc)
  where ranked and not hidden;

-- Прямого доступа к таблице нет ни у кого: только функции ниже.
alter table public.duel_runs enable row level security;

-- ── Только воркер (служебная роль) ──────────────────────────────────────

create or replace function public.duel_run_start(p_cat text, p_diff text, p_gen int, p_seed bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  run_id bigint;
begin
  -- Брошенные попытки и старые записи не копятся; лучшие за всё время остаются.
  delete from public.duel_runs where finished_at is null and started_at < now() - interval '10 minutes';
  delete from public.duel_runs r where r.finished_at < now() - interval '60 days'
    and not (r.ranked and r.id in (
      select b.id from public.duel_runs b
      where b.ranked and not b.hidden and b.cat = r.cat and b.diff = r.diff
      order by b.correct desc, b.attempted asc limit 20));
  insert into public.duel_runs (cat, diff, gen, seed) values (p_cat, p_diff, p_gen, p_seed) returning id into run_id;
  return run_id;
end;
$$;

-- Попытка для проверки: зерно, категория и сколько прошло — по часам базы.
create or replace function public.duel_run_load(p_run bigint)
returns table (id bigint, cat text, diff text, gen smallint, seed bigint, elapsed_ms bigint, finished boolean)
language sql stable security definer set search_path = '' as $$
  select r.id, r.cat, r.diff, r.gen, r.seed,
    (extract(epoch from (now() - r.started_at)) * 1000)::bigint,
    r.finished_at is not null
  from public.duel_runs r where r.id = p_run
$$;

create or replace function public.duel_run_save(p_run bigint, p_nick text, p_player text, p_answers jsonb, p_times jsonb,
  p_correct int, p_attempted int, p_verified boolean, p_ranked boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.duel_runs
    set nick = nullif(left(trim(coalesce(p_nick, '')), 24), ''),
        player = p_player, answers = p_answers, times = p_times,
        correct = p_correct, attempted = p_attempted,
        verified = p_verified, ranked = p_ranked and p_verified,
        finished_at = now(),
        week = date_trunc('week', now() at time zone 'Europe/Riga')::date
    where id = p_run and finished_at is null;
  return found;
end;
$$;

-- ── Всем ────────────────────────────────────────────────────────────────

-- Соперник-запись: проверенные попытки той же категории, ближайшие по уровню.
create or replace function public.duel_ghost(p_cat text, p_diff text, p_gen int, p_target int, p_exclude bigint[])
returns table (id bigint, seed bigint, nick text, answers jsonb, times jsonb, correct smallint, finished_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select r.id, r.seed, r.nick, r.answers, r.times, r.correct, r.finished_at
  from (
    select * from public.duel_runs
    where cat = p_cat and diff = p_diff and gen = p_gen and verified and not hidden
      and jsonb_array_length(answers) >= 3
      and not (id = any(coalesce(p_exclude, array[]::bigint[])))
    order by finished_at desc
    limit 300
  ) r
  order by abs(r.correct - coalesce(p_target, 10)), random()
  limit 8
$$;

-- Таблица лидеров: лучший результат каждого игрока, 20 мест.
-- p_period: 'week' — текущая неделя по рижскому времени, 'all' — за всё время.
create or replace function public.duel_leaderboard(p_cat text, p_diff text, p_period text default 'week')
returns table (place bigint, id bigint, nick text, correct smallint, attempted smallint, finished_at timestamptz)
language sql stable security definer set search_path = '' as $$
  with best as (
    select distinct on (coalesce(r.player, r.id::text)) r.id, r.nick, r.correct, r.attempted, r.finished_at
    from public.duel_runs r
    where r.ranked and not r.hidden and r.cat = p_cat and r.diff = p_diff
      and (p_period = 'all' or r.week = date_trunc('week', now() at time zone 'Europe/Riga')::date)
    order by coalesce(r.player, r.id::text), r.correct desc, r.attempted asc, r.finished_at asc
  )
  select row_number() over (order by b.correct desc, b.attempted asc, b.finished_at asc), b.id, b.nick, b.correct, b.attempted, b.finished_at
  from best b
  order by 1
  limit 20
$$;

-- Место попытки в таблице недели — воркер сообщает его игроку сразу.
create or replace function public.duel_run_place(p_run bigint)
returns bigint language sql stable security definer set search_path = '' as $$
  select l.place from public.duel_runs r
  cross join lateral public.duel_leaderboard(r.cat, r.diff, 'week') l
  where r.id = p_run and l.id = p_run
$$;

-- ── Администратору ──────────────────────────────────────────────────────

create or replace function public.duel_hide(p_run bigint, p_hidden boolean default true)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'admin_only'; end if;
  update public.duel_runs set hidden = p_hidden where id = p_run;
end;
$$;

revoke all on function public.duel_run_start(text, text, int, bigint), public.duel_run_load(bigint),
  public.duel_run_save(bigint, text, text, jsonb, jsonb, int, int, boolean, boolean), public.duel_run_place(bigint),
  public.duel_ghost(text, text, int, int, bigint[]), public.duel_leaderboard(text, text, text),
  public.duel_hide(bigint, boolean) from public, anon, authenticated;
grant execute on function public.duel_run_start(text, text, int, bigint), public.duel_run_load(bigint),
  public.duel_run_save(bigint, text, text, jsonb, jsonb, int, int, boolean, boolean), public.duel_run_place(bigint)
  to service_role;
grant execute on function public.duel_ghost(text, text, int, int, bigint[]), public.duel_leaderboard(text, text, text)
  to anon, authenticated, service_role;
grant execute on function public.duel_hide(bigint, boolean) to authenticated;
