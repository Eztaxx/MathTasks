import { describe, it, expect } from 'vitest';
import { nextPaper, paperSlug, paperTitle, taskPrefix, perSubtopic, difficultyMix, variantLetter, slugPart, isOlympiad } from '../.claude/skills/add-papers/scripts/plan.mjs';

const T = (id, grade, position, title = `Tēma ${id}`) => ({ id, grade, position, slug: `t-${id}`, title_lv: title });

describe('add-papers: выбор темы', () => {
  const topics = [T(1, 6, 1), T(2, 10, 3, 'Skaitliskie aprēķini dzīves darbībā'), T(3, 11, 1), T(4, 9, 9, 'Olimpiāžu metodes')];
  const subCount = new Map([[1, 3], [2, 12], [3, 4], [4, 4]]);

  it('сначала 10 класс, затем 11; олимпиадные темы — никогда', () => {
    const got = nextPaper({ topics, subCount, variantsOf: new Map() });
    expect(got.topic.id).toBe(2);
    expect(got.variant).toBe('A');
    expect(isOlympiad(topics[3])).toBe(true);
  });

  it('у темы с A следующим идёт B, но сначала темы без вариантов', () => {
    const variantsOf = new Map([[2, new Set(['A'])]]);
    expect(nextPaper({ topics, subCount, variantsOf }).topic.id).toBe(3);
    const all = new Map([[1, new Set(['A'])], [2, new Set(['A'])], [3, new Set(['A'])]]);
    const got = nextPaper({ topics, subCount, variantsOf: all });
    expect(got).toMatchObject({ variant: 'B' });
    expect(got.topic.id).toBe(2);
  });

  it('темы без подтем, с двумя неудачами и с A/B/C пропускаются; всё составлено — null', () => {
    const variantsOf = new Map([[2, new Set(['A', 'B', 'C'])], [3, new Set(['A', 'B'])]]);
    expect(nextPaper({ topics, subCount: new Map([[1, 0], [2, 12], [3, 4]]), variantsOf })).toBeNull();
    expect(nextPaper({ topics, subCount, variantsOf, failedTwice: new Set([1]) })).toBeNull();
  });

  it('поток берёт только свои классы', () => {
    expect(nextPaper({ topics, subCount, variantsOf: new Map(), grades: [6, 7, 8] }).topic.id).toBe(1);
  });
});

describe('add-papers: имена и состав', () => {
  const topic = T(2, 10, 3, 'Skaitliskie aprēķini dzīves darbībā');
  it('слаг латинский без диакритики, буква варианта в конце', () => {
    expect(paperSlug(topic, 'A')).toBe('kd-10-3-skaitliskie-aprekini-dzives-darbiba-a');
    expect(variantLetter(paperSlug(topic, 'B'))).toBe('B');
    expect(slugPart('Kā kopumu sadala noteiktā attiecībā?')).toBe('ka-kopumu-sadala-noteikta');
  });
  it('название и префикс заданий', () => {
    expect(paperTitle({ ...topic, title_lv: 'Kā kopumu sadala?' }, 'A')).toBe('Kontroldarbs: Kā kopumu sadala (A variants)');
    expect(taskPrefix(topic, 'B')).toBe('KD 10.3 B:');
  });
  it('каждой подтеме хотя бы одно задание, сумма — цель', () => {
    expect(perSubtopic(12, 20).reduce((a, b) => a + b, 0)).toBe(20);
    expect(Math.min(...perSubtopic(12, 20))).toBeGreaterThanOrEqual(1);
    expect(perSubtopic(4, 20)).toEqual([5, 5, 5, 5]);
  });
  it('смесь сложности: все три уровня, сложных не меньше двух', () => {
    const m = difficultyMix(20);
    expect(m['Лёгкий'] + m['Средний'] + m['Сложный']).toBe(20);
    expect(m['Сложный']).toBeGreaterThanOrEqual(2);
  });
});
