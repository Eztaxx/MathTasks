import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import aiGen from '../public/ai-generator.js';

describe('Skola2030 Topics Catalog (JSON & Database integrity)', () => {
  const jsonPath = path.resolve(__dirname, '../public/data/skola2030_topics.json');
  const sqlPath = path.resolve(__dirname, '../supabase/seed_skola2030.sql');

  it('каталог skola2030_topics.json существует и содержит 81 тему стандарта Skola2030', () => {
    expect(fs.existsSync(jsonPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    expect(Array.isArray(content)).toBe(true);
    expect(content.length).toBe(81);
  });

  it('каждая тема имеет корректный класс (1–12), слаг, разделы и переводы (RU, LV, EN)', () => {
    const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const validSubjects = ['algebra', 'geometry', 'statistics'];

    content.forEach(topic => {
      expect(topic.grade).toBeGreaterThanOrEqual(1);
      expect(topic.grade).toBeLessThanOrEqual(12);
      expect(topic.slug).toMatch(/^skola2030-g\d+/);
      expect(validSubjects).toContain(topic.subject_slug);
      expect(topic.title_ru.length).toBeGreaterThan(3);
      expect(topic.title_lv.length).toBeGreaterThan(3);
      expect(topic.title_en.length).toBeGreaterThan(3);
      expect(Array.isArray(topic.subtopics)).toBe(true);
      expect(topic.subtopics.length).toBeGreaterThan(0);
    });
  });

  it('файл seed_skola2030.sql содержит DDL ограничения, 3 раздела и 81 тему', () => {
    expect(fs.existsSync(sqlPath)).toBe(true);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    expect(sql).toContain('alter table public.topics add constraint topics_grade_range check (grade is null or grade between 1 and 12);');
    expect(sql).toContain("insert into public.subjects (title, title_lv, title_en, slug, icon, position)");
    expect(sql).toContain("insert into public.topics");
    expect(sql).toContain("skola2030-g1-1");
    expect(sql).toContain("skola2030-g12-");
  });
});

describe('AI Task Generator (Skola2030 Autonomous Engine)', () => {
  it('генерирует задачу для начальной школы (1–4 классы)', async () => {
    const task = await aiGen.generateTask({ grade: 1, topicTitle: 'Сложение в пределах 10' });
    expect(task.grade).toBe(1);
    expect(task.title_ru).toBeTruthy();
    expect(task.title_lv).toBeTruthy();
    expect(task.title_en).toBeTruthy();
    expect(task.condition_latex_ru).toContain('$');
    expect(task.answer_latex).toContain('$');
    expect(task.solution_latex_ru).toContain('$');
  });

  it('генерирует задачу по теореме Пифагора для 8 класса с точным ответом', async () => {
    const task = await aiGen.generateTask({ grade: 8, topicTitle: 'Теорема Пифагора' });
    expect(task.grade).toBe(8);
    expect(task.condition_latex_ru).toMatch(/треугольник|катет|гипотенуз/i);
    expect(task.solution_latex_ru).toContain('c^2 = a^2 + b^2');
    expect(task.answer_latex).toMatch(/\$c = \d+\\text\{ см\}\$/);
  });

  it('генерирует квадратное уравнение для 9 класса с дискриминантом', async () => {
    const task = await aiGen.generateTask({ grade: 9, topicTitle: 'Квадратные уравнения' });
    expect(task.grade).toBe(9);
    expect(task.condition_latex_ru).toMatch(/x\^2/);
    expect(task.solution_latex_ru).toContain('D = b^2 - 4ac');
    expect(task.answer_latex).toMatch(/x_1/);
  });

  it('генерирует логарифмическое уравнение для 11 класса (Matemātika I)', async () => {
    const task = await aiGen.generateTask({ grade: 11, topicTitle: 'Логарифмы' });
    expect(task.grade).toBe(11);
    expect(task.condition_latex_ru).toContain('\\log_');
    expect(task.answer_latex).toMatch(/x = \d+/);
  });

  it('генерирует задачу на производную для 12 класса (Matemātika II)', async () => {
    const task = await aiGen.generateTask({ grade: 12, topicTitle: 'Производная функции' });
    expect(task.grade).toBe(12);
    expect(task.condition_latex_ru).toMatch(/производн|f\(x\)/i);
    expect(task.solution_latex_ru).toContain("f'(x)");
    expect(task.answer_latex).toMatch(/f'\(\d+\)/);
  });

  it('принимает сюжетный контекст задачи (context) в генератор', async () => {
    const task = await aiGen.generateTask({
      grade: 7,
      topicTitle: 'Линейные уравнения',
      context: 'Покупка билетов в кино со скидкой'
    });
    expect(task.grade).toBe(7);
    expect(task.condition_latex_ru).toBeTruthy();
    expect(task.answer_latex).toBeTruthy();
  });

  it('переводит математический текст на латышский и английский языки', () => {
    const text = 'Решите уравнение: $2x + 5 = 15$. Ответ: $x = 5$.';
    const lv = aiGen.translateMathText(text, 'lv');
    const en = aiGen.translateMathText(text, 'en');

    expect(lv).toContain('Atrisiniet vienādojumu');
    expect(lv).toContain('Atbilde:');
    expect(en).toContain('Solve the equation');
    expect(en).toContain('Answer:');
  });
});
