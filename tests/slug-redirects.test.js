import { describe, expect, it } from 'vitest';
import redirects from '../public/data/slug-redirects.json';

/* Файл соответствий старых слагов новым читают воркер (301) и приложение (запасной путь).
   Ошибка в нём — битые ссылки, поэтому целостность проверяется отдельно. */
describe('public/data/slug-redirects.json', () => {
  const tables = ['topic', 'subtopic'];

  it('есть обе таблицы и они не пустые', () => {
    for (const name of tables) expect(Object.keys(redirects[name] || {}).length).toBeGreaterThan(0);
  });

  it('новые слаги: латиница, цифры и дефисы, без русской транслитерации и меток времени', () => {
    for (const name of tables) {
      for (const [from, to] of Object.entries(redirects[name])) {
        expect(to, `${from} -> ${to}`).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        expect(to, `${from} -> ${to}`).not.toMatch(/-\d{10,}/);
        expect(to, `${from} -> ${to}`).not.toBe(from);
      }
    }
  });

  it('новые слаги уникальны и не совпадают со старыми (цепочек редиректов нет)', () => {
    for (const name of tables) {
      const olds = new Set(Object.keys(redirects[name]));
      const news = Object.values(redirects[name]);
      expect(new Set(news).size).toBe(news.length);
      for (const to of news) expect(olds.has(to), to).toBe(false);
    }
  });

  it('у тем 1–9 классов слаг начинается с skola2030-g<класс>-<номер>-', () => {
    for (const to of Object.values(redirects.topic)) expect(to).toMatch(/^skola2030-g[1-9]-\d+-/);
  });
});
