/* Воркер обслуживает три вещи, всё остальное отдаёт статика:
     /sitemap.xml      — карта сайта из каталога Supabase
     /task/<id>-<slug> — мета-теги Open Graph для ботов мессенджеров
     /api/generate-task — прокси к Google Gemini

   Раньше это лежало в папке functions/ — соглашение Cloudflare Pages.
   Проект живёт на Workers, где эта папка не выполняется вовсе, поэтому
   карта сайта отдавала HTML главной, превью ссылок не работали,
   а запрос к генератору упирался в SPA-фолбэк.

   Переменные задаются командой:
     npx wrangler secret put SUPABASE_URL
     npx wrangler secret put SUPABASE_KEY
     npx wrangler secret put GEMINI_API_KEY   (необязательно) */

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

async function sitemap(request, env) {
  const origin = new URL(request.url).origin;
  let paths = ['/', '/tasks', '/tags', '/about', '/control-works', '/exams.html', '/mock-exams.html', '/trainer.html', '/grade/visparigais', '/grade/matematika-1', '/grade/matematika-2']
    .concat(CROSS_TAG_SLUGS.map(slug => `/tag/${slug}`));

  if (env.SUPABASE_URL && supabaseKeyOf(env)) {
    try {
      const [subjects, topics, tasks, tags, subtopics] = await Promise.all([
        readSupabase(env, 'subjects?select=slug'),
        readSupabase(env, 'topics?select=slug,grade'),
        // Черновики в карту не попадают — их и на сайте не видно.
        readSupabase(env, 'tasks?select=id,title&is_published=eq.true'),
        readSupabase(env, 'tags?select=slug').catch(() => []),
        // Подтемы появляются миграцией 020: до неё запрос падает, карта живёт без них.
        readSupabase(env, 'subtopics?select=slug').catch(() => [])
      ]);
      const grades = [...new Set(topics.map(t => t.grade).filter(Boolean))].sort((a, b) => a - b);
      const tagSlugs = (tags && tags.length > 0) ? tags.map(t => t.slug) : CROSS_TAG_SLUGS;
      paths = paths
        .concat(grades.map(g => `/grade/${g}`))
        .concat(subjects.map(s => `/subject/${s.slug}`))
        .concat(topics.map(t => `/topic/${t.slug}`))
        .concat((subtopics || []).map(s => `/subtopic/${s.slug}`))
        .concat(topics.map(t => `/control-work/${t.slug}`))
        .concat(grades.map(g => `/grade/${g}/tasks`))
        .concat(tagSlugs.map(slug => `/tag/${slug}`))
        .concat(tasks.map(t => `/task/${t.id}-${slugify(t.title)}`));
    } catch (error) {
      // Каталог не прочитался — отдаём статические адреса, а не пустоту.
      console.error('sitemap:', error.message);
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...new Set(paths)].map(p => `  <url><loc>${escapeHtml(origin + p)}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' }
  });
}

/* ── Превью ссылки на задачу для ботов ───────────────────────────── */

const BOT_PATTERNS = ['telegrambot', 'whatsapp', 'facebookexternalhit', 'twitterbot',
  'vkshare', 'discordbot', 'slackbot', 'linkedinbot', 'viber', 'applebot'];

const isSocialBot = ua => BOT_PATTERNS.some(bot => (ua || '').toLowerCase().includes(bot));

const cleanLatexForPreview = (latex = '') => String(latex || '')
  .replace(/\\(text|textbf|textit)\{([^}]+)\}/g, '$2')
  .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
  .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
  .replace(/\\[a-zA-Z]+/g, ' ')
  .replace(/[$_{}^]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 200);

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
  const taskUrl = request.url;
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
  const imageUrl = task.condition_image || `${origin}/favicon.svg`;

  const html = `<!DOCTYPE html>
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

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
  });
}

/* ── Прокси к Gemini ─────────────────────────────────────────────── */

/* Ключ живёт в переменных воркера, поэтому генерировать задачи можно и
   без личного ключа в браузере. Тело запроса — параметры задачи, промпт
   собирается здесь; ответ той же формы, что у клиентского генератора. */
async function generateTask(request, env) {
  if (request.method !== 'POST') {
    return json({ error: 'Ожидался POST-запрос.' }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ожидался JSON в теле запроса.' }, 400);
  }

  const {
    grade = 7,
    topicTitle = 'Линейные уравнения',
    subtopic = '',
    difficulty = 'Средний',
    taskType = 'Уравнение',
    context = '',
    customPrompt = '',
    apiKey = ''
  } = body || {};

  const activeApiKey = apiKey || env.GEMINI_API_KEY;
  if (!activeApiKey) {
    return json({ error: 'API-ключ Gemini не указан. Задайте GEMINI_API_KEY в переменных воркера или передайте apiKey в запросе.' }, 400);
  }

  const prompt = `Ты — ведущий методист и преподаватель математики в Латвии, создающий учебные материалы строго по государственному стандарту Skola2030.
Создай качественную математическую задачу для ${grade} класса.
Тема Skola2030: "${topicTitle}".
${subtopic ? `Конкретный навык/подтема: "${subtopic}".` : ''}
Сложность: ${difficulty || 'Средний'} (Лёгкий = pamata līmenis, Средний = optimālais līmenis, Сложный = padziļinātais līmenis).
Тип задачи: ${taskType || 'Уравнение или текстовая задача'}.
${context ? `Сюжетный контекст задачи (ОБЯЗАТЕЛЬНО составь условие задачи именно про этот жизненный сюжет или ситуацию): "${context}".` : ''}
${customPrompt ? `Дополнительные пожелания: "${customPrompt}".` : ''}

Требования:
1. Математическая точность: условие должно иметь ровно одно корректное решение, ответ должен быть строго выверен.
2. Формулы: оформляй все переменные, числа в вычислениях и формулы в KaTeX-разметке: внутри $...$ для инлайн и $$...$$ для выключных формул.
3. Локализация: создай полные версии на русском (RU) и латышском (LV) языках. Английский не нужен — на сайте его нет. Латышский текст должен строго соответствовать терминологии Skola2030.
4. Ответ верни СТРОГО в формате валидного JSON-объекта (без markdown-блоков):
{
  "title_ru": "Краткое название задачи",
  "title_lv": "Nosaukums latviski",
  "condition_latex_ru": "Условие задачи с формулами $...$",
  "condition_latex_lv": "Nosacījums ar formūlām $...$",
  "answer_latex": "Короткий математический ответ",
  "answer_latex_lv": "Tā pati atbilde latviski",
  "solution_latex_ru": "Пошаговое понятное решение с формулами",
  "solution_latex_lv": "Soli pa solim atrisinājums latviski"
}`;

  /* Квота у Gemini считается на каждую модель отдельно, и gemini-3.6-flash
     на бесплатном тарифе кончается первой: без запасных генератор вставал
     с 429, хотя другие модели отвечали. Клиентский генератор так и делает —
     воркер должен вести себя так же. */
  const МОДЕЛИ = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.5-flash-lite'];

  try {
    let response = null;
    for (const name of МОДЕЛИ) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent?key=${encodeURIComponent(activeApiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.3 }
          })
        });
      if (response.ok) break;
      if (response.status !== 429 && response.status !== 404) break;
    }

    if (!response.ok) {
      return json({ error: `Gemini API error: ${await response.text()}` }, response.status);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return json({ error: 'Пустой ответ от модели' }, 502);

    let cleanJson = candidateText.trim();
    const fenceMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch && fenceMatch[1]) cleanJson = fenceMatch[1].trim();
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleanJson = cleanJson.slice(firstBrace, lastBrace + 1);
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (err1) {
      try {
        let sanitized = cleanJson.replace(/\\([bfrtn])([a-zA-Z]{2,})/g, '\\\\$1$2');
        sanitized = sanitized.replace(/\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, '\\\\');
        parsed = JSON.parse(sanitized);
      } catch (err2) {
        let sanitized2 = cleanJson.replace(/\\([^"\\])/g, '\\\\$1');
        parsed = JSON.parse(sanitized2);
      }
    }

    return json({
      success: true,
      task: { ...parsed, grade: Number(grade) || 7, difficulty: difficulty || 'Средний' }
    }, 200, { 'Cache-Control': 'no-store' });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}

/* ── Маршрутизация ───────────────────────────────────────────────── */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/sitemap.xml') return sitemap(request, env);
    if (url.pathname === '/api/generate-task') return generateTask(request, env);

    // Страница задачи: ботам отдаём мета-теги, людям — обычное приложение.
    const taskMatch = url.pathname.match(/^\/task\/(\d+)/);
    if (taskMatch && isSocialBot(request.headers.get('user-agent'))) {
      const preview = await taskPreview(request, env, taskMatch[1]);
      if (preview) return preview;
    }

    return env.ASSETS.fetch(request);
  }
};
