/* Страницы для поисковиков и для тех, у кого нет JavaScript.

   Сайт — одностраничное приложение: без скриптов любая страница была одной
   и той же оболочкой index.html — общий заголовок, общее описание, ни
   canonical, ни текста. Для поисковика все адреса выглядели одинаковыми.

   Воркер берёт ту же оболочку и подставляет в неё заголовок, описание,
   canonical и короткую текстовую версию страницы из каталога. Отдаётся это
   всем посетителям одинаково — это не подмена для ботов. С JavaScript
   текстовую версию прячет theme-init.js до первой отрисовки, а app.js её
   удаляет: приложение рисует ту же страницу само.

   Две языковые версии: русская — на адресах без префикса, латышская — на
   /lv/…. У каждой свой canonical и ссылки на обе версии (hreflang ru, lv и
   x-default — латышская: основной язык страны). Тексты — из словаря
   i18n.js, те же ключи, что у setMeta() в app.js: иначе поисковик видел
   бы, как заголовок меняется после загрузки скриптов. */

import {
  formatSubtopicCode,
  formatTopicTitle,
  getCrossTag,
  getDifficultyWeight,
  getLocalizedText,
  langOfPath,
  latexToPlainText,
  localizeHref,
  makeSlug,
  stripLangPath,
  taskDescription,
  toLangPath
} from './lib.js';
import { t } from './i18n.js';

/* Сайт открывается и на mathtasks.lv, и на *.workers.dev. Для поисковика это
   две копии; canonical всегда указывает на основной домен. */
export const CANONICAL_ORIGIN = 'https://mathtasks.lv';

const SITE_NAME = 'MathTasks';
const ITEM_TEXT_LENGTH = 160;
const LIST_LIMIT = 200;
const LOCALES = { ru: 'ru_RU', lv: 'lv_LV' };

const esc = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const decode = value => {
  try { return decodeURIComponent(value); } catch { return value; }
};

const GRADE_KEYS = { visparigais: 'grade_visparigais', 'matematika-1': 'grade_matematika_1', 'matematika-2': 'grade_matematika_2' };

// Как gradeLabel() в app.js: «6 класс» / «6. klase», старшие классы — уровнем.
export const gradeLabelOf = (grade, lang = 'ru') => {
  if (!grade) return '';
  const key = GRADE_KEYS[grade] || `grade_${grade}`;
  const text = t(key, {}, lang);
  return text && text !== key ? text : t('grade_N', { n: grade }, lang);
};
export const gradeLabelRu = grade => gradeLabelOf(grade, 'ru');

const GRADE_VALUES = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', 'visparigais', 'matematika-1', 'matematika-2']);

// Ключи словаря; robots — личные и служебные страницы, в поиске им делать нечего.
const STATIC_PAGES = {
  '/tasks': { title: 'meta_all_tasks_title', description: 'meta_all_tasks_desc' },
  '/tags': { title: 'tags_label', description: 'meta_tags_desc' },
  '/about': { title: 'meta_about_title', description: 'meta_about_desc' },
  '/control-works': { title: 'cw_catalog_title', description: 'cw_catalog_desc' },
  '/progress': { title: 'progress_title', description: 'progress_meta', robots: 'noindex, follow' },
  '/favorites': { title: 'meta_favorites_title', description: 'meta_favorites_desc', robots: 'noindex, follow' },
  '/search': { title: 'meta_search_page_title', description: 'meta_search_page_desc', robots: 'noindex, follow' }
};

/* Адрес → вид страницы (префикс языка снимается). null — страницу не трогаем. */
export function routeOf(pathname) {
  const clean = stripLangPath(pathname);
  const path = clean.length > 1 ? clean.replace(/\/+$/, '') : clean;
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
  if ((m = path.match(/^\/exam\/([^/]+)$/))) return { kind: 'exam', slug: decode(m[1]) };
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
const shorten = (value, limit) => {
  const text = String(value || '');
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const space = cut.lastIndexOf(' ');
  return `${(space > limit * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
};
const taskHref = task => `/task/${task.id}-${makeSlug(task.title)}`;
const taskNumber = task => (Number(task.position) > 0 ? Number(task.position) : null);

/* Данные и тексты страницы на нужном языке. null — страницу не трогаем
   (нет доступа к базе). */
export async function buildPage(route, env, lang = 'ru') {
  if (NEEDS_DATA.has(route.kind) && !(env.SUPABASE_URL && (env.SUPABASE_KEY || env.SUPABASE_ANON_KEY))) return null;

  const tr = (key, params) => t(key, params, lang);
  const text = (row, field) => getLocalizedText(row, field, lang) || '';
  const topicTitleOf = topic => formatTopicTitle(topic, lang);
  const withGrade = (title, grade) => (grade ? `${title}, ${gradeLabelOf(grade, lang)}` : title);
  const taskLabel = task => (taskNumber(task) ? `${tr('task_prefix')} №${taskNumber(task)}` : tr('task_prefix'));
  const difficultyName = value => {
    const weight = getDifficultyWeight(value);
    return tr(weight === 1 ? 'diff_easy' : weight >= 3 ? 'diff_hard' : 'diff_medium');
  };
  const home = () => [tr('nav_home'), '/'];
  const taskItems = tasks => tasks.map(task => ({
    href: taskHref(task),
    label: taskLabel(task),
    text: latexToPlainText(text(task, 'condition_latex'), ITEM_TEXT_LENGTH)
  }));
  const notFound = key => ({
    status: 404,
    title: tr(key),
    description: tr('meta_not_found_desc'),
    robots: 'noindex',
    heading: tr(key),
    intro: tr('meta_not_found_desc'),
    crumbs: [home()]
  });

  switch (route.kind) {
    case 'home':
      return {
        title: '',
        description: tr('meta_home_desc'),
        canonicalPath: '/',
        heading: tr('meta_home_heading'),
        intro: tr('meta_home_intro'),
        items: [...GRADE_VALUES].map(grade => ({ href: `/grade/${grade}`, label: gradeLabelOf(grade, lang) })),
        itemsTitle: tr('meta_grades_heading')
      };

    case 'static': {
      const keys = STATIC_PAGES[route.path];
      return {
        title: tr(keys.title),
        description: tr(keys.description),
        robots: keys.robots,
        canonicalPath: route.path,
        heading: tr(keys.title),
        intro: tr(keys.description),
        crumbs: [home()]
      };
    }

    case 'grade': {
      if (!GRADE_VALUES.has(route.grade)) return notFound('meta_not_found_grade');
      const label = gradeLabelOf(route.grade, lang);
      // Список тем — только для 1–9 классов: у старших уровней свои правила отбора тем (isTopicInGrade в app.js).
      const topics = /^\d$/.test(route.grade)
        ? await query(env, `topics?grade=eq.${eq(route.grade)}&select=title,title_lv,slug,grade,position&order=position.asc&limit=${LIST_LIMIT}`)
        : [];
      return {
        title: tr('meta_grade_title', { grade: label }),
        description: tr('meta_grade_desc', { grade: label }),
        canonicalPath: `/grade/${route.grade}`,
        heading: tr('meta_grade_title', { grade: label }),
        crumbs: [home()],
        items: topics.map(topic => ({ href: `/topic/${topic.slug}`, label: topicTitleOf(topic) })),
        itemsTitle: tr('topics_heading')
      };
    }

    case 'gradeTasks': {
      if (!GRADE_VALUES.has(route.grade)) return notFound('meta_not_found_grade');
      const label = gradeLabelOf(route.grade, lang);
      return {
        title: tr('meta_all_tasks_grade_title', { grade: label }),
        description: tr('meta_all_tasks_desc'),
        canonicalPath: `/grade/${route.grade}/tasks`,
        heading: tr('meta_all_tasks_grade_title', { grade: label }),
        crumbs: [home(), [label, `/grade/${route.grade}`]]
      };
    }

    case 'subject': {
      const [subject] = await query(env, `subjects?slug=eq.${eq(route.slug)}&select=id,title,title_lv,slug&limit=1`);
      if (!subject) return notFound('meta_not_found_subject');
      const title = text(subject, 'title');
      const topics = await query(env,
        `topics?subject_id=eq.${eq(subject.id)}&select=title,title_lv,slug,grade,position&order=grade.asc,position.asc&limit=${LIST_LIMIT}`);
      return {
        title,
        description: tr('meta_subject_desc', { subject: title }),
        canonicalPath: `/subject/${subject.slug}`,
        heading: title,
        crumbs: [home()],
        items: topics.map(topic => ({ href: `/topic/${topic.slug}`, label: withGrade(topicTitleOf(topic), topic.grade) })),
        itemsTitle: tr('topics_heading')
      };
    }

    case 'topic':
    case 'controlWork': {
      const [topic] = await query(env,
        `topics?slug=eq.${eq(route.slug)}&select=id,title,title_lv,slug,grade,position,description,description_lv,subjects(title,title_lv,slug)&limit=1`);
      if (!topic) return notFound('meta_not_found_topic');
      const topicTitle = topicTitleOf(topic);
      const crumbs = [home()];
      if (topic.grade) crumbs.push([gradeLabelOf(topic.grade, lang), `/grade/${topic.grade}`]);
      if (topic.subjects?.slug) crumbs.push([text(topic.subjects, 'title'), `/subject/${topic.subjects.slug}`]);

      if (route.kind === 'controlWork') {
        // Контрольная повторяет задачи темы — в поиске ей место занимать незачем.
        return {
          title: tr('cw_mode_title', { topic: topicTitle }),
          description: tr('meta_cw_desc', { topic: topicTitle }),
          canonicalPath: `/control-work/${topic.slug}`,
          robots: 'noindex, follow',
          heading: tr('cw_mode_title', { topic: topicTitle }),
          crumbs: [...crumbs, [topicTitle, `/topic/${topic.slug}`]]
        };
      }

      const tasks = await query(env,
        `tasks?topic_id=eq.${eq(topic.id)}&is_published=eq.true&select=id,title,position,condition_latex,condition_latex_lv&order=position.asc,id.asc&limit=${LIST_LIMIT}`);
      const description = text(topic, 'description');
      return {
        title: withGrade(topicTitle, topic.grade),
        description: description || tr('meta_topic_desc', { topic: topicTitle }),
        canonicalPath: `/topic/${topic.slug}`,
        heading: topicTitle,
        intro: description,
        crumbs,
        items: taskItems(tasks),
        itemsTitle: tr('meta_tasks_heading')
      };
    }

    case 'subtopic': {
      const [sub] = await query(env,
        `subtopics?slug=eq.${eq(route.slug)}&select=id,title,title_lv,code,slug,topics(title,title_lv,slug,grade,position)&limit=1`);
      if (!sub) return notFound('subtopic_not_found');
      const topic = sub.topics || {};
      const code = formatSubtopicCode(sub.code, topic.grade);
      const subTitle = text(sub, 'title');
      const title = `${code ? `${code}. ` : ''}${subTitle}`;
      const tasks = await query(env,
        `tasks?subtopic_id=eq.${eq(sub.id)}&is_published=eq.true&select=id,title,position,condition_latex,condition_latex_lv&order=position.asc,id.asc&limit=${LIST_LIMIT}`);
      const crumbs = [home()];
      if (topic.grade) crumbs.push([gradeLabelOf(topic.grade, lang), `/grade/${topic.grade}`]);
      if (topic.slug) crumbs.push([topicTitleOf(topic), `/topic/${topic.slug}`]);
      return {
        title: withGrade(title, topic.grade),
        description: tr('meta_subtopic_desc', { subtopic: subTitle }),
        canonicalPath: `/subtopic/${sub.slug}`,
        heading: title,
        crumbs,
        items: taskItems(tasks),
        itemsTitle: tr('meta_tasks_heading')
      };
    }

    case 'task': {
      const [task] = await query(env,
        `tasks?id=eq.${eq(route.id)}&is_published=eq.true&select=id,title,position,condition_latex,condition_latex_lv,answer_latex,answer_latex_lv,difficulty,topics(id,title,title_lv,slug,grade,position),subtopics(title,title_lv,code)&limit=1`);
      if (!task) return notFound('meta_not_found_task');
      const topic = task.topics || null;
      const topicTitle = topic ? topicTitleOf(topic) : '';
      const label = taskLabel(task);
      const condition = text(task, 'condition_latex');
      const conditionText = latexToPlainText(condition, 2000);
      const crumbs = [home()];
      if (topic?.grade) crumbs.push([gradeLabelOf(topic.grade, lang), `/grade/${topic.grade}`]);
      if (topic?.slug) crumbs.push([topicTitle, `/topic/${topic.slug}`]);

      /* Страница задачи была самой пустой на сайте: заголовок «Задача №N»,
         одинаковый по форме у сотен страниц, и одна строка условия — ни
         ответа, ни ссылок дальше. Условие в заголовке, ответ, подтема со
         сложностью и соседние задачи темы дают ей собственный текст и путь
         вглубь каталога. Разбор в разметку не идёт: его ученик открывает
         сам после попытки. */
      const answer = latexToPlainText(text(task, 'answer_latex'), 300);
      const sub = task.subtopics || null;
      const subCode = sub ? formatSubtopicCode(sub.code, topic?.grade) : '';
      const subTitle = sub ? `${subCode ? `${subCode}. ` : ''}${text(sub, 'title')}` : '';
      const facts = [
        topicTitle ? `${tr('meta_topic_label')}: ${topicTitle}` : '',
        subTitle ? `${tr('meta_subtopic_label')}: ${subTitle}` : '',
        task.difficulty ? `${tr('meta_difficulty_label')}: ${difficultyName(task.difficulty)}` : ''
      ].filter(Boolean).join(' · ');
      const siblings = topic?.id
        ? await query(env, `tasks?topic_id=eq.${eq(topic.id)}&is_published=eq.true&id=neq.${eq(task.id)}`
          + `&select=id,title,position,condition_latex,condition_latex_lv&order=position.asc,id.asc&limit=8`)
        : [];
      return {
        title: topic ? `${label} — ${withGrade(topicTitle, topic.grade)}` : label,
        description: taskDescription({ condition, number: taskNumber(task), topicTitle, lang }),
        canonicalPath: taskHref(task),
        heading: conditionText ? `${label}. ${shorten(conditionText, 110)}` : label,
        // Условие целиком — только если в заголовок оно не поместилось.
        intro: conditionText.length > 110 ? conditionText : '',
        details: [answer ? `${tr('label_answer')} ${answer}` : '', facts],
        crumbs,
        items: taskItems(siblings),
        itemsTitle: siblings.length ? tr('meta_other_tasks_heading') : ''
      };
    }

    /* Экзамен идёт по собственному адресу, но в поиске ему делать нечего:
       это рабочий экран с таймером, а не страница с содержимым. Без этой
       ветки он попал бы под правило «адрес неизвестен — 404». */
    case 'exam':
      return {
        title: tr('nav_exams'),
        description: tr('meta_exams_desc'),
        canonicalPath: '/exams',
        robots: 'noindex, follow',
        heading: tr('nav_exams'),
        crumbs: [home(), [tr('nav_exams'), '/exams']]
      };

    case 'tag': {
      let tag = null;
      try {
        [tag] = await query(env, `tags?slug=eq.${eq(route.slug)}&select=slug,title,title_lv,description,description_lv&limit=1`);
      } catch {
        tag = null;
      }
      const dict = getCrossTag(route.slug);
      tag = tag || dict;
      if (!tag) return notFound('meta_not_found_tag');
      const title = text(tag, 'title') || tag.slug;
      // Как showTag в app.js: латышское описание — из базы или словаря lib.js.
      const description = (lang === 'lv' && (tag.description_lv || dict?.description_lv)) || tag.description || dict?.description || '';
      return {
        title: `#${title}`,
        description: description || tr('meta_tag_desc', { tag: title }),
        canonicalPath: `/tag/${tag.slug}`,
        heading: `#${title}`,
        intro: description,
        crumbs: [home(), [tr('tags_label'), '/tags']]
      };
    }

    default:
      return null;
  }
}

/* Текстовая версия страницы: заголовок, «хлебные крошки», вводный текст,
   список ссылок. Ссылки ведут на версию того же языка. */
export function renderSsrBody({ heading, intro = '', details = [], crumbs = [], items = [], itemsTitle = '' }, lang = 'ru') {
  const href = path => esc(localizeHref(path, lang));
  const crumbHtml = crumbs.length
    ? `<nav class="ssr-crumbs" aria-label="${esc(t('breadcrumbs', {}, lang))}">${crumbs
      .map(([label, path]) => (path ? `<a href="${href(path)}">${esc(label)}</a>` : `<span>${esc(label)}</span>`))
      .join(' / ')}</nav>`
    : '';
  const list = items.length
    ? `${itemsTitle ? `<h2>${esc(itemsTitle)}</h2>` : ''}<ol class="ssr-list">${items
      .map(item => `<li><a href="${href(item.href)}">${esc(item.label)}</a>${item.text ? ` — ${esc(item.text)}` : ''}</li>`)
      .join('')}</ol>`
    : '';
  const detailHtml = details.filter(Boolean).map(line => `<p>${esc(line)}</p>`).join('');
  return `<section id="ssr-content" class="ssr-content">${crumbHtml}<h1>${esc(heading)}</h1>${intro ? `<p>${esc(intro)}</p>` : ''}${detailHtml}${list}</section>`;
}

const SITE_LOGO = '/icons/icon-512.png';
const SPA_SHELL_MARKER = '<div id="view-home">';
// Превью ссылки: 1200×630, как ждут Facebook, WhatsApp и Telegram.
// Рисуется из логотипа скриптом scripts/make-og-cover.cjs.
const SITE_COVER = '/og-cover.png';

/* Разметка Schema.org. Главное здесь — имя: по запросу «mathtasks» Google
   должен знать, что так называется этот сайт, а не выводить это из текста
   страниц. WebSite и Organization описывают сам сайт, BreadcrumbList —
   путь по каталогу, который поисковик показывает вместо голого адреса.
   «<» внутри JSON экранируем: иначе строка вида «a < b» из условия задачи
   закрыла бы тег script. */
function structuredData(page, lang, canonical) {
  if (page.status === 404) return '';
  const graph = [];
  const home = CANONICAL_ORIGIN + toLangPath('/', lang);
  const path = page.canonicalPath || '/';

  if (path === '/') {
    graph.push({
      '@type': 'WebSite',
      '@id': `${CANONICAL_ORIGIN}#website`,
      url: home,
      name: SITE_NAME,
      alternateName: 'MathTasks.lv',
      inLanguage: lang,
      publisher: { '@id': `${CANONICAL_ORIGIN}#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${CANONICAL_ORIGIN}${toLangPath('/search', lang)}?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    });
    graph.push({
      '@type': 'EducationalOrganization',
      '@id': `${CANONICAL_ORIGIN}#organization`,
      name: SITE_NAME,
      url: CANONICAL_ORIGIN,
      logo: CANONICAL_ORIGIN + SITE_LOGO,
      areaServed: 'LV',
      description: t('meta_home_desc', {}, lang)
    });
  }

  const crumbs = (page.crumbs || []).filter(([name]) => name);
  if (crumbs.length > 1) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map(([name, crumbPath], index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name,
        item: crumbPath ? CANONICAL_ORIGIN + toLangPath(crumbPath, lang) : canonical
      }))
    });
  }
  if (!graph.length) return '';
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

/* Подстановка в оболочку index.html. Замены делаются функцией, а не
   строкой: в описании может встретиться «$&», и String.replace принял бы
   его за ссылку на найденный текст. */
export function injectPage(html, page, lang = 'ru') {
  const fullTitle = page.title ? `${page.title} — ${SITE_NAME}` : t('meta_site_title', {}, lang);
  const description = page.description || t('meta_home_desc', {}, lang);
  const path = page.canonicalPath || '/';
  const canonical = CANONICAL_ORIGIN + toLangPath(path, lang);
  const setAttr = (source, pattern, value) => source.replace(pattern, (match, before, after) => `${before}${esc(value)}${after}`);

  let out = html.replace(/<html lang="[a-z]+"/, () => `<html lang="${lang}"`);
  out = out.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(fullTitle)}</title>`);
  out = setAttr(out, /(<meta name="description" content=")[^"]*(")/, description);
  out = setAttr(out, /(<meta property="og:title" content=")[^"]*(")/, fullTitle);
  out = setAttr(out, /(<meta property="og:description" content=")[^"]*(")/, description);
  out = setAttr(out, /(<meta property="og:locale" content=")[^"]*(")/, LOCALES[lang] || LOCALES.ru);
  // Карточка широкая — значит и в X она должна быть широкой, а не квадратом.
  out = setAttr(out, /(<meta name="twitter:card" content=")[^"]*(")/, 'summary_large_image');

  /* Ссылки на обе языковые версии — только у страниц, которые попадают в
     поиск: у 404 и noindex их нет. */
  const indexable = page.status !== 404 && !page.robots;
  const ruUrl = CANONICAL_ORIGIN + toLangPath(path, 'ru');
  const lvUrl = CANONICAL_ORIGIN + toLangPath(path, 'lv');
  // У 404 canonical нет: указывать ему на главную — значит выдавать её за копию несуществующей страницы.
  const head = [
    page.status !== 404 ? `<link rel="canonical" href="${esc(canonical)}" />` : '',
    indexable ? `<link rel="alternate" hreflang="ru" href="${esc(ruUrl)}" />` : '',
    indexable ? `<link rel="alternate" hreflang="lv" href="${esc(lvUrl)}" />` : '',
    indexable ? `<link rel="alternate" hreflang="x-default" href="${esc(lvUrl)}" />` : '',
    `<meta property="og:url" content="${esc(canonical)}" />`,
    /* Без картинки ссылка на сайт в мессенджере выглядит голой строкой, а
       репост — самый дешёвый способ, которым имя сайта расходится по сети. */
    `<meta property="og:image" content="${esc(CANONICAL_ORIGIN + SITE_COVER)}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta name="twitter:image" content="${esc(CANONICAL_ORIGIN + SITE_COVER)}" />`,
    page.robots ? `<meta name="robots" content="${esc(page.robots)}" />` : '',
    structuredData(page, lang, canonical)
  ].filter(Boolean).join('\n  ');
  out = out.replace('</head>', () => `  ${head}\n</head>`);

  if (page.heading) {
    const body = renderSsrBody(page, lang);
    out = out.replace('<div id="view-home">', () => `${body}\n    <div id="view-home">`);
  }
  return out;
}

/* Страница целиком: оболочка из статики + подстановка. Любой сбой (нет
   базы, база ответила ошибкой, ответ не HTML) — отдаём статику как есть:
   страница без подстановки лучше, чем сломанная. */
export async function renderPage(request, env) {
  /* У HEAD тело пустое, и по нему не отличить оболочку приложения от
     отдельной страницы: маркер не находился, и несуществующий адрес
     отвечал 200 вместо 404. Поэтому для HEAD спрашиваем страницу как GET,
     а тело в ответе всё равно не отдаём. */
  const probe = request.method === 'HEAD'
    ? new Request(request.url, { method: 'GET', headers: request.headers })
    : request;
  const assetResponse = await env.ASSETS.fetch(probe);
  const { pathname } = new URL(request.url);
  const route = routeOf(pathname);
  if (!['GET', 'HEAD'].includes(request.method)) return assetResponse;
  const type = assetResponse.headers.get('content-type') || '';
  if (assetResponse.status !== 200 || !type.includes('text/html')) return assetResponse;

  const lang = langOfPath(pathname);
  let page;
  if (!route) {
    /* Несуществующий адрес Cloudflare отдаёт оболочкой приложения с кодом
       200, и для поисковика это бесконечное число копий главной — «мягкая
       404», из-за которой отчёт об индексировании заполняется мусором.
       Отдаём честный 404 и noindex. Приложение при этом грузится и
       показывает главную, как и раньше: код ответа ему не мешает. */
    const html = await assetResponse.text();
    if (!html.includes(SPA_SHELL_MARKER)) return new Response(html, assetResponse);
    page = {
      status: 404,
      title: t('meta_not_found_page', {}, lang),
      description: t('meta_not_found_desc', {}, lang),
      robots: 'noindex',
      heading: t('meta_not_found_page', {}, lang),
      intro: t('meta_not_found_desc', {}, lang),
      crumbs: [[t('nav_home', {}, lang), '/']]
    };
    const headers = new Headers(assetResponse.headers);
    headers.delete('content-length');
    headers.delete('etag');
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.set('content-language', lang);
    const body = injectPage(html, page, lang);
    return new Response(request.method === 'HEAD' ? null : body, { status: 404, headers });
  }
  try {
    page = await buildPage(route, env, lang);
  } catch (error) {
    console.error('seo:', error.message);
    return assetResponse;
  }
  if (!page) return assetResponse;

  const html = injectPage(await assetResponse.text(), page, lang);
  const headers = new Headers(assetResponse.headers);
  // Тело другое — длина и ETag статики к нему уже не относятся.
  headers.delete('content-length');
  headers.delete('etag');
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('content-language', lang);
  return new Response(request.method === 'HEAD' ? null : html, { status: page.status || 200, headers });
}
