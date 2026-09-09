/* Заводит подтемы для старшей школы (10–12 классы).
 *
 * Для 1–9 классов подтемы взяты из документа «Tēmas un apakštēmas»; для
 * Vispārīgais / Matemātika I / Matemātika II такого документа нет, а темы
 * в базе уже подробные. Поэтому разбивку на навыки составляет модель, а
 * человек правит её в админке — структура важнее идеальных формулировок.
 *
 * Сухой прогон по умолчанию, запись: --apply
 * Только один класс: --grade=11
 */
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');
const GRADE = Number((process.argv.find(a => a.startsWith('--grade=')) || '').split('=')[1]) || null;

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
const LOG = join(ROOT, 'docs/subtopic-generation.log');
const лог = line => {
  const s = new Date().toISOString().slice(11, 19) + '  ' + line;
  console.log(s);
  try { appendFileSync(LOG, s + '\n', 'utf8'); } catch {}
};

/* Квота считается на каждую модель отдельно, и gemini-3.6-flash на
   бесплатном тарифе кончается первой. */
const МОДЕЛИ = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.5-flash-lite'];
let модель = 0;

async function ask(prompt) {
  let последняя = '';
  for (let attempt = 0; attempt < 9; attempt++) {
    const name = МОДЕЛИ[модель];
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent?key=${encodeURIComponent(GEMINI)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: 16384 },
        }),
      });
    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('пустой ответ модели');
      return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
    }
    последняя = `${name} ${res.status}: ${(await res.text()).slice(0, 120).replace(/\s+/g, ' ')}`;
    if (res.status !== 404 && res.status !== 429 && res.status !== 503 && res.status !== 500) {
      throw new Error(последняя);
    }
    /* И «квота кончилась», и «модель перегружена» лечатся следующей
       моделью. Крутим список по кругу с растущей паузой. */
    модель = (модель + 1) % МОДЕЛИ.length;
    лог(`пробую ${МОДЕЛИ[модель]} (${последняя.slice(0, 70)})`);
    await sleep(5000 * (attempt + 1));
  }
  throw new Error('не ответил ни один вариант — ' + последняя);
}

const УРОВЕНЬ = {
  10: 'Vispārīgais līmenis (базовый курс средней школы)',
  11: 'Matemātika I — Optimālais līmenis (обязательный государственный экзамен)',
  12: 'Matemātika II — Augstākais līmenis (углублённый курс)',
};

const слаг = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);

const [topics, subs] = await Promise.all([
  getAll('topics?select=id,title,title_lv,description,grade,position&order=grade,position'),
  getAll('subtopics?select=id,topic_id,code'),
]);
const естьПодтемы = new Set(subs.map(s => s.topic_id));

const цель = topics.filter(t => t.grade >= 10 && t.grade <= 12
  && (!GRADE || t.grade === GRADE) && !естьПодтемы.has(t.id));

console.log(`Тем без подтем в 10–12 классах: ${цель.length}`);
if (!цель.length) { console.log('нечего делать'); process.exit(0); }

const ПАЧКА = 6;
const готовые = [];   // { topic_id, code, position, title, title_lv }
const провалы = [];

for (let i = 0; i < цель.length; i += ПАЧКА) {
  const пачка = цель.slice(i, i + ПАЧКА);
  const перечень = пачка.map(t =>
    `${t.grade}.${t.position} — ${t.title}${t.title_lv ? ` | ${t.title_lv}` : ''}`).join('\n');

  const prompt = `Ты — методист математики, работающий по латвийскому стандарту Skola2030.

Ниже темы курса «${УРОВЕНЬ[пачка[0].grade] || пачка[0].grade + ' класс'}». Разбей каждую на 3–5 подтем — конкретных проверяемых навыков, из которых тема состоит. Подтемы идут в учебном порядке: от определения к применению.

${перечень}

Требования к названиям:
- Короткое назывное словосочетание, без глаголов «изучить», «уметь», без слова «тема».
- Русский и латышский варианты — одно и то же по смыслу; латышский на терминологии Skola2030 (vienādojums, funkcija, laukums, atvasinājums, integrālis, varbūtība).
- Подтемы одной темы не повторяют друг друга и вместе покрывают её целиком.

Верни строго JSON-объект без пояснений: ключ — номер темы строкой («${пачка[0].grade}.${пачка[0].position}»), значение — массив объектов {"ru": "...", "lv": "..."}. Ответ должен содержать все ${пачка.length} тем.`;

  let ответ;
  try {
    ответ = await ask(prompt);
  } catch (err) {
    лог(`✗ пачка ${i / ПАЧКА + 1}: ${err.message}`);
    пачка.forEach(t => провалы.push({ id: t.id, title: t.title, причина: err.message.slice(0, 80) }));
    continue;
  }

  for (const t of пачка) {
    const список = ответ[`${t.grade}.${t.position}`];
    if (!Array.isArray(список) || !список.length) {
      провалы.push({ id: t.id, title: t.title, причина: 'модель не вернула подтемы' });
      continue;
    }
    список.slice(0, 6).forEach((s, k) => {
      const ru = String(s?.ru || '').trim();
      if (!ru) return;
      готовые.push({
        topic_id: t.id,
        code: `${t.grade}.${t.position}.${k + 1}`,
        position: k + 1,
        title: ru,
        title_lv: String(s?.lv || '').trim() || null,
      });
    });
  }
  лог(`тем разобрано ${Math.min(i + ПАЧКА, цель.length)} из ${цель.length}, подтем набрано ${готовые.length}`);
  await sleep(1500);
}

console.log(`\n✓ подтем составлено: ${готовые.length} для ${new Set(готовые.map(s => s.topic_id)).size} тем`);
console.log(`✗ тем без результата: ${провалы.length}`);

writeFileSync(join(ROOT, 'docs/subtopic-generation.json'), JSON.stringify({ готовые, провалы }, null, 1), 'utf8');

console.log('\n── Примеры ──');
const первые = готовые.slice(0, 18);
for (const s of первые) console.log(`  ${s.code}  ${s.title}\n        ${s.title_lv || '—'}`);
if (провалы.length) {
  console.log('\n── Без результата ──');
  провалы.slice(0, 10).forEach(p => console.log(`  #${p.id} «${p.title.slice(0, 50)}» — ${p.причина}`));
}

if (!APPLY) { console.log('\nСухой прогон. Запись: --apply'); process.exit(0); }

console.log('\n=== запись ===');
/* Пишем пачками: четыре сотни отдельных POST заняли бы минуты. */
for (let i = 0; i < готовые.length; i += 50) {
  const кусок = готовые.slice(i, i + 50).map(s => ({ ...s, slug: `${слаг(s.title_lv || s.title)}-${s.code.replace(/\./g, '-')}` }));
  await api('POST', 'subtopics', кусок);
}
console.log(`записано подтем: ${готовые.length}`);
