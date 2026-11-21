/*
 * Общее для скриптов скилла add-tasks: ключи, REST, lib.js сайта, KaTeX,
 * журнал, замок и папки пачек.
 *
 * Состояние живёт в .claude/skills/add-tasks/state/ (в git не идёт):
 *   lock-<поток>.json    — идёт запуск потока (у потока одна пачка за раз; поток — набор
 *                          классов из --grades, например lock-10.json, lock-6-7-8.json, lock-all.json);
 *   log.jsonl            — журнал: inserted / published / failed;
 *   skip.json            — подтемы, которые выбор пропускает (id → причина);
 *   batches/<id>/        — meta.json, tasks.mjs, verify.py, inserted.json, published.json.
 */
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, rmSync, readdirSync, renameSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

export const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const ROOT = resolve(SKILL, '../../..');
export const STATE = join(SKILL, 'state');
export const BATCHES = join(STATE, 'batches');
mkdirSync(BATCHES, { recursive: true });

// Классы, которые заполняем (1–5 — нет). Потолок подтемы, размер пачки и доля самопроверки — в quota.mjs.
export const GRADES = [6, 7, 8, 9, 10, 11, 12];
// Сначала заполняются эти классы (10 — Vispārīgais, 11 — Optimālais); остальные из GRADES — когда здесь все подтемы дошли до TARGET.
export const PRIORITY_GRADES = [10, 11];
export { TARGET, PER_RUN, SELF_EVERY, SELF_PER_RUN, MAX_SUBS } from './quota.mjs';
// Замок старше этого считается брошенным (запуск упал, не сняв его).
export const LOCK_MINUTES = 75;
export const SITE = 'https://mathtasks.lv';
export const DIFFICULTIES = ['Лёгкий', 'Средний', 'Сложный'];

function loadEnv() {
  const env = Object.fromEntries(
    readFileSync(join(ROOT, '.env'), 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#') && l.includes('='))
      .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
  );
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('в .env нет SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY');
  return env;
}
const env = loadEnv();
export const REST = env.SUPABASE_URL + '/rest/v1/';
export const H = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
  'Content-Type': 'application/json'
};

const { fetchAll: fetchAllRaw } = await import(pathToFileURL(join(ROOT, 'scripts/lib/fetch-all.mjs')).href);
export const fetchAll = path => fetchAllRaw(REST + path, H);

export async function rest(path, { method = 'GET', body, prefer } = {}) {
  const headers = { ...H };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(REST + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path.slice(0, 80)} → ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

// lib.js сайта: те же проверки, что в админке и scripts/audit-tasks.mjs.
new Function(readFileSync(join(ROOT, 'public/lib.js'), 'utf8'))();
export const lib = globalThis.MathTasksLib;

// KaTeX той же версии, что на сайте (0.16.22, хеш сверен с index.html).
const katexModule = { exports: {} };
new Function('module', 'exports', readFileSync(join(SKILL, 'vendor/katex.min.js'), 'utf8'))(katexModule, katexModule.exports);
export const katex = katexModule.exports;

/* Формулы текста по разделителям сайта (lib.KATEX_DELIMITERS): $$…$$, \[…\], $…$, \(…\).
   Возвращает ошибки и предупреждения KaTeX (кириллица в формуле, «€» и т.п.). */
export const MATH_RE = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|(?<!\\)\$((?:\\\$|[^$])+?)\$/g;
export function katexProblems(text) {
  const out = [];
  for (const m of String(text ?? '').matchAll(MATH_RE)) {
    const display = m[1] !== undefined || m[2] !== undefined;
    const src = m[1] ?? m[2] ?? m[3] ?? m[4];
    const warns = [];
    try {
      katex.renderToString(src, {
        throwOnError: true, displayMode: display,
        strict: (code, msg) => { warns.push(`${code}: ${msg}`); return 'ignore'; }
      });
    } catch (e) {
      out.push(`KaTeX ошибка: ${String(e.message).slice(0, 140)} в «${src.slice(0, 70)}»`);
      continue;
    }
    if (warns.length) out.push(`KaTeX предупреждение: ${warns[0].slice(0, 140)} в «${src.slice(0, 70)}»`);
  }
  return out;
}

export const readJson = (path, fallback = null) => {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; }
};
// Запись через временный файл: потоки читают skip.json и замки одновременно, недописанный файл они не увидят.
export const writeJson = (path, value) => {
  const text = JSON.stringify(value, null, 2) + '\n';
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, text);
  try { renameSync(tmp, path); } catch {
    // Windows: антивирус или чтение в этот момент дают EPERM/EBUSY — пишем напрямую (inserted.json терять нельзя).
    writeFileSync(path, text);
    rmSync(tmp, { force: true });
  }
};

export const batchDir = id => join(BATCHES, id);
export const batchIds = () => readdirSync(BATCHES, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort();

export function log(entry) {
  appendFileSync(join(STATE, 'log.jsonl'), JSON.stringify({ time: new Date().toISOString(), ...entry }) + '\n');
}
export function readLog() {
  if (!existsSync(join(STATE, 'log.jsonl'))) return [];
  return readFileSync(join(STATE, 'log.jsonl'), 'utf8').split(/\r?\n/).filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

/* Потоки: каждый запуск по расписанию берёт свои классы (pick.mjs --grades 10).
   У потока свой замок, так что потоки идут параллельно и не ждут друг друга;
   классы у потоков не пересекаются, значит, и темы (перенумерация, правило young). */
export function parseGrades(argv) {
  // «--grades=10», «--grade 10» молча дали бы все классы и поток «all» поверх потоков — отказываем.
  const typo = argv.find(a => /^--grade/.test(a) && a !== '--grades');
  if (typo) throw new Error(`неизвестный флаг ${typo} — пиши --grades 10 или --grades 6,7,8`);
  const i = argv.indexOf('--grades');
  if (i < 0) return GRADES;
  const list = String(argv[i + 1] ?? '').split(',').map(Number);
  if (!list.length || list.some(g => !GRADES.includes(g))) throw new Error(`--grades: нужны классы из ${GRADES.join(', ')}, через запятую`);
  return [...new Set(list)].sort((a, b) => a - b);
}
export const streamKey = grades => (grades.length === GRADES.length && grades.every(g => GRADES.includes(g)) ? 'all' : grades.join('-'));

const lockPath = key => join(STATE, `lock-${key}.json`);
const withAge = lock => {
  const ageMin = (Date.now() - Date.parse(lock.startedAt)) / 60000;
  return { ...lock, ageMin, stale: !(ageMin < LOCK_MINUTES) };
};
export function lockInfo(key = 'all') {
  // Старый общий lock.json (до потоков) — это тоже поток «all».
  const lock = readJson(lockPath(key)) ?? (key === 'all' ? readJson(join(STATE, 'lock.json')) : null);
  return lock ? withAge({ stream: key, ...lock }) : null;
}
// Все замки (старый lock.json до потоков — тоже), для audit.mjs и pick.mjs --status.
export function allLocks() {
  return readdirSync(STATE).filter(f => /^lock(-[\w-]+)?\.json$/.test(f))
    .map(f => { const lock = readJson(join(STATE, f)); return lock ? withAge({ stream: f.replace(/^lock-?|\.json$/g, '') || 'all', file: f, ...lock }) : null; })
    .filter(Boolean);
}
export const takeLock = (batch, key = 'all') => writeJson(lockPath(key), { batch, stream: key, startedAt: new Date().toISOString(), pid: process.pid });
/* Снять замок пачки (какого бы потока он ни был). Без пачки — замки потока key или всех потоков;
   живые (не брошенные) — только при force, иначе поток получит второй запуск поверх идущего. */
export function releaseLock(batch, key = null, { force = false } = {}) {
  const removed = [];
  for (const lock of allLocks()) {
    const mine = batch ? lock.batch === batch : (!key || lock.stream === key) && (force || lock.stale);
    if (mine) { rmSync(join(STATE, lock.file), { force: true }); removed.push(lock); }
  }
  return removed;
}

// Пачка в файле: tasks.mjs (export default [...]) — свежий импорт, без кеша модулей.
export async function loadItems(file) {
  const mod = await import(pathToFileURL(file).href + '?t=' + Date.now());
  const items = mod.default;
  if (!Array.isArray(items)) throw new Error(`${file}: export default должен быть массивом задач`);
  return items;
}

// Поля пачки → колонки tasks.
export const FIELD_MAP = {
  t: 'title', tl: 'title_lv', c: 'condition_latex', cl: 'condition_latex_lv',
  a: 'answer_latex', al: 'answer_latex_lv', s: 'solution_latex', sl: 'solution_latex_lv',
  h: 'hint_latex', hl: 'hint_latex_lv'
};
export function itemToRow(it, meta) {
  const row = {
    topic_id: meta.topic_id, subtopic_id: it.sub ?? meta.sub, grade: meta.grade, difficulty: it.d,
    answer_check: it.chk ?? null, answer_check_lv: it.chkl ?? null
  };
  for (const [k, col] of Object.entries(FIELD_MAP)) row[col] = String(it[k] ?? '').trim();
  return row;
}

/* Подтемы пачки. Старые пачки (до 21.11.2026) — одна подтема в meta.sub, без самопроверки. */
export const metaSubs = meta => meta.subs
  ?? [{ id: meta.sub, code: meta.code, wantAuto: meta.want ?? 0, wantSelf: 0 }];

/* Сверяет ли сайт ответ — отдельно на каждом языке (страница LV смотрит на латышский ответ,
   а если его нет — на русский, как getLocalizedText в lib.js). */
export const autoCheckable = row => ({
  ru: lib.isTaskAutoCheckable(row.answer_latex, row.answer_check || ''),
  lv: String(row.answer_latex_lv ?? '').trim()
    ? lib.isTaskAutoCheckable(row.answer_latex_lv, row.answer_check_lv || row.answer_check || '')
    : lib.isTaskAutoCheckable(row.answer_latex, row.answer_check || '')
});

/* Замечания робота. У задачи, нарочно сделанной с самопроверкой, снимается ровно одно —
   accept/warn «у ученика будет самопроверка»; остальные остаются. */
export const robotIssues = (row, context, isSelf) => lib.taskIssues(row, context)
  .filter(x => !(isSelf && x.code === 'accept' && x.level === 'warn'));

export const flat = s => String(s ?? '').replace(/\s+/g, ' ').trim();
export const norm = s => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export const sleep = ms => new Promise(r => setTimeout(r, ms));
