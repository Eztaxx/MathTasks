import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import trainer from '../public/trainer.js';
import '../public/trainer-algebra.js';

const COUNT_CATS = ['addsub2', 'addsub3', 'multdiv', 'fractions', 'decimals', 'negatives', 'mix'];
const DIFFS = ['normal', 'hard', 'expert'];
const strip = list => list.map(q => `${q.latex}=${q.answer}`);

/* Дуэль по ссылке держится на одном: одно зерно даёт одинаковые примеры
   на любом устройстве. Сломать это можно молча — любым новым Math.random. */
describe('тренажёр с зерном', () => {
  it('одно зерно — одни и те же примеры во всех категориях и сложностях', () => {
    for (const cat of Object.keys(trainer.GENERATORS)) {
      for (const diff of DIFFS) {
        const a = trainer.generateBatch(cat, 25, diff, 'high', { seed: 42 });
        const b = trainer.generateBatch(cat, 25, diff, 'high', { seed: 42 });
        expect(strip(a), `${cat}/${diff}`).toEqual(strip(b));
      }
    }
  });

  it('разные зёрна — разные наборы', () => {
    const a = trainer.generateBatch('multdiv', 30, 'normal', 'high', { seed: 1 });
    const b = trainer.generateBatch('multdiv', 30, 'normal', 'high', { seed: 2 });
    expect(strip(a)).not.toEqual(strip(b));
  });

  it('зерно не протекает: после дуэли тренажёр снова случайный', () => {
    trainer.generateBatch('addsub2', 5, 'normal', 'high', { seed: 7 });
    const runs = new Set(Array.from({ length: 20 }, () => strip(trainer.generateBatch('addsub3', 5, 'hard')).join('|')));
    expect(runs.size).toBeGreaterThan(1);
  });

  it('в генераторах нет прямых вызовов Math.random', () => {
    for (const file of ['public/trainer.js', 'public/trainer-algebra.js']) {
      const code = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      expect(code, file).not.toMatch(/Math\.random\s*\(/);
    }
  });
});

/* Арифметика счёта сверяется вычислением самого условия: так нашлась
   ошибка «20 ÷ 5 = 0,4» в базовых десятичных дробях. */
describe('ответы в категориях счёта сходятся с условием', () => {
  const toExpr = latex => latex
    .replace(/\\div/g, '/').replace(/\\times/g, '*').replace(/\\cdot/g, '*')
    .replace(/\{,\}/g, '.').replace(/\\left\(|\\right\)/g, '').replace(/[{}]/g, '');

  for (const cat of COUNT_CATS.filter(c => c !== 'fractions')) {
    it(cat, () => {
      for (const diff of DIFFS) {
        for (const q of trainer.generateBatch(cat, 300, diff, 'high', { seed: 2026 })) {
          const expr = toExpr(q.latex);
          if (!/^[-0-9.+*/() ]+$/.test(expr)) continue;
          const value = Function(`return (${expr})`)();
          expect(Math.abs(value - Number(q.answer)), `${q.latex} = ${q.answer}`).toBeLessThan(1e-9);
        }
      }
    });
  }
});
