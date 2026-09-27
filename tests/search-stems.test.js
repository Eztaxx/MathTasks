import { describe, expect, it } from 'vitest';
import { answerFields, isGenericTaskTitle, searchStems, taskIssues } from '../public/lib.js';

/* Поиск искал фразу целиком: «пропорция» находила одну задачу, а
   «пропорции» — четыре. Теперь каждое слово ищется по основе. */
describe('основы слов для поиска', () => {
  it('разные формы слова дают одну основу', () => {
    expect(searchStems('пропорция')).toEqual(searchStems('пропорции'));
    expect(searchStems('уравнение')).toEqual(searchStems('уравнения'));
    expect(searchStems('vienādojums')).toEqual(['vienādojum']);
  });

  it('каждое слово отдельно, без повторов', () => {
    expect(searchStems('квадратное уравнение')).toEqual(['квадратн', 'уравнен']);
    expect(searchStems('дроби дробь')).toEqual(['дроб']);
  });

  it('короткая основа не срезается, короткие слова и числа не ищутся по основе', () => {
    expect(searchStems('сила')).toEqual(['сила']);
    expect(searchStems('ну и')).toEqual([]);
    expect(searchStems('x^2 + 25')).toEqual(['x^2', '25']);
  });

  it('символы, ломающие фильтр PostgREST, уходят', () => {
    expect(searchStems('пропорция, (x)*')).toEqual(['пропорц']);
  });
});

/* Заглушка «Задача №N» вместо названия путала номера: на странице
   «Задача №152», а в ссылке на соседнюю — «№124». */
describe('название-заглушка', () => {
  it('узнаётся на обоих языках', () => {
    expect(isGenericTaskTitle('Задача №124')).toBe(true);
    expect(isGenericTaskTitle('Uzdevums №3')).toBe(true);
    expect(isGenericTaskTitle('Задача о бассейне')).toBe(false);
    expect(isGenericTaskTitle('Уравнение x³ − 9x = 0')).toBe(false);
  });

  it('робот очереди отмечает заглушку, а задачу без поля названия не трогает', () => {
    const base = {
      condition_latex: 'Решите уравнение: $x^3 - 9x = 0$.',
      condition_latex_lv: 'Atrisiniet vienādojumu: $x^3 - 9x = 0$.',
      answer_latex: '$x_1 = -3;\\; x_2 = 0;\\; x_3 = 3$',
      answer_latex_lv: '$x_1 = -3;\\; x_2 = 0;\\; x_3 = 3$',
      solution_latex: 'Ответ: $x_1 = -3;\\; x_2 = 0;\\; x_3 = 3$.',
      solution_latex_lv: 'Atbilde: $x_1 = -3;\\; x_2 = 0;\\; x_3 = 3$.'
    };
    expect(taskIssues({ ...base, title: 'Задача №12', title_lv: 'Uzdevums №12' }).map(i => i.code)).toContain('title');
    expect(taskIssues({ ...base, title: 'Уравнение x³ − 9x = 0', title_lv: 'Vienādojums x³ − 9x = 0' }).map(i => i.code)).not.toContain('title');
    expect(taskIssues(base).map(i => i.code)).not.toContain('title');
  });
});

describe('поле составной длины', () => {
  it('подписано самой мелкой единицей, как у времени', () => {
    const fields = answerFields('$\\text{Длина} = 1\\text{ м } 20\\text{ см}$; $\\text{Ширина} = 80\\text{ см}$');
    expect(fields.map(field => field.unit)).toEqual(['см', 'см']);
  });
});
