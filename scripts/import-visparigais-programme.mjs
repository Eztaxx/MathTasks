/* Приводит Vispārīgais līmenis (grade 10) к программе Skola2030: 7 тем по
 * 8 подтем вместо 25 тем старого засева.
 *
 *   node scripts/import-visparigais-programme.mjs            — сухой прогон
 *   node scripts/import-visparigais-programme.mjs --apply    — запись
 *
 * Источник — «Matemātika — vispārīgais līmenis. Темы и подтемы по программе
 * Skola2030 (средняя ступень, общий уровень, 210 ч)»: названия тем и подтем
 * на обоих языках взяты оттуда дословно. Описаний тем в документе нет —
 * они собраны из его же подтем.
 *
 * В отличие от Matemātika I и II (scripts/import-level-programme.mjs) старые
 * темы здесь не становятся подтемами: у программы свой готовый список
 * подтем. Поэтому переносятся задачи — каждая в подтему по смыслу, по
 * таблице ЗАДАЧИ ниже. Скрипт останавливается, если в старых темах нашлась
 * задача, которой нет в таблице, или если на старую тему ссылается
 * экзаменационный вариант: удаление темы снесло бы его каскадом.
 */
import { exitSafely } from './lib/exit-safely.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');
const GRADE = 10;
const ПРЕФИКС = 'visp';

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
    if (!res.ok) throw new Error(`GET ${path} -> ${res.status} ${(await res.text()).slice(0, 250)}`);
    const part = await res.json();
    out.push(...part);
    if (part.length < 1000) break;
  }
  return out;
};

const слаг = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 46);

/* ── Программа ─────────────────────────────────────────────────────
   h — часы по документу; у тем 4 и 5 их нет (вместе 64 ч, деление в
   источниках не указано), поэтому null. Раздел сайта подобран по разделу
   экзамена: геометрия разложена на планиметрию и стереометрию, функции —
   в свой раздел, как у остальных уровней. */
const ТЕМЫ = [
  {
    n: 1, h: 28, s: 'statistics',
    lv: 'Kopas un varbūtība', ru: 'Множества и вероятность',
    d_ru: 'Множества и операции над ними, диаграммы Эйлера–Венна, случайные события, частота и вероятность.',
    d_lv: 'Kopas un darbības ar tām, Eilera–Venna diagrammas, nejauši notikumi, biežums un varbūtība.',
    под: [
      ['Kopa, elements, apakškopa', 'Множество, элемент, подмножество'],
      ['Galīgas un bezgalīgas kopas', 'Конечные и бесконечные множества'],
      ['Darbības ar kopām: šķēlums, apvienojums, starpība, papildinājums', 'Операции: пересечение, объединение, разность, дополнение'],
      ['Eilera–Venna diagrammas', 'Диаграммы Эйлера–Венна'],
      ['Nejaušs notikums, elementārnotikumi, notikumu telpa', 'Случайное событие, элементарные исходы, пространство исходов'],
      ['Absolūtais un relatīvais biežums', 'Абсолютная и относительная частота'],
      ['Statistiskā varbūtība', 'Статистическая вероятность'],
      ['Klasiskā varbūtība, varbūtības aprēķināšana', 'Классическая вероятность, вычисление вероятности'],
    ],
  },
  {
    n: 2, h: 28, s: 'statistics',
    lv: 'Statistikas elementi', ru: 'Элементы статистики',
    d_ru: 'Генеральная совокупность и выборка, таблицы и диаграммы, меры центра и разброса, связь двух переменных.',
    d_lv: 'Ģenerālkopa un izlase, tabulas un diagrammas, centrālās tendences un izkliedes rādītāji, divu mainīgo sakarība.',
    под: [
      ['Ģenerālkopa un izlase', 'Генеральная совокупность и выборка'],
      ['Datu veidi: kvantitatīvie un kategoriālie', 'Типы данных: количественные и категориальные'],
      ['Datu apkopošana tabulās', 'Сведение данных в таблицы'],
      ['Datu attēlošana: stabiņu, līniju, sektoru diagrammas, histogramma, kastu diagramma', 'Диаграммы: столбчатые, линейные, круговые, гистограмма, «ящик с усами»'],
      ['Centrālās tendences rādītāji: vidējais aritmētiskais, mediāna, moda', 'Меры центра: среднее, медиана, мода'],
      ['Izkliedes rādītāji: amplitūda, kvartiles, starpkvartiļu izkliede, standartnovirze', 'Меры разброса: размах, квартили, межквартильный размах, стандартное отклонение'],
      ['Divu mainīgo sakarības analīze (izkliedes diagramma)', 'Анализ связи двух переменных (диаграмма рассеяния)'],
      ['Datu interpretācija un secinājumi', 'Интерпретация данных и выводы'],
    ],
  },
  {
    n: 3, h: 30, s: 'algebra',
    lv: 'Skaitliskie aprēķini dzīves darbībā', ru: 'Вычисления в жизненных ситуациях',
    d_ru: 'Рациональные числа, проценты и пропорции, степени и корни, стандартный вид числа, логарифм, приближённые вычисления.',
    d_lv: 'Racionāli skaitļi, procenti un proporcijas, pakāpes un saknes, skaitļa standartforma, logaritms, tuvinātie aprēķini.',
    под: [
      ['Darbības ar racionāliem skaitļiem', 'Действия с рациональными числами'],
      ['Procenti, procentu punkti', 'Проценты, процентные пункты'],
      ['Attiecības un proporcijas', 'Отношения и пропорции'],
      ['Pakāpe ar veselu un racionālu kāpinātāju, pakāpju īpašības', 'Степень с целым и рациональным показателем, свойства степеней'],
      ['n-tās pakāpes sakne, darbības ar saknēm', 'Корень n-й степени, действия с корнями'],
      ['Skaitļa standartforma (normālforma)', 'Стандартный вид числа'],
      ['Logaritms, logaritma definīcija', 'Логарифм, определение логарифма'],
      ['Tuvinātie aprēķini, noapaļošana, mērvienību pārveidošana', 'Приближённые вычисления, округление, перевод единиц'],
    ],
  },
  {
    n: 4, h: null, s: 'planimetrija',
    lv: 'Plaknes figūras praktiskos kontekstos', ru: 'Фигуры на плоскости в практических задачах',
    d_ru: 'Треугольники и четырёхугольники, теорема Пифагора, тригонометрия прямоугольного треугольника, круг, периметр и площадь, масштаб.',
    d_lv: 'Trijstūri un četrstūri, Pitagora teorēma, trigonometrija taisnleņķa trijstūrī, riņķis, perimetrs un laukums, mērogs.',
    под: [
      ['Trijstūru veidi, trijstūra elementi', 'Виды треугольников, элементы треугольника'],
      ['Trijstūru vienādības un līdzības pazīmes', 'Признаки равенства и подобия треугольников'],
      ['Pitagora teorēma', 'Теорема Пифагора'],
      ['Trigonometriskās sakarības taisnleņķa trijstūrī (sin α, cos α, tg α)', 'Тригонометрия в прямоугольном треугольнике (sin, cos, tg)'],
      ['Četrstūru klasifikācija un īpašības', 'Классификация и свойства четырёхугольников'],
      ['Riņķis un riņķa līnija', 'Круг и окружность'],
      ['Plaknes figūru perimetrs un laukums', 'Периметр и площадь плоских фигур'],
      ['Mērogs, līdzīgas figūras praktiskos uzdevumos', 'Масштаб, подобные фигуры в практических задачах'],
    ],
  },
  {
    n: 5, h: null, s: 'funkcijas',
    lv: 'Funkcijas kā reālu situāciju matemātiskais modelis', ru: 'Функции как модели реальных ситуаций',
    d_ru: 'Понятие и свойства функции, линейная, квадратичная и показательная функции, прогрессии, моделирование реальных процессов.',
    d_lv: 'Funkcijas jēdziens un īpašības, lineārā funkcija, kvadrātfunkcija un eksponentfunkcija, progresijas, reālu procesu modelēšana.',
    под: [
      ['Funkcijas jēdziens, attēlošanas veidi (tabula, formula, grafiks, apraksts)', 'Понятие функции, способы задания (таблица, формула, график, описание)'],
      ['Funkcijas īpašības: definīcijas un vērtību apgabals, nulles, monotonitāte, lielākā/mazākā vērtība', 'Свойства: область определения и значений, нули, монотонность, наиб./наим. значение'],
      ['Lineārā funkcija', 'Линейная функция'],
      ['Kvadrātfunkcija', 'Квадратичная функция'],
      ['Eksponentfunkcija: augšana un dilšana (saliktie procenti, amortizācija)', 'Показательная функция: рост и убывание (сложные проценты, амортизация)'],
      ['Virkne kā naturāla argumenta funkcija', 'Последовательность как функция натурального аргумента'],
      ['Aritmētiskā un ģeometriskā progresija', 'Арифметическая и геометрическая прогрессия'],
      ['Reālu procesu modelēšana ar funkcijām (Excel, Desmos)', 'Моделирование реальных процессов функциями (Excel, Desmos)'],
    ],
  },
  {
    n: 6, h: 34, s: 'algebra',
    lv: 'Algebrisko modeļu lietojums reālās situācijās', ru: 'Алгебраические модели в реальных ситуациях',
    d_ru: 'Равносильные преобразования, методы решения уравнений, алгебраические дроби, дробные и показательные уравнения, системы уравнений, текстовые задачи.',
    d_lv: 'Ekvivalenti pārveidojumi, vienādojumu risināšanas metodes, algebriskās daļas, daļveida un eksponentvienādojumi, vienādojumu sistēmas, teksta uzdevumi.',
    под: [
      ['Identiski un ekvivalenti pārveidojumi', 'Тождественные и равносильные преобразования'],
      ['Vienādojumu risināšanas metodes: sadalīšana reizinātājos, substitūcija, grafiskā metode', 'Методы решения уравнений: разложение на множители, замена, графический метод'],
      ['Algebriskās daļas, racionālas izteiksmes definīcijas apgabals', 'Алгебраические дроби, область определения рационального выражения'],
      ['Algebrisko daļu saīsināšana, reizināšana, saskaitīšana un atņemšana', 'Сокращение, умножение, сложение и вычитание алгебраических дробей'],
      ['Daļveida vienādojumi', 'Дробные уравнения'],
      ['Eksponentvienādojumi (pakāpju īpašības, logaritma definīcija)', 'Показательные уравнения (свойства степеней, определение логарифма)'],
      ['Vienādojumu sistēmas ar diviem nezināmajiem, atrisinājums kā sakārtots skaitļu pāris', 'Системы уравнений с двумя неизвестными, решение как упорядоченная пара'],
      ['Teksta uzdevumu modelēšana ar vienādojumiem', 'Текстовые задачи: составление уравнений'],
    ],
  },
  {
    n: 7, h: 26, s: 'stereometrija',
    lv: 'Telpiski ķermeņi praktiskos kontekstos', ru: 'Пространственные тела в практических задачах',
    d_ru: 'Прямые и плоскости в пространстве, изображение и сечения тел, многогранники и тела вращения, площадь поверхности и объём.',
    d_lv: 'Taisnes un plaknes telpā, ķermeņu attēlošana un šķēlumi, daudzskaldņi un rotācijas ķermeņi, virsmas laukums un tilpums.',
    под: [
      ['Taišņu un plakņu savstarpējais novietojums telpā (krustiskas, paralēlas, šķērsas taisnes)', 'Взаимное расположение прямых и плоскостей (пересекающиеся, параллельные, скрещивающиеся)'],
      ['Telpisku ķermeņu attēlošana, paralēlā projicēšana', 'Изображение тел, параллельное проецирование'],
      ['Daudzskaldņu šķēlumi', 'Сечения многогранников'],
      ['Taisnes un plaknes perpendikularitāte, slīpne un projekcija, leņķis starp slīpni un plakni', 'Перпендикуляр к плоскости, наклонная и проекция, угол между наклонной и плоскостью'],
      ['Daudzskaldņi: prizma, piramīda, nošķelta piramīda', 'Многогранники: призма, пирамида, усечённая пирамида'],
      ['Rotācijas ķermeņi: cilindrs, konuss, lode', 'Тела вращения: цилиндр, конус, шар'],
      ['Virsmas laukuma un tilpuma aprēķini', 'Площадь поверхности и объём'],
      ['Ģeometrisko ķermeņu kombinācijas', 'Комбинации тел'],
    ],
  },
];

/* ── Куда переезжает каждая задача ─────────────────────────────────
   Номер подтемы — «тема.подтема» из программы. ВНЕ — задача по теме,
   которой в программе общего уровня нет; она ложится в ближайшую
   подтему, а в отчёте помечается, чтобы её можно было потом перенести
   на Matemātika I. */
const ЗАДАЧИ = {
  83:  ['3.3', 'расход топлива — пропорция'],
  84:  ['3.2', 'цена с PVN — проценты'],
  85:  ['5.5', 'вклад со сложными процентами — рост по показательному закону'],
  86:  ['6.1', 'выразить основание из формулы площади трапеции'],
  87:  ['6.8', 'участок: уравнение по условию задачи'],
  11:  ['6.3', 'дробное неравенство методом интервалов', 'ВНЕ'],
  88:  ['6.1', 'линейное неравенство равносильными преобразованиями'],
  89:  ['5.1', 'значение функции, заданной формулой'],
  90:  ['5.3', 'пересечение прямой с осью Ox'],
  91:  ['5.4', 'вершина параболы'],
  92:  ['3.1', 'плата за электричество по счётчику'],
  93:  ['4.4', 'лестница у стены — косинус угла'],
  12:  ['4.4', 'теорема косинусов', 'ВНЕ'],
  94:  ['4.4', 'теорема косинусов', 'ВНЕ'],
  95:  ['3.8', 'площадь поля в гектарах — перевод единиц'],
  96:  ['4.8', 'масштаб карты'],
  97:  ['4.8', 'высота столба по тени — подобие'],
  98:  ['4.6', 'площадь круглой клумбы'],
  99:  ['7.7', 'объём бассейна'],
  100: ['7.7', 'объём кучи песка — конус'],
  101: ['7.7', 'площадь сферы'],
  102: ['3.8', 'банки краски — округление вверх'],
  103: ['1.6', 'относительная частота'],
  104: ['2.5', 'средневзвешенный балл'],
  105: ['2.4', 'угол сектора круговой диаграммы'],
  106: ['1.5', 'число PIN-кодов — пространство исходов', 'ВНЕ'],
  13:  ['1.5', 'выбор команды — сочетания', 'ВНЕ'],
  107: ['1.8', 'вероятность в лотерее'],
  108: ['1.8', 'два независимых датчика'],
};

// ── Проверка программы до обращения к базе ──────────────────────────
const коды = new Set(ТЕМЫ.flatMap(т => т.под.map((_, i) => `${т.n}.${i + 1}`)));
for (const [id, [код]] of Object.entries(ЗАДАЧИ)) {
  if (!коды.has(код)) { console.error(`задача #${id}: подтемы ${код} в программе нет`); await exitSafely(1); }
}

const [subjects, topics, subs, tasks, papers, paperTopics] = await Promise.all([
  getAll('subjects?select=id,slug'),
  getAll('topics?select=id,title,title_lv,grade,position,slug'),
  getAll('subtopics?select=id,topic_id,slug'),
  getAll('tasks?select=id,topic_id,subtopic_id,is_published'),
  getAll('exam_papers?select=id,topic_id'),
  getAll('exam_paper_topics?select=paper_id,topic_id'),
]);
const разделId = Object.fromEntries(subjects.map(s => [s.slug, s.id]));
for (const т of ТЕМЫ) {
  if (!разделId[т.s]) { console.error(`раздела «${т.s}» в базе нет`); await exitSafely(1); }
}

const старые = topics.filter(t => t.grade === GRADE).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
const старыеId = new Set(старые.map(t => t.id));
const задачиСтарых = tasks.filter(t => старыеId.has(t.topic_id));
const подтемыСтарых = subs.filter(s => старыеId.has(s.topic_id));

console.log(`Vispārīgais līmenis: в базе тем ${старые.length}, подтем ${подтемыСтарых.length}, задач ${задачиСтарых.length}`);
console.log(`Программа: тем ${ТЕМЫ.length}, подтем ${коды.size}`);

// Ни одна задача не должна остаться без места.
const безМеста = задачиСтарых.filter(t => !ЗАДАЧИ[t.id]);
const лишние = Object.keys(ЗАДАЧИ).map(Number).filter(id => !задачиСтарых.some(t => t.id === id));
// Удаление темы каскадом снесёт экзаменационные варианты, привязанные к ней.
const варианты = [...papers.filter(p => старыеId.has(p.topic_id)), ...paperTopics.filter(p => старыеId.has(p.topic_id))];

console.log('\n── План ──');
for (const т of ТЕМЫ) {
  console.log(`${т.n}. ${т.lv} / ${т.ru}  [${т.s}${т.h ? `, ${т.h} ч` : ''}]`);
  т.под.forEach(([lv, ru], i) => {
    const код = `${т.n}.${i + 1}`;
    const сюда = Object.entries(ЗАДАЧИ).filter(([, [к]]) => к === код);
    console.log(`   ${GRADE}.${код}  ${ru}`);
    for (const [id, [, что, метка]] of сюда) console.log(`            ← #${id} ${что}${метка ? '  [вне программы]' : ''}`);
  });
}

if (безМеста.length) {
  console.log('\n✗ Задачи без места в таблице ЗАДАЧИ:');
  безМеста.forEach(t => console.log(`   #${t.id}`));
}
if (лишние.length) console.log(`\n! В таблице есть задачи, которых нет в старых темах: ${лишние.map(id => '#' + id).join(', ')}`);
if (варианты.length) {
  console.log('\n✗ На старые темы ссылаются экзаменационные варианты — удаление снесёт их:');
  варианты.forEach(v => console.log('   ', JSON.stringify(v)));
}
if (безМеста.length || варианты.length) await exitSafely(1);

// Слаги: у тем — с префиксом уровня (по нему сайт узнаёт ступень), у подтем — с номером.
const слагТемЗанят = new Set(topics.filter(t => !старыеId.has(t.id)).map(t => t.slug));
const слагПодтемЗанят = new Set(subs.map(s => s.slug));
const слагиТем = new Map();
for (const т of ТЕМЫ) {
  let slug = `${ПРЕФИКС}-${слаг(т.lv)}`;
  if (слагТемЗанят.has(slug) || topics.some(t => t.slug === slug)) slug = `${slug}-${т.n}`;
  слагТемЗанят.add(slug);
  слагиТем.set(т.n, slug);
}
const слагПодтемы = (lv, код) => {
  let slug = `${слаг(lv) || 'apakstema'}-${код.replace(/\./g, '-')}`;
  for (let k = 2; слагПодтемЗанят.has(slug); k++) slug = `${слаг(lv)}-${код.replace(/\./g, '-')}-${k}`;
  слагПодтемЗанят.add(slug);
  return slug;
};

console.log(`\nВне программы общего уровня: ${Object.values(ЗАДАЧИ).filter(z => z[2]).length} задач — лягут в ближайшие подтемы.`);
console.log(`Удалятся: ${старые.length} старых тем и с ними ${подтемыСтарых.length} подтем.`);

if (!APPLY) { console.log('\nСухой прогон. Запись: --apply'); await exitSafely(0); }

console.log('\n=== запись ===');

const созданные = new Map();
for (const т of ТЕМЫ) {
  const [row] = await api('POST', 'topics', {
    title: т.ru, title_lv: т.lv,
    description: т.d_ru, description_lv: т.d_lv,
    grade: GRADE, position: т.n,
    subject_id: разделId[т.s],
    slug: слагиТем.get(т.n),
  }, { Prefer: 'return=representation' });
  созданные.set(т.n, row);
}
console.log(`создано тем: ${созданные.size}`);

const подтемаПоКоду = new Map();
for (const т of ТЕМЫ) {
  const тема = созданные.get(т.n);
  for (let i = 0; i < т.под.length; i++) {
    const [lv, ru] = т.под[i];
    const код = `${GRADE}.${т.n}.${i + 1}`;
    const [sub] = await api('POST', 'subtopics', {
      topic_id: тема.id, title: ru, title_lv: lv,
      code: код, position: i + 1, slug: слагПодтемы(lv, код),
    }, { Prefer: 'return=representation' });
    подтемаПоКоду.set(`${т.n}.${i + 1}`, { sub, тема });
  }
}
console.log(`создано подтем: ${подтемаПоКоду.size}`);

let перенесено = 0;
for (const [id, [код]] of Object.entries(ЗАДАЧИ)) {
  const { sub, тема } = подтемаПоКоду.get(код);
  await api('PATCH', `tasks?id=eq.${id}`, { topic_id: тема.id, subtopic_id: sub.id, grade: GRADE });
  перенесено++;
}
console.log(`перенесено задач: ${перенесено}`);

// Старые темы удаляем, только когда в них не осталось ни одной задачи.
const остались = (await getAll('tasks?select=id,topic_id')).filter(t => старыеId.has(t.topic_id));
if (остались.length) {
  console.log(`✗ В старых темах остались задачи (${остались.map(t => '#' + t.id).join(', ')}) — старые темы не удалены.`);
  await exitSafely(1);
}
for (const t of старые) await api('DELETE', `topics?id=eq.${t.id}`);
console.log(`удалено старых тем: ${старые.length} (с ними ${подтемыСтарых.length} подтем)`);
console.log('\nготово. Дальше: scripts/renumber-tasks.mjs --apply, scripts/sync-catalog-from-db.mjs и scripts/make-subtopics-doc.mjs');
