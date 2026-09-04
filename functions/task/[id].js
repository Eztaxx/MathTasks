/* Динамические Open Graph превью для Cloudflare Pages Functions.
   Когда бот Telegram, WhatsApp, Twitter/X, Discord или VK переходит по ссылке
   на задачу вида /task/42-teorema-pifagora, бот не исполняет клиентский JavaScript.
   Эта функция перехватывает запросы ботов, читает название и условие из Supabase
   и отдаёт полноценные мета-теги Open Graph / Twitter Card.
   Обычные браузеры пользователей прозрачно пропускаются к Single Page App (context.next()).
*/

const BOT_PATTERNS = [
  'telegrambot',
  'whatsapp',
  'facebookexternalhit',
  'twitterbot',
  'vkshare',
  'discordbot',
  'slackbot',
  'linkedinbot',
  'viber',
  'applebot'
];

function isSocialBot(userAgent = '') {
  const ua = (userAgent || '').toLowerCase();
  return BOT_PATTERNS.some(bot => ua.includes(bot));
}

const escapeHtml = str => String(str || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function cleanLatexForPreview(latex = '') {
  if (!latex) return '';
  return latex
    .replace(/\\(text|textbf|textit)\{([^}]+)\}/g, '$2')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[$_{}^]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const userAgent = request.headers.get('user-agent') || '';

  // Обычные пользователи получают SPA index.html
  if (!isSocialBot(userAgent)) {
    return context.next();
  }

  // Извлекаем числовой ID задачи из URL вида /task/123-slug или /task/123
  const rawId = String(params.id || '').split('-')[0];
  const taskId = parseInt(rawId, 10);
  if (!taskId || isNaN(taskId)) {
    return context.next();
  }

  const supabaseKey = env.SUPABASE_KEY || env.SUPABASE_ANON_KEY;
  if (!env.SUPABASE_URL || !supabaseKey) {
    return context.next();
  }

  try {
    const apiUrl = `${env.SUPABASE_URL}/rest/v1/tasks?id=eq.${taskId}&select=id,title,condition_latex,condition_image,topics(title,grade)&limit=1`;
    const response = await fetch(apiUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) {
      return context.next();
    }

    const tasks = await response.json();
    const task = tasks && tasks[0];
    if (!task) {
      return context.next();
    }

    const origin = new URL(request.url).origin;
    const taskUrl = request.url;
    const topicTitle = task.topics?.title ? ` • ${task.topics.title}` : '';
    const gradeLabel = task.topics?.grade ? ` [${task.topics.grade}. klase]` : '';
    const pageTitle = `${task.title}${gradeLabel}${topicTitle} — MathTasks`;

    const description = cleanLatexForPreview(task.condition_latex) || 'Математическая задача с ответом, чертежом и пошаговым решением.';
    const imageUrl = task.condition_image || `${origin}/assets/og-preview.png`;

    const html = `<!DOCTYPE html>
<html lang="lv">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">

  <!-- Open Graph / Facebook / Telegram / WhatsApp -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeHtml(taskUrl)}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:site_name" content="MathTasks — Skola2030">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">

  <link rel="canonical" href="${escapeHtml(taskUrl)}">
</head>
<body>
  <h1>${escapeHtml(task.title)}</h1>
  <p>${escapeHtml(description)}</p>
  <p><a href="${escapeHtml(taskUrl)}">Skatīt uzdevumu MathTasks portālā</a></p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (err) {
    return context.next();
  }
}
