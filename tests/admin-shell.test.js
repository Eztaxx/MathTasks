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
    const aliases = ['review']; // пока открывает каталог с фильтром черновиков
    expect(links.filter(view => !views.includes(view) && !aliases.includes(view))).toEqual([]);
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
});
