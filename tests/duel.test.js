import { readFileSync } from "node:fs";
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

/* Ссылка появляется до своей минуты: вызвавший в ней — только ник, без
   счёта. Друг может сыграть первым, и тогда его результат едет обратно
   к ещё не сыгравшему вызвавшему. */
describe('дуэль: вызов до своей минуты', () => {
  it('ожидающий игрок едет в ссылке без счёта и возвращается ожидающим', () => {
    const back = decodeChallenge(encodeChallenge({ ...CHALLENGE, a: { n: 'Быстрая Лиса', pending: true } }));
    expect(back.a).toEqual({ n: 'Быстрая Лиса', pending: true });
    expect(duel.hasResult(back.a)).toBe(false);
    expect(duel.hasResult(CHALLENGE.a)).toBe(true);
    expect(duel.hasResult(null)).toBe(false);
  });

  it('ответ друга на ожидающий вызов сохраняет оба состояния', () => {
    const b = player('Ātrā Lapsa', [true, true, false]);
    const back = decodeChallenge(encodeChallenge({ ...CHALLENGE, a: { n: 'Кот', pending: true }, b }));
    expect(back.a.pending).toBe(true);
    expect(back.b).toEqual(b);
  });

  it('в ссылке ожидающего игрока нет ни счёта, ни маски', () => {
    const token = encodeChallenge({ ...CHALLENGE, a: { n: 'Кот', pending: true, r: 5, q: 5, m: 'zzz' } });
    const json = Buffer.from(token.split('.')[0], 'base64url').toString();
    expect(JSON.parse(json).a).toEqual({ n: 'Кот' });
  });
});

describe('дуэль: аватар', () => {
  it('зверь из генератора получает свой значок, свой ник — первую букву', () => {
    expect(duel.avatarFor('Быстрая Лиса')).toMatchObject({ text: '🦊', emoji: true });
    expect(duel.avatarFor('Ātrā Lapsa')).toMatchObject({ text: '🦊', emoji: true });
    expect(duel.avatarFor('māris k')).toMatchObject({ text: 'M', emoji: false });
    expect(duel.avatarFor('')).toMatchObject({ text: '?' });
  });

  it('оттенок одинаков для одного ника и лежит в круге', () => {
    const first = duel.avatarFor('Kaķis 2012');
    expect(first.hue).toBe(duel.avatarFor('Kaķis 2012').hue);
    expect(first.hue).toBeGreaterThanOrEqual(0);
    expect(first.hue).toBeLessThan(360);
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
    for (const nick of ['Сука', 'х у й', 'xyй', 'Fuck you', 'Pimpis', 'Гитлер', 'Debils Ezis', 'Kuce', 'Дебил', 'xep', 'Maita Lapsa', 'Cock', 'Урод 7']) {
      expect(sanitizeNick(nick), nick).toBe('');
    }
    // Похожие безобидные слова остаются: корни ловятся только в начале слова.
    for (const nick of ['Лохматый Кот', 'Analītiķis', 'Viltīgais Ūdrs', 'Passat 2']) {
      expect(sanitizeNick(nick), nick).toBe(nick);
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

describe('дуэль: случайный соперник', () => {
  const players = [{ id: 'c', at: 30 }, { id: 'a', at: 10 }, { id: 'b', at: 20 }, { id: 'd', at: 20 }];

  it('пары одинаковы на любом устройстве: по времени входа, при равенстве — по id', () => {
    expect(duel.pairWaiting(players)).toEqual([['a', 'b'], ['d', 'c']]);
    expect(duel.pairWaiting([...players].reverse())).toEqual([['a', 'b'], ['d', 'c']]);
  });

  it('роль: первый в паре ведёт, второй подтверждает, лишний ждёт', () => {
    expect(duel.matchRole(players, 'a')).toEqual({ role: 'host', partner: 'b' });
    expect(duel.matchRole(players, 'c')).toEqual({ role: 'guest', partner: 'd' });
    expect(duel.matchRole([{ id: 'x', at: 1 }], 'x')).toBeNull();
    expect(duel.matchRole(players, 'zzz')).toBeNull();
  });

  it('запись проверяется до показа', () => {
    expect(duel.validateRun(['12', '3/4'], [1500, 4200])).toBe(true);
    expect(duel.validateRun(['12'], [1500, 4200])).toBe(false);
    expect(duel.validateRun(['12', '5'], [4200, 1500])).toBe(false);
    expect(duel.validateRun(['1'.repeat(17)], [100])).toBe(false);
    expect(duel.validateRun(Array(81).fill('1'), Array(81).fill(100))).toBe(false);
    expect(duel.validateRun(['1'], [70000])).toBe(false);
  });

  it('счёт записи растёт по её собственному времени', () => {
    const bits = [true, false, true, true];
    const times = [2000, 4000, 7000, 12000];
    expect(duel.ghostProgressAt(bits, times, 1000)).toBe(0);
    expect(duel.ghostProgressAt(bits, times, 5000)).toBe(1);
    expect(duel.ghostProgressAt(bits, times, 60000)).toBe(3);
  });

  it('итог записи считается только в пределах минуты', () => {
    const result = duel.ghostResult([true, true, false, true], [1000, 30000, 59000, 60500]);
    expect(result).toMatchObject({ r: 2, q: 3 });
    expect(duel.unpackMask(result.m, result.q)).toEqual([true, true, false]);
  });
});

describe('дуэль: правдоподобие попытки для таблицы лидеров', () => {
  // Человеческий темп: промежутки 1,2–3,2 с, «гуляют» от примера к примеру.
  const humanTimes = count => {
    const times = [];
    let at = 900;
    for (let i = 0; i < count; i++) {
      at += 1200 + ((i * 7919) % 11) * 200;
      times.push(at);
    }
    return times;
  };
  const run = (bits, times, extra = {}) => duel.assessRun({ cat: 'multdiv', diff: 'normal', bits, times, elapsedMs: 61500, ...extra });

  it('обычная минута проходит', () => {
    const times = humanTimes(24);
    expect(run(times.map((_, i) => i % 7 !== 3), times)).toEqual({ ok: true, reason: '' });
  });

  it('больше верных, чем под силу человеку, — нет', () => {
    const times = Array.from({ length: 61 }, (_, i) => 600 + i * 950 + (i % 3) * 180);
    expect(run(Array(61).fill(true), times)).toMatchObject({ ok: false, reason: 'ceiling' });
    expect(duel.maxCorrect('fractions', 'expert')).toBeLessThan(duel.maxCorrect('fractions', 'normal'));
  });

  it('потолок задан для каждой категории и сложности', () => {
    for (const cat of duel.CATEGORIES) {
      for (const diff of duel.DIFFS) {
        expect(duel.maxCorrect(cat, diff)).toBeGreaterThan(10);
        expect(duel.maxCorrect(cat, diff)).toBeLessThan(duel.MAX_RUN_ANSWERS);
      }
    }
  });

  it('ответы чаще, чем раз в четверть секунды, — нет', () => {
    const times = humanTimes(20);
    for (const i of [5, 9, 14]) times[i] = times[i - 1] + 120;
    for (let i = 1; i < times.length; i++) times[i] = Math.max(times[i], times[i - 1]);
    expect(run(Array(20).fill(true), times)).toMatchObject({ ok: false, reason: 'fast' });
  });

  it('ровный, как метроном, темп — нет', () => {
    const times = Array.from({ length: 30 }, (_, i) => 1000 + i * 1800);
    expect(run(Array(30).fill(true), times)).toMatchObject({ ok: false, reason: 'steady' });
  });

  it('ответ позже конца попытки по часам сервера — нет', () => {
    const times = humanTimes(20);
    expect(run(Array(20).fill(true), times, { elapsedMs: times.at(-1) - 6000 })).toMatchObject({ ok: false, reason: 'clock' });
    expect(run(Array(20).fill(true), times, { elapsedMs: times.at(-1) - 2000 }).ok).toBe(true);
  });

  it('попытка, законченная через три минуты, — нет', () => {
    const times = humanTimes(10);
    expect(run(Array(10).fill(true), times, { elapsedMs: 200000 })).toMatchObject({ ok: false, reason: 'late' });
  });

  it('номер игрока — случайные латинские буквы и цифры', () => {
    const id = duel.newPlayerId();
    expect(id).toMatch(duel.PLAYER_PATTERN);
    expect(duel.newPlayerId()).not.toBe(id);
  });
});

describe('миграция записей дуэлей', () => {
  const sql = readFileSync(new URL('../supabase/migrations/028_duel_runs.sql', import.meta.url), 'utf8');
  const grants = sql.slice(sql.indexOf('revoke all on function'));

  it('таблица закрыта: RLS включён, писать можно только через функции', () => {
    expect(sql).toMatch(/alter table public\.duel_runs enable row level security/);
    expect(sql).not.toMatch(/create policy/i);
  });

  it('функции security definer — с пустым search_path', () => {
    const definers = sql.match(/security definer[^\n]*/gi) || [];
    expect(definers.length).toBeGreaterThanOrEqual(7);
    for (const line of definers) expect(line).toMatch(/set search_path = ''/);
  });

  it('записывать попытки может только служебная роль воркера, а не браузер', () => {
    const writers = ['duel_run_start', 'duel_run_load', 'duel_run_save', 'duel_run_place'];
    const statements = grants.split(';').map(text => text.trim());
    const revoke = statements.find(text => text.startsWith('revoke all'));
    const toPublic = statements.filter(text => text.startsWith('grant') && /\bto anon\b|\bto authenticated\b/.test(text)).join('\n');
    const toService = statements.find(text => text.startsWith('grant') && /to service_role$/.test(text));
    for (const name of writers) {
      expect(revoke).toContain(name);
      expect(toPublic).not.toContain(name);
      expect(toService).toContain(name);
    }
  });

  it('таблицу и соперников-записи видят все, скрыть запись может только администратор', () => {
    expect(grants).toMatch(/duel_ghost\(text, text, int, int, bigint\[\]\), public\.duel_leaderboard\(text, text, text\)\s+to anon, authenticated/);
    expect(sql).toMatch(/if not public\.is_admin\(\) then raise exception/);
  });

  it('в таблице — лучшая попытка каждого игрока, двадцать мест, скрытые не показываются', () => {
    const board = sql.slice(sql.indexOf('create or replace function public.duel_leaderboard'), sql.indexOf('create or replace function public.duel_run_place'));
    expect(board).toMatch(/distinct on \(coalesce\(r\.player, r\.id::text\)\)/);
    expect(board).toMatch(/r\.ranked and not r\.hidden/);
    expect(board).toMatch(/limit 20/);
    expect(board).toMatch(/Europe\/Riga/);
  });

  it('соперником-записью становится только проверенная попытка', () => {
    const ghost = sql.slice(sql.indexOf('create or replace function public.duel_ghost'), sql.indexOf('create or replace function public.duel_leaderboard'));
    expect(ghost).toMatch(/verified and not hidden/);
  });

  it('ни почты, ни адреса, ни устройства — только ник, номер игрока, ответы и время', () => {
    const table = sql.match(/create table[\s\S]*?\);/i)[0].toLowerCase();
    for (const word of ['email', 'device', 'ip ', 'ip_', 'user_id', 'user_agent']) expect(table).not.toContain(word);
  });
});
