/*
 * Отчёт: как ученик вводит ответ и что из этого проверяется само.
 *
 * Решения про ввод ответа до сих пор принимались на глаз: «кажется, таких
 * задач немного». Скрипт считает, сколько их на самом деле, и заодно ловит
 * две беды, которые иначе всплывают только в жалобах:
 *   — задача без автопроверки: ученику остаётся самопроверка «сошлось /
 *     не сошлось», и прогресс держится на его честности;
 *   — ответ, который не принимает сам себя: если checkTaskAnswer(эталон,
 *     эталон) ложно, то верный ответ ученика не засчитается никогда.
 *
 * Запуск:  node scripts/answer-input-report.mjs [--verbose] [--limit 20]
 *
 * Строки #!/usr/bin/env node нет намеренно — по той же причине, что и в
 * verify-answers.mjs: на Windows CRLF ломает импорт модуля в vitest.
 */

import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/* lib.js — браузерный файл: он не модуль ESM, а IIFE, которая кладёт себя
   в globalThis. Импортировать его отсюда нельзя (тесты это делают через
   vitest), поэтому просто исполняем текст и берём то, что он положил. */
new Function(readFileSync(ROOT + 'public/lib.js', 'utf8'))();
const { answerFields, checkTaskAnswer, isTaskAutoCheckable, answerLabelMarkup } = globalThis.MathTasksLib;
const argv = process.argv.slice(2);
const VERBOSE = argv.includes('--verbose');
const LIMIT = argv.includes('--limit') ? Number(argv[argv.indexOf('--limit') + 1]) : 12;

function loadEnv() {
  return Object.fromEntries(
    readFileSync(ROOT + '.env', 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'))
      .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
  );
}

const pad = (value, width) => String(value).padStart(width);
const short = text => String(text || '').replace(/\s+/g, ' ').trim().slice(0, 70);

async function main() {
  const env = loadEnv();
  const H = { apikey: env.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + env.SUPABASE_ANON_KEY };
  // Страницами по 1000: Supabase режет выдачу молча.
  const readAll = async path => {
    const rows = [];
    for (let from = 0; ; from += 1000) {
      const res = await fetch(env.SUPABASE_URL + path, { headers: { ...H, Range: `${from}-${from + 999}` } });
      const chunk = await res.json();
      if (!Array.isArray(chunk)) throw new Error('Supabase: ' + JSON.stringify(chunk).slice(0, 200));
      rows.push(...chunk);
      if (chunk.length < 1000) return rows;
    }
  };

  const tasks = await readAll('/rest/v1/tasks?select=id,title,answer_latex,answer_check,is_published&order=id');
  const kinds = { empty: [], manual: [], fields: [], label: [], plain: [] };
  const broken = [];

  for (const task of tasks) {
    const answer = task.answer_latex || '';
    const variants = task.answer_check || '';
    if (!answer.trim()) { kinds.empty.push(task); continue; }
    if (!isTaskAutoCheckable(answer, variants)) { kinds.manual.push(task); continue; }

    // Эталон обязан приниматься сам собой — иначе верный ответ не засчитается.
    if (!checkTaskAnswer(answer, answer, variants)) broken.push(task);

    const fields = answerFields(answer, variants);
    if (fields.length) {
      kinds.fields.push({ task, fields });
      // Склейка значений через «;» — то, что уходит в проверку из полей.
      const joined = fields.map(field => field.value).join('; ');
      if (!checkTaskAnswer(joined, answer, variants)) {
        broken.push({ ...task, why: 'разбор по полям не сходится с проверкой' });
      }
      continue;
    }
    if (answerLabelMarkup(answer)) kinds.label.push(task);
    else kinds.plain.push(task);
  }

  const total = tasks.length;
  const row = (name, list) => `  ${name.padEnd(42)} ${pad(list.length, 4)}  ${pad((list.length / total * 100).toFixed(1), 5)} %`;

  console.log(`\nЗадач в базе: ${total} (опубликовано ${tasks.filter(t => t.is_published).length})\n`);
  console.log('Как ученик вводит ответ:');
  console.log(row('несколько полей по величинам', kinds.fields));
  console.log(row('одно поле с подписью «x =»', kinds.label));
  console.log(row('одно поле, ответ строкой', kinds.plain));
  console.log(row('самопроверка: автоматом не сверить', kinds.manual));
  console.log(row('ответа нет вовсе', kinds.empty));

  console.log(`\nДополнительные записи ответа (answer_check) заполнены у ${tasks.filter(t => (t.answer_check || '').trim()).length} задач.`);

  if (broken.length) {
    console.log(`\n⚠ Ответы, которые не принимают сами себя — ${broken.length}:`);
    for (const task of broken.slice(0, LIMIT)) {
      console.log(`   #${task.id} ${short(task.title)}`);
      console.log(`      ${short(task.answer_latex)}${task.why ? '   — ' + task.why : ''}`);
    }
    if (broken.length > LIMIT) console.log(`   … и ещё ${broken.length - LIMIT}`);
  } else {
    console.log('\n✓ Каждый ответ принимает сам себя.');
  }

  console.log(`\nСамопроверка вместо автопроверки — ${kinds.manual.length} задач:`);
  for (const task of kinds.manual.slice(0, LIMIT)) {
    console.log(`   #${task.id} ${short(task.answer_latex)}`);
  }
  if (kinds.manual.length > LIMIT) console.log(`   … и ещё ${kinds.manual.length - LIMIT}`);

  if (VERBOSE) {
    console.log('\nЗадачи с несколькими полями:');
    for (const { task, fields } of kinds.fields.slice(0, LIMIT)) {
      console.log(`   #${task.id} ${fields.map(f => `${f.label} [   ] ${f.unit}`.trim()).join('   ')}`);
    }
  }
  console.log('');
}

await main();
