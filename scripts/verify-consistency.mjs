#!/usr/bin/env node
/*
 * Сверка ответа с концовкой решения — на обоих языках.
 *
 * Численная подстановка (scripts/verify-answers.mjs) достаёт немногое:
 * слово «решите» есть лишь у 29 условий из 435, остальное — прикладные
 * и текстовые задачи, где уравнения в условии нет вовсе. Эта проверка
 * берёт их все и смотрит на другое: совпадает ли поле «Ответ» с тем,
 * чем заканчивается разбор, и совпадают ли между собой концовки русской
 * и латышской версий.
 *
 * Ошибку она ловит другую, но не менее частую: ответ переписали, а
 * решение осталось прежним, или перевод свернул не туда.
 *
 * Запуск:  node scripts/verify-consistency.mjs [--verbose]
 */

import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const VERBOSE = process.argv.includes('--verbose');

const env = Object.fromEntries(
  readFileSync(ROOT + '.env', 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);

/* Концовка разбора: последняя строка, начинающаяся со слова «Ответ». */
const FINAL_RU = /(?:^|\n)\s*(?:\*\*)?\s*Ответ\s*[:—-]\s*(.+?)\s*$/i;
const FINAL_LV = /(?:^|\n)\s*(?:\*\*)?\s*Atbilde\s*[:—-]\s*(.+?)\s*$/i;

const finalAnswer = (text, re) => {
  const m = String(text || '').match(re);
  return m ? m[1].trim() : null;
};

/* Сравниваем по существу, а не по написанию: пробелы, оформление скобок
   и способ записи дроби к смыслу не относятся. */
const canon = str => String(str || '')
  .replace(/\$/g, '')
  .replace(/\\left|\\right|\\;|\\,|\\quad|\\qquad|\\!/g, '')
  .replace(/\\dfrac/g, '\\frac')
  .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)')
  .replace(/\\text\{([^{}]*)\}/g, '$1')
  .replace(/(\d)\{,\}(\d)/g, '$1.$2')
  .replace(/(\d),(\d)/g, '$1.$2')
  .replace(/\\(cdot|times)/g, '*')
  .replace(/\\infty/g, 'inf')
  .replace(/\\in\b/g, 'in')
  .replace(/\\cup/g, 'U')
  .replace(/[.,;]+$/, '')
  .replace(/\s+/g, '')
  .toLowerCase();

/* Числа — самое надёжное, что можно сравнить у двух записей одного
   ответа: обозначения и слова у языков разные, значения обязаны совпасть. */
const numbersOf = str => (canon(str)
  /* Индексы при переменной — подписи, а не значения: «x_1 = -1» и
     «-1» несут одно и то же число. Без этой строки любая запись с
     индексами даёт ложное расхождение. */
  .replace(/_\{[^}]*\}/g, '')
  .replace(/_\d+/g, '')
  .match(/-?\d+(?:\.\d+)?/g) || [])
  .map(Number).sort((a, b) => a - b).join(',');

const H = { apikey: env.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + env.SUPABASE_ANON_KEY };
const tasks = await (await fetch(env.SUPABASE_URL
  + '/rest/v1/tasks?select=id,title,grade,answer_latex,answer_latex_lv,solution_latex,solution_latex_lv&order=id',
  { headers: H })).json();

const issues = { answerVsRu: [], answerVsLv: [], ruVsLv: [] };
let withFinalRu = 0, withFinalLv = 0;

for (const t of tasks) {
  const ru = finalAnswer(t.solution_latex, FINAL_RU);
  const lv = finalAnswer(t.solution_latex_lv, FINAL_LV);
  if (ru) withFinalRu++;
  if (lv) withFinalLv++;

  const A = numbersOf(t.answer_latex);
  const Alv = numbersOf(t.answer_latex_lv);

  if (ru && A && numbersOf(ru) !== A) {
    issues.answerVsRu.push({ ...t, stated: ru });
  }
  if (lv && Alv && numbersOf(lv) !== Alv) {
    issues.answerVsLv.push({ ...t, stated: lv });
  }
  /* Концовки двух языков должны нести одни и те же числа. Именно здесь
     видно перевод, который решил задачу по-своему. */
  if (ru && lv && numbersOf(ru) !== numbersOf(lv)) {
    issues.ruVsLv.push({ ...t, ru, lv });
  }
}

console.log(`Задач: ${tasks.length}`);
console.log(`Решений, заканчивающихся словом «Ответ»:  ${withFinalRu}`);
console.log(`Решений, заканчивающихся словом «Atbilde»: ${withFinalLv}\n`);

const report = (title, list, render) => {
  console.log(`══ ${title}: ${list.length} ══`);
  for (const x of (VERBOSE ? list : list.slice(0, 12))) {
    console.log(`\nid ${x.id} · ${x.grade} кл · «${x.title}»`);
    render(x);
  }
  if (!VERBOSE && list.length > 12) console.log(`\n… ещё ${list.length - 12}, покажет --verbose`);
  console.log();
};

report('Ответ не сходится с концовкой русского решения', issues.answerVsRu, x => {
  console.log(`  поле «Ответ»:      ${x.answer_latex}`);
  console.log(`  конец разбора:     ${x.stated}`);
});
report('Ответ не сходится с концовкой латышского решения', issues.answerVsLv, x => {
  console.log(`  поле «Atbilde»:    ${x.answer_latex_lv}`);
  console.log(`  конец разбора:     ${x.stated}`);
});
report('Русская и латышская концовки расходятся между собой', issues.ruVsLv, x => {
  console.log(`  ru: ${x.ru}`);
  console.log(`  lv: ${x.lv}`);
});

const total = issues.answerVsRu.length + issues.answerVsLv.length + issues.ruVsLv.length;
console.log(total ? `Всего расхождений: ${total}` : 'Расхождений нет.');
process.exit(total ? 1 : 0);
