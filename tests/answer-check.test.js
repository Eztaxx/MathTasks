import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  answerCheckVariants,
  checkTaskAnswer,
  isTaskAutoCheckable,
  parseTasksImport,
  selectControlWorkTasks
} from '../public/lib.js';

/* Варианты ответа для проверки (answer_check, миграция 024): ученик видит
   answer_latex как есть, а сверка идёт и с ним, и с вариантами. */

describe('answerCheckVariants', () => {
  it('по одному на строку, в ячейке таблицы — через «||»', () => {
    expect(answerCheckVariants('120\n 120 книг \n\n')).toEqual(['120', '120 книг']);
    expect(answerCheckVariants('да; 3 || да, k = 3')).toEqual(['да; 3', 'да, k = 3']);
    expect(answerCheckVariants(null)).toEqual([]);
  });
});

describe('isTaskAutoCheckable', () => {
  /* «120 книг» — это число, а не текст: счётное слово в конце такая же
     единица, как «см», и сверка его снимает. Раньше такой ответ уходил в
     самопроверку, пока автор не выпишет вариант руками. */
  it('счётное слово в конце не мешает автопроверке', () => {
    expect(isTaskAutoCheckable('$120\\text{ книг}$')).toBe(true);
    expect(isTaskAutoCheckable('$19\\text{ дней}$')).toBe(true);
    expect(isTaskAutoCheckable('$x = 4$')).toBe(true);
  });

  it('ответ со словами становится проверяемым, когда есть варианты', () => {
    expect(isTaskAutoCheckable('$\\text{Доказано}$', '')).toBe(false);
    expect(isTaskAutoCheckable('$\\text{Доказано}$', 'Доказано')).toBe(true);
    expect(isTaskAutoCheckable('$\\text{XLIX}$')).toBe(false);
  });
});

describe('checkTaskAnswer', () => {
  it('сверка с вариантами', () => {
    expect(checkTaskAnswer('120', '$120\\text{ книг}$', '120')).toBe(true);
    expect(checkTaskAnswer('121', '$120\\text{ книг}$', '120')).toBe(false);
    expect(checkTaskAnswer('да, 3', 'Да, подобны с $k = 3$', 'да; 3')).toBe(true);
  });

  it('слова — без учёта регистра, части — через запятую или точку с запятой', () => {
    const answer = 'Даугавпилс, на $13\\text{ °C}$';
    expect(checkTaskAnswer('даугавпилс, 13', answer, 'Даугавпилс; 13')).toBe(true);
    expect(checkTaskAnswer('Рига; 13', answer, 'Даугавпилс; 13')).toBe(false);
  });

  it('без вариантов — сверка по самому ответу; пустой ввод — не ответ', () => {
    expect(checkTaskAnswer('4', '$x = 4$', '')).toBe(true);
    expect(checkTaskAnswer('4', '$x = 4$')).toBe(true);
    expect(checkTaskAnswer('', '$x = 4$', '4')).toBe(false);
  });
});

describe('контрольная и импорт', () => {
  it('задача с вариантами идёт в контрольную, доказательство — нет', () => {
    const tasks = [
      { id: 1, answer_latex: 'Да, подобны', answer_check: 'да', difficulty: 'Лёгкий', position: 1 },
      { id: 2, answer_latex: '$4$', difficulty: 'Лёгкий', position: 2 },
      { id: 3, answer_latex: '$5$', difficulty: 'Средний', position: 3 },
      { id: 4, answer_latex: '$\\text{Доказано}$', difficulty: 'Сложный', position: 4 }
    ];
    const ids = selectControlWorkTasks(tasks).map(task => task.id);
    expect(ids).toContain(1);
    expect(ids).not.toContain(4);
  });

  it('столбец answer_check в таблице — это варианты, а не ответ', () => {
    const tsv = [
      ['grade', 'topic_title', 'condition_latex', 'answer_latex', 'answer_check', 'answer_check_lv'].join('\t'),
      ['6', 'Проценты', 'Сколько книг?', '120 книг', '120', '120'].join('\t')
    ].join('\n');
    const [task] = parseTasksImport(tsv).tasks;
    expect(task.answer_latex).toBe('120 книг');
    expect(task.answer_check).toBe('120');
    expect(task.answer_check_lv).toBe('120');
  });
});

describe('сайт: самопроверка и сверка с вариантами', () => {
  const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  const i18n = readFileSync(new URL('../public/i18n.js', import.meta.url), 'utf8');

  it('поле ответа, экспресс-режим и контрольная сверяют с вариантами', () => {
    expect(app).toContain("checkTaskAnswer(userAns, loc(task, 'answer_latex'), loc(task, 'answer_check'))");
    expect(app).toContain("checkTaskAnswer(userAns, correctAns, loc(task, 'answer_check'))");
    expect(app).not.toMatch(/compareAnswers\(userAns, loc\(task, 'answer_latex'\)\)/);
  });

  it('у задачи без автопроверки — блок самопроверки с тремя кнопками', () => {
    for (const hook of ['data-self-assess-reveal', 'data-self-assess-yes', 'data-self-assess-no', 'data-self-assess-reset']) {
      expect(app).toContain(hook);
    }
  });

  it('тексты самопроверки есть на обоих языках', () => {
    for (const key of ['self_assess_lead', 'self_assess_reveal', 'self_assess_question', 'self_assess_yes', 'self_assess_no', 'self_assess_done', 'self_assess_fail']) {
      expect(i18n.match(new RegExp(`\\b${key}:`, 'g')) || [], key).toHaveLength(2);
    }
  });
});
