import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import lessons from '../public/lessons.js';
import lib from '../public/lib.js';
import plotter from '../public/plotter.js';

const DIR = new URL('../public/data/lessons/', import.meta.url);
const files = readdirSync(DIR).filter(name => name.endsWith('.json') && name !== 'index.json');
const read = name => JSON.parse(readFileSync(new URL(name, DIR), 'utf8'));
const index = read('index.json');

/* Урок — файл в репозитории, и ошибку в нём никто, кроме ученика, не
   заметит. Поэтому каждый урок проверяется целиком. */
describe('уроки из репозитория', () => {
  it('в каталоге есть уроки, и каждый лежит своим файлом', () => {
    expect(index.length).toBeGreaterThan(0);
    for (const entry of index) {
      expect(files, entry.slug).toContain(`${entry.slug}.json`);
    }
  });

  for (const file of files) {
    const lesson = read(file);
    it(`${file}: оба языка, ответы проверяются, графики строятся`, () => {
      const errors = lessons.validateLesson(lesson, {
        parseExpr: plotter.parseExpr,
        isAutoCheckable: lib.isTaskAutoCheckable
      });
      expect(errors).toEqual([]);
      expect(`${lesson.slug}.json`).toBe(file);
    });

    it(`${file}: верный ответ принимается, неверный — нет`, () => {
      for (const step of lesson.steps) {
        const q = step.question;
        if (q.kind !== 'number') continue;
        const check = (q.check || []).join('\n');
        expect(lib.checkTaskAnswer(q.answer, q.answer, check), step.id).toBe(true);
        for (const variant of q.check || []) expect(lib.checkTaskAnswer(variant, q.answer, check), `${step.id}: ${variant}`).toBe(true);
        expect(lib.checkTaskAnswer(String(Number(q.answer) + 1), q.answer, check), step.id).toBe(false);
      }
    });

    it(`${file}: число шагов в каталоге совпадает`, () => {
      const entry = index.find(item => item.slug === lesson.slug);
      expect(entry?.steps).toBe(lesson.steps.length);
    });
  }
});

describe('подстановка параметров', () => {
  it('подставляет значения в скобках, не трогая x и функции', () => {
    expect(lessons.substituteParams('k*x+b', { k: -2, b: 3 })).toBe('(-2)*x+(3)');
    expect(lessons.substituteParams('k*sin(x)+b', { k: 0.5, b: -1 })).toBe('(0.5)*sin(x)+(-1)');
    expect(lessons.substituteParams('x+b', {})).toBe('x+b');
  });

  it('после подстановки формула строится', () => {
    expect(plotter.parseExpr(lessons.substituteParams('k*x+b', { k: -1.5, b: 4 }))).toBeTypeOf('function');
  });
});

describe('проверка урока ловит ошибки', () => {
  const base = read(files[0]);
  const clone = () => JSON.parse(JSON.stringify(base));

  it('нет латышского текста', () => {
    const lesson = clone();
    delete lesson.steps[0].text.lv;
    expect(lessons.validateLesson(lesson).join('\n')).toMatch(/нет текста LV/);
  });

  it('параметр e или x запрещён', () => {
    const lesson = clone();
    lesson.steps[1].graph.params[0].name = 'e';
    expect(lessons.validateLesson(lesson).join('\n')).toMatch(/одна буква/);
  });

  it('формула, которая не строится', () => {
    const lesson = clone();
    lesson.steps[1].graph.expr = 'x+b+(';
    expect(lessons.validateLesson(lesson, { parseExpr: plotter.parseExpr }).join('\n')).toMatch(/не строится/);
  });

  it('верный вариант за пределами списка', () => {
    const lesson = clone();
    const choice = lesson.steps.find(step => step.question.kind === 'choice');
    choice.question.correct = 9;
    expect(lessons.validateLesson(lesson).join('\n')).toMatch(/верный вариант/);
  });
});

describe('прогресс урока', () => {
  it('шаги открываются по одному и не закрываются', () => {
    let progress = {};
    progress = lessons.advanceProgress(progress, 'l', 3, 1);
    expect(progress.l).toMatchObject({ step: 2, done: false });
    progress = lessons.advanceProgress(progress, 'l', 3, 2);
    expect(progress.l).toMatchObject({ step: 3, done: false });
    progress = lessons.advanceProgress(progress, 'l', 3, 3);
    expect(progress.l).toMatchObject({ step: 3, done: true });
  });

  it('сброс начинает урок заново', () => {
    const progress = lessons.resetProgress({ l: { step: 3, done: true }, m: { step: 2 } }, 'l');
    expect(progress).toEqual({ m: { step: 2 } });
  });

  it('битое хранилище не роняет урок', () => {
    const storage = { getItem: () => '{не json', setItem: () => {} };
    expect(lessons.readProgress(storage)).toEqual({});
  });
});
