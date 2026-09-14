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
    s = s.replace(/\$+/g, ' ').trim();
    s = s.replace(/\\left|\\right/g, '');
    /* Смешанное число: 2\frac{4}{7} в эталоне и «2 4/7» у ученика — это 18/7,
       а не 24/7, как выходило при простом снятии \frac. */
    s = s.replace(/(-?)(\d+)\s*\\[dt]?frac\{(\d+)\}\{(\d+)\}/g, (m, sign, whole, num, den) => `${sign}${Number(whole) * Number(den) + Number(num)}/${den}`);
    s = s.replace(/(^|[^\d.,/])(-?)(\d+)\s+(\d+)\/(\d+)(?![\d.,])/g, (m, pre, sign, whole, num, den) => `${pre}${sign}${Number(whole) * Number(den) + Number(num)}/${den}`);
    /* «30\,000» — разделитель тысяч, а не два числа. */
    s = s.replace(/(\d)\\,(?=\d{3}(?!\d))/g, '$1');
    s = s.replace(/(\d+)\{,\}(\d+)/g, '$1.$2');
    s = s.replace(/(\d+),(\d+)/g, '$1.$2');
    s = s.replace(/\\[,;:! ]/g, ' ');
    s = s.replace(/\s*:\s*/g, ';');
    s = s.replace(/\\(text|mathbf|mathrm|operatorname|overline|bar|vec|hat)\s*\{([^{}]*)\}/g, '$2');
    s = s.replace(/\\(text|mathbf|mathrm|quad|qquad)/g, '');
    s = s.replace(/^[a-zA-Z](_\{?[0-9a-zA-Z]+\}?)?\s*=\s*/, '');
    s = s.replace(/\\(cdot|times)/g, '*');
    s = s.replace(/[·×]/g, '*');
    /* Градусы: в эталоне они записаны как 65^{'+'}circ, ученик набирает
       «65» или «65°». Без приведения к одному виду верный ответ в
       градусах не засчитывался ни в одном написании. */
    s = s.replace(/\^\{?\\circ\}?/g, '°');
    s = s.replace(/\\degree/g, '°');
    s = s.replace(/²/g, '^2');
    s = s.replace(/³/g, '^3');
    s = s.replace(/√\s*\(([^)]+)\)/g, 'sqrt($1)');
    s = s.replace(/√\s*(\d+(?:\.\d+)?|[a-zA-Z]+)/g, 'sqrt($1)');
    s = s.replace(/√/g, 'sqrt');
    s = s.replace(/±/g, '+-');
    s = s.replace(/\\pm\b/g, '+-');
    s = s.replace(/π/g, 'pi');
    s = s.replace(/\\pi\b/g, 'pi');
    s = s.replace(/≤/g, '<=');
    s = s.replace(/\\le\b|\\leq\b/g, '<=');
    s = s.replace(/≥/g, '>=');
    s = s.replace(/\\ge\b|\\geq\b/g, '>=');
    s = s.replace(/\\neq?\b|≠/g, '!=');
    s = s.replace(/\\infty\b|\binf(?:inity)?\b/gi, '∞');
    s = s.replace(/\\cup\b/g, '∪');
    s = s.replace(/\\cap\b/g, '∩');
    s = s.replace(/\\in\b/g, '∈');
    s = s.replace(/\\approx\b/g, '≈');
    /* Множество \{2; 4\}: скобки со слэшем — часть ответа, без слэша —
       группировка LaTeX. Прячем первые, пока разворачиваем вторые. */
    s = s.replace(/\\\{/g, '').replace(/\\\}/g, '');
    /* Вложенные дроби и корни (\frac{11}{5\sqrt{5}}) разворачиваем изнутри
       наружу. Числитель и знаменатель берём в скобки: иначе \frac{3x+1}{x-2}
       превращалось в «3x+1/x-2» — совсем другое выражение. */
    let prev;
    do {
      prev = s;
      s = s.replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)');
      s = s.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)');
      s = s.replace(/\^\{([^{}]*)\}/g, '^($1)');
      s = s.replace(/_\{([^{}]*)\}/g, '_$1');
    } while (s !== prev);
    s = s.replace(//g, '{').replace(//g, '}');
    s = s.replace(/\s+/g, '');
    /* Лишние скобки вокруг одного числа или буквы: (pi)/(2) → pi/2,
       x^(2) → x^2. Скобки функции — sqrt(5), f(x) — не трогаем. */
    do {
      prev = s;
      s = s.replace(/(^|[^a-zа-яё0-9_)\]])\((-?\d+(?:\.\d+)?|-?[a-z](?:\^\d+)?|pi|∞)\)/gi, '$1$2');
    } while (s !== prev);
    /* Числитель-одночлен: (5pi)/6 и 5pi/6, (2s)/h и 2s/h — одно и то же.
       Знаменатель не трогаем: x/(2a) и x/2a — разные выражения. */
    s = s.replace(/(^|[^a-zа-яё0-9_)\]])\(((?:[^()+\-]|\([^()]*\))+)\)\//gi, '$1$2/');
    /* Объединение интервалов ученик набирает буквой U, «+∞» — просто «∞». */
    s = s.replace(/([)\]])u([(\[])/gi, '$1∪$2');
    s = s.replace(/\+∞/g, '∞');
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
  /* Единица снимается только целым словом: без этого «s» и «t» выедались
     из «sqrt», и «2√3» не совпадало с «2\sqrt{3} см». */
  const UNIT_WORDS = /(?<![a-zа-яёāčēģīķļņšūž])(?:см|мм|дм|км|м|га|кг|мг|г|тонн[аы]?|л|мл|ч|мин|сек|с|руб|евро|гц|квт|вт|cm|mm|dm|km|ha|kg|mg|g|t|ml|min|sec|h|s|hz|eur)(?:\^\d)?(?![a-zа-яёāčēģīķļņšūž])|(?:€|%|°c?)(?:\^\d)?/gi;

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

  const compareSingleAnswer = (userAns, correctAns) => {
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

  /* ── Ответ из нескольких частей ──────────────────────────────────
     Эталон часто не одно число: «x_1 = 3, x_2 = 0,5», «(7; 0) и (2; 5)»,
     «3/5 (или 0,6)», «−22 (в точке x = 3)». Одной строкой такой ответ не
     совпадал почти никогда: из 541 задачи верно набранный ответ не
     принимался у 92. Поэтому эталон делится на варианты («или»), вариант —
     на части (запятая, точка с запятой, «и» вне скобок), а у части
     снимаются имя («x_1 =») и пояснение в скобках. */
  const ANSWER_LETTER = 'a-zа-яёāčēģīķļņšūž';
  /* Слово — кириллица от двух букв, латышское слово с диакритикой или латиница
     от четырёх букв. Короче латиницей — произведение переменных: xy, 4ab. */
  const ANSWER_WORD_RE = /[а-яё]{2,}|[a-zāčēģīķļņšūž]*[āčēģīķļņšūž][a-zāčēģīķļņšūž]*|[a-z]{4,}/gi;
  /* Пояснение — скобки, в которых есть слово от трёх букв не из команды LaTeX. */
  const ANSWER_REMARK_RE = new RegExp(`\\s*\\((?=[^()]*(?<![\\\\${ANSWER_LETTER}])[${ANSWER_LETTER}]{3,})[^()]*\\)`, 'gi');
  /* Слова, которые не мешают сверять ответ: единицы и имена функций. */
  const ANSWER_NON_WORDS = new Set([
    'см', 'мм', 'дм', 'км', 'га', 'кг', 'мг', 'мл', 'мин', 'сек', 'руб', 'евро', 'гц', 'квт', 'вт', 'тонн', 'тонна', 'тонны',
    'cm', 'mm', 'dm', 'km', 'ha', 'kg', 'mg', 'ml', 'min', 'sec', 'hz', 'eur',
    'sqrt', 'pi', 'inf', 'sin', 'cos', 'tg', 'tan', 'ctg', 'cot', 'log', 'lg', 'ln', 'arcsin', 'arccos', 'arctg', 'arctan', 'max', 'min'
  ]);

  const cleanAnswerRaw = raw => String(raw ?? '')
    .replace(/\$+/g, ' ')
    .replace(/\\left|\\right/g, '')
    .replace(/(\d)\\,(?=\d{3}(?!\d))/g, '$1')
    .replace(/\\[,;:! ]|\\q?quad\b/g, ' ')
    .replace(/>=/g, '≥').replace(/<=/g, '≤').replace(/!=/g, '≠');

  /* Деление по разделителям вне скобок. Запятая между цифрами без пробела
     («3,5») — десятичная, а не разделитель. */
  const splitAnswerTopLevel = (text, separators) => {
    const parts = [];
    let depth = 0;
    let current = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if ('([{'.includes(ch)) depth++;
      else if (')]}'.includes(ch)) depth = Math.max(0, depth - 1);
      const decimalComma = ch === ',' && /\d/.test(text[i - 1] || '') && /\d/.test(text[i + 1] || '');
      if (depth === 0 && separators.includes(ch) && !decimalComma) {
        parts.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    parts.push(current);
    return parts.map(part => part.trim()).filter(Boolean);
  };

  /* Варианты ответа: «1,5 или 3/2», «3/5 (или 0,6)». */
  const answerAlternatives = raw => {
    const extra = [];
    let text = cleanAnswerRaw(raw).replace(/\\text\{\s*(или|vai|jeb|or)\s*\}/gi, ' $1 ');
    text = text.replace(/\(\s*(?:или|vai|jeb|or)\s+([^()]*)\)/gi, (m, alt) => {
      extra.push(alt);
      return ' ';
    });
    return [...text.split(/\s+(?:или|vai|jeb|or)\s+/i), ...extra].map(alt => alt.trim()).filter(Boolean);
  };

  /* Имя величины слева от «=»: x, x_1, S_{бок}, \sin\alpha, E(y), |A ∪ B|,
     «Медиана». Не имя — то, где есть числа или знаки действий. */
  const isAnswerLabel = piece => {
    let text = String(piece).trim();
    if (!text || text.length > 30) return false;
    text = text
      .replace(/_\{(?:[^{}]|\{[^{}]*\})*\}|_[0-9A-Za-z]+/g, '')
      .replace(/\\(?:text|mathrm|overline|bar|vec|hat)\{([^{}]*)\}/g, '$1')
      .replace(/\\[a-zA-Z]+/g, ' ')
      .replace(/([a-zа-яё])\d+/gi, '$1');
    if (/[0-9+\-*/^=<>≤≥]/.test(text)) return false;
    const groups = text.match(new RegExp(`[${ANSWER_LETTER}]+`, 'gi')) || [];
    return groups.length <= 1 || groups.every(group => group.length === 1);
  };

  const normalizeAnswerLabel = label => String(label || '')
    .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, '$1')
    .replace(/[\s{}_\\]/g, '')
    .toLowerCase();

  /* x_1, x_2, x1 — одна и та же неизвестная x: корни можно писать в любом порядке. */
  const baseAnswerLabel = label => normalizeAnswerLabel(String(label || '')
    .replace(/_\{(?:[^{}]|\{[^{}]*\})*\}|_[0-9A-Za-z]+/g, '')
    .replace(/([a-zа-яё])\d+$/i, '$1'));

  const parseAnswerParts = raw => {
    const text = cleanAnswerRaw(raw)
      .replace(ANSWER_REMARK_RE, ' ')
      .replace(/\s+(?:и|un|and)\s+|\\text\{\s*(?:и|un|and)\s*\}/gi, ';')
      .replace(/\\approx\b/g, '≈')
      .replace(/\\in\b/g, '∈');
    return splitAnswerTopLevel(text, [',', ';']).map(part => {
      const cleaned = part
        .replace(/^(?:в|на|par|uz|по)\s+/i, '')
        .replace(/\s+(?:раза?|reizes?)\s*$/i, '');
      const pieces = splitAnswerTopLevel(cleaned, ['=', '≈', '∈']);
      const label = pieces.length > 1 && isAnswerLabel(pieces[0]) ? pieces[0] : '';
      const valuePieces = label ? pieces.slice(1) : pieces;
      const values = [];
      for (const value of valuePieces) {
        values.push(value);
        /* Точка с именем: «B(3; 4)» — ученик может написать и «(3; 4)». */
        if (/^[A-Z]\s*\(/.test(value)) values.push(value.replace(/^[A-Z]\s*/, ''));
      }
      /* «√1,6 ≈ 1,26» и «32/3 = 10 2/3» — одно значение в двух записях,
         подходит любая. А «4^{k+1} − 1 = 4(4^k − 1) + 3» — тождество. */
      const equivalent = cleaned.includes('≈')
        || valuePieces.every(value => !/[a-zа-яё]/i.test(value.replace(/\\[a-zA-Z]+/g, '')));
      return { label, values, pieceCount: valuePieces.length, equivalent };
    }).filter(part => part.values.length);
  };

  const answerPartMatches = (userPart, correctPart) => {
    if (userPart.label && correctPart.label
      && normalizeAnswerLabel(userPart.label) !== normalizeAnswerLabel(correctPart.label)
      && baseAnswerLabel(userPart.label) !== baseAnswerLabel(correctPart.label)) {
      return false;
    }
    return userPart.values.some(u => correctPart.values.some(c => compareSingleAnswer(u, c)));
  };

  const matchAnswerParts = (userParts, correctParts) => {
    if (!userParts.length || userParts.length !== correctParts.length) return false;
    if (correctParts.every((part, i) => answerPartMatches(userParts[i], part))) return true;
    /* Порядок свободный, если это корни одной неизвестной, точки без имён
       или ученик сам подписал каждую часть. Иначе «x = 2; y = 3» приняло бы «3; 2». */
    const bases = new Set(correctParts.map(part => baseAnswerLabel(part.label)));
    const anyOrder = correctParts.every(part => !part.label)
      || (bases.size === 1 && !bases.has(''))
      || userParts.every(part => part.label);
    if (!anyOrder) return false;
    const used = new Array(correctParts.length).fill(false);
    const place = i => {
      if (i === userParts.length) return true;
      for (let j = 0; j < correctParts.length; j++) {
        if (used[j] || !answerPartMatches(userParts[i], correctParts[j])) continue;
        used[j] = true;
        if (place(i + 1)) return true;
        used[j] = false;
      }
      return false;
    };
    return place(0);
  };

  const compareWholeAnswer = (userAns, correctAns) => {
    if (compareSingleAnswer(userAns, correctAns)) return true;
    const userParts = parseAnswerParts(userAns);
    if (!userParts.length) return false;
    return answerAlternatives(correctAns).some(alt =>
      compareSingleAnswer(userAns, alt) || matchAnswerParts(userParts, parseAnswerParts(alt)));
  };

  const compareAnswers = (userAns, correctAns) => {
    const user = String(userAns ?? '');
    const candidates = [user];
    /* «a^2/3» набирают, имея в виду a^{2/3}: кнопка xⁿ скобок не ставит. */
    if (/\^\s*\d+\s*\/\s*\d+/.test(user)) candidates.push(user.replace(/\^\s*(\d+)\s*\/\s*(\d+)/g, '^($1/$2)'));
    /* Множество пишут и без фигурных скобок: «2; 6» вместо «{2; 6}». */
    if (/\\\{/.test(String(correctAns ?? '')) && !/[{}]/.test(user)) {
      candidates.push(`{${user.replace(/^\s*[A-Za-z]\s*=\s*/, '')}}`);
    }
    return candidates.some(candidate => compareWholeAnswer(candidate, correctAns));
  };

  const answerHasWords = value => {
    const text = String(value)
      .replace(/\\(?:text|mathrm|operatorname)\{([^{}]*)\}/g, ' $1 ')
      .replace(/\\[a-zA-Z]+/g, ' ');
    return (text.match(ANSWER_WORD_RE) || []).some(word => !ANSWER_NON_WORDS.has(word.toLowerCase()));
  };

  /* Можно ли сверить ответ автоматически. Нельзя — если в нём слова
     («Да, подобны», «Даугавпилс»), тождество или доказательство, «≠» и
     «k ∈ ℤ». Такой задаче поле ответа не показывается: ученик сравнивает
     сам, а проверка не запирает ответ и решение за вечной «ошибкой». */
  const isAnswerAutoCheckable = raw => {
    const text = String(raw ?? '').trim();
    if (!text) return false;
    if (/\\(?:ne|neq|mathbb|forall|exists|Rightarrow|Leftrightarrow)(?![a-zA-Z])|≠/.test(text)) return false;
    const parts = parseAnswerParts(answerAlternatives(text)[0] || '');
    if (!parts.length) return false;
    return parts.every(part => (part.pieceCount === 1 || part.equivalent) && part.values.every(value => !answerHasWords(value)));
  };

  /* ── Личный прогресс ученика ─────────────────────────────────────
     Всё лежит в браузере: решённые задачи, ошибки, даты решений,
     контрольные. Функции чистые — страница «Мой прогресс» только
     раскладывает то, что они посчитали. */

  /* Дата по местному времени: день ученика кончается в его полночь, а не по UTC. */
  const localDateKey = (date = new Date()) => {
    const d = date instanceof Date ? date : new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const shiftDateKey = (key, days) => {
    const [y, m, d] = String(key).split('-').map(Number);
    return localDateKey(new Date(y, m - 1, d + days));
  };

  /* Серия дней подряд. Если сегодня ещё ничего не решено, считаем от вчера:
     утром серия не должна показывать ноль. */
  const computeStreak = (activity = {}, today = localDateKey()) => {
    const has = key => Number(activity[key]) > 0;
    let day = has(today) ? today : shiftDateKey(today, -1);
    let current = 0;
    while (has(day)) {
      current++;
      day = shiftDateKey(day, -1);
    }
    const days = Object.keys(activity).filter(has).sort();
    let best = 0;
    let run = 0;
    let prev = null;
    for (const key of days) {
      run = prev && shiftDateKey(prev, 1) === key ? run + 1 : 1;
      best = Math.max(best, run);
      prev = key;
    }
    return { current, best, activeDays: days.length, today: has(today) };
  };

  /* Календарь активности: столбец — неделя с понедельника, последний
     столбец — текущая неделя; дни после сегодня помечены future. */
  const buildActivityWeeks = (activity = {}, today = localDateKey(), weeks = 12) => {
    const [y, m, d] = String(today).split('-').map(Number);
    const mondayOffset = (new Date(y, m - 1, d).getDay() + 6) % 7;
    const result = [];
    for (let w = 0; w < weeks; w++) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const key = localDateKey(new Date(y, m - 1, d - mondayOffset - (weeks - 1 - w) * 7 + i));
        week.push({ key, count: Number(activity[key]) || 0, future: key > today });
      }
      result.push(week);
    }
    return result;
  };

  /* Достижения: цель и текущее значение. counted: false — показывать
     только «получено / нет», без счёта (оценка 7 из 9 звучала бы странно). */
  const PROGRESS_ACHIEVEMENTS = [
    { id: 'first_task', icon: '🌱', goal: 1, value: s => s.solved },
    { id: 'solved_10', icon: '✏️', goal: 10, value: s => s.solved },
    { id: 'solved_50', icon: '📚', goal: 50, value: s => s.solved },
    { id: 'solved_100', icon: '🏅', goal: 100, value: s => s.solved },
    { id: 'first_try_10', icon: '🎯', goal: 10, value: s => s.firstTry },
    { id: 'streak_3', icon: '🔥', goal: 3, value: s => s.streak.best },
    { id: 'streak_7', icon: '⚡', goal: 7, value: s => s.streak.best },
    { id: 'topic_done', icon: '🏁', goal: 1, value: s => s.topicsDone },
    { id: 'topics_5', icon: '🗺️', goal: 5, value: s => s.topicsDone },
    { id: 'cw_excellent', icon: '🏆', goal: 9, value: s => s.controlWorks.bestGrade, counted: false }
  ];

  const buildProgressSummary = ({
    solvedIds = [],
    topics = [],
    topicTaskIds = new Map(),
    wrongAttempts = {},
    activity = {},
    controlWorks = {},
    today = localDateKey()
  } = {}) => {
    const taskIdsOf = id => (topicTaskIds instanceof Map ? topicTaskIds.get(id) : topicTaskIds[id]) || [];
    const solvedSet = new Set(solvedIds.map(Number));
    const catalogIds = new Set();
    const topicRows = [];
    for (const topic of topics) {
      const ids = taskIdsOf(topic.id).map(Number);
      if (!ids.length) continue;
      ids.forEach(id => catalogIds.add(id));
      const solved = ids.filter(id => solvedSet.has(id)).length;
      topicRows.push({ topic, total: ids.length, solved, percent: Math.round((solved / ids.length) * 100) });
    }
    /* Решённую задачу могли снять с публикации: в счёт идут только те, что в каталоге. */
    const solvedList = catalogIds.size ? [...solvedSet].filter(id => catalogIds.has(id)) : [...solvedSet];
    const firstTry = solvedList.filter(id => !(Number(wrongAttempts[id]) > 0)).length;

    const gradeMap = new Map();
    for (const row of topicRows) {
      const key = String(row.topic.grade ?? '');
      if (!gradeMap.has(key)) {
        gradeMap.set(key, { grade: row.topic.grade ?? null, total: 0, solved: 0, topicsDone: 0, topics: [] });
      }
      const group = gradeMap.get(key);
      group.total += row.total;
      group.solved += row.solved;
      group.topics.push(row);
      if (row.solved === row.total) group.topicsDone++;
    }
    const grades = [...gradeMap.values()].map(group => ({ ...group, percent: Math.round((group.solved / group.total) * 100) }));

    const inProgress = topicRows
      .filter(row => row.solved > 0 && row.solved < row.total)
      .sort((a, b) => b.percent - a.percent || b.solved - a.solved);

    const cwList = Object.entries(controlWorks || {})
      .map(([topicId, result]) => ({ topicId: Number(topicId), ...result }))
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

    const summary = {
      solved: solvedList.length,
      total: catalogIds.size,
      firstTry,
      topicsDone: topicRows.filter(row => row.solved === row.total).length,
      grades,
      inProgress,
      streak: computeStreak(activity, today),
      activityWeeks: buildActivityWeeks(activity, today),
      controlWorks: {
        list: cwList,
        count: cwList.length,
        bestGrade: cwList.reduce((best, result) => Math.max(best, Number(result.grade) || 0), 0)
      }
    };
    summary.achievements = PROGRESS_ACHIEVEMENTS.map(item => {
      const value = Number(item.value(summary)) || 0;
      return {
        id: item.id,
        icon: item.icon,
        goal: item.goal,
        value: Math.min(value, item.goal),
        earned: value >= item.goal,
        counted: item.counted !== false
      };
    });
    return summary;
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

  /* Номер темы в заголовке: «9.1. …» в основной школе и «1. …» в старшей.
     У классов с первого по девятый номер темы двусоставный — так он и
     записан в программе Skola2030. Vispārīgais, Matemātika I и
     Matemātika II — не классы, а уровни: числа 10, 11 и 12 там служебные,
     ими в базе различают курсы, и в заголовке они только путают. */
  const formatTopicTitle = (topic, lang = 'ru') => {
    if (!topic) return '';
    if (typeof topic === 'string') return topic;
    const title = (getLocalizedText(topic, 'title', lang) || '').trim();
    if (!title) return '';

    const gradeNum = parseInt(topic.grade, 10);
    const posNum = parseInt(topic.position, 10);

    if (Number.isInteger(gradeNum) && gradeNum >= 1 && gradeNum <= 12 && Number.isInteger(posNum) && posNum > 0) {
      const expectedPrefix = gradeNum >= 10 ? `${posNum}. ` : `${gradeNum}.${posNum}. `;
      const numMatch = title.match(/^(\d+(?:\.\d+)*)\.?\s*(.*)$/);
      if (numMatch) {
        const rest = numMatch[2] || '';
        return `${expectedPrefix}${rest}`.trim();
      }
      return `${expectedPrefix}${title}`.trim();
    }

    return title;
  };

  /* Номер подтемы для показа: «7.5.2» в основной школе и «5.2» в старшей.
     В базе код всегда полный — им подтемы различаются между уровнями, —
     а в интерфейсе служебная десятка перед номером не нужна, иначе тема
     подписана «5.», а подтема внутри неё «10.5.1». */
  const formatSubtopicCode = (code, grade) => {
    const str = String(code || '').trim();
    if (!str) return '';
    const gradeNum = parseInt(grade, 10);
    if (!Number.isInteger(gradeNum) || gradeNum < 10) return str;
    const parts = str.split('.');
    return parts.length > 1 && String(parts[0]) === String(gradeNum) ? parts.slice(1).join('.') : str;
  };

  /* Форматирование счетчика подтем и задач с правильной грамматикой (LV/RU) */
  const formatSubtopicSummary = (subCount = 0, taskCount = 0, lang = 'ru') => {
    const s = Math.max(0, parseInt(subCount, 10) || 0);
    const t = Math.max(0, parseInt(taskCount, 10) || 0);
    if (lang === 'lv') {
      const sWord = (s % 10 === 1 && s % 100 !== 11) ? 'apakštēma' : 'apakštēmas';
      const tWord = (t % 10 === 1 && t % 100 !== 11) ? 'uzdevums' : 'uzdevumi';
      return `${s} ${sWord} • ${t} ${tWord}`;
    }
    let sWord = 'подтем';
    if (s % 10 === 1 && s % 100 !== 11) sWord = 'подтема';
    else if ([2, 3, 4].includes(s % 10) && ![12, 13, 14].includes(s % 100)) sWord = 'подтемы';

    let tWord = 'задач';
    if (t % 10 === 1 && t % 100 !== 11) tWord = 'задача';
    else if ([2, 3, 4].includes(t % 10) && ![12, 13, 14].includes(t % 100)) tWord = 'задачи';

    return `${s} ${sWord} • ${t} ${tWord}`;
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
    const normalizedSubtopics = [];
    const normalizedTasks = [];

    for (const item of parsed) {
      if (!item) continue;
      // Вариант 1: Объект темы со вложенным списком подтем subtopics: [...]
      if (Array.isArray(item.subtopics)) {
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

        for (const sub of item.subtopics) {
          if (!sub) continue;
          const subInfo = {
            topic_title: topicInfo.title,
            topic_title_lv: topicInfo.title_lv,
            title: String(sub.title || sub.name || sub.subtopic_title || '').trim(),
            title_lv: sub.title_lv || sub.subtopic_title_lv ? String(sub.title_lv || sub.subtopic_title_lv).trim() : null,
            code: sub.code || sub.subtopic_code ? String(sub.code || sub.subtopic_code).trim() : null,
            position: Number(sub.position) || null
          };
          if (subInfo.title || subInfo.code) {
            normalizedSubtopics.push(subInfo);
          }
          if (Array.isArray(sub.tasks)) {
            for (const t of sub.tasks) {
              if (!t) continue;
              normalizedTasks.push({
                ...t,
                topic_title: t.topic_title || topicInfo.title,
                topic_title_lv: t.topic_title_lv || topicInfo.title_lv,
                subtopic_title: t.subtopic_title || subInfo.title,
                subtopic_title_lv: t.subtopic_title_lv || subInfo.title_lv,
                subtopic_code: t.subtopic_code || subInfo.code,
                grade: t.grade !== undefined ? parseFormGrade(t.grade) : topicInfo.grade,
                subject_id: t.subject_id ? Number(t.subject_id) : topicInfo.subject_id
              });
            }
          }
        }

        if (Array.isArray(item.tasks)) {
          for (const t of item.tasks) {
            if (!t) continue;
            const subTitle = String(t.subtopic_title || t.subtopic || '').trim();
            const subCode = String(t.subtopic_code || '').trim();
            if (subTitle || subCode) {
              normalizedSubtopics.push({
                topic_title: topicInfo.title,
                topic_title_lv: topicInfo.title_lv,
                title: subTitle,
                title_lv: t.subtopic_title_lv ? String(t.subtopic_title_lv).trim() : null,
                code: subCode || null
              });
            }
            normalizedTasks.push({
              ...t,
              topic_title: t.topic_title || topicInfo.title,
              topic_title_lv: t.topic_title_lv || topicInfo.title_lv,
              grade: t.grade !== undefined ? parseFormGrade(t.grade) : topicInfo.grade,
              subject_id: t.subject_id ? Number(t.subject_id) : topicInfo.subject_id
            });
          }
        }
      } else if (Array.isArray(item.tasks)) {
        // Вариант 2: Объект темы со вложенным массивом tasks
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
          const subTitle = String(t.subtopic_title || t.subtopic || '').trim();
          const subCode = String(t.subtopic_code || '').trim();
          if (subTitle || subCode) {
            normalizedSubtopics.push({
              topic_title: topicInfo.title,
              topic_title_lv: topicInfo.title_lv,
              title: subTitle,
              title_lv: t.subtopic_title_lv ? String(t.subtopic_title_lv).trim() : null,
              code: subCode || null
            });
          }
          normalizedTasks.push({
            ...t,
            topic_title: t.topic_title || topicInfo.title,
            topic_title_lv: t.topic_title_lv || topicInfo.title_lv,
            grade: t.grade !== undefined ? parseFormGrade(t.grade) : topicInfo.grade,
            subject_id: t.subject_id ? Number(t.subject_id) : topicInfo.subject_id
          });
        }
      } else {
        // Вариант 3: Плоская запись задачи
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
        const subTitle = String(t.subtopic_title || t.subtopic || '').trim();
        const subCode = String(t.subtopic_code || '').trim();
        if (subTitle || subCode) {
          normalizedSubtopics.push({
            topic_title: topicTitle,
            topic_title_lv: t.topic_title_lv ? String(t.topic_title_lv).trim() : null,
            title: subTitle,
            title_lv: t.subtopic_title_lv ? String(t.subtopic_title_lv).trim() : null,
            code: subCode || null
          });
        }
        normalizedTasks.push(t);
      }
    }

    // Дедупликация тем по названию (case-insensitive)
    const uniqueTopics = [];
    const seenTopics = new Set();
    for (const top of normalizedTopics) {
      const key = top.title.toLowerCase();
      if (key && !seenTopics.has(key)) {
        seenTopics.add(key);
        uniqueTopics.push(top);
      }
    }

    // Дедупликация подтем по коду или связке тема:::название
    const uniqueSubtopics = [];
    const seenSubs = new Set();
    for (const sub of normalizedSubtopics) {
      const key = sub.code
        ? `${(sub.topic_title || '').toLowerCase()}:::code:${sub.code.toLowerCase()}`
        : `${(sub.topic_title || '').toLowerCase()}:::title:${sub.title.toLowerCase()}`;
      if (!seenSubs.has(key)) {
        seenSubs.add(key);
        uniqueSubtopics.push(sub);
      }
    }

    return { uniqueTopics, uniqueSubtopics, tasks: normalizedTasks };
  };

  /* Образец TSV в админке собирается из образца CSV — так два образца не
     разойдутся. TSV — то, что отдаёт нейросеть по промпту и что копируется
     из Excel / Google Таблиц. Ячейку с табуляцией, переносом строки или
     кавычкой в начале берём в кавычки, иначе она развалится на части. */
  const csvToTsv = csv => parseCsvRows(csv)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => row.map(cell => (/[\t\r\n]|^"/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell)).join('\t'))
    .join('\n');

  /* ── Парсер строк CSV / TSV с поддержкой кавычек RFC 4180 и переносов строк ── */
  const parseCsvRows = (text, delimiter) => {
    if (!text) return [];
    if (!delimiter) {
      const firstLine = text.split(/\r?\n/).find(l => l.trim().length > 0) || '';
      const tabs = (firstLine.match(/\t/g) || []).length;
      const semicolons = (firstLine.match(/;/g) || []).length;
      const commas = (firstLine.match(/,/g) || []).length;
      if (tabs > 0) delimiter = '\t';
      else if (semicolons > commas) delimiter = ';';
      else delimiter = ',';
    }

    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;
    let i = 0;

    while (i < text.length) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            currentCell += '"';
            i += 2;
            continue;
          } else {
            inQuotes = false;
            i++;
            continue;
          }
        } else {
          currentCell += char;
          i++;
          continue;
        }
      } else {
        /* Кавычка открывает экранирование только в начале ячейки, как в
           RFC 4180. В середине это обычный символ: SVG-чертёж в ячейке полон
           кавычек атрибутов, и раньше они съедались, а разметка ломалась. */
        if (char === '"' && currentCell.trim() === '') {
          inQuotes = true;
          i++;
          continue;
        } else if (char === delimiter) {
          currentRow.push(currentCell.trim());
          currentCell = '';
          i++;
          continue;
        } else if (char === '\r') {
          if (nextChar === '\n') i++;
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
          i++;
          continue;
        } else if (char === '\n') {
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
          i++;
          continue;
        } else {
          currentCell += char;
          i++;
          continue;
        }
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
    }

    return rows.filter(r => r.some(c => c && c.length > 0));
  };

  const CSV_KNOWN_COLUMNS = {
    grade: ['grade', 'класс', 'klase', 'kurs', 'курс', 'grade_id'],
    topic_title: ['topic_title', 'topic', 'тема', 'tēma', 'tema', 'название темы', 'tēmas nosaukums', 'temats'],
    topic_title_lv: ['topic_title_lv', 'тема lv', 'tēma lv', 'tema lv', 'topic lv'],
    subtopic_code: ['subtopic_code', 'code', 'код', 'kods', 'код подтемы', 'номер подтемы', 'apakštēmas kods', 'apakstēmas kods', 'apakštēmas numurs', 'subtopic code'],
    subtopic_title: ['subtopic_title', 'subtopic', 'подтема', 'apakštēma', 'apakstema', 'название подтемы', 'subtopic title'],
    subtopic_title_lv: ['subtopic_title_lv', 'подтема lv', 'apakštēma lv', 'apakstema lv', 'subtopic lv'],
    condition_latex: ['condition_latex', 'condition', 'условие', 'uzdevums', 'nosacījums', 'nosacijums', 'текст', 'текст задачи', 'задача', 'question'],
    condition_latex_lv: ['condition_latex_lv', 'условие lv', 'uzdevums lv', 'nosacījums lv', 'condition lv'],
    answer_latex: ['answer_latex', 'answer', 'ответ', 'atbilde'],
    answer_latex_lv: ['answer_latex_lv', 'ответ lv', 'atbilde lv', 'answer lv'],
    solution_latex: ['solution_latex', 'solution', 'решение', 'atrisinājums', 'atrisinajums', 'разбор'],
    solution_latex_lv: ['solution_latex_lv', 'решение lv', 'atrisinājums lv', 'solution lv'],
    hint_latex: ['hint_latex', 'hint', 'подсказка', 'padoms', 'ieteikums'],
    hint_latex_lv: ['hint_latex_lv', 'подсказка lv', 'padoms lv', 'hint lv'],
    difficulty: ['difficulty', 'сложность', 'grūtība', 'grutiba', 'уровень'],
    tags: ['tags', 'теги', 'birkas', 'cross_tags', 'метки'],
    /* Чертёж — SVG-разметкой в ячейке; админка сама сохранит его файлом. */
    condition_svg: ['condition_svg', 'svg', 'чертёж', 'чертеж', 'рисунок', 'zīmējums', 'zimejums', 'figure'],
    solution_svg: ['solution_svg', 'чертёж решения', 'чертеж решения', 'рисунок решения', 'zīmējums atrisinājumam', 'solution figure'],
    position: ['position', 'номер', 'позиция', 'nr', 'num'],
    /* Служебные столбцы выгрузок базы. Их узнаём, чтобы они не сработали
       как префикс: «topic_id» начинается с «topic» и без этой строки
       попадал бы в название темы. Значения не читаются. */
    ignore: ['id', 'topic_id', 'subtopic_id', 'task_id', 'created_at', 'updated_at', 'slug']
  };

  /* Скобки и точка в конце заголовка — оформление, а не часть имени:
     «Условие (LV)» и «Nr.» должны узнаваться так же, как «условие lv» и «nr». */
  const normalizeCsvHeader = value => String(value).trim().toLowerCase()
    .replace(/[()[\]]/g, ' ')
    .replace(/[_\s-]+/g, '_')
    .replace(/^_+|[_.:]+$/g, '');

  /* Точное совпадение важнее префиксного. Раньше побеждал первый ключ,
     чей синоним был началом заголовка, и «condition_latex_lv» уходил в
     «condition_latex»: латышский текст затирал русский, а задача без
     перевода при повторной загрузке выгрузки пропадала целиком — русское
     условие оказывалось пустым. Префикс оставлен для заголовков вроде
     «Условие задачи», но только по границе слова и самый длинный. */
  const matchCsvColumnHeader = rawHeader => {
    if (!rawHeader) return null;
    const clean = normalizeCsvHeader(rawHeader);
    if (!clean) return null;
    let best = null;
    let bestLength = 0;
    for (const [key, aliases] of Object.entries(CSV_KNOWN_COLUMNS)) {
      for (const alias of aliases) {
        const a = normalizeCsvHeader(alias);
        if (a === clean) return key;
        if (clean.startsWith(a + '_') && a.length > bestLength) {
          best = key;
          bestLength = a.length;
        }
      }
    }
    return best;
  };

  /* ── Парсер CSV / TSV в структурированные темы, подтемы и задачи ── */
  const parseCsvToTasks = csvText => {
    if (!csvText || typeof csvText !== 'string') {
      return { uniqueTopics: [], uniqueSubtopics: [], tasks: [] };
    }
    const cleanText = csvText.replace(/^\uFEFF/, '').trim();
    const rows = parseCsvRows(cleanText);
    if (!rows.length) return { uniqueTopics: [], uniqueSubtopics: [], tasks: [] };

    const firstRow = rows[0];
    const headerMap = {};
    let matchedCount = 0;

    firstRow.forEach((cell, idx) => {
      const matched = matchCsvColumnHeader(cell);
      /* Первый столбец с этим смыслом остаётся за ним: второй такой же
         не должен молча перехватить место. */
      if (matched && matched !== 'ignore' && headerMap[matched] === undefined) {
        headerMap[matched] = idx;
        matchedCount++;
      }
    });

    const isHeaderRow = matchedCount >= 2;
    const dataRows = isHeaderRow ? rows.slice(1) : rows;

    if (!isHeaderRow) {
      const defaultCols = [
        'grade', 'topic_title', 'subtopic_code', 'subtopic_title',
        'condition_latex', 'answer_latex', 'solution_latex', 'difficulty'
      ];
      defaultCols.forEach((col, idx) => { headerMap[col] = idx; });
    }

    const tasks = [];
    const warnings = [];
    const topicsMap = new Map();
    const subtopicsMap = new Map();

    for (let rIdx = 0; rIdx < dataRows.length; rIdx++) {
      const row = dataRows[rIdx];
      /* Строка шире заголовка — почти всегда запятая внутри формулы без
         кавычек: ответ уезжает в решение, решение — в сложность. Молча
         такое импортировать нельзя. */
      if (isHeaderRow && row.length > firstRow.length) {
        warnings.push(`Строка ${rIdx + 2}: ячеек ${row.length}, а столбцов в заголовке ${firstRow.length} — вероятно, запятая внутри формулы без кавычек. Проверьте, не съехали ли столбцы.`);
      }
      const getVal = colKey => {
        const idx = headerMap[colKey];
        return (idx !== undefined && row[idx] !== undefined) ? String(row[idx]).trim() : '';
      };

      const cond = getVal('condition_latex');
      if (!cond) continue;

      const gradeVal = parseFormGrade(getVal('grade'));
      /* Без столбца темы тему не придумываем. Раньше подставлялось «Без
         темы», и импорт заводил в базе настоящую тему с таким названием. */
      /* Номер темы — оформление сайта, в базе названия без него. Название,
         скопированное со страницы («8.8. Как определяют…»), иначе не нашло
         бы свою тему, и импорт завёл бы дубль. Просто число в начале
         («10 задач на проценты») номером не считается. */
      const stripTopicNumber = s => s.replace(/^\s*(?:\d+(?:\.\d+)+\.?|\d+\.)\s+/, '');
      const topicTitle = stripTopicNumber(getVal('topic_title'));
      const topicTitleLv = stripTopicNumber(getVal('topic_title_lv')) || null;
      const subCode = getVal('subtopic_code') || '';
      const subTitle = getVal('subtopic_title') || '';
      const subTitleLv = getVal('subtopic_title_lv') || null;
      const ans = getVal('answer_latex') || null;
      const ansLv = getVal('answer_latex_lv') || null;
      const sol = getVal('solution_latex') || null;
      const solLv = getVal('solution_latex_lv') || null;
      const hint = getVal('hint_latex') || null;
      const hintLv = getVal('hint_latex_lv') || null;
      const diff = getVal('difficulty') || 'Средний';
      const pos = Number(getVal('position')) || (rIdx + 1);
      const rawTags = getVal('tags');
      const tags = rawTags ? rawTags.split(/[,;]+/).map(t => t.trim()).filter(Boolean) : [];

      if (topicTitle && !topicsMap.has(topicTitle.toLowerCase())) {
        topicsMap.set(topicTitle.toLowerCase(), {
          title: topicTitle,
          title_lv: topicTitleLv,
          grade: gradeVal
        });
      }

      const subKey = `${topicTitle.toLowerCase()}:::${(subCode || subTitle).toLowerCase()}`;
      if ((subCode || subTitle) && !subtopicsMap.has(subKey)) {
        subtopicsMap.set(subKey, {
          topic_title: topicTitle,
          topic_title_lv: topicTitleLv,
          code: subCode || null,
          title: subTitle || subCode,
          title_lv: subTitleLv
        });
      }

      tasks.push({
        grade: gradeVal,
        topic_title: topicTitle,
        topic_title_lv: topicTitleLv,
        subtopic_code: subCode || null,
        subtopic_title: subTitle || null,
        subtopic_title_lv: subTitleLv,
        condition_latex: cond,
        condition_latex_lv: getVal('condition_latex_lv') || null,
        answer_latex: ans,
        answer_latex_lv: ansLv,
        solution_latex: sol,
        solution_latex_lv: solLv,
        hint_latex: hint,
        hint_latex_lv: hintLv,
        difficulty: diff,
        position: pos,
        tags,
        condition_svg: getVal('condition_svg') || null,
        solution_svg: getVal('solution_svg') || null
      });
    }

    return {
      uniqueTopics: Array.from(topicsMap.values()),
      uniqueSubtopics: Array.from(subtopicsMap.values()),
      tasks,
      warnings
    };
  };

  /* ── Промпт для нейросети: таблица задач под конкретную тему ──
     Промпт собирается из базы: точные названия темы (по ним импорт
     находит тему), настоящие номера подтем и закрытый список тегов.
     С общим промптом модель выдумывала номера и теги, и импорт отвечал
     предупреждениями. Столбцы — ровно те, что узнаёт parseCsvToTasks. */
  const TASK_PROMPT_COLUMNS = [
    'grade', 'topic_title', 'topic_title_lv', 'subtopic_code',
    'condition_latex', 'condition_latex_lv', 'answer_latex', 'answer_latex_lv',
    'hint_latex', 'hint_latex_lv', 'solution_latex', 'solution_latex_lv',
    'difficulty', 'tags', 'condition_svg'
  ];
  const DEFAULT_TAG_SLUGS = [
    'algebriskie-parveidojumi', 'vienadojumi', 'nevienadibas', 'funkcijas', 'grafiki',
    'koordinatu-metode', 'vektori', 'trigonometrija', 'planimetrija', 'stereometrija',
    'merijumi', 'dalas-procenti', 'dalamiba', 'pakapes-saknes', 'logaritmi',
    'virknes', 'kombinatorika', 'varbutiba', 'statistika', 'matematiska-analize',
    'modelesana', 'teksta-uzdevumi', 'pieradijumi'
  ];

  const buildTaskPrompt = ({ grade = null, gradeLabel = '', topic = null, subtopics = [], subtopic = null, count = 30, tags = [] } = {}) => {
    const n = Math.max(1, Math.min(60, Number(count) || 30));
    const tagSlugs = (tags && tags.length ? tags : DEFAULT_TAG_SLUGS).filter(Boolean);
    const coded = (subtopics || []).filter(s => s && s.code);
    const lines = [];
    const push = (...xs) => lines.push(...xs);

    push(`Составь ${n} задач по математике для MathTasks — двуязычного (русский и латышский) решебника по латвийскому стандарту Skola2030.`, '');

    push('ЧТО СОСТАВИТЬ');
    if (grade) push(`Класс / курс: ${gradeLabel || grade} — в столбце grade везде пиши ${grade}.`);
    else push('Класс / курс: [КЛАСС] — число в столбце grade: 1–9 для классов, 10 — Vispārīgais, 11 — Matemātika I, 12 — Matemātika II.');
    if (topic) {
      push(`Тема: «${topic.title}»${topic.title_lv ? ` / «${topic.title_lv}»` : ''}. Копируй в topic_title${topic.title_lv ? ' и topic_title_lv' : ''} дословно — по названию задача найдёт свою тему.`);
    } else {
      push('Тема: [НАЗВАНИЕ ТЕМЫ] — впиши в topic_title точное название темы, как на сайте, в topic_title_lv — латышское.');
    }
    if (subtopic && subtopic.code) {
      push(`Все задачи — на подтему ${subtopic.code} «${subtopic.title}»${subtopic.title_lv ? ` (${subtopic.title_lv})` : ''}. В subtopic_code везде пиши ${subtopic.code}.`);
    } else if (coded.length) {
      push('Распредели задачи между подтемами темы. В subtopic_code пиши номер из этого списка и никакой другой:');
      for (const s of coded) push(`- ${s.code} — ${s.title}${s.title_lv ? ` / ${s.title_lv}` : ''}`);
    } else if (topic) {
      push('Подтем с номерами у темы нет — столбец subtopic_code оставь пустым.');
    } else {
      push('subtopic_code — полный номер подтемы из справочника Skola2030 (например 8.8.3, для уровней 11.10.2). Не знаешь номер — оставь ячейку пустой, не выдумывай.');
    }
    push('Сложность — от простого к сложному: примерно 40% «Лёгкий», 40% «Средний», 20% «Сложный». Порядок строк станет нумерацией задач в теме.', '');

    push('ФОРМАТ ОТВЕТА');
    push('Ответ — одна таблица внутри одного блока кода ```tsv … ```: в блоке кода табуляции сохраняются при копировании, а в обычном тексте чат превращает их в пробелы или в картинку-таблицу. Столбцы разделены ТАБУЛЯЦИЕЙ, не запятой — запятая стоит в десятичных дробях и формулах. Первая строка — ровно эти заголовки:');
    push(TASK_PROMPT_COLUMNS.join('\t'));
    push('Одна строка — одна задача. Табуляции внутри ячейки нет. Если в ячейке нужен перенос строки (шаги решения), оберни всю ячейку в двойные кавычки "…", а кавычку внутри удвой: "".');
    push('Вне блока кода — ничего: ни вступления, ни заключения. Если задачи не помещаются в один ответ, остановись на конце целой строки, закрой блок кода и напиши под ним: ПРОДОЛЖЕНИЕ СЛЕДУЕТ. Когда я напишу «дальше», продолжи со следующей задачи новым блоком кода и снова начни его со строки заголовков.', '');

    push('СТОЛБЦЫ');
    push('- condition_latex / condition_latex_lv — условие на русском и то же условие на латышском.');
    push('- answer_latex / answer_latex_lv — короткий ответ без разбора. Если в ответе нет слов, обе ячейки одинаковые: $x = 4$.');
    push('- hint_latex / hint_latex_lv — подсказка: какой приём или теорему применить. Ответа и промежуточных чисел в ней нет.');
    push('- solution_latex / solution_latex_lv — решение по шагам «1. …», «2. …», каждый шаг с новой строки, в конце — ответ. Не пиши «очевидно» — называй теорему или свойство.');
    push('- difficulty — ровно одно слово: Лёгкий, Средний или Сложный.');
    push(`- tags — от 1 до 3 слагов через точку с запятой, только из этого списка: ${tagSlugs.join(', ')}. Тег ставится по приёму решения, а не только по разделу.`);
    push('- condition_svg — чертёж по правилам ниже или пустая ячейка.', '');

    push('ЯЗЫКИ И ФОРМУЛЫ');
    push('- Латышский — не машинный перевод, а формулировка на терминологии Skola2030. Английского нет нигде.');
    push('- Формулы — в $…$ внутри строки или $$…$$ отдельной строкой; обычный текст — вне долларов.');
    push('- Десятичная запятая: 0{,}5. Единицы — в \\text{}: в русской версии $12\\text{ см}$, в латышской $12\\text{ cm}$ (см→cm, км→km, м→m, кг→kg, ч→h, мин→min, НОД→LKD, НОК→MKD).');
    push('- Числа, формулы и знаки $ в обеих версиях совпадают до символа — расходится только текст.');
    push('- Сюжеты латвийские и современные: евро и центы, километры, латышские имена.');
    push('- Проверь арифметику до выдачи: ответ получается из условия, решение ровно одно. Не сошлось — переделай задачу, а не подгоняй ответ.', '');

    push('ЧЕРТЁЖ (condition_svg)');
    push('Обязателен в каждой задаче, где есть фигура, тело, график, точки на координатной плоскости, числовая прямая или диаграмма. В остальных задачах ячейка пустая.');
    push("- SVG одной строкой, атрибуты в одинарных кавычках: <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'>…</svg>, без width и height.");
    push("- Только line, polyline, polygon, path, circle, ellipse, text, g. Линии stroke='#000' stroke-width='2' fill='none'. Текст: <text> с fill='#000' font-family='system-ui, sans-serif' font-size='15'.");
    push("- НА ГЕОМЕТРИЧЕСКИХ ЧЕРТЕЖАХ подписаны ТОЛЬКО вершины: заглавными латинскими буквами (A, B, C, D...), снаружи фигуры рядом с точкой, не ближе 20 к краю. Никаких длин, единиц измерения (см, м), углов, «?», «h» на геометрическом чертеже быть НЕ должно — все числовые данные строго в тексте условия. Если вершины в условии не названы, чертёж идёт без подписей.");
    push("- ДЛЯ ГРАФИКОВ И ДИАГРАММ числа ОБЯЗАТЕЛЬНЫ: на осях координат обязательно подписывай ключевые деления и числа (1, 2, -1, ..., начало отсчёта 0 или O, стрелки и подписи осей x, y), над столбцами диаграмм — их числовые значения (высоты столбцов), на числовой прямой — значения ключевых точек. Без чисел графики и диаграммы бесполезны.");
    push("- Схема, а не масштаб: прямой угол — маленький квадрат в вершине; высоты, медианы и диагонали — пунктиром stroke-dasharray='5 4'. Ответ на чертеже не показывай.");
    return lines.join('\n');
  };

  /* ── Чтение таблиц целиком ──
     Supabase отдаёт не больше 1000 строк за запрос и режет молча: ни
     ошибки, ни признака обрезки в ответе. Всё, что читает таблицу целиком,
     читает её страницами. makeQuery строит запрос заново на каждую
     страницу и обязан задавать однозначный порядок (хотя бы order('id')):
     без него страницы на стыках теряют и повторяют строки. */
  const FETCH_PAGE_SIZE = 1000;
  const fetchAllRows = async (makeQuery, pageSize = FETCH_PAGE_SIZE) => {
    const rows = [];
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await makeQuery().range(from, from + pageSize - 1);
      if (error) return { data: null, error };
      const chunk = data || [];
      rows.push(...chunk);
      if (chunk.length < pageSize) return { data: rows, error: null };
    }
  };

  /* Выборка по списку id: тысяча id в .in() — это адрес длиннее, чем
     пропустит сервер, и та же тысяча строк на ответ. Режем на пачки. */
  const fetchByIdChunks = async (ids, makeQuery, chunkSize = 200) => {
    const rows = [];
    for (let i = 0; i < ids.length; i += chunkSize) {
      const { data, error } = await makeQuery(ids.slice(i, i + chunkSize));
      if (error) return { data: null, error };
      rows.push(...(data || []));
    }
    return { data: rows, error: null };
  };

  /* ── Чертёж SVG из импорта или от нейросети ──
     Чужая разметка. На сайте она идёт через img, где скрипты не
     выполняются, но в хранилище лежит публичным файлом, а по прямой ссылке
     SVG открывается как живой документ. Поэтому всё исполняемое вырезаем
     до загрузки. Размеры не трогаем: без width и height чертёж тянется по
     ширине карточки. */
  const MAX_SVG_CHARS = 200000;
  const sanitizeSvg = raw => {
    let s = String(raw || '').trim()
      .replace(/^<\?xml[^>]*\?>\s*/i, '')
      .replace(/<!DOCTYPE[^>]*>\s*/i, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();
    if (!s) return { error: 'пустой чертёж' };
    if (!/^<svg[\s>]/i.test(s) || !/<\/svg>$/i.test(s)) {
      return { error: 'разметка должна начинаться с <svg и заканчиваться </svg>' };
    }
    if (s.length > MAX_SVG_CHARS) {
      return { error: `чертёж ${Math.round(s.length / 1024)} КБ — больше допустимых ${MAX_SVG_CHARS / 1000} КБ` };
    }
    s = s
      .replace(/<(script|foreignObject|iframe|object|embed|audio|video)\b[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<\/?(script|foreignObject|iframe|object|embed|audio|video)\b[^>]*>/gi, '')
      .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\s(?:xlink:)?href\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, '');
    /* Без xmlns браузер не покажет SVG в теге img вовсе. */
    if (!/^<svg\b[^>]*\sxmlns\s*=/i.test(s)) s = s.replace(/^<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    return { svg: s };
  };

  /* ── Универсальный парсер импорта (автоопределение JSON / CSV / TSV) ── */
  /* Ответ нейросети почти всегда приходит блоком кода ```…``` с текстом
     вокруг, иногда — markdown-таблицей, а длинный — несколькими блоками,
     каждый со своей строкой заголовков. Разбор принимал строку ``` за
     заголовок таблицы и возвращал ноль задач. Здесь достаём содержимое
     блоков, markdown-таблицу переводим в табуляцию, повторы заголовков и
     строку «ПРОДОЛЖЕНИЕ СЛЕДУЕТ» убираем. */
  const unwrapModelAnswer = rawText => {
    let text = String(rawText || '').replace(/^﻿/, '');
    const blocks = [...text.matchAll(/```[\w-]*[ \t]*\r?\n([\s\S]*?)```/g)].map(m => m[1].replace(/\r?\n$/, ''));
    if (blocks.length) text = blocks.join('\n');
    let lines = text.trim().split(/\r?\n/);
    const pipeRow = line => /^\s*\|.*\|\s*$/.test(line);
    const pipeRule = line => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);
    if (lines.length >= 2 && pipeRow(lines[0]) && pipeRule(lines[1])) {
      lines = lines.filter(line => pipeRow(line) && !pipeRule(line))
        .map(line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim()).join('\t'));
    }
    lines = lines.filter(line => !/^\s*ПРОДОЛЖЕНИЕ СЛЕДУЕТ\.?\s*$/i.test(line));
    const header = (lines[0] || '').trim();
    if (/condition_latex|условие/i.test(header)) {
      lines = [lines[0], ...lines.slice(1).filter(line => line.trim() !== header)];
    }
    return lines.join('\n');
  };

  const parseTasksImport = rawText => {
    if (!rawText || typeof rawText !== 'string') {
      return { uniqueTopics: [], uniqueSubtopics: [], tasks: [], format: 'empty' };
    }
    const trimmed = unwrapModelAnswer(rawText).trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      // Похоже на JSON — ошибку называем, а не превращаем текст в мусорную таблицу.
      try {
        return { ...parseMultiTopicJson(trimmed), format: 'json' };
      } catch (e) {
        throw new Error(`JSON не разобрался: ${e.message}`);
      }
    }
    return { ...parseCsvToTasks(trimmed), format: 'csv' };
  };

  /* ── Экспорт задач в Excel / Google Таблицы (CSV с UTF-8 BOM) ── */
  const exportTasksToCsv = (taskList = [], topicsList = [], subtopicsList = []) => {
    const headers = [
      'grade',
      'topic_title',
      'topic_title_lv',
      'subtopic_code',
      'subtopic_title',
      'subtopic_title_lv',
      'condition_latex',
      'condition_latex_lv',
      'answer_latex',
      'answer_latex_lv',
      'solution_latex',
      'solution_latex_lv',
      'hint_latex',
      'hint_latex_lv',
      'difficulty',
      'tags'
    ];

    const escapeCsv = val => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes(';')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    /* Точка с запятой, а не запятая: латышский и русский Excel ждут её как
       разделитель списка и открывают выгрузку через запятую одним столбцом.
       Google Таблицы и наш разбор разделитель определяют сами. */
    const SEP = ';';
    const lines = [headers.join(SEP)];

    for (const task of taskList) {
      const topic = topicsList.find(t => t.id === task.topic_id);
      const sub = subtopicsList.find(s => s.id === task.subtopic_id);
      const tags = (task.task_tags || []).map(tt => tt.tags?.slug || tt.slug).filter(Boolean);

      const row = [
        escapeCsv(task.grade ?? topic?.grade ?? ''),
        escapeCsv(topic?.title || task.topic_title || ''),
        escapeCsv(topic?.title_lv || task.topic_title_lv || ''),
        escapeCsv(sub?.code || task.subtopic_code || ''),
        escapeCsv(sub?.title || task.subtopic_title || ''),
        escapeCsv(sub?.title_lv || task.subtopic_title_lv || ''),
        escapeCsv(task.condition_latex || ''),
        escapeCsv(task.condition_latex_lv || ''),
        escapeCsv(task.answer_latex || ''),
        escapeCsv(task.answer_latex_lv || ''),
        escapeCsv(task.solution_latex || ''),
        escapeCsv(task.solution_latex_lv || ''),
        escapeCsv(task.hint_latex || ''),
        escapeCsv(task.hint_latex_lv || ''),
        escapeCsv(task.difficulty || 'Средний'),
        escapeCsv(tags.join('; '))
      ];
      lines.push(row.join(SEP));
    }

    return '\uFEFF' + lines.join('\r\n');
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

  /* Вес сложности задачи для упорядочивания */
  const getDifficultyWeight = diff => {
    if (!diff) return 2; // Средний по умолчанию
    const d = String(diff).trim().toLowerCase();
    if (d.includes('лёгк') || d.includes('легк') || d.includes('баз') || d.includes('easy') || d.includes('pamat') || d.includes('vienk')) {
      return 1;
    }
    if (d.includes('олимп') || d.includes('olimp')) {
      return 4;
    }
    if (d.includes('сложн') || d.includes('hard') || d.includes('проф') || d.includes('augst') || d.includes('padziļ') || d.includes('sarežģ')) {
      return 3;
    }
    return 2; // Средний / vidējs / medium
  };

  /* Несмещённое перемешивание массива (Фишер — Йетс) */
  const shuffleArray = (array, randomFn = Math.random) => {
    if (!Array.isArray(array)) return [];
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(randomFn() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  /* Сортировка списка задач по заданному критерию */
  const sortTasks = (tasks, sortBy = 'default', options = {}) => {
    if (!Array.isArray(tasks) || tasks.length <= 1) return Array.isArray(tasks) ? [...tasks] : [];
    if (sortBy === 'shuffle') {
      return shuffleArray(tasks, options.random || Math.random);
    }

    const isSolvedFn = typeof options.isSolved === 'function'
      ? options.isSolved
      : (id => {
          if (options.solvedIds) {
            if (options.solvedIds instanceof Set) return options.solvedIds.has(Number(id));
            if (Array.isArray(options.solvedIds)) return options.solvedIds.includes(Number(id));
          }
          return false;
        });

    const subtopicRankMap = new Map();
    if (Array.isArray(options.subtopics)) {
      options.subtopics.forEach((sub, idx) => {
        const rank = (typeof sub.position === 'number' && sub.position > 0) ? sub.position : (idx + 1);
        if (sub.id != null) subtopicRankMap.set(String(sub.id), rank);
        if (sub.code) subtopicRankMap.set(String(sub.code).trim().toLowerCase(), rank);
      });
    }

    const getSubtopicRank = task => {
      if (task.subtopic_id && subtopicRankMap.has(String(task.subtopic_id))) {
        return subtopicRankMap.get(String(task.subtopic_id));
      }
      if (task.subtopic_code && subtopicRankMap.has(String(task.subtopic_code).trim().toLowerCase())) {
        return subtopicRankMap.get(String(task.subtopic_code).trim().toLowerCase());
      }
      return 9999;
    };

    const decorated = tasks.map((task, index) => {
      const pos = Number(task.position);
      return {
        task,
        index,
        position: Number.isFinite(pos) && pos > 0 ? pos : index + 1,
        diffWeight: getDifficultyWeight(task.difficulty),
        isSolved: isSolvedFn(task.id) ? 1 : 0,
        subtopicRank: getSubtopicRank(task)
      };
    });

    decorated.sort((a, b) => {
      if (sortBy === 'num_desc') {
        if (a.position !== b.position) return b.position - a.position;
      } else if (sortBy === 'subtopic') {
        if (a.subtopicRank !== b.subtopicRank) return a.subtopicRank - b.subtopicRank;
        if (a.position !== b.position) return a.position - b.position;
      } else if (sortBy === 'diff_asc') {
        if (a.diffWeight !== b.diffWeight) return a.diffWeight - b.diffWeight;
      } else if (sortBy === 'diff_desc') {
        if (a.diffWeight !== b.diffWeight) return b.diffWeight - a.diffWeight;
      } else if (sortBy === 'unsolved') {
        if (a.isSolved !== b.isSolved) return a.isSolved - b.isSolved; // 0 (unsolved) first
      } else if (sortBy === 'solved') {
        if (a.isSolved !== b.isSolved) return b.isSolved - a.isSolved; // 1 (solved) first
      }
      // Вторичный / дефолтный критерий (num_asc): по порядку позиции в теме
      if (a.position !== b.position) return a.position - b.position;
      return a.index - b.index;
    });

    return decorated.map(item => item.task);
  };

  /* Расчет нового непрерывного порядка задач (1..N) внутри темы:
     порядок: подтема (subtopic.position) -> текущая позиция (task.position) -> дата создания (created_at) -> id */
  const computeTaskRenumbering = (tasks = [], subtopics = []) => {
    if (!Array.isArray(tasks) || !tasks.length) return [];
    const subMap = new Map();
    if (Array.isArray(subtopics)) {
      subtopics.forEach((s, idx) => {
        const pos = Number(s.position);
        subMap.set(s.id, Number.isFinite(pos) && pos > 0 ? pos : idx + 1);
      });
    }

    const copy = [...tasks];
    copy.sort((a, b) => {
      const subA = a.subtopic_id ? (subMap.get(a.subtopic_id) ?? 9999) : 9999;
      const subB = b.subtopic_id ? (subMap.get(b.subtopic_id) ?? 9999) : 9999;
      if (subA !== subB) return subA - subB;

      const posA = Number(a.position);
      const posB = Number(b.position);
      const validA = Number.isFinite(posA) && posA > 0;
      const validB = Number.isFinite(posB) && posB > 0;
      if (validA && validB && posA !== posB) return posA - posB;
      if (validA && !validB) return -1;
      if (!validA && validB) return 1;

      const timeA = String(a.created_at || '');
      const timeB = String(b.created_at || '');
      if (timeA && timeB && timeA !== timeB) return timeA.localeCompare(timeB);

      return (a.id || 0) - (b.id || 0);
    });

    return copy.map((task, idx) => {
      const newPosition = idx + 1;
      const oldPosition = Number(task.position);
      return {
        id: task.id,
        oldPosition: Number.isFinite(oldPosition) ? oldPosition : null,
        newPosition,
        changed: oldPosition !== newPosition,
        task
      };
    });
  };

  /* Расчет нового непрерывного порядка тем (1..N) внутри каждого класса */
  const computeTopicRenumbering = (topics = []) => {
    if (!Array.isArray(topics) || !topics.length) return [];
    const byGrade = new Map();
    topics.forEach(t => {
      const g = t.grade ?? 0;
      if (!byGrade.has(g)) byGrade.set(g, []);
      byGrade.get(g).push(t);
    });

    const results = [];
    for (const [grade, list] of byGrade.entries()) {
      list.sort((a, b) => {
        const posA = Number(a.position);
        const posB = Number(b.position);
        const validA = Number.isFinite(posA) && posA > 0;
        const validB = Number.isFinite(posB) && posB > 0;
        if (validA && validB && posA !== posB) return posA - posB;
        if (validA && !validB) return -1;
        if (!validA && validB) return 1;
        return (a.id || 0) - (b.id || 0);
      });

      list.forEach((t, idx) => {
        const newPosition = idx + 1;
        const oldPosition = Number(t.position);
        results.push({
          id: t.id,
          grade,
          oldPosition: Number.isFinite(oldPosition) ? oldPosition : null,
          newPosition,
          changed: oldPosition !== newPosition,
          topic: t
        });
      });
    }
    return results;
  };

  /* Расчет нового непрерывного порядка подтем (1..M) внутри темы и кодов Skola2030 */
  const computeSubtopicRenumbering = (subtopics = [], topic = null) => {
    if (!Array.isArray(subtopics) || !subtopics.length) return [];
    const copy = [...subtopics];
    copy.sort((a, b) => {
      const posA = Number(a.position);
      const posB = Number(b.position);
      const validA = Number.isFinite(posA) && posA > 0;
      const validB = Number.isFinite(posB) && posB > 0;
      if (validA && validB && posA !== posB) return posA - posB;
      if (validA && !validB) return -1;
      if (!validA && validB) return 1;
      return String(a.code || '').localeCompare(String(b.code || '')) || (a.id || 0) - (b.id || 0);
    });

    const topicPos = topic ? Number(topic.position) : null;
    const topicGrade = topic ? topic.grade : null;

    return copy.map((sub, idx) => {
      const newPosition = idx + 1;
      const oldPosition = Number(sub.position);
      let expectedCode = sub.code || null;
      if (topicGrade != null && Number.isFinite(Number(topicGrade)) && topicPos != null && Number.isFinite(topicPos)) {
        expectedCode = `${topicGrade}.${topicPos}.${newPosition}`;
      }
      return {
        id: sub.id,
        oldPosition: Number.isFinite(oldPosition) ? oldPosition : null,
        newPosition,
        oldCode: sub.code || null,
        newCode: expectedCode,
        changed: oldPosition !== newPosition || (expectedCode && sub.code !== expectedCode),
        subtopic: sub
      };
    });
  };

  /* Проверка, относится ли задача к контрольной работе (по тегам или префиксу названия) */
  const isControlWorkTask = task => {
    if (!task) return false;
    const title = String(task.title || '').trim();
    if (/^\[(?:к[\/.]?р|p[\/.]?d)\]/i.test(title) || /контрольн|pārbaudes\s+darb/i.test(title)) {
      return true;
    }
    const tags = Array.isArray(task.tags)
      ? task.tags
      : (Array.isArray(task.task_tags) ? task.task_tags.map(tt => tt.tags?.slug || tt.slug).filter(Boolean) : []);
    return tags.some(t => {
      const s = String(t).toLowerCase();
      return s === 'kontroldarbs' || s === 'parbaudes-darbs' || s === 'kontrolnaya-rabota';
    });
  };

  /* Отбор задач для контрольной работы темы:
     1. Если автор создал специальные задачи (с префиксом [К/Р] или тегом kontroldarbs) — берём их.
     2. Если их нет (автор составит позже) — формируем тренировочный вариант из 4-5 задач темы с балансом сложности. */
  const selectControlWorkTasks = (tasks = []) => {
    if (!Array.isArray(tasks) || tasks.length === 0) return [];

    // 1. Ищем авторские задачи контрольной работы
    const authored = tasks.filter(isControlWorkTask);
    if (authored.length >= 3) {
      return sortTasks(authored, 'default');
    }

    /* Контрольная сверяет ответы автоматически: задача, чей ответ так не
       сверить («Да, подобны»), всегда считалась бы ошибкой. Берём такие
       только если без них не набрать хотя бы трёх задач. */
    const checkable = tasks.filter(t => isAnswerAutoCheckable(t.answer_latex));
    if (checkable.length >= Math.min(tasks.length, 3)) tasks = checkable;

    // 2. Если задач всего 5 или меньше — берём все
    if (tasks.length <= 5) {
      return sortTasks(tasks, 'default');
    }

    // 3. Формируем сбалансированный вариант: 1-2 лёгкие, 2 средние, 1 сложная
    const easy = tasks.filter(t => getDifficultyWeight(t.difficulty) === 1);
    const med = tasks.filter(t => getDifficultyWeight(t.difficulty) === 2);
    const hard = tasks.filter(t => getDifficultyWeight(t.difficulty) >= 3);

    const picked = [];
    const pickFrom = (arr, count) => {
      const sorted = [...arr].sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));
      for (const item of sorted) {
        if (picked.length < 5 && count > 0 && !picked.includes(item)) {
          picked.push(item);
          count--;
        }
      }
    };

    pickFrom(easy, 2);
    pickFrom(med, 2);
    pickFrom(hard, 1);

    // Если не набралось 5 задач, добираем из оставшихся по порядку
    if (picked.length < 5) {
      for (const t of tasks) {
        if (picked.length >= 5) break;
        if (!picked.includes(t)) picked.push(t);
      }
    }

    return sortTasks(picked, 'default');
  };

  /* Перевод результатов проверочной работы в 10-балльную систему VISC */
  const calculateControlWorkGrade = (score = 0, total = 0) => {
    if (!total || total <= 0) return { grade: 0, percent: 0, levelKey: 'none', levelRu: 'Нет данных', levelLv: 'Nav datu' };
    const validScore = Math.max(0, Math.min(score, total));
    const percent = Math.round((validScore / total) * 100);

    let grade = 1;
    let levelKey = 'nepietiekams';
    let levelRu = 'Неудовлетворительно';
    let levelLv = 'Nepietiekams';

    if (percent >= 95) {
      grade = 10;
      levelKey = 'izcili';
      levelRu = 'Превосходно (Высший уровень)';
      levelLv = 'Izcili (Augstākais līmenis)';
    } else if (percent >= 88) {
      grade = 9;
      levelKey = 'teicami';
      levelRu = 'Отлично (Высший уровень)';
      levelLv = 'Teicami (Augstākais līmenis)';
    } else if (percent >= 78) {
      grade = 8;
      levelKey = 'loti_labi';
      levelRu = 'Очень хорошо (Оптимальный уровень)';
      levelLv = 'Ļoti labi (Optimālais līmenis)';
    } else if (percent >= 68) {
      grade = 7;
      levelKey = 'labi';
      levelRu = 'Хорошо (Оптимальный уровень)';
      levelLv = 'Labi (Optimālais līmenis)';
    } else if (percent >= 58) {
      grade = 6;
      levelKey = 'gandriz_labi';
      levelRu = 'Почти хорошо (Оптимальный уровень)';
      levelLv = 'Gandrīz labi (Optimālais līmenis)';
    } else if (percent >= 48) {
      grade = 5;
      levelKey = 'viduveji';
      levelRu = 'Удовлетворительно (Базовый уровень)';
      levelLv = 'Viduvēji (Pamatlīmenis)';
    } else if (percent >= 38) {
      grade = 4;
      levelKey = 'gandriz_viduveji';
      levelRu = 'Базово достаточно';
      levelLv = 'Gandrīz viduvēji (Pamatlīmenis)';
    } else if (percent >= 25) {
      grade = 3;
      levelKey = 'vaji';
      levelRu = 'Слабо (Ниже стандарта)';
      levelLv = 'Vāji (Zem standarta)';
    } else if (percent >= 12) {
      grade = 2;
      levelKey = 'loti_vaji';
      levelRu = 'Очень слабо';
      levelLv = 'Ļoti vāji';
    } else {
      grade = 1;
      levelKey = 'loti_loti_vaji';
      levelRu = 'Крайне слабо';
      levelLv = 'Ļoti, ļoti vāji';
    }

    return { grade, percent, levelKey, levelRu, levelLv, score: validScore, total };
  };

  /* Фабрика экзаменационного таймера (без DOM).
   *
   * Время считается по часам, а не по числу тиков. Счёт вида seconds++
   * на каждом срабатывании setInterval кажется естественным, но браузер
   * притормаживает таймеры в фоновой вкладке — а ученик уходит на
   * страницу задачи и возвращается. Замер при торможении впятеро: за
   * пятьдесят реальных секунд счётчик насчитывал десять, то есть врал на
   * восемьдесят процентов; трёхчасовой экзамен тянулся бы девятьсот
   * минут. setInterval остаётся, но только чтобы перерисовывать цифры.
   */
  const createExamTimer = (opts = {}) => {
    const now = typeof opts.now === 'function' ? opts.now : () => Date.now();

    let initialSeconds = Math.max(0, Number(opts.initialSeconds) || 0);
    let isRunning = false;
    let intervalId = null;
    let startedAt = 0;      // отметка времени последнего запуска
    let carried = 0;        // сколько уже отсчитано до текущего запуска

    const elapsed = () => carried + (isRunning ? Math.floor((now() - startedAt) / 1000) : 0);
    /* Обратный отсчёт не уходит ниже нуля, секундомер растёт без предела. */
    const current = () => initialSeconds === 0
      ? elapsed()
      : Math.max(0, initialSeconds - elapsed());

    const listeners = new Set();
    const notify = (event) => {
      const state = { seconds: current(), initialSeconds, isRunning };
      listeners.forEach(fn => fn(event, state));
    };

    const start = () => {
      if (isRunning) return;
      /* Уже досчитанный до нуля таймер запускать нечего — иначе он
         молча пойдёт по второму кругу. */
      if (initialSeconds > 0 && current() === 0) return;
      isRunning = true;
      startedAt = now();
      notify('start');
      intervalId = setInterval(() => {
        /* Вкладка могла проспать конец отсчёта целиком: проверяем не
           «дошло ли до нуля именно сейчас», а «не пора ли уже». */
        if (initialSeconds > 0 && current() === 0) {
          pause();
          notify('finish');
          return;
        }
        notify('tick');
      }, 1000);
    };

    const pause = () => {
      if (!isRunning) return;
      carried = elapsed();
      isRunning = false;
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      notify('pause');
    };

    const reset = () => {
      pause();
      carried = 0;
      startedAt = 0;
      notify('reset');
    };

    const setSeconds = (sec) => {
      pause();
      initialSeconds = Math.max(0, Number(sec) || 0);
      carried = 0;
      startedAt = 0;
      notify('set');
    };

    return {
      get seconds() { return current(); },
      get initialSeconds() { return initialSeconds; },
      get isRunning() { return isRunning; },
      start,
      pause,
      stop: pause,
      reset,
      setSeconds,
      setTimer: setSeconds,
      /* Сколько времени прошло — одинаково для обоих режимов. */
      getElapsed: () => elapsed(),
      on: (fn) => {
        listeners.add(fn);
        return () => listeners.delete(fn);
      }
    };
  };

  /* Инициализация UI экзаменационного таймера в DOM */
  const initExamTimerUi = (root = (typeof document !== 'undefined' ? document : null)) => {
    if (!root) return null;
    const btn = root.querySelector('#exam-timer-btn');
    const dropdown = root.querySelector('#timer-dropdown');
    if (!btn || !dropdown) return null;

    const display = root.querySelector('#timer-display');
    const bigDisplay = root.querySelector('#timer-big-display');
    const toggleBtn = root.querySelector('#timer-toggle-btn');
    const resetBtn = root.querySelector('#timer-reset-btn');
    const closeBtn = root.querySelector('#timer-close-btn');
    const presetBtns = root.querySelectorAll('.timer-preset-btn');

    const timer = createExamTimer({ initialSeconds: 0 });

    const updateDisplay = () => {
      const str = formatTimerDisplay(timer.seconds);
      if (display) display.textContent = str;
      if (bigDisplay) bigDisplay.textContent = str;
    };

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.hidden = !dropdown.hidden;
    });

    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.hidden = true;
    });

    root.addEventListener('click', (e) => {
      if (!e.target.closest('#exam-timer-wrap')) {
        dropdown.hidden = true;
      }
    });

    presetBtns.forEach(pBtn => {
      pBtn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        pBtn.classList.add('active');
        const sec = Number(pBtn.dataset.timerSeconds) || 0;
        timer.setSeconds(sec);
        updateDisplay();
      });
    });

    toggleBtn?.addEventListener('click', () => {
      if (timer.isRunning) timer.pause();
      else timer.start();
    });

    resetBtn?.addEventListener('click', () => {
      timer.reset();
      updateDisplay();
    });

    timer.on((event, state) => {
      const tr = (typeof window !== 'undefined' && window.MathTasks?.t) || (k => k);
      if (event === 'start') {
        btn.classList.add('running');
        btn.classList.remove('warning');
        if (toggleBtn) toggleBtn.textContent = tr('timer_pause');
      } else if (event === 'pause') {
        btn.classList.remove('running');
        if (toggleBtn) toggleBtn.textContent = tr('timer_start');
      } else if (event === 'reset') {
        btn.classList.remove('running', 'warning');
        if (toggleBtn) toggleBtn.textContent = tr('timer_start');
      } else if (event === 'tick') {
        if (state.initialSeconds > 0 && state.seconds <= 60 && state.seconds > 0) {
          btn.classList.add('warning');
        } else {
          btn.classList.remove('warning');
        }
        updateDisplay();
      } else if (event === 'finish') {
        btn.classList.remove('running');
        btn.classList.add('warning');
        if (toggleBtn) toggleBtn.textContent = tr('timer_start');
        updateDisplay();
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
            osc.start();
            osc.stop(ctx.currentTime + 0.8);
          }
        } catch {}
      }
    });

    updateDisplay();
    return timer;
  };

  /* ── Разбор импорта до записи в базу ──────────────────────────────
     Для каждой строки файла: нашлась ли тема и подтема или они будут
     созданы, нет ли дубля — среди задач базы или выше в том же файле, —
     разбираются ли формулы, известны ли теги. Тему и подтему ищет теми же
     правилами, что и сам импорт, поэтому предпросмотр совпадает с
     результатом. Ничего не пишет. Статус строки: ok — импортируется,
     bad — ошибка, dup — дубликат; bad и dup пропускаются. */
  const importDupKey = value => String(value || '').toLowerCase().replace(/\s+/g, '');
  const IMPORT_FORMULA_FIELDS = [
    ['condition_latex', 'условии'], ['answer_latex', 'ответе'], ['solution_latex', 'решении'], ['hint_latex', 'подсказке'],
    ['condition_latex_lv', 'условии LV'], ['answer_latex_lv', 'ответе LV'], ['solution_latex_lv', 'решении LV'], ['hint_latex_lv', 'подсказке LV']
  ];
  const analyzeImportRows = (items = [], ctx = {}) => {
    const { topics = [], subtopics = [], existingConditions = [], tags = null, checkFormula = () => ({ ok: true }) } = ctx;
    const low = value => String(value || '').trim().toLowerCase();
    const existing = new Map();
    for (const row of existingConditions) {
      const key = importDupKey(row.condition_latex);
      if (key && !existing.has(key)) existing.set(key, row.id);
    }
    const seen = new Map();
    const rows = items.map((raw, index) => {
      const item = raw || {};
      const n = index + 1;
      const problems = [];
      const notes = [];
      const cond = String(item.condition_latex || '').trim();
      if (!cond) problems.push({ level: 'bad', text: 'нет условия' });

      const needle = low(item.topic_title);
      const needleLv = low(item.topic_title_lv);
      let topic = item.topic_id ? topics.find(t => String(t.id) === String(item.topic_id)) || null : null;
      if (!topic && (needle || needleLv)) {
        topic = topics.find(t =>
          (needle && low(t.title) === needle) || (needleLv && low(t.title_lv) === needleLv) ||
          (needle && low(t.title_lv) === needle) || (needleLv && low(t.title) === needleLv)) || null;
      }
      // Новую тему импорт заводит только по русскому названию.
      const topicIsNew = !topic && Boolean(needle);
      let newTopicKey = null;
      if (topicIsNew) {
        newTopicKey = needle;
        notes.push('новая тема');
      } else if (!topic && needleLv) {
        problems.push({ level: 'bad', text: `тема «${String(item.topic_title_lv).trim()}» не найдена` });
      } else if (!topic) {
        problems.push({ level: 'bad', text: 'не указана тема' });
      }

      const code = String(item.subtopic_code || '').trim();
      const subNeedle = low(item.subtopic_title);
      const subNeedleLv = low(item.subtopic_title_lv);
      let subtopic = null;
      let newSubtopicKey = null;
      if (code || subNeedle || subNeedleLv) {
        const pool = topic ? subtopics.filter(s => String(s.topic_id) === String(topic.id)) : (topicIsNew ? [] : subtopics);
        subtopic = pool.find(s => code && String(s.code || '').trim() === code)
          || pool.find(s => (subNeedle && low(s.title) === subNeedle) || (subNeedleLv && low(s.title_lv) === subNeedleLv))
          || null;
        // Подтему импорт заводит, если есть её номер или русское название.
        if (!subtopic && (topic || topicIsNew) && (code || subNeedle)) {
          newSubtopicKey = `${topic ? topic.id : needle}::${code || subNeedle}`;
          notes.push(`новая подтема ${code || String(item.subtopic_title).trim()}`);
        } else if (!subtopic) {
          notes.push('подтема не найдена — задача ляжет в тему');
        }
      }

      const broken = IMPORT_FORMULA_FIELDS.find(([key]) => item[key] && !checkFormula(String(item[key])).ok);
      if (broken) problems.push({ level: 'bad', text: `сломана формула в ${broken[1]}` });

      if (cond) {
        const key = importDupKey(cond);
        if (existing.has(key)) {
          problems.push({ level: 'dup', text: `уже есть в базе — задача #${existing.get(key)}` });
        } else if (seen.has(key)) {
          problems.push({ level: 'dup', text: `повтор строки ${seen.get(key)}` });
        } else if (!problems.some(p => p.level === 'bad')) {
          // Строка с ошибкой не импортируется — её копия ниже дублем не считается.
          seen.set(key, n);
        }
      }

      if (tags && Array.isArray(item.tags)) {
        const unknown = item.tags.map(low).filter(Boolean)
          .filter(tag => !tags.some(t => low(t.slug) === tag || low(t.title) === tag || low(t.title_lv) === tag));
        if (unknown.length) notes.push(`неизвестные теги: ${unknown.join(', ')}`);
      }
      if (cond && !String(item.condition_latex_lv || '').trim()) notes.push('без перевода LV');

      const status = problems.some(p => p.level === 'bad') ? 'bad' : problems.length ? 'dup' : 'ok';
      return {
        n, item, status, problems, notes, topic, topicIsNew, subtopic,
        topicTitle: topic ? topic.title : String(item.topic_title || item.topic_title_lv || '').trim(),
        grade: item.grade ?? topic?.grade ?? null,
        newTopicKey, newSubtopicKey
      };
    });
    // Новые темы и подтемы считаем только по строкам, которые будут импортированы.
    const counts = { ok: 0, bad: 0, dup: 0 };
    const newTopics = new Set();
    const newSubtopics = new Set();
    for (const row of rows) {
      counts[row.status]++;
      if (row.status !== 'ok') continue;
      if (row.newTopicKey) newTopics.add(row.newTopicKey);
      if (row.newSubtopicKey) newSubtopics.add(row.newSubtopicKey);
    }
    return { rows, counts, newTopics: newTopics.size, newSubtopics: newSubtopics.size };
  };

  const api = {
    makeSlug,
    sanitizeSearch,
    KATEX_DELIMITERS,
    cleanMathExample,
    normalizeMathAnswer,
    parseFractionOrNumber,
    compareAnswers,
    isAnswerAutoCheckable,
    parseAnswerParts,
    localDateKey,
    computeStreak,
    buildActivityWeeks,
    buildProgressSummary,
    calcTopicProgress,
    formatTimerDisplay,
    getLocalizedText,
    formatTopicTitle,
    formatSubtopicCode,
    formatSubtopicSummary,
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
    safeParseJson,
    getDifficultyWeight,
    shuffleArray,
    sortTasks,
    isControlWorkTask,
    selectControlWorkTasks,
    calculateControlWorkGrade,
    createExamTimer,
    initExamTimerUi,
    parseCsvRows,
    csvToTsv,
    parseCsvToTasks,
    parseTasksImport,
    unwrapModelAnswer,
    analyzeImportRows,
    exportTasksToCsv,
    sanitizeSvg,
    fetchAllRows,
    fetchByIdChunks,
    buildTaskPrompt,
    TASK_PROMPT_COLUMNS,
    computeTaskRenumbering,
    computeTopicRenumbering,
    computeSubtopicRenumbering
  };
  if (typeof globalThis !== 'undefined' && typeof globalThis.window !== 'undefined') {
    globalThis.window.MathTasksLib = api;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
