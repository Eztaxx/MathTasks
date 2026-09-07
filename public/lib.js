/* Чистые функции без DOM и без сети — общие для сайта и админки.
   Файл работает и как обычный скрипт в браузере, и как модуль в тестах:
   именно эти три места дважды ломались на экранировании, и проверять их
   глазами оказалось недостаточно. */
(() => {
  const TRANSLITERATION = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
    й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
    у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ы: 'y', э: 'e',
    ю: 'yu', я: 'ya', ь: '', ъ: ''
  };

  const makeSlug = value => (value || '')
    .toLowerCase()
    .split('')
    .map(char => TRANSLITERATION[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'topic';

  /* PostgREST разбирает фильтр .or() по запятым и скобкам, поэтому эти символы
     из запроса убираем — иначе запрос ломается прямо на сервере. */
  const sanitizeSearch = value => (value || '')
    .replace(/[,()"'*%\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  /* Условие задачи — текст с формулами, а не одна формула: KaTeX вызывается
     только внутри разделителей, поэтому пробелы в словах остаются на месте,
     а знак % не превращается в начало LaTeX-комментария. */
  const KATEX_DELIMITERS = [
    { left: '$$', right: '$$', display: true },
    { left: '\\[', right: '\\]', display: true },
    { left: '$', right: '$', display: false },
    { left: '\\(', right: '\\)', display: false }
  ];

  /* Очистка условия задачи от шаблонных вводных фраз для компактного тренажёра */
  const cleanMathExample = val => {
    if (!val) return '';
    let s = String(val).trim();
    const prefixRegex = /^(?:atrisiniet(?:\s+(?:vienādojumu|kvadrātvienādojumu|nevienādību(?:\s+ar\s+intervālu\s+metodi)?|sistēmu))?|aprēķiniet(?:\s+(?:skaitliskās\s+)?izteiksmes\s+vērtību)?|vienkāršojiet(?:\s+izteiksmi)?|atrodiet(?:\s+izteiksmes\s+vērtību)?|решите(?:\s+(?:уравнение|квадратное\s+уравнение|неравенство(?:\s+методом\s+интервалов)?|систему(?:\s+уравнений)?))?|вычислите(?:\s+(?:значение\s+(?:числового\s+)?выражения)?)?|найдите(?:\s+значение\s+выражения)?|упростите(?:\s+выражение)?)\s*[:—–-]?\s*/i;
    const cleaned = s.replace(prefixRegex, '').trim();
    return cleaned || s;
  };

  /* Нормализация и сравнение математических ответов ученика с эталоном из базы */
  const normalizeMathAnswer = val => {
    if (val == null) return '';
    let s = String(val).trim();
    s = s.replace(/^\$+|\$+$/g, '').trim();
    s = s.replace(/(\d+)\{,\}(\d+)/g, '$1.$2');
    s = s.replace(/(\d+),(\d+)/g, '$1.$2');
    s = s.replace(/\s*:\s*/g, ';');
    s = s.replace(/\\(text|mathbf|mathrm|quad|qquad)\s*\{([^}]*)\}/g, '$2');
    s = s.replace(/\\(text|mathbf|mathrm|quad|qquad)/g, '');
    s = s.replace(/^[a-zA-Z](_[0-9a-zA-Z]+)?\s*=\s*/, '');
    s = s.replace(/\\(cdot|times)/g, '*');
    s = s.replace(/·/g, '*');
    s = s.replace(/²/g, '^2');
    s = s.replace(/³/g, '^3');
    s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2');
    s = s.replace(/√\s*\(([^)]+)\)/g, 'sqrt($1)');
    s = s.replace(/√\s*(\d+|[a-zA-Z]+)/g, 'sqrt($1)');
    s = s.replace(/√/g, 'sqrt');
    s = s.replace(/±/g, '+-');
    s = s.replace(/\\pm\b/g, '+-');
    s = s.replace(/π/g, 'pi');
    s = s.replace(/\\pi\b/g, 'pi');
    s = s.replace(/≤/g, '<=');
    s = s.replace(/\\le\b|\\leq\b/g, '<=');
    s = s.replace(/≥/g, '>=');
    s = s.replace(/\\ge\b|\\geq\b/g, '>=');
    s = s.replace(/\\neq\b/g, '!=');
    s = s.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)');
    s = s.replace(/\s+/g, '');
    if (s.startsWith('(') && s.endsWith(')')) {
      let depth = 0;
      let ok = true;
      for (let i = 0; i < s.length - 1; i++) {
        if (s[i] === '(') depth++;
        else if (s[i] === ')') depth--;
        if (depth === 0) { ok = false; break; }
      }
      if (ok) s = s.slice(1, -1);
    }
    return s.toLowerCase();
  };

  /* Единицы и валюты, которые пишут в ответе после числа. Степень
     (^2, ^3) снимаем вместе с ними: «см^2» — та же единица. */
  const UNIT_WORDS = /(?:см|мм|дм|км|м|га|кг|мг|г|тонн[аы]?|л|мл|ч|мин|сек|с|руб|евро|cm|mm|dm|km|ha|kg|mg|g|t|ml|min|sec|h|s|eur|€|%)(?:\^\d)?/gi;

  const stripUnits = str => String(str)
    .replace(UNIT_WORDS, '')
    .replace(/[\s;,]+$/, '')
    .trim();

  const parseFractionOrNumber = str => {
    if (/^-?\d+(\.\d+)?$/.test(str)) return parseFloat(str);
    const frac = str.match(/^(-?\d+)\/(\d+)$/);
    if (frac && Number(frac[2]) !== 0) return Number(frac[1]) / Number(frac[2]);
    return null;
  };

  const compareAnswers = (userAns, correctAns) => {
    const u = normalizeMathAnswer(userAns);
    const c = normalizeMathAnswer(correctAns);
    if (!u || !c) return false;
    if (u === c) return true;

    const numU = parseFractionOrNumber(u);
    const numC = parseFractionOrNumber(c);
    if (numU !== null && numC !== null && Math.abs(numU - numC) < 1e-6) return true;

    const cleanC = c.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)').replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)');
    if (u === cleanC) return true;

    /* Единицу измерения ученик обычно не набирает: в поле ответа он пишет
       «6», а не «6см» — какая это величина, сказано в условии. Эталон же
       хранится вместе с единицей у 124 задач из 435, и без этой поблажки
       верный ответ отмечался как ошибка. Сравниваем ещё раз, сняв единицы
       с обеих сторон; если после этого не осталось чисел, поблажка не
       применяется, чтобы «см» не совпало с «кг». */
    const uBare = stripUnits(u);
    const cBare = stripUnits(c);
    /* Поблажка только тогда, когда ученик единицу вовсе не писал. Если
       написал — она должна совпасть: «6 кг» не тот же ответ, что «6 см». */
    const userWroteUnit = uBare !== u;
    if (!userWroteUnit && uBare && cBare && /\d/.test(cBare)) {
      if (uBare === cBare) return true;
      const nU = parseFractionOrNumber(uBare);
      const nC = parseFractionOrNumber(cBare);
      if (nU !== null && nC !== null && Math.abs(nU - nC) < 1e-6) return true;
    }

    return false;
  };

  /* Подсчёт прогресса решения задач темы */
  const calcTopicProgress = (taskIds = [], solvedIds = []) => {
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return { total: 0, solved: 0, percent: 0, isComplete: false };
    }
    const solvedSet = new Set((solvedIds || []).map(Number));
    const solvedCount = taskIds.filter(id => solvedSet.has(Number(id))).length;
    const percent = Math.round((solvedCount / taskIds.length) * 100);
    return {
      total: taskIds.length,
      solved: solvedCount,
      percent,
      isComplete: solvedCount === taskIds.length && taskIds.length > 0
    };
  };

  /* Форматирование времени секундомера / таймера в MM:SS или H:MM:SS */
  const formatTimerDisplay = seconds => {
    const s = Math.max(0, Math.floor(seconds || 0));
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const pad = n => String(n).padStart(2, '0');
    if (hrs > 0) return `${hrs}:${pad(mins)}:${pad(secs)}`;
    return `${pad(mins)}:${pad(secs)}`;
  };

  /* Получение локализованного текста из сущности (task, topic, subject) с мягким fallback */
  const getLocalizedText = (item, field, lang = 'ru') => {
    if (!item || !field) return '';
    const currentLang = (lang || 'ru').toLowerCase();
    if (currentLang !== 'ru') {
      const localizedVal = item[`${field}_${currentLang}`];
      if (localizedVal && typeof localizedVal === 'string' && localizedVal.trim()) {
        return localizedVal;
      }
    }
    return item[field] || '';
  };

  /* Маскирование математических формул перед отправкой в переводчик */
  const maskLatexForTranslation = (text = '') => {
    if (!text) return { maskedText: '', tokens: [] };
    const tokens = [];
    const mathRegex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g;
    const maskedText = text.replace(mathRegex, match => {
      const idx = tokens.length;
      tokens.push(match);
      return `__MATH_EXPR_${idx}__`;
    });
    return { maskedText, tokens };
  };

  /* Восстановление математических формул после перевода */
  const unmaskLatexAfterTranslation = (maskedText = '', tokens = []) => {
    if (!maskedText) return '';
    let result = maskedText;
    (tokens || []).forEach((tok, idx) => {
      const reg = new RegExp(`__\\s*MATH_EXPR_${idx}\\s*__`, 'g');
      // Используем функцию () => tok, чтобы избежать спецсимволов ($$) в строках замены JS
      result = result.replace(reg, () => tok);
    });
    return result;
  };

  /* Парсер JSON с поддержкой нескольких тем и задач */
  const parseFormGrade = val => {
    if (!val && val !== 0) return null;
    if (val === 'visparigais' || val === '10' || val === 10) return 10;
    if (val === 'matematika-1' || val === '11' || val === 11) return 11;
    if (val === 'matematika-2' || val === '12' || val === 12) return 12;
    const num = Number(val);
    return Number.isFinite(num) ? num : null;
  };

  const resolveDifficultyMix = (requestedDiff, index, total) => {
    if (requestedDiff !== 'mix') return requestedDiff;
    if (total <= 1) {
      const r = Math.random();
      if (r < 0.45) return 'Лёгкий';
      if (r < 0.80) return 'Средний';
      return 'Сложный';
    }
    // Распределение 45% лёгкий, 35% средний, 20% сложный
    const easyCount = Math.max(1, Math.round(total * 0.45));
    const medCount = Math.max(1, Math.round(total * 0.35));
    if (index < easyCount) return 'Лёгкий';
    if (index < easyCount + medCount) return 'Средний';
    return 'Сложный';
  };

  const parseMultiTopicJson = raw => {
    if (!raw || typeof raw !== 'string') {
      if (typeof raw === 'object' && raw !== null) {
        // уже распарсенный объект
      } else {
        throw new Error('Пустой или некорректный JSON');
      }
    }
    let parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) {
      if (Array.isArray(parsed.topics)) {
        parsed = parsed.topics;
      } else if (Array.isArray(parsed.tasks)) {
        parsed = parsed.tasks;
      } else {
        parsed = [parsed];
      }
    }

    const normalizedTopics = [];
    const normalizedTasks = [];

    for (const item of parsed) {
      if (!item) continue;
      // Вложенный массив tasks
      if (Array.isArray(item.tasks)) {
        const topicInfo = {
          title: String(item.topic_title || item.title || item.name || '').trim(),
          title_lv: item.topic_title_lv || item.title_lv ? String(item.topic_title_lv || item.title_lv).trim() : null,
          grade: parseFormGrade(item.grade),
          subject_id: item.subject_id ? Number(item.subject_id) : null,
          subject_slug: item.subject_slug ? String(item.subject_slug).trim() : null,
          subject_title: item.subject_title ? String(item.subject_title).trim() : null,
          description: item.description ? String(item.description).trim() : null,
          description_lv: item.description_lv ? String(item.description_lv).trim() : null
        };
        if (topicInfo.title) {
          normalizedTopics.push(topicInfo);
        }
        for (const t of item.tasks) {
          if (!t) continue;
          normalizedTasks.push({
            ...t,
            topic_title: t.topic_title || topicInfo.title,
            topic_title_lv: t.topic_title_lv || topicInfo.title_lv,
            grade: t.grade !== undefined ? parseFormGrade(t.grade) : topicInfo.grade,
            subject_id: t.subject_id ? Number(t.subject_id) : topicInfo.subject_id
          });
        }
      } else {
        // Плоская запись задачи
        const t = item;
        const topicTitle = String(t.topic_title || t.topic || '').trim();
        if (topicTitle) {
          normalizedTopics.push({
            title: topicTitle,
            title_lv: t.topic_title_lv ? String(t.topic_title_lv).trim() : null,
            grade: parseFormGrade(t.grade),
            subject_id: t.subject_id ? Number(t.subject_id) : null,
            subject_slug: t.subject_slug ? String(t.subject_slug).trim() : null,
            subject_title: t.subject_title ? String(t.subject_title).trim() : null,
            description: null,
            description_lv: null
          });
        }
        normalizedTasks.push(t);
      }
    }

    // Дедупликация тем по названию (case-insensitive)
    const uniqueTopics = [];
    const seen = new Set();
    for (const top of normalizedTopics) {
      const key = top.title.toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        uniqueTopics.push(top);
      }
    }

    return { uniqueTopics, tasks: normalizedTasks };
  };


  /* Закрытый словарь кросс-тегов стандарта Skola2030 (23 тега) */
  const CROSS_TAGS = [
    { slug: 'algebriskie-parveidojumi', title: 'Алгебраические преобразования', title_lv: 'Algebriskie pārveidojumi', description: 'Тождественные преобразования выражений, формулы сокращённого умножения', description_lv: 'Izteiksmju identiski pārveidojumi, saīsinātās reizināšanas formulas' },
    { slug: 'vienadojumi', title: 'Уравнения', title_lv: 'Vienādojumi', description: 'Уравнения всех типов и их системы', description_lv: 'Visu veidu vienādojumi un to sistēmas' },
    { slug: 'nevienadibas', title: 'Неравенства', title_lv: 'Nevienādības', description: 'Неравенства всех типов и их системы', description_lv: 'Visu veidu nevienādības un to sistēmas' },
    { slug: 'funkcijas', title: 'Функции', title_lv: 'Funkcijas', description: 'Функции, их свойства, область определения и значений', description_lv: 'Funkcijas, to īpašības, definīcijas un vērtību kopa' },
    { slug: 'grafiki', title: 'Графики', title_lv: 'Grafiki', description: 'Построение и чтение графиков функций', description_lv: 'Funkciju grafiku veidošana un lasīšana' },
    { slug: 'koordinatu-metode', title: 'Координатный метод', title_lv: 'Koordinātu metode', description: 'Координатная прямая, плоскость, векторы в координатах', description_lv: 'Koordinātu taisne un plakne, vektori koordinātās' },
    { slug: 'vektori', title: 'Векторы', title_lv: 'Vektori', description: 'Действия с векторами, скалярное произведение', description_lv: 'Darbības ar vektoriem, skalārais reizinājums' },
    { slug: 'trigonometrija', title: 'Тригонометрия', title_lv: 'Trigonometrija', description: 'Тригонометрические функции, тождества, уравнения и треугольники', description_lv: 'Trigonometriskās funkcijas, identitātes, vienādojumi un trijstūri' },
    { slug: 'planimetrija', title: 'Планиметрия', title_lv: 'Planimetrija', description: 'Фигуры на плоскости, углы, подобие, теорема Пифагора', description_lv: 'Figūras plaknē, leņķi, līdzība, Pitagora teorēma' },
    { slug: 'stereometrija', title: 'Стереометрия', title_lv: 'Stereometrija', description: 'Пространственные тела, сечения, призмы, пирамиды, тела вращения', description_lv: 'Telpiski ķermeņi, šķēlumi, prizmas, piramīdas, rotācijas ķermeņi' },
    { slug: 'merijumi', title: 'Измерения', title_lv: 'Mērījumi', description: 'Длины, периметры, площади, объёмы и единицы измерения', description_lv: 'Garumi, perimetri, laukumi, tilpumi un mērvienības' },
    { slug: 'dalas-procenti', title: 'Дроби и проценты', title_lv: 'Daļas un procenti', description: 'Обыкновенные и десятичные дроби, проценты, пропорции', description_lv: 'Parastās un decimāldaļas, procenti, proporcijas' },
    { slug: 'dalamiba', title: 'Делимость', title_lv: 'Dalāmība', description: 'Простые числа, признаки делимости, НОД (LKD) и НОК (MKD)', description_lv: 'Pirmskaitļi, dalāmības pazīmes, LKD un MKD' },
    { slug: 'pakapes-saknes', title: 'Степени и корни', title_lv: 'Pakāpes un saknes', description: 'Действия со степенями, свойства арифметических корней', description_lv: 'Darbības ar pakāpēm, aritmētisko sakņu īpašības' },
    { slug: 'logaritmi', title: 'Логарифмы', title_lv: 'Logaritmi', description: 'Свойства логарифмов, логарифмические уравнения и неравенства', description_lv: 'Logaritmu īpašības, logaritmiskie vienādojumi un nevienādības' },
    { slug: 'virknes', title: 'Последовательности', title_lv: 'Virknes', description: 'Числовые последовательности, арифметическая и геометрическая прогрессии', description_lv: 'Skaitļu virknes, aritmētiskā un ģeometriskā progresija' },
    { slug: 'kombinatorika', title: 'Комбинаторика', title_lv: 'Kombinatorika', description: 'Правила суммы и произведения, перестановки, размещения, сочетания', description_lv: 'Summas un reizinājuma likumi, permutācijas, variācijas, kombinācijas' },
    { slug: 'varbutiba', title: 'Вероятность', title_lv: 'Varbūtība', description: 'Классическая и геометрическая вероятность, независимые события', description_lv: 'Klasiskā un ģeometriskā varbūtība, neatkarīgi notikumi' },
    { slug: 'statistika', title: 'Статистика', title_lv: 'Statistika', description: 'Среднее, медиана, мода, размах, диаграммы и анализ данных', description_lv: 'Vidējais, mediāna, moda, amplitūda, diagrammas un datu analīze' },
    { slug: 'matematiska-analize', title: 'Математический анализ', title_lv: 'Matemātiskā analīze', description: 'Пределы, производная, исследование функций, интеграл и площади', description_lv: 'Robežas, atvasinājums, funkciju pētīšana, integrālis un laukumi' },
    { slug: 'modelesana', title: 'Моделирование', title_lv: 'Modelēšana', description: 'Математическое моделирование реальных процессов', description_lv: 'Reālu procesu matemātiskā modelēšana' },
    { slug: 'teksta-uzdevumi', title: 'Текстовые задачи', title_lv: 'Teksta uzdevumi', description: 'Сюжетные задачи на движение, работу, смеси, покупки', description_lv: 'Sižeta uzdevumi par kustību, darbu, maisījumiem, pirkumiem' },
    { slug: 'pieradijumi', title: 'Доказательства', title_lv: 'Pierādījumi', description: 'Геометрические и алгебраические доказательства, метод индукции', description_lv: 'Ģeometriski un algebriski pierādījumi, indukcijas metode' }
  ];

  const getCrossTag = slug => CROSS_TAGS.find(t => t.slug === slug) || null;

  const suggestTagsForTopic = text => {
    if (!text || typeof text !== 'string') return [];
    const t = text.toLowerCase();
    const matches = [];
    const check = (slug, words) => {
      if (words.some(w => t.includes(w))) matches.push(slug);
    };

    check('trigonometrija', ['тригонометр', 'trigonometr', 'sin', 'cos', 'tg', 'ctg']);
    check('matematiska-analize', ['производн', 'интеграл', 'дифференциал', 'предел', 'atvasinājum', 'integrāl', 'robež']);
    check('logaritmi', ['логарифм', 'logaritm', 'ln', 'lg']);
    check('pakapes-saknes', ['степен', 'корен', 'корн', 'pakāp', 'sakn', 'квадратн']);
    check('nevienadibas', ['неравенств', 'nevienādīb']);
    check('vienadojumi', ['уравнен', 'vienādojum', 'систем', 'sistēm']);
    check('grafiki', ['график', 'grafik']);
    check('funkcijas', ['функци', 'funkcij']);
    check('koordinatu-metode', ['координат', 'koordināt']);
    check('vektori', ['вектор', 'vektor']);
    check('stereometrija', ['стереометр', 'пространствен', 'призм', 'пирамид', 'конус', 'цилиндр', 'шар', 'сфер', 'stereometr', 'telpisk']);
    check('planimetrija', ['планиметр', 'треугольник', 'четырехугольник', 'многоугольник', 'окружност', 'круг', 'пифагор', 'planimetr', 'trīsstūr', 'četrstūr', 'riņķ', 'daudzstūr']);
    check('merijumi', ['площад', 'объем', 'объём', 'периметр', 'длин', 'измерен', 'laukum', 'tilpum', 'perimetr', 'garum', 'mērījum']);
    check('dalas-procenti', ['дроб', 'процент', 'пропорци', 'отношен', 'daļ', 'procent', 'proporcij']);
    check('dalamiba', ['делимост', 'простые числа', 'нок', 'нод', 'dalāmīb', 'pirmskaitļ', 'lkd', 'mkd']);
    check('virknes', ['прогресси', 'последовательност', 'virkn', 'progresij']);
    check('kombinatorika', ['комбинаторик', 'сочетан', 'размещен', 'перестановк', 'kombinatorik']);
    check('varbutiba', ['вероятност', 'varbūtīb']);
    check('statistika', ['статистик', 'медиан', 'среднее', 'диаграмм', 'statistik']);
    check('algebriskie-parveidojumi', ['тождеств', 'преобразован', 'выражен', 'сокращен', 'daudznar', 'izteiksm', 'pārveidojum']);
    check('modelesana', ['моделирован', 'modelēšan']);
    check('teksta-uzdevumi', ['текстов', 'движен', 'скорост', 'купл', 'стоимост', 'teksta', 'kustīb', 'ātrum']);
    check('pieradijumi', ['доказательств', 'индукци', 'pierādījum', 'indukcij']);

    return [...new Set(matches)].slice(0, 3);
  };

  /* Определение образовательной ступени (Pamatskola 1–9 vs Vidusskola 10–12 / Līmeņi) */
  const isGradePamatskola = grade => {
    if (grade == null) return false;
    const num = Number(grade);
    return Number.isInteger(num) && num >= 1 && num <= 9;
  };

  const isGradeVidusskola = grade => {
    if (grade == null) return false;
    const s = String(grade).toLowerCase();
    if (s === 'visparigais' || s === 'matematika-1' || s === 'matematika-2') return true;
    const num = Number(grade);
    return Number.isInteger(num) && num >= 10 && num <= 12;
  };

  const getTopicStage = topic => {
    if (!topic) return 'pamatskola';
    const slug = String(topic.slug || '');
    if (slug.startsWith('visp-') || slug.startsWith('opt-') || slug.startsWith('augst-')) return 'vidusskola';
    if (isGradeVidusskola(topic.grade)) return 'vidusskola';
    return 'pamatskola';
  };

  const normalizeTextKey = str => {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9а-яё]/gi, '');
  };

  const resolveSubject = (slugOrTitle, subjectsList) => {
    if (!slugOrTitle || !Array.isArray(subjectsList) || !subjectsList.length) return null;
    const raw = String(slugOrTitle).trim().toLowerCase();
    const clean = normalizeTextKey(raw);
    if (!clean) return null;

    // 1. Прямое совпадение по slug
    const directSlug = subjectsList.find(s => s.slug?.toLowerCase() === raw);
    if (directSlug) return directSlug;

    // 2. Прямое совпадение по названию RU или LV
    const directTitle = subjectsList.find(s =>
      s.title?.toLowerCase() === raw ||
      s.title_lv?.toLowerCase() === raw
    );
    if (directTitle) return directTitle;

    // 3. Совпадение по нормализованному ключу (без пробелов, подчёркиваний, дефисов и диакритики)
    const normalizedMatch = subjectsList.find(s =>
      normalizeTextKey(s.slug) === clean ||
      normalizeTextKey(s.title) === clean ||
      normalizeTextKey(s.title_lv) === clean
    );
    if (normalizedMatch) return normalizedMatch;

    // 4. Поиск по алиасам / корням слов
    const ALIAS_RULES = [
      { keys: ['algebra', 'skaitli', 'chisla', 'алгебр', 'числа'], slug: 'algebra' },
      { keys: ['geometr', 'geometry', 'figuras', 'геометр', 'фигур'], slug: 'geometry' },
      { keys: ['planimetr', 'планиметр'], slug: 'planimetrija' },
      { keys: ['stereometr', 'стереометр'], slug: 'stereometrija' },
      { keys: ['trigonometr', 'тригонометр'], slug: 'trigonometrija' },
      { keys: ['funkcij', 'function', 'функци'], slug: 'funkcijas' },
      { keys: ['statist', 'статист'], slug: 'statistics' },
      { keys: ['kombinatorik', 'varbutib', 'комбинаторик', 'вероятност'], slug: 'kombinatorika-un-varbutibas' },
      { keys: ['analiz', 'calculus', 'анализ'], slug: 'matematiskais-analizs' }
    ];

    for (const rule of ALIAS_RULES) {
      if (rule.keys.some(k => clean.includes(k) || raw.includes(k))) {
        const found = subjectsList.find(s => s.slug === rule.slug);
        if (found) return found;
      }
    }

    return null;
  };

  const extractCleanJson = raw => {
    if (!raw) return '';
    let str = String(raw).trim();

    // 1. Извлекаем содержимое из markdown блоков ```json ... ``` или ``` ... ```
    const fenceMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch && fenceMatch[1]) {
      str = fenceMatch[1].trim();
    }

    // 2. Находим границы внешнего JSON-объекта {...} или массива [...]
    const firstBrace = str.indexOf('{');
    const firstBracket = str.indexOf('[');
    let startIdx = -1;
    let endChar = '';

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endChar = '}';
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endChar = ']';
    }

    if (startIdx !== -1) {
      const lastEnd = str.lastIndexOf(endChar);
      if (lastEnd > startIdx) {
        str = str.slice(startIdx, lastEnd + 1);
      }
    }

    return str;
  };

  const safeParseJson = raw => {
    const clean = extractCleanJson(raw);
    try {
      return JSON.parse(clean);
    } catch (initialErr) {
      try {
        let sanitized = clean.replace(/\\([bfrtn])([a-zA-Z]{2,})/g, '\\\\$1$2');
        sanitized = sanitized.replace(/\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, '\\\\');
        return JSON.parse(sanitized);
      } catch (secondErr) {
        try {
          let sanitized2 = clean.replace(/\\([^"\\])/g, '\\\\$1');
          return JSON.parse(sanitized2);
        } catch (thirdErr) {
          throw initialErr;
        }
      }
    }
  };

  const api = {
    makeSlug,
    sanitizeSearch,
    KATEX_DELIMITERS,
    cleanMathExample,
    normalizeMathAnswer,
    parseFractionOrNumber,
    compareAnswers,
    calcTopicProgress,
    formatTimerDisplay,
    getLocalizedText,
    maskLatexForTranslation,
    unmaskLatexAfterTranslation,
    parseMultiTopicJson,
    resolveDifficultyMix,
    CROSS_TAGS,
    getCrossTag,
    suggestTagsForTopic,
    isGradePamatskola,
    isGradeVidusskola,
    getTopicStage,
    normalizeTextKey,
    resolveSubject,
    extractCleanJson,
    safeParseJson
  };
  if (typeof globalThis !== 'undefined' && typeof globalThis.window !== 'undefined') {
    globalThis.window.MathTasksLib = api;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
