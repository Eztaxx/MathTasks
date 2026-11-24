/*
 * Общее для скриптов скилла add-papers: база и lib.js — из add-tasks/common.mjs, проверки и запись
 * работ — из scripts/lib/paper-core.mjs (их же зовёт ручной scripts/add-paper.mjs).
 *
 * Состояние — .claude/skills/add-papers/state/ (в git не идёт):
 *   lock-<поток>.json  — идёт запуск (одна работа за раз на поток);
 *   log.jsonl          — журнал: picked / inserted / published / failed / stale-lock / unlock;
 *   runs/<id>/         — meta.json, paper.mjs и verify.py (копия из scratchpad), paper.json, state/.
 */
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, rmSync, readdirSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

export const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const ROOT = resolve(SKILL, '../../..');
export const STATE = join(SKILL, 'state');
export const RUNS = join(STATE, 'runs');
mkdirSync(RUNS, { recursive: true });

export { rest, fetchAll, lib, SITE } from '../../add-tasks/scripts/common.mjs';
export * as core from '../../../../scripts/lib/paper-core.mjs';

export const GRADES = [6, 7, 8, 9, 10, 11, 12];
// Запуск составляет одну работу ~20 заданий; дольше часа — брошен.
export const LOCK_MINUTES = 90;

export const readJson = (path, fallback = null) => {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; }
};
export const writeJson = (path, value) => {
  const text = JSON.stringify(value, null, 2) + '\n';
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, text);
  try { renameSync(tmp, path); } catch { writeFileSync(path, text); rmSync(tmp, { force: true }); }
};

export const runDir = id => join(RUNS, id);
export const runIds = () => readdirSync(RUNS, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort();

export function log(entry) {
  appendFileSync(join(STATE, 'log.jsonl'), JSON.stringify({ time: new Date().toISOString(), ...entry }) + '\n');
}
export function readLog() {
  if (!existsSync(join(STATE, 'log.jsonl'))) return [];
  return readFileSync(join(STATE, 'log.jsonl'), 'utf8').split(/\r?\n/).filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

export function parseGrades(argv) {
  const typo = argv.find(a => /^--grade/.test(a) && a !== '--grades');
  if (typo) throw new Error(`неизвестный флаг ${typo} — пиши --grades 10 или --grades 6,7,8`);
  const i = argv.indexOf('--grades');
  if (i < 0) return GRADES;
  const list = String(argv[i + 1] ?? '').split(',').map(Number);
  if (!list.length || list.some(g => !GRADES.includes(g))) throw new Error(`--grades: нужны классы из ${GRADES.join(', ')}, через запятую`);
  return [...new Set(list)].sort((a, b) => a - b);
}
export const streamKey = grades => (grades.length === GRADES.length ? 'all' : grades.join('-'));

const lockPath = key => join(STATE, `lock-${key}.json`);
export function lockInfo(key) {
  const lock = readJson(lockPath(key));
  if (!lock) return null;
  const ageMin = (Date.now() - Date.parse(lock.startedAt)) / 60000;
  return { ...lock, ageMin, stale: !(ageMin < LOCK_MINUTES) };
}
export const takeLock = (key, run) => writeJson(lockPath(key), { run, stream: key, startedAt: new Date().toISOString(), pid: process.pid });
export function releaseLock(key, run) {
  const lock = readJson(lockPath(key));
  if (lock && (!run || lock.run === run)) rmSync(lockPath(key), { force: true });
}
export function allLocks() {
  return readdirSync(STATE).filter(f => /^lock-.+\.json$/.test(f)).map(f => lockInfo(f.slice(5, -5))).filter(Boolean);
}

/** Файл «пауза»: пока он есть, pick.mjs ничего не начинает (владелец ставит паузу без правки расписания). */
export const paused = () => existsSync(join(STATE, 'pause'));
