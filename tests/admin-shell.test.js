import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

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
});
