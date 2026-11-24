/*
 * Шаг 2. Проверка работы и вставка черновиков.
 *
 *   node .claude/skills/add-papers/scripts/check.mjs <запуск> <папка>            — все проверки, база не меняется
 *   node .claude/skills/add-papers/scripts/check.mjs <запуск> <папка> --insert   — проверки и вставка заданий-черновиков и работы-черновика
 *
 * <папка> — scratchpad автора с двумя файлами:
 *   paper.mjs — export default [{ sub, title, c, a, s, d }, …]: sub — код подтемы из pick.mjs, title — короткое
 *               латышское название без префикса (префикс «KD 10.3 A:» добавляет скрипт), c/a/s — условие, ответ
 *               «$\text{Nosaukums} = …$» и решение (String.raw), d — Лёгкий | Средний | Сложный;
 *   verify.py — независимый пересчёт; последняя строка вывода — JSON {короткое название: значение ученика}.
 *
 * Проверки: всё из scripts/lib/paper-core.mjs (поля, $, %, KaTeX, робот сайта, ответ сверяется сайтом, значение
 * verify.py сайт принимает, а на единицу больше — нет), плюс: 18–22 задания, у каждого подтема темы и каждая
 * подтема покрыта, есть лёгкие, средние и не меньше двух сложных, без рисунков, ни одно условие не повторяет
 * другой вариант этой темы и задачи базы.
 * Коды выхода: 0 — чисто (или вставлено), 2 — список проблем, 1 — ошибка.
 */
import { join, resolve } from 'node:path';
import { existsSync, copyFileSync, writeFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { core, rest, fetchAll, log, readLog, readJson, runDir, ROOT } from './common.mjs';
const { exitSafely } = await import(pathToFileURL(join(ROOT, 'scripts/lib/exit-safely.mjs')).href);
import { TASKS } from './plan.mjs';

const [runId, srcArg] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const INSERT = process.argv.includes('--insert');
const unknown = process.argv.slice(2).filter(a => a.startsWith('--') && a !== '--insert');
if (!runId || !srcArg || unknown.length) { console.log('использование: check.mjs <запуск> <папка> [--insert]'); process.exit(1); }
const dir = runDir(runId);
const meta = readJson(join(dir, 'meta.json'));
if (!meta) { console.log(`нет запуска ${runId}`); process.exit(1); }
const SRC = resolve(srcArg);
if (SRC.toLowerCase() === resolve(dir).toLowerCase()) { console.log('<папка> — твой scratchpad, а не папка запуска в state/runs'); process.exit(1); }
for (const f of ['paper.mjs', 'verify.py']) if (!existsSync(join(SRC, f))) { console.log(`нет ${join(SRC, f)}`); process.exit(1); }
// Вставленный или закрытый запуск не перепроверять: копии в папке запуска должны совпадать с базой.
if (existsSync(join(dir, 'state', 'inserted.json'))) { console.log(`запуск ${runId} уже вставлен — дальше node .claude/skills/add-papers/scripts/publish.mjs ${runId}`); process.exit(1); }
if (readLog().some(e => e.run === runId && ['published', 'failed', 'rolled-back'].includes(e.type))) { console.log(`запуск ${runId} уже закрыт — начни новый с pick.mjs`); process.exit(1); }

// Копии в папку запуска: что проверено, то и вставляется.
copyFileSync(join(SRC, 'paper.mjs'), join(dir, 'paper.mjs'));
copyFileSync(join(SRC, 'verify.py'), join(dir, 'verify_src.py'));
const prefix = meta.prefix;
// Обёртка: ключи verify.py — короткие названия, ядро сверяет по полным (с префиксом).
writeFileSync(join(dir, 'verify.py'), [
  'import contextlib, io, json, os, runpy, sys',
  'HERE = os.path.dirname(os.path.abspath(__file__))',
  'sys.argv = [os.path.join(HERE, "verify_src.py")]',
  'buf = io.StringIO()',
  'with contextlib.redirect_stdout(buf):',
  '    runpy.run_path(os.path.join(HERE, "verify_src.py"), run_name="__main__")',
  'lines = buf.getvalue().strip().splitlines()',
  'data = json.loads(lines[-1]) if lines else {}',
  `print(json.dumps({${JSON.stringify(prefix + ' ')} + k: v for k, v in data.items()}))`,
  ''
].join('\n'));

let raw;
try {
  raw = (await import(pathToFileURL(join(dir, 'paper.mjs')).href + `?t=${Date.now()}`)).default;
} catch (e) { console.log(`paper.mjs не читается: ${e.message}`); process.exit(2); }
if (!Array.isArray(raw)) { console.log('paper.mjs: export default должен быть массивом заданий'); process.exit(2); }

const codes = new Set(meta.subtopics.map(s => s.code));
const problems = [];
const tasks = raw.map((t, i) => {
  const short = String(t.title ?? '').trim();
  if (!short) problems.push(`#${i + 1}: пустое title`);
  if (/[а-яё]/i.test(short)) problems.push(`#${i + 1}: кириллица в title`);
  if (/^KD\b/.test(short)) problems.push(`#${i + 1}: title без префикса — его добавляет скрипт`);
  if (!codes.has(t.sub)) problems.push(`#${i + 1} «${short}»: sub «${t.sub}» — не подтема этой темы (${[...codes].join(', ')})`);
  if (t.fig) problems.push(`#${i + 1} «${short}»: рисунков в автоработах нет`);
  for (const k of Object.keys(t)) if (!['sub', 'title', 'c', 'a', 's', 'd'].includes(k)) problems.push(`#${i + 1}: лишнее поле ${k}`);
  return { topic: meta.topic.slug, title: `${prefix} ${short}`, c: t.c, a: t.a, s: t.s, d: t.d, fig: null, sub: t.sub };
});
if (tasks.length < TASKS.min || tasks.length > TASKS.max) problems.push(`заданий ${tasks.length}, нужно ${TASKS.min}–${TASKS.max}`);
for (const c of codes) if (!tasks.some(t => t.sub === c)) problems.push(`подтема ${c} не покрыта`);
const dc = d => tasks.filter(t => t.d === d).length;
if (!dc('Лёгкий') || !dc('Средний') || dc('Сложный') < 2) problems.push(`сложность: лёгких ${dc('Лёгкий')}, средних ${dc('Средний')}, сложных ${dc('Сложный')} — нужны все три, сложных не меньше 2`);

const data = {
  grade: meta.grade,
  papers: [{ slug: meta.slug, title: meta.title, minutes: meta.minutes, topics: [meta.topic.slug], tasks: tasks.map(({ sub, ...t }) => t) }],
  figures: {}
};
writeFileSync(join(dir, 'paper.json'), JSON.stringify(data, null, 1) + '\n');
problems.push(...core.checkPaper(dir, data));

// Условия не повторяют другой вариант темы и задачи базы (нормализованный текст).
// Знаки и формулы важны: x^2-5x и x^2+5x — разные условия.
const condKey = s => core.flat(s).toLowerCase();
const mine = new Map();
for (const t of tasks) {
  const k = condKey(t.c);
  if (mine.has(k)) problems.push(`${t.title}: то же условие, что у «${mine.get(k)}»`);
  else mine.set(k, t.title);
}
const sibling = await rest(`exam_papers?select=slug,exam_paper_items(tasks(condition_latex))&kind=eq.cw&slug=like.${encodeURIComponent(meta.slug.slice(0, -1))}*&order=id`);
for (const p of (sibling || []).filter(p => p.slug !== meta.slug)) {
  for (const it of p.exam_paper_items || []) {
    const k = condKey(it.tasks?.condition_latex);
    if (mine.has(k)) problems.push(`${mine.get(k)}: условие повторяет вариант ${p.slug}`);
  }
}
const base = await fetchAll(`tasks?select=id,condition_latex_lv&topic_id=eq.${meta.topic.id}&order=id`);
for (const r of base) {
  const k = condKey(r.condition_latex_lv);
  if (mine.has(k)) problems.push(`${mine.get(k)}: условие совпадает с задачей #${r.id}`);
}

console.log(`запуск ${runId}: ${meta.slug}, заданий ${tasks.length}; проблем: ${problems.length}`);
for (const p of problems) console.log('  ' + p);
if (problems.length) await exitSafely(2);
if (!INSERT) { console.log(`чисто; превью: ${join(dir, 'state', 'preview.html')}\nдальше: node .claude/skills/add-papers/scripts/check.mjs ${runId} ${srcArg} --insert`); await exitSafely(0); }

const db = await core.dbContext();
const { code, state } = await core.insertPaper(dir, data, db);
if (code) {
  log({ type: 'insert-failed', run: runId, stream: meta.stream, slug: meta.slug, topicId: meta.topic.id });
  console.log(`вставка не прошла — закрой запуск: node .claude/skills/add-papers/scripts/finish.mjs ${runId} --failed "вставка: <причина из вывода>"`);
  process.exitCode = code;
} else {
  log({ type: 'inserted', run: runId, stream: meta.stream, slug: meta.slug, topicId: meta.topic.id, paper: state.papers[0]?.id, tasks: state.tasks.map(x => x.id) });
  console.log(`дальше: node .claude/skills/add-papers/scripts/publish.mjs ${runId}`);
}
