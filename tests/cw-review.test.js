import { describe, expect, it } from 'vitest';
import review from '../public/cw-review.js';
import '../public/lib.js';

const lib = globalThis.MathTasksLib;
const grade = (score, total) => lib.calculateControlWorkGrade(score, total);

const row = (extra = {}) => ({
  id: 1, nick: 'Anna', total: 4, score: 2, created_at: '2026-11-20T10:00:00Z', updated_at: '2026-11-20T10:00:00Z',
  answers: [
    { task_id: 11, ok: true, accepted: false, answer: '2' },
    { task_id: 12, ok: true, accepted: true, answer: '0,5' },
    { task_id: 13, ok: false, accepted: false, answer: '7' },
    { task_id: 14, ok: false, accepted: false, answer: '' }
  ],
  review: {},
  reviewed_at: null,
  ...extra
});

describe('проверка контрольной учителем', () => {
  it('без отметок итог равен автопроверке', () => {
    const totals = review.reviewTotals(row(), grade);
    expect(totals).toMatchObject({ score: 2, total: 4, percent: 50, marks: 0 });
    expect(totals.grade).toBe(grade(2, 4).grade);
  });

  it('отметка учителя перебивает автопроверку, полбалла считаются', () => {
    const totals = review.reviewTotals(row({ review: { 12: 0, 13: 0.5 } }), grade);
    expect(totals.score).toBe(1.5);
    expect(totals.percent).toBe(38);
    expect(totals.grade).toBe(grade(1.5, 4).grade);
    expect(totals.marks).toBe(2);
  });

  it('чужие значения в review не засчитываются', () => {
    const r = row({ review: { 13: 2, 14: '1', 11: 0.25 } });
    expect(review.teacherMark(r, 13)).toBeNull();
    expect(review.teacherMark(r, 14)).toBeNull();
    expect(review.reviewTotals(r, grade).score).toBe(2);
    expect(review.reviewTotals(row({ review: null }), grade).score).toBe(2);
  });

  it('withMark ставит и убирает отметку, не меняя исходный объект', () => {
    const before = { 12: 1 };
    const after = review.withMark(before, 13, 0.5);
    expect(after).toEqual({ 12: 1, 13: 0.5 });
    expect(before).toEqual({ 12: 1 });
    expect(review.withMark(after, 12, null)).toEqual({ 13: 0.5 });
    expect(review.withMark(after, 12, 3)).toEqual(after);
  });

  it('самозачёт без отметки учителя требует взгляда', () => {
    const r = row();
    expect(review.needsLook(r, r.answers[1])).toBe(true);
    expect(review.needsLook(r, r.answers[0])).toBe(false);
    const marked = row({ review: { 12: 1 } });
    expect(review.needsLook(marked, marked.answers[1])).toBe(false);
  });

  it('видит, что ученик изменил работу после проверки', () => {
    expect(review.changedAfterReview(row({ reviewed_at: '2026-11-20T11:00:00Z' }))).toBe(false);
    expect(review.changedAfterReview(row({ reviewed_at: '2026-11-20T09:00:00Z' }))).toBe(true);
    expect(review.changedAfterReview(row())).toBe(false);
  });

  it('сводка: столбцы в порядке работы, пустая клетка там, где задания не было', () => {
    const a = row();
    const b = row({ id: 2, nick: 'Bob', answers: [{ task_id: 13, ok: true, answer: '5' }, { task_id: 15, ok: false, answer: '' }], review: { 15: 0.5 } });
    const m = review.buildMatrix([a, b], [14, 13, 12, 11], grade);
    expect(m.columns).toEqual([14, 13, 12, 11, 15]);
    expect(m.lines[1].cells[0]).toBeNull();
    expect(m.lines[1].cells[1]).toMatchObject({ points: 1, mark: false });
    expect(m.lines[1].cells[4]).toMatchObject({ points: 0.5, mark: true });
    expect(m.solved[1]).toBe(50); // задание 13: у Anna 0, у Bob 1
    expect(m.solved[4]).toBe(50);
  });

  it('CSV для Excel: BOM, «;», запятая в дробях, без формул', () => {
    const a = row({ nick: '=HYPERLINK("x")', review: { 13: 0.5 } });
    const csv = review.matrixCsv(review.buildMatrix([a], [11, 12, 13, 14], grade));
    expect(csv.startsWith('\uFEFF')).toBe(true);
    const lines = csv.slice(1).trim().split('\r\n');
    expect(lines[0]).toBe('"Ник";"Дата";"№1";"№2";"№3";"№4";"Баллы";"Из";"%";"Оценка";"Проверено"');
    expect(lines[1]).toContain('"\'=HYPERLINK(""x"")"');
    expect(lines[1]).toContain('"0,5"');
    expect(lines[1]).toContain('"2,5";"4";"63"');
  });
});
