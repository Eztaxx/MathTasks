/*
 * Шаг 2–3. Проверка пачки и вставка черновиками.
 *
 *   node .claude/skills/add-tasks/scripts/check.mjs <пачка> <папка>            — все проверки, база не меняется
 *   node .claude/skills/add-tasks/scripts/check.mjs <пачка> <папка> --insert   — то же, и при чистом прогоне
 *                                                                               вставить черновиками (is_published = false)
 *
 * <папка> — где лежат tasks.mjs и verify.py (обычно scratchpad сессии). Обе
 * копируются в state/batches/<пачка>/ — так в архиве остаётся ровно то, что
 * проверялось и вставлялось.
 *
 * Проверки: поля и сложность; $ парные; нет «\\буква», управляющих символов,
 * «%» без слэша; латышские буквы только в LV, кириллицы в LV нет; длина
 * подсказки и не раскрывает ли она ответ; названия и условия не повторяют
 * базу и друг друга; робот сайта lib.taskIssues; KaTeX 0.16.22 без ошибок и
 * предупреждений; verify.py независимо считает ответ, и сайт принимает это
 * значение как верный ответ ученика, а значение на единицу больше — нет.
 */
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  PER_RUN, DIFFICULTIES, MATH_RE, fetchAll, rest, lib, katexProblems, readJson, writeJson, batchDir, loadItems,
  itemToRow, log, norm, flat
} from './common.mjs';

const [batch, dirArg] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const INSERT = process.argv.includes('--insert');
if (!batch || !dirArg) {
  console.log('использование: check.mjs <пачка> <папка с tasks.mjs и verify.py> [--insert]');
  process.exitCode = 1;
} else {
  await main();
}

async function main() {
  const dir = batchDir(batch);
  const meta = readJson(join(dir, 'meta.json'));
  if (!meta) { console.log(`нет пачки ${batch} (сначала pick.mjs)`); process.exitCode = 1; return; }
  if (existsSync(join(dir, 'inserted.json'))) {
    console.log(`пачка ${batch} уже вставлена — дальше только publish.mjs ${batch}`);
    process.exitCode = 1;
    return;
  }
  const src = resolve(dirArg);
  for (const f of ['tasks.mjs', 'verify.py']) {
    if (!existsSync(join(src, f))) { console.log(`нет файла ${join(src, f)}`); process.exitCode = 1; return; }
    if (resolve(src) !== resolve(dir)) copyFileSync(join(src, f), join(dir, f));
  }

  const items = await loadItems(join(dir, 'tasks.mjs'));
  const problems = [];
  const bad = (i, msg) => problems.push(`#${i + 1} ${msg}`);
  if (!items.length) problems.push('пачка пустая');
  if (items.length > PER_RUN) problems.push(`в пачке ${items.length} задач, больше ${PER_RUN}`);

  const existing = await fetchAll('tasks?select=id,title,title_lv,condition_latex,condition_latex_lv&order=id');
  const seen = {
    t: new Set(existing.map(t => norm(t.title))), tl: new Set(existing.map(t => norm(t.title_lv))),
    c: new Set(existing.map(t => norm(t.condition_latex))), cl: new Set(existing.map(t => norm(t.condition_latex_lv)))
  };

  const nums = s => (String(s ?? '').replace(/\\text\{[^}]*\}/g, ' ').replace(/\{,\}/g, '.').replace(/,(?=\d)/g, '.').match(/\d+(?:\.\d+)?/g) || []);
  const rows = [];
  for (const [i, it] of items.entries()) {
    if (it.sub !== meta.sub) bad(i, `sub ${it.sub}, а пачка для подтемы ${meta.sub}`);
    for (const k of ['d', 't', 'tl', 'c', 'cl', 'a', 'al', 's', 'sl', 'h', 'hl']) {
      if (!String(it[k] ?? '').trim()) bad(i, `пустое поле ${k}`);
    }
    if (!DIFFICULTIES.includes(it.d)) bad(i, `сложность «${it.d}» — нужна одна из ${DIFFICULTIES.join(', ')}`);
    for (const k of ['t', 'tl', 'c', 'cl', 'a', 'al', 's', 'sl', 'h', 'hl']) {
      const v = String(it[k] ?? '');
      const ru = !['tl', 'cl', 'al', 'sl', 'hl'].includes(k);
      if ((v.replace(/\\\$/g, '').match(/\$/g) || []).length % 2) bad(i, `${k}: нечётное число $`);
      if (/\\\\[a-zA-Z]/.test(v)) bad(i, `${k}: двойной слэш перед буквой (в tasks.mjs строки — String.raw)`);
      if (/[\u0000-\u0009\u000b-\u001f]/.test(v)) bad(i, `${k}: управляющий символ — \\t или \\f съелись, пиши файл через Write и String.raw`);
      // Проценты в базе — только внутри формулы и со слэшем: $20\%$.
      const outside = v.replace(MATH_RE, ' ');
      if (/%/.test(outside)) bad(i, `${k}: «%» вне формулы — пиши $20\\%$`);
      // Вне $…$ команда LaTeX видна ученику как текст «\frac…» (в базе таких 0).
      const cmd = outside.match(/\\[a-zA-Z]+|\\[,;!{}]/);
      if (cmd) bad(i, `${k}: команда «${cmd[0]}» вне формулы — оберни в $…$`);
      if ([...v.matchAll(MATH_RE)].some(m => /(^|[^\\])%/.test(m[0]))) bad(i, `${k}: «%» без слэша в формуле (в KaTeX это комментарий) — пиши \\%`);
      if (/\\begin\{cases\}/.test(v) && !/\\end\{cases\}/.test(v)) bad(i, `${k}: cases не закрыт`);
      if (/\*\*/.test(v)) bad(i, `${k}: «**» — разметки жирным в базе нет`);
      const stripped = v.replace(/\\text\{[^}]*\}/g, '');
      if (ru && /[āčēģīķļņšūž]/i.test(stripped)) bad(i, `${k}: латышские буквы в русском тексте`);
      if (!ru && /[а-яё]/i.test(v)) bad(i, `${k}: кириллица в латышском тексте`);
      for (const p of katexProblems(v)) bad(i, `${k}: ${p}`);
    }
    if (String(it.h).length > 360 || String(it.hl).length > 380) bad(i, `длинная подсказка ${String(it.h).length}/${String(it.hl).length} (до 360/380)`);
    for (const k of ['t', 'tl', 'c', 'cl']) {
      const key = norm(it[k]);
      if (key && seen[k].has(key)) bad(i, `${k}: ${k.startsWith('t') ? 'такое название' : 'такое условие'} уже есть в базе или в пачке — переименуй или смени числа`);
      seen[k].add(key);
    }
    // Подсказка не выдаёт результат: правило сайта и старый признак «число ответа есть в подсказке».
    for (const [a, h, lang] of [[it.a, it.h, ''], [it.al, it.hl, ' (LV)']]) {
      if (lib.hintRevealsAnswer(a, h)) bad(i, `подсказка${lang} уже содержит ответ`);
    }
    const condNums = new Set(nums(it.c));
    const leak = [...new Set(nums(it.a))].filter(n => n.length > 1 && !condNums.has(n) && nums(it.h).includes(n));
    if (leak.length) bad(i, `подсказка раскрывает число ответа ${leak.join(', ')}`);

    const row = itemToRow(it, meta);
    for (const x of lib.taskIssues(row, { grade: meta.grade, topicTitle: meta.topicTitle })) bad(i, `робот [${x.code}] ${x.text}`);
    rows.push(row);
  }

  // Независимый пересчёт ответа: verify.py печатает последней строкой JSON {"1": ["16"], "2": ["2", "-1"], ...}.
  const py = spawnSync('python', ['-I', join(dir, 'verify.py')], {
    encoding: 'utf8', timeout: 180000, env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
  });
  let computed = null;
  if (py.error || py.status !== 0) {
    problems.push(`verify.py не отработал: ${py.error?.message ?? ''} ${String(py.stderr || '').trim().split(/\r?\n/).slice(-4).join(' | ')}`);
  } else {
    const last = String(py.stdout).trim().split(/\r?\n/).filter(Boolean).pop() || '';
    try { computed = JSON.parse(last); } catch { problems.push(`verify.py: последняя строка вывода не JSON: «${last.slice(0, 120)}»`); }
  }
  const accepts = (vals, answer, check) => {
    if (vals.length === 1 && lib.checkTaskAnswer(vals[0], answer, check || '')) return true;
    if (lib.checkAnswerFields(vals, answer, check || '').allCorrect) return true;
    return vals.length > 1 && lib.checkTaskAnswer(vals.join('; '), answer, check || '');
  };
  // Значение на единицу больше (первое число первого поля) — сайт должен его отвергнуть.
  const perturb = vals => {
    const first = String(vals[0]);
    const m = first.match(/-?\d+(?:\.\d+)?/);
    if (!m) return null;
    const bumped = String(Number(m[0]) + 1);
    return [first.slice(0, m.index) + bumped + first.slice(m.index + m[0].length), ...vals.slice(1)];
  };
  if (computed) {
    for (const [i, it] of items.entries()) {
      let vals = computed[String(i + 1)];
      if (vals === undefined) { bad(i, 'verify.py не дал значение для этой задачи'); continue; }
      vals = (Array.isArray(vals) ? vals : [vals]).map(v => String(v).trim());
      for (const [a, chk, lang] of [[it.a, it.chk, ''], [it.al, it.chkl ?? it.chk, ' (LV)']]) {
        if (!accepts(vals, a, chk)) bad(i, `пересчёт${lang}: сайт не принимает значение verify.py ${JSON.stringify(vals)} для ответа «${flat(a)}» — ошибка в ответе, в verify.py или в формате значения`);
        const wrong = perturb(vals);
        if (wrong && accepts(wrong, a, chk)) bad(i, `пересчёт${lang}: сайт принимает и неверное ${JSON.stringify(wrong)} — ответ не проверяется`);
      }
    }
  }

  console.log(`пачка ${batch}: задач ${items.length}, подтема ${meta.code} (id ${meta.sub}); проблем: ${problems.length}`);
  for (const p of problems) console.log('  ' + p);
  if (problems.length) { process.exitCode = 2; return; }
  if (!INSERT) { console.log('сухой прогон: всё чисто. Следующий шаг — тот же запуск с --insert.'); return; }

  // Вставка черновиками. Позиция — максимум по теме + 1 (publish.mjs потом перенумерует тему).
  const posRows = await fetchAll(`tasks?select=id,position&topic_id=eq.${meta.topic_id}&order=id`);
  let pos = posRows.reduce((m, t) => Math.max(m, t.position || 0), 0);
  const payload = rows.map(r => ({ ...r, position: ++pos, is_published: false }));
  const got = await rest('tasks', { method: 'POST', body: payload, prefer: 'return=representation' });
  const inserted = got.map((t, i) => ({ i, id: t.id }));
  writeJson(join(dir, 'inserted.json'), inserted);
  log({ type: 'inserted', batch, sub: meta.sub, code: meta.code, grade: meta.grade, ids: inserted.map(x => x.id) });
  console.log(`вставлено черновиков: ${got.length} | id: ${inserted.map(x => x.id).join(', ')}`);
  console.log(`Следующий шаг: node .claude/skills/add-tasks/scripts/publish.mjs ${batch}`);
}
