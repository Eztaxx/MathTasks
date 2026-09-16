import { describe, expect, it } from 'vitest';
import { EXAM_KINDS, selectExamTasks, createFocusGuard } from '../public/lib.js';

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

  it('время уровня — сумма его частей, как на настоящем экзамене', () => {
    for (const kind of ['pamat', 'visp', 'opt', 'augst']) {
      const config = EXAM_KINDS[kind];
      expect(config.tasks).toBeGreaterThan(0);
      expect(config.parts.reduce((sum, part) => sum + part, 0)).toBe(config.minutes);
    }
    expect(EXAM_KINDS.pamat.parts).toEqual([105, 75]);
    expect(EXAM_KINDS.visp.parts).toEqual([135, 105]);
    expect(EXAM_KINDS.opt.parts).toEqual([135, 105]);
    expect(EXAM_KINDS.augst.parts).toEqual([180]);
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
