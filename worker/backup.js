/* Ночная резервная копия и уведомления о сообщениях об ошибках.

   Копия — раз в сутки (BACKUP_CRON). Те же таблицы, что пишет
   scripts/backup.mjs, плюс профили учеников и дуэли, уходят одним JSON в
   закрытый бакет Supabase «backups» (db/mathtasks-<время>.json). Хранятся
   последние BACKUP_KEEP копий. В JSON копии — ссылки на файлы бакетов
   (чертежи), а сами файлы копирует туда же отдельный шаг (MIRROR_CRON,
   каждые 10 минут): files/<бакет>/<путь>, только новые и изменившиеся.
   Целиком, с файлами внутри, копию собирает npm run backup:pull — её
   понимает npm run restore.

   На бесплатном тарифе у воркера на вызов 50 запросов наружу и мало
   процессорного времени. Поэтому копирование файлов вынесено в свой вызов
   и ведёт счёт запросам (MAX_SUBREQUESTS), а JSON таблиц не разбирается:
   страницы приходят текстом и склеиваются как есть, число строк берётся
   из заголовка Content-Range.

   Уведомления — каждые 10 минут (REPORTS_CRON): сообщения об ошибках,
   пришедшие за эти 10 минут, уходят в Telegram со ссылкой в редактор.
   Каждое сообщение попадает ровно в одно окно, поэтому помнить, что уже
   отправлено, не нужно.

   Секреты: SUPABASE_SERVICE_ROLE_KEY уже есть (им пишут дуэли). Для
   уведомлений нужны ещё два:
     npx wrangler secret put TELEGRAM_BOT_TOKEN
     npx wrangler secret put TELEGRAM_CHAT_ID
   Без них уведомлений просто нет. */

export const BACKUP_BUCKET = 'backups';
export const BACKUP_KEEP = 14;
export const BACKUP_CRON = '0 3 * * *';
export const REPORTS_CRON = '*/10 * * * *';
export const MIRROR_CRON = '5-59/10 * * * *';
// Бесплатный тариф Cloudflare — 50 запросов наружу за вызов; пять — в запас.
export const MAX_SUBREQUESTS = 45;
const REPORT_WINDOW_MS = 10 * 60 * 1000;
const PAGE = 1000;
const ORIGIN = 'https://mathtasks.lv';

/* Порядок — как в scripts/backup.mjs: сначала то, на что ссылаются. key —
   первичный ключ, по нему таблица читается страницами однозначно.
   Профили и дуэли (миграции 027–028) scripts/restore.mjs не возвращает,
   но в копии они есть — вернуть их можно руками. */
export const BACKUP_TABLES = [
  { name: 'subjects', key: 'id' },
  { name: 'topics', key: 'id' },
  { name: 'subtopics', key: 'id' },
  { name: 'tasks', key: 'id' },
  { name: 'tags', key: 'id' },
  { name: 'task_tags', key: 'task_id,tag_id' },
  { name: 'exam_papers', key: 'id' },
  { name: 'exam_paper_topics', key: 'paper_id,topic_id' },
  { name: 'exam_paper_items', key: 'id' },
  { name: 'task_reports', key: 'id' },
  { name: 'profiles', key: 'id', optional: true },
  { name: 'student_profiles', key: 'id', optional: true },
  { name: 'profile_members', key: 'user_id', optional: true },
  { name: 'student_progress', key: 'profile_id', optional: true },
  { name: 'duel_runs', key: 'id', optional: true }
];

const serviceHeaders = env => ({
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
});

export const backupReady = env => Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

// Страницы одной таблицы текстом: «[{…},{…}]» + «[{…}]» → один массив.
export const joinPages = pages => {
  const inner = pages.map(page => page.trim().replace(/^\[/, '').replace(/\]$/, '').trim()).filter(Boolean);
  return `[${inner.join(',')}]`;
};

// «0-999/1420» → 1420; «*/0» → 0. Без заголовка страницы не сосчитать.
export const totalFromRange = header => {
  const match = /\/(\d+)\s*$/.exec(String(header || ''));
  return match ? Number(match[1]) : null;
};

async function tableText(env, table, count = null) {
  const pages = [];
  let total = 0;
  for (let from = 0; ; from += PAGE) {
    const response = await counted(count, `${env.SUPABASE_URL}/rest/v1/${table.name}?select=*&order=${table.key}`, {
      headers: { ...serviceHeaders(env), Range: `${from}-${from + PAGE - 1}`, 'Range-Unit': 'items', Prefer: 'count=exact' }
    });
    if (!response.ok) throw new Error(`${table.name}: ${response.status}`);
    pages.push(await response.text());
    total = totalFromRange(response.headers.get('content-range'));
    if (total === null) throw new Error(`${table.name}: база не сказала, сколько строк`);
    if (from + PAGE >= total) break;
  }
  return { text: joinPages(pages), count: total };
}

// Каждый запрос наружу на счету: у бесплатного тарифа их 50 на вызов.
const counted = (count, url, init) => {
  if (count) count.n++;
  return fetch(url, init);
};

async function storageJson(env, path, init = {}, count = null) {
  const response = await counted(count, `${env.SUPABASE_URL}/storage/v1/${path}`, {
    ...init,
    headers: { ...serviceHeaders(env), 'Content-Type': 'application/json', ...(init.headers || {}) }
  });
  if (!response.ok) throw new Error(`storage ${path}: ${response.status} ${(await response.text()).slice(0, 120)}`);
  return response.json();
}

// Бакет для копий — закрытый; создаётся при первом запуске.
async function ensureBucket(env, count) {
  const probe = await counted(count, `${env.SUPABASE_URL}/storage/v1/bucket/${BACKUP_BUCKET}`, { headers: serviceHeaders(env) });
  if (probe.ok) return;
  await storageJson(env, 'bucket', {
    method: 'POST',
    body: JSON.stringify({ id: BACKUP_BUCKET, name: BACKUP_BUCKET, public: false })
  }, count);
}

async function listFolder(env, bucket, prefix, count = null) {
  const out = [];
  for (let offset = 0; ; offset += 100) {
    const chunk = await storageJson(env, `object/list/${bucket}`, {
      method: 'POST',
      body: JSON.stringify({ prefix, limit: 100, offset, sortBy: { column: 'name', order: 'asc' } })
    }, count);
    out.push(...chunk);
    if (chunk.length < 100) return out;
  }
}

// Рекурсивного обхода у Storage API нет: у папки нет metadata, по нему и отличаем.
async function walk(env, bucket, prefix, depth, count) {
  if (depth > 4) return [];
  const files = [];
  for (const entry of await listFolder(env, bucket, prefix, count)) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.metadata) {
      files.push({ path, size: entry.metadata.size, type: entry.metadata.mimetype, updated: entry.updated_at || entry.metadata.lastModified || '' });
    } else {
      files.push(...await walk(env, bucket, path, depth + 1, count));
    }
  }
  return files;
}

async function putObject(env, path, body, type, count = null) {
  const response = await counted(count, `${env.SUPABASE_URL}/storage/v1/object/${BACKUP_BUCKET}/${path}`, {
    method: 'POST',
    headers: { ...serviceHeaders(env), 'Content-Type': type || 'application/octet-stream', 'x-upsert': 'true' },
    body
  });
  if (!response.ok) throw new Error(`запись ${path}: ${response.status} ${(await response.text()).slice(0, 120)}`);
}

async function readManifest(env, count) {
  const response = await counted(count, `${env.SUPABASE_URL}/storage/v1/object/${BACKUP_BUCKET}/files/manifest.json`, { headers: serviceHeaders(env) });
  if (!response.ok) return {};
  try { return await response.json(); } catch { return {}; }
}

// Что лежит в бакетах сейчас (кроме самого «backups») — для ссылок в копии.
async function storageFiles(env, count) {
  const buckets = (await storageJson(env, 'bucket', {}, count)).filter(bucket => bucket.name !== BACKUP_BUCKET);
  const files = [];
  for (const bucket of buckets) {
    for (const file of await walk(env, bucket.name, '', 0, count)) {
      files.push({ ...file, bucket: bucket.name, ref: `files/${bucket.name}/${file.path}` });
    }
  }
  return { buckets: buckets.map(bucket => ({ name: bucket.name, public: bucket.public })), files };
}

const fileStamp = file => `${file.size}|${file.updated}`;

/* Шаг копирования файлов (MIRROR_CRON): новые и изменившиеся — в
   files/<бакет>/<путь>, сколько влезет в лимит запросов вызова; остальные
   докопирует следующий шаг. Сверка — по размеру и времени изменения. */
export async function mirrorStep(env) {
  if (!backupReady(env)) return { copied: 0, skipped: 'нет ключа базы' };
  const count = { n: 0 };
  await ensureBucket(env, count);
  const { files } = await storageFiles(env, count);
  const manifest = await readManifest(env, count);
  const stale = files.filter(file => manifest[`${file.bucket}/${file.path}`] !== fileStamp(file));
  let copied = 0;
  for (const file of stale) {
    // Два запроса на файл и ещё один — записать список скопированного.
    if (count.n + 3 > MAX_SUBREQUESTS) break;
    const source = await counted(count, `${env.SUPABASE_URL}/storage/v1/object/${file.bucket}/${file.path}`, { headers: serviceHeaders(env) });
    if (!source.ok) continue; // файл могли удалить между списком и чтением
    await putObject(env, file.ref, await source.arrayBuffer(), file.type, count);
    manifest[`${file.bucket}/${file.path}`] = fileStamp(file);
    copied++;
  }
  if (copied) await putObject(env, 'files/manifest.json', JSON.stringify(manifest), 'application/json', count);
  return { copied, pending: stale.length - copied, requests: count.n };
}

// Копии старше последних keep — на удаление. Имена сортируются по времени сами.
export const expiredBackups = (names, keep = BACKUP_KEEP) => {
  const sorted = names.filter(name => /^mathtasks-.*\.json$/.test(name)).sort();
  return sorted.slice(0, Math.max(0, sorted.length - keep));
};

export async function listBackups(env) {
  const entries = await listFolder(env, BACKUP_BUCKET, 'db');
  return entries
    .filter(entry => entry.metadata && /^mathtasks-.*\.json$/.test(entry.name))
    .map(entry => ({ name: entry.name, size: entry.metadata.size, created: entry.created_at || entry.updated_at || '' }))
    .sort((a, b) => (a.name < b.name ? 1 : -1));
}

export async function runBackup(env, now = new Date()) {
  if (!backupReady(env)) throw new Error('Нет SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY в секретах воркера');
  const count = { n: 0 };
  await ensureBucket(env, count);

  const tables = [];
  const counts = {};
  for (const table of BACKUP_TABLES) {
    try {
      const { text, count: rows } = await tableText(env, table, count);
      tables.push([table.name, text]);
      counts[table.name] = rows;
    } catch (error) {
      if (!table.optional) throw error;
    }
  }
  /* Пустая выгрузка — почти наверняка сбой доступа, а не пустая база:
     такая копия вытеснила бы из хранилища хорошую. */
  if (!counts.tasks || !counts.topics) throw new Error('Задачи или темы не выгрузились — копия не записана');

  const storage = await storageFiles(env, count);
  const files = storage.files.map(({ bucket, path, type, size, ref }) => ({ bucket, path, type, size, ref }));
  const takenAt = now.toISOString();
  const stamp = takenAt.replace(/[:.]/g, '-').slice(0, 19);
  const name = `mathtasks-${stamp}.json`;
  const project = env.SUPABASE_URL.replace(/^https?:\/\//, '').split('.')[0];
  const body = `{"takenAt":${JSON.stringify(takenAt)},"project":${JSON.stringify(project)},"source":"worker",`
    + `"counts":${JSON.stringify(counts)},`
    + `"tables":{${tables.map(([table, text]) => `${JSON.stringify(table)}:${text}`).join(',')}},`
    + `"storage":${JSON.stringify({ buckets: storage.buckets, files })}}`;
  await putObject(env, `db/${name}`, body, 'application/json', count);

  const expired = expiredBackups((await listFolder(env, BACKUP_BUCKET, 'db', count)).map(entry => entry.name));
  if (expired.length) {
    await storageJson(env, `object/${BACKUP_BUCKET}`, {
      method: 'DELETE',
      body: JSON.stringify({ prefixes: expired.map(file => `db/${file}`) })
    }, count);
  }
  return { name, bytes: body.length, counts, files: files.length, removed: expired.length, requests: count.n };
}

/* ── Уведомления о сообщениях об ошибках ──────────────────────────── */

const KIND_TEXT = {
  condition: 'условие', answer: 'ответ', solution: 'решение',
  figure: 'чертёж', translation: 'перевод', other: 'другое'
};

export const notifyReady = env => Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID && backupReady(env));

// Текст уведомления — обычный, без разметки: в нём формулы и скобки.
export const reportMessage = (report, task) => [
  `Сообщение об ошибке · ${KIND_TEXT[report.kind] || report.kind} · ${String(report.lang || 'ru').toUpperCase()}`,
  `Задача #${report.task_id}${task?.title ? ` «${task.title}»` : ''}${task?.grade ? ` · ${task.grade} кл.` : ''}`,
  '',
  String(report.message || '').trim() || '(без текста)',
  '',
  `Исправить: ${ORIGIN}/admin#task-${report.task_id}`,
  `На сайте: ${ORIGIN}/task/${report.task_id}`
].join('\n');

export async function sendTelegram(env, text) {
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true })
  });
  if (!response.ok) throw new Error(`telegram ${response.status} ${(await response.text()).slice(0, 120)}`);
}

// Окно — последние 10 минут до запуска по расписанию: [начало, конец).
export const reportWindow = scheduledTime => {
  const end = new Date(Math.floor(Number(scheduledTime) / 60000) * 60000);
  return { from: new Date(end.getTime() - REPORT_WINDOW_MS), to: end };
};

export async function notifyReports(env, scheduledTime) {
  if (!notifyReady(env)) return { sent: 0, skipped: 'нет секретов Telegram' };
  const { from, to } = reportWindow(scheduledTime);
  const query = `task_reports?select=id,task_id,kind,message,lang,created_at`
    + `&created_at=gte.${encodeURIComponent(from.toISOString())}&created_at=lt.${encodeURIComponent(to.toISOString())}`
    + '&order=id&limit=20';
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${query}`, { headers: serviceHeaders(env) });
  if (!response.ok) throw new Error(`task_reports: ${response.status}`);
  const reports = await response.json();
  if (!reports.length) return { sent: 0 };

  const ids = [...new Set(reports.map(report => report.task_id))];
  const tasksResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/tasks?select=id,title,grade&id=in.(${ids.join(',')})`, { headers: serviceHeaders(env) });
  const tasks = tasksResponse.ok ? await tasksResponse.json() : [];
  let sent = 0;
  for (const report of reports) {
    await sendTelegram(env, reportMessage(report, tasks.find(task => task.id === report.task_id)));
    sent++;
  }
  return { sent };
}
