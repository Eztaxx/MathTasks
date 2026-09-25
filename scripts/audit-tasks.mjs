/*
 * Разбор задач: то же, что показывает админка в очереди проверки.
 *
 * Правила живут в public/lib.js (auditTask) — один разбор на админку и
 * терминал. Что он ловит на большом числе задач:
 *   — верный ответ, записанный как пишет ученик (0,5 вместо 1/2, без
 *     единицы, «1 1/2»), не принимается;
 *   — нет латышской версии условия, ответа, решения или подсказки;
 *   — числа в русском и латышском условии или ответе разные: правку
 *     сделали в одном языке, а во втором остались старые данные;
 *   — в конце решения другой ответ, чем в поле «Ответ»;
 *   — перед полем ответа нет подписи, и ученик не знает, что вписывать;
 *   — на чертеже подписаны длины, углы и «?», хотя по правилу Skola2030
 *     числовые данные живут в тексте условия (графики — исключение);
 *   — дроби в теме 5–6 класса, где их ещё не проходили.
 *
 * Запуск:  node scripts/audit-tasks.mjs [--grade 7] [--limit 12] [--id 710] [--drafts]
 *   --grade N  начиная с какого класса смотреть (по умолчанию 7)
 *   --limit N  сколько примеров показывать в каждом разделе
 *   --drafts   черновики вместо опубликованных — нужен ключ service_role
 *              из .env: анонимный ключ черновиков не видит
 *
 * Чертежи читаются из публичного бакета, поэтому прогон идёт дольше
 * остальных отчётов — это сетевые запросы, по одному на рисунок.
 */

import { readFileSync } from 'node:fs';
import { fetchAll } from './lib/fetch-all.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const argv = process.argv.slice(2);
const numArg = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 ? Number(argv[i + 1]) : fallback;
};
const FROM_GRADE = numArg('--grade', 7);
const LIMIT = numArg('--limit', 12);
const ONLY_ID = numArg('--id', null);
const DRAFTS = argv.includes('--drafts');

function loadEnv() {
  return Object.fromEntries(
    readFileSync(ROOT + '.env', 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'))
      .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
  );
}

new Function(readFileSync(ROOT + 'public/lib.js', 'utf8'))();
const lib = globalThis.MathTasksLib;

// Разделы отчёта: код проверки из auditTask → заголовок.
const SECTIONS = [
  ['accept', 'не принимает запись ответа'],
  ['selfcheck', 'самопроверка вместо автопроверки'],
  ['translation', 'нет перевода'],
  ['numbers', 'числа RU и LV разные'],
  ['ending', 'другой ответ в конце решения'],
  ['answer', 'нет ответа или решения'],
  ['label', 'нет подписи у поля'],
  ['drawing', 'лишнее на чертеже'],
  ['young', 'дроби в 5–6 классе']
];

async function main() {
  const env = loadEnv();
  const key = DRAFTS ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_ANON_KEY;
  if (!key) throw new Error(DRAFTS ? 'Для --drafts нужен SUPABASE_SERVICE_ROLE_KEY в .env' : 'Нет SUPABASE_ANON_KEY в .env');
  const H = { apikey: key, Authorization: 'Bearer ' + key };
  // Страницами, в однозначном порядке — см. lib/fetch-all.mjs.
  const rows = await fetchAll(env.SUPABASE_URL + '/rest/v1/tasks?select=*&order=id', H);
  const topics = await fetchAll(env.SUPABASE_URL + '/rest/v1/topics?select=id,title,grade&order=id', H);

  const tasks = rows.filter(task => {
    if (ONLY_ID) return task.id === ONLY_ID;
    if (Boolean(task.is_published) === DRAFTS) return false;
    const grade = Number(task.grade);
    return Number.isFinite(grade) && grade >= FROM_GRADE;
  });

  const svgCache = new Map();
  async function drawingOf(task) {
    const found = [];
    for (const path of [task.condition_image, task.solution_image]) {
      if (!path) continue;
      const raw = String(path).trim();
      if (raw.startsWith('<svg')) { found.push(lib.drawingIssues(raw)); continue; }
      if (!raw.endsWith('.svg')) continue;
      if (!svgCache.has(raw)) {
        const res = await fetch(`${env.SUPABASE_URL}/storage/v1/object/public/task-images/${raw}`);
        svgCache.set(raw, res.ok ? lib.drawingIssues(await res.text()) : `файл не открылся (${res.status}): ${raw}`);
      }
      found.push(svgCache.get(raw));
    }
    return found.filter(Boolean).join('; ') || null;
  }

  const bad = Object.fromEntries(SECTIONS.map(([code]) => [code, []]));
  let clean = 0;
  for (const task of tasks) {
    const topic = topics.find(item => item.id === task.topic_id);
    const issues = lib.taskIssues(task, { grade: task.grade ?? topic?.grade, topicTitle: topic?.title, drawing: await drawingOf(task) });
    if (!issues.length) clean++;
    for (const issue of issues) {
      // Ответ, который не сверить автоматически, — не то же, что непринятый.
      const section = issue.code === 'accept' && issue.level === 'warn' ? 'selfcheck' : issue.code;
      bad[section]?.push({ task, note: issue.text });
    }
  }

  const line = (name, list) => `  ${name.padEnd(34)} ${String(list.length).padStart(4)}`;
  console.log(`\n${DRAFTS ? 'Черновиков' : 'Задач'} с ${FROM_GRADE} класса: ${tasks.length}; без замечаний: ${clean}\n`);
  console.log('Что стоит поправить:');
  for (const [code, name] of SECTIONS) console.log(line(name, bad[code]));

  for (const [code, name] of SECTIONS) {
    const list = bad[code];
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
