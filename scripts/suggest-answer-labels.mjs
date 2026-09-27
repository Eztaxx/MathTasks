/*
 * Подписи к полям ответа: что можно проставить автоматически.
 *
 * Ученик должен вписывать только число, а что именно — говорит подпись над
 * полем: «Периметр =», «Время =», «AB =». Подпись берётся из ответа, но у
 * большинства задач ответ — голое значение, и подписи нет.
 *
 * Скрипт читает условие, ищет, какую величину спрашивают, и предлагает
 * переписать ответ как «Периметр = 48 см». Ничего не меняет без --apply:
 * по умолчанию это отчёт для глаз, потому что имя величины — смысл задачи,
 * и ошибиться здесь хуже, чем не подписать вовсе.
 *
 * Запуск:
 *   node scripts/suggest-answer-labels.mjs            — отчёт
 *   node scripts/suggest-answer-labels.mjs --limit 40 — больше примеров
 *   node scripts/suggest-answer-labels.mjs --apply    — записать в базу
 *
 * Перед --apply сделайте копию: npm run backup
 */

import { readFileSync } from 'node:fs';
import { fetchAll } from './lib/fetch-all.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const LIMIT = argv.includes('--limit') ? Number(argv[argv.indexOf('--limit') + 1]) : 20;

function loadEnv() {
  return Object.fromEntries(
    readFileSync(ROOT + '.env', 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'))
      .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
  );
}

new Function(readFileSync(ROOT + 'public/lib.js', 'utf8'))();
const lib = globalThis.MathTasksLib;

/* Правило подписи (словари величин, самопроверка) живёт в public/lib.js —
   answerLabelPlan: им же пользуется кнопка «Предложить подпись» в редакторе. */

async function main() {
  const env = loadEnv();
  const key = APPLY ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_ANON_KEY;
  const H = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
    /* Страницами по 1000: Supabase режет выдачу молча, и при росте базы
     хвост задач просто не попал бы в отчёт. */
  const tasks = await fetchAll(env.SUPABASE_URL + '/rest/v1/tasks?select=id,title,condition_latex,condition_latex_lv,answer_latex,answer_latex_lv,answer_check,answer_check_lv,is_published&order=id', H);

  const plan = [];
  const skipped = { естьПодпись: 0, несверяемые: 0, сложныйОтвет: 0, несколькоПолей: 0, неНашлиИмя: 0, подписьНеПрижилась: 0 };

  for (const task of tasks) {
    for (const lang of ['ru', 'lv']) {
      const result = lib.answerLabelPlan(task, lang);
      if (result.skip) { skipped[result.skip]++; continue; }
      plan.push({ task, lang, ...result });
    }
  }

  console.log(`\nзадач: ${tasks.length}`);
  console.log(`подпись можно проставить: ${plan.length}`);
  for (const [name, n] of Object.entries(skipped)) console.log(`  пропущено — ${name}: ${n}`);

  console.log('\n── что получится ──');
  for (const item of plan.slice(0, LIMIT)) {
    console.log(`  #${item.task.id} ${item.lang.toUpperCase()} (${item.suggestion.kind})`);
    console.log(`      было:  ${item.answer}`);
    console.log(`      стало: ${item.next}`);
  }
  if (plan.length > LIMIT) console.log(`  … и ещё ${plan.length - LIMIT}`);

  if (!APPLY) {
    console.log('\nНичего не изменено. Записать: node scripts/suggest-answer-labels.mjs --apply (сначала npm run backup).');
    return;
  }

  let done = 0;
  for (const item of plan) {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/tasks?id=eq.${item.task.id}`, {
      method: 'PATCH',
      headers: { ...H, Prefer: 'return=minimal' },
      body: JSON.stringify(item.lang === 'lv' ? { answer_latex_lv: item.next } : { answer_latex: item.next })
    });
    if (!response.ok) {
      console.log(`  #${item.task.id}: ошибка ${response.status} ${(await response.text()).slice(0, 120)}`);
      continue;
    }
    done++;
  }
  console.log(`\nзаписано: ${done} из ${plan.length}`);
}

await main();
