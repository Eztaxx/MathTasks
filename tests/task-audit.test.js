import { describe, expect, it } from 'vitest';
import { auditTask, checkTaskAnswer, drawingIssues, taskIssues } from '../public/lib.js';

/* Проверка черновика перед публикацией: то, что видно без человека.
   Задача «без замечаний» уходит на сайт одной кнопкой, поэтому каждое
   правило здесь — и в «ловит», и в «не шумит». */

const TASK = {
  grade: 9,
  condition_latex: 'Найдите гипотенузу, если катеты равны $6\\text{ см}$ и $8\\text{ см}$.',
  condition_latex_lv: 'Aprēķini hipotenūzu, ja katetes ir $6\\text{ cm}$ un $8\\text{ cm}$.',
  answer_latex: '$c = 10\\text{ см}$',
  answer_latex_lv: '$c = 10\\text{ cm}$',
  solution_latex: '1. По теореме Пифагора: $c^2 = 6^2 + 8^2 = 100$.\nОтвет: $c = 10\\text{ см}$.',
  solution_latex_lv: '1. Pēc Pitagora teorēmas: $c^2 = 6^2 + 8^2 = 100$.\nAtbilde: $c = 10\\text{ cm}$.',
  hint_latex: 'Вспомните теорему Пифагора.',
  hint_latex_lv: 'Atcerieties Pitagora teorēmu.'
};
const codes = (task, context) => taskIssues(task, context).map(issue => issue.code);

describe('проверка задачи перед публикацией', () => {
  it('аккуратная задача — без замечаний', () => {
    expect(taskIssues(TASK)).toEqual([]);
    expect(auditTask(TASK).every(check => check.level === 'ok')).toBe(true);
  });

  it('нет ответа — ошибка, нет решения — замечание', () => {
    expect(taskIssues({ ...TASK, answer_latex: '' }).find(i => i.code === 'answer').level).toBe('bad');
    expect(taskIssues({ ...TASK, solution_latex: '' }).find(i => i.code === 'answer').level).toBe('warn');
  });

  it('нет перевода — называет, где именно', () => {
    const issue = taskIssues({ ...TASK, hint_latex_lv: '' }).find(i => i.code === 'translation');
    expect(issue.text).toContain('подсказке');
  });

  /* Так было у #798: русское условие поправили, в латышском остались
     4,5 h вместо 6 ч. */
  it('разные числа в русском и латышском условии', () => {
    const task = { ...TASK, condition_latex_lv: 'Aprēķini hipotenūzu, ja katetes ir $6\\text{ cm}$ un $4{,}5\\text{ cm}$.' };
    const issue = taskIssues(task).find(i => i.code === 'numbers');
    expect(issue.level).toBe('bad');
    expect(issue.text).toContain('8');
    expect(issue.text).toContain('4,5');
  });

  it('«2\\,000\\,000» и «4{,}5» — одни и те же числа в обоих языках', () => {
    const task = {
      ...TASK,
      condition_latex: 'Масштаб $1 : 2\\,000\\,000$, отрезок $4{,}5\\text{ см}$.',
      condition_latex_lv: 'Mērogs $1 : 2\\,000\\,000$, nogrieznis $4,5\\text{ cm}$.'
    };
    expect(codes(task)).not.toContain('numbers');
  });

  // Латышское решение бывает короче русского — это не ошибка.
  it('решения по числам не сравниваются', () => {
    const task = { ...TASK, solution_latex_lv: 'Atbilde: $c = 10\\text{ cm}$.' };
    expect(codes(task)).toEqual([]);
  });

  it('в конце решения другой ответ', () => {
    const task = { ...TASK, solution_latex: TASK.solution_latex.replace('Ответ: $c = 10', 'Ответ: $c = 12') };
    const issue = taskIssues(task).find(i => i.code === 'ending');
    expect(issue.text).toContain('Ответ: $c = 12');
    expect(issue.text).not.toContain('(LV)');
  });

  it('ответ без подписи у поля — замечание', () => {
    const task = { ...TASK, answer_latex: '$2 : 3$', answer_latex_lv: '$2 : 3$', solution_latex: 'Ответ: $2 : 3$.', solution_latex_lv: 'Atbilde: $2 : 3$.' };
    expect(taskIssues(task).find(i => i.code === 'label').level).toBe('warn');
  });

  it('ответ со словами — самопроверка, это замечание', () => {
    const task = { ...TASK, answer_latex: '$\\text{Доказано}$', answer_latex_lv: '$\\text{Pierādīts}$' };
    expect(taskIssues(task).find(i => i.code === 'accept').level).toBe('warn');
  });

  it('смешанное число и дробь с выражением засчитываются в записи ученика', () => {
    const mixed = { ...TASK, answer_latex: '$1\\frac{1}{2}$', answer_latex_lv: '$1\\frac{1}{2}$', solution_latex: 'Ответ: $1\\frac{1}{2}$.', solution_latex_lv: 'Atbilde: $1\\frac{1}{2}$.' };
    const algebra = { ...TASK, answer_latex: '$\\frac{x+3}{x-3}$', answer_latex_lv: '$\\frac{x+3}{x-3}$', solution_latex: '', solution_latex_lv: '' };
    expect(codes(mixed)).not.toContain('accept');
    expect(codes(algebra)).not.toContain('accept');
  });

  it('составное время: поле в минутах, ответ засчитывается', () => {
    const task = {
      ...TASK,
      answer_latex: '$\\text{Время} = 1\\text{ ч } 30\\text{ мин}$',
      answer_latex_lv: '$\\text{Laiks} = 1\\text{ h } 30\\text{ min}$',
      solution_latex: 'Ответ: $1\\text{ ч } 30\\text{ мин}$.',
      solution_latex_lv: 'Atbilde: $1\\text{ h } 30\\text{ min}$.'
    };
    expect(codes(task)).toEqual([]);
  });

  it('чертёж: пока не прочитан — ни «чисто», ни замечание', () => {
    const task = { ...TASK, condition_image: 'tri.svg' };
    expect(auditTask(task).find(c => c.code === 'drawing').level).toBe('pending');
    expect(codes(task)).toEqual([]);
    expect(codes(task, { drawing: null })).toEqual([]);
    expect(codes(task, { drawing: 'числа: 5' })).toEqual(['drawing']);
  });

  // Правило автора: в 5–6 классе дроби — только в темах про дроби.
  it('дроби в теме 5–6 класса не про дроби — замечание', () => {
    const task = { ...TASK, grade: 6, condition_latex: 'Сколько стоят $1{,}5\\text{ кг}$?', condition_latex_lv: 'Cik maksā $1{,}5\\text{ kg}$?' };
    expect(codes(task, { topicTitle: 'Как совокупность делят в определенном отношении' })).toContain('young');
    expect(codes(task, { topicTitle: 'Как умножают и делят обыкновенные дроби' })).not.toContain('young');
    expect(codes({ ...task, grade: 7 }, { topicTitle: 'Отношения' })).not.toContain('young');
  });
});

describe('чертёж без лишнего', () => {
  it('числа, единицы и «?» на геометрическом чертеже — лишнее', () => {
    expect(drawingIssues('<svg><polygon points="0,0 10,0 0,10"/><text>A</text><text>5 см</text></svg>')).toContain('5 см');
    expect(drawingIssues('<svg><text>?</text></svg>')).toContain('вопрос');
  });

  it('только вершины — чисто', () => {
    expect(drawingIssues('<svg><polygon points="0,0 10,0 0,10"/><text>A</text><text>B</text><text>C</text></svg>')).toBe(null);
  });
});

describe('латышское счётное слово без диакритики', () => {
  it('«19 dienas» — число 19, а короткая латиница — переменные', () => {
    expect(checkTaskAnswer('19', '$19\\text{ dienas}$')).toBe(true);
    expect(checkTaskAnswer('3', '$3ab$')).toBe(false);
  });
});
