/* Результат контрольной для учителя.

     POST /api/cw/submit — сохранить (или обновить) результат попытки

   Браузер присылает ник, какую работу писал, сколько верных и ответы по
   задачам; воркер проверяет поля и пишет функцией cw_submission_save
   (supabase/migrations/036_cw_submissions.sql) служебным ключом. Читает
   результаты только администратор в админке. От мусора — проверка, что
   запрос пришёл со страницы самого сайта, предел размера и счётчик частоты
   по адресу (привязка DUEL_LIMIT, адрес не хранится); база ещё сверяет
   задачи с работой и держит общий потолок строк в час. Ответы сервер не
   перепроверяет и ник не подтверждает: это отчёт для учителя, а не рейтинг,
   и подделать строку из консоли можно — учитель об этом знает. */

export const CW_LIMITS = { nick: 24, minNick: 2, slug: 160, title: 200, answer: 80, tasks: 60, timeSec: 86400 };
const MAX_BODY = 32 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9][a-z0-9-]*$/;
const ONE_LINE = /[\u0000-\u001F\u007F\u0085\u200E\u200F\u2028\u2029\u202A-\u202E\u2066-\u2069]/g;

const json = (data, status = 200, extraHeaders = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders }
});

// Обрезка по знакам, а не по половинкам UTF-16: одинокая половинка эмодзи не пройдёт в jsonb.
const clean = (value, max) => Array.from(String(value ?? '').replace(ONE_LINE, ' ').replace(/\s+/g, ' ').trim()).slice(0, max).join('').trim();
const chars = text => Array.from(text).length;
const int = (value, min, max) => (Number.isInteger(value) && value >= min && value <= max ? value : null);
const optId = value => (value === null || value === undefined ? null : int(value, 1, Number.MAX_SAFE_INTEGER));

/* Проверка полей. { error } или { value } — уже очищенный результат.
   Отдельно от запроса, чтобы проверить тестом без сети. */
export function parseSubmission(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'bad_request' };
  const attempt = typeof body.attempt === 'string' && UUID.test(body.attempt) ? body.attempt.toLowerCase() : null;
  if (!attempt) return { error: 'attempt' };
  const nick = clean(body.nick, CW_LIMITS.nick);
  if (chars(nick) < CW_LIMITS.minNick) return { error: 'nick' };
  const kind = body.kind === 'paper' || body.kind === 'topic' ? body.kind : null;
  if (!kind) return { error: 'kind' };
  const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
  if (!slug || slug.length > CW_LIMITS.slug || !SLUG.test(slug)) return { error: 'slug' };
  const paperId = optId(body.paperId);
  const topicId = optId(body.topicId);
  if (body.paperId != null && paperId === null) return { error: 'paper' };
  if (body.topicId != null && topicId === null) return { error: 'topic' };
  if (kind === 'paper' && !paperId) return { error: 'paper' };
  const total = int(body.total, 1, CW_LIMITS.tasks);
  const score = int(body.score, 0, CW_LIMITS.tasks);
  if (total === null || score === null || score > total) return { error: 'score' };
  const answers = Array.isArray(body.answers) ? body.answers : null;
  if (!answers || answers.length !== total) return { error: 'answers' };
  const list = [];
  for (const item of answers) {
    if (!item || typeof item !== 'object') return { error: 'answers' };
    const taskId = int(item.taskId, 1, Number.MAX_SAFE_INTEGER);
    if (taskId === null || typeof item.ok !== 'boolean') return { error: 'answers' };
    list.push({ task_id: taskId, ok: item.ok, accepted: item.accepted === true, answer: clean(item.answer, CW_LIMITS.answer) });
  }
  // Счёт — по ответам, а не со слов браузера: строка в админке не противоречит сама себе.
  const correct = list.filter(item => item.ok).length;
  if (correct !== score) return { error: 'score' };
  const grade = body.grade === null || body.grade === undefined ? null : int(body.grade, 0, 10);
  if (body.grade != null && grade === null) return { error: 'grade' };
  return {
    value: {
      p_attempt: attempt,
      p_nick: nick,
      p_kind: kind,
      p_paper_id: paperId,
      p_topic_id: topicId,
      p_slug: slug,
      p_title: clean(body.title, CW_LIMITS.title) || null,
      p_score: score,
      p_total: total,
      p_percent: Math.round((score / total) * 100),
      p_grade: grade,
      p_time_sec: int(body.timeSec, 0, CW_LIMITS.timeSec),
      p_violations: int(body.violations, 0, 1000),
      p_lang: body.lang === 'ru' ? 'ru' : 'lv',
      p_answers: list
    }
  };
}

const foreignOrigin = request => {
  const origin = request.headers.get('origin');
  return Boolean(origin) && origin !== new URL(request.url).origin;
};

async function readBody(request) {
  try {
    const text = await request.text();
    return text.length > MAX_BODY ? null : JSON.parse(text);
  } catch {
    return null;
  }
}

async function tooOften(env, ip) {
  if (!env.DUEL_LIMIT?.limit) return false;
  try {
    const { success } = await env.DUEL_LIMIT.limit({ key: `cw:${ip || 'unknown'}` });
    return !success;
  } catch {
    return false;
  }
}

export async function cwApi(request, env, fetchImpl = fetch) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/cw/submit') return json({ error: 'not_found' }, 404);
  if (request.method !== 'POST') return json({ error: 'method' }, 405, { Allow: 'POST' });
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'unavailable' }, 503);
  if (foreignOrigin(request)) return json({ error: 'origin' }, 403);
  if (await tooOften(env, request.headers.get('cf-connecting-ip') || '')) return json({ error: 'too_often' }, 429);

  const body = await readBody(request);
  if (!body) return json({ error: 'bad_request' }, 400);
  const parsed = parseSubmission(body);
  if (parsed.error) return json({ error: parsed.error }, 400);

  const response = await fetchImpl(`${env.SUPABASE_URL}/rest/v1/rpc/cw_submission_save`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parsed.value)
  }).catch(() => null);
  if (!response?.ok) return json({ error: 'save' }, 502);
  // false — база не приняла строку (нет такой работы, поздняя правка). Потолок за час — ошибка базы, выше 502.
  const saved = await response.json().catch(() => null);
  return json({ ok: saved === true });
}
