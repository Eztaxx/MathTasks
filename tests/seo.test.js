import { afterEach, describe, expect, it, vi } from 'vitest';
import { gradeLabelRu, injectPage, renderPage, routeOf } from '../worker/seo.js';
import { latexToPlainText, taskDescription } from '../public/lib.js';

/* Оболочка — те же строки <head>, что в index.html: подстановка ищет именно их. */
const SHELL = `<!doctype html>
<html lang="ru">
<head>
  <title>MathTasks — сборник задач по математике</title>
  <meta name="description" content="Сборник задач по школьной математике: условия, ответы и разбор решений по классам и темам." />
  <meta property="og:title" content="MathTasks — сборник задач по математике" />
  <meta property="og:description" content="Условия, ответы и разбор решений по классам и темам." />
</head>
<body>
  <main id="home">
    <header class="topbar"></header>
    <div id="view-home"></div>
  </main>
</body>
</html>`;

const htmlAsset = () => new Response(SHELL, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', etag: '"abc"' } });

const makeEnv = (asset = htmlAsset) => ({
  SUPABASE_URL: 'https://db.example',
  SUPABASE_KEY: 'anon',
  ASSETS: { fetch: vi.fn().mockImplementation(async () => asset()) }
});

// Ответ «базы» по началу пути запроса к PostgREST.
const supabase = routes => vi.fn().mockImplementation(async url => {
  const path = String(url).replace('https://db.example/rest/v1/', '');
  const hit = routes.find(([prefix]) => path.startsWith(prefix));
  return new Response(JSON.stringify(hit ? hit[1] : []));
});

const page = (path, env) => renderPage(new Request(`https://mathtasks.lv${path}`), env);

const TOPIC = {
  id: 107,
  title: 'Как совокупность делят в определенном отношении',
  slug: 'skola2030-g6-1-x',
  grade: 6,
  position: 1,
  description: null,
  subjects: { title: 'Алгебра и числа', slug: 'algebra' }
};
const TASK = { id: 321, title: 'Деление отрезка', position: 9, condition_latex: 'Найдите $\\frac{1}{2}$ от $10$.' };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('seo: адрес → вид страницы', () => {
  it('разбирает адреса каталога и не трогает остальное', () => {
    expect(routeOf('/')).toEqual({ kind: 'home' });
    expect(routeOf('/task/321-delenie-otrezka')).toEqual({ kind: 'task', id: 321 });
    expect(routeOf('/task/321')).toEqual({ kind: 'task', id: 321 });
    expect(routeOf('/topic/skola2030-g6-1-x')).toEqual({ kind: 'topic', slug: 'skola2030-g6-1-x' });
    expect(routeOf('/grade/7/tasks')).toEqual({ kind: 'gradeTasks', grade: '7' });
    expect(routeOf('/grade/matematika-1')).toEqual({ kind: 'grade', grade: 'matematika-1' });
    expect(routeOf('/control-work/abc')).toEqual({ kind: 'controlWork', slug: 'abc' });
    expect(routeOf('/progress')).toEqual({ kind: 'static', path: '/progress' });
    expect(routeOf('/style.css')).toBeNull();
    expect(routeOf('/admin')).toBeNull();
  });

  it('подписи классов — как в приложении на русском', () => {
    expect(gradeLabelRu(6)).toBe('6 класс');
    expect(gradeLabelRu('visparigais')).toBe('Vispārīgais līmenis');
    expect(gradeLabelRu(11)).toBe('Optimālais līmenis');
  });
});

describe('seo: подстановка в оболочку', () => {
  it('меняет заголовок, описание, Open Graph; добавляет canonical, robots и текст', () => {
    const html = injectPage(SHELL, {
      title: 'Тема', description: 'Описание', canonicalPath: '/topic/x', robots: 'noindex',
      heading: 'Тема', items: [{ href: '/task/1-a', label: 'Задача №1', text: 'условие' }]
    });
    expect(html).toContain('<title>Тема — MathTasks</title>');
    expect(html).toContain('<meta name="description" content="Описание" />');
    expect(html).toContain('<meta property="og:title" content="Тема — MathTasks" />');
    expect(html).toContain('<link rel="canonical" href="https://mathtasks.lv/topic/x" />');
    expect(html).toContain('<meta name="robots" content="noindex" />');
    expect(html).toMatch(/<section id="ssr-content"[\s\S]*<h1>Тема<\/h1>[\s\S]*<a href="\/task\/1-a">Задача №1<\/a> — условие[\s\S]*<div id="view-home">/);
  });

  it('экранирует текст и не путает «$&» с шаблоном замены', () => {
    const html = injectPage(SHELL, { title: 'A <b> & "c"', description: 'цена $& и $1', canonicalPath: '/', heading: 'x' });
    expect(html).toContain('<title>A &lt;b&gt; &amp; &quot;c&quot; — MathTasks</title>');
    expect(html).toContain('content="цена $&amp; и $1"');
  });
});

describe('seo: страницы из каталога', () => {
  it('тема: заголовок как в приложении, canonical, список задач с текстом условия', async () => {
    vi.stubGlobal('fetch', supabase([['topics?slug=eq.', [TOPIC]], ['tasks?topic_id=eq.107', [TASK]]]));
    const response = await page('/topic/skola2030-g6-1-x', makeEnv());
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get('etag')).toBeNull();
    expect(html).toContain('<title>6.1. Как совокупность делят в определенном отношении, 6 класс — MathTasks</title>');
    expect(html).toContain('<link rel="canonical" href="https://mathtasks.lv/topic/skola2030-g6-1-x" />');
    expect(html).toContain('<a href="/task/321-delenie-otrezka">Задача №9</a> — Найдите 1/2 от 10.');
    expect(html).toContain('<a href="/subject/algebra">Алгебра и числа</a>');
  });

  it('задача: номер и тема в заголовке, описание из условия, canonical со слагом', async () => {
    vi.stubGlobal('fetch', supabase([['tasks?id=eq.321', [{ ...TASK, topics: TOPIC }]]]));
    const html = await (await page('/task/321', makeEnv())).text();
    expect(html).toContain('<title>Задача №9 — 6.1. Как совокупность делят в определенном отношении, 6 класс — MathTasks</title>');
    expect(html).toContain('<meta name="description" content="Задача №9. Найдите 1/2 от 10. С ответом и разбором решения." />');
    expect(html).toContain('<link rel="canonical" href="https://mathtasks.lv/task/321-delenie-otrezka" />');
  });

  it('нет задачи — код 404 и noindex, приложение всё равно загружается', async () => {
    vi.stubGlobal('fetch', supabase([]));
    const response = await page('/task/999', makeEnv());
    const html = await response.text();
    expect(response.status).toBe(404);
    expect(html).toContain('<meta name="robots" content="noindex" />');
    expect(html).toContain('<div id="view-home">');
  });

  it('личные страницы — noindex и без запросов к базе', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const html = await (await page('/progress', makeEnv())).text();
    expect(html).toContain('<meta name="robots" content="noindex, follow" />');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('контрольная — noindex, ссылка на тему', async () => {
    vi.stubGlobal('fetch', supabase([['topics?slug=eq.', [TOPIC]]]));
    const html = await (await page('/control-work/skola2030-g6-1-x', makeEnv())).text();
    expect(html).toContain('<meta name="robots" content="noindex, follow" />');
    expect(html).toContain('<a href="/topic/skola2030-g6-1-x">');
  });
});

describe('seo: латышская версия на /lv/…', () => {
  const TOPIC_LV = { ...TOPIC, title_lv: 'Kā kopumu sadala noteiktā attiecībā?', subjects: { title: 'Алгебра и числа', title_lv: 'Algebra un skaitļi', slug: 'algebra' } };
  const TASK_LV = { ...TASK, condition_latex_lv: 'Atrodiet $\\frac{1}{2}$ no $10$.' };

  it('адрес с /lv разбирается как без него', () => {
    expect(routeOf('/lv')).toEqual({ kind: 'home' });
    expect(routeOf('/lv/')).toEqual({ kind: 'home' });
    expect(routeOf('/lv/topic/x')).toEqual({ kind: 'topic', slug: 'x' });
    expect(routeOf('/lv/task/321-a')).toEqual({ kind: 'task', id: 321 });
  });

  it('тема на латышском: заголовок, lang, canonical на /lv, ссылки на обе версии', async () => {
    vi.stubGlobal('fetch', supabase([['topics?slug=eq.', [TOPIC_LV]], ['tasks?topic_id=eq.107', [TASK_LV]]]));
    const response = await page('/lv/topic/skola2030-g6-1-x', makeEnv());
    const html = await response.text();
    expect(response.headers.get('content-language')).toBe('lv');
    expect(html).toContain('<html lang="lv">');
    expect(html).toContain('<title>6.1. Kā kopumu sadala noteiktā attiecībā?, 6. klase — MathTasks</title>');
    expect(html).toContain('<link rel="canonical" href="https://mathtasks.lv/lv/topic/skola2030-g6-1-x" />');
    expect(html).toContain('<link rel="alternate" hreflang="ru" href="https://mathtasks.lv/topic/skola2030-g6-1-x" />');
    expect(html).toContain('<link rel="alternate" hreflang="lv" href="https://mathtasks.lv/lv/topic/skola2030-g6-1-x" />');
    expect(html).toContain('<link rel="alternate" hreflang="x-default" href="https://mathtasks.lv/lv/topic/skola2030-g6-1-x" />');
    // Ссылки текстовой версии — на латышские адреса, текст — латышский.
    expect(html).toContain('<a href="/lv/task/321-delenie-otrezka">Uzdevums №9</a> — Atrodiet 1/2 no 10.');
    expect(html).toContain('<a href="/lv/">Sākums</a>');
    expect(html).toContain('<a href="/lv/subject/algebra">Algebra un skaitļi</a>');
  });

  it('русская версия тоже ссылается на обе', async () => {
    vi.stubGlobal('fetch', supabase([['topics?slug=eq.', [TOPIC_LV]], ['tasks?topic_id=eq.107', [TASK_LV]]]));
    const html = await (await page('/topic/skola2030-g6-1-x', makeEnv())).text();
    expect(html).toContain('<html lang="ru">');
    expect(html).toContain('<link rel="canonical" href="https://mathtasks.lv/topic/skola2030-g6-1-x" />');
    expect(html).toContain('<link rel="alternate" hreflang="lv" href="https://mathtasks.lv/lv/topic/skola2030-g6-1-x" />');
  });

  it('задача на латышском: описание из латышского условия', async () => {
    vi.stubGlobal('fetch', supabase([['tasks?id=eq.321', [{ ...TASK_LV, topics: TOPIC_LV }]]]));
    const html = await (await page('/lv/task/321', makeEnv())).text();
    expect(html).toContain('<title>Uzdevums №9 — 6.1. Kā kopumu sadala noteiktā attiecībā?, 6. klase — MathTasks</title>');
    expect(html).toContain('<meta name="description" content="Uzdevums №9. Atrodiet 1/2 no 10. Ar atbildi un risinājumu." />');
    expect(html).toContain('<link rel="canonical" href="https://mathtasks.lv/lv/task/321-delenie-otrezka" />');
  });

  it('главная на латышском, 404 и noindex — без ссылок на версии', async () => {
    const homeHtml = await (await page('/lv/', makeEnv())).text();
    expect(homeHtml).toContain('<title>MathTasks — matemātikas uzdevumu krājums</title>');
    expect(homeHtml).toContain('<link rel="canonical" href="https://mathtasks.lv/lv/" />');
    expect(homeHtml).toContain('<a href="/lv/grade/6">6. klase</a>');

    vi.stubGlobal('fetch', supabase([]));
    const missing = await (await page('/lv/task/999', makeEnv())).text();
    expect(missing).toContain('<title>Uzdevums nav atrasts — MathTasks</title>');
    expect(missing).not.toContain('hreflang');
    expect(missing).not.toContain('rel="canonical"');

    const progress = await (await page('/lv/progress', makeEnv())).text();
    expect(progress).toContain('<title>Mans progress — MathTasks</title>');
    expect(progress).not.toContain('hreflang');
  });
});

describe('seo: сбои — страница без подстановки лучше сломанной', () => {
  it('нет доступа к базе — статика как есть', async () => {
    const env = makeEnv();
    delete env.SUPABASE_URL;
    const response = await page('/topic/x', env);
    expect(await response.text()).toBe(SHELL);
  });

  it('база ответила ошибкой — статика как есть', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response('down', { status: 503 })));
    const response = await page('/topic/x', makeEnv());
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(SHELL);
  });

  it('ответ статики не HTML — не трогаем', async () => {
    const plain = () => new Response('body {}', { status: 200, headers: { 'content-type': 'text/css' } });
    const response = await page('/topic/x', makeEnv(plain));
    expect(await response.text()).toBe('body {}');
  });
});

describe('описание задачи (taskDescription)', () => {
  it('номер, начало условия, хвост; не длиннее ~160 символов', () => {
    const long = `Решите уравнение ${'и найдите сумму корней '.repeat(20)}`;
    const text = taskDescription({ condition: long, number: 3, lang: 'ru' });
    expect(text.startsWith('Задача №3. Решите уравнение')).toBe(true);
    expect(text).toContain('… С ответом и разбором решения.');
    expect(text.length).toBeLessThanOrEqual(160);
  });

  it('перед многоточием нет точки или запятой', () => {
    const condition = 'На числовой прямой отмечены точки A(-6) и B(14). Точка C делит отрезок AB в отношении 1 : 3, считая от точки A. Найдите координату точки C.';
    const text = taskDescription({ condition, number: 9 });
    expect(text).not.toMatch(/[.,;:]…/);
    expect(text).toContain('…');
  });

  it('без условия — прежняя формулировка; на латышском — по-латышски', () => {
    expect(taskDescription({ number: 2, topicTitle: 'Дроби' })).toBe('Задача №2: условие, ответ и подробное решение. Тема «Дроби».');
    expect(taskDescription({ condition: 'Aprēķiniet $2+2$.', number: 1, lang: 'lv' })).toBe('Uzdevums №1. Aprēķiniet 2+2. Ar atbildi un risinājumu.');
  });

  it('LaTeX переводится в символы', () => {
    expect(latexToPlainText('S = \\pi r^2, $30^\\circ$')).toBe('S = π r², 30°');
  });
});
