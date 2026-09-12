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
    /* Градусы: в эталоне они записаны как 65^{'+'}circ, ученик набирает
       «65» или «65°». Без приведения к одному виду верный ответ в
       градусах не засчитывался ни в одном написании. */
    s = s.replace(/\^\{?\\circ\}?/g, '°');
    s = s.replace(/\\degree/g, '°');
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
  const UNIT_WORDS = /(?:см|мм|дм|км|м|га|кг|мг|г|тонн[аы]?|л|мл|ч|мин|сек|с|руб|евро|cm|mm|dm|km|ha|kg|mg|g|t|ml|min|sec|h|s|eur|€|%|°)(?:\^\d)?/gi;

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
        if (char === '"') {
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
      const topicTitle = getVal('topic_title');
      const topicTitleLv = getVal('topic_title_lv') || null;
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
        tags
      });
    }

    return {
      uniqueTopics: Array.from(topicsMap.values()),
      uniqueSubtopics: Array.from(subtopicsMap.values()),
      tasks,
      warnings
    };
  };

  /* ── Универсальный парсер импорта (автоопределение JSON / CSV / TSV) ── */
  const parseTasksImport = rawText => {
    if (!rawText || typeof rawText !== 'string') {
      return { uniqueTopics: [], uniqueSubtopics: [], tasks: [], format: 'empty' };
    }
    const trimmed = rawText.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const jsonResult = parseMultiTopicJson(trimmed);
        return { ...jsonResult, format: 'json' };
      } catch (e) {
        // Если не JSON — пробуем CSV
      }
    }
    const csvResult = parseCsvToTasks(trimmed);
    return { ...csvResult, format: 'csv' };
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
    parseCsvToTasks,
    parseTasksImport,
    exportTasksToCsv,
    computeTaskRenumbering,
    computeTopicRenumbering,
    computeSubtopicRenumbering
  };
  if (typeof globalThis !== 'undefined' && typeof globalThis.window !== 'undefined') {
    globalThis.window.MathTasksLib = api;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
