import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import i18n from '../public/i18n.js';
import { isLocalizablePath, isLvPath, langOfPath, localizeHref, stripLangPath, toLangPath } from '../public/lib.js';

/* Язык в адресе: русская версия — без префикса, латышская — /lv/…. */

describe('язык в адресе', () => {
  it('узнаёт латышский адрес и снимает префикс', () => {
    expect(isLvPath('/lv')).toBe(true);
    expect(isLvPath('/lv/topic/x')).toBe(true);
    expect(isLvPath('/lvx')).toBe(false);
    expect(isLvPath('/topic/lv')).toBe(false);
    expect(stripLangPath('/lv')).toBe('/');
    expect(stripLangPath('/lv/')).toBe('/');
    expect(stripLangPath('/lv/topic/x')).toBe('/topic/x');
    expect(stripLangPath('/topic/x')).toBe('/topic/x');
    expect(langOfPath('/lv/tasks')).toBe('lv');
    expect(langOfPath('/tasks')).toBe('ru');
  });

  it('строит путь нужного языка, главная — /lv/', () => {
    expect(toLangPath('/topic/x', 'lv')).toBe('/lv/topic/x');
    expect(toLangPath('/lv/topic/x', 'lv')).toBe('/lv/topic/x');
    expect(toLangPath('/lv/topic/x', 'ru')).toBe('/topic/x');
    expect(toLangPath('/', 'lv')).toBe('/lv/');
    expect(toLangPath('/lv/', 'ru')).toBe('/');
  });

  it('ссылка: язык меняется у пути, запрос и якорь остаются', () => {
    expect(localizeHref('/search?q=дроби', 'lv')).toBe('/lv/search?q=дроби');
    expect(localizeHref('/lv/topic/x#task-5', 'ru')).toBe('/topic/x#task-5');
    expect(localizeHref('/topic/x', 'ru')).toBe('/topic/x');
  });

  it('файлы, /api, админка и чужие адреса префикса не получают', () => {
    for (const href of ['/trainer.html', '/formulas/a.pdf', '/api/generate-task', '/admin', '/assets/x.css', 'https://example.com/x', '//cdn/x', '#top']) {
      expect(localizeHref(href, 'lv'), href).toBe(href);
    }
    expect(isLocalizablePath('/topic/x')).toBe(true);
    expect(isLocalizablePath('/exams.html')).toBe(false);
  });

  it('отдельные страницы без расширения — не адреса приложения', () => {
    /* Cloudflare отдаёт /trainer вместо /trainer.html; роутер и латышский
       префикс должны узнавать их и без «.html» — иначе клик по меню
       оставлял главную, а в латышской версии вёл на /lv/trainer. */
    for (const path of ['/trainer', '/trainer?section=equations', '/exams', '/mock-exams', '/plotter', '/plotter?f=x', '/duel']) {
      expect(localizeHref(path, 'lv'), path).toBe(path);
      expect(isLocalizablePath(path.split('?')[0]), path).toBe(false);
    }
    // Экзамен по адресу /exam/<уровень> — экран приложения, у него есть /lv/
    expect(localizeHref('/exam/pamat', 'lv')).toBe('/lv/exam/pamat');
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

describe('приложение: язык из адреса', () => {
  const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const i18nSource = readFileSync(new URL('../public/i18n.js', import.meta.url), 'utf8');
  const themeInit = readFileSync(new URL('../public/theme-init.js', import.meta.url), 'utf8');

  it('страница каталога помечена: язык — часть адреса', () => {
    expect(html).toMatch(/<html lang="ru" data-url-lang>/);
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
    expect(app).toMatch(/addEventListener\('popstate'[\s\S]*?langOfPath[\s\S]*?setLang\(urlLang\)/);
    expect(app).toContain('function localizeLinks');
  });

  it('заголовки страниц — из словаря, без русского текста в setMeta', () => {
    const calls = app.match(/setMeta\([^;]*\);/g) || [];
    const russian = calls.filter(call => /['`][^'`]*[а-яё]{3,}/i.test(call));
    expect(russian).toEqual([]);
  });
});
