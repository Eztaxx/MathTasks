/*
 * Разбор задач: чертежи, подписи полей, варианты ответа, перевод.
 *
 * Четыре беды, которые видно только на большом числе задач:
 *   — на чертеже подписаны длины, углы и «?», хотя по правилу Skola2030
 *     числовые данные живут в тексте условия, а на рисунке только фигура
 *     и вершины (на графиках и диаграммах числа как раз обязательны);
 *   — перед полем ответа нет подписи, и ученик не знает, что вписывать;
 *   — верный ответ, записанный иначе (0,5 вместо 1/2), не принимается;
 *   — нет латышской версии условия, решения, подсказки или ответа.
 *
 * Запуск:  node scripts/audit-tasks.mjs [--grade 7] [--limit 12] [--id 710]
 *   --grade N  начиная с какого класса смотреть (по умолчанию 7)
 *   --limit N  сколько примеров показывать в каждом разделе
 *
 * Чертежи читаются из публичного бакета, поэтому прогон идёт дольше
 * остальных отчётов — это сетевые запросы, по одному на рисунок.
 */

import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const argv = process.argv.slice(2);
const numArg = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 ? Number(argv[i + 1]) : fallback;
};
const FROM_GRADE = numArg('--grade', 7);
const LIMIT = numArg('--limit', 12);
const ONLY_ID = numArg('--id', null);

function loadEnv() {
  return Object.fromEntries(
    readFileSync(ROOT + '.env', 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'))
      .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
  );
}

new Function(readFileSync(ROOT + 'public/lib.js', 'utf8'))();
const lib = globalThis.MathTasksLib;

/* ── 1. Чертёж ────────────────────────────────────────────────────
   Геометрический чертёж подписывают только вершинами: заглавными
   латинскими буквами. Числа, единицы, «?» и строчные подписи вроде «h»
   означают, что данные ушли из условия на картинку. График, диаграмма и
   числовая прямая — исключение: там числа и есть содержание. */
const GRAPH_MARKS = /<text[^>]*>\s*(?:[xyXY]|0|O)\s*<\/text>/;
const looksLikeChart = svg => /stroke-dasharray|marker-end|<path[^>]*d=['"][^'"]*[Cc]/.test(svg) === false
  && (/(<line|<polyline)[^>]*\b(x1|points)=/.test(svg) && GRAPH_MARKS.test(svg));

function drawingIssues(svg) {
  const texts = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => m[1].trim()).filter(Boolean);
  if (!texts.length) return null;
  // На графиках и числовых прямых числа обязательны — их не трогаем.
  if (looksLikeChart(svg)) return null;

  const withNumbers = texts.filter(t => /\d/.test(t));
  const withUnits = texts.filter(t => /(?<!\p{L})(см|мм|дм|км|м|кг|г|cm|mm|km|kg)(?!\p{L})/iu.test(t));
  const questions = texts.filter(t => t.includes('?'));
  const lowercase = texts.filter(t => /^[a-zа-яё]/u.test(t) && t.length <= 3);
  const found = [];
  if (withNumbers.length) found.push('числа: ' + withNumbers.slice(0, 5).join(', '));
  if (withUnits.length) found.push('единицы: ' + withUnits.slice(0, 5).join(', '));
  if (questions.length) found.push('знак вопроса');
  if (lowercase.length) found.push('строчные подписи: ' + lowercase.slice(0, 5).join(', '));
  return found.length ? found.join('; ') : null;
}

/* ── 3. Другие записи ответа ──────────────────────────────────────
   Ученик пишет верный ответ иначе: 0,5 вместо 1/2, 1,5 вместо 1½,
   без единицы. Проверяем, принимает ли сверка такие записи. */
// Значение без единицы: «10 км/ч» → «10», «40 см» → «40».
function bareValue(answer) {
  const inner = String(answer).replace(/\$/g, '').trim();
  const parts = lib.parseAnswerParts(inner);
  if (parts.length !== 1 || parts[0].pieceCount !== 1) return null;
  const value = parts[0].values[0];
  const bare = String(value).replace(/\\(?:text|mathrm)\{[^{}]*\}(\^\d)?\s*$/, '').trim();
  return bare && bare !== String(value).trim() ? bare : null;
}

function alternativeForms(answer) {
  const bare = String(answer).replace(/\$/g, '').trim();
  const forms = new Set();
  const add = value => { const v = String(value).trim(); if (v && v !== bare) forms.add(v); };

  // Дробь → десятичная и наоборот.
  const frac = bare.match(/^\\d?frac\{(-?\d+)\}\{(\d+)\}$/);
  if (frac) {
    const value = Number(frac[1]) / Number(frac[2]);
    if (Number.isFinite(value)) {
      add(String(value).replace('.', ','));
      add(`${frac[1]}/${frac[2]}`);
    }
  }
  const decimal = bare.match(/^(-?\d+)\{,\}(\d+)$/);
  if (decimal) {
    add(`${decimal[1]}.${decimal[2]}`);
    add(`${decimal[1]},${decimal[2]}`);
  }
  // Значение с единицей — ученик единицу часто не пишет.
  const withUnit = bare.match(/^(.+?)\\text\{\s*[^{}]+\s*\}(\^\d)?$/);
  if (withUnit) add(withUnit[1]);
  // Процент как доля.
  const percent = bare.match(/^(-?\d+(?:\{,\}\d+)?)\\?%$/);
  if (percent) add(percent[1].replace('{,}', ','));
  return [...forms];
}

async function main() {
  const env = loadEnv();
  const H = { apikey: env.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + env.SUPABASE_ANON_KEY };
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(env.SUPABASE_URL + '/rest/v1/tasks?select=id,grade,title,is_published,condition_latex,condition_latex_lv,solution_latex,solution_latex_lv,hint_latex,hint_latex_lv,answer_latex,answer_latex_lv,answer_check,condition_image,solution_image&order=id', { headers: { ...H, Range: `${from}-${from + 999}` } });
    const chunk = await res.json();
    if (!Array.isArray(chunk)) throw new Error('Supabase: ' + JSON.stringify(chunk).slice(0, 200));
    rows.push(...chunk);
    if (chunk.length < 1000) break;
  }

  const tasks = rows.filter(task => {
    if (ONLY_ID) return task.id === ONLY_ID;
    const grade = Number(task.grade);
    return Number.isFinite(grade) && grade >= FROM_GRADE;
  });

  const bad = { чертёж: [], подпись: [], записи: [], перевод: [] };

  for (const task of tasks) {
    const answer = (task.answer_latex || '').trim();
    const variants = task.answer_check || '';

    // 2. Подпись перед полем.
    if (answer && lib.isTaskAutoCheckable(answer, variants)
      && !lib.answerFields(answer, variants).length && !lib.answerLabelMarkup(answer)) {
      bad.подпись.push({ task, note: answer });
    }

    // 3. Другие записи ответа.
    if (answer) {
      const forms = alternativeForms(answer);
      const bare = bareValue(answer);
      if (bare) forms.push(bare);
      const rejected = forms.filter(form => !lib.checkTaskAnswer(form, answer, variants));
      if (rejected.length) bad.записи.push({ task, note: `${answer} — не принимает: ${rejected.join(', ')}` });
    }

    // 4. Перевод.
    const missing = [
      ['условие', task.condition_latex, task.condition_latex_lv],
      ['ответ', task.answer_latex, task.answer_latex_lv],
      ['решение', task.solution_latex, task.solution_latex_lv],
      ['подсказка', task.hint_latex, task.hint_latex_lv]
    ].filter(([, ru, lv]) => String(ru || '').trim() && !String(lv || '').trim()).map(([name]) => name);
    if (missing.length) bad.перевод.push({ task, note: 'нет по-латышски: ' + missing.join(', ') });

    // 1. Чертёж.
    for (const path of [task.condition_image, task.solution_image]) {
      if (!path || !path.endsWith('.svg')) continue;
      const res = await fetch(`${env.SUPABASE_URL}/storage/v1/object/public/task-images/${path}`);
      if (!res.ok) { bad.чертёж.push({ task, note: `файл не открылся (${res.status}): ${path}` }); continue; }
      const issue = drawingIssues(await res.text());
      if (issue) bad.чертёж.push({ task, note: issue });
    }
  }

  const line = (name, list) => `  ${name.padEnd(28)} ${String(list.length).padStart(4)}`;
  console.log(`\nЗадач с ${FROM_GRADE} класса: ${tasks.length} (опубликовано ${tasks.filter(t => t.is_published).length})\n`);
  console.log('Что стоит поправить:');
  console.log(line('лишнее на чертеже', bad.чертёж));
  console.log(line('нет подписи у поля', bad.подпись));
  console.log(line('не принимает запись ответа', bad.записи));
  console.log(line('нет перевода', bad.перевод));

  for (const [name, list] of Object.entries(bad)) {
    if (!list.length) continue;
    console.log(`\n── ${name} ──`);
    for (const item of list.slice(0, LIMIT)) {
      console.log(`  #${item.task.id} (${item.task.grade} кл.) ${item.note}`);
    }
    if (list.length > LIMIT) console.log(`  … и ещё ${list.length - LIMIT}`);
  }
  console.log('');
}

await main();
