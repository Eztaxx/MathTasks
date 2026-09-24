/* Приводит Vispārīgais līmenis (grade 10) к программе Skola2030: 7 тем по
 * 8 подтем вместо 25 тем старого засева.
 *
 *   node scripts/import-visparigais-programme.mjs            — сухой прогон
 *   node scripts/import-visparigais-programme.mjs --apply    — запись
 *
 * Источники:
 * - темы 1–3, 6, 7 — «Matemātika — vispārīgais līmenis. Темы и подтемы по
 *   программе Skola2030»: названия тем и подтем на обоих языках оттуда
 *   дословно;
 * - темы 4 и 5 — «Ceļa karte skolotājam. Matemātika (vispārīgais līmenis
 *   profesionālās izglītības iestādēm)» VISC: в документе выше их подтемы
 *   были восстановлены косвенно и с программой разошлись — не было векторов,
 *   уравнения прямой и дробно-линейной функции, зато была арифметическая
 *   прогрессия. Подтемы собраны по разделам «Temata apguves norise» и
 *   «Sasniedzamie rezultāti» этих карт, часы — «Ieteicamais laiks».
 * Описаний тем в источниках нет — они собраны из их же подтем.
 *
 * Два режима, выбираются сами:
 * - замена: у уровня ещё старые темы. Создаются 7 тем и их подтемы, задачи
 *   переезжают по таблице ЗАДАЧИ, старые темы удаляются. В отличие от
 *   Matemātika I и II (scripts/import-level-programme.mjs) старые темы не
 *   становятся подтемами: у программы свой готовый список подтем;
 * - сверка: 7 тем программы уже в базе. Названия, описания и подтемы
 *   правятся на месте, номера тем и подтем сохраняются, задачи
 *   досортировываются. Так исправления программы не пересоздают каталог.
 * Скрипт останавливается, если нашлась задача, которой нет в таблице, если
 * на удаляемую тему ссылается экзаменационный вариант (удаление снесло бы
 * его каскадом) или если лишняя подтема ещё держит задачи.
 */
import { exitSafely } from './lib/exit-safely.mjs';
import { fetchAll } from './lib/fetch-all.mjs';
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
// Постранично и с явным порядком — общий помощник scripts/lib/fetch-all.mjs.
const getAll = path => fetchAll(env.SUPABASE_URL + '/rest/v1/' + path, H);

const слаг = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 46);

/* ── Программа ─────────────────────────────────────────────────────
   h — часы. Раздел сайта подобран по разделу экзамена: геометрия
   разложена на планиметрию и стереометрию, функции — в свой раздел, как
   у остальных уровней. */
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
    /* Ceļa karte: «Plaknes figūras» → «Vektori ģeometriskā formā» →
       «Vektori koordinātu formā» → «Vektori telpā. Telpas koordinātas» →
       «Taisnes vienādojums». */
    n: 4, h: 40, s: 'planimetrija',
    lv: 'Plaknes figūras praktiskos kontekstos', ru: 'Фигуры на плоскости в практических задачах',
    d_ru: 'Свойства и движения плоских фигур, площадь, векторы на плоскости и в пространстве, координаты, уравнение прямой.',
    d_lv: 'Plaknes figūru īpašības un pārvietojumi, laukums, vektori plaknē un telpā, koordinātas, taisnes vienādojums.',
    под: [
      ['Sakarības starp trijstūra, četrstūra malām, leņķiem un raksturīgo nogriežņu garumiem', 'Соотношения между сторонами, углами и характерными отрезками треугольника и четырёхугольника'],
      ['Plaknes figūru vienādība un līdzība', 'Равенство и подобие плоских фигур'],
      ['Figūru laukums: sadalīšana daļās un papildināšana līdz pazīstamai figūrai', 'Площадь фигур: разбиение на части и достраивание до известной фигуры'],
      ['Pārvietojumi: paralēlā pārnese, aksiālā simetrija, pagrieziens', 'Движения плоскости: параллельный перенос, осевая симметрия, поворот'],
      ['Vektors, skalāri un vektoriāli lielumi; darbības ar vektoriem ģeometriskā formā', 'Вектор, скалярные и векторные величины; действия с векторами в геометрической форме'],
      ['Vektora koordinātas un garums, darbības koordinātu formā; attālums starp punktiem, nogriežņa viduspunkts', 'Координаты и длина вектора, действия в координатах; расстояние между точками, середина отрезка'],
      ['Vektori telpā, telpas koordinātas', 'Векторы в пространстве, координаты в пространстве'],
      ['Taisnes vienādojums, virziena koeficients, argumenta un funkcijas pieaugums', 'Уравнение прямой, угловой коэффициент, приращение аргумента и функции'],
    ],
  },
  {
    /* Ceļa karte: «Virknes» → «Funkcija» → «Daļveida funkcija» →
       «Eksponentfunkcija». Арифметической прогрессии в карте нет. */
    n: 5, h: 26, s: 'funkcijas',
    lv: 'Funkcijas kā reālu situāciju matemātiskais modelis', ru: 'Функции как модели реальных ситуаций',
    d_ru: 'Числовые последовательности и геометрическая прогрессия, дробно-линейная и показательная функции, моделирование реальных процессов.',
    d_lv: 'Skaitļu virknes un ģeometriskā progresija, daļveida funkcija un eksponentfunkcija, reālu procesu modelēšana.',
    под: [
      ['Skaitļu virkņu veidi: augošas, dilstošas, konstantas, galīgas, bezgalīgas un maiņzīmju virknes', 'Виды числовых последовательностей: возрастающие, убывающие, постоянные, конечные, бесконечные и знакочередующиеся'],
      ['Ģeometriskā progresija, vispārīgā locekļa formula, saliktie procenti', 'Геометрическая прогрессия, формула общего члена, сложные проценты'],
      ['Funkcijas formula, grafiks un īpašības; lineārā funkcija un kvadrātfunkcija', 'Формула, график и свойства функции; линейная и квадратичная функции'],
      ['Argumenta un funkcijas pieaugums, augošas un dilstošas funkcijas', 'Приращение аргумента и функции, возрастающие и убывающие функции'],
      ['Daļveida funkcija un tās grafiks — hiperbola', 'Дробно-линейная функция и её график — гипербола'],
      ['Eksponentfunkcija un tās grafiks — eksponente; saistība ar ģeometrisko progresiju', 'Показательная функция и её график — экспонента; связь с геометрической прогрессией'],
      ['Vienkāršākie eksponentvienādojumi: saknes noteikšana no grafika un ar logaritma definīciju', 'Простейшие показательные уравнения: корень по графику и через определение логарифма'],
      ['Situāciju raksturošana pēc grafika: lineāra funkcija, kvadrātfunkcija, daļveida funkcija, eksponentfunkcija', 'Описание ситуаций по графику: линейная, квадратичная, дробно-линейная и показательная функции'],
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

/* ── Куда ложится каждая задача ────────────────────────────────────
   Номер подтемы — «тема.подтема» из программы. Пяти задач старого засева
   здесь нет: их тем в программе общего уровня нет. #11 (дробное
   неравенство) и #12 (теорема косинусов) перенесены в Matemātika I —
   в 11.5.1 и 11.6.3; #13, #94 и #106 удалены как копии задач, которые в
   Matemātika I уже были (#156, #133, #155). */
const ЗАДАЧИ = {
  83:  ['3.3', 'расход топлива — пропорция'],
  84:  ['3.2', 'цена с PVN — проценты'],
  85:  ['5.2', 'вклад со сложными процентами — геометрическая прогрессия'],
  86:  ['6.1', 'выразить основание из формулы площади трапеции'],
  87:  ['6.8', 'участок: уравнение по условию задачи'],
  88:  ['6.1', 'линейное неравенство равносильными преобразованиями'],
  89:  ['5.3', 'значение функции, заданной формулой'],
  90:  ['5.3', 'пересечение прямой с осью Ox'],
  91:  ['5.3', 'вершина параболы'],
  92:  ['3.1', 'плата за электричество по счётчику'],
  93:  ['4.1', 'лестница у стены — косинус угла'],
  95:  ['3.8', 'площадь поля в гектарах — перевод единиц'],
  96:  ['4.2', 'масштаб карты — подобие'],
  97:  ['4.2', 'высота столба по тени — подобие'],
  98:  ['4.3', 'площадь круглой клумбы'],
  99:  ['7.7', 'объём бассейна'],
  100: ['7.7', 'объём кучи песка — конус'],
  101: ['7.7', 'площадь сферы'],
  102: ['3.8', 'банки краски — округление вверх'],
  103: ['1.6', 'относительная частота'],
  104: ['2.5', 'средневзвешенный балл'],
  105: ['2.4', 'угол сектора круговой диаграммы'],
  107: ['1.8', 'вероятность в лотерее'],
  108: ['1.8', 'два независимых датчика'],
};

// ── Проверка программы до обращения к базе ──────────────────────────
const коды = new Set(ТЕМЫ.flatMap(т => т.под.map((_, i) => `${т.n}.${i + 1}`)));
for (const [id, [код]] of Object.entries(ЗАДАЧИ)) {
  if (!коды.has(код)) { console.error(`задача #${id}: подтемы ${код} в программе нет`); await exitSafely(1); }
}

const [subjects, topics, subs, tasks, papers, paperTopics] = await Promise.all([
  getAll('subjects?select=id,slug&order=id'),
  getAll('topics?select=id,title,title_lv,description,description_lv,grade,position,slug,subject_id&order=id'),
  getAll('subtopics?select=id,topic_id,slug,code,title,title_lv,position&order=id'),
  getAll('tasks?select=id,topic_id,subtopic_id,is_published&order=id'),
  getAll('exam_papers?select=id,topic_id&order=id'),
  getAll('exam_paper_topics?select=paper_id,topic_id&order=paper_id,topic_id'),
]);
const разделId = Object.fromEntries(subjects.map(s => [s.slug, s.id]));
for (const т of ТЕМЫ) {
  if (!разделId[т.s]) { console.error(`раздела «${т.s}» в базе нет`); await exitSafely(1); }
}

const темыУровня = topics.filter(t => t.grade === GRADE).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
const idУровня = new Set(темыУровня.map(t => t.id));
const задачиУровня = tasks.filter(t => idУровня.has(t.topic_id));

// Ни одна задача не должна остаться без места.
const безМеста = задачиУровня.filter(t => !ЗАДАЧИ[t.id]);
if (безМеста.length) {
  console.log('✗ Задачи без места в таблице ЗАДАЧИ:');
  безМеста.forEach(t => console.log(`   #${t.id}`));
  await exitSafely(1);
}
const лишние = Object.keys(ЗАДАЧИ).map(Number).filter(id => !задачиУровня.some(t => t.id === id));
if (лишние.length) console.log(`! В таблице есть задачи, которых нет на уровне: ${лишние.map(id => '#' + id).join(', ')}`);

const слагТемы = т => `${ПРЕФИКС}-${слаг(т.lv)}`;
/* Тема программы уже в базе — если на уровне ровно её тема с тем же
   слагом (или со слагом, которому при создании пришлось дописать номер). */
const наМесте = т => темыУровня.find(t => t.slug === слагТемы(т) || t.slug === `${слагТемы(т)}-${т.n}`);
const режимСверки = темыУровня.length === ТЕМЫ.length && ТЕМЫ.every(наМесте);

const слагПодтемЗанят = new Set(subs.map(s => s.slug));
const новыйСлагПодтемы = (lv, код) => {
  let slug = `${слаг(lv) || 'apakstema'}-${код.replace(/\./g, '-')}`;
  for (let k = 2; слагПодтемЗанят.has(slug); k++) slug = `${слаг(lv)}-${код.replace(/\./g, '-')}-${k}`;
  слагПодтемЗанят.add(slug);
  return slug;
};

const печатьПлана = () => {
  console.log('\n── Программа ──');
  for (const т of ТЕМЫ) {
    console.log(`${т.n}. ${т.lv} / ${т.ru}  [${т.s}, ${т.h} ч]`);
    т.под.forEach(([, ru], i) => {
      const код = `${т.n}.${i + 1}`;
      console.log(`   ${GRADE}.${код}  ${ru}`);
      for (const [id, [к, что]] of Object.entries(ЗАДАЧИ)) {
        if (к === код) console.log(`            ← #${id} ${что}`);
      }
    });
  }
};

console.log(`Vispārīgais līmenis: в базе тем ${темыУровня.length}, задач ${задачиУровня.length}`);
console.log(`Программа: тем ${ТЕМЫ.length}, подтем ${коды.size}, часов ${ТЕМЫ.reduce((a, т) => a + т.h, 0)}`);
console.log(`Режим: ${режимСверки ? 'сверка — темы программы уже в базе, правка на месте' : 'замена старых тем'}`);

if (режимСверки) {
  /* ── Сверка: правим на месте, номера сохраняются ───────────────── */
  const правки = [];
  const подтемаПоКоду = new Map();
  const нужныеКоды = new Set();

  for (const т of ТЕМЫ) {
    const тема = наМесте(т);
    const нужно = {
      title: т.ru, title_lv: т.lv, description: т.d_ru, description_lv: т.d_lv,
      position: т.n, subject_id: разделId[т.s],
    };
    const разница = Object.fromEntries(Object.entries(нужно).filter(([k, v]) => тема[k] !== v));
    if (Object.keys(разница).length) {
      правки.push({ что: `тема ${т.n}: ${Object.keys(разница).join(', ')}`, запрос: ['PATCH', `topics?id=eq.${тема.id}`, разница] });
    }

    т.под.forEach(([lv, ru], i) => {
      const код = `${GRADE}.${т.n}.${i + 1}`;
      нужныеКоды.add(`${тема.id}|${код}`);
      const есть = subs.find(s => s.topic_id === тема.id && s.code === код);
      if (!есть) {
        правки.push({
          что: `подтема ${код} создать: ${ru}`,
          запрос: ['POST', 'subtopics', { topic_id: тема.id, title: ru, title_lv: lv, code: код, position: i + 1, slug: новыйСлагПодтемы(lv, код) }],
          код: `${т.n}.${i + 1}`, тема,
        });
        return;
      }
      подтемаПоКоду.set(`${т.n}.${i + 1}`, { sub: есть, тема });
      const разн = {};
      if (есть.title !== ru) разн.title = ru;
      if (есть.title_lv !== lv) {
        разн.title_lv = lv;
        // Слаг идёт за латышским названием: адрес подтемы должен совпадать с ней.
        слагПодтемЗанят.delete(есть.slug);
        разн.slug = новыйСлагПодтемы(lv, код);
      }
      if (есть.position !== i + 1) разн.position = i + 1;
      if (Object.keys(разн).length) {
        правки.push({ что: `подтема ${код}: ${есть.title} → ${ru}`, запрос: ['PATCH', `subtopics?id=eq.${есть.id}`, разн] });
      }
    });
  }

  // Подтемы уровня, которых в программе нет, — к удалению, но только пустые.
  const лишниеПодтемы = subs.filter(s => idУровня.has(s.topic_id) && !нужныеКоды.has(`${s.topic_id}|${s.code}`));

  console.log('\n── Правки ──');
  правки.forEach(п => console.log('  ' + п.что));
  лишниеПодтемы.forEach(s => console.log(`  подтема ${s.code} удалить: ${s.title}`));

  // Задачи — туда, куда велит таблица; сравнивать можно, только когда все подтемы уже есть.
  const переезды = [];
  for (const [id, [код]] of Object.entries(ЗАДАЧИ)) {
    const задача = задачиУровня.find(t => t.id === Number(id));
    if (!задача) continue;
    const место = подтемаПоКоду.get(код);
    if (!место || задача.topic_id !== место.тема.id || задача.subtopic_id !== место.sub.id) переезды.push([Number(id), код]);
  }
  переезды.forEach(([id, код]) => console.log(`  задача #${id} → ${GRADE}.${код}`));
  if (!правки.length && !лишниеПодтемы.length && !переезды.length) console.log('  расхождений нет');

  печатьПлана();
  if (!APPLY) { console.log('\nСухой прогон. Запись: --apply'); await exitSafely(0); }

  console.log('\n=== запись ===');
  for (const п of правки) {
    const [method, path, body] = п.запрос;
    const ответ = await api(method, path, body, method === 'POST' ? { Prefer: 'return=representation' } : {});
    if (method === 'POST') подтемаПоКоду.set(п.код, { sub: ответ[0], тема: п.тема });
  }
  console.log(`правок тем и подтем: ${правки.length}`);

  let перенесено = 0;
  for (const [id, код] of переезды) {
    const { sub, тема } = подтемаПоКоду.get(код);
    await api('PATCH', `tasks?id=eq.${id}`, { topic_id: тема.id, subtopic_id: sub.id, grade: GRADE });
    перенесено++;
  }
  console.log(`перенесено задач: ${перенесено}`);

  // Удаляем лишнюю подтему, только если в ней не осталось задач.
  const задачиПосле = await getAll('tasks?select=id,subtopic_id&order=id');
  for (const s of лишниеПодтемы) {
    const держит = задачиПосле.filter(t => t.subtopic_id === s.id);
    if (держит.length) { console.log(`✗ подтема ${s.code} держит задачи ${держит.map(t => '#' + t.id).join(', ')} — не удалена`); continue; }
    await api('DELETE', `subtopics?id=eq.${s.id}`);
  }
  console.log(`удалено лишних подтем: ${лишниеПодтемы.length}`);
  console.log('\nготово. Дальше: scripts/renumber-tasks.mjs --apply, scripts/sync-catalog-from-db.mjs и scripts/make-subtopics-doc.mjs');
  await exitSafely(0);
}

/* ── Замена: старые темы уходят, темы программы создаются заново ──── */
const старые = темыУровня;
const старыеId = idУровня;
const подтемыСтарых = subs.filter(s => старыеId.has(s.topic_id));

// Удаление темы каскадом снесёт экзаменационные варианты, привязанные к ней.
const варианты = [...papers.filter(p => старыеId.has(p.topic_id)), ...paperTopics.filter(p => старыеId.has(p.topic_id))];
if (варианты.length) {
  console.log('\n✗ На старые темы ссылаются экзаменационные варианты — удаление снесёт их:');
  варианты.forEach(v => console.log('   ', JSON.stringify(v)));
  await exitSafely(1);
}

// Слаги: у тем — с префиксом уровня (по нему сайт узнаёт ступень), у подтем — с номером.
const слагТемЗанят = new Set(topics.filter(t => !старыеId.has(t.id)).map(t => t.slug));
const слагиТем = new Map();
for (const т of ТЕМЫ) {
  let slug = слагТемы(т);
  if (слагТемЗанят.has(slug) || topics.some(t => t.slug === slug)) slug = `${slug}-${т.n}`;
  слагТемЗанят.add(slug);
  слагиТем.set(т.n, slug);
}

печатьПлана();
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
      code: код, position: i + 1, slug: новыйСлагПодтемы(lv, код),
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
const остались = (await getAll('tasks?select=id,topic_id&order=id')).filter(t => старыеId.has(t.topic_id));
if (остались.length) {
  console.log(`✗ В старых темах остались задачи (${остались.map(t => '#' + t.id).join(', ')}) — старые темы не удалены.`);
  await exitSafely(1);
}
for (const t of старые) await api('DELETE', `topics?id=eq.${t.id}`);
console.log(`удалено старых тем: ${старые.length} (с ними ${подтемыСтарых.length} подтем)`);
console.log('\nготово. Дальше: scripts/renumber-tasks.mjs --apply, scripts/sync-catalog-from-db.mjs и scripts/make-subtopics-doc.mjs');
