import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAll, PAGE } from '../scripts/lib/fetch-all.mjs';

/* Поддельный PostgREST: отдаёт строки по заголовку Range, как настоящий,
   и запоминает запросы. */
const fakeTable = (total, { failAt } = {}) => {
  const calls = [];
  vi.stubGlobal('fetch', vi.fn(async (url, { headers }) => {
    calls.push({ url, range: headers.Range });
    const [from, to] = headers.Range.split('-').map(Number);
    if (from === failAt) return new Response('boom', { status: 500 });
    const rows = [];
    for (let i = from; i <= Math.min(to, total - 1); i++) rows.push({ id: i + 1 });
    return new Response(JSON.stringify(rows), { status: 200 });
  }));
  return calls;
};

afterEach(() => vi.unstubAllGlobals());

describe('чтение таблицы Supabase целиком', () => {
  it('читает все страницы, а не первую тысячу', async () => {
    const calls = fakeTable(2420);
    const rows = await fetchAll('https://x/rest/v1/task_tags?select=*&order=task_id,tag_id', {});
    expect(rows).toHaveLength(2420);
    expect(new Set(rows.map(r => r.id)).size).toBe(2420);
    expect(calls.map(c => c.range)).toEqual([`0-${PAGE - 1}`, `${PAGE}-${2 * PAGE - 1}`, `${2 * PAGE}-${3 * PAGE - 1}`]);
  });

  it('ровно тысяча строк — дочитывает пустую страницу и останавливается', async () => {
    const calls = fakeTable(PAGE);
    expect(await fetchAll('https://x/rest/v1/tasks?select=id&order=id', {})).toHaveLength(PAGE);
    expect(calls).toHaveLength(2);
  });

  it('без order= не читает: страницы без порядка теряют и повторяют строки', async () => {
    const calls = fakeTable(10);
    await expect(fetchAll('https://x/rest/v1/tasks?select=id', {})).rejects.toThrow(/order=/);
    expect(calls).toHaveLength(0);
  });

  it('ошибка на второй странице — отказ, а не половина таблицы', async () => {
    fakeTable(1500, { failAt: PAGE });
    await expect(fetchAll('https://x/rest/v1/tasks?select=id&order=id', {})).rejects.toThrow(/500/);
  });
});
