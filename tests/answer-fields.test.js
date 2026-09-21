import { describe, expect, it } from 'vitest';
import { answerFields, checkAnswerFields, checkTaskAnswer } from '../public/lib.js';

/* Строки ответов взяты из базы как есть: разбор должен держать именно их,
   а не причёсанные примеры. */
const TASK_710 = '$AD = 4\\sqrt{3}\\text{ см}$, $BC = 6\\sqrt{3}\\text{ см}$';
const VOLUME = '$V = 48\\text{ см}^3$, $S_{\\text{бок}} = 60\\text{ см}^2$';
const ROOTS_AND = '$x = -12\\text{ и }x = 12$';

describe('поля ответа по величинам', () => {
  it('две величины — два поля с подписями и единицами', () => {
    expect(answerFields(TASK_710)).toEqual([
      { label: '$AD =$', unit: 'см', value: '4\\sqrt{3}\\text{ см}' },
      { label: '$BC =$', unit: 'см', value: '6\\sqrt{3}\\text{ см}' }
    ]);
  });

  it('степень в единице читается: см² и см³', () => {
    expect(answerFields(VOLUME).map(field => field.unit)).toEqual(['см³', 'см²']);
    expect(answerFields(VOLUME)[1].label).toBe('$S_{\\text{бок}} =$');
  });

  it('части, разделённые словом «и», тоже дают поля', () => {
    expect(answerFields(ROOTS_AND)).toHaveLength(2);
  });

  it('одна величина — полей нет, поле остаётся одно', () => {
    expect(answerFields('$x = 10$')).toEqual([]);
    expect(answerFields('$15\\text{ €}$')).toEqual([]);
  });

  it('части без подписей полей не получают: подписать их нечем', () => {
    expect(answerFields('$3; 5$')).toEqual([]);
  });

  it('ответ с «или» — полей нет: какое значение в какое поле, неизвестно', () => {
    expect(answerFields('$x = 2$ или $x = 3$')).toEqual([]);
  });

  it('частей больше четырёх — полей нет: строка удобнее', () => {
    expect(answerFields('$a = 1$, $b = 2$, $c = 3$, $d = 4$, $e = 5$')).toEqual([]);
  });

  it('ответ, который не сверить автоматически, полей не получает', () => {
    expect(answerFields('$\\text{Доказано}$')).toEqual([]);
  });
});

describe('проверка по полям', () => {
  it('всё верно — задача засчитана', () => {
    const result = checkAnswerFields(['4\\sqrt{3}', '6\\sqrt{3}'], TASK_710);
    expect(result.correct).toEqual([true, true]);
    expect(result.allCorrect).toBe(true);
  });

  it('одно поле неверное — видно какое, задача не засчитана', () => {
    const result = checkAnswerFields(['4\\sqrt{3}', '6'], TASK_710);
    expect(result.correct).toEqual([true, false]);
    expect(result.allCorrect).toBe(false);
  });

  it('ученик дописал единицу — это тот же ответ', () => {
    expect(checkAnswerFields(['4\\sqrt{3} см', '6\\sqrt{3} см'], TASK_710).allCorrect).toBe(true);
  });

  it('значения переставлены местами — не засчитано: величины разные', () => {
    const result = checkAnswerFields(['6\\sqrt{3}', '4\\sqrt{3}'], TASK_710);
    expect(result.allCorrect).toBe(false);
  });

  it('пустое поле — не верно и не засчитано', () => {
    const result = checkAnswerFields(['4\\sqrt{3}', ''], TASK_710);
    expect(result.correct).toEqual([true, false]);
    expect(result.allCorrect).toBe(false);
    expect(result.filled).toBe(1);
  });

  it('склейка значений проходит и обычную проверку — подстраховка работает', () => {
    expect(checkTaskAnswer('4\\sqrt{3}; 6\\sqrt{3}', TASK_710)).toBe(true);
  });

  it('корни одной неизвестной можно писать в любом порядке', () => {
    const answer = '$x_1 = 3$, $x_2 = -1$';
    expect(checkAnswerFields(['-1', '3'], answer).allCorrect).toBe(true);
  });
});
