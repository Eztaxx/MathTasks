/* Воркер обслуживает три вещи, всё остальное отдаёт статика:
     /sitemap.xml      — карта сайта из каталога Supabase
     /task/<id>-<slug> — мета-теги Open Graph для ботов мессенджеров
     /api/gemini       — прокси к Google Gemini для админки, только администратору

   Раньше это лежало в папке functions/ — соглашение Cloudflare Pages.
   Проект живёт на Workers, где эта папка не выполняется вовсе, поэтому
   карта сайта отдавала HTML главной, превью ссылок не работали,
   а запрос к генератору упирался в SPA-фолбэк.

   Переменные задаются командой:
     npx wrangler secret put SUPABASE_URL
     npx wrangler secret put SUPABASE_KEY
     npx wrangler secret put GEMINI_API_KEY   (без него генератор только встроенный) */

import { isLocalizablePath, latexToPlainText, toLangPath,
  gradeSlug
} from './lib.js';
import { CANONICAL_ORIGIN, renderPage } from './seo.js';

const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ы: 'y', э: 'e',
  ю: 'yu', я: 'ya', ь: '', ъ: ''
};

const slugify = value => (value || '')
  .toLowerCase().split('').map(c => TRANSLIT[c] ?? c).join('')
  .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'topic';

const escapeHtml = value => String(value || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const json = (data, status = 200, extraHeaders = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders }
});

const supabaseKeyOf = env => env.SUPABASE_KEY || env.SUPABASE_ANON_KEY;

const PAGE = 1000;

async function readSupabase(env, path) {
  const key = supabaseKeyOf(env);
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const rows = [];

  /* Читаем страницами. Предел выдачи задан на стороне Supabase и
     срабатывает молча: ни ошибки, ни признака обрезки в теле. Один
     запрос на всю таблицу означал бы, что после какого-то числа задач
     карта сайта перестанет их упоминать, и заметить это будет негде. */
  for (let from = 0; ; from += PAGE) {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
      headers: { ...headers, Range: `${from}-${from + PAGE - 1}`, 'Range-Unit': 'items' }
    });
    if (!response.ok) throw new Error(`supabase ${response.status}`);
    const chunk = await response.json();
    rows.push(...chunk);
    if (chunk.length < PAGE) break;
    /* Страховка от бесконечного цикла, если сервер перестанет сокращать
       выдачу: карта сайта всё равно ограничена пятьюдесятью тысячами. */
    if (rows.length >= 60000) break;
  }
  return rows;
}

/* ── Карта сайта ─────────────────────────────────────────────────── */

const CROSS_TAG_SLUGS = [
  'algebriskie-parveidojumi', 'vienadojumi', 'nevienadibas', 'funkcijas', 'grafiki',
  'koordinatu-metode', 'vektori', 'trigonometrija', 'planimetrija', 'stereometrija',
  'merijumi', 'dalas-procenti', 'dalamiba', 'pakapes-saknes', 'logaritmi',
  'virknes', 'kombinatorika', 'varbutiba', 'statistika', 'matematiska-analize',
  'modelesana', 'teksta-uzdevumi', 'pieradijumi'
];

/* Cloudflare отдаёт файлы страниц без расширения и перенаправляет на такой
   адрес с .html. В карту идёт то, что отдаётся, а не то, что редиректит.
   Латышской версии у этих страниц нет: /lv/exams вернул бы оболочку
   приложения, то есть копию главной. */
const SINGLE_LANGUAGE_PAGES = new Set(['/exams', '/mock-exams', '/trainer', '/plotter', '/duel']);
const BASE_SITEMAP_PATHS = [
  '/', '/tasks', '/tags', '/about', '/control-works', '/lessons', '/exams',
  '/mock-exams', '/trainer', '/plotter', '/duel', '/grade/visparigais',
  '/grade/matematika-1', '/grade/matematika-2'
];

function buildSitemapPaths({ subjects = [], topics = [], tasks = [], tags = [], subtopics = [] } = {}) {
  let paths = BASE_SITEMAP_PATHS.concat(CROSS_TAG_SLUGS.map(slug => `/tag/${slug}`));

  const grades = [...new Set(topics.map(t => t.grade).filter(Boolean))].sort((a, b) => a - b).map(gradeSlug);
  /* Тема или подтема без задач — пустая страница: в карту её не даём, а
     сама страница помечена noindex (seo.js). Появятся задачи — вернётся. */
  const topicsWithTasks = new Set(tasks.map(t => t.topic_id).filter(Boolean));
  const subtopicsWithTasks = new Set(tasks.map(t => t.subtopic_id).filter(Boolean));
  const known = tasks.length > 0;
  topics = topics.filter(t => !known || t.id === undefined || topicsWithTasks.has(t.id));
  subtopics = (subtopics || []).filter(s => !known || s.id === undefined || subtopicsWithTasks.has(s.id));
  const tagSlugs = (tags && tags.length > 0) ? tags.map(t => t.slug) : CROSS_TAG_SLUGS;
  paths = paths
    .concat(grades.map(g => `/grade/${g}`))
    .concat(subjects.map(s => `/subject/${s.slug}`))
    .concat(topics.map(t => `/topic/${t.slug}`))
    .concat((subtopics || []).map(s => `/subtopic/${s.slug}`))
    // /control-work/* не попадает: контрольная повторяет задачи темы и помечена noindex (seo.js).
    .concat(grades.map(g => `/grade/${g}/tasks`))
    .concat(tagSlugs.map(slug => `/tag/${slug}`))
    .concat(tasks.map(t => `/task/${t.id}-${slugify(t.title)}`));

  return [...new Set(paths)];
}

/* Дата последнего изменения страницы. updated_at есть только у задач,
   поэтому свежесть списка — это свежесть самой свежей задачи в нём: именно
   её появление и меняет страницу. Страницы без своего содержимого («О
   проекте», тренажёры) даты не получают: выдуманный lastmod поисковик
   быстро перестаёт принимать всерьёз. */
function buildSitemapDates({ subjects = [], topics = [], tasks = [], subtopics = [] } = {}) {
  const dates = new Map();
  const bump = (path, value) => {
    const day = String(value || '').slice(0, 10);
    if (!path || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
    const known = dates.get(path);
    if (!known || known < day) dates.set(path, day);
  };
  const topicById = new Map(topics.map(topic => [topic.id, topic]));
  const subjectById = new Map(subjects.map(subject => [subject.id, subject]));
  const subtopicById = new Map((subtopics || []).map(sub => [sub.id, sub]));

  for (const task of tasks) {
    const day = task.updated_at || task.created_at;
    bump(`/task/${task.id}-${slugify(task.title)}`, day);
    bump('/', day);
    bump('/tasks', day);
    const topic = topicById.get(task.topic_id);
    if (topic) {
      bump(`/topic/${topic.slug}`, day);
      if (topic.grade) {
        bump(`/grade/${gradeSlug(topic.grade)}`, day);
        bump(`/grade/${gradeSlug(topic.grade)}/tasks`, day);
      }
      const subject = subjectById.get(topic.subject_id);
      if (subject) bump(`/subject/${subject.slug}`, day);
    }
    const sub = subtopicById.get(task.subtopic_id);
    if (sub) bump(`/subtopic/${sub.slug}`, day);
  }
  return dates;
}

/* У страниц каталога две языковые версии: русская без префикса и латышская
   на /lv/…. В карту идут обе, и у каждой — ссылки на обе версии
   (xhtml:link hreflang, x-default — латышская). Файлы — trainer.html,
   exams.html — одноязычные по адресу и идут одной строкой. */
function buildSitemapXml(paths, origin = 'https://mathtasks.lv', dates = new Map()) {
  const cleanOrigin = String(origin || '').replace(/\/+$/, '');
  const entries = [];
  for (const p of new Set(paths)) {
    const pathOnly = p.split(/[?#]/)[0];
    const day = dates.get(pathOnly);
    const lastmod = day ? `<lastmod>${day}</lastmod>` : '';
    if (SINGLE_LANGUAGE_PAGES.has(pathOnly) || !isLocalizablePath(pathOnly)) {
      entries.push(`  <url><loc>${escapeHtml(cleanOrigin + p)}</loc>${lastmod}</url>`);
      continue;
    }
    const rest = p.slice(pathOnly.length);
    const ru = cleanOrigin + toLangPath(pathOnly, 'ru') + rest;
    const lv = cleanOrigin + toLangPath(pathOnly, 'lv') + rest;
    const alternates = [['ru', ru], ['lv', lv], ['x-default', lv]]
      .map(([lang, href]) => `\n    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeHtml(href)}"/>`)
      .join('');
    entries.push(`  <url><loc>${escapeHtml(ru)}</loc>${lastmod}${alternates}\n  </url>`);
    entries.push(`  <url><loc>${escapeHtml(lv)}</loc>${lastmod}${alternates}\n  </url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>`;
}

async function sitemap(request, env) {
  const origin = new URL(request.url).origin;
  let paths;
  let dates = new Map();

  if (env.SUPABASE_URL && supabaseKeyOf(env)) {
    try {
      const [subjects, topics, tasks, tags, subtopics] = await Promise.all([
        readSupabase(env, 'subjects?select=id,slug'),
        readSupabase(env, 'topics?select=id,slug,grade,subject_id'),
        // Черновики в карту не попадают — их и на сайте не видно.
        readSupabase(env, 'tasks?select=id,title,topic_id,subtopic_id,updated_at,created_at&is_published=eq.true'),
        readSupabase(env, 'tags?select=slug').catch(() => []),
        // Подтемы появляются миграцией 020: до неё запрос падает, карта живёт без них.
        readSupabase(env, 'subtopics?select=id,slug').catch(() => [])
      ]);
      paths = buildSitemapPaths({ subjects, topics, tasks, tags, subtopics });
      dates = buildSitemapDates({ subjects, topics, tasks, subtopics });
    } catch (error) {
      // Каталог не прочитался — отдаём статические адреса, а не пустоту.
      console.error('sitemap:', error.message);
      paths = buildSitemapPaths();
    }
  } else {
    paths = buildSitemapPaths();
  }

  // Адреса в карте — всегда основного домена: там же указывает и canonical.
  const body = buildSitemapXml(paths, origin.endsWith('.workers.dev') ? CANONICAL_ORIGIN : origin, dates);

  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' }
  });
}

/* ── Превью ссылки на задачу для ботов ───────────────────────────── */

const BOT_PATTERNS = ['telegrambot', 'whatsapp', 'facebookexternalhit', 'twitterbot',
  'vkshare', 'discordbot', 'slackbot', 'linkedinbot', 'viber', 'applebot'];

const isSocialBot = ua => BOT_PATTERNS.some(bot => (ua || '').toLowerCase().includes(bot));

/* Бот мессенджера формулы не рисует, поэтому LaTeX переводится в обычные
   символы. Сам перевод живёт в lib.js (latexToPlainText): им же пользуются
   страницы для поисковиков (seo.js) и описание задачи в приложении. */
const cleanLatexForPreview = (latex = '') => latexToPlainText(latex, 200);

function renderTaskPreviewHtml(task, { url, origin } = {}) {
  const taskUrl = url || (origin ? `${origin}/task/${task.id}` : `/task/${task.id}`);
  const siteOrigin = origin || (url ? new URL(url).origin : '');

  /* Превью читают боты мессенджеров: языка посетителя у них нет.
     Аудитория сайта латышская, поэтому берём латышский, а русский
     оставляем запасным — на случай, если перевода у записи нет. */
  const pick = (lv, ru) => (lv && String(lv).trim()) || ru || '';
  const topicName = pick(task.topics?.title_lv, task.topics?.title);
  const topicTitle = topicName ? ` • ${topicName}` : '';
  const gradeLabel = task.topics?.grade ? ` [${task.topics.grade}. klase]` : '';
  const pageTitle = `${pick(task.title_lv, task.title)}${gradeLabel}${topicTitle} — MathTasks`;
  const description = cleanLatexForPreview(pick(task.condition_latex_lv, task.condition_latex))
    || 'Matemātikas uzdevums ar atbildi, zīmējumu un soli pa solim atrisinājumu.';
  const imageUrl = task.condition_image || (siteOrigin ? `${siteOrigin}/favicon.svg` : '/favicon.svg');

  return `<!DOCTYPE html>
<html lang="lv">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeHtml(taskUrl)}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:site_name" content="MathTasks — Skola2030">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  <link rel="canonical" href="${escapeHtml(taskUrl)}">
</head>
<body>
  <h1>${escapeHtml(pick(task.title_lv, task.title))}</h1>
  <p>${escapeHtml(description)}</p>
  <p><a href="${escapeHtml(taskUrl)}">Skatīt uzdevumu MathTasks portālā</a></p>
</body>
</html>`;
}

async function taskPreview(request, env, taskId) {
  if (!env.SUPABASE_URL || !supabaseKeyOf(env)) return null;
  let task;
  try {
    const rows = await readSupabase(env,
      `tasks?id=eq.${taskId}&select=id,title,title_lv,condition_latex,condition_latex_lv,condition_image,topics(title,title_lv,grade)&limit=1`);
    task = rows && rows[0];
  } catch (error) {
    console.error('og:', error.message);
    return null;
  }
  if (!task) return null;

  const origin = new URL(request.url).origin;
  const html = renderTaskPreviewHtml(task, { url: request.url, origin });

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
  });
}

/* ── Прокси к Gemini ─────────────────────────────────────────────── */

/* Ключ Gemini живёт в секретах воркера (GEMINI_API_KEY) и в браузер не
   попадает. Промпт по-прежнему собирает админка — воркер проверяет, что
   запрос от администратора, подставляет ключ и пересылает тело модели.

   Роль спрашиваем у самой базы: rpc/is_admin с токеном пользователя.
   Supabase сам проверит подпись и срок токена, а is_admin() — та же
   функция, что защищает таблицы, так что правило одно на всё. */
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = /^gemini-[a-z0-9.-]{1,40}$/;

/* Не больше 30 запросов в минуту на человека: пачка с повторами и
   перебором моделей укладывается, а общую квоту один вход не выжжет.
   Счёт живёт в памяти экземпляра воркера — это страховка, а не учёт:
   экземпляров бывает несколько, и после простоя счёт обнуляется. */
const GEMINI_RATE_LIMIT = 30;
const GEMINI_RATE_WINDOW_MS = 60_000;
const geminiCalls = new Map();

function tokenSubject(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).sub || null;
  } catch {
    return null;
  }
}

/* Сколько секунд ждать, если лимит исчерпан; 0 — можно. */
function geminiWaitSeconds(user, now = Date.now()) {
  const recent = (geminiCalls.get(user) || []).filter(time => now - time < GEMINI_RATE_WINDOW_MS);
  if (recent.length >= GEMINI_RATE_LIMIT) {
    geminiCalls.set(user, recent);
    return Math.max(1, Math.ceil((GEMINI_RATE_WINDOW_MS - (now - recent[0])) / 1000));
  }
  recent.push(now);
  geminiCalls.set(user, recent);
  return 0;
}

async function isAdminToken(env, token) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/is_admin`, {
    method: 'POST',
    headers: { apikey: supabaseKeyOf(env), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{}'
  });
  return response.ok && (await response.json()) === true;
}

async function geminiProxy(request, env) {
  if (request.method !== 'POST') return json({ error: 'Ожидался POST-запрос.' }, 405);

  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'Запрос пришёл без входа — войдите в админку заново.' }, 401);
  if (!env.GEMINI_API_KEY || !env.SUPABASE_URL) {
    return json({ error: 'Ключ Gemini на сервере не задан: npx wrangler secret put GEMINI_API_KEY.' }, 501);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ожидался JSON в теле запроса.' }, 400);
  }
  const model = String(body?.model || '');
  if (!GEMINI_MODEL.test(model) || !body.request || typeof body.request !== 'object') {
    return json({ error: 'В запросе нужны model (gemini-…) и request.' }, 400);
  }

  let admin;
  try {
    admin = await isAdminToken(env, token);
  } catch {
    return json({ error: 'База не ответила на проверку роли — попробуйте ещё раз.' }, 502);
  }
  if (!admin) return json({ error: 'Генерация доступна только администратору. Войдите в админку заново.' }, 403);

  const wait = geminiWaitSeconds(tokenSubject(token) || token);
  if (wait) {
    return json({ error: `Слишком много запросов к модели — подождите ${wait} с.` }, 429, { 'Retry-After': String(wait) });
  }

  let upstream;
  try {
    upstream = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify(body.request)
    });
  } catch (error) {
    return json({ error: `Модель не ответила: ${error.message}` }, 504);
  }

  /* Ответ модели отдаём как есть, с её кодом: повторы при 429 и 5xx и
     перебор моделей остаются на стороне админки, как были. */
  const headers = { 'Content-Type': upstream.headers.get('content-type') || 'application/json', 'Cache-Control': 'no-store' };
  const retryAfter = upstream.headers.get('retry-after');
  if (retryAfter) headers['Retry-After'] = retryAfter;
  return new Response(upstream.body, { status: upstream.status, headers });
}

/* ── Файлы сборки с устаревшим хешем ─────────────────────────────── */

/* Выкладка сразу удаляет прежние файлы сборки, а новая страница расходится
   по серверам не мгновенно: несколько секунд посетителю ещё отдаётся старая,
   и она просит assets/style-<старый хеш>.css. Статика отвечает на это
   SPA-оболочкой (text/html) — браузер отказывается её применять, и сайт
   показывается без стилей. Такой запрос получает текущий файл того же вида
   (имя из свежего index.html); под старым именем его не кэшируем. */
const STALE_ASSET = /^\/assets\/([A-Za-z0-9]+)-[\w-]+\.(css|js)$/;

async function serveAsset(request, env) {
  const response = await env.ASSETS.fetch(request);
  const url = new URL(request.url);
  const isHtml = (response.headers.get('content-type') || '').includes('text/html');
  const stale = isHtml && url.pathname.match(STALE_ASSET);
  /* Файла нет, и на устаревший хеш он не похож: Cloudflare подставляет
     оболочку приложения, и /assets/nothing.txt отвечал HTML с кодом 200.
     В папке сборки лежат только файлы — значит, это 404. */
  if (!stale) return isHtml ? new Response('Not found', { status: 404 }) : response;

  const [, name, ext] = stale;
  const shell = await (await env.ASSETS.fetch(new Request(new URL('/', url)))).text();
  const current = shell.match(new RegExp(`/assets/${name}-[\\w-]+\\.${ext}`));
  if (!current || current[0] === url.pathname) return new Response('Not found', { status: 404 });

  const fresh = await env.ASSETS.fetch(new Request(new URL(current[0], url)));
  const headers = new Headers(fresh.headers);
  headers.set('Cache-Control', 'no-store');
  return new Response(fresh.body, { status: fresh.status, headers });
}

export {
  TRANSLIT,
  CROSS_TAG_SLUGS,
  BASE_SITEMAP_PATHS,
  BOT_PATTERNS,
  slugify,
  escapeHtml,
  cleanLatexForPreview,
  isSocialBot,
  buildSitemapDates,
  buildSitemapPaths,
  buildSitemapXml,
  renderTaskPreviewHtml,
  sitemap,
  taskPreview,
  geminiProxy,
  serveAsset
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/sitemap.xml') return sitemap(request, env);
    if (url.pathname === '/api/gemini') return geminiProxy(request, env);
    if (url.pathname.startsWith('/assets/')) return serveAsset(request, env);

    // Страница задачи: ботам отдаём мета-теги, людям — обычное приложение.
    const taskMatch = url.pathname.match(/^(?:\/lv)?\/task\/(\d+)/);
    if (taskMatch && isSocialBot(request.headers.get('user-agent'))) {
      const preview = await taskPreview(request, env, taskMatch[1]);
      if (preview) return preview;
    }

    /* Отдельных страниц под /lv не существует: /lv/trainer отдавал оболочку
       главной с кодом 200. Уводим на сам адрес — старые ссылки живут. */
    const langPage = url.pathname.match(/^\/lv\/(trainer|exams|mock-exams|plotter|duel)\/?$/);
    if (langPage) return Response.redirect(new URL(`/${langPage[1]}`, url).toString(), 301);

    // Уровни средней школы живут по словам: /grade/10 → /grade/visparigais.
    const numericLevel = url.pathname.match(/^(\/lv)?\/grade\/(10|11|12)(\/tasks)?\/?$/);
    if (numericLevel) {
      const target = new URL(`${numericLevel[1] || ''}/grade/${gradeSlug(numericLevel[2])}${numericLevel[3] || ''}${url.search}`, url);
      return Response.redirect(target.toString(), 301);
    }

    /* Через renderPage идёт всё: для известного адреса он подставляет
       заголовок, описание и canonical; файл (картинку, скрипт, отдельную
       страницу) отдаёт как есть; а на неизвестном адресе возвращает честный
       404 вместо оболочки приложения с кодом 200. Раньше сюда попадали
       только известные адреса, и ветка с 404 была недостижима. */
    return renderPage(request, env);
  }
};
