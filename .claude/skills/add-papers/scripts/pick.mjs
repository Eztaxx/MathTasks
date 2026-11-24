/*
 * Шаг 1. Выбор темы и варианта для новой контрольной, замок, контекст для автора.
 *
 *   node .claude/skills/add-papers/scripts/pick.mjs                 — взять замок, выбрать тему и вариант, создать запуск
 *   node .claude/skills/add-papers/scripts/pick.mjs --dry           — показать выбор, ничего не создавая
 *   node .claude/skills/add-papers/scripts/pick.mjs --status        — журнал последних запусков и замки
 *   … --grades 10 | --grades 6,7,8                                  — поток: только эти классы, свой замок
 *
 * Коды выхода: 0 — запуск создан (или найден незавершённый), 3 — идёт другой запуск потока,
 * 4 — у всех тем уже есть варианты A и B, 5 — пауза (state/pause), 1 — ошибка.
 */
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { fetchAll, rest, log, readLog, lockInfo, allLocks, takeLock, writeJson, readJson, runDir, runIds, parseGrades, streamKey, paused, LOCK_MINUTES, ROOT } from './common.mjs';
import { pathToFileURL } from 'node:url';
const { exitSafely } = await import(pathToFileURL(join(ROOT, 'scripts/lib/exit-safely.mjs')).href);
import { nextPaper, variantLetter, paperSlug, paperTitle, taskPrefix, perSubtopic, difficultyMix, TASKS, MINUTES } from './plan.mjs';

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
let GR;
try { GR = parseGrades(argv); } catch (e) { console.log(e.message); process.exit(1); }
const STREAM = streamKey(GR);

if (argv.includes('--status')) {
  for (const e of readLog().slice(-30)) {
    console.log(`${e.time.slice(0, 16).replace('T', ' ')}  ${e.run || ''}  ${e.slug || ''}  ${e.type}${e.note ? ' — ' + e.note : ''}`);
  }
  const locks = allLocks();
  for (const l of locks) console.log(`замок потока ${l.stream}: запуск ${l.run}, ${Math.round(l.ageMin)} мин${l.stale ? ' (брошен)' : ''}`);
  if (!locks.length) console.log('замков нет');
  if (paused()) console.log('ПАУЗА: есть файл state/pause');
  process.exit(0);
}

if (paused() && !DRY) { console.log('ПАУЗА: есть файл .claude/skills/add-papers/state/pause — ничего не начинаю.'); process.exit(5); }

const lock = lockInfo(STREAM);
if (lock && !lock.stale && !DRY) {
  console.log(`ЗАНЯТО: в потоке ${STREAM} идёт запуск ${lock.run} (${Math.round(lock.ageMin)} мин из ${LOCK_MINUTES}). Ничего не делаю.`);
  process.exit(3);
}
// Потоки с общими классами выбирали бы одни темы — не идут одновременно.
const gradesOf = key => (key === 'all' ? [6, 7, 8, 9, 10, 11, 12] : String(key).split('-').map(Number));
const other = allLocks().find(l => !l.stale && l.stream !== STREAM && gradesOf(l.stream).some(g => GR.includes(g)));
if (other && !DRY) {
  console.log(`ЗАНЯТО: идёт запуск ${other.run} потока ${other.stream}, классы пересекаются. Ничего не делаю.`);
  process.exit(3);
}
if (lock && lock.stale && !DRY) log({ type: 'stale-lock', run: lock.run, stream: STREAM });

const logAll = readLog();
const doneRuns = new Set(logAll.filter(e => ['published', 'failed', 'rolled-back'].includes(e.type)).map(e => e.run));

// Незавершённый запуск этого потока — доделать его, а не начинать новый.
const unfinished = runIds().map(id => readJson(join(runDir(id), 'meta.json'))).filter(m => m && m.stream === STREAM && !doneRuns.has(m.run));
if (unfinished.length && !DRY) {
  const m = unfinished[unfinished.length - 1];
  if (logAll.some(e => e.run === m.run && e.type === 'publish-failed')) {
    // Публикация уже не прошла — повтор по кругу ничего не даст: закрываем, черновики покажет audit.mjs.
    log({ type: 'failed', run: m.run, stream: STREAM, slug: m.slug, topicId: m.topic.id, note: 'публикация не прошла, запуск закрыт при следующем pick' });
  } else {
    takeLock(STREAM, m.run);
    const inserted = existsSync(join(runDir(m.run), 'state', 'inserted.json'));
    console.log(`НЕЗАВЕРШЁННЫЙ ЗАПУСК ${m.run}: ${m.slug}${inserted ? ' — уже вставлен, дальше publish.mjs' : ''}`);
    await printContext(m);
    await exitSafely(0);
  }
}

const topics = await fetchAll(`topics?select=id,grade,position,slug,title_lv,description_lv&grade=in.(${GR.join(',')})&order=id`);
const subs = await fetchAll(`subtopics?select=id,topic_id,code,title_lv,position&topic_id=in.(${topics.map(t => t.id).join(',')})&order=id`);
const subCount = new Map();
for (const s of subs) subCount.set(s.topic_id, (subCount.get(s.topic_id) || 0) + 1);
const papers = await fetchAll('exam_papers?select=id,slug,exam_paper_topics(topic_id)&kind=eq.cw&order=id');
const variantsOf = new Map();
for (const p of papers) {
  for (const { topic_id } of p.exam_paper_topics || []) {
    if (!variantsOf.has(topic_id)) variantsOf.set(topic_id, new Set());
    const have = variantsOf.get(topic_id);
    have.add(variantLetter(p.slug, have.size));
  }
}
// Две неудачи подряд по теме — тему пропускаем, её разбирает человек.
const failedTwice = new Set();
const byTopic = new Map();
for (const e of logAll) if (e.topicId && ['failed', 'published'].includes(e.type)) {
  const arr = byTopic.get(e.topicId) || []; arr.push(e.type); byTopic.set(e.topicId, arr);
}
for (const [id, arr] of byTopic) if (arr.slice(-2).join() === 'failed,failed') failedTwice.add(id);

const next = nextPaper({ topics, subCount, variantsOf, failedTwice, grades: GR });
if (!next) { console.log('ВСЁ СОСТАВЛЕНО: у всех тем этих классов есть варианты A и B.'); await exitSafely(4); }
const { topic, variant } = next;
const tsubs = subs.filter(s => s.topic_id === topic.id).sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id - b.id);
const counts = perSubtopic(tsubs.length, TASKS.target);
const now = new Date();
let run = `${now.toISOString().slice(0, 10).replace(/-/g, '')}-${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}-p${STREAM}`;
while (existsSync(runDir(run))) run += 'x';
const meta = {
  run, stream: STREAM, grade: topic.grade,
  topic: { id: topic.id, slug: topic.slug, grade: topic.grade, position: topic.position, title_lv: topic.title_lv, description_lv: topic.description_lv || '' },
  variant, slug: paperSlug(topic, variant), title: paperTitle(topic, variant), prefix: taskPrefix(topic, variant), minutes: MINUTES,
  tasks: TASKS, difficulty: difficultyMix(TASKS.target),
  subtopics: tsubs.map((s, i) => ({ code: s.code, title_lv: s.title_lv, plan: counts[i] || 1 }))
};

if (DRY) {
  console.log(`(--dry) поток ${STREAM}: ${meta.slug} — ${meta.title}`);
  for (const s of meta.subtopics) console.log(`  ${s.code} ${s.title_lv}: ${s.plan}`);
  await exitSafely(0);
}

const dir = runDir(run);
mkdirSync(dir, { recursive: true });
writeJson(join(dir, 'meta.json'), meta);
takeLock(STREAM, run);
log({ type: 'picked', run, stream: STREAM, slug: meta.slug, topicId: topic.id, grade: topic.grade, variant });
await printContext(meta);

async function printContext(m) {
  console.log(`\nЗАПУСК ${m.run} · поток ${m.stream}`);
  console.log(`Работа: ${m.title}  (слаг ${m.slug}, ${m.minutes} минут)`);
  console.log(`Тема ${m.topic.grade}.${m.topic.position}: «${m.topic.title_lv}»`);
  if (m.topic.description_lv) console.log(`Описание темы: ${m.topic.description_lv}`);
  console.log(`Заданий: ${m.tasks.target} (допустимо ${m.tasks.min}–${m.tasks.max}); сложность примерно: ${Object.entries(m.difficulty).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  console.log('Подтемы (поле sub у задания — этот код; каждой — не меньше одного задания):');
  for (const s of m.subtopics) console.log(`  ${s.code}  ${s.title_lv}  — около ${s.plan}`);
  // Другой вариант этой же темы — параллельный: те же типы, другие числа и сюжеты, условия не повторять.
  const sibling = await rest(`exam_papers?select=slug,exam_paper_items(position,tasks(title,condition_latex))&kind=eq.cw&slug=like.${encodeURIComponent(m.slug.slice(0, -1))}*&order=id`);
  const other = (sibling || []).filter(p => p.slug !== m.slug);
  if (other.length) {
    for (const p of other) {
      console.log(`\nУже есть вариант ${p.slug} — пиши ПАРАЛЛЕЛЬНЫЙ (те же типы и порядок, другие числа и сюжеты, ни одно условие не повторять):`);
      for (const it of (p.exam_paper_items || []).sort((a, b) => a.position - b.position)) {
        console.log(`  ${it.position}. ${String(it.tasks?.condition_latex || '').replace(/\s+/g, ' ').slice(0, 220)}`);
      }
    }
  } else {
    console.log('\nОбразцы уровня — опубликованные задачи подтем (не копировать, только уровень и стиль):');
    for (const s of m.subtopics.slice(0, 12)) {
      const [sub] = await rest(`subtopics?select=id&code=eq.${encodeURIComponent(s.code)}&topic_id=eq.${m.topic.id}`);
      if (!sub) continue;
      const rows = await rest(`tasks?select=condition_latex_lv&subtopic_id=eq.${sub.id}&is_published=eq.true&order=id&limit=2`);
      for (const r of rows || []) console.log(`  [${s.code}] ${String(r.condition_latex_lv || '').replace(/\s+/g, ' ').slice(0, 200)}`);
    }
  }
  console.log(`\nДальше: напиши paper.mjs и verify.py в своём scratchpad (правила — rules.md), затем`);
  console.log(`  node .claude/skills/add-papers/scripts/check.mjs ${m.run} <папка scratchpad>`);
}
