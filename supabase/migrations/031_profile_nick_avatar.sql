-- Миграция 031: смена ника не чаще раза в 3 месяца, аватар-зверь в профиле
-- и в попытках дуэли, индекс для «дуэли дня»
--
-- Ник. До сих пор ник профиля менялся прямым update (027) без ограничений.
-- Теперь прямое право отозвано: ник меняет только rename_profile, и не
-- чаще раза в 3 месяца — дата последней смены в nick_changed_at (null —
-- ник ни разу не меняли, первая смена свободна).
--
-- Аватар. Зверь из готового набора (public/duel.js: AVATARS) — короткий
-- ключ вроде 'fox'. Своих картинок нет — только ключ. Хранится в профиле
-- (set_profile_avatar) и в попытке дуэли (duel_runs.avatar, пишет только
-- воркер), чтобы таблица лидеров и соперник-запись показывали выбранного
-- зверя.
--
-- Дуэль дня отличается от обычной попытки только зерном (duel.js:
-- daySeed) — столбцов для неё не нужно, только индекс для таблицы дня.
--
-- Запускать в Supabase: SQL Editor → New query → Run (после 030).
-- До применения сайт работает как раньше: кнопок смены ника и выбора
-- зверя в профиле нет, воркер пишет попытки без аватара, таблица рисует
-- аватар по нику.

-- ── Профиль ────────────────────────────────────────────────────────────
alter table public.student_profiles add column if not exists nick_changed_at timestamptz;
alter table public.student_profiles add column if not exists avatar text
  check (avatar is null or avatar ~ '^[a-z0-9_-]{1,24}$');

-- Ник — только через rename_profile: у прямого update нет проверки срока.
revoke update (nick) on public.student_profiles from authenticated;
revoke update on public.student_profiles from authenticated;
drop policy if exists "Member renames own profile" on public.student_profiles;

create or replace function public.rename_profile(p_nick text)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare
  pid uuid := public.my_profile_id();
  clean text := left(trim(coalesce(p_nick, '')), 24);
  current_nick text;
  changed timestamptz;
begin
  if pid is null then raise exception 'no_profile'; end if;
  if char_length(clean) < 2 then raise exception 'nick_invalid'; end if;
  select nick, nick_changed_at into current_nick, changed from public.student_profiles where id = pid;
  if current_nick = clean then return changed; end if;
  if changed is not null and changed > now() - interval '3 months' then
    raise exception 'nick_too_soon:%', to_char((changed + interval '3 months') at time zone 'Europe/Riga', 'YYYY-MM-DD');
  end if;
  update public.student_profiles set nick = clean, nick_changed_at = now() where id = pid;
  return now();
end;
$$;

create or replace function public.set_profile_avatar(p_avatar text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  pid uuid := public.my_profile_id();
begin
  if pid is null then raise exception 'no_profile'; end if;
  update public.student_profiles set avatar = nullif(trim(coalesce(p_avatar, '')), '') where id = pid;
end;
$$;

revoke all on function public.rename_profile(text), public.set_profile_avatar(text) from public, anon;
grant execute on function public.rename_profile(text), public.set_profile_avatar(text) to authenticated;

-- ── Дуэли ──────────────────────────────────────────────────────────────
alter table public.duel_runs add column if not exists avatar text
  check (avatar is null or avatar ~ '^[a-z0-9_-]{1,24}$');

-- Дуэль дня: все попытки одной категории с одним зерном.
create index if not exists idx_duel_runs_daily on public.duel_runs (cat, seed, correct desc)
  where ranked and not hidden;

-- Отдельная функция, а не новый параметр duel_run_save: у старой сигнатуры
-- остаются вызовы воркера до выкладки, а перегрузка с default сломала бы
-- выбор функции в PostgREST.
create or replace function public.duel_run_set_avatar(p_run bigint, p_avatar text)
returns void language sql security definer set search_path = '' as $$
  update public.duel_runs set avatar = nullif(trim(coalesce(p_avatar, '')), '') where id = p_run
$$;

-- Тип результата меняется (добавлен avatar) — заменить можно только через drop.
drop function if exists public.duel_ghost(text, text, int, int, bigint[]);
create function public.duel_ghost(p_cat text, p_diff text, p_gen int, p_target int, p_exclude bigint[])
returns table (id bigint, seed bigint, nick text, avatar text, answers jsonb, times jsonb, correct smallint, finished_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select r.id, r.seed, r.nick, r.avatar, r.answers, r.times, r.correct, r.finished_at
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

-- duel_run_place ссылается на duel_leaderboard: снимаем её первой и создаём после.
drop function if exists public.duel_run_place(bigint);
drop function if exists public.duel_leaderboard(text, text, text);
create function public.duel_leaderboard(p_cat text, p_diff text, p_period text default 'week')
returns table (place bigint, id bigint, nick text, avatar text, correct smallint, attempted smallint, finished_at timestamptz)
language sql stable security definer set search_path = '' as $$
  with best as (
    select distinct on (coalesce(r.player, r.id::text)) r.id, r.nick, r.avatar, r.correct, r.attempted, r.finished_at
    from public.duel_runs r
    where r.ranked and not r.hidden and r.cat = p_cat and r.diff = p_diff
      and (p_period = 'all' or r.week = date_trunc('week', now() at time zone 'Europe/Riga')::date)
    order by coalesce(r.player, r.id::text), r.correct desc, r.attempted asc, r.finished_at asc
  )
  select row_number() over (order by b.correct desc, b.attempted asc, b.finished_at asc), b.id, b.nick, b.avatar, b.correct, b.attempted, b.finished_at
  from best b
  order by 1
  limit 20
$$;

create function public.duel_run_place(p_run bigint)
returns bigint language sql stable security definer set search_path = '' as $$
  select l.place from public.duel_runs r
  cross join lateral public.duel_leaderboard(r.cat, r.diff, 'week') l
  where r.id = p_run and l.id = p_run
$$;

revoke all on function public.duel_run_set_avatar(bigint, text), public.duel_ghost(text, text, int, int, bigint[]),
  public.duel_leaderboard(text, text, text), public.duel_run_place(bigint) from public, anon, authenticated;
grant execute on function public.duel_run_set_avatar(bigint, text), public.duel_run_place(bigint) to service_role;
grant execute on function public.duel_ghost(text, text, int, int, bigint[]), public.duel_leaderboard(text, text, text)
  to anon, authenticated, service_role;
