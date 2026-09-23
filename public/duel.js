/* Дуэль на устный счёт по ссылке — чистые функции.

   Вся дуэль живёт в ссылке: зерно генератора, категория, сложность и
   результаты игроков. Сервер и база не нужны, аккаунт тоже: друг
   открывает ссылку, решает те же примеры (одно зерно — одни примеры на
   любом устройстве) и видит сравнение. Состояние кладётся во фрагмент
   адреса (#…) — он не уходит на сервер, так что ник ребёнка не попадает
   ни в логи, ни в аналитику.

   Подделать счёт в ссылке можно. Для дружеской дуэли это не важно:
   выигрыш ничего не даёт за пределами пары друзей. Контрольная сумма
   здесь только отсекает ссылки, побитые при копировании. Понадобится
   общая таблица результатов — понадобится и подпись на сервере. */
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
     выдумывать — и нечего выдать о себе. */
  const NICK_PARTS = {
    ru: {
      animals: [['Лиса', 'f'], ['Кот', 'm'], ['Сова', 'f'], ['Ёж', 'm'], ['Барсук', 'm'], ['Выдра', 'f'], ['Белка', 'f'],
        ['Волк', 'm'], ['Заяц', 'm'], ['Рысь', 'f'], ['Лось', 'm'], ['Пингвин', 'm'], ['Дельфин', 'm'], ['Черепаха', 'f'],
        ['Панда', 'f'], ['Енот', 'm'], ['Бобр', 'm'], ['Орёл', 'm'], ['Чайка', 'f'], ['Кит', 'm']],
      adjectives: [['Быстрый', 'Быстрая'], ['Хитрый', 'Хитрая'], ['Смелый', 'Смелая'], ['Весёлый', 'Весёлая'],
        ['Мудрый', 'Мудрая'], ['Ловкий', 'Ловкая'], ['Зоркий', 'Зоркая'], ['Шустрый', 'Шустрая'], ['Храбрый', 'Храбрая'],
        ['Точный', 'Точная'], ['Юркий', 'Юркая'], ['Упорный', 'Упорная']]
    },
    lv: {
      animals: [['Lapsa', 'f'], ['Kaķis', 'm'], ['Pūce', 'f'], ['Ezis', 'm'], ['Āpsis', 'm'], ['Ūdrs', 'm'], ['Vāvere', 'f'],
        ['Vilks', 'm'], ['Zaķis', 'm'], ['Lūsis', 'm'], ['Alnis', 'm'], ['Pingvīns', 'm'], ['Delfīns', 'm'], ['Panda', 'f'],
        ['Jenots', 'm'], ['Bebrs', 'm'], ['Ērglis', 'm'], ['Kaija', 'f'], ['Zebiekste', 'f'], ['Valis', 'm']],
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

  /* Грубые слова ищем после приведения похожих латинских букв и цифр к
     кириллице и выбрасывания пробелов: «х у й», «xyй», «6ля» — всё одно. */
  const LOOKALIKES = { a: 'а', b: 'в', c: 'с', e: 'е', h: 'н', k: 'к', m: 'м', o: 'о', p: 'р', t: 'т', x: 'х', y: 'у', 3: 'з', 0: 'о', 6: 'б', 4: 'ч' };
  const BLOCKED_CYRILLIC = ['хуй', 'хуе', 'хуё', 'хуя', 'пизд', 'ебал', 'ебан', 'ебат', 'еблан', 'бля', 'сука', 'суки', 'мудак',
    'гандон', 'пидор', 'пидар', 'педик', 'шлюх', 'залуп', 'дроч', 'говн', 'срать', 'нацист', 'гитлер'];
  const BLOCKED_LATIN = ['fuck', 'shit', 'bitch', 'cunt', 'nigg', 'porn', 'pimpis', 'pizda', 'dirsa',
    'mauka', 'pedik', 'pidar', 'hitler', 'nazi'];
  /* Короткие корни встречаются внутри безобидных ников («Viltīgais Ūdrs»
     без пробела даёт «…aisūdrs»), поэтому их ищем только в начале слова. */
  const BLOCKED_WORD_START = ['sūd', 'sud', 'sex', 'kill', 'fag', 'dick', 'ёб', 'жоп'];

  const looksBlocked = text => {
    const lower = text.toLowerCase();
    const plain = lower.replace(/[\s\-_.]/g, '');
    if (BLOCKED_LATIN.some(word => plain.includes(word))) return true;
    const cyr = [...plain].map(char => LOOKALIKES[char] || char).join('');
    if (BLOCKED_CYRILLIC.some(word => cyr.includes(word) || plain.includes(word))) return true;
    return lower.split(/[\s\-_.]+/).some(word => BLOCKED_WORD_START.some(root => word.startsWith(root)));
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

  const normalizePlayer = player => {
    if (!player || typeof player !== 'object') return null;
    const { r, q, m } = player;
    if (!isCount(q) || !isCount(r) || r > q) return null;
    const bits = unpackMask(m, q);
    if (!bits || bits.filter(Boolean).length !== r) return null;
    // Ник из чужой ссылки проверяем заново: ссылку могли собрать руками.
    return { n: sanitizeNick(player.n), r, q, m: String(m) };
  };

  const encodeChallenge = challenge => {
    const payload = {
      v: VERSION,
      g: challenge.g,
      s: challenge.s >>> 0,
      c: challenge.c,
      d: challenge.d,
      a: challenge.a
    };
    if (challenge.b) payload.b = challenge.b;
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
    sanitizeNick,
    encodeChallenge,
    decodeChallenge,
    compareResults,
    newSeed
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof globalThis !== 'undefined') globalThis.MathTasksDuel = api;
})();
