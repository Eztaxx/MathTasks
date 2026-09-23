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
    me: null
  };

  const screens = ['#duel-setup', '#duel-countdown', '#duel-play', '#duel-result'];
  const show = id => {
    screens.forEach(sel => { const el = $(sel); if (el) el.hidden = sel !== id; });
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
  document.addEventListener('click', event => {
    const cat = event.target.closest?.('[data-duel-cat]');
    if (cat) { state.cat = cat.dataset.duelCat; writeJson(SETUP_KEY, { cat: state.cat, diff: state.diff }); renderChoice(); return; }
    const diff = event.target.closest?.('[data-duel-diff]');
    if (diff) { state.diff = diff.dataset.duelDiff; writeJson(SETUP_KEY, { cat: state.cat, diff: state.diff }); renderChoice(); }
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
      if (start) { start.dataset.i18n = 'duel_accept'; start.textContent = tr('duel_accept'); }
    } else {
      if (invite) invite.hidden = true;
      if (choice) choice.hidden = false;
      if (start) { start.dataset.i18n = 'duel_start'; start.textContent = tr('duel_start'); }
      renderChoice();
    }
    renderHistory();
    show('#duel-setup');
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
    if (scoreEl) scoreEl.textContent = String(state.bits.filter(Boolean).length);
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
    if (left <= 0) finish();
  };

  const play = () => {
    state.questions = T.generateBatch(state.cat, BATCH, state.diff, 'basic', { seed: state.seed });
    state.index = 0;
    state.bits = [];
    if (scoreEl) scoreEl.textContent = '0';
    renderQuestion();
    show('#duel-play');
    state.endsAt = Date.now() + D.DURATION_SEC * 1000;
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
    const { a, b } = challenge;
    const result = D.compareResults(a, b);
    const me = meRole === 'b' ? b : a;
    const them = meRole === 'b' ? a : b;
    const myWin = result.winner === meRole;
    const title = result.winner === 'tie' ? tr('duel_tie') : myWin ? tr('duel_win_me') : tr('duel_win_them', { name: nickOf(them) });
    const questions = T.generateBatch(challenge.c, BATCH, challenge.d, 'basic', { seed: challenge.s });
    const both = result.bothWrong.slice(0, 6).map(index => questions[index]).filter(Boolean);
    const body = $('#duel-result-body');
    if (!body) return;
    body.innerHTML = `
      <h2 class="duel-result-title">${escapeHtml(title)}</h2>
      <p class="duel-result-sub">${escapeHtml(catName(challenge.c))} · ${escapeHtml(diffName(challenge.d))}</p>
      <div class="duel-versus">
        ${statsHtml(me, `${tr('duel_you')} · ${me.n || ''}`)}
        <span class="duel-versus-mark" aria-hidden="true">⚔️</span>
        ${statsHtml(them, nickOf(them))}
      </div>
      ${both.length ? `<div class="duel-both-wrong"><p>${escapeHtml(tr('duel_both_wrong'))}</p><ul>${both.map(q => `<li data-latex="${escapeHtml(q.latex)}" data-answer="${escapeHtml(q.answer)}"></li>`).join('')}</ul></div>` : ''}`;
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
    const source = state.challenge;
    state.role = 'a';
    state.challenge = null;
    if (source) { state.cat = source.c; state.diff = source.d; }
    window.history.replaceState(null, '', '/duel');
    state.seed = D.newSeed();
    state.nick = takeNick();
    countdown();
  });

  // ── Старт страницы ──────────────────────────────────────────────────
  const start = () => {
    const hash = location.hash.slice(1);
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
