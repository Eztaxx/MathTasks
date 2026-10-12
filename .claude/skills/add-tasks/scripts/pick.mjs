/*
 * Шаг 1. Выбор подтемы и контекст для новой пачки.
 *
 *   node .claude/skills/add-tasks/scripts/pick.mjs            — взять замок, выбрать подтему, создать пачку
 *   node .claude/skills/add-tasks/scripts/pick.mjs --dry      — показать выбор и сводку, ничего не создавая
 *   node .claude/skills/add-tasks/scripts/pick.mjs --status   — журнал последних запусков
 *
 * Подтема — та, где меньше всего опубликованных задач среди классов GRADES
 * (при равенстве — младший класс, затем порядок тем и подтем). Пропускаются
 * подтемы из state/skip.json и те, где два запуска подряд кончились неудачей.
 *
 * Коды выхода: 0 — пачка создана (или найдена незавершённая), 3 — идёт
 * другой запуск, 4 — все подтемы заполнены до TARGET, 1 — ошибка.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ROOT, GRADES, TARGET, PER_RUN, LOCK_MINUTES, fetchAll, readJson, writeJson, batchDir, batchIds,
  log, readLog, lockInfo, takeLock, STATE, flat
} from './common.mjs';
import { mkdirSync, existsSync } from 'node:fs';

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');

if (argv.includes('--status')) {
  const entries = readLog().slice(-20);
  for (const e of entries) {
    const what = e.type === 'published' ? `опубликовано ${e.ids?.length ?? 0}${e.drafts?.length ? `, черновиками ${e.drafts.length}` : ''}`
      : e.type === 'failed' ? `неудача: ${e.reason}` : e.type;
    console.log(`${e.time.slice(0, 16).replace('T', ' ')}  ${e.batch ?? ''}  ${e.code ?? ''}  ${what}`);
  }
  const lock = lockInfo();
  console.log(lock ? `замок: пачка ${lock.batch}, ${Math.round(lock.ageMin)} мин${lock.stale ? ' (брошен)' : ''}` : 'замка нет');
  process.exitCode = 0;
} else {
  await main();
}

async function main() {
  const lock = lockInfo();
  if (lock && !lock.stale && !DRY) {
    console.log(`ЗАНЯТО: идёт запуск пачки ${lock.batch} (${Math.round(lock.ageMin)} мин из ${LOCK_MINUTES}). Ничего не делаю.`);
    process.exitCode = 3;
    return;
  }
  if (lock && lock.stale && !DRY) log({ type: 'stale-lock', batch: lock.batch });

  // Незавершённая пачка: черновики вставлены, но не опубликованы — сначала её.
  if (!DRY) {
    const unfinished = batchIds().filter(id => {
      const dir = batchDir(id);
      return existsSync(join(dir, 'inserted.json')) && !existsSync(join(dir, 'published.json')) && !existsSync(join(dir, 'finished.json'));
    });
    if (unfinished.length) {
      const id = unfinished[0];
      takeLock(id);
      console.log(`НЕЗАВЕРШЁННАЯ ПАЧКА ${id}: черновики уже в базе, но не опубликованы.`);
      console.log(`Сделай: node .claude/skills/add-tasks/scripts/publish.mjs ${id}`);
      console.log('Новую подтему в этот запуск не брать.');
      return;
    }
  }

  const topics = (await fetchAll('topics?select=id,title,title_lv,grade,position,slug&order=id'))
    .filter(t => GRADES.includes(t.grade));
  const topicById = new Map(topics.map(t => [t.id, t]));
  const subs = (await fetchAll('subtopics?select=id,topic_id,code,title,title_lv,position&order=id'))
    .filter(s => topicById.has(s.topic_id));
  const tasks = await fetchAll('tasks?select=id,topic_id,subtopic_id,is_published&order=id');

  const published = new Map();
  const drafts = new Map();
  for (const t of tasks) {
    if (!t.subtopic_id) continue;
    const m = t.is_published ? published : drafts;
    m.set(t.subtopic_id, (m.get(t.subtopic_id) || 0) + 1);
  }

  const skip = readJson(join(STATE, 'skip.json'), {});
  // Две неудачи подряд по подтеме (без успешной между ними) — пропускаем.
  const streak = new Map();
  for (const e of readLog()) {
    if (!e.sub) continue;
    if (e.type === 'failed') streak.set(e.sub, (streak.get(e.sub) || 0) + 1);
    if (e.type === 'published' && e.ids?.length) streak.set(e.sub, 0);
  }

  const candidates = subs
    .filter(s => !skip[s.id] && (streak.get(s.id) || 0) < 2)
    .map(s => ({ ...s, n: published.get(s.id) || 0, topic: topicById.get(s.topic_id) }))
    .sort((a, b) => a.n - b.n || a.topic.grade - b.topic.grade || a.topic.position - b.topic.position
      || (a.position ?? 999) - (b.position ?? 999) || a.id - b.id);

  // Сводка по классам.
  for (const g of GRADES) {
    const list = subs.filter(s => topicById.get(s.topic_id).grade === g).map(s => published.get(s.id) || 0);
    if (!list.length) continue;
    const below = list.filter(n => n < TARGET).length;
    console.log(`класс ${g}: подтем ${list.length}, задач ${list.reduce((a, b) => a + b, 0)}, минимум ${Math.min(...list)}, меньше ${TARGET}: ${below}`);
  }
  const skipped = Object.keys(skip).length + [...streak.values()].filter(n => n >= 2).length;
  if (skipped) console.log(`пропускаются подтем: ${skipped} (skip.json и две неудачи подряд)`);

  const target = candidates[0];
  if (!target || target.n >= TARGET) {
    console.log(`ВСЁ ЗАПОЛНЕНО: во всех подтемах классов ${GRADES.join(', ')} не меньше ${TARGET} опубликованных задач.`);
    process.exitCode = 4;
    return;
  }

  const topic = target.topic;
  const want = Math.min(PER_RUN, TARGET - target.n);
  console.log('');
  if (DRY) {
    console.log(`(--dry) выбрал бы: ${target.code} «${target.title}» (id ${target.id}), опубликовано ${target.n}, добавить ${want}`);
    for (const c of candidates.slice(1, 8)) console.log(`  дальше: ${c.code} «${c.title}» — ${c.n}`);
    return;
  }

  // Пачка: id по местному времени.
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  let id = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  while (existsSync(batchDir(id))) id += 'x';
  mkdirSync(batchDir(id), { recursive: true });
  const meta = {
    batch: id, sub: target.id, code: target.code, topic_id: topic.id, grade: topic.grade,
    topicTitle: topic.title, want, startedAt: now.toISOString()
  };
  writeJson(join(batchDir(id), 'meta.json'), meta);
  takeLock(id);

  // Подробности для автора пачки.
  const catalog = readJson(join(ROOT, 'public/data/skola2030_topics.json'), []);
  const cat = catalog.find(c => c.slug === topic.slug);
  const level = topic.grade === 10 ? 'Matemātika, vispārīgais līmenis (общий уровень, 10 класс в базе)'
    : topic.grade === 11 ? 'Matemātika I, optimālais līmenis (11 класс в базе)'
      : topic.grade === 12 ? 'Matemātika II, augstākais līmenis (12 класс в базе)'
        : `Skola2030, ${topic.grade} класс основной школы`;
  const address = topic.grade <= 6 ? 'на «ты»: Aprēķini, Atrodi, Uzraksti' : 'на «вы»: Aprēķiniet, Atrodiet, Uzrakstiet';

  console.log(`ПАЧКА ${id}`);
  console.log(`Подтема: ${target.code} «${target.title}» / «${target.title_lv}» (id ${target.id})`);
  console.log(`Тема: «${topic.title}» / «${topic.title_lv}» (id ${topic.id}, ${topic.slug})`);
  console.log(`Программа: ${level}`);
  if (cat?.description_ru) console.log(`Описание темы в каталоге: ${flat(cat.description_ru)}`);
  console.log(`Опубликовано в подтеме: ${target.n}${drafts.get(target.id) ? `, черновиков ${drafts.get(target.id)}` : ''}. Написать задач: ${want}.`);
  console.log(`Латышский текст — ${address}.`);
  console.log('');
  console.log('Подтемы этой темы (границы содержания):');
  for (const s of subs.filter(s => s.topic_id === topic.id).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))) {
    console.log(`  ${s.id === target.id ? '→' : ' '} ${s.code} «${s.title}» — ${published.get(s.id) || 0}`);
  }

  const cols = 'id,subtopic_id,difficulty,is_published,title,title_lv,condition_latex,condition_latex_lv,answer_latex,answer_latex_lv,solution_latex,solution_latex_lv,hint_latex,hint_latex_lv';
  const own = await fetchAll(`tasks?select=${cols}&subtopic_id=eq.${target.id}&order=id`);
  console.log('');
  console.log(`Задачи этой подтемы (${own.length}) — новые не должны их повторять ни типом с теми же числами, ни названием:`);
  for (const t of own) {
    console.log(`  #${t.id}${t.is_published ? '' : ' (черновик)'} [${t.difficulty}] ${flat(t.title)}`);
    console.log(`      ${flat(t.condition_latex).slice(0, 260)}`);
    console.log(`      → ${flat(t.answer_latex)}`);
  }

  // Образцы стиля: из подтемы, а если там пусто — из темы, затем из класса.
  let pool = own.filter(t => t.is_published);
  if (pool.length < 2) {
    const topicTasks = await fetchAll(`tasks?select=${cols}&topic_id=eq.${topic.id}&is_published=eq.true&order=id`);
    pool = pool.concat(topicTasks.filter(t => t.subtopic_id !== target.id));
    if (pool.length) {
      console.log('');
      console.log(`Другие задачи темы (${topicTasks.length}, первые 10):`);
      for (const t of topicTasks.slice(0, 10)) console.log(`  #${t.id} [${t.difficulty}] ${flat(t.title)} | ${flat(t.condition_latex).slice(0, 160)} → ${flat(t.answer_latex)}`);
    }
  }
  if (pool.length < 2) {
    const gradeTopics = topics.filter(t => t.grade === topic.grade).map(t => t.id).join(',');
    const gradeTasks = await fetchAll(`tasks?select=${cols}&topic_id=in.(${gradeTopics})&is_published=eq.true&order=id`);
    pool = pool.concat(gradeTasks.slice(-6));
  }
  console.log('');
  console.log('Образцы оформления (поля целиком, RU и LV):');
  for (const t of pool.slice(-2)) {
    console.log(`--- #${t.id} [${t.difficulty}]`);
    for (const k of ['title', 'title_lv', 'condition_latex', 'condition_latex_lv', 'answer_latex', 'answer_latex_lv', 'solution_latex', 'solution_latex_lv', 'hint_latex', 'hint_latex_lv']) {
      console.log(`${k}: ${String(t[k] ?? '')}`);
    }
  }
  console.log('');
  console.log('Дальше: прочитай .claude/skills/add-tasks/rules.md, напиши tasks.mjs и verify.py в scratchpad и запусти');
  console.log(`  node .claude/skills/add-tasks/scripts/check.mjs ${id} <папка с tasks.mjs и verify.py>`);
}
