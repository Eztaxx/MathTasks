import { describe, it, expect } from 'vitest';
import plotter from '../public/plotter.js';

const { parseExpr, niceStep, formatTick } = plotter;
const near = (fn, x, expected) => expect(fn(x)).toBeCloseTo(expected, 6);

describe('Разбор формул графопостроителя', () => {
  it('считает многочлены и неявное умножение', () => {
    near(parseExpr('x^2 - 4'), 3, 5);
    near(parseExpr('2x + 1'), 4, 9);
    near(parseExpr('x^3 - 3x'), 2, 2);
    near(parseExpr('(x+1)(x-1)'), 3, 8);
  });

  it('понимает школьные имена функций: tg, ctg, lg, ln', () => {
    near(parseExpr('tg(x)'), Math.PI / 4, 1);
    near(parseExpr('ctg(x)'), Math.PI / 4, 1);
    // ctg с составным аргументом: раньше аргумент терялся и получалось NaN
    near(parseExpr('ctg(2*x)'), Math.PI / 8, 1);
    near(parseExpr('lg(x)'), 100, 2);
    near(parseExpr('ln(x)'), Math.E, 1);
  });

  it('понимает корни, модуль, π и e', () => {
    near(parseExpr('sqrt(x) + 1'), 4, 3);
    near(parseExpr('√(x)'), 9, 3);
    near(parseExpr('|x|'), -5, 5);
    near(parseExpr('sin(pi*x)'), 0.5, 1);
    near(parseExpr('e^x'), 1, Math.E);
  });

  it('десятичная запятая считается как дробь, а не как оператор', () => {
    // Запятую даёт математическая клавиатура; в JS (1,5) — это просто 5
    near(parseExpr('1,5*x'), 2, 3);
    near(parseExpr('x^2+0,25'), 2, 4.25);
    expect(parseExpr('x,2')).toBeNull();
  });

  it('за пределами области определения даёт нечисло, а не ошибку', () => {
    const f = parseExpr('sqrt(x)');
    expect(Number.isFinite(f(-1))).toBe(false);
    const g = parseExpr('1/x');
    expect(Number.isFinite(g(0))).toBe(false);
  });

  it('степень читается справа налево, минус слабее степени', () => {
    near(parseExpr('-x^2'), 3, -9);
    near(parseExpr('2^3^2'), 0, 512);
    // 2^-1 через new Function было синтаксической ошибкой: 2**-1 в JS запрещено
    near(parseExpr('2^-1'), 0, 0.5);
    near(parseExpr('3(x+1)^2'), 1, 12);
  });

  it('не пропускает посторонний код', () => {
    const bad = [
      'alert(1)', 'x.constructor', 'eval(1)', 'globalThis', 'window.location', 'x=>1',
      // имена из прототипа объекта не должны находиться в словарях функций
      'constructor', 'constructor(x)', 'toString(x)', 'hasOwnProperty(x)',
      'foo(x)', 'x;y', 'x`1`', 'x[0]'
    ];
    for (const src of bad) expect(parseExpr(src)).toBeNull();
  });

  it('незаконченная формула — null, а не половина ответа', () => {
    for (const src of ['', '   ', 'x+', '(x', 'x)', 'sin', 'sin(', '^2']) {
      expect(parseExpr(src)).toBeNull();
    }
  });
});

describe('Шаг сетки и подписи делений', () => {
  it('шаг всегда вида 1, 2 или 5 на десять в степени', () => {
    for (const raw of [0.013, 0.4, 3, 7, 23, 260, 4100]) {
      const step = niceStep(raw);
      const mantissa = step / 10 ** Math.floor(Math.log10(step));
      expect([1, 2, 5]).toContain(Math.round(mantissa));
      expect(step).toBeGreaterThan(0);
    }
  });

  it('подписи не тянут лишние знаки после запятой', () => {
    expect(formatTick(2, 1)).toBe('2');
    expect(formatTick(0.5, 0.5)).toBe('0.5');
    expect(formatTick(-3, 1)).toBe('-3');
  });
});
