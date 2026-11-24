import { describe, expect, it } from 'vitest';
import { cwApi, parseSubmission } from '../worker/cw.js';

const env = { SUPABASE_URL: 'https://db.example', SUPABASE_SERVICE_ROLE_KEY: 'service' };
const attempt = '0f8fad5b-d9cb-469f-a165-70867728950e';
const good = (extra = {}) => ({
  attempt, nick: 'Anna 10.b', kind: 'paper', paperId: 7, slug: 'kd-varbutiba-statistika-a', title: 'Kontroldarbs',
  score: 1, total: 2, grade: 5, timeSec: 600, violations: 0, lang: 'lv',
  answers: [{ taskId: 11, ok: true, answer: '9/20' }, { taskId: 12, ok: false, answer: '0,7' }],
  ...extra
});
const post = (body, headers = {}) => new Request('https://mathtasks.lv/api/cw/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '1.2.3.4', ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body)
});
const network = (reply = true, status = 200) => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), headers: init.headers, body: JSON.parse(init.body) });
    return new Response(JSON.stringify(reply), { status });
  };
  return { calls, fetchImpl };
};

describe('результат контрольной: проверка полей', () => {
  it('принимает правильный результат и чистит его', () => {
    const { value } = parseSubmission(good({ nick: '  Anna\u0000 10.b\u202E ', answers: [
      { taskId: 11, ok: true, answer: 'x'.repeat(200) }, { taskId: 12, ok: false, accepted: 'yes', answer: 'a\nb' }
    ] }));
    expect(value.p_nick).toBe('Anna 10.b');
    expect(value.p_percent).toBe(50);
    expect(value.p_answers).toEqual([
      { task_id: 11, ok: true, accepted: false, answer: 'x'.repeat(80) },
      { task_id: 12, ok: false, accepted: false, answer: 'a b' }
    ]);
  });

  it('отказывает в мусоре', () => {
    expect(parseSubmission(null).error).toBe('bad_request');
    expect(parseSubmission(good({ attempt: 'abc' })).error).toBe('attempt');
    expect(parseSubmission(good({ nick: ' a ' })).error).toBe('nick');
    expect(parseSubmission(good({ kind: 'exam' })).error).toBe('kind');
    expect(parseSubmission(good({ slug: '../admin' })).error).toBe('slug');
    expect(parseSubmission(good({ paperId: null })).error).toBe('paper');
    expect(parseSubmission(good({ paperId: '7' })).error).toBe('paper');
    expect(parseSubmission(good({ score: 3 })).error).toBe('score');
    expect(parseSubmission(good({ total: 3 })).error).toBe('answers');
    expect(parseSubmission(good({ grade: 11 })).error).toBe('grade');
  });

  it('ник и ответ меряются знаками, а не половинками эмодзи', () => {
    expect(parseSubmission(good({ nick: '😀' })).error).toBe('nick');
    const { value } = parseSubmission(good({ answers: [
      { taskId: 11, ok: true, answer: 'a'.repeat(79) + '😀😀' }, { taskId: 12, ok: false, answer: '' }
    ] }));
    expect(value.p_answers[0].answer).toBe('a'.repeat(79) + '😀');
    expect(parseSubmission(good({ total: 61, score: 0, answers: Array.from({ length: 61 }, (_, i) => ({ taskId: i + 1, ok: false, answer: '' })) })).error).toBe('score');
  });

  it('счёт должен совпадать с ответами', () => {
    expect(parseSubmission(good({ score: 2 })).error).toBe('score');
    expect(parseSubmission(good({ kind: 'topic', paperId: null, topicId: 74 })).value.p_paper_id).toBe(null);
  });
});

describe('результат контрольной: запрос', () => {
  it('пишет функцией базы служебным ключом', async () => {
    const { calls, fetchImpl } = network(true);
    const res = await cwApi(post(good(), { origin: 'https://mathtasks.lv' }), env, fetchImpl);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://db.example/rest/v1/rpc/cw_submission_save');
    expect(calls[0].headers.Authorization).toBe('Bearer service');
    expect(calls[0].body.p_attempt).toBe(attempt);
  });

  it('без ключа, с чужого сайта, не POST и при сбое базы — отказ', async () => {
    const { calls, fetchImpl } = network(true);
    expect((await cwApi(post(good()), {}, fetchImpl)).status).toBe(503);
    expect((await cwApi(post(good(), { origin: 'https://evil.example' }), env, fetchImpl)).status).toBe(403);
    expect((await cwApi(new Request('https://mathtasks.lv/api/cw/submit'), env, fetchImpl)).status).toBe(405);
    expect((await cwApi(new Request('https://mathtasks.lv/api/cw/other', { method: 'POST' }), env, fetchImpl)).status).toBe(404);
    expect((await cwApi(post('{bad json'), env, fetchImpl)).status).toBe(400);
    expect((await cwApi(post('x'.repeat(40000)), env, fetchImpl)).status).toBe(400);
    expect(calls).toHaveLength(0);
    const failing = network({ message: 'boom' }, 500);
    expect((await cwApi(post(good()), env, failing.fetchImpl)).status).toBe(502);
  });

  it('частые запросы с одного адреса — 429', async () => {
    const { calls, fetchImpl } = network(true);
    const limited = { ...env, DUEL_LIMIT: { limit: async ({ key }) => ({ success: key !== 'cw:1.2.3.4' }) } };
    expect((await cwApi(post(good()), limited, fetchImpl)).status).toBe(429);
    expect(calls).toHaveLength(0);
  });
});
