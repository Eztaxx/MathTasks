/**
 * MathTasks — тренажёр уравнений и выражений (дополнение к trainer.js).
 *
 * Все задания строятся «от ответа» (reverse generation): сначала выбираются
 * корни или множители, потом из них собирается уравнение или выражение.
 * Поэтому ответ известен точно и всегда получается аккуратным.
 *
 * Проверка ответов:
 *  - roots — набор корней уравнения: «2; -3», «1±√2», «нет»;
 *  - poly — многочлен; form 'expanded' принимает только раскрытый вид
 *    с приведёнными подобными, 'factored' — только произведение.
 */
(() => {
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const randNZ = (min, max) => {
    let v = 0;
    while (v === 0) v = randInt(min, max);
    return v;
  };
  const gcd = (a, b) => {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a || 1;
  };

  /* ── Разбор выражений ──────────────────────────────────────────── */
  const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };

  function normalizeInput(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/[−–—]/g, '-')
      .replace(/[·×∙]/g, '*')
      .replace(/÷/g, '/')
      .replace(/\*\*/g, '^')
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, m => '^' + [...m].map(c => SUP[c]).join(''))
      .replace(/(\d),(\d)/g, '$1.$2')
      .replace(/[[{]/g, '(')
      .replace(/[\]}]/g, ')')
      .replace(/°/g, '')
      .replace(/\s+/g, '');
  }

  function tokenize(s) {
    const tokens = [];
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/[0-9.]/.test(ch)) {
        let j = i;
        while (j < s.length && /[0-9.]/.test(s[j])) j++;
        const v = Number(s.slice(i, j));
        if (!Number.isFinite(v)) throw new Error('number');
        tokens.push({ t: 'num', v });
        i = j;
      } else if (s.startsWith('sqrt', i)) {
        tokens.push({ t: 'sqrt' });
        i += 4;
      } else if (ch === '√') {
        tokens.push({ t: 'sqrt' });
        i++;
      } else if (ch === 'π' || s.startsWith('pi', i)) {
        tokens.push({ t: 'num', v: Math.PI });
        i += ch === 'π' ? 1 : 2;
      } else if (/[a-z]/.test(ch)) {
        tokens.push({ t: 'var', name: ch });
        i++;
      } else if ('+-*/^()'.includes(ch)) {
        tokens.push({ t: ch });
        i++;
      } else {
        throw new Error(`symbol ${ch}`);
      }
    }
    return tokens;
  }

  // Дерево: num, var, paren, neg, inv (1/a внутри произведения), sqrt, pow, sum, mul.
  // Знак умножения можно не писать: 2x, x(x+1), (x-1)(x+1), 2√3.
  function parseExpr(str) {
    const tokens = tokenize(normalizeInput(str));
    let pos = 0;
    const peek = () => tokens[pos];
    const take = t => {
      const tok = tokens[pos];
      if (!tok || (t && tok.t !== t)) throw new Error('syntax');
      pos++;
      return tok;
    };
    const startsImplicit = tok => tok && (tok.t === 'var' || tok.t === 'sqrt' || tok.t === '(');

    function expr() {
      const items = [term()];
      while (peek() && (peek().t === '+' || peek().t === '-')) {
        const op = take().t;
        const node = term();
        items.push(op === '-' ? { t: 'neg', a: node } : node);
      }
      return items.length === 1 ? items[0] : { t: 'sum', items };
    }
    function term() {
      const items = [unary()];
      for (;;) {
        const tok = peek();
        if (tok && tok.t === '*') {
          take();
          items.push(unary());
        } else if (tok && tok.t === '/') {
          take();
          items.push({ t: 'inv', a: unary() });
        } else if (startsImplicit(tok)) {
          items.push(unary());
        } else {
          break;
        }
      }
      return items.length === 1 ? items[0] : { t: 'mul', items };
    }
    function unary() {
      const tok = peek();
      if (tok && tok.t === '-') {
        take();
        return { t: 'neg', a: unary() };
      }
      if (tok && tok.t === '+') {
        take();
        return unary();
      }
      return power();
    }
    function power() {
      const base = primary();
      if (peek() && peek().t === '^') {
        take();
        const negative = peek() && peek().t === '-' ? (take(), true) : false;
        const e = primary();
        return { t: 'pow', a: base, e: negative ? { t: 'neg', a: e } : e };
      }
      return base;
    }
    function primary() {
      const tok = take();
      if (tok.t === 'num') return { t: 'num', v: tok.v };
      if (tok.t === 'var') return { t: 'var', name: tok.name };
      if (tok.t === 'sqrt') return { t: 'sqrt', a: power() };
      if (tok.t === '(') {
        const node = expr();
        take(')');
        return { t: 'paren', a: node };
      }
      throw new Error('syntax');
    }

    const tree = expr();
    if (pos !== tokens.length) throw new Error('syntax');
    return tree;
  }

  function evalNode(n, env = {}) {
    switch (n.t) {
      case 'num': return n.v;
      case 'var': return n.name in env ? env[n.name] : NaN;
      case 'paren': return evalNode(n.a, env);
      case 'neg': return -evalNode(n.a, env);
      case 'inv': return 1 / evalNode(n.a, env);
      case 'sqrt': {
        const v = evalNode(n.a, env);
        return v < 0 ? NaN : Math.sqrt(v);
      }
      case 'pow': return Math.pow(evalNode(n.a, env), evalNode(n.e, env));
      case 'sum': return n.items.reduce((s, x) => s + evalNode(x, env), 0);
      case 'mul': return n.items.reduce((s, x) => s * evalNode(x, env), 1);
      default: return NaN;
    }
  }

  function evalNumber(str) {
    try {
      const v = evalNode(parseExpr(str));
      return Number.isFinite(v) ? v : NaN;
    } catch (_) {
      return NaN;
    }
  }

  /* ── Многочлены ────────────────────────────────────────────────
     Многочлен — объект «моном → коэффициент»: { 'x^2': 1, x: -5, '': 6 }.
     Обычный объект, а не Map: вопрос с многочленом уходит в список
     ошибок через JSON. */
  const EPS = 1e-9;
  const monoKey = m => Object.keys(m).filter(v => m[v]).sort().map(v => (m[v] === 1 ? v : `${v}^${m[v]}`)).join('*');
  const parseKey = key => {
    const m = {};
    if (key) {
      key.split('*').forEach(part => {
        const [v, e] = part.split('^');
        m[v] = e ? Number(e) : 1;
      });
    }
    return m;
  };
  const cleanPoly = p => {
    const r = {};
    for (const k in p) if (Math.abs(p[k]) > EPS) r[k] = p[k];
    return r;
  };
  const constPoly = c => cleanPoly({ '': c });
  const polyAdd = (p, q) => {
    const r = { ...p };
    for (const k in q) r[k] = (r[k] || 0) + q[k];
    return cleanPoly(r);
  };
  const polyScale = (p, s) => {
    const r = {};
    for (const k in p) r[k] = p[k] * s;
    return cleanPoly(r);
  };
  function polyMul(p, q) {
    const r = {};
    for (const k1 in p) {
      for (const k2 in q) {
        const m = parseKey(k1);
        for (const [v, e] of Object.entries(parseKey(k2))) m[v] = (m[v] || 0) + e;
        const k = monoKey(m);
        r[k] = (r[k] || 0) + p[k1] * q[k2];
      }
    }
    return cleanPoly(r);
  }
  const polyProduct = (...ps) => ps.reduce((r, p) => polyMul(r, p), { '': 1 });
  const keyDegree = key => Object.values(parseKey(key)).reduce((s, e) => s + e, 0);
  const polyDegree = p => Math.max(0, ...Object.keys(p).map(keyDegree));
  const isConstPoly = p => Object.keys(p).every(k => k === '');

  function polyEquals(p, q) {
    const keys = new Set([...Object.keys(p), ...Object.keys(q)]);
    for (const k of keys) if (Math.abs((p[k] || 0) - (q[k] || 0)) > 1e-7) return false;
    return true;
  }

  function toPoly(n) {
    switch (n.t) {
      case 'num': return constPoly(n.v);
      case 'var': return { [n.name]: 1 };
      case 'paren': return toPoly(n.a);
      case 'neg': return polyScale(toPoly(n.a), -1);
      case 'sum': return n.items.reduce((s, x) => polyAdd(s, toPoly(x)), {});
      case 'mul': return n.items.reduce((s, x) => polyMul(s, toPoly(x)), { '': 1 });
      case 'inv': {
        const d = toPoly(n.a);
        if (!isConstPoly(d) || !d['']) throw new Error('not a polynomial');
        return constPoly(1 / d['']);
      }
      case 'pow': {
        const e = toPoly(n.e);
        const k = e[''] || 0;
        if (!isConstPoly(e) || !Number.isInteger(k) || k < 0 || k > 12) throw new Error('not a polynomial');
        const base = toPoly(n.a);
        let r = { '': 1 };
        for (let i = 0; i < k; i++) r = polyMul(r, base);
        return r;
      }
      default: throw new Error('not a polynomial');
    }
  }

  // Мономы по убыванию степени, при равной — по алфавиту: a² + 2ab + b²
  function sortedKeys(p) {
    const vars = [...new Set(Object.keys(p).flatMap(k => Object.keys(parseKey(k))))].sort();
    return Object.keys(p).sort((k1, k2) => {
      const d = keyDegree(k2) - keyDegree(k1);
      if (d) return d;
      const m1 = parseKey(k1);
      const m2 = parseKey(k2);
      for (const v of vars) {
        const e = (m2[v] || 0) - (m1[v] || 0);
        if (e) return e;
      }
      return 0;
    });
  }

  const fmtNum = n => (Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000));

  // Одна запись и для LaTeX, и для ответа: x^2 - 5x + 6, a^2b
  function polyToString(p, tex = false) {
    const keys = sortedKeys(p);
    if (!keys.length) return '0';
    return keys.map((k, i) => {
      const c = p[k];
      const m = parseKey(k);
      const vars = Object.keys(m).sort().map(v => (m[v] === 1 ? v : tex ? `${v}^{${m[v]}}` : `${v}^${m[v]}`)).join('');
      const abs = Math.abs(c);
      const body = vars ? (abs === 1 ? vars : fmtNum(abs) + vars) : fmtNum(abs);
      return (c < 0 ? (i ? ' - ' : '-') : (i ? ' + ' : '')) + body;
    }).join('');
  }

  /* ── Форма ответа ── */
  const unwrap = n => (n.t === 'paren' ? unwrap(n.a) : n);
  const containsSum = n => {
    n = unwrap(n);
    if (n.t === 'sum') return true;
    return (n.a && containsSum(n.a)) || (n.e && containsSum(n.e)) || (n.items || []).some(containsSum);
  };

  // Раскрытый вид: сумма мономов без скобок, подобные приведены
  function isExpandedForm(tree, poly) {
    const top = unwrap(tree);
    const terms = top.t === 'sum' ? top.items : [top];
    return terms.every(x => !containsSum(x)) && terms.length === Object.keys(poly).length;
  }

  // Разложено до конца: произведение (или степень), в скобках — только
  // двучлены первой степени; квадратный трёхчлен в скобке — не до конца
  function isFactoredForm(tree) {
    let n = unwrap(tree);
    while (n.t === 'neg') n = unwrap(n.a);
    const factors = n.t === 'mul' ? n.items : n.t === 'pow' ? [n] : [];
    let hasBracket = false;
    for (const f of factors) {
      let base = unwrap(f);
      if (base.t === 'pow') base = unwrap(base.a);
      if (base.t === 'inv') return false;
      let p;
      try {
        p = toPoly(base);
      } catch (_) {
        return false;
      }
      if (Object.keys(p).length > 1) {
        if (polyDegree(p) > 1) return false;
        hasBracket = true;
      }
    }
    return hasBracket;
  }

  /* ── Проверка ответов ──────────────────────────────────────────── */
  const NO_ROOTS = /^(нет(корней|решений)?|nav(sakņu|saknu|atrisinājuma)?|∅|x∈∅|none|no|-|—)$/;

  // «x1 = 2, x2 = -3», «2; -3», «2 и -3», «1±√2» → отдельные корни
  function splitRoots(raw, expectedCount) {
    const s = String(raw || '').trim().toLowerCase()
      .replace(/[{}]/g, '')
      .replace(/[a-z]\s*(?:_?[\d₀-₉]{1,2})?\s*=/g, '');
    let parts = s.includes(';') ? s.split(';') : s.split(/\s+(?:и|или|un|vai|and|or)\s+/);
    if (parts.length === 1 && expectedCount > 1 && s.includes(',')) parts = s.split(',');
    const out = [];
    parts.map(p => p.trim()).filter(Boolean).forEach(part => {
      if (part.includes('±')) out.push(part.replace('±', '+'), part.replace('±', '-'));
      else out.push(part);
    });
    return out;
  }

  function checkRoots(q, userInput) {
    const expected = q.roots || [];
    const raw = String(userInput || '').trim();
    const result = isCorrect => ({ isCorrect, expectedDisplay: q.answer, userNormalized: raw });
    if (!raw) return result(false);
    if (NO_ROOTS.test(raw.toLowerCase().replace(/\s+/g, ''))) return result(expected.length === 0);
    const values = [];
    for (const part of splitRoots(raw, expected.length)) {
      const v = evalNumber(part);
      if (!Number.isFinite(v)) return result(false);
      if (!values.some(x => Math.abs(x - v) < 1e-6)) values.push(v);
    }
    return result(values.length === expected.length && expected.every(e => values.some(v => Math.abs(v - e) < 1e-6)));
  }

  function checkPoly(q, userInput) {
    const raw = String(userInput || '').trim();
    const result = isCorrect => ({ isCorrect, expectedDisplay: q.answer, userNormalized: raw });
    if (!raw) return result(false);
    let tree;
    let p;
    try {
      tree = parseExpr(raw);
      p = toPoly(tree);
    } catch (_) {
      return result(false);
    }
    if (!polyEquals(p, q.poly)) return result(false);
    if (q.form === 'expanded') return result(isExpandedForm(tree, q.poly));
    if (q.form === 'factored') return result(isFactoredForm(tree));
    return result(true);
  }

  /* ── Сборка вопросов ───────────────────────────────────────────── */
  // Многочлен по коэффициентам от старшей степени: [1, -5, 6] → x² - 5x + 6
  const fromCoeffs = (cs, v = 'x') => {
    const r = {};
    const n = cs.length - 1;
    cs.forEach((c, i) => {
      const e = n - i;
      r[e === 0 ? '' : e === 1 ? v : `${v}^${e}`] = c;
    });
    return cleanPoly(r);
  };
  const lin = (a, b, v = 'x') => fromCoeffs([a, b], v);
  const tex = p => polyToString(p, true);
  const txt = p => polyToString(p);
  // Сомножитель в скобках, если в нём больше одного члена
  const wrapTex = p => (Object.keys(p).length > 1 ? `(${tex(p)})` : tex(p));
  const wrapTxt = p => (Object.keys(p).length > 1 ? `(${txt(p)})` : txt(p));

  // Корень-дробь: значение, запись для ответа и для LaTeX
  function rat(n, d = 1) {
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d);
    n /= g;
    d /= g;
    return {
      v: n / d,
      text: d === 1 ? String(n) : `${n}/${d}`,
      tex: d === 1 ? String(n) : `${n < 0 ? '-' : ''}\\frac{${Math.abs(n)}}{${d}}`
    };
  }

  function rootsQuestion({ latex, roots, hint, category, task = 'solve', unit = '' }) {
    const uniq = [];
    roots.forEach(r => {
      if (!uniq.some(u => Math.abs(u.v - r.v) < 1e-9)) uniq.push(r);
    });
    uniq.sort((a, b) => a.v - b.v);
    return {
      latex,
      eq: true,
      task,
      type: 'roots',
      roots: uniq.map(r => r.v),
      answer: uniq.length ? uniq.map(r => r.text + unit).join('; ') : '∅',
      hint,
      category
    };
  }

  function polyQuestion({ latex, poly, answer, form = null, task, hint, category }) {
    return { latex, type: 'poly', poly, form, task, answer, hint, category };
  }

  const GENERATORS = {};
  const signed = n => (n < 0 ? ` - ${-n}` : ` + ${n}`);
  const byDiff = (diff, table) => pick(table[diff] || table.normal)();

  /* ── Алгебраические уравнения ──────────────────────────────────── */
  function genLinear(diff = 'normal') {
    const category = 'eq_linear';
    return byDiff(diff, {
      normal: [() => {
        const x = randInt(-10, 10);
        const a = randNZ(2, 9) * pick([1, -1]);
        const b = randNZ(-20, 20);
        const c = a * x + b;
        return rootsQuestion({ latex: `${tex(lin(a, b))} = ${c}`, roots: [rat(x)], hint: `${tex(lin(a, 0))} = ${c - b} \\Rightarrow x = ${x}`, category });
      }],
      hard: [() => {
        // ax + b = cx + d
        const x = randInt(-9, 9);
        const a = randNZ(-9, 9);
        let c = randNZ(-9, 9);
        while (c === a) c = randNZ(-9, 9);
        const b = randNZ(-15, 15);
        const d = (a - c) * x + b;
        return rootsQuestion({ latex: `${tex(lin(a, b))} = ${tex(lin(c, d))}`, roots: [rat(x)], hint: `${tex(lin(a - c, 0))} = ${d - b} \\Rightarrow x = ${x}`, category });
      }, () => {
        // k(x + p) + q = cx + d
        const x = randInt(-8, 8);
        const k = randNZ(2, 5) * pick([1, -1]);
        const p = randNZ(-7, 7);
        const q = randNZ(-9, 9);
        let c = randInt(-5, 5);
        while (c === k) c = randInt(-5, 5);
        const d = k * (x + p) + q - c * x;
        return rootsQuestion({
          latex: `${k}${wrapTex(lin(1, p))}${signed(q)} = ${tex(lin(c, d))}`,
          roots: [rat(x)],
          hint: `${tex(lin(k - c, 0))} = ${d - k * p - q} \\Rightarrow x = ${x}`,
          category
        });
      }],
      expert: [() => {
        // (x + p)/m = (x - q)/n: обе части равны целому t
        const m = randInt(2, 6);
        let n = randInt(2, 6);
        while (n === m) n = randInt(2, 6);
        const t = randNZ(-5, 5);
        const x = randInt(-8, 8);
        const p = m * t - x;
        const q = x - n * t;
        return rootsQuestion({
          latex: `\\frac{${tex(lin(1, p))}}{${m}} = \\frac{${tex(lin(1, -q))}}{${n}}`,
          roots: [rat(x)],
          hint: `${n}${wrapTex(lin(1, p))} = ${m}${wrapTex(lin(1, -q))} \\Rightarrow x = ${x}`,
          category
        });
      }, () => {
        // Корень — несократимая дробь
        const a = randNZ(2, 9) * pick([1, -1]);
        let s = randNZ(-20, 20);
        while (s % a === 0) s = randNZ(-20, 20);
        const b = randNZ(-15, 15);
        const r = rat(s, a);
        return rootsQuestion({ latex: `${tex(lin(a, b))} = ${b + s}`, roots: [r], hint: `${tex(lin(a, 0))} = ${s} \\Rightarrow x = ${r.tex}`, category });
      }]
    });
  }

  function genQuadratic(diff = 'normal') {
    const category = 'eq_quadratic';
    const twoRoots = (min, max) => {
      const r1 = randInt(min, max);
      let r2 = randInt(min, max);
      while (r2 === r1) r2 = randInt(min, max);
      return [r1, r2];
    };
    const factorsTex = rs => rs.map(r => wrapTex(lin(1, -r))).join('');
    return byDiff(diff, {
      normal: [() => {
        const [r1, r2] = twoRoots(-9, 9);
        const P = polyProduct(lin(1, -r1), lin(1, -r2));
        return rootsQuestion({ latex: `${tex(P)} = 0`, roots: [rat(r1), rat(r2)], hint: `${factorsTex([r1, r2])} = 0`, category });
      }, () => {
        const k = randInt(1, 12);
        return rootsQuestion({ latex: `x^{2} - ${k * k} = 0`, roots: [rat(k), rat(-k)], hint: `x^{2} = ${k * k} \\Rightarrow x = \\pm ${k}`, category });
      }, () => {
        const p = randNZ(-12, 12);
        return rootsQuestion({ latex: `${tex(fromCoeffs([1, p, 0]))} = 0`, roots: [rat(0), rat(-p)], hint: `x${wrapTex(lin(1, p))} = 0`, category });
      }],
      hard: [() => {
        // Один корень целый, другой — дробь p/q
        const r1 = randInt(-6, 6);
        const q = randInt(2, 5);
        let p = randNZ(-9, 9);
        while (p % q === 0) p = randNZ(-9, 9);
        const P = polyProduct(lin(1, -r1), lin(q, -p));
        return rootsQuestion({ latex: `${tex(P)} = 0`, roots: [rat(r1), rat(p, q)], hint: `${wrapTex(lin(1, -r1))}${wrapTex(lin(q, -p))} = 0`, category });
      }, () => {
        const r = randNZ(-9, 9);
        const P = polyProduct(lin(1, -r), lin(1, -r));
        return rootsQuestion({ latex: `${tex(P)} = 0`, roots: [rat(r)], hint: `${wrapTex(lin(1, -r))}^{2} = 0`, category });
      }, () => {
        // Нет корней: D < 0
        const p = randInt(-6, 6);
        const q = Math.floor((p * p) / 4) + randInt(1, 9);
        return rootsQuestion({ latex: `${tex(fromCoeffs([1, p, q]))} = 0`, roots: [], hint: `D = ${p * p} - ${4 * q} = ${p * p - 4 * q} < 0`, category });
      }, () => {
        const a = randInt(2, 3) * pick([1, -1]);
        const [r1, r2] = twoRoots(-6, 6);
        const P = polyScale(polyProduct(lin(1, -r1), lin(1, -r2)), a);
        return rootsQuestion({ latex: `${tex(P)} = 0`, roots: [rat(r1), rat(r2)], hint: `${a}${factorsTex([r1, r2])} = 0`, category });
      }],
      expert: [() => {
        // Иррациональные корни m ± √k
        const m = randInt(-5, 5);
        const k = pick([2, 3, 5, 6, 7, 10, 11, 13]);
        const P = fromCoeffs([1, -2 * m, m * m - k]);
        const root = sign => ({
          v: m + sign * Math.sqrt(k),
          text: `${m || ''}${sign < 0 ? '-' : m ? '+' : ''}√${k}`
        });
        return rootsQuestion({ latex: `${tex(P)} = 0`, roots: [root(-1), root(1)], hint: `x = ${m || ''} \\pm \\sqrt{${k}}`, category });
      }, () => {
        // x(x - s) = c
        let r1;
        let r2;
        do [r1, r2] = twoRoots(-7, 7); while (r1 + r2 === 0);
        return rootsQuestion({
          latex: `x${wrapTex(lin(1, -(r1 + r2)))} = ${-r1 * r2}`,
          roots: [rat(r1), rat(r2)],
          hint: `${factorsTex([r1, r2])} = 0`,
          category
        });
      }, () => {
        // (x - m)^2 = k^2
        const m = randNZ(-7, 7);
        const k = randInt(1, 9);
        return rootsQuestion({
          latex: `${wrapTex(lin(1, -m))}^{2} = ${k * k}`,
          roots: [rat(m + k), rat(m - k)],
          hint: `${tex(lin(1, -m))} = \\pm ${k}`,
          category
        });
      }, () => {
        // (x + a)(x + b) = c
        const [r1, r2] = twoRoots(-6, 6);
        const a = randNZ(-6, 6);
        const b = -(r1 + r2) - a;
        const c = a * b - r1 * r2;
        const P = polyProduct(lin(1, -r1), lin(1, -r2));
        return rootsQuestion({
          latex: `${wrapTex(lin(1, a))}${wrapTex(lin(1, b))} = ${c}`,
          roots: [rat(r1), rat(r2)],
          hint: `${tex(P)} = 0 \\Rightarrow ${factorsTex([r1, r2])} = 0`,
          category
        });
      }]
    });
  }

  function genRational(diff = 'normal') {
    const category = 'eq_rational';
    return byDiff(diff, {
      normal: [() => {
        // a/(x + b) = c
        const x = randInt(-8, 8);
        const c = randNZ(-5, 5);
        const d = randNZ(-6, 6);
        const b = d - x;
        return rootsQuestion({
          latex: `\\frac{${c * d}}{${tex(lin(1, b))}} = ${c}`,
          roots: [rat(x)],
          hint: `${tex(lin(1, b))} = \\frac{${c * d}}{${c}} = ${d}`,
          category
        });
      }, () => {
        // (x + p)/(x + q) = 0
        const p = randNZ(-9, 9);
        let q = randInt(-9, 9);
        while (q === p) q = randInt(-9, 9);
        return rootsQuestion({
          latex: `\\frac{${tex(lin(1, p))}}{${tex(lin(1, q))}} = 0`,
          roots: [rat(-p)],
          hint: `${tex(lin(1, p))} = 0,\\; ${tex(lin(1, q))} \\neq 0`,
          category
        });
      }],
      hard: [() => {
        // (x + a)/(x - b) = c
        const x = randInt(-8, 8);
        let b = randInt(-8, 8);
        while (b === x) b = randInt(-8, 8);
        let c = randNZ(-4, 4);
        while (c === 1) c = randNZ(-4, 4);
        const a = c * (x - b) - x;
        return rootsQuestion({
          latex: `\\frac{${tex(lin(1, a))}}{${tex(lin(1, -b))}} = ${c}`,
          roots: [rat(x)],
          hint: `${tex(lin(1, a))} = ${c}${wrapTex(lin(1, -b))} \\Rightarrow x = ${x}`,
          category
        });
      }, () => {
        // a/(x + b) = c/(x + d)
        const x = randInt(-8, 8);
        const u = randNZ(-6, 6);
        let w = randNZ(-6, 6);
        while (w === u) w = randNZ(-6, 6);
        const k = randNZ(-4, 4);
        const b = u - x;
        const d = w - x;
        return rootsQuestion({
          latex: `\\frac{${k * u}}{${tex(lin(1, b))}} = \\frac{${k * w}}{${tex(lin(1, d))}}`,
          roots: [rat(x)],
          hint: `${k * u}${wrapTex(lin(1, d))} = ${k * w}${wrapTex(lin(1, b))} \\Rightarrow x = ${x}`,
          category
        });
      }],
      expert: [() => {
        // Посторонний корень: знаменатель обнуляется в одном из корней числителя
        const r1 = randInt(-7, 7);
        let r2 = randInt(-7, 7);
        while (r2 === r1) r2 = randInt(-7, 7);
        const P = polyProduct(lin(1, -r1), lin(1, -r2));
        return rootsQuestion({
          latex: `\\frac{${tex(P)}}{${tex(lin(1, -r1))}} = 0`,
          roots: [rat(r2)],
          hint: `${wrapTex(lin(1, -r1))}${wrapTex(lin(1, -r2))} = 0,\\; x \\neq ${r1}`,
          category
        });
      }, () => {
        // a/x = x - b  →  x² - bx - a = 0
        let r1;
        let r2;
        do {
          r1 = randNZ(-6, 6);
          r2 = randNZ(-6, 6);
        } while (r1 === r2);
        const b = r1 + r2;
        const a = -r1 * r2;
        return rootsQuestion({
          latex: `\\frac{${a}}{x} = ${tex(lin(1, -b))}`,
          roots: [rat(r1), rat(r2)],
          hint: `${tex(fromCoeffs([1, -b, -a]))} = 0,\\; x \\neq 0`,
          category
        });
      }]
    });
  }

  function genIrrational(diff = 'normal') {
    const category = 'eq_irrational';
    // √(x + a) = x + b, у квадрата второй корень посторонний
    const withExtraneous = () => {
      const t1 = randInt(2, 6);
      const b = randInt(-5, 5);
      const x = t1 - b;
      const a = b + t1 * t1 - t1;
      const x2 = 1 - t1 - b;
      return { a, b, x, x2 };
    };
    // √(ax + b) = c
    const simple = () => {
      const c = randInt(1, 8);
      const x = randInt(-6, 10);
      const a = randInt(1, 5);
      const b = c * c - a * x;
      return rootsQuestion({ latex: `\\sqrt{${tex(lin(a, b))}} = ${c}`, roots: [rat(x)], hint: `${tex(lin(a, b))} = ${c * c} \\Rightarrow x = ${x}`, category });
    };
    return byDiff(diff, {
      // «Нет корней» — в каждом третьем примере
      normal: [simple, simple, () => {
        const a = randInt(1, 5);
        const b = randInt(-9, 9);
        const c = randInt(1, 6);
        return rootsQuestion({ latex: `\\sqrt{${tex(lin(a, b))}} = -${c}`, roots: [], hint: `\\sqrt{${tex(lin(a, b))}} \\ge 0`, category });
      }],
      hard: [() => {
        const { a, b, x, x2 } = withExtraneous();
        return rootsQuestion({
          latex: `\\sqrt{${tex(lin(1, a))}} = ${tex(lin(1, b))}`,
          roots: [rat(x)],
          hint: `${tex(lin(1, a))} = ${wrapTex(lin(1, b))}^{2} \\Rightarrow x_1 = ${x},\\; x_2 = ${x2}\\;(${x2 + b} < 0)`,
          category
        });
      }, () => {
        // √(ax + b) = √(cx + d)
        const x = randInt(-6, 8);
        const R = randInt(1, 16);
        const a = randInt(1, 5);
        let c = randInt(1, 5);
        while (c === a) c = randInt(1, 5);
        return rootsQuestion({
          latex: `\\sqrt{${tex(lin(a, R - a * x))}} = \\sqrt{${tex(lin(c, R - c * x))}}`,
          roots: [rat(x)],
          hint: `${tex(lin(a, R - a * x))} = ${tex(lin(c, R - c * x))} \\Rightarrow x = ${x},\\; ${R} \\ge 0`,
          category
        });
      }],
      expert: [() => {
        // √(x² + p) = x + q
        const q = randNZ(-5, 5);
        const x = randInt(1, 8) - q;
        const p = q * q + 2 * q * x;
        return rootsQuestion({
          latex: `\\sqrt{${tex(fromCoeffs([1, 0, p]))}} = ${tex(lin(1, q))}`,
          roots: [rat(x)],
          hint: `${tex(fromCoeffs([1, 0, p]))} = ${tex(fromCoeffs([1, 2 * q, q * q]))} \\Rightarrow x = ${x}`,
          category
        });
      }, () => {
        // √(x + a) - b = x: тот же посторонний корень, но в другой записи
        const { a, b, x, x2 } = withExtraneous();
        return rootsQuestion({
          latex: `\\sqrt{${tex(lin(1, a))}}${signed(-b)} = x`,
          roots: [rat(x)],
          hint: `\\sqrt{${tex(lin(1, a))}} = ${tex(lin(1, b))} \\Rightarrow x_1 = ${x},\\; x_2 = ${x2}\\;(${x2 + b} < 0)`,
          category
        });
      }]
    });
  }

  Object.assign(GENERATORS, {
    eq_linear: genLinear,
    eq_quadratic: genQuadratic,
    eq_rational: genRational,
    eq_irrational: genIrrational,
    eq_mix: (diff = 'normal', school = 'high') => {
      const cats = ['eq_linear', 'eq_quadratic', 'eq_rational'];
      if (school !== 'basic') cats.push('eq_irrational');
      return GENERATORS[pick(cats)](diff, school);
    }
  });

  /* ── Тригонометрические, показательные, логарифмические ────────── */
  // Многочлен от t с подстановкой: t² → sq, t → one (для 2^x — через ·)
  const subst = (str, sq, one, cdot = false) => str
    .replace(/t\^\{2\}/g, '\u0001')
    .replace(/(\d)t/g, cdot ? '$1\u0002' : '$1\u0003')
    .replace(/t/g, '\u0003')
    .replace(/\u0001/g, sq)
    .replace(/\u0002/g, `\\cdot ${one}`)
    .replace(/\u0003/g, one);

  // Модули табличных значений: запись, уравнение вида a·f − c = 0, дробь
  const MAG = {
    half: { tex: '\\frac{1}{2}', a: 2, c: '1' },
    r2: { tex: '\\frac{\\sqrt{2}}{2}', a: 2, c: '\\sqrt{2}' },
    r3: { tex: '\\frac{\\sqrt{3}}{2}', a: 2, c: '\\sqrt{3}' },
    one: { tex: '1', a: 1, c: '1' },
    r33: { tex: '\\frac{\\sqrt{3}}{3}', a: 3, c: '\\sqrt{3}' },
    s3: { tex: '\\sqrt{3}', a: 1, c: '\\sqrt{3}' }
  };
  // [функция, модуль значения, знак, все углы на [0°; 360°)]
  const TRIG_TABLE = [
    ['sin', 'half', 1, [30, 150]], ['sin', 'r2', 1, [45, 135]], ['sin', 'r3', 1, [60, 120]], ['sin', 'one', 1, [90]],
    ['sin', 'half', -1, [210, 330]], ['sin', 'r2', -1, [225, 315]], ['sin', 'r3', -1, [240, 300]], ['sin', 'one', -1, [270]],
    ['cos', 'r3', 1, [30, 330]], ['cos', 'r2', 1, [45, 315]], ['cos', 'half', 1, [60, 300]], ['cos', 'one', 1, [0]],
    ['cos', 'half', -1, [120, 240]], ['cos', 'r2', -1, [135, 225]], ['cos', 'r3', -1, [150, 210]], ['cos', 'one', -1, [180]],
    ['tan', 'r33', 1, [30, 210]], ['tan', 'one', 1, [45, 225]], ['tan', 's3', 1, [60, 240]],
    ['tan', 'r33', -1, [150, 330]], ['tan', 'one', -1, [135, 315]], ['tan', 's3', -1, [120, 300]]
  ];
  const TRIG_ZERO = { sin: [0, 180], cos: [90, 270], tan: [0, 180] };
  const valueTex = (mag, sign) => `${sign < 0 ? '-' : ''}${MAG[mag].tex}`;
  const degList = ds => ds.map(d => `${d}^\\circ`).join(',\\ ');
  const trigQ = (latex, degs, hint) => rootsQuestion({
    latex,
    roots: degs.map(d => ({ v: d, text: String(d) })),
    hint,
    category: 'eq_trig',
    task: 'solve_deg',
    unit: '°'
  });

  // Углы, где f x = p/q (только 0, ±1/2, ±1; |p/q| > 1 — корней нет)
  function trigDegs(f, p, q) {
    if (p === 0) return TRIG_ZERO[f];
    if (Math.abs(p) > q) return [];
    const mag = Math.abs(p) === q ? 'one' : 'half';
    const row = TRIG_TABLE.find(([g, m, s]) => g === f && m === mag && s === Math.sign(p));
    return row ? row[3] : [];
  }

  function genTrig(diff = 'normal') {
    return byDiff(diff, {
      normal: [() => {
        const [f, mag, sign, degs] = pick(TRIG_TABLE);
        return trigQ(`\\${f} x = ${valueTex(mag, sign)}`, degs, `x = ${degList(degs)}`);
      }, () => {
        const f = pick(['sin', 'cos', 'tan']);
        return trigQ(`\\${f} x = 0`, TRIG_ZERO[f], `x = ${degList(TRIG_ZERO[f])}`);
      }],
      hard: [() => {
        // a·f x ∓ c = 0
        const [f, mag, sign, degs] = pick(TRIG_TABLE);
        const { a, c } = MAG[mag];
        return trigQ(
          `${a === 1 ? '' : a}\\${f} x ${sign > 0 ? '-' : '+'} ${c} = 0`,
          degs,
          `\\${f} x = ${valueTex(mag, sign)} \\Rightarrow x = ${degList(degs)}`
        );
      }, () => {
        // f 2x = v: 2x пробегает [0°; 720°)
        const [f, mag, sign, base] = pick(TRIG_TABLE);
        const degs = base.flatMap(d => [d / 2, (d + 360) / 2]);
        return trigQ(`\\${f} 2x = ${valueTex(mag, sign)}`, degs, `2x = ${degList(base.flatMap(d => [d, d + 360]))}`);
      }],
      expert: [() => {
        // Квадратное относительно sin x или cos x; значение ±2 корней не даёт
        const f = pick(['sin', 'cos']);
        const real = [[0, 1], [1, 2], [-1, 2], [1, 1], [-1, 1]];
        const [p1, q1] = pick(real);
        const rest = [...real, [2, 1], [-2, 1]].filter(([p, q]) => p * q1 !== p1 * q);
        const [p2, q2] = pick(rest);
        const coeffs = [q1 * q2, -(q1 * p2 + q2 * p1), p1 * p2];
        const sq = `\\${f}^{2} x`;
        const one = `\\${f} x`;
        const degs = [...trigDegs(f, p1, q1), ...trigDegs(f, p2, q2)];
        const hint = subst(`${wrapTex(lin(q1, -p1, 't'))}${wrapTex(lin(q2, -p2, 't'))} = 0`, sq, one);
        return trigQ(`${subst(tex(fromCoeffs(coeffs, 't')), sq, one)} = 0`, degs, `${hint} \\Rightarrow x = ${degList([...degs].sort((a, b) => a - b))}`);
      }, () => {
        // sin x = k·cos x → tan x = k
        const [latex, hint, degs] = pick([
          ['\\sin x = \\cos x', '\\tan x = 1', [45, 225]],
          ['\\sin x = -\\cos x', '\\tan x = -1', [135, 315]],
          ['\\sqrt{3}\\sin x = \\cos x', '\\tan x = \\frac{\\sqrt{3}}{3}', [30, 210]],
          ['\\sin x = \\sqrt{3}\\cos x', '\\tan x = \\sqrt{3}', [60, 240]]
        ]);
        return trigQ(latex, degs, `${hint} \\Rightarrow x = ${degList(degs)}`);
      }]
    });
  }

  const POW_LIMIT = { 2: 7, 3: 5, 5: 4 };
  const powTex = (a, n) => (n >= 0 ? String(a ** n) : `\\frac{1}{${a ** -n}}`);

  function genExp(diff = 'normal') {
    const category = 'eq_exp';
    return byDiff(diff, {
      normal: [() => {
        // a^(kx + m) = a^n
        const a = pick([2, 3, 5]);
        const n = Math.random() < 0.25 ? -randInt(1, 3) : randInt(0, POW_LIMIT[a]);
        const k = randInt(1, 3);
        const x = randInt(-3, 4);
        const m = n - k * x;
        const e = tex(lin(k, m));
        return rootsQuestion({ latex: `${a}^{${e}} = ${powTex(a, n)}`, roots: [rat(x)], hint: `${a}^{${e}} = ${a}^{${n}} \\Rightarrow ${e} = ${n}`, category });
      }],
      hard: [() => {
        // (b^p)^(x + s) = (b^q)^(x + t)
        const b = pick([2, 3]);
        const p = randInt(1, b === 2 ? 4 : 3);
        let q = randInt(1, b === 2 ? 4 : 3);
        while (q === p) q = randInt(1, b === 2 ? 4 : 3);
        const u = randNZ(-3, 3);
        const x = randInt(-4, 4);
        const s = q * u - x;
        const t = p * u - x;
        return rootsQuestion({
          latex: `${b ** p}^{${tex(lin(1, s))}} = ${b ** q}^{${tex(lin(1, t))}}`,
          roots: [rat(x)],
          hint: `${b}^{${p}${wrapTex(lin(1, s))}} = ${b}^{${q}${wrapTex(lin(1, t))}}`,
          category
        });
      }, () => {
        // (1/a)^(kx + m) = a^n
        const a = pick([2, 3, 5]);
        const n = randInt(1, POW_LIMIT[a]);
        const k = randInt(1, 2);
        const x = randInt(-4, 4);
        const m = -n - k * x;
        return rootsQuestion({
          latex: `\\left(\\frac{1}{${a}}\\right)^{${tex(lin(k, m))}} = ${a ** n}`,
          roots: [rat(x)],
          hint: `${a}^{-${wrapTex(lin(k, m))}} = ${a}^{${n}}`,
          category
        });
      }, () => {
        // a^(x+1) + a^x = C или a^(x+2) - a^x = C
        const a = pick([2, 3, 5]);
        const x = randInt(0, 3);
        const plus = Math.random() < 0.5;
        const factor = plus ? a + 1 : a * a - 1;
        return rootsQuestion({
          latex: plus ? `${a}^{x + 1} + ${a}^{x} = ${factor * a ** x}` : `${a}^{x + 2} - ${a}^{x} = ${factor * a ** x}`,
          roots: [rat(x)],
          hint: `${a}^{x} \\cdot ${factor} = ${factor * a ** x} \\Rightarrow ${a}^{x} = ${a ** x}`,
          category
        });
      }],
      expert: [() => {
        // Замена t = a^x; отрицательный корень по t отбрасывается
        const a = pick([2, 3]);
        const r1 = randInt(0, 3);
        const t1 = a ** r1;
        let r2 = null;
        let t2;
        if (Math.random() < 0.5) {
          r2 = randInt(0, 3);
          while (r2 === r1) r2 = randInt(0, 3);
          t2 = a ** r2;
        } else {
          t2 = -randInt(1, 4);
        }
        const coeffs = [1, -(t1 + t2), t1 * t2];
        const sq = a === 2 ? pick(['4^{x}', '2^{2x}']) : pick(['9^{x}', '3^{2x}']);
        return rootsQuestion({
          latex: `${subst(tex(fromCoeffs(coeffs, 't')), sq, `${a}^{x}`, true)} = 0`,
          roots: r2 === null ? [rat(r1)] : [rat(r1), rat(r2)],
          hint: `t = ${a}^{x}:\\; ${tex(fromCoeffs(coeffs, 't'))} = 0 \\Rightarrow t = ${t1},\\ ${t2}`,
          category
        });
      }]
    });
  }

  const LOG_LIMIT = { 2: 5, 3: 4, 5: 3, 10: 3 };
  const logTex = a => (a === 10 ? '\\lg' : `\\log_{${a}}`);

  function genLog(diff = 'normal') {
    const category = 'eq_log';
    return byDiff(diff, {
      normal: [() => {
        // log_a(kx + m) = n
        const a = pick([2, 3, 5, 10]);
        const n = randInt(0, LOG_LIMIT[a]);
        const k = randInt(1, 4);
        const x = randInt(-3, 8);
        const m = a ** n - k * x;
        return rootsQuestion({
          latex: `${logTex(a)}(${tex(lin(k, m))}) = ${n}`,
          roots: [rat(x)],
          hint: `${tex(lin(k, m))} = ${a}^{${n}} = ${a ** n}`,
          category
        });
      }, () => {
        // log_a x = -n → дробь
        const a = pick([2, 3, 5, 10]);
        const n = randInt(1, Math.min(3, LOG_LIMIT[a]));
        return rootsQuestion({ latex: `${logTex(a)} x = -${n}`, roots: [rat(1, a ** n)], hint: `x = ${a}^{-${n}} = \\frac{1}{${a ** n}}`, category });
      }],
      hard: [() => {
        // log_a(x + p) + log_a(x + q) = n: второй корень квадратного — посторонний
        const a = pick([2, 3]);
        const n = randInt(2, a === 2 ? 5 : 3);
        let e1 = randInt(0, n);
        while (e1 * 2 === n) e1 = randInt(0, n);
        const u = a ** e1;
        const v = a ** (n - e1);
        const x = randInt(-3, 6);
        const p = u - x;
        const q = v - x;
        const x2 = -(p + q) - x;
        return rootsQuestion({
          latex: `${logTex(a)}(${tex(lin(1, p))}) + ${logTex(a)}(${tex(lin(1, q))}) = ${n}`,
          roots: [rat(x)],
          hint: `${wrapTex(lin(1, p))}${wrapTex(lin(1, q))} = ${a ** n} \\Rightarrow x_1 = ${x},\\; x_2 = ${x2}\\;(${x2 + p} < 0)`,
          category
        });
      }, () => {
        // log_a(kx + m) = log_a(jx + l)
        const a = pick([2, 3, 5]);
        const x = randInt(-4, 6);
        const R = randInt(1, 12);
        const k = randInt(1, 5);
        let j = randInt(1, 5);
        while (j === k) j = randInt(1, 5);
        return rootsQuestion({
          latex: `${logTex(a)}(${tex(lin(k, R - k * x))}) = ${logTex(a)}(${tex(lin(j, R - j * x))})`,
          roots: [rat(x)],
          hint: `${tex(lin(k, R - k * x))} = ${tex(lin(j, R - j * x))} \\Rightarrow x = ${x},\\; ${R} > 0`,
          category
        });
      }],
      expert: [() => {
        // Замена t = log_a x
        const a = pick([2, 3]);
        const t1 = randInt(-2, 3);
        let t2 = randInt(-2, 3);
        while (t2 === t1) t2 = randInt(-2, 3);
        const coeffs = [1, -(t1 + t2), t1 * t2];
        const root = t => (t >= 0 ? rat(a ** t) : rat(1, a ** -t));
        return rootsQuestion({
          latex: `${subst(tex(fromCoeffs(coeffs, 't')), `\\log_{${a}}^{2} x`, `\\log_{${a}} x`)} = 0`,
          roots: [root(t1), root(t2)],
          hint: `t = \\log_{${a}} x:\\; t = ${t1},\\ ${t2}`,
          category
        });
      }]
    });
  }

  Object.assign(GENERATORS, {
    eq_trig: genTrig,
    eq_exp: genExp,
    eq_log: genLog,
    eq_adv_mix: (diff = 'normal', school = 'high') => GENERATORS[pick(['eq_trig', 'eq_exp', 'eq_log'])](diff, school)
  });

  /* ── Выражения ─────────────────────────────────────────────────── */
  const randQuadratic = () => fromCoeffs([randNZ(-5, 5), randInt(-9, 9), randInt(-9, 9)]);
  // Двучлен от двух переменных: pa + qb
  const bin2 = (p, u, q, v) => cleanPoly({ [u]: p, [v]: q });
  const expandQ = (latex, poly, hint) => polyQuestion({ latex, poly, answer: txt(poly), form: 'expanded', task: 'expand', hint, category: null });
  // Запись разложения: коэффициент впереди, скобки — только у многочленов
  const factoredText = (lead, factors, wrap) => (lead === -1 ? '-' : lead === 1 ? '' : String(lead)) + factors.map(wrap).join('');

  function genPolyOps(diff = 'normal') {
    const q = (latex, poly) => ({ ...expandQ(latex, poly, `${latex} = ${tex(poly)}`), category: 'expr_poly' });
    return byDiff(diff, {
      normal: [() => {
        const P1 = randQuadratic();
        const P2 = randQuadratic();
        const minus = Math.random() < 0.5;
        const R = polyAdd(P1, minus ? polyScale(P2, -1) : P2);
        return Object.keys(R).length ? q(`${wrapTex(P1)} ${minus ? '-' : '+'} ${wrapTex(P2)}`, R) : q(`${wrapTex(P1)} + ${wrapTex(P2)}`, polyAdd(P1, P2));
      }, () => {
        const m = cleanPoly({ [pick(['', 'x'])]: randNZ(-6, 6) });
        const Q = fromCoeffs([randNZ(-5, 5), randNZ(-9, 9)]);
        return q(`${tex(m)}${wrapTex(Q)}`, polyMul(m, Q));
      }],
      hard: [() => {
        const L1 = lin(randNZ(-3, 3), randNZ(-9, 9));
        const L2 = lin(randNZ(-3, 3), randNZ(-9, 9));
        return q(`${wrapTex(L1)}${wrapTex(L2)}`, polyMul(L1, L2));
      }, () => {
        const L = lin(1, randNZ(-5, 5));
        const Q = fromCoeffs([1, randInt(-5, 5), randNZ(-6, 6)]);
        return q(`${wrapTex(L)}${wrapTex(Q)}`, polyMul(L, Q));
      }],
      expert: [() => {
        const L1 = lin(1, randNZ(-7, 7));
        const L2 = lin(1, randNZ(-7, 7));
        const L3 = lin(1, randNZ(-7, 7));
        return q(`${wrapTex(L1)}${wrapTex(L2)} - ${wrapTex(L3)}^{2}`, polyAdd(polyMul(L1, L2), polyScale(polyMul(L3, L3), -1)));
      }, () => {
        const L1 = bin2(randNZ(1, 3), 'a', randNZ(-4, 4), 'b');
        const L2 = bin2(randNZ(1, 3), 'a', randNZ(-4, 4), 'b');
        return q(`${wrapTex(L1)}${wrapTex(L2)}`, polyMul(L1, L2));
      }]
    });
  }

  function genFormulas(diff = 'normal') {
    const q = (latex, poly, formula) => ({ ...expandQ(latex, poly, `${formula},\\quad ${latex} = ${tex(poly)}`), category: 'expr_formulas' });
    const SQ_PLUS = '(a + b)^{2} = a^{2} + 2ab + b^{2}';
    const SQ_MINUS = '(a - b)^{2} = a^{2} - 2ab + b^{2}';
    const DIFF = '(a - b)(a + b) = a^{2} - b^{2}';
    const square = L => q(`${wrapTex(L)}^{2}`, polyMul(L, L), Object.values(L).some(c => c < 0) ? SQ_MINUS : SQ_PLUS);
    const conj = (p, u, k, v) => {
      const A = bin2(p, u, -k, v);
      const B = bin2(p, u, k, v);
      return q(`${wrapTex(A)}${wrapTex(B)}`, polyMul(A, B), DIFF);
    };
    return byDiff(diff, {
      normal: [
        () => square(lin(1, randNZ(-9, 9))),
        () => {
          const k = randInt(1, 9);
          return conj(1, 'x', k, '');
        }
      ],
      hard: [
        () => square(lin(randInt(2, 5), randNZ(-7, 7))),
        () => square(bin2(randInt(1, 3), 'a', randNZ(-4, 4), 'b')),
        () => conj(randInt(2, 5), 'x', randInt(1, 9), ''),
        () => conj(randInt(1, 4), 'a', randInt(1, 4), 'b')
      ],
      expert: [() => {
        const L = lin(1, randNZ(-4, 4));
        const cube = polyProduct(L, L, L);
        const formula = L[''] < 0 ? '(a - b)^{3} = a^{3} - 3a^{2}b + 3ab^{2} - b^{3}' : '(a + b)^{3} = a^{3} + 3a^{2}b + 3ab^{2} + b^{3}';
        return q(`${wrapTex(L)}^{3}`, cube, formula);
      }, () => {
        const k = randInt(1, 6);
        const A = lin(1, k);
        const B = lin(1, -k);
        return q(`${wrapTex(A)}^{2} - ${wrapTex(B)}^{2}`, polyAdd(polyMul(A, A), polyScale(polyMul(B, B), -1)), DIFF);
      }]
    });
  }

  function genFactor(diff = 'normal') {
    // Сначала множители, из них — многочлен
    const q = (lead, factors, extraTxt = null, extraTex = null) => {
      const poly = polyScale(polyProduct(...factors), lead);
      const answer = extraTxt || factoredText(lead, factors, wrapTxt);
      const factoredTex = extraTex || factoredText(lead, factors, wrapTex);
      return polyQuestion({
        latex: tex(poly),
        poly,
        answer,
        form: 'factored',
        task: 'factor',
        hint: `${tex(poly)} = ${factoredTex}`,
        category: 'expr_factor'
      });
    };
    const coprimeLin = () => {
      let a;
      let b;
      do {
        a = randInt(1, 6);
        b = randNZ(-9, 9);
      } while (gcd(a, b) !== 1);
      return lin(a, b);
    };
    const twoRoots = () => {
      const r1 = randNZ(-9, 9);
      let r2 = randNZ(-9, 9);
      while (r2 === r1) r2 = randNZ(-9, 9);
      return [r1, r2];
    };
    return byDiff(diff, {
      normal: [
        () => q(randInt(2, 9), [coprimeLin()]),
        () => q(1, [{ x: 1 }, lin(1, randNZ(-9, 9))]),
        () => {
          const k = randInt(1, 12);
          return q(1, [lin(1, -k), lin(1, k)]);
        }
      ],
      hard: [
        () => {
          const [r1, r2] = twoRoots();
          return q(1, [lin(1, -r1), lin(1, -r2)]);
        },
        () => {
          const L = lin(1, randNZ(-9, 9));
          return q(1, [L, L], `${wrapTxt(L)}^2`, `${wrapTex(L)}^{2}`);
        },
        () => {
          const p = randInt(2, 5);
          const k = randInt(1, 9);
          return q(1, [lin(p, -k), lin(p, k)]);
        },
        () => q(randInt(2, 6), [{ x: 1 }, lin(1, randNZ(-9, 9))])
      ],
      expert: [
        () => {
          let L1;
          let L2;
          do {
            L1 = coprimeLin();
            L2 = coprimeLin();
          } while ((L1.x || 0) === 1 && (L2.x || 0) === 1);
          return q(1, [L1, L2]);
        },
        () => {
          const k = randInt(1, 7);
          return q(1, [{ x: 1 }, lin(1, -k), lin(1, k)]);
        },
        () => {
          const k = randInt(1, 6);
          return q(randInt(2, 5), [lin(1, -k), lin(1, k)]);
        },
        () => q(1, [bin2(1, 'a', randNZ(-4, 4), 'b'), lin(1, randNZ(-6, 6))])
      ]
    });
  }

  function genAlgFractions(diff = 'normal') {
    // Числитель = знаменатель · ответ, оба записаны раскрытыми
    const q = (denFactors, restFactors, lead = 1) => {
      const den = polyProduct(...denFactors);
      const rest = polyScale(polyProduct(...restFactors), lead);
      const num = polyMul(den, rest);
      const numTex = factoredText(lead, [...denFactors, ...restFactors], wrapTex);
      return polyQuestion({
        latex: `\\frac{${tex(num)}}{${tex(den)}}`,
        poly: rest,
        answer: txt(rest),
        task: 'reduce',
        hint: `\\frac{${numTex}}{${factoredText(1, denFactors, wrapTex)}} = ${tex(rest)}`,
        category: 'expr_fractions'
      });
    };
    const k = () => randInt(1, 9);
    return byDiff(diff, {
      normal: [
        () => {
          const a = k();
          return pick([true, false]) ? q([lin(1, -a)], [lin(1, a)]) : q([lin(1, a)], [lin(1, -a)]);
        },
        () => q([cleanPoly({ x: randInt(2, 6) })], [lin(randInt(1, 5), randNZ(-9, 9))])
      ],
      hard: [
        () => {
          const r1 = randNZ(-9, 9);
          let r2 = randNZ(-9, 9);
          while (r2 === r1) r2 = randNZ(-9, 9);
          return q([lin(1, -r1)], [lin(1, -r2)]);
        },
        () => {
          const a = k();
          return q([lin(1, a)], [lin(1, -a)], randInt(2, 5));
        }
      ],
      expert: [
        () => {
          const a = k();
          return q([{ x: 1 }, lin(1, a)], [lin(1, -a)]);
        },
        () => {
          const [a, b, c] = [randNZ(-6, 6), randNZ(-6, 6), randNZ(-6, 6)];
          return q([lin(1, a), lin(1, b)], [lin(1, c)]);
        }
      ]
    });
  }

  Object.assign(GENERATORS, {
    expr_poly: genPolyOps,
    expr_formulas: genFormulas,
    expr_factor: genFactor,
    expr_fractions: genAlgFractions,
    expr_mix: (diff = 'normal', school = 'high') => GENERATORS[pick(['expr_poly', 'expr_formulas', 'expr_factor', 'expr_fractions'])](diff, school)
  });

  // Категории только для средней школы: в основной их кнопок нет
  const HIGH_SCHOOL_CATEGORIES = new Set(['eq_irrational', 'eq_trig', 'eq_exp', 'eq_log', 'eq_adv_mix']);

  const api = {
    GENERATORS,
    HIGH_SCHOOL_CATEGORIES,
    parseExpr,
    evalNumber,
    toPoly,
    polyEquals,
    polyToString,
    isFactoredForm,
    checkRoots,
    checkPoly
  };

  const trainer = globalThis.MathTasksTrainer;
  if (trainer && typeof trainer.register === 'function') {
    trainer.register({ generators: GENERATORS, checkers: { roots: checkRoots, poly: checkPoly } });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.MathTasksAlgebra = api;
  }
})();
