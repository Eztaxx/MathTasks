-- Run this file once in Supabase: SQL Editor -> New query.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'visitor' check (role in ('admin', 'visitor')),
  created_at timestamptz not null default now()
);

create table public.subjects (
  id bigint generated always as identity primary key,
  title text not null,
  slug text not null unique,
  icon text not null default 'x²',
  position int not null default 0,
  created_at timestamptz not null default now()
);

insert into public.subjects (title, slug, icon, position)
values ('Алгебра', 'algebra', 'x²', 1), ('Геометрия', 'geometry', '△', 2);

create table public.topics (
  id bigint generated always as identity primary key,
  title text not null,
  slug text not null unique,
  subject_id bigint references public.subjects(id) on delete set null,
  grade smallint check (grade is null or grade between 1 and 11),
  position int not null default 0,
  description text,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id bigint generated always as identity primary key,
  topic_id bigint references public.topics(id) on delete set null,
  title text not null,
  grade smallint check (grade is null or grade between 1 and 11),
  condition_latex text not null,
  answer_latex text,
  solution_latex text,
  condition_image text,
  solution_image text,
  difficulty text not null default 'Средний' check (difficulty in ('Лёгкий', 'Средний', 'Сложный')),
  position int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles (id) values (new.id); return new; end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

alter table public.subjects enable row level security;
alter table public.profiles enable row level security;
alter table public.topics enable row level security;
alter table public.tasks enable row level security;

create policy "Everyone can read published tasks" on public.tasks for select using (is_published = true or (select public.is_admin()));
create policy "Everyone can read topics" on public.topics for select using (true);
create policy "Everyone can read subjects" on public.subjects for select using (true);
create policy "Admins manage subjects" on public.subjects for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage tasks" on public.tasks for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage topics" on public.topics for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Users can view own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);

-- Хранилище чертежей настраивается отдельно: supabase/migrations/005_storage.sql

-- После регистрации назначьте администратора, заменив email на свой.
-- Роль хранится только здесь: в auth.users колонки роли нет, приложение читает profiles.
-- insert into public.profiles (id, role)
-- select id, 'admin' from auth.users where email = 'YOUR_EMAIL@example.com'
-- on conflict (id) do update set role = 'admin';
-- Диагностика связки пользователь ↔ профиль: supabase/check_admin.sql
