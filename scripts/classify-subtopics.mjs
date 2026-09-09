/* Раскладывает задачи по подтемам их темы через Gemini.
 *
 * Разбор по словам справляется меньше чем с половиной: «Боковая сторона
 * равнобедренного треугольника» по общим словам уезжала в «Окружность и её
 * длина». Поэтому решение принимает модель, но выбор у неё закрытый —
 * только подтемы той темы, где задача уже лежит, так что промахнуться
 * мимо темы она не может.
 *
 * Сухой прогон по умолчанию, запись: --apply
 * Заново разложить уже размеченные: --all
 */
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');
const ALL = process.argv.includes('--all');

const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env'), 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI = env.GEMINI_API_KEY;
if (!KEY || !GEMINI) { console.error('нужны SUPABASE_SERVICE_ROLE_KEY и GEMINI_API_KEY в .env'); process.exit(1); }
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

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Node буферизует stdout, когда его читает другой процесс, и за долгий
   разбор наружу не выходит ни строчки. Ход пишем ещё и в файл — по нему
   видно, работа идёт или модель встала. */
const LOG = join(ROOT, 'docs/subtopic-assignment.log');
const лог = line => {
  const s = new Date().toISOString().slice(11, 19) + '  ' + line;
  console.log(s);
  try { appendFileSync(LOG, s + '\n', 'utf8'); } catch {}
};

/* Квота считается на каждую модель отдельно: gemini-3.6-flash упирается в
   лимит бесплатного тарифа заметно раньше остальных. Держим список и
   переходим к следующей, а не ждём впустую на исчерпанной. */
const МОДЕЛИ = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.5-flash-lite'];
let модель = 0;

async function ask(prompt) {
  let последняя = '';
  for (let attempt = 0; attempt < 6; attempt++) {
    const name = МОДЕЛИ[модель];
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent?key=${encodeURIComponent(GEMINI)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0, maxOutputTokens: 8192 },
        }),
      });
    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('пустой ответ модели');
      return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
    }
    последняя = `${name} ${res.status}: ${(await res.text()).slice(0, 120).replace(/\s+/g, ' ')}`;
    if (res.status === 404 || res.status === 429) {
      if (модель < МОДЕЛИ.length - 1) { модель++; лог(`переключаюсь на ${МОДЕЛИ[модель]} (${последняя.slice(0, 60)})`); continue; }
    } else if (res.status !== 503 && res.status !== 500) {
      throw new Error(последняя);
    }
    await sleep(4000 * (attempt + 1));
  }
  throw new Error('не ответил ни один вариант — ' + последняя);
}

/* Условие режем: модели хватает первых строк, чтобы узнать навык, а
   полные разборы на две страницы упёрлись бы в лимит ответа. */
const кратко = (s, n = 320) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

const [topics, subs, tasks] = await Promise.all([
  getAll('topics?select=id,title,grade,position'),
  getAll('subtopics?select=id,topic_id,code,title,position'),
  getAll('tasks?select=id,topic_id,subtopic_id,title,condition_latex'),
]);

const подтемыТемы = new Map();
for (const s of subs) {
  if (!подтемыТемы.has(s.topic_id)) подтемыТемы.set(s.topic_id, []);
  подтемыТемы.get(s.topic_id).push(s);
}
for (const list of подтемыТемы.values()) list.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

const кандидаты = tasks.filter(t => t.topic_id && подтемыТемы.has(t.topic_id) && (ALL || !t.subtopic_id));
const поТеме = new Map();
for (const t of кандидаты) {
  if (!поТеме.has(t.topic_id)) поТеме.set(t.topic_id, []);
  поТеме.get(t.topic_id).push(t);
}

console.log(`Задач к разбору: ${кандидаты.length} в ${поТеме.size} темах`);
console.log(`Без подтем в теме (10–12 класс и внепрограммные): ${tasks.filter(t => t.topic_id && !подтемыТемы.has(t.topic_id)).length}\n`);

const ПАЧКА = 15;
const решения = [];   // { id, subtopic_id, code, title, sub }
const непонятые = [];
let обработано = 0;

for (const [topicId, список] of поТеме) {
  const topic = topics.find(t => t.id === topicId);
  const подтемы = подтемыТемы.get(topicId);
  const меню = подтемы.map(s => `${s.code} — ${s.title}`).join('\n');

  for (let i = 0; i < список.length; i += ПАЧКА) {
    const пачка = список.slice(i, i + ПАЧКА);
    const перечень = пачка.map(t => `${t.id}. ${кратко(t.title, 120)} | ${кратко(t.condition_latex)}`).join('\n');
    const prompt = `Ты — методист математики, работающий по латвийскому стандарту Skola2030.

Тема «${topic.title}» (${topic.grade} класс) разбита на подтемы:
${меню}

Ниже задачи этой темы в формате «id. название | условие». Для каждой определи, к какой подтеме она относится по сути проверяемого навыка.

${перечень}

Верни строго JSON-объект без пояснений: ключ — id задачи строкой, значение — номер подтемы строкой (например "${подтемы[0].code}"). Если задача не подходит ни к одной подтеме, значение — null. Номера бери только из списка выше, новых не придумывай. Ответ должен содержать все ${пачка.length} id.`;

    let ответ;
    try {
      ответ = await ask(prompt);
    } catch (err) {
      лог(`✗ ${topic.title.slice(0, 40)}: ${err.message}`);
      пачка.forEach(t => непонятые.push({ id: t.id, title: t.title, причина: err.message.slice(0, 60) }));
      continue;
    }

    for (const t of пачка) {
      const code = ответ[String(t.id)] ?? ответ[t.id];
      const sub = code ? подтемы.find(s => s.code === String(code).trim()) : null;
      if (sub) решения.push({ id: t.id, subtopic_id: sub.id, code: sub.code, title: t.title, sub: sub.title });
      else непонятые.push({ id: t.id, title: t.title, причина: code ? `неизвестный номер ${code}` : 'модель не отнесла' });
    }
    обработано += пачка.length;
    лог(`разобрано ${обработано} из ${кандидаты.length} — ${topic.title.slice(0, 44)}`);
    await sleep(1200);
  }
}
console.log('');

console.log(`\n✓ разложено: ${решения.length}`);
console.log(`? не отнесено: ${непонятые.length}`);

const поПодтеме = new Map();
for (const r of решения) поПодтеме.set(r.code, (поПодтеме.get(r.code) || 0) + 1);
console.log(`заполнено подтем: ${поПодтеме.size} из ${subs.length}`);

writeFileSync(join(ROOT, 'docs/subtopic-assignment.json'),
  JSON.stringify({ решения, непонятые }, null, 1), 'utf8');
console.log('Отчёт: docs/subtopic-assignment.json');

console.log('\n── Первые 20 ──');
решения.slice(0, 20).forEach(r => console.log(`  #${r.id} «${r.title.slice(0, 48)}»\n      → ${r.code} ${r.sub.slice(0, 60)}`));
if (непонятые.length) {
  console.log('\n── Не отнесены ──');
  непонятые.slice(0, 15).forEach(r => console.log(`  #${r.id} «${r.title.slice(0, 48)}» — ${r.причина}`));
}

if (!APPLY) { console.log('\nСухой прогон. Запись: --apply'); process.exit(0); }

console.log('\n=== запись ===');
const группы = new Map();
for (const r of решения) {
  if (!группы.has(r.subtopic_id)) группы.set(r.subtopic_id, []);
  группы.get(r.subtopic_id).push(r.id);
}
let записано = 0;
for (const [subId, ids] of группы) {
  await api('PATCH', `tasks?id=in.(${ids.join(',')})`, { subtopic_id: subId });
  записано += ids.length;
}
console.log(`проставлено подтем: ${записано}`);
