import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/* «Удалить профиль» стирает и попытки дуэли этого устройства (миграция 035,
   решение владельца 21.11.2026). */
describe('удаление профиля вместе с дуэлями', () => {
  const sql = readFileSync(new URL('../supabase/migrations/035_delete_profile_duels.sql', import.meta.url), 'utf8');
  const code = sql.replace(/--.*$/gm, '');
  const profile = readFileSync(new URL('../public/profile.js', import.meta.url), 'utf8');

  it('старая версия без параметра удалена, новая — с номером игрока по умолчанию null', () => {
    expect(code).toMatch(/drop function if exists public\.delete_my_profile\(\);/);
    expect(code).toMatch(/delete_my_profile\(p_player text default null\)/);
  });

  it('стирает только вошедший владелец и только попытки с проверенным номером', () => {
    expect(code).toMatch(/if pid is null then return; end if;/);
    expect(code).toMatch(/p_player ~ '\^\[a-z0-9\]\{8,32\}\$'/);
    expect(code).toMatch(/delete from public\.duel_runs where player = p_player;/);
  });

  it('права: только вошедшим, анониму без входа — нет', () => {
    expect(code).toMatch(/revoke all on function public\.delete_my_profile\(text\) from public, anon;/);
    expect(code).toMatch(/grant execute on function public\.delete_my_profile\(text\) to authenticated;/);
  });

  it('клиент передаёт номер игрока и откатывается на старый вызов до миграции', () => {
    expect(profile).toContain("db.rpc('delete_my_profile', { p_player: player })");
    expect(profile).toMatch(/error\.code === 'PGRST202'\) \(\{ error \} = await db\.rpc\('delete_my_profile'\)\)/);
  });
});
