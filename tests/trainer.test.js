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

  describe('checkAnswer: расширенная проверка ввода ответов', () => {
    it('целые и отрицательные числа: пробелы, знаки, юникодный минус', () => {
      const qPositive = { type: 'integer', answer: '42' };
      expect(trainer.checkAnswer(qPositive, '42').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qPositive, '  42  ').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qPositive, '+42').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qPositive, '042').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qPositive, '41').isCorrect).toBe(false);
      expect(trainer.checkAnswer(qPositive, 'abc').isCorrect).toBe(false);

      const qNegative = { type: 'integer', answer: '-15' };
      expect(trainer.checkAnswer(qNegative, '-15').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qNegative, '  -15  ').isCorrect).toBe(true);
      // Юникодный математический минус (U+2212) и en-dash
      expect(trainer.checkAnswer(qNegative, '−15').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qNegative, '–15').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qNegative, '15').isCorrect).toBe(false);
      expect(trainer.checkAnswer(qNegative, '-14').isCorrect).toBe(false);

      const qZero = { type: 'integer', answer: '0' };
      expect(trainer.checkAnswer(qZero, '0').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qZero, '+0').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qZero, '-0').isCorrect).toBe(true);
    });

    it('десятичные дроби: точка, запятая, ввод в виде дроби', () => {
      const qDec = { type: 'decimal', answer: '0.25' };
      expect(trainer.checkAnswer(qDec, '0.25').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qDec, '0,25').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qDec, '  0,25  ').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qDec, '.25').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qDec, ',25').isCorrect).toBe(true);
      // Дробная форма эквивалентна десятичной
      expect(trainer.checkAnswer(qDec, '1/4').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qDec, '2/8').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qDec, '0.3').isCorrect).toBe(false);
      expect(trainer.checkAnswer(qDec, '1/3').isCorrect).toBe(false);

      const qDecNeg = { type: 'decimal', answer: '-1.5' };
      expect(trainer.checkAnswer(qDecNeg, '-1.5').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qDecNeg, '-1,5').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qDecNeg, '−1,5').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qDecNeg, '-3/2').isCorrect).toBe(true);
    });

    it('обыкновенные дроби: несокращённые дроби, целые ответы, отрицательные дроби', () => {
      const qFrac = { type: 'fraction', answer: '3/4', resNum: 3, resDen: 4 };
      expect(trainer.checkAnswer(qFrac, '3/4').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qFrac, '6/8').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qFrac, ' 3 / 4 ').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qFrac, '0.75').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qFrac, '0,75').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qFrac, '1/2').isCorrect).toBe(false);

      // Дробь с целым результатом (resDen === 1)
      const qWhole = { type: 'fraction', answer: '2', resNum: 2, resDen: 1 };
      expect(trainer.checkAnswer(qWhole, '2').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qWhole, '4/2').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qWhole, '6/3').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qWhole, '3').isCorrect).toBe(false);

      // Отрицательная дробь
      const qNegFrac = { type: 'fraction', answer: '-1/3', resNum: -1, resDen: 3 };
      expect(trainer.checkAnswer(qNegFrac, '-1/3').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qNegFrac, '−1/3').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qNegFrac, '-2/6').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qNegFrac, '1/-3').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qNegFrac, '1/3').isCorrect).toBe(false);

      // Некорректный ввод (деление на ноль, не число)
      expect(trainer.checkAnswer(qFrac, '1/0').isCorrect).toBe(false);
      expect(trainer.checkAnswer(qFrac, '3/').isCorrect).toBe(false);
      expect(trainer.checkAnswer(qFrac, '/4').isCorrect).toBe(false);
      expect(trainer.checkAnswer(qFrac, 'a/b').isCorrect).toBe(false);
    });

    it('алгебра: степени, коэффициенты, переменные, разные форматы ввода', () => {
      // Одночлен со степенью: 3x^4
      const qMonomial = {
        type: 'algebra',
        variable: 'x',
        resCoeff: 3,
        resExp: 4,
        answer: '3x^4'
      };
      expect(trainer.checkAnswer(qMonomial, '3x^4').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qMonomial, '3x⁴').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qMonomial, '3*x^4').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qMonomial, '3*x⁴').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qMonomial, '3x**4').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qMonomial, '3 x^4').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qMonomial, '4x^3').isCorrect).toBe(false);
      expect(trainer.checkAnswer(qMonomial, '3y^4').isCorrect).toBe(false);

      // Одночлен со степенью 1: x
      const qDegree1 = {
        type: 'algebra',
        variable: 'x',
        resCoeff: 1,
        resExp: 1,
        answer: 'x'
      };
      expect(trainer.checkAnswer(qDegree1, 'x').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qDegree1, '1x').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qDegree1, 'x^1').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qDegree1, 'x¹').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qDegree1, '-x').isCorrect).toBe(false);
      expect(trainer.checkAnswer(qDegree1, 'x^2').isCorrect).toBe(false);

      // Одночлен со степенью 0: результат просто число
      const qDegree0 = {
        type: 'algebra',
        variable: 'x',
        resCoeff: 5,
        resExp: 0,
        answer: '5'
      };
      expect(trainer.checkAnswer(qDegree0, '5').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qDegree0, '5x^0').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qDegree0, '5x⁰').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qDegree0, '6').isCorrect).toBe(false);

      // Отрицательный коэффициент: -x^3
      const qNegCoeff = {
        type: 'algebra',
        variable: 'x',
        resCoeff: -1,
        resExp: 3,
        answer: '-x^3'
      };
      expect(trainer.checkAnswer(qNegCoeff, '-x^3').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qNegCoeff, '−x^3').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qNegCoeff, '-1x^3').isCorrect).toBe(true);
      expect(trainer.checkAnswer(qNegCoeff, 'x^3').isCorrect).toBe(false);
    });

    it('пустые и некорректные входные данные', () => {
      const q = { type: 'integer', answer: '10' };
      expect(trainer.checkAnswer(q, '').isCorrect).toBe(false);
      expect(trainer.checkAnswer(q, '   ').isCorrect).toBe(false);
      expect(trainer.checkAnswer(q, null).isCorrect).toBe(false);
      expect(trainer.checkAnswer(q, undefined).isCorrect).toBe(false);
    });
  });

  describe('formatTime: форматирование времени', () => {
    it('корректно форматирует секунды в MM:SS', () => {
      expect(trainer.formatTime(0)).toBe('00:00');
      expect(trainer.formatTime(5)).toBe('00:05');
      expect(trainer.formatTime(59)).toBe('00:59');
      expect(trainer.formatTime(60)).toBe('01:00');
      expect(trainer.formatTime(65)).toBe('01:05');
      expect(trainer.formatTime(3599)).toBe('59:59');
      expect(trainer.formatTime(3600)).toBe('60:00');
      expect(trainer.formatTime(-10)).toBe('00:00');
      expect(trainer.formatTime(null)).toBe('00:00');
    });
  });
});

