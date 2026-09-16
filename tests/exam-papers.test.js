import { describe, expect, it } from 'vitest';
import { orderPaperTasks, paperMinutes } from '../public/lib.js';

const tasks = [
  { id: 1, title: 'первая' },
  { id: 2, title: 'вторая' },
  { id: 3, title: 'третья' }
];

describe('собранный вариант: порядок задач', () => {
  it('идёт по частям, внутри части — по позиции', () => {
    const items = [
      { task_id: 3, part: 2, position: 1 },
      { task_id: 2, part: 1, position: 2 },
      { task_id: 1, part: 1, position: 1 }
    ];
    expect(orderPaperTasks(items, tasks).map(t => t.id)).toEqual([1, 2, 3]);
  });

  it('помечает каждую задачу её частью', () => {
    const items = [
      { task_id: 1, part: 1, position: 1 },
      { task_id: 3, part: 2, position: 1 }
    ];
    expect(orderPaperTasks(items, tasks).map(t => t.paperPart)).toEqual([1, 2]);
  });

  it('снятая с публикации задача вариант не ломает', () => {
    const items = [
      { task_id: 1, part: 1, position: 1 },
      { task_id: 99, part: 1, position: 2 },
      { task_id: 2, part: 1, position: 3 }
    ];
    expect(orderPaperTasks(items, tasks).map(t => t.id)).toEqual([1, 2]);
  });

  it('без частей и позиций держит порядок по номеру задачи', () => {
    const items = [{ task_id: 2 }, { task_id: 1 }];
    expect(orderPaperTasks(items, tasks).map(t => t.id)).toEqual([1, 2]);
  });

  it('пустые данные не роняют разбор', () => {
    expect(orderPaperTasks(null, null)).toEqual([]);
    expect(orderPaperTasks([], tasks)).toEqual([]);
  });
});

describe('собранный вариант: время', () => {
  it('складывает время частей', () => {
    expect(paperMinutes({ minutes: 40, parts: [{ minutes: 105 }, { minutes: 75 }] })).toBe(180);
  });

  it('без частей берёт общее время', () => {
    expect(paperMinutes({ minutes: 90, parts: [] })).toBe(90);
    expect(paperMinutes({ minutes: 90 })).toBe(90);
  });

  it('часть без времени не укорачивает работу', () => {
    expect(paperMinutes({ minutes: 40, parts: [{ minutes: 105 }, { title: 'без времени' }] })).toBe(105);
  });

  it('у пустого варианта время не нулевое', () => {
    expect(paperMinutes({})).toBe(40);
    expect(paperMinutes(null)).toBe(40);
  });
});
