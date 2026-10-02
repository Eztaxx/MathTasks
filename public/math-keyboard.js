/* Экранная математическая клавиатура.

   Системная клавиатура телефона для ответа неудобна: нет √, ², π, ≤, а цифры
   и буквы — на разных страницах. Поэтому на сенсорном экране поле ответа
   получает inputmode="none", и снизу открывается эта панель: цифры, x, дробь,
   степени, корень, скобки, знаки неравенств. «ABC» возвращает системную
   клавиатуру — до ухода из поля, для ответов словами.

   У правого края поля — кнопка с клавиатурой: открывает и закрывает панель.
   На компьютере панель без неё не открывается, и выбор запоминается.

   Модуль не знает, как устроены страницы: он слушает фокус на всём документе
   и печатает в поле, которое сейчас в фокусе. Здесь же живёт insertIntoInput —
   ею пользуются и строки «Вставка» в app.js, а тренажёр client.js не
   подключает, поэтому вставка переехала сюда. */
(() => {
  const MathTasks = window.MathTasks = window.MathTasks || {};

  /* Вставка с учётом курсора: скобки и модуль ставятся парой с курсором
     внутри, «²» и «³» в начале или после знака становятся «x²» и «x³». */
  function insertIntoInput(input, text) {
    if (!input) return;
    input.focus();
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const val = input.value;

    let inserted = text;
    let newCursor = start + inserted.length;

    if (text === '²' || text === '³') {
      if (start === 0 || /[\+\-\*\/\(\s,;]$/.test(val.slice(0, start))) {
        inserted = `x${text}`;
        newCursor = start + 2;
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
    } else if (/^(sin|cos|tan|tg|ctg|ln|lg|exp|sqrt)\($/.test(text)) {
      inserted = text + ')';
      newCursor = start + text.length;
    }

    input.value = val.slice(0, start) + inserted + val.slice(end);
    input.setSelectionRange(newCursor, newCursor);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  MathTasks.insertIntoInput = insertIntoInput;

  /* Поля ответов: самопроверка в карточке, контрольная, экспресс-режим,
     лист и карточка тренажёра, а также формула графопостроителя — и в
     диалоге на главной, и на отдельной странице. */
  const FIELDS = '.self-check-input, .cw-answer-input, .compact-drill-input, #trainer-input, #plotter-expr, #plot-expr';
  /* Кнопка в поле — там, где поле одно и широкое. В экспресс-режиме полей
     десятки, они узкие, а справа в них уже стоит отметка ✓/✕. */
  const TOGGLE_FIELDS = '.self-check-input, .cw-answer-input, #trainer-input, #plotter-expr, #plot-expr';
  const PREF_KEY = 'math-tasks:math-kb';
  const touchQuery = window.matchMedia?.('(hover: none) and (pointer: coarse)');
  const isTouch = () => Boolean(touchQuery?.matches);

  const tr = (key, fallback) => {
    const text = MathTasks.t?.(key);
    return text && text !== key ? text : fallback;
  };
  const esc = text => String(text).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);

  function readPref() {
    try { return localStorage.getItem(PREF_KEY); } catch { return null; }
  }
  function savePref(value) {
    try { localStorage.setItem(PREF_KEY, value); } catch {}
  }
  // На сенсорном экране панель открывается всегда, на компьютере — по выбору.
  const wanted = () => isTouch() || readPref() === 'on';

  /* Минус вставляем дефисом — его понимает проверка ответа; «−» только
     на кнопке. Запятая — десятичная, точка с запятой разделяет корни. */
  const key = (label, insert = label, kind = '') => ({ label, insert, kind });
  const digit = d => key(d, d, 'num');
  const fn = name => key(name, `${name}(`, 'fn');
  const LAYERS = {
    main: [
      key('x'), key('x²', '²'), digit('7'), digit('8'), digit('9'), key('/'),
      key('('), key(')'), digit('4'), digit('5'), digit('6'), key('·'),
      key('√', '√('), key('xⁿ', '^'), digit('1'), digit('2'), digit('3'), key('−', '-'),
      key('π'), key(';'), digit('0'), key(',', ',', 'num'), key('='), key('+')
    ],
    more: [
      key('±'), key('|x|', '|'), key('≤'), key('≥'), key('<'), key('>'),
      key('∞'), key('∪'), key('['), key(']'), key('°'), key('≠'),
      fn('sin'), fn('cos'), fn('tg'), fn('ln'), key('x³', '³'), key('e'),
      key('y'), key('a'), key('b'), key('n'), key('k'), key('%')
    ]
  };

  /* Своя раскладка для графопостроителя: там набирают функцию, а не ответ.
     Знаки сравнения, ∞, ∪, буквы y, a, b, n, k и «=» график не понимает —
     вместо них цифры с «e» и слой функций, включая ctg и lg. */
  const PLOT_FIELDS = '#plotter-expr, #plot-expr';
  const PLOT_LAYERS = {
    main: [
      key('x'), key('x²', '²'), digit('7'), digit('8'), digit('9'), key('/'),
      key('('), key(')'), digit('4'), digit('5'), digit('6'), key('·'),
      key('√', '√('), key('xⁿ', '^'), digit('1'), digit('2'), digit('3'), key('−', '-'),
      key('π'), key('e'), digit('0'), key(',', ',', 'num'), key(';'), key('+')
    ],
    more: [
      fn('sin'), fn('cos'), fn('tg'), fn('ctg'), fn('ln'), fn('lg'),
      fn('exp'), key('|x|', '|'), key('x³', '³'), key('1/x', '1/'), key('π'), key('e')
    ]
  };

  const isPlotField = input => Boolean(input?.matches?.(PLOT_FIELDS));
  const layers = () => (isPlotField(field) ? PLOT_LAYERS : LAYERS);

  // Клавиатура с клавишами и пробелом — рисунком: значок ⌨ мелкий и читается плохо.
  const TOGGLE_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="3" stroke-width="1.8"/><path d="M6 9.5h.01M9.3 9.5h.01M12.6 9.5h.01M15.9 9.5h.01M18 9.5h.01M7.6 12.5h.01M10.9 12.5h.01M14.2 12.5h.01M17 12.5h.01" stroke-width="2.4"/><path d="M8 15.8h8" stroke-width="1.8"/></svg>';

  let panel = null;
  let field = null;     // поле, в которое сейчас печатает панель
  let layer = 'main';
  let abcField = null;  // поле, где попросили системную клавиатуру

  function actionKeys() {
    const touch = isTouch();
    const plot = isPlotField(field);
    return [
      {
        act: 'layer',
        label: layer === 'main' ? (plot ? 'f(x)' : '±≤') : '123',
        title: layer === 'main'
          ? (plot ? tr('mkb_functions', 'Функции') : tr('mkb_more', 'Ещё символы'))
          : tr('mkb_digits', 'Цифры')
      },
      /* «ABC» отдаёт поле системной клавиатуре и нужна только на сенсорном
         экране. «✕» убирает панель совсем: на телефоне вместе с полем, чтобы
         вместо неё не выехала системная. */
      ...(touch ? [{ act: 'abc', label: 'ABC', title: tr('mkb_abc', 'Обычная клавиатура') }] : []),
      { act: 'hide', label: '✕', title: tr('mkb_hide', 'Скрыть клавиатуру') },
      { act: 'left', label: '←', title: tr('mkb_left', 'Курсор влево') },
      { act: 'right', label: '→', title: tr('mkb_right', 'Курсор вправо') },
      { act: 'backspace', label: '⌫', title: tr('mkb_backspace', 'Стереть') },
      { act: 'enter', label: '↵', title: plot ? tr('plotter_draw', 'Построить') : tr('mkb_enter', 'Проверить') }
    ];
  }

  function render() {
    if (!panel) return;
    panel.setAttribute('aria-label', tr('mkb_label', 'Математическая клавиатура'));
    const keys = (layers()[layer] || layers().main).map((k, i) =>
      `<button type="button" tabindex="-1" class="math-kb-key${k.kind ? ` is-${k.kind}` : ''}" data-key="${i}">${esc(k.label)}</button>`);
    const actions = actionKeys().map(a =>
      `<button type="button" tabindex="-1" class="math-kb-key is-act${a.act === 'enter' ? ' is-enter' : ''}" data-act="${a.act}" title="${esc(a.title)}" aria-label="${esc(a.title)}">${esc(a.label)}</button>`);
    /* Служебные клавиши — отдельным ряом, а не в сетке: на сенсорном экране
       их семь, и седьмая свисала бы под ряд из шести. */
    panel.innerHTML = `<div class="math-kb-grid">${keys.join('')}</div><div class="math-kb-acts">${actions.join('')}</div>`;
  }

  function build() {
    panel = document.createElement('div');
    panel.className = 'math-kb';
    panel.hidden = true;
    panel.setAttribute('role', 'group');
    /* Кнопки панели не забирают фокус у поля: иначе на телефоне пропадает
       курсор, а на компьютере срабатывает закрытие по уходу фокуса. */
    panel.addEventListener('pointerdown', event => event.preventDefault());
    panel.addEventListener('mousedown', event => event.preventDefault());
    panel.addEventListener('click', onKey);
    document.body.appendChild(panel);
    render();
  }

  const usable = input => input.isConnected && !input.disabled;

  /* ── Кнопка в поле ──
     Стоит сразу за полем и заходит на его правый край (отступы — в
     style.css), поэтому поле не приходится оборачивать: перенос узла
     сбросил бы фокус, который страница ставит сразу после отрисовки. */
  const toggleOf = input => {
    const next = input?.nextElementSibling;
    return next?.classList.contains('math-kb-toggle') ? next : null;
  };

  function setToggle(input, on) {
    document.querySelectorAll('[data-math-kb-standalone]').forEach(btn => {
      btn.classList.toggle('is-on', Boolean(field));
      btn.setAttribute('aria-pressed', String(Boolean(field)));
    });
    const toggle = toggleOf(input);
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(on));
    toggle.setAttribute('aria-label', tr('mkb_label', 'Математическая клавиатура'));
    toggle.title = on
      ? (isTouch() ? tr('mkb_abc', 'Обычная клавиатура') : tr('mkb_hide', 'Скрыть клавиатуру'))
      : tr('mkb_open', 'Открыть математическую клавиатуру');
  }

  /* Поле для кнопки. Приклеенная к полю знает своё поле соседом; отдельная
     берёт то, в котором стоит курсор, иначе первое незаполненное. */
  function fieldForToggle(toggle) {
    const glued = toggle.previousElementSibling;
    if (glued?.matches?.(FIELDS)) return glued;
    const scope = toggle.closest('[data-math-kb-scope]') || document;
    const fields = [...scope.querySelectorAll(FIELDS)].filter(el => !el.disabled && !el.readOnly);
    if (!fields.length) return null;
    const active = document.activeElement;
    if (active && fields.includes(active)) return active;
    return fields.find(el => !el.value) || fields[0];
  }

  function ensureToggles() {
    document.querySelectorAll(TOGGLE_FIELDS).forEach(input => {
      // У поля-дроби вместо строки бланк, и кнопка клавиатуры ему не нужна.
      if (input.dataset.frac || toggleOf(input)) return;
      input.classList.add('math-kb-host');
      input.insertAdjacentHTML('afterend', `<button type="button" class="math-kb-toggle" data-math-kb-open>${TOGGLE_ICON}</button>`);
      setToggle(input, input === field);
    });
  }

  /* Прежний inputmode поля хранится в data-mkb-mode, пока панель им
     владеет, — «ABC» и уход из поля его возвращают. */
  function silence(input) {
    if (!('mkbMode' in input.dataset)) input.dataset.mkbMode = input.getAttribute('inputmode') ?? '';
    if (input.getAttribute('inputmode') !== 'none') input.setAttribute('inputmode', 'none');
  }
  function release(input) {
    setToggle(input, false);
    if (!('mkbMode' in input.dataset)) return;
    const mode = input.dataset.mkbMode;
    delete input.dataset.mkbMode;
    if (mode) input.setAttribute('inputmode', mode);
    else input.removeAttribute('inputmode');
  }

  /* Поле могут выключить (задача решена) или перерисовать (переход к
     следующей задаче) — тогда панель закрывается. А тренажёр ставит
     inputmode к каждому примеру заново — на телефоне его снова глушим. */
  const watcher = new MutationObserver(() => {
    if (!field) return;
    if (!usable(field)) { close(); return; }
    const mode = field.getAttribute('inputmode');
    if (isTouch() && mode !== 'none') {
      field.dataset.mkbMode = mode ?? '';
      field.setAttribute('inputmode', 'none');
    }
  });

  /* Модальный диалог живёт в верхнем слое: панель из <body> осталась бы
     под его затемнением, поэтому переносим её внутрь открытого диалога
     (и возвращаем в <body>, когда поле обычное). */
  function hostFor(input) {
    return input.closest('dialog[open]') || document.body;
  }

  function open(input) {
    if (!panel) build();
    const host = hostFor(input);
    if (panel.parentElement !== host) host.appendChild(panel);
    // Раскладка зависит от поля: из тренажёра можно перейти прямо в график
    const sameProfile = isPlotField(field) === isPlotField(input);
    if (field && field !== input) release(field);
    field = input;
    if (isTouch()) silence(input);
    setToggle(input, true);
    if (panel.hidden || !sameProfile) {
      layer = 'main';
      render();
      panel.hidden = false;
    }
    document.body.classList.add('math-kb-open');
    document.documentElement.style.setProperty('--math-kb-h', `${panel.offsetHeight}px`);
    watcher.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['inputmode', 'disabled'] });
    requestAnimationFrame(() => keepVisible(input));
  }

  function close() {
    watcher.disconnect();
    if (field) release(field);
    field = null;
    if (panel) {
      panel.hidden = true;
      // Диалог могут закрыть вместе с панелью внутри — держим её в <body>.
      if (panel.parentElement !== document.body) document.body.appendChild(panel);
    }
    document.body.classList.remove('math-kb-open');
    // Отдельная кнопка гаснет вместе с панелью: поля, от которого её гасить, уже нет.
    document.querySelectorAll('[data-math-kb-standalone]').forEach(btn => {
      btn.classList.remove('is-on');
      btn.setAttribute('aria-pressed', 'false');
    });
  }

  // Поле не должно оказаться под панелью.
  function keepVisible(input) {
    if (!panel || panel.hidden || field !== input) return;
    const limit = window.innerHeight - panel.offsetHeight - 12;
    const bottom = input.getBoundingClientRect().bottom;
    if (bottom > limit) window.scrollBy({ top: bottom - limit, behavior: 'instant' });
  }

  function type(input, text) {
    if (input.readOnly) return;
    const pos = input.selectionStart ?? input.value.length;
    const collapsed = input.selectionEnd === pos;
    const next = input.value[pos];
    /* Закрывающая скобка перешагивает поставленную парой, а у интервала
       заменяет её: «(2; 5» и «]» дают «(2; 5]», а не «(2; 5])». */
    if (collapsed && (text === ')' || text === ']') && (next === ')' || next === ']')) {
      input.setSelectionRange(pos, pos + 1);
    } else if (collapsed && text === '|' && next === '|') {
      moveCaret(input, 1);
      return;
    }
    insertIntoInput(input, text);
  }

  function erase(input) {
    if (input.readOnly) return;
    const val = input.value;
    let start = input.selectionStart ?? val.length;
    let end = input.selectionEnd ?? start;
    if (start === end) {
      if (start === 0) return;
      // Пустая пара «()» или «||» стирается целиком — как и ставилась.
      const pair = val.slice(start - 1, start + 1);
      if (pair === '()' || pair === '||' || pair === '[]') end += 1;
      start -= 1;
    }
    input.value = val.slice(0, start) + val.slice(end);
    input.setSelectionRange(start, start);
    input.focus({ preventScroll: true });
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function moveCaret(input, dir) {
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? start;
    // Выделение стрелка схлопывает к своему краю, как в обычном поле.
    const pos = start !== end
      ? (dir < 0 ? start : end)
      : Math.max(0, Math.min(input.value.length, start + dir));
    input.setSelectionRange(pos, pos);
    input.focus({ preventScroll: true });
  }

  function submit(input) {
    const form = input.form;
    if (form) {
      if (form.requestSubmit) form.requestSubmit();
      else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return;
    }
    /* Поля без формы (экспресс-режим, лист тренажёра) ждут Enter. Если его
       никто не обработал — как в контрольной, — переходим к следующему полю. */
    const enter = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true });
    if (!input.dispatchEvent(enter)) return;
    const fields = [...document.querySelectorAll(FIELDS)].filter(el => !el.disabled && !el.readOnly);
    fields[fields.indexOf(input) + 1]?.focus();
  }

  function toSystemKeyboard() {
    const input = field;
    if (!isTouch()) {
      savePref('off');
      close();
      return;
    }
    close();          // вернёт полю прежний inputmode
    input.blur();
    abcField = input; // до следующего ухода из поля панель здесь не открывается
    input.focus();
  }

  /* Панель убрали кнопкой — на компьютере это запоминается (дальше поле
     работает с обычной клавиатурой), на телефоне уводим и фокус: иначе
     система тут же покажет свою клавиатуру вместо нашей. */
  function hidePanel() {
    const input = field;
    if (!isTouch()) savePref('off');
    close();
    if (isTouch()) input?.blur();
  }

  function onKey(event) {
    const button = event.target.closest('button');
    if (!button || !field) return;
    if (!usable(field)) { close(); return; }
    const act = button.dataset.act;
    if (act === 'layer') {
      layer = layer === 'main' ? 'more' : 'main';
      render();
    } else if (act === 'abc') {
      toSystemKeyboard();
    } else if (act === 'hide') {
      hidePanel();
    } else if (act === 'left' || act === 'right') {
      moveCaret(field, act === 'left' ? -1 : 1);
    } else if (act === 'backspace') {
      erase(field);
    } else if (act === 'enter') {
      submit(field);
    } else {
      const k = (layers()[layer] || layers().main)[Number(button.dataset.key)];
      if (k) type(field, k.insert);
    }
  }

  /* Тап по полю: inputmode="none" нужно поставить до фокуса, иначе
     системная клавиатура успевает выехать. */
  document.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' || !isTouch()) return;
    const input = event.target.closest?.(FIELDS);
    if (input && !input.disabled && input !== abcField) silence(input);
  }, true);

  document.addEventListener('focusin', event => {
    const input = event.target.closest?.(FIELDS);
    if (!input) return;
    if (input.disabled || input === abcField || !wanted()) {
      if (field && field !== input) close();
      return;
    }
    open(input);
  });

  document.addEventListener('focusout', event => {
    if (event.target === abcField) abcField = null;
    if (!event.target.matches?.(FIELDS)) return;
    // Фокус мог перейти в другое поле ответа — тогда панель уже при нём.
    setTimeout(() => {
      if (field && document.activeElement !== field) close();
    }, 0);
  });

  // Нажатие на кнопку в поле не уводит фокус из поля — курсор остаётся на месте.
  const keepFocus = event => {
    if (event.target.closest?.('[data-math-kb-open]')) event.preventDefault();
  };
  document.addEventListener('pointerdown', keepFocus);
  document.addEventListener('mousedown', keepFocus);

  document.addEventListener('click', event => {
    const toggle = event.target.closest?.('[data-math-kb-open]');
    if (!toggle) return;
    const input = fieldForToggle(toggle);
    if (!input?.matches?.(FIELDS) || input.disabled) return;
    // Открыта у этого поля — закрыть: на телефоне вернётся системная клавиатура.
    if (field === input) {
      toSystemKeyboard();
      return;
    }
    if (!isTouch()) savePref('on');
    abcField = null;
    // На телефоне системная клавиатура уходит только с новым фокусом.
    input.blur();
    if (isTouch()) silence(input);
    input.focus();
    /* Открываем сами, а не ждём события фокуса: если поле уже было в фокусе,
       focus() ничего не сообщает, и панель не выезжала. */
    if (field !== input) open(input);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && field && event.target === field) close();
  });

  window.addEventListener('languagechange', () => {
    render();
    document.querySelectorAll(TOGGLE_FIELDS).forEach(input => setToggle(input, input === field));
  });

  /* ── Поле-дробь ──
     Когда верный ответ — дробь или смешанное число, страница помечает поле
     data-frac="fraction|mixed", а здесь вместо строки «1 1/2» рисуется бланк:
     [целое] и числитель над чертой над знаменателем. Настоящее поле остаётся
     в документе скрытым — на нём держится вся проверка (value, disabled,
     классы «верно/неверно», фокус). Бланк пишет в него собранную строку
     «1 1/2» и сообщает об этом обычным событием input, а значение, классы
     и disabled, выставленные страницей, зеркалит обратно в бланк. */
  const FRAC_TEXT = {
    ru: { whole: 'Целая часть', num: 'Числитель', den: 'Знаменатель', group: 'Ответ дробью' },
    lv: { whole: 'Veselā daļa', num: 'Skaitītājs', den: 'Saucējs', group: 'Atbilde daļas veidā' }
  };
  const fracText = () => FRAC_TEXT[MathTasks.getLang?.() === 'lv' ? 'lv' : 'ru'];
  const VALUE = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  const FRAC_STATES = ['success', 'error', 'is-wrong', 'is-right'];

  function mountFractionField(source) {
    const lib = window.MathTasksLib;
    if (source.dataset.fracMounted || !lib?.composeFraction || !lib?.splitFraction) return;
    source.dataset.fracMounted = '1';
    const mixed = source.dataset.frac === 'mixed';
    const t = fracText();
    /* Длину не ограничиваем атрибутом maxlength: «1 1/5», вставленная целиком,
       обрезалась бы на четвёртом знаке. Предел ставим после разбора (см. input). */
    const part = (cls, label, mode) =>
      `<input type="text" class="frac-part ${cls}" inputmode="${mode}" autocomplete="off" aria-label="${esc(label)}" />`;
    const wrap = document.createElement('span');
    wrap.className = 'frac-field';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', t.group);
    wrap.innerHTML = `${mixed ? part('frac-whole', t.whole, 'numeric') : ''}`
      + `<span class="frac-stack">${part('frac-num', t.num, 'decimal')}<span class="frac-bar" aria-hidden="true"></span>${part('frac-den', t.den, 'numeric')}</span>`;
    source.after(wrap);
    source.classList.add('frac-source');
    source.tabIndex = -1;
    source.setAttribute('aria-hidden', 'true');

    const whole = wrap.querySelector('.frac-whole');
    const num = wrap.querySelector('.frac-num');
    const den = wrap.querySelector('.frac-den');
    const parts = [whole, num, den].filter(Boolean);
    // Секундомер и сверка читают номер задачи с поля — отдаём его частям бланка.
    if (source.dataset.drillId) parts.forEach(p => { p.dataset.drillId = source.dataset.drillId; });

    const fill = text => {
      const p = lib.splitFraction(text);
      if (whole) whole.value = p.whole;
      num.value = p.num;
      den.value = p.den;
    };
    const sync = () => {
      VALUE.set.call(source, lib.composeFraction({ whole: whole?.value, num: num.value, den: den.value }));
      source.dispatchEvent(new Event('input', { bubbles: true }));
    };

    /* Страница пишет в поле сама («очистить», «показать ответ»): значение
       переносим в бланк. */
    Object.defineProperty(source, 'value', {
      configurable: true,
      get() { return VALUE.get.call(source); },
      set(next) { VALUE.set.call(source, next); fill(String(next ?? '')); }
    });
    source.focus = options => { (parts.find(p => !p.value && !p.disabled) || parts[0]).focus(options); };
    source.select = () => {
      const target = parts.find(p => p === document.activeElement) || parts[0];
      target.focus();
      target.select();
    };

    const mirror = () => {
      parts.forEach(p => { p.disabled = source.disabled; });
      wrap.classList.toggle('is-disabled', source.disabled);
      FRAC_STATES.forEach(cls => wrap.classList.toggle(cls, source.classList.contains(cls)));
    };
    new MutationObserver(mirror).observe(source, { attributes: true, attributeFilter: ['disabled', 'class'] });
    fill(VALUE.get.call(source));
    mirror();

    // Только цифры (в числителе ещё запятая и минус); наружу уходит событие с настоящего поля.
    wrap.addEventListener('input', event => {
      const el = event.target;
      if (!el.classList?.contains('frac-part')) return;
      event.stopPropagation();
      /* «3/5» или «1 3/5» набрали или вставили в одну часть (экранная клавиатура
         телефона, буфер обмена) — раскладываем по частям и ставим курсор дальше. */
      if (el !== den && /[/ ]/.test(el.value)) {
        const text = el.value;
        const p = lib.splitFraction(text);
        if (text.includes('/')) {
          // Целая часть без бланка под неё («1 3/5» вставили в простую дробь) уходит в числитель.
          if (whole) whole.value = p.whole.slice(0, 5);
          else if (p.whole && p.den) p.num = String(Number(p.whole) * Number(p.den) + Number(p.num));
          num.value = p.num.replace(/\s+/g, '').slice(0, 8);
          den.value = p.den.slice(0, 5);
          den.focus();
        } else if (el === whole) {
          whole.value = text.trim();
          num.focus();
        } else {
          el.value = text.replace(/\s+/g, '');
        }
        sync();
        return;
      }
      const cleaned = (el === den
        ? el.value.replace(/\D/g, '')
        : el.value.replace(/−/g, '-').replace(/[^\d,.\-]/g, '')).slice(0, el === num ? 8 : 5);
      if (cleaned !== el.value) el.value = cleaned;
      sync();
    });

    // Клавиши, которые страница ждёт от поля ответа (Enter, ↑ ↓), пересылаем настоящему полю.
    const forward = event => {
      const copy = new KeyboardEvent('keydown', { key: event.key, code: event.code, shiftKey: event.shiftKey, bubbles: true, cancelable: true });
      source.dispatchEvent(copy);
      if (copy.defaultPrevented) event.preventDefault();
    };
    const go = (event, target) => { event.preventDefault(); target.focus(); target.select?.(); };
    wrap.addEventListener('keydown', event => {
      const el = event.target;
      if (!el.classList?.contains('frac-part') || event.isComposing) return;
      const { key } = event;
      if (key === 'Enter') {
        // В форме Enter отправит её сам; в остальных местах — как у обычного поля.
        if (!source.form) { event.preventDefault(); forward(event); }
        return;
      }
      if (key === 'ArrowDown' && el === num) { go(event, den); return; }
      if (key === 'ArrowUp' && el === den) { go(event, num); return; }
      if (key === 'ArrowUp' || key === 'ArrowDown') { forward(event); return; }
      if (key === 'ArrowRight' && el === whole && el.selectionStart === el.value.length) { go(event, num); return; }
      if (key === 'ArrowLeft' && el === num && whole && el.selectionStart === 0 && el.selectionEnd === 0) { go(event, whole); return; }
      // «/» и пробел — шаг к следующей части, как при наборе строкой.
      if (key === '/' || key === ' ') {
        event.preventDefault();
        if (el === whole && key === ' ') go(event, num);
        else if (el === num && key === '/' && num.value) go(event, den);
        return;
      }
      if (key === 'Backspace' && !el.value) {
        if (el === den) go(event, num);
        else if (el === num && whole) go(event, whole);
      }
    });

    // Фокус мог быть на поле до того, как бланк появился.
    if (document.activeElement === source) source.focus();
  }

  const mountFractionFields = (root = document) => {
    if (root.matches?.('input[data-frac]:not([data-frac-mounted])')) mountFractionField(root);
    root.querySelectorAll?.('input[data-frac]:not([data-frac-mounted])').forEach(mountFractionField);
  };
  MathTasks.mountFractionFields = mountFractionFields;

  /* Поля появляются при каждой отрисовке списка — кнопку ставим сразу,
     в том же обходе, до того как страница успеет показаться без неё. */
  new MutationObserver(records => {
    ensureToggles();
    for (const record of records) record.addedNodes.forEach(node => { if (node.nodeType === 1) mountFractionFields(node); });
  }).observe(document.body, { childList: true, subtree: true });
  ensureToggles();
  mountFractionFields(document);

  // Поле с autofocus (карточка тренажёра) получило фокус раньше, чем загрузился модуль.
  const active = document.activeElement;
  if (active?.matches?.(FIELDS) && !active.disabled && wanted()) open(active);
})();
