import { describe, it, expect } from 'vitest';
import trainer from '../public/trainer.js';
import algebra from '../public/trainer-algebra.js';

const EQUATIONS = ['eq_linear', 'eq_quadratic', 'eq_rational', 'eq_irrational', 'eq_mix', 'eq_trig', 'eq_exp', 'eq_log', 'eq_adv_mix'];
const EXPRESSIONS = ['expr_poly', 'expr_formulas', 'expr_factor', 'expr_fractions', 'expr_mix'];
const DIFFS = ['normal', 'hard', 'expert'];
const RUNS = 60;

// LaTeX задания → выражение JS, чтобы подставить корень в само уравнение.
// Понимает ровно то, что пишут генераторы: \frac, \sqrt, \sin/\cos/\tan
// (в градусах), \log_{a}, \lg, степени, \cdot, \left( \right), 2x, x(x+1).
function latexToJs(s) {
  let i = 0;
  let out = '';
  let lastStart = 0;
  const stack = [];
  const valueEnd = () => /[\w)]$/.test(out.trimEnd());
  const emitValue = v => {
    if (valueEnd()) out += '*';
    lastStart = out.length;
    out += v;
  };
  const readGroup = () => {
    let depth = 0;
    let j = i;
    for (; j < s.length; j++) {
      if (s[j] === '{') depth++;
      else if (s[j] === '}' && --depth === 0) break;
    }
    const inner = s.slice(i + 1, j);
    i = j + 1;
    return inner;
  };
  const readPower = () => {
    if (!s.startsWith('^{', i)) return null;
    i++;
    return latexToJs(readGroup());
  };
  const skipSpaces = () => {
    while (s[i] === ' ') i++;
  };
  while (i < s.length) {
    const rest = s.slice(i);
    let m;
    if (rest.startsWith('\\frac')) {
      i += 5;
      const a = readGroup();
      const b = readGroup();
      emitValue(`((${latexToJs(a)})/(${latexToJs(b)}))`);
    } else if (rest.startsWith('\\sqrt')) {
      i += 5;
      emitValue(`Math.sqrt(${latexToJs(readGroup())})`);
    } else if ((m = rest.match(/^\\(sin|cos|tan)/))) {
      i += m[0].length;
      const pow = readPower();
      skipSpaces();
      const arg = s.slice(i).match(/^(\d*)x/);
      i += arg[0].length;
      const call = `Math.${m[1]}((${arg[1] || 1})*x*Math.PI/180)`;
      emitValue(pow ? `Math.pow(${call},${pow})` : call);
    } else if ((m = rest.match(/^\\(?:log_\{(\d+)\}|lg)/))) {
      i += m[0].length;
      const base = m[1] || 10;
      const pow = readPower();
      skipSpaces();
      let arg = 'x';
      if (s[i] === '(') {
        let depth = 0;
        let j = i;
        for (; j < s.length; j++) {
          if (s[j] === '(') depth++;
          else if (s[j] === ')' && --depth === 0) break;
        }
        arg = latexToJs(s.slice(i + 1, j));
        i = j + 1;
      } else {
        i++;
      }
      const call = `(Math.log(${arg})/Math.log(${base}))`;
      emitValue(pow ? `Math.pow(${call},${pow})` : call);
    } else if (rest.startsWith('\\left')) {
      i += 5;
    } else if (rest.startsWith('\\right')) {
      i += 6;
    } else if (rest.startsWith('\\cdot')) {
      i += 5;
      out += '*';
    } else if (s[i] === '^') {
      i++;
      let e;
      if (s[i] === '{') {
        e = latexToJs(readGroup());
      } else {
        e = s[i];
        i++;
      }
      out = `${out.slice(0, lastStart)}Math.pow(${out.slice(lastStart)},${e})`;
    } else if (s[i] === '{') {
      emitValue(`(${latexToJs(readGroup())})`);
    } else if (s[i] === '(') {
      if (valueEnd()) out += '*';
      stack.push(out.length);
      out += '(';
      i++;
    } else if (s[i] === ')') {
      out += ')';
      lastStart = stack.pop();
      i++;
    } else if (/\d/.test(s[i])) {
      const num = rest.match(/^\d+(\.\d+)?/)[0];
      i += num.length;
      emitValue(num);
    } else if (/[a-z]/.test(s[i])) {
      emitValue(s[i]);
      i++;
    } else {
      out += s[i];
      i++;
    }
  }
  return out;
}

const evaluator = latex => new Function('x', 'a', 'b', `return ${latexToJs(latex)};`);

const evalPoly = (poly, env) => Object.entries(poly).reduce((sum, [key, c]) => {
  const term = key ? key.split('*').reduce((p, part) => {
    const [v, e] = part.split('^');
    return p * env[v] ** (e ? Number(e) : 1);
  }, 1) : 1;
  return sum + c * term;
}, 0);

const check = (q, input) => trainer.checkAnswer(q, input).isCorrect;

describe('тренажёр уравнений и выражений: обратная генерация', () => {
  it('все категории зарегистрированы в тренажёре', () => {
    [...EQUATIONS, ...EXPRESSIONS].forEach(cat => expect(typeof trainer.GENERATORS[cat]).toBe('function'));
  });

  it('каждый корень обращает само уравнение в верное равенство', () => {
    EQUATIONS.forEach(cat => DIFFS.forEach(diff => {
      for (let i = 0; i < RUNS; i++) {
        const q = trainer.generateQuestion(cat, diff, 'high');
        const [lhs, rhs] = q.latex.split('=');
        const L = evaluator(lhs);
        const R = evaluator(rhs);
        q.roots.forEach(root => {
          expect(Math.abs(L(root) - R(root)), `${q.latex} при x = ${root}`).toBeLessThan(1e-6);
        });
      }
    }));
  });

  it('выражение в задании равно ответу-многочлену', () => {
    EXPRESSIONS.forEach(cat => DIFFS.forEach(diff => {
      for (let i = 0; i < RUNS; i++) {
        const q = trainer.generateQuestion(cat, diff);
        const f = evaluator(q.latex);
        [[1.3, 0.7, -2.1], [-0.6, 2.2, 1.5]].forEach(([x, a, b]) => {
          expect(f(x, a, b), q.latex).toBeCloseTo(evalPoly(q.poly, { x, a, b }), 6);
        });
      }
    }));
  });

  it('свой ответ принимается, подсказка — одни формулы, вопрос переживает JSON', () => {
    [...EQUATIONS, ...EXPRESSIONS].forEach(cat => DIFFS.forEach(diff => {
      for (let i = 0; i < RUNS; i++) {
        const q = trainer.generateQuestion(cat, diff, 'high');
        expect(check(q, q.answer), `${q.latex} → ${q.answer}`).toBe(true);
        expect(q.hint).not.toMatch(/[А-Яа-яЁё]/);
        expect(q.hint).not.toContain('\n');
        const restored = JSON.parse(JSON.stringify(q));
        expect(check(restored, q.answer)).toBe(true);
      }
    }));
  });

  it('основная школа: в миксе уравнений нет уравнений с корнем', () => {
    for (let i = 0; i < 200; i++) {
      expect(trainer.generateQuestion('eq_mix', 'hard', 'basic').category).not.toBe('eq_irrational');
    }
    ['eq_irrational', 'eq_trig', 'eq_exp', 'eq_log', 'eq_adv_mix'].forEach(cat => {
      expect(algebra.HIGH_SCHOOL_CATEGORIES.has(cat)).toBe(true);
    });
  });
});

describe('проверка ответов: корни', () => {
  it('разные записи двух корней', () => {
    const q = { type: 'roots', roots: [-3, 2], answer: '-3; 2' };
    ['2; -3', '-3;2', 'x1 = 2, x2 = -3', '2 и -3', '2, -3', 'x=-3; x=2', '2 un -3'].forEach(s => {
      expect(check(q, s), s).toBe(true);
    });
    ['2', '2; 3', '2; -3; 5', 'нет', ''].forEach(s => expect(check(q, s), s).toBe(false));
  });

  it('иррациональные корни, дроби, градусы, «нет корней»', () => {
    const irr = { type: 'roots', roots: [1 - Math.SQRT2, 1 + Math.SQRT2] };
    ['1±√2', '1+√2; 1-√2', '1 + sqrt(2); 1 - sqrt(2)'].forEach(s => expect(check(irr, s), s).toBe(true));
    const frac = { type: 'roots', roots: [0.75] };
    ['3/4', '0,75', '0.75', 'x = 3/4'].forEach(s => expect(check(frac, s), s).toBe(true));
    const none = { type: 'roots', roots: [] };
    ['нет', 'нет корней', 'nav', 'nav sakņu', '∅'].forEach(s => expect(check(none, s), s).toBe(true));
    expect(check(none, '0')).toBe(false);
    const deg = { type: 'roots', roots: [30, 150] };
    ['30°; 150°', '30; 150', '150, 30'].forEach(s => expect(check(deg, s), s).toBe(true));
  });
});

describe('проверка ответов: многочлены', () => {
  const poly = str => algebra.toPoly(algebra.parseExpr(str));

  it('«раскройте скобки» принимает только раскрытый вид с приведёнными подобными', () => {
    const q = { type: 'poly', poly: poly('(x+2)(x-3)'), form: 'expanded', answer: 'x^2 - x - 6' };
    ['x^2 - x - 6', 'x² - x - 6', '-6 - x + x^2', 'x**2-x-6'].forEach(s => expect(check(q, s), s).toBe(true));
    ['(x+2)(x-3)', 'x^2 + 2x - 3x - 6', 'x^2 - x + 6'].forEach(s => expect(check(q, s), s).toBe(false));
  });

  it('«разложите на множители» принимает только произведение, разложенное до конца', () => {
    const q = { type: 'poly', poly: poly('x^2 - x - 6'), form: 'factored', answer: '(x + 2)(x - 3)' };
    ['(x+2)(x-3)', '(x-3)(x+2)', '(x + 2)*(x - 3)'].forEach(s => expect(check(q, s), s).toBe(true));
    ['x^2 - x - 6', '(x+2)(x+3)'].forEach(s => expect(check(q, s), s).toBe(false));
    const cube = { type: 'poly', poly: poly('x^3 - 4x'), form: 'factored' };
    expect(check(cube, 'x(x-2)(x+2)')).toBe(true);
    expect(check(cube, 'x(x^2-4)')).toBe(false);
    const square = { type: 'poly', poly: poly('x^2 - 6x + 9'), form: 'factored' };
    ['(x-3)^2', '(x-3)²', '(x-3)(x-3)'].forEach(s => expect(check(square, s), s).toBe(true));
    const common = { type: 'poly', poly: poly('6x + 15'), form: 'factored' };
    expect(check(common, '3(2x+5)')).toBe(true);
  });

  it('выражение, тождественно равное 0: ответ «0» принимается', () => {
    // Такое выдаёт expr_poly/expert, когда L1 = L2 = L3: пустой многочлен {}
    const zero = poly('(x - 6)(x - 6) - (x - 6)^2');
    expect(zero).toEqual({});
    expect(algebra.polyToString(zero)).toBe('0');
    const q = { type: 'poly', poly: zero, form: 'expanded', answer: '0' };
    ['0', ' 0 ', '(0)'].forEach(s => expect(check(q, s), s).toBe(true));
    expect(check(JSON.parse(JSON.stringify(q)), '0')).toBe(true);
    ['x - x', '0 + 0', '1', '-6', 'x', ''].forEach(s => expect(check(q, s), s).toBe(false));
  });

  it('два переменных и сокращение дроби', () => {
    const q = { type: 'poly', poly: poly('(a+2b)(a-b)'), form: 'expanded' };
    expect(check(q, 'a^2 + ab - 2b^2')).toBe(true);
    const reduce = { type: 'poly', poly: poly('x + 3'), form: null };
    ['x+3', '3 + x'].forEach(s => expect(check(reduce, s), s).toBe(true));
    expect(check(reduce, '(x^2-9)/(x-3)')).toBe(false);
  });
});
