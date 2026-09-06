import { describe, expect, it } from 'vitest';
import i18n from '../public/i18n.js';
import {
  topicEmoji,
  makeSlug,
  sanitizeSearch,
  KATEX_DELIMITERS,
  compareAnswers,
  normalizeMathAnswer,
  calcTopicProgress,
  formatTimerDisplay,
  getLocalizedText,
  maskLatexForTranslation,
  unmaskLatexAfterTranslation,
  parseMultiTopicJson,
  resolveDifficultyMix
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

  it('выбрасывает ошибку при невалидном или пустом вводе', () => {
    expect(() => parseMultiTopicJson('')).toThrow();
    expect(() => parseMultiTopicJson('{ broken json ')).toThrow();
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




describe('topicEmoji — значок темы по названию', () => {
  it('узнаёт математическую тему по ключевому слову', () => {
    expect(topicEmoji('Как сравнивают, складывают и вычитают дроби', 'algebra')).toBe('🍕');
    expect(topicEmoji('Множества и классическая вероятность', 'statistics')).toBe('🎲');
    expect(topicEmoji('Смежные и вертикальные углы', 'geometry')).toBe('📐');
    expect(topicEmoji('Линейные уравнения с одной переменной', 'algebra')).toBe('🟰');
    expect(topicEmoji('Как записывают и исследуют функции', 'algebra')).toBe('📈');
    expect(topicEmoji('Свойства степеней с натуральным показателем', 'algebra')).toBe('🔣');
  });

  it('не путает алгебраическое моделирование с объёмными телами', () => {
    expect(topicEmoji('Линейные уравнения и алгебраическое моделирование', 'algebra')).toBe('🟰');
    expect(topicEmoji('Как создают пространственные модели', 'geometry')).toBe('🧊');
  });

  it('более частное правило важнее общего', () => {
    // «неравенства» не должны попасть под правило «уравнения»
    expect(topicEmoji('Линейные неравенства', 'algebra')).toBe('⚖️');
    // «треугольник» важнее общего «фигуры»
    expect(topicEmoji('Фигуры: признаки треугольника', 'geometry')).toBe('🔺');
  });

  it('без совпадений берёт значок раздела', () => {
    expect(topicEmoji('Абракадабра', 'algebra')).toBe('🔢');
    expect(topicEmoji('Абракадабра', 'geometry')).toBe('📐');
    expect(topicEmoji('Абракадабра', 'statistics')).toBe('📊');
  });

  it('устойчив к пустому названию и неизвестному разделу', () => {
    expect(topicEmoji('', 'unknown')).toBe('📘');
    expect(topicEmoji(null, null)).toBe('📘');
  });
});
