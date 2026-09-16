import { describe, expect, it } from 'vitest';
import {
  accuracyTrend,
  buildActivityWeeks,
  buildProgressSummary,
  buildSubjectBreakdown,
  buildWeakSpots,
  computeStreak,
  latestPerTask,
  localDateKey,
  normalizeJournal,
  summarizeSolveTime
} from '../public/lib.js';

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

describe('normalizeJournal', () => {
  it('чистит мусор, сортирует свежим вперёд и признаёт три исхода', () => {
    const entries = normalizeJournal([
      { id: 5, at: 100, outcome: 'correct', ms: 4000 },
      { id: 0, at: 200, outcome: 'correct' },        // без задачи
      { id: 7, at: 0, outcome: 'correct' },          // без даты
      { id: 9, at: 300, outcome: 'выдумка', ms: -5 } // чужой исход и отрицательное время
    ]);
    expect(entries).toEqual([
      { id: 9, at: 300, outcome: 'wrong', ms: 0 },
      { id: 5, at: 100, outcome: 'correct', ms: 4000 }
    ]);
    expect(normalizeJournal(null)).toEqual([]);
  });
});

describe('summarizeSolveTime', () => {
  it('считает только записи с засечённым временем', () => {
    const time = summarizeSolveTime([
      { id: 1, at: 1, outcome: 'correct', ms: 60000 },
      { id: 2, at: 2, outcome: 'wrong', ms: 120000 },
      { id: 3, at: 3, outcome: 'correct', ms: 0 } // решено до появления секундомера
    ]);
    expect(time).toEqual({ totalMs: 180000, count: 2, avgMs: 90000 });
    expect(summarizeSolveTime([])).toEqual({ totalMs: 0, count: 0, avgMs: 0 });
  });
});

describe('accuracyTrend', () => {
  const now = Date.UTC(2026, 8, 16);
  const day = 86400000;
  const make = (count, outcome, daysAgo) => Array.from({ length: count }, (_, i) => ({
    id: i + daysAgo * 100, at: now - daysAgo * day, outcome, ms: 0
  }));

  it('молчит, пока в каком-то из окон мало записей', () => {
    expect(accuracyTrend(make(4, 'correct', 2).concat(make(9, 'wrong', 40)), now)).toBe(null);
    expect(accuracyTrend([], now)).toBe(null);
  });

  it('сравнивает последние 30 дней с предыдущими 30, в пунктах', () => {
    // Свежее окно: 8 верных из 10 — 80%. Прошлое: 5 из 10 — 50%.
    const entries = [
      ...make(8, 'correct', 5), ...make(2, 'wrong', 6),
      ...make(5, 'correct', 40), ...make(5, 'wrong', 41)
    ];
    expect(accuracyTrend(entries, now)).toBe(30);
  });

  it('старше 60 дней в счёт не идёт', () => {
    const entries = [
      ...make(6, 'correct', 3),
      ...make(6, 'wrong', 45),
      ...make(50, 'correct', 200)
    ];
    expect(accuracyTrend(entries, now)).toBe(100);
  });
});

describe('latestPerTask', () => {
  it('оставляет по одной, самой свежей записи на задачу', () => {
    const entries = [
      { id: 1, at: 300, outcome: 'correct', ms: 0 },
      { id: 1, at: 200, outcome: 'wrong', ms: 0 },
      { id: 2, at: 100, outcome: 'hint', ms: 0 }
    ];
    expect(latestPerTask(entries).map(e => [e.id, e.outcome])).toEqual([[1, 'correct'], [2, 'hint']]);
    expect(latestPerTask(entries, 1)).toHaveLength(1);
  });
});

describe('buildSubjectBreakdown', () => {
  const subjects = [{ id: 1, title: 'Алгебра' }, { id: 2, title: 'Геометрия' }];
  const rows = [
    { topic: { id: 10, grade: 8, subject_id: 1 }, total: 10, solved: 6 },
    { topic: { id: 11, grade: 8, subject_id: 2 }, total: 4, solved: 1 },
    { topic: { id: 12, grade: 9, subject_id: 1 }, total: 6, solved: 0 }
  ];

  it('без класса складывает все классы и сортирует по объёму раздела', () => {
    const all = buildSubjectBreakdown(rows, { subjects });
    expect(all.map(r => [r.subject.title, r.solved, r.total, r.percent]))
      .toEqual([['Алгебра', 6, 16, 38], ['Геометрия', 1, 4, 25]]);
  });

  it('с классом берёт только его темы', () => {
    const grade8 = buildSubjectBreakdown(rows, { grade: 8, subjects });
    expect(grade8.map(r => [r.subject.title, r.solved, r.total])).toEqual([['Алгебра', 6, 10], ['Геометрия', 1, 4]]);
    expect(buildSubjectBreakdown(rows, { grade: 5, subjects })).toEqual([]);
  });

  it('тему без раздела не теряет', () => {
    const orphan = buildSubjectBreakdown([{ topic: { id: 13, grade: 8, subject_id: null }, total: 3, solved: 3 }], { subjects });
    expect(orphan).toHaveLength(1);
    expect(orphan[0].subject).toBe(null);
  });
});

describe('buildWeakSpots', () => {
  const topicRows = [
    { topic: { id: 1, slug: 'drobi' }, total: 4, solved: 2 },
    { topic: { id: 2, slug: 'procenty' }, total: 3, solved: 3 },
    { topic: { id: 3, slug: 'uravneniya' }, total: 2, solved: 0 }
  ];
  const taskIdsOf = id => ({ 1: [10, 11, 12, 13], 2: [20, 21, 22], 3: [30, 31] })[id] || [];

  it('берёт только темы с осечками и ставит слабейшую первой', () => {
    const weak = buildWeakSpots({
      topicRows,
      taskIdsOf,
      solvedSet: new Set([10, 11, 20, 21, 22]),
      // 11 решена со второй попытки, 12 брошена после ошибки, 30 — тоже.
      wrongAttempts: { 11: 1, 12: 3, 30: 2 },
      journalByTask: new Map([[11, 'hint']])
    });
    // «Проценты» пройдены без ошибок — их здесь нет; 13 не трогали и в счёт не идёт.
    expect(weak.map(row => [row.topic.slug, row.correct, row.attempted, row.hinted]))
      .toEqual([['uravneniya', 0, 1, 0], ['drobi', 1, 3, 1]]);
  });

  it('без ошибок список пуст', () => {
    const weak = buildWeakSpots({ topicRows, taskIdsOf, solvedSet: new Set([20, 21, 22]), wrongAttempts: {} });
    expect(weak).toEqual([]);
  });
});
