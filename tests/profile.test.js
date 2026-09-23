import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import lib from '../public/lib.js';

const { mergeProgress, collectProgress, applyProgress, isProgressKey, progressSignature } = lib;

// Хранилище в памяти с тем же интерфейсом, что у localStorage.
const memoryStorage = (initial = {}) => {
  const map = new Map(Object.entries(initial));
  return {
    get length() { return map.size; },
    key: i => [...map.keys()][i] ?? null,
    getItem: key => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)); },
    dump: () => Object.fromEntries(map)
  };
};

/* Профиль сливает прогресс двух устройств. Ошибка здесь стирает то, что
   ребёнок решал неделями, — поэтому каждое правило проверено отдельно. */
describe('профиль: какие ключи — прогресс', () => {
  it('решённое, журнал, уроки и рекорды тренажёра — да', () => {
    for (const key of ['math-tasks:solved', 'math-tasks:journal', 'math-tasks:lessons', 'math-tasks:trainer-record:addsub2:normal:basic:sprint']) {
      expect(isProgressKey(key), key).toBe(true);
    }
  });

  it('тема, язык, идущий экзамен и блокировка контрольной — нет', () => {
    for (const key of ['math-tasks:theme', 'math-tasks:lang', 'math-tasks:exam-session', 'math-tasks:cw-lock', 'math-tasks:daily', 'math-tasks:duel-nick']) {
      expect(isProgressKey(key), key).toBe(false);
    }
  });

  it('снимок и обратная запись не трогают чужие ключи', () => {
    const storage = memoryStorage({ 'math-tasks:solved': '[1,2]', 'math-tasks:theme': '"dark"', 'sb-x-auth-token': '{}' });
    const data = collectProgress(storage);
    expect(data).toEqual({ 'math-tasks:solved': [1, 2] });
    applyProgress(storage, { 'math-tasks:solved': [1, 2, 3], 'math-tasks:theme': 'light' });
    expect(storage.dump()['math-tasks:solved']).toBe('[1,2,3]');
    expect(storage.dump()['math-tasks:theme']).toBe('"dark"');
  });
});

describe('профиль: слияние двух устройств', () => {
  it('решённое и избранное складываются без повторов', () => {
    const merged = mergeProgress({ 'math-tasks:solved': [1, 2, 3] }, { 'math-tasks:solved': [3, 4] });
    expect(merged['math-tasks:solved']).toEqual([1, 2, 3, 4]);
  });

  it('счётчики дней и ошибок — по максимуму', () => {
    const merged = mergeProgress(
      { 'math-tasks:activity': { '2026-09-20': 3 }, 'math-tasks:wrong-attempts': { 5: 1 } },
      { 'math-tasks:activity': { '2026-09-20': 5, '2026-09-21': 2 }, 'math-tasks:wrong-attempts': { 5: 2, 6: 1 } }
    );
    expect(merged['math-tasks:activity']).toEqual({ '2026-09-20': 5, '2026-09-21': 2 });
    expect(merged['math-tasks:wrong-attempts']).toEqual({ 5: 2, 6: 1 });
  });

  it('журнал объединяется по записям и идёт по времени', () => {
    const a = { id: 1, at: 100, outcome: 'correct' };
    const b = { id: 2, at: 50, outcome: 'wrong' };
    const c = { id: 1, at: 200, outcome: 'hint' };
    const merged = mergeProgress({ 'math-tasks:journal': [a, c] }, { 'math-tasks:journal': [b, a] });
    expect(merged['math-tasks:journal']).toEqual([b, a, c]);
  });

  it('журнал не растёт больше трёхсот записей', () => {
    const many = Array.from({ length: 250 }, (_, i) => ({ id: i, at: i }));
    const more = Array.from({ length: 250 }, (_, i) => ({ id: 1000 + i, at: 1000 + i }));
    expect(mergeProgress({ 'math-tasks:journal': many }, { 'math-tasks:journal': more })['math-tasks:journal']).toHaveLength(300);
  });

  it('«где остановился» — самое свежее', () => {
    const merged = mergeProgress(
      { 'math-tasks:last-place': { topicId: 1, at: 10 } },
      { 'math-tasks:last-place': { topicId: 2, at: 20 } }
    );
    expect(merged['math-tasks:last-place'].topicId).toBe(2);
  });

  it('урок: шаг — дальний, пройден — если пройден где-то', () => {
    const merged = mergeProgress(
      { 'math-tasks:lessons': { l: { step: 3, done: false, at: 5 } } },
      { 'math-tasks:lessons': { l: { step: 2, done: true, at: 9 }, m: { step: 1 } } }
    );
    expect(merged['math-tasks:lessons']).toEqual({ l: { step: 3, done: true, at: 9 }, m: { step: 1 } });
  });

  it('рекорд тренажёра — лучший из двух', () => {
    const key = 'math-tasks:trainer-record:multdiv:normal:basic:sprint';
    expect(mergeProgress({ [key]: 18 }, { [key]: 25 })[key]).toBe(25);
  });

  it('ключ только с одной стороны переносится как есть', () => {
    const merged = mergeProgress({}, { 'math-tasks:favorites': [7] });
    expect(merged['math-tasks:favorites']).toEqual([7]);
  });

  it('чужие ключи с сервера не пишутся', () => {
    expect(mergeProgress({}, { 'math-tasks:theme': 'dark', 'evil': 1 })).toEqual({});
  });

  it('слияние не зависит от порядка там, где порядок не важен', () => {
    const x = { 'math-tasks:activity': { d1: 2 }, 'math-tasks:solved': [1] };
    const y = { 'math-tasks:activity': { d1: 4 }, 'math-tasks:solved': [2] };
    expect(mergeProgress(x, y)['math-tasks:activity']).toEqual(mergeProgress(y, x)['math-tasks:activity']);
  });

  it('подпись снимка не зависит от порядка ключей', () => {
    expect(progressSignature({ a: 1, b: 2 })).toBe(progressSignature({ b: 2, a: 1 }));
    expect(progressSignature({ a: 1 })).not.toBe(progressSignature({ a: 2 }));
  });
});

/* Миграция 027 применяется руками в Supabase. Здесь проверяется то, что
   легко сломать при правке: персональных данных в таблицах нет, у каждой
   таблицы включён RLS, функции закрыты от search_path. */
describe('миграция профилей', () => {
  const sql = readFileSync(new URL('../supabase/migrations/027_student_profiles.sql', import.meta.url), 'utf8');

  it('ни почты, ни имени, ни телефона', () => {
    const tables = sql.match(/create table[\s\S]*?\);/gi).join('\n').toLowerCase();
    for (const word of ['email', 'phone', 'first_name', 'last_name', 'birth']) expect(tables).not.toContain(word);
  });

  it('RLS включён у каждой таблицы', () => {
    for (const table of ['student_profiles', 'profile_members', 'student_progress', 'profile_transfer_codes']) {
      expect(sql, table).toMatch(new RegExp(`alter table public\\.${table} enable row level security`));
    }
  });

  it('функции security definer — с пустым search_path', () => {
    const definers = sql.match(/security definer[^\n]*/gi) || [];
    expect(definers.length).toBeGreaterThan(0);
    for (const line of definers) expect(line).toMatch(/set search_path = ''/);
  });

  it('коды хранятся только хешем', () => {
    expect(sql).not.toMatch(/code text not null/);
    expect(sql).toMatch(/code_hash/);
    expect(sql).toMatch(/recovery_hash/);
  });
});
