import { describe, it, expect } from 'vitest';
import trainer from '../public/trainer.js';

describe('Mental Math Trainer Engine', () => {
  it('генератор addsub2 создаёт корректные примеры на двузначные числа', () => {
    for (let i = 0; i < 50; i++) {
      const q = trainer.generateQuestion('addsub2');
      expect(q.latex).toMatch(/\d+\s*[\+\-]\s*\d+/);
      expect(Number.isFinite(Number(q.answer))).toBe(true);
      expect(q.hint).toBeTruthy();
      expect(q.category).toBe('addsub2');
      const check = trainer.checkAnswer(q, q.answer);
      expect(check.isCorrect).toBe(true);
    }
  });

  it('генератор addsub3 создаёт корректные примеры на трёхзначные числа', () => {
    for (let i = 0; i < 50; i++) {
      const q = trainer.generateQuestion('addsub3');
      expect(q.latex).toMatch(/\d{3}\s*[\+\-]\s*\d{3}/);
      expect(Number.isFinite(Number(q.answer))).toBe(true);
      expect(q.hint).toBeTruthy();
      const check = trainer.checkAnswer(q, q.answer);
      expect(check.isCorrect).toBe(true);
    }
  });

  it('генератор multdiv создаёт примеры на умножение и деление без остатка', () => {
    for (let i = 0; i < 50; i++) {
      const q = trainer.generateQuestion('multdiv');
      expect(q.latex).toMatch(/\\times|\\div/);
      expect(Number.isFinite(Number(q.answer))).toBe(true);
      const check = trainer.checkAnswer(q, q.answer);
      expect(check.isCorrect).toBe(true);
    }
  });

  it('генератор fractions создаёт корректные дроби и проверяет ответы', () => {
    for (let i = 0; i < 50; i++) {
      const q = trainer.generateQuestion('fractions');
      expect(q.latex).toContain('\\frac');
      expect(q.type).toBe('fraction');
      expect(q.resDen).toBeGreaterThan(0);
      const check = trainer.checkAnswer(q, q.answer);
      expect(check.isCorrect).toBe(true);
    }
  });

  it('проверка дробей принимает сокращённые и эквивалентные формы', () => {
    const q = {
      type: 'fraction',
      answer: '1/2',
      resNum: 1,
      resDen: 2
    };
    expect(trainer.checkAnswer(q, '1/2').isCorrect).toBe(true);
    expect(trainer.checkAnswer(q, '2/4').isCorrect).toBe(true);
    expect(trainer.checkAnswer(q, '3/6').isCorrect).toBe(true);
    expect(trainer.checkAnswer(q, '0.5').isCorrect).toBe(true);
    expect(trainer.checkAnswer(q, '0,5').isCorrect).toBe(true);
    expect(trainer.checkAnswer(q, '1/3').isCorrect).toBe(false);
  });

  it('генератор decimals создаёт десятичные дроби и поддерживает точку и запятую', () => {
    for (let i = 0; i < 50; i++) {
      const q = trainer.generateQuestion('decimals');
      expect(q.type).toBe('decimal');
      const dotCheck = trainer.checkAnswer(q, q.answer.replace(',', '.'));
      expect(dotCheck.isCorrect).toBe(true);
      const commaCheck = trainer.checkAnswer(q, q.answer.replace('.', ','));
      expect(commaCheck.isCorrect).toBe(true);
    }
  });

  it('генератор mix равномерно возвращает все типы задач', () => {
    const counts = {};
    for (let i = 0; i < 100; i++) {
      const q = trainer.generateQuestion('mix');
      counts[q.category] = (counts[q.category] || 0) + 1;
    }
    expect(Object.keys(counts).length).toBeGreaterThanOrEqual(4);
  });

  it('генератор powers создаёт степени и корни разных степеней', () => {
    ['normal', 'hard', 'expert'].forEach(diff => {
      for (let i = 0; i < 40; i++) {
        const q = trainer.generateQuestion('powers', diff);
        expect(q.category).toBe('powers');
        expect(q.latex).toBeTruthy();
        expect(q.answer).toBeDefined();
        const check = trainer.checkAnswer(q, q.answer);
        expect(check.isCorrect).toBe(true);
      }
    });
  });

  it('генератор algebra_powers создаёт примеры со степенями и корнями неизвестных', () => {
    ['normal', 'hard', 'expert'].forEach(diff => {
      for (let i = 0; i < 40; i++) {
        const q = trainer.generateQuestion('algebra_powers', diff);
        expect(q.category).toBe('algebra_powers');
        expect(q.type).toBe('algebra');
        expect(q.latex).toBeTruthy();
        expect(q.answer).toBeDefined();
        const check = trainer.checkAnswer(q, q.answer);
        expect(check.isCorrect).toBe(true);
      }
    });
  });

  it('проверка algebra_powers поддерживает различные варианты ввода (x^5, x⁵, 1x^5, 6x^7, 1/x^2)', () => {
    const q1 = {
      type: 'algebra',
      variable: 'x',
      resCoeff: 1,
      resExp: 5,
      answer: 'x^5'
    };
    expect(trainer.checkAnswer(q1, 'x^5').isCorrect).toBe(true);
    expect(trainer.checkAnswer(q1, 'x⁵').isCorrect).toBe(true);
    expect(trainer.checkAnswer(q1, '1x^5').isCorrect).toBe(true);
    expect(trainer.checkAnswer(q1, 'x**5').isCorrect).toBe(true);
    expect(trainer.checkAnswer(q1, 'x^4').isCorrect).toBe(false);

    const q2 = {
      type: 'algebra',
      variable: 'x',
      resCoeff: 6,
      resExp: 7,
      answer: '6x^7'
    };
    expect(trainer.checkAnswer(q2, '6x^7').isCorrect).toBe(true);
    expect(trainer.checkAnswer(q2, '6*x^7').isCorrect).toBe(true);
    expect(trainer.checkAnswer(q2, '6 x^7').isCorrect).toBe(true);
    expect(trainer.checkAnswer(q2, '6x⁷').isCorrect).toBe(true);
    expect(trainer.checkAnswer(q2, '5x^7').isCorrect).toBe(false);

    const q3 = {
      type: 'algebra',
      variable: 'x',
      resCoeff: 1,
      resExp: -2,
      answer: 'x^-2'
    };
    expect(trainer.checkAnswer(q3, 'x^-2').isCorrect).toBe(true);
    expect(trainer.checkAnswer(q3, '1/x^2').isCorrect).toBe(true);
    expect(trainer.checkAnswer(q3, '1/x²').isCorrect).toBe(true);
  });

  it('генератор negatives создаёт примеры с отрицательными числами', () => {
    for (let i = 0; i < 50; i++) {
      const q = trainer.generateQuestion('negatives');
      expect(q.category).toBe('negatives');
      const check = trainer.checkAnswer(q, q.answer);
      expect(check.isCorrect).toBe(true);
    }
  });

  it('генераторы поддерживают различные уровни сложности (normal, hard, expert)', () => {
    ['addsub2', 'addsub3', 'multdiv', 'fractions', 'decimals', 'powers', 'algebra_powers', 'negatives', 'mix'].forEach(cat => {
      ['normal', 'hard', 'expert'].forEach(diff => {
        const q = trainer.generateQuestion(cat, diff);
        expect(q).toBeDefined();
        expect(q.latex).toBeTruthy();
        expect(q.answer).toBeDefined();
        const check = trainer.checkAnswer(q, q.answer);
        expect(check.isCorrect).toBe(true);
      });
    });
  });

  it('generateBatch генерирует корректную подборку заданного размера с id и индексами', () => {
    const batch20 = trainer.generateBatch('addsub2', 20, 'hard');
    expect(batch20).toHaveLength(20);
    expect(batch20[0].id).toBe(1);
    expect(batch20[19].id).toBe(20);
    expect(batch20[0].index).toBe(0);
    expect(batch20[19].index).toBe(19);

    const batch10 = trainer.generateBatch('fractions', 10, 'expert');
    expect(batch10).toHaveLength(10);
    batch10.forEach(q => {
      expect(q.type).toBe('fraction');
      expect(q.latex).toContain('\\frac');
    });
  });
});

