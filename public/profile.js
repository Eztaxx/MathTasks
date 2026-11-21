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
  // Перенос прогресса — в progress-sync.js; здесь профиль и его карточка.
  const S = window.MathTasksSync;
  if (!db || !lib || !S) return;

  const tr = (key, params) => (window.MathTasks?.t ? window.MathTasks.t(key, params) : key);
  const lang = () => (window.MathTasks?.getLang ? window.MathTasks.getLang() : 'ru');
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  const nicks = window.MathTasksDuel;

  let ready = null;        // есть ли таблицы: null — ещё не проверяли
  let profile = null;      // { id, nick, nick_changed_at?, avatar? }
  /* rename — применена миграция 031: ник меняется функцией rename_profile
     (не чаще раза в 3 месяца), а зверь хранится в профиле. До неё в
     карточке нет ни смены ника, ни выбора зверя. */
  const features = { rename: false };

  const { hasStudentSession, hasAdminSession } = S;

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
      let { data, error } = await db.from('student_profiles').select('id,nick,nick_changed_at,avatar').maybeSingle();
      features.rename = !error;
      // Без миграции 031 новых столбцов нет — читаем как раньше.
      if (error) ({ data, error } = await db.from('student_profiles').select('id,nick').maybeSingle());
      profile = error ? null : data;
    } catch {
      profile = null;
    }
    rememberProfile();
    if (profile) S.attach(db, profile.id);
    return profile;
  }

  /* Ник и зверь профиля — общие для сайта. Страница дуэли не грузит
     profile.js и узнаёт о профиле по маркеру: с ним ник там только для
     чтения, а зверь — из профиля (managed). */
  const PROFILE_KEY = 'math-tasks:profile';
  const AVATAR_KEY = 'math-tasks:avatar';
  function rememberProfile() {
    try {
      if (!profile?.nick) { localStorage.removeItem(PROFILE_KEY); return; }
      storeNick(profile.nick);
      const avatar = nicks?.sanitizeAvatar ? nicks.sanitizeAvatar(profile.avatar) : '';
      if (features.rename && avatar) localStorage.setItem(AVATAR_KEY, avatar);
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ nick: profile.nick, avatar: avatar || '', managed: features.rename }));
    } catch {}
  }

  async function boot() {
    if (!hasStudentSession()) return;
    if (!(await detect())) return;
    if (!(await loadProfile())) return;
    await S.sync();
    S.start();
  }

  // ── Действия ────────────────────────────────────────────────────────
  const ERRORS = {
    nick_invalid: 'profile_err_nick_invalid',
    code_invalid: 'profile_err_code',
    not_signed_in: 'profile_err_generic',
    no_profile: 'profile_err_generic'
  };
  const errorText = error => {
    const message = String(error?.message || error || '');
    // Анонимный вход выключен или закрыта регистрация: Supabase не пускает анонимов и тогда.
    if ((/anonymous/i.test(message) && /disabled/i.test(message)) || /signups? not allowed|signup_disabled/i.test(message)) return tr('profile_err_disabled');
    // Ник меняли недавно: сервер присылает дату, когда можно снова.
    const soon = /nick_too_soon:(\d{4}-\d{2}-\d{2})/.exec(message);
    if (soon) return tr('profile_err_nick_soon', { date: formatDay(soon[1]) });
    if (/PGRST202|42883|rename_profile|set_profile_avatar/.test(message) && /not find|does not exist|function/i.test(message)) return tr('profile_err_unavailable');
    const key = Object.keys(ERRORS).find(code => message.includes(code));
    return tr(key ? ERRORS[key] : 'profile_err_generic');
  };

  const formatDay = value => {
    const date = new Date(value);
    /* «27 декабря 2026 г.» — точка сокращения слипалась с точкой в конце
       фразы («… 2026 г..»): «г.» снимаем, год и так понятен. */
    return Number.isNaN(date.getTime()) ? String(value)
      : date.toLocaleDateString(lang() === 'lv' ? 'lv-LV' : 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/\s*г\.$/, '');
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
    // Зверь, выбранный до профиля в дуэли, переезжает в профиль.
    if (features.rename && profile && !profile.avatar) {
      let local = '';
      try { local = nicks?.sanitizeAvatar ? nicks.sanitizeAvatar(localStorage.getItem(AVATAR_KEY)) : ''; } catch {}
      if (local && !(await db.rpc('set_profile_avatar', { p_avatar: local })).error) {
        profile.avatar = local;
        rememberProfile();
      }
    }
    await S.sync();
    S.start();
  }

  async function joinProfile(code) {
    await ensureSignedIn();
    const clean = String(code || '').trim();
    // Одноразовый код — 8 знаков, код восстановления — 12.
    const rpc = clean.replace(/[^A-Za-z0-9]/g, '').length > 8 ? 'recover_by_code' : 'join_by_code';
    const { error } = await db.rpc(rpc, { p_code: clean });
    if (error) throw error;
    await loadProfile();
    await S.sync();
    S.start();
  }

  async function deleteProfile() {
    // Подписку в базе удалит сам профиль (каскад), а браузер пусть тоже забудет её.
    await disableRemind().catch(() => {});
    /* Вместе с профилем стираем попытки дуэли с этого устройства — по номеру
       игрока из браузера (миграция 035). Пока 035 не применена, функции с
       аргументом нет (PGRST202) — удаляем профиль прежним вызовом. */
    let player = null;
    try {
      const stored = localStorage.getItem('math-tasks:duel-player');
      if (stored && /^[a-z0-9]{8,32}$/.test(stored)) player = stored;
    } catch {}
    let { error } = player
      ? await db.rpc('delete_my_profile', { p_player: player })
      : await db.rpc('delete_my_profile');
    if (error && player && error.code === 'PGRST202') ({ error } = await db.rpc('delete_my_profile'));
    if (error) throw error;
    profile = null;
    rememberProfile();
    S.attach(db, null);
    await db.auth.signOut().catch(() => {});
  }

  // ── Напоминание позаниматься (миграция 033, worker/push.js) ────────
  /* Пуш раз в день в выбранный час — только если сегодня ещё ничего не
     решено. Подписка браузера хранится в базе при профиле; разрешение на
     уведомления спрашиваем только по нажатию. В приложении из Google Play
     разрешение и уведомления — от имени приложения (делегирование TWA). */
  const REMIND_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  const DEFAULT_HOUR = 18;

  const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  // На iPhone пуши есть только у сайта, добавленного на экран «Домой».
  // iPadOS притворяется Mac-ом: узнаём его по сенсорному экрану.
  const iosDevice = () => /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  const iosBrowserTab = () => iosDevice()
    && !(window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone);

  function remindControls() {
    const options = REMIND_HOURS.map(hour => `<option value="${hour}">${String(hour).padStart(2, '0')}:00</option>`).join('');
    return `
      <div class="profile-remind" data-profile-remind hidden>
        <label class="profile-consent" data-remind-toggle><input type="checkbox" id="profile-remind-on" /> <span>${escapeHtml(tr('profile_remind'))}</span></label>
        <label class="profile-nick" data-remind-hour><span>${escapeHtml(tr('profile_remind_hour'))}</span><select id="profile-remind-hour">${options}</select></label>
        <p class="profile-note" data-remind-privacy>${escapeHtml(tr('profile_remind_privacy'))}</p>
        <p class="profile-note" data-profile-remind-note hidden></p>
      </div>`;
  }

  async function pushSubscription() {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration ? registration.pushManager.getSubscription() : null;
  }

  /* Напоминания включены на сервере, только когда есть и функции миграции
     033, и ключ VAPID в секретах воркера. Пока чего-то нет, блока не видно
     совсем — ни переключателя, ни подсказки для iPhone, ни просьбы разрешить
     уведомления. Ответ один на загрузку страницы. Результат — ключ или null. */
  let remindReadyPromise = null;
  const remindReady = () => (remindReadyPromise ||= (async () => {
    const response = await fetch('/api/push/key');
    const { key } = response.ok ? await response.json() : {};
    if (!key) return null;
    const { error } = await db.rpc('my_push_reminder', { p_endpoint: '' });
    return error ? null : key;
  })().catch(() => null));

  async function renderRemind(box) {
    const block = box.querySelector('[data-profile-remind]');
    if (!block) return;
    const note = block.querySelector('[data-profile-remind-note]');
    const setNote = text => { note.textContent = text || ''; note.hidden = !text; };
    if (!(await remindReady())) return;
    if (!pushSupported()) {
      if (!iosBrowserTab()) return;
      block.querySelector('[data-remind-toggle]').hidden = true;
      block.querySelector('[data-remind-hour]').hidden = true;
      block.querySelector('[data-remind-privacy]').hidden = true;
      block.hidden = false;
      setNote(tr('profile_remind_ios'));
      return;
    }
    try {
      const subscription = await pushSubscription();
      const { data, error } = await db.rpc('my_push_reminder', { p_endpoint: subscription?.endpoint || '' });
      if (error) return;
      const on = Boolean(subscription) && data !== null && data !== undefined;
      block.querySelector('#profile-remind-on').checked = on;
      block.querySelector('#profile-remind-hour').value = String(on ? data : DEFAULT_HOUR);
      block.hidden = false;
      if (Notification.permission === 'denied') setNote(tr('profile_remind_denied'));
    } catch {}
  }

  const base64UrlBytes = value => {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    return Uint8Array.from(atob(base64), char => char.charCodeAt(0));
  };

  async function enableRemind(hour) {
    // Разрешение спрашиваем первым делом, пока нажатие ещё «свежее» для браузера.
    if (Notification.permission !== 'granted' && (await Notification.requestPermission()) !== 'granted') {
      throw new Error('remind_denied');
    }
    // При первом заходе service worker может ещё ставиться — ждём его, но не дольше 5 секунд.
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise(resolve => setTimeout(() => resolve(null), 5000))
    ]);
    if (!registration) throw new Error('remind_unavailable');
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const key = await remindReady();
      if (!key) throw new Error('remind_unavailable');
      subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlBytes(key) });
    }
    const { endpoint, keys } = subscription.toJSON();
    const { error } = await db.rpc('save_push_subscription', {
      p_endpoint: endpoint,
      p_p256dh: keys.p256dh,
      p_auth: keys.auth,
      p_lang: lang(),
      p_hour: hour,
      p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Riga'
    });
    if (error) throw error;
  }

  async function disableRemind() {
    if (!pushSupported()) return;
    const subscription = await pushSubscription();
    if (!subscription) return;
    const { error } = await db.rpc('delete_push_subscription', { p_endpoint: subscription.endpoint });
    if (error) throw error;
    await subscription.unsubscribe().catch(() => {});
  }

  // Сменили язык сайта — напоминание приходит на новом.
  async function resaveRemindLang() {
    if (!profile || !pushSupported() || Notification.permission !== 'granted') return;
    try {
      const subscription = await pushSubscription();
      if (!subscription) return;
      const { data, error } = await db.rpc('my_push_reminder', { p_endpoint: subscription.endpoint });
      if (!error && data !== null && data !== undefined) await enableRemind(data);
    } catch {}
  }

  const remindErrorText = error => {
    const message = String(error?.message || error || '');
    if (message === 'remind_denied') return tr('profile_remind_denied');
    if (message === 'remind_unavailable') return tr('profile_err_unavailable');
    return errorText(error);
  };

  // ── Карточка на странице «Мой прогресс» ─────────────────────────────
  const card = () => document.querySelector('#profile-card');

  function renderStatus() {
    const status = card()?.querySelector('[data-profile-status]');
    if (!status || !S.lastSyncAt) return;
    const time = new Date(S.lastSyncAt).toLocaleTimeString(lang() === 'lv' ? 'lv-LV' : 'ru-RU', { hour: '2-digit', minute: '2-digit' });
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
      <p class="profile-note">${escapeHtml(tr('profile_privacy'))} <a href="/privacy">${escapeHtml(tr('privacy_more'))}</a></p>
      <p class="profile-error" data-profile-error hidden></p>`;
  }

  const avatarSpan = () => {
    if (!nicks?.avatarFor) return '';
    const avatar = nicks.avatarFor(profile.nick, profile.avatar);
    return `<span class="duel-avatar profile-avatar${avatar.emoji ? ' is-emoji' : ''}" style="--h:${avatar.hue}" aria-hidden="true">${escapeHtml(avatar.text)}</span>`;
  };

  // Смена ника (не чаще раза в 3 месяца) и выбор зверя — после миграции 031.
  function identityControls() {
    if (!features.rename) return '';
    const waitUntil = lib.nickChangeAvailableAt ? lib.nickChangeAvailableAt(profile.nick_changed_at) : null;
    const mine = nicks?.sanitizeAvatar ? nicks.sanitizeAvatar(profile.avatar) : '';
    const grid = (nicks?.AVATARS || []).map(([id, icon]) => `<button type="button" data-profile-avatar="${id}" aria-pressed="${id === mine}" aria-label="${escapeHtml(icon)}">${icon}</button>`).join('');
    return `
      <div class="profile-actions">
        <button type="button" class="secondary-button" data-profile-rename-open${waitUntil ? ' disabled' : ''}>${escapeHtml(tr('profile_rename'))}</button>
        <button type="button" class="secondary-button" data-profile-avatar-open>${escapeHtml(tr('profile_avatar'))}</button>
      </div>
      <p class="profile-note">${escapeHtml(waitUntil ? tr('profile_rename_wait', { date: formatDay(waitUntil) }) : tr('profile_rename_hint'))}</p>
      <form class="profile-rename" data-profile-rename hidden>
        <label><span>${escapeHtml(tr('profile_nick'))}</span><input type="text" maxlength="24" autocomplete="off" spellcheck="false" value="${escapeHtml(profile.nick)}" /></label>
        <button type="submit" class="primary-button">${escapeHtml(tr('profile_rename_save'))}</button>
      </form>
      <div class="profile-avatar-grid duel-avatar-grid" data-profile-avatar-grid hidden>${grid}</div>`;
  }

  function renderWithProfile(box) {
    box.innerHTML = `
      <h2>💾 ${escapeHtml(tr('profile_title'))}: ${avatarSpan()}<span class="profile-name">${escapeHtml(profile.nick)}</span></h2>
      <p class="profile-status" data-profile-status>${escapeHtml(tr('profile_syncing'))}</p>${identityControls()}
      <div class="profile-actions">
        <button type="button" class="secondary-button" data-profile-code>${escapeHtml(tr('profile_move'))}</button>
        <button type="button" class="secondary-button" data-profile-recovery>${escapeHtml(tr('profile_recovery'))}</button>
        <button type="button" class="text-button danger" data-profile-delete>${escapeHtml(tr('profile_delete'))}</button>
      </div>
      <div class="profile-code-box" data-profile-code-box hidden></div>${remindControls()}
      <p class="profile-note">${escapeHtml(tr('profile_privacy'))} <a href="/privacy">${escapeHtml(tr('privacy_more'))}</a></p>
      <p class="profile-error" data-profile-error hidden></p>`;
    renderStatus();
    renderRemind(box);
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
      S.start();
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

  document.addEventListener('change', async event => {
    const target = event.target;
    if (target.id !== 'profile-remind-on' && target.id !== 'profile-remind-hour') return;
    const box = card();
    const toggle = box?.querySelector('#profile-remind-on');
    if (!toggle) return;
    // Час при выключенном напоминании просто запоминается в списке — сохранится при включении.
    if (target.id === 'profile-remind-hour' && !toggle.checked) return;
    const hour = Number(box.querySelector('#profile-remind-hour')?.value) || DEFAULT_HOUR;
    const note = box.querySelector('[data-profile-remind-note]');
    showError('');
    toggle.disabled = true;
    try {
      if (toggle.checked) await enableRemind(hour);
      else await disableRemind();
      if (note) note.hidden = true;
    } catch (error) {
      if (target === toggle) toggle.checked = !toggle.checked;
      showError(remindErrorText(error));
    } finally {
      toggle.disabled = false;
    }
  });

  document.addEventListener('click', async event => {
    const box = card();
    if (!box || !box.contains(event.target)) return;
    const target = event.target;

    if (target.closest('[data-profile-rename-open]')) {
      const form = box.querySelector('[data-profile-rename]');
      if (form) { form.hidden = !form.hidden; if (!form.hidden) form.querySelector('input')?.focus(); }
      return;
    }
    if (target.closest('[data-profile-avatar-open]')) {
      const grid = box.querySelector('[data-profile-avatar-grid]');
      if (grid) grid.hidden = !grid.hidden;
      return;
    }
    const avatarChoice = target.closest('[data-profile-avatar]');
    if (avatarChoice) {
      showError('');
      const id = nicks?.sanitizeAvatar ? nicks.sanitizeAvatar(avatarChoice.dataset.profileAvatar) : '';
      if (!id) return;
      busy(avatarChoice, true);
      try {
        const { error } = await db.rpc('set_profile_avatar', { p_avatar: id });
        if (error) throw error;
        profile.avatar = id;
        rememberProfile();
        await renderCard();
      } catch (error) {
        showError(errorText(error));
        busy(avatarChoice, false);
      }
      return;
    }

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

  // Смена ника: срок проверяет сервер (rename_profile), здесь — только чистка ника.
  document.addEventListener('submit', async event => {
    const form = event.target.closest?.('#profile-card [data-profile-rename]');
    if (!form) return;
    event.preventDefault();
    showError('');
    const raw = form.querySelector('input')?.value;
    const nick = nicks?.sanitizeNick ? nicks.sanitizeNick(raw) : String(raw || '').trim();
    if (!nick) { showError(tr('profile_err_nick_invalid')); return; }
    const button = form.querySelector('button');
    busy(button, true);
    try {
      const { data, error } = await db.rpc('rename_profile', { p_nick: nick });
      if (error) throw error;
      profile.nick = nick;
      profile.nick_changed_at = data || profile.nick_changed_at;
      rememberProfile();
      await renderCard();
    } catch (error) {
      showError(errorText(error));
      busy(button, false);
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
    resaveRemindLang();
  });

  window.addEventListener('math-tasks:sync-done', renderStatus);

  window.MathTasksProfile = { renderCard, sync: S.sync };
  boot();
})();
