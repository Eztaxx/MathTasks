#!/usr/bin/env node
/*
 * Проверка: посетитель не может ничего из того, что может администратор.
 *
 * С профилями учеников вход стал анонимным: любой посетитель в один клик
 * получает роль authenticated — ту же, что у администратора. Всё, что
 * отделяет его от админки, — проверка public.is_admin() в политиках базы,
 * в функциях и в воркере. Одна политика «для вошедших» без неё, созданная
 * когда-то руками в панели Supabase, — и анонимный посетитель правит задачи.
 * Файлы миграций этого не покажут, поэтому скрипт пробует на деле.
 *
 * Два посетителя: без входа (ключ anon) и с анонимным входом. Второй
 * проверяется, только если в Supabase открыта регистрация — без неё
 * анонимный вход не работает, и скрипт так и скажет.
 *
 * Что пробуем от имени посетителя:
 *   - прочитать черновики, сообщения об ошибках, записи дуэлей, чужие профили;
 *   - вставить строку в каждую таблицу админки;
 *   - изменить и удалить строку — только подставную: её заводит служебный
 *     ключ перед проверкой и сам же убирает в конце, настоящие данные не
 *     трогаются даже при дыре;
 *   - загрузить файл в хранилище чертежей;
 *   - вызвать служебные функции дуэлей и duel_hide;
 *   - выдать себе роль администратора, в том числе через данные входа;
 *   - попросить воркер о генерации (/api/gemini).
 * Анонимный пользователь, созданный для проверки, удаляется в конце.
 *
 * Запуск:  npm run verify:access           (сайт — https://mathtasks.lv)
 *          SITE_URL=http://localhost:8788 npm run verify:access
 */

import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const env = Object.fromEntries(
  readFileSync(ROOT + '.env', 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);
const BASE = env.SUPABASE_URL;
const SITE = (process.env.SITE_URL || 'https://mathtasks.lv').replace(/\/$/, '');
const TAG = `zz-access-${Date.now().toString(36)}`;

const SERVICE = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };
const visitorHeaders = token => ({ apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token || env.SUPABASE_ANON_KEY}` });

const passed = [];
const problems = [];
const pass = (who, what) => passed.push(`${who}: ${what}`);
const fail = (who, what, detail) => problems.push(`${who}: ${what} — ${detail}`);

async function request(method, url, headers, body, prefer = 'return=representation') {
  const response = await fetch(url, {
    method,
    headers: { ...headers, 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let data = text;
  try { data = text ? JSON.parse(text) : null; } catch {}
  return { status: response.status, data };
}
const rest = (method, path, headers, body, prefer) => request(method, `${BASE}/rest/v1/${path}`, headers, body, prefer);
const rows = result => (Array.isArray(result.data) ? result.data : []);
/* Отказ по правам — 401/403 или код 42501. Другая ошибка (внешний ключ,
   повтор ключа) значит, что проверку прав запрос как раз прошёл. */
const denied = result => result.status === 401 || result.status === 403 || result.data?.code === '42501';
const refused = result => denied(result) || (result.status < 300 && rows(result).length === 0);

/* ── Подставные строки: заводит и убирает служебный ключ ─────────── */

const bait = {};
async function makeBait() {
  const one = async (table, body) => {
    const result = await rest('POST', table, SERVICE, body);
    if (result.status >= 300) throw new Error(`не завести подставную строку в ${table}: ${result.status} ${JSON.stringify(result.data).slice(0, 200)}`);
    return rows(result)[0];
  };
  const published = rows(await rest('GET', 'tasks?select=id&is_published=eq.true&order=id&limit=1', SERVICE))[0];
  const anyTag = rows(await rest('GET', 'tags?select=id&order=id&limit=1', SERVICE))[0];
  bait.subject = await one('subjects', { title: TAG, slug: TAG, position: 9999 });
  bait.topic = await one('topics', { title: TAG, slug: TAG, subject_id: null, grade: null, position: 9999 });
  bait.subtopic = await one('subtopics', { title: TAG, slug: TAG, topic_id: bait.topic.id, position: 9999 });
  bait.tag = await one('tags', { title: TAG, title_lv: TAG, slug: TAG, position: 9999 });
  bait.task = await one('tasks', { title: TAG, condition_latex: TAG, is_published: false, topic_id: bait.topic.id });
  bait.taskTag = await one('task_tags', { task_id: bait.task.id, tag_id: anyTag.id });
  bait.paper = await one('exam_papers', { slug: TAG, title: TAG, kind: 'exam', level: 'pamat', is_published: false });
  bait.paperItem = await one('exam_paper_items', { paper_id: bait.paper.id, task_id: bait.task.id });
  bait.paperTopic = await one('exam_paper_topics', { paper_id: bait.paper.id, topic_id: bait.topic.id });
  bait.report = await one('task_reports', { task_id: published.id, kind: 'other', message: TAG, resolved: true });
  bait.publishedTaskId = published.id;
  bait.realTopicId = rows(await rest('GET', 'topics?select=id&order=id&limit=1', SERVICE))[0].id;
}

async function removeBait() {
  // Порядок — от зависимых к главным; каскады уберут остальное.
  if (bait.report) await rest('DELETE', `task_reports?id=eq.${bait.report.id}`, SERVICE);
  if (bait.paper) await rest('DELETE', `exam_papers?id=eq.${bait.paper.id}`, SERVICE);
  if (bait.task) await rest('DELETE', `tasks?id=eq.${bait.task.id}`, SERVICE);
  if (bait.tag) await rest('DELETE', `tags?id=eq.${bait.tag.id}`, SERVICE);
  if (bait.topic) await rest('DELETE', `topics?id=eq.${bait.topic.id}`, SERVICE);
  if (bait.subject) await rest('DELETE', `subjects?id=eq.${bait.subject.id}`, SERVICE);
  const left = rows(await rest('GET', `tasks?select=id&title=eq.${TAG}`, SERVICE)).length
    + rows(await rest('GET', `topics?select=id&slug=eq.${TAG}`, SERVICE)).length
    + rows(await rest('GET', `subjects?select=id&slug=eq.${TAG}`, SERVICE)).length
    + rows(await rest('GET', `tags?select=id&slug=eq.${TAG}`, SERVICE)).length;
  if (left) console.error(`⚠ Подставные строки ${TAG} остались в базе (${left}) — удалите вручную.`);
}

/* ── Проверки от имени посетителя ────────────────────────────────── */

async function checkVisitor(who, token, userId) {
  const H = visitorHeaders(token);

  // Чтение того, что посетителю видеть нельзя.
  const inPublishedPapers = new Set(rows(await rest('GET',
    'exam_paper_items?select=task_id,exam_papers!inner(is_published)&exam_papers.is_published=eq.true&order=id', SERVICE)).map(r => r.task_id));
  const drafts = rows(await rest('GET', 'tasks?select=id&is_published=eq.false&order=id', H)).filter(r => !inPublishedPapers.has(r.id));
  drafts.length ? fail(who, 'видит черновики задач', `${drafts.length} шт.`) : pass(who, 'черновики задач не видны');
  for (const [table, what] of [
    ['task_reports', 'сообщения об ошибках'],
    ['exam_papers?is_published=eq.false', 'черновики работ'],
    ['duel_runs', 'записи дуэлей напрямую'],
    ['profile_transfer_codes', 'коды переноса профилей']
  ]) {
    const result = await rest('GET', `${table}${table.includes('?') ? '&' : '?'}select=*&limit=5`, H);
    rows(result).length ? fail(who, `читает ${what}`, `${rows(result).length} строк`) : pass(who, `${what} не читаются`);
  }
  const profiles = rows(await rest('GET', 'profiles?select=id,role', H));
  const foreign = profiles.filter(p => p.id !== userId);
  foreign.length ? fail(who, 'читает чужие строки profiles', `${foreign.length} шт.`) : pass(who, 'чужие строки profiles не видны');
  for (const table of ['student_profiles', 'profile_members', 'student_progress']) {
    const found = rows(await rest('GET', `${table}?select=*`, H));
    // Своё видеть можно: до ensure_profile у проверочного входа профиля нет.
    found.length ? fail(who, `читает ${table}`, `${found.length} строк`) : pass(who, `${table}: чужого не видно`);
  }

  // Вставка в таблицы админки.
  const inserts = {
    subjects: { title: TAG, slug: `${TAG}-v` },
    topics: { title: TAG, slug: `${TAG}-v` },
    subtopics: { title: TAG, slug: `${TAG}-v`, topic_id: bait.topic.id },
    tags: { title: TAG, title_lv: TAG, slug: `${TAG}-v` },
    tasks: { title: TAG, condition_latex: TAG, is_published: true },
    task_tags: { task_id: bait.publishedTaskId, tag_id: bait.tag.id },
    exam_papers: { slug: `${TAG}-v`, title: TAG, kind: 'exam', level: 'pamat', is_published: true },
    exam_paper_items: { paper_id: bait.paper.id, task_id: bait.publishedTaskId },
    exam_paper_topics: { paper_id: bait.paper.id, topic_id: bait.realTopicId },
    profiles: { id: '00000000-0000-4000-8000-000000000000', role: 'admin' },
    duel_runs: { cat: 'mix', diff: 'normal', gen: 1, seed: 1, nick: TAG, correct: 80, attempted: 80, verified: true, ranked: true },
    student_profiles: { nick: TAG },
    profile_transfer_codes: { code_hash: TAG, profile_id: '00000000-0000-4000-8000-000000000000', expires_at: '2099-01-01T00:00:00Z' }
  };
  for (const [table, body] of Object.entries(inserts)) {
    const result = await rest('POST', table, H, body);
    if (result.status < 300) {
      fail(who, `вставил строку в ${table}`, JSON.stringify(rows(result)[0] || result.data).slice(0, 120));
      // Убираем то, что прошло, служебным ключом.
      for (const row of rows(result)) {
        const filter = row.id !== undefined ? `id=eq.${row.id}`
          : table === 'task_tags' ? `task_id=eq.${row.task_id}&tag_id=eq.${row.tag_id}`
          : table === 'exam_paper_topics' ? `paper_id=eq.${row.paper_id}&topic_id=eq.${row.topic_id}`
          : table === 'profile_transfer_codes' ? `code_hash=eq.${row.code_hash}` : null;
        if (filter) await rest('DELETE', `${table}?${filter}`, SERVICE);
      }
    } else if (denied(result)) {
      pass(who, `вставка в ${table} запрещена (${result.status})`);
    } else {
      fail(who, `вставка в ${table}: не отказ по правам, разобрать вручную`, `${result.status} ${JSON.stringify(result.data).slice(0, 160)}`);
    }
  }

  // Правка и удаление — только подставных строк.
  const targets = [
    ['subjects', `id=eq.${bait.subject.id}`, { title: `${TAG}-hacked` }],
    ['topics', `id=eq.${bait.topic.id}`, { title: `${TAG}-hacked` }],
    ['subtopics', `id=eq.${bait.subtopic.id}`, { title: `${TAG}-hacked` }],
    ['tags', `id=eq.${bait.tag.id}`, { title: `${TAG}-hacked` }],
    ['tasks', `id=eq.${bait.task.id}`, { is_published: true }],
    ['task_tags', `task_id=eq.${bait.taskTag.task_id}&tag_id=eq.${bait.taskTag.tag_id}`, { tag_id: bait.taskTag.tag_id }],
    ['exam_papers', `id=eq.${bait.paper.id}`, { is_published: true }],
    ['exam_paper_items', `id=eq.${bait.paperItem.id}`, { position: 99 }],
    ['exam_paper_topics', `paper_id=eq.${bait.paper.id}&topic_id=eq.${bait.topic.id}`, { topic_id: bait.topic.id }],
    ['task_reports', `id=eq.${bait.report.id}`, { message: `${TAG}-hacked` }]
  ];
  for (const [table, filter, patch] of targets) {
    const updated = await rest('PATCH', `${table}?${filter}`, H, patch);
    refused(updated) ? pass(who, `правка ${table} запрещена`) : fail(who, `изменил строку ${table}`, JSON.stringify(rows(updated)[0]).slice(0, 120));
  }
  for (const [table, filter] of targets.slice().reverse()) {
    const removed = await rest('DELETE', `${table}?${filter}`, H);
    const still = rows(await rest('GET', `${table}?select=*&${filter}`, SERVICE)).length > 0;
    still && refused(removed) ? pass(who, `удаление ${table} запрещено`) : fail(who, `удалил строку ${table}`, `статус ${removed.status}`);
  }

  // Роль администратора себе.
  const selfAdmin = await rest('PATCH', `profiles?id=eq.${userId || '00000000-0000-4000-8000-000000000000'}`, H, { role: 'admin' });
  refused(selfAdmin) ? pass(who, 'выдать себе роль admin нельзя') : fail(who, 'ВЫДАЛ СЕБЕ РОЛЬ ADMIN', JSON.stringify(rows(selfAdmin)));
  const adminRows = await rest('PATCH', 'profiles?role=eq.admin', H, { role: 'admin' });
  refused(adminRows) ? pass(who, 'строки администраторов не правятся') : fail(who, 'правит строки администраторов', JSON.stringify(rows(adminRows)).slice(0, 120));
  const isAdmin = await rest('POST', 'rpc/is_admin', H, {});
  isAdmin.data === true ? fail(who, 'is_admin() = true', '') : pass(who, 'is_admin() = false');

  // Хранилище чертежей.
  const upload = await fetch(`${BASE}/storage/v1/object/task-images/${TAG}.svg`, {
    method: 'POST', headers: { ...H, 'Content-Type': 'image/svg+xml' }, body: '<svg xmlns="http://www.w3.org/2000/svg"/>'
  });
  if (upload.ok) {
    fail(who, 'загрузил файл в task-images', `${upload.status}`);
    await fetch(`${BASE}/storage/v1/object/task-images/${TAG}.svg`, { method: 'DELETE', headers: SERVICE });
  } else {
    pass(who, `загрузка чертежа запрещена (${upload.status})`);
  }

  // Функции: служебные функции дуэлей и скрытие записей.
  for (const [fn, args] of [
    ['duel_run_start', { p_cat: 'mix', p_diff: 'normal', p_gen: 1, p_seed: 1 }],
    ['duel_run_save', { p_run: 0, p_nick: TAG, p_player: null, p_answers: [], p_times: [], p_correct: 80, p_attempted: 80, p_verified: true, p_ranked: true }],
    ['duel_run_load', { p_run: 0 }],
    ['duel_hide', { p_run: 0, p_hidden: true }]
  ]) {
    const result = await rest('POST', `rpc/${fn}`, H, args, null);
    // duel_hide посетителю доступна, но сама отказывает не-администратору: admin_only.
    const ok = denied(result) || (fn === 'duel_hide' && /admin_only/.test(JSON.stringify(result.data)));
    ok ? pass(who, `${fn} запрещена (${result.status})`) : fail(who, `вызов ${fn} не отклонён по правам`, `${result.status} ${JSON.stringify(result.data).slice(0, 120)}`);
  }

  // Воркер: генерация — только администратору.
  const gemini = await request('POST', `${SITE}/api/gemini`, token ? { Authorization: `Bearer ${token}` } : {},
    { model: 'gemini-2.0-flash', request: { contents: [{ parts: [{ text: 'ping' }] }] } }, null);
  [401, 403].includes(gemini.status) ? pass(who, `/api/gemini отказал (${gemini.status})`) : fail(who, '/api/gemini ответил', `${gemini.status} ${JSON.stringify(gemini.data).slice(0, 120)}`);
}

/* ── Профиль ученика: своё — можно, чужое — нет ───────────────────── */

async function checkProfile(who, token) {
  const H = visitorHeaders(token);
  const created = await rest('POST', 'rpc/ensure_profile', H, { p_nick: TAG }, null);
  if (created.status >= 300) { fail(who, 'ensure_profile не сработала', `${created.status} ${JSON.stringify(created.data)}`); return; }
  pass(who, 'профиль создаётся');
  const own = rows(await rest('GET', 'student_profiles?select=id,nick', H));
  own.length === 1 && own[0].id === created.data ? pass(who, 'видит ровно свой профиль') : fail(who, 'видит не только свой профиль', `${own.length} шт.`);
  const joined = await rest('POST', 'rpc/join_by_code', H, { p_code: 'AAAA-AAAA' }, null);
  joined.status >= 400 ? pass(who, 'чужой код не подходит') : fail(who, 'подключился по выдуманному коду', JSON.stringify(joined.data));
  await rest('POST', 'rpc/delete_my_profile', H, {}, null);
  const gone = rows(await rest('GET', `student_profiles?select=id&id=eq.${created.data}`, SERVICE)).length === 0;
  gone ? pass(who, 'профиль удаляется самим учеником') : fail(who, 'профиль не удалился', created.data);
}

/* ── Запуск ───────────────────────────────────────────────────────── */

let testUser = null;
try {
  await makeBait();

  // Без входа, ключом anon: профили для него закрыты вовсе.
  await checkVisitor('без входа', null, null);
  const anonProfile = await rest('POST', 'rpc/ensure_profile', visitorHeaders(null), { p_nick: TAG }, null);
  denied(anonProfile) ? pass('без входа', 'профиль без входа не создать') : fail('без входа', 'создал профиль без входа', JSON.stringify(anonProfile.data));

  // С анонимным входом. Роль в данных входа — попытка назначить себя администратором.
  const signup = await request('POST', `${BASE}/auth/v1/signup`, { apikey: env.SUPABASE_ANON_KEY }, { data: { role: 'admin' } }, null);
  if (signup.data?.access_token) {
    testUser = signup.data.user.id;
    await checkVisitor('анонимный вход', signup.data.access_token, testUser);
    await checkProfile('анонимный вход', signup.data.access_token);
  } else {
    const reason = signup.data?.error_code || signup.data?.msg || signup.status;
    problems.push(`анонимный вход не работает (${reason}) — вошедшего посетителя проверить нельзя, профили на сайте не создадутся`);
  }
} finally {
  if (testUser) {
    // Каскад уберёт его строку profiles и участие в профиле.
    const removed = await fetch(`${BASE}/auth/v1/admin/users/${testUser}`, { method: 'DELETE', headers: SERVICE });
    if (!removed.ok) console.error(`⚠ Проверочный пользователь ${testUser} не удалён (${removed.status}) — удалите в Supabase → Authentication.`);
  }
  await removeBait();
}

for (const line of passed) console.log(`  ✓ ${line}`);
if (problems.length) {
  console.log('');
  for (const line of problems) console.log(`  ✗ ${line}`);
}
console.log(`\nПроверок: ${passed.length + problems.length}, проблем: ${problems.length}`);
process.exitCode = problems.length ? 1 : 0;
