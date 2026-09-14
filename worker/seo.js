/* Страницы для поисковиков и для тех, у кого нет JavaScript.

   Сайт — одностраничное приложение: без скриптов любая страница была одной
   и той же оболочкой index.html — общий заголовок «MathTasks — сборник задач
   по математике», общее описание, ни canonical, ни текста. Для поисковика
   все адреса из карты сайта выглядели одинаковыми.

   Воркер берёт ту же оболочку и подставляет в неё заголовок, описание,
   canonical и короткую текстовую версию страницы из каталога. Отдаётся это
   всем посетителям одинаково — это не подмена для ботов. С JavaScript
   текстовую версию прячет theme-init.js до первой отрисовки, а app.js её
   удаляет: приложение рисует ту же страницу само.

   Заголовки и описания повторяют setMeta() в app.js, иначе поисковик видел
   бы, как они меняются после загрузки скриптов. */

import {
  formatSubtopicCode,
  formatTopicTitle,
  getCrossTag,
  latexToPlainText,
  makeSlug,
  taskDescription
} from './lib.js';

/* Сайт открывается и на mathtasks.lv, и на *.workers.dev. Для поисковика это
   две копии; canonical всегда указывает на основной домен. */
export const CANONICAL_ORIGIN = 'https://mathtasks.lv';

const SITE_NAME = 'MathTasks';
const DEFAULT_TITLE = `${SITE_NAME} — сборник задач по математике`;
const DEFAULT_DESCRIPTION = 'Сборник задач по школьной математике: условия, ответы и разбор решений по классам и темам.';
const ITEM_TEXT_LENGTH = 160;
const LIST_LIMIT = 200;

const esc = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const decode = value => {
  try { return decodeURIComponent(value); } catch { return value; }
};

const LEVEL_LABELS = {
  10: 'Vispārīgais līmenis',
  11: 'Optimālais līmenis',
  12: 'Augstākais līmenis',
  visparigais: 'Vispārīgais līmenis',
  'matematika-1': 'Optimālais līmenis',
  'matematika-2': 'Augstākais līmenis'
};

// Как gradeLabel() в app.js на русском: «6 класс», старшие классы — уровнем.
export const gradeLabelRu = grade => LEVEL_LABELS[grade] || (grade ? `${grade} класс` : '');

const GRADE_VALUES = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', 'visparigais', 'matematika-1', 'matematika-2']);

const STATIC_PAGES = {
  '/tasks': { title: 'Все задачи', description: 'Полный список задач с разбором решений.' },
  '/tags': {
    title: 'Кросс-теги',
    description: '23 кросс-тега стандарта VISC / Skola2030 позволяют находить задачи по общим методам и математическим навыкам на стыке тем и классов.'
  },
  '/about': { title: 'О сайте', description: 'Как устроен MathTasks: классы, разделы, темы и разбор решений.' },
  '/control-works': {
    title: 'Тематические контрольные работы',
    description: 'Подготовка к школьным проверочным работам с контролем времени (40 минут).'
  },
  // Личные и служебные страницы: в поиске им делать нечего.
  '/progress': { title: 'Мой прогресс', description: 'Решённые задачи, дни подряд, пройденные темы и достижения.', robots: 'noindex, follow' },
  '/favorites': { title: 'Мои закладки', description: 'Сохранённые задачи по математике для повторения.', robots: 'noindex, follow' },
  '/search': { title: 'Поиск', description: 'Поиск задач по теме или ключевому слову.', robots: 'noindex, follow' }
};

/* Адрес → вид страницы. null — воркер страницу не трогает. */
export function routeOf(pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (path === '/') return { kind: 'home' };
  if (STATIC_PAGES[path]) return { kind: 'static', path };
  let m;
  if ((m = path.match(/^\/task\/(\d+)(?:-[^/]*)?$/))) return { kind: 'task', id: Number(m[1]) };
  if ((m = path.match(/^\/topic\/([^/]+)$/))) return { kind: 'topic', slug: decode(m[1]) };
  if ((m = path.match(/^\/subtopic\/([^/]+)$/))) return { kind: 'subtopic', slug: decode(m[1]) };
  if ((m = path.match(/^\/grade\/([^/]+)\/tasks$/))) return { kind: 'gradeTasks', grade: decode(m[1]) };
  if ((m = path.match(/^\/grade\/([^/]+)$/))) return { kind: 'grade', grade: decode(m[1]) };
  if ((m = path.match(/^\/subject\/([^/]+)$/))) return { kind: 'subject', slug: decode(m[1]) };
  if ((m = path.match(/^\/tag\/([^/]+)$/))) return { kind: 'tag', slug: decode(m[1]) };
  if ((m = path.match(/^\/control-work\/([^/]+)$/))) return { kind: 'controlWork', slug: decode(m[1]) };
  return null;
}

const NEEDS_DATA = new Set(['task', 'topic', 'subtopic', 'grade', 'subject', 'tag', 'controlWork']);

async function query(env, path) {
  const key = env.SUPABASE_KEY || env.SUPABASE_ANON_KEY;
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    // Каталог меняется редко: пять минут кеша на краю Cloudflare снимают запрос к базе с большинства заходов.
    cf: { cacheTtl: 300, cacheEverything: true }
  });
  if (!response.ok) throw new Error(`supabase ${response.status}`);
  return response.json();
}

const eq = value => encodeURIComponent(String(value));
const taskHref = task => `/task/${task.id}-${makeSlug(task.title)}`;
const taskNumber = task => (Number(task.position) > 0 ? Number(task.position) : null);
const taskLabel = task => (taskNumber(task) ? `Задача №${taskNumber(task)}` : 'Задача');
const withGrade = (title, grade) => (grade ? `${title}, ${gradeLabelRu(grade)}` : title);

const taskItems = tasks => tasks.map(task => ({
  href: taskHref(task),
  label: taskLabel(task),
  text: latexToPlainText(task.condition_latex, ITEM_TEXT_LENGTH)
}));

const topicItems = topics => topics.map(topic => ({
  href: `/topic/${topic.slug}`,
  label: withGrade(formatTopicTitle(topic, 'ru'), topic.grade)
}));

const notFound = (heading, intro = 'Возможно, её удалили или ссылка устарела.') => ({
  status: 404,
  title: heading,
  description: intro,
  robots: 'noindex',
  heading,
  intro,
  crumbs: [['Главная', '/']]
});

const HOME_GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'visparigais', 'matematika-1', 'matematika-2'];

/* Данные и тексты страницы. null — страницу не трогаем (нет доступа к базе). */
export async function buildPage(route, env) {
  if (NEEDS_DATA.has(route.kind) && !(env.SUPABASE_URL && (env.SUPABASE_KEY || env.SUPABASE_ANON_KEY))) return null;

  switch (route.kind) {
    case 'home':
      return {
        title: '',
        description: DEFAULT_DESCRIPTION,
        canonicalPath: '/',
        heading: 'Сборник задач по математике',
        intro: 'Условия, ответы и разбор решений по классам и темам программы Skola2030.',
        items: HOME_GRADES.map(grade => ({ href: `/grade/${grade}`, label: gradeLabelRu(grade) })),
        itemsTitle: 'Классы и уровни'
      };

    case 'static': {
      const page = STATIC_PAGES[route.path];
      return {
        ...page,
        canonicalPath: route.path,
        heading: page.title,
        intro: page.description,
        crumbs: [['Главная', '/']]
      };
    }

    case 'grade': {
      if (!GRADE_VALUES.has(route.grade)) return notFound('Класс не найден', 'Возможно, ссылка устарела.');
      const label = gradeLabelRu(route.grade);
      // Список тем — только для 1–9 классов: у старших уровней свои правила отбора тем (isTopicInGrade в app.js).
      const topics = /^\d$/.test(route.grade)
        ? await query(env, `topics?grade=eq.${eq(route.grade)}&select=title,slug,grade,position&order=position.asc&limit=${LIST_LIMIT}`)
        : [];
      return {
        title: `Задачи — ${label}`,
        description: `Разделы, темы и задачи по математике (${label}) с разбором решений.`,
        canonicalPath: `/grade/${route.grade}`,
        heading: `Задачи — ${label}`,
        crumbs: [['Главная', '/']],
        items: topics.map(topic => ({ href: `/topic/${topic.slug}`, label: formatTopicTitle(topic, 'ru') })),
        itemsTitle: 'Темы'
      };
    }

    case 'gradeTasks': {
      if (!GRADE_VALUES.has(route.grade)) return notFound('Класс не найден', 'Возможно, ссылка устарела.');
      const label = gradeLabelRu(route.grade);
      return {
        title: `Все задачи, ${label}`,
        description: 'Полный список задач с разбором решений.',
        canonicalPath: `/grade/${route.grade}/tasks`,
        heading: `Все задачи — ${label}`,
        crumbs: [['Главная', '/'], [label, `/grade/${route.grade}`]]
      };
    }

    case 'subject': {
      const [subject] = await query(env, `subjects?slug=eq.${eq(route.slug)}&select=id,title,slug&limit=1`);
      if (!subject) return notFound('Раздел не найден', 'Возможно, его удалили или ссылка устарела.');
      const topics = await query(env,
        `topics?subject_id=eq.${eq(subject.id)}&select=title,slug,grade,position&order=grade.asc,position.asc&limit=${LIST_LIMIT}`);
      return {
        title: subject.title,
        description: `Темы раздела «${subject.title}» по всем классам (1–12) с задачами и решениями.`,
        canonicalPath: `/subject/${subject.slug}`,
        heading: subject.title,
        crumbs: [['Главная', '/']],
        items: topicItems(topics),
        itemsTitle: 'Темы'
      };
    }

    case 'topic':
    case 'controlWork': {
      const [topic] = await query(env,
        `topics?slug=eq.${eq(route.slug)}&select=id,title,slug,grade,position,description,subjects(title,slug)&limit=1`);
      if (!topic) return notFound('Тема не найдена', 'Возможно, её удалили или ссылка устарела.');
      const topicTitle = formatTopicTitle(topic, 'ru');
      const crumbs = [['Главная', '/']];
      if (topic.grade) crumbs.push([gradeLabelRu(topic.grade), `/grade/${topic.grade}`]);
      if (topic.subjects?.slug) crumbs.push([topic.subjects.title, `/subject/${topic.subjects.slug}`]);

      if (route.kind === 'controlWork') {
        // Контрольная повторяет задачи темы — в поиске ей место занимать незачем.
        return {
          title: `Контрольная работа: ${topicTitle}`,
          description: `Проверочная работа по теме «${topicTitle}» на 40 минут с автоматической оценкой.`,
          canonicalPath: `/control-work/${topic.slug}`,
          robots: 'noindex, follow',
          heading: `Контрольная работа: ${topicTitle}`,
          crumbs: [...crumbs, [topicTitle, `/topic/${topic.slug}`]]
        };
      }

      const tasks = await query(env,
        `tasks?topic_id=eq.${eq(topic.id)}&is_published=eq.true&select=id,title,position,condition_latex&order=position.asc,id.asc&limit=${LIST_LIMIT}`);
      return {
        title: withGrade(topicTitle, topic.grade),
        description: topic.description || `Задачи по теме «${topicTitle}» с условиями, ответами и разбором решений.`,
        canonicalPath: `/topic/${topic.slug}`,
        heading: topicTitle,
        intro: topic.description || '',
        crumbs,
        items: taskItems(tasks),
        itemsTitle: 'Задачи'
      };
    }

    case 'subtopic': {
      const [sub] = await query(env,
        `subtopics?slug=eq.${eq(route.slug)}&select=id,title,code,slug,topics(title,slug,grade,position)&limit=1`);
      if (!sub) return notFound('Подтема не найдена', 'Возможно, её удалили или ссылка устарела.');
      const topic = sub.topics || {};
      const code = formatSubtopicCode(sub.code, topic.grade);
      const title = `${code ? `${code}. ` : ''}${sub.title}`;
      const tasks = await query(env,
        `tasks?subtopic_id=eq.${eq(sub.id)}&is_published=eq.true&select=id,title,position,condition_latex&order=position.asc,id.asc&limit=${LIST_LIMIT}`);
      const crumbs = [['Главная', '/']];
      if (topic.grade) crumbs.push([gradeLabelRu(topic.grade), `/grade/${topic.grade}`]);
      if (topic.slug) crumbs.push([formatTopicTitle(topic, 'ru'), `/topic/${topic.slug}`]);
      return {
        title: withGrade(title, topic.grade),
        description: `Задачи по подтеме «${sub.title}» с условиями, ответами и разбором решений.`,
        canonicalPath: `/subtopic/${sub.slug}`,
        heading: title,
        crumbs,
        items: taskItems(tasks),
        itemsTitle: 'Задачи'
      };
    }

    case 'task': {
      const [task] = await query(env,
        `tasks?id=eq.${eq(route.id)}&is_published=eq.true&select=id,title,position,condition_latex,topics(title,slug,grade,position)&limit=1`);
      if (!task) return notFound('Задача не найдена');
      const topic = task.topics || null;
      const topicTitle = topic ? formatTopicTitle(topic, 'ru') : '';
      const label = taskLabel(task);
      const crumbs = [['Главная', '/']];
      if (topic?.grade) crumbs.push([gradeLabelRu(topic.grade), `/grade/${topic.grade}`]);
      if (topic?.slug) crumbs.push([topicTitle, `/topic/${topic.slug}`]);
      return {
        title: topic ? `${label} — ${withGrade(topicTitle, topic.grade)}` : label,
        description: taskDescription({ condition: task.condition_latex, number: taskNumber(task), topicTitle, lang: 'ru' }),
        canonicalPath: taskHref(task),
        heading: label,
        intro: latexToPlainText(task.condition_latex, 2000),
        crumbs
      };
    }

    case 'tag': {
      let tag = null;
      try {
        [tag] = await query(env, `tags?slug=eq.${eq(route.slug)}&select=slug,title,description&limit=1`);
      } catch {
        tag = null;
      }
      tag = tag || getCrossTag(route.slug);
      if (!tag) return notFound('Тег не найден', 'Возможно, ссылка устарела или тег не существует.');
      const title = tag.title || tag.slug;
      return {
        title: `#${title}`,
        description: tag.description || `Задачи с тегом #${title}`,
        canonicalPath: `/tag/${tag.slug}`,
        heading: `#${title}`,
        intro: tag.description || '',
        crumbs: [['Главная', '/'], ['Кросс-теги', '/tags']]
      };
    }

    default:
      return null;
  }
}

/* Текстовая версия страницы: заголовок, «хлебные крошки», вводный текст,
   список ссылок. Без стилей приложения она читается как обычный документ. */
export function renderSsrBody({ heading, intro = '', crumbs = [], items = [], itemsTitle = '' }) {
  const crumbHtml = crumbs.length
    ? `<nav class="ssr-crumbs" aria-label="Навигация">${crumbs
      .map(([label, href]) => (href ? `<a href="${esc(href)}">${esc(label)}</a>` : `<span>${esc(label)}</span>`))
      .join(' / ')}</nav>`
    : '';
  const list = items.length
    ? `${itemsTitle ? `<h2>${esc(itemsTitle)}</h2>` : ''}<ol class="ssr-list">${items
      .map(item => `<li><a href="${esc(item.href)}">${esc(item.label)}</a>${item.text ? ` — ${esc(item.text)}` : ''}</li>`)
      .join('')}</ol>`
    : '';
  return `<section id="ssr-content" class="ssr-content">${crumbHtml}<h1>${esc(heading)}</h1>${intro ? `<p>${esc(intro)}</p>` : ''}${list}</section>`;
}

/* Подстановка в оболочку index.html. Замены делаются функцией, а не
   строкой: в описании может встретиться «$&», и String.replace принял бы
   его за ссылку на найденный текст. */
export function injectPage(html, page) {
  const fullTitle = page.title ? `${page.title} — ${SITE_NAME}` : DEFAULT_TITLE;
  const description = page.description || DEFAULT_DESCRIPTION;
  const canonical = CANONICAL_ORIGIN + (page.canonicalPath || '/');
  const setAttr = (source, pattern, value) => source.replace(pattern, (match, before, after) => `${before}${esc(value)}${after}`);

  let out = html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(fullTitle)}</title>`);
  out = setAttr(out, /(<meta name="description" content=")[^"]*(")/, description);
  out = setAttr(out, /(<meta property="og:title" content=")[^"]*(")/, fullTitle);
  out = setAttr(out, /(<meta property="og:description" content=")[^"]*(")/, description);

  const head = [
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    page.robots ? `<meta name="robots" content="${esc(page.robots)}" />` : ''
  ].filter(Boolean).join('\n  ');
  out = out.replace('</head>', () => `  ${head}\n</head>`);

  if (page.heading) {
    const body = renderSsrBody(page);
    out = out.replace('<div id="view-home">', () => `${body}\n    <div id="view-home">`);
  }
  return out;
}

/* Страница целиком: оболочка из статики + подстановка. Любой сбой (нет
   базы, база ответила ошибкой, ответ не HTML) — отдаём статику как есть:
   страница без подстановки лучше, чем сломанная. */
export async function renderPage(request, env) {
  const assetResponse = await env.ASSETS.fetch(request);
  const route = routeOf(new URL(request.url).pathname);
  if (!route || !['GET', 'HEAD'].includes(request.method)) return assetResponse;
  const type = assetResponse.headers.get('content-type') || '';
  if (assetResponse.status !== 200 || !type.includes('text/html')) return assetResponse;

  let page;
  try {
    page = await buildPage(route, env);
  } catch (error) {
    console.error('seo:', error.message);
    return assetResponse;
  }
  if (!page) return assetResponse;

  const html = injectPage(await assetResponse.text(), page);
  const headers = new Headers(assetResponse.headers);
  // Тело другое — длина и ETag статики к нему уже не относятся.
  headers.delete('content-length');
  headers.delete('etag');
  headers.set('content-type', 'text/html; charset=utf-8');
  return new Response(request.method === 'HEAD' ? null : html, { status: page.status || 200, headers });
}
