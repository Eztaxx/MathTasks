#!/usr/bin/env node
/*
 * Проверка, что русская и латышская версии — это одна и та же задача.
 *
 * Найдено на задаче 221: по-русски там масштаб карты и ответ «7,5 км»,
 * по-латышски — коэффициент подобия двух треугольников и ответ «k = 2».
 * Одна строка базы, две разные задачи. Латышский посетитель читает
 * условие, которого русский никогда не увидит, и наоборот.
 *
 * Сравниваем значащие числа условий. Индексы, степени и мелочь вроде
 * «1» и «2» из обозначений отбрасываем: они совпадают у чего угодно и
 * прячут настоящее расхождение — на 221 именно единица из $S_1$ и
 * скрыла подмену.
 *
 * Запуск:  node scripts/verify-language-pairing.mjs
 */

import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const env = Object.fromEntries(
  readFileSync(ROOT + '.env', 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);

/* Значащее число: не индекс, не показатель степени и не единица-двойка
   из обозначений. Всё остальное — данные задачи, и они обязаны совпасть. */
const meaningful = text => {
  const s = String(text || '')
    .replace(/_\{[^}]*\}/g, ' ')
    .replace(/_\d+/g, ' ')
    .replace(/\^\{[^}]*\}/g, ' ')
    .replace(/\^\d+/g, ' ')
    .replace(/\\,/g, '')          // 100\,000 — это одно число, а не два
    .replace(/\{,\}/g, '.');
  return new Set((s.match(/\d+(?:\.\d+)?/g) || []).map(Number).filter(n => n > 3));
};

const H = { apikey: env.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + env.SUPABASE_ANON_KEY };
const tasks = await (await fetch(env.SUPABASE_URL
  + '/rest/v1/tasks?select=id,title,title_lv,grade,topic_id,condition_latex,condition_latex_lv,answer_latex,answer_latex_lv&order=id',
  { headers: H })).json();
const topics = await (await fetch(env.SUPABASE_URL + '/rest/v1/topics?select=id,title', { headers: H })).json();
const tname = id => topics.find(t => t.id === id)?.title ?? '—';

const broken = [];
let compared = 0;
for (const t of tasks) {
  if (!t.condition_latex || !t.condition_latex_lv) continue;
  const a = meaningful(t.condition_latex), b = meaningful(t.condition_latex_lv);
  if (!a.size || !b.size) continue;   // условия без чисел так не сверить
  compared++;
  if (![...a].some(x => b.has(x))) broken.push({ ...t, a: [...a], b: [...b] });
}

console.log(`Сравнено задач: ${compared} из ${tasks.length}`);
console.log(`Версии не совпадают: ${broken.length}\n`);

for (const s of broken) {
  console.log(`──── id ${s.id} · ${s.grade} кл · тема «${tname(s.topic_id)}»`);
  console.log(`  ru: ${s.title}`);
  console.log(`      ${String(s.condition_latex).replace(/\n/g, ' ').slice(0, 140)}`);
  console.log(`      ответ ${s.answer_latex}   · числа [${s.a.join(', ')}]`);
  console.log(`  lv: ${s.title_lv}`);
  console.log(`      ${String(s.condition_latex_lv).replace(/\n/g, ' ').slice(0, 140)}`);
  console.log(`      ответ ${s.answer_latex_lv}   · числа [${s.b.join(', ')}]\n`);
}

console.log(broken.length
  ? '✗ Это разные задачи в одной строке — нужна правка вручную.'
  : '✓ Русская и латышская версии описывают одну и ту же задачу.');
process.exit(broken.length ? 1 : 0);
