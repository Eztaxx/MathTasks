import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env'), 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);

const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY;
if (!serviceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const H = {
  apikey: serviceKey,
  Authorization: 'Bearer ' + serviceKey,
  'Content-Type': 'application/json',
  Prefer: 'return=representation'
};

const DESCRIPTIONS = [
  {
    position: 1,
    ru: 'Преобразование алгебраических выражений, формулы сокращенного умножения, методы разложения на множители, линейные и квадратные уравнения, уравнения и неравенства с модулем.',
    lv: 'Algebrisko izteiksmju pārveidošana, saīsinātās reizināšanas formulas, sadalīšana reizinātājos, lineāri un kvadrātvienādojumi, vienādojumi un nevienādības ar moduli.'
  },
  {
    position: 2,
    ru: 'Область допустимых значений, сокращение алгебраических дробей, приведение к общему знаменателю, сложение, вычитание, умножение и деление дробей.',
    lv: 'Pieļaujamo vērtību kopa, algebrisko daļu saīsināšana, vienādošana, saskaitīšana, atņemšana, reizināšana un dalīšana.'
  },
  {
    position: 3,
    ru: 'Дробно-рациональные уравнения, нахождение области определения, проверка корней, сведение к целым уравнениям и решение текстовых задач.',
    lv: 'Daļveida racionālie vienādojumi, definīcijas apgabala noteikšana, sakņu pārbaude, reducēšana uz veseliem vienādojumiem un teksta uzdevumi.'
  },
  {
    position: 4,
    ru: 'Системы нелинейных уравнений с двумя переменными, метод подстановки, метод сложения, замена переменной и графическая интерпретация решений.',
    lv: 'Nelineāru vienādojumu sistēmas ar diviem mainīgajiem, ievietošanas un saskaitīšanas paņēmieni, mainīgā maiņa un atrisinājumu grafiskā interpretācija.'
  },
  {
    position: 5,
    ru: 'Метод интервалов для решения рациональных неравенств, строгие и нестрогие неравенства, системы и совокупности неравенств, числовые промежутки.',
    lv: 'Intervālu metode racionālu nevienādību risināšanā, stingras un nestingras nevienādības, nevienādību sistēmas un skaitļu intervāli.'
  },
  {
    position: 6,
    ru: 'Угол поворота, радианная мера угла, единичная окружность, теорема синусов и косинусов, площади многоугольников, свойства окружности и геометрические преобразования.',
    lv: 'Pagrieziena leņķis, radiāna mērs, vienības riņķa līnija, sinusu un kosinusu teorēma, daudzstūru laukumi, riņķa līnijas īpašības un ģeometriskie pārveidojumi.'
  },
  {
    position: 7,
    ru: 'Область определения и значений, монотонность, экстремумы, нули, квадратичная и дробно-линейная функции, параллельный перенос и растяжение графиков.',
    lv: 'Definīcijas un vērtību kopa, monotonitāte, ekstrēmi, nulles, kvadrātfunkcija un daļveida lineāra funkcija, grafiku paralēlā pārnese un stiepšana.'
  },
  {
    position: 8,
    ru: 'Функции y = sin x и y = cos x, их периодичность, амплитуда, графики синусоиды и косинусоиды, исследование гармонических процессов.',
    lv: 'Funkcijas y = sin x un y = cos x, to periodiskums, amplitūda, sinusoīdas un kosinusoīdas grafiki, harmonisko procesu pētīšana.'
  },
  {
    position: 9,
    ru: 'Основное тригонометрическое тождество, формулы приведения, формулы сложения аргументов и двойного угла, упрощение тригонометрических выражений.',
    lv: 'Trigonometriskā pamatidentitāte, redukcijas formulas, argumentu summas un divkāršā argumenta formulas, trigonometrisko izteiksmju vienkāršošana.'
  },
  {
    position: 10,
    ru: 'Простейшие тригонометрические уравнения sin x = a, cos x = a, tg x = a, серии решений на числовой окружности и отбор корней на отрезке.',
    lv: 'Pamatvienādojumi sin x = a, cos x = a, tg x = a, atrisinājumu sērijas uz vienības riņķa līnijas un sakņu atlase dotajā intervālā.'
  },
  {
    position: 11,
    ru: 'Векторы на плоскости и в пространстве, координаты вектора, сложение и умножение на число, длина вектора, угол между векторами и скалярное произведение.',
    lv: 'Vektori plaknē un telpā, vektora koordinātas, saskaitīšana un reizināšana ar skaitli, vektora garums, leņķis starp vektoriem un skalārais reizinājums.'
  },
  {
    position: 12,
    ru: 'Общее и угловое уравнение прямой, условия параллельности и перпендикулярности, уравнение окружности, геометрическое изображение неравенств на плоскости.',
    lv: 'Taisnes vienādojums, paralelitātes un perpendikularitātes nosacījumi, riņķa līnijas vienādojums, nevienādību ģeometriskais attēlojums plaknē.'
  },
  {
    position: 13,
    ru: 'Корень n-й степени, степень с рациональным показателем, степенная функция, свойства и формулы n-го члена и суммы прогрессий.',
    lv: 'N-tās pakāpes sakne, pakāpe ar racionālu kāpinātāju, pakāpes funkcija, progresiju n-tā locekļa un summas formulas un īpašības.'
  },
  {
    position: 14,
    ru: 'Показательная функция y = aˣ и экспоненциальный рост, определение и свойства логарифмов, основное логарифмическое тождество, логарифмическая функция.',
    lv: 'Eksponentfunkcija y = aˣ un eksponenciālie procesi, logaritma definīcija un īpašības, logaritmiskā pamatidentitāte, logaritmiskā funkcija.'
  },
  {
    position: 15,
    ru: 'Методы решения показательных уравнений приведением к общему основанию и заменой переменной, простейшие логарифмические уравнения и показательные неравенства.',
    lv: 'Eksponentvienādojumu risināšanas metodes ar vienādo bāzu paņēmienu un mainīgā maiņu, vienkāršākie logaritmiskie vienādojumi un eksponentnevienādības.'
  },
  {
    position: 16,
    ru: 'Аксиомы стереометрии, взаимное расположение прямых и плоскостей в пространстве, параллельность и перпендикулярность, угол между прямой и плоскостью, двугранный угол.',
    lv: 'Stereometrijas aksiomas, taišņu un plakņu savstarpējais novietojums telpā, paralelitāte un perpendikularitāte, taisnes un plaknes leņķis, divplakņu kaktu leņķis.'
  },
  {
    position: 17,
    ru: 'Прямые и наклонные призмы, правильные пирамиды, параллелепипед, площадь боковой и полной поверхности, объем многогранников и сечения плоскостью.',
    lv: 'Taisnas un slīpas prizmas, regulāras piramīdas, paralēlskaldnis, sānu un pilnas virsmas laukums, daudzskaldņu tilpums un šķēlumi ar plakni.'
  },
  {
    position: 18,
    ru: 'Цилиндр, конус, шар и сфера, осевые сечения тел вращения, формулы площади поверхности и объема, комбинации многогранников и круглых тел.',
    lv: 'Cilindrs, konuss, lode un sfēra, rotācijas ķermeņu ass šķēlumi, virsmas laukuma un tilpuma formulas, daudzskaldņu un rotācijas ķermeņu kombinācijas.'
  },
  {
    position: 19,
    ru: 'Множества, операции над множествами, правила сложения и умножения комбинаторики, формулы перестановок, размещений и сочетаний.',
    lv: 'Kopas, darbības ar kopām, kombinatorikas saskaitīšanas un reizināšanas likumi, permutāciju, variāciju un kombināciju formulas.'
  },
  {
    position: 20,
    ru: 'Классическое определение вероятности случайного события, дерево вероятностей, сложение и умножение вероятностей, независимые и зависимые события, условная вероятность.',
    lv: 'Klasiskā varbūtības definīcija, varbūtību koks, varbūtību saskaitīšana un reizināšana, neatkarīgi un atkarīgi notikumi, nosacītā varbūtība.'
  },
  {
    position: 21,
    ru: 'Генеральная совокупность и выборка, частотные таблицы, среднее арифметическое, медиана, мода, размах, дисперсия и стандартное отклонение, диаграммы и гистограммы.',
    lv: 'Populācija un izlase, biežumu tabulas, aritmētiskais vidējais, mediāna, moda, amplitūda, dispersija un standartnovirze, diagrammas un histogrammas.'
  },
  {
    position: 22,
    ru: 'Повторение и систематизация ключевых тем курса Математика I (алгебра, функции, геометрия, статистика и вероятность) и комплексная подготовка к экзамену оптимального уровня.',
    lv: 'Kursa Matemātika I galveno tematu (algebra, funkcijas, ģeometrija, statistika un varbūtība) atkārtojums, sistematizēšana un sagatavošanās optimālā līmeņa eksāmenam.'
  }
];

console.log('Updating 22 topics for grade 11 in Supabase...');

for (const item of DESCRIPTIONS) {
  const url = `${env.SUPABASE_URL}/rest/v1/topics?grade=eq.11&position=eq.${item.position}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({
      description: item.ru,
      description_lv: item.lv
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Error updating topic pos ${item.position}: ${res.status} ${errText}`);
    process.exit(1);
  }
  const updated = await res.json();
  console.log(`Updated 11.${item.position}: ${updated[0]?.title}`);
}

console.log('All 22 topics updated successfully in Supabase!');
