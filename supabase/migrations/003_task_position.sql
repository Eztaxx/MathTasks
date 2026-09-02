-- Порядок задач внутри темы. Раньше задачи шли только по дате добавления,
-- поэтому вставить задачу в середину разбора темы было нельзя.
-- Запускать в Supabase: SQL Editor -> New query.

alter table public.tasks add column if not exists position int not null default 0;

create index if not exists tasks_topic_position_idx on public.tasks (topic_id, position);
