import { describe, expect, it } from 'vitest';
import { contactApi, contactMessage, parseContact } from '../worker/contact.js';

const env = { TELEGRAM_BOT_TOKEN: 'bot', TELEGRAM_CHAT_ID: '42', TURNSTILE_SECRET_KEY: 's', TURNSTILE_SITE_KEY: 'site' };
const post = (body, headers = {}) => new Request('https://mathtasks.lv/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '1.2.3.4', ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body)
});
// Turnstile отвечает «человек», Telegram — «принято»; все вызовы записываются.
const network = (human = true) => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), body: JSON.parse(init.body) });
    return String(url).includes('turnstile') ? new Response(JSON.stringify({ success: human })) : new Response('{}');
  };
  return { calls, fetchImpl };
};

describe('форма «Написать нам»', () => {
  it('проверяет поля и чистит их', () => {
    expect(parseContact(null).error).toBe('bad_request');
    expect(parseContact({ topic: 'spam', message: 'Здравствуйте' }).error).toBe('topic');
    expect(parseContact({ topic: 'delete', message: 'ой' }).error).toBe('message_short');
    expect(parseContact({ topic: 'delete', message: 'x'.repeat(2001) }).error).toBe('message_long');
    const { value } = parseContact({ topic: 'delete', message: ' Удалите\nмой профиль\u0007 ', nick: 'Кот\u0000Васька', reply: 'a'.repeat(300), lang: 'ru' });
    expect(value).toEqual({ topic: 'delete', message: 'Удалите\nмой профиль', nick: 'Кот Васька', reply: 'a'.repeat(200), lang: 'ru' });
    expect(parseContact({ topic: 'access', message: 'Kādi dati?', lang: 'de' }).value.lang).toBe('lv');
  });

  it('в нике и способе связи нельзя нарисовать новую строку', () => {
    const { value } = parseContact({ topic: 'other', message: 'Текст\u2028дальше', nick: 'Кот\nКак ответить: x', reply: 'a\u2029b\u202Ec\u0085d' });
    expect(value.nick).not.toMatch(/[\n\u2028\u2029]/);
    expect(value.reply).toBe('a b c d');
    expect(value.message).toBe('Текст дальше');
  });

  it('текст для Telegram: тема, ник, как ответить, сообщение', () => {
    expect(contactMessage({ topic: 'delete', message: 'Удалите', nick: 'Кот', reply: 'mail', lang: 'ru' }))
      .toBe('Обращение с сайта · удалить данные · RU\nНик: Кот\nКак ответить: mail\n\nУдалите');
    expect(contactMessage({ topic: 'other', message: 'Sveiki', nick: '', reply: '', lang: 'lv' }))
      .toBe('Обращение с сайта · другое · LV\nОтвет не нужен (способ связи не указан)\n\nSveiki');
  });

  it('без Telegram или без Turnstile форма выключена', async () => {
    for (const partial of [{}, { TELEGRAM_BOT_TOKEN: 'bot', TELEGRAM_CHAT_ID: '42' }]) {
      expect(await (await contactApi(new Request('https://mathtasks.lv/api/contact'), partial)).json()).toEqual({ enabled: false, turnstile: null });
      expect((await contactApi(post({ topic: 'other', message: 'Привет всем' }), partial)).status).toBe(503);
    }
    expect(await (await contactApi(new Request('https://mathtasks.lv/api/contact'), env)).json()).toEqual({ enabled: true, turnstile: 'site' });
  });

  it('отправляет в Telegram и ничего не хранит', async () => {
    const { calls, fetchImpl } = network();
    const response = await contactApi(post({ topic: 'delete', message: 'Удалите профиль', nick: 'Кот', lang: 'ru', token: 'ok' }, { Origin: 'https://mathtasks.lv' }), env, fetchImpl);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    const telegram = calls.filter(call => call.url.includes('telegram'));
    expect(telegram).toHaveLength(1);
    expect(telegram[0].url).toBe('https://api.telegram.org/botbot/sendMessage');
    expect(telegram[0].body).toMatchObject({ chat_id: '42', text: expect.stringContaining('Удалите профиль') });
    expect(telegram[0].body.parse_mode).toBeUndefined();
  });

  it('без верного токена Turnstile не отправляет', async () => {
    const { calls, fetchImpl } = network(false);
    expect((await contactApi(post({ topic: 'other', message: 'Привет всем', token: 'bad' }), env, fetchImpl)).status).toBe(403);
    expect((await contactApi(post({ topic: 'other', message: 'Привет всем' }), env, fetchImpl)).status).toBe(403);
    expect(calls.some(call => call.url.includes('telegram'))).toBe(false);
  });

  it('запрос с чужого сайта и слишком большое тело отклоняются', async () => {
    const { calls, fetchImpl } = network();
    expect((await contactApi(post({ topic: 'other', message: 'Привет всем', token: 'ok' }, { Origin: 'https://evil.example' }), env, fetchImpl)).status).toBe(403);
    expect((await contactApi(post(JSON.stringify({ topic: 'other', message: 'x'.repeat(20000), token: 'ok' })), env, fetchImpl)).status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it('частые отправки с одного адреса — 429', async () => {
    const limited = { ...env, DUEL_LIMIT: { limit: async ({ key }) => ({ success: key !== 'contact:1.2.3.4' }) } };
    expect((await contactApi(post({ topic: 'other', message: 'Привет всем', token: 'ok' }), limited, network().fetchImpl)).status).toBe(429);
  });
});
