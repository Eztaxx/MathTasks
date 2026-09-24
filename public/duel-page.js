/* Страница дуэли (duel.html): настройка, отсчёт, минута примеров, итог и
   ссылка другу. Правила и кодирование ссылки — в duel.js, примеры — из
   генераторов тренажёра с зерном дуэли. Состояние вызова читается из
   фрагмента адреса и туда же не пишется: ссылку ребёнок получает кнопкой. */
(() => {
  const D = window.MathTasksDuel;
  const T = window.MathTasksTrainer;
  if (!D || !T) return;

  const $ = selector => document.querySelector(selector);
  const tr = (key, params) => (window.MathTasks?.t ? window.MathTasks.t(key, params) : key);
  const lang = () => (window.MathTasks?.getLang ? window.MathTasks.getLang() : 'ru');
  const escapeHtml = str => String(str ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);

  const NICK_KEY = 'math-tasks:duel-nick';
  const HISTORY_KEY = 'math-tasks:duel-history';
  const SETUP_KEY = 'math-tasks:duel-setup';
  const PLAYER_KEY = 'math-tasks:duel-player';
  const RUNS_KEY = 'math-tasks:duel-runs';
  const BATCH = 150; // за минуту решают 15–40 примеров; запас на самых быстрых
  const HISTORY_MAX = 20;

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
    challenge: null,      // чужой вызов из ссылки
    role: 'a',            // 'a' — вызываю сам, 'b' — отвечаю на вызов
    cat: D.CATEGORIES.includes(saved.cat) ? saved.cat : 'multdiv',
    diff: D.DIFFS.includes(saved.diff) ? saved.diff : 'normal',
    seed: 0,
    questions: [],
    index: 0,
    bits: [],
    endsAt: 0,
    timer: null,
    me: null,
    mode: 'link',         // 'link' — вызов по ссылке, 'random' — случайный соперник
    opponent: null,       // { kind: 'live' | 'ghost', nick, r, q, … }
    answers: [],          // что ученик вписал — запись для будущих соперников
    times: [],            // когда: мс от начала минуты
    startedAt: 0,
    run: null,            // обещание номера попытки на сервере (worker/duel-api.js)
    waitingFinal: null
  };

  // Какая таблица лидеров открыта: по умолчанию — выбранные для игры категория и сложность.
  const board = { cat: state.cat, diff: state.diff, period: 'week', cache: new Map() };

  const screens = ['#duel-setup', '#duel-search', '#duel-countdown', '#duel-play', '#duel-result'];
  const show = id => {
    screens.forEach(sel => { const el = $(sel); if (el) el.hidden = sel !== id; });
    if (id !== '#duel-result') { const rank = $('#duel-rank'); if (rank) rank.hidden = true; }
    // Во время игры заголовок не нужен: на телефоне он выталкивал клавиши за край.
    document.querySelector('main.duel')?.classList.toggle('is-playing', id === '#duel-play' || id === '#duel-countdown');
  };

  const notice = text => {
    const el = $('#duel-notice');
    if (!el) return;
    el.textContent = text || '';
    el.hidden = !text;
  };

  const catName = cat => String(tr(`cat_${cat}`)).replace(/^\S+\s/, '');
  const diffName = diff => String(tr(`trainer_diff_${diff}`)).replace(/^\S+\s/, '');
  const nickOf = player => player?.n || tr('duel_friend');

  // ── Ник ─────────────────────────────────────────────────────────────
  const nickInput = $('#duel-nick');
  const storedNick = (() => { try { return D.sanitizeNick(localStorage.getItem(NICK_KEY)); } catch { return ''; } })();
  if (nickInput) nickInput.value = storedNick || D.generateNick(lang());
  $('#duel-nick-new')?.addEventListener('click', () => {
    if (nickInput) nickInput.value = D.generateNick(lang());
  });

  /* Ник проверяем на старте, а не при каждом символе: ребёнку не нужно
     видеть, как его ввод вычищается по буквам. Не подошёл — берём из
     генератора и честно говорим об этом. */
  const takeNick = () => {
    const clean = D.sanitizeNick(nickInput?.value);
    const nick = clean || D.generateNick(lang());
    if (!clean && nickInput) {
      nickInput.value = nick;
      notice(tr('duel_nick_replaced'));
    }
    try { localStorage.setItem(NICK_KEY, nick); } catch {}
    return nick;
  };

  // ── Выбор категории и сложности ─────────────────────────────────────
  const renderChoice = () => {
    const cats = $('#duel-cats');
    const diffs = $('#duel-diffs');
    if (cats) {
      cats.innerHTML = D.CATEGORIES.map(cat => `<button type="button" class="trainer-cat-chip${cat === state.cat ? ' active' : ''}" data-duel-cat="${cat}" aria-pressed="${cat === state.cat}">${escapeHtml(tr(`cat_${cat}`))}</button>`).join('');
    }
    if (diffs) {
      diffs.innerHTML = D.DIFFS.map(diff => `<button type="button" class="trainer-diff-chip${diff === state.diff ? ' active' : ''}" data-duel-diff="${diff}" aria-pressed="${diff === state.diff}">${escapeHtml(tr(`trainer_diff_${diff}`))}</button>`).join('');
    }
  };
  // Таблица лидеров под выбором показывает ту же категорию, что выбрана для игры.
  const followChoice = () => {
    board.cat = state.cat;
    board.diff = state.diff;
    renderBoard();
  };
  document.addEventListener('click', event => {
    const cat = event.target.closest?.('[data-duel-cat]');
    if (cat) { state.cat = cat.dataset.duelCat; writeJson(SETUP_KEY, { cat: state.cat, diff: state.diff }); renderChoice(); followChoice(); return; }
    const diff = event.target.closest?.('[data-duel-diff]');
    if (diff) { state.diff = diff.dataset.duelDiff; writeJson(SETUP_KEY, { cat: state.cat, diff: state.diff }); renderChoice(); followChoice(); }
  });

  // ── История ─────────────────────────────────────────────────────────
  const duelHistory = () => readJson(HISTORY_KEY, []).filter(item => item && typeof item === 'object');
  const remember = entry => {
    const list = duelHistory().filter(item => !(item.seed === entry.seed && item.role === entry.role));
    writeJson(HISTORY_KEY, [entry, ...list].slice(0, HISTORY_MAX));
  };

  const renderHistory = () => {
    const box = $('#duel-history');
    const list = $('#duel-history-list');
    if (!box || !list) return;
    const items = duelHistory().slice(0, 6);
    box.hidden = !items.length;
    list.innerHTML = items.map(item => {
      const mine = `${item.me?.r ?? 0}`;
      const theirs = item.them ? `${item.them.r}` : '…';
      const outcome = !item.them ? tr('duel_waiting')
        : item.me.r > item.them.r ? '🏆' : item.me.r < item.them.r ? '·' : '🤝';
      return `<li><span class="duel-history-cat">${escapeHtml(catName(item.cat))}</span>
        <span class="duel-history-score">${escapeHtml(mine)} : ${escapeHtml(theirs)}</span>
        <span class="duel-history-who">${escapeHtml(item.them ? item.them.n || tr('duel_friend') : '')}</span>
        <span class="duel-history-outcome">${escapeHtml(outcome)}</span></li>`;
    }).join('');
  };

  // ── Экран настройки ─────────────────────────────────────────────────
  const openSetup = () => {
    const invite = $('#duel-invite');
    const choice = $('#duel-choice');
    const start = $('#duel-start');
    if (state.role === 'b' && state.challenge) {
      const { a, c, d } = state.challenge;
      if (invite) invite.hidden = false;
      const text = $('#duel-invite-text');
      if (text) text.textContent = tr('duel_invite', { name: nickOf(a), cat: catName(c), diff: diffName(d) });
      if (choice) choice.hidden = true;
      if (start) {
        start.dataset.i18n = 'duel_accept';
        start.textContent = tr('duel_accept');
        start.classList.replace('secondary-button', 'primary-button');
      }
      $('#duel-random').hidden = true;
      $('#duel-random-note').hidden = true;
    } else {
      if (invite) invite.hidden = true;
      if (choice) choice.hidden = false;
      if (start) {
        start.dataset.i18n = 'duel_link_friend';
        start.textContent = tr('duel_link_friend');
        start.classList.replace('primary-button', 'secondary-button');
      }
      $('#duel-random').hidden = false;
      $('#duel-random-note').hidden = false;
      renderChoice();
    }
    renderHistory();
    show('#duel-setup');
    renderBoard();
  };

  // ── Игра ────────────────────────────────────────────────────────────
  const questionEl = $('#duel-question');
  const answerInput = $('#duel-answer');
  const timeEl = $('#duel-time');
  const scoreEl = $('#duel-score');
  const card = $('#duel-card');

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
  };

  const flash = ok => {
    if (!card) return;
    card.classList.remove('is-ok', 'is-bad');
    void card.offsetWidth;
    card.classList.add(ok ? 'is-ok' : 'is-bad');
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
    const score = state.bits.filter(Boolean).length;
    if (scoreEl) scoreEl.textContent = String(score);
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
    const left = Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000));
    if (timeEl) timeEl.textContent = String(left);
    if (state.opponent?.kind === 'ghost') renderOpponent();
    if (left <= 0) finish();
  };

  const play = () => {
    state.questions = T.generateBatch(state.cat, BATCH, state.diff, 'basic', { seed: state.seed });
    state.index = 0;
    state.bits = [];
    state.answers = [];
    state.times = [];
    state.run = null;
    if (scoreEl) scoreEl.textContent = '0';
    renderQuestion();
    show('#duel-play');
    state.startedAt = Date.now();
    state.endsAt = state.startedAt + D.DURATION_SEC * 1000;
    renderOpponent();
    state.run = beginRun();
    tick();
    clearInterval(state.timer);
    state.timer = setInterval(tick, 200);
    if (!coarse) answerInput?.focus();
  };

  const countdown = () => {
    show('#duel-countdown');
    const num = $('#duel-countdown-num');
    let n = 3;
    if (num) num.textContent = String(n);
    const step = setInterval(() => {
      n--;
      if (n <= 0) { clearInterval(step); play(); return; }
      if (num) num.textContent = String(n);
    }, 800);
  };

  $('#duel-start')?.addEventListener('click', () => {
    notice('');
    state.mode = 'link';
    state.opponent = null;
    state.nick = takeNick();
    if (state.role === 'b' && state.challenge) {
      state.seed = state.challenge.s;
      state.cat = state.challenge.c;
      state.diff = state.challenge.d;
    } else {
      state.seed = D.newSeed();
    }
    countdown();
  });

  // ── Итог ────────────────────────────────────────────────────────────
  const linkFor = challenge => `${location.origin}/duel#${D.encodeChallenge(challenge)}`;

  const statsHtml = (player, label) => {
    const errors = player.q - player.r;
    const accuracy = player.q ? Math.round((player.r / player.q) * 100) : 0;
    return `<div class="duel-side">
      <span class="duel-side-name">${escapeHtml(label)}</span>
      <strong class="duel-side-score">${player.r}</strong>
      <span class="duel-side-meta">${escapeHtml(tr('duel_correct'))} · ${escapeHtml(tr('duel_errors'))}: ${errors} · ${escapeHtml(tr('duel_accuracy'))} ${accuracy}%</span>
    </div>`;
  };

  /* Сравнение одинаково для обоих: кто бы ни открыл ссылку с двумя
     результатами, «Ты» — тот, чей ник совпадает с сохранённым. */
  const renderComparison = (challenge, meRole) => {
    const me = meRole === 'b' ? challenge.b : challenge.a;
    const them = meRole === 'b' ? challenge.a : challenge.b;
    renderVersus({ cat: challenge.c, diff: challenge.d, seed: challenge.s, me, them });
  };

  const renderVersus = ({ cat, diff, seed, me, them, note = '' }) => {
    const result = D.compareResults(me, them);
    const title = result.winner === 'tie' ? tr('duel_tie') : result.winner === 'a' ? tr('duel_win_me') : tr('duel_win_them', { name: nickOf(them) });
    const questions = T.generateBatch(cat, BATCH, diff, 'basic', { seed });
    const both = result.bothWrong.slice(0, 6).map(index => questions[index]).filter(Boolean);
    const body = $('#duel-result-body');
    if (!body) return;
    body.innerHTML = `
      <h2 class="duel-result-title">${escapeHtml(title)}</h2>
      <p class="duel-result-sub">${escapeHtml(catName(cat))} · ${escapeHtml(diffName(diff))}</p>
      <div class="duel-versus">
        ${statsHtml(me, `${tr('duel_you')} · ${me.n || ''}`)}
        <span class="duel-versus-mark" aria-hidden="true">⚔️</span>
        ${statsHtml(them, nickOf(them))}
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
  };

  const setShare = (title, text, link, shareText) => {
    const box = $('#duel-share');
    if (!box) return;
    box.hidden = false;
    $('#duel-share-title').textContent = title;
    $('#duel-share-text').textContent = text;
    const input = $('#duel-link');
    if (input) input.value = link;
    const native = $('#duel-native-share');
    if (native) {
      native.hidden = !navigator.share;
      native.onclick = () => navigator.share({ title: tr('duel_title'), text: shareText, url: link }).catch(() => {});
    }
  };

  $('#duel-copy')?.addEventListener('click', async () => {
    const input = $('#duel-link');
    if (!input) return;
    try {
      await navigator.clipboard.writeText(input.value);
    } catch {
      input.select();
      document.execCommand?.('copy');
    }
    notice(tr('duel_copied'));
  });

  function finish() {
    if (!state.endsAt) return;
    state.endsAt = 0;
    clearInterval(state.timer);
    const bits = state.bits;
    const me = { n: state.nick, r: bits.filter(Boolean).length, q: bits.length, m: D.packMask(bits) };
    state.me = me;
    const base = { g: T.GENERATOR_VERSION, s: state.seed, c: state.cat, d: state.diff };
    $('#duel-share').hidden = true;
    $('#duel-rematch').hidden = true;
    $('#duel-again').hidden = state.mode !== 'random';
    const rank = $('#duel-rank');
    if (rank) rank.hidden = true;
    if (state.mode === 'random') {
      finishRandom(me);
      return;
    }
    reportRun();

    if (state.role === 'b' && state.challenge) {
      const full = { ...base, a: state.challenge.a, b: me };
      renderComparison(full, 'b');
      setShare(tr('duel_reply_title', { name: nickOf(full.a) }), tr('duel_reply_text', { name: nickOf(full.a) }),
        linkFor(full), tr('duel_share_text', { r: me.r }));
      $('#duel-rematch').hidden = false;
      remember({ at: Date.now(), seed: state.seed, cat: state.cat, diff: state.diff, role: 'b', me: { r: me.r, q: me.q }, them: { n: full.a.n, r: full.a.r, q: full.a.q } });
    } else {
      const challenge = { ...base, a: me };
      const body = $('#duel-result-body');
      if (body) {
        body.innerHTML = `<h2 class="duel-result-title">${escapeHtml(tr('duel_done_title'))}</h2>
          <p class="duel-result-sub">${escapeHtml(catName(state.cat))} · ${escapeHtml(diffName(state.diff))}</p>
          <div class="duel-versus duel-versus-solo">${statsHtml(me, `${tr('duel_you')} · ${me.n}`)}</div>`;
      }
      setShare(tr('duel_send_title'), tr('duel_send_text'), linkFor(challenge), tr('duel_share_text', { r: me.r }));
      remember({ at: Date.now(), seed: state.seed, cat: state.cat, diff: state.diff, role: 'a', me: { r: me.r, q: me.q }, them: null });
    }
    show('#duel-result');
  }

  $('#duel-new')?.addEventListener('click', () => {
    state.role = 'a';
    state.challenge = null;
    window.history.replaceState(null, '', '/duel');
    notice('');
    openSetup();
  });

  // Реванш: те же категория и сложность, новые примеры, вызывает уже этот игрок.
  $('#duel-rematch')?.addEventListener('click', () => {
    state.mode = 'link';
    state.opponent = null;
    const source = state.challenge;
    state.role = 'a';
    state.challenge = null;
    if (source) { state.cat = source.c; state.diff = source.d; }
    window.history.replaceState(null, '', '/duel');
    state.seed = D.newSeed();
    state.nick = takeNick();
    countdown();
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
  const personalBest = () => Math.max(0, ...duelHistory()
    .filter(item => item.cat === state.cat && item.diff === state.diff)
    .map(item => Number(item.me?.r) || 0)) || 10;

  const formatDate = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(lang() === 'lv' ? 'lv-LV' : 'ru-RU', { day: 'numeric', month: 'long' });
  };

  function renderOpponent() {
    const box = $('#duel-opp');
    if (!box) return;
    const opponent = state.opponent;
    box.hidden = !opponent;
    if (!opponent) return;
    $('#duel-opp-name').textContent = opponent.nick;
    const score = opponent.kind === 'ghost' && state.startedAt
      ? D.ghostProgressAt(opponent.bits, opponent.times, Date.now() - state.startedAt)
      : opponent.r;
    $('#duel-opp-score').textContent = String(score);
  }

  const stopSearch = () => {
    if (!search) return;
    const { lobby, clock } = search;
    search.settled = true;
    search = null;
    clearInterval(clock);
    if (lobby) {
      lobby.untrack().catch(() => {});
      realtime()?.removeChannel(lobby);
    }
  };

  const leaveMatch = () => {
    if (!match) return;
    realtime()?.removeChannel(match.channel);
    match = null;
  };

  const setSearchView = nobody => {
    $('#duel-search-waiting').hidden = nobody;
    $('#duel-nobody').hidden = !nobody;
    $('#duel-search-time').hidden = nobody;
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
    const channel = client.channel(`duel-match-g${T.GENERATOR_VERSION}:${host}:${guest}`, { config: { broadcast: { self: false } } });
    state.opponent = opponent;
    match = { channel };
    channel
      .on('broadcast', { event: 'progress' }, ({ payload }) => {
        if (state.opponent !== opponent) return;
        const { r, q } = payload || {};
        if (!Number.isInteger(r) || !Number.isInteger(q) || r < 0 || r > q || q > D.MAX_RUN_ANSWERS) return;
        opponent.r = r;
        opponent.q = q;
        renderOpponent();
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
          p_cat: state.cat, p_diff: state.diff, p_gen: T.GENERATOR_VERSION, p_target: personalBest(), p_exclude: exclude
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
    const questions = T.generateBatch(state.cat, BATCH, state.diff, 'basic', { seed });
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
    state.nick = takeNick();
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

    const lobby = client.channel(`duel-lobby-g${T.GENERATOR_VERSION}:${state.cat}:${state.diff}`, {
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
    .then(data => (data && typeof data.record === 'boolean' && data.gen === T.GENERATOR_VERSION ? data : null))
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
      const data = await postJson('/api/duel/start', { cat: state.cat, diff: state.diff, gen: T.GENERATOR_VERSION, seed: state.seed });
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
      text = tr('duel_rank_place', { place: result.place, cat: catName(cat), diff: diffName(diff) });
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
    box.innerHTML = `<p>${escapeHtml(text)}</p>${action ? `<button type="button" class="secondary-button" data-board-open="${escapeHtml(cat)}:${escapeHtml(diff)}">${escapeHtml(tr('duel_board_open'))}</button>` : ''}`;
    box.classList.toggle('is-ranked', Boolean(result.ranked));
    box.hidden = false;
  };

  async function reportRun() {
    const { cat, diff } = state;
    const result = await saveRun();
    // Пока ждали сервер, ученик мог уйти с экрана итога.
    if (!$('#duel-result').hidden) renderRank(result, cat, diff);
    return result;
  }

  const boardRow = (row, mine) => {
    const place = Number(row.place);
    const errors = Math.max(0, Number(row.attempted) - Number(row.correct));
    return `<li class="${mine ? 'is-mine' : ''}">
      <span class="duel-board-place">${place <= 3 ? ['🥇', '🥈', '🥉'][place - 1] : escapeHtml(place)}</span>
      <span class="duel-board-nick">${escapeHtml(D.sanitizeNick(row.nick) || tr('duel_opponent'))}${mine ? ` <em>${escapeHtml(tr('duel_board_you'))}</em>` : ''}</span>
      <span class="duel-board-score"><strong>${escapeHtml(row.correct)}</strong> <small>${escapeHtml(tr('duel_errors'))}: ${errors}</small></span>
    </li>`;
  };

  async function renderBoard() {
    const box = $('#duel-board');
    const config = await serverConfig;
    if (!box || !config?.ranked) return;
    box.hidden = state.role === 'b' && Boolean(state.challenge);
    const chips = (items, current, attr, label) => items.map(item => `<button type="button" class="trainer-cat-chip${item === current ? ' active' : ''}" data-${attr}="${item}" aria-pressed="${item === current}">${escapeHtml(label(item))}</button>`).join('');
    $('#duel-board-cats').innerHTML = chips(D.CATEGORIES, board.cat, 'board-cat', catName);
    $('#duel-board-diffs').innerHTML = chips(D.DIFFS, board.diff, 'board-diff', diffName);
    box.querySelectorAll('[data-board-period]').forEach(button => {
      const active = button.dataset.boardPeriod === board.period;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('active', active);
    });
    const list = $('#duel-board-list');
    const key = `${board.cat}:${board.diff}:${board.period}`;
    let cached = board.cache.get(key);
    if (!cached || Date.now() - cached.at > 30000) {
      list.innerHTML = `<li class="duel-board-empty">${escapeHtml(tr('duel_board_loading'))}</li>`;
      let rows = null;
      try {
        const { data, error } = await realtime().rpc('duel_leaderboard', { p_cat: board.cat, p_diff: board.diff, p_period: board.period });
        if (!error && Array.isArray(data)) rows = data;
      } catch {}
      if (key !== `${board.cat}:${board.diff}:${board.period}`) return;
      if (!rows) {
        list.innerHTML = `<li class="duel-board-empty">${escapeHtml(tr('duel_board_error'))}</li>`;
        return;
      }
      cached = { at: Date.now(), rows };
      board.cache.set(key, cached);
    }
    const mine = new Set(myRuns());
    list.innerHTML = cached.rows.length
      ? cached.rows.map(row => boardRow(row, mine.has(Number(row.id)))).join('')
      : `<li class="duel-board-empty">${escapeHtml(tr('duel_board_empty'))}</li>`;
  }

  document.addEventListener('click', event => {
    const cat = event.target.closest?.('[data-board-cat]');
    const diff = event.target.closest?.('[data-board-diff]');
    const period = event.target.closest?.('[data-board-period]');
    const open = event.target.closest?.('[data-board-open]');
    if (cat) board.cat = cat.dataset.boardCat;
    else if (diff) board.diff = diff.dataset.boardDiff;
    else if (period) board.period = period.dataset.boardPeriod;
    else if (open) {
      [board.cat, board.diff] = open.dataset.boardOpen.split(':');
      board.period = 'week';
      board.cache.clear();
      state.role = 'a';
      state.challenge = null;
      state.mode = 'link';
      window.history.replaceState(null, '', '/duel');
      notice('');
      openSetup();
      $('#duel-board')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    } else return;
    renderBoard();
  });

  async function finishRandom(me) {
    notice('');
    show('#duel-result');
    const body = $('#duel-result-body');
    const saving = reportRun();
    const opponent = state.opponent;
    if (!opponent) {
      body.innerHTML = `<h2 class="duel-result-title">${escapeHtml(tr('duel_done_title'))}</h2>
        <p class="duel-result-sub">${escapeHtml(catName(state.cat))} · ${escapeHtml(diffName(state.diff))}</p>
        <div class="duel-versus duel-versus-solo">${statsHtml(me, `${tr('duel_you')} · ${me.n}`)}</div>`;
      // Соперником для других становится только проверенная попытка.
      saving.then(saved => {
        if (saved?.verified && !$('#duel-result').hidden) body.insertAdjacentHTML('beforeend', `<p class="duel-ghost-note">${escapeHtml(tr('duel_solo_saved'))}</p>`);
      });
      remember({ at: Date.now(), seed: state.seed, cat: state.cat, diff: state.diff, role: 'r', me: { r: me.r, q: me.q }, them: null });
      return;
    }
    let them;
    let note = '';
    if (opponent.kind === 'ghost') {
      them = { n: opponent.nick, ...D.ghostResult(opponent.bits, opponent.times) };
      note = tr('duel_ghost_note', { date: formatDate(opponent.at) });
    } else {
      match?.channel.send({ type: 'broadcast', event: 'final', payload: { r: me.r, q: me.q, m: me.m } }).catch(() => {});
      if (!opponent.final) {
        body.innerHTML = `<p class="duel-ghost-note">${escapeHtml(tr('duel_waiting_final'))}</p>`;
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
      me: { r: me.r, q: me.q }, them: { n: them.n, r: them.r, q: them.q }
    });
  }

  $('#duel-random')?.addEventListener('click', findOpponent);
  $('#duel-again')?.addEventListener('click', findOpponent);
  $('#duel-search-cancel')?.addEventListener('click', () => {
    stopSearch();
    state.mode = 'link';
    openSetup();
  });
  $('#duel-solo')?.addEventListener('click', () => {
    state.mode = 'random';
    state.opponent = null;
    state.seed = D.newSeed();
    notice('');
    countdown();
  });
  $('#duel-to-link')?.addEventListener('click', () => {
    state.mode = 'link';
    openSetup();
  });
  window.addEventListener('pagehide', () => {
    stopSearch();
    leaveMatch();
  });

  // ── Старт страницы ──────────────────────────────────────────────────
  const start = () => {
    const hash = location.hash.slice(1);
    // «Сыграть» на главной: сразу ищем соперника в последней выбранной категории.
    if (!hash && new URLSearchParams(location.search).get('play') === 'random') {
      window.history.replaceState(null, '', '/duel');
      findOpponent();
      return;
    }
    if (!hash) { openSetup(); return; }
    const challenge = D.decodeChallenge(hash);
    if (!challenge) { notice(tr('duel_broken')); openSetup(); return; }
    if (challenge.g !== T.GENERATOR_VERSION) { notice(tr('duel_old')); openSetup(); return; }

    const own = duelHistory().find(item => item.seed === challenge.s && item.role === 'a');
    if (challenge.b) {
      // Ссылка с двумя результатами: обычно её открывает вызвавший.
      const meRole = own ? 'a' : 'b';
      state.challenge = challenge;
      renderComparison(challenge, meRole);
      $('#duel-share').hidden = true;
      $('#duel-rematch').hidden = false;
      if (own) remember({ ...own, them: { n: challenge.b.n, r: challenge.b.r, q: challenge.b.q } });
      show('#duel-result');
      return;
    }
    if (own) {
      // Свою же ссылку открыли повторно — играть против себя незачем.
      notice(tr('duel_own'));
      state.cat = challenge.c;
      state.diff = challenge.d;
      $('#duel-result-body').innerHTML = `<div class="duel-versus duel-versus-solo">${statsHtml(challenge.a, `${tr('duel_you')} · ${challenge.a.n || ''}`)}</div>`;
      setShare(tr('duel_send_title'), tr('duel_send_text'), linkFor(challenge), tr('duel_share_text', { r: challenge.a.r }));
      show('#duel-result');
      return;
    }
    state.role = 'b';
    state.challenge = challenge;
    openSetup();
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
  });

  start();
})();
