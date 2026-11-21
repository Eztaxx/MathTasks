/*
 * Проверка автозапуска: всё ли, что скилл уже выложил, в порядке, и жив ли сам запуск.
 *
 *   node .claude/skills/add-tasks/scripts/audit.mjs           — последние 120 опубликованных задач скилла
 *   node .claude/skills/add-tasks/scripts/audit.mjs --all     — все задачи скилла из журнала
 *
 * Задачи (id из журнала): строка есть и опубликована, робот сайта и KaTeX
 * чистые, название не повторяет другую задачу базы, страницы /ru/task/<id>
 * и /task/<id> на mathtasks.lv отвечают 200.
 * Запуск, по каждому потоку (pick.mjs --grades): последняя удачная публикация
 * не старше 3 часов, нет трёх неудач подряд; нет брошенных замков и черновиков,
 * застрявших в незавершённой пачке.
 *
 * Код выхода 2 — есть замечания (список в выводе), 0 — всё в порядке.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  SITE, FIELD_MAP, fetchAll, rest, katexProblems, readLog, allLocks, batchIds, batchDir, norm, sleep,
  autoCheckable, robotIssues
} from './common.mjs';

const ALL = process.argv.includes('--all');
const problems = [];
const log = readLog();

// Состояние запуска — по каждому потоку (поток виден в id пачки: 20261121-1330-g10; до потоков — «all»).
// Поток — из записи журнала, а у записей до потоков — из суффикса id пачки (…-g10, …-g6-7-8x).
const streamOf = e => e.stream ?? String(e.batch ?? '').match(/-g(\d+(?:-\d+)*)x*$/)?.[1] ?? 'all';
const published = log.filter(e => e.type === 'published' && e.ids?.length);
if (!published.length) problems.push('ещё ни одной удачной публикации');
const streams = [...new Set(log.filter(e => e.batch || e.stream).map(streamOf))];
for (const s of streams) {
  const mine = log.filter(e => (e.batch || e.stream) && streamOf(e) === s);
  const last = mine.filter(e => e.type === 'published' && e.ids?.length).at(-1);
  // Старый общий поток «all» после перехода на потоки больше не запускается — его не проверяем.
  if (s === 'all' && streams.length > 1) continue;
  // Поток дошёл до «ВСЁ ЗАПОЛНЕНО» и с тех пор ничего не писал — он закончил, а не застрял.
  if (mine.at(-1)?.type === 'full') { console.log(`поток ${s}: все подтемы заполнены`); continue; }
  if (!last) problems.push(`поток ${s}: ещё ни одной удачной публикации`);
  else {
    const hours = (Date.now() - Date.parse(last.time)) / 3600000;
    console.log(`поток ${s}: последняя публикация ${hours.toFixed(1)} ч назад (${last.batch})`);
    if (hours > 3) problems.push(`поток ${s}: последняя удачная публикация ${hours.toFixed(1)} ч назад — запуски не идут или не доходят до публикации`);
  }
  let failsInRow = 0;
  for (const e of [...mine].reverse()) {
    if (e.type === 'published' && e.ids?.length) break;
    if (e.type === 'failed') failsInRow++;
  }
  if (failsInRow >= 3) problems.push(`поток ${s}: неудач подряд ${failsInRow} — смотри pick.mjs --status`);
}
const locks = allLocks();
for (const l of locks.filter(l => l.stale)) problems.push(`брошенный замок потока ${l.stream}: пачка ${l.batch}, ${Math.round(l.ageMin)} мин`);
const locked = new Set(locks.filter(l => !l.stale).map(l => l.batch));
const stuck = batchIds().filter(id => existsSync(join(batchDir(id), 'inserted.json'))
  && !existsSync(join(batchDir(id), 'published.json')) && !existsSync(join(batchDir(id), 'finished.json'))
  && !locked.has(id));
if (stuck.length) problems.push(`черновики застряли в пачках: ${stuck.join(', ')}`);
const drafts = published.flatMap(e => e.drafts || []);
if (drafts.length) console.log(`оставлены черновиками за всё время: ${drafts.length} (id ${drafts.slice(-10).join(', ')})`);

// Задачи скилла.
const selfIds = new Set(published.flatMap(e => e.selfIds || []));
let ids = published.flatMap(e => e.ids);
if (!ALL) ids = ids.slice(-120);
if (ids.length) {
  const rows = await rest(`tasks?select=*&id=in.(${ids.join(',')})&order=id`);
  const byId = new Map(rows.map(r => [r.id, r]));
  const others = await fetchAll('tasks?select=id,title,title_lv&order=id');
  const titleCount = new Map();
  for (const t of others) for (const k of [norm(t.title), 'lv:' + norm(t.title_lv)]) titleCount.set(k, (titleCount.get(k) || 0) + 1);
  for (const id of ids) {
    const t = byId.get(id);
    if (!t) { problems.push(`#${id}: строки нет в базе`); continue; }
    if (!t.is_published) problems.push(`#${id}: снята с публикации`);
    // Задача с самопроверкой (selfIds из журнала): ответ не сверяется ни на одном языке, замечание «самопроверка» снято.
    const isSelf = selfIds.has(id);
    const auto = autoCheckable(t);
    if (isSelf && (auto.ru || auto.lv)) problems.push(`#${id}: выложена с самопроверкой, а сайт теперь сверяет ответ`);
    for (const x of robotIssues(t, { grade: t.grade }, isSelf)) {
      // Правило про дроби в 5–6 классе зависит от названия темы — его проверяла сама пачка.
      if (x.code !== 'young') problems.push(`#${id}: робот [${x.code}] ${x.text}`);
    }
    for (const col of Object.values(FIELD_MAP)) for (const p of katexProblems(t[col])) problems.push(`#${id} ${col}: ${p}`);
    if ((titleCount.get(norm(t.title)) || 0) > 1) problems.push(`#${id}: название повторяется в базе`);
    if ((titleCount.get('lv:' + norm(t.title_lv)) || 0) > 1) problems.push(`#${id}: латышское название повторяется в базе`);
  }
  // Живой сайт — для последних 16, чтобы не нагружать.
  for (const id of ids.slice(-16)) {
    for (const path of [`/ru/task/${id}`, `/task/${id}`]) {
      let status = 0;
      for (let attempt = 0; attempt < 2 && status !== 200; attempt++) {
        if (attempt) await sleep(3000);
        try { status = (await fetch(SITE + path)).status; } catch { status = -1; }
      }
      if (status !== 200) problems.push(`${path} → ${status}`);
    }
  }
}

console.log(`проверено задач скилла: ${ids.length}; удачных пачек всего: ${published.length}; замечаний: ${problems.length}`);
for (const p of problems) console.log('  ' + p);
if (problems.length) process.exitCode = 2;
