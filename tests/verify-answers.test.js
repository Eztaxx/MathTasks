import { describe, expect, it } from 'vitest';
import {
  latexToJs, compile, findRelation, extractRoots, extractIntervals, inSet,
  checkEquation, checkInequality
} from '../scripts/verify-answers.mjs';

describe('LaTeX → вычислимое выражение', () => {
  const val = (tex, x) => compile(tex).fn(x);

  it('дроби, корни и степени', () => {
    expect(val('\\frac{x^2 - 4}{x - 2}', 5)).toBeCloseTo(7);
    expect(val('\\sqrt{x}', 9)).toBeCloseTo(3);
    expect(val('2x^2 - 7x + 3', 3)).toBeCloseTo(0);
  });

  it('подразумеваемое умножение', () => {
    expect(val('3(2x - 5) + 4', 4)).toBeCloseTo(13);
    expect(val('(x + 1)(x - 1)', 3)).toBeCloseTo(8);
  });

  it('десятичная запятая в обеих записях', () => {
    expect(val('x + 0{,}5', 1)).toBeCloseTo(1.5);
    expect(val('x + 0,5', 1)).toBeCloseTo(1.5);
  });

  it('логарифм с числовым и с буквенным основанием', () => {
    expect(val('\\log_2(x)', 8)).toBeCloseTo(3);
    expect(val('\\log_x(3x - 2)', 2)).toBeCloseTo(2);
  });

  it('модуль', () => {
    expect(val('|3x - 6|', 0)).toBeCloseTo(6);
  });

  /* Отказ должен быть явным: молчаливый неверный разбор опаснее, чем
     честное «не умею». */
  it('от незнакомых конструкций отказывается вслух', () => {
    expect(() => latexToJs('\\int_0^1 x\\,dx')).toThrow();
    expect(() => latexToJs('\\begin{cases} x = 1 \\end{cases}')).toThrow();
  });
});

describe('разбор ответа', () => {
  it('корни', () => {
    expect(extractRoots('$x = 4$')).toEqual([4]);
    expect(extractRoots('$x_1 = 3$, $x_2 = 0{,}5$')).toEqual([3, 0.5]);
    expect(extractRoots('$14$')).toEqual([14]);
  });

  it('множество корнями не считается', () => {
    expect(extractRoots('$x \\in [2; +\\infty)$')).toBeNull();
  });

  it('промежутки, включая бесконечные', () => {
    const ivs = extractIntervals('$x \\in (-\\infty; -2) \\cup [1; 3]$');
    expect(ivs).toHaveLength(2);
    expect(inSet(-5, ivs)).toBe(true);
    expect(inSet(-2, ivs)).toBe(false);
    expect(inSet(1, ivs)).toBe(true);
    expect(inSet(4, ivs)).toBe(false);
  });
});

describe('отбор: что вообще берём в проверку', () => {
  it('берёт то, что просят решить', () => {
    expect(findRelation('Решите уравнение $$3(2x - 5) + 4 = 5x - 7$$', '$x = 4$')).toBeTruthy();
  });

  /* Ровно та ловушка, на которой первый вариант выдал двенадцать
     ложных тревог: «$p = 0{,}8$» — это данное, а не уравнение. */
  it('не принимает данное за уравнение', () => {
    const t = 'Вероятность попадания равна $p = 0{,}8$. Найдите вероятность трёх попаданий.';
    expect(findRelation(t, '$0{,}4096$')).toBeNull();
  });

  it('молчит там, где решать не просят', () => {
    expect(findRelation('Дана функция $y = x^2 - 6x + 8$. Найдите вершину.', '$-1$')).toBeNull();
  });
});

describe('задача 162: неверный ответ должен быть пойман', () => {
  const condition = 'Решите неравенство: $\\log_x(3x - 2) \\le 2$.';
  const rel = findRelation(condition, '$x \\in [2; +\\infty)$');

  it('условие разбирается', () => {
    expect(rel).toBeTruthy();
    expect(rel.op).not.toBe('=');
  });

  it('исправленный ответ проходит', () => {
    const r = checkInequality(rel, extractIntervals('$x \\in [2; +\\infty)$'));
    expect(r.ok).toBe(true);
    expect(r.tested).toBeGreaterThan(10);
  });

  /* Тот самый ответ, что пролежал в базе: лишний промежуток (2/3; 1).
     Если проверка его пропустит — она бесполезна. */
  it('прежний ответ с лишним промежутком — не проходит', () => {
    const bad = extractIntervals('$x \\in \\left(\\frac{2}{3}; 1\\right) \\cup [2; +\\infty)$')
      || extractIntervals('$x \\in (0.6667; 1) \\cup [2; +\\infty)$');
    const r = checkInequality(rel, bad);
    expect(r.ok).toBe(false);
    expect(r.detail.length).toBeGreaterThan(0);
  });
});

describe('подстановка корней', () => {
  it('верный корень принимается', () => {
    const rel = findRelation('Решите уравнение $$2x^2 - 7x + 3 = 0$$', '$x_1 = 3$, $x_2 = 0{,}5$');
    expect(checkEquation(rel, [3, 0.5]).ok).toBe(true);
  });

  it('подменённый корень отвергается', () => {
    const rel = findRelation('Решите уравнение $$2x^2 - 7x + 3 = 0$$', '$x_1 = 3$, $x_2 = 0{,}5$');
    const r = checkEquation(rel, [3, 0.6]);
    expect(r.ok).toBe(false);
    expect(r.detail[0]).toMatch(/0\.6/);
  });
});
