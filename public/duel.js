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
  const fnv1a = text => {
    let hash = 0x811c9dc5;
    for (const byte of new TextEncoder().encode(text)) {
      hash ^= byte;
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash;
  };
  const checksum = text => fnv1a(text).toString(36);

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
  /* Звери на выбор (Н3): игрок может сам выбрать аватар из этого набора.
     Своих картинок нет — только ключ, латиницей: его хранят профиль,
     ссылка на вызов и попытка в базе (миграция 031). Первые двадцать —
     те же, что в генераторе ников. */
  const AVATARS = [
    ['fox', '🦊'], ['cat', '🐱'], ['owl', '🦉'], ['hedgehog', '🦔'], ['badger', '🦡'], ['otter', '🦦'],
    ['squirrel', '🐿️'], ['wolf', '🐺'], ['rabbit', '🐰'], ['lynx', '🐈'], ['moose', '🫎'], ['penguin', '🐧'],
    ['dolphin', '🐬'], ['turtle', '🐢'], ['panda', '🐼'], ['raccoon', '🦝'], ['beaver', '🦫'], ['eagle', '🦅'],
    ['gull', '🐦'], ['whale', '🐳'], ['tiger', '🐯'], ['lion', '🦁'], ['bear', '🐻'], ['koala', '🐨'],
    ['frog', '🐸'], ['octopus', '🐙'], ['shark', '🦈'], ['bee', '🐝'], ['butterfly', '🦋'], ['ladybug', '🐞'],
    ['parrot', '🦜'], ['flamingo', '🦩'], ['peacock', '🦚'], ['dragon', '🐲'], ['trex', '🦖'], ['unicorn', '🦄'],
    ['horse', '🐴'], ['zebra', '🦓'], ['giraffe', '🦒'], ['elephant', '🐘'], ['hamster', '🐹'], ['mouse', '🐭'],
    ['dog', '🐶'], ['monkey', '🐵'], ['crab', '🦀'], ['snail', '🐌'], ['robot', '🤖'], ['ghost', '👻']
  ];
  const AVATAR_ICONS = new Map(AVATARS);
  // Чужой ключ (из ссылки, из базы) — только из набора, иначе пусто.
  const sanitizeAvatar = id => (AVATAR_ICONS.has(String(id ?? '')) ? String(id) : '');

  // avatar — выбранный зверь; не выбран — как раньше, по нику.
  const avatarFor = (nick, avatar = '') => {
    const text = String(nick || '').trim();
    let hash = 0;
    for (const char of text) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
    const hue = hash % 360;
    if (AVATAR_ICONS.has(avatar)) return { text: AVATAR_ICONS.get(avatar), emoji: true, hue, id: avatar };
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

  // ── Лесенка ─────────────────────────────────────────────────────────
  /* Сложность в дуэли не выбирается: первые примеры базовые, дальше
     продвинутые, потом экспертные. Все стартуют одинаково, а разница
     видна по тому, как далеко ученик забрался за минуту, — и таблица
     лидеров одна на категорию, а не три. Ступень считается по номеру
     примера, а не по верным ответам: у соперников и у сервера
     последовательность одна и та же. */
  const LADDER = 'ladder';
  const LADDER_VERSION = 1;
  const LADDER_TIERS = [['normal', 8], ['hard', 10], ['expert', Infinity]];

  /* Поколение попытки: версия генераторов тренажёра вместе с версией
     лесенки. Сервер пересчитывает ответы по тем же примерам, поэтому
     записи другого поколения ни в соперники, ни в сравнение не идут. */
  const runGen = trainerVersion => Number(trainerVersion) * 10 + LADDER_VERSION;

  const tierAt = index => {
    let from = 0;
    for (let i = 0; i < LADDER_TIERS.length; i++) {
      const [diff, size] = LADDER_TIERS[i];
      if (index < from + size) return { diff, step: i + 1, from };
      from += size;
    }
    const last = LADDER_TIERS[LADDER_TIERS.length - 1];
    return { diff: last[0], step: LADDER_TIERS.length, from };
  };
  const tierReached = attempts => tierAt(Math.max(0, Number(attempts) - 1));

  /* Примеры минуты: по ступеням, каждая со своим зерном — с одним зерном
     ступени шли бы по одной дорожке случайности. trainer — генераторы
     тренажёра (MathTasksTrainer): duel.js сам от них не зависит. */
  const ladderQuestions = (trainer, cat, seed, count) => {
    const out = [];
    LADDER_TIERS.forEach(([diff, size], i) => {
      const need = Math.min(size, count - out.length);
      if (need <= 0) return;
      const tierSeed = ((Number(seed) >>> 0) + i * 0x9E3779B1) >>> 0;
      for (const q of trainer.generateBatch(cat, need, diff, 'basic', { seed: tierSeed })) {
        q.index = out.length;
        q.id = out.length + 1;
        q.tier = diff;
        out.push(q);
      }
    });
    return out;
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
    const v = sanitizeAvatar(player.v);
    const withAvatar = data => (v ? { ...data, v } : data);
    if (r === undefined && q === undefined && m === undefined) return withAvatar({ n, pending: true });
    if (!isCount(q) || !isCount(r) || r > q) return null;
    const bits = unpackMask(m, q);
    if (!bits || bits.filter(Boolean).length !== r) return null;
    return withAvatar({ n, r, q, m: String(m) });
  };

  const packPlayer = player => {
    const packed = player.pending ? { n: player.n } : { n: player.n, r: player.r, q: player.q, m: player.m };
    const v = sanitizeAvatar(player.v);
    return v ? { ...packed, v } : packed;
  };

  /* Сложности в ссылке больше нет — лесенка у всех одна. Поле d осталось
     для старых ссылок: их отсеет поколение g. */
  const encodeChallenge = challenge => {
    const payload = {
      v: VERSION,
      g: challenge.g,
      s: challenge.s >>> 0,
      c: challenge.c,
      a: packPlayer(challenge.a)
    };
    if (challenge.d) payload.d = challenge.d;
    if (challenge.b) payload.b = packPlayer(challenge.b);
    const json = JSON.stringify(payload);
    return `${toBase64Url(json)}.${checksum(json)}`;
  };

  /* null — ссылка побита или собрана с ошибкой. Поколение g сверяет
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
      if (!CATEGORIES.includes(data.c)) return null;
      if (data.d !== undefined && !DIFFS.includes(data.d)) return null;
      const a = normalizePlayer(data.a);
      if (!a) return null;
      const b = data.b === undefined ? null : normalizePlayer(data.b);
      if (data.b !== undefined && !b) return null;
      return { v: data.v, g: data.g, s: data.s, c: data.c, d: data.d ?? null, a, b };
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
  /* Лесенка: восемь базовых, десять продвинутых, дальше экспертные —
     чемпион при секунде на базовый, двух на продвинутый и трёх с
     половиной на экспертный набирает около 28. */
  const MAX_CORRECT = {
    addsub2: { normal: 45, hard: 38, expert: 30, ladder: 36 },
    addsub3: { normal: 40, hard: 28, expert: 22, ladder: 30 },
    multdiv: { normal: 60, hard: 32, expert: 25, ladder: 40 },
    fractions: { normal: 35, hard: 25, expert: 20, ladder: 28 },
    decimals: { normal: 40, hard: 32, expert: 25, ladder: 32 },
    negatives: { normal: 50, hard: 36, expert: 28, ladder: 38 },
    mix: { normal: 45, hard: 32, expert: 25, ladder: 34 }
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
    if (!CATEGORIES.includes(cat) || !(DIFFS.includes(diff) || diff === LADDER)) return { ok: false, reason: 'category' };
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

  // ── Дуэль дня ───────────────────────────────────────────────────────
  /* Одни и те же примеры для всех на сутки в каждой категории (Н2). Зерно
     дня не хранится нигде: его одинаково считают браузер и воркер из
     категории и даты по рижскому времени. В базе попытка дня отличается от
     обычной только этим зерном — случайное зерно с ним практически не
     совпадёт (одно на четыре миллиарда). */
  const DAY_ZONE = 'Europe/Riga';
  const rigaDayKey = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: DAY_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(date)
      .reduce((out, part) => ({ ...out, [part.type]: part.value }), {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  };
  // «2026-09-28» на days дней вперёд или назад — арифметика по UTC, без часовых поясов.
  const shiftDayKey = (dayKey, days) => {
    const [y, m, d] = String(dayKey).split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
  };
  const daySeed = (cat, dayKey) => fnv1a(`daily:${LADDER_VERSION}:${cat}:${dayKey}`);
  /* День попытки по её зерну: сегодня или вчера (минута, начатая в 23:59,
     заканчивается уже завтра). null — обычная попытка. */
  const dailySeedDay = (cat, seed, now = new Date()) => {
    const today = rigaDayKey(now);
    for (const day of [today, shiftDayKey(today, -1)]) {
      if (daySeed(cat, day) === (Number(seed) >>> 0)) return day;
    }
    return null;
  };
  /* Таблица дня: одна строка на игрока, лучше — больше верных, при равенстве
     меньше примеров, потом кто раньше. Строки без номера игрока не
     склеиваются между собой. */
  const dailyBoard = (rows, limit = 20) => {
    const best = new Map();
    const better = (a, b) => (Number(b.correct) - Number(a.correct))
      || (Number(a.attempted) - Number(b.attempted))
      || String(a.finished_at || '').localeCompare(String(b.finished_at || ''));
    for (const row of rows || []) {
      if (!row || !Number.isFinite(Number(row.correct))) continue;
      const key = row.player ? `p:${row.player}` : `r:${row.id}`;
      const known = best.get(key);
      if (!known || better(row, known) < 0) best.set(key, row);
    }
    return [...best.values()].sort(better).slice(0, limit).map((row, i) => ({
      place: i + 1,
      id: Number(row.id),
      nick: row.nick ?? null,
      avatar: sanitizeAvatar(row.avatar),
      correct: Number(row.correct),
      attempted: Number(row.attempted)
    }));
  };
  const dailyPlaceOf = (board, runId) => (board || []).find(row => row.id === Number(runId))?.place ?? null;

  // ── Картинка итога (Н4) ─────────────────────────────────────────────
  /* «🏆 Победа! 18 : 12» — квадрат 1080×1080: одинаково ложится в
     переписку и ленту. Здесь только данные и раскладка, рисует страница
     на canvas (duel-page.js). Все тексты приходят переведёнными в labels. */
  const SHARE_SIZE = 1080;
  const SHARE_KINDS = ['win', 'lose', 'tie', 'solo', 'daily', 'pending'];
  // Фон — как у итога на странице: зелёный, розовый, сиреневый, синий, янтарный.
  const SHARE_COLORS = {
    win: { from: '#dcfce7', to: '#a7f3d0', ink: '#14532d', accent: '#16a34a' },
    lose: { from: '#fee2e2', to: '#fecdd3', ink: '#7f1d1d', accent: '#e11d48' },
    tie: { from: '#e0e7ff', to: '#ddd6fe', ink: '#312e81', accent: '#6d28d9' },
    solo: { from: '#dbeafe', to: '#ede9fe', ink: '#1e3a8a', accent: '#4f46e5' },
    daily: { from: '#fef3c7', to: '#fed7aa', ink: '#78350f', accent: '#d97706' },
    pending: { from: '#ede9fe', to: '#dbeafe', ink: '#3b0764', accent: '#7c3aed' }
  };
  const ellipsize = (text, max = 14) => {
    const chars = [...String(text || '').trim()];
    return chars.length > max ? `${chars.slice(0, max - 1).join('').trimEnd()}…` : chars.join('');
  };
  /* kind — исход; me и them — { n, v, r } (them для одиночной минуты нет).
     labels: { brand, site, heading, correct, sub, footer } — строки страницы. */
  const shareCard = ({ kind, me, them = null, labels = {} }) => {
    const safeKind = SHARE_KINDS.includes(kind) ? kind : 'solo';
    const versus = Boolean(them) && !['solo', 'daily'].includes(safeKind);
    const players = versus ? [me, them] : [me];
    return {
      kind: safeKind,
      brand: String(labels.brand || 'MathTasks'),
      heading: String(labels.heading || ''),
      score: versus ? `${Number(me?.r) || 0} : ${Number(them?.r) || 0}` : String(Number(me?.r) || 0),
      correct: versus ? '' : String(labels.correct || ''),
      sub: String(labels.sub || ''),
      footer: String(labels.footer || labels.site || 'mathtasks.lv/duel'),
      names: players.map(player => ellipsize(player?.n || '')),
      avatars: players.map(player => avatarFor(player?.n || '', player?.v || ''))
    };
  };
  // Раскладка в пикселях квадрата: фон, тексты, аватары. Ничего не выходит за край.
  const shareLayout = card => {
    const S = SHARE_SIZE;
    const colors = SHARE_COLORS[card.kind] || SHARE_COLORS.solo;
    const ops = [{ op: 'bg', from: colors.from, to: colors.to, accent: colors.accent }];
    const text = (value, y, size, weight = 800, extra = {}) => {
      if (value) ops.push({ op: 'text', text: value, x: S / 2, y, size, weight, align: 'center', color: colors.ink, ...extra });
    };
    text(card.brand, 110, 38, 700, { opacity: 0.75 });
    text(ellipsize(card.heading, 26), 230, card.heading.length > 18 ? 70 : 88);
    const two = card.avatars.length === 2;
    const xs = two ? [310, 770] : [S / 2];
    card.avatars.forEach((avatar, i) => {
      ops.push({ op: 'avatar', x: xs[i], y: 450, r: 112, avatar });
      text(card.names[i], 640, 44, 700, { x: xs[i] });
    });
    if (two) text('⚔️', 460, 72, 400);
    text(card.score, 820, two ? 150 : 190);
    text(card.correct, 900, 40, 700, { opacity: 0.8 });
    text(ellipsize(card.sub, 44), two ? 915 : 960, 36, 600, { opacity: 0.85 });
    text(card.footer, 1025, 32, 700, { color: colors.accent });
    return ops;
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
    LADDER,
    LADDER_VERSION,
    LADDER_TIERS,
    runGen,
    tierAt,
    tierReached,
    ladderQuestions,
    DURATION_SEC,
    NICK_MAX,
    NICK_PARTS,
    packMask,
    unpackMask,
    generateNick,
    avatarFor,
    AVATARS,
    sanitizeAvatar,
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
    rigaDayKey,
    shiftDayKey,
    daySeed,
    dailySeedDay,
    dailyBoard,
    dailyPlaceOf,
    SHARE_SIZE,
    SHARE_COLORS,
    ellipsize,
    shareCard,
    shareLayout,
    newSeed
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof globalThis !== 'undefined') globalThis.MathTasksDuel = api;
})();
