/* Тема выставляется до первой отрисовки, чтобы страница не мигала
   светлым фоном перед тем, как включится тёмная. Отдельным файлом,
   а не встроенным скриптом: встроенные запрещены политикой CSP. */
(() => {
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
    })();
