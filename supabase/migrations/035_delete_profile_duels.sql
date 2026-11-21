-- Миграция 035: «Удалить профиль» стирает и результаты дуэлей.
--
-- До этого delete_my_profile() удаляла профиль, прогресс, устройства и коды,
-- а строки duel_runs (ник, зверь, ответы, время) оставались в таблице
-- лидеров. Решение владельца 21.11.2026: удалять вместе с профилем.
--
-- В базе дуэль не связана с профилем: у попытки есть только случайный номер
-- игрока (duel_runs.player), который живёт в браузере (math-tasks:duel-player).
-- Поэтому клиент передаёт номер этого устройства, а функция стирает его
-- попытки. Номер не выдаётся ни одной функцией чтения (duel_leaderboard,
-- duel_ghost отдают только id попытки), так что чужой номер не узнать; к тому
-- же стирать может только вошедший владелец профиля (pid не null).
-- Попытки с других устройств этого профиля по-прежнему удаляются через 60 дней
-- уборкой из 028, кроме лучших 20 в категории, — так и надо писать в политике
-- конфиденциальности (docs/privacy-draft.md).
--
-- ВНИМАНИЕ: 027 после 035 не перезапускать — она заново создаст версию без
-- параметра, вызов без аргументов станет неоднозначным (PGRST203).
--
-- Старый вызов без аргумента (rpc('delete_my_profile') из закэшированного
-- profile.js) работает: у параметра есть значение по умолчанию. Старую версию
-- без параметров удаляем, иначе вызов без аргументов был бы неоднозначным.
-- Запускать после 027 и 028.

drop function if exists public.delete_my_profile();

create or replace function public.delete_my_profile(p_player text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  pid uuid := public.my_profile_id();
begin
  if pid is null then return; end if;
  if p_player is not null and p_player ~ '^[a-z0-9]{8,32}$' then
    delete from public.duel_runs where player = p_player;
  end if;
  delete from public.student_profiles where id = pid;
end;
$$;

revoke all on function public.delete_my_profile(text) from public, anon;
grant execute on function public.delete_my_profile(text) to authenticated;

notify pgrst, 'reload schema';
