/* Пересобирает public/data/skola2030_topics.json по базе.
 *
 * Каталог кормит выпадающие списки генератора и справочник подтем. Пока
 * он расходился с базой, генератор для 11–12 классов предлагал двенадцать
 * тем, которых в базе нет, и готовая задача не находила себе тему.
 *
 * Запись по умолчанию — файл пересобирается целиком: правки вносят в базу
 * через админку, а не сюда.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env'), 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);
const H = { apikey: env.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + env.SUPABASE_ANON_KEY };
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

const ИМЯ_КЛАССА = {
  10: 'Vispārīgais līmenis', 11: 'Matemātika I', 12: 'Matemātika II',
};

const [topics, subs, subjects] = await Promise.all([
  getAll('topics?select=id,title,title_lv,description,description_lv,slug,grade,position,subject_id&order=grade,position'),
  getAll('subtopics?select=id,topic_id,code,title,title_lv,position'),
  getAll('subjects?select=id,slug'),
]);
const слагРаздела = Object.fromEntries(subjects.map(s => [s.id, s.slug]));

const подтемыТемы = new Map();
for (const s of subs) {
  if (!подтемыТемы.has(s.topic_id)) подтемыТемы.set(s.topic_id, []);
  подтемыТемы.get(s.topic_id).push(s);
}

/* Номер темы держим в названии — так его читает formatTopicTitle и так
   привык видеть промпт генератора. */
const номер = t => `${t.grade}.${t.position}`;
const чисто = s => String(s || '').replace(/^\s*\d+(\.\d+)*\.?\s*/, '').trim();

const каталог = topics
  .filter(t => t.grade >= 1 && t.grade <= 12)
  .map((t, i) => ({
    id: i + 1,
    slug: t.slug,
    grade: t.grade,
    grade_name: ИМЯ_КЛАССА[t.grade] || `${t.grade} класс`,
    subject_slug: слагРаздела[t.subject_id] || 'algebra',
    position: t.position,
    title_ru: `${номер(t)}. ${чисто(t.title)}`,
    title_lv: `${номер(t)}. ${чисто(t.title_lv || t.title)}`,
    description_ru: t.description || '',
    description_lv: t.description_lv || '',
    subtopics: (подтемыТемы.get(t.id) || [])
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(s => ({ num: s.code || `${номер(t)}.${s.position}`, ru: s.title, lv: s.title_lv || s.title })),
  }));

for (const путь of ['public/data/skola2030_topics.json', 'supabase/skola2030_topics.json']) {
  writeFileSync(join(ROOT, путь), JSON.stringify(каталог, null, 2) + '\n', 'utf8');
}

const подтем = каталог.reduce((a, c) => a + c.subtopics.length, 0);
console.log(`каталог пересобран: ${каталог.length} тем, ${подтем} подтем`);
const поКлассам = {};
for (const c of каталог) {
  поКлассам[c.grade] ??= { тем: 0, подтем: 0 };
  поКлассам[c.grade].тем++;
  поКлассам[c.grade].подтем += c.subtopics.length;
}
for (const g of Object.keys(поКлассам).sort((a, b) => a - b)) {
  console.log(`  ${String(g).padStart(2)} класс: тем ${String(поКлассам[g].тем).padStart(2)}, подтем ${String(поКлассам[g].подтем).padStart(3)}`);
}
const пустые = каталог.filter(c => !c.subtopics.length);
if (пустые.length) console.log(`\nбез подтем: ${пустые.length} — ${пустые.slice(0, 6).map(c => `${c.grade}.${c.position}`).join(', ')}${пустые.length > 6 ? '…' : ''}`);
