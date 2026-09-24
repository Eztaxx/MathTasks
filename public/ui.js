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

  /* Сворачивание боковой панели: на десктопе — узкая полоса с иконками,
     на узких экранах — выдвижная панель поверх контента. */
  const toggleButton = document.querySelector('#sidebar-toggle');
  const scrim = document.querySelector('#sidebar-scrim');
  const MOBILE = '(max-width:720px)';
  let collapsed;
  try { collapsed = localStorage.getItem('math-tasks:sidebar'); } catch {}
  if (collapsed === null || collapsed === undefined) collapsed = matchMedia(MOBILE).matches ? '1' : '0';

  const applySidebar = () => {
    const isCollapsed = collapsed === '1';
    document.body.classList.toggle('sidebar-collapsed', isCollapsed);
    toggleButton.setAttribute('aria-expanded', String(!isCollapsed));
    toggleButton.setAttribute('aria-label', tr(isCollapsed ? 'menu_expand' : 'menu_collapse'));
  };
  const setSidebar = value => {
    collapsed = value ? '1' : '0';
    try { localStorage.setItem('math-tasks:sidebar', collapsed); } catch {}
    applySidebar();
  };
  applySidebar();
  // Смена языка ставит кнопке общее «Меню» из data-i18n-aria — возвращаем точную подпись.
  window.addEventListener('languagechange', applySidebar);

  toggleButton.addEventListener('click', () => setSidebar(collapsed !== '1'));
  scrim.addEventListener('click', () => setSidebar(true));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && collapsed === '0' && matchMedia(MOBILE).matches) setSidebar(true);
  });
  /* Меню строится из базы и перерисовывается, поэтому обработчики делегированы
     на саму панель, а не навешены на конкретные ссылки. */
  document.querySelector('#sidebar').addEventListener('click', event => {
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
