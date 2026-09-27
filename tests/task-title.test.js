import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildTitlePrompt, parseTitleSuggestion } from '../public/lib.js';

/* А7: задача без названия получала «Задача №N» — так в базе оказались 284
   заглушки. Теперь название обязательно, а кнопка «Предложить название»
   просит его у Gemini. Сеть здесь не нужна: проверяются промпт и разбор. */

describe('промпт названия задачи', () => {
  it('в промпте условие на обоих языках, тема, предел длины и вид ответа', () => {
    const prompt = buildTitlePrompt({
      condition: 'Катеты равны $6$ и $8$. Найдите гипотенузу.',
      conditionLv: 'Katetes ir $6$ un $8$. Aprēķiniet hipotenūzu.',
      topicTitle: 'Теорема Пифагора',
      gradeLabel: '8 класс'
    });
    expect(prompt).toContain('Катеты равны $6$ и $8$');
    expect(prompt).toContain('Katetes ir $6$ un $8$');
    expect(prompt).toContain('Тема: Теорема Пифагора, 8 класс');
    expect(prompt).toContain('60 знаков');
    expect(prompt).toContain('{"title":"…","title_lv":"…"}');
  });
});

describe('разбор ответа модели', () => {
  it('JSON в блоке кода, кавычки и точка по краям — снимаются', () => {
    const raw = '```json\n{"title":"«Гипотенуза по двум катетам.»","title_lv":"Hipotenūza pēc divām katetēm."}\n```';
    expect(parseTitleSuggestion(raw)).toEqual({ title: 'Гипотенуза по двум катетам', title_lv: 'Hipotenūza pēc divām katetēm' });
  });

  it('массив с одним объектом и title_ru вместо title — тоже годятся', () => {
    expect(parseTitleSuggestion('[{"title_ru":"Скидка на рюкзак","title_lv":"Atlaide mugursomai"}]'))
      .toEqual({ title: 'Скидка на рюкзак', title_lv: 'Atlaide mugursomai' });
  });

  it('«Задача:» в начале срезается', () => {
    expect(parseTitleSuggestion({ title: 'Задача: Площадь квадрата', title_lv: 'Uzdevums: Kvadrāta laukums' }))
      .toEqual({ title: 'Площадь квадрата', title_lv: 'Kvadrāta laukums' });
  });

  it('заглушка, номер, пустое, слишком длинное или без латышского — не годится', () => {
    expect(parseTitleSuggestion('{"title":"Задача №3","title_lv":"Uzdevums №3"}')).toBeNull();
    expect(parseTitleSuggestion('{"title":"Задача про №5 и скидку","title_lv":"Atlaide"}')).toBeNull();
    expect(parseTitleSuggestion('{"title":"","title_lv":"Atlaide"}')).toBeNull();
    expect(parseTitleSuggestion(JSON.stringify({ title: 'а'.repeat(90), title_lv: 'b' }))).toBeNull();
    expect(parseTitleSuggestion('{"title":"Скидка на рюкзак"}')).toBeNull();
    expect(parseTitleSuggestion('не JSON')).toBeNull();
  });
});

describe('редактор задачи: название обязательно', () => {
  const html = readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
  const admin = readFileSync(new URL('../public/admin.js', import.meta.url), 'utf8');

  it('в форме есть поля названия на двух языках и кнопка «Предложить название»', () => {
    const form = html.slice(html.indexOf('<form class="task-form" id="task-form">'), html.indexOf('</form>', html.indexOf('id="task-form"')));
    expect(form).toContain('name="title" id="task-title-input"');
    expect(form).toContain('name="title_lv" id="task-title-input-lv"');
    expect(form).toContain('id="btn-suggest-title"');
  });

  it('заглушки «Задача №N» при сохранении и импорте больше нет', () => {
    expect(admin).not.toContain('defaultTitleLv');
    expect(admin).not.toMatch(/: `Задача №\$\{taskPos\}`/);
    expect(admin).toContain('У задачи нет названия');
    expect(admin).toContain('нет названия (столбец title)');
  });
});
