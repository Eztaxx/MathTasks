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
    toggleButton.setAttribute('aria-label', isCollapsed ? 'Развернуть меню' : 'Свернуть меню');
  };
  const setSidebar = value => {
    collapsed = value ? '1' : '0';
    try { localStorage.setItem('math-tasks:sidebar', collapsed); } catch {}
    applySidebar();
  };
  applySidebar();

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
      errorElement.textContent = 'Сервис входа недоступен. Проверьте подключение к интернету и обновите страницу.';
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Входим…';
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
        errorElement.textContent = 'Не удалось войти: ' + error.message;
        return;
      }
      closeDialog();
      window.dispatchEvent(new Event('math-tasks:authenticated'));
    } catch (error) {
      errorElement.textContent = error.message === 'timeout'
        ? 'Сервис входа не ответил за 12 секунд. Проверьте подключение к интернету или настройки Supabase.'
        : 'Не удалось связаться с сервисом входа. Проверьте подключение к интернету.';
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Войти';
    }
  });
})();
