// 9 класс: подобие, средняя линия, пропорциональные отрезки, пирамида, окружность и касательная к ней
import { Fig, add, sub, mul, lerp, mid, dist, unit, polar, foot, inter, proj, rot, dot, circumcircle } from './figlib.mjs';

/** Пара подобных треугольников: малый и большой, k — коэффициент. Дуги равных углов: n1, n2, n3. */
const simPair = (labels = null, k = 2, equilateral = false) => {
  const t = equilateral ? [[0, 0], [3, 0], [1.5, 2.6]] : [[0, 0], [3, 0], [1.1, 2.2]];
  const off = 5.4;
  const u = t.map(p => [off + p[0] * k, p[1] * k]);
  const f = new Fig().poly(t).poly(u);
  [t, u].forEach(T => T.forEach((v, i) => f.arcAng(v, T[(i + 1) % 3], T[(i + 2) % 3], 18, i + 1)));
  if (labels) {
    const [a, b, c, a1, b1, c1] = labels;
    f.lab(a, t[0], { dir: [-1, -1] }).lab(b, t[1], { dir: [1, -1] }).lab(c, t[2], { dir: [0, 1] })
      .lab(a1, u[0], { dir: [-1, -1] }).lab(b1, u[1], { dir: [1, -1] }).lab(c1, u[2], { dir: [0, 1] });
  }
  return f;
};

/** Треугольник ABC с вершиной B сверху. */
const triTop = () => ({ A: [0, 0], C: [10, 0], B: [3.6, 6.2] });

export default {
  // ── подобные треугольники ──
  10: () => simPair(null, 1.67),
  62: () => simPair(['A', 'B', 'C', 'A₁', 'B₁', 'C₁'], 2.5),
  207: () => simPair(['A', 'B', 'C', 'K', 'L', 'M'], 2.5),
  208: () => simPair(null, 4),
  209: () => simPair(['A', 'B', 'C', 'A₁', 'B₁', 'C₁'], 1.7),
  212: () => simPair(null, 1.67),
  213: () => simPair(null, 1.5),
  217: () => simPair(null, 2.4),
  220: () => simPair(null, 2.3, true),
  221: () => simPair(null, 2),
  228: () => simPair(null, 1.5),
  237: () => simPair(null, 3),

  // ── теорема Фалеса, средняя линия ──
  210: () => {
    const { A, B, C } = triTop();
    const D = lerp(B, A, 1 / 3), E = lerp(B, C, 1 / 3);
    return new Fig().poly([A, B, C]).line(D, E).dotAt(D).dotAt(E)
      .lab('A', A, { dir: [-1, -1] }).lab('B', B, { dir: [0, 1] }).lab('C', C, { dir: [1, -1] })
      .lab('D', D, { dir: [-1, 0] }).lab('E', E, { dir: [1, 0] });
  },
  216: () => {
    const { A, B, C } = triTop(); const M = mid(A, B), N = mid(B, C);
    return new Fig().poly([B, M, N], { fill: true }).poly([A, B, C]).line(M, N)
      .lab('A', A, { dir: [-1, -1] }).lab('B', B, { dir: [0, 1] }).lab('C', C, { dir: [1, -1] });
  },
  218: () => {
    const { A, B, C } = triTop(); const M = lerp(B, A, 0.4), N = lerp(B, C, 0.4);
    return new Fig().poly([A, B, C]).line(M, N).dotAt(M).dotAt(N)
      .lab('A', A, { dir: [-1, -1] }).lab('B', B, { dir: [0, 1] }).lab('C', C, { dir: [1, -1] })
      .lab('M', M, { dir: [-1, 0] }).lab('N', N, { dir: [1, 0] });
  },
  219: () => {
    const { A, B, C } = triTop(); const M = mid(A, B), N = mid(B, C), K = mid(A, C);
    return new Fig().poly([A, B, C]).poly([M, N, K])
      .lab('A', A, { dir: [-1, -1] }).lab('B', B, { dir: [0, 1] }).lab('C', C, { dir: [1, -1] });
  },
  255: () => {
    const { A, B, C } = triTop(); const M = lerp(B, A, 1 / 3), N = lerp(B, C, 1 / 3);
    const H = [B[0], 0];
    return new Fig().poly([A, B, C]).line(M, N).line(B, H, { dash: true }).right(H, C, B).dotAt(M).dotAt(N)
      .lab('A', A, { dir: [-1, -1] }).lab('B', B, { dir: [0, 1] }).lab('C', C, { dir: [1, -1] })
      .lab('M', M, { dir: [-1, 0] }).lab('N', N, { dir: [1, 0] });
  },
  247: () => {
    const { A, B, C } = triTop(); const t = Math.SQRT1_2;
    const P = lerp(B, A, t), Q = lerp(B, C, t);
    return new Fig().poly([A, B, C]).line(P, Q, { dash: false }).dotAt(P).dotAt(Q)
      .lab('A', A, { dir: [-1, -1] }).lab('C', C, { dir: [1, -1] });
  },
  232: () => {
    const { A, B, C } = triTop(); const M = mid(A, C);
    return new Fig().poly([A, B, C]).line(B, M).dotAt(M)
      .lab('A', A, { dir: [-1, -1] }).lab('B', B, { dir: [0, 1] }).lab('C', C, { dir: [1, -1] }).lab('M', M, { dir: [0, -1] });
  },

  // ── пропорциональные отрезки ──
  223: () => {
    const A = [0, 0], C = [10, 0], B = [2.75, Math.sqrt(36 - 2.75 * 2.75)], D = [4, 0];
    return new Fig().poly([A, B, C]).line(B, D).dotAt(D).arcAng(B, A, D, 24).arcAng(B, D, C, 24)
      .lab('A', A, { dir: [-1, -1] }).lab('B', B, { dir: [0, 1] }).lab('C', C, { dir: [1, -1] }).lab('D', D, { dir: [0, -1] });
  },
  229: () => {
    const O = [0, 0];
    const A = polar(O, 8, 15), B = polar(O, 20, 15), C = polar(O, 10, 55), D = polar(O, 25, 55);
    return new Fig().line(O, B).line(O, D).line(A, C).line(B, D).dotAt(A).dotAt(B).dotAt(C).dotAt(D)
      .setCenter([6, 6])
      .lab('O', O, { dir: [-1, -1] }).lab('A', A, { dir: [0, -1] }).lab('B', B, { dir: [0, -1] })
      .lab('C', C, { dir: [-1, 0] }).lab('D', D, { dir: [-1, 0] });
  },
  2045: () => {
    const O = [0, 0], k = 1.35, dists = [5, 9, 15];
    const f = new Fig().line(O, polar(O, 17, 10)).line(O, polar(O, 17 * k, 60));
    dists.forEach(d => f.line(polar(O, d, 10), polar(O, d * k, 60)).dotAt(polar(O, d, 10)).dotAt(polar(O, d * k, 60)));
    return f;
  },
  211: () => {
    // столб и человек: два подобных прямоугольных треугольника «предмет — тень — луч»
    const f = new Fig();
    f.line([-1, 0], [11.5, 0]);
    f.line([0, 0], [0, 6]).line([0, 6], [6, 0]).right([0, 0], [1, 0], [0, 1]);
    f.line([8, 0], [8, 2]).line([8, 2], [10, 0]).right([8, 0], [9, 0], [8, 1]);
    return f;
  },

  // ── прямоугольный треугольник с высотой на гипотенузу ──
  225: () => {
    const A = [0, 0], B = [25, 0], C = [9, 12], H = [9, 0];
    return new Fig().poly([A, B, C]).line(C, H, { dash: true }).right(C, A, B).right(H, B, C);
  },
  236: () => {
    const A = [0, 0], B = [17, 0], C = [1, 4], H = [1, 0];
    return new Fig().poly([A, B, C]).line(C, H, { dash: true }).right(C, A, B).right(H, B, C);
  },
  244: () => {
    const A = [0, 0], C = [10, 0], B = [4, 6];
    const B1 = [4, 0], A1 = foot(A, B, C), H = inter(A, A1, B, B1);
    return new Fig().poly([A, B, C]).line(A, A1, { dash: true }).line(B, B1, { dash: true })
      .right(B1, C, B).right(A1, C, A).dotAt(H)
      .lab('A', A, { dir: [-1, -1] }).lab('B', B, { dir: [0, 1] }).lab('C', C, { dir: [1, -1] })
      .lab('A₁', A1, { dir: [1, 1] }).lab('B₁', B1, { dir: [0, -1] }).lab('H', H, { dir: [-1, 1] });
  },

  // ── окружность, описанная около треугольника, и касательная ──
  253: () => {
    const O = [0, 0], r = 4;
    const B = polar(O, r, 100), A = polar(O, r, 215), C = polar(O, r, -30);
    const radial = unit(sub(B, O));
    let tdir = rot(radial, 90);
    if (dot(tdir, sub(A, B)) < 0) tdir = mul(tdir, -1);
    const T1 = add(B, mul(tdir, 3)), T2 = add(B, mul(tdir, -3));
    return new Fig().circ(O, r).poly([A, B, C]).line(T1, T2).setCenter(O)
      .arcAng(B, T1, A, 20).arcAng(C, A, B, 20)
      .lab('A', A).lab('B', B, { dir: [0, 1] }).lab('C', C);
  },

  // ── пирамида с сечением, параллельным основанию ──
  233: () => {
    const b = [[0, 0], [6, 0], [6, 6], [0, 6]].map(p => proj(p[0], p[1], 0));
    const T = proj(3, 3, 7.5);
    const s = b.map(p => lerp(T, p, 0.5));
    const f = new Fig({ pad: 30 });
    // основание: невидимы дальние и левые рёбра
    f.line(b[0], b[1]).line(b[1], b[2]).line(b[2], b[3], { dash: true }).line(b[3], b[0], { dash: true });
    // боковые рёбра (к b[3] — невидимое)
    f.line(T, b[0]).line(T, b[1]).line(T, b[2]).line(T, b[3], { dash: true });
    // сечение
    f.line(s[0], s[1]).line(s[1], s[2]).line(s[2], s[3], { dash: true }).line(s[3], s[0], { dash: true });
    return f;
  }
};
