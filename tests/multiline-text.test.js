import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { normalizeLineBreaks, trimBlockBreaks } from '../public/lib.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

/* Мини-дерево: ровно то, чем пользуется trimBlockBreaks. jsdom в проекте нет,
   а разбирать надо форму, которую даёт KaTeX auto-render: выключная формула
   лежит в безымянном <span>, а не прямо в контейнере. */
class Node {
  constructor(nodeType, { nodeValue = '', className = '' } = {}) {
    Object.assign(this, { nodeType, nodeValue, className, childNodes: [], parentNode: null });
  }

  get previousSibling() {
    const list = this.parentNode?.childNodes ?? [];
    return list[list.indexOf(this) - 1] ?? null;
  }

  get nextSibling() {
    const list = this.parentNode?.childNodes ?? [];
    return list[list.indexOf(this) + 1] ?? null;
  }

  get firstChild() { return this.childNodes[0] ?? null; }

  get lastChild() { return this.childNodes[this.childNodes.length - 1] ?? null; }
}

const adopt = (parent, children) => {
  parent.childNodes = children;
  children.forEach(child => { child.parentNode = parent; });
  return parent;
};
const text = nodeValue => new Node(3, { nodeValue });
const inline = () => adopt(new Node(1), [new Node(1, { className: 'katex' })]);
const display = () => adopt(new Node(1), [new Node(1, { className: 'katex-display' })]);
const container = (...children) => {
  const root = adopt(new Node(1), children);
  const found = [];
  const walk = node => node.childNodes.forEach(child => {
    if (child.className === 'katex-display') found.push(child);
    walk(child);
  });
  walk(root);
  root.querySelectorAll = selector => (selector === '.katex-display' ? found : []);
  return root;
};
const values = root => root.childNodes.filter(node => node.nodeType === 3).map(node => node.nodeValue);

describe('переводы строк в тексте задачи: trimBlockBreaks', () => {
  it('срезает перевод строки по обе стороны выключной формулы', () => {
    const root = container(text('Раскроем скобки:\r\n'), display(), text('\r\n'), display(), text('\r\n\r\nПеренесём слагаемые '), inline(), text(' влево.'));
    trimBlockBreaks(root);
    expect(values(root)).toEqual(['Раскроем скобки:', '', 'Перенесём слагаемые ', ' влево.']);
  });

  it('пустая строка между двумя блоками не остаётся: иначе решение из трёх формул вырастает вдвое', () => {
    const root = container(display(), text('\n'), display(), text('\n'), display());
    trimBlockBreaks(root);
    expect(values(root)).toEqual(['', '']);
  });

  it('пробел рядом с блоком без перевода строки не трогает', () => {
    const root = container(text('Значит: '), display(), text(' и всё.'));
    trimBlockBreaks(root);
    expect(values(root)).toEqual(['Значит: ', ' и всё.']);
  });

  it('переводы строк между шагами и рядом со строчными формулами остаются', () => {
    const root = container(text('1) Пусть '), inline(), text('.\n2) Тогда '), inline(), text(':\n3) Итог.'));
    trimBlockBreaks(root);
    expect(values(root)).toEqual(['1) Пусть ', '.\n2) Тогда ', ':\n3) Итог.']);
  });

  it('срезает перевод строки в начале и конце текста, а внутри оставляет', () => {
    const root = container(text('\r\nШаг 1\nШаг 2\n'));
    trimBlockBreaks(root);
    expect(values(root)).toEqual(['Шаг 1\nШаг 2']);
  });

  it('начало и конец, занятые формулами, не ломают разбор', () => {
    const root = container(display(), text('\nОтвет.'));
    trimBlockBreaks(root);
    expect(values(root)).toEqual(['Ответ.']);
  });

  it('без элемента или без querySelectorAll молчит', () => {
    expect(() => trimBlockBreaks(null)).not.toThrow();
    expect(() => trimBlockBreaks({})).not.toThrow();
  });
});

describe('переводы строк в тексте задачи: normalizeLineBreaks', () => {
  it('«\\r\\n» и одиночный «\\r» становятся «\\n», остальное не трогает', () => {
    expect(normalizeLineBreaks('1) a\r\n2) b\r\n\r\n3) c')).toBe('1) a\n2) b\n\n3) c');
    expect(normalizeLineBreaks('a\rb\nc')).toBe('a\nb\nc');
    expect(normalizeLineBreaks('без переводов $x$')).toBe('без переводов $x$');
  });

  // renderMath зовёт её для любого .multiline; null и число не должны превратиться в текст «null».
  it('не строку возвращает как есть', () => {
    expect(normalizeLineBreaks(null)).toBeNull();
    expect(normalizeLineBreaks(undefined)).toBeUndefined();
    expect(normalizeLineBreaks(7)).toBe(7);
  });
});

describe('переводы строк в тексте задачи: где они показываются', () => {
  const css = read('style.css');
  const app = read('public/app.js');
  const html = read('index.html');
  const client = read('public/client.js');

  it('white-space: pre-line стоит на отдельном классе, а не на всех .math', () => {
    expect(css).toMatch(/\.multiline\{white-space:pre-line\}/);
    // Ответы, подписи полей и «Мой прогресс» — тоже .math, но остаются в одну строку.
    expect(css).not.toMatch(/(^|[},\s])\.math(?:\s+\.[\w-]+)?\s*\{[^}]*white-space:\s*pre-line/);
    expect(css).not.toMatch(/\.progress-recent-text[^{}]*\{[^}]*white-space:\s*pre-line/);
  });

  // Условие, подсказка и решение в карточке; разбор в окне 💡; контрольная; печатный лист.
  it('класс стоит на условии, подсказке и решении во всех видах', () => {
    const marked = (source, attr) => new RegExp(`<div class="[^"]*\\bmultiline\\b[^"]*" ${attr}`).test(source);
    for (const attr of ['data-condition>', 'data-hint>', 'data-solution>', 'data-drill-condition=', 'data-cw-condition=', 'data-cw-sol=', 'data-print-latex="\\$\\{escapeHtml\\((?:solution|loc\\(task, \'condition_latex\'\\))']) {
      expect(marked(app, attr), attr).toBe(true);
    }
    for (const id of ['drill-hint-condition', 'drill-hint-hint', 'drill-hint-solution']) {
      expect(marked(html, `id="${id}"`), id).toBe(true);
    }
  });

  it('ответы и подписи полей класса не получают', () => {
    for (const attr of ['data-answer>', 'data-cw-ans=', 'data-answer-label=', 'data-drill-label=', 'data-recent-id=']) {
      expect(new RegExp(`class="[^"]*\\bmultiline\\b[^"]*" ${attr}`).test(app), attr).toBe(false);
    }
  });

  it('renderMath приводит переводы строк и чистит блоки формул только в .multiline', () => {
    expect(client).toMatch(/classList\?\.contains\('multiline'\)/);
    expect(client).toMatch(/if \(multiline && [^\n]*normalizeLineBreaks/);
    expect(client).toMatch(/if \(multiline && [^\n]*trimBlockBreaks/);
    // Приведение — до записи текста в элемент, чистка — после KaTeX и не внутри try:
    // сбой в ней не должен вернуть сырой текст.
    expect(client.indexOf('normalizeLineBreaks(text)')).toBeLessThan(client.indexOf('element.textContent = text;'));
    expect(client.indexOf('lib.trimBlockBreaks(element)')).toBeGreaterThan(client.indexOf('renderMathInElement(element'));
  });
});

describe('переводы строк в тексте задачи: превью в админке', () => {
  const adminHtml = read('admin.html');
  const adminJs = read('public/admin.js');
  const marked = id => new RegExp(`<div class="[^"]*\\bmultiline\\b[^"]*" id="${id}"`).test(adminHtml);

  // Форма, боковое «Как увидит посетитель» и очередь проверки: условие, подсказка, решение.
  it('класс стоит на условии, подсказке и решении во всех превью', () => {
    for (const id of [
      'condition-preview', 'solution-preview', 'condition-preview-lv', 'solution-preview-lv',
      'adm-preview-cond', 'adm-preview-hint', 'adm-preview-sol',
      'adm-review-cond', 'adm-review-cond-lv', 'adm-review-sol', 'adm-review-sol-lv'
    ]) {
      expect(marked(id), id).toBe(true);
    }
  });

  it('превью ответа остаётся в одну строку', () => {
    expect(adminHtml).toContain('id="answer-preview"');
    for (const id of ['answer-preview', 'adm-preview-answer']) {
      expect(marked(id), id).toBe(false);
    }
  });

  it('карточки генератора и «Посмотреть» в печатном листе тоже с классом', () => {
    expect(adminJs).toMatch(/class="ai-result-cond multiline"/);
    expect(adminJs).toMatch(/class="adm-paper-peek multiline"/);
  });

  // Латышский блок создаётся в JS: без этой строки в нём переводы у выключных формул остались бы пустыми строками.
  it('латышский блок бокового превью берёт класс у русского, а у ответа не получает', () => {
    expect(adminJs).toMatch(/classList\.toggle\('multiline', el\.classList\.contains\('multiline'\)\)/);
  });

  // renderMath — из client.js, чистка и приведение — из lib.js. Главная и админка подключают
  // один lib.js: разные версии значили бы, что одну из страниц забыли поднять при правке.
  it('главная и админка подключают lib.js с одной версией, а client.js в админке — с номером', () => {
    const version = (source, file) => new RegExp(`/${file}\\?v=([\\d-]+)`).exec(source)?.[1];
    expect(version(adminHtml, 'lib\\.js')).toBeTruthy();
    expect(version(adminHtml, 'lib\\.js')).toBe(version(read('index.html'), 'lib\\.js'));
    expect(version(adminHtml, 'client\\.js')).toBeTruthy();
  });
});
