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
  safeParseJson
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
    expect(i18n.t('track_9')).toBe('9. klases eksāmens');
    expect(i18n.t('solved_badge')).toBe('✓ Atrisināts');
  });

  it('переводит базовые ключи на русский язык', () => {
    i18n.setLang('ru');
    expect(i18n.getLang()).toBe('ru');
    expect(i18n.t('nav_home')).toBe('Главная');
    expect(i18n.t('diff_easy')).toBe('Базовый');
    expect(i18n.t('track_9')).toBe('Экзамен 9 класс');
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
