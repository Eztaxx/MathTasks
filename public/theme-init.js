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
    /* На странице каталога (data-url-lang) язык — часть адреса: /lv/… —
       латышский, иначе — русский, если латышский не выбран раньше
       (см. initLang в i18n.js). На остальных страницах — сохранённый выбор. */
    const stored = localStorage.getItem('math-tasks:lang') || 'ru';
    const onLv = location.pathname === '/lv' || location.pathname.startsWith('/lv/');
    const savedLang = document.documentElement.hasAttribute('data-url-lang')
      ? (onLv || stored === 'lv' ? 'lv' : 'ru')
      : stored;
    document.documentElement.lang = savedLang;
    document.documentElement.setAttribute('data-lang', savedLang);
    if (savedLang === 'lv') {
      document.documentElement.classList.add('i18n-pending'); setTimeout(() => document.documentElement.classList.remove('i18n-pending'), 2500); /* Страховка: если i18n.js не загрузится или упадёт, текст не должен остаться скрытым навсегда — пусть лучше покажется по-русски. */
    }
  } catch (e) {}
})();
