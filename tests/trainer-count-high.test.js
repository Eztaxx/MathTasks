import { describe, it, expect } from 'vitest';
import trainer from '../public/trainer.js';
import algebra from '../public/trainer-algebra.js';

const CATS = ['logs', 'trig_values', 'angles', 'combinatorics'];
const DIFFS = ['normal', 'hard', 'expert'];
const RUNS = 80;
const fact = n => (n <= 1 ? 1 : n * fact(n - 1));
const check = (q, input) => trainer.checkAnswer(q, input).isCorrect;

// Угол в LaTeX (30^\circ, -\frac{5\pi}{6}, 2\pi) → радианы
function angleOf(tex) {
  const sign = tex.startsWith('-') ? -1 : 1;
  const s = tex.replace(/^-/, '');
  let m;
  if ((m = s.match(/^(\d+)\^\\circ$/))) return (sign * Number(m[1]) * Math.PI) / 180;
  if ((m = s.match(/^\\frac\{(\d*)\\pi\}\{(\d+)\}$/))) return (sign * Number(m[1] || 1) * Math.PI) / Number(m[2]);
  if ((m = s.match(/^(\d*)\\pi$/))) return sign * Number(m[1] || 1) * Math.PI;
  if (s === '0') return 0;
  throw new Error(`unknown angle ${tex}`);
}

// Независимый пересчёт значения по записи задания — не через генератор
function recompute(q) {
  const t = q.latex;
  if (q.category === 'trig_values') {
    const m = t.match(/^\\(sin|cos|operatorname\{tg\})(?:\\left\((.+)\\right\)| (.+))$/);
    const f = { sin: Math.sin, cos: Math.cos, 'operatorname{tg}': Math.tan }[m[1]];
    return f(angleOf(m[2] || m[3]));
  }
  if (q.category === 'angles') {
    const rad = angleOf(t);
    return q.task === 'to_rad' ? rad : (rad * 180) / Math.PI;
  }
  if (q.category === 'logs') {
    const js = t
      .replace(/\\lg /g, '\\log_{10} ')
      .replace(/(\d+)\^\{\\log_\{(\d+)\} (\d+)\}/g, (_, a, b, n) => `Math.pow(${a}, Math.log(${n}) / Math.log(${b}))`)
      .replace(/\\log_\{(\d+)\} \\frac\{1\}\{(\d+)\}/g, (_, b, n) => `(Math.log(1 / ${n}) / Math.log(${b}))`)
      .replace(/\\log_\{(\d+)\} 0\{,\}(\d+)/g, (_, b, d) => `(Math.log(0.${d}) / Math.log(${b}))`)
      .replace(/\\log_\{(\d+)\} (\d+)/g, (_, b, n) => `(Math.log(${n}) / Math.log(${b}))`)
      .replace(/\\cdot/g, '*');
    return new Function(`return ${js};`)();
  }
  const js = t
    .replace(/\\frac\{(\d+)!\}\{(\d+)!\}/g, (_, a, b) => `(F(${a}) / F(${b}))`)
    .replace(/C_\{(\d+)\}\^\{(\d+)\}/g, (_, n, k) => `(F(${n}) / (F(${k}) * F(${n} - ${k})))`)
    .replace(/A_\{(\d+)\}\^\{(\d+)\}/g, (_, n, k) => `(F(${n}) / F(${n} - ${k}))`)
    .replace(/(\d+)!/g, (_, n) => `F(${n})`);
  return new Function('F', `return ${js};`)(fact);
}

describe('счёт для средней школы: логарифмы, sin/cos/tg, радианы, комбинаторика', () => {
  it('категории зарегистрированы и только для средней школы', () => {
    CATS.forEach(cat => {
      expect(typeof trainer.GENERATORS[cat]).toBe('function');
      expect(algebra.HIGH_SCHOOL_CATEGORIES.has(cat)).toBe(true);
    });
  });

  it('значение в задании совпадает с независимым пересчётом, свой ответ принимается', () => {
    CATS.forEach(cat => DIFFS.forEach(diff => {
      for (let i = 0; i < RUNS; i++) {
        const q = trainer.generateQuestion(cat, diff, 'high');
        const value = q.type === 'value' ? q.value : Number(q.answer);
        expect(Math.abs(recompute(q) - value), `${q.latex} → ${q.answer}`).toBeLessThan(1e-9);
        expect(check(q, q.answer), `${q.latex} → ${q.answer}`).toBe(true);
        expect(check(JSON.parse(JSON.stringify(q)), q.answer)).toBe(true);
        expect(q.hint).not.toMatch(/[А-Яа-яЁё]/);
        expect(q.hint).not.toContain('\n');
      }
    }));
  });

  it('проверка «одно число»: любая точная запись, приближение не засчитывается', () => {
    const root = { type: 'value', value: Math.sqrt(3) / 2, answer: '√3/2' };
    ['√3/2', 'sqrt(3)/2', '√(3)/2'].forEach(s => expect(check(root, s), s).toBe(true));
    ['0.866', '√3', ''].forEach(s => expect(check(root, s), s).toBe(false));
    const pi = { type: 'value', value: (3 * Math.PI) / 4, answer: '3π/4' };
    ['3π/4', '3pi/4', '0.75π', '3 * pi / 4'].forEach(s => expect(check(pi, s), s).toBe(true));
    expect(check(pi, '2.356')).toBe(false);
    const half = { type: 'value', value: 1.5, answer: '3/2' };
    ['3/2', '1.5', '1,5', '6/4'].forEach(s => expect(check(half, s), s).toBe(true));
    const deg = { type: 'value', value: 135, answer: '135°' };
    ['135', '135°'].forEach(s => expect(check(deg, s), s).toBe(true));
  });

  it('микс счёта их не выдаёт', () => {
    for (let i = 0; i < 300; i++) {
      expect(CATS).not.toContain(trainer.generateQuestion('mix', 'expert', 'high').category);
    }
  });
});
