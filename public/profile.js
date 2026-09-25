/* Профиль ученика: прогресс переезжает между устройствами без почты и
   пароля — у профиля есть только ник.

   Вход анонимный (Supabase Anonymous Sign-Ins), прогресс — снимок ключей
   math-tasks:* из браузера (lib.js: collectProgress / mergeProgress). При
   каждой синхронизации снимок с сервера сливается с местным и уходит
   обратно, так что два устройства не затирают друг друга.

   Пока миграция 027 не применена, всё выключено: карточка профиля не
   показывается, запросов нет. Таблицу проверяем только на странице «Мой
   прогресс», а синхронизируем — только если профиль уже есть: обычный
   посетитель не платит за эту функцию ни одним запросом. */
(() => {
  const db = window.MathTasks?.db;
  const lib = window.MathTasksLib;
  if (!db || !lib) return;

  const tr = (key, params) => (window.MathTasks?.t ? window.MathTasks.t(key, params) : key);
  const lang = () => (window.MathTasks?.getLang ? window.MathTasks.getLang() : 'ru');
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  const nicks = window.MathTasksDuel;

  const SYNC_EVERY_MS = 30 * 1000;
  const TOUCH_KEY = 'math-tasks:profile-touched';

  let ready = null;        // есть ли таблицы: null — ещё не проверяли
  let profile = null;      // { id, nick }
  let lastSignature = null;
  let lastSyncAt = 0;
  let syncing = false;
  let timer = null;
  let started = false;

  // Сессия supabase-js лежит в localStorage: читаем её сами, без запросов.
  const storedUser = () => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
        const session = JSON.parse(localStorage.getItem(key));
        if (session?.user) return session.user;
      }
    } catch {}
    return null;
  };
  const hasStudentSession = () => Boolean(storedUser()?.is_anonymous);
  // Вход администратора анонимный вход бы заменил — и выкинул его из админки.
  const hasAdminSession = () => {
    const user = storedUser();
    return Boolean(user && !user.is_anonymous);
  };

  async function detect() {
    if (ready !== null) return ready;
    try {
      const { error } = await db.from('student_progress').select('profile_id').limit(0);
      ready = !error;
    } catch {
      ready = false;
    }
    return ready;
  }

  async function loadProfile() {
    try {
      const { data, error } = await db.from('student_profiles').select('id,nick').maybeSingle();
      profile = error ? null : data;
    } catch {
      profile = null;
    }
    // Ник профиля — общий для сайта: дуэль на этом устройстве покажет его же.
    if (profile?.nick) storeNick(profile.nick);
    return profile;
  }

  /* Прочитать снимок с сервера, слить с местным, записать и то и другое.
     Снимок на сервере пишем, только если после слияния он отличается. */
  async function sync() {
    if (!profile || syncing) return;
    syncing = true;
    try {
      const { data, error } = await db.from('student_progress').select('data').eq('profile_id', profile.id).maybeSingle();
      if (error) return;
      const remote = data?.data || {};
      const local = lib.collectProgress(localStorage);
      const merged = lib.mergeProgress(local, remote);
      const mergedSignature = lib.progressSignature(merged);
      if (mergedSignature !== lib.progressSignature(local)) {
        lib.applyProgress(localStorage, merged);
        window.dispatchEvent(new CustomEvent('math-tasks:progress-synced'));
      }
      if (mergedSignature !== lib.progressSignature(remote)) {
        const { error: writeError } = await db.from('student_progress')
          .upsert({ profile_id: profile.id, data: merged, updated_at: new Date().toISOString() });
        if (writeError) return;
      }
      lastSignature = mergedSignature;
      lastSyncAt = Date.now();
      renderStatus();
    } catch {
      // Сеть пропала — попробуем в следующий раз, прогресс в браузере цел.
    } finally {
      syncing = false;
    }
  }

  // Раз в полминуты — только если прогресс поменялся с прошлой синхронизации.
  const syncIfChanged = () => {
    if (!profile) return;
    if (lib.progressSignature(lib.collectProgress(localStorage)) !== lastSignature) sync();
  };

  function startSyncing() {
    if (started) return;
    started = true;
    clearInterval(timer);
    timer = setInterval(syncIfChanged, SYNC_EVERY_MS);
    document.addEventListener('visibilitychange', () => {
      // Ушёл со вкладки — отправляем; вернулся — забираем с других устройств.
      if (document.visibilityState === 'hidden') syncIfChanged();
      else sync();
    });
    // Отметка активности раз в день: по ней чистятся заброшенные профили.
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (localStorage.getItem(TOUCH_KEY) !== today) {
        db.rpc('touch_profile').then(() => localStorage.setItem(TOUCH_KEY, today)).catch(() => {});
      }
    } catch {}
  }

  async function boot() {
    if (!hasStudentSession()) return;
    if (!(await detect())) return;
    if (!(await loadProfile())) return;
    await sync();
    startSyncing();
  }

  // ── Действия ────────────────────────────────────────────────────────
  const ERRORS = {
    code_invalid: 'profile_err_code',
    not_signed_in: 'profile_err_generic',
    no_profile: 'profile_err_generic'
  };
  const errorText = error => {
    const message = String(error?.message || error || '');
    // Анонимный вход выключен или закрыта регистрация: Supabase не пускает анонимов и тогда.
    if ((/anonymous/i.test(message) && /disabled/i.test(message)) || /signups? not allowed|signup_disabled/i.test(message)) return tr('profile_err_disabled');
    const key = Object.keys(ERRORS).find(code => message.includes(code));
    return tr(key ? ERRORS[key] : 'profile_err_generic');
  };

  async function ensureSignedIn() {
    if (hasStudentSession()) return;
    const { error } = await db.auth.signInAnonymously();
    if (error) throw error;
  }

  async function createProfile(nick) {
    await ensureSignedIn();
    const { error } = await db.rpc('ensure_profile', { p_nick: nick });
    if (error) throw error;
    await loadProfile();
    lastSignature = null;
    await sync();
    startSyncing();
  }

  async function joinProfile(code) {
    await ensureSignedIn();
    const clean = String(code || '').trim();
    // Одноразовый код — 8 знаков, код восстановления — 12.
    const rpc = clean.replace(/[^A-Za-z0-9]/g, '').length > 8 ? 'recover_by_code' : 'join_by_code';
    const { error } = await db.rpc(rpc, { p_code: clean });
    if (error) throw error;
    await loadProfile();
    lastSignature = null;
    await sync();
    startSyncing();
  }

  async function deleteProfile() {
    const { error } = await db.rpc('delete_my_profile');
    if (error) throw error;
    profile = null;
    lastSignature = null;
    started = false;
    clearInterval(timer);
    await db.auth.signOut().catch(() => {});
  }

  // ── Карточка на странице «Мой прогресс» ─────────────────────────────
  const card = () => document.querySelector('#profile-card');

  function renderStatus() {
    const status = card()?.querySelector('[data-profile-status]');
    if (!status || !lastSyncAt) return;
    const time = new Date(lastSyncAt).toLocaleTimeString(lang() === 'lv' ? 'lv-LV' : 'ru-RU', { hour: '2-digit', minute: '2-digit' });
    status.textContent = tr('profile_synced', { time });
  }

  const showError = text => {
    const el = card()?.querySelector('[data-profile-error]');
    if (!el) return;
    el.textContent = text || '';
    el.hidden = !text;
  };

  /* Ник один на весь сайт: его же показывает дуэль. Хранится в браузере
     под общим ключом; профиль, когда он есть, — главный источник и
     переносит ник на другое устройство. */
  const NICK_KEY = 'math-tasks:nick';
  const storedNick = () => {
    try {
      const raw = localStorage.getItem(NICK_KEY) || localStorage.getItem('math-tasks:duel-nick');
      return nicks?.sanitizeNick ? nicks.sanitizeNick(raw) : String(raw || '').trim();
    } catch { return ''; }
  };
  const storeNick = nick => { try { localStorage.setItem(NICK_KEY, nick); } catch {} };

  function renderNoProfile(box) {
    const nick = storedNick() || (nicks?.generateNick ? nicks.generateNick(lang()) : '');
    box.innerHTML = `
      <h2>💾 ${escapeHtml(tr('profile_title_new'))}</h2>
      <p>${escapeHtml(tr('profile_lead'))}</p>
      <div class="profile-row">
        <label class="profile-nick"><span>${escapeHtml(tr('profile_nick'))}</span><input id="profile-nick" type="text" maxlength="24" autocomplete="off" spellcheck="false" value="${escapeHtml(nick)}" /></label>
      </div>
      <label class="profile-consent"><input type="checkbox" id="profile-consent" /> <span>${escapeHtml(tr('profile_consent'))}</span></label>
      <div class="profile-actions">
        <button type="button" class="primary-button" data-profile-create disabled>${escapeHtml(tr('profile_create'))}</button>
        <button type="button" class="text-button" data-profile-join-open>${escapeHtml(tr('profile_have_one'))}</button>
      </div>
      <form class="profile-join" data-profile-join hidden>
        <label><span>${escapeHtml(tr('profile_code_label'))}</span><input type="text" autocomplete="off" spellcheck="false" placeholder="ABCD-2345" /></label>
        <button type="submit" class="secondary-button">${escapeHtml(tr('profile_join'))}</button>
      </form>
      <p class="profile-note">${escapeHtml(tr('profile_privacy'))}</p>
      <p class="profile-error" data-profile-error hidden></p>`;
  }

  function renderWithProfile(box) {
    box.innerHTML = `
      <h2>💾 ${escapeHtml(tr('profile_title'))}: <span class="profile-name">${escapeHtml(profile.nick)}</span></h2>
      <p class="profile-status" data-profile-status>${escapeHtml(tr('profile_syncing'))}</p>
      <div class="profile-actions">
        <button type="button" class="secondary-button" data-profile-code>${escapeHtml(tr('profile_move'))}</button>
        <button type="button" class="secondary-button" data-profile-recovery>${escapeHtml(tr('profile_recovery'))}</button>
        <button type="button" class="text-button danger" data-profile-delete>${escapeHtml(tr('profile_delete'))}</button>
      </div>
      <div class="profile-code-box" data-profile-code-box hidden></div>
      <p class="profile-note">${escapeHtml(tr('profile_privacy'))}</p>
      <p class="profile-error" data-profile-error hidden></p>`;
    renderStatus();
  }

  async function renderCard() {
    const box = card();
    if (!box) return;
    if (!(await detect())) { box.hidden = true; return; }
    box.hidden = false;
    if (hasAdminSession()) {
      box.innerHTML = `<h2>💾 ${escapeHtml(tr('profile_title_new'))}</h2><p>${escapeHtml(tr('profile_admin_note'))}</p>`;
      return;
    }
    if (hasStudentSession() && !profile) await loadProfile();
    if (profile) {
      renderWithProfile(box);
      startSyncing();
    } else {
      renderNoProfile(box);
    }
  }

  const busy = (button, on) => {
    if (!button) return;
    button.disabled = on;
    button.classList.toggle('is-busy', on);
  };

  document.addEventListener('change', event => {
    if (event.target.id === 'profile-consent') {
      const create = card()?.querySelector('[data-profile-create]');
      if (create) create.disabled = !event.target.checked;
    }
  });

  document.addEventListener('click', async event => {
    const box = card();
    if (!box || !box.contains(event.target)) return;
    const target = event.target;

    if (target.closest('[data-profile-join-open]')) {
      const form = box.querySelector('[data-profile-join]');
      if (form) form.hidden = !form.hidden;
      return;
    }

    const create = target.closest('[data-profile-create]');
    if (create) {
      showError('');
      const raw = box.querySelector('#profile-nick')?.value;
      const nick = (nicks?.sanitizeNick ? nicks.sanitizeNick(raw) : String(raw || '').trim()) || (nicks?.generateNick ? nicks.generateNick(lang()) : 'MathTasks');
      busy(create, true);
      try {
        await createProfile(nick);
        await renderCard();
      } catch (error) {
        showError(errorText(error));
        busy(create, false);
      }
      return;
    }

    const codeBtn = target.closest('[data-profile-code]');
    if (codeBtn) {
      showError('');
      busy(codeBtn, true);
      try {
        const { data, error } = await db.rpc('make_transfer_code');
        if (error) throw error;
        const out = box.querySelector('[data-profile-code-box]');
        out.hidden = false;
        out.innerHTML = `<p>${escapeHtml(tr('profile_code_hint'))}</p><strong class="profile-code">${escapeHtml(data)}</strong>`;
      } catch (error) {
        showError(errorText(error));
      } finally {
        busy(codeBtn, false);
      }
      return;
    }

    const recovery = target.closest('[data-profile-recovery]');
    if (recovery) {
      if (!window.confirm(tr('profile_recovery_confirm'))) return;
      showError('');
      busy(recovery, true);
      try {
        const { data, error } = await db.rpc('set_recovery_code');
        if (error) throw error;
        const out = box.querySelector('[data-profile-code-box]');
        out.hidden = false;
        out.innerHTML = `<p>${escapeHtml(tr('profile_recovery_hint'))}</p><strong class="profile-code">${escapeHtml(data)}</strong>`;
      } catch (error) {
        showError(errorText(error));
      } finally {
        busy(recovery, false);
      }
      return;
    }

    const remove = target.closest('[data-profile-delete]');
    if (remove) {
      if (!window.confirm(tr('profile_delete_confirm'))) return;
      busy(remove, true);
      try {
        await deleteProfile();
        await renderCard();
      } catch (error) {
        showError(errorText(error));
        busy(remove, false);
      }
    }
  });

  document.addEventListener('submit', async event => {
    const form = event.target.closest?.('#profile-card [data-profile-join]');
    if (!form) return;
    event.preventDefault();
    showError('');
    const button = form.querySelector('button');
    busy(button, true);
    try {
      await joinProfile(form.querySelector('input')?.value);
      await renderCard();
    } catch (error) {
      showError(errorText(error));
      busy(button, false);
    }
  });

  window.addEventListener('languagechange', () => {
    if (card() && !card().hidden) renderCard();
  });

  window.MathTasksProfile = { renderCard, sync };
  boot();
})();
