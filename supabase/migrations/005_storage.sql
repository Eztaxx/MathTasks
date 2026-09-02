-- Хранилище чертежей. Держим настройку в миграции, а не в кликах по дашборду:
-- иначе при переезде на новый проект её никто не воспроизведёт.
-- Запускать в Supabase: SQL Editor -> New query.

insert into storage.buckets (id, name, public)
values ('task-images', 'task-images', true)
on conflict (id) do nothing;

-- Читают все — картинки идут в открытую часть сайта вместе с условиями.
drop policy if exists "Public read task images" on storage.objects;
create policy "Public read task images" on storage.objects
  for select using (bucket_id = 'task-images');

-- Пишет, заменяет и удаляет только администратор — та же функция,
-- что защищает задачи и темы в schema.sql.
drop policy if exists "Admins upload task images" on storage.objects;
create policy "Admins upload task images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'task-images' and (select public.is_admin()));

drop policy if exists "Admins update task images" on storage.objects;
create policy "Admins update task images" on storage.objects
  for update to authenticated
  using (bucket_id = 'task-images' and (select public.is_admin()))
  with check (bucket_id = 'task-images' and (select public.is_admin()));

drop policy if exists "Admins delete task images" on storage.objects;
create policy "Admins delete task images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'task-images' and (select public.is_admin()));
