import { describe, expect, it } from 'vitest';
import { buildActivityWeeks, buildProgressSummary, computeStreak, localDateKey } from '../public/lib.js';

describe('computeStreak', () => {
  it('серия идёт от сегодня, а без решений сегодня — от вчера', () => {
    const activity = { '2026-09-12': 2, '2026-09-13': 1, '2026-09-14': 4 };
    expect(computeStreak(activity, '2026-09-14')).toMatchObject({ current: 3, best: 3, today: true, activeDays: 3 });
    // Утром 15-го серия ещё жива: вчера решали.
    expect(computeStreak(activity, '2026-09-15')).toMatchObject({ current: 3, today: false });
    // Пропущенный день обнуляет текущую, но не лучшую серию.
    expect(computeStreak(activity, '2026-09-16')).toMatchObject({ current: 0, best: 3 });
  });

  it('лучшая серия — самый длинный отрезок, через границу месяца', () => {
    const activity = { '2026-08-30': 1, '2026-08-31': 1, '2026-09-01': 1, '2026-09-05': 1, '2026-09-06': 0 };
    expect(computeStreak(activity, '2026-09-05')).toMatchObject({ current: 1, best: 3, activeDays: 4 });
  });
});

describe('buildActivityWeeks', () => {
  it('12 недель по 7 дней с понедельника, сегодня — в последней, будущее помечено', () => {
    const weeks = buildActivityWeeks({ '2026-09-14': 3 }, '2026-09-14');
    expect(weeks).toHaveLength(12);
    expect(weeks.every(week => week.length === 7)).toBe(true);
    const last = weeks[11];
    // 14 сентября 2026 — понедельник.
    expect(last[0]).toMatchObject({ key: '2026-09-14', count: 3, future: false });
    expect(last[6]).toMatchObject({ key: '2026-09-20', future: true });
    expect(weeks[0][0].key).toBe('2026-06-29');
  });

  it('localDateKey берёт местную дату', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});

describe('buildProgressSummary', () => {
  const topics = [
    { id: 1, grade: 6, title: 'Дроби', slug: 'drobi' },
    { id: 2, grade: 6, title: 'Проценты', slug: 'procenty' },
    { id: 3, grade: 7, title: 'Уравнения', slug: 'uravneniya' },
    { id: 4, grade: 7, title: 'Пустая', slug: 'pustaya' }
  ];
  const topicTaskIds = new Map([[1, [10, 11]], [2, [20, 21, 22, 23]], [3, [30]]]);

  it('считает решённое по каталогу, с первой попытки и по классам', () => {
    const s = buildProgressSummary({
      solvedIds: [10, 11, 20, 999],
      topics,
      topicTaskIds,
      wrongAttempts: { 11: 2, 30: 1 },
      today: '2026-09-14'
    });
    // 999 сняли с публикации — не считается.
    expect(s.solved).toBe(3);
    expect(s.total).toBe(7);
    expect(s.firstTry).toBe(2);
    expect(s.topicsDone).toBe(1);
    expect(s.grades.map(g => [g.grade, g.solved, g.total, g.topicsDone])).toEqual([[6, 3, 6, 1], [7, 0, 1, 0]]);
    // Пустая тема не попадает никуда.
    expect(s.grades[1].topics.map(r => r.topic.id)).toEqual([3]);
    expect(s.inProgress.map(r => r.topic.id)).toEqual([2]);
  });

  it('контрольные: свежие сверху, лучшая оценка', () => {
    const s = buildProgressSummary({
      topics,
      topicTaskIds,
      controlWorks: {
        1: { grade: 6, percent: 60, date: '2026-09-01T10:00:00Z' },
        3: { grade: 9, percent: 90, date: '2026-09-10T10:00:00Z' }
      }
    });
    expect(s.controlWorks.list.map(r => r.topicId)).toEqual([3, 1]);
    expect(s.controlWorks.bestGrade).toBe(9);
    expect(s.achievements.find(a => a.id === 'cw_excellent').earned).toBe(true);
  });

  it('достижения: цель, прогресс и получено', () => {
    const s = buildProgressSummary({
      solvedIds: [10, 11],
      topics,
      topicTaskIds,
      activity: { '2026-09-13': 1, '2026-09-14': 1 },
      today: '2026-09-14'
    });
    const byId = Object.fromEntries(s.achievements.map(a => [a.id, a]));
    expect(byId.first_task).toMatchObject({ earned: true, value: 1, goal: 1 });
    expect(byId.solved_10).toMatchObject({ earned: false, value: 2, goal: 10 });
    expect(byId.topic_done.earned).toBe(true);
    expect(byId.streak_3).toMatchObject({ earned: false, value: 2 });
    expect(byId.cw_excellent).toMatchObject({ earned: false, counted: false });
  });

  it('без данных — нули, а не ошибка', () => {
    const s = buildProgressSummary();
    expect(s).toMatchObject({ solved: 0, total: 0, firstTry: 0, topicsDone: 0, grades: [], inProgress: [] });
    expect(s.achievements.every(a => !a.earned)).toBe(true);
  });
});
