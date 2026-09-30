// 8 класс: параллельные прямые, четырёхугольники, параллелограммы, ромбы и прямоугольники
import { Fig, add, sub, mul, lerp, mid, dist, unit, polar, foot, inter, centroid } from './figlib.mjs';

/** Параллелограмм: A внизу слева, D внизу справа, B сверху слева (угол при A = ang), C = B + AD. */
const para = (a, b, ang) => { const A = [0, 0], D = [a, 0], B = polar(A, b, ang); return { A, B, C: add(B, D), D }; };

/** Две параллельные прямые и секущая под углом 65°. */
const parallels = () => {
  const P = [0, 0], dx = 3 / Math.tan(65 * Math.PI / 180), Q = [dx, 3];
  const dir = unit(sub(Q, P));
  return { P, Q, dir, f: new Fig().line([-3.2, 0], [5.4, 0]).line([-3.2 + dx, 3], [5.4 + dx, 3]).line(add(P, mul(dir, -1.4)), add(Q, mul(dir, 1.4))) };
};

const quad = () => [[0, 0], [9, 0], [7.2, 6], [1.2, 5]];

export default {
  // ── параллельные прямые ──
  2252: () => { const { P, Q, f } = parallels(); return f.arcAng(P, add(P, [1, 0]), Q, 26).arcAng(Q, add(Q, [1, 0]), P, 26); },
  2253: () => { const { P, Q, dir, f } = parallels(); return f.arcAng(P, add(P, [1, 0]), Q, 26).arcAng(Q, add(Q, [1, 0]), add(Q, mul(dir, 1)), 26); },
  2254: () => { const { P, f } = parallels(); const Q = [1.4, 3]; return f.arcAng(P, add(P, [1, 0]), Q, 26, 1).arcAng(P, Q, add(P, [-1, 0]), 26, 2); },
  2255: () => { const { P, Q, f } = parallels(); return f.arcAng(P, add(P, [1, 0]), Q, 26).arcAng(Q, add(Q, [1, 0]), P, 26); },
  2257: () => {
    const { P, Q, f } = parallels();
    const R = inter(P, polar(P, 1, 32.5), Q, polar(Q, 1, -57.5));
    return f.line(P, R, { dash: true }).line(Q, R, { dash: true }).right(R, P, Q).arcAng(P, add(P, [1, 0]), R, 28).arcAng(Q, add(Q, [1, 0]), R, 28);
  },
  2256: () => {
    const B = [0, 0], C = [9, 0], A = polar(B, 6, 70);
    const D = inter(B, polar(B, 1, 35), A, C);
    const E = inter(A, B, D, add(D, [1, 0]));
    return new Fig().poly([A, B, C]).line(B, D, { dash: true }).line(D, E).dotAt(D).dotAt(E)
      .arcAng(B, C, D, 26).arcAng(B, D, A, 26)
      .lab('A', A, { dir: [0, 1] }).lab('B', B, { dir: [-1, -1] }).lab('C', C, { dir: [1, -1] })
      .lab('D', D, { dir: [1, 1] }).lab('E', E, { dir: [-1, 0] });
  },

  // ── четырёхугольники ──
  2258: () => { const q = quad(); const f = new Fig().poly(q); q.forEach((v, i) => f.arcAng(v, q[(i + 1) % 4], q[(i + 3) % 4], 20)); return f; },
  2259: () => { const q = [[0, 0], [9, 0.5], [6.5, 6], [0.8, 4]]; const f = new Fig().poly(q); q.forEach((v, i) => f.arcAng(v, q[(i + 1) % 4], q[(i + 3) % 4], 20)); return f; },
  2260: () => { const q = quad(); return new Fig().poly(q); },
  2261: () => { const q = [[0, 0], [8, 0], [6, 5.5], [1, 4]]; return new Fig().poly(q); },
  2262: () => {
    const q = quad(); const f = new Fig().poly(q);
    q.forEach((v, i) => {
      const prev = q[(i + 3) % 4], next = q[(i + 1) % 4];
      const e = add(v, mul(unit(sub(v, prev)), 1.6));
      f.line(v, e);
      f.arcAng(v, e, next, 20);
    });
    return f;
  },
  2263: () => {
    const A = [-4, 0], B = [1, 4], C = [6, 0], D = [1, -3], O = [1, 0];
    return new Fig().poly([A, B, C, D]).line(A, C, { dash: true }).line(B, D, { dash: true }).right(O, C, B);
  },

  // ── параллелограмм ──
  56: () => {
    const { A, B, C, D } = para(9, 5, 70);
    return new Fig().poly([A, B, C, D]).arcAng(A, D, B, 22).arcAng(B, A, C, 22, 2)
      .lab('A', A).lab('B', B).lab('C', C).lab('D', D);
  },
  2264: () => { const { A, B, C, D } = para(9, 5, 62); return new Fig().poly([A, B, C, D]).tick(A, D, 1).tick(B, C, 1).tick(A, B, 2).tick(C, D, 2); },
  2265: () => { const { A, B, C, D } = para(10, 5.5, 55); return new Fig().poly([A, B, C, D]).tick(A, D, 1).tick(B, C, 1).tick(A, B, 2).tick(C, D, 2); },
  2266: () => {
    const { A, B, C, D } = para(10, 5.5, 58); const O = mid(A, C);
    return new Fig().poly([A, D, O], { fill: true }).poly([A, B, C, D]).line(A, C, { dash: true }).line(B, D, { dash: true }).dotAt(O);
  },
  2267: () => {
    const { A, B, C, D } = para(9, 7, 110);
    return new Fig().poly([A, B, C, D]).line(B, D, { dash: true })
      .arcAng(B, A, D, 22, 1).arcAng(B, D, C, 22, 2)
      .lab('A', A, { dir: [-1, -1] }).lab('B', B, { dir: [-1, 1] }).lab('C', C, { dir: [1, 1] }).lab('D', D, { dir: [1, -1] });
  },
  2268: () => {
    const A = [0, 0], D = [14, 0], B = [3.5, 6.06], C = [17.5, 6.06], M = [10.5, 6.06];
    return new Fig().poly([A, B, C, D]).line(A, M, { dash: true }).line(D, M, { dash: true }).dotAt(M)
      .arcAng(A, D, M, 26).arcAng(A, M, B, 26).arcAng(D, A, M, 26).arcAng(D, M, C, 26)
      .lab('A', A, { dir: [-1, -1] }).lab('B', B, { dir: [-1, 1] }).lab('C', C, { dir: [1, 1] }).lab('D', D, { dir: [1, -1] }).lab('M', M, { dir: [0, 1] });
  },

  // ── площадь параллелограмма ──
  2275: () => { const { A, B, C, D } = para(9, 5, 65); const H = [B[0], 0]; return new Fig().poly([A, B, C, D]).line(B, H, { dash: true }).right(H, D, B); },
  2276: () => { const { A, B, C, D } = para(10, 5.5, 60); const H = [B[0], 0]; return new Fig().poly([A, B, C, D]).line(B, H, { dash: true }).right(H, D, B); },
  2277: () => {
    const ang = 36.87, { A, B, C, D } = para(15, 10, ang);
    const H = [B[0], 0], F = foot(D, A, B);
    return new Fig().poly([A, B, C, D]).line(B, H, { dash: true }).right(H, D, B)
      .line(B, F, { dash: true }).line(D, F, { dash: true }).right(F, D, B);
  },
  2278: () => { const { A, B, C, D } = para(12, 8, 30); return new Fig().poly([A, B, C, D]).arcAng(A, D, B, 26); },
  2279: () => { const { A, B, C, D } = para(10, 6 * Math.SQRT2, 45); return new Fig().poly([A, B, C, D]).arcAng(A, D, B, 26); },
  2280: () => {
    const A = [0, 0], B = [6, 0], C = [12, 9], D = [6, 9];
    return new Fig().poly([A, B, C, D]).line(B, D, { dash: true }).right(B, A, D)
      .lab('A', A, { dir: [-1, -1] }).lab('B', B, { dir: [1, -1] }).lab('C', C, { dir: [1, 1] }).lab('D', D, { dir: [-1, 1] });
  },
  2281: () => {
    const ang = 41.8, { A, B, C, D } = para(9, 6, ang);
    const H = [B[0], 0], F = foot(D, A, B);
    return new Fig().poly([A, B, C, D]).line(B, H, { dash: true }).right(H, D, B)
      .line(B, F, { dash: true }).line(D, F, { dash: true }).right(F, D, B);
  },

  // ── виды параллелограммов ──
  2269: () => { const P = [[-4, 0], [0, -3], [4, 0], [0, 3]]; return new Fig().poly(P).tick(P[0], P[1], 1).tick(P[1], P[2], 1).tick(P[2], P[3], 1).tick(P[3], P[0], 1); },
  2270: () => { const A = [0, 0], B = [12, 0], C = [12, 5], D = [0, 5]; return new Fig().poly([A, B, C, D]).line(A, C, { dash: true }).right(A, B, D).right(B, C, A).right(C, D, B).right(D, A, C); },
  2271: () => {
    const w = 10.39, h = 6, A = [0, 0], B = [w, 0], C = [w, h], D = [0, h], O = [w / 2, h / 2];
    return new Fig().poly([A, B, C, D]).line(A, C, { dash: true }).line(B, D, { dash: true }).arcAng(O, D, A, 22);
  },
  2272: () => {
    const A = [0, 0], B = [8, 0], D = polar(A, 8, 60), C = add(B, D);
    return new Fig().poly([A, B, C, D]).line(B, D, { dash: true }).arcAng(A, B, D, 26);
  },
  2273: () => { const A = [0, 0], B = [8, 0], C = [8, 8], D = [0, 8]; return new Fig().poly([A, B, C, D]).line(A, C, { dash: true }); },
  2274: () => {
    const A = [0, 0], D = [8, 0], C = [8, 3], B = [0, 3], K = [3, 3];
    return new Fig().poly([A, D, C, B]).line(A, K, { dash: true }).dotAt(K).arcAng(A, D, K, 26).arcAng(A, K, B, 26);
  },
  2351: () => { const A = [0, 0], B = [15, 0], C = [15, 8], D = [0, 8]; return new Fig().poly([A, B, C, D]).line(A, C, { dash: true }).right(B, C, A); },
  2355: () => {
    const P = [[-12, 0], [0, -5], [12, 0], [0, 5]];
    return new Fig().poly(P).line(P[0], P[2], { dash: true }).line(P[1], P[3], { dash: true }).right([0, 0], P[2], P[3]);
  },

  // ── бытовой сюжет: лестница у стены ──
  2354: () => {
    const G = [0, 0], W = [0, 6], L = [2.5, 0];
    return new Fig().line([-1.5, 0], [4.5, 0]).line([0, 0], [0, 7]).line(L, W).right(G, L, W);
  }
};
