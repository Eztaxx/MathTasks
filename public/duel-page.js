/* Страница дуэли (duel.html): настройка, ссылка другу, отсчёт, минута
   примеров, итог. Правила и кодирование ссылки — в duel.js, примеры — из
   генераторов тренажёра с зерном дуэли. Состояние вызова читается из
   фрагмента адреса и туда же не пишется: ссылку ребёнок получает кнопкой.

   Три режима:
     • случайный соперник — живой игрок из канала Realtime, иначе запись
       другого игрока (duel_ghost);
     • вызов друга — ссылка появляется сразу, до своей минуты: её можно
       сыграть и позже; сравнение открывается, когда сыграли оба;
     • на рекорд — минута в одиночку, результат идёт в таблицу лидеров. */
(() => {
  const D = window.MathTasksDuel;
  const T = window.MathTasksTrainer;
  if (!D || !T) return;

  const $ = selector => document.querySelector(selector);
  const tr = (key, params) => (window.MathTasks?.t ? window.MathTasks.t(key, params) : key);
  const lang = () => (window.MathTasks?.getLang ? window.MathTasks.getLang() : 'ru');
  const escapeHtml = str => String(str ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);

  /* Ник один на весь сайт: тот же ключ читает и пишет профиль ученика
     (profile.js). Старый ключ дуэли — на случай, если ник уже был. */
  const NICK_KEY = 'math-tasks:nick';
  const LEGACY_NICK_KEY = 'math-tasks:duel-nick';
  const HISTORY_KEY = 'math-tasks:duel-history';
  const SETUP_KEY = 'math-tasks:duel-setup';
  const PLAYER_KEY = 'math-tasks:duel-player';
  const RUNS_KEY = 'math-tasks:duel-runs';
  const BATCH = 150; // за минуту решают 15–40 примеров; запас на самых быстрых
  // Поколение попытки: генераторы тренажёра плюс лесенка (duel.js: runGen).
  const RUN_GEN = D.runGen(T.GENERATOR_VERSION);
  const HISTORY_MAX = 20;
  const RING_LENGTH = 2 * Math.PI * 26; // длина кольца таймера (r=26 в разметке)

  const readJson = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const writeJson = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };

  // ── Тема и звук — как на странице тренажёра ─────────────────────────
  const themeToggle = $('#theme-toggle');
  if (themeToggle) {
    themeToggle.setAttribute('aria-checked', document.documentElement.classList.contains('dark') ? 'true' : 'false');
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      document.body.classList.toggle('dark', isDark);
      try { localStorage.setItem('math-tasks:theme', isDark ? 'dark' : 'light'); } catch {}
      themeToggle.setAttribute('aria-checked', isDark ? 'true' : 'false');
    });
  }
  let soundOn = true;
  $('#btn-sound-toggle')?.addEventListener('click', () => {
    soundOn = !soundOn;
    const icon = $('#sound-icon');
    if (icon) icon.textContent = soundOn ? '🔊' : '🔇';
  });
  const sound = type => { if (soundOn) { try { T.playSound(type); } catch {} } };

  // ── Состояние ───────────────────────────────────────────────────────
  const saved = readJson(SETUP_KEY, {});
  const state = {
    challenge: null,      // вызов из ссылки (чужой — или свой, ещё не сыгранный)
    role: 'a',            // 'a' — вызываю сам, 'b' — отвечаю на вызов
    cat: D.CATEGORIES.includes(saved.cat) ? saved.cat : 'multdiv',
    diff: D.LADDER,       // сложность не выбирается: лесенка (duel.js)
    seed: 0,
    questions: [],
    index: 0,
    bits: [],
    streak: 0,
    endsAt: 0,
    timer: null,
    me: null,
    nick: '',
    mode: 'link',         // 'link' — вызов по ссылке, 'random' — случайный соперник, 'solo' — на рекорд
    opponent: null,       // { kind: 'live' | 'ghost', nick, r, q, … }
    answers: [],          // что ученик вписал — запись для будущих соперников
    times: [],            // когда: мс от начала минуты
    startedAt: 0,
    run: null,            // обещание номера попытки на сервере (worker/duel-api.js)
    waitingFinal: null
  };

  // Какая таблица лидеров открыта: по умолчанию — выбранные для игры категория и сложность.
  const board = { cat: state.cat, period: 'week', cache: new Map() };

  const screens = ['#duel-setup', '#duel-link', '#duel-search', '#duel-countdown', '#duel-play', '#duel-result'];
  const show = id => {
    screens.forEach(sel => { const el = $(sel); if (el) el.hidden = sel !== id; });
    if (id !== '#duel-result') { const rank = $('#duel-rank'); if (rank) rank.hidden = true; }
    // Во время игры заголовок не нужен: на телефоне он выталкивал клавиши за край.
    document.querySelector('main.duel')?.classList.toggle('is-playing', id === '#duel-play' || id === '#duel-countdown');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const notice = text => {
    const el = $('#duel-notice');
    if (!el) return;
    el.textContent = text || '';
    el.hidden = !text;
  };

  const catName = cat => String(tr(`cat_${cat}`)).replace(/^\S+\s/, '');
  const diffName = diff => String(tr(`trainer_diff_${diff}`)).replace(/^\S+\s/, '');
  const catIcon = cat => String(tr(`cat_${cat}`)).split(' ')[0];
  const nickOf = player => player?.n || tr('duel_friend');
  const setupLabel = cat => catName(cat);
  // Подпись итога: категория и ступень, до которой ученик добрался.
  const resultSub = (cat, attempts) => `${catName(cat)} · ${tr('duel_reached', { tier: diffName(D.tierReached(attempts).diff) })}`;

  const avatarHtml = (nick, extra = '') => {
    const avatar = D.avatarFor(nick);
    return `<span class="duel-avatar${avatar.emoji ? ' is-emoji' : ''}${extra ? ` ${extra}` : ''}" style="--h:${avatar.hue}" aria-hidden="true">${escapeHtml(avatar.text)}</span>`;
  };
  const fillAvatar = (el, nick) => {
    if (!el) return;
    const avatar = D.avatarFor(nick);
    el.textContent = avatar.text;
    el.classList.toggle('is-emoji', avatar.emoji);
    el.style.setProperty('--h', avatar.hue);
  };

  // ── Ник ─────────────────────────────────────────────────────────────
  const nickInput = $('#duel-nick');
  const readStoredNick = () => {
    try { return D.sanitizeNick(localStorage.getItem(NICK_KEY)) || D.sanitizeNick(localStorage.getItem(LEGACY_NICK_KEY)); } catch { return ''; }
  };
  const storeNick = nick => { try { localStorage.setItem(NICK_KEY, nick); } catch {} };
  /* Ник придумывается один раз — на языке первого визита — и дальше не
     меняется сам: у игрока он один, на обоих языках сайта. */
  const currentNick = () => {
    const stored = readStoredNick();
    if (stored) return stored;
    const fresh = D.generateNick(lang());
    storeNick(fresh);
    return fresh;
  };
  if (nickInput) {
    nickInput.value = currentNick();
    nickInput.addEventListener('input', () => fillAvatar($('#duel-avatar'), nickInput.value));
    nickInput.addEventListener('change', () => {
      const clean = D.sanitizeNick(nickInput.value);
      if (clean) { storeNick(clean); nickInput.value = clean; }
    });
  }
  $('#duel-nick-new')?.addEventListener('click', () => {
    if (!nickInput) return;
    nickInput.value = D.generateNick(lang());
    storeNick(nickInput.value);
    fillAvatar($('#duel-avatar'), nickInput.value);
  });

  /* Ник проверяем на старте, а не при каждом символе: ребёнку не нужно
     видеть, как его ввод вычищается по буквам. Не подошёл — берём из
     генератора и честно говорим об этом. */
  const takeNick = () => {
    const clean = D.sanitizeNick(nickInput?.value);
    const nick = clean || readStoredNick() || D.generateNick(lang());
    if (!clean) {
      if (nickInput) nickInput.value = nick;
      notice(tr('duel_nick_replaced'));
    }
    storeNick(nick);
    state.nick = nick;
    return nick;
  };

  // ── Выбор категории и сложности ─────────────────────────────────────
  const renderChoice = () => {
    const cats = $('#duel-cats');
    if (cats) {
      cats.innerHTML = D.CATEGORIES.map(cat => `<button type="button" class="trainer-cat-chip${cat === state.cat ? ' active' : ''}" data-duel-cat="${cat}" aria-pressed="${cat === state.cat}">${escapeHtml(tr(`cat_${cat}`))}</button>`).join('');
    }
    renderBest();
  };
  // Таблица лидеров рядом показывает ту же категорию, что выбрана для игры.
  const followChoice = () => {
    board.cat = state.cat;
    renderBoard();
  };
  document.addEventListener('click', event => {
    const cat = event.target.closest?.('[data-duel-cat]');
    if (cat) { state.cat = cat.dataset.duelCat; writeJson(SETUP_KEY, { cat: state.cat }); renderChoice(); followChoice(); }
  });

  // ── История ─────────────────────────────────────────────────────────
  /* Запись: { at, seed, cat, diff, role, me, them, name }. me и them —
     { r, q, m }; у вызова, минута которого ещё впереди, me = null. */
  const duelHistory = () => readJson(HISTORY_KEY, []).filter(item => item && typeof item === 'object');
  const remember = entry => {
    const list = duelHistory().filter(item => !(item.seed === entry.seed && item.role === entry.role));
    writeJson(HISTORY_KEY, [entry, ...list].slice(0, HISTORY_MAX));
  };
  const ownEntry = seed => duelHistory().find(item => item.seed === seed && item.role === 'a');

  // Лучший счёт в выбранной категории — для подписи и для подбора записи-соперника.
  const bestScore = () => {
    const scores = duelHistory()
      .filter(item => item.cat === state.cat && item.diff === D.LADDER && item.me)
      .map(item => Number(item.me.r) || 0);
    return scores.length ? Math.max(...scores) : null;
  };
  const renderBest = () => {
    const el = $('#duel-best');
    if (!el) return;
    const best = bestScore();
    el.textContent = best === null ? tr('duel_best_none') : tr('duel_best', { r: best });
    el.classList.toggle('is-empty', best === null);
  };

  const formatDate = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(lang() === 'lv' ? 'lv-LV' : 'ru-RU', { day: 'numeric', month: 'short' });
  };

  const renderHistory = () => {
    const box = $('#duel-history');
    const list = $('#duel-history-list');
    if (!box || !list) return;
    const items = duelHistory().slice(0, 6);
    box.hidden = !items.length;
    list.innerHTML = items.map(item => {
      const mine = item.me ? String(item.me.r) : '…';
      const theirs = item.them ? String(item.them.r) : '…';
      const who = item.them?.n || item.name || (item.role === 'r' ? tr('duel_opponent') : tr('duel_friend'));
      const outcome = !item.me || !item.them ? '⏳'
        : item.me.r > item.them.r ? '🏆' : item.me.r < item.them.r ? '·' : '🤝';
      const solo = item.role === 'r' && !item.them;
      return `<li>
        <span class="duel-history-outcome" aria-hidden="true">${solo ? '🏁' : outcome}</span>
        <span class="duel-history-cat">${escapeHtml(catIcon(item.cat))} ${escapeHtml(catName(item.cat))}</span>
        <span class="duel-history-score">${escapeHtml(mine)}${solo ? '' : ` : ${escapeHtml(theirs)}`}</span>
        <span class="duel-history-who">${solo ? escapeHtml(tr('duel_mode_solo_title')) : escapeHtml(who)}</span>
        <span class="duel-history-date">${escapeHtml(formatDate(item.at))}</span></li>`;
    }).join('');
  };

  // ── Экран настройки ─────────────────────────────────────────────────
  const openSetup = () => {
    fillAvatar($('#duel-avatar'), nickInput?.value || currentNick());
    const invite = $('#duel-invite');
    const modes = $('#duel-modes');
    const choice = $('#duel-choice');
    const incoming = state.challenge && (state.role === 'b' || D.hasResult(state.challenge.b));
    if (invite) invite.hidden = !incoming;
    if (modes) modes.hidden = incoming;
    if (choice) choice.hidden = incoming;
    if (incoming) renderInvite();
    else renderChoice();
    renderHistory();
    show('#duel-setup');
    renderBoard();
  };

  /* Чужой вызов. Если у соперника уже есть результат — говорим сколько,
     если минута ещё впереди — что можно начать первым. */
  const renderInvite = () => {
    const { challenge, role } = state;
    const them = role === 'b' ? challenge.a : challenge.b;
    const name = nickOf(them);
    fillAvatar($('#duel-invite-avatar'), them?.n || '');
    const title = $('#duel-invite-title');
    const text = $('#duel-invite-text');
    const meta = $('#duel-invite-meta');
    if (D.hasResult(them)) {
      title.textContent = tr('duel_your_turn_title', { name, r: them.r });
      text.textContent = tr('duel_your_turn_text');
    } else {
      title.textContent = tr('duel_invite_pending_title', { name });
      text.textContent = tr('duel_invite_pending_text');
    }
    meta.textContent = setupLabel(challenge.c);
  };

  // ── Игра ────────────────────────────────────────────────────────────
  const questionEl = $('#duel-question');
  const answerInput = $('#duel-answer');
  const timeEl = $('#duel-time');
  const ringEl = $('#duel-ring');
  const scoreEl = $('#duel-score');
  const card = $('#duel-card');

  /* Ступень лесенки — по номеру примера; переход на следующую отмечаем
     вспышкой значка, чтобы ученик понимал, почему примеры стали труднее. */
  let shownTier = 0;
  const renderTier = () => {
    const el = $('#duel-tier');
    if (!el) return;
    const tier = D.tierAt(state.index);
    el.textContent = tr(`trainer_diff_${tier.diff}`);
    el.dataset.step = String(tier.step);
    if (tier.step !== shownTier) {
      el.classList.remove('is-up');
      void el.offsetWidth;
      if (shownTier) el.classList.add('is-up');
      shownTier = tier.step;
    }
  };

  const renderQuestion = () => {
    const q = state.questions[state.index];
    if (!q || !questionEl) return;
    questionEl.innerHTML = '';
    try {
      window.katex.render(q.latex, questionEl, { throwOnError: false, displayMode: true });
    } catch {
      questionEl.textContent = q.latex;
    }
    if (answerInput) answerInput.value = '';
    renderTier();
  };

  const flash = ok => {
    if (!card) return;
    card.classList.remove('is-ok', 'is-bad');
    void card.offsetWidth;
    card.classList.add(ok ? 'is-ok' : 'is-bad');
  };

  const renderStreak = () => {
    const el = $('#duel-streak');
    if (!el) return;
    el.hidden = state.streak < 3;
    if (!el.hidden) el.textContent = tr('duel_streak', { n: state.streak });
  };

  /* Полоса «ты против соперника»: длина каждой половины — доля своего
     счёта от большего из двух (не меньше десяти, чтобы первые ответы не
     заполняли полосу целиком). */
  const renderStrip = () => {
    const opponent = state.opponent;
    const mine = state.bits.filter(Boolean).length;
    const theirs = !opponent ? 0
      : opponent.kind === 'ghost' && state.startedAt ? D.ghostProgressAt(opponent.bits, opponent.times, Date.now() - state.startedAt)
      : opponent.r;
    const max = Math.max(mine, theirs, 10);
    if (scoreEl) scoreEl.textContent = String(mine);
    const strip = $('#duel-strip');
    if (strip) strip.classList.toggle('is-solo', !opponent);
    const barMe = $('#duel-bar-me');
    const barOpp = $('#duel-bar-opp');
    if (barMe) barMe.style.width = `${(mine / max) * 100}%`;
    if (barOpp) barOpp.style.width = opponent ? `${(theirs / max) * 100}%` : '0%';
    const oppScore = $('#duel-opp-score');
    if (oppScore) oppScore.textContent = String(theirs);
    const oppName = $('#duel-opp-name');
    if (oppName) oppName.textContent = opponent ? opponent.nick : '';
  };

  // Один ответ на пример: верно или нет — дальше. Так счёт у обоих честный.
  const submit = () => {
    if (!state.endsAt || Date.now() >= state.endsAt) return;
    const value = (answerInput?.value || '').trim();
    if (!value) return;
    const q = state.questions[state.index];
    const ok = Boolean(T.checkAnswer(q, value)?.isCorrect);
    state.bits.push(ok);
    state.answers.push(value.slice(0, 16));
    state.times.push(Math.min(60999, Math.max(0, Date.now() - state.startedAt)));
    state.streak = ok ? state.streak + 1 : 0;
    renderStrip();
    renderStreak();
    const score = state.bits.filter(Boolean).length;
    if (state.opponent?.kind === 'live' && match) {
      match.channel.send({ type: 'broadcast', event: 'progress', payload: { r: score, q: state.bits.length } }).catch(() => {});
    }
    // Больше 80 ответов запись не принимает — такой темп уже не устный счёт.
    if (state.bits.length >= D.MAX_RUN_ANSWERS) { finish(); return; }
    flash(ok);
    sound(ok ? 'correct' : 'wrong');
    state.index++;
    if (state.index >= state.questions.length) { finish(); return; }
    renderQuestion();
  };

  $('#duel-form')?.addEventListener('submit', event => { event.preventDefault(); submit(); });

  // Свои кнопки нужны телефону: на цифровой клавиатуре нет «/» и «−».
  $('#duel-keypad')?.addEventListener('click', event => {
    const key = event.target.closest?.('[data-key]')?.dataset.key;
    if (!key || !answerInput) return;
    if (key === 'ok') submit();
    else if (key === 'back') answerInput.value = answerInput.value.slice(0, -1);
    else answerInput.value += key;
  });

  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  if (coarse && answerInput) answerInput.setAttribute('inputmode', 'none');

  const tick = () => {
    const leftMs = Math.max(0, state.endsAt - Date.now());
    const left = Math.ceil(leftMs / 1000);
    if (timeEl) timeEl.textContent = String(left);
    if (ringEl) ringEl.style.strokeDashoffset = String(RING_LENGTH * (1 - leftMs / (D.DURATION_SEC * 1000)));
    const ring = $('.duel-ring');
    if (ring) ring.classList.toggle('is-low', left <= 10);
    if (state.opponent?.kind === 'ghost') renderStrip();
    if (left <= 0) finish();
  };

  const play = () => {
    state.questions = D.ladderQuestions(T, state.cat, state.seed, BATCH);
    state.index = 0;
    state.bits = [];
    state.answers = [];
    state.times = [];
    state.streak = 0;
    state.run = null;
    shownTier = 0;
    fillAvatar($('#duel-strip-me'), state.nick);
    fillAvatar($('#duel-strip-opp'), state.opponent?.nick || '');
    if (ringEl) { ringEl.style.strokeDasharray = String(RING_LENGTH); ringEl.style.strokeDashoffset = '0'; }
    renderQuestion();
    renderStreak();
    show('#duel-play');
    state.startedAt = Date.now();
    state.endsAt = state.startedAt + D.DURATION_SEC * 1000;
    renderStrip();
    state.run = beginRun();
    tick();
    clearInterval(state.timer);
    state.timer = setInterval(tick, 200);
    if (!coarse) answerInput?.focus();
  };

  const countdown = () => {
    show('#duel-countdown');
    const vs = $('#duel-countdown-vs');
    if (vs) vs.textContent = state.opponent ? tr('duel_ready_vs', { name: state.opponent.nick }) : setupLabel(state.cat);
    const num = $('#duel-countdown-num');
    let n = 3;
    if (num) { num.textContent = String(n); num.classList.remove('is-tick'); void num.offsetWidth; num.classList.add('is-tick'); }
    const step = setInterval(() => {
      n--;
      if (n <= 0) { clearInterval(step); play(); return; }
      if (num) { num.textContent = String(n); num.classList.remove('is-tick'); void num.offsetWidth; num.classList.add('is-tick'); }
    }, 800);
  };

  // ── Вызов друга: ссылка сразу ───────────────────────────────────────
  const linkFor = challenge => `${location.origin}/duel#${D.encodeChallenge(challenge)}`;

  /* Ссылка появляется до минуты: в ней зерно, категория, сложность и ник.
     Пока свой результат не сыгран, в истории лежит вызов без счёта — по
     нему ответная ссылка друга узнаётся как своя. */
  const createFriendLink = () => {
    notice('');
    stopSearch();
    leaveMatch();
    state.mode = 'link';
    state.role = 'a';
    state.opponent = null;
    state.seed = D.newSeed();
    const nick = takeNick();
    state.challenge = { g: RUN_GEN, s: state.seed, c: state.cat, a: { n: nick, pending: true }, b: null };
    remember({ at: Date.now(), seed: state.seed, cat: state.cat, diff: state.diff, role: 'a', me: null, them: null });
    window.history.replaceState(null, '', '/duel');
    showLinkScreen();
  };

  const showLinkScreen = () => {
    const { challenge } = state;
    if (!challenge) { openSetup(); return; }
    $('#duel-link-summary').innerHTML = `${escapeHtml(catIcon(challenge.c))} ${escapeHtml(setupLabel(challenge.c))}`;
    const link = linkFor(challenge);
    $('#duel-link-url').value = link;
    $('#duel-link-copied').hidden = true;
    const native = $('#duel-link-share');
    if (native) {
      native.hidden = !navigator.share;
      native.onclick = () => navigator.share({ title: tr('duel_title'), text: tr('duel_share_invite'), url: link }).catch(() => {});
    }
    show('#duel-link');
  };

  $('#duel-friend')?.addEventListener('click', createFriendLink);
  $('#duel-to-link')?.addEventListener('click', () => { stopSearch(); createFriendLink(); });
  $('#duel-link-play')?.addEventListener('click', () => {
    if (!state.challenge) { openSetup(); return; }
    state.mode = 'link';
    state.role = 'a';
    state.opponent = null;
    state.seed = state.challenge.s;
    state.cat = state.challenge.c;
    state.nick = state.challenge.a.n || takeNick();
    countdown();
  });
  $('#duel-link-back')?.addEventListener('click', () => {
    state.challenge = null;
    state.role = 'a';
    openSetup();
  });

  /* Скопировать ссылку: кнопка на пару секунд превращается в «Скопировано»,
     а строка под ней говорит, что делать дальше. */
  const bindCopy = (buttonId, inputId, statusId) => {
    const button = $(buttonId);
    if (!button) return;
    const label = button.textContent;
    button.addEventListener('click', async () => {
      const input = $(inputId);
      if (!input) return;
      try {
        await navigator.clipboard.writeText(input.value);
      } catch {
        input.select();
        document.execCommand?.('copy');
      }
      const status = $(statusId);
      if (status) status.hidden = false;
      button.textContent = tr('duel_copied_short');
      button.classList.add('is-copied');
      setTimeout(() => { button.textContent = tr('duel_copy'); button.classList.remove('is-copied'); }, 1800);
    });
    void label;
  };
  bindCopy('#duel-link-copy', '#duel-link-url', '#duel-link-copied');
  bindCopy('#duel-copy', '#duel-link', '#duel-copied');

  // ── Принять вызов ───────────────────────────────────────────────────
  $('#duel-accept')?.addEventListener('click', () => {
    if (!state.challenge) return;
    notice('');
    state.mode = 'link';
    state.opponent = null;
    state.seed = state.challenge.s;
    state.cat = state.challenge.c;
    takeNick();
    countdown();
  });
  $('#duel-decline')?.addEventListener('click', () => {
    state.role = 'a';
    state.challenge = null;
    window.history.replaceState(null, '', '/duel');
    openSetup();
  });

  // ── Итог ────────────────────────────────────────────────────────────
  const statsHtml = (player, label, mine) => {
    const errors = player.q - player.r;
    const accuracy = player.q ? Math.round((player.r / player.q) * 100) : 0;
    return `<div class="duel-side${mine ? ' is-me' : ''}">
      ${avatarHtml(player.n || '')}
      <span class="duel-side-name">${escapeHtml(label)}</span>
      <strong class="duel-side-score">${player.r}</strong>
      <span class="duel-side-meta">${escapeHtml(tr('duel_correct'))} · ${escapeHtml(tr('duel_errors'))}: ${errors} · ${escapeHtml(tr('duel_accuracy'))} ${accuracy}%</span>
    </div>`;
  };

  const renderOutcome = (kind, title, sub) => {
    const box = $('#duel-outcome');
    if (!box) return;
    box.className = `duel-outcome is-${kind}`;
    box.innerHTML = `<h2 class="duel-result-title">${escapeHtml(title)}</h2><p class="duel-result-sub">${escapeHtml(sub)}</p>`;
  };

  const renderVersus = ({ cat, diff, seed, me, them, note = '' }) => {
    const result = D.compareResults(me, them);
    const kind = result.winner === 'tie' ? 'tie' : result.winner === 'a' ? 'win' : 'lose';
    const title = kind === 'tie' ? tr('duel_tie') : kind === 'win' ? tr('duel_win_me') : tr('duel_win_them', { name: nickOf(them) });
    renderOutcome(kind, title, resultSub(cat, me.q));
    const questions = D.ladderQuestions(T, cat, seed, BATCH);
    const both = result.bothWrong.slice(0, 6).map(index => questions[index]).filter(Boolean);
    const body = $('#duel-result-body');
    if (!body) return;
    body.innerHTML = `
      <div class="duel-versus">
        ${statsHtml(me, `${tr('duel_you')} · ${me.n || ''}`, true)}
        <span class="duel-versus-mark" aria-hidden="true">⚔️</span>
        ${statsHtml(them, nickOf(them), false)}
      </div>
      ${both.length ? `<div class="duel-both-wrong"><p>${escapeHtml(tr('duel_both_wrong'))}</p><ul>${both.map(q => `<li data-latex="${escapeHtml(q.latex)}" data-answer="${escapeHtml(q.answer)}"></li>`).join('')}</ul></div>` : ''}
      ${note ? `<p class="duel-ghost-note">${escapeHtml(note)}</p>` : ''}`;
    body.querySelectorAll('[data-latex]').forEach(li => {
      try {
        window.katex.render(`${li.dataset.latex} = ${li.dataset.answer.replace('.', '{,}')}`, li, { throwOnError: false });
      } catch {
        li.textContent = `${li.dataset.latex} = ${li.dataset.answer}`;
      }
    });
    if (kind === 'win') sound('correct');
  };

  const renderSolo = (me, title, cat, kind = 'solo') => {
    renderOutcome(kind, title, resultSub(cat, me.q));
    const body = $('#duel-result-body');
    if (body) body.innerHTML = `<div class="duel-versus duel-versus-solo">${statsHtml(me, `${tr('duel_you')} · ${me.n || ''}`, true)}</div>`;
  };

  const setShare = ({ title, text, link, shareText }) => {
    const box = $('#duel-share');
    if (!box) return;
    box.hidden = false;
    $('#duel-share-title').textContent = title;
    $('#duel-share-text').textContent = text;
    $('#duel-copied').hidden = true;
    const input = $('#duel-link');
    if (input) input.value = link;
    const native = $('#duel-native-share');
    if (native) {
      native.hidden = !navigator.share;
      native.onclick = () => navigator.share({ title: tr('duel_title'), text: shareText, url: link }).catch(() => {});
    }
  };

  function finish() {
    if (!state.endsAt) return;
    state.endsAt = 0;
    clearInterval(state.timer);
    const bits = state.bits;
    const me = { n: state.nick, r: bits.filter(Boolean).length, q: bits.length, m: D.packMask(bits) };
    state.me = me;
    const base = { g: RUN_GEN, s: state.seed, c: state.cat };
    $('#duel-share').hidden = true;
    $('#duel-rematch').hidden = true;
    $('#duel-again').hidden = state.mode !== 'random';
    const rank = $('#duel-rank');
    if (rank) rank.hidden = true;
    if (state.mode === 'random') { finishRandom(me); return; }
    if (state.mode === 'solo') { finishSolo(me); return; }
    reportRun();

    const challenge = state.challenge;
    if (state.role === 'b' && challenge) {
      const full = { ...base, a: challenge.a, b: me };
      if (D.hasResult(challenge.a)) {
        // Вызвавший уже сыграл: сравнение здесь, а ссылка с обоими результатами — ему.
        renderVersus({ cat: state.cat, diff: state.diff, seed: state.seed, me, them: challenge.a });
        setShare({
          title: tr('duel_reply_title', { name: nickOf(challenge.a) }),
          text: tr('duel_reply_text', { name: nickOf(challenge.a) }),
          link: linkFor(full),
          shareText: tr('duel_share_text', { r: me.r })
        });
        remember({ at: Date.now(), seed: state.seed, cat: state.cat, diff: state.diff, role: 'b', me, them: { n: challenge.a.n, r: challenge.a.r, q: challenge.a.q, m: challenge.a.m } });
      } else {
        // Вызвавший свою минуту ещё не сыграл: свой результат — в ответную ссылку.
        renderSolo(me, tr('duel_pending_title', { name: nickOf(challenge.a) }), state.cat);
        setShare({
          title: tr('duel_reply_title', { name: nickOf(challenge.a) }),
          text: tr('duel_pending_text', { name: nickOf(challenge.a) }),
          link: linkFor(full),
          shareText: tr('duel_share_text', { r: me.r })
        });
        remember({ at: Date.now(), seed: state.seed, cat: state.cat, diff: state.diff, role: 'b', me, them: null, name: challenge.a.n });
      }
      $('#duel-rematch').hidden = false;
    } else if (challenge && D.hasResult(challenge.b)) {
      // Друг сыграл первым по ссылке без результата: сравнение сразу.
      const full = { ...base, a: me, b: challenge.b };
      renderVersus({ cat: state.cat, diff: state.diff, seed: state.seed, me, them: challenge.b });
      setShare({
        title: tr('duel_send_result_title'),
        text: tr('duel_send_result_text', { name: nickOf(challenge.b) }),
        link: linkFor(full),
        shareText: tr('duel_share_text', { r: me.r })
      });
      $('#duel-rematch').hidden = false;
      remember({ at: Date.now(), seed: state.seed, cat: state.cat, diff: state.diff, role: 'a', me, them: { n: challenge.b.n, r: challenge.b.r, q: challenge.b.q, m: challenge.b.m } });
    } else {
      // Своя минута сыграна, друг ещё нет: ссылка теперь с результатом.
      const own = { ...base, a: me };
      renderSolo(me, tr('duel_done_title'), state.cat);
      setShare({
        title: tr('duel_send_title'),
        text: `${tr('duel_send_text')} ${tr('duel_sent_already')}`,
        link: linkFor(own),
        shareText: tr('duel_share_text', { r: me.r })
      });
      remember({ at: Date.now(), seed: state.seed, cat: state.cat, diff: state.diff, role: 'a', me, them: null });
    }
    state.challenge = null;
    show('#duel-result');
  }

  // На рекорд: минута в одиночку, попытка идёт в таблицу и становится соперником-записью.
  function finishSolo(me) {
    notice('');
    renderSolo(me, tr('duel_solo_title'), state.cat);
    show('#duel-result');
    const body = $('#duel-result-body');
    reportRun().then(saved => {
      if (saved?.verified && !$('#duel-result').hidden) body.insertAdjacentHTML('beforeend', `<p class="duel-ghost-note">${escapeHtml(tr('duel_solo_saved'))}</p>`);
    });
    remember({ at: Date.now(), seed: state.seed, cat: state.cat, diff: state.diff, role: 'r', me, them: null });
  }

  const playSolo = () => {
    notice('');
    stopSearch();
    leaveMatch();
    state.mode = 'solo';
    state.role = 'a';
    state.challenge = null;
    state.opponent = null;
    state.seed = D.newSeed();
    takeNick();
    window.history.replaceState(null, '', '/duel');
    countdown();
  };
  $('#duel-solo-start')?.addEventListener('click', playSolo);
  $('#duel-solo')?.addEventListener('click', () => { stopSearch(); playSolo(); });

  $('#duel-new')?.addEventListener('click', () => {
    state.role = 'a';
    state.challenge = null;
    state.mode = 'link';
    window.history.replaceState(null, '', '/duel');
    notice('');
    openSetup();
  });

  // Реванш: те же категория и сложность, новые примеры, вызывает уже этот игрок — ссылкой.
  $('#duel-rematch')?.addEventListener('click', () => {
    state.role = 'a';
    state.challenge = null;
    state.opponent = null;
    window.history.replaceState(null, '', '/duel');
    createFriendLink();
  });

  // ── Случайный соперник ──────────────────────────────────────────────
  /* Сначала ищем живого соперника в канале Realtime: присутствие видно
     всем ждущим, пары составляются одинаково на каждом устройстве
     (duel.js: matchRole). Ведущий присылает зерно, второй подтверждает, и
     дальше они играют в своём канале, видя счёт друг друга. Никого за 15
     секунд — берём запись другого игрока из базы (миграция 028). Нет и
     записей — предлагаем сыграть на рекорд или позвать друга ссылкой. */
  const SEARCH_SEC = 15;
  const FINAL_WAIT_MS = 6000;
  let rtClient = null;
  let search = null;
  let match = null;

  // Свой клиент без сохранения входа: дуэль не трогает вход администратора.
  const realtime = () => {
    if (rtClient) return rtClient;
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg?.url || !cfg?.publishableKey || !window.supabase?.createClient) return null;
    rtClient = window.supabase.createClient(cfg.url, cfg.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    return rtClient;
  };

  const randomId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

  // Уровень игрока — лучший счёт в этой категории: по нему подбирается запись.
  const personalBest = () => bestScore() || 10;

  const formatLongDate = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(lang() === 'lv' ? 'lv-LV' : 'ru-RU', { day: 'numeric', month: 'long' });
  };

  function stopSearch() {
    if (!search) return;
    const { lobby, clock } = search;
    search.settled = true;
    search = null;
    clearInterval(clock);
    if (lobby) {
      lobby.untrack().catch(() => {});
      realtime()?.removeChannel(lobby);
    }
  }

  function leaveMatch() {
    if (!match) return;
    realtime()?.removeChannel(match.channel);
    match = null;
  }

  const setSearchView = nobody => {
    $('#duel-search-waiting').hidden = nobody;
    $('#duel-nobody').hidden = !nobody;
    $('#duel-search-time').hidden = nobody;
    $('#duel-search').classList.toggle('is-nobody', nobody);
    const title = $('#duel-search-title');
    const text = $('#duel-search-text');
    title.dataset.i18n = nobody ? 'duel_nobody_title' : 'duel_search_title';
    text.dataset.i18n = nobody ? 'duel_nobody_text' : 'duel_search_text';
    title.textContent = tr(title.dataset.i18n);
    text.textContent = tr(text.dataset.i18n);
  };

  function startLive({ host, guest, seed, partnerNick }) {
    const client = realtime();
    const opponent = { kind: 'live', nick: D.sanitizeNick(partnerNick) || tr('duel_opponent'), r: 0, q: 0, final: null };
    const channel = client.channel(`duel-match-g${RUN_GEN}:${host}:${guest}`, { config: { broadcast: { self: false } } });
    state.opponent = opponent;
    match = { channel };
    channel
      .on('broadcast', { event: 'progress' }, ({ payload }) => {
        if (state.opponent !== opponent) return;
        const { r, q } = payload || {};
        if (!Number.isInteger(r) || !Number.isInteger(q) || r < 0 || r > q || q > D.MAX_RUN_ANSWERS) return;
        opponent.r = r;
        opponent.q = q;
        renderStrip();
      })
      .on('broadcast', { event: 'final' }, ({ payload }) => {
        if (state.opponent !== opponent) return;
        const { r, q, m } = payload || {};
        const bits = D.unpackMask(m, q);
        if (!bits || q > D.MAX_RUN_ANSWERS || bits.filter(Boolean).length !== r) return;
        opponent.final = { r, q, m };
        opponent.r = r;
        opponent.q = q;
        state.waitingFinal?.();
      })
      .subscribe();
    state.seed = seed;
    notice(tr('duel_found_live', { name: opponent.nick }));
    countdown();
  }

  async function fallbackGhost() {
    const client = realtime();
    const exclude = duelHistory().map(item => item.ghostId).filter(Number.isInteger).slice(0, 30);
    let candidates = [];
    if (client) {
      try {
        const { data, error } = await client.rpc('duel_ghost', {
          p_cat: state.cat, p_diff: D.LADDER, p_gen: RUN_GEN, p_target: personalBest(), p_exclude: exclude
        });
        if (!error && Array.isArray(data)) candidates = data;
      } catch {}
    }
    // Пока искали, ученик мог нажать «Отмена».
    if (state.mode !== 'random' || $('#duel-search').hidden) return;
    const valid = candidates.filter(row => Number.isInteger(Number(row.seed)) && D.validateRun(row.answers, row.times));
    if (!valid.length) {
      setSearchView(true);
      return;
    }
    const row = valid[Math.floor(Math.random() * valid.length)];
    const seed = Number(row.seed);
    // Счёт записи считаем сами: из того же зерна — те же примеры.
    const questions = D.ladderQuestions(T, state.cat, seed, BATCH);
    const bits = row.answers.map((answer, i) => Boolean(questions[i] && T.checkAnswer(questions[i], answer)?.isCorrect));
    state.opponent = {
      kind: 'ghost', id: Number(row.id), nick: D.sanitizeNick(row.nick) || tr('duel_opponent'),
      bits, times: row.times.map(Number), at: row.finished_at
    };
    state.seed = seed;
    notice(tr('duel_found_ghost', { name: state.opponent.nick }));
    countdown();
  }

  function findOpponent() {
    notice('');
    stopSearch();
    leaveMatch();
    state.mode = 'random';
    state.role = 'a';
    state.challenge = null;
    state.opponent = null;
    takeNick();
    window.history.replaceState(null, '', '/duel');
    setSearchView(false);
    show('#duel-search');

    const client = realtime();
    if (!client) { fallbackGhost(); return; }
    const myId = randomId();
    const current = { lobby: null, settled: false, invite: null, clock: 0 };
    search = current;
    let left = SEARCH_SEC;
    $('#duel-search-time').textContent = String(left);
    current.clock = setInterval(() => {
      left--;
      const time = $('#duel-search-time');
      if (time) time.textContent = String(Math.max(0, left));
      if (left <= 0 && search === current) {
        stopSearch();
        fallbackGhost();
      }
    }, 1000);

    const lobby = client.channel(`duel-lobby-g${RUN_GEN}:${state.cat}`, {
      config: { presence: { key: myId }, broadcast: { self: false } }
    });
    current.lobby = lobby;
    const waiting = () => Object.entries(lobby.presenceState()).map(([id, metas]) => ({ id, at: Number(metas?.[0]?.at) || 0 }));
    const evaluate = () => {
      if (current.settled || current.invite) return;
      const role = D.matchRole(waiting(), myId);
      if (role?.role !== 'host') return;
      const seed = D.newSeed();
      current.invite = { guest: role.partner, seed };
      lobby.send({ type: 'broadcast', event: 'invite', payload: { host: myId, guest: role.partner, seed, nick: state.nick } }).catch(() => {});
      // Ответа нет — приглашение потерялось или второй уже занят: пересчитываем пары.
      setTimeout(() => {
        if (!current.settled && current.invite?.seed === seed) {
          current.invite = null;
          evaluate();
        }
      }, 3000);
    };
    lobby
      .on('presence', { event: 'sync' }, evaluate)
      .on('broadcast', { event: 'invite' }, async ({ payload }) => {
        const seed = payload?.seed;
        if (current.settled || payload?.guest !== myId || !Number.isInteger(seed) || seed < 0 || seed > 0xFFFFFFFF) return;
        current.settled = true;
        clearInterval(current.clock);
        await lobby.send({ type: 'broadcast', event: 'accept', payload: { host: payload.host, guest: myId, nick: state.nick } }).catch(() => {});
        search = current;
        stopSearch();
        startLive({ host: payload.host, guest: myId, seed, partnerNick: payload.nick });
      })
      .on('broadcast', { event: 'accept' }, ({ payload }) => {
        if (current.settled || payload?.host !== myId || !current.invite || payload?.guest !== current.invite.guest) return;
        const { guest, seed } = current.invite;
        stopSearch();
        startLive({ host: myId, guest, seed, partnerNick: payload.nick });
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') lobby.track({ at: Date.now() }).catch(() => {});
        else if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && search === current) {
          stopSearch();
          fallbackGhost();
        }
      });
  }

  async function finishRandom(me) {
    notice('');
    show('#duel-result');
    const body = $('#duel-result-body');
    const saving = reportRun();
    const opponent = state.opponent;
    if (!opponent) {
      renderSolo(me, tr('duel_done_title'), state.cat);
      // Соперником для других становится только проверенная попытка.
      saving.then(saved => {
        if (saved?.verified && !$('#duel-result').hidden) body.insertAdjacentHTML('beforeend', `<p class="duel-ghost-note">${escapeHtml(tr('duel_solo_saved'))}</p>`);
      });
      remember({ at: Date.now(), seed: state.seed, cat: state.cat, diff: state.diff, role: 'r', me, them: null });
      return;
    }
    let them;
    let note = '';
    if (opponent.kind === 'ghost') {
      them = { n: opponent.nick, ...D.ghostResult(opponent.bits, opponent.times) };
      note = tr('duel_ghost_note', { date: formatLongDate(opponent.at) });
    } else {
      match?.channel.send({ type: 'broadcast', event: 'final', payload: { r: me.r, q: me.q, m: me.m } }).catch(() => {});
      if (!opponent.final) {
        renderOutcome('wait', tr('duel_waiting_final'), setupLabel(state.cat));
        body.innerHTML = '';
        await new Promise(resolve => {
          const timer = setTimeout(resolve, FINAL_WAIT_MS);
          state.waitingFinal = () => { clearTimeout(timer); resolve(); };
        });
        state.waitingFinal = null;
      }
      if (opponent.final) {
        them = { n: opponent.nick, ...opponent.final };
      } else {
        // Ушёл до конца: считаем по последнему счёту, без разбора общих ошибок.
        them = { n: opponent.nick, r: opponent.r, q: opponent.q, m: D.packMask(Array(opponent.q).fill(true)) };
        note = tr('duel_opponent_left');
      }
      leaveMatch();
    }
    renderVersus({ cat: state.cat, diff: state.diff, seed: state.seed, me, them, note });
    remember({
      at: Date.now(), seed: state.seed, cat: state.cat, diff: state.diff, role: 'r',
      ghostId: opponent.kind === 'ghost' ? opponent.id : undefined,
      me, them: { n: them.n, r: them.r, q: them.q, m: them.m }
    });
  }

  $('#duel-random')?.addEventListener('click', findOpponent);
  $('#duel-again')?.addEventListener('click', findOpponent);
  $('#duel-search-cancel')?.addEventListener('click', () => {
    stopSearch();
    state.mode = 'link';
    openSetup();
  });
  window.addEventListener('pagehide', () => {
    stopSearch();
    leaveMatch();
  });

  // ── Запись попытки и таблица лидеров ────────────────────────────────
  /* В базу браузер не пишет. Воркер отмечает начало минуты по своим
     часам, а в конце сам пересчитывает ответы по тем же примерам и
     решает, попадает ли попытка в таблицу (worker/duel-api.js). Пока на
     сервере нет ключей, /api/duel/config отвечает «выключено» — и
     страница играет как раньше, ничего не записывая. */
  const postJson = async (path, body) => {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return response.ok ? response.json() : null;
  };

  const serverConfig = fetch('/api/duel/config')
    .then(response => (response.ok ? response.json() : null))
    .then(data => (data && typeof data.record === 'boolean' && data.gen === RUN_GEN ? data : null))
    .catch(() => null);

  // Случайный номер игрока: в таблице у него одна лучшая строка. О человеке он ничего не говорит.
  const playerId = () => {
    try {
      const stored = localStorage.getItem(PLAYER_KEY);
      if (stored && D.PLAYER_PATTERN.test(stored)) return stored;
      const fresh = D.newPlayerId();
      localStorage.setItem(PLAYER_KEY, fresh);
      return fresh;
    } catch {
      return null;
    }
  };

  const myRuns = () => readJson(RUNS_KEY, []).filter(Number.isInteger);
  const rememberRun = id => writeJson(RUNS_KEY, [id, ...myRuns().filter(item => item !== id)].slice(0, 50));

  // Номер попытки берём у сервера в начале минуты: по нему он проверит время.
  async function beginRun() {
    const config = await serverConfig;
    if (!config?.record) return null;
    try {
      const data = await postJson('/api/duel/start', { cat: state.cat, diff: D.LADDER, gen: RUN_GEN, seed: state.seed });
      return Number.isInteger(data?.run) ? data.run : null;
    } catch {
      return null;
    }
  }

  // Cloudflare Turnstile: скрипт грузим, только когда таблица включена.
  let turnstileScript = null;
  let turnstileWidget = null;
  let turnstileDone = null;
  const loadTurnstile = () => {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    turnstileScript ||= new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')));
      script.onerror = () => { turnstileScript = null; reject(new Error('turnstile')); };
      document.head.append(script);
    });
    return turnstileScript;
  };

  async function humanToken(siteKey) {
    const box = $('#duel-turnstile');
    if (!siteKey || !box) return '';
    try {
      const turnstile = await loadTurnstile();
      return await new Promise(resolve => {
        const timer = setTimeout(() => resolve(''), 30000);
        turnstileDone = token => { clearTimeout(timer); turnstileDone = null; resolve(token || ''); };
        if (turnstileWidget === null) {
          turnstileWidget = turnstile.render(box, {
            sitekey: siteKey,
            execution: 'execute',
            appearance: 'interaction-only',
            language: lang() === 'lv' ? 'lv' : 'ru',
            theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
            callback: token => turnstileDone?.(token),
            'error-callback': () => { turnstileDone?.(''); return true; },
            'expired-callback': () => turnstileDone?.('')
          });
        } else {
          turnstile.reset(turnstileWidget);
        }
        turnstile.execute(turnstileWidget);
      });
    } catch {
      return '';
    }
  }

  // Итог попытки от сервера: { correct, attempted, verified, ranked, place, reason } или null.
  async function saveRun() {
    const config = await serverConfig;
    const run = await state.run;
    if (!config?.record || !run) return null;
    const answers = state.answers.slice();
    const times = state.times.slice();
    const token = config.ranked ? await humanToken(config.turnstile) : '';
    try {
      const result = await postJson('/api/duel/finish', {
        run, nick: state.nick, player: playerId(), answers, times, token
      });
      if (result?.ranked) rememberRun(run);
      return result;
    } catch {
      return null;
    }
  }

  const renderRank = (result, cat, diff) => {
    const box = $('#duel-rank');
    if (!box || !result) return;
    let text = '';
    let action = false;
    if (result.ranked && result.place) {
      text = tr('duel_rank_place', { place: result.place, cat: catName(cat) });
      action = true;
    } else if (result.ranked) {
      text = tr('duel_rank_listed');
      action = true;
    } else if (['ceiling', 'fast', 'steady'].includes(result.reason)) {
      text = tr('duel_rank_pace');
    } else if (result.reason === 'captcha') {
      text = tr('duel_rank_captcha');
    } else if (result.reason === 'clock' || result.reason === 'late') {
      text = tr('duel_rank_clock');
    }
    if (!text) return;
    box.innerHTML = `<p>${escapeHtml(text)}</p>${action ? `<button type="button" class="secondary-button" data-board-open="${escapeHtml(cat)}">${escapeHtml(tr('duel_board_open'))}</button>` : ''}`;
    box.classList.toggle('is-ranked', Boolean(result.ranked));
    box.hidden = false;
  };

  async function reportRun() {
    const { cat, diff } = state;
    const result = await saveRun();
    // Пока ждали сервер, ученик мог уйти с экрана итога.
    if (!$('#duel-result').hidden) renderRank(result, cat, diff);
    // Таблица могла измениться — при следующем показе перечитать.
    if (result?.ranked) board.cache.clear();
    return result;
  }

  const boardRow = (row, mine) => {
    const place = Number(row.place);
    const errors = Math.max(0, Number(row.attempted) - Number(row.correct));
    const nick = D.sanitizeNick(row.nick) || tr('duel_opponent');
    return `<li class="${mine ? 'is-mine' : ''}">
      <span class="duel-board-place">${escapeHtml(place)}</span>
      ${avatarHtml(nick, 'duel-avatar-sm')}
      <span class="duel-board-nick">${escapeHtml(nick)}${mine ? ` <em>${escapeHtml(tr('duel_board_you'))}</em>` : ''}</span>
      <span class="duel-board-score"><strong>${escapeHtml(row.correct)}</strong> <small>${escapeHtml(tr('duel_errors'))}: ${errors}</small></span>
    </li>`;
  };

  // Первые три — на подиуме: второй слева, первый в центре повыше, третий справа.
  const podiumHtml = (rows, mine) => {
    const order = [rows[1], rows[0], rows[2]];
    return order.map((row, i) => {
      const place = [2, 1, 3][i];
      if (!row) return `<div class="duel-podium-step is-${place} is-empty"><span class="duel-podium-place">${place}</span></div>`;
      const nick = D.sanitizeNick(row.nick) || tr('duel_opponent');
      return `<div class="duel-podium-step is-${place}${mine.has(Number(row.id)) ? ' is-mine' : ''}">
        ${avatarHtml(nick)}
        <span class="duel-podium-nick">${escapeHtml(nick)}</span>
        <strong class="duel-podium-score">${escapeHtml(row.correct)}</strong>
        <span class="duel-podium-place">${['🥇', '🥈', '🥉'][place - 1]}</span>
      </div>`;
    }).join('');
  };

  const renderBoardFilters = () => {
    const cats = $('#duel-board-cat');
    if (cats) cats.innerHTML = D.CATEGORIES.map(cat => `<option value="${cat}"${cat === board.cat ? ' selected' : ''}>${escapeHtml(tr(`cat_${cat}`))}</option>`).join('');
  };

  async function renderBoard() {
    const box = $('#duel-board');
    const config = await serverConfig;
    if (!box || !config?.ranked) return;
    box.hidden = false;
    renderBoardFilters();
    box.querySelectorAll('[data-board-period]').forEach(button => {
      const active = button.dataset.boardPeriod === board.period;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('active', active);
    });
    const list = $('#duel-board-list');
    const podium = $('#duel-podium');
    const key = `${board.cat}:${board.period}`;
    let cached = board.cache.get(key);
    if (!cached || Date.now() - cached.at > 30000) {
      list.innerHTML = `<li class="duel-board-empty">${escapeHtml(tr('duel_board_loading'))}</li>`;
      podium.innerHTML = '';
      let rows = null;
      try {
        const { data, error } = await realtime().rpc('duel_leaderboard', { p_cat: board.cat, p_diff: D.LADDER, p_period: board.period });
        if (!error && Array.isArray(data)) rows = data;
      } catch {}
      if (key !== `${board.cat}:${board.period}`) return;
      if (!rows) {
        list.innerHTML = `<li class="duel-board-empty">${escapeHtml(tr('duel_board_error'))}</li>`;
        return;
      }
      cached = { at: Date.now(), rows };
      board.cache.set(key, cached);
    }
    const mine = new Set(myRuns());
    podium.innerHTML = cached.rows.length ? podiumHtml(cached.rows, mine) : '';
    podium.hidden = !cached.rows.length;
    list.innerHTML = cached.rows.length
      ? cached.rows.slice(3).map(row => boardRow(row, mine.has(Number(row.id)))).join('')
      : `<li class="duel-board-empty">${escapeHtml(tr('duel_board_empty'))}</li>`;
  }

  $('#duel-board-cat')?.addEventListener('change', event => { board.cat = event.target.value; renderBoard(); });
  document.addEventListener('click', event => {
    const period = event.target.closest?.('[data-board-period]');
    const open = event.target.closest?.('[data-board-open]');
    if (period) { board.period = period.dataset.boardPeriod; renderBoard(); return; }
    if (!open) return;
    board.cat = open.dataset.boardOpen;
    board.period = 'week';
    board.cache.clear();
    state.role = 'a';
    state.challenge = null;
    state.mode = 'link';
    window.history.replaceState(null, '', '/duel');
    notice('');
    openSetup();
    $('#duel-board')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // ── Старт страницы ──────────────────────────────────────────────────
  /* Ссылка на дуэль. Кто её открыл, решает история этого браузера: свой
     вызов узнаётся по зерну. Возможные состояния:
       • оба результата есть — сравнение (свой — по истории, иначе как b);
       • ответ друга есть, своя минута ещё впереди — вызов «твоя очередь»;
       • только вызов — свой: ещё раз экран ссылки или «это твоя ссылка»;
                       чужой: принять вызов. */
  const openChallenge = challenge => {
    const own = ownEntry(challenge.s);
    state.cat = challenge.c;
    if (D.hasResult(challenge.b)) {
      if (own?.me && own.me.m !== undefined) {
        state.challenge = challenge;
        renderVersus({ cat: challenge.c, diff: challenge.d, seed: challenge.s, me: { n: challenge.a.n || own.me.n || state.nick, ...own.me }, them: challenge.b });
        $('#duel-share').hidden = true;
        $('#duel-rematch').hidden = false;
        $('#duel-again').hidden = true;
        remember({ ...own, them: { n: challenge.b.n, r: challenge.b.r, q: challenge.b.q, m: challenge.b.m } });
        show('#duel-result');
        return;
      }
      if (own || !D.hasResult(challenge.a)) {
        // Друг сыграл первым, наша минута впереди: вызов от него.
        state.role = 'a';
        state.challenge = challenge;
        openSetup();
        return;
      }
      // Ссылка с двумя результатами в чужом браузере: показываем как друг.
      state.challenge = challenge;
      renderVersus({ cat: challenge.c, diff: challenge.d, seed: challenge.s, me: challenge.b, them: challenge.a });
      $('#duel-share').hidden = true;
      $('#duel-rematch').hidden = false;
      $('#duel-again').hidden = true;
      show('#duel-result');
      return;
    }
    if (own) {
      if (own.me) {
        // Свою же ссылку с результатом открыли повторно — играть против себя незачем.
        notice(tr('duel_own'));
        renderSolo({ n: challenge.a.n, ...own.me }, tr('duel_done_title'), challenge.c);
        setShare({ title: tr('duel_send_title'), text: tr('duel_send_text'), link: linkFor(challenge), shareText: tr('duel_share_text', { r: own.me.r }) });
        $('#duel-rematch').hidden = true;
        $('#duel-again').hidden = true;
        show('#duel-result');
        return;
      }
      state.role = 'a';
      state.mode = 'link';
      state.challenge = challenge;
      showLinkScreen();
      return;
    }
    state.role = 'b';
    state.challenge = challenge;
    openSetup();
  };

  const start = () => {
    const hash = location.hash.slice(1);
    const play = new URLSearchParams(location.search).get('play');
    // Кнопки на главной и в тренажёре: сразу в нужный режим, в последней выбранной категории.
    if (!hash && play) {
      window.history.replaceState(null, '', '/duel');
      if (play === 'random') { findOpponent(); return; }
      if (play === 'friend') { createFriendLink(); return; }
      if (play === 'solo') { playSolo(); return; }
    }
    if (!hash) { openSetup(); return; }
    const challenge = D.decodeChallenge(hash);
    if (!challenge) { notice(tr('duel_broken')); openSetup(); return; }
    if (challenge.g !== RUN_GEN) { notice(tr('duel_old')); openSetup(); return; }
    openChallenge(challenge);
  };

  // Ссылку на вызов могут открыть, уже находясь на странице дуэли.
  window.addEventListener('hashchange', () => {
    if (!location.hash) return;
    notice('');
    state.role = 'a';
    state.challenge = null;
    start();
  });

  window.addEventListener('languagechange', () => {
    if (!$('#duel-setup')?.hidden) openSetup();
    else if (!$('#duel-link')?.hidden) showLinkScreen();
  });

  start();
})();
