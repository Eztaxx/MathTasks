import { describe, it, expect, vi, afterEach } from 'vitest';
import worker, {
  TRANSLIT,
  CROSS_TAG_SLUGS,
  BASE_SITEMAP_PATHS,
  BOT_PATTERNS,
  slugify,
  escapeHtml,
  cleanLatexForPreview,
  isSocialBot,
  buildSitemapPaths,
  buildSitemapXml,
  renderTaskPreviewHtml,
  buildSitemapDates,
  sitemap
} from '../worker/index.js';

describe('Cloudflare Worker: чистые функции', () => {
  describe('slugify', () => {
    it('транслитерирует кириллицу в латиницу', () => {
      expect(slugify('Квадратное уравнение')).toBe('kvadratnoe-uravnenie');
      expect(slugify('Функции и графики')).toBe('funktsii-i-grafiki');
      expect(slugify('Степень с натуральным показателем')).toBe('stepen-s-naturalnym-pokazatelem');
    });

    it('очищает спецсимволы и повторяющиеся дефисы', () => {
      expect(slugify('Тема №1: Теорема Пифагора!')).toBe('tema-1-teorema-pifagora');
      expect(slugify('  --- Много   пробелов ---  ')).toBe('mnogo-probelov');
      expect(slugify('a + b = c')).toBe('a-b-c');
    });

    it('возвращает fallback topic для пустых или невалидных строк', () => {
      expect(slugify('')).toBe('topic');
      expect(slugify(null)).toBe('topic');
      expect(slugify(undefined)).toBe('topic');
      expect(slugify('!@#$%^&*()')).toBe('topic');
    });

    it('сохраняет латиницу и цифры', () => {
      expect(slugify('algebra-101')).toBe('algebra-101');
      expect(slugify('Skola2030')).toBe('skola2030');
    });
  });

  describe('escapeHtml', () => {
    it('экранирует специальные символы HTML', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
      expect(escapeHtml('1 < 2 && 3 > 2')).toBe('1 &lt; 2 &amp;&amp; 3 &gt; 2');
    });

    it('не трогает безопасный текст и обрабатывает пустые значения', () => {
      expect(escapeHtml('MathTasks')).toBe('MathTasks');
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('cleanLatexForPreview', () => {
    it('очищает текстовые команды LaTeX', () => {
      expect(cleanLatexForPreview('Найдите \\text{длину стороны} треугольника')).toBe('Найдите длину стороны треугольника');
      expect(cleanLatexForPreview('\\textbf{Важно:} условие')).toBe('Важно: условие');
    });

    it('преобразует корни и дроби в читаемый вид', () => {
      expect(cleanLatexForPreview('Вычислите \\sqrt{16} + \\frac{1}{2}')).toBe('Вычислите √16 + 1/2');
      expect(cleanLatexForPreview('\\sqrt{x^2 + y^2}')).toBe('√(x² + y²)');
      expect(cleanLatexForPreview('\\dfrac{x+1}{2}')).toBe('(x+1)/2');
      expect(cleanLatexForPreview('\\sqrt[3]{8}')).toBe('³√8');
    });

    it('степени и индексы: цифры надстрочными, остальное — через ^ и _', () => {
      expect(cleanLatexForPreview('Решите уравнение $2x^2 - 5x + 3 = 0$')).toBe('Решите уравнение 2x² - 5x + 3 = 0');
      expect(cleanLatexForPreview('$10^{-3}$')).toBe('10⁻³');
      expect(cleanLatexForPreview('$e^{2x}$')).toBe('e^(2x)');
      expect(cleanLatexForPreview('$a_1 + a_{10}$')).toBe('a₁ + a₁₀');
      expect(cleanLatexForPreview('$a_n$, $a_{n+1}$')).toBe('a_n, a_(n+1)');
    });

    it('заменяет греческие буквы, градусы и знаки символами', () => {
      expect(cleanLatexForPreview('$$S = \\pi r^2$$')).toBe('S = π r²');
      expect(cleanLatexForPreview('Угол \\alpha равен 30^\\circ')).toBe('Угол α равен 30°');
      expect(cleanLatexForPreview('$\\angle A = 45^{\\circ}$')).toBe('∠A = 45°');
      expect(cleanLatexForPreview('$a \\cdot b \\le c$, $x \\ne 0$')).toBe('a · b ≤ c, x ≠ 0');
      expect(cleanLatexForPreview('$x \\to \\infty$')).toBe('x → ∞');
      expect(cleanLatexForPreview('Скидка 20\\%')).toBe('Скидка 20%');
    });

    it('удаляет неизвестные команды, оставляя их аргументы', () => {
      expect(cleanLatexForPreview('$x \\in \\mathbb{R}$')).toBe('x ∈ R');
      expect(cleanLatexForPreview('$\\left( x \\right)$')).toBe('( x )');
      expect(cleanLatexForPreview('$\\begin{cases} y = 2x \\\\ y = 4 \\end{cases}$')).toBe('y = 2x y = 4');
      // Похожие имена не путаются: \int — не \in, \left — не \le.
      expect(cleanLatexForPreview('$\\int f$')).toBe('f');
    });

    it('ограничивает длину описания до 200 символов', () => {
      const longText = 'А'.repeat(300);
      const cleaned = cleanLatexForPreview(longText);
      expect(cleaned.length).toBe(200);
    });

    it('обрабатывает пустые и нестроковые значения', () => {
      expect(cleanLatexForPreview('')).toBe('');
      expect(cleanLatexForPreview(null)).toBe('');
      expect(cleanLatexForPreview(undefined)).toBe('');
    });
  });

  describe('isSocialBot', () => {
    it('определяет популярных поисковых и социальных ботов', () => {
      expect(isSocialBot('TelegramBot (like TwitterBot)')).toBe(true);
      expect(isSocialBot('Mozilla/5.0 (compatible; Twitterbot/1.0)')).toBe(true);
      expect(isSocialBot('facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)')).toBe(true);
      expect(isSocialBot('WhatsApp/2.21.12.21 i')).toBe(true);
      expect(isSocialBot('Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)')).toBe(true);
      expect(isSocialBot('Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)')).toBe(true);
      expect(isSocialBot('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0')).toBe(true);
      expect(isSocialBot('Applebot/0.1')).toBe(true);
      expect(isSocialBot('Mozilla/5.0 (compatible; vkShare; +http://vk.com/dev/Share)')).toBe(true);
      expect(isSocialBot('LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)')).toBe(true);
      expect(isSocialBot('Viber')).toBe(true);
    });

    it('отклоняет обычные браузеры пользователей', () => {
      expect(isSocialBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')).toBe(false);
      expect(isSocialBot('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15')).toBe(false);
      expect(isSocialBot('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')).toBe(false);
      expect(isSocialBot('')).toBe(false);
      expect(isSocialBot(null)).toBe(false);
      expect(isSocialBot(undefined)).toBe(false);
    });
  });

  describe('buildSitemapPaths', () => {
    it('содержит базовые статические маршруты и кросс-теги по умолчанию', () => {
      const paths = buildSitemapPaths();
      expect(paths).toContain('/');
      expect(paths).toContain('/tasks');
      expect(paths).toContain('/tags');
      expect(paths).toContain('/about');
      expect(paths).toContain('/control-works');
      expect(paths).toContain('/exams');
      expect(paths).toContain('/mock-exams');
      expect(paths).toContain('/trainer');
      expect(paths).toContain('/tag/algebriskie-parveidojumi');
      expect(paths).toContain('/tag/planimetrija');
    });

    it('корректно формирует пути для переданного набора каталога', () => {
      const subjects = [{ slug: 'algebra' }, { slug: 'geometrija' }];
      const topics = [
        { slug: 'lineynie-uravneniya', grade: 7 },
        { slug: 'kvadratnye-uravneniya', grade: 8 }
      ];
      const subtopics = [{ slug: 'formuly-sokraschennogo-umnozheniya' }];
      const tasks = [
        { id: 101, title: 'Решение уравнения' },
        { id: 202, title: 'Задача на проценты' }
      ];
      const tags = [{ slug: 'procenti' }];

      const paths = buildSitemapPaths({ subjects, topics, subtopics, tasks, tags });

      expect(paths).toContain('/grade/7');
      expect(paths).toContain('/grade/8');
      expect(paths).toContain('/grade/7/tasks');
      expect(paths).toContain('/grade/8/tasks');
      expect(paths).toContain('/subject/algebra');
      expect(paths).toContain('/subject/geometrija');
      expect(paths).toContain('/topic/lineynie-uravneniya');
      expect(paths).toContain('/topic/kvadratnye-uravneniya');
      expect(paths).toContain('/subtopic/formuly-sokraschennogo-umnozheniya');
      // Контрольная повторяет задачи темы и помечена noindex — в карте её нет.
      expect(paths).not.toContain('/control-work/lineynie-uravneniya');
      expect(paths).toContain('/tag/procenti');
      expect(paths).toContain('/task/101-reshenie-uravneniya');
      expect(paths).toContain('/task/202-zadacha-na-protsenty');
    });

    it('дедуплицирует повторяющиеся пути', () => {
      const topics = [
        { slug: 'topic-1', grade: 7 },
        { slug: 'topic-2', grade: 7 }
      ];
      const paths = buildSitemapPaths({ topics });
      const grade7Count = paths.filter(p => p === '/grade/7').length;
      expect(grade7Count).toBe(1);
    });
  });

  describe('buildSitemapXml', () => {
    it('генерирует валидный XML документ карты сайта', () => {
      const paths = ['/', '/tasks', '/topic/algebra'];
      const xml = buildSitemapXml(paths, 'https://mathtasks.lv');

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">');
      for (const loc of ['/', '/tasks', '/topic/algebra', '/lv/', '/lv/tasks', '/lv/topic/algebra']) {
        expect(xml).toContain(`<url><loc>https://mathtasks.lv${loc}</loc>`);
      }
      expect(xml).toContain('</urlset>');
    });

    it('у каждой версии страницы — ссылки на обе: ru, lv и x-default (латышская)', () => {
      const xml = buildSitemapXml(['/topic/algebra'], 'https://mathtasks.lv');
      const blocks = xml.match(/<url>[\s\S]*?<\/url>/g);
      expect(blocks).toHaveLength(2);
      for (const block of blocks) {
        expect(block).toContain('<xhtml:link rel="alternate" hreflang="ru" href="https://mathtasks.lv/topic/algebra"/>');
        expect(block).toContain('<xhtml:link rel="alternate" hreflang="lv" href="https://mathtasks.lv/lv/topic/algebra"/>');
        expect(block).toContain('<xhtml:link rel="alternate" hreflang="x-default" href="https://mathtasks.lv/lv/topic/algebra"/>');
      }
    });

    it('страницы без латышской версии — одной строкой', () => {
      const xml = buildSitemapXml(['/trainer'], 'https://mathtasks.lv');
      expect(xml).toContain('  <url><loc>https://mathtasks.lv/trainer</loc></url>');
      expect(xml).not.toContain('/lv/trainer');
    });

    it('нормализует слэш в origin и экранирует спецсимволы в URL', () => {
      const paths = ['/search?q=a&b=c'];
      const xml = buildSitemapXml(paths, 'https://mathtasks.lv/');
      expect(xml).toContain('<loc>https://mathtasks.lv/search?q=a&amp;b=c</loc>');
      expect(xml).not.toContain('https://mathtasks.lv//');
    });
  });

  describe('renderTaskPreviewHtml', () => {
    it('формирует полноценную страницу превью с Open Graph и Twitter Card метатегами', () => {
      const task = {
        id: 42,
        title: 'Теорема Пифагора',
        title_lv: 'Pitagora teorēma',
        condition_latex: 'В прямоугольном треугольнике с катетами $a=3$ и $b=4$ найдите $c$.',
        condition_latex_lv: 'Taisnleņķa trijstūrī ar katetēm $a=3$ un $b=4$ aprēķiniet $c$.',
        condition_image: 'https://cdn.example.com/task-42.svg',
        topics: {
          title: 'Геометрия 8 класс',
          title_lv: 'Ģeometrija 8. klasei',
          grade: 8
        }
      };

      const html = renderTaskPreviewHtml(task, {
        url: 'https://mathtasks.lv/task/42-pitagora-teorema',
        origin: 'https://mathtasks.lv'
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="lv">');
      // Приоритет латышского названия, класс и тема в заголовке
      expect(html).toContain('<title>Pitagora teorēma [8. klase] • Ģeometrija 8. klasei — MathTasks</title>');
      expect(html).toContain('<meta property="og:title" content="Pitagora teorēma [8. klase] • Ģeometrija 8. klasei — MathTasks">');
      expect(html).toContain('<meta name="twitter:title" content="Pitagora teorēma [8. klase] • Ģeometrija 8. klasei — MathTasks">');
      // Очищенное от LaTeX условие задачи в описании
      expect(html).toContain('<meta name="description" content="Taisnleņķa trijstūrī ar katetēm a=3 un b=4 aprēķiniet c.">');
      expect(html).toContain('<meta property="og:description" content="Taisnleņķa trijstūrī ar katetēm a=3 un b=4 aprēķiniet c.">');
      // Изображение
      expect(html).toContain('<meta property="og:image" content="https://cdn.example.com/task-42.svg">');
      expect(html).toContain('<meta property="og:url" content="https://mathtasks.lv/task/42-pitagora-teorema">');
      expect(html).toContain('<link rel="canonical" href="https://mathtasks.lv/task/42-pitagora-teorema">');
      // Тело страницы
      expect(html).toContain('<h1>Pitagora teorēma</h1>');
      expect(html).toContain('<p>Taisnleņķa trijstūrī ar katetēm a=3 un b=4 aprēķiniet c.</p>');
    });

    it('использует русский язык в качестве запасного при отсутствии латышского перевода', () => {
      const task = {
        id: 99,
        title: 'Уравнение с параметром',
        condition_latex: 'При каких $a$ уравнение имеет корни?',
        topics: {
          title: 'Параметры',
          grade: 11
        }
      };

      const html = renderTaskPreviewHtml(task, {
        url: 'https://mathtasks.lv/task/99',
        origin: 'https://mathtasks.lv'
      });

      expect(html).toContain('<title>Уравнение с параметром [11. klase] • Параметры — MathTasks</title>');
      expect(html).toContain('При каких a уравнение имеет корни?');
      expect(html).toContain('<meta property="og:image" content="https://mathtasks.lv/favicon.svg">');
    });

    it('подставляет дефолтное описание при пустом условии задачи', () => {
      const task = {
        id: 1,
        title: 'Задача 1'
      };
      const html = renderTaskPreviewHtml(task, { origin: 'https://mathtasks.lv' });
      expect(html).toContain('Matemātikas uzdevums ar atbildi, zīmējumu un soli pa solim atrisinājumu.');
    });

    it('экранирует спецсимволы в заголовке и условии во избежание XSS в метатегах', () => {
      const task = {
        id: 5,
        title: 'Сравнение "a" & "b" <c>',
        condition_latex: 'Докажите, что 1 < 2 & 2 > 1'
      };
      const html = renderTaskPreviewHtml(task, { origin: 'https://mathtasks.lv' });
      expect(html).toContain('Сравнение &quot;a&quot; &amp; &quot;b&quot; &lt;c&gt;');
      expect(html).toContain('Докажите, что 1 &lt; 2 &amp; 2 &gt; 1');
      expect(html).not.toContain('<c>');
    });
  });

  describe('worker fetch router', () => {
    it('возвращает sitemap.xml на запрос /sitemap.xml', async () => {
      const request = new Request('https://mathtasks.lv/sitemap.xml');
      const env = {};
      const response = await worker.fetch(request, env);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/xml');
      const text = await response.text();
      expect(text).toContain('<urlset');
      expect(text).toContain('https://mathtasks.lv/');
    });

    it('передаёт обычные запросы в env.ASSETS.fetch', async () => {
      const request = new Request('https://mathtasks.lv/style.css');
      const mockAssetResponse = new Response('body {}', { status: 200 });
      const env = {
        ASSETS: {
          fetch: vi.fn().mockResolvedValue(mockAssetResponse)
        }
      };

      const response = await worker.fetch(request, env);
      expect(env.ASSETS.fetch).toHaveBeenCalledWith(request);
      expect(response).toBe(mockAssetResponse);
    });

    it('на маршруте /task/ для обычного браузера передаёт запрос в статику (ASSETS.fetch)', async () => {
      const request = new Request('https://mathtasks.lv/task/42-test', {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const mockAssetResponse = new Response('<html>SPA</html>', { status: 200 });
      const env = {
        ASSETS: {
          fetch: vi.fn().mockResolvedValue(mockAssetResponse)
        }
      };

      const response = await worker.fetch(request, env);
      expect(env.ASSETS.fetch).toHaveBeenCalledWith(request);
      expect(response).toBe(mockAssetResponse);
    });
  });

  describe('превью задачи для ботов', () => {
    const makeEnv = (extra = {}) => ({
      SUPABASE_URL: 'https://db.example',
      SUPABASE_KEY: 'anon',
      ASSETS: { fetch: vi.fn().mockImplementation(async () => new Response('SPA')) },
      ...extra
    });
    const botRequest = path => new Request(`https://mathtasks.lv${path}`, {
      headers: { 'user-agent': 'TelegramBot (like TwitterBot)' }
    });
    const rowsResponse = rows => async () => new Response(JSON.stringify(rows));

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('отдаёт боту мета-теги задачи из базы', async () => {
      const fetchMock = vi.fn().mockImplementation(rowsResponse([{
        id: 42,
        title: 'Площадь круга',
        title_lv: 'Riņķa laukums',
        condition_latex_lv: 'Aprēķiniet $\\pi r^2$, ja $r = 3$.',
        topics: { title_lv: 'Riņķis', grade: 9 }
      }]));
      vi.stubGlobal('fetch', fetchMock);
      const env = makeEnv();

      const response = await worker.fetch(botRequest('/task/42-ploshchad-kruga'), env);
      const html = await response.text();

      expect(response.headers.get('content-type')).toContain('text/html');
      expect(html).toContain('<meta property="og:title" content="Riņķa laukums [9. klase] • Riņķis — MathTasks">');
      expect(html).toContain('<meta property="og:description" content="Aprēķiniet π r², ja r = 3.">');
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://db.example/rest/v1/tasks?id=eq.42&select=id,title,title_lv,condition_latex,condition_latex_lv,condition_image,topics(title,title_lv,grade)&limit=1');
      expect(env.ASSETS.fetch).not.toHaveBeenCalled();
    });

    it('задачи нет в базе — бот получает обычную страницу', async () => {
      vi.stubGlobal('fetch', vi.fn().mockImplementation(rowsResponse([])));
      const env = makeEnv();

      const response = await worker.fetch(botRequest('/task/999'), env);

      expect(env.ASSETS.fetch).toHaveBeenCalledTimes(1);
      expect(await response.text()).toBe('SPA');
    });

    it('база ответила ошибкой — бот получает обычную страницу', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response('down', { status: 503 })));
      const env = makeEnv();

      const response = await worker.fetch(botRequest('/task/42'), env);

      expect(env.ASSETS.fetch).toHaveBeenCalledTimes(1);
      expect(await response.text()).toBe('SPA');
    });

    it('без переменных Supabase в базу не ходит', async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      const env = makeEnv({ SUPABASE_URL: undefined });

      await worker.fetch(botRequest('/task/42'), env);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(env.ASSETS.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('/api/gemini', () => {
    /* Токен входа: воркер читает из него только sub — для лимита частоты.
       Подпись проверяет база, в тестах её заменяет подставной fetch. */
    const tokenFor = sub => `h.${btoa(JSON.stringify({ sub })).replace(/=+$/, '')}.s`;
    const post = (body, token = tokenFor('admin-1')) => new Request('https://mathtasks.lv/api/gemini', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body
    });
    const env = { SUPABASE_URL: 'https://db.example', SUPABASE_KEY: 'anon', GEMINI_API_KEY: 'secret-key' };
    const request = JSON.stringify({ model: 'gemini-3.6-flash', request: { contents: [{ parts: [{ text: 'hi' }] }] } });
    const adminCheck = isAdmin => new Response(JSON.stringify(isAdmin));

    afterEach(() => vi.unstubAllGlobals());

    it('отвечает 405 на GET', async () => {
      const response = await worker.fetch(new Request('https://mathtasks.lv/api/gemini'), env);
      expect(response.status).toBe(405);
    });

    it('без входа отвечает 401 и никуда не ходит', async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      const response = await worker.fetch(post(request, ''), env);
      expect(response.status).toBe(401);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('без ключа на сервере отвечает 501 и никуда не ходит', async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      const response = await worker.fetch(post(request), { ...env, GEMINI_API_KEY: undefined });
      expect(response.status).toBe(501);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('битый JSON и чужую модель не пропускает', async () => {
      vi.stubGlobal('fetch', vi.fn());
      expect((await worker.fetch(post('{oops'), env)).status).toBe(400);
      expect((await worker.fetch(post(JSON.stringify({ model: '../evil', request: {} })), env)).status).toBe(400);
    });

    it('не администратору отвечает 403, в Gemini не ходит', async () => {
      const fetchMock = vi.fn().mockResolvedValueOnce(adminCheck(false));
      vi.stubGlobal('fetch', fetchMock);
      const response = await worker.fetch(post(request, tokenFor('visitor-1')), env);
      expect(response.status).toBe(403);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://db.example/rest/v1/rpc/is_admin');
      expect(init.headers.Authorization).toBe(`Bearer ${tokenFor('visitor-1')}`);
    });

    it('администратору пересылает запрос с ключом из секретов и отдаёт ответ модели как есть', async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce(adminCheck(true))
        .mockResolvedValueOnce(new Response('{"candidates":[]}', { status: 429, headers: { 'retry-after': '7' } }));
      vi.stubGlobal('fetch', fetchMock);
      const response = await worker.fetch(post(request, tokenFor('admin-2')), env);
      expect(response.status).toBe(429);
      expect(response.headers.get('retry-after')).toBe('7');
      expect(await response.text()).toBe('{"candidates":[]}');
      const [url, init] = fetchMock.mock.calls[1];
      expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent');
      expect(url).not.toContain('secret-key');
      expect(init.headers['x-goog-api-key']).toBe('secret-key');
      expect(JSON.parse(init.body)).toEqual({ contents: [{ parts: [{ text: 'hi' }] }] });
    });

    it('больше 30 запросов в минуту от одного человека — 429 с Retry-After', async () => {
      vi.stubGlobal('fetch', vi.fn(async url => (String(url).includes('is_admin') ? adminCheck(true) : new Response('{}'))));
      const token = tokenFor('admin-rate');
      for (let i = 0; i < 30; i++) expect((await worker.fetch(post(request, token), env)).status).toBe(200);
      const response = await worker.fetch(post(request, token), env);
      expect(response.status).toBe(429);
      expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0);
    });
  });

  describe('/assets/* — файл сборки с устаревшим хешем', () => {
    const SHELL = '<!doctype html><link rel="stylesheet" href="/assets/style-NEW123.css"><div id="view-home"></div>';
    const files = {
      '/': [SHELL, 'text/html; charset=utf-8'],
      '/assets/style-NEW123.css': [':root{--ink:#000}', 'text/css']
    };
    // Как статика Cloudflare: нет файла — SPA-оболочка с кодом 200.
    const env = {
      ASSETS: {
        fetch: vi.fn(async req => {
          const [body, type] = files[new URL(req.url).pathname] || files['/'];
          return new Response(body, { headers: { 'content-type': type, 'cache-control': 'public, max-age=31536000, immutable' } });
        })
      }
    };
    const get = path => worker.fetch(new Request(`https://mathtasks.lv${path}`), env);

    it('существующий файл отдаётся как есть', async () => {
      const response = await get('/assets/style-NEW123.css');
      expect(response.headers.get('content-type')).toBe('text/css');
      expect(response.headers.get('cache-control')).toContain('immutable');
      expect(await response.text()).toBe(':root{--ink:#000}');
    });

    it('удалённый style-<старый хеш>.css получает текущий CSS, а не HTML, и не кэшируется', async () => {
      const response = await get('/assets/style-_OLD99.css');
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/css');
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.text()).toBe(':root{--ink:#000}');
    });

    it('файл, которого нет и в свежей сборке, — 404, а не HTML', async () => {
      const response = await get('/assets/chart-ABC.js');
      expect(response.status).toBe(404);
    });
  });
});

/* lastmod в карте сайта: он говорит поисковику, куда возвращаться. Дата
   должна быть настоящей — выдуманную Google перестаёт учитывать. */
describe('sitemap: даты последнего изменения', () => {
  const DATA = {
    subjects: [{ id: 1, slug: 'algebra' }],
    topics: [{ id: 7, slug: 'kv', grade: 8, subject_id: 1 }],
    subtopics: [{ id: 3, slug: 'kv-1' }],
    tasks: [
      { id: 10, title: 'Старая', topic_id: 7, subtopic_id: 3, updated_at: '2026-01-05T10:00:00+00:00' },
      { id: 11, title: 'Свежая', topic_id: 7, subtopic_id: null, updated_at: '2026-09-19T12:05:45+00:00' }
    ]
  };

  it('у задачи — своя дата, у списков — дата самой свежей задачи', () => {
    const dates = buildSitemapDates(DATA);
    expect(dates.get('/task/10-staraya')).toBe('2026-01-05');
    expect(dates.get('/task/11-svezhaya')).toBe('2026-09-19');
    expect(dates.get('/topic/kv')).toBe('2026-09-19');
    expect(dates.get('/subtopic/kv-1')).toBe('2026-01-05');
    expect(dates.get('/grade/8')).toBe('2026-09-19');
    expect(dates.get('/grade/8/tasks')).toBe('2026-09-19');
    expect(dates.get('/subject/algebra')).toBe('2026-09-19');
    expect(dates.get('/')).toBe('2026-09-19');
  });

  it('страницы без своего содержимого даты не получают', () => {
    const dates = buildSitemapDates(DATA);
    expect(dates.has('/about')).toBe(false);
    expect(dates.has('/trainer')).toBe(false);
  });

  it('дата попадает в обе языковые версии и в одноязычные файлы', () => {
    const dates = new Map([['/topic/kv', '2026-09-19'], ['/trainer', '2026-09-19']]);
    const xml = buildSitemapXml(['/topic/kv', '/trainer', '/about'], 'https://mathtasks.lv', dates);
    expect(xml).toContain('<loc>https://mathtasks.lv/topic/kv</loc><lastmod>2026-09-19</lastmod>');
    expect(xml).toContain('<loc>https://mathtasks.lv/lv/topic/kv</loc><lastmod>2026-09-19</lastmod>');
    expect(xml).toContain('<url><loc>https://mathtasks.lv/trainer</loc><lastmod>2026-09-19</lastmod></url>');
    expect(xml).toContain('<url><loc>https://mathtasks.lv/about</loc>');
    expect(xml.match(/<lastmod>/g)).toHaveLength(3);
  });
});
