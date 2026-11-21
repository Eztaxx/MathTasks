import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as lib from '../public/lib.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const SOURCE = read('public/progress-sync.js');

class MemoryStorage {
  constructor(entries = {}) { this.map = new Map(Object.entries(entries)); }
  get length() { return this.map.size; }
  key(i) { return [...this.map.keys()][i] ?? null; }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

/* База понарошку: строка student_progress и ответы save_progress по очереди.
   Ошибки — как их присылает PostgREST. */
function fakeDb({ row = { data: {}, version: 0 }, saves = [], columnMissing = false, rpcMissing = false } = {}) {
  const calls = { selects: [], saves: [], upserts: [] };
  const state = { row: { ...row } };
  const db = {
    from: () => ({
      select: columns => ({
        eq: () => ({
          maybeSingle: async () => {
            calls.selects.push(columns);
            if (columnMissing && columns.includes('version')) {
              return { data: null, error: { code: '42703', message: 'column student_progress.version does not exist' } };
            }
            return { data: { ...state.row }, error: null };
          }
        })
      }),
      upsert: async value => {
        calls.upserts.push(value);
        state.row = { data: value.data, version: state.row.version };
        return { error: null };
      }
    }),
    rpc: async (name, args) => {
      if (name !== 'save_progress') return { data: null, error: null };
      calls.saves.push(args);
      if (rpcMissing) return { data: null, error: { code: 'PGRST202', message: 'Could not find the function public.save_progress' } };
      const next = saves.length ? saves.shift() : state.row.version + 1;
      if (next !== null) state.row = { data: args.p_data, version: next };
      return { data: next, error: null };
    }
  };
  return { db, calls, state };
}

function loadSync(storage) {
  const sandbox = {
    localStorage: storage,
    document: { currentScript: null, visibilityState: 'visible', addEventListener() {}, removeEventListener() {} },
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init?.detail; } },
    dispatchEvent: () => true,
    addEventListener() {},
    removeEventListener() {},
    setInterval: () => 1,
    clearInterval() {},
    MathTasksLib: lib,
    console
  };
  sandbox.window = sandbox;
  vm.runInNewContext(SOURCE, sandbox);
  return sandbox.MathTasksSync;
}

const FAV = 'math-tasks:favorites';

describe('progress-sync.js', () => {
  it('supabase-js подгружается тем же адресом и хешем, что на главной', () => {
    const tag = read('index.html').match(/<script src="(https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/[^"]+)" integrity="([^"]+)"/);
    expect(tag).not.toBeNull();
    expect(SOURCE).toContain(`src: '${tag[1]}'`);
    expect(SOURCE).toContain(`integrity: '${tag[2]}'`);
  });

  it('пишет через save_progress с номером прочитанной версии', async () => {
    const storage = new MemoryStorage({ [FAV]: '[1,2]' });
    const { db, calls, state } = fakeDb({ row: { data: { [FAV]: [3] }, version: 4 } });
    const sync = loadSync(storage);
    sync.attach(db, 'p1');
    expect(await sync.sync()).toBe(true);
    expect(calls.saves).toHaveLength(1);
    expect(calls.saves[0].p_version).toBe(4);
    expect(state.row.data[FAV]).toEqual([1, 2, 3]);
    expect(JSON.parse(storage.getItem(FAV))).toEqual([1, 2, 3]);
  });

  it('при конфликте читает снимок заново и сливает ещё раз', async () => {
    const storage = new MemoryStorage({ [FAV]: '[1]' });
    // Первая запись опоздала: другое устройство успело записать.
    const { db, calls } = fakeDb({ row: { data: {}, version: 7 }, saves: [null, 8] });
    const sync = loadSync(storage);
    sync.attach(db, 'p1');
    expect(await sync.sync()).toBe(true);
    expect(calls.selects).toHaveLength(2);
    expect(calls.saves.map(save => save.p_version)).toEqual([7, 7]);
  });

  it('без миграции 032 пишет по-старому, через upsert', async () => {
    const storage = new MemoryStorage({ [FAV]: '[5]' });
    const { db, calls } = fakeDb({ columnMissing: true });
    const sync = loadSync(storage);
    sync.attach(db, 'p1');
    expect(await sync.sync()).toBe(true);
    expect(calls.selects).toEqual(['data,version', 'data']);
    expect(calls.saves).toHaveLength(0);
    expect(calls.upserts[0]).toMatchObject({ profile_id: 'p1', data: { [FAV]: [5] } });
  });

  it('если функции save_progress нет, переходит на upsert', async () => {
    const storage = new MemoryStorage({ [FAV]: '[5]' });
    const { db, calls } = fakeDb({ rpcMissing: true });
    const sync = loadSync(storage);
    sync.attach(db, 'p1');
    expect(await sync.sync()).toBe(true);
    expect(calls.upserts).toHaveLength(1);
  });

  it('убранное из избранного уходит на сервер в журнале', async () => {
    const storage = new MemoryStorage({ [FAV]: '[1,2]' });
    const { db, state } = fakeDb({ row: { data: { [FAV]: [1, 2] }, version: 1 } });
    const sync = loadSync(storage);
    sync.attach(db, 'p1');
    await sync.sync();
    // Между синхронизациями ученик убрал задачу 2.
    storage.setItem(FAV, '[1]');
    await sync.sync();
    expect(state.row.data[FAV]).toEqual([1]);
    expect(state.row.data['math-tasks:favorites-changes'][2]).toBeLessThan(0);
  });

  it('без профиля ничего не делает', async () => {
    const sync = loadSync(new MemoryStorage());
    expect(await sync.sync()).toBe(false);
  });
});
