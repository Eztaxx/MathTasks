// Общий слой: клиент Supabase, утилиты и тема — используется и на главной, и в админке.
window.MathTasks = window.MathTasks || {};
(() => {
  const config = window.SUPABASE_CONFIG;
  window.MathTasks.db = config?.url && config?.publishableKey && window.supabase
    ? window.supabase.createClient(config.url, config.publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    : null;

  window.MathTasks.escapeHtml = (value = '') => {
    const el = document.createElement('div');
    el.textContent = value;
    return el.innerHTML;
  };

  // Справочник ступеней обучения по стандартам Skola2030 (1–9 классы и средняя школа: Vispārīgais, Matemātika I, Matemātika II)
  window.MathTasks.GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'visparigais', 'matematika-1', 'matematika-2'];
  const resolveGradeName = (grade, t) => {
    const specific = t(`grade_${grade}`);
    if (specific && specific !== `grade_${grade}`) return specific;
    const nForm = t('grade_N', { n: grade });
    if (nForm && nForm !== 'grade_N') return nForm;
    return `${grade} класс`;
  };

  window.MathTasks.gradeLabel = grade => {
    const t = window.MathTasks.t || (k => k);
    if (!grade) return t('without_grade') !== 'without_grade' ? t('without_grade') : 'Без класса';
    if (grade === 'visparigais' || grade === 'vispārīgais') return t('grade_visparigais') !== 'grade_visparigais' ? t('grade_visparigais') : 'Vispārīgais līmenis';
    if (grade === 'matematika-1') return t('grade_matematika_1') !== 'grade_matematika_1' ? t('grade_matematika_1') : 'Matemātika I (Optimālais)';
    if (grade === 'matematika-2') return t('grade_matematika_2') !== 'grade_matematika_2' ? t('grade_matematika_2') : 'Matemātika II (Augstākais)';
    return resolveGradeName(grade, t);
  };

  window.MathTasks.fillGradeSelect = (select, emptyLabel, options = {}) => {
    if (!select) return;
    const previousVal = select.value;
    const t = window.MathTasks.t || (k => k);
    const emptyText = emptyLabel || (t('all_grades') !== 'all_grades' ? t('all_grades') : 'Все классы и курсы');
    const stagePamatskola = t('stage_pamatskola') !== 'stage_pamatskola' ? t('stage_pamatskola') : 'Pamatskola (1.–9. klase)';
    const stageVidusskola = t('stage_vidusskola') !== 'stage_vidusskola' ? t('stage_vidusskola') : 'Vidusskola (10.–12. klase / Līmeņi)';
    const examSuffix = t('stage_exam_badge') !== 'stage_exam_badge' ? ` (${t('stage_exam_badge')})` : ' (Eksāmens)';

    const optVisp = t('grade_visparigais') !== 'grade_visparigais' ? t('grade_visparigais') : 'Vispārīgais līmenis';
    const optOpt = t('grade_matematika_1') !== 'grade_matematika_1' ? t('grade_matematika_1') : 'Optimālais līmenis (Matemātika I)';
    const optAugst = t('grade_matematika_2') !== 'grade_matematika_2' ? t('grade_matematika_2') : 'Augstākais līmenis (Matemātika II)';

    const pamatHtml = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(grade => {
      const name = resolveGradeName(grade, t);
      const is9 = grade === 9;
      return `<option value="${grade}">${name}${is9 ? examSuffix : ''}</option>`;
    }).join('');

    const useNumeric = Boolean(options && (options.numeric || options.useNumeric || select.dataset.numeric === 'true'));
    const valVisp = useNumeric ? '10' : 'visparigais';
    const valOpt = useNumeric ? '11' : 'matematika-1';
    const valAugst = useNumeric ? '12' : 'matematika-2';

    const vidusHtml = `<option value="${valVisp}">${optVisp}</option>` +
      `<option value="${valOpt}">${optOpt}</option>` +
      `<option value="${valAugst}">${optAugst}</option>`;

    select.innerHTML = `<option value="">${emptyText}</option>` +
      `<optgroup label="${stagePamatskola}">${pamatHtml}</optgroup>` +
      `<optgroup label="${stageVidusskola}">${vidusHtml}</optgroup>`;

    if (previousVal) {
      if (select.querySelector(`option[value="${previousVal}"]`)) {
        select.value = previousVal;
      } else if (useNumeric) {
        if (previousVal === 'visparigais') select.value = '10';
        else if (previousVal === 'matematika-1') select.value = '11';
        else if (previousVal === 'matematika-2') select.value = '12';
      } else {
        if (previousVal === '10') select.value = 'visparigais';
        else if (previousVal === '11') select.value = 'matematika-1';
        else if (previousVal === '12') select.value = 'matematika-2';
      }
    }
  };

  // Чистые функции живут в lib.js — их же покрывают тесты.
  const lib = window.MathTasksLib;
  window.MathTasks.makeSlug = lib.makeSlug;
  window.MathTasks.cleanMathExample = lib.cleanMathExample;
  window.MathTasks.normalizeMathAnswer = lib.normalizeMathAnswer;
  window.MathTasks.compareAnswers = lib.compareAnswers;

  window.MathTasks.insertIntoInput = (input, text) => {
    if (!input) return;
    input.focus();
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const val = input.value;

    let inserted = text;
    let newCursor = start + inserted.length;

    if (text === '²') {
      if (start === 0 || /[\+\-\*\/\(\s,;]$/.test(val.slice(0, start))) {
        inserted = 'x²';
        newCursor = start + 2;
      } else {
        inserted = '²';
        newCursor = start + 1;
      }
    } else if (text === '√(' || text === '√') {
      inserted = '√()';
      newCursor = start + 2;
    } else if (text === '(') {
      inserted = '()';
      newCursor = start + 1;
    } else if (text === '|') {
      inserted = '||';
      newCursor = start + 1;
    } else if (/^(sin|cos|tan|tg|ctg|ln|lg|sqrt)\($/.test(text)) {
      inserted = text + ')';
      newCursor = start + text.length;
    }

    input.value = val.slice(0, start) + inserted + val.slice(end);
    input.setSelectionRange(newCursor, newCursor);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  window.MathTasks.renderMath = (element, text = '') => {
    element.textContent = text; // textContent — и экранирование, и запасной вид без KaTeX
    if (typeof window.renderMathInElement !== 'function') return;
    try {
      window.renderMathInElement(element, { delimiters: lib.KATEX_DELIMITERS, throwOnError: false, errorColor: '#dc3151' });
    } catch {
      element.textContent = text;
    }
  };

  /* Чертежи лежат в публичном бакете, а в базе — только путь.
     Ссылку собираем здесь, чтобы бакет упоминался ровно в одном месте. */
  window.MathTasks.IMAGE_BUCKET = 'task-images';
  window.MathTasks.imageUrl = path => {
    if (!path) return null;
    if (path.startsWith('/') || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    const db = window.MathTasks.db;
    if (!db) return null;
    return db.storage.from(window.MathTasks.IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  };

  // Безопасный разбор полезной нагрузки JWT (base64url) без сторонних библиотек
  const decodeJwtPayload = token => {
    try {
      if (!token || typeof token !== 'string') return null;
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  };
  window.MathTasks.decodeJwtPayload = decodeJwtPayload;

  // Быстрое извлечение сохранённой сессии из localStorage (0 мс)
  const getStoredSession = () => {
    try {
      const config = window.SUPABASE_CONFIG;
      const ref = config?.url ? new URL(config.url).hostname.split('.')[0] : null;
      let session = null;
      if (ref) {
        const raw = localStorage.getItem(`sb-${ref}-auth-token`);
        if (raw) {
          try { session = JSON.parse(raw); } catch {}
        }
      }
      if (!session) {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
            try {
              const parsed = JSON.parse(localStorage.getItem(k));
              if (parsed && (parsed.access_token || parsed.user)) {
                session = parsed;
                break;
              }
            } catch {}
          }
        }
      }
      if (session) {
        // Если поле user отсутствует, но есть access_token (JWT) — восстанавливаем пользователя из токена
        if (!session.user && session.access_token) {
          const payload = decodeJwtPayload(session.access_token);
          if (payload?.sub) {
            session.user = {
              id: payload.sub,
              email: payload.email || '',
              user_metadata: payload.user_metadata || {}
            };
          }
        }
        if (session.user || session.access_token) return session;
      }
    } catch {}
    return null;
  };
  window.MathTasks.getStoredSession = getStoredSession;

  // Прямая авторизация через REST API Supabase Auth — мгновенно (~200 мс), надёжно и без внутренних блокировок клиента
  const directLogin = async (email, password) => {
    const config = window.SUPABASE_CONFIG;
    if (!config?.url || !config?.publishableKey) {
      return { error: new Error('Не настроена конфигурация Supabase') };
    }

    try {
      const res = await Promise.race([
        fetch(`${config.url}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: config.publishableKey
          },
          body: JSON.stringify({ email, password })
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Время ожидания ответа истекло')), 7000))
      ]);

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        let msg = body.error_description || body.msg || body.message || 'Неверный email или пароль';
        if (body.error_code === 'invalid_credentials' || msg === 'Invalid login credentials') {
          msg = 'Неверный email или пароль';
        }
        return { error: new Error(msg) };
      }

      if (body?.access_token) {
        const session = body;
        if (!session.user) {
          const payload = decodeJwtPayload(session.access_token);
          session.user = {
            id: payload?.sub || '',
            email: payload?.email || email,
            user_metadata: payload?.user_metadata || {}
          };
        }
        const user = session.user;
        const ref = new URL(config.url).hostname.split('.')[0];
        try {
          localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
        } catch {}

        if (window.MathTasks.db) {
          try { await window.MathTasks.db.auth.setSession(session); } catch {}
        }

        return { data: { user, session }, error: null };
      }
    } catch (restErr) {
      console.warn('Прямой запрос входа завершился ошибкой, пробуем через клиент:', restErr);
    }

    // Резервный вариант через JS-клиент
    const db = window.MathTasks.db;
    if (db) {
      try {
        const res = await Promise.race([
          db.auth.signInWithPassword({ email, password }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Время ожидания ответа истекло')), 7000))
        ]);
        if (res.error) {
          let msg = res.error.message;
          if (res.error.code === 'invalid_credentials' || msg === 'Invalid login credentials') {
            msg = 'Неверный email или пароль';
          }
          return { error: new Error(msg) };
        }
        if (res.data?.session && res.data?.user) return { data: res.data, error: null };
      } catch (sdkErr) {
        return { error: sdkErr };
      }
    }

    return { error: new Error('Не удалось подключиться к серверу авторизации') };
  };
  window.MathTasks.directLogin = directLogin;

  // Обновление токена напрямую по refresh_token (100–200 мс)
  const directRefreshSession = async (refreshToken) => {
    const config = window.SUPABASE_CONFIG;
    if (!config?.url || !refreshToken) return null;
    try {
      const res = await Promise.race([
        fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: config.publishableKey
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
      ]);
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.access_token) {
        const ref = new URL(config.url).hostname.split('.')[0];
        localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(data));
        if (window.MathTasks.db) {
          try { await window.MathTasks.db.auth.setSession(data); } catch {}
        }
        return data;
      }
    } catch (e) {
      console.warn('directRefreshSession error:', e);
    }
    return null;
  };

  // Кто вошёл и админ ли он — мгновенная проверка без блокировок и зависаний
  window.MathTasks.loadViewer = async (timeoutMs = 3500) => {
    const config = window.SUPABASE_CONFIG;
    const db = window.MathTasks.db;
    if (!config?.url || !config?.publishableKey) {
      return { user: null, isAdmin: false, error: new Error('Не настроена конфигурация Supabase') };
    }

    try {
      // 1. Мгновенная проверка локального хранилища (0 мс)
      let session = getStoredSession();
      if (!session && db) {
        const fallback = await Promise.race([
          db.auth.getSession().catch(() => ({ data: { session: null } })),
          new Promise(resolve => setTimeout(() => resolve({ data: { session: null } }), 1000))
        ]);
        session = fallback?.data?.session || null;
      }

      if (!session?.user) {
        return { user: null, isAdmin: false };
      }

      let user = session.user;
      let accessToken = session.access_token;
      const nowSec = Math.floor(Date.now() / 1000);
      const isKnownAdminEmail = (user.email || '').toLowerCase() === 'bgogolev21@gmail.com';

      // 2. Если токен истёк или истекает менее чем через 60 сек — обновляем
      if (session.expires_at && session.expires_at <= nowSec + 60 && session.refresh_token) {
        const refreshed = await directRefreshSession(session.refresh_token);
        if (refreshed) {
          session = refreshed;
          user = session.user || user;
          accessToken = session.access_token || accessToken;
        }
      }

      // 3. Прямой запрос роли в profiles (100–250 мс, без ожидания внутренних блокировок клиента)
      const fetchRole = async (token) => {
        return await Promise.race([
          fetch(`${config.url}/rest/v1/profiles?id=eq.${user.id}&select=role`, {
            headers: {
              apikey: config.publishableKey,
              Authorization: `Bearer ${token}`
            }
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
        ]);
      };

      let roleRes;
      try {
        roleRes = await fetchRole(accessToken);
      } catch (err) {
        console.warn('Ошибка первого запроса роли:', err);
      }

      // 4. Если токен всё же оказался недействительным (401), обновляем сессию и повторяем
      if ((!roleRes || roleRes.status === 401) && session.refresh_token) {
        const refreshed = await directRefreshSession(session.refresh_token);
        if (refreshed?.access_token) {
          accessToken = refreshed.access_token;
          user = refreshed.user || user;
          try {
            roleRes = await fetchRole(accessToken);
          } catch {}
        }
      }

      if (roleRes && roleRes.ok) {
        const rows = await roleRes.json().catch(() => []);
        const role = rows?.[0]?.role;
        const isAdmin = role === 'admin' || isKnownAdminEmail;
        return { user, isAdmin, profile: rows?.[0] || null };
      }

      // Если пользователь — наш постоянный администратор bgogolev21@gmail.com,
      // то временная сетевая задержка чтения profiles не должна блокировать вход
      // (все операции изменения в базе надёжно защищены правилами RLS в PostgreSQL)
      if (isKnownAdminEmail) {
        return { user, isAdmin: true, fallback: true };
      }

      return { user, isAdmin: false, error: new Error('Не удалось подтвердить роль администратора') };
    } catch (err) {
      console.warn('loadViewer error:', err);
      return { user: null, isAdmin: false, error: err };
    }
  };

  // Тёмная тема: синхронизация состояния, запоминание и адаптация интерфейса
  const THEME_STORAGE_KEY = 'math-tasks:theme';
  const FALLBACK_THEME_KEY = 'theme';

  const getSavedTheme = () => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(FALLBACK_THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    } catch {}
    return 'light';
  };

  let currentTheme = getSavedTheme();

  const applyTheme = theme => {
    currentTheme = theme === 'dark' ? 'dark' : 'light';
    const isDark = currentTheme === 'dark';
    if (document.body) {
      document.body.classList.toggle('dark', isDark);
    }
    if (document.documentElement) {
      document.documentElement.classList.toggle('dark', isDark);
    }

    const i18n = window.MathTasksI18n;
    const labelKey = isDark ? 'theme_dark' : 'theme_light';
    const switchKey = isDark ? 'theme_switch_light' : 'theme_switch_dark';
    const defaultLabel = isDark ? 'Тёмная тема' : 'Светлая тема';
    const defaultTitle = isDark ? 'Включить светлую тему' : 'Включить тёмную тему';

    /* Переключатель показывает состояние сам, поэтому подпись ему не нужна;
       у старой кнопки с текстом её по-прежнему обновляем. */
    document.querySelectorAll('.theme-switch, .theme-toggle').forEach(button => {
      const titleText = i18n?.t ? i18n.t(switchKey) : defaultTitle;
      button.setAttribute('aria-label', titleText);
      button.setAttribute('title', titleText);
      if (button.hasAttribute('role')) button.setAttribute('aria-checked', String(isDark));

      const icon = button.querySelector('[data-theme-icon]');
      if (icon) icon.textContent = isDark ? '☾' : '☼';
      const label = button.querySelector('[data-theme-label]');
      if (label) {
        label.dataset.i18n = labelKey;
        label.textContent = i18n?.t ? i18n.t(labelKey) : defaultLabel;
      }
    });

    try {
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: currentTheme } }));
    } catch {}
  };

  window.MathTasks.getTheme = () => currentTheme;
  window.MathTasks.applyTheme = applyTheme;

  applyTheme(currentTheme);

  // Делегированный клик — работает для кнопок в шапке на главной и в админке
  document.addEventListener('click', e => {
    const button = e.target.closest('.theme-switch, .theme-toggle');
    if (!button) return;
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      localStorage.setItem(FALLBACK_THEME_KEY, nextTheme);
    } catch {}
    applyTheme(nextTheme);
  });

  // При смене языка на лету обновляем подписи у кнопок темы
  window.addEventListener('languagechange', () => {
    applyTheme(currentTheme);
  });

  // Если пользователь не сохранил тему вручную, следуем системной
  try {
    window.matchMedia?.('(prefers-color-scheme: dark)')?.addEventListener('change', e => {
      try {
        const hasCustom = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(FALLBACK_THEME_KEY);
        if (!hasCustom) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      } catch {}
    });
  } catch {}
})();
