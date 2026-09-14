import { describe, expect, it } from 'vitest';
import { compareAnswers, isAnswerAutoCheckable } from '../public/lib.js';

/* Эталоны — настоящие ответы из базы. Раньше верный ответ ученика не
   принимался у 92 задач из 541: несколько значений, «или», пояснения в
   скобках, интервалы, множества. Теперь за ответом прячутся подсказка и
   решение, поэтому ложное «не сошлось» запирало бы ученика. */

describe('compareAnswers: несколько значений', () => {
  it('корни уравнения — в любом порядке, с именами и без', () => {
    const roots = '$x_1 = 3$, $x_2 = 0{,}5$';
    expect(compareAnswers('3; 0,5', roots)).toBe(true);
    expect(compareAnswers('0,5; 3', roots)).toBe(true);
    expect(compareAnswers('x1=3, x2=0.5', roots)).toBe(true);
    expect(compareAnswers('3 и 0,5', roots)).toBe(true);
    expect(compareAnswers('3', roots)).toBe(false);
    expect(compareAnswers('3; 0,6', roots)).toBe(false);
    expect(compareAnswers('3; 0,5; 1', roots)).toBe(false);
  });

  it('разные величины без имён — в порядке эталона', () => {
    const system = '$x = 2;\\; y = 3$';
    expect(compareAnswers('2; 3', system)).toBe(true);
    expect(compareAnswers('3; 2', system)).toBe(false);
    expect(compareAnswers('y = 3; x = 2', system)).toBe(true);
    expect(compareAnswers('x = 3; y = 2', system)).toBe(false);
  });

  it('величины с единицами и составными именами', () => {
    expect(compareAnswers('8; 128', '$h = 8\\text{ см},\\; S = 128\\text{ см}^2$')).toBe(true);
    expect(compareAnswers('48; 60', '$V = 48\\text{ см}^3$, $S_{\\text{бок}} = 60\\text{ см}^2$')).toBe(true);
    expect(compareAnswers('39; 210', '$a_{10} = 39$, $S_{10} = 210$')).toBe(true);
  });

  it('точки — в любом порядке, имя точки можно не писать', () => {
    expect(compareAnswers('(4; 3), (1; 0)', '$(1; 0),\\; (4; 3)$')).toBe(true);
    expect(compareAnswers('(2; 5); (7; 0)', '$(3; 0)$ и $(0; 9)$')).toBe(false);
    expect(compareAnswers('(3; 4)', '$B(3; 4)$')).toBe(true);
  });
});

describe('compareAnswers: варианты и пояснения', () => {
  it('«или» — подходит любой вариант', () => {
    expect(compareAnswers('0,6', '$\\frac{3}{5}$ (или $0{,}6$)')).toBe(true);
    expect(compareAnswers('3/5', '$\\frac{3}{5}$ (или $0{,}6$)')).toBe(true);
    expect(compareAnswers('3/2', '$1{,}5$ или $\\frac{3}{2}$')).toBe(true);
    expect(compareAnswers('2', '$1{,}5$ или $\\frac{3}{2}$')).toBe(false);
    // В латышских эталонах «или» — это «jeb».
    expect(compareAnswers('3/2', '$1{,}5$ jeb $\\frac{3}{2}$')).toBe(true);
  });

  it('пояснение в скобках и «в … раз» набирать не нужно', () => {
    expect(compareAnswers('-22', '$-22$ (в точке $x = 3$)')).toBe(true);
    expect(compareAnswers('10', '$10\\text{ см}$ (треугольники равны)')).toBe(true);
    expect(compareAnswers('25', 'в $25$ раз')).toBe(true);
    expect(compareAnswers('54', 'на $54$')).toBe(true);
  });

  it('две записи одного значения: ≈ и =', () => {
    expect(compareAnswers('1,26', '$\\sqrt{1{,}6} \\approx 1{,}26$')).toBe(true);
    expect(compareAnswers('32/3', '$\\frac{32}{3} = 10\\frac{2}{3}$')).toBe(true);
    expect(compareAnswers('10 2/3', '$\\frac{32}{3} = 10\\frac{2}{3}$')).toBe(true);
  });
});

describe('compareAnswers: запись чисел и выражений', () => {
  it('смешанное число — не склейка цифр', () => {
    expect(compareAnswers('2 4/7', '$2\\frac{4}{7}$')).toBe(true);
    expect(compareAnswers('18/7', '$2\\frac{4}{7}$')).toBe(true);
    expect(compareAnswers('24/7', '$2\\frac{4}{7}$')).toBe(false);
  });

  it('разделитель тысяч', () => {
    expect(compareAnswers('30000', '$30\\,000$')).toBe(true);
    expect(compareAnswers('30 000', '$30\\,000$')).toBe(true);
    expect(compareAnswers('3000', '$30\\,000$')).toBe(false);
  });

  it('вложенные дроби и дроби с суммой', () => {
    expect(compareAnswers('11/(5√5)', '$\\frac{11}{5\\sqrt{5}}$')).toBe(true);
    // Имя слева необязательно, даже если сам ответ без автопроверки.
    expect(compareAnswers('(3x+1)/(x-2)', '$f^{-1}(x) = \\frac{3x + 1}{x - 2}$')).toBe(true);
    expect(compareAnswers('(3x+1)/(x-2)', '$\\frac{3x + 1}{x - 2}$')).toBe(true);
    expect(compareAnswers('3x+1/x-2', '$\\frac{3x + 1}{x - 2}$')).toBe(false);
    expect(compareAnswers('2S/h - b', '$\\frac{2S}{h} - b$')).toBe(true);
    expect(compareAnswers('5π/6', '$\\frac{5\\pi}{6}$')).toBe(true);
    // Числитель с корнем: скобки функции внутри не мешают снять внешние.
    expect(compareAnswers('2√19; 20√3; 20√3/(9+√19)',
      '$c = 2\\sqrt{19}\\text{ см},\\; S = 20\\sqrt{3}\\text{ см}^2,\\; r = \\frac{20\\sqrt{3}}{9 + \\sqrt{19}}\\text{ см}$')).toBe(true);
  });

  it('дробная степень — со скобками и без', () => {
    expect(compareAnswers('a^(2/3)', '$a^{\\frac{2}{3}}$')).toBe(true);
    expect(compareAnswers('a^2/3', '$a^{\\frac{2}{3}}$')).toBe(true);
    expect(compareAnswers('a^3/2', '$a^{\\frac{2}{3}}$')).toBe(false);
  });

  it('единица после корня не съедает буквы из sqrt', () => {
    expect(compareAnswers('2√3', '$2\\sqrt{3}\\text{ см}$')).toBe(true);
  });

  it('интервалы: ∞, «+∞», объединение буквой U', () => {
    expect(compareAnswers('(-∞; -2) U [1; 3]', '$x \\in (-\\infty; -2) \\cup [1; 3]$')).toBe(true);
    expect(compareAnswers('[2; ∞)', '$x \\in [2; +\\infty)$')).toBe(true);
    expect(compareAnswers('(2; ∞)', '$x \\in [2; +\\infty)$')).toBe(false);
  });

  it('множество — с фигурными скобками и без', () => {
    expect(compareAnswers('{2; 6}', '$A \\cap B = \\{2; 6\\}$')).toBe(true);
    expect(compareAnswers('2; 6', '$A \\cap B = \\{2; 6\\}$')).toBe(true);
    expect(compareAnswers('2; 8', '$A \\cap B = \\{2; 6\\}$')).toBe(false);
  });
});

describe('isAnswerAutoCheckable', () => {
  it('числа, выражения, интервалы и многочлены сверяются автоматически', () => {
    for (const answer of [
      '$x = 4$',
      '$x_1 = 3$, $x_2 = 0{,}5$',
      '$16x^2 - 24xy + 9y^2$',
      '$\\frac{32}{3} = 10\\frac{2}{3}$',
      '$x \\in (-\\infty; -2) \\cup [1; 3]$',
      '$34\\text{ €}$',
      'в $25$ раз',
      '$\\text{Медиана} = 8$'
    ]) {
      expect(isAnswerAutoCheckable(answer), answer).toBe(true);
    }
  });

  it('ответ словами, тождество и «k ∈ ℤ» — без автопроверки', () => {
    for (const answer of [
      '',
      'Да, треугольники подобны',
      'Jā, trijstūri ir līdzīgi',
      'Тетрадь $1{,}00\\text{ EUR}$, ручка $0{,}80\\text{ EUR}$',
      '$4^{k+1} - 1 = 4(4^k - 1) + 3$',
      '$x \\ne \\frac{3\\pi}{8} + \\frac{\\pi k}{2}$, $k \\in \\mathbb{Z}$',
      '$\\text{Доказано}$'
    ]) {
      expect(isAnswerAutoCheckable(answer), answer).toBe(false);
    }
  });
});
