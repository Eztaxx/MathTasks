-- Миграция 027: анонимные профили учеников и перенос прогресса
--
-- Зачем. Весь прогресс ученика живёт в браузере: сменил телефон или
-- почистил браузер — решённое пропало. Профиль переносит прогресс между
-- устройствами без почты и пароля: у профиля есть только ник.
--
-- Как устроено. Вход — анонимный (Supabase Anonymous Sign-Ins): никаких
-- персональных данных. Прогресс привязан не к входу, а к профилю, а
-- устройства — участники профиля. Так второе устройство подключается
-- одноразовым кодом, а потерянный телефон заменяется кодом восстановления:
-- чужую анонимную сессию Supabase выдать не позволяет, а участника в
-- профиль добавить можно.
--
-- Дети. Ученикам 11–18 лет. Здесь нет имени, почты, телефона, даты
-- рождения. Коды хранятся только хешем. Профиль ученик удаляет сам.
-- Профили без активности дольше года стоит удалять (см. конец файла).
--
-- Перед запуском в панели Supabase: Authentication → Sign In / Providers →
-- «Allow anonymous sign-ins» — включить. Рекомендуется CAPTCHA (Turnstile)
-- для анонимного входа, иначе его можно заспамить.
--
-- Запускать в Supabase: SQL Editor → New query → Run (после 026).
-- Пока миграция не применена, сайт работает как раньше: интерфейс
-- профиля не показывается.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  nick text not null check (char_length(nick) between 2 and 24),
  recovery_hash text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.profile_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile_id uuid not null references public.student_profiles(id) on delete cascade,
  joined_at timestamptz not null default now()
);
create index if not exists idx_profile_members_profile on public.profile_members (profile_id);

-- Снимок прогресса: ключи math-tasks:* из браузера. 256 КБ хватает с запасом.
create table if not exists public.student_progress (
  profile_id uuid primary key references public.student_profiles(id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 262144),
  updated_at timestamptz not null default now()
);

-- Одноразовые коды для второго устройства: живут 10 минут.
create table if not exists public.profile_transfer_codes (
  code_hash text primary key,
  profile_id uuid not null references public.student_profiles(id) on delete cascade,
  expires_at timestamptz not null
);

alter table public.student_profiles enable row level security;
alter table public.profile_members enable row level security;
alter table public.student_progress enable row level security;
alter table public.profile_transfer_codes enable row level security;

-- Профиль текущего входа.
create or replace function public.my_profile_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select profile_id from public.profile_members where user_id = (select auth.uid())
$$;

drop policy if exists "Member reads own profile" on public.student_profiles;
create policy "Member reads own profile" on public.student_profiles
  for select to authenticated using (id = public.my_profile_id());

drop policy if exists "Member renames own profile" on public.student_profiles;
create policy "Member renames own profile" on public.student_profiles
  for update to authenticated using (id = public.my_profile_id()) with check (id = public.my_profile_id());

drop policy if exists "Member reads own membership" on public.profile_members;
create policy "Member reads own membership" on public.profile_members
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Member reads own progress" on public.student_progress;
create policy "Member reads own progress" on public.student_progress
  for select to authenticated using (profile_id = public.my_profile_id());

drop policy if exists "Member writes own progress" on public.student_progress;
create policy "Member writes own progress" on public.student_progress
  for insert to authenticated with check (profile_id = public.my_profile_id());

drop policy if exists "Member updates own progress" on public.student_progress;
create policy "Member updates own progress" on public.student_progress
  for update to authenticated using (profile_id = public.my_profile_id()) with check (profile_id = public.my_profile_id());

-- К кодам прямого доступа нет: только через функции ниже.

-- Код из безопасного алфавита: без O/0 и I/1, которые путают при переписывании.
create or replace function public.profile_random_code(p_length int)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text := '';
  bytes bytea := extensions.gen_random_bytes(p_length);
begin
  for i in 0 .. p_length - 1 loop
    result := result || substr(alphabet, 1 + (get_byte(bytes, i) % length(alphabet)), 1);
  end loop;
  return result;
end;
$$;

create or replace function public.profile_code_hash(p_code text)
returns text language sql immutable security definer set search_path = '' as $$
  select encode(extensions.digest(upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')), 'sha256'), 'hex')
$$;

-- Создать профиль для текущего входа (или вернуть уже существующий).
create or replace function public.ensure_profile(p_nick text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  pid uuid;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  select profile_id into pid from public.profile_members where user_id = uid;
  if pid is not null then return pid; end if;
  insert into public.student_profiles (nick) values (left(trim(p_nick), 24)) returning id into pid;
  insert into public.profile_members (user_id, profile_id) values (uid, pid);
  insert into public.student_progress (profile_id) values (pid);
  return pid;
end;
$$;

-- Код для второго устройства: 8 знаков, 10 минут, одноразовый.
create or replace function public.make_transfer_code()
returns text language plpgsql security definer set search_path = '' as $$
declare
  pid uuid := public.my_profile_id();
  code text;
begin
  if pid is null then raise exception 'no_profile'; end if;
  delete from public.profile_transfer_codes where expires_at < now() or profile_id = pid;
  code := public.profile_random_code(8);
  insert into public.profile_transfer_codes (code_hash, profile_id, expires_at)
    values (public.profile_code_hash(code), pid, now() + interval '10 minutes');
  return substr(code, 1, 4) || '-' || substr(code, 5, 4);
end;
$$;

-- Подключить это устройство к профилю по коду.
create or replace function public.join_by_code(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  hashed text := public.profile_code_hash(p_code);
  pid uuid;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  select profile_id into pid from public.profile_transfer_codes where code_hash = hashed and expires_at > now();
  if pid is null then raise exception 'code_invalid'; end if;
  delete from public.profile_transfer_codes where code_hash = hashed;
  insert into public.profile_members (user_id, profile_id) values (uid, pid)
    on conflict (user_id) do update set profile_id = excluded.profile_id, joined_at = now();
  return pid;
end;
$$;

-- Код восстановления: 12 знаков, показывается один раз, хранится хешем.
create or replace function public.set_recovery_code()
returns text language plpgsql security definer set search_path = '' as $$
declare
  pid uuid := public.my_profile_id();
  code text;
begin
  if pid is null then raise exception 'no_profile'; end if;
  code := public.profile_random_code(12);
  update public.student_profiles set recovery_hash = public.profile_code_hash(code) where id = pid;
  return substr(code, 1, 4) || '-' || substr(code, 5, 4) || '-' || substr(code, 9, 4);
end;
$$;

create or replace function public.recover_by_code(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  pid uuid;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  select id into pid from public.student_profiles where recovery_hash = public.profile_code_hash(p_code);
  if pid is null then raise exception 'code_invalid'; end if;
  insert into public.profile_members (user_id, profile_id) values (uid, pid)
    on conflict (user_id) do update set profile_id = excluded.profile_id, joined_at = now();
  return pid;
end;
$$;

-- Удалить профиль целиком: прогресс, устройства, коды.
create or replace function public.delete_my_profile()
returns void language plpgsql security definer set search_path = '' as $$
declare
  pid uuid := public.my_profile_id();
begin
  if pid is null then return; end if;
  delete from public.student_profiles where id = pid;
end;
$$;

-- Отметка активности: по ней чистятся заброшенные профили.
create or replace function public.touch_profile()
returns void language sql security definer set search_path = '' as $$
  update public.student_profiles set last_seen_at = now() where id = public.my_profile_id()
$$;

revoke all on function public.my_profile_id(), public.profile_random_code(int), public.profile_code_hash(text),
  public.ensure_profile(text), public.make_transfer_code(), public.join_by_code(text), public.set_recovery_code(),
  public.recover_by_code(text), public.delete_my_profile(), public.touch_profile() from public, anon;
grant execute on function public.my_profile_id(), public.ensure_profile(text), public.make_transfer_code(),
  public.join_by_code(text), public.set_recovery_code(), public.recover_by_code(text), public.delete_my_profile(),
  public.touch_profile() to authenticated;

grant select, update (nick) on public.student_profiles to authenticated;
grant select on public.profile_members to authenticated;
grant select, insert, update on public.student_progress to authenticated;

/* Уборка (по желанию, нужен pg_cron):
   select cron.schedule('student-profiles-cleanup', '0 3 * * 1', $$
     delete from public.student_profiles where last_seen_at < now() - interval '12 months';
     delete from public.student_profiles p where not exists (select 1 from public.profile_members m where m.profile_id = p.id)
       and p.created_at < now() - interval '7 days';
   $$);
   Анонимных пользователей без профиля Supabase советует чистить так же
   (auth.users, где is_anonymous и нет входа больше 30 дней). */
