import { describe, expect, it } from 'vitest';
import '../public/lib.js';

const { groupPaperVariants } = globalThis.MathTasksLib;

describe('составленные контрольные: варианты одной работы', () => {
  it('склеивает «…-a/-b/-c» с «(X variants)» в одну работу и убирает «Kontroldarbs:»', () => {
    const groups = groupPaperVariants([
      { slug: 'kd-kopas-un-varbutiba-b', title: 'Kontroldarbs: Kopas un varbūtība (B variants)' },
      { slug: 'kd-statistika-a', title: 'Kontroldarbs: Statistikas elementi (A variants)' },
      { slug: 'kd-kopas-un-varbutiba-a', title: 'Kontroldarbs: Kopas un varbūtība (A variants)' }
    ]);
    expect(groups.map(g => [g.key, g.title, g.variants.map(v => v.variant)])).toEqual([
      ['kd-kopas-un-varbutiba', 'Kopas un varbūtība', ['A', 'B']],
      ['kd-statistika', 'Statistikas elementi', ['A']]
    ]);
  });

  it('русское «(вариант B)» и название на языке страницы', () => {
    const groups = groupPaperVariants(
      [{ slug: 'kd-x-b', title: 'Контрольная работа: Дроби (вариант B)', title_lv: 'Kontroldarbs: Daļas (B variants)' }],
      paper => paper.title
    );
    expect(groups[0]).toMatchObject({ key: 'kd-x', title: 'Дроби' });
    expect(groups[0].variants[0].variant).toBe('B');
  });

  it('работа без варианта в названии не склеивается по одному slug', () => {
    const groups = groupPaperVariants([
      { slug: 'kd-plan-a', title: 'Kontroldarbs: Plāns' },
      { slug: 'kd-plan-b', title: 'Kontroldarbs: Plāns 2' },
      { slug: 'kd-mix-a', title: 'Kontroldarbs: Mix (B variants)' }
    ]);
    expect(groups.map(g => [g.key, g.variants[0].variant])).toEqual([
      ['kd-plan-a', ''], ['kd-plan-b', ''], ['kd-mix-a', '']
    ]);
    // Нераспознанный вариант остаётся в названии — карточки различимы.
    expect(groups[2].title).toBe('Mix (B variants)');
  });

  it('slug из названия («…-a-variants») — не вариант, буква в названии остаётся', () => {
    const groups = groupPaperVariants([
      { slug: 'kontroldarbs-dalas-a-variants', title: 'Kontroldarbs: Daļas (A variants)' },
      { slug: 'kontroldarbs-dalas-b-variants', title: 'Kontroldarbs: Daļas (B variants)' }
    ]);
    expect(groups.map(g => g.title)).toEqual(['Daļas (A variants)', 'Daļas (B variants)']);
  });

  it('кириллическая «А» в «(вариант А)» совпадает с латинской «-a» в slug', () => {
    const groups = groupPaperVariants([
      { slug: 'kd-drobi-a', title: 'Контрольная работа: Дроби (вариант А)' },
      { slug: 'kd-drobi-b', title: 'Контрольная работа: Дроби (вариант В)' }
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe('Дроби');
    expect(groups[0].variants.map(v => v.variant)).toEqual(['A', 'B']);
  });

  it('пустой и битый ввод', () => {
    expect(groupPaperVariants()).toEqual([]);
    expect(groupPaperVariants([null, {}, { slug: '' }])).toEqual([]);
  });
});
