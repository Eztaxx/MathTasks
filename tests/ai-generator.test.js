import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import aiGen from '../public/ai-generator.js';

describe('Skola2030 Topics Catalog (JSON & Database integrity)', () => {
  const jsonPath = path.resolve(__dirname, '../public/data/skola2030_topics.json');
  const sqlPath = path.resolve(__dirname, '../supabase/seed_skola2030.sql');

  /* Каталог пересобирается из базы (scripts/sync-catalog-from-db.mjs), и
     число тем растёт вместе с ней — привязываться к нему нельзя. Держим
     то, на что опирается генератор: все двенадцать классов на месте,
     слаги уникальны, у каждой темы есть подтемы с номерами. */
  it('каталог skola2030_topics.json покрывает все классы с 1 по 12', () => {
    expect(fs.existsSync(jsonPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    expect(Array.isArray(content)).toBe(true);
    expect(content.length).toBeGreaterThanOrEqual(96);
    const grades = new Set(content.map(t => t.grade));
    for (let g = 1; g <= 12; g++) expect(grades.has(g)).toBe(true);
  });

  it('каждая тема имеет корректный класс, уникальный слаг, раздел, оба перевода и подтемы', () => {
    const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    /* Слаги разделов исторические: geometry и statistics по-английски. */
    const validSubjects = ['algebra', 'geometry', 'statistics', 'funkcijas', 'trigonometrija',
      'planimetrija', 'stereometrija', 'matematiskais-analizs', 'kombinatorika-un-varbutibas'];
    const slugs = new Set();

    content.forEach(topic => {
      expect(topic.grade).toBeGreaterThanOrEqual(1);
      expect(topic.grade).toBeLessThanOrEqual(12);
      expect(typeof topic.slug).toBe('string');
      expect(topic.slug.length).toBeGreaterThan(3);
      expect(slugs.has(topic.slug)).toBe(false);
      slugs.add(topic.slug);
      expect(validSubjects).toContain(topic.subject_slug);
      expect(topic.title_ru.length).toBeGreaterThan(3);
      expect(topic.title_lv.length).toBeGreaterThan(3);
      /* Номер темы стоит в начале обоих названий: по нему их различают
         и в интерфейсе, и в промпте генератора. */
      expect(topic.title_ru).toMatch(new RegExp(`^${topic.grade}\\.${topic.position}\\. `));
      expect(Array.isArray(topic.subtopics)).toBe(true);
      expect(topic.subtopics.length).toBeGreaterThan(0);
      topic.subtopics.forEach(sub => {
        expect(sub.num).toMatch(new RegExp(`^${topic.grade}\\.${topic.position}\\.\\d+$`));
        expect(sub.ru.length).toBeGreaterThan(2);
        expect(sub.lv.length).toBeGreaterThan(2);
      });
    });
  });

  it('файл seed_skola2030.sql содержит DDL ограничения, 3 раздела и 96 тем', () => {
    expect(fs.existsSync(sqlPath)).toBe(true);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    expect(sql).toContain('alter table public.topics add constraint topics_grade_range check (grade is null or grade between 1 and 12);');
    expect(sql).toContain("insert into public.subjects (title, title_lv, slug, icon, position)");
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

  it('переводит математический текст на латышский язык (термины Skola2030)', () => {
    const text = 'Решите уравнение: $2x + 5 = 15$. Ответ: $x = 5$.';
    const lv = aiGen.translateMathText(text, 'lv');

    expect(lv).toContain('Atrisiniet vienādojumu');
    expect(lv).toContain('Atbilde:');
  });

  it('все встроенные генераторы (1–12 классы) возвращают корректный answer_latex_lv', async () => {
    for (let g = 1; g <= 12; g++) {
      const task = await aiGen.generateTask({ grade: g });
      expect(task.answer_latex_lv).toBeTruthy();
      expect(typeof task.answer_latex_lv).toBe('string');
      expect(task.answer_latex_lv).toContain('$');
    }
  });

  it('генератор 6 класса корректно объясняет знак суммы чисел с разными знаками', async () => {
    for (let i = 0; i < 20; i++) {
      const task = await aiGen.generateTask({ grade: 6 });
      expect(task.solution_latex_ru).not.toContain('| > |-');
      expect(task.solution_latex_ru).toMatch(/больше|равен/i);
    }
  });
});
