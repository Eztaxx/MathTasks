-- Миграция 006: Расширение диапазона классов до 12 (Skola2030) и добавление раздела «Статистика и вероятность»
-- Запускать в Supabase: SQL Editor -> New query -> Run

-- 1. Удаляем старые ограничения на класс в topics (как topics_grade_range, так и topics_grade_check)
alter table public.topics drop constraint if exists topics_grade_range;
alter table public.topics drop constraint if exists topics_grade_check;
alter table public.topics add constraint topics_grade_range check (grade is null or grade between 1 and 12);

-- 2. Удаляем старые ограничения на класс в tasks (как tasks_grade_range, так и tasks_grade_check)
alter table public.tasks drop constraint if exists tasks_grade_range;
alter table public.tasks drop constraint if exists tasks_grade_check;
alter table public.tasks add constraint tasks_grade_range check (grade is null or grade between 1 and 12);

-- 3. Добавляем или обновляем раздел «Статистика и вероятность»
insert into public.subjects (title, slug, icon, position)
values ('Статистика и вероятность', 'statistics', '📊', 3)
on conflict (slug) do update set
  title = excluded.title,
  icon = excluded.icon,
  position = excluded.position;
