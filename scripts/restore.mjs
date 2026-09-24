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
import { fetchAll, PAGE } from './lib/fetch-all.mjs';

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
// Подтемы — между темами и задачами: на них ссылается tasks.subtopic_id.
// Варианты работ и сообщения об ошибках — после задач: они ссылаются на
// задачи и темы, а вариант должен появиться раньше своих тем и пунктов.
const ORDER = ['subjects', 'topics', 'subtopics', 'tasks', 'tags', 'task_tags',
  'exam_papers', 'exam_paper_topics', 'exam_paper_items', 'task_reports'];

/* Первичный ключ таблицы: по нему читаем страницами в однозначном
   порядке, сверяем строки с копией и правим их. У связок своего id нет —
   ключ из пары колонок. */
const KEYS = { task_tags: ['task_id', 'tag_id'], exam_paper_topics: ['paper_id', 'topic_id'] };
const keyOf = table => KEYS[table] || ['id'];

/* Сравниваем только те поля, что есть в копии: колонки могли добавиться
   миграциями после её снятия, и затирать их пустотой нельзя. */
const differs = (fresh, saved) =>
  Object.keys(saved).some(k => JSON.stringify(fresh?.[k]) !== JSON.stringify(saved[k]));

let totalNew = 0, totalChanged = 0;

for (const table of ORDER) {
  if (only && table !== only) continue;
  const saved = dump.tables[table];
  if (!saved?.length) continue;

  const key = keyOf(table);
  /* Одним запросом task_tags (1420 строк) читалась как 1000: прогон
     вхолостую звал «вернуть» 420 связок, которые в базе есть, а --apply
     слал бы их заново. Отсюда чтение страницами — см. lib/fetch-all.mjs. */
  let current;
  try {
    current = await fetchAll(`${URL_}/rest/v1/${table}?select=*&order=${key.join(',')}`, H);
  } catch (e) {
    console.log(`✗ ${table}: ${e.message.replace(/^.*? → /, '')}`);
    continue;
  }

  const idOf = row => key.map(k => row[k]).join(':');
  const now = new Map(current.map(x => [idOf(x), x]));

  const toInsert = [], toUpdate = [];
  for (const row of saved) {
    const fresh = now.get(idOf(row));
    if (!fresh) toInsert.push(row);
    else if (differs(fresh, row)) toUpdate.push(row);
  }
  const extra = current.length - (saved.length - toInsert.length);

  console.log(`${table.padEnd(17)} в базе ${String(current.length).padStart(4)} · в копии ${String(saved.length).padStart(4)} · вернуть ${toInsert.length} · поправить ${toUpdate.length}${extra > 0 ? ` · новее копии ${extra} (не трогаем)` : ''}`);
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
      /* Миграция 019 перевела на BY DEFAULT только subjects, topics, tasks
         и tags, у task_reports (023) это делает 029, а таблица, заведённая
         позже, может снова оказаться GENERATED ALWAYS. Поэтому подсказка
         называет таблицу, а не отсылает к одной миграции. */
      if (text.includes('428C9')) {
        console.log(`   ✗ вставка ${table}: база не разрешает вернуть строку с прежним номером.`);
        console.log(`      Выполните в SQL Editor Supabase:`);
        console.log(`        alter table public.${table} alter column id set generated by default;`);
        console.log(`      Без этого удалённая строка восстановится только под новым номером,`);
        console.log(`      и ссылки на неё (кросс-теги, адреса /task/<id>, закладки) не сойдутся.`);
      } else {
        console.log(`   ✗ вставка ${table}: ${res.status} ${text.slice(0, 120)}`);
      }
    }
  }
  for (const row of toUpdate) {
    const filter = key.map(k => `${k}=eq.${row[k]}`).join('&');
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
      /* Что уже лежит в бакете — узнаём запросом, а не гадаем. Список
         читаем страницами, как и таблицы: одним запросом с limit 1000
         папка побольше читалась бы с обрывом, и лежащие в ней файлы
         числились бы пропавшими. По той же причине папку, которую не
         удалось прочитать, не пропускаем молча, а бросаем весь бакет. */
      const present = new Set();
      let unread = null;
      for (const prefix of [...new Set(list.map(f => f.path.includes('/') ? f.path.split('/')[0] : ''))]) {
        for (let offset = 0; !unread; offset += PAGE) {
          const r = await fetch(`${URL_}/storage/v1/object/list/${bucket}`, {
            method: 'POST',
            headers: { ...H, 'Content-Type': 'application/json' },
            body: JSON.stringify({ prefix, limit: PAGE, offset, sortBy: { column: 'name', order: 'asc' } })
          });
          if (!r.ok) { unread = `${r.status} ${(await r.text()).slice(0, 100)}`; break; }
          const page = await r.json();
          for (const e of page) if (e.metadata) present.add(prefix ? `${prefix}/${e.name}` : e.name);
          if (page.length < PAGE) break;
        }
        if (unread) break;
      }
      if (unread) { console.log(`✗ файлы ${bucket}: ${unread}`); continue; }

      const missing = list.filter(f => !present.has(f.path));
      console.log(`${('файлы ' + bucket).padEnd(17)} в бакете ${String(present.size).padStart(4)} · в копии ${String(list.length).padStart(4)} · вернуть ${missing.length}`);
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
