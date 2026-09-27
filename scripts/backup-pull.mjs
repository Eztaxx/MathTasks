#!/usr/bin/env node
/*
 * Ночная копия из хранилища — в обычный файл копии.
 *
 * Воркер каждую ночь кладёт копию базы в закрытый бакет «backups»
 * (worker/backup.js): таблицы — в db/mathtasks-<время>.json, а чертежи —
 * отдельными файлами в files/, в JSON только ссылки на них. Этот скрипт
 * скачивает копию, подставляет файлы внутрь (base64) и пишет тот же
 * формат, что npm run backup, — его понимают backup --check и restore.
 *
 * Запуск:
 *   node scripts/backup-pull.mjs --list          какие копии есть
 *   node scripts/backup-pull.mjs                 скачать последнюю
 *   node scripts/backup-pull.mjs <имя файла>     скачать эту
 *   … [--dir <папка>]                            куда (docs/backup/snapshots)
 */

import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const env = Object.fromEntries(
  readFileSync(ROOT + '.env', 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);
const URL_ = env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error('Нужны SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env: бакет копий закрыт.'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const BUCKET = 'backups';

async function listCopies() {
  const r = await fetch(`${URL_}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: 'db', limit: 100, offset: 0, sortBy: { column: 'name', order: 'desc' } })
  });
  if (!r.ok) throw new Error(`список копий: ${r.status} ${(await r.text()).slice(0, 120)}`);
  return (await r.json()).filter(e => e.metadata && /^mathtasks-.*\.json$/.test(e.name));
}

async function download(path) {
  const r = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${path}`, { headers: H });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

const copies = await listCopies();
if (argv.includes('--list')) {
  if (!copies.length) console.log('Ночных копий пока нет.');
  for (const c of copies) console.log(`${c.name}  ${(c.metadata.size / 1048576).toFixed(2)} МБ`);
  process.exit(0);
}

const wanted = argv.find(a => !a.startsWith('--') && a !== arg('--dir'));
const pick = wanted ? copies.find(c => c.name === wanted) : copies[0];
if (!pick) { console.error(wanted ? `Копии ${wanted} нет. Список: --list` : 'Ночных копий пока нет.'); process.exit(1); }

const dump = JSON.parse((await download(`db/${pick.name}`)).toString('utf8'));
// Файлы — внутрь копии, как их кладёт npm run backup.
const files = [];
for (const f of dump.storage?.files || []) {
  const buf = await download(f.ref);
  files.push({ bucket: f.bucket, path: f.path, type: f.type, size: buf.length, base64: buf.toString('base64') });
}
dump.storage = { buckets: dump.storage?.buckets || [], files };

const dir = arg('--dir', join(ROOT, 'docs/backup/snapshots'));
mkdirSync(dir, { recursive: true });
const file = join(dir, pick.name);
writeFileSync(file, JSON.stringify(dump, null, 1), 'utf8');
console.log(`✓ ${file}  (${(statSync(file).size / 1048576).toFixed(2)} МБ, снята ${dump.takenAt})`);
console.log(`Проверить: node scripts/backup.mjs --check "${file}"`);
