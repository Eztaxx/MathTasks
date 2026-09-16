/* Service worker: сайт как приложение на телефоне.

   Стратегия — «сначала сеть»: пока интернет есть, посетитель получает ровно
   то же, что и без воркера, — свежие файлы и данные. Копии ответов при этом
   складываются в кэш и выручают, когда сети нет: тренажёры работают целиком
   (примеры генерируются в браузере), в каталоге открывается то, что уже
   смотрели.

   Номер сборки подставляет scripts/post-build.js. Пока он не подставлен
   (vite dev), воркер ничего не перехватывает — разработке кэш не мешает. */

const BUILD = '__BUILD__';
const DEV = BUILD.startsWith('__');

const CORE = `mt-core-${BUILD}`; // страницы и их файлы на момент выкладки — у каждой сборки свой
const RUNTIME = 'mt-runtime';     // всё, что посетитель открывал сам
const DATA = 'mt-data';           // ответы Supabase: задачи, темы, чертежи
const LIMITS = { [RUNTIME]: 200, [DATA]: 500 };

// Открываются без сети сразу после установки, даже если посетитель на них ещё не заходил.
const PAGES = ['/', '/trainer.html', '/exams.html', '/mock-exams.html'];

// Внешние файлы страниц: KaTeX и supabase-js с jsDelivr, шрифты Google.
const CDN_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

/* Отдельные HTML-страницы. Остальные адреса без расширения — маршруты
   каталога: без сети им подходит оболочка главной, дальше разберётся app.js. */
const FILE_PAGES = ['/trainer', '/exams', '/mock-exams', '/admin'];

/* Ключ страницы в кэше. Сервер переводит /trainer.html на /trainer, а
   ссылки на сайте ведут на .html — без приведения к одному виду страница,
   открытая по одному адресу, не находилась бы по другому. */
function pageKey(url) {
  const { pathname } = new URL(url, self.location.origin);
  return pathname.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/(.)\/+$/, '$1') || '/';
}

const isFileKey = key => FILE_PAGES.includes(key) || /\.[a-z0-9]+$/i.test(key);

/* Файлы, которые страница подключает: скрипты, стили, иконки. Предварительные
   соединения (preconnect), canonical и прочие ссылки файлами не являются. */
function assetUrls(html, base) {
  const origin = new URL(base).origin;
  const urls = [];
  for (const [tag] of html.matchAll(/<(?:script|link)\b[^>]*>/gi)) {
    if (/^<link/i.test(tag) && !/\brel="(?:stylesheet|icon|apple-touch-icon|manifest)"/i.test(tag)) continue;
    const ref = tag.match(/\b(?:src|href)="([^"]+)"/i);
    if (!ref) continue;
    const url = new URL(ref[1].replace(/&amp;/g, '&'), base);
    if (url.origin === origin || CDN_HOSTS.includes(url.hostname)) urls.push(url.href);
  }
  return [...new Set(urls)];
}

// Шрифты, на которые ссылается таблица стилей (KaTeX): без них формулы без сети рассыпаются.
function fontUrls(css, base) {
  return [...new Set([...css.matchAll(/url\(\s*['"]?([^'")]+\.woff2)['"]?\s*\)/g)].map(match => new URL(match[1], base).href))];
}

function tokenSubject(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).sub || null;
  } catch {
    return null;
  }
}

/* Ключ ответа Supabase. Вошедший человек (токен в Authorization не равен
   публичному ключу) видит через RLS своё — например, администратор видит
   черновики. Его ответы кладём под отдельным ключом, чтобы на общем
   телефоне без сети они не достались другому. Токен, из которого не
   прочитать пользователя, не кэшируем вовсе (null). */
function dataKey(request) {
  const url = new URL(request.url);
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (token && token !== request.headers.get('apikey')) {
    const user = tokenSubject(token);
    if (!user) return null;
    url.searchParams.set('__sw_user', user);
  }
  // .single() просит объект вместо массива по тому же адресу.
  if ((request.headers.get('accept') || '').includes('vnd.pgrst.object')) url.searchParams.set('__sw_one', '1');
  return url.href;
}

/* Как отвечать на запрос; null — не вмешиваться, пусть идёт в сеть как обычно. */
function strategyOf(request) {
  if (request.method !== 'GET') return null;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/api/') || url.pathname === '/sitemap.xml' || url.pathname === '/sw.js') return null;
    if (request.mode === 'navigate') return 'page';
    // Файлы сборки с хешем в имени не меняются никогда.
    return url.pathname.startsWith('/assets/') ? 'immutable' : 'static';
  }
  // На CDN адреса с номером версии (katex@0.16.22) — содержимое по ним не меняется.
  if (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'fonts.gstatic.com') return 'immutable';
  if (url.hostname === 'fonts.googleapis.com') return 'static';
  if (url.hostname.endsWith('.supabase.co') && /^\/(rest|storage)\/v1\//.test(url.pathname)) {
    return dataKey(request) ? 'data' : null;
  }
  return null;
}

/* В кэш — только целые удачные ответы: без частичных (206) и без
   перенаправлений, которые браузер не примет в ответ на переход. Непрозрачные
   ответы (картинка или стиль с чужого сервера без CORS) годятся как есть. */
const cacheable = response => response.type === 'opaque'
  || (response.status === 200 && !response.redirected && (response.type === 'basic' || response.type === 'cors'));

async function trim(cacheName) {
  const limit = LIMITS[cacheName];
  if (!limit) return;
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  // Ключи идут в порядке записи: удаляем самые давние.
  await Promise.all(keys.slice(0, Math.max(0, keys.length - limit)).map(key => cache.delete(key)));
}

function remember(event, cacheName, key, response) {
  if (!cacheable(response)) return;
  const copy = response.clone();
  event.waitUntil(caches.open(cacheName)
    .then(cache => cache.put(key, copy))
    .then(() => trim(cacheName))
    .catch(() => {}));
}

async function page(event) {
  const key = pageKey(event.request.url);
  try {
    const response = (await event.preloadResponse) || await fetch(event.request);
    remember(event, RUNTIME, key, response);
    return response;
  } catch {
    /* Без сети. Страницы из PAGES берём из снимка текущей сборки: там
       страница и её скрипты одной версии. */
    const core = await caches.open(CORE);
    return await core.match(key)
      || await caches.match(key, { ignoreVary: true })
      || (!isFileKey(key) && await caches.match('/', { ignoreVary: true }))
      || Response.error();
  }
}

/* looseSearch: без сети /trainer.js?v=<новая> заменит /trainer.js?v=<старая> —
   номер версии в адресе меняется при каждой правке, а файл тот же. */
async function networkFirst(event, cacheName, key, looseSearch) {
  try {
    const response = await fetch(event.request);
    remember(event, cacheName, key, response);
    return response;
  } catch (error) {
    const cached = await caches.match(key, { ignoreVary: true })
      || (looseSearch && await caches.match(key, { ignoreVary: true, ignoreSearch: true }));
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(event) {
  const cached = await caches.match(event.request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(event.request);
  remember(event, RUNTIME, event.request, response);
  return response;
}

const HANDLERS = {
  page,
  static: event => networkFirst(event, RUNTIME, event.request, true),
  immutable: cacheFirst,
  data: event => networkFirst(event, DATA, dataKey(event.request), false)
};

async function precache() {
  const cache = await caches.open(CORE);
  const assets = new Set();
  // Страницы обязательны: не скачались — установка сорвётся и повторится при следующем заходе.
  await Promise.all(PAGES.map(async path => {
    const response = await fetch(path, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`${path}: ${response.status}`);
    const html = await response.text();
    // Новый ответ вместо полученного: у того стоит отметка о перенаправлении с .html.
    await cache.put(pageKey(path), new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
    assetUrls(html, response.url).forEach(url => assets.add(url));
  }));
  // Файлы страниц — по возможности: недоступный CDN не должен срывать установку.
  await Promise.allSettled([...assets].map(async url => {
    const response = await fetch(url);
    if (!cacheable(response)) return;
    if (new URL(url).hostname === 'cdn.jsdelivr.net' && /\.css$/.test(url)) {
      const fonts = fontUrls(await response.clone().text(), url);
      await Promise.allSettled(fonts.map(font => cache.add(font)));
    }
    await cache.put(url, response);
  }));
}

self.addEventListener('install', event => {
  if (DEV) return;
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('mt-core-') && name !== CORE).map(name => caches.delete(name)));
    // Запрос страницы уходит в сеть, пока воркер ещё просыпается, — переход не ждёт его запуска.
    if (!DEV && self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (DEV) return;
  const strategy = strategyOf(event.request);
  if (strategy) event.respondWith(HANDLERS[strategy](event));
});
