import { describe, expect, it } from 'vitest';
import { answerFields, buildTaskPrompt, checkAnswerFields, checkTaskAnswer } from '../public/lib.js';

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

  /* Значения без имён — тоже поля: ученик видит, сколько чисел ждут от него,
     и пишет их от меньшего к большему. Проверка при этом любой порядок
     принимает — подсказка про порядок нужна, чтобы не гадать. */
  it('значения без подписей дают столько полей, сколько значений', () => {
    const fields = answerFields('$3; 5$');
    expect(fields).toHaveLength(2);
    expect(fields.every(field => field.ordered && field.label === '')).toBe(true);
  });

  it('пять корней — пять полей', () => {
    expect(answerFields('$-9; -2; 0; 4; 7$')).toHaveLength(5);
  });

  it('точка на плоскости — поля по координатам', () => {
    expect(answerFields('$(3; 8)$')).toEqual([
      { label: '$x =$', unit: '', value: '3' },
      { label: '$y =$', unit: '', value: '8' }
    ]);
  });

  it('у названной точки в подписи её имя', () => {
    expect(answerFields('$B(3; 4)$').map(field => field.label)).toEqual(['$x_{B} =$', '$y_{B} =$']);
  });

  it('промежуток — поля под границы, с именем переменной и знаком строгости', () => {
    expect(answerFields('$x \\in (-3; 5]$').map(field => field.label)).toEqual(['$x >$', '$x \\leq$']);
  });

  it('объединение промежутков полями не раскладывается', () => {
    expect(answerFields('$x \\in (-\\infty; -3] \\cup [4; +\\infty)$')).toEqual([]);
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

/* Счётное слово в конце ответа — такая же единица, как «см»: ученик пишет
   число, а проверка его принимает. Латиницу так снимать нельзя — «3ab» это
   произведение переменных. */
describe('счётные слова в ответе', () => {
  it('число со счётным словом принимается без слова', () => {
    expect(checkTaskAnswer('19', '$19\\text{ дней}$')).toBe(true);
    expect(checkTaskAnswer('5', '$5\\text{ книг}$')).toBe(true);
    expect(checkTaskAnswer('12', '$12\\text{ рейсов}$')).toBe(true);
  });

  it('со словом тоже принимается', () => {
    expect(checkTaskAnswer('19 дней', '$19\\text{ дней}$')).toBe(true);
  });

  it('неверное число не проходит', () => {
    expect(checkTaskAnswer('20', '$19\\text{ дней}$')).toBe(false);
  });

  it('буквенный множитель не считается счётным словом', () => {
    expect(checkTaskAnswer('3', '$3ab$')).toBe(false);
    expect(checkTaskAnswer('2', '$2\\pi$')).toBe(false);
  });
});

/* Промпт для ИИ должен требовать тот же вид ответа, который сайт умеет
   разложить на поля: иначе новые задачи снова придут голыми числами. */
describe('промпт для ИИ про ответы', () => {
  it('называет правило про имя величины и разбор на поля', () => {
    const prompt = buildTaskPrompt({ grade: 8, count: 5 });
    expect(prompt).toContain('Называй величину, которую спрашивают');
    expect(prompt).toContain('Несколько величин — через запятую');
    expect(prompt).toContain('по возрастанию');
    expect(prompt).toContain('промежуток');
  });

  it('образец строки показывает ответ с именем величины', () => {
    expect(buildTaskPrompt({ grade: 8, count: 1 })).toContain('c = 10');
  });
});
