/* Приводит Matemātika I (Optimālais līmenis) к программе курса.
 *
 * В базе для этого уровня лежал подробный список из старого засева —
 * 53 темы вместо 22 тем программы. Каждая из них по смыслу не тема, а
 * навык внутри темы, поэтому они не удаляются, а становятся подтемами
 * нужной темы и приносят туда свои задачи.
 *
 * Подтемы, которые для старых тем сочинила модель, при этом уходят: они
 * описывали разбиение, которого больше нет.
 *
 * Сухой прогон по умолчанию, запись: node scripts/import-optimalais.mjs --apply
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');
const GRADE = 11;

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
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 250)}`);
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

const слаг = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 46);

/* ── 22 темы программы Matemātika I ───────────────────────────────────
   Порядок и часы взяты из таблицы «Programmā piedāvātā temantu apguves
   secība»; всего 420 часов. */
const ПРОГРАММА = [
  { n: 1,  h: 17, lv: 'Sadalīšana reizinātājos un vienādojumu risināšanas metodes', ru: 'Разложение на множители и методы решения уравнений', s: 'algebra' },
  { n: 2,  h: 17, lv: 'Algebriskās daļas', ru: 'Алгебраические дроби', s: 'algebra' },
  { n: 3,  h: 18, lv: 'Daļveida vienādojumi', ru: 'Дробные уравнения', s: 'algebra' },
  { n: 4,  h: 15, lv: 'Vienādojumu sistēmas', ru: 'Системы уравнений', s: 'algebra' },
  { n: 5,  h: 18, lv: 'Daļveida nevienādības un nevienādību sistēmas', ru: 'Дробные неравенства и системы неравенств', s: 'algebra' },
  { n: 6,  h: 23, lv: 'Leņķa jēdziena paplašinājums, planimetrija', ru: 'Расширение понятия угла, планиметрия', s: 'planimetrija' },
  { n: 7,  h: 21, lv: 'Funkcija, tās īpašības un grafika transformācijas', ru: 'Функция, её свойства и преобразования графика', s: 'funkcijas' },
  { n: 8,  h: 20, lv: 'Trigonometriskās funkcijas', ru: 'Тригонометрические функции', s: 'trigonometrija' },
  { n: 9,  h: 15, lv: 'Trigonometriskās izteiksmes', ru: 'Тригонометрические выражения', s: 'trigonometrija' },
  { n: 10, h: 16, lv: 'Trigonometriskie vienādojumi', ru: 'Тригонометрические уравнения', s: 'trigonometrija' },
  { n: 11, h: 17, lv: 'Vektori', ru: 'Векторы', s: 'planimetrija' },
  { n: 12, h: 20, lv: 'Līnijas vienādojums, nevienādības ar diviem mainīgajiem', ru: 'Уравнение линии, неравенства с двумя переменными', s: 'planimetrija' },
  { n: 13, h: 22, lv: 'Pakāpe ar racionālu kāpinātāju, progresijas', ru: 'Степень с рациональным показателем, прогрессии', s: 'algebra' },
  { n: 14, h: 18, lv: 'Eksponentfunkcija un logaritms', ru: 'Показательная функция и логарифм', s: 'funkcijas' },
  { n: 15, h: 17, lv: 'Eksponentvienādojumi un nevienādības', ru: 'Показательные уравнения и неравенства', s: 'algebra' },
  { n: 16, h: 16, lv: 'Taisnes un plaknes telpā', ru: 'Прямые и плоскости в пространстве', s: 'stereometrija' },
  { n: 17, h: 21, lv: 'Daudzskaldņi', ru: 'Многогранники', s: 'stereometrija' },
  { n: 18, h: 20, lv: 'Rotācijas ķermeņi un ģeometrisko ķermeņu kombinācijas', ru: 'Тела вращения и комбинации геометрических тел', s: 'stereometrija' },
  { n: 19, h: 21, lv: 'Kopu teorijas elementi un kombinatorika', ru: 'Элементы теории множеств и комбинаторика', s: 'statistics' },
  { n: 20, h: 18, lv: 'Varbūtību teorija', ru: 'Теория вероятностей', s: 'statistics' },
  { n: 21, h: 20, lv: 'Statistika', ru: 'Статистика', s: 'statistics' },
  { n: 22, h: 30, lv: 'Kursa Matemātika I apkopojums', ru: 'Обобщение курса Математика I', s: 'algebra' },
];

/* ── Куда сворачивается каждая из старых тем ──────────────────────────
   По названию в базе, потому что позиции сдвинутся. Значение — номер
   темы программы. */
const СВОРАЧИВАЕМ = {
  'Действительные числа и преобразование выражений': 1,
  'Линейные и квадратные уравнения, их системы': 1,
  'Уравнения и неравенства с модулем': 1,
  'Алгебраические дроби и действия с ними': 2,
  'Дробно-рациональные уравнения и неравенства': 3,
  'Неравенства и метод интервалов': 5,
  'Соотношения в прямоугольном треугольнике (повторение)': 6,
  'Угол поворота, радианы и единичная окружность': 6,
  'Теорема синусов и теорема косинусов': 6,
  'Равенство и подобие треугольников (повторение)': 6,
  'Геометрические преобразования плоскости': 6,
  'Площади многоугольников': 6,
  'Окружность: центральные и вписанные углы, касательные': 6,
  'Вписанная и описанная окружность треугольника': 6,
  'Понятие функции, область определения и область значений': 7,
  'Линейная функция и её график': 7,
  'Квадратичная функция и вершина параболы': 7,
  'Свойства функций: монотонность, нули, экстремумы': 7,
  'Дробно-линейная функция y = k/x': 7,
  'Преобразования графиков функций': 7,
  'Математическое моделирование с помощью функций': 7,
  'Функции синуса и косинуса, их свойства': 8,
  'Основное тригонометрическое тождество': 9,
  'Формулы сложения и двойного угла': 9,
  'Преобразование тригонометрических выражений': 9,
  'Простейшие тригонометрические уравнения': 10,
  'Векторы на плоскости и действия с ними': 11,
  'Координаты векторов и скалярное произведение': 11,
  'Векторы в пространстве': 11,
  'Уравнение прямой, параллельные и перпендикулярные прямые': 12,
  'Уравнение окружности': 12,
  'Корень n-й степени и степень с рациональным показателем': 13,
  'Последовательности, арифметическая и геометрическая прогрессия': 13,
  'Степенная функция': 13,
  'Логарифм и логарифмические уравнения': 14,
  'Показательная функция и экспоненциальные процессы': 14,
  'Логарифмическая функция': 14,
  'Показательные уравнения и неравенства': 15,
  'Прямые и плоскости в пространстве': 16,
  'Многогранники и их сечения плоскостью': 17,
  'Призма: площадь поверхности и объем': 17,
  'Пирамида: правильная и произвольная': 17,
  'Цилиндр': 18,
  'Конус': 18,
  'Шар и сфера': 18,
  'Стереометрия: тела вращения и пирамиды': 18,
  'Множества и операции над множествами': 19,
  'Основные принципы комбинаторики': 19,
  'Перестановки, сочетания и размещения': 19,
  'Классическое определение вероятности': 20,
  'Сложение вероятностей и условная вероятность': 20,
  'Генеральная совокупность, выборка и средние величины': 21,
  'Меры рассеяния и графическое представление данных': 21,
};

const чистое = s => String(s || '').replace(/^\s*\d+(\.\d+)*\.?\s*/, '').trim();

const [subjects, topics, subs, tasks] = await Promise.all([
  getAll('subjects?select=id,slug'),
  getAll('topics?select=id,title,title_lv,description,description_lv,grade,position,slug&limit=1000'),
  getAll('subtopics?select=id,topic_id,code&limit=2000'),
  getAll('tasks?select=id,topic_id,subtopic_id&limit=2000'),
]);
const разделId = Object.fromEntries(subjects.map(s => [s.slug, s.id]));
const старые = topics.filter(t => t.grade === GRADE).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
const задачТемы = id => tasks.filter(t => t.topic_id === id).length;
const слагЗанят = new Set(topics.map(t => t.slug));

/* Разбираем старые темы по темам программы, сохраняя их порядок:
   он и станет порядком подтем. */
const поТемам = new Map(ПРОГРАММА.map(p => [p.n, []]));
const безПары = [];
for (const t of старые) {
  const n = СВОРАЧИВАЕМ[чистое(t.title)];
  if (!n) { безПары.push(t); continue; }
  поТемам.get(n).push(t);
}

console.log(`Тем ${GRADE} класса в базе: ${старые.length}, задач: ${старые.reduce((a, t) => a + задачТемы(t.id), 0)}`);
console.log(`Тем программы: ${ПРОГРАММА.length}, часов: ${ПРОГРАММА.reduce((a, p) => a + p.h, 0)}`);
console.log(`Свернётся в подтемы: ${старые.length - безПары.length}`);
console.log(`Без пары (разобрать руками): ${безПары.length}`);
if (безПары.length) безПары.forEach(t => console.log(`  ! #${t.id} «${t.title}»`));

console.log('\n── План ──');
for (const p of ПРОГРАММА) {
  const дети = поТемам.get(p.n);
  const задач = дети.reduce((a, t) => a + задачТемы(t.id), 0);
  console.log(`${String(p.n).padStart(2)}. ${p.lv}  (${p.h} ч, подтем ${дети.length}, задач ${задач})`);
  дети.forEach((t, i) => console.log(`      ${p.n}.${i + 1}  ${t.title}${задачТемы(t.id) ? ` — ${задачТемы(t.id)} зад.` : ''}`));
}

const лишниеПодтемы = subs.filter(s => старые.some(t => t.id === s.topic_id));
console.log(`\nПодтем у старых тем (будут удалены вместе с ними): ${лишниеПодтемы.length}`);

if (безПары.length) { console.log('\n✗ Есть темы без пары — сначала допишите разводку.'); process.exit(1); }
if (!APPLY) { console.log('\nСухой прогон. Запись: --apply'); process.exit(0); }

/* ── Запись ──────────────────────────────────────────────────────── */
console.log('\n=== запись ===');

/* 1. Темы программы. Слаг уникален по таблице, поэтому проверяем. */
const созданные = new Map();
for (const p of ПРОГРАММА) {
  let slug = `opt-${слаг(p.lv)}`;
  if (слагЗанят.has(slug)) slug = `${slug}-${p.n}`;
  слагЗанят.add(slug);
  const [row] = await api('POST', 'topics', {
    title: p.ru, title_lv: p.lv,
    description: `Программа Matemātika I: ${p.h} ч.`,
    description_lv: `Matemātika I programma: ${p.h} st.`,
    grade: GRADE, position: p.n,
    subject_id: разделId[p.s] ?? разделId.algebra,
    slug,
  }, { Prefer: 'return=representation' });
  созданные.set(p.n, row);
}
console.log(`создано тем: ${созданные.size}`);

/* 2. Старые темы становятся подтемами и отдают задачи. */
let подтем = 0, перенесено = 0;
for (const p of ПРОГРАММА) {
  const тема = созданные.get(p.n);
  const дети = поТемам.get(p.n);
  for (let i = 0; i < дети.length; i++) {
    const t = дети[i];
    const code = `${GRADE}.${p.n}.${i + 1}`;
    let slug = `${слаг(t.title_lv || t.title) || 'apakstema'}-${code.replace(/\./g, '-')}`;
    const [sub] = await api('POST', 'subtopics', {
      topic_id: тема.id,
      title: чистое(t.title),
      title_lv: чистое(t.title_lv) || null,
      code, position: i + 1, slug,
    }, { Prefer: 'return=representation' });
    подтем++;
    const свои = tasks.filter(x => x.topic_id === t.id);
    if (свои.length) {
      await api('PATCH', `tasks?topic_id=eq.${t.id}`, { topic_id: тема.id, subtopic_id: sub.id, grade: GRADE });
      перенесено += свои.length;
    }
  }
}
console.log(`создано подтем: ${подтем}, перенесено задач: ${перенесено}`);

/* 3. Опустевшие темы убираем — их подтемы уходят каскадом. */
for (const t of старые) await api('DELETE', `topics?id=eq.${t.id}`);
console.log(`удалено старых тем: ${старые.length} (с ними ${лишниеПодтемы.length} их подтем)`);
console.log('\nготово');
