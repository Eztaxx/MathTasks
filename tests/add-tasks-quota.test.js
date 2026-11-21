import { describe, expect, it } from 'vitest';
import { isTaskAutoCheckable } from '../public/lib.js';
import {
  TARGET, SELF_EVERY, PER_RUN, SELF_PER_RUN, MAX_SUBS, selfTarget, compareSubs, planBatch
} from '../.claude/skills/add-tasks/scripts/quota.mjs';

/* Скилл add-tasks: подтема растёт до 45 задач, из них около 1 из 5 — с
   самопроверкой; запуск пишет до 12 задач, из них до 3 с самопроверкой,
   в одну-две подтемы одной темы. */

const R = String.raw;
const sub = (id, total, self = 0) => ({ id, total, self });

describe('квоты пачки add-tasks', () => {
  it('настройки совпадают с тем, что попросил владелец', () => {
    expect([TARGET, SELF_EVERY, PER_RUN, SELF_PER_RUN, MAX_SUBS]).toEqual([45, 5, 12, 3, 2]);
  });

  it('самопроверки — одна на каждые 5 задач, не больше чем для 45', () => {
    expect([0, 8, 9, 27, 44, 45, 60].map(n => selfTarget(n))).toEqual([0, 1, 1, 5, 8, 9, 9]);
  });

  it('подтема с 15 обычными: 9 обычных и 3 с самопроверкой', () => {
    expect(planBatch([sub(1, 15)])).toEqual([{ id: 1, wantAuto: 9, wantSelf: 3 }]);
  });

  it('за три запуска подтема доходит до 45, из них 9 с самопроверкой', () => {
    let s = sub(1, 15);
    const runs = [];
    for (let i = 0; i < 3; i++) {
      const [p] = planBatch([s], { maxSubs: 1 });
      runs.push([p.wantAuto, p.wantSelf]);
      s = sub(1, s.total + p.wantAuto + p.wantSelf, s.self + p.wantSelf);
    }
    expect(runs).toEqual([[9, 3], [9, 3], [3, 3]]);
    expect(s).toEqual(sub(1, 45, 9));
    expect(planBatch([s])).toEqual([]);
  });

  it('если в главной подтеме места меньше 12, пачку добирает вторая', () => {
    expect(planBatch([sub(1, 40, 4), sub(2, 15), sub(3, 15)])).toEqual([
      { id: 1, wantAuto: 2, wantSelf: 3 },
      { id: 2, wantAuto: 7, wantSelf: 0 }
    ]);
  });

  it('самопроверок в пачке не больше 3, даже если подтема ими не добрана', () => {
    expect(planBatch([sub(1, 30, 0)])).toEqual([{ id: 1, wantAuto: 9, wantSelf: 3 }]);
  });

  it('лишние старые самопроверки не дают отрицательной квоты', () => {
    expect(planBatch([sub(1, 15, 6)])).toEqual([{ id: 1, wantAuto: 12, wantSelf: 0 }]);
  });

  it('приоритетные классы первыми, пока в них есть место; затем самые тонкие', () => {
    const list = [
      { id: 1, grade: 7, total: 15, topicPosition: 1, position: 1 },
      { id: 2, grade: 10, total: 30, topicPosition: 1, position: 1 },
      { id: 3, grade: 11, total: 45, topicPosition: 1, position: 1 },
      { id: 4, grade: 8, total: 16, topicPosition: 1, position: 1 }
    ];
    const order = list.sort((a, b) => compareSubs(a, b, { priority: [10, 11], target: 45 })).map(s => s.id);
    expect(order).toEqual([2, 1, 4, 3]);
  });
});

describe('какой ответ сайт считает самопроверкой', () => {
  it('рассуждение словами — без поля ответа', () => {
    for (const a of [
      R`Утверждение неверно: при $n = 40$ число $n^2 + n + 41 = 1681 = 41^2$ — составное.`,
      R`Apgalvojums ir nepatiess: ja $n = 40$, tad $n^2 + n + 41 = 1681 = 41^2$ — salikts skaitlis.`,
      R`Треугольник прямоугольный, так как $3^2 + 4^2 = 5^2$.`,
      R`$\text{Доказано}$`,
      R`Nē, nevar.`
    ]) expect(isTaskAutoCheckable(a, '')).toBe(false);
  });

  it('промежуток, неравенство, число с пояснением и короткое «Nav» сайт сверяет — для самопроверки не годятся', () => {
    for (const a of [R`$x \in (1; 5)$`, R`$x > 3$`, R`$5$ (так как …)`, R`Nav`]) {
      expect(isTaskAutoCheckable(a, '')).toBe(true);
    }
  });
});
