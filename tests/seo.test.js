import { afterEach, describe, expect, it, vi } from 'vitest';
import { gradeLabelRu, injectPage, legacyTarget, renderPage, routeOf } from '../worker/seo.js';
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

  it('старые слаги тем и подтем распознаются, новые и чужие — нет', () => {
    expect(legacyTarget('/topic/podobnye-treugolniki-1788737251039-299'))
      .toMatchObject({ kind: 'topic', from: 'podobnye-treugolniki-1788737251039-299', to: 'skola2030-g9-1-ka-define-un-raksturo-lidzigus-trijsturus', path: '/topic/skola2030-g9-1-ka-define-un-raksturo-lidzigus-trijsturus' });
    expect(legacyTarget('/ru/control-work/podobnye-treugolniki-1788737251039-299')).toMatchObject({ kind: 'control-work', table: 'topic' });
    expect(legacyTarget('/ru/subtopic/dirihle-princips-9-11-2')).toMatchObject({ kind: 'subtopic', table: 'subtopic', to: 'dirihle-princips-9-9-2' });
    expect(legacyTarget('/topic/skola2030-g9-1-ka-define-un-raksturo-lidzigus-trijsturus')).toBeNull();
    expect(legacyTarget('/subtopic/paralelograms-8-5-3')).toBeNull();
    expect(legacyTarget('/task/12-x')).toBeNull();
    expect(legacyTarget('/topic/toString')).toBeNull();
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

describe('seo: старые адреса тем отвечают 301', () => {
  const OLD = 'podobnye-treugolniki-1788737251039-299';
  const NEW = 'skola2030-g9-1-ka-define-un-raksturo-lidzigus-trijsturus';

  it('на /ru/ и без префикса, с сохранением строки запроса', async () => {
    vi.stubGlobal('fetch', supabase([[`topics?slug=eq.${NEW}`, [{ id: 301 }]]]));
    const ru = await page(`/ru/topic/${OLD}?q=1`, makeEnv());
    expect(ru.status).toBe(301);
    expect(ru.headers.get('location')).toBe(`https://mathtasks.lv/ru/topic/${NEW}?q=1`);
    const lv = await page(`/control-work/${OLD}`, makeEnv());
    expect(lv.status).toBe(301);
    expect(lv.headers.get('location')).toBe(`https://mathtasks.lv/control-work/${NEW}`);
  });

  it('подтема с устаревшим номером: 301 на слаг с верным номером', async () => {
    vi.stubGlobal('fetch', supabase([['subtopics?slug=eq.novertejums-un-piemers-9-9-4', [{ id: 753 }]]]));
    const response = await page('/subtopic/novertejums-un-piemers-9-11-4', makeEnv());
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('https://mathtasks.lv/subtopic/novertejums-un-piemers-9-9-4');
  });

  it('пока нового слага нет в базе, редиректа нет: страница не ломается', async () => {
    vi.stubGlobal('fetch', supabase([]));
    const response = await page(`/topic/${OLD}`, makeEnv());
    expect(response.status).not.toBe(301);
  });

  it('новый слаг и чужие адреса редирект не трогает', async () => {
    const fetchMock = supabase([['topics?slug=eq.', [TOPIC]]]);
    vi.stubGlobal('fetch', fetchMock);
    const response = await page('/topic/skola2030-g6-1-x', makeEnv());
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});

describe('seo: страницы из каталога', () => {
  it('тема: заголовок как в приложении, canonical, список задач с текстом условия', async () => {
    vi.stubGlobal('fetch', supabase([['topics?slug=eq.', [TOPIC]], ['tasks?topic_id=eq.107', [TASK]]]));
    const response = await page('/ru/topic/skola2030-g6-1-x', makeEnv());
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get('etag')).toBeNull();
    expect(html).toContain('<title>6.1. Как совокупность делят в определенном отношении, 6 класс — MathTasks</title>');
    expect(html).toContain('<link rel="canonical" href="https://mathtasks.lv/ru/topic/skola2030-g6-1-x" />');
    expect(html).toContain('<a href="/ru/task/321-delenie-otrezka">Задача №9</a> — Найдите 1/2 от 10.');
    expect(html).toContain('<a href="/ru/subject/algebra">Алгебра и числа</a>');
  });

  it('задача: номер и тема в заголовке, описание из условия, canonical со слагом', async () => {
    vi.stubGlobal('fetch', supabase([['tasks?id=eq.321', [{ ...TASK, topics: TOPIC }]]]));
    const html = await (await page('/ru/task/321', makeEnv())).text();
    expect(html).toContain('<title>Задача №9 — 6.1. Как совокупность делят в определенном отношении, 6 класс — MathTasks</title>');
    expect(html).toContain('<meta name="description" content="Задача №9. Найдите 1/2 от 10. С ответом и разбором решения." />');
    expect(html).toContain('<link rel="canonical" href="https://mathtasks.lv/ru/task/321-delenie-otrezka" />');
  });

  /* Страница задачи должна нести собственный текст: заголовок «Задача №N»
     и одна строка условия — ровно тот пустой шаблон, из-за которого Google
     складывал такие страницы в «просканировано, но не проиндексировано». */
  it('задача: условие в заголовке, ответ, подтема и соседние задачи темы', async () => {
    const FULL = {
      ...TASK,
      answer_latex: '$x = 5$',
      difficulty: 'Сложный',
      topics: TOPIC,
      subtopics: { title: 'Отношения чисел', code: '6.1.3' }
    };
    const NEIGHBOUR = { id: 322, title: 'Соседняя', position: 10, condition_latex: 'Сколько будет $2+2$?' };
    vi.stubGlobal('fetch', supabase([
      ['tasks?id=eq.321', [FULL]],
      ['tasks?topic_id=eq.107', [NEIGHBOUR]]
    ]));
    const html = await (await page('/ru/task/321', makeEnv())).text();
    expect(html).toContain('<h1>Задача №9. Найдите 1/2 от 10.</h1>');
    expect(html).toContain('<p>Ответ: x = 5</p>');
    expect(html).toContain('Подтема: 6.1.3. Отношения чисел');
    expect(html).toContain('Сложность: Сложный');
    expect(html).toContain('<h2>Другие задачи темы</h2>');
    expect(html).toContain('<a href="/ru/task/322-sosednyaya">Задача №10</a> — Сколько будет 2+2?');
  });

  it('задача на латышском: факты и соседние задачи на латышском', async () => {
    const FULL_LV = {
      ...TASK,
      condition_latex_lv: 'Atrodiet $\\frac{1}{2}$ no $10$.',
      answer_latex_lv: '$x = 5$',
      difficulty: 'Сложный',
      topics: { ...TOPIC, title_lv: 'Kā kopumu sadala noteiktā attiecībā?' },
      subtopics: { title_lv: 'Skaitļu attiecības', code: '6.1.3' }
    };
    vi.stubGlobal('fetch', supabase([['tasks?id=eq.321', [FULL_LV]]]));
    const html = await (await page('/task/321', makeEnv())).text();
    expect(html).toContain('<h1>Uzdevums №9. Atrodiet 1/2 no 10.</h1>');
    expect(html).toContain('<p>Atbilde: x = 5</p>');
    expect(html).toContain('Apakštēma: 6.1.3. Skaitļu attiecības');
    expect(html).toContain('Grūtības pakāpe: Padziļināts');
  });

  it('длинное условие: в заголовке обрезано по слову, целиком — абзацем ниже', async () => {
    const LONG = 'Турист прошёл первую часть пути пешком за три часа, вторую часть проехал на велосипеде, '
      + 'а третью часть проплыл на лодке. Найдите длину всего маршрута.';
    vi.stubGlobal('fetch', supabase([['tasks?id=eq.321', [{ ...TASK, condition_latex: LONG, topics: TOPIC }]]]));
    const html = await (await page('/ru/task/321', makeEnv())).text();
    expect(html).toContain('<h1>Задача №9. Турист прошёл первую часть пути пешком за три часа, вторую часть проехал на велосипеде, а третью часть…</h1>');
    expect(html).toContain('<p>' + LONG + '</p>');
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

describe('seo: латышская версия без префикса, русская — на /ru/…', () => {
  const TOPIC_LV = { ...TOPIC, title_lv: 'Kā kopumu sadala noteiktā attiecībā?', subjects: { title: 'Алгебра и числа', title_lv: 'Algebra un skaitļi', slug: 'algebra' } };
  const TASK_LV = { ...TASK, title_lv: 'Nogriežņa dalīšana', condition_latex_lv: 'Atrodiet $\\frac{1}{2}$ no $10$.' };

  it('адрес с /ru разбирается как без него; старый /lv — тоже', () => {
    expect(routeOf('/ru')).toEqual({ kind: 'home' });
    expect(routeOf('/ru/')).toEqual({ kind: 'home' });
    expect(routeOf('/ru/topic/x')).toEqual({ kind: 'topic', slug: 'x' });
    expect(routeOf('/ru/task/321-a')).toEqual({ kind: 'task', id: 321 });
    expect(routeOf('/lv/task/321-a')).toEqual({ kind: 'task', id: 321 });
  });

  it('тема на латышском: заголовок, lang, canonical без префикса, ссылки на обе версии', async () => {
    vi.stubGlobal('fetch', supabase([['topics?slug=eq.', [TOPIC_LV]], ['tasks?topic_id=eq.107', [TASK_LV]]]));
    const response = await page('/topic/skola2030-g6-1-x', makeEnv());
    const html = await response.text();
    expect(response.headers.get('content-language')).toBe('lv');
    expect(html).toContain('<html lang="lv">');
    expect(html).toContain('<title>6.1. Kā kopumu sadala noteiktā attiecībā?, 6. klase — MathTasks</title>');
    expect(html).toContain('<link rel="canonical" href="https://mathtasks.lv/topic/skola2030-g6-1-x" />');
    expect(html).toContain('<link rel="alternate" hreflang="ru" href="https://mathtasks.lv/ru/topic/skola2030-g6-1-x" />');
    expect(html).toContain('<link rel="alternate" hreflang="lv" href="https://mathtasks.lv/topic/skola2030-g6-1-x" />');
    expect(html).toContain('<link rel="alternate" hreflang="x-default" href="https://mathtasks.lv/topic/skola2030-g6-1-x" />');
    // Ссылки текстовой версии — латышские: без префикса и со слагом из латышского названия.
    expect(html).toContain('<a href="/task/321-nogriezna-dalisana">Uzdevums №9</a> — Atrodiet 1/2 no 10.');
    expect(html).toContain('<a href="/">Sākums</a>');
    expect(html).toContain('<a href="/subject/algebra">Algebra un skaitļi</a>');
  });

  it('русская версия тоже ссылается на обе', async () => {
    vi.stubGlobal('fetch', supabase([['topics?slug=eq.', [TOPIC_LV]], ['tasks?topic_id=eq.107', [TASK_LV]]]));
    const html = await (await page('/ru/topic/skola2030-g6-1-x', makeEnv())).text();
    expect(html).toContain('<html lang="ru">');
    expect(html).toContain('<link rel="canonical" href="https://mathtasks.lv/ru/topic/skola2030-g6-1-x" />');
    expect(html).toContain('<link rel="alternate" hreflang="lv" href="https://mathtasks.lv/topic/skola2030-g6-1-x" />');
    expect(html).toContain('<a href="/ru/task/321-delenie-otrezka">Задача №9</a>');
  });

  it('задача на латышском: описание из латышского условия, адрес со слагом из латышского названия', async () => {
    vi.stubGlobal('fetch', supabase([['tasks?id=eq.321', [{ ...TASK_LV, topics: TOPIC_LV }]]]));
    const html = await (await page('/task/321', makeEnv())).text();
    expect(html).toContain('<title>Uzdevums №9 — 6.1. Kā kopumu sadala noteiktā attiecībā?, 6. klase — MathTasks</title>');
    expect(html).toContain('<meta name="description" content="Uzdevums №9. Atrodiet 1/2 no 10. Ar atbildi un risinājumu." />');
    expect(html).toContain('<link rel="canonical" href="https://mathtasks.lv/task/321-nogriezna-dalisana" />');
    expect(html).toContain('<link rel="alternate" hreflang="ru" href="https://mathtasks.lv/ru/task/321-delenie-otrezka" />');
  });

  it('задача на русском: canonical со слагом из русского названия, латышская — со своим', async () => {
    vi.stubGlobal('fetch', supabase([['tasks?id=eq.321', [{ ...TASK_LV, topics: TOPIC_LV }]]]));
    const html = await (await page('/ru/task/321-nogriezna-dalisana', makeEnv())).text();
    expect(html).toContain('<link rel="canonical" href="https://mathtasks.lv/ru/task/321-delenie-otrezka" />');
    expect(html).toContain('<link rel="alternate" hreflang="lv" href="https://mathtasks.lv/task/321-nogriezna-dalisana" />');
    expect(html).toContain('<link rel="alternate" hreflang="x-default" href="https://mathtasks.lv/task/321-nogriezna-dalisana" />');
  });

  it('главная на латышском, 404 и noindex — без ссылок на версии', async () => {
    const homeHtml = await (await page('/', makeEnv())).text();
    expect(homeHtml).toContain('<title>MathTasks — matemātikas uzdevumu krājums</title>');
    expect(homeHtml).toContain('<link rel="canonical" href="https://mathtasks.lv/" />');
    expect(homeHtml).toContain('<a href="/grade/6">6. klase</a>');

    vi.stubGlobal('fetch', supabase([]));
    const missing = await (await page('/task/999', makeEnv())).text();
    expect(missing).toContain('<title>Uzdevums nav atrasts — MathTasks</title>');
    expect(missing).not.toContain('hreflang');
    expect(missing).not.toContain('rel="canonical"');

    const progress = await (await page('/progress', makeEnv())).text();
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

/* Разметка Schema.org отвечает за одно: поисковик должен знать имя сайта,
   а не догадываться о нём по тексту страниц. */
describe('seo: разметка сайта для поиска', () => {
  const ldOf = html => {
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    return match ? JSON.parse(match[1].replace(/\u003c/g, '<')) : null;
  };

  it('главная: имя сайта, логотип и строка поиска', async () => {
    const html = await (await page('/', makeEnv())).text();
    expect(ldOf(html)['@graph'].find(item => item['@type'] === 'WebSite').inLanguage).toBe('lv');
    const graph = ldOf(html)['@graph'];
    const site = graph.find(item => item['@type'] === 'WebSite');
    const org = graph.find(item => item['@type'] === 'EducationalOrganization');
    expect(site.name).toBe('MathTasks');
    expect(site.potentialAction.target.urlTemplate).toBe('https://mathtasks.lv/search?q={search_term_string}');
    expect(org.logo).toBe('https://mathtasks.lv/icons/icon-512.png');
    expect(html).toContain('<meta property="og:image" content="https://mathtasks.lv/og-cover.png" />');
    expect(html).toContain('<meta property="og:image:width" content="1200" />');
  });

  it('русская главная: своё имя и свой адрес поиска', async () => {
    const html = await (await page('/ru/', makeEnv())).text();
    const site = ldOf(html)['@graph'].find(item => item['@type'] === 'WebSite');
    expect(site.url).toBe('https://mathtasks.lv/ru/');
    expect(site.inLanguage).toBe('ru');
    expect(site.potentialAction.target.urlTemplate).toBe('https://mathtasks.lv/ru/search?q={search_term_string}');
  });

  it('страница задачи: путь по каталогу, «<» не закрывает тег script', async () => {
    vi.stubGlobal('fetch', supabase([['tasks?id=eq.321', [{ ...TASK, condition_latex: 'Верно ли, что $a < b$?', topics: TOPIC }]]]));
    const html = await (await page('/ru/task/321', makeEnv())).text();
    expect(html).toContain('\u003c');
    const crumbs = ldOf(html)['@graph'].find(item => item['@type'] === 'BreadcrumbList');
    expect(crumbs.itemListElement.map(item => item.name)).toEqual(
      ['Главная', '6 класс', '6.1. Как совокупность делят в определенном отношении']);
    expect(crumbs.itemListElement[1].item).toBe('https://mathtasks.lv/ru/grade/6');
  });

  it('страницы, которых нет, разметку не получают', async () => {
    vi.stubGlobal('fetch', supabase([]));
    const html = await (await page('/task/999', makeEnv())).text();
    expect(html).not.toContain('application/ld+json');
  });
});

/* Несуществующий адрес Cloudflare отдаёт оболочкой приложения с кодом 200.
   Для поисковика это бесконечное число копий главной, поэтому такие адреса
   должны получать честную 404. */
describe('seo: адрес, которого нет', () => {
  it('неизвестный путь — 404 и noindex, приложение всё равно грузится', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await page('/ru/foo', makeEnv());
    const html = await response.text();
    expect(response.status).toBe(404);
    expect(html).toContain('<meta name="robots" content="noindex" />');
    expect(html).toContain('<h1>Страница не найдена</h1>');
    expect(html).toContain('<div id="view-home">');
    // Ходить в базу за несуществующим адресом незачем.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('адрес без префикса, которого нет, отвечает по-латышски', async () => {
    const html = await (await page('/foo', makeEnv())).text();
    expect(html).toContain('<h1>Lapa nav atrasta</h1>');
  });

  it('отдельная страница (не оболочка) проходит как есть', async () => {
    const standalone = () => new Response('<!doctype html><html><head></head><body>тренажёр</body></html>',
      { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
    const response = await page('/trainer', makeEnv(standalone));
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('тренажёр');
  });

  it('экзамен — рабочий экран: не 404, но и не для поиска', async () => {
    const response = await page('/exam/pamat', makeEnv());
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('<meta name="robots" content="noindex, follow" />');
    expect(html).toContain('<link rel="canonical" href="https://mathtasks.lv/exams" />');
  });
});

/* HEAD раньше отвечал 200 на несуществующий адрес: тело пустое, маркер
   оболочки не находился, и страница проходила как «файл, отдать как есть». */
describe('HEAD на несуществующий адрес', () => {
  it('отвечает 404 без тела', async () => {
    const env = makeEnv();
    const response = await renderPage(new Request('https://mathtasks.lv/nothing-here-xyz', { method: 'HEAD' }), env);
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('');
  });

  it('у известной страницы HEAD остаётся успешным', async () => {
    const env = makeEnv();
    const response = await renderPage(new Request('https://mathtasks.lv/about', { method: 'HEAD' }), env);
    expect(response.status).toBe(200);
  });
});

describe('seo: пустые темы и уровни средней школы', () => {
  it('тема без задач — noindex, follow; с задачами — в индексе', async () => {
    vi.stubGlobal('fetch', supabase([['topics?slug=eq.', [TOPIC]], ['tasks?topic_id=eq.107', []]]));
    const empty = await (await page('/topic/skola2030-g6-1-x', makeEnv())).text();
    expect(empty).toContain('<meta name="robots" content="noindex, follow" />');
    vi.stubGlobal('fetch', supabase([['topics?slug=eq.', [TOPIC]], ['tasks?topic_id=eq.107', [TASK]]]));
    const full = await (await page('/topic/skola2030-g6-1-x', makeEnv())).text();
    expect(full).not.toContain('name="robots"');
  });

  it('крошки темы уровня ведут на адрес словами', async () => {
    vi.stubGlobal('fetch', supabase([['topics?slug=eq.', [{ ...TOPIC, grade: 11 }]], ['tasks?topic_id=eq.107', [TASK]]]));
    const html = await (await page('/topic/skola2030-g6-1-x', makeEnv())).text();
    expect(html).toContain('href="/grade/matematika-1"');
    expect(html).not.toContain('href="/grade/11"');
  });
});
