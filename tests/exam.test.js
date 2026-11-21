import { describe, expect, it } from 'vitest';
import { EXAM_KINDS, selectExamTasks, buildExamVariant, assignExamPoints, scoreExam, createFocusGuard } from '../public/lib.js';

// Предсказуемый «случай»: один и тот же вариант при каждом прогоне.
const seeded = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const DIFF = { 1: 'Базовый', 2: 'Средний', 3: 'Сложный' };
const levelOf = task => ({ Базовый: 1, Средний: 2, Сложный: 3 })[task.difficulty];

// В каждой теме поровну простых, средних и сложных; ответы — сверяемые числа.
function makeTasks(topics, perTopic) {
  const tasks = [];
  let id = 1;
  for (let topic = 1; topic <= topics; topic++) {
    for (let i = 0; i < perTopic; i++) {
      tasks.push({ id, topic_id: topic, difficulty: DIFF[(i % 3) + 1], answer_latex: String(id * 3) });
      id++;
    }
  }
  return tasks;
}

describe('пробный экзамен: вариант', () => {
  it('берёт нужное число задач, по одной из темы, пока темы не кончатся', () => {
    const picked = selectExamTasks(makeTasks(20, 6), { count: 12, random: seeded(7) });
    expect(picked).toHaveLength(12);
    expect(new Set(picked.map(task => task.topic_id)).size).toBe(12);
  });

  it('держит долю сложности 40/40/20 и идёт от простых к сложным', () => {
    const picked = selectExamTasks(makeTasks(20, 6), { count: 10, random: seeded(3) });
    const levels = picked.map(levelOf);
    expect(levels.filter(level => level === 1)).toHaveLength(4);
    expect(levels.filter(level => level === 2)).toHaveLength(4);
    expect(levels.filter(level => level === 3)).toHaveLength(2);
    expect([...levels].sort((a, b) => a - b)).toEqual(levels);
  });

  it('тем мало — добирает вторым кругом, без повторов', () => {
    const picked = selectExamTasks(makeTasks(3, 6), { count: 12, random: seeded(5) });
    expect(picked).toHaveLength(12);
    expect(new Set(picked.map(task => task.id)).size).toBe(12);
  });

  it('не берёт задачи без автопроверки и не выдумывает недостающие', () => {
    const tasks = [
      { id: 1, topic_id: 1, difficulty: 'Средний', answer_latex: 'Да, подобны' },
      { id: 2, topic_id: 2, difficulty: 'Средний', answer_latex: '12' },
      { id: 3, topic_id: 3, difficulty: 'Базовый', answer_latex: 'x = 5' }
    ];
    const picked = selectExamTasks(tasks, { count: 12, random: seeded(1) });
    expect(picked.map(task => task.id).sort()).toEqual([2, 3]);
  });

  // Цифры — из программ централизованных экзаменов 2026./2027. m. g. (VISC/VIAA).
  it('части, баллы, время и калькулятор — как в программе VISC', () => {
    const shape = kind => EXAM_KINDS[kind].parts.map(part => [part.minutes, part.points, part.calc]);
    expect(shape('pamat')).toEqual([[105, 60, false], [75, 20, true]]);
    expect(shape('visp')).toEqual([[135, 60, true], [105, 20, true]]);
    expect(shape('opt')).toEqual([[135, 75, true], [105, 25, true]]);
    expect(shape('augst')).toEqual([[135, 70, true], [120, 30, true]]);
    for (const kind of ['pamat', 'visp', 'opt', 'augst']) {
      const config = EXAM_KINDS[kind];
      expect(config.parts.reduce((sum, part) => sum + part.minutes, 0)).toBe(config.minutes);
      expect(config.parts.reduce((sum, part) => sum + part.tasks, 0)).toBe(config.tasks);
      expect(config.passPercent).toBe(20);
    }
    // 9 класс — задачи 7–9 классов (так в программе основной школы).
    expect(EXAM_KINDS.pamat.grades).toEqual([7, 8, 9]);
    // Админка читает «свой» класс уровня.
    expect(EXAM_KINDS.opt.grade).toBe(11);
  });
});

describe('пробный экзамен: вариант по частям и баллы', () => {
  // Пул «уровня»: темы по классам, в каждой поровну лёгких, средних, сложных.
  const pool = (grades, topicsPerGrade = 8, perTopic = 9) => {
    const tasks = [];
    let id = 1;
    for (const grade of grades) {
      for (let t = 0; t < topicsPerGrade; t++) {
        const topic = grade * 100 + t;
        for (let i = 0; i < perTopic; i++) {
          tasks.push({ id, topic_id: topic, topic_grade: grade, difficulty: DIFF[(i % 3) + 1], answer_latex: String(id) });
          id++;
        }
      }
    }
    return tasks;
  };

  it('сумма баллов каждой части — ровно как в программе, у задачи не меньше 1', () => {
    for (const kind of ['pamat', 'visp', 'opt', 'augst']) {
      const config = EXAM_KINDS[kind];
      const parts = buildExamVariant(pool(config.grades), config, { random: seeded(11) });
      parts.forEach((part, i) => {
        expect(part.tasks).toHaveLength(config.parts[i].tasks);
        expect(part.points.reduce((a, b) => a + b, 0)).toBe(config.parts[i].points);
        expect(Math.min(...part.points)).toBeGreaterThanOrEqual(1);
        expect(part.minutes).toBe(config.parts[i].minutes);
      });
    }
  });

  it('задачи частей не повторяются, во 2-й части — сложные', () => {
    const config = EXAM_KINDS.opt;
    const [first, second] = buildExamVariant(pool(config.grades), config, { random: seeded(4) });
    const ids = [...first.tasks, ...second.tasks].map(task => task.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(second.tasks.every(task => levelOf(task) === 3)).toBe(true);
  });

  it('2-я часть берёт сложные из других тем, а не лёгкие из темы без сложных', () => {
    const tasks = [];
    for (let i = 1; i <= 6; i++) tasks.push({ id: i, topic_id: 1, topic_grade: 10, difficulty: 'Лёгкий', answer_latex: String(i) });
    for (let i = 7; i <= 40; i++) tasks.push({ id: i, topic_id: 2 + (i % 4), topic_grade: 10, difficulty: i % 2 ? 'Сложный' : 'Лёгкий', answer_latex: String(i) });
    const config = { grade: 10, grades: [10], parts: [{ minutes: 10, points: 5, tasks: 0, calc: true }, { minutes: 10, points: 20, tasks: 5, calc: true }] };
    const [, second] = buildExamVariant(tasks, config, { random: seeded(6) });
    expect(second.tasks).toHaveLength(5);
    expect(second.tasks.every(task => levelOf({ difficulty: task.difficulty === 'Лёгкий' ? 'Базовый' : task.difficulty }) === 3)).toBe(true);
  });

  it('9 класс берёт задачи из 7–9 классов, Augstākais — около 30 % из 11-го', () => {
    const pamat = buildExamVariant(pool([6, 7, 8, 9, 10]), EXAM_KINDS.pamat, { random: seeded(2) });
    const pamatGrades = new Set(pamat.flatMap(part => part.tasks.map(task => task.topic_grade)));
    expect([...pamatGrades].every(grade => [7, 8, 9].includes(grade))).toBe(true);

    const augst = buildExamVariant(pool([11, 12]), EXAM_KINDS.augst, { random: seeded(3) });
    const first = augst[0].tasks;
    const fromOpt = first.filter(task => task.topic_grade === 11).length;
    expect(fromOpt).toBe(Math.round(EXAM_KINDS.augst.parts[0].tasks * 0.3));
  });

  it('задач мало — часть короче, но баллов столько же', () => {
    const config = EXAM_KINDS.visp;
    const parts = buildExamVariant(pool([10], 2, 3), config, { random: seeded(9) });
    expect(parts[0].tasks.length).toBeLessThan(config.parts[0].tasks);
    expect(parts[0].points.reduce((a, b) => a + b, 0)).toBe(config.parts[0].points);
  });

  it('assignExamPoints: сложнее — больше баллов, сумма точная', () => {
    const tasks = [{ difficulty: 'Базовый' }, { difficulty: 'Средний' }, { difficulty: 'Сложный' }];
    const points = assignExamPoints(tasks, 12);
    expect(points.reduce((a, b) => a + b, 0)).toBe(12);
    expect(points[0]).toBeLessThan(points[2]);
    expect(assignExamPoints([], 10)).toEqual([]);
  });

  it('scoreExam: баллы и проценты по частям, порог 20 %', () => {
    const parts = [{ ids: [1, 2, 3], points: [10, 20, 30] }, { ids: [4], points: [40] }];
    const result = scoreExam(parts, new Set([2, 4]));
    expect(result.points).toBe(60);
    expect(result.max).toBe(100);
    expect(result.percent).toBe(60);
    expect(result.passed).toBe(true);
    expect(result.parts.map(part => part.points)).toEqual([20, 40]);
    expect(scoreExam(parts, new Set([1])).passed).toBe(false);
  });
});

describe('честный режим: блокировка за уход со страницы', () => {
  const clock = (start = 0) => {
    let time = start;
    return { now: () => time, tick: ms => { time += ms; } };
  };

  it('уход и возврат — минута блокировки с момента возврата', () => {
    const c = clock(1000);
    const guard = createFocusGuard({ lockMs: 60000, now: c.now });
    guard.leave();
    c.tick(5 * 60 * 1000); // долгий уход не «отсиживает» блокировку заранее
    expect(guard.back()).toBe(true);
    expect(guard.remaining()).toBe(60000);
    c.tick(59000);
    expect(guard.remaining()).toBe(1000);
    c.tick(1000);
    expect(guard.remaining()).toBe(0);
    expect(guard.violations).toBe(1);
  });

  it('возврат без ухода и повторный возврат — не нарушение', () => {
    const guard = createFocusGuard({ now: () => 0 });
    expect(guard.back()).toBe(false);
    guard.leave();
    guard.leave(); // вкладка скрылась и окно потеряло фокус — один уход
    expect(guard.back()).toBe(true);
    expect(guard.back()).toBe(false);
    expect(guard.violations).toBe(1);
  });

  it('PrintScreen блокирует сразу; новое нарушение только продлевает', () => {
    const c = clock(0);
    const guard = createFocusGuard({ lockMs: 60000, now: c.now });
    guard.strike();
    c.tick(30000);
    guard.strike();
    expect(guard.remaining()).toBe(60000);
    expect(guard.violations).toBe(2);
  });

  it('блокировка переживает перезагрузку через restore', () => {
    const guard = createFocusGuard({ now: () => 0 });
    guard.restore({ lockedUntil: 45000, violations: 3 });
    expect(guard.remaining()).toBe(45000);
    expect(guard.violations).toBe(3);
  });
});
