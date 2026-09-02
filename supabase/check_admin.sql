-- Проверка и назначение администратора.
-- Роль живёт только в public.profiles: в auth.users своей колонки роли нет и не должно быть.
-- Запускать в Supabase: SQL Editor -> New query.

-- 1. Диагностика: у кого есть профиль и какая у него роль.
--    profile_id = null означает, что строка в profiles не привязана к пользователю.
select
  u.id    as auth_user_id,
  u.email,
  u.email_confirmed_at,
  p.id    as profile_id,
  p.role
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at;

-- 2. Осиротевшие профили: строки в profiles, которым не соответствует ни один пользователь.
--    Обычно это означает, что строку добавили руками со случайным UUID.
select p.*
from public.profiles p
left join auth.users u on u.id = p.id
where u.id is null;

-- 3. Назначение администратора. Работает и когда профиля ещё нет, и когда роль неверная.
--    Замените email на свой.
insert into public.profiles (id, role)
select id, 'admin' from auth.users where email = 'YOUR_EMAIL@example.com'
on conflict (id) do update set role = 'admin';
