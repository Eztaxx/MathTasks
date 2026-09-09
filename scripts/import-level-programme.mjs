/* Приводит курс старшей школы к программе: темы из официальной таблицы
 * «Programmā piedāvātā temantu apguves secība», старые темы из засева —
 * в подтемы вместе с их задачами.
 *
 *   node scripts/import-level-programme.mjs --grade=11
 *   node scripts/import-level-programme.mjs --grade=12 --apply
 *
 * Старые темы не удаляются вслепую: каждая по смыслу не тема, а навык
 * внутри темы, поэтому становится подтемой нужной темы и приносит туда
 * свои задачи. Скрипт останавливается, если хоть одной не нашлось места.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');
const GRADE = Number((process.argv.find(a => a.startsWith('--grade=')) || '').split('=')[1]);

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
const чистое = s => String(s || '').replace(/^\s*\d+(\.\d+)*\.?\s*/, '').trim();

/* ── Matemātika I (Optimālais līmenis), 420 часов ─────────────────── */
const OPTIMALAIS = {
  префикс: 'opt',
  курс: { ru: 'Matemātika I', lv: 'Matemātika I' },
  темы: [
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
  ],
  разводка: {
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
  },
};

/* ── Matemātika II (Augstākais līmenis), 280 часов ────────────────── */
const AUGSTAKAIS = {
  префикс: 'augst',
  курс: { ru: 'Matemātika II', lv: 'Matemātika II' },
  темы: [
    { n: 1,  h: 16, lv: 'Algebriskie pārveidojumi, indukcija', ru: 'Алгебраические преобразования, индукция', s: 'algebra' },
    { n: 2,  h: 20, lv: 'Polinomu dalīšana, augstākas pakāpes vienādojumi', ru: 'Деление многочленов, уравнения высших степеней', s: 'algebra' },
    { n: 3,  h: 20, lv: 'Funkcija', ru: 'Функция', s: 'funkcijas' },
    { n: 4,  h: 19, lv: 'Vienādojumi un nevienādības ar moduli, iracionāli vienādojumi', ru: 'Уравнения и неравенства с модулем, иррациональные уравнения', s: 'algebra' },
    { n: 5,  h: 20, lv: 'Logaritmiskie vienādojumi un nevienādības. Jauktas vienādojumu sistēmas', ru: 'Логарифмические уравнения и неравенства. Смешанные системы уравнений', s: 'algebra' },
    { n: 6,  h: 24, lv: 'Trigonometrija', ru: 'Тригонометрия', s: 'trigonometrija' },
    { n: 7,  h: 16, lv: 'Virknes, virknes robeža', ru: 'Последовательности, предел последовательности', s: 'matematiskais-analizs' },
    { n: 8,  h: 16, lv: 'Funkcijas robeža, nepārtrauktība', ru: 'Предел функции, непрерывность', s: 'matematiskais-analizs' },
    { n: 9,  h: 15, lv: 'Funkcijas atvasinājums', ru: 'Производная функции', s: 'matematiskais-analizs' },
    { n: 10, h: 18, lv: 'Funkcijas atvasinājuma lietojumi', ru: 'Применения производной', s: 'matematiskais-analizs' },
    { n: 11, h: 16, lv: 'Integrālis', ru: 'Интеграл', s: 'matematiskais-analizs' },
    { n: 12, h: 14, lv: 'Integrāļa lietojumi', ru: 'Применения интеграла', s: 'matematiskais-analizs' },
    { n: 13, h: 28, lv: 'Kombinatorika, varbūtību teorija un statistika', ru: 'Комбинаторика, теория вероятностей и статистика', s: 'statistics' },
    { n: 14, h: 26, lv: 'Ģeometrija', ru: 'Геометрия', s: 'planimetrija' },
    { n: 15, h: 12, lv: 'Kursa Matemātika II apkopojums', ru: 'Обобщение курса Математика II', s: 'algebra' },
  ],
  разводка: {
    'Элементы математической логики': 1,
    'Принцип математической индукции': 1,
    'Деление многочленов и теорема Безу': 2,
    'Метод неопределенных коэффициентов': 2,
    'Уравнения и неравенства с параметром': 2,
    'Комплексные приемы решения уравнений': 2,
    'Обратная функция': 3,
    'Исследование дробно-рациональной функции': 3,
    'Иррациональные уравнения': 4,
    'Логарифмические уравнения, неравенства и системы': 5,
    'Тангенс и котангенс угла': 6,
    'Обратные тригонометрические функции': 6,
    'Тригонометрические неравенства': 6,
    'Системы тригонометрических уравнений': 6,
    'Гармонические колебания и тригонометрические модели': 6,
    'Последовательности, их монотонность и предел': 7,
    'Бесконечно убывающая геометрическая прогрессия': 7,
    'Число e и экспоненциальные процессы': 7,
    'Предел функции': 8,
    'Непрерывность функции': 8,
    'Определение производной и её геометрический смысл': 9,
    'Правила и формулы дифференцирования': 9,
    'Касательная к графику функции': 10,
    'Исследование функций с помощью производной': 10,
    'Прикладные задачи на оптимизацию': 10,
    'Первообразная и неопределенный интеграл': 11,
    'Определенный интеграл и формула Ньютона–Лейбница': 11,
    'Вычисление площадей и объемов с помощью интеграла': 12,
    'Применение интеграла в физике': 12,
    'Комбинаторика II: Треугольник Паскаля': 13,
    'Бином Ньютона': 13,
    'Распределения случайной величины и формула Бернулли': 13,
    'Формула полной вероятности и формула Байеса': 13,
    'Статистика II: Выводы о генеральной совокупности': 13,
    'Соотношения в треугольниках (углубленно)': 14,
    'Соотношения в четырехугольниках и правильных многоугольниках': 14,
    'Отрезки и углы, связанные с окружностью': 14,
    'Геометрические преобразования (углубленно)': 14,
    'Аналитическая геометрия: прямая и окружность': 14,
    'Скалярное произведение векторов в геометрических задачах': 14,
    'Сечения многогранников плоскостью (углубленно)': 14,
    'Комбинации призмы и цилиндра': 14,
    'Комбинации конуса и пирамиды': 14,
    'Комбинации шара, цилиндра и конуса': 14,
    'Комбинации призмы, пирамиды и сферы': 14,
  },
};

const КУРСЫ = { 11: OPTIMALAIS, 12: AUGSTAKAIS };
const курс = КУРСЫ[GRADE];
if (!курс) { console.error('укажите --grade=11 или --grade=12'); process.exit(1); }

const [subjects, topics, subs, tasks] = await Promise.all([
  getAll('subjects?select=id,slug'),
  getAll('topics?select=id,title,title_lv,grade,position,slug&limit=1000'),
  getAll('subtopics?select=id,topic_id&limit=3000'),
  getAll('tasks?select=id,topic_id&limit=2000'),
]);
const разделId = Object.fromEntries(subjects.map(s => [s.slug, s.id]));
const старые = topics.filter(t => t.grade === GRADE).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
const задачТемы = id => tasks.filter(t => t.topic_id === id).length;
const слагЗанят = new Set(topics.map(t => t.slug));

const поТемам = new Map(курс.темы.map(p => [p.n, []]));
const безПары = [];
for (const t of старые) {
  const n = курс.разводка[чистое(t.title)];
  if (!n) { безПары.push(t); continue; }
  поТемам.get(n).push(t);
}

console.log(`${курс.курс.lv}: в базе тем ${старые.length}, задач ${старые.reduce((a, t) => a + задачТемы(t.id), 0)}`);
console.log(`Программа: ${курс.темы.length} тем, ${курс.темы.reduce((a, p) => a + p.h, 0)} часов`);
console.log(`Свернётся в подтемы: ${старые.length - безПары.length}, без пары: ${безПары.length}`);
безПары.forEach(t => console.log(`  ! #${t.id} «${t.title}»`));

console.log('\n── План ──');
for (const p of курс.темы) {
  const дети = поТемам.get(p.n);
  const задач = дети.reduce((a, t) => a + задачТемы(t.id), 0);
  console.log(`${String(p.n).padStart(2)}. ${p.lv}  (${p.h} ч, подтем ${дети.length}, задач ${задач})`);
  дети.forEach((t, i) => console.log(`      ${p.n}.${i + 1}  ${t.title}${задачТемы(t.id) ? ` — ${задачТемы(t.id)} зад.` : ''}`));
}

const лишниеПодтемы = subs.filter(s => старые.some(t => t.id === s.topic_id));
console.log(`\nПодтем у старых тем (уйдут вместе с ними): ${лишниеПодтемы.length}`);

if (безПары.length) { console.log('\n✗ Есть темы без пары — сначала допишите разводку.'); process.exit(1); }
if (!APPLY) { console.log('\nСухой прогон. Запись: --apply'); process.exit(0); }

console.log('\n=== запись ===');

const созданные = new Map();
for (const p of курс.темы) {
  let slug = `${курс.префикс}-${слаг(p.lv)}`;
  if (слагЗанят.has(slug)) slug = `${slug}-${p.n}`;
  слагЗанят.add(slug);
  const [row] = await api('POST', 'topics', {
    title: p.ru, title_lv: p.lv,
    description: `Программа ${курс.курс.ru}: ${p.h} ч.`,
    description_lv: `${курс.курс.lv} programma: ${p.h} st.`,
    grade: GRADE, position: p.n,
    subject_id: разделId[p.s] ?? разделId.algebra,
    slug,
  }, { Prefer: 'return=representation' });
  созданные.set(p.n, row);
}
console.log(`создано тем: ${созданные.size}`);

let подтем = 0, перенесено = 0;
for (const p of курс.темы) {
  const тема = созданные.get(p.n);
  const дети = поТемам.get(p.n);
  for (let i = 0; i < дети.length; i++) {
    const t = дети[i];
    const code = `${GRADE}.${p.n}.${i + 1}`;
    const [sub] = await api('POST', 'subtopics', {
      topic_id: тема.id,
      title: чистое(t.title),
      title_lv: чистое(t.title_lv) || null,
      code, position: i + 1,
      slug: `${слаг(t.title_lv || t.title) || 'apakstema'}-${code.replace(/\./g, '-')}`,
    }, { Prefer: 'return=representation' });
    подтем++;
    if (задачТемы(t.id)) {
      await api('PATCH', `tasks?topic_id=eq.${t.id}`, { topic_id: тема.id, subtopic_id: sub.id, grade: GRADE });
      перенесено += задачТемы(t.id);
    }
  }
}
console.log(`создано подтем: ${подтем}, перенесено задач: ${перенесено}`);

for (const t of старые) await api('DELETE', `topics?id=eq.${t.id}`);
console.log(`удалено старых тем: ${старые.length} (с ними ${лишниеПодтемы.length} их подтем)`);
console.log('\nготово. Дальше: scripts/renumber-tasks.mjs --apply и scripts/sync-catalog-from-db.mjs');
