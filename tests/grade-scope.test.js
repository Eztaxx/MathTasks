import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import i18n from '../public/i18n.js';
import { gradeNumber, gradeSlug } from '../public/lib.js';

/* Выбранный класс бывает словом ('matematika-1'), а колонка grade — числом.
   Слово в запросе база отвергала (22P02), и поиск на уровнях падал. */

describe('класс или уровень → число из колонки grade', () => {
  it('уровень — ровно один класс, обратно к gradeSlug', () => {
    expect(gradeNumber('visparigais')).toBe(10);
    expect(gradeNumber('matematika-1')).toBe(11);
    expect(gradeNumber('matematika-2')).toBe(12);
    for (let grade = 1; grade <= 12; grade += 1) expect(gradeNumber(gradeSlug(grade))).toBe(grade);
  });

  it('число класса проходит как есть, мусор — null', () => {
    expect(gradeNumber(7)).toBe(7);
    expect(gradeNumber('7')).toBe(7);
    expect(gradeNumber(null)).toBe(null);
    expect(gradeNumber('')).toBe(null);
    expect(gradeNumber('toString')).toBe(null);
    expect(gradeNumber('matematika-3')).toBe(null);
  });
});

describe('приложение: сужение по классу', () => {
  const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');

  it('в запрос задач класс попадает только через gradeNumber', () => {
    expect(app).toMatch(/const scopeToGrade = query => \(selectedGrade \? query\.eq\('grade', window\.MathTasksLib\.gradeNumber\(selectedGrade\)\)/);
    expect(app).not.toMatch(/\.eq\('grade', selectedGrade\)/);
    expect(app).not.toMatch(/\.eq\('grade', Number\(selectedGrade\)\)/);
  });

  it('поиск сужает задачи и темы так же, как страницы класса', () => {
    const search = app.match(/async function showSearch[\s\S]*?\n}\n/)[0];
    expect(search).toContain('request = scopeToGrade(request)');
    expect(search).toContain('isTopicInGrade(topic, selectedGrade)');
    expect(search).toContain("'search_scope_grade', { grade: gradeLabel(selectedGrade) }");
  });

  it('подпись «где искали» читается и для класса, и для уровня', () => {
    expect(i18n.t('search_scope_grade', { grade: '7 класс' }, 'ru')).toBe('в программе «7 класс»');
    expect(i18n.t('search_scope_grade', { grade: 'Optimālais līmenis' }, 'ru')).toBe('в программе «Optimālais līmenis»');
    expect(i18n.t('search_scope_grade', { grade: '7. klase' }, 'lv')).toBe('programmā «7. klase»');
    expect(i18n.t('search_scope_grade', { grade: 'Matemātika I (Optimālais)' }, 'lv')).toBe('programmā «Matemātika I (Optimālais)»');
  });
});
