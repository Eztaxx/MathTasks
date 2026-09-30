/*
 * Загрузка собранных чертежей: node scripts/figs/upload.mjs [--apply]
 *
 * Без --apply — сухой прогон: проверяет каждый файл out/task-<id>-v1.svg и состояние задач
 * (опубликована ли, пуст ли condition_image), пишет копию затронутых строк в out/before-upload.json.
 * С --apply кладёт файл в бакет task-images под именем condition/task-<id>-v1.svg и прописывает путь
 * в condition_image только там, где он пуст: чужие и уже готовые чертежи не трогает.
 * Нужен SUPABASE_SERVICE_ROLE_KEY в .env.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const OUT = join(HERE, 'out');
const APPLY = process.argv.includes('--apply');
const env = Object.fromEntries(readFileSync(join(ROOT, '.env'), 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; }));
new Function(readFileSync(join(ROOT, 'public/lib.js'), 'utf8'))();
const lib = globalThis.MathTasksLib;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error('нет SUPABASE_SERVICE_ROLE_KEY в .env'); process.exit(1); }
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const JH = { ...H, 'Content-Type': 'application/json', Prefer: 'return=representation' };

const files = readdirSync(OUT).filter(f => /^task-\d+-v1\.svg$/.test(f));
const ids = files.map(f => Number(f.match(/\d+/)[0])).sort((a, b) => a - b);
console.log(`файлов: ${files.length}`);

let bad = 0;
for (const f of files) {
  const svg = readFileSync(join(OUT, f), 'utf8');
  const clean = lib.sanitizeSvg(svg);
  const issue = lib.drawingIssues(svg);
  if (clean.error || clean.svg !== svg || issue || /\n/.test(svg) || svg.length > 8000) { console.log(`  ✗ ${f}: ${clean.error || issue || 'sanitize изменил или файл велик'}`); bad++; }
}
if (bad) { console.log('есть проблемы — стоп'); process.exit(1); }

const rows = [];
for (let i = 0; i < ids.length; i += 60) {
  const chunk = ids.slice(i, i + 60);
  const r = await fetch(env.SUPABASE_URL + `/rest/v1/tasks?select=id,grade,is_published,condition_image&id=in.(${chunk.join(',')})`, { headers: H });
  rows.push(...await r.json());
}
const byId = Object.fromEntries(rows.map(r => [r.id, r]));
const missing = ids.filter(id => !byId[id]);
const notPub = ids.filter(id => byId[id] && !byId[id].is_published);
const hasImg = ids.filter(id => byId[id] && byId[id].condition_image);
const todo = ids.filter(id => byId[id] && byId[id].is_published && !byId[id].condition_image);
console.log(`в базе найдено: ${rows.length}; нет задачи: ${missing.length} ${missing}; не опубликованы: ${notPub.length}; уже с чертежом: ${hasImg.length} ${hasImg}; к загрузке: ${todo.length}`);
writeFileSync(join(OUT, 'before-upload.json'), JSON.stringify(todo.map(id => ({ id, condition_image: byId[id].condition_image })), null, 1));
if (!APPLY) { console.log('сухой прогон завершён; для записи — node scripts/figs/upload.mjs --apply'); process.exit(0); }

let up = 0, upd = 0, fail = 0;
for (const id of todo) {
  const name = `task-${id}-v1.svg`;
  const path = 'condition/' + name;
  const svg = readFileSync(join(OUT, name), 'utf8');
  const r1 = await fetch(env.SUPABASE_URL + '/storage/v1/object/task-images/' + path, { method: 'POST', headers: { ...H, 'Content-Type': 'image/svg+xml', 'x-upsert': 'false' }, body: svg });
  if (!r1.ok) { console.log(`  ✗ загрузка ${name}: ${r1.status} ${(await r1.text()).slice(0, 120)}`); fail++; continue; }
  up++;
  const r2 = await fetch(env.SUPABASE_URL + `/rest/v1/tasks?id=eq.${id}&condition_image=is.null`, { method: 'PATCH', headers: JH, body: JSON.stringify({ condition_image: path }) });
  const j = await r2.json();
  if (!r2.ok || !Array.isArray(j) || j.length !== 1) { console.log(`  ✗ запись ссылки #${id}: ${r2.status} ${JSON.stringify(j).slice(0, 120)}`); fail++; continue; }
  upd++;
}
console.log(`загружено файлов: ${up}; ссылок записано: ${upd}; сбоев: ${fail}`);
if (fail) process.exitCode = 1;
