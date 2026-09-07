#!/usr/bin/env node
/*
 * Резервная копия каталога.
 *
 * На бесплатном тарифе Supabase автоматических копий нет вовсе. В базе
 * лежит работа, которую заново не сделать: 435 задач, полный перевод на
 * латышский, кросс-теги и порядок задач внутри тем. Одно неосторожное
 * «удалить тему» — и восстанавливать неоткуда.
 *
 * Скрипт выгружает все таблицы в один JSON, проверяет выгруженное и
 * убирает старые копии, оставляя последние N.
 *
 * Запуск:   node scripts/backup.mjs [--dir <папка>] [--keep 30] [--quiet]
 * Проверка: node scripts/backup.mjs --check <файл>
 *
 * Восстановление описано в docs/backup/README.md.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const QUIET = argv.includes('--quiet');
const say = (...a) => { if (!QUIET) console.log(...a); };

/* Таблицы каталога. Порядок важен при восстановлении: сначала то, на что
   ссылаются, потом ссылающееся. */
const TABLES = [
  { name: 'subjects',  key: 'id' },
  { name: 'topics',    key: 'id' },
  { name: 'tasks',     key: 'id' },
  { name: 'tags',      key: 'id' },
  { name: 'task_tags', key: null },   // связка, своего идентификатора нет
  { name: 'profiles',  key: 'id', optional: true }
];

/* ── Проверка готового файла ──────────────────────────────────────── */
if (argv.includes('--check')) {
  const file = arg('--check');
  const dump = JSON.parse(readFileSync(file, 'utf8'));
  let bad = 0;
  console.log(`Копия от ${dump.takenAt}, база ${dump.project}`);
  for (const { name } of TABLES) {
    const rows = dump.tables[name];
    if (!rows) { console.log(`  ⚠ ${name}: в копии нет`); continue; }
    const declared = dump.counts[name];
    const ok = rows.length === declared;
    if (!ok) bad++;
    console.log(`  ${ok ? '✓' : '✗'} ${name.padEnd(10)} ${rows.length} строк${ok ? '' : ` (заявлено ${declared})`}`);
  }
  const tasks = dump.tables.tasks || [];
  const noCond = tasks.filter(t => !t.condition_latex).length;
  const noLv = tasks.filter(t => t.condition_latex && !t.condition_latex_lv).length;
  console.log(`  ${noCond ? '✗' : '✓'} задач без условия: ${noCond}`);
  console.log(`  ${noLv ? '⚠' : '✓'} задач без латышского условия: ${noLv}`);
  process.exit(bad || noCond ? 1 : 0);
}

/* ── Выгрузка ─────────────────────────────────────────────────────── */
const env = Object.fromEntries(
  readFileSync(ROOT + '.env', 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);
const URL_ = env.SUPABASE_URL;
/* Сервисный ключ нужен, чтобы копия включала и черновики: политики RLS
   прячут неопубликованное от публичного ключа, и такая «копия» молча
   потеряла бы часть работы. */
const KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
if (!URL_ || !KEY) { console.error('Нет SUPABASE_URL или ключа — проверьте .env'); process.exit(1); }
if (!env.SUPABASE_SERVICE_ROLE_KEY) say('⚠ Сервисного ключа нет: черновики в копию не попадут.');

const PAGE = 1000;   // PostgREST отдаёт не больше тысячи строк за раз

async function fetchAll(table) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const r = await fetch(`${URL_}/rest/v1/${table}?select=*&order=id.asc`.replace('&order=id.asc', table === 'task_tags' ? '' : '&order=id.asc'), {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Range: `${from}-${from + PAGE - 1}` }
    });
    if (!r.ok) throw new Error(`${table}: ${r.status} ${(await r.text()).slice(0, 120)}`);
    const chunk = await r.json();
    rows.push(...chunk);
    if (chunk.length < PAGE) break;
  }
  return rows;
}

const dir = arg('--dir', join(ROOT, 'docs/backup/snapshots'));
const keep = Number(arg('--keep', 30));
mkdirSync(dir, { recursive: true });

const tables = {};
const counts = {};
for (const t of TABLES) {
  try {
    const rows = await fetchAll(t.name);
    tables[t.name] = rows;
    counts[t.name] = rows.length;
    say(`  ${t.name.padEnd(10)} ${rows.length}`);
  } catch (e) {
    if (t.optional) { say(`  ${t.name.padEnd(10)} пропущена (${e.message.slice(0, 40)})`); continue; }
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}

/* Пустая выгрузка — почти наверняка сбой доступа, а не пустая база.
   Записать её поверх хорошей копии значит потерять хорошую копию. */
if (!tables.tasks?.length || !tables.topics?.length) {
  console.error('✗ Задачи или темы не выгрузились. Копия не записана, чтобы не затереть прежнюю.');
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const file = join(dir, `mathtasks-${stamp}.json`);
const dump = {
  takenAt: new Date().toISOString(),
  project: URL_.replace(/^https?:\/\//, '').split('.')[0],
  counts,
  tables
};
writeFileSync(file, JSON.stringify(dump, null, 1), 'utf8');
const mb = (statSync(file).size / 1048576).toFixed(2);
say(`\n✓ ${file}  (${mb} МБ)`);

/* ── Чистка ───────────────────────────────────────────────────────── */
const snaps = readdirSync(dir).filter(f => /^mathtasks-.*\.json$/.test(f)).sort();
const extra = snaps.slice(0, Math.max(0, snaps.length - keep));
for (const f of extra) unlinkSync(join(dir, f));
say(`копий в папке: ${snaps.length - extra.length}${extra.length ? `, удалено старых: ${extra.length}` : ''}`);

if (QUIET) console.log(file);
