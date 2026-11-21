import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { expandTaskIndex } from '../public/lib.js';

/* Каталог одним запросом (миграция 034): функция catalog_index() отдаёт
   группы { t: тема, s: подтема, ids }, сайт разворачивает их в строки
   указателя. Порядок по id обязателен — по нему выбирается задача дня. */

describe('expandTaskIndex', () => {
  it('разворачивает группы в строки и сортирует по id', () => {
    const rows = expandTaskIndex([
      { t: 2, s: 20, ids: [5, 9] },
      { t: 1, s: null, ids: [3] },
      { t: 1, s: 11, ids: [1, 7] }
    ]);
    expect(rows.map(r => r.id)).toEqual([1, 3, 5, 7, 9]);
    expect(rows[0]).toEqual({ id: 1, topic_id: 1, subtopic_id: 11 });
    expect(rows[1]).toEqual({ id: 3, topic_id: 1, subtopic_id: null });
  });

  it('задача без темы остаётся в списке, как при постраничной выборке', () => {
    expect(expandTaskIndex([{ t: null, s: null, ids: [4] }])).toEqual([{ id: 4, topic_id: null, subtopic_id: null }]);
  });

  it('пустая база — пустой список', () => {
    expect(expandTaskIndex([])).toEqual([]);
  });

  it('кривой ответ — null, и каталог идёт старым путём', () => {
    for (const bad of [null, undefined, {}, 'x', [null], [{ t: 1 }], [{ t: 1, ids: 'x' }], [{ t: 1, ids: ['1'] }]]) {
      expect(expandTaskIndex(bad), JSON.stringify(bad)).toBeNull();
    }
  });
});

describe('миграция 034 и вызов из каталога', () => {
  const sql = readFileSync(new URL('../supabase/migrations/034_catalog_index.sql', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');

  it('функция читает с правами вызывающего и только опубликованное', () => {
    const code = sql.replace(/--.*$/gm, '');
    expect(code).toMatch(/security invoker/);
    expect(code).not.toMatch(/security definer/);
    expect(code).toMatch(/is_published = true/);
    expect(code).toMatch(/\bstable\b/);
    expect(code).toMatch(/grant execute on function public\.catalog_index\(\) to anon/);
  });

  it('каталог зовёт функцию через GET и сохраняет постраничный запасной путь', () => {
    expect(app).toContain("db.rpc('catalog_index', {}, { get: true })");
    expect(app).toMatch(/async function fetchTaskIndexRows[\s\S]*?pages\('id, topic_id, subtopic_id'\)/);
    // Старый lib.js из кэша без expandTaskIndex — сразу старый путь.
    expect(app).toMatch(/if \(expandTaskIndex\)/);
  });
});
