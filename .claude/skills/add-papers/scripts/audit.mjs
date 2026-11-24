/*
 * Шаг 6. Здоровье автопотока контрольных и уже выложенных работ.
 *
 *   node .claude/skills/add-papers/scripts/audit.mjs
 *
 * Поток: брошенные замки; черновики в базе у запусков, которые не опубликованы и не откачены (в том числе
 * закрытых как неудачные); три неудачи подряд; давно ли была удачная публикация (больше 4 часов при новых
 * запусках — замечание); замечание о странице у последней публикации потока.
 * Работы: последние 10 опубликованных потоком — опубликованы, посетитель видит все задания, страница отвечает 200.
 * Код выхода 2 — есть замечания (список в выводе), 0 — всё в порядке. Ничего не исправляет.
 */
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { core, rest, readLog, allLocks, readJson, runDir, runIds, SITE } from './common.mjs';

const notes = [];
const events = readLog();
for (const l of allLocks()) if (l.stale) notes.push(`брошенный замок потока ${l.stream}: запуск ${l.run}, ${Math.round(l.ageMin)} мин`);
const published = new Set(events.filter(e => e.type === 'published').map(e => e.run));
const rolledBack = new Set(events.filter(e => e.type === 'rolled-back').map(e => e.run));
const failed = new Set(events.filter(e => e.type === 'failed').map(e => e.run));
for (const id of runIds()) {
  const meta = readJson(join(runDir(id), 'meta.json'));
  if (!meta || published.has(id) || rolledBack.has(id)) continue;
  if (existsSync(join(runDir(id), 'state', 'inserted.json'))) {
    notes.push(`запуск ${id} (${meta.slug}) ${failed.has(id) ? 'закрыт неудачей' : 'не опубликован'}, черновики в базе — разобрать: finish.mjs ${id} --rollback --apply`);
  }
}
const streams = [...new Set(events.map(e => e.stream).filter(Boolean))];
for (const s of streams) {
  const mine = events.filter(e => e.stream === s && ['published', 'failed'].includes(e.type));
  if (mine.length >= 3 && mine.slice(-3).every(e => e.type === 'failed')) notes.push(`поток ${s}: три неудачи подряд`);
  const lastPub = mine.filter(e => e.type === 'published').pop();
  const lastPick = events.filter(e => e.stream === s && e.type === 'picked').pop();
  if (lastPick && (!lastPub || Date.parse(lastPick.time) - Date.parse(lastPub.time) > 4 * 3600e3)) {
    notes.push(`поток ${s}: удачной публикации нет больше 4 часов при новых запусках`);
  }
  if (lastPub?.note) notes.push(`${lastPub.slug}: ${lastPub.note}`);
}

const db = await core.dbContext();
for (const e of events.filter(e => e.type === 'published').slice(-10)) {
  const [paper] = await rest(`exam_papers?select=id,slug,is_published,exam_paper_items(task_id)&slug=eq.${encodeURIComponent(e.slug)}`);
  if (!paper) { notes.push(`${e.slug}: работы нет в базе`); continue; }
  if (!paper.is_published) { notes.push(`${e.slug}: снята с публикации`); continue; }
  const ids = (paper.exam_paper_items || []).map(x => x.task_id);
  const seen = await core.visibleTaskCount(db.env, ids);
  if (seen !== ids.length) notes.push(`${e.slug}: посетитель видит заданий ${seen < 0 ? '?' : seen} из ${ids.length}`);
  try {
    const r = await fetch(`${SITE}/control-work/${e.slug}?audit=${Date.now()}`);
    if (r.status !== 200) notes.push(`${e.slug}: страница отвечает ${r.status}`);
  } catch (err) { notes.push(`${e.slug}: страница не открылась (${err.message})`); }
}

console.log(`автопоток контрольных: опубликовано ${published.size}, неудач ${failed.size}; замечаний: ${notes.length}`);
for (const n of notes) console.log('  ' + n);
process.exitCode = notes.length ? 2 : 0;
