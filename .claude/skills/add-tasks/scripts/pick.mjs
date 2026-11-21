/*
 * Шаг 1. Выбор подтем и контекст для новой пачки.
 *
 *   node .claude/skills/add-tasks/scripts/pick.mjs            — взять замок, выбрать подтемы, создать пачку
 *   node .claude/skills/add-tasks/scripts/pick.mjs --dry      — показать выбор и сводку, ничего не создавая
 *   node .claude/skills/add-tasks/scripts/pick.mjs --status   — журнал последних запусков
 *   … --grades 10 | --grades 6,7,8                            — поток: только эти классы, свой замок
 *
 * Главная подтема — та, где меньше всего опубликованных задач среди классов
 * GRADES (сначала PRIORITY_GRADES, пока в них есть подтемы ниже TARGET; при
 * равенстве — младший класс, затем порядок тем и подтем). Если в ней места
 * меньше PER_RUN, пачку добирают следующие подтемы той же темы (до MAX_SUBS).
 * Задачи с самопроверкой (ответ сайт не сверяет) — около 1 из SELF_EVERY, не
 * больше SELF_PER_RUN за запуск; план в quota.mjs.
 * Пропускаются подтемы из state/skip.json и те, где два запуска подряд
 * кончились неудачей.
 *
 * Коды выхода: 0 — пачка создана (или найдена незавершённая), 3 — идёт
 * другой запуск, 4 — все подтемы заполнены до TARGET, 1 — ошибка.
 */
import { join } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import {
  ROOT, PRIORITY_GRADES, TARGET, LOCK_MINUTES, fetchAll, readJson, writeJson, batchDir, batchIds,
  log, readLog, lockInfo, allLocks, takeLock, STATE, flat, autoCheckable, parseGrades, streamKey
} from './common.mjs';
import { compareSubs, planBatch, selfTarget } from './quota.mjs';

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const GRADES = parseGrades(argv);
const STREAM = streamKey(GRADES);

if (argv.includes('--status')) {
  const entries = readLog().slice(-20);
  for (const e of entries) {
    const what = e.type === 'published'
      ? `опубликовано ${e.ids?.length ?? 0}${e.selfIds?.length ? ` (с самопроверкой ${e.selfIds.length})` : ''}${e.drafts?.length ? `, черновиками ${e.drafts.length}` : ''}`
      : e.type === 'failed' ? `неудача: ${e.reason}` : e.type;
    const codes = e.codes?.join('+') ?? e.code ?? '';
    console.log(`${e.time.slice(0, 16).replace('T', ' ')}  ${e.batch ?? ''}  ${codes}  ${what}`);
  }
  const locks = allLocks();
  for (const lock of locks) console.log(`замок потока ${lock.stream}: пачка ${lock.batch}, ${Math.round(lock.ageMin)} мин${lock.stale ? ' (брошен)' : ''}`);
  if (!locks.length) console.log('замков нет');
  process.exitCode = 0;
} else {
  await main();
}

async function main() {
  const lock = lockInfo(STREAM);
  if (lock && !lock.stale && !DRY) {
    console.log(`ЗАНЯТО: в потоке ${STREAM} идёт запуск пачки ${lock.batch} (${Math.round(lock.ageMin)} мин из ${LOCK_MINUTES}). Ничего не делаю.`);
    process.exitCode = 3;
    return;
  }
  if (lock && lock.stale && !DRY) log({ type: 'stale-lock', batch: lock.batch, stream: STREAM });
  // Запуск без --grades берёт все классы — пока идёт хоть один поток, он взял бы ту же подтему.
  const others = allLocks().filter(l => !l.stale && l.stream !== STREAM);
  if (STREAM === 'all' && others.length && !DRY) {
    console.log(`ЗАНЯТО: идут потоки ${others.map(l => l.stream).join(', ')} — запуск по всем классам сейчас не делаю; запускай с --grades <классы>.`);
    process.exitCode = 3;
    return;
  }
  // И наоборот: пока идёт запуск по всем классам, потоки ждут — он мог взять подтему их класса.
  if (STREAM !== 'all' && others.some(l => l.stream === 'all') && !DRY) {
    console.log('ЗАНЯТО: идёт запуск по всем классам (без --grades) — поток ждёт следующего раза.');
    process.exitCode = 3;
    return;
  }

  // Незавершённая пачка своих классов: черновики вставлены, но не опубликованы — сначала её.
  // Пачки, которые сейчас ведёт другой поток (замок не брошен), не трогаем.
  if (!DRY) {
    const busy = new Set(allLocks().filter(l => !l.stale && l.stream !== STREAM).map(l => l.batch));
    const unfinished = batchIds().filter(id => {
      const dir = batchDir(id);
      const m = readJson(join(dir, 'meta.json'));
      return m && GRADES.includes(m.grade) && !busy.has(id)
        && existsSync(join(dir, 'inserted.json')) && !existsSync(join(dir, 'published.json')) && !existsSync(join(dir, 'finished.json'));
    });
    if (unfinished.length) {
      const id = unfinished[0];
      takeLock(id, STREAM);
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
  const tasks = await fetchAll('tasks?select=id,subtopic_id,is_published,answer_latex,answer_latex_lv,answer_check,answer_check_lv&order=id');

  // Опубликовано всего и из них с самопроверкой (ответ не сверяется хотя бы на одном языке — так видит ученик).
  const total = new Map();
  const selfCount = new Map();
  const drafts = new Map();
  for (const t of tasks) {
    if (!t.subtopic_id) continue;
    if (!t.is_published) { drafts.set(t.subtopic_id, (drafts.get(t.subtopic_id) || 0) + 1); continue; }
    total.set(t.subtopic_id, (total.get(t.subtopic_id) || 0) + 1);
    const auto = autoCheckable(t);
    if (!auto.ru || !auto.lv) selfCount.set(t.subtopic_id, (selfCount.get(t.subtopic_id) || 0) + 1);
  }

  const skip = readJson(join(STATE, 'skip.json'), {});
  // Две неудачи подряд по главной подтеме (без удачной публикации между ними) — пропускаем.
  const streak = new Map();
  for (const e of readLog()) {
    if (e.type === 'failed' && e.sub) streak.set(e.sub, (streak.get(e.sub) || 0) + 1);
    if (e.type === 'published' && e.ids?.length) for (const id of e.subs ?? [e.sub]) streak.set(id, 0);
  }

  const order = { priority: PRIORITY_GRADES, target: TARGET };
  const all = subs.map(s => {
    const topic = topicById.get(s.topic_id);
    return { ...s, topic, grade: topic.grade, topicPosition: topic.position, total: total.get(s.id) || 0, self: selfCount.get(s.id) || 0 };
  });
  const candidates = all
    .filter(s => !skip[s.id] && (streak.get(s.id) || 0) < 2 && s.total < TARGET)
    .sort((a, b) => compareSubs(a, b, order));

  // Сводка по классам.
  for (const g of GRADES) {
    const list = all.filter(s => s.grade === g);
    if (!list.length) continue;
    const sum = list.reduce((a, s) => a + s.total, 0);
    const selfSum = list.reduce((a, s) => a + s.self, 0);
    const below = list.filter(s => s.total < TARGET).length;
    const owed = list.filter(s => s.self < selfTarget(s.total)).length;
    console.log(`класс ${g}: подтем ${list.length}, задач ${sum} (с самопроверкой ${selfSum}), минимум ${Math.min(...list.map(s => s.total))}, меньше ${TARGET}: ${below}, не хватает самопроверки: ${owed}`);
  }
  const skipped = Object.keys(skip).length + [...streak.values()].filter(n => n >= 2).length;
  if (skipped) console.log(`пропускаются подтем: ${skipped} (skip.json и две неудачи подряд)`);

  const head = candidates[0];
  if (!head) {
    // Отметка для audit.mjs: поток закончил работу, а не застрял.
    // Только если подтемы действительно заполнены, а не отсеяны (skip.json, две неудачи подряд).
    const open = all.filter(s => s.total < TARGET).length;
    if (!DRY && !open && readLog().filter(e => e.stream === STREAM).at(-1)?.type !== 'full') log({ type: 'full', stream: STREAM });
    if (open) console.log(`ВНИМАНИЕ: подтем ниже ${TARGET} ещё ${open}, но все они отсеяны (skip.json или две неудачи подряд) — нужен человек.`);
    console.log(`ВСЁ ЗАПОЛНЕНО (поток ${STREAM}): во всех подтемах классов ${GRADES.join(', ')} не меньше ${TARGET} опубликованных задач.`);
    process.exitCode = 4;
    return;
  }

  // План: главная подтема, затем подтемы той же темы в том же порядке.
  const topic = head.topic;
  const sameTopic = [head, ...candidates.filter(s => s.topic_id === topic.id && s.id !== head.id)];
  const plan = planBatch(sameTopic).map(p => {
    const s = all.find(x => x.id === p.id);
    return { id: s.id, code: s.code, title: s.title, title_lv: s.title_lv, total: s.total, self: s.self, wantAuto: p.wantAuto, wantSelf: p.wantSelf };
  });
  const want = plan.reduce((a, p) => a + p.wantAuto + p.wantSelf, 0);
  const wantSelf = plan.reduce((a, p) => a + p.wantSelf, 0);
  const planLine = p => `${p.code} «${p.title}» (id ${p.id}): опубликовано ${p.total}, из них с самопроверкой ${p.self} → написать обычных ${p.wantAuto}, с самопроверкой ${p.wantSelf}`;

  console.log('');
  if (DRY) {
    console.log(`(--dry) пачка из ${want} задач (с самопроверкой ${wantSelf}), тема «${topic.title}»:`);
    for (const p of plan) console.log('  ' + planLine(p));
    for (const c of candidates.filter(c => !plan.some(p => p.id === c.id)).slice(0, 6)) console.log(`  дальше: ${c.code} «${c.title}» — ${c.total} (самопроверка ${c.self})`);
    return;
  }

  // Пачка: id по местному времени.
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  let id = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}-g${STREAM}`;
  while (existsSync(batchDir(id))) id += 'x';
  mkdirSync(batchDir(id), { recursive: true });
  const meta = {
    batch: id, stream: STREAM, sub: head.id, code: head.code, topic_id: topic.id, grade: topic.grade,
    topicTitle: topic.title, want, wantSelf,
    subs: plan.map(({ id: sid, code, total: n, self, wantAuto, wantSelf: ws }) => ({ id: sid, code, total: n, self, wantAuto, wantSelf: ws })),
    startedAt: now.toISOString()
  };
  writeJson(join(batchDir(id), 'meta.json'), meta);
  takeLock(id, STREAM);

  // Подробности для автора пачки.
  const catalog = readJson(join(ROOT, 'public/data/skola2030_topics.json'), []);
  const cat = catalog.find(c => c.slug === topic.slug);
  const level = topic.grade === 10 ? 'Matemātika, vispārīgais līmenis (общий уровень, 10 класс в базе)'
    : topic.grade === 11 ? 'Matemātika I, optimālais līmenis (11 класс в базе)'
      : topic.grade === 12 ? 'Matemātika II, augstākais līmenis (12 класс в базе)'
        : `Skola2030, ${topic.grade} класс основной школы`;
  const address = topic.grade <= 6 ? 'на «ты»: Aprēķini, Atrodi, Uzraksti' : 'на «вы»: Aprēķiniet, Atrodiet, Uzrakstiet';

  console.log(`ПАЧКА ${id}`);
  console.log(`Тема: «${topic.title}» / «${topic.title_lv}» (id ${topic.id}, ${topic.slug})`);
  console.log(`Программа: ${level}`);
  if (cat?.description_ru) console.log(`Описание темы в каталоге: ${flat(cat.description_ru)}`);
  console.log(`Латышский текст — ${address}.`);
  console.log('');
  console.log(`Написать задач: ${want}, из них с самопроверкой (self: true): ${wantSelf}. По подтемам (sub — id подтемы):`);
  for (const p of plan) console.log('  ' + planLine(p) + (drafts.get(p.id) ? `; черновиков ${drafts.get(p.id)}` : ''));
  console.log('');
  console.log('Подтемы этой темы (границы содержания):');
  for (const s of all.filter(s => s.topic_id === topic.id).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))) {
    console.log(`  ${plan.some(p => p.id === s.id) ? '→' : ' '} ${s.code} «${s.title}» — ${s.total} (самопроверка ${s.self})`);
  }

  const cols = 'id,subtopic_id,difficulty,is_published,title,title_lv,condition_latex,condition_latex_lv,answer_latex,answer_latex_lv,answer_check,answer_check_lv,solution_latex,solution_latex_lv,hint_latex,hint_latex_lv';
  let pool = [];
  for (const p of plan) {
    const own = await fetchAll(`tasks?select=${cols}&subtopic_id=eq.${p.id}&order=id`);
    console.log('');
    console.log(`Задачи подтемы ${p.code} (${own.length}) — новые не должны их повторять ни типом с теми же числами, ни названием:`);
    for (const t of own) {
      const auto = autoCheckable(t);
      const mark = `${t.is_published ? '' : ' (черновик)'}${!auto.ru || !auto.lv ? ' (самопроверка)' : ''}`;
      console.log(`  #${t.id}${mark} [${t.difficulty}] ${flat(t.title)}`);
      console.log(`      ${flat(t.condition_latex).slice(0, 260)}`);
      console.log(`      → ${flat(t.answer_latex)}`);
    }
    pool = pool.concat(own.filter(t => t.is_published));
  }

  // Образцы стиля: из подтем пачки, а если там пусто — из темы, затем из класса.
  if (pool.length < 2) {
    const topicTasks = await fetchAll(`tasks?select=${cols}&topic_id=eq.${topic.id}&is_published=eq.true&order=id`);
    pool = pool.concat(topicTasks.filter(t => !plan.some(p => p.id === t.subtopic_id)));
    if (topicTasks.length) {
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
  // Два обычных образца и один с самопроверкой (ответ не сверяется на обоих языках), если такой есть.
  const isSelfRow = t => { const a = autoCheckable(t); return !a.ru && !a.lv; };
  const isAutoRow = t => { const a = autoCheckable(t); return a.ru && a.lv; };
  const samples = [...pool.filter(isAutoRow).slice(-2), pool.filter(isSelfRow).at(-1)].filter(Boolean);
  console.log('');
  console.log('Образцы оформления (поля целиком, RU и LV):');
  for (const t of samples) {
    console.log(`--- #${t.id} [${t.difficulty}]${isSelfRow(t) ? ' (самопроверка)' : ''}`);
    for (const k of ['title', 'title_lv', 'condition_latex', 'condition_latex_lv', 'answer_latex', 'answer_latex_lv', 'solution_latex', 'solution_latex_lv', 'hint_latex', 'hint_latex_lv']) {
      console.log(`${k}: ${String(t[k] ?? '')}`);
    }
  }
  console.log('');
  console.log('Дальше: прочитай .claude/skills/add-tasks/rules.md, напиши tasks.mjs и verify.py в scratchpad и запусти');
  console.log(`  node .claude/skills/add-tasks/scripts/check.mjs ${id} <папка с tasks.mjs и verify.py>`);
}
