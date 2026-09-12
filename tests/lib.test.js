import { describe, expect, it } from 'vitest';
import i18n from '../public/i18n.js';
import {
  makeSlug,
  sanitizeSearch,
  KATEX_DELIMITERS,
  cleanMathExample,
  compareAnswers,
  normalizeMathAnswer,
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
  resolveSubject,
  normalizeTextKey,
  extractCleanJson,
  safeParseJson,
  getDifficultyWeight,
  shuffleArray,
  sortTasks,
  isControlWorkTask,
  selectControlWorkTasks,
  calculateControlWorkGrade,
  createExamTimer,
  parseCsvRows,
  parseCsvToTasks,
  parseTasksImport,
  exportTasksToCsv,
  computeTaskRenumbering,
  computeTopicRenumbering,
  computeSubtopicRenumbering
} from '../public/lib.js';

describe('makeSlug', () => {
  it('транслитерирует кириллицу', () => {
    expect(makeSlug('Квадратные уравнения')).toBe('kvadratnye-uravneniya');
    expect(makeSlug('Треугольники')).toBe('treugolniki');
  });

  it('схлопывает разделители и обрезает края', () => {
    expect(makeSlug('  Степени   и  корни!  ')).toBe('stepeni-i-korni');
  });

  it('никогда не возвращает пустую строку — иначе слаг нарушит уникальность', () => {
    expect(makeSlug('!!!')).toBe('topic');
    expect(makeSlug('')).toBe('topic');
    expect(makeSlug(undefined)).toBe('topic');
  });
});

describe('sanitizeSearch', () => {
  /* Эти символы PostgREST разбирает как синтаксис фильтра .or(),
     и без чистки запрос падал бы на сервере, а не находил ноль результатов. */
  it('убирает символы, ломающие фильтр PostgREST', () => {
    expect(sanitizeSearch('дробь, (a+b) 50%')).toBe('дробь a+b 50');
    expect(sanitizeSearch('a*b')).toBe('a b');
    expect(sanitizeSearch('100% и "кавычки"')).toBe('100 и кавычки');
    expect(sanitizeSearch("это 'одинарные'")).toBe('это одинарные');
    expect(sanitizeSearch('обратный \\ слэш')).toBe('обратный слэш');
  });

  it('оставляет обычный запрос нетронутым', () => {
    expect(sanitizeSearch('квадратные уравнения')).toBe('квадратные уравнения');
  });

  it('не падает на пустом вводе', () => {
    expect(sanitizeSearch('')).toBe('');
    expect(sanitizeSearch(undefined)).toBe('');
  });
});

describe('KATEX_DELIMITERS', () => {
  /* Дважды ломалось ровно здесь: при правке файла '\\[' схлопывалось в '[',
     и тогда любые квадратные скобки в тексте становились формулой. */
  it('скобочные разделители экранированы, а не голые скобки', () => {
    const pairs = KATEX_DELIMITERS.map(d => [d.left, d.right]);
    expect(pairs).toContainEqual(['\\[', '\\]']);
    expect(pairs).toContainEqual(['\\(', '\\)']);
    expect(pairs).not.toContainEqual(['[', ']']);
    expect(pairs).not.toContainEqual(['(', ')']);
  });

  it('выключная формула объявлена раньше строчной, иначе $$ разберётся как два $', () => {
    const lefts = KATEX_DELIMITERS.map(d => d.left);
    expect(lefts.indexOf('$$')).toBeLessThan(lefts.indexOf('$'));
  });

  it('display выставлен только у выключных разделителей', () => {
    expect(KATEX_DELIMITERS.find(d => d.left === '$$').display).toBe(true);
    expect(KATEX_DELIMITERS.find(d => d.left === '$').display).toBe(false);
  });
});

describe('cleanMathExample', () => {
  it('удаляет латышские вводные шаблонные фразы', () => {
    expect(cleanMathExample('Atrisiniet vienādojumu:\n$$3(2x - 5) + 4 = 5x - 7$$')).toBe('$$3(2x - 5) + 4 = 5x - 7$$');
    expect(cleanMathExample('Aprēķiniet skaitliskās izteiksmes vērtību: $$\\frac{2^7 \\cdot 4^3}{8^4}$$')).toBe('$$\\frac{2^7 \\cdot 4^3}{8^4}$$');
    expect(cleanMathExample('Atrisiniet kvadrātvienādojumu: $$2x^2 - 7x + 3 = 0$$')).toBe('$$2x^2 - 7x + 3 = 0$$');
    expect(cleanMathExample('Vienkāršojiet izteiksmi: $$(a+b)^2$$')).toBe('$$(a+b)^2$$');
  });

  it('удаляет русские вводные шаблонные фразы', () => {
    expect(cleanMathExample('Решите уравнение:\n$$2x + 5 = 11$$')).toBe('$$2x + 5 = 11$$');
    expect(cleanMathExample('Вычислите значение выражения: $$\\sqrt{16} + 9$$')).toBe('$$\\sqrt{16} + 9$$');
    expect(cleanMathExample('Упростите: $$x^2 - 4$$')).toBe('$$x^2 - 4$$');
  });

  it('сохраняет формулы и условия с важным контекстом и текстовые задачи', () => {
    const wordProblem = 'Viens no blakusleņķiem ir par $40^\\circ$ lielāks nekā otrs.';
    expect(cleanMathExample(wordProblem)).toBe(wordProblem);
    expect(cleanMathExample('')).toBe('');
    expect(cleanMathExample(null)).toBe('');
  });
});

describe('compareAnswers (Quick Math Bar & Self-Check)', () => {
  it('сравнивает целые и десятичные числа с запятой или точкой', () => {
    expect(compareAnswers('4', '4')).toBe(true);
    expect(compareAnswers('1,5', '1.5')).toBe(true);
    expect(compareAnswers('0.25', '1/4')).toBe(true);
    expect(compareAnswers('1/2', '0,5')).toBe(true);
  });

  it('сравнивает корни, введенные через символ √ и \\sqrt{}', () => {
    expect(compareAnswers('√5', '\\sqrt{5}')).toBe(true);
    expect(compareAnswers('√(7)', '\\sqrt{7}')).toBe(true);
    expect(compareAnswers('2√3', '2\\sqrt{3}')).toBe(true);
  });

  it('сравнивает степени с ² и ^2', () => {
    expect(compareAnswers('x²', 'x^2')).toBe(true);
    expect(compareAnswers('(a+b)²', '(a+b)^2')).toBe(true);
  });

  it('сравнивает знаки ± и \\pm', () => {
    expect(compareAnswers('±3', '\\pm 3')).toBe(true);
    expect(compareAnswers('+-5', '\\pm 5')).toBe(true);
  });

  it('сравнивает число Пи π и \\pi', () => {
    expect(compareAnswers('2π', '2\\pi')).toBe(true);
    expect(compareAnswers('π/2', '\\frac{\\pi}{2}')).toBe(true);
  });

  it('сравнивает знаки умножения · и \\cdot', () => {
    expect(compareAnswers('2·3', '2*3')).toBe(true);
    expect(compareAnswers('a·b', 'a\\cdot b')).toBe(true);
  });

  it('игнорирует обвязку вида x = ... и лишние пробелы', () => {
    expect(compareAnswers('x = 4', '4')).toBe(true);
    expect(compareAnswers('y = -2.5', '-2,5')).toBe(true);
  });

  it('отклоняет неверные ответы', () => {
    expect(compareAnswers('5', '4')).toBe(false);
    expect(compareAnswers('√3', '3')).toBe(false);
    expect(compareAnswers('', '10')).toBe(false);
  });
});

describe('i18n (Bilingual support LV / RU)', () => {

  it('поддерживает языки lv, ru', () => {
    expect(i18n.SUPPORTED_LANGS).toEqual(['lv', 'ru']);
  });

  it('переводит базовые ключи на латышский язык Skola2030', () => {
    i18n.setLang('lv');
    expect(i18n.getLang()).toBe('lv');
    expect(i18n.t('nav_home')).toBe('Sākums');
    expect(i18n.t('diff_easy')).toBe('Pamatlīmenis');
    expect(i18n.t('track_9')).toBe('Pamatskolas eksāmens');
    expect(i18n.t('solved_badge')).toBe('✓ Atrisināts');
  });

  it('переводит базовые ключи на русский язык', () => {
    i18n.setLang('ru');
    expect(i18n.getLang()).toBe('ru');
    expect(i18n.t('nav_home')).toBe('Главная');
    expect(i18n.t('diff_easy')).toBe('Базовый');
    expect(i18n.t('track_9')).toBe('Экзамен основной школы');
    expect(i18n.t('solved_badge')).toBe('✓ Решено');
  });

  it('корректно подставляет параметры в строку перевода', () => {
    i18n.setLang('lv');
    expect(i18n.t('task_counter', { cur: 3, total: 10 })).toBe('Uzdevums 3 no 10');
    i18n.setLang('ru');
    expect(i18n.t('task_counter', { cur: 3, total: 10 })).toBe('Задача 3 из 10');
  });
});

describe('calcTopicProgress — трекер прогресса ученика', () => {

  it('возвращает нули для пустой темы', () => {
    expect(calcTopicProgress([], [1, 2])).toEqual({ total: 0, solved: 0, percent: 0, isComplete: false });
  });

  it('корректно считает частичный прогресс', () => {
    const res = calcTopicProgress([101, 102, 103, 104, 105], [102, 104]);
    expect(res).toEqual({ total: 5, solved: 2, percent: 40, isComplete: false });
  });

  it('корректно определяет 100% завершение темы (isComplete)', () => {
    const res = calcTopicProgress([1, 2, 3], [1, 2, 3, 999]);
    expect(res).toEqual({ total: 3, solved: 3, percent: 100, isComplete: true });
  });

  it('устойчив к строковым и числовым ID', () => {
    const res = calcTopicProgress(['10', '20'], [10, 20]);
    expect(res).toEqual({ total: 2, solved: 2, percent: 100, isComplete: true });
  });
});

describe('formatTimerDisplay — форматирование времени таймера', () => {

  it('форматирует 0 секунд как 00:00', () => {
    expect(formatTimerDisplay(0)).toBe('00:00');
  });

  it('форматирует секунды до 1 часа как MM:SS', () => {
    expect(formatTimerDisplay(45)).toBe('00:45');
    expect(formatTimerDisplay(125)).toBe('02:05');
    expect(formatTimerDisplay(2400)).toBe('40:00');
  });

  it('форматирует время более 1 часа как H:MM:SS', () => {
    expect(formatTimerDisplay(3600)).toBe('1:00:00');
    expect(formatTimerDisplay(5400)).toBe('1:30:00');
    expect(formatTimerDisplay(7200)).toBe('2:00:00');
    expect(formatTimerDisplay(10800)).toBe('3:00:00');
  });

  it('не уходит в отрицательные числа', () => {
    expect(formatTimerDisplay(-15)).toBe('00:00');
  });
});

describe('getLocalizedText — выбор локализованного поля с fallback', () => {

  const task = {
    title: 'Квадратное уравнение',
    title_lv: 'Kvadrātvienādojums',
    condition_latex: 'Решите $x^2 - 4 = 0$',
    condition_latex_lv: 'Atrisiniet $x^2 - 4 = 0$'
  };

  it('возвращает базовый язык (RU) при lang = "ru"', () => {
    expect(getLocalizedText(task, 'title', 'ru')).toBe('Квадратное уравнение');
    expect(getLocalizedText(task, 'condition_latex', 'ru')).toBe('Решите $x^2 - 4 = 0$');
  });

  it('возвращает перевод на латышский при lang = "lv"', () => {
    expect(getLocalizedText(task, 'title', 'lv')).toBe('Kvadrātvienādojums');
    expect(getLocalizedText(task, 'condition_latex', 'lv')).toBe('Atrisiniet $x^2 - 4 = 0$');
  });

  it('мягко откатывается к русскому, если латышского перевода нет', () => {
    expect(getLocalizedText({ title: 'Без перевода' }, 'title', 'lv')).toBe('Без перевода');
  });

  it('для неизвестного языка тоже отдаёт базовый текст, а не пустоту', () => {
    expect(getLocalizedText(task, 'title', 'de')).toBe('Квадратное уравнение');
  });

  it('устойчив к пустым объектам и полям', () => {
    expect(getLocalizedText(null, 'title', 'lv')).toBe('');
    expect(getLocalizedText({}, 'title', 'lv')).toBe('');
  });
});

describe('maskLatexForTranslation & unmaskLatexAfterTranslation — защита LaTeX при переводе', () => {

  it('маскирует инлайн и блочные формулы KaTeX', () => {
    const text = 'Решите уравнение $x^2 - 5x + 6 = 0$ и найдите $$D = b^2 - 4ac$$.';
    const { maskedText, tokens } = maskLatexForTranslation(text);
    expect(tokens).toEqual(['$x^2 - 5x + 6 = 0$', '$$D = b^2 - 4ac$$']);
    expect(maskedText).toBe('Решите уравнение __MATH_EXPR_0__ и найдите __MATH_EXPR_1__.');
  });

  it('полностью восстанавливает формулы после перевода', () => {
    const originalTokens = ['$x^2 - 5x + 6 = 0$', '$$D = b^2 - 4ac$$'];
    const translatedMasked = 'Solve the equation __MATH_EXPR_0__ and find __MATH_EXPR_1__.';
    const result = unmaskLatexAfterTranslation(translatedMasked, originalTokens);
    expect(result).toBe('Solve the equation $x^2 - 5x + 6 = 0$ and find $$D = b^2 - 4ac$$.');
  });

  it('устойчив к дополнительным пробелам от переводчиков в токенах', () => {
    const originalTokens = ['$\\sqrt{x} = 3$'];
    const translatedMasked = 'Atrisiniet vienādojumu __ MATH_EXPR_0 __.';
    const result = unmaskLatexAfterTranslation(translatedMasked, originalTokens);
    expect(result).toBe('Atrisiniet vienādojumu $\\sqrt{x} = 3$.');
  });
});

describe('parseMultiTopicJson (Массовый импорт файла JSON с несколькими темами)', () => {
  it('парсит иерархический формат тем со вложенными задачами', () => {
    const raw = JSON.stringify([
      {
        topic_title: 'Квадратные уравнения',
        topic_title_lv: 'Kvadrātvienādojumi',
        grade: 8,
        tasks: [
          { title: 'Задача 1', condition_latex: '$x^2 - 4 = 0$', answer_latex: '$x = \\pm 2$' },
          { title: 'Задача 2', condition_latex: '$x^2 - 9 = 0$', answer_latex: '$x = \\pm 3$' }
        ]
      },
      {
        topic_title: 'Теорема Пифагора',
        topic_title_lv: 'Pitagora teorēma',
        grade: 8,
        tasks: [
          { title: 'Гипотенуза', condition_latex: 'Катеты $3$ и $4$', answer_latex: '$5$' }
        ]
      }
    ]);

    const { uniqueTopics, tasks } = parseMultiTopicJson(raw);
    expect(uniqueTopics).toHaveLength(2);
    expect(uniqueTopics[0].title).toBe('Квадратные уравнения');
    expect(uniqueTopics[0].title_lv).toBe('Kvadrātvienādojumi');
    expect(uniqueTopics[0].grade).toBe(8);
    expect(uniqueTopics[1].title).toBe('Теорема Пифагора');

    expect(tasks).toHaveLength(3);
    expect(tasks[0].topic_title).toBe('Квадратные уравнения');
    expect(tasks[0].grade).toBe(8);
    expect(tasks[2].topic_title).toBe('Теорема Пифагора');
  });

  it('парсит объект верхнего уровня с полем topics', () => {
    const raw = JSON.stringify({
      topics: [
        {
          title: 'Линейные уравнения',
          grade: 7,
          tasks: [
            { title: 'Простое уравнение', condition_latex: '$2x = 6$', answer_latex: '$3$' }
          ]
        }
      ]
    });

    const { uniqueTopics, tasks } = parseMultiTopicJson(raw);
    expect(uniqueTopics).toHaveLength(1);
    expect(uniqueTopics[0].title).toBe('Линейные уравнения');
    expect(uniqueTopics[0].grade).toBe(7);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Простое уравнение');
  });

  it('парсит плоский список задач с указанием тем', () => {
    const raw = JSON.stringify([
      {
        topic_title: 'Дроби',
        grade: 5,
        title: 'Сложение дробей',
        condition_latex: '$1/3 + 1/3 = ?$',
        answer_latex: '$2/3$'
      },
      {
        topic_title: 'Проценты',
        grade: 5,
        title: 'Нахождение 10%',
        condition_latex: '$10\\% \\text{ от } 200$',
        answer_latex: '$20$'
      }
    ]);

    const { uniqueTopics, tasks } = parseMultiTopicJson(raw);
    expect(uniqueTopics).toHaveLength(2);
    expect(uniqueTopics.map(t => t.title)).toEqual(['Дроби', 'Проценты']);
    expect(tasks).toHaveLength(2);
    expect(tasks[0].topic_title).toBe('Дроби');
    expect(tasks[1].topic_title).toBe('Проценты');
  });

  it('сохраняет subject_slug и subject_title при парсинге', () => {
    const raw = JSON.stringify([
      {
        topic_title: 'Уравнения',
        subject_slug: 'algebra',
        subject_title: 'Алгебра и числа',
        tasks: [{ title: 'Задача', condition_latex: '$x=1$' }]
      }
    ]);
    const { uniqueTopics } = parseMultiTopicJson(raw);
    expect(uniqueTopics[0].subject_slug).toBe('algebra');
    expect(uniqueTopics[0].subject_title).toBe('Алгебра и числа');
  });

  it('выбрасывает ошибку при невалидном или пустом вводе', () => {
    expect(() => parseMultiTopicJson('')).toThrow();
    expect(() => parseMultiTopicJson('{ broken json ')).toThrow();
  });
});

describe('resolveSubject (Умное распознавание разделов каталога)', () => {
  const sampleSubjects = [
    { id: 1, title: 'Алгебра и числа', slug: 'algebra', title_lv: 'Algebra un skaitļi' },
    { id: 2, title: 'Геометрия', slug: 'geometry', title_lv: 'Ģeometrija' },
    { id: 27, title: 'Комбинаторика и вероятности', slug: 'kombinatorika-un-varbutibas', title_lv: 'Kombinatorika un varbūtības' },
    { id: 3, title: 'Комбинаторика, вероятности и статистика', slug: 'statistics', title_lv: 'Kombinatorika, varbūtības un statistika' },
    { id: 15, title: 'Функции', slug: 'funkcijas', title_lv: 'Funkcijas' },
    { id: 16, title: 'Тригонометрия', slug: 'trigonometrija', title_lv: 'Trigonometrija' },
    { id: 17, title: 'Стереометрия', slug: 'stereometrija', title_lv: 'Stereometrija' },
    { id: 19, title: 'Математический анализ', slug: 'matematiskais-analizs', title_lv: 'Matemātiskā analīze' },
    { id: 28, title: 'Планиметрия', slug: 'planimetrija', title_lv: 'Planimetrija' }
  ];

  it('находит раздел по точному slug', () => {
    expect(resolveSubject('algebra', sampleSubjects)?.id).toBe(1);
    expect(resolveSubject('geometry', sampleSubjects)?.id).toBe(2);
    expect(resolveSubject('trigonometrija', sampleSubjects)?.id).toBe(16);
  });

  it('находит раздел при передаче латышских названий или слагов (algebra_un_skaitli, geometrija)', () => {
    expect(resolveSubject('algebra_un_skaitli', sampleSubjects)?.id).toBe(1);
    expect(resolveSubject('algebra-un-skaitli', sampleSubjects)?.id).toBe(1);
    expect(resolveSubject('Algebra un skaitļi', sampleSubjects)?.id).toBe(1);
    expect(resolveSubject('geometrija', sampleSubjects)?.id).toBe(2);
    expect(resolveSubject('Ģeometrija', sampleSubjects)?.id).toBe(2);
  });

  it('находит раздел при передаче русских названий (Алгебра, Геометрия)', () => {
    expect(resolveSubject('Алгебра и числа', sampleSubjects)?.id).toBe(1);
    expect(resolveSubject('алгебра', sampleSubjects)?.id).toBe(1);
    expect(resolveSubject('геометрия', sampleSubjects)?.id).toBe(2);
    expect(resolveSubject('математический анализ', sampleSubjects)?.id).toBe(19);
  });

  it('возвращает null для несуществующего раздела', () => {
    expect(resolveSubject('astronomy', sampleSubjects)).toBeNull();
    expect(resolveSubject('', sampleSubjects)).toBeNull();
  });
});

describe('safeParseJson & extractCleanJson (Устойчивый парсинг ответов нейросетей)', () => {
  it('извлекает JSON из markdown блока с лишним текстом до и после', () => {
    const raw = 'Вот сгенерированная задача:\n```json\n{\n  "title_ru": "Тест"\n}\n```\nНадеюсь, вам понравилось!';
    const result = safeParseJson(raw);
    expect(result.title_ru).toBe('Тест');
  });

  it('успешно парсит JSON с текстом после закрывающей скобки (ошибка position 1358)', () => {
    const raw = '{"title_ru": "Задача 1", "answer_latex": "$42$"}\n\nПримечание от ИИ: задача создана по стандарту Skola2030.';
    const result = safeParseJson(raw);
    expect(result.title_ru).toBe('Задача 1');
    expect(result.answer_latex).toBe('$42$');
  });

  it('автоматически чинит неэкранированные LaTeX-слэши (\\sqrt, \\frac, \\pm)', () => {
    const raw = '{\n  "condition_latex_ru": "Решите $\\sqrt{x} = 2$",\n  "answer_latex": "$\\pm 4$"\n}';
    // Допустим, в строке одинарные слэши:
    const rawUnescaped = '{\n  "condition": "$\\sqrt{x} + \\frac{1}{2}$",\n  "answer": "$\\pm 5$"\n}';
    const result = safeParseJson(rawUnescaped);
    expect(result.condition).toContain('sqrt');
    expect(result.answer).toContain('pm');
  });

  it('парсит JSON-массив с комментариями вокруг', () => {
    const raw = 'Ответ модели:\n["Atrisināt vienādojumu", "$x = 5$"]\nГотово!';
    const result = safeParseJson(raw);
    expect(result).toEqual(['Atrisināt vienādojumu', '$x = 5$']);
  });
});

describe('resolveDifficultyMix (Сбалансированное распределение сложности 45% / 35% / 20%)', () => {
  it('возвращает фиксированную сложность, если выбран конкретный уровень', () => {
    expect(resolveDifficultyMix('Лёгкий', 0, 10)).toBe('Лёгкий');
    expect(resolveDifficultyMix('Средний', 5, 10)).toBe('Средний');
    expect(resolveDifficultyMix('Сложный', 9, 10)).toBe('Сложный');
  });

  it('при mix корректно распределяет уровни для 20 задач', () => {
    const total = 20;
    const diffs = Array.from({ length: total }, (_, i) => resolveDifficultyMix('mix', i, total));
    const easy = diffs.filter(d => d === 'Лёгкий').length;
    const med = diffs.filter(d => d === 'Средний').length;
    const hard = diffs.filter(d => d === 'Сложный').length;

    // 45% от 20 = 9, 35% от 20 = 7, 20% от 20 = 4
    expect(easy).toBe(9);
    expect(med).toBe(7);
    expect(hard).toBe(4);
  });

  it('при mix корректно распределяет для малого числа задач (N=3)', () => {
    const total = 3;
    const diffs = Array.from({ length: total }, (_, i) => resolveDifficultyMix('mix', i, total));
    expect(diffs).toContain('Лёгкий');
    expect(diffs).toContain('Средний');
    expect(diffs).toContain('Сложный');
  });
});

describe('Grade Name Resilience (Защита от вывода технических ключей grade_8)', () => {
  it('i18n возвращает корректное название для всех классов (1–9) и курсов (10–12 / уровни)', () => {
    for (let g = 1; g <= 9; g++) {
      const nameRu = i18n.t(`grade_${g}`, {}, 'ru');
      expect(nameRu).not.toBe(`grade_${g}`);
      expect(nameRu).toContain('класс');

      const nameLv = i18n.t(`grade_${g}`, {}, 'lv');
      expect(nameLv).not.toBe(`grade_${g}`);
      expect(nameLv).toContain('klase');
    }
    for (let g = 10; g <= 12; g++) {
      const nameRu = i18n.t(`grade_${g}`, {}, 'ru');
      expect(nameRu).not.toBe(`grade_${g}`);
      expect(nameRu).not.toContain(`${g} класс`);

      const nameLv = i18n.t(`grade_${g}`, {}, 'lv');
      expect(nameLv).not.toBe(`grade_${g}`);
      expect(nameLv).not.toContain(`${g}. klase`);
    }
  });

  it('i18n корректно переводит старшие уровни (visparigais, matematika-1, matematika-2)', () => {
    expect(i18n.t('grade_visparigais', {}, 'ru')).not.toBe('grade_visparigais');
    expect(i18n.t('grade_matematika_1', {}, 'ru')).not.toBe('grade_matematika_1');
    expect(i18n.t('grade_matematika_2', {}, 'ru')).not.toBe('grade_matematika_2');
  });
});

describe('CROSS_TAGS (23 closed tags)', () => {
  it('словарь содержит ровно 23 уникальных тега', () => {
    expect(CROSS_TAGS).toHaveLength(23);
    const slugs = CROSS_TAGS.map(t => t.slug);
    expect(new Set(slugs).size).toBe(23);
  });

  it('каждый тег имеет валидный slug, title (RU), title_lv (LV) и описание', () => {
    for (const tag of CROSS_TAGS) {
      expect(tag.slug).toMatch(/^[a-z0-9-]+$/);
      expect(tag.title).toBeTruthy();
      expect(tag.title_lv).toBeTruthy();
      expect(tag.description).toBeTruthy();
    }
  });

  it('getCrossTag возвращает тег по слагу', () => {
    const trig = getCrossTag('trigonometrija');
    expect(trig).toBeTruthy();
    expect(trig.title).toBe('Тригонометрия');
    expect(trig.title_lv).toBe('Trigonometrija');
    expect(getCrossTag('non-existent')).toBeNull();
  });

  it('suggestTagsForTopic предлагает релевантные теги по теме (до 3 тегов)', () => {
    const trigTags = suggestTagsForTopic('Тригонометрические уравнения и неравенства');
    expect(trigTags).toContain('trigonometrija');
    expect(trigTags).toContain('vienadojumi');
    expect(trigTags.length).toBeLessThanOrEqual(3);

    const geomTags = suggestTagsForTopic('Теорема Пифагора и вычисление площадей треугольников');
    expect(geomTags).toContain('planimetrija');
    expect(geomTags).toContain('merijumi');
    expect(geomTags.length).toBeLessThanOrEqual(3);

    const lvTags = suggestTagsForTopic('Trijstūru laukumi un Pitagora teorēma');
    expect(lvTags).toContain('merijumi');
    expect(lvTags.length).toBeLessThanOrEqual(3);

    const emptyTags = suggestTagsForTopic('');
    expect(emptyTags).toEqual([]);
  });
});

describe('Educational stages (Pamatskola vs Vidusskola)', () => {
  it('isGradePamatskola определяет 1–9 классы', () => {
    for (let g = 1; g <= 9; g++) {
      expect(isGradePamatskola(g)).toBe(true);
      expect(isGradePamatskola(String(g))).toBe(true);
    }
    expect(isGradePamatskola(10)).toBe(false);
    expect(isGradePamatskola(12)).toBe(false);
    expect(isGradePamatskola('visparigais')).toBe(false);
    expect(isGradePamatskola(null)).toBe(false);
  });

  it('isGradeVidusskola определяет 10–12 классы и уровни', () => {
    expect(isGradeVidusskola(10)).toBe(true);
    expect(isGradeVidusskola(11)).toBe(true);
    expect(isGradeVidusskola(12)).toBe(true);
    expect(isGradeVidusskola('visparigais')).toBe(true);
    expect(isGradeVidusskola('matematika-1')).toBe(true);
    expect(isGradeVidusskola('matematika-2')).toBe(true);
    expect(isGradeVidusskola(9)).toBe(false);
    expect(isGradeVidusskola(1)).toBe(false);
    expect(isGradeVidusskola(null)).toBe(false);
  });

  it('getTopicStage корректно классифицирует темы', () => {
    expect(getTopicStage({ grade: 1, slug: 'skaitli-lidz-20' })).toBe('pamatskola');
    expect(getTopicStage({ grade: 9, slug: 'kvadratvienadojumi' })).toBe('pamatskola');
    expect(getTopicStage({ grade: 10, slug: 'visp-skaitliski-aprekini' })).toBe('vidusskola');
    expect(getTopicStage({ slug: 'opt-eksponencialas-funkcijas' })).toBe('vidusskola');
    expect(getTopicStage({ slug: 'augst-integrali' })).toBe('vidusskola');
    expect(getTopicStage(null)).toBe('pamatskola');
  });
});

describe('Theme i18n and Support', () => {
  it('i18n содержит ключи перевода темы для всех поддерживаемых языков (RU и LV)', () => {
    const themeKeys = [
      'theme_toggle',
      'theme_light',
      'theme_dark',
      'theme_switch_light',
      'theme_switch_dark'
    ];
    for (const key of themeKeys) {
      const ru = i18n.t(key, {}, 'ru');
      expect(ru).not.toBe(key);
      expect(typeof ru).toBe('string');
      expect(ru.length).toBeGreaterThan(0);

      const lv = i18n.t(key, {}, 'lv');
      expect(lv).not.toBe(key);
      expect(typeof lv).toBe('string');
      expect(lv.length).toBeGreaterThan(0);
    }
  });

  it('содержит корректные русские формулировки для светлой и тёмной темы', () => {
    expect(i18n.t('theme_light', {}, 'ru')).toBe('Светлая тема');
    expect(i18n.t('theme_dark', {}, 'ru')).toBe('Тёмная тема');
    expect(i18n.t('theme_switch_light', {}, 'ru')).toContain('светл');
    expect(i18n.t('theme_switch_dark', {}, 'ru')).toContain('тёмн');
  });

  it('содержит корректные латышские формулировки для светлой и тёмной темы', () => {
    expect(i18n.t('theme_light', {}, 'lv')).toBe('Gaišais motīvs');
    expect(i18n.t('theme_dark', {}, 'lv')).toBe('Tumšais motīvs');
    expect(i18n.t('theme_switch_light', {}, 'lv')).toContain('gaišo');
    expect(i18n.t('theme_switch_dark', {}, 'lv')).toContain('tumšo');
  });
});

describe('compareAnswers: десятичная запятая', () => {
  it('LaTeX-запись 0{,}6 сходится с введённым 0,6 и 0.6', () => {
    expect(compareAnswers('0,6', '$0{,}6$')).toBe(true);
    expect(compareAnswers('0.6', '$0{,}6$')).toBe(true);
    expect(compareAnswers('0,6', '0.6')).toBe(true);
  });

  it('единицы измерения рядом с числом не мешают', () => {
    expect(compareAnswers('10,5', '$10{,}5\\text{ см}$')).toBe(true);
  });

  it('разные числа по-прежнему не сходятся', () => {
    expect(compareAnswers('0,7', '$0{,}6$')).toBe(false);
    expect(compareAnswers('16', '$1{,}6$')).toBe(false);
  });
});



describe('compareAnswers: единицы измерения в ответе', () => {
  it('ученик пишет только число — эталон с единицей засчитывается', () => {
    expect(compareAnswers('6', '$6\\text{ см}$')).toBe(true);
    expect(compareAnswers('25', '$25\\text{ см}^2$')).toBe(true);
    expect(compareAnswers('10,5', '$10{,}5\\text{ см}$')).toBe(true);
  });

  it('ученик пишет ту же единицу — тоже засчитывается', () => {
    expect(compareAnswers('6 см', '$6\\text{ см}$')).toBe(true);
  });

  it('чужая единица не засчитывается', () => {
    expect(compareAnswers('6 кг', '$6\\text{ см}$')).toBe(false);
    expect(compareAnswers('6 km', '$6\\text{ м}$')).toBe(false);
  });

  it('неверное число не спасает отсутствие единицы', () => {
    expect(compareAnswers('7', '$6\\text{ см}$')).toBe(false);
  });
});

describe('getDifficultyWeight', () => {
  it('возвращает 1 для простых уровней (RU / LV / EN)', () => {
    expect(getDifficultyWeight('Лёгкий')).toBe(1);
    expect(getDifficultyWeight('легкий')).toBe(1);
    expect(getDifficultyWeight('Базовый')).toBe(1);
    expect(getDifficultyWeight('pamatlīmenis')).toBe(1);
    expect(getDifficultyWeight('vienkāršs')).toBe(1);
    expect(getDifficultyWeight('easy')).toBe(1);
  });

  it('возвращает 2 для средних уровней и пустых значений', () => {
    expect(getDifficultyWeight('Средний')).toBe(2);
    expect(getDifficultyWeight('vidējs')).toBe(2);
    expect(getDifficultyWeight('medium')).toBe(2);
    expect(getDifficultyWeight('')).toBe(2);
    expect(getDifficultyWeight(null)).toBe(2);
    expect(getDifficultyWeight(undefined)).toBe(2);
  });

  it('возвращает 3 для сложных и углублённых уровней', () => {
    expect(getDifficultyWeight('Сложный')).toBe(3);
    expect(getDifficultyWeight('Профильный')).toBe(3);
    expect(getDifficultyWeight('padziļinātais')).toBe(3);
    expect(getDifficultyWeight('augstākais')).toBe(3);
    expect(getDifficultyWeight('sarežģīts')).toBe(3);
    expect(getDifficultyWeight('hard')).toBe(3);
  });

  it('возвращает 4 для олимпиадного уровня', () => {
    expect(getDifficultyWeight('Олимпиадный')).toBe(4);
    expect(getDifficultyWeight('olimpiāde')).toBe(4);
    expect(getDifficultyWeight('olimp')).toBe(4);
  });
});

describe('shuffleArray', () => {
  it('возвращает новый массив с теми же элементами', () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(original);
    expect(shuffled).toHaveLength(5);
    expect(shuffled).toEqual(expect.arrayContaining(original));
    expect(original).toEqual([1, 2, 3, 4, 5]); // Исходный массив не мутирован
  });

  it('корректно обрабатывает пустые массивы и массивы из 1 элемента', () => {
    expect(shuffleArray([])).toEqual([]);
    expect(shuffleArray([42])).toEqual([42]);
    expect(shuffleArray(null)).toEqual([]);
  });

  it('работает детерминированно с кастомным randomFn', () => {
    const list = ['a', 'b', 'c'];
    // Всегда выбирает первый доступный индекс
    const fixedRandom = () => 0;
    const shuffled = shuffleArray(list, fixedRandom);
    expect(shuffled).toEqual(['b', 'c', 'a']);
  });
});

describe('sortTasks', () => {
  const sampleTasks = [
    { id: 1, title: 'Задача 1', position: 1, difficulty: 'Средний' },
    { id: 2, title: 'Задача 2', position: 2, difficulty: 'Сложный' },
    { id: 3, title: 'Задача 3', position: 3, difficulty: 'Лёгкий' },
    { id: 4, title: 'Задача 4', position: 4, difficulty: 'Олимпиадный' },
    { id: 5, title: 'Задача 5', position: 5, difficulty: 'Лёгкий' }
  ];

  it('сортирует по умолчанию по position', () => {
    const shuffled = [sampleTasks[3], sampleTasks[0], sampleTasks[2], sampleTasks[4], sampleTasks[1]];
    const sorted = sortTasks(shuffled, 'default');
    expect(sorted.map(t => t.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('сортирует diff_asc (сначала простые)', () => {
    const sorted = sortTasks(sampleTasks, 'diff_asc');
    // Лёгкие: id 3 (pos 3), id 5 (pos 5)
    // Средний: id 1 (pos 1)
    // Сложный: id 2 (pos 2)
    // Олимпиадный: id 4 (pos 4)
    expect(sorted.map(t => t.id)).toEqual([3, 5, 1, 2, 4]);
  });

  it('сортирует diff_desc (сначала сложные)', () => {
    const sorted = sortTasks(sampleTasks, 'diff_desc');
    // Олимпиадный: 4
    // Сложный: 2
    // Средний: 1
    // Лёгкие: 3, 5
    expect(sorted.map(t => t.id)).toEqual([4, 2, 1, 3, 5]);
  });

  it('сортирует unsolved (сначала нерешённые)', () => {
    // Допустим, задачи 1 и 3 решены
    const solvedIds = new Set([1, 3]);
    const sorted = sortTasks(sampleTasks, 'unsolved', { solvedIds });
    // Нерешённые: 2, 4, 5
    // Решённые: 1, 3
    expect(sorted.map(t => t.id)).toEqual([2, 4, 5, 1, 3]);
  });

  it('сортирует solved (сначала решённые)', () => {
    const solvedIds = [2, 5];
    const sorted = sortTasks(sampleTasks, 'solved', { solvedIds });
    // Решённые: 2, 5
    // Нерешённые: 1, 3, 4
    expect(sorted.map(t => t.id)).toEqual([2, 5, 1, 3, 4]);
  });

  it('поддерживает options.isSolved как функцию', () => {
    const sorted = sortTasks(sampleTasks, 'unsolved', {
      isSolved: id => id === 4
    });
    expect(sorted.map(t => t.id)).toEqual([1, 2, 3, 5, 4]);
  });

  it('сортирует задачи в обратном порядке номеров (num_desc)', () => {
    const sorted = sortTasks(sampleTasks, 'num_desc');
    expect(sorted.map(t => t.id)).toEqual([5, 4, 3, 2, 1]);
  });

  it('сортирует задачи по подтемам (subtopic)', () => {
    const subtopics = [
      { id: 101, code: '8.1.1', position: 1 },
      { id: 102, code: '8.1.2', position: 2 }
    ];
    const tasksWithSubs = [
      { id: 1, position: 1, subtopic_id: 102 },
      { id: 2, position: 2, subtopic_id: 101 },
      { id: 3, position: 3, subtopic_id: 102 },
      { id: 4, position: 4, subtopic_id: 101 }
    ];
    const sorted = sortTasks(tasksWithSubs, 'subtopic', { subtopics });
    // Подтема 101 (position 1) идет первой: задачи 2 (pos 2), 4 (pos 4)
    // Подтема 102 (position 2) идет второй: задачи 1 (pos 1), 3 (pos 3)
    expect(sorted.map(t => t.id)).toEqual([2, 4, 1, 3]);
  });

  it('перемешивает задачи в режиме shuffle', () => {
    const result = sortTasks(sampleTasks, 'shuffle', { random: () => 0 });
    expect(result).toHaveLength(5);
    expect(result.map(t => t.id)).not.toEqual([1, 2, 3, 4, 5]);
  });

  it('безопасно возвращает пустой или единичный массив', () => {
    expect(sortTasks([])).toEqual([]);
    expect(sortTasks([{ id: 10 }])).toEqual([{ id: 10 }]);
    expect(sortTasks(null)).toEqual([]);
  });
});

describe('isControlWorkTask', () => {
  it('распознаёт префиксы [К/Р], [КР], [P/D], [PD] в названии', () => {
    expect(isControlWorkTask({ title: '[К/Р] Квадратные уравнения' })).toBe(true);
    expect(isControlWorkTask({ title: '[кр] Линейные уравнения' })).toBe(true);
    expect(isControlWorkTask({ title: '[P/D] Kvadratvienādojumi' })).toBe(true);
    expect(isControlWorkTask({ title: '[PD] Trīsstūri' })).toBe(true);
    expect(isControlWorkTask({ title: 'Контрольная работа №1' })).toBe(true);
    expect(isControlWorkTask({ title: 'Temata pārbaudes darbs' })).toBe(true);
    expect(isControlWorkTask({ title: 'Обычная задача на теорему Виета' })).toBe(false);
  });

  it('распознаёт теги kontroldarbs и parbaudes-darbs', () => {
    expect(isControlWorkTask({ title: 'Задача 1', tags: ['kontroldarbs'] })).toBe(true);
    expect(isControlWorkTask({ title: 'Задача 2', tags: ['parbaudes-darbs'] })).toBe(true);
    expect(isControlWorkTask({ title: 'Задача 3', task_tags: [{ tags: { slug: 'kontroldarbs' } }] })).toBe(true);
    expect(isControlWorkTask({ title: 'Задача 4', tags: ['algebra', 'vienadojumi'] })).toBe(false);
  });
});

describe('selectControlWorkTasks', () => {
  it('отдаёт предпочтение авторским задачам контрольной работы', () => {
    const mixed = [
      { id: 1, title: 'Обычная задача 1', difficulty: 'Лёгкий', position: 1 },
      { id: 2, title: '[К/Р] Задание 1', difficulty: 'Лёгкий', position: 2 },
      { id: 3, title: '[К/Р] Задание 2', difficulty: 'Средний', position: 3 },
      { id: 4, title: '[К/Р] Задание 3', difficulty: 'Сложный', position: 4 },
      { id: 5, title: 'Обычная задача 2', difficulty: 'Средний', position: 5 }
    ];
    const cw = selectControlWorkTasks(mixed);
    expect(cw.map(t => t.id)).toEqual([2, 3, 4]);
  });

  it('формирует сбалансированный тренировочный вариант из задач темы, если авторских к/р пока нет', () => {
    const topicTasks = [
      { id: 10, title: 'Задача 1', difficulty: 'Лёгкий', position: 1 },
      { id: 11, title: 'Задача 2', difficulty: 'Лёгкий', position: 2 },
      { id: 12, title: 'Задача 3', difficulty: 'Средний', position: 3 },
      { id: 13, title: 'Задача 4', difficulty: 'Средний', position: 4 },
      { id: 14, title: 'Задача 5', difficulty: 'Сложный', position: 5 },
      { id: 15, title: 'Задача 6', difficulty: 'Сложный', position: 6 }
    ];
    const cw = selectControlWorkTasks(topicTasks);
    expect(cw).toHaveLength(5);
    // Должны присутствовать задачи разных сложностей
    const diffs = cw.map(t => t.difficulty);
    expect(diffs).toContain('Лёгкий');
    expect(diffs).toContain('Средний');
    expect(diffs).toContain('Сложный');
  });

  it('корректно обрабатывает пустые списки и короткие темы', () => {
    expect(selectControlWorkTasks([])).toEqual([]);
    const short = [{ id: 1, title: 'Единственная задача', position: 1 }];
    expect(selectControlWorkTasks(short)).toEqual(short);
  });
});

describe('calculateControlWorkGrade', () => {
  it('правильно рассчитывает высшие баллы (9-10)', () => {
    expect(calculateControlWorkGrade(10, 10).grade).toBe(10);
    expect(calculateControlWorkGrade(10, 10).percent).toBe(100);
    expect(calculateControlWorkGrade(9, 10).grade).toBe(9);
    expect(calculateControlWorkGrade(9, 10).percent).toBe(90);
  });

  it('правильно рассчитывает оптимальные баллы (6-8)', () => {
    expect(calculateControlWorkGrade(8, 10).grade).toBe(8);
    expect(calculateControlWorkGrade(7, 10).grade).toBe(7);
    expect(calculateControlWorkGrade(6, 10).grade).toBe(6);
  });

  it('правильно рассчитывает базовые баллы (4-5)', () => {
    expect(calculateControlWorkGrade(5, 10).grade).toBe(5);
    expect(calculateControlWorkGrade(4, 10).grade).toBe(4);
  });

  it('правильно рассчитывает недостаточные баллы (1-3)', () => {
    expect(calculateControlWorkGrade(3, 10).grade).toBe(3);
    expect(calculateControlWorkGrade(2, 10).grade).toBe(2);
    expect(calculateControlWorkGrade(1, 10).grade).toBe(1);
    expect(calculateControlWorkGrade(0, 10).grade).toBe(1);
  });

  it('возвращает двуязычные уровни освоения', () => {
    const res = calculateControlWorkGrade(8, 10);
    expect(res.levelLv).toContain('Optimālais līmenis');
    expect(res.levelRu).toContain('Оптимальный уровень');
  });
});

describe('createExamTimer', () => {
  it('инициализируется с корректным временем', () => {
    const timer = createExamTimer({ initialSeconds: 2400 });
    expect(timer.seconds).toBe(2400);
    expect(timer.initialSeconds).toBe(2400);
    expect(timer.isRunning).toBe(false);
  });

  it('позволяет менять пресет времени', () => {
    const timer = createExamTimer({ initialSeconds: 0 });
    timer.setSeconds(5400);
    expect(timer.seconds).toBe(5400);
    expect(timer.initialSeconds).toBe(5400);
    timer.reset();
    expect(timer.seconds).toBe(5400);
  });

  it('уведомляет слушателей о событиях', () => {
    const timer = createExamTimer({ initialSeconds: 100 });
    const events = [];
    const unsubscribe = timer.on((ev) => events.push(ev));

    timer.start();
    expect(timer.isRunning).toBe(true);
    expect(events).toContain('start');

    timer.pause();
    expect(timer.isRunning).toBe(false);
    expect(events).toContain('pause');

    timer.reset();
    expect(events).toContain('reset');

    unsubscribe();
    timer.start();
    // Больше событий не добавляется
    expect(events.filter(e => e === 'start')).toHaveLength(1);
    timer.pause();
  });
});




describe('createExamTimer: время по часам, а не по тикам', () => {
  /* Подменяем и часы, и setInterval: так можно проиграть фоновую вкладку,
     где тики приходят реже, чем раз в секунду. */
  const harness = () => {
    const real = { setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval };
    let clock = 1_000_000;
    let tick = null;
    globalThis.setInterval = fn => { tick = fn; return 1; };
    globalThis.clearInterval = () => { tick = null; };
    return {
      now: () => clock,
      advance: seconds => { clock += seconds * 1000; },
      fire: () => tick && tick(),
      restore: () => { globalThis.setInterval = real.setInterval; globalThis.clearInterval = real.clearInterval; }
    };
  };

  it('секундомер не отстаёт, когда фоновая вкладка тормозит тики', () => {
    const h = harness();
    const timer = createExamTimer({ initialSeconds: 0, now: h.now });
    timer.start();
    /* Десять тиков, но между ними по пять секунд реального времени —
       ровно так браузер обходится с фоновой вкладкой. */
    for (let i = 0; i < 10; i++) { h.advance(5); h.fire(); }
    expect(timer.seconds).toBe(50);
    h.restore();
  });

  it('обратный отсчёт заканчивается вовремя, даже если вкладка проспала конец', () => {
    const h = harness();
    const timer = createExamTimer({ initialSeconds: 60, now: h.now });
    const events = [];
    timer.on(ev => events.push(ev));
    timer.start();
    /* Вкладка молчала полторы минуты и прислала один тик. */
    h.advance(90);
    h.fire();
    expect(timer.seconds).toBe(0);
    expect(events).toContain('finish');
    expect(timer.isRunning).toBe(false);
    h.restore();
  });

  it('пауза сохраняет отсчитанное, а не обнуляет его', () => {
    const h = harness();
    const timer = createExamTimer({ initialSeconds: 100, now: h.now });
    timer.start();
    h.advance(30);
    timer.pause();
    expect(timer.seconds).toBe(70);
    /* Пока на паузе, часы идут — на счётчике это отражаться не должно. */
    h.advance(1000);
    expect(timer.seconds).toBe(70);
    timer.start();
    h.advance(20);
    h.fire();
    expect(timer.seconds).toBe(50);
    h.restore();
  });

  it('досчитанный до нуля таймер не идёт по второму кругу', () => {
    const h = harness();
    const timer = createExamTimer({ initialSeconds: 10, now: h.now });
    timer.start();
    h.advance(15);
    h.fire();
    expect(timer.seconds).toBe(0);
    timer.start();
    expect(timer.isRunning).toBe(false);
    h.restore();
  });

  it('сброс возвращает исходное время', () => {
    const h = harness();
    const timer = createExamTimer({ initialSeconds: 120, now: h.now });
    timer.start();
    h.advance(45);
    timer.reset();
    expect(timer.seconds).toBe(120);
    expect(timer.getElapsed()).toBe(0);
    h.restore();
  });
});

describe('compareAnswers: градусы в ответе', () => {
  /* Эталон пишет градусы как 65^\circ, ученик набирает «65» или «65°».
     До правки не засчитывалось ни одно написание. */
  it('число без знака градуса засчитывается', () => {
    expect(compareAnswers('65', '$65^\\circ$')).toBe(true);
  });

  it('число со знаком градуса засчитывается', () => {
    expect(compareAnswers('65°', '$65^\\circ$')).toBe(true);
  });

  it('неверное число не засчитывается', () => {
    expect(compareAnswers('60', '$65^\\circ$')).toBe(false);
  });
});

describe('calculateControlWorkGrade: подписи на двух языках', () => {
  it('отдаёт подпись отдельно для русского и латышского', () => {
    const r = calculateControlWorkGrade(3, 5);
    expect(r.grade).toBe(6);
    expect(r.percent).toBe(60);
    expect(typeof r.levelRu).toBe('string');
    expect(typeof r.levelLv).toBe('string');
    expect(r.levelRu.length).toBeGreaterThan(0);
    expect(r.levelLv.length).toBeGreaterThan(0);
  });

  it('крайние значения не выпадают из шкалы', () => {
    expect(calculateControlWorkGrade(5, 5).grade).toBe(10);
    expect(calculateControlWorkGrade(0, 5).grade).toBe(1);
    expect(calculateControlWorkGrade(0, 0).grade).toBe(0);
  });
});

describe('calculateControlWorkGrade: score и total', () => {
  it('возвращает исходные числа, чтобы строку «Верно: 3 из 5» было чем заполнить', () => {
    const r = calculateControlWorkGrade(3, 5);
    expect(r.score).toBe(3);
    expect(r.total).toBe(5);
  });

  it('счёт выше максимума обрезается, а не выводится как есть', () => {
    const r = calculateControlWorkGrade(9, 5);
    expect(r.score).toBe(5);
    expect(r.percent).toBe(100);
  });
});

describe('formatTopicTitle: нумерация тем Skola2030', () => {
  it('добавляет префикс {grade}.{position}. к названию без номера', () => {
    const topic = {
      grade: 9,
      position: 1,
      title: 'Как определяют и характеризуют подобные треугольники',
      title_lv: 'Kā definē un raksturo līdzīgus trijstūrus?'
    };
    expect(formatTopicTitle(topic, 'ru')).toBe('9.1. Как определяют и характеризуют подобные треугольники');
    expect(formatTopicTitle(topic, 'lv')).toBe('9.1. Kā definē un raksturo līdzīgus trijstūrus?');
  });

  it('не дублирует префикс, если заголовок уже пронумерован', () => {
    const topic = {
      grade: 9,
      position: 1,
      title: '9.1. Как определяют и характеризуют подобные треугольники',
      title_lv: '9.1. Kā definē un raksturo līdzīgus trijstūrus?'
    };
    expect(formatTopicTitle(topic, 'ru')).toBe('9.1. Как определяют и характеризуют подобные треугольники');
    expect(formatTopicTitle(topic, 'lv')).toBe('9.1. Kā definē un raksturo līdzīgus trijstūrus?');
  });

  it('корректно форматирует темы разных классов (1–9)', () => {
    expect(formatTopicTitle({ grade: 1, position: 8, title: 'Как описывают и создают фигуры' })).toBe('1.8. Как описывают и создают фигуры');
    expect(formatTopicTitle({ grade: 2, position: 4, title: 'Как расчет времени помогает планировать' })).toBe('2.4. Как расчет времени помогает планировать');
    expect(formatTopicTitle({ grade: 7, position: 9, title: 'Линейные неравенства' })).toBe('7.9. Линейные неравенства');
    expect(formatTopicTitle({ grade: 8, position: 8, title: 'Теорема Пифагора' })).toBe('8.8. Теорема Пифагора');
  });

  it('нормализует устаревший или неполный номер до канонического {grade}.{position}.', () => {
    const topic = { grade: 9, position: 3, title: '1. Тригонометрия' };
    expect(formatTopicTitle(topic)).toBe('9.3. Тригонометрия');
  });

  /* Vispārīgais, Matemātika I и Matemātika II — уровни, а не классы:
     числа 10, 11 и 12 в базе служебные, в заголовке им делать нечего. */
  it('в старшей школе нумерует темы сквозным номером без класса', () => {
    expect(formatTopicTitle({ grade: 10, position: 1, title: 'Числовые расчеты в жизненных ситуациях' }))
      .toBe('1. Числовые расчеты в жизненных ситуациях');
    expect(formatTopicTitle({ grade: 11, position: 12, title: 'Линейная функция и её график' }))
      .toBe('12. Линейная функция и её график');
    expect(formatTopicTitle({ grade: 12, position: 45, title: 'Применение интеграла в физике' }))
      .toBe('45. Применение интеграла в физике');
  });

  it('срезает старый номер с классом, если он уже стоит в названии темы уровня', () => {
    expect(formatTopicTitle({ grade: 10, position: 2, title: '10.2. Проценты, кредиты и финансовые расчеты' }))
      .toBe('2. Проценты, кредиты и финансовые расчеты');
  });
});

describe('formatSubtopicCode: номер подтемы для показа', () => {
  it('в основной школе оставляет номер как есть', () => {
    expect(formatSubtopicCode('7.5.2', 7)).toBe('7.5.2');
    expect(formatSubtopicCode('1.1.1', 1)).toBe('1.1.1');
  });

  it('в старшей школе срезает служебный номер уровня', () => {
    expect(formatSubtopicCode('10.5.1', 10)).toBe('5.1');
    expect(formatSubtopicCode('11.10.4', 11)).toBe('10.4');
    expect(formatSubtopicCode('12.45.3', 12)).toBe('45.3');
  });

  it('не трогает номер, который не начинается с этого уровня, и пустые значения', () => {
    expect(formatSubtopicCode('9.1.1', 10)).toBe('9.1.1');
    expect(formatSubtopicCode('', 11)).toBe('');
    expect(formatSubtopicCode(null, 11)).toBe('');
    expect(formatSubtopicCode('5.1', undefined)).toBe('5.1');
  });

  it('не добавляет числовой префикс для нечисловых уровней (visparigais)', () => {
    const topic = { grade: 'visparigais', position: 1, title: 'Реальные числа' };
    expect(formatTopicTitle(topic)).toBe('Реальные числа');
  });

  it('безопасно обрабатывает пустые или некорректные входные данные', () => {
    expect(formatTopicTitle(null)).toBe('');
    expect(formatTopicTitle(undefined)).toBe('');
    expect(formatTopicTitle('Простая строка')).toBe('Простая строка');
  });
});

describe('formatSubtopicSummary: грамматика счетчиков подтем и задач', () => {
  it('корректно форматирует множественное и единственное число на латышском (LV)', () => {
    expect(formatSubtopicSummary(1, 1, 'lv')).toBe('1 apakštēma • 1 uzdevums');
    expect(formatSubtopicSummary(5, 55, 'lv')).toBe('5 apakštēmas • 55 uzdevumi');
    expect(formatSubtopicSummary(11, 11, 'lv')).toBe('11 apakštēmas • 11 uzdevumi');
    expect(formatSubtopicSummary(21, 21, 'lv')).toBe('21 apakštēma • 21 uzdevums');
  });

  it('корректно склоняет слова на русском (RU)', () => {
    expect(formatSubtopicSummary(1, 1, 'ru')).toBe('1 подтема • 1 задача');
    expect(formatSubtopicSummary(2, 4, 'ru')).toBe('2 подтемы • 4 задачи');
    expect(formatSubtopicSummary(5, 55, 'ru')).toBe('5 подтем • 55 задач');
    expect(formatSubtopicSummary(12, 14, 'ru')).toBe('12 подтем • 14 задач');
    expect(formatSubtopicSummary(21, 21, 'ru')).toBe('21 подтема • 21 задача');
  });

  it('безопасно обрабатывает нули и пустые значения', () => {
    expect(formatSubtopicSummary(0, 0, 'lv')).toBe('0 apakštēmas • 0 uzdevumi');
    expect(formatSubtopicSummary(0, 0, 'ru')).toBe('0 подтем • 0 задач');
    expect(formatSubtopicSummary(null, undefined, 'ru')).toBe('0 подтем • 0 задач');
  });
});

describe('parseCsvRows', () => {
  it('парсит простые строки с запятыми', () => {
    const csv = 'grade,topic,diff\n8,Уравнения,Лёгкий\n9,Функции,Средний';
    const rows = parseCsvRows(csv);
    expect(rows).toEqual([
      ['grade', 'topic', 'diff'],
      ['8', 'Уравнения', 'Лёгкий'],
      ['9', 'Функции', 'Средний']
    ]);
  });

  it('автоматически распознаёт табуляцию (TSV из Google Таблиц / Excel)', () => {
    const tsv = 'grade\ttopic\tdiff\n8\tУравнения\tЛёгкий';
    const rows = parseCsvRows(tsv);
    expect(rows).toEqual([
      ['grade', 'topic', 'diff'],
      ['8', 'Уравнения', 'Лёгкий']
    ]);
  });

  it('корректно обрабатывает кавычки RFC 4180 с запятыми и переносами строк внутри', () => {
    const csv = 'grade,formula,note\n8,"$x = \\frac{a, b}{c}$","Первая строка\nВторая строка"';
    const rows = parseCsvRows(csv);
    expect(rows).toHaveLength(2);
    expect(rows[1][1]).toBe('$x = \\frac{a, b}{c}$');
    expect(rows[1][2]).toBe('Первая строка\nВторая строка');
  });

  it('обрабатывает экранированные кавычки ""', () => {
    const csv = 'title,val\n"Слово ""в кавычках""",100';
    const rows = parseCsvRows(csv);
    expect(rows[1][0]).toBe('Слово "в кавычках"');
  });
});

describe('parseCsvToTasks', () => {
  it('распознаёт заголовки колонок на русском, латышском и английском', () => {
    const csv = 'Класс,Тема,Код,Подтема,Условие,Ответ,Решение,Сложность\n' +
      '8,Теорема Пифагора,8.2.1,Треугольники,Найди $c$,$c=5$,$c=\\sqrt{25}$,Лёгкий';
    const res = parseCsvToTasks(csv);
    expect(res.uniqueTopics).toHaveLength(1);
    expect(res.uniqueTopics[0].title).toBe('Теорема Пифагора');
    expect(res.uniqueSubtopics).toHaveLength(1);
    expect(res.uniqueSubtopics[0].code).toBe('8.2.1');
    expect(res.tasks).toHaveLength(1);
    expect(res.tasks[0].condition_latex).toBe('Найди $c$');
    expect(res.tasks[0].answer_latex).toBe('$c=5$');
    expect(res.tasks[0].difficulty).toBe('Лёгкий');
  });

  it('поддерживает латышские заголовки колонок', () => {
    const csv = 'Klase,Tema,Apakstema,Uzdevums,Atbilde\n' +
      '9,Funkcijas,Lineara funkcija,Atrast $y$,$y=2$';
    const res = parseCsvToTasks(csv);
    expect(res.tasks).toHaveLength(1);
    expect(res.tasks[0].condition_latex).toBe('Atrast $y$');
    expect(res.tasks[0].answer_latex).toBe('$y=2$');
  });

  it('безопасно возвращает пустой результат для пустых строк', () => {
    expect(parseCsvToTasks('')).toEqual({ uniqueTopics: [], uniqueSubtopics: [], tasks: [] });
    expect(parseCsvToTasks(null)).toEqual({ uniqueTopics: [], uniqueSubtopics: [], tasks: [] });
  });

  /* Выгрузка кладёт латышские столбцы рядом с русскими. Раньше
     «condition_latex_lv» перехватывал «condition_latex» по префиксу. */
  it('не путает латышские столбцы с русскими', () => {
    const tsv = 'grade\ttopic_title\ttopic_title_lv\tcondition_latex\tcondition_latex_lv\tanswer_latex\tanswer_latex_lv\n' +
      '8\tТеорема Пифагора\tPitagora teorēma\tНайдите гипотенузу\tAtrodiet hipotenūzu\t$5$\t$5$';
    const t = parseCsvToTasks(tsv).tasks[0];
    expect(t.topic_title).toBe('Теорема Пифагора');
    expect(t.topic_title_lv).toBe('Pitagora teorēma');
    expect(t.condition_latex).toBe('Найдите гипотенузу');
    expect(t.condition_latex_lv).toBe('Atrodiet hipotenūzu');
    expect(t.answer_latex_lv).toBe('$5$');
  });

  it('понимает русские заголовки латышских столбцов, в том числе в скобках', () => {
    const tsv = 'Класс\tТема\tТема LV\tУсловие\tУсловие (LV)\n' +
      '7\tУравнения\tVienādojumi\tРешите $2x=4$\tAtrisiniet $2x=4$';
    const t = parseCsvToTasks(tsv).tasks[0];
    expect(t.topic_title).toBe('Уравнения');
    expect(t.topic_title_lv).toBe('Vienādojumi');
    expect(t.condition_latex).toBe('Решите $2x=4$');
    expect(t.condition_latex_lv).toBe('Atrisiniet $2x=4$');
  });

  it('служебный столбец topic_id не попадает в название темы', () => {
    const t = parseCsvToTasks('topic_id\ttopic_title\tcondition_latex\n301\tПодобие\tНайдите $x$').tasks[0];
    expect(t.topic_title).toBe('Подобие');
  });

  /* Выгрузка и повторная загрузка должны давать то же самое — иначе
     резервная копия через Excel разрушает каталог. */
  it('выгрузка и повторная загрузка сохраняют оба языка и задачу без перевода', () => {
    const csv = exportTasksToCsv(
      [
        {
          id: 1, topic_id: 10, subtopic_id: 5, grade: 8,
          condition_latex: 'Найдите $x$, если $x^2=9$', condition_latex_lv: 'Atrodiet $x$, ja $x^2=9$',
          answer_latex: '$x=\\pm 3$', answer_latex_lv: '$x=\\pm 3$',
          solution_latex: 'Шаг 1\nШаг 2', difficulty: 'Средний'
        },
        { id: 2, topic_id: 10, grade: 8, condition_latex: 'Только по-русски, $0{,}5 + 0{,}25$', difficulty: 'Лёгкий' }
      ],
      [{ id: 10, title: 'Квадратные уравнения', title_lv: 'Kvadrātvienādojumi', grade: 8 }],
      [{ id: 5, code: '8.7.4', title: 'Решение уравнений', title_lv: 'Vienādojumu risināšana' }]
    );
    const back = parseCsvToTasks(csv);
    expect(back.tasks).toHaveLength(2);
    expect(back.tasks[0].topic_title).toBe('Квадратные уравнения');
    expect(back.tasks[0].topic_title_lv).toBe('Kvadrātvienādojumi');
    expect(back.tasks[0].condition_latex).toBe('Найдите $x$, если $x^2=9$');
    expect(back.tasks[0].condition_latex_lv).toBe('Atrodiet $x$, ja $x^2=9$');
    expect(back.tasks[0].answer_latex).toBe('$x=\\pm 3$');
    expect(back.tasks[0].solution_latex).toBe('Шаг 1\nШаг 2');
    expect(back.tasks[0].subtopic_code).toBe('8.7.4');
    expect(back.tasks[1].condition_latex).toBe('Только по-русски, $0{,}5 + 0{,}25$');
    expect(back.tasks[1].condition_latex_lv).toBeNull();
    expect(back.warnings).toHaveLength(0);
  });

  /* Без столбца темы раньше заводилась тема «Без темы» — настоящая запись
     в базе, которую потом приходилось удалять руками. */
  it('без столбца темы не придумывает тему', () => {
    const res = parseCsvToTasks('condition_latex\tanswer_latex\nРешите $x+1=3$\t$x=2$');
    expect(res.tasks).toHaveLength(1);
    expect(res.tasks[0].topic_title).toBe('');
    expect(res.uniqueTopics).toHaveLength(0);
  });

  /* Запятая внутри формулы без кавычек сдвигает столбцы: ответ уезжает в
     решение, решение — в сложность. Молча такое импортировать нельзя. */
  it('предупреждает о строке шире заголовка', () => {
    const res = parseCsvToTasks('grade,topic_title,condition_latex,answer_latex\n' +
      '9,Системы,Решите систему $x+y=3, x-y=1$,$(2; 1)$');
    expect(res.warnings.length).toBeGreaterThan(0);
    expect(res.warnings[0]).toMatch(/Строка 2/);
  });
});

describe('parseTasksImport: универсальный детектор JSON / CSV', () => {
  it('распознаёт JSON формат', () => {
    const jsonStr = JSON.stringify([
      {
        topic_title: 'Тема 1',
        tasks: [{ condition_latex: '$x=1$' }]
      }
    ]);
    const res = parseTasksImport(jsonStr);
    expect(res.format).toBe('json');
    expect(res.tasks).toHaveLength(1);
    expect(res.tasks[0].condition_latex).toBe('$x=1$');
  });

  it('распознаёт CSV / TSV формат', () => {
    const csvStr = 'grade,topic_title,condition_latex\n8,Алгебра,$2x=4$';
    const res = parseTasksImport(csvStr);
    expect(res.format).toBe('csv');
    expect(res.tasks).toHaveLength(1);
    expect(res.tasks[0].condition_latex).toBe('$2x=4$');
  });
});

describe('exportTasksToCsv', () => {
  it('генерирует CSV с UTF-8 BOM и корректными заголовками', () => {
    const taskList = [
      {
        id: 1,
        grade: 8,
        topic_id: 10,
        subtopic_id: 100,
        condition_latex: 'Решите $x^2 - 4 = 0$',
        answer_latex: '$x = \\pm 2$',
        difficulty: 'Лёгкий',
        task_tags: [{ tags: { slug: 'vienadojumi' } }]
      }
    ];
    const topicsList = [{ id: 10, title: 'Уравнения', title_lv: 'Vienādojumi' }];
    const subtopicsList = [{ id: 100, code: '8.1.1', title: 'Неполные', title_lv: 'Nepilni' }];

    const csv = exportTasksToCsv(taskList, topicsList, subtopicsList);
    expect(csv.startsWith('\uFEFF')).toBe(true); // UTF-8 BOM
    /* Точка с запятой — разделитель списка латышского и русского Excel:
       через запятую выгрузка открывалась там одним столбцом. */
    expect(csv).toContain('grade;topic_title');
    expect(csv).toContain('Уравнения');
    expect(csv).toContain('Vienādojumi');
    expect(csv).toContain('8.1.1');
    expect(csv).toContain('Решите $x^2 - 4 = 0$');
    expect(csv).toContain('vienadojumi');
  });
});

describe('computeTaskRenumbering', () => {
  it('безопасно возвращает пустой массив для пустого ввода', () => {
    expect(computeTaskRenumbering([])).toEqual([]);
    expect(computeTaskRenumbering(null)).toEqual([]);
  });

  it('выставляет последовательные номера 1..N и вычисляет changed', () => {
    const tasks = [
      { id: 10, position: 5 },
      { id: 20, position: 2 },
      { id: 30, position: 9 }
    ];
    const res = computeTaskRenumbering(tasks);
    expect(res).toHaveLength(3);
    expect(res[0]).toEqual({ id: 20, oldPosition: 2, newPosition: 1, changed: true, task: tasks[1] });
    expect(res[1]).toEqual({ id: 10, oldPosition: 5, newPosition: 2, changed: true, task: tasks[0] });
    expect(res[2]).toEqual({ id: 30, oldPosition: 9, newPosition: 3, changed: true, task: tasks[2] });
  });

  it('определяет, что изменений нет, если задачи уже пронумерованы 1..N', () => {
    const tasks = [
      { id: 1, position: 1 },
      { id: 2, position: 2 },
      { id: 3, position: 3 }
    ];
    const res = computeTaskRenumbering(tasks);
    expect(res.every(r => !r.changed)).toBe(true);
    expect(res.map(r => r.newPosition)).toEqual([1, 2, 3]);
  });

  it('учитывает позицию подтемы перед позицией задачи', () => {
    const subtopics = [
      { id: 101, position: 1 },
      { id: 102, position: 2 }
    ];
    const tasks = [
      { id: 1, subtopic_id: 102, position: 1 },
      { id: 2, subtopic_id: 101, position: 5 },
      { id: 3, subtopic_id: 101, position: 2 }
    ];
    const res = computeTaskRenumbering(tasks, subtopics);
    // Сначала подтема 101 (pos: 2, then pos: 5), затем подтема 102 (pos: 1)
    expect(res.map(r => r.id)).toEqual([3, 2, 1]);
    expect(res.map(r => r.newPosition)).toEqual([1, 2, 3]);
  });

  it('сортирует задачи без позиции по дате создания и id', () => {
    const tasks = [
      { id: 5, position: null, created_at: '2026-01-02' },
      { id: 4, position: null, created_at: '2026-01-01' },
      { id: 1, position: 1, created_at: '2026-01-03' }
    ];
    const res = computeTaskRenumbering(tasks);
    expect(res.map(r => r.id)).toEqual([1, 4, 5]);
  });
});

describe('computeTopicRenumbering', () => {
  it('безопасно возвращает пустой массив для пустого ввода', () => {
    expect(computeTopicRenumbering([])).toEqual([]);
    expect(computeTopicRenumbering(null)).toEqual([]);
  });

  it('перенумерует темы 1..N независимо внутри каждого класса', () => {
    const topics = [
      { id: 1, grade: 8, position: 10 },
      { id: 2, grade: 8, position: 3 },
      { id: 3, grade: 9, position: 5 },
      { id: 4, grade: 9, position: 1 }
    ];
    const res = computeTopicRenumbering(topics);
    expect(res).toHaveLength(4);

    const grade8 = res.filter(r => r.grade === 8);
    expect(grade8.map(r => r.id)).toEqual([2, 1]);
    expect(grade8.map(r => r.newPosition)).toEqual([1, 2]);

    const grade9 = res.filter(r => r.grade === 9);
    expect(grade9.map(r => r.id)).toEqual([4, 3]);
    expect(grade9.map(r => r.newPosition)).toEqual([1, 2]);
  });

  it('сохраняет неизменными темы, если позиции уже 1..N', () => {
    const topics = [
      { id: 1, grade: 7, position: 1 },
      { id: 2, grade: 7, position: 2 }
    ];
    const res = computeTopicRenumbering(topics);
    expect(res.every(r => !r.changed)).toBe(true);
  });
});

describe('computeSubtopicRenumbering', () => {
  it('безопасно возвращает пустой массив для пустого ввода', () => {
    expect(computeSubtopicRenumbering([])).toEqual([]);
    expect(computeSubtopicRenumbering(null)).toEqual([]);
  });

  it('перенумерует подтемы 1..M и формирует корректные коды Skola2030', () => {
    const parentTopic = { id: 10, grade: 8, position: 2 };
    const subtopics = [
      { id: 1, position: 4, code: '8.2.4' },
      { id: 2, position: 1, code: '8.2.1' },
      { id: 3, position: 8, code: 'old-code' }
    ];
    const res = computeSubtopicRenumbering(subtopics, parentTopic);
    expect(res).toHaveLength(3);
    expect(res[0].id).toBe(2);
    expect(res[0].newPosition).toBe(1);
    expect(res[0].newCode).toBe('8.2.1');
    expect(res[0].changed).toBe(false);

    expect(res[1].id).toBe(1);
    expect(res[1].newPosition).toBe(2);
    expect(res[1].newCode).toBe('8.2.2');
    expect(res[1].changed).toBe(true);

    expect(res[2].id).toBe(3);
    expect(res[2].newPosition).toBe(3);
    expect(res[2].newCode).toBe('8.2.3');
    expect(res[2].changed).toBe(true);
  });
});

