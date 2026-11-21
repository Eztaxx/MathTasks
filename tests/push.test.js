import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import worker, { assetLinks } from '../worker/index.js';
import { REMIND_CRON, isPushEndpoint, pushKey, remindDue } from '../worker/push.js';

describe('адрес подписки', () => {
  it('только пуш-сервисы браузеров и только https', () => {
    for (const ok of ['https://fcm.googleapis.com/fcm/send/abc', 'https://updates.push.services.mozilla.com/wpush/v2/x',
      'https://wns2-db5p.notify.windows.com/w/?token=1', 'https://web.push.apple.com/QWE']) expect(isPushEndpoint(ok)).toBe(true);
    for (const bad of ['http://fcm.googleapis.com/fcm/send/abc', 'https://evil.example/fcm.googleapis.com',
      'https://fcm.googleapis.com.evil.example/x', 'https://notpush.apple.com.evil/x', 'not a url']) expect(isPushEndpoint(bad)).toBe(false);
  });

  it('чужой адрес не получает запроса и считается сбоем, хост — в журнале', async () => {
    const env = { SUPABASE_URL: 'https://db.example', SUPABASE_SERVICE_ROLE_KEY: 'service', VAPID_PUBLIC_KEY: 'a', VAPID_PRIVATE_KEY: 'b' };
    const calls = [];
    const fetchImpl = async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith('/rpc/due_reminders')) return new Response(JSON.stringify([{ endpoint: 'https://evil.example/x', lang: 'lv', p256dh: 'a', auth: 'b' }]));
      return new Response(null, { status: 204 });
    };
    const result = await remindDue(env, Date.now(), fetchImpl);
    expect(result).toMatchObject({ due: 1, sent: 0, failed: 1, gone: 0, rejected: ['evil.example'] });
    expect(calls.map(call => call.url)).not.toContain('https://evil.example/x');
    expect(JSON.parse(calls.at(-1).init.body).p_failed).toEqual(['https://evil.example/x']);
  });
});

const root = fileURLToPath(new URL('..', import.meta.url));
const base64url = bytes => Buffer.from(bytes).toString('base64url');

// Ключи VAPID — из самого scripts/make-vapid.mjs: проверяем и его вывод.
function makeVapid() {
  const out = execFileSync(process.execPath, ['scripts/make-vapid.mjs'], { cwd: root, encoding: 'utf8' });
  const value = name => out.match(new RegExp(`^${name}=(.+)$`, 'm'))[1].trim();
  return { VAPID_PUBLIC_KEY: value('VAPID_PUBLIC_KEY'), VAPID_PRIVATE_KEY: value('VAPID_PRIVATE_KEY') };
}

// Подписка браузера: ключ ECDH P-256 и 16 случайных байт.
async function browserKeys() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  return {
    p256dh: base64url(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey))),
    auth: base64url(crypto.getRandomValues(new Uint8Array(16)))
  };
}

const FINGERPRINT = Array.from({ length: 32 }, (_, i) => i.toString(16).padStart(2, '0').toUpperCase()).join(':');

describe('assetlinks.json для приложения из Google Play', () => {
  it('без секрета — 404, как до приложения', async () => {
    expect(assetLinks({}).status).toBe(404);
    const response = await worker.fetch(new Request('https://mathtasks.lv/.well-known/assetlinks.json'), {});
    expect(response.status).toBe(404);
  });

  it('отдаёт пакет и отпечатки, мусор отбрасывает', async () => {
    const response = await worker.fetch(
      new Request('https://mathtasks.lv/.well-known/assetlinks.json'),
      { ANDROID_CERT_SHA256: `${FINGERPRINT.toLowerCase()}, not-a-fingerprint` }
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const [statement] = await response.json();
    expect(statement.relation).toEqual(['delegate_permission/common.handle_all_urls']);
    expect(statement.target).toEqual({
      namespace: 'android_app',
      package_name: 'lv.mathtasks.app',
      sha256_cert_fingerprints: [FINGERPRINT]
    });
  });
});

describe('напоминание позаниматься', () => {
  it('расписание раз в час совпадает с wrangler.jsonc', async () => {
    const { readFileSync } = await import('node:fs');
    expect(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')).toContain(`"${REMIND_CRON}"`);
  });

  it('открытый ключ для подписки — только если он задан', async () => {
    expect(pushKey({}).status).toBe(404);
    const response = await worker.fetch(new Request('https://mathtasks.lv/api/push/key'), { VAPID_PUBLIC_KEY: 'abc' });
    expect(await response.json()).toEqual({ key: 'abc' });
  });

  it('без ключей ничего не отправляет', async () => {
    expect(await remindDue({ SUPABASE_URL: 'https://db.example' })).toEqual({ skipped: 'not configured' });
  });

  it('шифрует и отправляет, исчезнувшие подписки убирает', async () => {
    const env = { SUPABASE_URL: 'https://db.example', SUPABASE_SERVICE_ROLE_KEY: 'service', ...makeVapid() };
    const rows = [
      { endpoint: 'https://fcm.googleapis.com/fcm/send/alive', lang: 'lv', ...(await browserKeys()) },
      { endpoint: 'https://fcm.googleapis.com/fcm/send/gone', lang: 'ru', ...(await browserKeys()) }
    ];
    const calls = [];
    const fetchImpl = async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith('/rpc/due_reminders')) return new Response(JSON.stringify(rows), { status: 200 });
      if (String(url).endsWith('/rpc/mark_reminders')) return new Response(null, { status: 204 });
      return new Response('', { status: String(url).endsWith('/gone') ? 410 : 201 });
    };

    const result = await remindDue(env, Date.UTC(2026, 8, 29, 15, 2), fetchImpl);
    expect(result).toEqual({ due: 2, sent: 1, failed: 0, gone: 1, skipped: 0 });

    const due = calls.find(call => call.url.endsWith('/rpc/due_reminders'));
    expect(due.init.headers.apikey).toBe('service');
    expect(JSON.parse(due.init.body)).toEqual({ p_now: '2026-09-29T15:02:00.000Z' });

    const push = calls.find(call => call.url === 'https://fcm.googleapis.com/fcm/send/alive');
    expect(push.init.method).toBe('post');
    expect(push.init.headers['content-encoding']).toBe('aes128gcm');
    expect(push.init.headers.authorization).toMatch(/^vapid t=.+, k=/);
    expect(push.init.headers.ttl).toBe('14400');
    expect(push.init.body.byteLength).toBeGreaterThan(100);

    const mark = JSON.parse(calls.find(call => call.url.endsWith('/rpc/mark_reminders')).init.body);
    expect(mark).toEqual({
      p_now: '2026-09-29T15:02:00.000Z',
      p_sent: ['https://fcm.googleapis.com/fcm/send/alive'],
      p_failed: [],
      p_gone: ['https://fcm.googleapis.com/fcm/send/gone']
    });
  });

  it('за запуск не больше 45 пушей: 50 запросов наружу на бесплатном тарифе', async () => {
    const env = { SUPABASE_URL: 'https://db.example', SUPABASE_SERVICE_ROLE_KEY: 'service', ...makeVapid() };
    const keys = await browserKeys();
    const rows = Array.from({ length: 60 }, (_, i) => ({ endpoint: `https://fcm.googleapis.com/fcm/send/${i}`, lang: 'lv', ...keys }));
    let outside = 0;
    const fetchImpl = async url => {
      outside++;
      if (String(url).endsWith('/rpc/due_reminders')) return new Response(JSON.stringify(rows), { status: 200 });
      if (String(url).endsWith('/rpc/mark_reminders')) return new Response(null, { status: 204 });
      return new Response('', { status: 201 });
    };
    const result = await remindDue(env, Date.now(), fetchImpl);
    expect(result).toEqual({ due: 60, sent: 45, failed: 0, gone: 0, skipped: 15 });
    expect(outside).toBeLessThanOrEqual(50);

    outside = 0;
    const paid = await remindDue({ ...env, REMIND_MAX_PER_RUN: '100' }, Date.now(), fetchImpl);
    expect(paid.sent).toBe(60);
  });

  it('пустая выборка — без отметок', async () => {
    const calls = [];
    const env = { SUPABASE_URL: 'https://db.example', SUPABASE_SERVICE_ROLE_KEY: 'service', VAPID_PUBLIC_KEY: 'a', VAPID_PRIVATE_KEY: 'b' };
    const result = await remindDue(env, Date.now(), async url => { calls.push(String(url)); return new Response('[]'); });
    expect(result).toEqual({ due: 0 });
    expect(calls).toHaveLength(1);
  });
});
