// Библиотека схематичных чертежей для задач MathTasks.
// Правила проекта (lib.drawingIssues): на геометрическом чертеже подписаны только вершины
// заглавными латинскими буквами, никаких чисел, единиц, «?», строчных подписей.
// Модельные координаты: x вправо, y вверх. На выходе — одна строка SVG с одинарными кавычками.

const r1 = n => Math.round(n * 10) / 10;

/* ── векторы ── */
export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const mul = (a, k) => [a[0] * k, a[1] * k];
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const mid = (a, b) => lerp(a, b, 0.5);
export const len = a => Math.hypot(a[0], a[1]);
export const dist = (a, b) => len(sub(a, b));
export const unit = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
export const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
export const rad = deg => deg * Math.PI / 180;
export const polar = (c, r, deg) => [c[0] + r * Math.cos(rad(deg)), c[1] + r * Math.sin(rad(deg))];
export const rot = (a, deg) => { const c = Math.cos(rad(deg)), s = Math.sin(rad(deg)); return [a[0] * c - a[1] * s, a[0] * s + a[1] * c]; };
/** Основание перпендикуляра из p на прямую ab. */
export const foot = (p, a, b) => { const d = sub(b, a); const t = dot(sub(p, a), d) / dot(d, d); return add(a, mul(d, t)); };
/** Пересечение прямых p1p2 и p3p4. */
export const inter = (p1, p2, p3, p4) => {
  const d1 = sub(p2, p1), d2 = sub(p4, p3);
  const den = cross(d1, d2);
  const t = cross(sub(p3, p1), d2) / den;
  return add(p1, mul(d1, t));
};
export const centroid = pts => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
/** Описанная окружность треугольника. */
export const circumcircle = (A, B, C) => {
  const ax = A[0], ay = A[1], bx = B[0], by = B[1], cx = C[0], cy = C[1];
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  return { c: [ux, uy], r: Math.hypot(ax - ux, ay - uy) };
};
/** Вписанная окружность треугольника и точки касания (на сторонах BC, CA, AB). */
export const incircle = (A, B, C) => {
  const a = dist(B, C), b = dist(C, A), c = dist(A, B);
  const p = a + b + c;
  const I = [(a * A[0] + b * B[0] + c * C[0]) / p, (a * A[1] + b * B[1] + c * C[1]) / p];
  const area = Math.abs(cross(sub(B, A), sub(C, A))) / 2;
  return { c: I, r: 2 * area / p, touch: [foot(I, B, C), foot(I, C, A), foot(I, A, B)] };
};
/** Правильный n-угольник с центром c и радиусом описанной окружности r; первая вершина под углом a0. */
export const regular = (n, c, r, a0 = 90) => Array.from({ length: n }, (_, i) => polar(c, r, a0 + 360 * i / n));

export class Fig {
  constructor({ W = 400, H = 260, pad = 38 } = {}) {
    this.W = W; this.H = H; this.pad = pad;
    this.items = [];
    this.center = null;
  }
  poly(pts, { fill = false, dash = false } = {}) { this.items.push({ k: 'poly', pts, fill, dash }); return this; }
  pline(pts, { dash = false } = {}) { this.items.push({ k: 'pline', pts, dash }); return this; }
  line(a, b, { dash = false } = {}) { this.items.push({ k: 'line', a, b, dash }); return this; }
  circ(c, r, { dash = false, fill = false } = {}) { this.items.push({ k: 'circ', c, r, dash, fill }); return this; }
  ell(c, rx, ry, { dash = false } = {}) { this.items.push({ k: 'ell', c, rx, ry, dash }); return this; }
  /** Дуга эллипса от угла a0 до a1 (градусы, против часовой стрелки в модельных координатах). */
  earc(c, rx, ry, a0, a1, { dash = false } = {}) { this.items.push({ k: 'earc', c, rx, ry, a0, a1, dash }); return this; }
  dotAt(p) { this.items.push({ k: 'dot', p }); return this; }
  /** Прямой угол при вершине v между лучами на p1 и p2. */
  right(v, p1, p2, s = 11) { this.items.push({ k: 'right', v, p1, p2, s }); return this; }
  /** Дуга угла при вершине v между лучами на p1 и p2; n — число дуг. */
  arcAng(v, p1, p2, r = 22, n = 1) { this.items.push({ k: 'arcang', v, p1, p2, r, n }); return this; }
  /** Отметка равных отрезков: n чёрточек на отрезке ab. */
  tick(a, b, n = 1) { this.items.push({ k: 'tick', a, b, n }); return this; }
  /** Подпись вершины; dir — направление в модельных координатах, иначе от центра фигуры. */
  lab(text, p, { dir = null, off = 15 } = {}) { this.items.push({ k: 'lab', text, p, dir, off }); return this; }
  /** Подписать вершины многоугольника буквами по порядку. */
  labs(letters, pts, opts = {}) { [...letters].forEach((ch, i) => { if (ch !== '_') this.lab(ch, pts[i], opts); }); return this; }
  setCenter(p) { this.center = p; return this; }

  render() {
    const xs = [], ys = [];
    const P = p => { xs.push(p[0]); ys.push(p[1]); };
    const polyPts = [];
    for (const it of this.items) {
      if (it.k === 'poly' || it.k === 'pline') { it.pts.forEach(P); if (it.k === 'poly') polyPts.push(...it.pts); }
      else if (it.k === 'line') { P(it.a); P(it.b); }
      else if (it.k === 'circ') { P([it.c[0] - it.r, it.c[1] - it.r]); P([it.c[0] + it.r, it.c[1] + it.r]); }
      else if (it.k === 'ell' || it.k === 'earc') { P([it.c[0] - it.rx, it.c[1] - it.ry]); P([it.c[0] + it.rx, it.c[1] + it.ry]); }
      else if (it.k === 'dot') P(it.p);
    }
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const bw = Math.max(maxx - minx, 1e-6), bh = Math.max(maxy - miny, 1e-6);
    const s = Math.min((this.W - 2 * this.pad) / bw, (this.H - 2 * this.pad) / bh);
    const ox = (this.W - bw * s) / 2, oy = (this.H - bh * s) / 2;
    const X = x => ox + (x - minx) * s;
    const Y = y => oy + (maxy - y) * s;
    const T = p => [X(p[0]), Y(p[1])];
    const fmt = p => `${r1(p[0])},${r1(p[1])}`;
    const cen = this.center || centroid(polyPts.length ? polyPts : [[minx, miny], [maxx, maxy]]);
    const lines = [], texts = [];
    const dashAttr = d => d ? " stroke-dasharray='5 4'" : '';
    for (const it of this.items) {
      switch (it.k) {
        case 'poly':
          lines.push(`<polygon points='${it.pts.map(p => fmt(T(p))).join(' ')}'${it.fill ? " fill='#000' fill-opacity='0.12'" : ''}${dashAttr(it.dash)}/>`);
          break;
        case 'pline':
          lines.push(`<polyline points='${it.pts.map(p => fmt(T(p))).join(' ')}'${dashAttr(it.dash)}/>`);
          break;
        case 'line': {
          const a = T(it.a), b = T(it.b);
          lines.push(`<line x1='${r1(a[0])}' y1='${r1(a[1])}' x2='${r1(b[0])}' y2='${r1(b[1])}'${dashAttr(it.dash)}/>`);
          break;
        }
        case 'circ': {
          const c = T(it.c);
          lines.push(`<circle cx='${r1(c[0])}' cy='${r1(c[1])}' r='${r1(it.r * s)}'${it.fill ? " fill='#000' fill-opacity='0.12'" : ''}${dashAttr(it.dash)}/>`);
          break;
        }
        case 'ell': {
          const c = T(it.c);
          lines.push(`<ellipse cx='${r1(c[0])}' cy='${r1(c[1])}' rx='${r1(it.rx * s)}' ry='${r1(it.ry * s)}'${dashAttr(it.dash)}/>`);
          break;
        }
        case 'earc': {
          const pa = T([it.c[0] + it.rx * Math.cos(rad(it.a0)), it.c[1] + it.ry * Math.sin(rad(it.a0))]);
          const pb = T([it.c[0] + it.rx * Math.cos(rad(it.a1)), it.c[1] + it.ry * Math.sin(rad(it.a1))]);
          const large = Math.abs(it.a1 - it.a0) > 180 ? 1 : 0;
          const sweep = it.a1 > it.a0 ? 0 : 1;
          lines.push(`<path d='M ${fmt(pa)} A ${r1(it.rx * s)} ${r1(it.ry * s)} 0 ${large} ${sweep} ${fmt(pb)}'${dashAttr(it.dash)}/>`);
          break;
        }
        case 'dot': {
          const c = T(it.p);
          lines.push(`<circle cx='${r1(c[0])}' cy='${r1(c[1])}' r='2.8' fill='#000' stroke='none'/>`);
          break;
        }
        case 'right': {
          const v = T(it.v);
          const u1 = unit(sub(T(it.p1), v)), u2 = unit(sub(T(it.p2), v));
          const a = add(v, mul(u1, it.s)), b = add(a, mul(u2, it.s)), c = add(v, mul(u2, it.s));
          lines.push(`<polyline points='${fmt(a)} ${fmt(b)} ${fmt(c)}'/>`);
          break;
        }
        case 'arcang': {
          const v = T(it.v);
          const u1 = unit(sub(T(it.p1), v)), u2 = unit(sub(T(it.p2), v));
          const sweep = cross(u1, u2) > 0 ? 1 : 0;
          for (let i = 0; i < it.n; i++) {
            const r = it.r + 5 * i;
            const a = add(v, mul(u1, r)), b = add(v, mul(u2, r));
            lines.push(`<path d='M ${fmt(a)} A ${r} ${r} 0 0 ${sweep} ${fmt(b)}'/>`);
          }
          break;
        }
        case 'tick': {
          const a = T(it.a), b = T(it.b);
          const m = mid(a, b), t = unit(sub(b, a)), n = [-t[1], t[0]];
          for (let i = 0; i < it.n; i++) {
            const off = (i - (it.n - 1) / 2) * 5;
            const c = add(m, mul(t, off));
            const p = add(c, mul(n, 5)), q = add(c, mul(n, -5));
            lines.push(`<line x1='${r1(p[0])}' y1='${r1(p[1])}' x2='${r1(q[0])}' y2='${r1(q[1])}'/>`);
          }
          break;
        }
        case 'lab': {
          const pt = T(it.p);
          let d;
          if (it.dir) d = unit([it.dir[0], -it.dir[1]]);
          else {
            d = unit(sub(pt, T(cen)));
            if (len(sub(pt, T(cen))) < 1) d = unit([0.7, -0.7]);
          }
          const x = pt[0] + d[0] * it.off, y = pt[1] + d[1] * it.off;
          texts.push(`<text x='${r1(x)}' y='${r1(y)}' dy='.35em'>${it.text}</text>`);
          break;
        }
        default: throw new Error('неизвестный элемент ' + it.k);
      }
    }
    return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${this.W} ${this.H}'>`
      + `<g stroke='#000' stroke-width='2' fill='none' stroke-linejoin='round' stroke-linecap='round'>${lines.join('')}</g>`
      + (texts.length ? `<g fill='#000' font-family='system-ui, sans-serif' font-size='15' text-anchor='middle'>${texts.join('')}</g>` : '')
      + `</svg>`;
  }
}

/* ── объёмные тела в косоугольной проекции ── */
const KX = 0.5, KY = 0.32;
/** Проекция точки основания (x, глубина y) и высоты z. */
export const proj = (x, y, z = 0) => [x + KX * y, KY * y + z];

/** Прямая призма с выпуклым основанием base (список [x,y] против часовой стрелки при взгляде сверху), высота h. */
export function prism(base, h, { diag = null, labelsBottom = null } = {}) {
  const f = new Fig({ pad: 30 });
  const n = base.length;
  const bot = base.map(p => proj(p[0], p[1], 0));
  const top = base.map(p => proj(p[0], p[1], h));
  const visSide = i => {
    const a = base[i], b = base[(i + 1) % n];
    const e = sub(b, a);
    const nrm = unit([e[1], -e[0]]);              // внешняя нормаль при обходе против часовой стрелки
    return nrm[1] - KX * nrm[0] < -1e-9;          // n·w < 0, w = (−KX, 1)
  };
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    f.line(bot[i], bot[j], { dash: !visSide(i) });
    f.line(top[i], top[j]);
    const hidden = !visSide((i + n - 1) % n) && !visSide(i);
    f.line(bot[i], top[i], { dash: hidden });
  }
  if (diag) f.line(diag[0] === 'b' ? bot[diag[1]] : top[diag[1]], diag[2] === 'b' ? bot[diag[3]] : top[diag[3]], { dash: true });
  return f;
}

/** Добавить на рисунок прямой круговой цилиндр (радиус r, высота h, вид сбоку); level — уровень жидкости. */
export function addCylinder(f, r, h, { center = [0, 0], radius = false, axis = false, section = false, level = null } = {}) {
  const ry = 0.3 * r;
  const c0 = center, c1 = [center[0], center[1] + h];
  if (section) f.poly([[c0[0] - r, c0[1]], [c0[0] + r, c0[1]], [c1[0] + r, c1[1]], [c1[0] - r, c1[1]]], { fill: true });
  f.ell(c1, r, ry);
  f.earc(c0, r, ry, 180, 360);
  f.earc(c0, r, ry, 180, 0, { dash: true });
  f.line([c0[0] - r, c0[1]], [c1[0] - r, c1[1]]);
  f.line([c0[0] + r, c0[1]], [c1[0] + r, c1[1]]);
  if (radius) f.line(c1, [c1[0] + r, c1[1]], { dash: true });
  if (axis) f.line(c0, c1, { dash: true });
  if (level !== null) f.ell([c0[0], c0[1] + level], r, ry, { dash: true });
  return f;
}

/** Прямой круговой цилиндр отдельным рисунком. */
export function cylinder(r, h, opts = {}) {
  return addCylinder(new Fig({ pad: 26 }), r, h, opts);
}
