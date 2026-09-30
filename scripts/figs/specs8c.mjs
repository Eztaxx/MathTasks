// 8 класс: круг и комбинированные фигуры, призмы, цилиндры
import { Fig, add, mul, prism, cylinder, addCylinder, proj } from './figlib.mjs';

const RECT = (w, d) => [[0, 0], [w, 0], [w, d], [0, d]];

export default {
  // ── круг и составные фигуры ──
  2233: () => new Fig().circ([0, 0], 5).circ([0, 0], 3),
  2234: () => new Fig().poly([[0, 0], [8, 0], [8, 8], [0, 8]]).circ([4, 4], 4),
  2235: () => new Fig().pline([[10, 0], [0, 0], [0, 6], [10, 6]]).earc([10, 3], 3, 3, -90, 90).line([10, 0], [10, 6], { dash: true }),
  2222: () => new Fig().poly([[0, 0], [12, 0], [12, 5], [7, 5], [7, 8], [0, 8]]).pline([[12, 5], [12, 8], [7, 8]], { dash: true }),

  // ── прямоугольный параллелепипед и призмы ──
  2238: () => prism(RECT(4, 3), 5),
  2243: () => prism(RECT(4, 4), 7, { diag: ['b', 0, 't', 2] }),
  2242: () => prism(RECT(6, 5), 4),
  2240: () => prism([[0, 0], [12, 0], [0, 9]], 10),
  2241: () => prism([[4, 0], [0, 3], [-4, 0], [0, -3]], 5)
    .line(proj(4, 0, 0), proj(-4, 0, 0), { dash: true }).line(proj(0, 3, 0), proj(0, -3, 0), { dash: true }),
  2244: () => prism([[0, 0], [10, 0], [7, 4], [3, 4]], 6),

  // ── цилиндр ──
  2245: () => cylinder(3, 5, { radius: true, axis: true }),
  2246: () => cylinder(4, 7, { radius: true }),
  2247: () => cylinder(5, 10, { section: true }),
  2248: () => cylinder(2, 6, { radius: true, axis: true }),
  2249: () => {
    const w = 2 * Math.PI * 1.2, h = 5, r = 1.2;
    return new Fig().poly([[0, 0], [w, 0], [w, h], [0, h]]).circ([w / 2, h + r], r).circ([w / 2, -r], r);
  },
  2250: () => {
    const f = new Fig({ pad: 24 });
    addCylinder(f, 2.5, 3.6, { center: [0, 0], level: 3 });
    addCylinder(f, 1.25, 12.6, { center: [6.4, 0], level: 12 });
    return f;
  },
  2251: () => {
    const f = new Fig({ pad: 24 });
    addCylinder(f, 2, 3, { center: [0, 0], radius: true });
    addCylinder(f, 1, 6, { center: [5, 0], radius: true });
    return f;
  }
};
