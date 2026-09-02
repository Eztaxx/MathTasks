-- Разделы как отдельная таблица: раньше «Алгебра/Геометрия» были зашиты
-- в check-ограничение, и добавить новый раздел можно было только правкой схемы.
-- Иерархия сайта: раздел -> тема (подкатегория) -> задача.
-- Запускать в Supabase: SQL Editor -> New query.

create table if not exists public.subjects (
  id bigint generated always as identity primary key,
  title text not null,
  slug text not null unique,
  icon text not null default 'x²',
  position int not null default 0,
  created_at timestamptz not null default now()
);

insert into public.subjects (title, slug, icon, position)
values ('Алгебра', 'algebra', 'x²', 1),
       ('Геометрия', 'geometry', '△', 2)
on conflict (slug) do nothing;

alter table public.topics add column if not exists subject_id bigint
  references public.subjects(id) on delete set null;
alter table public.topics add column if not exists position int not null default 0;

-- Переносим текстовый раздел в ссылку, затем убираем старую колонку,
-- чтобы не осталось двух источников правды.
update public.topics t
set subject_id = s.id
from public.subjects s
where t.subject_id is null and s.title = t.subject;

alter table public.topics drop column if exists subject;

create index if not exists topics_subject_id_idx on public.topics (subject_id);

alter table public.subjects enable row level security;

drop policy if exists "Everyone can read subjects" on public.subjects;
create policy "Everyone can read subjects" on public.subjects
  for select using (true);

drop policy if exists "Admins manage subjects" on public.subjects;
create policy "Admins manage subjects" on public.subjects
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
