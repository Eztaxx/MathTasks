import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';

const file = path => new URL(`../${path}`, import.meta.url);
const read = path => readFileSync(file(path), 'utf8');
const pngSize = path => {
  const png = readFileSync(file(path));
  return `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`;
};

const ORIGIN = 'https://mathtasks.lv';
const SW_SOURCE = read('public/sw.js');

/* Воркер — обычный скрипт без модулей: исполняем его в песочнице, как
   браузер, и берём оттуда функции. build — номер сборки, который подставляет
   post-build.js; без него воркер работает в режиме разработки. */
function loadWorker({ build = 'test', cached = {}, online = false } = {}) {
  const listeners = {};
  const store = new Map(Object.entries(cached).map(([key, body]) => [new URL(key, ORIGIN).href, body]));
  const match = async (key, options = {}) => {
    const href = new URL(typeof key === 'string' ? key : key.url, ORIGIN);
    for (const [stored, body] of store) {
      const candidate = new URL(stored);
      const same = options.ignoreSearch ? candidate.origin + candidate.pathname === href.origin + href.pathname : stored === href.href;
      if (same) return new Response(body);
    }
    return undefined;
  };
  const sandbox = {
    self: { location: new URL('/sw.js', ORIGIN), addEventListener: (type, fn) => { listeners[type] = fn; } },
    caches: { match, open: async () => ({ match, put: async () => {}, keys: async () => [], delete: async () => {} }) },
    fetch: async () => {
      if (!online) throw new TypeError('Failed to fetch');
      return new Response('from network');
    },
    URL, Request, Response, Headers, atob, console
  };
  const source = build ? SW_SOURCE.replace("'__BUILD__'", `'${build}'`) : SW_SOURCE;
  vm.runInNewContext(`${source}\n;self.__consts = { PAGES, FILE_PAGES };`, sandbox);
  return { sw: sandbox, listeners };
}

// Запрос в том виде, в каком его видит воркер; режим navigate в Node не создать через new Request.
const req = (url, { method = 'GET', mode = 'cors', headers = {} } = {}) => ({
  url: new URL(url, ORIGIN).href, method, mode, headers: new Headers(headers)
});

async function respond(listeners, request) {
  let result = null;
  listeners.fetch({ request, preloadResponse: Promise.resolve(undefined), respondWith: p => { result = p; }, waitUntil: () => {} });
  return result && (await result).text();
}

const jwt = payload => `x.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.y`;

describe('manifest', () => {
  const manifest = JSON.parse(read('public/manifest.webmanifest'));

  it('описывает устанавливаемое приложение', () => {
    expect(manifest).toMatchObject({ name: 'MathTasks', start_url: '/', scope: '/', display: 'standalone' });
    const sizes = manifest.icons.map(icon => `${icon.sizes} ${icon.purpose}`);
    expect(sizes).toEqual(expect.arrayContaining(['192x192 any', '512x512 any', '512x512 maskable']));
  });

  it('иконки на месте и того размера, что заявлен', () => {
    for (const icon of manifest.icons) expect(pngSize(`public${icon.src}`)).toBe(icon.sizes);
    expect(pngSize('public/icons/apple-touch-icon.png')).toBe('180x180');
  });
});

describe('страницы подключают приложение', () => {
  it.each(['index.html', 'trainer.html', 'exams.html', 'mock-exams.html'])('%s', name => {
    const html = read(name);
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(html).toContain('<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />');
    expect(html).toContain('<script src="/pwa.js" defer></script>');
  });
});

describe('service worker', () => {
  const { sw } = loadWorker();

  it('метка сборки стоит ровно один раз — её заменяет post-build.js', () => {
    expect(SW_SOURCE.split("'__BUILD__'")).toHaveLength(2);
  });

  it('страницы для работы без сети существуют: иначе установка воркера срывается', () => {
    for (const page of sw.self.__consts.PAGES) {
      expect(existsSync(file(page === '/' ? 'index.html' : page.slice(1)))).toBe(true);
    }
  });

  it('адрес страницы с .html и без него — один ключ', () => {
    expect(sw.pageKey('/trainer.html')).toBe('/trainer');
    expect(sw.pageKey('/trainer')).toBe('/trainer');
    expect(sw.pageKey('/trainer?mode=eq')).toBe('/trainer');
    expect(sw.pageKey('/index.html')).toBe('/');
    expect(sw.pageKey('/')).toBe('/');
    expect(sw.pageKey('/lv/')).toBe('/lv');
    expect(sw.pageKey(`${ORIGIN}/task/12-kvadrat`)).toBe('/task/12-kvadrat');
  });

  it('берёт файлы страницы, а не preconnect и не чужие скрипты', () => {
    const html = `
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400&amp;display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css" crossorigin="anonymous">
      <link rel="canonical" href="https://mathtasks.lv/" />
      <script src="/trainer.js?v=20260916-1"></script>
      <script>inline()</script>
      <script src="https://static.cloudflareinsights.com/beacon.min.js"></script>`;
    expect(sw.assetUrls(html, `${ORIGIN}/trainer`)).toEqual([
      `${ORIGIN}/favicon.svg`,
      'https://fonts.googleapis.com/css2?family=Manrope:wght@400&display=swap',
      'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css',
      `${ORIGIN}/trainer.js?v=20260916-1`
    ]);
  });

  it('находит шрифты KaTeX в его таблице стилей', () => {
    const css = '@font-face{src:url(fonts/KaTeX_Main-Regular.woff2) format("woff2"),url(fonts/KaTeX_Main-Regular.woff) format("woff")}';
    expect(sw.fontUrls(css, 'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css'))
      .toEqual(['https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/fonts/KaTeX_Main-Regular.woff2']);
  });

  it('выбирает, как отвечать на запрос', () => {
    const anon = { apikey: 'sb_publishable_x', authorization: 'Bearer sb_publishable_x' };
    expect(sw.strategyOf(req('/topic/drobi', { mode: 'navigate' }))).toBe('page');
    expect(sw.strategyOf(req('/app.js'))).toBe('static');
    expect(sw.strategyOf(req('/assets/style-BXkHGBgM.css'))).toBe('immutable');
    expect(sw.strategyOf(req('https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js'))).toBe('immutable');
    expect(sw.strategyOf(req('https://abc.supabase.co/rest/v1/tasks?id=eq.5', { headers: anon }))).toBe('data');
    expect(sw.strategyOf(req('https://abc.supabase.co/storage/v1/object/public/task-images/1.svg'))).toBe('data');
    // Не трогает: запись, вход, прокси модели, карту сайта и чужие адреса.
    expect(sw.strategyOf(req('https://abc.supabase.co/rest/v1/reports', { method: 'POST', headers: anon }))).toBeNull();
    expect(sw.strategyOf(req('https://abc.supabase.co/auth/v1/token'))).toBeNull();
    expect(sw.strategyOf(req('/api/gemini'))).toBeNull();
    expect(sw.strategyOf(req('/sitemap.xml', { mode: 'navigate' }))).toBeNull();
    expect(sw.strategyOf(req('https://cloudflareinsights.com/cdn-cgi/rum'))).toBeNull();
  });

  it('ответы вошедшего человека кэширует отдельно от общих', () => {
    const url = 'https://abc.supabase.co/rest/v1/tasks?id=eq.5';
    const anon = req(url, { headers: { apikey: 'k', authorization: 'Bearer k' } });
    const user = req(url, { headers: { apikey: 'k', authorization: `Bearer ${jwt({ sub: 'u1' })}` } });
    const broken = req(url, { headers: { apikey: 'k', authorization: 'Bearer garbage' } });
    const single = req(url, { headers: { apikey: 'k', accept: 'application/vnd.pgrst.object+json' } });
    expect(sw.dataKey(anon)).toBe(url);
    expect(sw.dataKey(user)).toBe(`${url}&__sw_user=u1`);
    expect(sw.dataKey(broken)).toBeNull();
    expect(sw.strategyOf(broken)).toBeNull();
    expect(sw.dataKey(single)).toBe(`${url}&__sw_one=1`);
  });
});

describe('service worker без сети', () => {
  const cached = {
    '/': 'оболочка каталога',
    '/trainer': 'тренажёр',
    '/task/7-drobi': 'задача 7',
    '/trainer.js?v=old': 'скрипт тренажёра'
  };
  const { listeners } = loadWorker({ cached });

  it('тренажёр открывается по ссылке с .html', async () => {
    expect(await respond(listeners, req('/trainer.html', { mode: 'navigate' }))).toBe('тренажёр');
  });

  it('просмотренная задача — своя копия, непросмотренная — оболочка каталога', async () => {
    expect(await respond(listeners, req('/task/7-drobi', { mode: 'navigate' }))).toBe('задача 7');
    expect(await respond(listeners, req('/lv/task/8-procenti', { mode: 'navigate' }))).toBe('оболочка каталога');
  });

  it('скрипт с новым номером версии заменяется сохранённым', async () => {
    expect(await respond(listeners, req('/trainer.js?v=new'))).toBe('скрипт тренажёра');
  });

  it('с сетью отдаёт ответ сети, а не кэш', async () => {
    const { listeners: live } = loadWorker({ cached, online: true });
    expect(await respond(live, req('/trainer', { mode: 'navigate' }))).toBe('from network');
  });

  it('без номера сборки (vite dev) ничего не перехватывает', async () => {
    const { listeners: dev } = loadWorker({ build: null, cached });
    expect(await respond(dev, req('/trainer', { mode: 'navigate' }))).toBeNull();
  });
});

/* Отдельные страницы воркер не переписывает: превью и canonical должны
   лежать прямо в файле, иначе ссылка на тренажёр приходит голой строкой. */
describe('отдельные страницы: превью ссылки', () => {
  const PAGES = ['exams.html', 'mock-exams.html', 'trainer.html', 'plotter.html'];

  it.each(PAGES)('%s — карточка 1200×630 и canonical', file => {
    const html = read(file);
    expect(html).toContain('<meta property="og:image" content="https://mathtasks.lv/og-cover.png" />');
    expect(html).toContain('<meta property="og:image:width" content="1200" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    // Cloudflare отдаёт эти страницы без .html: canonical должен вести туда же.
    const served = file.replace(/.html$/, '');
    expect(html).toContain(`<link rel="canonical" href="https://mathtasks.lv/${served}" />`);
    expect(html).toContain(`<meta property="og:url" content="https://mathtasks.lv/${served}" />`);
    // Описание в превью — то же, что в поиске: два разных текста расходятся.
    const description = html.match(/<meta name="description" content="([^"]*)" \/>/)[1];
    expect(html).toContain(`<meta property="og:description" content="${description}" />`);
  });
});
