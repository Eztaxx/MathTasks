import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseTasksImport, TASK_PROMPT_COLUMNS } from '../public/lib.js';

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
    expect(segs).toEqual(['', 'draft', 'published', 'no_lv', 'no_label']);
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
    for (const name of ['isTaskAutoCheckable', 'answersDisagree', 'missingAnswerNumbers', 'hintRevealsAnswer', 'importDupKey']) {
      expect(js, name).toContain(`lib.${name}`);
    }
  });

  it('варианты для проверки: поля RU и LV, проверка колонки миграции 024, сохранение', () => {
    expect(html).toContain('name="answer_check" id="answer-check-input"');
    expect(html).toContain('name="answer_check_lv" id="answer-check-input-lv"');
    expect(js).toContain("select('answer_check')");
    expect(js).toContain("answer_check: answerCheckInput?.value.trim() || null");
  });

  it('варианты: пометка «каждый — с новой строки» и строка «Будут приняты»', () => {
    expect(html).toContain('Каждый вариант — с новой строки');
    expect(html).toContain('Katrs variants — jaunā rindā');
    for (const id of ['answer-check-preview', 'answer-check-preview-lv']) expect(html).toContain(`id="${id}"`);
    expect(js).toContain('Будут приняты: ');
  });

  /* Список задач грузится кнопкой, а поиск из шапки работает с любого
     экрана — без автозагрузки он ничего не находил. */
  it('поиск задач: сам грузит список и ищет по обычному тексту условия', () => {
    expect(js).toMatch(/const showTasksThenRender = \(\) => \{[\s\S]*?ensureTasksLoaded\(\)[\s\S]*?\};/);
    expect(js).toMatch(/function getFilteredTasks\(\) \{[\s\S]*?latexToPlainText[\s\S]*?idMatch/);
  });

  it('«Обзор»: карточка и список задач без автопроверки', () => {
    for (const id of ['adm-stat-nocheck', 'adm-nocheck-panel', 'adm-nocheck-list']) expect(html).toContain(`id="${id}"`);
    expect(js).toContain('function loadNoCheckList');
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
  it('образцы TSV и JSON разбираются без замечаний, у каждой задачи латышский текст и номер подтемы', () => {
    const decode = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const sample = id => decode(html.match(new RegExp(`id="${id}">([\\s\\S]*?)</code>`))[1]);
    const json = sample('json-sample-code');
    expect(() => JSON.parse(json)).not.toThrow();
    // Импорт всегда сохраняет черновиками — флаг публикации в образце только сбивал бы с толку.
    expect(json).not.toContain('is_published');
    for (const id of ['tsv-sample-code', 'json-sample-code']) {
      const res = parseTasksImport(sample(id));
      expect(res.warnings || []).toEqual([]);
      expect(res.tasks.length).toBeGreaterThan(0);
      for (const task of res.tasks) {
        expect(task.condition_latex_lv, id).toBeTruthy();
        expect(task.subtopic_code, id).toMatch(/^\d+\.\d+\.\d+$/);
      }
    }
  });

  /* TSV — единственный табличный формат импорта и то, в чём отвечает
     нейросеть по промпту. Образец в разметке лежит уже с табуляцией. */
  it('образец TSV: кнопка есть, образец разделён табуляцией и разбирается', () => {
    expect(html).toContain('data-imp-sample="tsv"');
    expect(html).not.toContain('data-imp-sample="csv"');
    const decode = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const tsv = decode(html.match(/id="tsv-sample-code">([\s\S]*?)<\/code>/)[1]);
    expect(tsv.split('\n')[0]).toContain('\t');
    expect(tsv.split('\n')[0]).not.toContain(';');
    const res = parseTasksImport(tsv);
    expect(res.format).toBe('tsv');
    expect(res.warnings || []).toEqual([]);
    expect(res.tasks.length).toBeGreaterThan(0);
  });


  /* Образец на странице и промпт «🤖 Промпт для ИИ» должны просить одни и
     те же столбцы: иначе модели достаются две разные спецификации и она
     мешает их между собой. */
  it('образец на странице совпадает со столбцами промпта', () => {
    const decode = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const tsv = decode(html.match(/id="tsv-sample-code">([\s\S]*?)<\/code>/)[1]);
    expect(tsv.split('\n')[0].split('\t')).toEqual([...TASK_PROMPT_COLUMNS]);
  });
  /* Поля выбора файла не должны звать CSV: импорт его больше не берёт. */
  it('в импорте не осталось приглашения загрузить CSV', () => {
    for (const accept of html.match(/accept="[^"]*"/g) || []) {
      if (accept.includes('json')) expect(accept, accept).not.toContain('csv');
    }
  });
});

/* Очередь проверки делится на кучки «без замечаний» и «с замечаниями»:
   у каждой кнопки свой счётчик, и скрипт знает каждое её значение. */
describe('кучки очереди проверки', () => {
  it('у каждой кучки есть кнопка и счётчик', () => {
    const states = [...html.matchAll(/data-review-state="(\w+)"/g)].map(m => m[1]);
    const counts = [...html.matchAll(/data-review-count="(\w+)"/g)].map(m => m[1]);
    expect(states).toEqual(['all', 'clean', 'issues']);
    expect(counts).toEqual(states);
    expect(js).toContain("reviewVerdict(task) === reviewState");
  });
});
