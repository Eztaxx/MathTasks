import { describe, expect, it } from 'vitest';
import { makeSlug, sanitizeSearch, KATEX_DELIMITERS } from '../public/lib.js';

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
