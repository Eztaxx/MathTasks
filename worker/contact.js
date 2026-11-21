/* Форма «Написать нам» на странице политики конфиденциальности (/privacy).

     GET  /api/contact — включена ли форма и ключ Turnstile для страницы
     POST /api/contact — отправить обращение

   Обращение не сохраняется ни в базе, ни в журнале: воркер пересылает его
   администратору в Telegram (те же секреты, что у уведомлений об ошибках,
   worker/backup.js) и забывает. От спама — Cloudflare Turnstile (те же ключи,
   что у таблицы лидеров дуэли; без них форма выключена), проверка, что
   запрос пришёл со страницы самого сайта, и счётчик частоты по адресу
   (привязка DUEL_LIMIT, адрес не хранится). */

const TURNSTILE_VERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
export const CONTACT_TOPICS = ['delete', 'access', 'other'];
const TOPIC_TEXT = { delete: 'удалить данные', access: 'какие данные хранятся', other: 'другое' };
export const CONTACT_LIMITS = { message: 2000, nick: 24, reply: 200, minMessage: 5 };

const json = (data, status = 200, extraHeaders = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders }
});

// Без Turnstile форма была бы открытой пересылкой в Telegram — тогда она выключена.
const ready = env => Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID && env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SITE_KEY);
const MAX_BODY = 16 * 1024;

/* Управляющие символы убираем, переводы строк оставляем только в тексте.
   Заодно — разделители строк Unicode и символы направления письма: ими в
   поле ника можно нарисовать поддельную строку «Как ответить: …». */
const LINE_SAFE = /[\u0000-\u0009\u000B-\u001F\u007F\u0085\u200E\u200F\u2028\u2029\u202A-\u202E\u2066-\u2069]/g;
const ONE_LINE = /[\u0000-\u001F\u007F\u0085\u200E\u200F\u2028\u2029\u202A-\u202E\u2066-\u2069]/g;
const clean = (value, max, keepLines = false) => String(value ?? '')
  .replace(keepLines ? LINE_SAFE : ONE_LINE, ' ')
  .trim()
  .slice(0, max);

/* Проверка полей. Возвращает { error } или { value } — уже очищенное
   обращение. Вынесено отдельно, чтобы проверить тестом без сети. */
export function parseContact(body) {
  if (!body || typeof body !== 'object') return { error: 'bad_request' };
  const topic = CONTACT_TOPICS.includes(body.topic) ? body.topic : null;
  if (!topic) return { error: 'topic' };
  const message = clean(body.message, CONTACT_LIMITS.message + 1, true);
  if (message.length < CONTACT_LIMITS.minMessage) return { error: 'message_short' };
  if (message.length > CONTACT_LIMITS.message) return { error: 'message_long' };
  return {
    value: {
      topic,
      message,
      nick: clean(body.nick, CONTACT_LIMITS.nick),
      reply: clean(body.reply, CONTACT_LIMITS.reply),
      lang: body.lang === 'ru' ? 'ru' : 'lv'
    }
  };
}

// Текст для Telegram — обычный, без разметки.
export const contactMessage = ({ topic, message, nick, reply, lang }) => [
  `Обращение с сайта · ${TOPIC_TEXT[topic]} · ${lang.toUpperCase()}`,
  nick ? `Ник: ${nick}` : '',
  reply ? `Как ответить: ${reply}` : 'Ответ не нужен (способ связи не указан)',
  '',
  message
].filter((line, index) => line || index === 3).join('\n');

// Запрос со страницы чужого сайта (у браузера есть Origin, и он не наш) не принимаем.
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

async function verifyHuman(env, token, ip, fetchImpl) {
  if (!token || typeof token !== 'string' || token.length > 2048) return false;
  try {
    const response = await fetchImpl(TURNSTILE_VERIFY, {
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

async function tooOften(env, ip) {
  if (!env.DUEL_LIMIT?.limit) return false;
  try {
    const { success } = await env.DUEL_LIMIT.limit({ key: `contact:${ip || 'unknown'}` });
    return !success;
  } catch {
    return false;
  }
}

export async function contactApi(request, env, fetchImpl = fetch) {
  if (request.method === 'GET') {
    return json({ enabled: ready(env), turnstile: ready(env) ? env.TURNSTILE_SITE_KEY : null });
  }
  if (request.method !== 'POST') return json({ error: 'method' }, 405, { Allow: 'GET, POST' });
  if (!ready(env)) return json({ error: 'unavailable' }, 503);
  if (foreignOrigin(request)) return json({ error: 'origin' }, 403);

  const ip = request.headers.get('cf-connecting-ip') || '';
  if (await tooOften(env, ip)) return json({ error: 'too_often' }, 429);

  const body = await readBody(request);
  if (!body) return json({ error: 'bad_request' }, 400);
  const parsed = parseContact(body);
  if (parsed.error) return json({ error: parsed.error }, 400);
  if (!(await verifyHuman(env, body.token, ip, fetchImpl))) return json({ error: 'human' }, 403);

  const response = await fetchImpl(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: contactMessage(parsed.value), disable_web_page_preview: true })
  }).catch(() => null);
  if (!response?.ok) return json({ error: 'send' }, 502);
  return json({ ok: true });
}
