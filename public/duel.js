/* Дуэль на устный счёт по ссылке — чистые функции.

   Вся дуэль живёт в ссылке: зерно генератора, категория, сложность и
   результаты игроков. Сервер и база не нужны, аккаунт тоже: друг
   открывает ссылку, решает те же примеры (одно зерно — одни примеры на
   любом устройстве) и видит сравнение. Состояние кладётся во фрагмент
   адреса (#…) — он не уходит на сервер, так что ник ребёнка не попадает
   ни в логи, ни в аналитику.

   Подделать счёт в ссылке можно. Для дружеской дуэли это не важно:
   выигрыш ничего не даёт за пределами пары друзей. Контрольная сумма
   здесь только отсекает ссылки, побитые при копировании. В общую таблицу
   лидеров счёт из ссылки не идёт: её счёт считает воркер (worker/duel-api.js). */
(() => {
  const VERSION = 1;
  const CATEGORIES = ['addsub2', 'addsub3', 'multdiv', 'fractions', 'decimals', 'negatives', 'mix'];
  const DIFFS = ['normal', 'hard', 'expert'];
  const DURATION_SEC = 60;
  const NICK_MAX = 24;
  const MAX_ATTEMPTS = 300;

  // ── Кодирование ─────────────────────────────────────────────────────
  const toBase64Url = text => {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const fromBase64Url = token => {
    const base = String(token).replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base + '='.repeat((4 - base.length % 4) % 4));
    return new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
  };

  // FNV-1a: хватает, чтобы заметить обрезанную или испорченную ссылку.
  const checksum = text => {
    let hash = 0x811c9dc5;
    for (const byte of new TextEncoder().encode(text)) {
      hash ^= byte;
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(36);
  };

  // Какие примеры решены верно: по биту на пример, шесть бит на символ.
  const MASK_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

  const packMask = bits => {
    let out = '';
    for (let i = 0; i < bits.length; i += 6) {
      let value = 0;
      for (let j = 0; j < 6; j++) value = (value << 1) | (bits[i + j] ? 1 : 0);
      out += MASK_ALPHABET[value];
    }
    return out;
  };

  const unpackMask = (text, length) => {
    const bits = [];
    for (const char of String(text || '')) {
      const value = MASK_ALPHABET.indexOf(char);
      if (value < 0) return null;
      for (let j = 5; j >= 0; j--) bits.push(Boolean((value >> j) & 1));
    }
    return bits.length >= length ? bits.slice(0, length) : null;
  };

  // ── Ники ────────────────────────────────────────────────────────────
  /* «Дружелюбные» ники, как у Kahoot: прилагательное + животное, род
     согласован. Ребёнок может поправить ник, но по умолчанию ему нечего
     выдумывать — и нечего выдать о себе. Ник у человека один на весь
     сайт и не переводится: генератор даёт его на языке первого визита,
     а дальше он хранится как есть — иначе в таблице лидеров один игрок
     появлялся бы дважды, по-русски и по-латышски. Третий элемент —
     значок для аватара. */
  const NICK_PARTS = {
    ru: {
      animals: [['Лиса', 'f', '🦊'], ['Кот', 'm', '🐱'], ['Сова', 'f', '🦉'], ['Ёж', 'm', '🦔'], ['Барсук', 'm', '🦡'],
        ['Выдра', 'f', '🦦'], ['Белка', 'f', '🐿️'], ['Волк', 'm', '🐺'], ['Заяц', 'm', '🐰'], ['Рысь', 'f', '🐈'],
        ['Лось', 'm', '🫎'], ['Пингвин', 'm', '🐧'], ['Дельфин', 'm', '🐬'], ['Черепаха', 'f', '🐢'], ['Панда', 'f', '🐼'],
        ['Енот', 'm', '🦝'], ['Бобр', 'm', '🦫'], ['Орёл', 'm', '🦅'], ['Чайка', 'f', '🐦'], ['Кит', 'm', '🐳']],
      adjectives: [['Быстрый', 'Быстрая'], ['Хитрый', 'Хитрая'], ['Смелый', 'Смелая'], ['Весёлый', 'Весёлая'],
        ['Мудрый', 'Мудрая'], ['Ловкий', 'Ловкая'], ['Зоркий', 'Зоркая'], ['Шустрый', 'Шустрая'], ['Храбрый', 'Храбрая'],
        ['Точный', 'Точная'], ['Юркий', 'Юркая'], ['Упорный', 'Упорная']]
    },
    lv: {
      animals: [['Lapsa', 'f', '🦊'], ['Kaķis', 'm', '🐱'], ['Pūce', 'f', '🦉'], ['Ezis', 'm', '🦔'], ['Āpsis', 'm', '🦡'],
        ['Ūdrs', 'm', '🦦'], ['Vāvere', 'f', '🐿️'], ['Vilks', 'm', '🐺'], ['Zaķis', 'm', '🐰'], ['Lūsis', 'm', '🐈'],
        ['Alnis', 'm', '🫎'], ['Pingvīns', 'm', '🐧'], ['Delfīns', 'm', '🐬'], ['Panda', 'f', '🐼'], ['Jenots', 'm', '🦝'],
        ['Bebrs', 'm', '🦫'], ['Ērglis', 'm', '🦅'], ['Kaija', 'f', '🐦'], ['Zebiekste', 'f', '🦡'], ['Valis', 'm', '🐳']],
      adjectives: [['Ātrais', 'Ātrā'], ['Viltīgais', 'Viltīgā'], ['Drosmīgais', 'Drosmīgā'], ['Jautrais', 'Jautrā'],
        ['Gudrais', 'Gudrā'], ['Veiklais', 'Veiklā'], ['Vērīgais', 'Vērīgā'], ['Žiglais', 'Žiglā'], ['Varonīgais', 'Varonīgā'],
        ['Precīzais', 'Precīzā'], ['Zibenīgais', 'Zibenīgā'], ['Neatlaidīgais', 'Neatlaidīgā']]
    }
  };

  const generateNick = (lang = 'ru', random = Math.random) => {
    const parts = NICK_PARTS[lang] || NICK_PARTS.ru;
    const [animal, gender] = parts.animals[Math.floor(random() * parts.animals.length)];
    const [masculine, feminine] = parts.adjectives[Math.floor(random() * parts.adjectives.length)];
    return `${gender === 'f' ? feminine : masculine} ${animal}`;
  };

  /* Аватар по нику: зверь из генератора — его значок, свой ник — первая
     буква на цветном круге. Оттенок считается из ника, так что у одного
     игрока он одинаков на любом устройстве. */
  const ANIMAL_ICONS = new Map(
    Object.values(NICK_PARTS).flatMap(parts => parts.animals.map(([animal, , icon]) => [animal.toLowerCase(), icon]))
  );
  const avatarFor = nick => {
    const text = String(nick || '').trim();
    let hash = 0;
    for (const char of text) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
    const hue = hash % 360;
    const words = text.toLowerCase().split(/\s+/);
    const icon = ANIMAL_ICONS.get(words[words.length - 1]);
    if (icon) return { text: icon, emoji: true, hue };
    const first = [...text][0];
    return { text: first ? first.toUpperCase() : '?', emoji: false, hue };
  };

  /* Грубые слова ищем после приведения похожих латинских букв и цифр к
     кириллице и выбрасывания пробелов: «х у й», «xyй», «6ля» — всё одно. */
  const LOOKALIKES = { a: 'а', b: 'в', c: 'с', e: 'е', h: 'н', k: 'к', m: 'м', o: 'о', p: 'р', t: 'т', x: 'х', y: 'у', 3: 'з', 0: 'о', 6: 'б', 4: 'ч' };
  const BLOCKED_CYRILLIC = ['хуй', 'хуе', 'хуё', 'хуя', 'пизд', 'ебал', 'ебан', 'ебат', 'еблан', 'ёбан', 'ебуч', 'бля', 'сука', 'суки',
    'мудак', 'мудил', 'гандон', 'пидор', 'пидар', 'педик', 'шлюх', 'залуп', 'дроч', 'говн', 'срать', 'ублюд', 'сволоч', 'мразь',
    'нацист', 'гитлер'];
  const BLOCKED_LATIN = ['fuck', 'shit', 'bitch', 'cunt', 'nigg', 'porn', 'whore', 'slut', 'penis', 'pimpis', 'pizda', 'dirsa',
    'mauka', 'pedik', 'pidar', 'hitler', 'nazi'];
  /* Короткие корни встречаются внутри безобидных ников («Viltīgais Ūdrs»
     без пробела даёт «…aisūdrs»), поэтому их ищем только в начале слова —
     в исходной записи и в приведённой к кириллице. */
  const BLOCKED_WORD_START = ['sūd', 'sud', 'sex', 'kill', 'fag', 'dick', 'cock', 'pimp', 'kuce', 'maita', 'pist', 'dirs', 'mēsl',
    'idiot', 'idiōt', 'debil', 'debīl', 'daun', 'kretīn', 'kretin',
    'ёб', 'жоп', 'хер', 'сись', 'трах', 'дебил', 'даун', 'идиот', 'урод', 'тварь', 'подонок', 'чмо'];

  const looksBlocked = text => {
    const lower = text.toLowerCase();
    const plain = lower.replace(/[\s\-_.]/g, '');
    if (BLOCKED_LATIN.some(word => plain.includes(word))) return true;
    const toCyrillic = value => [...value].map(char => LOOKALIKES[char] || char).join('');
    const cyr = toCyrillic(plain);
    if (BLOCKED_CYRILLIC.some(word => cyr.includes(word) || plain.includes(word))) return true;
    return lower.split(/[\s\-_.]+/).some(word => {
      const mapped = toCyrillic(word);
      return BLOCKED_WORD_START.some(root => word.startsWith(root) || mapped.startsWith(root));
    });
  };

  /* Ник — пользовательский ввод, который увидит другой ребёнок. Пустая
     строка значит «не подходит»: странице тогда нужно подставить ник из
     генератора. Почту, телефон и ссылку не пропускаем: ребёнок не должен
     раздавать свои контакты через дуэль. */
  const sanitizeNick = raw => {
    const text = String(raw || '')
      .normalize('NFC')
      .replace(/[\p{C}]/gu, '')
      .replace(/[^\p{L}\p{N} \-]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, NICK_MAX)
      .trim();
    if (text.length < 2) return '';
    if (/@|https?|www|\.(?:lv|com|ru|net)\b/i.test(String(raw || ''))) return '';
    if (/\d{6,}/.test(text.replace(/[\s\-]/g, ''))) return '';
    if (looksBlocked(text)) return '';
    return text;
  };

  // ── Вызов ───────────────────────────────────────────────────────────
  const isCount = (value, max = MAX_ATTEMPTS) => Number.isInteger(value) && value >= 0 && value <= max;

  /* Игрок в ссылке — либо результат (r верных из q, маска m), либо только
     ник: вызвавший получает ссылку сразу, до своей минуты, и может сыграть
     её позже. Такой игрок — «ожидающий»: у него нет r, q и m. */
  const hasResult = player => Boolean(player) && !player.pending;

  const normalizePlayer = player => {
    if (!player || typeof player !== 'object') return null;
    const { r, q, m } = player;
    // Ник из чужой ссылки проверяем заново: ссылку могли собрать руками.
    const n = sanitizeNick(player.n);
    if (r === undefined && q === undefined && m === undefined) return { n, pending: true };
    if (!isCount(q) || !isCount(r) || r > q) return null;
    const bits = unpackMask(m, q);
    if (!bits || bits.filter(Boolean).length !== r) return null;
    return { n, r, q, m: String(m) };
  };

  const packPlayer = player => (player.pending
    ? { n: player.n }
    : { n: player.n, r: player.r, q: player.q, m: player.m });

  const encodeChallenge = challenge => {
    const payload = {
      v: VERSION,
      g: challenge.g,
      s: challenge.s >>> 0,
      c: challenge.c,
      d: challenge.d,
      a: packPlayer(challenge.a)
    };
    if (challenge.b) payload.b = packPlayer(challenge.b);
    const json = JSON.stringify(payload);
    return `${toBase64Url(json)}.${checksum(json)}`;
  };

  /* null — ссылка побита или собрана с ошибкой. Версию генератора сверяет
     страница: при несовпадении у друзей были бы разные примеры. */
  const decodeChallenge = token => {
    try {
      const text = String(token || '').replace(/^#/, '').replace(/^d=/, '');
      const dot = text.lastIndexOf('.');
      if (dot <= 0) return null;
      const json = fromBase64Url(text.slice(0, dot));
      if (checksum(json) !== text.slice(dot + 1)) return null;
      const data = JSON.parse(json);
      if (!data || data.v !== VERSION) return null;
      if (!Number.isInteger(data.g) || data.g < 1) return null;
      if (!Number.isInteger(data.s) || data.s < 0 || data.s > 0xFFFFFFFF) return null;
      if (!CATEGORIES.includes(data.c) || !DIFFS.includes(data.d)) return null;
      const a = normalizePlayer(data.a);
      if (!a) return null;
      const b = data.b === undefined ? null : normalizePlayer(data.b);
      if (data.b !== undefined && !b) return null;
      return { v: data.v, g: data.g, s: data.s, c: data.c, d: data.d, a, b };
    } catch {
      return null;
    }
  };

  // ── Итог ────────────────────────────────────────────────────────────
  /* Побеждает тот, у кого больше верных; при равенстве — у кого меньше
     ошибок. Примеры у обоих одни и те же, поэтому можно показать, где
     споткнулись оба — это самые полезные для разбора места. */
  const compareResults = (a, b) => {
    const aErrors = a.q - a.r;
    const bErrors = b.q - b.r;
    let winner = 'tie';
    if (a.r !== b.r) winner = a.r > b.r ? 'a' : 'b';
    else if (aErrors !== bErrors) winner = aErrors < bErrors ? 'a' : 'b';
    const aBits = unpackMask(a.m, a.q) || [];
    const bBits = unpackMask(b.m, b.q) || [];
    const bothWrong = [];
    for (let i = 0; i < Math.min(aBits.length, bBits.length); i++) {
      if (!aBits[i] && !bBits[i]) bothWrong.push(i);
    }
    return { winner, aErrors, bErrors, bothWrong };
  };

  // ── Случайный соперник ──────────────────────────────────────────────
  /* Живой подбор. Все ждущие игроки видят один и тот же список присутствия
     в канале; пары составляются одинаково на каждом устройстве: по времени
     входа, первый со вторым, третий с четвёртым. Первый в паре — ведущий:
     он выбирает зерно и присылает приглашение, второй подтверждает. Так
     двое не выберут одного и того же третьего. */
  const pairWaiting = players => {
    const sorted = [...(players || [])]
      .filter(player => player && player.id)
      .sort((a, b) => (Number(a.at) || 0) - (Number(b.at) || 0) || String(a.id).localeCompare(String(b.id)));
    const pairs = [];
    for (let i = 0; i + 1 < sorted.length; i += 2) pairs.push([sorted[i].id, sorted[i + 1].id]);
    return pairs;
  };

  const matchRole = (players, myId) => {
    for (const [host, guest] of pairWaiting(players)) {
      if (host === myId) return { role: 'host', partner: guest };
      if (guest === myId) return { role: 'guest', partner: host };
    }
    return null;
  };

  /* Запись соперника: ответы и время каждого ответа в мс от старта. Счёт
     не берём из базы на веру — считаем сами по тем же примерам. */
  const MAX_RUN_ANSWERS = 80;
  const validateRun = (answers, times) => Array.isArray(answers) && Array.isArray(times)
    && answers.length === times.length && answers.length <= MAX_RUN_ANSWERS
    && answers.every(answer => typeof answer === 'string' && answer.length <= 16)
    && times.every((time, i) => Number.isFinite(time) && time >= 0 && time <= 61000 && (i === 0 || time >= times[i - 1]));

  const ghostProgressAt = (bits, times, ms) => {
    let score = 0;
    for (let i = 0; i < bits.length && i < times.length; i++) {
      if (times[i] > ms) break;
      if (bits[i]) score++;
    }
    return score;
  };

  const ghostResult = (bits, times, limitMs = DURATION_SEC * 1000) => {
    const counted = [];
    for (let i = 0; i < bits.length && i < times.length; i++) {
      if (times[i] > limitMs) break;
      counted.push(Boolean(bits[i]));
    }
    return { r: counted.filter(Boolean).length, q: counted.length, m: packMask(counted) };
  };

  // ── Таблица лидеров: правдоподобие попытки ──────────────────────────
  /* Счёт попытки считает сервер сам, по тем же примерам из зерна, — но
     ответы и время всё равно присылает браузер, и скрипт может прислать
     идеальную минуту. Полностью это не закрыть ничем, поэтому отсекаем
     то, что человеку не по силам:
       • потолок верных ответов за минуту — около уровня лучших взрослых
         вычислителей: робот, подогнанный под человека, в лучшем случае
         сравняется с чемпионом, но не уйдёт вперёд на недосягаемые 80;
       • между ответами хотя бы 0,25 с: прочитать пример и набрать ответ
         быстрее нельзя;
       • ровный, как метроном, темп: у людей время на пример «гуляет»
         (коэффициент вариации 0,3–0,6), у простого скрипта — нет.
     Попытка, не прошедшая проверку, сохраняется, но не попадает ни в
     таблицу, ни в соперники-записи. Потолки подобраны по оценке, а не по
     статистике: когда накопятся настоящие попытки, их стоит уточнить. */
  const MAX_CORRECT = {
    addsub2: { normal: 45, hard: 38, expert: 30 },
    addsub3: { normal: 40, hard: 28, expert: 22 },
    multdiv: { normal: 60, hard: 32, expert: 25 },
    fractions: { normal: 35, hard: 25, expert: 20 },
    decimals: { normal: 40, hard: 32, expert: 25 },
    negatives: { normal: 50, hard: 36, expert: 28 },
    mix: { normal: 45, hard: 32, expert: 25 }
  };
  const MIN_GAP_MS = 250;
  const MAX_FAST_GAPS = 2;
  const MIN_CV = 0.12;
  const CV_MIN_ANSWERS = 12;
  // Сколько сервер ждёт конца попытки: минута, отсчёт, медленная сеть.
  const RUN_MAX_ELAPSED_MS = 180000;
  const CLOCK_SLACK_MS = 5000;

  const maxCorrect = (cat, diff) => MAX_CORRECT[cat]?.[diff] ?? 0;

  /* bits — какие ответы верны (посчитано сервером), times — мс от начала
     минуты для каждого ответа, elapsedMs — сколько прошло между началом и
     концом попытки по часам сервера. Ответ: { ok, reason }. */
  const assessRun = ({ cat, diff, bits, times, elapsedMs }) => {
    if (!CATEGORIES.includes(cat) || !DIFFS.includes(diff)) return { ok: false, reason: 'category' };
    if (!Array.isArray(bits) || !Array.isArray(times) || bits.length !== times.length) return { ok: false, reason: 'shape' };
    if (!Number.isFinite(elapsedMs) || elapsedMs > RUN_MAX_ELAPSED_MS) return { ok: false, reason: 'late' };
    // Последний ответ не может прийти позже, чем закончилась попытка по часам сервера.
    if (times.length && times[times.length - 1] > elapsedMs + CLOCK_SLACK_MS) return { ok: false, reason: 'clock' };
    const correct = bits.filter(Boolean).length;
    if (correct > maxCorrect(cat, diff)) return { ok: false, reason: 'ceiling' };
    const gaps = times.map((time, i) => time - (i ? times[i - 1] : 0));
    if (gaps.filter(gap => gap < MIN_GAP_MS).length > MAX_FAST_GAPS) return { ok: false, reason: 'fast' };
    if (gaps.length >= CV_MIN_ANSWERS) {
      // Первый промежуток включает реакцию на старт — его не считаем.
      const rest = gaps.slice(1);
      const mean = rest.reduce((sum, gap) => sum + gap, 0) / rest.length;
      const variance = rest.reduce((sum, gap) => sum + (gap - mean) ** 2, 0) / rest.length;
      if (mean > 0 && Math.sqrt(variance) / mean < MIN_CV) return { ok: false, reason: 'steady' };
    }
    return { ok: true, reason: '' };
  };

  // Номер игрока для таблицы: случайный, в браузере, ничего о человеке не говорит.
  const PLAYER_PATTERN = /^[a-z0-9]{8,32}$/;
  const newPlayerId = (random = Math.random) => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const values = typeof crypto !== 'undefined' && crypto.getRandomValues
      ? Array.from(crypto.getRandomValues(new Uint8Array(16)))
      : Array.from({ length: 16 }, () => Math.floor(random() * 256));
    return values.map(value => alphabet[value % alphabet.length]).join('');
  };

  const PERIODS = ['week', 'all'];

  const newSeed = (random = Math.random) => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      return crypto.getRandomValues(new Uint32Array(1))[0];
    }
    return Math.floor(random() * 0x100000000) >>> 0;
  };

  const api = {
    VERSION,
    CATEGORIES,
    DIFFS,
    DURATION_SEC,
    NICK_MAX,
    NICK_PARTS,
    packMask,
    unpackMask,
    generateNick,
    avatarFor,
    sanitizeNick,
    hasResult,
    encodeChallenge,
    decodeChallenge,
    compareResults,
    pairWaiting,
    matchRole,
    validateRun,
    ghostProgressAt,
    ghostResult,
    MAX_RUN_ANSWERS,
    MAX_CORRECT,
    maxCorrect,
    assessRun,
    PLAYER_PATTERN,
    newPlayerId,
    PERIODS,
    newSeed
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof globalThis !== 'undefined') globalThis.MathTasksDuel = api;
})();
