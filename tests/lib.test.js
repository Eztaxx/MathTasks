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
