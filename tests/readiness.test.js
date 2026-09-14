import { describe, expect, it } from 'vitest';
import { answersDisagree, hintRevealsAnswer, missingAnswerNumbers, numberValues } from '../public/lib.js';

/* Проверки полосы готовности в редакторе админки: поля сверяются между
   собой по числам — слова на двух языках разные, числа обязаны совпадать. */

describe('numberValues', () => {
  it('десятичная запятая, разделитель тысяч, дробь — одним числом', () => {
    expect(numberValues('$0{,}5$')).toEqual([0.5]);
    expect(numberValues('$30\\,000$')).toEqual([30000]);
    expect(numberValues('$\\frac{1}{2}$')).toEqual([0.5]);
    expect(numberValues('$\\frac{1}{2}$', { withParts: true })).toEqual([0.5, 1, 2]);
  });

  it('показатель степени и индекс — не числа ответа', () => {
    expect(numberValues('$25\\text{ см}^2$')).toEqual([25]);
    expect(numberValues('$x_1 = 3$')).toEqual([3]);
  });
});

describe('answersDisagree: ответ RU и LV', () => {
  it('те же числа с разными словами и единицами — совпадают', () => {
    expect(answersDisagree('$12\\text{ см}$', '$12\\text{ cm}$')).toBe(false);
    expect(answersDisagree('$2450\\text{ и }2549$', '$2450\\text{ un }2549$')).toBe(false);
    expect(answersDisagree('$0{,}5$', '$\\frac{1}{2}$')).toBe(false);
  });

  it('разные числа — расходятся; пустой ответ не сравнивается', () => {
    expect(answersDisagree('$x = 4$', '$x = 5$')).toBe(true);
    expect(answersDisagree('$x_1 = 3$, $x_2 = 0{,}5$', '$x_1 = 3$')).toBe(true);
    expect(answersDisagree('$x = 4$', '')).toBe(false);
  });
});

describe('missingAnswerNumbers: ответ в решении', () => {
  const solution = 'Раскроем скобки: $6x - 15 + 4 = 5x - 7$, откуда $x = 4$.';

  it('решение приходит к ответу — ничего не пропало', () => {
    expect(missingAnswerNumbers('$x = 4$', solution)).toEqual([]);
    expect(missingAnswerNumbers('$0{,}5$', 'Получаем $\\frac{1}{2}$.')).toEqual([]);
    expect(missingAnswerNumbers('$\\frac{3}{5}$', 'Значит, $0{,}6$.')).toEqual([]);
  });

  it('числа ответа нет в решении — оно названо', () => {
    expect(missingAnswerNumbers('$x = 9$', solution)).toEqual([9]);
  });

  /* Число ищется в любом месте решения: ответ 5 при «5x» в решении не
     ловится. Проверка только на совсем потерянный ответ — зато почти без
     ложных тревог. */
  it('число, встретившееся в решении где угодно, считается найденным', () => {
    expect(missingAnswerNumbers('$x = 5$', solution)).toEqual([]);
  });

  it('без решения или ответа — не проверяется', () => {
    expect(missingAnswerNumbers('$x = 5$', '')).toEqual([]);
    expect(missingAnswerNumbers('', solution)).toEqual([]);
  });
});

describe('hintRevealsAnswer: подсказка и ответ', () => {
  it('результат после «=» — подсказка выдаёт ответ', () => {
    expect(hintRevealsAnswer('$x = 4$', 'Перенесите слагаемые с x влево: получится $x = 4$.')).toBe(true);
    expect(hintRevealsAnswer('$0{,}5$', 'Ответ: $\\approx 0{,}5$')).toBe(true);
  });

  // Задача 504: «= 4 ± 4√3 + 3» — начало выражения, а не результат 4.
  it('число после «=», за которым идёт знак действия, — не результат', () => {
    const hint = 'Представьте подкоренные выражения в виде квадрата двучлена $(a \\pm b)^2$, учитывая тождество $7 \\pm 4\\sqrt{3} = 4 \\pm 4\\sqrt{3} + 3 = (2 \\pm \\sqrt{3})^2$.';
    expect(hintRevealsAnswer('$4$', hint)).toBe(false);
    expect(hintRevealsAnswer('$4$', 'Сложите: $2 + 2 = 4$.')).toBe(true);
  });

  it('число из ответа не как результат — это подсказка, а не ответ', () => {
    expect(hintRevealsAnswer('$x = 4$', 'Разделите обе части на 4.')).toBe(false);
    expect(hintRevealsAnswer('$4$', 'Найдите дискриминант $D = b^2 - 4ac$.')).toBe(false);
    expect(hintRevealsAnswer('$x_1 = 3$, $x_2 = 0{,}5$', 'Первый корень $x_1 = 3$, второй найдите сами.')).toBe(false);
  });
});
