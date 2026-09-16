/**
 * MathTasks — движок графопостроителя.
 *
 * Одна и та же отрисовка работает в диалоге на главной и на отдельной
 * странице /plotter.html: тянуть мышью и пальцем, приближать колесом
 * (точка под курсором остаётся на месте) и щипком, шаг сетки
 * подстраивается под масштаб.
 *
 * Вид задаётся центром в математических координатах и числом пикселей
 * на единицу: при изменении размера холста картина не съезжает.
 */
(() => {
  const MIN_SCALE = 0.02;
  const MAX_SCALE = 4000;
  const DEFAULT_SCALE = 40;
  const COLORS = ['#1764ff', '#e11d48', '#0f9d58'];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /* Что разрешено в формуле. Оба словаря без прототипа: иначе имя
     «constructor» нашлось бы в них само собой и стало бы функцией. */
  const FUNCS = Object.assign(Object.create(null), {
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    sqrt: Math.sqrt,
    abs: Math.abs,
    log: Math.log,
    logten: Math.log10,
    exp: Math.exp
  });
  const CONSTS = Object.assign(Object.create(null), { pi: Math.PI, e: Math.E });

  /* Разбор на лексемы: числа, имена, скобки и пять знаков действий.
     Любой другой символ — отказ, поэтому до разбора дерева не доходят
     ни точки после имени, ни стрелки, ни кавычки. */
  function tokenize(src) {
    const tokens = [];
    let i = 0;
    while (i < src.length) {
      const ch = src[i];
      if (ch === ' ') { i += 1; continue; }
      if (ch >= '0' && ch <= '9' || ch === '.') {
        let j = i;
        while (j < src.length && (src[j] >= '0' && src[j] <= '9' || src[j] === '.')) j += 1;
        const value = Number(src.slice(i, j));
        if (!Number.isFinite(value)) return null;
        tokens.push({ t: 'num', v: value });
        i = j;
        continue;
      }
      if (/[a-zA-Z]/.test(ch)) {
        let j = i;
        while (j < src.length && /[a-zA-Z]/.test(src[j])) j += 1;
        tokens.push({ t: 'name', v: src.slice(i, j) });
        i = j;
        continue;
      }
      if ('+-*/^()'.includes(ch)) { tokens.push({ t: ch }); i += 1; continue; }
      return null;
    }
    return tokens;
  }

  /* Дерево разбора сразу собирается в замыкания: каждый узел — функция
     от x. Считать потом нечего разбирать, а исполняемого кода из строки
     ученика не возникает вовсе. */
  function compile(tokens) {
    let pos = 0;
    const at = t => tokens[pos] && tokens[pos].t === t;

    function expression() {
      let left = term();
      if (!left) return null;
      while (at('+') || at('-')) {
        const plus = tokens[pos].t === '+';
        pos += 1;
        const right = term();
        if (!right) return null;
        const l = left;
        left = plus ? x => l(x) + right(x) : x => l(x) - right(x);
      }
      return left;
    }

    function term() {
      let left = unary();
      if (!left) return null;
      while (at('*') || at('/')) {
        const times = tokens[pos].t === '*';
        pos += 1;
        const right = unary();
        if (!right) return null;
        const l = left;
        left = times ? x => l(x) * right(x) : x => l(x) / right(x);
      }
      return left;
    }

    /* Минус перед степенью слабее самой степени: −x² это −(x²).
       Показатель разбираем как unary — 2^-1 и 2^3^2 читаются справа. */
    function unary() {
      if (at('-') || at('+')) {
        const minus = tokens[pos].t === '-';
        pos += 1;
        const node = unary();
        if (!node) return null;
        return minus ? x => -node(x) : node;
      }
      return power();
    }

    function power() {
      const base = primary();
      if (!base) return null;
      if (!at('^')) return base;
      pos += 1;
      const exp = unary();
      if (!exp) return null;
      return x => Math.pow(base(x), exp(x));
    }

    function primary() {
      const tok = tokens[pos];
      if (!tok) return null;
      if (tok.t === 'num') {
        pos += 1;
        return () => tok.v;
      }
      if (tok.t === '(') {
        pos += 1;
        const node = expression();
        if (!node || !at(')')) return null;
        pos += 1;
        return node;
      }
      if (tok.t !== 'name') return null;
      pos += 1;
      if (tok.v === 'x') return x => x;
      if (tok.v in CONSTS) {
        const value = CONSTS[tok.v];
        return () => value;
      }
      const fn = FUNCS[tok.v];
      if (typeof fn !== 'function' || !at('(')) return null;
      pos += 1;
      const arg = expression();
      if (!arg || !at(')')) return null;
      pos += 1;
      return x => fn(arg(x));
    }

    const root = expression();
    return root && pos === tokens.length ? root : null;
  }

  /* Формула ученика → функция от x. Запись сначала приводится к обычной
     (², √, ·, π, |x|, ctg, lg, неявное умножение), потом разбирается
     своим парсером. Через new Function это не идёт: из-за одного вызова
     всему сайту пришлось бы держать 'unsafe-eval' в политике безопасности. */
  function parseExpr(expr) {
    let clean = (expr || '')
      .trim()
      .replace(/\s+/g, '')
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/√\s*\(([^)]+)\)/g, 'sqrt($1)')
      .replace(/√\s*(\d+|[a-zA-Z]+)/g, 'sqrt($1)')
      .replace(/√/g, 'sqrt')
      .replace(/[·×]/g, '*')
      /* Десятичная запятая: её даёт и математическая клавиатура, и привычка.
         Без замены (1,5) в JS — оператор «запятая», то есть просто 5. */
      .replace(/(\d),(\d)/g, '$1.$2')
      .replace(/[−–—]/g, '-')
      .replace(/π/g, 'pi')
      .replace(/\|([^|]+)\|/g, 'abs($1)')
      /* Котангенс переписываем вместе с аргументом: из (1/tan) шаг ниже
         делал (1/tan)*(x), и тангенс оставался без аргумента. */
      .replace(/ctg\s*\(([^()]*)\)/g, '(1/tan($1))')
      .replace(/tg/g, 'tan')
      .replace(/ln/g, 'log')
      /* Десятичный логарифм держим без цифр в имени: из log10 шаг ниже
         сделал бы log1*0 — цифра перед скобкой считается умножением. */
      .replace(/log10/g, 'logten')
      .replace(/lg/g, 'logten');

    // Неявное умножение: 2x → 2*x, 2(x) → 2*(x), (x)(y) → (x)*(y)
    clean = clean
      .replace(/(\d)([a-zA-Z(])/g, '$1*$2')
      .replace(/(\))(\d|[a-zA-Z])/g, '$1*$2')
      .replace(/\)\(/g, ')*(');

    const tokens = tokenize(clean);
    if (!tokens || !tokens.length) return null;
    const fn = compile(tokens);
    if (!fn) return null;

    try {
      if (typeof fn(1) !== 'number') return null;
      return fn;
    } catch {
      return null;
    }
  }

  // Шаг сетки из ряда 1, 2, 5 × 10^k — чтобы подписи были круглыми
  function niceStep(rawStep) {
    const pow = 10 ** Math.floor(Math.log10(rawStep));
    const rel = rawStep / pow;
    return (rel < 2 ? 1 : rel < 5 ? 2 : 5) * pow;
  }

  function formatTick(value, step) {
    const decimals = Math.max(0, Math.min(6, -Math.floor(Math.log10(step))));
    const text = value.toFixed(decimals);
    return text === '-0' ? '0' : text;
  }

  function createPlotter(canvas, options = {}) {
    const { onCoords, onRoots, onViewChange, fillParent = false, minHeight = 220 } = options;
    const ctx = canvas.getContext('2d');
    const view = { cx: 0, cy: 0, scale: DEFAULT_SCALE };
    let items = [];
    let size = { w: 0, h: 0 };
    let dragging = null;
    let pinch = null;
    let raf = 0;

    const isDark = () => document.body.classList.contains('dark') || document.documentElement.classList.contains('dark');
    const inkColor = () => (isDark() ? '#c3cee1' : '#475569');
    const gridColor = () => (isDark() ? '#1b2436' : '#e8eef8');
    const axisColor = () => (isDark() ? '#7d8ca6' : '#64748b');

    const toPx = (mx, my) => ({
      x: size.w / 2 + (mx - view.cx) * view.scale,
      y: size.h / 2 - (my - view.cy) * view.scale
    });
    const toMath = (px, py) => ({
      x: view.cx + (px - size.w / 2) / view.scale,
      y: view.cy - (py - size.h / 2) / view.scale
    });

    function resize() {
      const box = canvas.parentElement;
      const cssWidth = Math.max(240, Math.floor(box ? box.clientWidth : 320));
      const cssHeight = fillParent
        ? Math.max(minHeight, Math.floor(box ? box.clientHeight : 320))
        : Math.max(minHeight, Math.min(380, Math.round(cssWidth * 0.56)));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.width = cssWidth + 'px';
      canvas.style.height = cssHeight + 'px';
      const wantedW = Math.round(cssWidth * ratio);
      const wantedH = Math.round(cssHeight * ratio);
      if (canvas.width !== wantedW || canvas.height !== wantedH) {
        canvas.width = wantedW;
        canvas.height = wantedH;
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      size = { w: cssWidth, h: cssHeight };
    }

    function drawGrid() {
      const step = niceStep(90 / view.scale);
      const small = step / 5;
      const left = toMath(0, 0).x;
      const right = toMath(size.w, 0).x;
      const top = toMath(0, 0).y;
      const bottom = toMath(0, size.h).y;

      ctx.lineWidth = 1;
      ctx.strokeStyle = gridColor();
      ctx.beginPath();
      for (let v = Math.ceil(left / small) * small; v < right; v += small) {
        const x = Math.round(toPx(v, 0).x) + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size.h);
      }
      for (let v = Math.ceil(bottom / small) * small; v < top; v += small) {
        const y = Math.round(toPx(0, v).y) + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(size.w, y);
      }
      ctx.stroke();

      /* Если ноль ушёл за край, ось прижимается к краю: иначе подписи
         остались бы висеть в пустоте без своей линии. */
      const zero = toPx(0, 0);
      const axisY = clamp(zero.y, 0.5, size.h - 0.5);
      const axisX = clamp(zero.x, 0.5, size.w - 0.5);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = axisColor();
      ctx.beginPath();
      ctx.moveTo(0, axisY);
      ctx.lineTo(size.w, axisY);
      ctx.moveTo(axisX, 0);
      ctx.lineTo(axisX, size.h);
      ctx.stroke();

      ctx.fillStyle = inkColor();
      ctx.font = '11px Manrope, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let v = Math.ceil(left / step) * step; v < right; v += step) {
        if (Math.abs(v) < step / 2) continue;
        const x = toPx(v, 0).x;
        ctx.beginPath();
        ctx.moveTo(x, axisY - 3);
        ctx.lineTo(x, axisY + 3);
        ctx.stroke();
        ctx.fillText(formatTick(v, step), x, clamp(axisY + 6, 2, size.h - 14));
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      for (let v = Math.ceil(bottom / step) * step; v < top; v += step) {
        if (Math.abs(v) < step / 2) continue;
        const y = toPx(0, v).y;
        ctx.beginPath();
        ctx.moveTo(axisX - 3, y);
        ctx.lineTo(axisX + 3, y);
        ctx.stroke();
        ctx.fillText(formatTick(v, step), clamp(axisX + 6, 2, size.w - 40), y);
      }
      ctx.textBaseline = 'top';
      ctx.fillText('0', clamp(zero.x + 5, 4, size.w - 12), clamp(zero.y + 4, 4, size.h - 14));
    }

    /* Линия строится по пикселям. Разрыв (tan, 1/x) виден по скачку больше
       высоты холста — там линия прерывается, иначе через весь экран шла бы
       ложная вертикаль. Смена знака на непрерывном участке — ноль функции. */
    function drawCurve(item, color) {
      const roots = [];
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = color;
      ctx.beginPath();
      let started = false;
      let prev = null;
      const visibleSpan = size.h / view.scale;

      for (let px = 0; px <= size.w; px += 1) {
        const mathX = toMath(px, 0).x;
        let mathY;
        try {
          mathY = item.fn(mathX);
        } catch {
          started = false;
          prev = null;
          continue;
        }
        if (!Number.isFinite(mathY)) {
          started = false;
          prev = null;
          continue;
        }
        if (prev && Math.abs(mathY - prev.y) < visibleSpan) {
          if ((prev.y < 0 && mathY >= 0) || (prev.y > 0 && mathY <= 0)) {
            roots.push(prev.x + (mathX - prev.x) * (-prev.y) / (mathY - prev.y));
          }
        }
        const py = toPx(0, mathY).y;
        if (started && prev && Math.abs(py - prev.py) > size.h) started = false;
        prev = { x: mathX, y: mathY, py };
        if (py < -size.h * 2 || py > size.h * 3) {
          started = false;
          continue;
        }
        if (started) {
          ctx.lineTo(px, py);
        } else {
          ctx.moveTo(px, py);
          started = true;
        }
      }
      ctx.stroke();

      roots.forEach(rx => {
        const p = toPx(rx, 0);
        if (p.x < 0 || p.x > size.w || p.y < 0 || p.y > size.h) return;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isDark() ? '#0b0f18' : '#fff';
        ctx.stroke();
      });
      return roots;
    }

    function draw() {
      raf = 0;
      resize();
      ctx.clearRect(0, 0, size.w, size.h);
      drawGrid();
      const rootsByItem = items.map((item, i) => (item.fn ? drawCurve(item, COLORS[i % COLORS.length]) : []));
      if (onRoots) onRoots(rootsByItem[0] || [], items);
      if (onViewChange) onViewChange({ ...view });
    }

    function redraw() {
      if (!raf) raf = requestAnimationFrame(draw);
    }

    function setExpressions(source) {
      items = String(source || '')
        .split(';')
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 3)
        .map(src => ({ src, fn: parseExpr(src) }));
      redraw();
      return items.map(i => ({ src: i.src, ok: Boolean(i.fn) }));
    }

    function setView(next) {
      if (Number.isFinite(next.cx)) view.cx = next.cx;
      if (Number.isFinite(next.cy)) view.cy = next.cy;
      if (Number.isFinite(next.scale)) view.scale = clamp(next.scale, MIN_SCALE, MAX_SCALE);
      redraw();
    }

    // Приближение к точке: то, что под курсором, остаётся на месте
    function zoomAt(factor, px, py) {
      const before = toMath(px, py);
      view.scale = clamp(view.scale * factor, MIN_SCALE, MAX_SCALE);
      const after = toMath(px, py);
      view.cx += before.x - after.x;
      view.cy += before.y - after.y;
      redraw();
    }

    const localPoint = e => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const p = localPoint(e);
      const stepPerLine = e.deltaMode === 1 ? 0.05 : 0.0015;
      zoomAt(Math.exp(-e.deltaY * stepPerLine), p.x, p.y);
    }, { passive: false });

    canvas.addEventListener('pointerdown', e => {
      if (pinch) return;
      canvas.setPointerCapture(e.pointerId);
      const p = localPoint(e);
      dragging = { x: p.x, y: p.y, id: e.pointerId };
      canvas.classList.add('is-dragging');
    });

    canvas.addEventListener('pointermove', e => {
      const p = localPoint(e);
      if (dragging && dragging.id === e.pointerId) {
        view.cx -= (p.x - dragging.x) / view.scale;
        view.cy += (p.y - dragging.y) / view.scale;
        dragging.x = p.x;
        dragging.y = p.y;
        redraw();
        return;
      }
      if (onCoords) onCoords(toMath(p.x, p.y), items);
    });

    const endDrag = e => {
      if (dragging && dragging.id === e.pointerId) {
        dragging = null;
        canvas.classList.remove('is-dragging');
      }
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('pointerleave', () => {
      if (onCoords) onCoords(null, items);
    });

    // Щипок двумя пальцами: расстояние между ними — масштаб, середина — сдвиг
    const touchState = touches => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2 - rect.left,
        y: (touches[0].clientY + touches[1].clientY) / 2 - rect.top,
        d: Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)
      };
    };
    canvas.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        dragging = null;
        pinch = touchState(e.touches);
      }
    }, { passive: true });
    canvas.addEventListener('touchmove', e => {
      if (e.touches.length !== 2 || !pinch) return;
      e.preventDefault();
      const now = touchState(e.touches);
      if (pinch.d > 0) zoomAt(now.d / pinch.d, now.x, now.y);
      view.cx -= (now.x - pinch.x) / view.scale;
      view.cy += (now.y - pinch.y) / view.scale;
      pinch = now;
      redraw();
    }, { passive: false });
    canvas.addEventListener('touchend', e => {
      if (e.touches.length < 2) pinch = null;
    }, { passive: true });

    canvas.addEventListener('dblclick', () => setView({ cx: 0, cy: 0, scale: DEFAULT_SCALE }));

    canvas.addEventListener('keydown', e => {
      const shift = (e.shiftKey ? 120 : 40) / view.scale;
      if (e.key === 'ArrowLeft') view.cx -= shift;
      else if (e.key === 'ArrowRight') view.cx += shift;
      else if (e.key === 'ArrowUp') view.cy += shift;
      else if (e.key === 'ArrowDown') view.cy -= shift;
      else if (e.key === '+' || e.key === '=') zoomAt(1.25, size.w / 2, size.h / 2);
      else if (e.key === '-' || e.key === '_') zoomAt(1 / 1.25, size.w / 2, size.h / 2);
      else if (e.key === '0') setView({ cx: 0, cy: 0, scale: DEFAULT_SCALE });
      else return;
      e.preventDefault();
      redraw();
    });

    if (typeof ResizeObserver === 'function' && canvas.parentElement) {
      new ResizeObserver(redraw).observe(canvas.parentElement);
    }
    window.addEventListener('resize', redraw);

    return {
      setExpressions,
      setView,
      getView: () => ({ ...view }),
      getItems: () => items.map(i => ({ src: i.src, ok: Boolean(i.fn) })),
      valueAt: x => items.map(item => {
        if (!item.fn) return null;
        try {
          const y = item.fn(x);
          return Number.isFinite(y) ? y : null;
        } catch {
          return null;
        }
      }),
      zoomBy: factor => zoomAt(factor, size.w / 2, size.h / 2),
      reset: () => setView({ cx: 0, cy: 0, scale: DEFAULT_SCALE }),
      redraw,
      colors: COLORS
    };
  }

  const api = { parseExpr, createPlotter, niceStep, formatTick, COLORS, DEFAULT_SCALE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof globalThis !== 'undefined') globalThis.MathPlotter = api;
})();
