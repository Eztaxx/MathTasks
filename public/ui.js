(() => {
  const authDialog = document.querySelector('#auth-dialog');
  const openDialog = () => {
    if (typeof authDialog.showModal === 'function') authDialog.showModal();
    else authDialog.setAttribute('open', '');
  };
  const closeDialog = () => {
    if (typeof authDialog.close === 'function') authDialog.close();
    else authDialog.removeAttribute('open');
  };
  window.MathTasks = window.MathTasks || {};
  window.MathTasks.openLogin = openDialog;
  const tr = (key, params) => (window.MathTasks.t || (k => k))(key, params);

  /* Боковая панель с полным меню (тренажёры, экзамены, инструменты, класс)
     с редизайна «Начала» — выдвижная на любой ширине: открывается кнопкой
     «☰» в шапке, закрывается затемнением, Esc или переходом по ссылке.
     Состояние не запоминается: страница всегда открывается без панели. */
  const toggleButton = document.querySelector('#sidebar-toggle');
  const scrim = document.querySelector('#sidebar-scrim');
  const MOBILE = 'all';
  let collapsed = '1';

  const applySidebar = () => {
    if (!toggleButton) return;
    const isCollapsed = collapsed === '1';
    document.body.classList.toggle('sidebar-collapsed', isCollapsed);
    document.body.classList.toggle('sidebar-open', !isCollapsed);
    toggleButton.setAttribute('aria-expanded', String(!isCollapsed));
    toggleButton.setAttribute('aria-label', tr(isCollapsed ? 'menu_expand' : 'menu_collapse'));
  };
  const setSidebar = value => {
    collapsed = value ? '1' : '0';
    applySidebar();
  };
  applySidebar();
  // Смена языка ставит кнопке общее «Меню» из data-i18n-aria — возвращаем точную подпись.
  window.addEventListener('languagechange', applySidebar);

  toggleButton?.addEventListener('click', () => setSidebar(collapsed !== '1'));
  scrim?.addEventListener('click', () => setSidebar(true));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && collapsed === '0' && matchMedia(MOBILE).matches) {
      setSidebar(true);
      toggleButton?.focus();
    }
  });
  /* Меню строится из базы и перерисовывается, поэтому обработчики делегированы
     на саму панель, а не навешены на конкретные ссылки. */
  document.querySelector('#sidebar')?.addEventListener('click', event => {
    // Кнопки инструментов (формулы, графопостроитель, случайная задача) открывают окно — панель прячем.
    if (event.target.closest('button.sidebar-action-card')) { setSidebar(true); return; }
    // На узком экране любой переход по меню закрывает панель.
    if (event.target.closest('a')) {
      if (matchMedia(MOBILE).matches) setSidebar(true);
      return;
    }
    // В свёрнутой панели вместо селектора видна пилюля с номером класса.
    if (event.target.closest('.grade-pill')) { setSidebar(false); return; }
    const groupTitle = event.target.closest('.group-title');
    if (!groupTitle) return;
    // В свёрнутом виде клик по иконке раздела сначала раскрывает панель.
    if (document.body.classList.contains('sidebar-collapsed')) { setSidebar(false); return; }
    groupTitle.parentElement.classList.toggle('open');
  });

  /* Поиск в шапке — значок; строка поиска выезжает под шапкой. С текстом
     в поле (страница /search) она видна и без нажатия — это делает CSS. */
  const searchButton = document.querySelector('#nb-search-btn');
  const setSearch = open => {
    document.body.classList.toggle('nb-search-open', open);
    searchButton?.setAttribute('aria-expanded', String(open));
    if (open) document.querySelector('#search-input')?.focus();
  };
  searchButton?.addEventListener('click', () => setSearch(!document.body.classList.contains('nb-search-open')));
  document.querySelector('#search-input')?.addEventListener('keydown', event => {
    if (event.key === 'Escape') { setSearch(false); searchButton?.focus(); }
  });

  document.querySelector('#account-button')?.addEventListener('click', () => {
    if (typeof window.MathTasks.openAccount === 'function') window.MathTasks.openAccount();
    else openDialog();
  });
  document.querySelector('.dialog-close')?.addEventListener('click', closeDialog);

  document.querySelector('#login-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const errorElement = document.querySelector('#login-error');
    const submitButton = event.currentTarget.querySelector('[type="submit"]');
    const client = window.MathTasks.db;

    errorElement.textContent = '';
    if (!client) {
      errorElement.textContent = tr('login_unavailable');
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = tr('login_progress');
    try {
      const loginResult = await Promise.race([
        client.auth.signInWithPassword({
          email: document.querySelector('#login-email').value.trim(),
          password: document.querySelector('#login-password').value
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 12_000))
      ]);
      const { error } = loginResult;
      if (error) {
        errorElement.textContent = tr('login_failed', { error: error.message });
        return;
      }
      closeDialog();
      window.dispatchEvent(new Event('math-tasks:authenticated'));
    } catch (error) {
      errorElement.textContent = error.message === 'timeout'
        ? tr('login_timeout')
        : tr('login_network');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = tr('auth_submit');
    }
  });
})();
