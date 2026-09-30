// 9 класс: трапеции, тригонометрия в прямоугольном треугольнике, бытовые сюжеты
import { Fig, add, sub, mul, lerp, mid, dist, unit, polar, foot, inter } from './figlib.mjs';

/** Равнобедренная трапеция: большее основание AD снизу, меньшее BC сверху; смещение боковой стороны off, высота h. */
const iso = (D, off, h) => { const A = [0, 0]; return { A, B: [off, h], C: [D - off, h], D: [D, 0] }; };
/** Прямоугольная трапеция: A=(0,0), B=(0,h), C=(c,h), D=(d,0). */
const rtrap = (c, d, h) => ({ A: [0, 0], B: [0, h], C: [c, h], D: [d, 0] });
const L4 = (f, t, s = 'ABCD') => f.lab(s[0], t.A, { dir: [-1, -1] }).lab(s[1], t.B, { dir: [-1, 1] }).lab(s[2], t.C, { dir: [1, 1] }).lab(s[3], t.D, { dir: [1, -1] });

export default {
  // ── прямоугольные трапеции ──
  256: () => {
    const t = rtrap(8, 9, 2.83);
    return L4(new Fig().poly([t.A, t.B, t.C, t.D]).line(t.A, t.C, { dash: true }).right(t.A, t.D, t.B).right(t.C, t.A, t.D), t);
  },
  713: () => {
    const h = 4 * Math.sqrt(3), t = rtrap(12, 16, h);
    return L4(new Fig().poly([t.A, t.B, t.C, t.D]).line(t.A, t.C, { dash: true })
      .right(t.A, t.D, t.B).right(t.B, t.A, t.C).right(t.C, t.A, t.D).arcAng(t.D, t.A, t.C, 26), t);
  },
  720: () => {
    const t = rtrap(6, 11, 5);
    return L4(new Fig().poly([t.A, t.B, t.C, t.D]).right(t.A, t.D, t.B).right(t.B, t.A, t.C).arcAng(t.D, t.A, t.C, 26), t);
  },
  2037: () => {
    const t = rtrap(6, 14, 8);
    return new Fig().poly([t.A, t.B, t.C, t.D]).right(t.A, t.D, t.B).right(t.B, t.A, t.C);
  },

  // ── равнобедренные трапеции ──
  2028: () => {
    const t = iso(10, 2, 4.29);
    return L4(new Fig().poly([t.A, t.B, t.C, t.D]).arcAng(t.A, t.D, t.B, 24).arcAng(t.D, t.A, t.C, 24), t);
  },
  2029: () => {
    const t = iso(16, 3, 5);
    return new Fig().poly([t.A, t.B, t.C, t.D]).tick(t.A, t.B, 1).tick(t.C, t.D, 1);
  },
  2030: () => {
    const t = iso(19, 6, 8);
    return new Fig().poly([t.A, t.B, t.C, t.D]).line(t.B, [t.B[0], 0], { dash: true }).right([t.B[0], 0], t.D, t.B).tick(t.A, t.B, 1).tick(t.C, t.D, 1);
  },
  2031: () => {
    const t = iso(21, 6, 8);
    return new Fig().poly([t.A, t.B, t.C, t.D]).line(t.A, t.C, { dash: true }).line(t.C, [t.C[0], 0], { dash: true }).right([t.C[0], 0], t.A, t.C);
  },
  2032: () => {
    const t = iso(10, 3, 3);
    return new Fig().poly([t.A, t.B, t.C, t.D]).arcAng(t.B, t.A, t.C, 22).arcAng(t.A, t.D, t.B, 24).tick(t.A, t.B, 1).tick(t.C, t.D, 1);
  },
  2033: () => {
    const h = 3 * Math.sqrt(3), t = iso(12, 3, h);
    return new Fig().poly([t.A, t.B, t.C, t.D]).line(t.A, t.C, { dash: true }).arcAng(t.A, t.D, t.C, 26).arcAng(t.A, t.C, t.B, 26).tick(t.A, t.B, 1).tick(t.C, t.D, 1);
  },
  2034: () => {
    const t = iso(12, 2, 5);
    return new Fig().poly([t.A, t.B, t.C, t.D]).line(t.B, [t.B[0], 0], { dash: true }).right([t.B[0], 0], t.D, t.B);
  },
  2035: () => {
    const t = iso(12, 3, 6), M = mid(t.A, t.B), N = mid(t.D, t.C);
    return new Fig().poly([t.A, t.B, t.C, t.D]).line(M, N, { dash: true }).line(t.C, [t.C[0], 0], { dash: true }).right([t.C[0], 0], t.A, t.C);
  },
  2036: () => {
    const t = iso(16, 4, 5);
    return new Fig().poly([t.A, t.B, t.C, t.D]).line(t.B, [t.B[0], 0], { dash: true }).right([t.B[0], 0], t.D, t.B);
  },
  2038: () => {
    const t = iso(20, 5, 12);
    return new Fig().poly([t.A, t.B, t.C, t.D])
      .line(t.B, [t.B[0], 0], { dash: true }).line(t.C, [t.C[0], 0], { dash: true })
      .right([t.B[0], 0], t.D, t.B).right([t.C[0], 0], t.A, t.C).tick(t.A, t.B, 1).tick(t.C, t.D, 1);
  },
  2039: () => {
    const t = iso(12, 2, 10), O = inter(t.A, t.C, t.B, t.D);
    return new Fig().poly([t.A, t.B, t.C, t.D]).line(t.A, t.C, { dash: true }).line(t.B, t.D, { dash: true })
      .right(O, t.D, t.C).line(t.C, [t.C[0], 0], { dash: true }).right([t.C[0], 0], t.A, t.C);
  },

  // ── прямоугольный треугольник и тригонометрия ──
  38: () => {
    const C = [0, 0], B = [8, 0], A = [0, 6];
    return new Fig().poly([A, B, C]).right(C, B, A).arcAng(B, C, A, 28);
  },
  40: () => {
    const A = [0, 0], B = [10, 0], C = polar(A, 8, 60);
    return new Fig().poly([A, B, C]).arcAng(A, B, C, 26);
  },
  2040: () => {
    const G = [0, 0], W = [0, 5], L = [8.66, 0];
    return new Fig().line([-1.5, 0], [10.5, 0]).line([0, 0], [0, 6.2]).line(L, W).right(G, L, W).arcAng(L, G, W, 34);
  },
  2042: () => {
    const A = [0, 0], B = [5.196, 0], C = [5.196, 3];
    return new Fig().poly([A, B, C]).right(B, A, C).arcAng(A, B, C, 34);
  },
  2043: () => {
    const T = [0, 17.32], P1 = [30, 0], P2 = [10, 0];
    return new Fig().line([-3, 0], [33, 0]).line([0, 0], T).line(P1, T).line(P2, T).right([0, 0], P1, T)
      .dotAt(P1).dotAt(P2).arcAng(P1, [0, 0], T, 60).arcAng(P2, [0, 0], T, 30);
  }
};
