// 8 класс: треугольники, площади, прямоугольные треугольники
import { Fig, add, sub, mul, lerp, mid, dist, unit, polar, foot, inter, foot as ft, centroid, circumcircle, incircle } from './figlib.mjs';

const rt = (legX, legY) => { const C = [0, 0], B = [legX, 0], A = [0, legY]; return { C, B, A }; };

export default {
  // ── прямоугольные треугольники ──
  29: () => { const { A, B, C } = rt(12, 5); return new Fig().poly([A, B, C]).right(C, B, A); },
  2335: () => { const { A, B, C } = rt(8, 6); return new Fig().poly([A, B, C]).right(C, B, A).arcAng(B, C, A, 26); },
  2336: () => { const C = [0, 0], B = [10.4, 0], A = [0, 6]; return new Fig().poly([A, B, C]).right(C, B, A).arcAng(B, C, A, 30); },
  2337: () => { const { A, B, C } = rt(12, 5); const M = mid(A, B); return new Fig().poly([A, B, C]).right(C, B, A).line(C, M, { dash: true }).dotAt(M); },
  2338: () => { const C = [0, 0], B = [8, 0], A = [0, 8 * Math.tan(36 * Math.PI / 180)]; return new Fig().poly([A, B, C]).right(C, B, A).arcAng(B, C, A, 26).arcAng(A, C, B, 26); },
  2339: () => {
    const A = [0, 0], B = [10, 0], k = Math.cos(25 * Math.PI / 180);
    const C = [10 * k * k, 10 * k * Math.sin(25 * Math.PI / 180)];
    const H = [C[0], 0], M = [5, 0];
    return new Fig().poly([A, B, C]).line(C, H, { dash: true }).line(C, M, { dash: true })
      .right(C, A, B).right(H, C, A).arcAng(A, B, C, 30).dotAt(M)
      .lab('A', A).lab('B', B).lab('C', C).lab('H', H, { dir: [0, -1] }).lab('M', M, { dir: [0, -1] });
  },
  2340: () => {
    const A = [0, 0], B = [10, 0], k = Math.cos(30 * Math.PI / 180);
    const C = [10 * k * k, 10 * k * 0.5];
    const H = [C[0], 0];
    return new Fig().poly([A, B, C]).line(C, H, { dash: true })
      .right(C, A, B).right(H, C, A).arcAng(A, B, C, 30)
      .lab('A', A).lab('B', B).lab('C', C).lab('H', H, { dir: [0, -1] });
  },
  2341: () => {
    const t = o => [[o, 0], [o + 4, 0], [o, 3]];
    const a = t(0), b = t(6.5);
    return new Fig().poly(a).poly(b).right(a[0], a[1], a[2]).right(b[0], b[1], b[2])
      .tick(a[0], a[1], 1).tick(b[0], b[1], 1).tick(a[0], a[2], 2).tick(b[0], b[2], 2);
  },
  2342: () => {
    const T = o => ({ C: [o, 0], B: [o + 4, 0], A: [o, 3] });
    const p = T(0), q = T(6.5);
    return new Fig().poly([p.A, p.B, p.C]).poly([q.A, q.B, q.C])
      .right(p.C, p.B, p.A).right(q.C, q.B, q.A)
      .arcAng(p.A, p.C, p.B, 24).arcAng(q.A, q.C, q.B, 24)
      .tick(p.A, p.B, 1).tick(q.A, q.B, 1)
      .lab('A', p.A, { dir: [-1, 1] }).lab('B', p.B).lab('C', p.C, { dir: [-1, -1] })
      .lab('A₁', q.A, { dir: [-1, 1] }).lab('B₁', q.B).lab('C₁', q.C, { dir: [-1, -1] });
  },
  2343: () => {
    const a = [[0, 0], [12, 0], [0, 5]];
    const b = [[8, 0], [8, 0], [8, 0]];
    // второй треугольник — зеркальный
    const q = [[26, 0], [14, 0], [26, 5]];
    return new Fig().poly(a).poly(q).right(a[0], a[1], a[2]).right(q[0], q[1], q[2])
      .tick(a[1], a[2], 1).tick(q[1], q[2], 1).tick(a[0], a[2], 2).tick(q[0], q[2], 2);
  },
  2344: () => {
    const th = 36.87, A = [0, 0], M = [10, 0];
    const B = polar(A, 8, th), C = polar(A, 8, -th);
    const E1 = polar(A, 11.5, th), E2 = polar(A, 11.5, -th);
    return new Fig().line(A, E1).line(A, E2).line(A, M, { dash: true }).line(M, B).line(M, C)
      .right(B, A, M).right(C, A, M).arcAng(A, M, B, 34).arcAng(A, M, C, 34).setCenter([6, 0])
      .lab('A', A, { dir: [-1, 0] }).lab('B', B, { dir: [0, 1] }).lab('C', C, { dir: [0, -1] }).lab('M', M, { dir: [1, 0] });
  },
  2345: () => {
    const a = [[0, 0], [8, 0], [0, 15]];
    const q = [[11, 0], [19, 0], [19, 15]];
    return new Fig().poly(a).poly(q).right(a[0], a[1], a[2]).right(q[1], q[0], q[2])
      .tick(a[0], a[1], 1).tick(q[0], q[1], 1).tick(a[0], a[2], 2).tick(q[1], q[2], 2);
  },
  2346: () => {
    const B = [0, 0], C = [10, 0], A = [5, 20 / 3];
    const D = foot(B, A, C), E = foot(C, A, B);
    return new Fig().poly([A, B, C]).line(B, D, { dash: true }).line(C, E, { dash: true })
      .right(D, B, A).right(E, C, A).tick(A, B, 1).tick(A, C, 1)
      .lab('A', A).lab('B', B).lab('C', C).lab('D', D, { dir: [1, 1] }).lab('E', E, { dir: [-1, 1] });
  },
  2347: () => { const { A, B, C } = rt(8, 6); return new Fig().poly([A, B, C]).right(C, B, A); },
  2348: () => { const { A, B, C } = rt(24, 7); return new Fig().poly([A, B, C]).right(C, B, A); },
  2350: () => { const { A, B, C } = rt(16, 12); return new Fig().poly([A, B, C]).right(C, B, A); },
  2352: () => {
    const { A, B, C } = rt(20, 15); const H = foot(C, A, B);
    return new Fig().poly([A, B, C]).line(C, H, { dash: true }).right(C, B, A).right(H, A, C);
  },
  2353: () => {
    const B = [0, 0], C = [30, 0], A = [15, 8], H = [15, 0];
    return new Fig().poly([A, B, C]).line(A, H, { dash: true }).right(H, C, A).tick(A, B, 1).tick(A, C, 1);
  },

  // ── площадь треугольника ──
  31: () => {
    const B = [0, 0], C = [14, 0], A = [5, 12], H = [5, 0];
    return new Fig().poly([A, B, C]).line(A, H, { dash: true }).right(H, C, A);
  },
  2225: () => {
    const A = [0, 0], B = [14, 0], C = [5, 9];
    return new Fig().poly([A, B, C]).line(C, [5, 0], { dash: true }).right([5, 0], B, C);
  },
  2226: () => {
    const A = [0, 0], B = [12, 0], C = [3.5, 7];
    return new Fig().poly([A, B, C]).line(C, [3.5, 0], { dash: true }).right([3.5, 0], B, C);
  },
  2227: () => {
    const A = [0, 0], B = [12, 0], C = [6, 8];
    const H = [6, 0], H2 = foot(B, A, C);
    return new Fig().poly([A, B, C]).line(C, H, { dash: true }).line(B, H2, { dash: true })
      .right(H, B, C).right(H2, B, C).tick(A, C, 1).tick(B, C, 1);
  },
  2228: () => {
    const A = [2.5, 7], B = [0, 0], C = [11, 0], D = lerp(B, C, 0.4);
    return new Fig().poly([A, B, C]).line(A, D).dotAt(D)
      .lab('A', A).lab('B', B).lab('C', C).lab('D', D, { dir: [0, -1] });
  },
  2229: () => {
    const { A, B, C } = rt(8, 6); const H = foot(C, A, B);
    return new Fig().poly([A, B, C]).line(C, H, { dash: true }).right(C, B, A).right(H, A, C);
  },
  2230: () => {
    const A = [0, 0], B = [10, 0], C = [3.5, 7];
    const M = lerp(A, B, 0.25), N = lerp(A, C, 2 / 3);
    return new Fig().poly([A, B, C]).line(M, N).dotAt(M).dotAt(N)
      .lab('A', A).lab('B', B).lab('C', C).lab('M', M, { dir: [0, -1] }).lab('N', N, { dir: [-1, 0] });
  }
};
