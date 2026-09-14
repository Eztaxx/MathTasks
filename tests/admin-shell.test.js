import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { csvToTsv, parseTasksImport } from '../public/lib.js';

/* Каркас админки собирается при загрузке: admin.js переносит разделы на
   экраны по id и кладёт кнопки в слоты. Опечатка в id или слоте ничего
   не роняет — раздел просто молча остаётся вне экранов и пропадает из
   вида. Эти проверки сверяют скрипт с разметкой. */
const html = readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../public/admin.js', import.meta.url), 'utf8');

const links = [...html.matchAll(/data-view-link="([\w-]+)"/g)].map(m => m[1]);
const views = [...html.matchAll(/class="adm-view"[^>]*data-view="([\w-]+)"/g)].map(m => m[1]);

describe('каркас админки: меню и экраны', () => {
  it('у каждого пункта меню есть экран', () => {
    expect(links.length).toBeGreaterThanOrEqual(8);
    expect(links.filter(view => !views.includes(view))).toEqual([]);
  });

  it('каждый элемент, который скрипт переносит, есть в разметке', () => {
    const ids = [...new Set([...js.matchAll(/byId\('([\w-]+)'\)/g)].map(m => m[1]))];
    expect(ids.length).toBeGreaterThan(10);
    expect(ids.filter(id => !html.includes(`id="${id}"`))).toEqual([]);
  });

  it('каждый слот, куда скрипт кладёт кнопки, есть в разметке', () => {
    const slots = [...new Set([...js.matchAll(/slot\('([\w-]+)'\)/g)].map(m => m[1]))];
    expect(slots.length).toBeGreaterThan(2);
    expect(slots.filter(name => !html.includes(`data-slot="${name}"`))).toEqual([]);
  });

  it('каждый экран, куда переносятся разделы, есть в разметке', () => {
    const targets = [...new Set([...js.matchAll(/viewBody\('([\w-]+)'\)/g)].map(m => m[1]))];
    expect(targets.filter(view => !views.includes(view))).toEqual([]);
  });

  it('цепочка выбора места и полоса готовности присутствуют в разметке', () => {
    const requiredIds = [
      'adm-editor-place',
      'adm-crumbs',
      'adm-crumb-grade',
      'adm-crumb-topic',
      'adm-crumb-subtopic',
      'adm-editor-ready-bar',
      'adm-ready-dot',
      'adm-ready-text',
      'adm-missing-chips',
      'adm-btn-save-draft',
      'adm-btn-publish'
    ];
    for (const id of requiredIds) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).not.toContain('id="adm-crumb-subject"');
  });

  it('каждый сегмент статуса в каталоге есть среди значений фильтра статуса', () => {
    const segs = [...html.matchAll(/data-seg-status="([\w-]*)"/g)].map(m => m[1]);
    expect(segs).toEqual(['', 'draft', 'published', 'no_lv']);
    const select = html.match(/<select id="task-filter-status"[\s\S]*?<\/select>/)[0];
    const values = [...select.matchAll(/value="([\w-]*)"/g)].map(m => m[1]);
    expect(segs.filter(v => !values.includes(v))).toEqual([]);
  });

  it('список классов в пикере включает все 12 классов', () => {
    for (let g = 1; g <= 12; g++) {
      expect(js).toContain(`${g}. klase`);
    }
  });

  it('в скрипте предусмотрена естественная числовая сортировка подтем', () => {
    expect(js).toContain('numeric: true');
  });

  it('в скрипте реализованы функции нумерации тем и точного подсчёта задач', () => {
    expect(js).toContain('getTopicCode');
    expect(js).toContain('cleanTopicTitle');
    expect(js).toContain('getGradeTaskCount');
    expect(js).toContain('getTopicTaskCount');
    expect(js).toContain('getSubtopicTaskCount');
  });

  it('селекты класса, темы и подтемы находятся внутри цепочки adm-crumbs', () => {
    expect(html).toMatch(/id="adm-crumbs"[\s\S]*?id="task-grade"[\s\S]*?id="topic-select"[\s\S]*?id="subtopic-select"/);
    expect(js).toContain('updateTaskGradeDropdown');
    expect(js).toContain('updateTaskTopicDropdown');
    expect(js).toContain('updateSubtopicDropdown');
  });
  it('слева сверху — кнопка «На главную» иконкой, с подписью для читалок', () => {
    const button = html.match(/<a class="adm-home-btn"[^>]*>/)?.[0] || '';
    expect(button).toContain('href="/"');
    expect(button).toContain('aria-label="На главную"');
    expect(html.indexOf('adm-home-btn')).toBeLessThan(html.indexOf('adm-brand-title'));
  });

  it('полоса готовности сверяет поля между собой', () => {
    for (const text of [
      'Ответ не проверяется автоматически',
      'Подсказка выдаёт ответ',
      'Ответы RU и LV расходятся',
      'Ответа нет в решении',
      'Нет подсказки на LV',
      'Латышские буквы в русском тексте',
      'Кириллица в латышском тексте',
      'Такое условие уже есть'
    ]) {
      expect(js, text).toContain(text);
    }
    // Функции, на которых стоят проверки, должны быть в lib.js.
    for (const name of ['isAnswerAutoCheckable', 'answersDisagree', 'missingAnswerNumbers', 'hintRevealsAnswer', 'importDupKey']) {
      expect(js, name).toContain(`lib.${name}`);
    }
  });

  it('id в admin.html не повторяются', () => {
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    const repeated = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    expect(repeated).toEqual([]);
  });

  it('мастер импорта: шаги 1–3 и кнопки разбора и импорта', () => {
    expect([...html.matchAll(/class="imp-step[^"]*" data-step="(\d)"/g)].map(m => m[1])).toEqual(['1', '2', '3']);
    for (const id of ['imp-drop', 'imp-file', 'imp-text', 'imp-analyze', 'imp-run', 'imp-rows', 'imp-done']) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it('«Место»: у класса, темы и подтемы — кнопки с окном выбора, значения в скрытых списках', () => {
    for (const kind of ['grade', 'topic', 'subtopic']) expect(html).toContain(`data-crumb="${kind}"`);
    for (const id of ['adm-place-pop', 'adm-place-pop-search', 'adm-place-pop-list']) expect(html).toContain(`id="${id}"`);
    expect(js).toContain("openPlacePop(action.replace('pick-', ''))");
  });

  it('кнопки сложности совпадают с вариантами скрытого списка сложности', () => {
    const buttons = [...html.matchAll(/data-difficulty="([^"]+)"/g)].map(m => m[1]);
    const select = html.match(/<select name="difficulty"[\s\S]*?<\/select>/)[0];
    const options = [...select.matchAll(/<option[^>]*>([^<]+)<\/option>/g)].map(m => m[1]);
    expect(buttons).toEqual(options);
  });

  it('у каждого типа ошибки, который присылает сайт, есть подпись в админке', () => {
    const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
    const kinds = JSON.parse(app.match(/const REPORT_KINDS = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
    const labels = js.match(/const REPORT_KIND_LABELS = \{([^}]*)\}/)[1];
    expect(kinds.length).toBeGreaterThan(3);
    expect(kinds.filter(kind => !new RegExp(`\\b${kind}:`).test(labels))).toEqual([]);
  });

  it('переключатели языка: в редакторе и в проверке — русский, латышский и оба рядом', () => {
    expect([...html.matchAll(/id="adm-editor-lang-(\w+)"/g)].map(m => m[1])).toEqual(['ru', 'lv', 'both']);
    expect([...html.matchAll(/data-review-lang="(\w+)"/g)].map(m => m[1])).toEqual(['ru', 'lv', 'both']);
    // Переключатель редактора — в полосе, которая прилипает под шапкой.
    expect(html).toMatch(/class="adm-editor-toolbar"[\s\S]*?id="adm-editor-lang-ru"/);
  });

  /* Образцы на экране импорта — то, что копируют как шаблон. Старый JSON
     ссылался на несуществующие темы: его импорт заводил мусорные темы. */
  it('образцы CSV и JSON разбираются без замечаний, у каждой задачи латышский текст и номер подтемы', () => {
    const decode = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const sample = id => decode(html.match(new RegExp(`id="${id}">([\\s\\S]*?)</code>`))[1]);
    const json = sample('json-sample-code');
    expect(() => JSON.parse(json)).not.toThrow();
    // Импорт всегда сохраняет черновиками — флаг публикации в образце только сбивал бы с толку.
    expect(json).not.toContain('is_published');
    for (const id of ['csv-sample-code', 'json-sample-code']) {
      const res = parseTasksImport(sample(id));
      expect(res.warnings || []).toEqual([]);
      expect(res.tasks.length).toBeGreaterThan(0);
      for (const task of res.tasks) {
        expect(task.condition_latex_lv, id).toBeTruthy();
        expect(task.subtopic_code, id).toMatch(/^\d+\.\d+\.\d+$/);
      }
    }
  });

  /* TSV — формат, в котором отвечает нейросеть по промпту. Отдельной копии
     в разметке нет: кнопка «TSV» собирает его из образца CSV. */
  it('образец TSV: кнопка есть, он собирается из CSV и даёт те же задачи', () => {
    expect(html).toContain('data-imp-sample="tsv"');
    expect(js).toContain('csvToTsv');
    const decode = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const csv = decode(html.match(/id="csv-sample-code">([\s\S]*?)<\/code>/)[1]);
    const tsv = csvToTsv(csv);
    expect(tsv.split('\n')[0]).toContain('\t');
    const fromCsv = parseTasksImport(csv);
    const fromTsv = parseTasksImport(tsv);
    expect(fromTsv.warnings || []).toEqual([]);
    expect(fromTsv.tasks).toEqual(fromCsv.tasks);
  });
});
