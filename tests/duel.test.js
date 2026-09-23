import { describe, it, expect } from 'vitest';
import duel from '../public/duel.js';

const { packMask, unpackMask, generateNick, sanitizeNick, encodeChallenge, decodeChallenge, compareResults } = duel;

const player = (n, bits) => ({ n, r: bits.filter(Boolean).length, q: bits.length, m: packMask(bits) });
const CHALLENGE = { g: 1, s: 123456789, c: 'multdiv', d: 'hard', a: player('Быстрая Лиса', [true, true, false, true]) };

describe('дуэль: ссылка', () => {
  it('вызов переживает кодирование и раскодирование', () => {
    const back = decodeChallenge(encodeChallenge(CHALLENGE));
    expect(back).toMatchObject({ g: 1, s: 123456789, c: 'multdiv', d: 'hard', b: null });
    expect(back.a).toEqual(CHALLENGE.a);
  });

  it('ответ друга едет в той же ссылке', () => {
    const b = player('Ātrā Lapsa', [true, false, true, true, true]);
    const back = decodeChallenge(encodeChallenge({ ...CHALLENGE, b }));
    expect(back.b).toEqual(b);
  });

  it('понимает решётку и старый префикс в начале', () => {
    const token = encodeChallenge(CHALLENGE);
    expect(decodeChallenge(`#${token}`)).not.toBeNull();
    expect(decodeChallenge(`d=${token}`)).not.toBeNull();
  });

  it('побитая ссылка — null, а не ошибка', () => {
    const token = encodeChallenge(CHALLENGE);
    expect(decodeChallenge(token.slice(0, -3))).toBeNull();
    expect(decodeChallenge(token.slice(5))).toBeNull();
    expect(decodeChallenge('')).toBeNull();
    expect(decodeChallenge('мусор.123')).toBeNull();
  });

  it('невозможные числа в ссылке отбрасываются', () => {
    const tamper = patch => {
      const json = JSON.stringify({ v: 1, g: 1, s: 1, c: 'multdiv', d: 'hard', a: CHALLENGE.a, ...patch });
      const body = Buffer.from(json).toString('base64url');
      let hash = 0x811c9dc5;
      for (const byte of Buffer.from(json)) { hash ^= byte; hash = Math.imul(hash, 0x01000193) >>> 0; }
      return decodeChallenge(`${body}.${hash.toString(36)}`);
    };
    expect(tamper({})).not.toBeNull();
    expect(tamper({ c: 'logs' })).toBeNull();
    expect(tamper({ d: 'insane' })).toBeNull();
    expect(tamper({ a: { ...CHALLENGE.a, r: 99 } })).toBeNull();
    expect(tamper({ a: { ...CHALLENGE.a, q: 100000, r: 3 } })).toBeNull();
    expect(tamper({ v: 2 })).toBeNull();
  });

  it('грубый ник в чужой ссылке стирается, а не показывается', () => {
    const back = decodeChallenge(encodeChallenge({ ...CHALLENGE, a: { ...CHALLENGE.a, n: 'сука' } }));
    expect(back.a.n).toBe('');
  });
});

describe('дуэль: маска верных ответов', () => {
  it('упаковка обратима при любой длине', () => {
    for (const length of [0, 1, 5, 6, 7, 40, 121]) {
      const bits = Array.from({ length }, (_, i) => (i * 7) % 3 === 0);
      expect(unpackMask(packMask(bits), length)).toEqual(bits);
    }
  });

  it('маска короче заявленного числа примеров — ошибка', () => {
    expect(unpackMask('A', 12)).toBeNull();
    expect(unpackMask('!!', 3)).toBeNull();
  });
});

describe('дуэль: ники', () => {
  it('генератор согласует род на обоих языках', () => {
    let seed = 1;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 200; i++) {
      const ru = generateNick('ru', random);
      expect(ru).toMatch(/^\S+ \S+$/);
      if (/^(Лиса|Сова|Выдра|Белка|Рысь|Черепаха|Панда|Чайка)$/.test(ru.split(' ')[1])) expect(ru).toMatch(/ая /);
      const lv = generateNick('lv', random);
      if (/^(Lapsa|Pūce|Vāvere|Panda|Kaija|Zebiekste)$/.test(lv.split(' ')[1])) expect(lv.split(' ')[0]).not.toMatch(/ais$/);
      expect(sanitizeNick(ru)).toBe(ru);
      expect(sanitizeNick(lv)).toBe(lv);
    }
  });

  it('ни один ник из генератора не режется фильтром и не длиннее предела', () => {
    for (const lang of ['ru', 'lv']) {
      const { animals, adjectives } = duel.NICK_PARTS[lang];
      for (const [animal, gender] of animals) {
        for (const [m, f] of adjectives) {
          const nick = `${gender === 'f' ? f : m} ${animal}`;
          expect(sanitizeNick(nick), nick).toBe(nick);
        }
      }
    }
  });

  it('обычный ник проходит, латышские буквы сохраняются', () => {
    expect(sanitizeNick('  Māris   K ')).toBe('Māris K');
    expect(sanitizeNick('Аня-2012')).toBe('Аня-2012');
  });

  it('мусор, эмодзи и невидимые символы вычищаются', () => {
    expect(sanitizeNick('Кот<script>')).toBe('Котscript');
    expect(sanitizeNick('Лиса‍🦊')).toBe('Лиса');
    expect(sanitizeNick('а')).toBe('');
  });

  it('контакты не пропускаются', () => {
    expect(sanitizeNick('anna@inbox.lv')).toBe('');
    expect(sanitizeNick('+371 2912 3456')).toBe('');
    expect(sanitizeNick('www.site.com')).toBe('');
  });

  it('грубые слова ловятся и в маскировке', () => {
    for (const nick of ['Сука', 'х у й', 'xyй', 'Fuck you', 'Pimpis', 'Гитлер']) {
      expect(sanitizeNick(nick), nick).toBe('');
    }
  });

  it('длина ограничена', () => {
    expect(sanitizeNick('Оченьоченьдлинныйник123').length).toBeLessThanOrEqual(duel.NICK_MAX);
  });
});

describe('дуэль: кто победил', () => {
  it('больше верных — победа', () => {
    expect(compareResults(player('A', [true, true, true]), player('B', [true, false, true])).winner).toBe('a');
  });

  it('при равенстве верных побеждает тот, кто меньше ошибался', () => {
    expect(compareResults(player('A', [true, true, false, false]), player('B', [true, true, false])).winner).toBe('b');
  });

  it('полное равенство — ничья', () => {
    expect(compareResults(player('A', [true, false]), player('B', [false, true])).winner).toBe('tie');
  });

  it('находит примеры, где ошиблись оба', () => {
    const result = compareResults(player('A', [true, false, false, true]), player('B', [false, false, true]));
    expect(result.bothWrong).toEqual([1]);
  });
});
