/* «Задача на весах» — дополнительный режим для линейных уравнений
   (редизайн «Начала», макет Lab-Scale). Уравнение из условия раскладывается
   на фигуры: круг — неизвестное, квадрат — единица, пустая фигура — минус,
   пара закрашенной и пустой даёт ноль. Ученик выбирает ход из трёх: один
   верный, два — типичные ошибки с пояснением. Верный ход меняет весы и
   добавляет строку в «Запись в тетради».

   Подходят уравнения с одной буквой, целыми коэффициентами и целым корнем;
   скобка — только с положительным целым множителем; фигур на одной чаше —
   не больше MAX_FIGS. Всё остальное режим не предлагает. */
(() => {
  const MAX_FIGS = 40;
  const MAX_GROUPS = 6;

  const STR = {
    ru: {
      offer: 'Это линейное уравнение — его можно',
      offerBtn: 'разобрать на весах',
      title: 'На весах',
      lead: 'Весы — дополнительный способ для линейных уравнений. Что делаем с одной чашей, делаем и с другой.',
      close: 'Закрыть весы',
      legendX: '{v}, неизвестное',
      legendOne: 'единица',
      legendNeg: 'пустая фигура — минус',
      legendPair: 'пара даёт ноль',
      step: 'Шаг {n} из {total}',
      yourMove: 'Ваш ход',
      reset: 'Сначала',
      notes: 'Запись в тетради',
      notesWait: 'Каждый верный ход добавляет сюда строку — так, как её записали бы в тетради.',
      done: 'Готово',
      check: 'Проверка: {left} и {right}.',
      given: 'Дано',
      // ходы
      expand: 'Раскрыть скобки: выложить все группы',
      expandOk: 'Скобки раскрыты: группа с множителем {k} — это {k} одинаковые группы.',
      expandBad1: 'Умножить на {k} только {v}',
      expandBad1Msg: 'Множитель {k} относится ко всей скобке: каждый круг и каждый квадрат в ней повторяется {k} {times}.',
      expandBad2: 'Убрать скобки, ничего не умножая',
      expandBad2Msg: 'Скобка с множителем {k} — это {k} одинаковые группы: всё внутри умножается на {k}.',
      expandNote: 'Раскрыли скобки',
      combine: 'Убрать пары и сложить одинаковые фигуры',
      combineOk: 'Пара — закрашенная и пустая фигура — даёт ноль. Одинаковые фигуры собраны вместе.',
      combineBad1: 'Сложить круги с квадратами',
      combineBad1Msg: 'Круг — это неизвестное, квадрат — единица. Разные фигуры не складывают.',
      combineBad2: 'Убрать закрашенные квадраты только с одной чаши',
      combineBad2Msg: 'Весы перекосило. Закрашенный квадрат убирают только вместе с пустым — парой.',
      combineNote: 'Привели подобные',
      takeX: 'Снять по {m} {circles} с обеих чаш',
      addX: 'Добавить по {m} {circles} на обе чаши',
      moveXOk: 'С каждой чаши ушло поровну кругов — весы в равновесии.',
      moveXBad1: 'Переложить {m} {circles} на другую чашу как есть',
      moveXBad1Msg: 'Переходя через знак равенства, фигура меняет заливку: закрашенные круги стали бы пустыми.',
      moveXBad2: 'Снять {m} {circles} только с одной чаши',
      moveXBad2Msg: 'Весы перекосило. Что сняли с одной чаши, снимают и с другой.',
      takeXNote: 'Вычли {m}{v} из обеих частей',
      addXNote: 'Прибавили {m}{v} к обеим частям',
      addOnes: 'Добавить по {m} {squares} на обе чаши',
      takeOnes: 'Снять по {m} {squares} с обеих чаш',
      moveOnesOk: 'На каждую чашу легло (или ушло) одинаковое число квадратов.',
      moveOnesBad1: 'Переложить квадраты на другую чашу как есть',
      moveOnesBad1Msg: 'Переходя через знак равенства, фигура меняет заливку: {from} становится {to}.',
      moveOnesBad2: 'Изменить квадраты только на одной чаше',
      moveOnesBad2Msg: 'Весы перекосило. Что добавили или сняли с одной чаши, делают и с другой.',
      addOnesNote: 'Прибавили {m} к обеим частям',
      takeOnesNote: 'Вычли {m} из обеих частей',
      pairs: 'Убрать все пары',
      pairsOk: 'Пары исчезли.',
      pairsNote: 'Убрали пары',
      divide: 'Разделить обе чаши на {k} равных групп',
      divideOk: 'Один круг уравновешен {q} {squaresQ}.',
      divideBad1: 'Разделить только чашу с кругами',
      divideBad1Msg: 'Весы перекосило. Что делаем с одной чашей, делаем и с другой.',
      divideBad2: 'Снять {k1} {circlesK1}',
      divideBad2Msg: 'Круги снимают поровну с обеих чаш, а на другой их нет. Здесь обе чаши делят на {k} равных групп.',
      divideNote: 'Разделили обе части на {k}',
      finalOk: 'Один круг уравновешен — корень найден.',
      forms: { circle: ['круг', 'круга', 'кругов'], square: ['квадрат', 'квадрата', 'квадратов'], times: ['раз', 'раза', 'раз'] }
    },
    lv: {
      offer: 'Tas ir lineārs vienādojums — to var',
      offerBtn: 'izrisināt uz svariem',
      title: 'Uz svariem',
      lead: 'Svari — papildu veids lineāriem vienādojumiem. Ko darām ar vienu kausu, to darām arī ar otru.',
      close: 'Aizvērt svarus',
      legendX: '{v}, nezināmais',
      legendOne: 'vieninieks',
      legendNeg: 'tukša figūra — mīnuss',
      legendPair: 'pāris dod nulli',
      step: '{n}. solis no {total}',
      yourMove: 'Jūsu gājiens',
      reset: 'No sākuma',
      notes: 'Pieraksts burtnīcā',
      notesWait: 'Katrs pareizs gājiens pievieno šeit rindu — tā, kā to pierakstītu burtnīcā.',
      done: 'Gatavs',
      check: 'Pārbaude: {left} un {right}.',
      given: 'Dots',
      expand: 'Atvērt iekavas: izlikt visas grupas',
      expandOk: 'Iekavas atvērtas: grupa ar reizinātāju {k} — tās ir {k} vienādas grupas.',
      expandBad1: 'Reizināt ar {k} tikai {v}',
      expandBad1Msg: 'Reizinātājs {k} attiecas uz visām iekavām: katrs aplis un katrs kvadrāts tajās atkārtojas {k} reizes.',
      expandBad2: 'Noņemt iekavas, neko nereizinot',
      expandBad2Msg: 'Iekavas ar reizinātāju {k} — tās ir {k} vienādas grupas: viss iekšā reizinās ar {k}.',
      expandNote: 'Atvērām iekavas',
      combine: 'Noņemt pārus un saskaitīt vienādas figūras',
      combineOk: 'Pāris — pilna un tukša figūra — dod nulli. Vienādās figūras savāktas kopā.',
      combineBad1: 'Saskaitīt apļus ar kvadrātiem',
      combineBad1Msg: 'Aplis ir nezināmais, kvadrāts — vieninieks. Dažādas figūras nesaskaita.',
      combineBad2: 'Noņemt pilnos kvadrātus tikai no viena kausa',
      combineBad2Msg: 'Svari sasvērās. Pilnu kvadrātu noņem tikai kopā ar tukšo — pārī.',
      combineNote: 'Savilkām līdzīgos locekļus',
      takeX: 'Noņemt pa {m} {circles} no abiem kausiem',
      addX: 'Pielikt pa {m} {circles} abiem kausiem',
      moveXOk: 'No katra kausa noņemts vienāds apļu skaits — svari līdzsvarā.',
      moveXBad1: 'Pārlikt {m} {circles} uz otru kausu kā ir',
      moveXBad1Msg: 'Pārejot pāri vienādības zīmei, figūra maina krāsu: pilnie apļi kļūtu tukši.',
      moveXBad2: 'Noņemt {m} {circles} tikai no viena kausa',
      moveXBad2Msg: 'Svari sasvērās. Ko noņēma no viena kausa, noņem arī no otra.',
      takeXNote: 'Atņēmām {m}{v} no abām pusēm',
      addXNote: 'Pieskaitījām {m}{v} abām pusēm',
      addOnes: 'Pielikt pa {m} {squares} abiem kausiem',
      takeOnes: 'Noņemt pa {m} {squares} no abiem kausiem',
      moveOnesOk: 'Katram kausam pielikts (vai noņemts) vienāds kvadrātu skaits.',
      moveOnesBad1: 'Pārlikt kvadrātus uz otru kausu kā ir',
      moveOnesBad1Msg: 'Pārejot pāri vienādības zīmei, figūra maina krāsu: {from} kļūst par {to}.',
      moveOnesBad2: 'Mainīt kvadrātus tikai vienā kausā',
      moveOnesBad2Msg: 'Svari sasvērās. Ko pieliek vai noņem vienam kausam, to dara arī ar otru.',
      addOnesNote: 'Pieskaitījām {m} abām pusēm',
      takeOnesNote: 'Atņēmām {m} no abām pusēm',
      pairs: 'Noņemt visus pārus',
      pairsOk: 'Pāri pazuda.',
      pairsNote: 'Noņēmām pārus',
      divide: 'Sadalīt abus kausus {k} vienādās grupās',
      divideOk: 'Viens aplis līdzsvarā ar {q} {squaresQ}.',
      divideBad1: 'Sadalīt tikai kausu ar apļiem',
      divideBad1Msg: 'Svari sasvērās. Ko darām ar vienu kausu, to darām arī ar otru.',
      divideBad2: 'Noņemt {k1} {circlesK1}',
      divideBad2Msg: 'Apļus noņem vienādi no abiem kausiem, bet otrā to nav. Te abus kausus dala {k} vienādās grupās.',
      divideNote: 'Izdalījām abas puses ar {k}',
      finalOk: 'Viens aplis līdzsvarā — sakne atrasta.',
      forms: { circle: ['apli', 'apļus', 'apļus'], square: ['kvadrātu', 'kvadrātus', 'kvadrātus'], times: ['reizi', 'reizes', 'reizes'] }
    }
  };

  const lang = () => (window.MathTasksI18n?.getLang?.() === 'lv' ? 'lv' : 'ru');
  const S = () => STR[lang()];
  const fill = (text, params = {}) => String(text).replace(/\{(\w+)\}/g, (_, name) => (params[name] ?? ''));
  const plural = (n, forms) => {
    if (lang() === 'lv') return n === 1 ? forms[0] : forms[1];
    const d = n % 10;
    const h = n % 100;
    if (d === 1 && h !== 11) return forms[0];
    if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return forms[1];
    return forms[2];
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ── Разбор уравнения ─────────────────────────────────────────── */
  function extractEquation(latex) {
    const parts = [...String(latex || '').matchAll(/\$\$?([^$]+)\$\$?|\\\(([\s\S]+?)\\\)/g)].map(m => m[1] || m[2]);
    const candidates = parts.filter(p => (p.match(/=/g) || []).length === 1);
    if (candidates.length !== 1) return null;
    const clean = candidates[0]
      .replace(/\\left|\\right|\\,|\\;|\\!|\\ /g, '')
      .replace(/\\cdot|\\times|·/g, '*')
      .replace(/−|–/g, '-')
      .replace(/\s+/g, '');
    if (/[^0-9a-zA-Z+\-*()=]/.test(clean)) return null;
    const letters = [...new Set(clean.match(/[a-zA-Z]/g) || [])];
    if (letters.length !== 1) return null;
    const v = letters[0];
    const [left, right] = clean.split('=');
    if (!left || !right) return null;
    return { left, right, v };
  }

  // Сторона — список элементов: {kind:'x'|'n', c} или {kind:'group', k, items}.
  function parseSide(src, v) {
    let i = 0;
    const peek = () => src[i];
    const items = [];
    const parseNumber = () => {
      let s = '';
      while (i < src.length && /\d/.test(src[i])) s += src[i++];
      return s ? Number(s) : null;
    };
    // Внутренность скобки: только x и числа.
    const parseInner = () => {
      const inner = [];
      let first = true;
      while (i < src.length && peek() !== ')') {
        let sign = 1;
        if (peek() === '+' || peek() === '-') { sign = peek() === '-' ? -1 : 1; i++; } else if (!first) return null;
        first = false;
        const num = parseNumber();
        if (peek() === v) { i++; inner.push({ kind: 'x', c: sign * (num ?? 1) }); } else if (num !== null) inner.push({ kind: 'n', c: sign * num });
        else return null;
      }
      return inner.length ? inner : null;
    };
    let first = true;
    while (i < src.length) {
      let sign = 1;
      if (peek() === '+' || peek() === '-') { sign = peek() === '-' ? -1 : 1; i++; } else if (!first) return null;
      first = false;
      // Произведение множителей: числа, буква, одна скобка.
      let coef = 1;
      let hasVar = false;
      let group = null;
      let any = false;
      while (i < src.length && peek() !== '+' && peek() !== '-') {
        if (peek() === '*') { i++; continue; }
        if (/\d/.test(peek())) { coef *= parseNumber(); any = true; continue; }
        if (peek() === v) { if (hasVar || group) return null; hasVar = true; i++; any = true; continue; }
        if (peek() === '(') {
          if (group || hasVar) return null;
          i++;
          group = parseInner();
          if (!group || peek() !== ')') return null;
          i++;
          any = true;
          continue;
        }
        return null;
      }
      if (!any) return null;
      const k = sign * coef;
      if (group) {
        // Минус перед скобкой — те же группы с перевёрнутой заливкой.
        if (k === 1) items.push(...group);
        else items.push({ kind: 'group', k, items: group });
      } else items.push({ kind: hasVar ? 'x' : 'n', c: k });
    }
    return items.length ? items : null;
  }

  const lin = items => items.reduce((acc, it) => {
    if (it.kind === 'x') acc.a += it.c;
    else if (it.kind === 'n') acc.b += it.c;
    else { const inner = lin(it.items); acc.a += it.k * inner.a; acc.b += it.k * inner.b; }
    return acc;
  }, { a: 0, b: 0 });
  const expandItems = items => items.flatMap(it => (it.kind === 'group' ? it.items.map(x => ({ kind: x.kind, c: x.c * it.k })) : [it]));
  const fromLin = ({ a, b }, xFirst = true) => {
    const out = [];
    if (a) out.push({ kind: 'x', c: a });
    if (b || !a) out.push({ kind: 'n', c: b });
    return xFirst ? out : out.reverse();
  };
  const figCount = items => items.reduce((n, it) => n + (it.kind === 'group' ? Math.abs(it.k) * figCount(it.items) : Math.abs(it.c)), 0);

  /* ── Запись выражений ─────────────────────────────────────────── */
  function termText(it, v, first) {
    const c = it.c;
    const sign = c < 0 ? '−' : (first ? '' : '+');
    const abs = Math.abs(c);
    let body;
    if (it.kind === 'x') body = `${abs === 1 ? '' : abs}<i>${v}</i>`;
    else body = String(abs);
    return first ? `${sign}${body}` : ` ${sign} ${body}`;
  }
  function sideText(items, v) {
    return items.map((it, idx) => {
      if (it.kind === 'group') {
        const inner = it.items.map((x, j) => termText(x, v, j === 0)).join('');
        const abs = Math.abs(it.k);
        const lead = it.k < 0 ? (idx === 0 ? '−' : ' − ') : (idx === 0 ? '' : ' + ');
        return `${lead}${abs === 1 ? '' : abs}(${inner})`;
      }
      return termText(it, v, idx === 0);
    }).join('');
  }

  /* ── Шаги решения ─────────────────────────────────────────────── */
  function buildSteps(eq) {
    const L0 = parseSide(eq.left, eq.v);
    const R0 = parseSide(eq.right, eq.v);
    if (!L0 || !R0) return null;
    const groups = [...L0, ...R0].filter(it => it.kind === 'group');
    if (groups.length > 2 || groups.some(g => Math.abs(g.k) > MAX_GROUPS)) return null;
    const lL = lin(L0);
    const lR = lin(R0);
    if (lL.a === lR.a) return null; // нет корня или их бесконечно много
    const root = (lR.b - lL.b) / (lL.a - lR.a);
    if (!Number.isInteger(root)) return null;

    const states = [{ L: L0, R: R0, kind: 'given' }];
    let L = L0;
    let R = R0;
    if (groups.length) {
      L = expandItems(L);
      R = expandItems(R);
      states.push({ L, R, kind: 'expand', k: groups[0].k });
    }
    const isSimple = items => items.filter(it => it.kind === 'x').length <= 1 && items.filter(it => it.kind === 'n').length <= 1
      && !items.some(it => it.c === 0 && items.length > 1);
    let a = lin(L);
    let b = lin(R);
    if (!isSimple(L) || !isSimple(R)) {
      L = fromLin(a);
      R = fromLin(b);
      states.push({ L, R, kind: 'combine' });
    }
    // Круги — на одну чашу: туда, где их больше, чтобы их стало положительное число.
    let xLeft = a.a > b.a;
    if (a.a && b.a) {
      const m = xLeft ? b.a : a.a;
      a = { a: a.a - m, b: a.b };
      b = { a: b.a - m, b: b.b };
      L = fromLin(a);
      R = fromLin(b, false);
      states.push({ L, R, kind: 'moveX', m });
    } else if (!a.a) xLeft = false;
    else xLeft = true;
    // Квадраты с чаши кругов — на другую.
    const xs = xLeft ? a : b;
    const os = xLeft ? b : a;
    if (xs.b) {
      const m = -xs.b;
      const withX = [...fromLin({ a: xs.a, b: 0 }), { kind: 'n', c: xs.b }, { kind: 'n', c: m }];
      const other = [...fromLin({ a: 0, b: os.b }), { kind: 'n', c: m }];
      L = xLeft ? withX : other;
      R = xLeft ? other : withX;
      states.push({ L, R, kind: 'moveOnes', m, from: xs.b });
      xs.b = 0;
      os.b += m;
      L = xLeft ? fromLin(xs) : fromLin(os);
      R = xLeft ? fromLin(os) : fromLin(xs);
      states.push({ L, R, kind: 'pairs' });
    }
    if (xs.a < 0) return null;
    if (xs.a !== 1) {
      const k = xs.a;
      xs.a = 1;
      os.b /= k;
      L = xLeft ? fromLin(xs) : fromLin(os);
      R = xLeft ? fromLin(os) : fromLin(xs);
      states.push({ L, R, kind: 'divide', k, q: os.b });
    }
    if (states.some(s => figCount(s.L) > MAX_FIGS || figCount(s.R) > MAX_FIGS)) return null;
    if (states.length < 2) return null;
    return { states, root, L0, R0, v: eq.v };
  }

  /* ── Фигуры ───────────────────────────────────────────────────── */
  function figs(items) {
    return items.map(it => {
      if (it.kind === 'group') {
        const inner = it.k < 0 ? it.items.map(x => ({ ...x, c: -x.c })) : it.items;
        const one = `<span class="nb-scale-grp">${figs(inner)}</span>`;
        return one.repeat(Math.abs(it.k));
      }
      const shape = it.kind === 'x' ? 'c' : 's';
      return `<i class="nb-fg ${shape}${it.c < 0 ? ' neg' : ''}"></i>`.repeat(Math.abs(it.c));
    }).join('');
  }

  /* ── Ходы шага ────────────────────────────────────────────────── */
  function movesFor(state, v) {
    const t = S();
    const circ = n => plural(Math.abs(n), t.forms.circle);
    const sq = n => plural(Math.abs(n), t.forms.square);
    switch (state.kind) {
      case 'expand': {
        const k = Math.abs(state.k);
        const p = { k, v, times: plural(k, t.forms.times) };
        return { ok: fill(t.expand, p), okMsg: fill(t.expandOk, p), note: t.expandNote,
          bad: [[fill(t.expandBad1, p), fill(t.expandBad1Msg, p)], [fill(t.expandBad2, p), fill(t.expandBad2Msg, p)]] };
      }
      case 'combine':
        return { ok: t.combine, okMsg: t.combineOk, note: t.combineNote,
          bad: [[t.combineBad1, t.combineBad1Msg], [t.combineBad2, t.combineBad2Msg]] };
      case 'moveX': {
        const m = Math.abs(state.m);
        const p = { m, circles: circ(m), v };
        return { ok: fill(state.m > 0 ? t.takeX : t.addX, p), okMsg: t.moveXOk,
          note: fill(state.m > 0 ? t.takeXNote : t.addXNote, { m: m === 1 ? '' : m, v }),
          bad: [[fill(t.moveXBad1, p), t.moveXBad1Msg], [fill(t.moveXBad2, p), t.moveXBad2Msg]] };
      }
      case 'moveOnes': {
        const m = Math.abs(state.m);
        const p = { m, squares: sq(m) };
        const fromText = state.from < 0 ? `−${Math.abs(state.from)}` : `+${state.from}`;
        const toText = state.from < 0 ? `+${Math.abs(state.from)}` : `−${state.from}`;
        return { ok: fill(state.m > 0 ? t.addOnes : t.takeOnes, p), okMsg: t.moveOnesOk,
          note: fill(state.m > 0 ? t.addOnesNote : t.takeOnesNote, { m }),
          bad: [[t.moveOnesBad1, fill(t.moveOnesBad1Msg, { from: fromText, to: toText })], [t.moveOnesBad2, t.moveOnesBad2Msg]] };
      }
      case 'pairs':
        return { ok: t.pairs, okMsg: t.pairsOk, note: t.pairsNote, bad: [] };
      case 'divide': {
        const p = { k: state.k, q: state.q, squaresQ: sq(state.q), k1: state.k - 1, circlesK1: circ(state.k - 1) };
        return { ok: fill(t.divide, p), okMsg: fill(t.divideOk, p), note: fill(t.divideNote, p),
          bad: [[t.divideBad1, t.divideBad1Msg], [fill(t.divideBad2, p), fill(t.divideBad2Msg, p)]] };
      }
      default:
        return null;
    }
  }

  // Порядок кнопок — постоянный для шага, но не всегда верная первая.
  const order = (n, step) => [[0, 1, 2], [1, 0, 2], [2, 1, 0], [1, 2, 0]][(step * 7 + n) % 4];

  /* ── Панель ───────────────────────────────────────────────────── */
  function render(panel, plan, at, mistake) {
    const t = S();
    const v = plan.v;
    const state = plan.states[at];
    const total = plan.states.length - 1;
    const next = plan.states[at + 1];
    const moves = next ? movesFor(next, v) : null;
    const options = moves ? [[moves.ok, null], ...moves.bad] : [];
    const ord = order(options.length, at).filter(i => i < options.length);
    const sideBox = (items, cls) => `<div class="nb-scale-pan ${cls}"><div class="nb-scale-figs">${figs(items)}</div></div>`;
    const prevMoves = at > 0 ? movesFor(state, v) : null;
    const feedback = mistake
      ? `<div class="nb-scale-fb is-bad" role="status">${esc(mistake)}</div>`
      : (prevMoves ? `<div class="nb-scale-fb is-ok" role="status">${esc(prevMoves.okMsg)}</div>` : '');
    const evalSide = items => { const l = lin(items); return l.a * plan.root + l.b; };
    const vSub = items => sideText(items, v).replace(new RegExp(`(\\d*)<i>${v}</i>`, 'g'), (_, k) => (k ? `${k} · ${plan.root < 0 ? `(${plan.root})` : plan.root}` : String(plan.root)));
    const finale = !next
      ? `<div class="nb-scale-final"><p class="nb-serif nb-scale-root"><i>${v}</i> = ${plan.root < 0 ? `−${Math.abs(plan.root)}` : plan.root}</p>
         <p class="nb-scale-check">${fill(t.check, { left: `${vSub(plan.L0)} = ${evalSide(plan.L0)}`, right: `${vSub(plan.R0)} = ${evalSide(plan.R0)}` })}</p></div>`
      : '';
    const notes = plan.states.slice(0, at + 1).map((s, i) => {
      const label = i === 0 ? t.given : movesFor(s, v).note;
      return `<div class="nb-scale-line"><span class="nb-cell${i === at ? ' is-current' : ' is-solved'}">${i + 1}</span><div><span class="nb-scale-lb">${esc(label)}</span><p class="nb-serif">${sideText(s.L, v)} = ${sideText(s.R, v)}</p></div></div>`;
    }).join('');

    panel.innerHTML = `
      <div class="nb-scale-head">
        <div><h2>${esc(t.title)}</h2><p>${esc(t.lead)}</p></div>
        <button type="button" class="nb-icon-btn" data-scale-close aria-label="${esc(t.close)}">×</button>
      </div>
      <ul class="nb-scale-legend">
        <li><i class="nb-fg c"></i><span>${fill(t.legendX, { v: `<i class="nb-serif">${v}</i>` })}</span></li>
        <li><i class="nb-fg s"></i><span>${esc(t.legendOne)}</span></li>
        <li><span class="nb-scale-pair"><i class="nb-fg c neg"></i><i class="nb-fg s neg"></i></span><span>${esc(t.legendNeg)}</span></li>
        <li><span class="nb-scale-pair"><i class="nb-fg s"></i><i class="nb-fg s neg"></i></span><span>${esc(t.legendPair)}</span></li>
      </ul>
      <div class="nb-scale-beam">
        <p class="nb-serif nb-scale-ex">${sideText(state.L, v)}</p><p class="nb-serif nb-scale-eq">=</p><p class="nb-serif nb-scale-ex">${sideText(state.R, v)}</p>
        ${sideBox(state.L, 'is-left')}<span class="nb-scale-mid" aria-hidden="true"></span>${sideBox(state.R, 'is-right')}
        <span class="nb-scale-bar" aria-hidden="true"></span><span class="nb-scale-stand" aria-hidden="true"></span>
      </div>
      <div class="nb-scale-cols">
        <section class="nb-scale-move">
          <div class="nb-scale-move-head">
            <div><span class="nb-eyebrow">${esc(next ? fill(t.step, { n: at + 1, total }) : t.done)}</span><h3>${esc(next ? t.yourMove : t.finalOk)}</h3></div>
            ${at > 0 ? `<button type="button" class="nb-btn" data-scale-reset>${esc(t.reset)}</button>` : ''}
          </div>
          ${feedback}
          ${next ? `<div class="nb-scale-mvs">${ord.map(i => `<button type="button" class="nb-scale-mv" data-scale-move="${i}">${esc(options[i][0])}</button>`).join('')}</div>` : finale}
        </section>
        <section class="nb-scale-notes">
          <h3 class="nb-eyebrow">${esc(t.notes)}</h3>
          ${notes}
          ${at === 0 ? `<p class="nb-scale-wait">${esc(t.notesWait)}</p>` : ''}
        </section>
      </div>`;
    panel._nb = { plan, at, options };
  }

  function mount(card, task) {
    if (!card || !task) return;
    card.parentElement?.querySelectorAll('.nb-scale-offer, .nb-scale').forEach(el => el.remove());
    const latex = lang() === 'lv' ? (task.condition_latex_lv || task.condition_latex) : task.condition_latex;
    const eq = extractEquation(latex) || extractEquation(task.condition_latex);
    const plan = eq && buildSteps(eq);
    if (!plan) return;
    const t = S();
    card.insertAdjacentHTML('afterend', `<p class="nb-scale-offer">${esc(t.offer)} <button type="button" class="nb-scale-open" data-scale-open>${esc(t.offerBtn)}</button>.</p><section class="nb-scale" hidden aria-label="${esc(t.title)}"></section>`);
    const panel = card.parentElement.querySelector('.nb-scale');
    panel._plan = plan;
  }

  document.addEventListener('click', event => {
    const open = event.target.closest?.('[data-scale-open]');
    if (open) {
      const panel = open.closest('.nb-scale-offer')?.nextElementSibling;
      if (!panel?._plan) return;
      panel.hidden = false;
      render(panel, panel._plan, 0, null);
      panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
      return;
    }
    const panel = event.target.closest?.('.nb-scale');
    if (!panel?._nb) return;
    if (event.target.closest('[data-scale-close]')) { panel.hidden = true; return; }
    if (event.target.closest('[data-scale-reset]')) { render(panel, panel._nb.plan, 0, null); return; }
    const move = event.target.closest('[data-scale-move]');
    if (!move) return;
    const { plan, at, options } = panel._nb;
    const index = Number(move.dataset.scaleMove);
    if (index === 0) render(panel, plan, at + 1, null);
    else render(panel, plan, at, options[index][1]);
    panel.querySelector('.nb-scale-mv, [data-scale-reset]')?.focus({ preventScroll: true });
  });

  window.MathTasksScale = { mount, extractEquation, buildSteps, parseSide };
})();
