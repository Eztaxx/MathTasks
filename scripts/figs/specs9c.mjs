// 9 класс: окружность и многоугольник — описанная, вписанная, касательные, правильные многоугольники
import { Fig, add, sub, mul, lerp, mid, dist, unit, len, polar, foot, inter, circumcircle, incircle, regular } from './figlib.mjs';

/** Вершины многоугольника, описанного около окружности (c, r) по точкам касания под углами angles (по убыванию). */
const tangentPoly = (c, r, angles) => angles.map((a, i) => {
  const b = angles[(i + 1) % angles.length];
  const ua = unit(polar([0, 0], 1, a)), ub = unit(polar([0, 0], 1, b));
  const s = add(ua, ub), k = 2 * r / (len(s) * len(s));
  return add(c, mul(s, k));
});
const tri = (f, A, B, C) => f.poly([A, B, C]);

export default {
  // ── окружность, описанная около треугольника ──
  2103: () => {
    const O = [0, 0], A = [-5, 0], B = [5, 0], C = [-1.4, 4.8];
    return new Fig().circ(O, 5).poly([A, B, C]).dotAt(O).right(C, A, B);
  },
  2104: () => {
    const O = [0, 0], r = 4, P = regular(3, O, r, 90);
    return new Fig().circ(O, r).poly(P).dotAt(O).line(O, P[0], { dash: true });
  },
  2105: () => {
    const A = [0, 8], B = [-6, 0], C = [6, 0], { c, r } = circumcircle(A, B, C);
    return new Fig().circ(c, r).poly([A, B, C]).dotAt(c).line(c, A, { dash: true }).tick(A, B, 1).tick(A, C, 1);
  },
  2106: () => {
    const O = [0, 0], r = 5, A = polar(O, r, 90), B = polar(O, r, 240), C = polar(O, r, 300);
    return new Fig().circ(O, r).poly([A, B, C]).arcAng(A, B, C, 24)
      .lab('A', A, { dir: [0, 1] }).lab('B', B).lab('C', C);
  },
  2107: () => {
    const A = [-6.5, 0], B = [6.5, 0], C = polar(A, 12, 22.62);
    return new Fig().circ([0, 0], 6.5).poly([A, B, C]).dotAt([0, 0]).right(C, A, B)
      .lab('A', A, { dir: [-1, 0] }).lab('B', B, { dir: [1, 0] }).lab('C', C, { dir: [0, 1] });
  },
  2108: () => {
    const A = [0, 6], B = [-8, 0], C = [8, 0], { c, r } = circumcircle(A, B, C);
    return new Fig().circ(c, r).poly([A, B, C]).dotAt(c).line(c, A, { dash: true }).tick(A, B, 1).tick(A, C, 1);
  },

  // ── касательная, вписанная окружность ──
  2109: () => {
    const O = [0, 0], A = [13, 0], B = polar(O, 5, 67.38);
    return new Fig().circ(O, 5).line(O, A, { dash: true }).line(O, B, { dash: true }).line(A, B).right(B, O, A).setCenter([5, 0])
      .lab('O', O, { dir: [-1, 0] }).lab('A', A, { dir: [1, 0] }).lab('B', B, { dir: [0, 1] });
  },
  2110: () => {
    const O = [0, 0], A = [6, 0], B = polar(O, 3, 60), C = polar(O, 3, -60);
    return new Fig().circ(O, 3).line(A, B).line(A, C).line(B, C).dotAt(O).setCenter([2, 0])
      .lab('A', A, { dir: [1, 0] }).lab('B', B, { dir: [0, 1] }).lab('C', C, { dir: [0, -1] });
  },
  2111: () => {
    const C = [0, 0], B = [12, 0], A = [0, 9], I = incircle(A, B, C);
    return new Fig().poly([A, B, C]).circ(I.c, I.r).right(C, B, A);
  },
  2112: () => {
    const B = [0, 0], C = [14, 0], A = [5, 12], I = incircle(A, B, C);
    return new Fig().poly([A, B, C]).circ(I.c, I.r);
  },
  2113: () => {
    const A = [0, 0], C = [11, 0], B = [4.64, 7.71], I = incircle(A, B, C);
    const [L, M, K] = I.touch;
    return new Fig().poly([A, B, C]).circ(I.c, I.r).dotAt(K).dotAt(L).dotAt(M).setCenter(I.c)
      .lab('A', A, { dir: [-1, -1] }).lab('B', B, { dir: [0, 1] }).lab('C', C, { dir: [1, -1] })
      .lab('K', K).lab('L', L).lab('M', M, { dir: [0, -1] });
  },
  2114: () => {
    const C = [0, 0], B = [12, 0], A = [0, 5], I = incircle(A, B, C);
    const T = I.touch[2] && foot(I.c, A, B);
    return new Fig().poly([A, B, C]).circ(I.c, I.r).right(C, B, A).line(I.c, T, { dash: true }).right(T, I.c, A).dotAt(T);
  },

  // ── четырёхугольник и окружность ──
  2115: () => {
    const O = [0, 0], r = 4;
    const [A, B, C, D] = [0, 100, 160, 244].map(a => polar(O, r, a));
    return new Fig().circ(O, r).poly([A, B, C, D]).arcAng(A, B, D, 22).arcAng(B, A, C, 22, 2)
      .lab('A', A, { dir: [1, 0] }).lab('B', B, { dir: [0, 1] }).lab('C', C, { dir: [-1, 0] }).lab('D', D, { dir: [0, -1] });
  },
  2116: () => {
    const c = [0, 0], r = 3, [A, B, C, D] = tangentPoly(c, r, [110, 30, -60, -160]);
    return new Fig().poly([A, B, C, D]).circ(c, r)
      .lab('A', A).lab('B', B).lab('C', C).lab('D', D);
  },
  2117: () => {
    const A = [0, 0], D = [16, 0], B = [6, 8], C = [10, 8];
    return new Fig().poly([A, B, C, D]).circ([8, 4], 4).tick(A, B, 1).tick(C, D, 1);
  },
  2118: () => {
    const A = [-4, -3], B = [4, -3], C = [4, 3], D = [-4, 3];
    return new Fig().circ([0, 0], 5).poly([A, B, C, D]).line(A, C, { dash: true }).dotAt([0, 0]).right(B, C, A);
  },
  2119: () => {
    const P = [[8, 0], [0, 6], [-8, 0], [0, -6]];
    return new Fig().poly(P).circ([0, 0], 4.8).line(P[0], P[2], { dash: true }).line(P[1], P[3], { dash: true }).right([0, 0], P[0], P[1]);
  },
  2120: () => {
    const A = [0, 0], D = [12, 0], B = [0, 8], C = [6, 8];
    return new Fig().poly([A, B, C, D]).circ([4, 4], 4).right(A, D, B).right(B, A, C);
  },

  // ── правильные многоугольники ──
  2123: () => {
    const O = [0, 0], P = regular(6, O, 4, 0), a = 4 * Math.sqrt(3) / 2, T = polar(O, a, 30);
    return new Fig().poly(P).circ(O, a).line(O, T, { dash: true }).right(T, O, P[0]).dotAt(O);
  },
  2124: () => {
    const O = [0, 0], P = regular(6, O, 4, 0);
    const f = new Fig().poly(P);
    P.forEach(p => f.line(O, p, { dash: true }));
    return f;
  },
  2125: () => {
    const O = [0, 0], r = 6.93, P = regular(3, O, r, 90);
    return new Fig().circ(O, r).poly(P).dotAt(O).line(O, P[0], { dash: true });
  }
};
