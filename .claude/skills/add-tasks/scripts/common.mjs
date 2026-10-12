/*
 * Общее для скриптов скилла add-tasks: ключи, REST, lib.js сайта, KaTeX,
 * журнал, замок и папки пачек.
 *
 * Состояние живёт в .claude/skills/add-tasks/state/ (в git не идёт):
 *   lock.json            — идёт запуск (одна пачка за раз);
 *   log.jsonl            — журнал: inserted / published / failed;
 *   skip.json            — подтемы, которые выбор пропускает (id → причина);
 *   batches/<id>/        — meta.json, tasks.mjs, verify.py, inserted.json, published.json.
 */
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

export const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const ROOT = resolve(SKILL, '../../..');
export const STATE = join(SKILL, 'state');
export const BATCHES = join(STATE, 'batches');
mkdirSync(BATCHES, { recursive: true });

// Классы, которые заполняем (1–5 — нет), потолок задач в подтеме, размер пачки.
export const GRADES = [6, 7, 8, 9, 10, 11, 12];
export const TARGET = 15;
export const PER_RUN = 8;
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
export const writeJson = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n');

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

const LOCK = join(STATE, 'lock.json');
export function lockInfo() {
  const lock = readJson(LOCK);
  if (!lock) return null;
  const ageMin = (Date.now() - Date.parse(lock.startedAt)) / 60000;
  return { ...lock, ageMin, stale: !(ageMin < LOCK_MINUTES) };
}
export const takeLock = batch => writeJson(LOCK, { batch, startedAt: new Date().toISOString(), pid: process.pid });
export function releaseLock(batch) {
  const lock = readJson(LOCK);
  if (lock && (!batch || lock.batch === batch)) rmSync(LOCK, { force: true });
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
    topic_id: meta.topic_id, subtopic_id: meta.sub, grade: meta.grade, difficulty: it.d,
    answer_check: it.chk ?? null, answer_check_lv: it.chkl ?? null
  };
  for (const [k, col] of Object.entries(FIELD_MAP)) row[col] = String(it[k] ?? '').trim();
  return row;
}

export const flat = s => String(s ?? '').replace(/\s+/g, ' ').trim();
export const norm = s => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export const sleep = ms => new Promise(r => setTimeout(r, ms));
