import { describe, expect, it } from 'vitest';
import { buildPrintVariants, orderTopicsByGrade } from '../public/lib.js';

// Предсказуемый «случай»: одна и та же подборка при каждом прогоне.
const seeded = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const tasks = Array.from({ length: 24 }, (unused, i) => ({ id: i + 1 }));
const ids = list => list.map(task => task.id);

describe('подборка задач на печать', () => {
  it('берёт столько задач, сколько просили', () => {
    const [sheet] = buildPrintVariants(tasks, { count: 10, random: seeded() });
    expect(sheet).toHaveLength(10);
  });

  it('задач в теме меньше запрошенного — берёт сколько есть, без пустых мест', () => {
    const [sheet] = buildPrintVariants(tasks.slice(0, 7), { count: 30, random: seeded() });
    expect(sheet).toHaveLength(7);
  });

  it('без количества — вся тема', () => {
    const [sheet] = buildPrintVariants(tasks, { count: 0, random: seeded() });
    expect(sheet).toHaveLength(tasks.length);
  });

  it('один вариант без перемешивания сохраняет порядок темы', () => {
    const [sheet] = buildPrintVariants(tasks, { count: 5, shuffle: false, random: seeded() });
    expect(ids(sheet)).toEqual([1, 2, 3, 4, 5]);
  });

  it('варианты для соседей по парте — разные наборы', () => {
    const [first, second] = buildPrintVariants(tasks, { count: 8, variants: 2, random: seeded() });
    expect(first).toHaveLength(8);
    expect(second).toHaveLength(8);
    expect(ids(first)).not.toEqual(ids(second));
  });

  it('внутри варианта задачи не повторяются', () => {
    const [sheet] = buildPrintVariants(tasks, { count: 12, random: seeded(7) });
    expect(new Set(ids(sheet)).size).toBe(12);
  });

  it('в теме пусто — вариант пустой, а не сломанный', () => {
    expect(buildPrintVariants([], { count: 10, variants: 3 })).toEqual([[], [], []]);
  });

  it('вариантов просят больше девяти — обрезаем: столько листов никто не печатает', () => {
    expect(buildPrintVariants(tasks, { count: 4, variants: 40, random: seeded() })).toHaveLength(9);
  });
});

describe('порядок задач в листе', () => {
  const mixed = [
    { id: 1, difficulty: 'Сложный', subtopic_id: 2, position: 1 },
    { id: 2, difficulty: 'Базовый', subtopic_id: 1, position: 2 },
    { id: 3, difficulty: 'Средний', subtopic_id: 2, position: 3 },
    { id: 4, difficulty: 'Базовый', subtopic_id: 1, position: 4 }
  ];
  const subtopics = [{ id: 1, position: 1 }, { id: 2, position: 2 }];

  it('«как в теме» — порядок списка, без перестановок', () => {
    const [sheet] = buildPrintVariants(mixed, { order: 'topic', random: seeded() });
    expect(ids(sheet)).toEqual([1, 2, 3, 4]);
  });

  it('«как в теме» с выборкой — задачи всё равно идут по порядку темы', () => {
    const [first, second] = buildPrintVariants(tasks, { count: 6, variants: 2, order: 'topic', random: seeded() });
    expect(ids(first)).toEqual([...ids(first)].sort((a, b) => a - b));
    expect(ids(second)).toEqual([...ids(second)].sort((a, b) => a - b));
    expect(ids(first)).not.toEqual(ids(second));
  });

  it('«от простых к сложным» — сложность не убывает', () => {
    const [sheet] = buildPrintVariants(mixed, { order: 'diff_asc', random: seeded() });
    const weight = { 'Базовый': 1, 'Средний': 2, 'Сложный': 3 };
    const weights = sheet.map(task => weight[task.difficulty]);
    expect(weights).toEqual([...weights].sort((a, b) => a - b));
  });

  it('«по подтемам» — задачи одной подтемы идут подряд', () => {
    const [sheet] = buildPrintVariants(mixed, { order: 'subtopic', random: seeded(), subtopics });
    expect(sheet.map(task => task.subtopic_id)).toEqual([1, 1, 2, 2]);
  });

  it('неизвестный порядок — как в теме, а не пустой лист', () => {
    const [sheet] = buildPrintVariants(mixed, { order: 'неведомо', random: seeded() });
    expect(ids(sheet)).toEqual([1, 2, 3, 4]);
  });
});

describe('темы в админке идут от выбранного класса', () => {
  const topics = [
    { id: 1, grade: 7 }, { id: 2, grade: 9 }, { id: 3, grade: 9 },
    { id: 4, grade: null }, { id: 5, grade: 12 }
  ];

  it('выбранный класс — первой группой, остальные сохраняются', () => {
    const { current, rest } = orderTopicsByGrade(topics, 9);
    expect(current.map(t => t.id)).toEqual([2, 3]);
    expect(rest.map(t => t.id)).toEqual([1, 4, 5]);
  });

  it('класс не выбран — все темы в прежнем порядке', () => {
    const { current, rest } = orderTopicsByGrade(topics, null);
    expect(current).toEqual([]);
    expect(rest.map(t => t.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('класс задан числом, а у темы строкой — это один и тот же класс', () => {
    const { current } = orderTopicsByGrade([{ id: 8, grade: '9' }], 9);
    expect(current.map(t => t.id)).toEqual([8]);
  });

  it('в выбранном классе тем нет — список не теряется', () => {
    const { current, rest } = orderTopicsByGrade(topics, 3);
    expect(current).toEqual([]);
    expect(rest).toHaveLength(topics.length);
  });
});
