/* Дуэли: запись попыток и таблица лидеров.

     GET  /api/duel/config — включено ли и ключ Turnstile для страницы
     POST /api/duel/start  — начало минуты: база запоминает время старта
     POST /api/duel/finish — конец: счёт, проверка и место в таблице

   Браузер в базу не пишет. Он присылает только свои ответы и время
   каждого ответа, а счёт воркер считает сам: из того же зерна те же
   генераторы тренажёра дают те же примеры, что видел ученик. Время
   попытки берётся по часам базы, темп проверяет assessRun (public/duel.js),
   а «не робот ли» — Cloudflare Turnstile. Писать в таблицу может только
   служебная роль Supabase, и её ключ живёт только в секретах воркера.

   Секреты и переменные (без них дуэли работают как раньше, но ничего не
   записывается):
     npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY — запись попыток
     npx wrangler secret put TURNSTILE_SECRET_KEY      — таблица лидеров
     npx wrangler secret put TURNSTILE_SITE_KEY        — она же, ключ для страницы
   Плюс миграция supabase/migrations/028_duel_runs.sql. */

// Файлы тренажёра — обычные скрипты браузера: подключаем ради глобальных объектов.
import '../public/trainer.js';
import '../public/trainer-algebra.js';
import '../public/duel.js';

const T = globalThis.MathTasksTrainer;
const D = globalThis.MathTasksDuel;
if (!T || !D) throw new Error('тренажёр или дуэль не положили функции в globalThis');

const BATCH = 150; // столько же, сколько генерирует страница (duel-page.js)
const TURNSTILE_VERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const json = (data, status = 200, extraHeaders = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders }
});

/* Поколение попытки — генераторы тренажёра вместе с лесенкой (duel.js:
   runGen): страница из кеша другого поколения считала бы по другим
   примерам, и счёт бы не сошёлся. */
const RUN_GEN = D.runGen(T.GENERATOR_VERSION);

const duelConfig = env => {
  const record = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
  const ranked = record && Boolean(env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SITE_KEY);
  return { record, ranked, turnstile: ranked ? env.TURNSTILE_SITE_KEY : null, gen: RUN_GEN };
};

// Какие ответы верны — по тем же примерам лесенки, что видел ученик.
const scoreRun = ({ cat, seed, answers }) => {
  const questions = D.ladderQuestions(T, cat, Number(seed) >>> 0, BATCH);
  return answers.map((answer, i) => Boolean(questions[i] && T.checkAnswer(questions[i], answer)?.isCorrect));
};

async function rpc(env, name, args) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args)
  });
  if (!response.ok) throw new Error(`supabase ${name} ${response.status}`);
  return response.json();
}

async function verifyHuman(env, token, ip) {
  if (!token || typeof token !== 'string' || token.length > 2048) return false;
  try {
    const response = await fetch(TURNSTILE_VERIFY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token, ...(ip ? { remoteip: ip } : {}) })
    });
    const result = await response.json();
    return result?.success === true;
  } catch {
    return false;
  }
}

/* Частота запросов с одного адреса. Привязка DUEL_LIMIT объявлена в
   wrangler.jsonc; адрес не сохраняется — это ключ счётчика Cloudflare. */
async function tooOften(env, request, bucket) {
  if (!env.DUEL_LIMIT?.limit) return false;
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  try {
    const { success } = await env.DUEL_LIMIT.limit({ key: `${bucket}:${ip}` });
    return !success;
  } catch {
    return false;
  }
}

// Чужой сайт не должен отправлять попытки от имени наших игроков.
const foreignOrigin = request => {
  const origin = request.headers.get('origin');
  return Boolean(origin) && origin !== new URL(request.url).origin;
};

const readBody = async request => {
  try {
    const text = await request.text();
    if (text.length > 16000) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
};

async function start(request, env) {
  const body = await readBody(request);
  const { cat, diff, gen, seed } = body || {};
  // Сложность в дуэли одна — лесенка; минута одной сложности больше не записывается.
  if (!D.CATEGORIES.includes(cat) || diff !== D.LADDER) return json({ error: 'category' }, 400);
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xFFFFFFFF) return json({ error: 'seed' }, 400);
  if (gen !== RUN_GEN) return json({ error: 'version' }, 409);
  if (await tooOften(env, request, 'start')) return json({ error: 'rate' }, 429, { 'Retry-After': '60' });
  try {
    const run = await rpc(env, 'duel_run_start', { p_cat: cat, p_diff: diff, p_gen: gen, p_seed: seed });
    return json({ run: Number(run) });
  } catch {
    return json({ error: 'database' }, 502);
  }
}

async function finish(request, env, config) {
  const body = await readBody(request);
  const { run, nick, player, answers, times, token } = body || {};
  if (!Number.isInteger(run) || run <= 0) return json({ error: 'run' }, 400);
  if (!D.validateRun(answers, times)) return json({ error: 'answers' }, 400);
  if (await tooOften(env, request, 'finish')) return json({ error: 'rate' }, 429, { 'Retry-After': '60' });

  let row;
  try {
    [row] = await rpc(env, 'duel_run_load', { p_run: run });
  } catch {
    return json({ error: 'database' }, 502);
  }
  if (!row) return json({ error: 'run' }, 404);
  if (row.finished) return json({ error: 'finished' }, 409);
  if (Number(row.gen) !== RUN_GEN || row.diff !== D.LADDER) return json({ error: 'version' }, 409);

  const bits = scoreRun({ cat: row.cat, seed: row.seed, answers });
  const correct = bits.filter(Boolean).length;
  const assessment = D.assessRun({ cat: row.cat, diff: row.diff, bits, times, elapsedMs: Number(row.elapsed_ms) });
  const human = config.ranked && assessment.ok
    ? await verifyHuman(env, token, request.headers.get('cf-connecting-ip'))
    : false;
  const ranked = config.ranked && assessment.ok && human;

  try {
    const saved = await rpc(env, 'duel_run_save', {
      p_run: run,
      p_nick: D.sanitizeNick(nick) || null,
      p_player: typeof player === 'string' && D.PLAYER_PATTERN.test(player) ? player : null,
      p_answers: answers,
      p_times: times,
      p_correct: correct,
      p_attempted: bits.length,
      p_verified: assessment.ok,
      p_ranked: ranked
    });
    if (saved !== true) return json({ error: 'finished' }, 409);
    const place = ranked ? await rpc(env, 'duel_run_place', { p_run: run }).catch(() => null) : null;
    let reason = assessment.reason;
    if (!reason && config.ranked && !human) reason = 'captcha';
    return json({
      correct,
      attempted: bits.length,
      verified: assessment.ok,
      ranked,
      place: place === null || place === undefined || !Number.isInteger(Number(place)) ? null : Number(place),
      reason
    });
  } catch {
    return json({ error: 'database' }, 502);
  }
}

async function duelApi(request, env) {
  const { pathname } = new URL(request.url);
  const config = duelConfig(env);

  if (pathname === '/api/duel/config') {
    if (request.method !== 'GET') return json({ error: 'method' }, 405);
    return json(config, 200, { 'Cache-Control': 'public, max-age=300' });
  }
  if (pathname !== '/api/duel/start' && pathname !== '/api/duel/finish') return json({ error: 'not_found' }, 404);
  if (request.method !== 'POST') return json({ error: 'method' }, 405);
  if (foreignOrigin(request)) return json({ error: 'origin' }, 403);
  if (!config.record) return json({ error: 'disabled' }, 503);
  return pathname === '/api/duel/start' ? start(request, env) : finish(request, env, config);
}

export { duelApi, duelConfig, scoreRun, BATCH };
