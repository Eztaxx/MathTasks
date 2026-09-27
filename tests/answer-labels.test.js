import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  answerLabelOk,
  answerLabelPlan,
  buildAnswerLabelPrompt,
  parseAnswerLabelSuggestion,
  taskIssues
} from '../public/lib.js';

/* А5: подпись поля ответа — «Периметр = [ ] см». Правило из
   scripts/suggest-answer-labels.mjs переехало в lib.js: им пользуются и
   скрипт, и кнопка «Предложить подпись» в редакторе. */

describe('подпись по условию: правило', () => {
  it('слово из вопроса — подпись, латышская — переводом русской', () => {
    const task = {
      condition_latex: 'Найдите периметр прямоугольника со сторонами $5\\text{ см}$ и $7\\text{ см}$.',
      condition_latex_lv: 'Aprēķiniet taisnstūra perimetru, ja malas ir $5\\text{ cm}$ un $7\\text{ cm}$.',
      answer_latex: '$24\\text{ см}$',
      answer_latex_lv: '$24\\text{ cm}$'
    };
    expect(answerLabelPlan(task, 'ru').next).toBe('$\\text{Периметр} = 24\\text{ см}$');
    expect(answerLabelPlan(task, 'lv').next).toBe('$\\text{Perimetrs} = 24\\text{ cm}$');
  });

  it('обозначение из условия — подпись формулой', () => {
    const task = { condition_latex: 'В треугольнике $ABC$ катеты равны $3$ и $4$. Найдите $AB$.', answer_latex: '$5$' };
    expect(answerLabelPlan(task, 'ru').next).toBe('$AB = 5$');
  });

  it('«Сколько часов» — время; косинус угла — косинус, а не угол', () => {
    expect(answerLabelPlan({ condition_latex: 'Сколько часов был в пути турист?', answer_latex: '$3\\text{ ч}$' }, 'ru').next)
      .toBe('$\\text{Время} = 3\\text{ ч}$');
    expect(answerLabelPlan({ condition_latex: 'Найдите косинус наибольшего угла треугольника со сторонами 3, 4 и 5.', answer_latex: '$0$' }, 'ru').next)
      .toBe('$\\text{Косинус} = 0$');
  });

  it('подпись уже есть, ответ-утверждение, несколько величин — правило не трогает', () => {
    expect(answerLabelPlan({ condition_latex: 'Решите уравнение.', answer_latex: '$x = 4$' }, 'ru').skip).toBe('естьПодпись');
    // Неравенство ученик пишет целиком — подпись не нужна.
    expect(answerLabelPlan({ condition_latex: 'Найдите значения $m$.', answer_latex: '$m > 4$' }, 'ru').skip).toBe('естьПодпись');
    expect(answerLabelPlan({ condition_latex: 'Найдите размеры детали.', answer_latex: '$4\\text{ мм}$ и $3\\text{ мм}$; в $400\\text{ раз}$' }, 'ru').skip)
      .toBe('несколькоПолей');
    expect(answerLabelPlan({ condition_latex: 'Какое число задумано?', answer_latex: '$12$' }, 'ru').skip).toBe('неНашлиИмя');
  });
});

describe('подпись от модели: проверка на себе', () => {
  const old = '$4\\text{ мм}$ и $3\\text{ мм}$; в $400\\text{ раз}$';
  const good = '$\\text{Длина} = 4\\text{ мм}$, $\\text{Ширина} = 3\\text{ мм}$, $\\text{Во сколько раз} = 400$';

  it('те же значения с именами — годится, и робот больше не видит «нет подписи»', () => {
    expect(answerLabelOk(old, good)).toBe(true);
    expect(taskIssues({ answer_latex: good, answer_latex_lv: good }).map(issue => issue.code)).not.toContain('label');
  });

  it('другое значение, пропавшее имя или лишняя часть — не годится', () => {
    expect(answerLabelOk(old, good.replace('= 400', '= 40'))).toBe(false);
    expect(answerLabelOk(old, '$\\text{Длина} = 4\\text{ мм}$, $3\\text{ мм}$, $\\text{Во сколько раз} = 400$')).toBe(false);
    expect(answerLabelOk(old, `${good}, $\\text{Площадь} = 12$`)).toBe(false);
    expect(answerLabelOk('$24\\text{ см}$', '')).toBe(false);
  });

  it('промпт — с обоими ответами и видом JSON; разбор ответа модели', () => {
    const prompt = buildAnswerLabelPrompt({ condition_latex: 'Найдите размеры.', answer_latex: old, answer_latex_lv: '$4\\text{ mm}$ un $3\\text{ mm}$' });
    expect(prompt).toContain(old);
    expect(prompt).toContain('$4\\text{ mm}$ un $3\\text{ mm}$');
    expect(prompt).toContain('{"answer":"…","answer_lv":"…"}');
    expect(parseAnswerLabelSuggestion('```json\n{"answer":"$\\\\text{Длина} = 4$","answer_lv":"$\\\\text{Garums} = 4$"}\n```'))
      .toEqual({ answer: '$\\text{Длина} = 4$', answer_lv: '$\\text{Garums} = 4$' });
    expect(parseAnswerLabelSuggestion('{"answer_lv":"x"}')).toBeNull();
    expect(parseAnswerLabelSuggestion('не JSON')).toBeNull();
  });
});

describe('скрипт подписей берёт правило из lib.js', () => {
  const script = readFileSync(new URL('../scripts/suggest-answer-labels.mjs', import.meta.url), 'utf8');
  it('своих словарей величин и planFor в скрипте больше нет', () => {
    expect(script).toContain('lib.answerLabelPlan(task, lang)');
    expect(script).not.toMatch(/const NOUNS\b|function planFor|function suggestLabel/);
  });
});
