import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';

/* Всё в public/ уходит посетителю как есть. Однажды туда попал адрес
   администратора — подставленным в поле входа и как «известный админ»,
   которому админка открывалась без проверки роли. Данные это не открывало
   (изменения проверяет база), но адрес для подбора пароля лежал у всех
   на виду. Тест не пускает в код сайта реальные адреса почты. */
const dir = new URL('../public/', import.meta.url);
const files = readdirSync(dir).filter(name => /\.(js|html)$/.test(name) && name !== 'config.js');
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/g;
// Заведомо ненастоящие адреса — примеры в подсказках допустимы.
const allowed = address => /@(example\.(com|org|lv)|domain\.(com|lv))$/i.test(address);

describe('в коде сайта нет адресов почты', () => {
  it('ни в одном файле public/ нет настоящего email', () => {
    const found = [];
    for (const name of files) {
      const text = readFileSync(new URL(name, dir), 'utf8');
      for (const [address] of text.matchAll(EMAIL)) {
        if (!allowed(address)) found.push(`${name}: ${address}`);
      }
    }
    expect(found).toEqual([]);
  });

  it('проверка видит файлы сайта', () => {
    expect(files).toEqual(expect.arrayContaining(['admin.js', 'client.js', 'app.js']));
  });
});
