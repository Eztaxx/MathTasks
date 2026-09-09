/* Раскладывает задачи по подтемам внутри их темы.
 *
 * По умолчанию — сухой прогон с отчётом. Запись: --apply
 * Только не размеченные задачи: --only-empty (по умолчанию да), --all перезапишет.
 *
 * Совпадение считаем по словам условия и названия задачи против названия
 * подтемы. Русская морфология мешает сравнивать слова целиком («уравнение»
 * и «уравнений» — разные строки), поэтому слова режем до корня в шесть
 * букв. Формулы из условия выбрасываем: в них нет слов, зато полно
 * латинских букв, которые дают ложные совпадения.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');
const ALL = process.argv.includes('--all');
const OUT = process.argv.includes('--report');

const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env'), 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error('нет SUPABASE_SERVICE_ROLE_KEY в .env'); process.exit(1); }
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

const api = async (method, path, body) => {
  const res = await fetch(env.SUPABASE_URL + '/rest/v1/' + path, {
    method, headers: H, body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
};
const getAll = async (path) => {
  const out = [];
  for (let f = 0; ; f += 1000) {
    const res = await fetch(env.SUPABASE_URL + '/rest/v1/' + path, { headers: { ...H, Range: `${f}-${f + 999}` } });
    const part = await res.json();
    out.push(...part);
    if (part.length < 1000) break;
  }
  return out;
};

/* ── Разбор текста ────────────────────────────────────────────────────── */

const СТОП = new Set(['для', 'что', 'как', 'при', 'над', 'под', 'его', 'это', 'если', 'чему', 'равно',
  'найдите', 'найти', 'вычислите', 'вычислить', 'решите', 'решить', 'определите', 'докажите',
  'задача', 'дано', 'ответ', 'сколько', 'какой', 'какая', 'какие', 'между', 'через', 'после',
  'может', 'нужно', 'будет', 'один', 'два', 'три', 'все', 'его', 'она', 'они']);

/* Хвосты русских слов различаются падежом, а корень — нет. Шести букв
   хватает, чтобы «треугольника» и «треугольник» сошлись, но «дробь» и
   «дроблени» разошлись. */
const корень = w => w.length > 6 ? w.slice(0, 6) : w;

const слова = text => {
  const без = String(text || '')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')   // выключные формулы
    .replace(/\$[^$]*\$/g, ' ')          // инлайн-формулы
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase();
  return без.replace(/[^а-яёa-z]+/gi, ' ').split(/\s+/)
    .filter(w => w.length > 3 && !СТОП.has(w))
    .map(корень);
};

/* Слова названия подтемы весят больше, чем слова условия: подтему задаёт
   тема разговора, а не то, какие числа попались в условии. */
const оценка = (задача, подтема) => {
  const тНабор = new Set(слова(`${подтема.title} ${подтема.title_lv || ''}`));
  if (!тНабор.size) return 0;
  const заголовок = new Set(слова(задача.title));
  const условие = new Set(слова(`${задача.condition_latex || ''} ${задача.answer_latex || ''}`));
  let балл = 0;
  for (const w of тНабор) {
    if (заголовок.has(w)) балл += 3;
    else if (условие.has(w)) балл += 1;
  }
  return балл / тНабор.size;
};

/* ── Данные ───────────────────────────────────────────────────────────── */

const [topics, subs, tasks] = await Promise.all([
  getAll('topics?select=id,title,grade,position'),
  getAll('subtopics?select=id,topic_id,code,title,title_lv,position'),
  getAll('tasks?select=id,topic_id,subtopic_id,title,condition_latex,answer_latex'),
]);
const темаПоId = new Map(topics.map(t => [t.id, t]));
const подтемыТемы = new Map();
for (const s of subs) {
  if (!подтемыТемы.has(s.topic_id)) подтемыТемы.set(s.topic_id, []);
  подтемыТемы.get(s.topic_id).push(s);
}

const кандидаты = tasks.filter(t => t.topic_id && (ALL || !t.subtopic_id));

const ПОРОГ = 0.34;   // ниже — совпало одно случайное слово из трёх
const решения = [];
const слабые = [];
const безПодтем = [];

for (const task of кандидаты) {
  const список = подтемыТемы.get(task.topic_id) || [];
  if (!список.length) { безПодтем.push(task); continue; }
  const ранжир = список.map(s => ({ s, балл: оценка(task, s) })).sort((a, b) => b.балл - a.балл);
  const [первый, второй] = ранжир;
  /* Отрыв от второго места важнее самого балла: две подтемы с одинаковым
     весом означают, что текст не различает их, и выбор был бы монеткой. */
  const отрыв = первый.балл - (второй?.балл ?? 0);
  const строка = {
    id: task.id, title: task.title, topic: темаПоId.get(task.topic_id)?.title || '?',
    code: первый.s.code, sub: первый.s.title, subtopic_id: первый.s.id,
    балл: +первый.балл.toFixed(2), отрыв: +отрыв.toFixed(2),
    второй: второй ? `${второй.s.code} ${второй.s.title} (${второй.балл.toFixed(2)})` : '—',
  };
  if (первый.балл >= ПОРОГ && отрыв > 0.001) решения.push(строка);
  else слабые.push(строка);
}

console.log(`Задач с темой: ${tasks.filter(t => t.topic_id).length}`);
console.log(`Разбираем: ${кандидаты.length}${ALL ? ' (все)' : ' (только без подтемы)'}`);
console.log(`✓ уверенно: ${решения.length}`);
console.log(`? слабо или ничья: ${слабые.length}`);
console.log(`— в теме нет подтем: ${безПодтем.length}`);

if (OUT) {
  writeFileSync(join(ROOT, 'docs/subtopic-assignment.json'),
    JSON.stringify({ решения, слабые, безПодтем: безПодтем.map(t => ({ id: t.id, title: t.title })) }, null, 1), 'utf8');
  console.log('\nОтчёт: docs/subtopic-assignment.json');
}

console.log('\n── Примеры уверенных (первые 15) ──');
решения.slice(0, 15).forEach(r =>
  console.log(`  ${r.балл}/${r.отрыв}  #${r.id} «${r.title.slice(0, 46)}»\n        → ${r.code} ${r.sub.slice(0, 60)}`));

console.log('\n── Примеры слабых (первые 10) ──');
слабые.slice(0, 10).forEach(r =>
  console.log(`  ${r.балл}/${r.отрыв}  #${r.id} «${r.title.slice(0, 46)}»\n        лучший: ${r.code} ${r.sub.slice(0, 55)}\n        второй: ${r.второй.slice(0, 60)}`));

if (!APPLY) { console.log('\nСухой прогон. Запись: --apply'); process.exit(0); }

console.log('\n=== запись ===');
/* Пишем группами по одной подтеме: PATCH с фильтром in.() экономит
   четыре сотни запросов. */
const поПодтеме = new Map();
for (const r of решения) {
  if (!поПодтеме.has(r.subtopic_id)) поПодтеме.set(r.subtopic_id, []);
  поПодтеме.get(r.subtopic_id).push(r.id);
}
let записано = 0;
for (const [subId, ids] of поПодтеме) {
  await api('PATCH', `tasks?id=in.(${ids.join(',')})`, { subtopic_id: subId });
  записано += ids.length;
}
console.log(`проставлено подтем: ${записано}`);
