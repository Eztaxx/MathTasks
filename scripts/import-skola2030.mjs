/* Переносит каталог Skola2030 (public/data/skola2030_topics.json) в базу:
 * темы 1–9 классов приводит к программе, заводит недостающие, заливает
 * подтемы n.m.k и разбирается с дублями, оставшимися от старых засевов.
 *
 * По умолчанию — сухой прогон. Писать: node scripts/import-skola2030.mjs --apply
 *
 * Задачи никогда не удаляются: тема со старым названием сначала отдаёт свои
 * задачи теме программы и лишь потом исчезает.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');

const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env'), 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error('нет SUPABASE_SERVICE_ROLE_KEY в .env'); process.exit(1); }

const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const api = async (method, path, body, extra = {}) => {
  const res = await fetch(env.SUPABASE_URL + '/rest/v1/' + path, {
    method, headers: { ...H, ...extra }, body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
};
const get = p => api('GET', p);

/* Задачи и темы читаем страницами: PostgREST отдаёт не больше тысячи строк. */
const getAll = async (path) => {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(env.SUPABASE_URL + '/rest/v1/' + path, {
      headers: { ...H, Range: `${from}-${from + 999}` },
    });
    const part = await res.json();
    out.push(...part);
    if (part.length < 1000) break;
  }
  return out;
};

/* ── Ручная разводка старых тем по программе ──────────────────────────────
   Совпадение по словам здесь не работает: «Формулы сокращённого умножения»
   и «Как используют разложение выражений на множители» — одно и то же, но
   общих слов нет. Ключ — название темы в базе, значение — код программы. */
const РАЗВОДКА = {
  'Обыкновенные дроби и части величин': '5.4',
  'Как одно число выражают в виде дроби от другого числа': '5.4',
  'Делимость чисел, НОД и НОК': '5.2',
  'Действия с отрицательными числами и модуль': '6.7',
  'Дроби и проценты в реальных контекстах': '6.5',
  'Координатная плоскость и прямая пропорциональность': '6.6',
  'Множества и классическая вероятность': '7.1',
  'Элементы комбинаторики и вероятность': '7.1',
  'Смежные и вертикальные углы': '7.2',
  'Линейная функция и её свойства': '7.4',
  'Линейные уравнения с одной переменной': '7.8',
  'Линейные уравнения и алгебраическое моделирование': '7.8',
  'Статистические характеристики числовых данных': '8.1',
  'Свойства степеней с натуральным показателем': '8.2',
  'Свойства корней и преобразование радикалов': '8.3',
  'Многоугольники, четырехугольники и площади': '8.5',
  'Преобразование алгебраических выражений и степени': '8.6',
  'Теорема Пифагора и прямоугольный треугольник': '8.8',
  'Теорема Пифагора и метрические соотношения': '8.8',
  'Подобные треугольники': '9.1',
  'Подобные треугольники и теорема Фалеса': '9.1',
  'Подобие треугольников и метрические соотношения в окружности': '9.1',
  'Тригонометрические соотношения в прямоугольном треугольнике': '9.3',
  'Формулы сокращенного умножения': '9.4',
  'Квадратные уравнения и теорема Виета': '9.5',
  'Квадратные неравенства и метод интервалов': '9.5',
  'Дробно-рациональные уравнения и задачи на процессы': '9.5',
  'Системы линейных уравнений с двумя переменными': '9.6',
  'Арифметическая прогрессия': '9.7',
};

/* Темы, которых в программе нет и которые остаются как есть. */
const ОСТАВИТЬ = new Set(['Олимпиадные методы, инварианты и диофантовы уравнения']);

const cat = JSON.parse(readFileSync(join(ROOT, 'public/data/skola2030_topics.json'), 'utf8'))
  .filter(c => c.grade >= 1 && c.grade <= 9);

const [topics, tasks, subjects] = await Promise.all([
  getAll('topics?select=id,title,title_lv,description,description_lv,grade,subject_id,slug,position'),
  getAll('tasks?select=id,topic_id,grade'),
  get('subjects?select=id,slug'),
]);
const subjectId = Object.fromEntries(subjects.map(s => [s.slug, s.id]));
const задачТемы = id => tasks.filter(t => t.topic_id === id).length;

/* ── Сопоставление тем программы с тем, что уже лежит в базе ── */
const стоп = new Set(['kas', 'kur', 'cik', 'par', 'tik', 'vai', 'kad', 'vien', 'izmanto', 'lieto',
  'veido', 'nozime', 'skaidro', 'как', 'что', 'где', 'для', 'при', 'его', 'это']);
const слова = s => new Set(String(s || '').toLowerCase()
  .replace(/^\d+(\.\d+)*\.?/, '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-zа-яё0-9\s]/gi, ' ').split(/\s+/)
  .filter(w => w.length > 2 && !стоп.has(w)));
const близость = (a, b) => {
  const A = слова(a), B = слова(b);
  if (!A.size || !B.size) return 0;
  let n = 0; for (const w of A) if (B.has(w)) n++;
  return n / Math.min(A.size, B.size);
};
/* Сравниваем и по-латышски, и по-русски: часть тем в базе переведена
   иначе, чем в каталоге, но хотя бы одна из двух пар всегда близка. */
const пара = (c, t) => Math.max(близость(c.title_lv, t.title_lv), близость(c.title_ru, t.title));

const чистое = s => String(s || '').replace(/^\s*\d+(\.\d+)*\.?\s*/, '').trim();

const занято = new Set();
const кодТемы = new Map();   // «7.5» -> запись каталога
const действия = { обновить: [], создать: [], перенести: [], удалить: [], оставить: [] };

for (const c of cat) {
  кодТемы.set(`${c.grade}.${c.position}`, c);
  const best = topics.filter(t => t.grade === c.grade && !занято.has(t.id))
    .map(t => ({ t, s: пара(c, t) }))
    /* Близость округляем: у пар-двойников («…в виде дроби от другого числа»
       и «…как часть другого числа») она различается на сотые, и без
       округления тема с задачами проигрывает пустому близнецу. */
    .sort((a, b) => Math.round(b.s * 10) - Math.round(a.s * 10) || задачТемы(b.t.id) - задачТемы(a.t.id))[0];
  if (best && best.s >= 0.55) {
    занято.add(best.t.id);
    c._dbId = best.t.id;
    действия.обновить.push({ c, t: best.t, s: +best.s.toFixed(2) });
  } else {
    действия.создать.push({ c });
  }
}

/* ── Что делать с темами базы, оставшимися без пары ── */
for (const t of topics) {
  if (t.grade < 1 || t.grade > 9 || занято.has(t.id)) continue;
  const задач = задачТемы(t.id);
  const код = РАЗВОДКА[чистое(t.title)];
  if (ОСТАВИТЬ.has(чистое(t.title))) { действия.оставить.push({ t, задач }); continue; }
  if (код && кодТемы.has(код)) { действия.перенести.push({ t, задач, код }); continue; }
  if (задач === 0) { действия.удалить.push({ t }); continue; }
  действия.оставить.push({ t, задач, причина: 'нет разводки' });
}

console.log(`Каталог 1–9: ${cat.length} тем, ${cat.reduce((a, c) => a + c.subtopics.length, 0)} подтем`);
console.log(`Обновить ${действия.обновить.length} · создать ${действия.создать.length} · ` +
  `перенести задачи из ${действия.перенести.length} · удалить пустых ${действия.удалить.length} · ` +
  `оставить ${действия.оставить.length}`);

console.log('\n── Сопоставление (близость < 0.8 — проверить глазами) ──');
действия.обновить.filter(x => x.s < 0.8).forEach(x =>
  console.log(`  ${x.s} ${x.c.grade}.${x.c.position} #${x.t.id} з${задачТемы(x.t.id)}\n     было:  ${x.t.title}\n     стало: ${чистое(x.c.title_ru)}`));

console.log('\n── Создать ──');
действия.создать.forEach(x => console.log(`  ${x.c.grade}.${x.c.position} ${чистое(x.c.title_ru)}`));

console.log('\n── Перенести задачи и убрать тему ──');
действия.перенести.forEach(x => console.log(`  #${x.t.id} з${x.задач} «${x.t.title}» → ${x.код} ${чистое(кодТемы.get(x.код).title_ru)}`));

console.log('\n── Оставить как есть ──');
действия.оставить.forEach(x => console.log(`  #${x.t.id} ${x.t.grade} кл з${x.задач} «${x.t.title}»${x.причина ? ' — ' + x.причина : ''}`));

console.log('\n── Удалить пустые ──');
console.log('  ' + (действия.удалить.map(x => `${x.t.grade}кл#${x.t.id}`).join(', ') || '—'));

if (!APPLY) { console.log('\nСухой прогон. Запись: --apply'); process.exit(0); }

/* ── Запись ──────────────────────────────────────────────────────────── */
const слаг = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

console.log('\n=== запись ===');

for (const { c, t } of действия.обновить) {
  await api('PATCH', `topics?id=eq.${t.id}`, {
    title: чистое(c.title_ru), title_lv: чистое(c.title_lv),
    description: c.description_ru, description_lv: c.description_lv,
    grade: c.grade, position: c.position, subject_id: subjectId[c.subject_slug] ?? t.subject_id,
  });
}
console.log(`обновлено тем: ${действия.обновить.length}`);

for (const { c } of действия.создать) {
  const [row] = await api('POST', 'topics', {
    title: чистое(c.title_ru), title_lv: чистое(c.title_lv),
    description: c.description_ru, description_lv: c.description_lv,
    grade: c.grade, position: c.position, subject_id: subjectId[c.subject_slug] ?? null,
    slug: c.slug,
  }, { Prefer: 'return=representation' });
  c._dbId = row.id;
}
console.log(`создано тем: ${действия.создать.length}`);

let перенесено = 0;
for (const { t, код } of действия.перенести) {
  const цель = кодТемы.get(код);
  await api('PATCH', `tasks?topic_id=eq.${t.id}`, { topic_id: цель._dbId, grade: цель.grade });
  await api('DELETE', `topics?id=eq.${t.id}`);
  перенесено += задачТемы(t.id);
}
console.log(`перенесено задач: ${перенесено}, убрано тем: ${действия.перенести.length}`);

for (const { t } of действия.удалить) await api('DELETE', `topics?id=eq.${t.id}`);
console.log(`удалено пустых тем: ${действия.удалить.length}`);

/* ── Подтемы ── */
const было = await getAll('subtopics?select=id,topic_id,code,slug');
const поКоду = new Map(было.map(s => [s.code, s]));
let новых = 0, правок = 0;
for (const c of cat) {
  for (const s of c.subtopics) {
    const тело = {
      topic_id: c._dbId, title: s.ru, title_lv: s.lv, code: s.num,
      position: Number(s.num.split('.')[2]),
    };
    const есть = поКоду.get(s.num);
    if (есть) { await api('PATCH', `subtopics?id=eq.${есть.id}`, тело); правок++; }
    else { await api('POST', 'subtopics', { ...тело, slug: `${слаг(s.ru)}-${s.num.replace(/\./g, '-')}` }); новых++; }
  }
}
console.log(`подтем: создано ${новых}, обновлено ${правок}`);
console.log('\nготово');
