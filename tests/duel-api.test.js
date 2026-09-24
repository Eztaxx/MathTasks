import { describe, it, expect, vi, afterEach } from 'vitest';
import { duelApi, duelConfig, scoreRun, BATCH } from '../worker/duel-api.js';
import worker from '../worker/index.js';

const T = globalThis.MathTasksTrainer;

const ENV = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
  TURNSTILE_SECRET_KEY: 'turnstile-secret',
  TURNSTILE_SITE_KEY: '0x4AAAAsite'
};
const ORIGIN = 'https://mathtasks.lv';
const SEED = 424242;

const post = (path, body, headers = {}) => new Request(`${ORIGIN}${path}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: ORIGIN, ...headers },
  body: JSON.stringify(body)
});

// Человеческий темп: промежутки «гуляют» от 1,2 до 3,2 с.
const humanTimes = count => {
  const times = [];
  let at = 900;
  for (let i = 0; i < count; i++) {
    at += 1200 + ((i * 7919) % 11) * 200;
    times.push(at);
  }
  return times;
};

/* Поддельная база и Turnstile: запоминаем, что воркер туда отправил. */
const mockBackend = ({ row = {}, human = true, saved = true, place = 3 } = {}) => {
  const calls = [];
  const fetchMock = vi.fn(async (url, init = {}) => {
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url: String(url), headers: init.headers || {}, body });
    const reply = data => new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
    if (String(url).includes('turnstile')) return reply({ success: human });
    if (String(url).endsWith('/rpc/duel_run_start')) return reply(77);
    if (String(url).endsWith('/rpc/duel_run_load')) {
      return reply([{ id: 77, cat: 'multdiv', diff: 'normal', gen: T.GENERATOR_VERSION, seed: SEED, elapsed_ms: 61800, finished: false, ...row }]);
    }
    if (String(url).endsWith('/rpc/duel_run_save')) return reply(saved);
    if (String(url).endsWith('/rpc/duel_run_place')) return reply(place);
    return new Response('not found', { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return calls;
};

// Верные ответы на первые n примеров минуты с этим зерном, плюс одна ошибка.
const answersFor = (count, { wrongAt = 4 } = {}) => {
  const questions = T.generateBatch('multdiv', BATCH, 'normal', 'basic', { seed: SEED });
  return questions.slice(0, count).map((q, i) => (i === wrongAt ? `${q.answer}9` : String(q.answer)));
};

afterEach(() => vi.unstubAllGlobals());

describe('дуэли на сервере: настройка', () => {
  it('без ключей ничего не пишется, без Turnstile — нет таблицы', () => {
    expect(duelConfig({})).toMatchObject({ record: false, ranked: false, turnstile: null });
    expect(duelConfig({ SUPABASE_URL: 'x', SUPABASE_SERVICE_ROLE_KEY: 'y' })).toMatchObject({ record: true, ranked: false, turnstile: null });
    expect(duelConfig(ENV)).toMatchObject({ record: true, ranked: true, turnstile: ENV.TURNSTILE_SITE_KEY, gen: T.GENERATOR_VERSION });
  });

  it('страница получает только открытый ключ Turnstile, секретов в ответе нет', async () => {
    const response = await worker.fetch(new Request(`${ORIGIN}/api/duel/config`), ENV);
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(JSON.parse(text)).toMatchObject({ ranked: true, turnstile: ENV.TURNSTILE_SITE_KEY });
    expect(text).not.toContain(ENV.SUPABASE_SERVICE_ROLE_KEY);
    expect(text).not.toContain(ENV.TURNSTILE_SECRET_KEY);
  });

  it('пока ключей нет — «выключено», а не ошибка базы', async () => {
    const response = await duelApi(post('/api/duel/start', { cat: 'multdiv', diff: 'normal', gen: 1, seed: 1 }), {});
    expect(response.status).toBe(503);
  });
});

describe('дуэли на сервере: начало попытки', () => {
  it('записывает старт служебным ключом', async () => {
    const calls = mockBackend();
    const response = await duelApi(post('/api/duel/start', { cat: 'multdiv', diff: 'normal', gen: T.GENERATOR_VERSION, seed: SEED }), ENV);
    expect(await response.json()).toEqual({ run: 77 });
    expect(calls[0].url).toBe(`${ENV.SUPABASE_URL}/rest/v1/rpc/duel_run_start`);
    expect(calls[0].headers.Authorization).toBe(`Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`);
    expect(calls[0].body).toEqual({ p_cat: 'multdiv', p_diff: 'normal', p_gen: T.GENERATOR_VERSION, p_seed: SEED });
  });

  it('чужая категория, зерно или старая версия генераторов — отказ до базы', async () => {
    const calls = mockBackend();
    const bad = [
      [{ cat: 'algebra', diff: 'normal', gen: 1, seed: 1 }, 400],
      [{ cat: 'multdiv', diff: 'normal', gen: 1, seed: -1 }, 400],
      [{ cat: 'multdiv', diff: 'normal', gen: 1, seed: 2 ** 33 }, 400],
      [{ cat: 'multdiv', diff: 'normal', gen: T.GENERATOR_VERSION + 1, seed: 1 }, 409]
    ];
    for (const [body, status] of bad) {
      expect((await duelApi(post('/api/duel/start', body), ENV)).status).toBe(status);
    }
    expect(calls).toHaveLength(0);
  });

  it('запрос с чужого сайта отклоняется', async () => {
    const calls = mockBackend();
    const request = post('/api/duel/start', { cat: 'multdiv', diff: 'normal', gen: 1, seed: 1 }, { Origin: 'https://evil.example' });
    expect((await duelApi(request, ENV)).status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it('частые запросы с одного адреса упираются в счётчик', async () => {
    mockBackend();
    const env = { ...ENV, DUEL_LIMIT: { limit: vi.fn(async () => ({ success: false })) } };
    const response = await duelApi(post('/api/duel/start', { cat: 'multdiv', diff: 'normal', gen: 1, seed: 1 }, { 'CF-Connecting-IP': '203.0.113.5' }), env);
    expect(response.status).toBe(429);
    expect(env.DUEL_LIMIT.limit).toHaveBeenCalledWith({ key: 'start:203.0.113.5' });
  });

  it('только POST', async () => {
    expect((await duelApi(new Request(`${ORIGIN}/api/duel/start`), ENV)).status).toBe(405);
  });
});

describe('дуэли на сервере: конец попытки', () => {
  it('счёт считает сервер сам — по тем же примерам, что видел ученик', () => {
    const answers = answersFor(12);
    expect(scoreRun({ cat: 'multdiv', diff: 'normal', seed: SEED, answers }).filter(Boolean)).toHaveLength(11);
  });

  it('честная минута попадает в таблицу, место приходит сразу', async () => {
    const calls = mockBackend();
    const answers = answersFor(24);
    const times = humanTimes(24);
    const response = await duelApi(post('/api/duel/finish', {
      run: 77, nick: 'Быстрая Лиса', player: 'abcdef0123456789', answers, times, token: 'ok-token', correct: 80
    }), ENV);
    expect(await response.json()).toEqual({ correct: 23, attempted: 24, verified: true, ranked: true, place: 3, reason: '' });
    const save = calls.find(call => call.url.endsWith('/rpc/duel_run_save')).body;
    // Счёт из запроса (correct: 80) не используется — только пересчитанный.
    expect(save).toMatchObject({ p_run: 77, p_nick: 'Быстрая Лиса', p_player: 'abcdef0123456789', p_correct: 23, p_attempted: 24, p_verified: true, p_ranked: true });
    expect(calls.find(call => call.url.includes('turnstile')).body).toMatchObject({ secret: ENV.TURNSTILE_SECRET_KEY, response: 'ok-token' });
  });

  it('темп робота: попытка сохраняется, но в таблицу и в соперники не идёт', async () => {
    const calls = mockBackend();
    const answers = answersFor(40, { wrongAt: -1 });
    const times = answers.map((_, i) => 400 + i * 150);
    const response = await duelApi(post('/api/duel/finish', { run: 77, answers, times, token: 'ok-token' }), ENV);
    expect(await response.json()).toMatchObject({ verified: false, ranked: false, place: null, reason: 'fast' });
    expect(calls.find(call => call.url.endsWith('/rpc/duel_run_save')).body).toMatchObject({ p_verified: false, p_ranked: false });
    // Проверять «не робот» незачем, если попытка уже не прошла.
    expect(calls.some(call => call.url.includes('turnstile'))).toBe(false);
  });

  it('не прошёл Turnstile — попытка проверена, но в таблицу не идёт', async () => {
    mockBackend({ human: false });
    const response = await duelApi(post('/api/duel/finish', { run: 77, answers: answersFor(20), times: humanTimes(20), token: 'bad' }), ENV);
    expect(await response.json()).toMatchObject({ verified: true, ranked: false, reason: 'captcha' });
  });

  it('без Turnstile на сервере попытка пишется только как соперник-запись', async () => {
    const calls = mockBackend();
    const env = { SUPABASE_URL: ENV.SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: ENV.SUPABASE_SERVICE_ROLE_KEY };
    const response = await duelApi(post('/api/duel/finish', { run: 77, answers: answersFor(20), times: humanTimes(20) }), env);
    expect(await response.json()).toMatchObject({ verified: true, ranked: false, reason: '' });
    expect(calls.some(call => call.url.includes('turnstile'))).toBe(false);
  });

  it('грубый ник и чужой номер игрока не записываются', async () => {
    const calls = mockBackend();
    await duelApi(post('/api/duel/finish', { run: 77, nick: 'xyй', player: 'DROP TABLE', answers: answersFor(5), times: humanTimes(5), token: 't' }), ENV);
    expect(calls.find(call => call.url.endsWith('/rpc/duel_run_save')).body).toMatchObject({ p_nick: null, p_player: null });
  });

  it('законченную попытку второй раз не закончить', async () => {
    mockBackend({ row: { finished: true } });
    const response = await duelApi(post('/api/duel/finish', { run: 77, answers: answersFor(5), times: humanTimes(5) }), ENV);
    expect(response.status).toBe(409);
  });

  it('ответы позже, чем попытка шла по часам базы, — не в таблицу', async () => {
    mockBackend({ row: { elapsed_ms: 20000 } });
    const response = await duelApi(post('/api/duel/finish', { run: 77, answers: answersFor(24), times: humanTimes(24), token: 't' }), ENV);
    expect(await response.json()).toMatchObject({ verified: false, ranked: false, reason: 'clock' });
  });

  it('испорченные ответы — отказ до базы', async () => {
    const calls = mockBackend();
    const response = await duelApi(post('/api/duel/finish', { run: 77, answers: ['1', '2'], times: [5000, 1000] }), ENV);
    expect(response.status).toBe(400);
    expect(calls).toHaveLength(0);
  });
});
