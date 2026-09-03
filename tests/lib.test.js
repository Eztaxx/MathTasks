import { describe, expect, it } from 'vitest';
import { makeSlug, sanitizeSearch, KATEX_DELIMITERS, compareAnswers, normalizeMathAnswer } from '../public/lib.js';

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

describe('i18n (Trilingual support LV / RU / EN)', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const i18n = require('../public/i18n.js');

  it('поддерживает языки lv, ru, en', () => {
    expect(i18n.SUPPORTED_LANGS).toEqual(['lv', 'ru', 'en']);
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

  it('переводит базовые ключи на английский язык', () => {
    i18n.setLang('en');
    expect(i18n.getLang()).toBe('en');
    expect(i18n.t('nav_home')).toBe('Home');
    expect(i18n.t('diff_easy')).toBe('Basic');
    expect(i18n.t('track_9')).toBe('Grade 9 Exam');
    expect(i18n.t('solved_badge')).toBe('✓ Solved');
  });

  it('корректно подставляет параметры в строку перевода', () => {
    i18n.setLang('lv');
    expect(i18n.t('task_counter', { cur: 3, total: 10 })).toBe('Uzdevums 3 no 10');
    i18n.setLang('ru');
    expect(i18n.t('task_counter', { cur: 3, total: 10 })).toBe('Задача 3 из 10');
    i18n.setLang('en');
    expect(i18n.t('task_counter', { cur: 3, total: 10 })).toBe('Task 3 of 10');
  });
});

describe('calcTopicProgress — трекер прогресса ученика', () => {
  const { calcTopicProgress } = require('../public/lib.js');

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

