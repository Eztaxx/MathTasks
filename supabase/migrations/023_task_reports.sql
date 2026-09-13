-- Миграция 023: сообщения об ошибках в задачах
-- Посетитель сайта отмечает ошибку в задаче кнопкой «Нашли ошибку?», а
-- администратор видит список в админке и закрывает сообщение, когда
-- исправит задачу. Задачи во многом составлены нейросетью, и ошибки в
-- них раньше всех находят ученики.
-- Запускать в Supabase: SQL Editor -> New query -> Run

create table if not exists public.task_reports (
  id bigint generated always as identity primary key,
  task_id bigint not null references public.tasks(id) on delete cascade,
  kind text not null default 'other'
    check (kind in ('condition', 'answer', 'solution', 'figure', 'translation', 'other')),
  message text not null default '' check (char_length(message) <= 1000),
  lang text check (lang in ('ru', 'lv')),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_task_reports_open on public.task_reports (resolved, created_at desc);
create index if not exists idx_task_reports_task on public.task_reports (task_id);

alter table public.task_reports enable row level security;

-- Писать может любой посетитель, но только открытое сообщение и только к
-- опубликованной задаче: закрыть чужое сообщение или привязать его к
-- черновику нельзя. Читать сообщения посетитель не может — даже свои.
drop policy if exists "Anyone can report a published task" on public.task_reports;
create policy "Anyone can report a published task" on public.task_reports
  for insert to anon, authenticated
  with check (
    resolved = false
    and exists (select 1 from public.tasks t where t.id = task_id and t.is_published)
  );

-- Читать, закрывать и удалять — только администратор.
drop policy if exists "Admins manage reports" on public.task_reports;
create policy "Admins manage reports" on public.task_reports
  for all using (public.is_admin()) with check (public.is_admin());

grant insert on public.task_reports to anon, authenticated;
grant select, update, delete on public.task_reports to authenticated;
