/*
 * Собранная контрольная из файла: задания + рисунки + работа (exam_papers, kind = 'cw').
 *
 *   node scripts/add-paper.mjs <папка>              — офлайн-проверки и превью, база не трогается, .env не нужен
 *   node scripts/add-paper.mjs <папка> --apply             — проверки базы, загрузка SVG, вставка заданий-черновиков
 *                                                            и работ-черновиков (is_published = false), state/inserted.json
 *   node scripts/add-paper.mjs <папка> --apply --publish   — перечитать из базы, сверить с файлом, опубликовать работы
 *                                                            и проверить, что посетитель их видит (иначе — снять публикацию)
 *   node scripts/add-paper.mjs <папка> --apply --rollback  — удалить всё, что записано по state/inserted.json
 *                                                            (после сбоя --apply или чтобы переписать работу)
 *
 * Все шаги, которые пишут в базу, идут с --apply: страж (.claude/hooks/guard-prod.mjs) спрашивает владельца.
 *
 * <папка> — например scripts/papers/kd-varbutiba-statistika: в ней paper.json (собирает build.py) и verify.py.
 *
 * Задания остаются черновиками: в каталоге, поиске и счётчиках подтем их нет, а внутри опубликованной
 * работы ученик их видит (правило 026_paper_topics.sql). Подтемы у них нет — add-tasks их не считает.
 * Работа привязывается к темам через exam_paper_topics и topic_id = null: автоматическая контрольная
 * темы остаётся, работа добавляется ссылкой (так же сохраняет админка при нескольких темах).
 *
 * Проверки до записи: обязательные поля, парные $, «%» только в формуле, KaTeX сайта без ошибок,
 * робот сайта (lib.taskIssues), ответ сверяется автоматически; verify.py независимо пересчитывает
 * ответ, сайт принимает это значение как ответ ученика, а значение на единицу больше — нет;
 * SVG проходит sanitizeSvg без изменений и drawingIssues, не больше 8000 знаков.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dirArg = args.find(a => !a.startsWith('--'));
const APPLY = args.includes('--apply');
const PUBLISH = args.includes('--publish');
const ROLLBACK = args.includes('--rollback');
const unknown = args.filter(a => a.startsWith('--') && !['--apply', '--publish', '--rollback'].includes(a));
if (!dirArg || unknown.length || ((PUBLISH || ROLLBACK) && !APPLY) || (PUBLISH && ROLLBACK)) {
  console.log('использование: node scripts/add-paper.mjs <папка> [--apply [--publish | --rollback]]');
  process.exit(1);
}
const INSERT = APPLY && !PUBLISH && !ROLLBACK;
const DIR = resolve(dirArg);
const STATE = join(DIR, 'state');
const BUCKET = 'task-images';
const MAX_SVG = 8000;

new Function(readFileSync(join(ROOT, 'public/lib.js'), 'utf8'))();
const lib = globalThis.MathTasksLib;
const katexModule = { exports: {} };
new Function('module', 'exports', readFileSync(join(ROOT, '.claude/skills/add-tasks/vendor/katex.min.js'), 'utf8'))(katexModule, katexModule.exports);
const katex = katexModule.exports;

const MATH_RE = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|(?<!\\)\$((?:\\\$|[^$])+?)\$/g;
const DIFFICULTIES = ['Лёгкий', 'Средний', 'Сложный'];
const flat = s => String(s ?? '').replace(/\s+/g, ' ').trim();
const norm = s => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

function katexProblems(text) {
  const out = [];
  for (const m of String(text ?? '').matchAll(MATH_RE)) {
    const display = m[1] !== undefined || m[2] !== undefined;
    const src = m[1] ?? m[2] ?? m[3] ?? m[4];
    const warns = [];
    try {
      katex.renderToString(src, { throwOnError: true, displayMode: display, strict: (code, msg) => { warns.push(`${code}: ${msg}`); return 'ignore'; } });
    } catch (e) { out.push(`KaTeX: ${String(e.message).slice(0, 120)} в «${src.slice(0, 60)}»`); continue; }
    if (warns.length) out.push(`KaTeX предупреждение: ${warns[0].slice(0, 120)} в «${src.slice(0, 60)}»`);
  }
  return out;
}

/* Строка задания для базы. Текст только латышский (решение владельца 23.11.2026):
   русские поля — тот же текст, иначе русская страница показала бы пустое условие. */
function taskRow(t, grade, topicId) {
  return {
    topic_id: topicId, subtopic_id: null, grade, difficulty: t.d,
    title: t.title, title_lv: t.title,
    condition_latex: t.c, condition_latex_lv: t.c,
    answer_latex: t.a, answer_latex_lv: t.a,
    solution_latex: t.s, solution_latex_lv: t.s,
    hint_latex: '', hint_latex_lv: '',
    answer_check: null, answer_check_lv: null
  };
}
const TEXT_COLS = ['title', 'title_lv', 'condition_latex', 'condition_latex_lv', 'answer_latex', 'answer_latex_lv', 'solution_latex', 'solution_latex_lv'];

// ── 1. Офлайн-проверки (всегда) ──
const data = JSON.parse(readFileSync(join(DIR, 'paper.json'), 'utf8'));
const problems = [];
const tasks = data.papers.flatMap(p => p.tasks.map(t => ({ ...t, paper: p.slug })));
const topicSlugs = [...new Set(tasks.map(t => t.topic).concat(data.papers.flatMap(p => p.topics)))];

if (!Number.isInteger(data.grade)) problems.push('нет grade');
const seenTitles = new Set(), seenSlugs = new Set();
for (const p of data.papers) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(p.slug)) problems.push(`${p.slug}: слаг — только a-z, 0-9, «-», не с «-» в начале`);
  if (seenSlugs.has(p.slug)) problems.push(`${p.slug}: слаг повторяется`);
  seenSlugs.add(p.slug);
  if (!flat(p.title)) problems.push(`${p.slug}: нет названия`);
  if (!(p.minutes >= 1 && p.minutes <= 600)) problems.push(`${p.slug}: minutes вне 1–600`);
  if (!p.tasks.length) problems.push(`${p.slug}: нет заданий`);
  if (!p.topics.length) problems.push(`${p.slug}: нет тем`);
}
for (const [name, svg] of Object.entries(data.figures)) {
  const clean = lib.sanitizeSvg(svg);
  const issue = lib.drawingIssues(svg);
  if (clean.error || clean.svg !== svg) problems.push(`рисунок ${name}: ${clean.error || 'sanitizeSvg меняет файл'}`);
  if (issue) problems.push(`рисунок ${name}: робот — ${issue}`);
  if (/\n/.test(svg) || svg.length > MAX_SVG) problems.push(`рисунок ${name}: перенос строки или больше ${MAX_SVG} знаков`);
}

// -X utf8: на Windows труба иначе в кодировке ANSI, а -I не даёт задать PYTHONIOENCODING.
const py = spawnSync(process.platform === 'win32' ? 'python' : 'python3', ['-X', 'utf8', '-I', join(DIR, 'verify.py')], {
  encoding: 'utf8', timeout: 120000, env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
});
let computed = null;
if (py.error || py.status !== 0) problems.push(`verify.py не отработал: ${py.error?.message ?? ''} ${String(py.stderr || '').trim().split(/\r?\n/).slice(-3).join(' | ')}`);
else {
  try { computed = JSON.parse(String(py.stdout).trim().split(/\r?\n/).pop()); } catch { problems.push('verify.py: последняя строка не JSON'); }
}
const perturb = val => {
  const m = String(val).match(/-?\d+(?:\.\d+)?/);
  return m ? String(val).slice(0, m.index) + String(Number(m[0]) + 1) + String(val).slice(m.index + m[0].length) : null;
};

for (const t of tasks) {
  const bad = msg => problems.push(`${t.title}: ${msg}`);
  if (seenTitles.has(norm(t.title))) bad('название повторяется');
  seenTitles.add(norm(t.title));
  for (const k of ['title', 'c', 'a', 's']) if (!flat(t[k])) bad(`пустое поле ${k}`);
  if (!DIFFICULTIES.includes(t.d)) bad(`сложность «${t.d}»`);
  if (t.fig && !data.figures[t.fig]) bad(`нет рисунка ${t.fig}`);
  for (const k of ['c', 'a', 's']) {
    const v = String(t[k] ?? '');
    if ((v.replace(/\\\$/g, '').match(/\$/g) || []).length % 2) bad(`${k}: нечётное число $`);
    if (/[\u0000-\u0009\u000b-\u001f]/.test(v)) bad(`${k}: управляющий символ`);
    const outside = v.replace(MATH_RE, ' ');
    if (/%/.test(outside)) bad(`${k}: «%» вне формулы`);
    const cmd = outside.match(/\\[a-zA-Z]+/);
    if (cmd) bad(`${k}: команда ${cmd[0]} вне формулы`);
    if ([...v.matchAll(MATH_RE)].some(m => /(^|[^\\])%/.test(m[0]))) bad(`${k}: «%» без слэша в формуле`);
    if (/[а-яё]/i.test(v)) bad(`${k}: кириллица в латышском тексте`);
    if (/\*\*|<[a-z]/i.test(v)) bad(`${k}: разметка (** или HTML)`);
    for (const p of katexProblems(v)) bad(`${k}: ${p}`);
  }
  const row = taskRow(t, data.grade, 0);
  if (!lib.isTaskAutoCheckable(row.answer_latex, '')) bad(`ответ «${flat(t.a)}» сайт не сверяет автоматически`);
  for (const x of lib.taskIssues({ ...row, condition_image: t.fig ? 'x.svg' : null }, { grade: data.grade, topicTitle: t.topic })) {
    bad(`робот [${x.code}] ${x.text}`);
  }
  if (computed) {
    const val = computed[t.title];
    if (val === undefined) bad('verify.py не дал значение');
    else {
      if (!lib.checkTaskAnswer(String(val), t.a, '')) bad(`сайт не принимает значение verify.py «${val}» для «${flat(t.a)}»`);
      const wrong = perturb(val);
      if (wrong && lib.checkTaskAnswer(wrong, t.a, '')) bad(`сайт принимает и неверное «${wrong}»`);
    }
  }
}
if (computed && Object.keys(computed).length !== tasks.length) problems.push(`verify.py дал ${Object.keys(computed).length} значений, заданий ${tasks.length}`);

// Превью: условия, рисунки и ответы — открыть в браузере и прочитать глазами.
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
mkdirSync(STATE, { recursive: true });
writeFileSync(join(STATE, 'preview.html'), '<!doctype html><meta charset="utf-8"><title>preview</title><body style="font:15px/1.5 sans-serif;max-width:860px;margin:auto">'
  + data.papers.map(p => `<h1>${esc(p.title)} · ${p.minutes} min · ${p.tasks.length}</h1>` + p.tasks.map((t, i) =>
    `<section style="border-top:1px solid #ccc;padding:8px 0"><b>${i + 1}. ${esc(t.title)}</b> <i>${t.d}</i><p>${esc(t.c)}</p>`
    + (t.fig ? data.figures[t.fig] : '') + `<p><b>${esc(t.a)}</b></p><pre style="white-space:pre-wrap">${esc(t.s)}</pre></section>`).join('')).join('') + '</body>');

console.log(`работ ${data.papers.length}, заданий ${tasks.length}, рисунков ${Object.keys(data.figures).length}; проблем: ${problems.length}`);
for (const p of problems) console.log('  ' + p);
if (problems.length) process.exit(2);
if (!APPLY) {
  console.log(`офлайн-проверки чисты; превью: ${join(STATE, 'preview.html')}`);
  console.log(`дальше: node scripts/add-paper.mjs ${dirArg} --apply`);
  process.exit(0);
}

// ── 2. База (нужен .env с SUPABASE_SERVICE_ROLE_KEY) ──
const env = Object.fromEntries(readFileSync(join(ROOT, '.env'), 'utf8').split(/\r?\n/)
  .filter(l => l && !l.startsWith('#') && l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) { console.log('в .env нет SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' };
async function rest(path, { method = 'GET', body, prefer } = {}) {
  const res = await fetch(env.SUPABASE_URL + '/rest/v1/' + path, { method, headers: prefer ? { ...H, Prefer: prefer } : H, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path.slice(0, 80)} → ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}
const { fetchAll: fetchAllRaw } = await import(new URL('./lib/fetch-all.mjs', import.meta.url).href);
const fetchAll = path => fetchAllRaw(env.SUPABASE_URL + '/rest/v1/' + path, H);
const insertedPath = join(STATE, 'inserted.json');
const { exitSafely } = await import(new URL('./lib/exit-safely.mjs', import.meta.url).href);
// Имя файла — папка работы, рисунок и версия: у другой работы свой «A-bars», исправленный рисунок — новая версия
// (публичные адреса кеширует Cloudflare, перезапись того же имени ещё долго отдавалась бы старой).
const figurePath = name => `condition/paper-${basename(DIR)}-${name}-v${Number(data.figureVersion) || 1}.svg`.toLowerCase();
const storageHeaders = { apikey: H.apikey, Authorization: H.Authorization };

if (INSERT) {
  if (existsSync(insertedPath)) { console.log(`уже вставлено (${insertedPath}) — дальше --apply --publish, или --apply --rollback, чтобы начать заново`); await exitSafely(1); }
  const topics = await rest(`topics?select=id,slug,grade,title&slug=in.(${topicSlugs.join(',')})`);
  const topicId = Object.fromEntries(topics.map(t => [t.slug, t.id]));
  const missing = topicSlugs.filter(s => !topicId[s]);
  if (missing.length) { console.log(`нет тем в базе: ${missing.join(', ')}`); await exitSafely(2); }
  const wrongGrade = topics.filter(t => t.grade !== data.grade);
  if (wrongGrade.length) { console.log(`темы не ${data.grade} класса: ${wrongGrade.map(t => t.slug).join(', ')}`); await exitSafely(2); }
  const clashSlug = await rest(`exam_papers?select=slug&slug=in.(${data.papers.map(p => p.slug).join(',')})`);
  const topicClash = await rest(`topics?select=slug&slug=in.(${data.papers.map(p => p.slug).join(',')})`);
  if (clashSlug.length || topicClash.length) { console.log(`слаг занят: ${[...clashSlug, ...topicClash].map(x => x.slug).join(', ')}`); await exitSafely(2); }
  const existing = await fetchAll('tasks?select=id,title,title_lv&order=id');
  const titles = new Set(existing.flatMap(t => [norm(t.title), norm(t.title_lv)]).filter(Boolean));
  const dup = tasks.filter(t => titles.has(norm(t.title)));
  if (dup.length) { console.log(`названия уже есть в базе: ${dup.map(t => t.title).join('; ')}`); await exitSafely(2); }

  const state = { figures: {}, tasks: [], papers: [] };
  const save = () => writeFileSync(insertedPath, JSON.stringify(state, null, 1) + '\n');
  try {
    // Рисунки: новое имя на каждую версию — публичные адреса кеширует Cloudflare.
    for (const [name, svg] of Object.entries(data.figures)) {
      const path = figurePath(name);
      const r = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
        method: 'POST', headers: { ...storageHeaders, 'Content-Type': 'image/svg+xml', 'x-upsert': 'false' }, body: svg
      });
      if (!r.ok) throw new Error(`загрузка ${path}: ${r.status} ${(await r.text()).slice(0, 160)}`);
      state.figures[name] = path;
      save();
    }
    // Задания — черновики в конце своей темы (позиция после максимальной).
    const pos = {};
    for (const slug of topicSlugs) {
      const rows = await fetchAll(`tasks?select=position&topic_id=eq.${topicId[slug]}&order=id`);
      pos[slug] = rows.reduce((m, r) => Math.max(m, r.position || 0), 0);
    }
    for (const p of data.papers) {
      const payload = p.tasks.map(t => ({
        ...taskRow(t, data.grade, topicId[t.topic]),
        condition_image: t.fig ? state.figures[t.fig] : null,
        position: ++pos[t.topic], is_published: false
      }));
      const got = await rest('tasks', { method: 'POST', body: payload, prefer: 'return=representation' });
      if (got.length !== payload.length) throw new Error(`${p.slug}: вставлено ${got.length} из ${payload.length}`);
      const ids = got.map(r => r.id);
      state.tasks.push(...ids.map((id, i) => ({ paper: p.slug, i, id })));
      save();
      const [paper] = await rest('exam_papers', {
        method: 'POST', prefer: 'return=representation',
        body: { slug: p.slug, title: p.title, title_lv: p.title, kind: 'cw', level: null, topic_id: null, minutes: p.minutes, parts: [], is_published: false }
      });
      state.papers.push({ slug: p.slug, id: paper.id });
      save();
      await rest('exam_paper_items', { method: 'POST', body: ids.map((task_id, i) => ({ paper_id: paper.id, task_id, part: 1, position: i + 1 })) });
      await rest('exam_paper_topics', { method: 'POST', body: p.topics.map(s => ({ paper_id: paper.id, topic_id: topicId[s] })) });
    }
  } catch (e) {
    console.log(`сбой: ${e.message}`);
    console.log(`уже записано — в ${insertedPath}. Откат: node scripts/add-paper.mjs ${dirArg} --apply --rollback`);
    await exitSafely(1);
  }
  console.log(`вставлено: заданий ${state.tasks.length}, работ ${state.papers.length} (черновики), рисунков ${Object.keys(state.figures).length}`);
  console.log(`проверить: node scripts/audit-tasks.mjs --drafts --grade ${data.grade}; затем node scripts/add-paper.mjs ${dirArg} --apply --publish`);
}

if (ROLLBACK) {
  if (!existsSync(insertedPath)) { console.log('нечего откатывать: нет state/inserted.json'); await exitSafely(1); }
  const state = JSON.parse(readFileSync(insertedPath, 'utf8'));
  const paperIds = state.papers.map(x => x.id);
  const taskIds = state.tasks.map(x => x.id);
  // Работы (состав и темы — каскадом), потом задания, потом файлы. Только то, что записал этот скрипт.
  if (paperIds.length) await rest(`exam_papers?id=in.(${paperIds.join(',')})`, { method: 'DELETE' });
  for (let i = 0; i < taskIds.length; i += 100) {
    await rest(`tasks?id=in.(${taskIds.slice(i, i + 100).join(',')})&is_published=eq.false`, { method: 'DELETE' });
  }
  const files = Object.values(state.figures);
  if (files.length) {
    const r = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
      method: 'DELETE', headers: { ...storageHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: files })
    });
    if (!r.ok) console.log(`  файлы не удалились (${r.status}) — удалите вручную: ${files.join(', ')}`);
  }
  const left = taskIds.length ? await rest(`tasks?select=id&id=in.(${taskIds.join(',')})`) : [];
  if (left.length) console.log(`  остались задания ${left.map(x => x.id).join(', ')} (опубликованы?) — проверьте вручную`);
  const stamp = Date.now();
  renameSync(insertedPath, join(STATE, `inserted-rolled-back-${stamp}.json`));
  if (existsSync(join(STATE, 'published.json'))) renameSync(join(STATE, 'published.json'), join(STATE, `published-rolled-back-${stamp}.json`));
  console.log(`откат: работ ${paperIds.length}, заданий ${taskIds.length - left.length}, файлов ${files.length}`);
}

if (PUBLISH) {
  if (!existsSync(insertedPath)) { console.log('нечего публиковать: нет state/inserted.json — сначала --apply'); await exitSafely(1); }
  const state = JSON.parse(readFileSync(insertedPath, 'utf8'));
  const why = [];
  const topics = await rest(`topics?select=id,slug&slug=in.(${topicSlugs.join(',')})`);
  const topicId = Object.fromEntries(topics.map(t => [t.slug, t.id]));
  for (const [name, path] of Object.entries(state.figures)) {
    const r = await fetch(`${env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`);
    if (!r.ok) why.push(`рисунок ${name}: ${path} не открывается (${r.status})`);
    else if ((await r.text()) !== data.figures[name]) why.push(`рисунок ${name}: файл в хранилище не совпадает с paper.json`);
  }
  for (const p of data.papers) {
    const rec = state.papers.find(x => x.slug === p.slug);
    if (!rec) { why.push(`${p.slug}: нет в inserted.json`); continue; }
    const [paper] = await rest(`exam_papers?select=id,slug,kind,topic_id,minutes,exam_paper_items(task_id,position),exam_paper_topics(topic_id)&id=eq.${rec.id}`);
    if (!paper) { why.push(`${p.slug}: работы нет в базе`); continue; }
    if (paper.slug !== p.slug || paper.kind !== 'cw' || paper.minutes !== p.minutes || paper.topic_id !== null) why.push(`${p.slug}: поля работы не совпадают с файлом`);
    const ids = state.tasks.filter(x => x.paper === p.slug).sort((a, b) => a.i - b.i).map(x => x.id);
    const items = paper.exam_paper_items.slice().sort((a, b) => a.position - b.position).map(x => x.task_id);
    if (items.join() !== ids.join()) why.push(`${p.slug}: состав работы не совпадает с inserted.json`);
    const haveTopics = paper.exam_paper_topics.map(x => x.topic_id).sort((a, b) => a - b).join();
    const wantTopics = p.topics.map(s => topicId[s]).sort((a, b) => a - b).join();
    if (haveTopics !== wantTopics) why.push(`${p.slug}: темы не совпадают`);
    const rows = await rest(`tasks?select=*&id=in.(${ids.join(',')})&order=id`);
    const byId = new Map(rows.map(r => [r.id, r]));
    p.tasks.forEach((t, i) => {
      const row = byId.get(ids[i]);
      if (!row) { why.push(`${t.title}: нет в базе`); return; }
      const expected = { ...taskRow(t, data.grade, topicId[t.topic]), condition_image: t.fig ? state.figures[t.fig] : null };
      for (const col of [...TEXT_COLS, 'topic_id', 'grade', 'difficulty', 'condition_image']) {
        if (String(row[col] ?? '') !== String(expected[col] ?? '')) why.push(`${t.title}: ${col} в базе не совпадает с файлом`);
      }
      if (row.subtopic_id !== null) why.push(`${t.title}: у задания появилась подтема — оно попадёт в каталог`);
      if (row.is_published) why.push(`${t.title}: задание опубликовано — должно остаться черновиком`);
      if (!lib.isTaskAutoCheckable(row.answer_latex, row.answer_check || '')) why.push(`${t.title}: ответ не сверяется`);
    });
  }
  if (why.length) { for (const w of why) console.log('  ' + w); console.log('не публикую'); await exitSafely(2); }

  // Ключ посетителя: из .env или из public/config.js (его читает и сайт).
  let anonKey = env.SUPABASE_ANON_KEY || '';
  if (!anonKey && existsSync(join(ROOT, 'public/config.js'))) {
    anonKey = (readFileSync(join(ROOT, 'public/config.js'), 'utf8').match(/(?:publishableKey|anonKey|key)\s*:\s*['"]([^'"]+)['"]/) || [])[1] || '';
  }
  if (!anonKey) { console.log('нет ключа посетителя (SUPABASE_ANON_KEY в .env или public/config.js) — без проверки видимости не публикую'); await exitSafely(2); }

  const ids = state.papers.map(x => x.id);
  const done = await rest(`exam_papers?id=in.(${ids.join(',')})&is_published=eq.false`, { method: 'PATCH', body: { is_published: true }, prefer: 'return=representation' });
  console.log(`опубликовано работ: ${done.length}`);
  /* Посетитель должен видеть работу и все её задания (правила 025/026). Не видит —
     снимаем публикацию, но только у работ, выложенных этим запуском: уже живую
     работу посреди урока не трогаем. Сбой сети при проверке — не повод снимать. */
  const fresh = new Set(done.map(x => x.id));
  const A = { apikey: anonKey, Authorization: 'Bearer ' + anonKey };
  const blind = [], unknown = [];
  for (const p of state.papers) {
    const want = state.tasks.filter(x => x.paper === p.slug).map(x => x.id);
    let seen = -1;
    try {
      const r = await fetch(`${env.SUPABASE_URL}/rest/v1/tasks?select=id&id=in.(${want.join(',')})`, { headers: A });
      const list = r.ok ? await r.json() : null;
      if (Array.isArray(list)) seen = list.length;
    } catch { seen = -1; }
    console.log(`  ${p.slug}: посетитель видит заданий ${seen < 0 ? '?' : seen} из ${want.length}`);
    if (seen < 0) unknown.push(p.slug);
    else if (seen !== want.length && fresh.has(p.id)) blind.push(p.id);
    else if (seen !== want.length) unknown.push(p.slug);
  }
  if (blind.length) {
    await rest(`exam_papers?id=in.(${blind.join(',')})`, { method: 'PATCH', body: { is_published: false } });
    console.log(`публикация снята у работ ${blind.join(', ')}: посетитель не видит задания — проверьте, применена ли миграция 026`);
    process.exitCode = 2;
  } else if (unknown.length) {
    console.log(`не удалось подтвердить видимость: ${unknown.join(', ')} — откройте работы на сайте и запустите --apply --publish ещё раз`);
    process.exitCode = 2;
  } else {
    writeFileSync(join(STATE, 'published.json'), JSON.stringify({ papers: ids, at: new Date().toISOString() }) + '\n');
    console.log('готово: https://mathtasks.lv/control-works');
  }
}
