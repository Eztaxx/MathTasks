-- Миграция 026: контрольная по нескольким темам и задания только для работы
-- Продолжение 025. Две вещи:
--   1. Работа может охватывать несколько тем сразу, а не одну.
--   2. Задание, составленное для работы, остаётся черновиком — в каталоге,
--      поиске и списке темы его нет, — но внутри опубликованной работы
--      ученик обязан его видеть, иначе работать будет не с чем.
-- Запускать в Supabase: SQL Editor -> New query -> Run (после 025).

create table if not exists public.exam_paper_topics (
  paper_id bigint not null references public.exam_papers(id) on delete cascade,
  topic_id bigint not null references public.topics(id) on delete cascade,
  primary key (paper_id, topic_id)
);

create index if not exists idx_exam_paper_topics_topic on public.exam_paper_topics (topic_id);

-- Темы теперь в отдельной таблице, поэтому одиночная привязка перестаёт
-- быть обязательной: у работы по нескольким темам её просто нет.
alter table public.exam_papers drop constraint if exists exam_papers_target;
alter table public.exam_papers add constraint exam_papers_target check (
  (kind = 'exam' and level is not null) or kind = 'cw'
);

alter table public.exam_paper_topics enable row level security;

drop policy if exists "Anyone reads topics of published papers" on public.exam_paper_topics;
create policy "Anyone reads topics of published papers" on public.exam_paper_topics
  for select to anon, authenticated using (
    exists (select 1 from public.exam_papers p where p.id = paper_id and p.is_published)
  );

drop policy if exists "Admins manage paper topics" on public.exam_paper_topics;
create policy "Admins manage paper topics" on public.exam_paper_topics
  for all using (public.is_admin()) with check (public.is_admin());

/* Задание, созданное для работы, публиковать незачем: в каталоге оно
   только выдало бы контрольную заранее. Это правило открывает такому
   черновику ровно одну дверь — внутрь опубликованной работы. Остальные
   черновики остаются закрытыми: правило добавляется к существующим, а не
   заменяет их. */
drop policy if exists "Anyone reads tasks inside published papers" on public.tasks;
create policy "Anyone reads tasks inside published papers" on public.tasks
  for select to anon, authenticated using (
    exists (
      select 1
      from public.exam_paper_items item
      join public.exam_papers paper on paper.id = item.paper_id
      where item.task_id = tasks.id and paper.is_published
    )
  );

grant select on public.exam_paper_topics to anon, authenticated;
grant insert, update, delete on public.exam_paper_topics to authenticated;
