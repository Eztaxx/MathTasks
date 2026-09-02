-- Классы (1–11). Запустите один раз в Supabase: SQL Editor -> New query.
-- Тема относится к классу, в котором её проходят; у задачи класс свой,
-- чтобы внутри темы можно было держать задания для разных параллелей.
alter table public.topics add column if not exists grade smallint
  constraint topics_grade_range check (grade is null or grade between 1 and 11);
alter table public.tasks add column if not exists grade smallint
  constraint tasks_grade_range check (grade is null or grade between 1 and 11);

create index if not exists topics_grade_idx on public.topics (grade);
create index if not exists tasks_grade_idx on public.tasks (grade);
