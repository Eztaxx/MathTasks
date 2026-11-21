/* Напоминание позаниматься — веб-пуш (миграция 033).

   Раз в час (REMIND_CRON) база отдаёт подписки, у которых сейчас выбранный
   час в их часовом поясе, сегодня напоминания ещё не было и ученик сегодня
   не занимался. Решает это SQL (due_reminders); воркер только шифрует
   сообщение и отправляет его сервису пушей браузера (RFC 8291/8292).

   Ключи VAPID — в секретах воркера:
     node scripts/make-vapid.mjs
     npx wrangler secret put VAPID_PUBLIC_KEY
     npx wrangler secret put VAPID_PRIVATE_KEY
   Без них напоминания молча выключены, а на сайте переключателя нет
   (profile.js показывает его, только когда /api/push/key отдаёт ключ). */

import { buildPushPayload } from '@block65/webcrypto-web-push';

export const REMIND_CRON = '2 * * * *';

// Язык — тот, что был на сайте при включении напоминания.
const MESSAGES = {
  lv: { title: 'MathTasks', body: 'Piecas minūtes matemātikai? Trenažieris gaida.' },
  ru: { title: 'MathTasks', body: 'Пять минут на математику? Тренажёр ждёт.' }
};
const OPEN_URL = '/trainer.html';
const BATCH = 20;
/* Бесплатный тариф Cloudflare — 50 запросов наружу за вызов (как в
   backup.js). Два уходят в базу (due_reminders и mark_reminders), ещё
   несколько — в запас. Остальным в этот час напоминание не придёт; сколько
   их, видно в журнале (skipped). На платном тарифе предел поднимается
   переменной REMIND_MAX_PER_RUN. */
const MAX_PER_RUN = 45;
const SEND_TIMEOUT_MS = 10 * 1000;

/* Подписку сохраняет браузер ученика через save_push_subscription, а
   адрес в ней может быть любым https. Шлём только пуш-сервисам браузеров.
   Незнакомый адрес считаем сбоем, а не исчезнувшей подпиской: после пяти
   сбоев mark_reminders её удалит, а хост будет виден в журнале (rejected) —
   если это новый адрес настоящего сервиса, его надо добавить сюда. */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^jmt17\.google\.com$/, /(^|\.)push\.services\.mozilla\.com$/,
  /(^|\.)notify\.windows\.com$/, /(^|\.)push\.apple\.com$/];
export function isPushEndpoint(endpoint) {
  try {
    const url = new URL(endpoint);
    return url.protocol === 'https:' && PUSH_HOSTS.some(host => host.test(url.hostname));
  } catch {
    return false;
  }
}

const json = (data, status = 200, extraHeaders = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders }
});

// Открытый ключ VAPID — браузеру для подписки. Он не секретный.
export function pushKey(env) {
  if (!env.VAPID_PUBLIC_KEY) return json({ error: 'push_unavailable' }, 404, { 'Cache-Control': 'no-store' });
  return json({ key: env.VAPID_PUBLIC_KEY }, 200, { 'Cache-Control': 'public, max-age=3600' });
}

async function rpc(env, name, body, fetchImpl) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetchImpl(`${env.SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function remindDue(env, scheduledTime = Date.now(), fetchImpl = fetch) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    return { skipped: 'not configured' };
  }
  const now = new Date(scheduledTime).toISOString();
  const all = await rpc(env, 'due_reminders', { p_now: now }, fetchImpl);
  if (!Array.isArray(all) || all.length === 0) return { due: 0 };
  const limit = Number(env.REMIND_MAX_PER_RUN) > 0 ? Math.floor(Number(env.REMIND_MAX_PER_RUN)) : MAX_PER_RUN;
  const due = all.slice(0, limit);

  const vapid = {
    subject: env.VAPID_SUBJECT || 'https://mathtasks.lv',
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY
  };
  const sent = [];
  const failed = [];
  const gone = [];
  const rejected = new Set();

  async function send(row) {
    if (!isPushEndpoint(row.endpoint)) {
      failed.push(row.endpoint);
      try { rejected.add(new URL(row.endpoint).hostname); } catch { rejected.add('?'); }
      return;
    }
    try {
      const message = MESSAGES[row.lang] || MESSAGES.lv;
      const payload = await buildPushPayload(
        // Телефон выключен дольше четырёх часов — вчерашнее напоминание уже ни к чему.
        { data: { ...message, lang: row.lang, url: OPEN_URL, tag: 'mt-remind' }, options: { ttl: 4 * 3600, urgency: 'normal', topic: 'remind' } },
        { endpoint: row.endpoint, expirationTime: null, keys: { p256dh: row.p256dh, auth: row.auth } },
        vapid
      );
      const response = await fetchImpl(row.endpoint, { ...payload, signal: AbortSignal.timeout(SEND_TIMEOUT_MS) });
      if (response.status === 404 || response.status === 410) gone.push(row.endpoint);
      else if (response.ok) sent.push(row.endpoint);
      else failed.push(row.endpoint);
    } catch {
      failed.push(row.endpoint);
    }
  }

  // Пачками: сотни одновременных запросов воркер не удержит.
  for (let i = 0; i < due.length; i += BATCH) await Promise.all(due.slice(i, i + BATCH).map(send));

  await rpc(env, 'mark_reminders', { p_now: now, p_sent: sent, p_failed: failed, p_gone: gone }, fetchImpl);
  const result = { due: all.length, sent: sent.length, failed: failed.length, gone: gone.length, skipped: all.length - due.length };
  if (rejected.size) result.rejected = [...rejected].slice(0, 10);
  return result;
}
