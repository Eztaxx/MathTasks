/* Тема и язык выставляются до первой отрисовки, чтобы страница не мигала
   светлым фоном или другим языком перед тем, как отработают скрипты.
   Отдельным файлом, а не встроенным скриптом: встроенные запрещены политикой CSP. */
(() => {
  /* Текстовую версию страницы из воркера (#ssr-content) видят поисковики и
     те, у кого нет JavaScript. Со скриптами её прячет этот класс ещё до
     первой отрисовки, а app.js потом удаляет её совсем. */
  document.documentElement.classList.add('js');

  try {
    const saved = localStorage.getItem('math-tasks:theme') || localStorage.getItem('theme');
    const isDark = saved ? saved === 'dark' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      if (document.body) document.body.classList.add('dark');
      else {
        new MutationObserver((_, obs) => {
          if (document.body) {
            document.body.classList.add('dark');
            obs.disconnect();
          }
        }).observe(document.documentElement, { childList: true });
      }
    }
  } catch (e) {}

  try {
    /* То же правило, что initLang в i18n.js: выбор посетителя главнее
       всего; без выбора на странице каталога /ru/… — русский, адрес без
       префикса — по языку браузера (русский браузер — русский, любой
       другой — латышский). Отдельные страницы: выбор, иначе браузер.
       Админка — только русская и без словаря: язык ей не выставляем,
       иначе латышский браузер спрятал бы её подписи до страховки. */
    if (/^\/admin(?:\.html)?(?:\/|$)/.test(location.pathname)) return;
    let stored = null;
    try { stored = localStorage.getItem('math-tasks:lang'); } catch (e) {}
    if (stored !== 'ru' && stored !== 'lv') stored = null;
    const browser = /^ru\b/i.test((navigator.languages && navigator.languages[0]) || navigator.language || '') ? 'ru' : 'lv';
    const onRu = location.pathname === '/ru' || location.pathname.startsWith('/ru/');
    const savedLang = stored
      || (document.documentElement.hasAttribute('data-url-lang') && onRu ? 'ru' : browser);
    document.documentElement.lang = savedLang;
    document.documentElement.setAttribute('data-lang', savedLang);
    /* Статический текст страниц по-русски: на латышском он прячется до
       перевода словарём, чтобы не мигал. */
    if (savedLang === 'lv') {
      document.documentElement.classList.add('i18n-pending'); setTimeout(() => document.documentElement.classList.remove('i18n-pending'), 2500); /* Страховка: если i18n.js не загрузится или упадёт, текст не должен остаться скрытым навсегда — пусть лучше покажется по-русски. */
    }
  } catch (e) {}
})();
