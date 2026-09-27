import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import i18n from '../public/i18n.js';
import { isLocalizablePath, isRuPath, langOfPath, localizeHref, stripLangPath, toLangPath } from '../public/lib.js';

/* Язык в адресе: латышская версия — без префикса, русская — /ru/….
   До 27.09.2026 было наоборот; старые /lv/… сервер уводит на адрес без префикса. */

describe('язык в адресе', () => {
  it('узнаёт русский адрес и снимает префикс', () => {
    expect(isRuPath('/ru')).toBe(true);
    expect(isRuPath('/ru/topic/x')).toBe(true);
    expect(isRuPath('/rux')).toBe(false);
    expect(isRuPath('/topic/ru')).toBe(false);
    expect(stripLangPath('/ru')).toBe('/');
    expect(stripLangPath('/ru/')).toBe('/');
    expect(stripLangPath('/ru/topic/x')).toBe('/topic/x');
    expect(stripLangPath('/topic/x')).toBe('/topic/x');
    expect(langOfPath('/ru/tasks')).toBe('ru');
    expect(langOfPath('/tasks')).toBe('lv');
  });

  // Страница из кеша могла открыться по старому адресу /lv/… — префикс снимается и там.
  it('старый латышский префикс /lv/ снимается', () => {
    expect(stripLangPath('/lv/topic/x')).toBe('/topic/x');
    expect(stripLangPath('/lv')).toBe('/');
    expect(langOfPath('/lv/tasks')).toBe('lv');
    expect(toLangPath('/lv/topic/x', 'ru')).toBe('/ru/topic/x');
    expect(toLangPath('/lv/topic/x', 'lv')).toBe('/topic/x');
  });

  it('строит путь нужного языка, русская главная — /ru/', () => {
    expect(toLangPath('/topic/x', 'ru')).toBe('/ru/topic/x');
    expect(toLangPath('/ru/topic/x', 'ru')).toBe('/ru/topic/x');
    expect(toLangPath('/ru/topic/x', 'lv')).toBe('/topic/x');
    expect(toLangPath('/', 'ru')).toBe('/ru/');
    expect(toLangPath('/ru/', 'lv')).toBe('/');
  });

  it('ссылка: язык меняется у пути, запрос и якорь остаются', () => {
    expect(localizeHref('/search?q=дроби', 'ru')).toBe('/ru/search?q=дроби');
    expect(localizeHref('/ru/topic/x#task-5', 'lv')).toBe('/topic/x#task-5');
    expect(localizeHref('/topic/x', 'lv')).toBe('/topic/x');
  });

  it('файлы, /api, админка и чужие адреса префикса не получают', () => {
    for (const href of ['/trainer.html', '/formulas/a.pdf', '/api/generate-task', '/admin', '/assets/x.css', 'https://example.com/x', '//cdn/x', '#top']) {
      expect(localizeHref(href, 'ru'), href).toBe(href);
    }
    expect(isLocalizablePath('/topic/x')).toBe(true);
    expect(isLocalizablePath('/exams.html')).toBe(false);
  });

  it('отдельные страницы без расширения — не адреса приложения', () => {
    /* Cloudflare отдаёт /trainer вместо /trainer.html; роутер и языковой
       префикс должны узнавать их и без «.html» — иначе клик по меню
       оставлял главную, а в русской версии вёл на /ru/trainer. */
    for (const path of ['/trainer', '/trainer?section=equations', '/exams', '/mock-exams', '/plotter', '/plotter?f=x', '/duel']) {
      expect(localizeHref(path, 'ru'), path).toBe(path);
      expect(isLocalizablePath(path.split('?')[0]), path).toBe(false);
    }
    // Экзамен по адресу /exam/<уровень> — экран приложения, у него есть /ru/
    expect(localizeHref('/exam/pamat', 'ru')).toBe('/ru/exam/pamat');
    expect(isLocalizablePath('/examsomething')).toBe(true);
  });
});

describe('словарь: заголовки страниц на обоих языках', () => {
  const keys = Object.keys(i18n.TRANSLATIONS.ru).filter(key => key.startsWith('meta_'));

  it('каждый ключ meta_* есть и по-русски, и по-латышски', () => {
    expect(keys.length).toBeGreaterThan(25);
    expect(keys.filter(key => !i18n.TRANSLATIONS.lv[key])).toEqual([]);
  });

  /* Повтор ключа внутри языка молча перекрывает первый: так новая строка
     «В этой теме задач пока нет» подменялась старой «Пока пусто». */
  it('ни один ключ не повторяется внутри языка', () => {
    const source = readFileSync(new URL('../public/i18n.js', import.meta.url), 'utf8');
    const block = (from, to) => source.slice(source.indexOf(from), source.indexOf(to));
    for (const text of [block('    lv: {', '    ru: {'), block('    ru: {', 'let currentLang')]) {
      const found = [...text.matchAll(/^ {6}([a-z0-9_]+):/gm)].map(match => match[1]);
      expect(found.length).toBeGreaterThan(900);
      expect(found.filter((key, i) => found.indexOf(key) !== i)).toEqual([]);
    }
  });

  // Формы множественного числа у языков свои: _few и _many у русского, _zero у латышского.
  it('каждый ключ есть на обоих языках', () => {
    const plural = /_(zero|few|many)$/;
    const { ru, lv } = i18n.TRANSLATIONS;
    expect(Object.keys(ru).filter(key => !plural.test(key) && !(key in lv))).toEqual([]);
    expect(Object.keys(lv).filter(key => !plural.test(key) && !(key in ru))).toEqual([]);
  });

  it('t() с явным языком — так тексты берёт воркер', () => {
    expect(i18n.t('meta_grade_title', { grade: '6. klase' }, 'lv')).toBe('Uzdevumi — 6. klase');
    expect(i18n.t('meta_grade_title', { grade: '6 класс' }, 'ru')).toBe('Задачи — 6 класс');
  });

  it('t() подставляет значение как есть, «$&» не шаблон замены', () => {
    expect(i18n.t('search_title_query', { query: 'a$&b' }, 'ru')).toBe('Поиск: «a$&b»');
  });
});

/* Язык при загрузке: выбор посетителя главнее всего; без выбора /ru/ в
   адресе — русский, иначе язык браузера. Загрузка сама ничего не запоминает. */
describe('язык при загрузке: браузер и запомненный выбор', () => {
  const code = readFileSync(new URL('../public/i18n.js', import.meta.url), 'utf8');
  const load = ({ path = '/', saved = null, browser = 'en-US', catalogue = true }) => {
    const store = new Map(saved ? [['math-tasks:lang', saved]] : []);
    const root = { hasAttribute: name => catalogue && name === 'data-url-lang', setAttribute() {}, classList: { add() {}, remove() {} } };
    const document = { documentElement: root, readyState: 'complete', addEventListener() {}, querySelectorAll: () => [], querySelector: () => null };
    const context = {
      document, location: { pathname: path }, navigator: { language: browser, languages: [browser] },
      localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) },
      MutationObserver: class { observe() {} disconnect() {} }, CustomEvent: class {}, window: { dispatchEvent() {} }
    };
    vm.runInNewContext(code, context);
    return { api: context.MathTasksI18n, store };
  };

  it('без выбора — по языку браузера: русский — русский, остальные — латышский', () => {
    expect(load({ path: '/topic/x', browser: 'ru-RU' }).api.getLang()).toBe('ru');
    expect(load({ path: '/topic/x', browser: 'lv-LV' }).api.getLang()).toBe('lv');
    // Поисковик: английский браузер, ничего не сохранено — латышская версия.
    expect(load({ path: '/' }).api.getLang()).toBe('lv');
  });

  it('адрес /ru/… без выбора — русский при любом браузере', () => {
    expect(load({ path: '/ru/topic/x', browser: 'lv' }).api.getLang()).toBe('ru');
  });

  it('запомненный выбор главнее адреса и браузера', () => {
    expect(load({ path: '/ru/topic/x', saved: 'lv' }).api.getLang()).toBe('lv');
    expect(load({ path: '/', saved: 'ru', browser: 'lv' }).api.getLang()).toBe('ru');
  });

  it('отдельные страницы: выбор, иначе браузер', () => {
    expect(load({ catalogue: false, browser: 'ru' }).api.getLang()).toBe('ru');
    expect(load({ catalogue: false }).api.getLang()).toBe('lv');
    expect(load({ catalogue: false, saved: 'ru' }).api.getLang()).toBe('ru');
  });

  it('загрузка и «назад» не запоминают язык, переключатель — запоминает', () => {
    const { api, store } = load({ path: '/topic/x', browser: 'ru' });
    expect(store.size).toBe(0);
    api.setLang('lv', { remember: false });
    expect(store.size).toBe(0);
    api.setLang('lv');
    expect(store.get('math-tasks:lang')).toBe('lv');
  });
});

describe('приложение: язык из адреса', () => {
  const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const i18nSource = readFileSync(new URL('../public/i18n.js', import.meta.url), 'utf8');
  const themeInit = readFileSync(new URL('../public/theme-init.js', import.meta.url), 'utf8');

  it('страница каталога помечена: язык — часть адреса', () => {
    expect(html).toMatch(/<html lang="lv" data-url-lang>/);
    expect(i18nSource).toContain("hasAttribute('data-url-lang')");
    expect(themeInit).toContain("hasAttribute('data-url-lang')");
  });

  it('роутер разбирает путь без префикса, переходы его ставят', () => {
    expect(app).toMatch(/async function route[\s\S]*?const path = appPath\(\);/);
    expect(app).toMatch(/function navigate\(path[\s\S]*?const target = langPath\(path\);/);
    // Прямых сравнений с location.pathname в шаблонах меню не осталось.
    expect(app).not.toMatch(/location\.pathname === '\//);
  });

  it('переключатель меняет адрес, «назад» — и язык, ссылки получают префикс', () => {
    expect(app).toMatch(/#lang-switcher[\s\S]*?history\.pushState\(null, '', langPath\(location\.pathname \+ location\.search, lang\)/);
    // «Назад» меняет язык, но не запоминает его как выбор посетителя.
    expect(app).toMatch(/addEventListener\('popstate'[\s\S]*?langOfPath[\s\S]*?setLang\(urlLang, \{ remember: false \}\)/);
    expect(app).toContain('function localizeLinks');
  });

  // Ссылка «поделиться» — латышский адрес со слагом из латышского названия.
  it('«Скопировать ссылку» и «Скопировать текст» дают латышский адрес', () => {
    expect(app).toMatch(/function shareTaskUrl\(task, taskId\)[\s\S]*?task\.title_lv \|\| task\.title/);
    expect((app.match(/const url = shareTaskUrl\(task, taskId\);/g) || []).length).toBe(2);
  });

  it('заголовки страниц — из словаря, без русского текста в setMeta', () => {
    const calls = app.match(/setMeta\([^;]*\);/g) || [];
    const russian = calls.filter(call => /['`][^'`]*[а-яё]{3,}/i.test(call));
    expect(russian).toEqual([]);
  });
});
