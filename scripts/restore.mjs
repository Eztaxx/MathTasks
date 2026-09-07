#!/usr/bin/env node
/*
 * Восстановление каталога из резервной копии.
 *
 * По умолчанию — вхолостую: показывает, что изменится, и ничего не пишет.
 * Запись только с --apply.
 *
 * Запуск:
 *   node scripts/restore.mjs <файл>                    вхолостую
 *   node scripts/restore.mjs <файл> --apply            записать
 *   node scripts/restore.mjs <файл> --only tasks       одну таблицу
 *   node scripts/restore.mjs <файл> --only storage     только чертежи
 *
 * Что делает: дописывает недостающие строки и приводит существующие к
 * тому, что в копии. Строк, которых в копии нет, НЕ удаляет — иначе
 * восстановление одной потерянной темы снесло бы всё, что добавлено
 * после снятия копии. Удаление лишнего — отдельное решение и делается
 * руками.
 */

import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const argv = process.argv.slice(2);
const file = argv.find(a => !a.startsWith('--'));
const APPLY = argv.includes('--apply');
const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;

if (!file) { console.error('Укажите файл копии. Список: docs/backup/snapshots/'); process.exit(1); }

const env = Object.fromEntries(
  readFileSync(ROOT + '.env', 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);
const URL_ = env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error('Нужен SUPABASE_SERVICE_ROLE_KEY: запись через публичный ключ запрещена политиками.'); process.exit(1); }

const dump = JSON.parse(readFileSync(file, 'utf8'));
const project = URL_.replace(/^https?:\/\//, '').split('.')[0];
if (dump.project !== project) {
  console.error(`✗ Копия снята с базы «${dump.project}», а .env указывает на «${project}». Восстановление отменено.`);
  process.exit(1);
}

console.log(`Копия от ${dump.takenAt}`);
console.log(APPLY ? 'РЕЖИМ ЗАПИСИ\n' : 'вхолостую, ничего не записывается\n');

const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const ORDER = ['subjects', 'topics', 'tasks', 'tags', 'task_tags'];

/* Сравниваем только те поля, что есть в копии: колонки могли добавиться
   миграциями после её снятия, и затирать их пустотой нельзя. */
const differs = (fresh, saved) =>
  Object.keys(saved).some(k => JSON.stringify(fresh?.[k]) !== JSON.stringify(saved[k]));

let totalNew = 0, totalChanged = 0;

for (const table of ORDER) {
  if (only && table !== only) continue;
  const saved = dump.tables[table];
  if (!saved?.length) continue;

  const r = await fetch(`${URL_}/rest/v1/${table}?select=*`, { headers: H });
  if (!r.ok) { console.log(`✗ ${table}: ${r.status}`); continue; }
  const current = await r.json();

  /* У связки task_tags своего идентификатора нет — сравниваем по паре. */
  const idOf = row => table === 'task_tags' ? `${row.task_id}:${row.tag_id}` : String(row.id);
  const now = new Map(current.map(x => [idOf(x), x]));

  const toInsert = [], toUpdate = [];
  for (const row of saved) {
    const fresh = now.get(idOf(row));
    if (!fresh) toInsert.push(row);
    else if (differs(fresh, row)) toUpdate.push(row);
  }
  const extra = current.length - (saved.length - toInsert.length);

  console.log(`${table.padEnd(10)} в базе ${String(current.length).padStart(4)} · в копии ${String(saved.length).padStart(4)} · вернуть ${toInsert.length} · поправить ${toUpdate.length}${extra > 0 ? ` · новее копии ${extra} (не трогаем)` : ''}`);
  totalNew += toInsert.length; totalChanged += toUpdate.length;

  if (!APPLY) continue;

  /* Пишем пачками: по строке на запрос — это тысяча запросов на каталог. */
  for (let i = 0; i < toInsert.length; i += 50) {
    const chunk = toInsert.slice(i, i + 50);
    const res = await fetch(`${URL_}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...H, 'Content-Type': 'application/json; charset=utf-8', Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(chunk)
    });
    if (!res.ok) {
      const text = await res.text();
      if (text.includes('428C9')) {
        console.log(`   ✗ вставка ${table}: база не разрешает вернуть строку с прежним номером.`);
        console.log(`      Выполните supabase/migrations/019_identity_by_default.sql — без неё`);
        console.log(`      удалённая строка восстановится под новым номером, и ссылки на неё`);
        console.log(`      (кросс-теги, адреса /task/<id>, закладки посетителей) не сойдутся.`);
      } else {
        console.log(`   ✗ вставка ${table}: ${res.status} ${text.slice(0, 120)}`);
      }
    }
  }
  for (const row of toUpdate) {
    const filter = table === 'task_tags'
      ? `task_id=eq.${row.task_id}&tag_id=eq.${row.tag_id}`
      : `id=eq.${row.id}`;
    /* Номер и служебные отметки времени в теле слать нельзя: id объявлен
       GENERATED ALWAYS, и весь запрос отвергается с кодом 428C9. */
    const { id, created_at, updated_at, ...fields } = row;
    const res = await fetch(`${URL_}/rest/v1/${table}?${filter}`, {
      method: 'PATCH',
      headers: { ...H, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(fields)
    });
    if (!res.ok) console.log(`   ✗ правка ${table} ${idOf(row)}: ${res.status} ${(await res.text()).slice(0, 120)}`);
  }
  console.log(`   записано`);
}

/* ── Чертежи ──────────────────────────────────────────────────────── */
/* Копии Supabase файлы Storage не включают вовсе, так что это
   единственный способ вернуть пропавший чертёж. */
if (!only || only === 'storage') {
  const files = dump.storage?.files || [];
  if (files.length) {
    const byBucket = {};
    for (const f of files) (byBucket[f.bucket] ||= []).push(f);

    for (const [bucket, list] of Object.entries(byBucket)) {
      /* Что уже лежит в бакете — узнаём запросом, а не гадаем. */
      const present = new Set();
      for (const prefix of [...new Set(list.map(f => f.path.includes('/') ? f.path.split('/')[0] : ''))]) {
        const r = await fetch(`${URL_}/storage/v1/object/list/${bucket}`, {
          method: 'POST',
          headers: { ...H, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefix, limit: 1000 })
        });
        if (!r.ok) continue;
        for (const e of await r.json()) if (e.metadata) present.add(prefix ? `${prefix}/${e.name}` : e.name);
      }

      const missing = list.filter(f => !present.has(f.path));
      console.log(`${('файлы ' + bucket).padEnd(10)} в бакете ${String(present.size).padStart(4)} · в копии ${String(list.length).padStart(4)} · вернуть ${missing.length}`);
      totalNew += missing.length;

      if (!APPLY || !missing.length) continue;
      for (const f of missing) {
        const body = Buffer.from(f.base64, 'base64');
        const res = await fetch(`${URL_}/storage/v1/object/${bucket}/${f.path}`, {
          method: 'POST',
          headers: { ...H, 'Content-Type': f.type || 'application/octet-stream' },
          body
        });
        if (!res.ok) console.log(`   ✗ ${f.path}: ${res.status} ${(await res.text()).slice(0, 100)}`);
      }
      console.log('   записано');
    }
  }
}

console.log(`\nИтого: вернуть ${totalNew}, поправить ${totalChanged}`);
if (!APPLY && (totalNew || totalChanged)) console.log('Повторите с --apply, чтобы записать.');
if (!totalNew && !totalChanged) console.log('База совпадает с копией — делать нечего.');
