const { db, escapeHtml, loadViewer, renderMath, imageUrl, GRADES, fillGradeSelect, t = (k => k), getLang = () => 'ru', setLang = () => {}, applyTranslations = () => {} } = window.MathTasks;

const sidebarNav = document.querySelector('#sidebar-nav');
const viewHome = document.querySelector('#view-home');
const viewList = document.querySelector('#view-list');
const viewAbout = document.querySelector('#view-about');
const viewControlWork = document.querySelector('#view-control-work');
const viewControlWorks = document.querySelector('#view-control-works');
const viewProgress = document.querySelector('#view-progress');
const topicsElement = document.querySelector('#topics');
const tasksElement = document.querySelector('#tasks');
const gradeFilter = document.querySelector('#grade-filter');
const searchInput = document.querySelector('#search-input');
const listTopics = document.querySelector('#list-topics');
const listGroups = document.querySelector('#list-groups');
const listTasks = document.querySelector('#list-tasks');
const listAnchors = document.querySelector('#list-anchors');
const listSubtopics = document.querySelector('#list-subtopics');
const listActions = document.querySelector('#list-actions');
const topicsHeading = document.querySelector('#topics-heading');
const tasksHeading = document.querySelector('#tasks-heading');
const accountButton = document.querySelector('#account-button');
const accountDialog = document.querySelector('#account-dialog');
const accountEmail = document.querySelector('#account-email');
const accountStatus = document.querySelector('#account-status');
const adminPanelSlot = document.querySelector('#admin-panel-slot');

let currentUser = null;
let isCurrentUserAdmin = false;
let subjects = [];
let allTopics = [];
let taskCounts = new Map();
let topicTasksMap = new Map();
/* Третий уровень каталога: раздел -> тема -> подтема -> задача.
   Подтема необязательна, задача может лежать прямо в теме. */
let allSubtopics = [];
let subtopicsByTopic = new Map();
let subtopicCounts = new Map();

function getTopicProgress(topicId) {
  const taskIds = topicTasksMap.get(topicId) || [];
  const solved = getSolvedTasks();
  return (window.MathTasksLib && window.MathTasksLib.calcTopicProgress)
    ? window.MathTasksLib.calcTopicProgress(taskIds, solved)
    : { total: taskIds.length, solved: 0, percent: 0, isComplete: false };
}

/* Класс — глобальный контекст: он выбирается один раз и определяет,
   что показывают меню, главная, страницы разделов и поиск. */
let selectedGrade = null;
try {
  const raw = localStorage.getItem('math-tasks:grade');
  if (raw === 'visparigais') selectedGrade = 'visparigais';
  else if (raw === 'matematika-1' || raw === '10' || raw === '11') selectedGrade = 'matematika-1';
  else if (raw === 'matematika-2' || raw === '12') selectedGrade = 'matematika-2';
  else if (raw) {
    const num = Number(raw);
    if ([1, 2, 3, 4, 5, 6, 7, 8, 9].includes(num)) selectedGrade = num;
  }
} catch {}

/* Мультиязычные колонки добавляет миграция 007, а кросс-теги — миграция 010.
   Если код выкатили раньше миграций, PostgREST отвечает 400 на весь запрос.
   Поэтому набор полей выбирается адаптивно: пробуем с тегами, при ошибке
   откатываемся на полный без тегов, а при отсутствии колонок языка — на базовый. */
const TASK_SELECT_WITH_TAGS = '*, task_tags(tags(id, slug, title, title_lv, description)), topics(title, title_lv, slug, description, description_lv, subjects(title, title_lv, icon))';
const TASK_SELECT_FULL = '*, topics(title, title_lv, slug, description, description_lv, subjects(title, title_lv, icon))';
const TASK_SELECT_BASE = '*, topics(title, slug, description, subjects(title, icon))';
let TASK_SELECT = TASK_SELECT_FULL;
const MIN_CONTROL_WORK_TASKS = 1;
let multilingualColumns = true;
let hasTagsSupport = false;
let allTags = (window.MathTasksLib && window.MathTasksLib.CROSS_TAGS) ? window.MathTasksLib.CROSS_TAGS : [];

async function detectMultilingualColumns() {
  if (!db) return;
  try {
    const { error } = await db.from('topics').select('title_lv').limit(1);
    if (error) {
      multilingualColumns = false;
      TASK_SELECT = TASK_SELECT_BASE;
      console.warn('Мультиязычные колонки не найдены — примените supabase/migrations/007_multilingual_tasks.sql. Сайт работает на базовом языке.');
      return;
    }
  } catch {
    multilingualColumns = false;
    TASK_SELECT = TASK_SELECT_BASE;
    return;
  }

  // Проверяем наличие таблицы tags и task_tags (миграция 010)
  try {
    const { data, error } = await db.from('tags').select('id, slug, title, title_lv, description').order('position');
    if (!error && data && data.length > 0) {
      hasTagsSupport = true;
      allTags = data;
      TASK_SELECT = TASK_SELECT_WITH_TAGS;
    } else {
      hasTagsSupport = false;
      allTags = (window.MathTasksLib && window.MathTasksLib.CROSS_TAGS) ? window.MathTasksLib.CROSS_TAGS : [];
      TASK_SELECT = TASK_SELECT_FULL;
    }
  } catch {
    hasTagsSupport = false;
    allTags = (window.MathTasksLib && window.MathTasksLib.CROSS_TAGS) ? window.MathTasksLib.CROSS_TAGS : [];
    TASK_SELECT = TASK_SELECT_FULL;
  }
}

const loc = (item, field) => {
  const lang = window.MathTasks?.getLang ? window.MathTasks.getLang() : 'ru';
  return (window.MathTasksLib && window.MathTasksLib.getLocalizedText)
    ? window.MathTasksLib.getLocalizedText(item, field, lang)
    : (item?.[field] || '');
};

/* Язык — часть адреса: /lv/… латышский, без префикса русский (lib.js).
   Маршруты разбираются по пути без префикса, а ссылки и переходы получают
   префикс текущего языка. */
const langLib = window.MathTasksLib || {};
const stripLangPath = path => (langLib.stripLangPath ? langLib.stripLangPath(path) : (path || '/'));
const appPath = () => stripLangPath(location.pathname);
const langPath = (path, lang = getLang()) => (langLib.localizeHref ? langLib.localizeHref(path, lang) : path);

// Заголовки и описания страниц — из словаря i18n.js; те же ключи отдаёт воркер (worker/seo.js).
const metaText = (key, params) => (window.MathTasks.t || (k => k))(key, params);

const topicTitleOf = (topic) => {
  const lang = window.MathTasks?.getLang ? window.MathTasks.getLang() : 'ru';
  return (window.MathTasksLib && window.MathTasksLib.formatTopicTitle)
    ? window.MathTasksLib.formatTopicTitle(topic, lang)
    : loc(topic, 'title');
};

const subjectOf = task => task.topics?.subjects;
const tagClass = subject => {
  const title = (subject?.title || '').toLowerCase();
  if (title.includes('геометр')) return 'geometry';
  if (title.includes('статистик') || title.includes('вероятност')) return 'statistics';
  return 'algebra';
};
const subjectById = id => subjects.find(item => item.id === id);
/* Иконка раздела. В базе она заполнена не везде и местами содержит
   невидимые символы, поэтому подчищаем и подставляем общий знак. */
const subjectIcon = subject => {
  const raw = String(subject?.icon || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  return raw || '📘';
};

const topicClass = index => ['lavender', 'green', 'orange', 'blue', 'pink', 'aqua', 'violet'][index % 7];

/* Короткое имя ступени для плашек: полное «Matemātika II (Augstākais)»
   в плашку сайдбара не помещается и переносится в три строки. */
const gradeLabelShort = grade => {
  const tr = window.MathTasks.t || (k => k);
  const key = (grade === 10 || grade === 'visparigais') ? 'grade_short_visp'
    : (grade === 11 || grade === 'matematika-1') ? 'grade_short_opt'
    : (grade === 12 || grade === 'matematika-2') ? 'grade_short_augst'
    : null;
  if (!key) return gradeLabel(grade);
  const translated = tr(key);
  return translated && translated !== key ? translated : gradeLabel(grade);
};

const gradeLabel = grade => {
  const tr = window.MathTasks.t || (k => k);
  const isLv = (window.MathTasksI18n?.getLang?.() === 'lv');
  if (!grade) return tr('all_grades') !== 'all_grades' ? tr('all_grades') : (isLv ? 'Visas klases' : 'Все классы');
  if (grade === 'visparigais' || grade === 'vispārīgais') return tr('grade_visparigais') !== 'grade_visparigais' ? tr('grade_visparigais') : 'Vispārīgais līmenis';
  if (grade === 'matematika-1') return tr('grade_matematika_1') !== 'grade_matematika_1' ? tr('grade_matematika_1') : 'Matemātika I (Optimālais)';
  if (grade === 'matematika-2') return tr('grade_matematika_2') !== 'grade_matematika_2' ? tr('grade_matematika_2') : 'Matemātika II (Augstākais)';
  const key = `grade_${grade}`;
  const translated = tr(key);
  if (translated && translated !== key) return translated;
  const nForm = tr('grade_N', { n: grade });
  if (nForm && nForm !== 'grade_N') return nForm;
  return isLv ? `${grade}. klase` : `${grade} класс`;
};

function isTopicInGrade(topic, grade) {
  if (!grade) return true;
  if (grade === 'visparigais') {
    if (topic.slug && (topic.slug.startsWith('opt-') || topic.slug.startsWith('augst-'))) return false;
    return topic.grade === 10 || topic.grade === 'visparigais' || (topic.slug && topic.slug.startsWith('visp-')) || (topic.description && topic.description.toLowerCase().includes('vispār'));
  }
  if (grade === 'matematika-1') {
    if (topic.slug && (topic.slug.startsWith('visp-') || topic.slug.startsWith('augst-'))) return false;
    return topic.grade === 11 || topic.grade === 'matematika-1' || (topic.slug && topic.slug.startsWith('opt-'));
  }
  if (grade === 'matematika-2') {
    if (topic.slug && (topic.slug.startsWith('visp-') || topic.slug.startsWith('opt-'))) return false;
    return topic.grade === 12 || topic.grade === 'matematika-2' || (topic.slug && topic.slug.startsWith('augst-'));
  }
  return topic.grade === Number(grade);
}

// В контексте класса показываем только его темы; тема без класса живёт лишь в режиме «Все классы».
const topicsForGrade = list => (selectedGrade ? list.filter(topic => isTopicInGrade(topic, selectedGrade)) : list);
const taskCount = topicId => taskCounts.get(topicId) || 0;

/* ── Контекст класса ──────────────────────────────────────────────── */

function renderGradeControls() {
  const tr = window.MathTasks.t || (k => k);

  const isCurrent = val => {
    if (val === '' && selectedGrade == null) return true;
    if (val === 'visparigais' && selectedGrade === 'visparigais') return true;
    if (val === 'matematika-1' && (selectedGrade === 'matematika-1' || selectedGrade === 10 || selectedGrade === 11)) return true;
    if (val === 'matematika-2' && (selectedGrade === 'matematika-2' || selectedGrade === 12)) return true;
    return String(selectedGrade ?? '') === String(val);
  };

  /* kind: 'exam' — 9 класс (золотой), 'level' — уровень старшей школы,
     у каждого уровня свой цвет (level-<значение>). */
  const renderChip = ([value, label, href, kind]) => {
    const active = isCurrent(value);
    const cls = ['grade-chip', active ? 'active' : '', kind === 'exam' ? 'grade-chip-exam' : '', kind === 'level' ? `grade-chip-level level-${value}` : '']
      .filter(Boolean).join(' ');
    return `<a class="${cls}" href="${href}"${active ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a>`;
  };

  const pamatChips = [
    ['', tr('all_grades_short') || 'Visi', '/'],
    ...[1, 2, 3, 4, 5, 6, 7, 8].map(g => [String(g), tr(`grade_${g}`) || tr('grade_N', { n: g }) || `${g}. klase`, `/grade/${g}`]),
    ['9', `${tr('grade_9') || '9. klase'} 🎯`, '/grade/9', 'exam']
  ];

  const vidusChips = [
    /* У каждого уровня свой знак, как 🎯 у 9 класса: основа — рост — вершина. */
    ['visparigais', `${tr('grade_visparigais') || 'Vispārīgais līmenis'} 🌱`, '/grade/visparigais', 'level'],
    ['matematika-1', `${tr('grade_matematika_1') || 'Matemātika I (Optimālais)'} 📈`, '/grade/matematika-1', 'level'],
    ['matematika-2', `${tr('grade_matematika_2') || 'Matemātika II (Augstākais)'} 🚀`, '/grade/matematika-2', 'level']
  ];

  gradeFilter.innerHTML = `
    <div class="grade-stage-block">
      <div class="grade-stage-header">
        <span class="stage-badge stage-badge-pamat">🎓 ${escapeHtml(tr('stage_pamatskola'))}</span>
        <span class="stage-sub">${escapeHtml(tr('stage_pamatskola_desc'))}</span>
      </div>
      <div class="grade-chips-list">${pamatChips.map(renderChip).join('')}</div>
    </div>
    <div class="grade-stage-block">
      <div class="grade-stage-header">
        <span class="stage-badge stage-badge-vidus">🏛️ ${escapeHtml(tr('stage_vidusskola'))}</span>
        <span class="stage-sub">${escapeHtml(tr('stage_vidusskola_desc'))}</span>
      </div>
      <div class="grade-chips-list">${vidusChips.map(renderChip).join('')}</div>
    </div>
  `;
}

function parseGradeValue(val) {
  if (!val) return null;
  if (val === 'visparigais' || val === 'vispārīgais') return 'visparigais';
  if (val === 'matematika-1') return 'matematika-1';
  if (val === 'matematika-2') return 'matematika-2';
  if (val === '10' || val === 10) return 'visparigais';
  if (val === '11' || val === 11) return 'matematika-1';
  if (val === '12' || val === 12) return 'matematika-2';
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

function applyGrade(grade) {
  selectedGrade = parseGradeValue(grade);
  try {
    if (selectedGrade) localStorage.setItem('math-tasks:grade', String(selectedGrade));
    else localStorage.removeItem('math-tasks:grade');
  } catch {}
  renderGradeControls();
  renderSidebar();
  renderHeadings();
}

// Клик по чипсу класса на главной странице: остаёмся на главной,
// фильтруем темы и задачи прямо на месте без переключения на view-list.
gradeFilter.addEventListener('click', async event => {
  const chip = event.target.closest('.grade-chip');
  if (!chip) return;
  event.preventDefault();
  const href = stripLangPath(chip.getAttribute('href'));
  const raw = href === '/' ? null : href.replace('/grade/', '');
  if (location.pathname !== langPath(href)) {
    history.pushState(null, '', langPath(href));
    lastRoute = location.pathname + location.search;
  }
  applyGrade(raw);
  const label = gradeLabel(selectedGrade);
  setMeta(
    selectedGrade ? metaText('meta_grade_title', { grade: label }) : '',
    selectedGrade ? metaText('meta_grade_desc', { grade: label }) : metaText('meta_home_desc')
  );
  await loadHome();
});


/* ── Боковое меню: Два режима (Хаб экзаменов / Фокус на теме) ───── */

let currentActiveTopic = null;
/* Открытая подтема: на её странице контрольная работа темы не нужна —
   она собирается по всей теме, а не по одной подтеме. */
let currentSubtopic = null;

function renderTopicSidebar(topic) {
  const subject = subjectById(topic.subject_id);
  const grade = topic.grade ?? selectedGrade;
  const topicTitle = topicTitleOf(topic);
  const subjectTitle = loc(subject, 'title');

  // Контекстная плашка открытой темы
  const banner = `<div class="sidebar-topic-banner">
    <div class="topic-banner-top">
      ${grade ? `<span class="topic-banner-pill">${escapeHtml(gradeLabelShort(grade))}</span>` : ''}
      <span class="topic-banner-subject">${escapeHtml(subjectTitle || 'Математика')}</span>
    </div>
    <div class="topic-banner-title">${escapeHtml(topicTitle)}</div>
  </div>`;

  // Темы текущего класса по разделам
  const gradeTopics = topicsForGrade(allTopics);
  const heading = `<div class="sidebar-focus-heading">
    <span>${(window.MathTasks.t || (k => k))('topics_heading')} (${gradeLabel(grade)})</span>
    <span class="focus-count">${gradeTopics.length}</span>
  </div>`;

  const groups = subjects.map((subj, index) => {
    const sTopics = gradeTopics.filter(t => t.subject_id === subj.id);
    if (!sTopics.length) return '';
    const links = sTopics.map(t => {
      const isCurrent = t.id === topic.id;
      return `<a class="${isCurrent ? 'active' : ''}" href="/topic/${encodeURIComponent(t.slug)}">${escapeHtml(topicTitleOf(t))}</a>`;
    }).join('');
    const sTitle = loc(subj, 'title');
    return `<section class="nav-group open" data-subject="${subj.id}">
      <button class="group-title" title="${escapeHtml(sTitle)}"><span class="nav-icon tc-subj subj-${subjectColor(subj)}">${escapeHtml(subjectIcon(subj))}</span><span class="label">${escapeHtml(sTitle)}</span><span class="chevron" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg></span></button>
      <div class="subnav"><a class="subnav-all" href="/subject/${encodeURIComponent(subj.slug)}">${escapeHtml((window.MathTasks.t || (k => k))('subject_all_topics'))}</a>${links}</div>
    </section>`;
  }).filter(Boolean).join('');

  sidebarNav.innerHTML = banner + heading + (groups || `<p class="subnav-empty">${(window.MathTasks.t || (k => k))('course_no_topics_yet')}</p>`);
  markActiveNav(topic.slug);
}

function renderClassSidebar(grade) {
  const label = gradeLabel(grade);
  const labelShort = gradeLabelShort(grade);

  const banner = `<div class="sidebar-topic-banner">
    <div class="topic-banner-top">
      <span class="topic-banner-pill">${escapeHtml(labelShort)}</span>
      <span class="topic-banner-subject">${escapeHtml((window.MathTasks.t || (k => k))('catalog_of_tasks'))}</span>
    </div>
    <div class="topic-banner-title">${escapeHtml((window.MathTasks.t || (k => k))('course_all_tasks'))}</div>
  </div>`;

  const gradeTopics = topicsForGrade(allTopics);
  const heading = `<div class="sidebar-focus-heading">
    <span>${(window.MathTasks.t || (k => k))('topics_heading')} (${label})</span>
    <span class="focus-count">${gradeTopics.length}</span>
  </div>`;

  const groups = subjects.map((subj, index) => {
    const sTopics = gradeTopics.filter(t => t.subject_id === subj.id);
    if (!sTopics.length) return '';
    const links = sTopics.map(t => `<a href="/topic/${encodeURIComponent(t.slug)}">${escapeHtml(topicTitleOf(t))}</a>`).join('');
    return `<section class="nav-group open" data-subject="${subj.id}">
      <button class="group-title" title="${escapeHtml(subj.title)}"><span class="nav-icon tc-subj subj-${subjectColor(subj)}">${escapeHtml(subjectIcon(subj))}</span><span class="label">${escapeHtml(subj.title)}</span><span class="chevron" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg></span></button>
      <div class="subnav"><a class="subnav-all" href="/subject/${encodeURIComponent(subj.slug)}">${escapeHtml((window.MathTasks.t || (k => k))('subject_all_topics'))}</a>${links}</div>
    </section>`;
  }).filter(Boolean).join('');

  sidebarNav.innerHTML = banner + heading + (groups || `<p class="subnav-empty">${(window.MathTasks.t || (k => k))('course_no_topics_yet')}</p>`);
  markActiveNav();
}

function renderHubSidebar() {
  const tr = window.MathTasks.t || (k => k);
  const home = '';

  // 0. Treniņi un sagatavošanās eksāmeniem
  const prepTrack = `
    <div class="sidebar-track-header">
      <span class="track-header-icon">⚡</span>
      <span class="track-header-title">${escapeHtml(tr('track_heading_trainers'))}</span>
    </div>
    <div class="sidebar-track-subgroup">
      <a class="sidebar-track-card${appPath() === '/trainer.html' ? ' active' : ''}" href="/trainer.html" title="${escapeHtml(tr('nav_trainer'))}">
        <div class="track-card-badge gold">⚡</div>
        <div class="track-card-body">
          <strong>${escapeHtml(tr('nav_trainer'))}</strong>
          <span>${escapeHtml(tr('nav_trainer_desc'))}</span>
        </div>
      </a>
      <a class="sidebar-track-card" href="/trainer.html?section=equations" title="${escapeHtml(tr('nav_trainer_eq'))}">
        <div class="track-card-badge orange">⚖️</div>
        <div class="track-card-body">
          <strong>${escapeHtml(tr('nav_trainer_eq'))}</strong>
          <span>${escapeHtml(tr('nav_trainer_eq_desc'))}</span>
        </div>
      </a>
      <a class="sidebar-track-card" href="/trainer.html?section=expressions" title="${escapeHtml(tr('nav_trainer_expr'))}">
        <div class="track-card-badge green">🔣</div>
        <div class="track-card-body">
          <strong>${escapeHtml(tr('nav_trainer_expr'))}</strong>
          <span>${escapeHtml(tr('nav_trainer_expr_desc'))}</span>
        </div>
      </a>
    </div>

    <div class="sidebar-track-header">
      <span class="track-header-icon">🎓</span>
      <span class="track-header-title">${escapeHtml(tr('track_heading_exams'))}</span>
    </div>
    <div class="sidebar-track-subgroup">
      <a class="sidebar-track-card${appPath() === '/exams.html' ? ' active' : ''}" href="/exams.html" title="${escapeHtml(tr('nav_exams'))}">
        <div class="track-card-badge blue">🎯</div>
        <div class="track-card-body">
          <strong>${escapeHtml(tr('nav_exams'))}</strong>
          <span>${escapeHtml(tr('nav_exams_desc'))}</span>
        </div>
      </a>
      <a class="sidebar-track-card${appPath() === '/mock-exams.html' ? ' active' : ''}" href="/mock-exams.html" title="${escapeHtml(tr('nav_mock_exams'))}">
        <div class="track-card-badge purple">📋</div>
        <div class="track-card-body">
          <strong>${escapeHtml(tr('nav_mock_exams'))}</strong>
          <span>${escapeHtml(tr('nav_mock_exams_desc'))}</span>
        </div>
      </a>
      <a class="sidebar-track-card${appPath().startsWith('/control-work') ? ' active' : ''}" href="/control-works" title="${escapeHtml(tr('nav_control_works'))}">
        <div class="track-card-badge teal">📝</div>
        <div class="track-card-body">
          <strong>${escapeHtml(tr('nav_control_works'))}</strong>
          <span>${escapeHtml(tr('nav_control_works_desc'))}</span>
        </div>
      </a>
    </div>
  `;

  // Классы и уровни выбираются на главной — в меню их больше нет.

  // Инструменты и практика
  const favCount = getFavorites().length;
  const toolsSection = `
    <div class="sidebar-track-header">
      <span class="track-header-icon">🛠</span>
      <span class="track-header-title">${escapeHtml(tr('tools_heading'))}</span>
    </div>
    <div class="sidebar-track-subgroup">
      <button class="sidebar-action-card" id="open-formulas-btn" type="button" title="${escapeHtml(tr('tool_formulas'))}">
        <div class="action-card-icon formula-icon">📐</div>
        <div class="action-card-body">
          <strong>${escapeHtml(tr('tool_formulas'))}</strong>
          <span>${escapeHtml(tr('tool_formulas_desc'))}</span>
        </div>
      </button>

      <button class="sidebar-action-card" id="open-plotter-btn" type="button" title="${escapeHtml(tr('tool_plotter'))}">
        <div class="action-card-icon plotter-icon">📈</div>
        <div class="action-card-body">
          <strong>${escapeHtml(tr('tool_plotter'))}</strong>
          <span>${escapeHtml(tr('tool_plotter_desc'))}</span>
        </div>
      </button>

      <button class="sidebar-action-card" id="random-task-btn" type="button" title="${escapeHtml(tr('tool_random'))}">
        <div class="action-card-icon dice-icon">🎲</div>
        <div class="action-card-body">
          <strong>${escapeHtml(tr('tool_random'))}</strong>
          <span>${escapeHtml(tr('tool_random_desc'))}</span>
        </div>
      </button>

      <a class="sidebar-action-card${appPath() === '/progress' ? ' active' : ''}" href="/progress" title="${escapeHtml(tr('nav_progress'))}">
        <div class="action-card-icon progress-icon">📊</div>
        <div class="action-card-body">
          <strong>${escapeHtml(tr('nav_progress'))}</strong>
          <span id="progress-count-text">${escapeHtml(progressCounterText())}</span>
        </div>
      </a>

      <a class="sidebar-action-card${appPath() === '/favorites' ? ' active' : ''}" href="/favorites" title="${escapeHtml(tr('nav_favorites'))}">
        <div class="action-card-icon star-icon">★</div>
        <div class="action-card-body">
          <strong>${escapeHtml(tr('nav_favorites'))}</strong>
          <span id="fav-count-text">${favCount ? `${favCount} ${escapeHtml(tr('favorite_active'))}` : '0'}</span>
        </div>
      </a>

      <a class="sidebar-action-card${appPath() === '/tags' ? ' active' : ''}" href="/tags" title="${escapeHtml(tr('tags_label') || (getLang() === 'lv' ? 'Krustbirkas' : 'Кросс-теги'))}">
        <div class="action-card-icon tag-icon">🏷️</div>
        <div class="action-card-body">
          <strong>${escapeHtml(tr('tags_label') || (getLang() === 'lv' ? 'Krustbirkas' : 'Кросс-теги'))}</strong>
          <span>${getLang() === 'lv' ? '23 krostagi prasmēm' : '23 тега по навыкам'}</span>
        </div>
      </a>
    </div>
  `;

  sidebarNav.innerHTML = home + prepTrack + toolsSection;
  markActiveNav();
}

function renderSidebar() {
  renderSidebarGrade();
  if (currentActiveTopic) {
    renderTopicSidebar(currentActiveTopic);
  } else if (appPath() === '/tasks' && selectedGrade) {
    renderClassSidebar(selectedGrade);
  } else {
    renderHubSidebar();
  }
}

function markActiveNav(activeTopicSlug = null) {
  // Ссылки меню к этому моменту могут быть ещё без префикса языка — сравниваем пути без него.
  const current = appPath();
  const homeBtn = document.querySelector('#sidebar-home-btn');
  if (homeBtn) {
    homeBtn.classList.toggle('active', current === '/' && !selectedGrade && !activeTopicSlug);
  }
  sidebarNav.querySelectorAll('a').forEach(link => {
    const href = stripLangPath(link.getAttribute('href') || '');
    const isDirectMatch = href === current;
    const isTopicMatch = Boolean(activeTopicSlug && href === `/topic/${encodeURIComponent(activeTopicSlug)}`);
    link.classList.toggle('active', isDirectMatch || isTopicMatch);
  });
}

/* ── Справочник формул Skola2030 ──────────────────────────────────── */
const FORMULAS_DATA = {
  algebra: [
    { title: 'Квадратное уравнение', title_lv: 'Kvadrātvienādojums', math: 'ax^2 + bx + c = 0 \\implies D = b^2 - 4ac, \\; x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}' },
    { title: 'Теорема Виета', title_lv: 'Vjeta teorēma', math: 'x_1 + x_2 = -\\frac{b}{a}, \\quad x_1 \\cdot x_2 = \\frac{c}{a}' },
    { title: 'Формулы сокращенного умножения', title_lv: 'Saīsinātās reizināšanas formulas', math: '(a \\pm b)^2 = a^2 \\pm 2ab + b^2, \\quad a^2 - b^2 = (a-b)(a+b)' },
    { title: 'Разность и сумма кубов', title_lv: 'Kubu starpība un summa', math: 'a^3 \\pm b^3 = (a \\pm b)(a^2 \\mp ab + b^2)' },
    { title: 'Арифметическая прогрессия', title_lv: 'Aritmētiskā progresija', math: 'a_n = a_1 + (n-1)d, \\quad S_n = \\frac{a_1 + a_n}{2} \\cdot n' },
    { title: 'Геометрическая прогрессия', title_lv: 'Ģeometriskā progresija', math: 'b_n = b_1 \\cdot q^{n-1}, \\quad S_n = \\frac{b_1(q^n - 1)}{q - 1} \\; (q \\ne 1)' },
    { title: 'Свойства логарифмов', title_lv: 'Logaritmu īpašības', math: '\\log_a(xy) = \\log_a x + \\log_a y, \\quad \\log_a\\left(\\frac{x}{y}\\right) = \\log_a x - \\log_a y, \\quad \\log_a(x^k) = k\\log_a x' }
  ],
  geometry: [
    { title: 'Теорема Пифагора', title_lv: 'Pitagora teorēma', math: 'a^2 + b^2 = c^2 \\quad (\\text{для прямого угла})' },
    { title: 'Площадь треугольника', title_lv: 'Trijstūra laukums', math: 'S = \\frac{1}{2}ah = \\frac{1}{2}ab \\sin \\gamma = \\sqrt{p(p-a)(p-b)(p-c)}' },
    { title: 'Теорема косинусов', title_lv: 'Kosinusu teorēma', math: 'c^2 = a^2 + b^2 - 2ab \\cos \\gamma' },
    { title: 'Теорема синусов', title_lv: 'Sinusu teorēma', math: '\\frac{a}{\\sin \\alpha} = \\frac{b}{\\sin \\beta} = \\frac{c}{\\sin \\gamma} = 2R' },
    { title: 'Площадь параллелограмма и ромба', title_lv: 'Paralelograma un romba laukums', math: 'S = ah = ab \\sin \\alpha, \\quad S_{\\text{ромба}} = \\frac{1}{2}d_1 d_2' },
    { title: 'Площадь трапеции', title_lv: 'Trapeces laukums', math: 'S = \\frac{a + b}{2} \\cdot h' },
    { title: 'Окружность и круг', title_lv: 'Riņķa līnija un riņķis', math: 'C = 2\\pi r, \\quad S = \\pi r^2, \\quad l_{\\text{дуги}} = \\frac{\\pi r \\alpha}{180^\\circ}' }
  ],
  trig: [
    { title: 'Основное тригонометрическое тождество', title_lv: 'Trigonometriskā pamatidentitāte', math: '\\sin^2 \\alpha + \\cos^2 \\alpha = 1, \\quad \\tan \\alpha = \\frac{\\sin \\alpha}{\\cos \\alpha}' },
    { title: 'Связь тангенса и косинуса', title_lv: 'Tangensa un kosinusa sakarība', math: '1 + \\tan^2 \\alpha = \\frac{1}{\\cos^2 \\alpha}, \\quad 1 + \\cot^2 \\alpha = \\frac{1}{\\sin^2 \\alpha}' },
    { title: 'Формулы двойного угла', title_lv: 'Divkāršā leņķa formulas', math: '\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha, \\quad \\cos 2\\alpha = \\cos^2\\alpha - \\sin^2\\alpha' },
    { title: 'Формулы сложения', title_lv: 'Saskaitīšanas formulas', math: '\\sin(\\alpha \\pm \\beta) = \\sin\\alpha\\cos\\beta \\pm \\cos\\alpha\\sin\\beta' },
    { title: 'Значения (30°, 45°, 60°)', title_lv: 'Vērtības (30°, 45°, 60°)', math: '\\sin 30^\\circ = \\frac{1}{2}, \\; \\cos 30^\\circ = \\frac{\\sqrt{3}}{2}, \\; \\tan 45^\\circ = 1' }
  ],
  analysis: [
    { title: 'Таблица производных', title_lv: 'Atvasinājumu tabula', math: '(x^n)\' = n x^{n-1}, \\quad (\\sin x)\' = \\cos x, \\quad (\\cos x)\' = -\\sin x, \\quad (e^x)\' = e^x' },
    { title: 'Правила дифференцирования', title_lv: 'Diferencēšanas likumi', math: '(u \\pm v)\' = u\' \\pm v\', \\quad (uv)\' = u\'v + uv\', \\quad \\left(\\frac{u}{v}\\right)\' = \\frac{u\'v - uv\'}{v^2}' },
    { title: 'Геометрический смысл производной', title_lv: 'Atvasinājuma ģeometriskā jēga', math: 'k = f\'(x_0) = \\tan \\alpha, \\quad y = f(x_0) + f\'(x_0)(x - x_0)' },
    { title: 'Первообразные и интегралы', title_lv: 'Primitīvās funkcijas un integrāļi', math: '\\int x^n dx = \\frac{x^{n+1}}{n+1} + C, \\quad \\int_a^b f(x)dx = F(b) - F(a)' },
    { title: 'Схема Бернулли (вероятность)', title_lv: 'Bernulli shēma (varbūtība)', math: 'P_n(k) = C_n^k p^k (1-p)^{n-k}, \\quad C_n^k = \\frac{n!}{k!(n-k)!}' }
  ]
};

/* Дорисовать формулы в уже собранной разметке. renderMath(element, text)
   сначала кладёт в элемент текст, то есть затирает содержимое; здесь нужен
   прямой проход KaTeX по готовым карточкам. */
function typesetMath(root) {
  if (!root || typeof window.renderMathInElement !== 'function') return;
  try {
    window.renderMathInElement(root, {
      delimiters: window.MathTasksLib.KATEX_DELIMITERS,
      throwOnError: false,
      errorColor: '#dc3151'
    });
  } catch {}
}

function renderFormulasTab(category = 'algebra') {
  const container = document.querySelector('#formulas-content');
  if (!container) return;
  const items = FORMULAS_DATA[category] || [];
  const isLv = (window.MathTasksI18n?.getLang?.() === 'lv');
  container.innerHTML = items.map(item => `
    <div class="formula-card">
      <div class="formula-card-title">${escapeHtml(isLv && item.title_lv ? item.title_lv : item.title)}</div>
      <div class="formula-card-math">$${item.math}$</div>
    </div>
  `).join('');
  typesetMath(container);
}

function switchFormulasMainTab(tab) {
  const sheetsView = document.querySelector('#formula-sheets-view');
  const quickView = document.querySelector('#formulas-quick-view');
  document.querySelectorAll('.formulas-main-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mainTab === tab);
  });
  if (tab === 'sheets') {
    if (sheetsView) sheetsView.hidden = false;
    if (quickView) quickView.hidden = true;
  } else {
    if (sheetsView) sheetsView.hidden = true;
    if (quickView) quickView.hidden = false;
    renderFormulasTab('algebra');
    document.querySelectorAll('.formulas-tab').forEach(t => t.classList.toggle('active', t.dataset.cat === 'algebra'));
  }
}

function openFormulasDialog(defaultTab = 'sheets') {
  const dialog = document.querySelector('#formulas-dialog');
  if (!dialog) return;
  switchFormulasMainTab(defaultTab);
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

/* ── Выдвижная шпаргалка формул ────────────────────────────────────
   Панель справа, которую можно держать открытой прямо во время решения:
   на настоящем экзамене формульный лист тоже разрешён, и уходить за ним
   со страницы (то есть получать блокировку) ученик не должен. Панель не
   модальная — страница остаётся рабочей; формулы рисуются при первом
   открытии, а не на каждой загрузке. Во время блокировки её накрывает
   тот же экран, что и задания. */
const FORMULAS_DRAWER_KEY = 'math-tasks:formulas-drawer';
let formulasDrawerReady = false;

function formulasDrawerState() {
  try { return JSON.parse(localStorage.getItem(FORMULAS_DRAWER_KEY) || '{}'); } catch { return {}; }
}

function saveFormulasDrawerState(patch) {
  try { localStorage.setItem(FORMULAS_DRAWER_KEY, JSON.stringify({ ...formulasDrawerState(), ...patch })); } catch {}
}

function renderFormulasDrawerList() {
  const box = document.querySelector('#formulas-drawer-list');
  if (!box) return;
  const tr = window.MathTasks.t || (k => k);
  const isLv = window.MathTasksI18n?.getLang?.() === 'lv';
  const state = formulasDrawerState();
  const category = FORMULAS_DATA[state.cat] ? state.cat : 'algebra';
  const query = (document.querySelector('#formulas-drawer-search')?.value || '').trim().toLowerCase();

  // Поиск идёт по всем разделам сразу, без поиска — только выбранный.
  const found = [];
  for (const [key, items] of Object.entries(FORMULAS_DATA)) {
    if (!query && key !== category) continue;
    for (const item of items) {
      if (query && !`${item.title} ${item.title_lv || ''}`.toLowerCase().includes(query)) continue;
      found.push({ key, title: isLv && item.title_lv ? item.title_lv : item.title, math: item.math });
    }
  }

  box.innerHTML = found.length
    ? found.map(item => `<div class="formula-card">
        <div class="formula-card-title">${escapeHtml(item.title)}${query ? ` <span class="formula-card-cat">${escapeHtml(tr(`cat_${item.key}`))}</span>` : ''}</div>
        <div class="formula-card-math">$${item.math}$</div>
      </div>`).join('')
    : `<p class="empty-state">${escapeHtml(tr('formulas_drawer_empty'))}</p>`;
  typesetMath(box);

  document.querySelectorAll('.formulas-drawer-cat').forEach(btn => {
    btn.classList.toggle('active', !query && btn.dataset.cat === category);
  });
}

function toggleFormulasDrawer(open) {
  const drawer = document.querySelector('#formulas-drawer');
  const tab = document.querySelector('#formulas-drawer-tab');
  if (!drawer || !tab) return;
  const show = open === undefined ? !document.body.classList.contains('formulas-drawer-open') : Boolean(open);
  document.body.classList.toggle('formulas-drawer-open', show);
  tab.setAttribute('aria-expanded', String(show));
  saveFormulasDrawerState({ open: show });
  if (!show) return;
  formulasDrawerReady = true;
  renderFormulasDrawerList();
}

document.addEventListener('click', event => {
  if (event.target.closest('#formulas-drawer-tab')) { toggleFormulasDrawer(); return; }
  if (event.target.closest('#formulas-drawer-close')) { toggleFormulasDrawer(false); return; }
  const catBtn = event.target.closest('.formulas-drawer-cat');
  if (catBtn) {
    const search = document.querySelector('#formulas-drawer-search');
    if (search) search.value = '';
    saveFormulasDrawerState({ cat: catBtn.dataset.cat });
    renderFormulasDrawerList();
    return;
  }
  // Официальные буклеты VISC — в прежнем окне, там PDF.
  if (event.target.closest('#formulas-drawer-sheets')) openFormulasDialog('sheets');
});

document.addEventListener('input', event => {
  if (event.target.id === 'formulas-drawer-search') renderFormulasDrawerList();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.body.classList.contains('formulas-drawer-open')) toggleFormulasDrawer(false);
});

// Сменили язык — меняются и подписи формул.
window.addEventListener('languagechange', () => {
  if (formulasDrawerReady) renderFormulasDrawerList();
});

// Была открыта в прошлый раз — открываем снова.
if (formulasDrawerState().open) toggleFormulasDrawer(true);

/* ── Закладки (Избранное) ─────────────────────────────────────────── */
function getFavorites() {
  try {
    const raw = localStorage.getItem('math-tasks:favorites');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function isFavorite(taskId) {
  return getFavorites().includes(Number(taskId));
}

function toggleFavorite(taskId) {
  const id = Number(taskId);
  let favs = getFavorites();
  if (favs.includes(id)) {
    favs = favs.filter(item => item !== id);
  } else {
    favs.push(id);
  }
  try {
    localStorage.setItem('math-tasks:favorites', JSON.stringify(favs));
  } catch {}

  document.querySelectorAll(`[data-fav-id="${id}"]`).forEach(btn => {
    const tr = window.MathTasks.t || (k => k);
    const active = favs.includes(id);
    btn.classList.toggle('active', active);
    // Значок-закладка в карточке: текст не трогаем, меняем подпись и состояние.
    const label = btn.querySelector('.visually-hidden');
    if (label) {
      label.textContent = tr(active ? 'favorite_active' : 'favorite');
      btn.title = label.textContent;
      btn.setAttribute('aria-pressed', String(active));
    } else {
      btn.textContent = active ? tr('fav_added') : tr('fav_add');
      btn.title = active ? 'В закладках' : 'Добавить в закладки';
    }
  });

  const counter = document.querySelector('#fav-count-text');
  if (counter) {
    counter.textContent = favs.length ? (window.MathTasks.t || (k => k))('fav_counter', { count: favs.length }) : (window.MathTasks.t || (k => k))('fav_empty_short');
  }
}

/* ── Случайная задача ─────────────────────────────────────────────── */
async function openRandomTask() {
  /* Сначала число задач, потом одна строка по случайному смещению. Список
     целиком обрезался бы на тысяче, и часть задач не выпадала бы никогда. */
  const scoped = query => (selectedGrade ? query.eq('grade', selectedGrade) : query);
  const { count, error: countError } = await scoped(
    db.from('tasks').select('id', { count: 'exact', head: true }).eq('is_published', true));
  if (countError || !count) {
    alert(selectedGrade ? `В ${selectedGrade} классе задач пока нет.` : 'Задач пока нет.');
    return;
  }
  const offset = Math.floor(Math.random() * count);
  const { data } = await scoped(db.from('tasks').select('id, title, topic_id, grade').eq('is_published', true))
    .order('id').range(offset, offset);
  if (data && data[0]) navigate(taskPath(data[0]));
}

/* ── Подсветка ключевых слов в поиске ────────────────────────────── */
function highlightText(text, query) {
  if (!query || !text) return escapeHtml(text);
  const safeQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!safeQuery) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const regex = new RegExp(`(${safeQuery})`, 'gi');
  return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
}

/* ── Карточка задачи с раскрывающимся решением ────────────────────── */

function taskFigure(path, title, kind) {
  /* Раньше геометрическим задачам без чертежа подставлялся демонстрационный
     файл. Ученик видел рисунок, не имеющий отношения к условию, и это хуже,
     чем отсутствие рисунка: по нему можно решать и получить не тот ответ. */
  const url = imageUrl(path);
  if (!url) return '';
  // Без alt чертёж для незрячего читателя означает потерянное условие.
  const alt = (window.MathTasks.t || (k => k))('figure_alt').replace('{kind}', kind).replace('{title}', title);
  return `<img class="task-figure" src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" title="${escapeHtml((window.MathTasks.t || (k => k))('figure_zoom_title'))}" loading="lazy" />`;
}

/* Раскрываемая ступень: кнопка и панель идут парой, обработчик один на документ.
   Панель обязана иметь [hidden]{display:none} в стилях — авторское display
   в этом проекте уже дважды перебивало атрибут. */
function createRevealItem(kind, body, { hidden = false, icon = '' } = {}) {
  const tr = window.MathTasks.t || (k => k);
  const KEYS = {
    answer: ['reveal_answer', 'hide_answer'],
    hint: ['reveal_hint', 'hide_hint'],
    solution: ['reveal_solution', 'hide_solution']
  };
  const ICONS = {
    answer: '🔑',
    hint: '💡',
    solution: '📘'
  };
  const [showKey, hideKey] = KEYS[kind] || KEYS.solution;
  const showText = tr(`step_${kind}`);
  const hideText = tr(hideKey);
  // Подпись открытой панели — тем же словом, что на кнопке: «Подсказка», не «подсказку».
  const labelText = showText;
  const btnIcon = icon || ICONS[kind] || '';

  /* Закрытая подсказка видна сразу — с замком, неактивная: ученик знает,
     что она есть. Ответ и решение до открытия не показываем. */
  const locked = hidden && kind === 'hint';
  const button = `<button class="solution-toggle${kind === 'hint' ? ' solution-toggle-hint' : ''}${locked ? ' is-locked' : ''}" type="button" data-reveal="${kind}" data-kind="${kind}" aria-expanded="false"${hidden && !locked ? ' hidden' : ''}${locked ? ' disabled' : ''} data-icon="${btnIcon}" data-show-label="${escapeHtml(showText)}" data-hide-label="${escapeHtml(hideText)}"><span class="toggle-icon">${locked ? '🔒' : btnIcon}</span> <span class="toggle-text">${escapeHtml(showText)}</span></button>`;

  const panel = `<div class="reveal ${kind}" hidden><span class="reveal-label">${escapeHtml(labelText)}</span>${body}</div>`;

  return { button, panel };
}

function revealBlock(kind, label, body) {
  const item = createRevealItem(kind, body);
  return item.button + item.panel;
}

/* ── Интерактивная самопроверка для ученика (3.1) ─────────────────── */
const currentTasksMap = new Map();

function getSolvedTasks() {
  try {
    const raw = localStorage.getItem('math-tasks:solved');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function isTaskSolved(taskId) {
  return getSolvedTasks().includes(Number(taskId));
}

function setTaskSolved(taskId, solved) {
  try {
    const id = Number(taskId);
    let list = getSolvedTasks();
    if (solved) {
      if (!list.includes(id)) {
        list.push(id);
        recordActivity();
        const solvedTask = currentTasksMap.get(id);
        if (solvedTask?.topic_id) rememberPlace(solvedTask.topic_id, taskNumber(solvedTask));
      }
    } else {
      list = list.filter(item => item !== id);
    }
    localStorage.setItem('math-tasks:solved', JSON.stringify(list));
  } catch {}
  updateProgressCounter();
  if (currentView === 'home') refreshHomeSide();
}

/* Сколько задач решено в какой день: из этого — серия дней подряд и
   календарь на странице «Мой прогресс». Храним чуть больше года. */
const ACTIVITY_KEY = 'math-tasks:activity';

function getActivity() {
  try {
    const raw = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}

function recordActivity() {
  const lib = window.MathTasksLib;
  const key = lib?.localDateKey ? lib.localDateKey() : new Date().toISOString().slice(0, 10);
  const activity = getActivity();
  activity[key] = (Number(activity[key]) || 0) + 1;
  const keys = Object.keys(activity).sort();
  while (keys.length > 400) delete activity[keys.shift()];
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
  } catch {}
}

/* ── Журнал решений ───────────────────────────────────────────────
   Что решено, когда, с какого раза и сколько это заняло. Отсюда на
   странице «Мой прогресс» берутся точность с трендом, время, пометка
   «с подсказкой» в слабых местах и список последних решений. В
   'math-tasks:solved' лежат одни id — ни дат, ни исхода, ни времени,
   поэтому журнал ведём отдельно. Храним последние 300 записей. */
const JOURNAL_KEY = 'math-tasks:journal';
const JOURNAL_LIMIT = 300;
/* Больше получаса на задачу — это забытая вкладка, а не решение. */
const MAX_TASK_MS = 30 * 60 * 1000;

function getJournal() {
  try {
    const raw = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

/* Секундомер на задачу: пускается с первого касания поля ответа и живёт
   до проверки. Пока ученик читает условия и листает страницу, время не
   идёт — иначе в «среднее на задачу» попадёт всё чтение подряд. */
const taskStartedAt = new Map();
const taskHintOpened = new Set();

function markTaskStarted(taskId) {
  const id = Number(taskId);
  if (id && !taskStartedAt.has(id)) taskStartedAt.set(id, Date.now());
}

function markTaskHintOpened(taskId) {
  const id = Number(taskId);
  if (id) taskHintOpened.add(id);
}

function takeTaskSpentMs(taskId) {
  const id = Number(taskId);
  const startedAt = taskStartedAt.get(id);
  taskStartedAt.delete(id);
  if (!startedAt) return 0;
  const spent = Date.now() - startedAt;
  return spent > 0 && spent <= MAX_TASK_MS ? spent : 0;
}

/* correct — решил сам, hint — верно, но подсказку или разбор открывал,
   wrong — ответ не сошёлся. */
function recordSolveEntry(taskId, correct) {
  const id = Number(taskId);
  if (!id) return;
  const entry = {
    id,
    at: Date.now(),
    outcome: correct ? (taskHintOpened.has(id) ? 'hint' : 'correct') : 'wrong',
    ms: takeTaskSpentMs(id)
  };
  try {
    const list = getJournal();
    list.push(entry);
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(list.slice(-JOURNAL_LIMIT)));
  } catch {}
  if (correct) taskHintOpened.delete(id);
}

/* Секундомер стартует с первого касания поля ответа — и в обычной
   карточке, и в компактном режиме «Примеры». */
document.addEventListener('focusin', event => {
  const input = event.target.closest?.('.self-check-input, .compact-drill-input');
  if (!input) return;
  markTaskStarted(input.dataset.drillId || input.closest('.self-check-form')?.dataset.checkId);
});

/* Где ученик остановился: тема и номер задачи. Пишется при открытии темы
   и задачи и при решении; по нему — «Продолжить» на главной и в меню. */
const LAST_PLACE_KEY = 'math-tasks:last-place';

function getLastPlace() {
  try {
    const raw = JSON.parse(localStorage.getItem(LAST_PLACE_KEY) || 'null');
    return raw && typeof raw === 'object' && raw.topicId ? raw : null;
  } catch {
    return null;
  }
}

function rememberPlace(topicId, number = null) {
  if (!topicId) return;
  const prev = getLastPlace();
  const kept = prev && prev.topicId === topicId ? prev.number : null;
  try {
    localStorage.setItem(LAST_PLACE_KEY, JSON.stringify({ topicId, number: number ?? kept, at: Date.now() }));
  } catch {}
}

/* «Ваш класс» внизу меню: текущий класс и список для смены. Список —
   прозрачный select поверх карточки: открывается системным меню и
   работает с клавиатуры. У 9 класса и уровней старшей школы — «Экзамен»,
   у 3 и 6 — «Диагностика»: для них на сайте есть итоговые работы. */
function renderSidebarGrade() {
  const select = document.querySelector('#sidebar-grade-select');
  if (!select) return;
  const tr = window.MathTasks.t || (k => k);
  fillGradeSelect(select, tr('all_grades'));
  select.value = selectedGrade ? String(selectedGrade) : '';
  const isExam = selectedGrade === 9 || ['visparigais', 'matematika-1', 'matematika-2'].includes(selectedGrade);
  const isDiag = selectedGrade === 3 || selectedGrade === 6;
  const note = isExam ? tr('stage_exam_badge') : isDiag ? tr('track_diag_short') : '';
  /* Пометка — в верхней мелкой строке: «Augstākais līmenis · Экзамен»
     одной строкой в узкое меню не помещается. */
  const label = document.querySelector('#sidebar-grade-label');
  if (label) label.textContent = [tr('sidebar_grade_label'), note].filter(Boolean).join(' · ');
  const value = document.querySelector('#sidebar-grade-value');
  if (value) value.textContent = selectedGrade ? gradeLabel(selectedGrade) : tr('all_grades');
  // В свёрнутом меню — коротко: цифра класса или сокращение уровня.
  const SHORT_LEVELS = { visparigais: 'Visp.', 'matematika-1': 'Opt.', 'matematika-2': 'Aug.' };
  const short = document.querySelector('#sidebar-grade-short');
  if (short) short.textContent = selectedGrade ? (SHORT_LEVELS[selectedGrade] || String(selectedGrade)) : tr('all_grades_short');
}

document.querySelector('#sidebar-grade-select')?.addEventListener('change', async event => {
  const raw = event.target.value || null;
  const parsed = parseGradeValue(raw);
  const target = parsed ? `/grade/${parsed}` : '/';
  if (currentView !== 'home') {
    navigate(target);
    return;
  }
  // На главной — как клик по чипу класса: остаёмся на месте и перестраиваем её.
  if (location.pathname !== langPath(target)) {
    history.pushState(null, '', langPath(target));
    lastRoute = location.pathname + location.search;
  }
  applyGrade(raw);
  const label = gradeLabel(selectedGrade);
  setMeta(
    selectedGrade ? metaText('meta_grade_title', { grade: label }) : '',
    selectedGrade ? metaText('meta_grade_desc', { grade: label }) : metaText('meta_home_desc')
  );
  await loadHome();
});

function progressCounterText() {
  const tr = window.MathTasks.t || (k => k);
  const count = getSolvedTasks().length;
  return count ? tr('progress_counter', { count }) : tr('progress_counter_empty');
}

function updateProgressCounter() {
  const counter = document.querySelector('#progress-count-text');
  if (counter) counter.textContent = progressCounterText();
}

/* Сколько раз ученик ошибся в задаче. Первая ошибка открывает подсказку,
   вторая — ответ и решение. Раньше хранился только факт ошибки (список id):
   такой список читается как «по одной ошибке». */
const WRONG_ATTEMPTS_KEY = 'math-tasks:wrong-attempts';
// Подсказка открыта сразу — кнопкой, для того, кто не знает, с чего начать.
const ATTEMPTS_FOR_HINT = 0;
const ATTEMPTS_FOR_ANSWER = 2;

function getWrongAttemptCounts() {
  try {
    const raw = JSON.parse(localStorage.getItem(WRONG_ATTEMPTS_KEY) || '{}');
    if (Array.isArray(raw)) return Object.fromEntries(raw.map(id => [Number(id), 1]));
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function getTaskWrongAttempts(taskId) {
  return Number(getWrongAttemptCounts()[Number(taskId)]) || 0;
}

function addTaskWrongAttempt(taskId) {
  const counts = getWrongAttemptCounts();
  const id = Number(taskId);
  counts[id] = (Number(counts[id]) || 0) + 1;
  try {
    localStorage.setItem(WRONG_ATTEMPTS_KEY, JSON.stringify(counts));
  } catch {}
  return counts[id];
}

const normalizeMathAnswer = window.MathTasks?.normalizeMathAnswer || (val => String(val || '').trim());
const compareAnswers = window.MathTasks?.compareAnswers || ((u, c) => u === c);
const isAnswerAutoCheckable = window.MathTasks?.isAnswerAutoCheckable || (answer => Boolean(answer));
/* Варианты для проверки (answer_check, миграция 024): ответ со словами
   («120 книг») сверяется с ними («120»). До миграции поля нет — сверка по ответу. */
const taskAutoCheckable = (answer, variants) => (window.MathTasksLib?.isTaskAutoCheckable
  ? window.MathTasksLib.isTaskAutoCheckable(answer, variants)
  : isAnswerAutoCheckable(answer));
const checkTaskAnswer = (userAns, answer, variants) => (window.MathTasksLib?.checkTaskAnswer
  ? window.MathTasksLib.checkTaskAnswer(userAns, answer, variants)
  : compareAnswers(userAns, answer));

/* Что уже открыто в карточке задачи. Три случая:
   - ответ сверяется (сам или по вариантам) — поле ответа; подсказка после
     первой ошибки, ответ и решение — после второй;
   - ответ есть, но не сверить («Доказано», «Да, подобны» без вариантов) —
     самопроверка: подсказка сразу, ответ по кнопке «Сверить с ответом»,
     решение — после «Не сошлось» или «Сошлось»;
   - ответа нет вовсе — открыто всё.
   В решённой задаче открыто всё. */
function taskRevealState(task) {
  const answer = loc(task, 'answer_latex');
  const checkable = Boolean(answer) && taskAutoCheckable(answer, loc(task, 'answer_check'));
  const selfAssess = Boolean(answer) && !checkable;
  const attempts = getTaskWrongAttempts(task.id);
  const open = !answer || isTaskSolved(task.id);
  const needed = checkable ? ATTEMPTS_FOR_ANSWER : 1;
  return {
    checkable,
    selfAssess,
    attempts,
    hint: open || selfAssess || attempts >= ATTEMPTS_FOR_HINT,
    answer: open || attempts >= needed,
    solution: open || attempts >= needed
  };
}

// Бейдж «Решено» в шапке карточки — один раз.
function markCardSolved(card) {
  if (!card || card.querySelector('.task-solved-badge')) return;
  const meta = card.querySelector('.task-meta');
  if (!meta) return;
  const badge = document.createElement('span');
  badge.className = 'task-solved-badge';
  badge.textContent = (window.MathTasks.t || (k => k))('solved_badge');
  // Перед значками справа, а не за ними.
  meta.insertBefore(badge, meta.querySelector('.task-actions'));
}

/* Строка под полем ответа: что и когда откроется. Пустая — всё открыто. */
function revealLockText(task, attempts) {
  const tr = window.MathTasks.t || (k => k);
  if (attempts >= ATTEMPTS_FOR_ANSWER) return '';
  return tr(attempts >= ATTEMPTS_FOR_ANSWER - 1 ? 'reveal_lock_one_more' : 'reveal_lock_two');
}

function unlockTaskReveals(card, kinds) {
  for (const kind of kinds) {
    const button = card.querySelector(`.solution-toggle[data-kind="${kind}"]`);
    if (!button || !(button.hidden || button.disabled)) continue;
    button.hidden = false;
    if (button.disabled) {
      button.disabled = false;
      button.classList.remove('is-locked');
      button.querySelector('.toggle-icon').textContent = button.dataset.icon || '';
      button.querySelector('.toggle-text').textContent = button.dataset.showLabel;
    }
    button.classList.remove('hint-unlocked-pulse');
    void button.offsetWidth;
    button.classList.add('hint-unlocked-pulse');
  }
}

function updateRevealLock(card, text) {
  const note = card.querySelector('.self-check-lock');
  if (!note) return;
  note.textContent = text;
  note.hidden = !text;
}
const insertIntoInput = window.MathTasks?.insertIntoInput || ((input, text) => { if (input) input.value += text; });

function taskPath(task) {
  const slug = (window.MathTasks?.makeSlug && task.title) ? window.MathTasks.makeSlug(task.title) : String(task.id);
  return `/task/${task.id}-${slug}`;
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  ta.style.top = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {}
  ta.remove();
  return ok;
}

function showToast(msg, icon = '✓') {
  let toast = document.querySelector('#toast-notice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notice';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }
  toast.removeAttribute('hidden');
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${escapeHtml(msg)}</span>`;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}

function difficultyBadge(diff) {
  if (!diff) return '';
  const tr = window.MathTasks.t || (k => k);
  const d = String(diff).trim().toLowerCase();
  let cls = 'medium';
  let dot = '●';
  let label = diff;
  if (d.includes('лёгк') || d.includes('легк') || d.includes('баз') || d.includes('easy') || d.includes('pamat')) {
    cls = 'easy';
    label = tr('diff_easy');
  } else if (d.includes('сложн') || d.includes('hard') || d.includes('проф') || d.includes('augst') || d.includes('padziļ')) {
    cls = 'hard';
    label = tr('diff_hard');
  } else if (d.includes('олимп') || d.includes('olimp')) {
    cls = 'hard';
    label = tr('diff_olympiad');
  } else {
    label = tr('diff_medium');
  }
  return `<span class="task-diff ${cls}" title="${escapeHtml(label)}"><span class="diff-dot" aria-hidden="true">${dot}</span>${escapeHtml(label)}</span>`;
}

/* Номер задачи — её место внутри своей темы, как в школьном задачнике:
   «задача 7» означает одно и то же на странице темы, в поиске и в закладках.
   Если позиция почему-то не задана, показываем порядок в списке. */
function taskNumber(task, index) {
  const pos = Number(task.position);
  return Number.isFinite(pos) && pos > 0 ? pos : index + 1;
}

/* ── Сообщить об ошибке ───────────────────────────────────────────────
   Задачи во многом составлены нейросетью, и ошибки в них раньше всех
   находят ученики. Сообщение ложится в task_reports (миграция 023), читает
   его только администратор. Окно создаётся один раз — по первому нажатию,
   поэтому разметку страниц трогать не нужно. */
const REPORT_KINDS = ['condition', 'answer', 'solution', 'figure', 'translation', 'other'];
let reportDialog = null;

function openReportDialog(taskId) {
  const tr = window.MathTasks.t || (k => k);
  if (!reportDialog) {
    reportDialog = document.createElement('dialog');
    reportDialog.className = 'report-dialog';
    document.body.appendChild(reportDialog);
    reportDialog.addEventListener('submit', submitReport);
    // Клик по затемнению вокруг окна и «Отмена» закрывают его.
    reportDialog.addEventListener('click', event => {
      if (event.target === reportDialog || event.target.closest('[data-report-close]')) reportDialog.close();
    });
  }
  reportDialog.dataset.taskId = String(taskId);
  reportDialog.innerHTML = `<form class="report-form" method="dialog">
    <h3>${escapeHtml(tr('report_title'))}</h3>
    <p class="report-lead">${escapeHtml(tr('report_lead'))}</p>
    <fieldset class="report-kinds">
      <legend>${escapeHtml(tr('report_kind_label'))}</legend>
      ${REPORT_KINDS.map((kind, i) => `<label><input type="radio" name="kind" value="${kind}"${i === 0 ? ' checked' : ''} /> ${escapeHtml(tr('report_kind_' + kind))}</label>`).join('')}
    </fieldset>
    <label class="report-message">${escapeHtml(tr('report_message_label'))}
      <textarea name="message" rows="4" maxlength="1000" placeholder="${escapeHtml(tr('report_message_placeholder'))}"></textarea>
    </label>
    <p class="report-status" hidden></p>
    <div class="report-actions">
      <button type="submit" class="primary-button">${escapeHtml(tr('report_send'))}</button>
      <button type="button" class="text-button" data-report-close>${escapeHtml(tr('report_cancel'))}</button>
    </div>
  </form>`;
  reportDialog.showModal();
}

async function submitReport(event) {
  event.preventDefault();
  const tr = window.MathTasks.t || (k => k);
  const form = event.target;
  const status = form.querySelector('.report-status');
  const button = form.querySelector('[type="submit"]');
  const data = new FormData(form);
  const kind = String(data.get('kind') || 'other');
  const message = String(data.get('message') || '').trim();
  // «Другое» без слов ничего не сообщает — просим хотя бы пару слов.
  if (kind === 'other' && !message) {
    status.hidden = false;
    status.textContent = tr('report_need_text');
    return;
  }
  button.disabled = true;
  /* Без .select(): посетитель читать task_reports не может, и запрос
     с возвратом строки упал бы на правах, хотя запись прошла. */
  const { error } = await db.from('task_reports').insert({
    task_id: Number(reportDialog.dataset.taskId),
    kind,
    message,
    lang: getLang() === 'lv' ? 'lv' : 'ru'
  });
  if (error) {
    console.warn('Сообщение об ошибке не отправлено:', error.message);
    status.hidden = false;
    status.textContent = tr('report_failed');
    button.disabled = false;
    return;
  }
  reportDialog.close();
  showToast(tr('report_thanks'));
}

/* Клавиатура формул строится при первом фокусе на поле ответа, а не в
   каждой карточке заранее: на странице темы это было 341 кнопка, почти все
   — у задач, которые ученик в этот раз и не открывал. */
const QUICK_MATH_KEYS = [['√(', '√x', '√x'], ['²', 'x²', 'x²'], ['^', 'xⁿ', 'xⁿ'], ['/', '/', '/'], ['π', 'π', 'π'], ['±', '±', '±'],
  ['|', '|x|', '|x|'], ['(', '( )', '( )'], ['x', 'x', 'x'], ['·', '·', '·'], ['≤', '≤', '≤'], ['≥', '≥', '≥'], ['∞', '∞', '∞']];

function ensureQuickMathBar(bar) {
  if (!bar || bar.childElementCount) return;
  const tr = window.MathTasks.t || (k => k);
  bar.innerHTML = `<span class="quick-math-bar-label" title="Quick Math">${escapeHtml(tr('quick_math_label'))}</span>`
    + QUICK_MATH_KEYS.map(([insert, title, label]) => `<button type="button" class="quick-math-btn" data-insert="${escapeHtml(insert)}" title="${escapeHtml(title)}">${escapeHtml(label)}</button>`).join('');
}

document.addEventListener('focusin', event => {
  const input = event.target.closest?.('.self-check-input');
  if (!input || input.disabled) return;
  const bar = input.closest('.task-self-check')?.querySelector('.quick-math-bar');
  if (!bar) return;
  ensureQuickMathBar(bar);
  bar.hidden = false;
});

/* inlineFigure: false — чертёж в карточку не вставляется и не грузится;
   так в задаче дня, где он открывается только по кнопке. */
function taskCard(task, { showTopicLink, showGrade, linkTitle, highlightQuery, number, inlineFigure = true } = {}) {
  const tr = window.MathTasks.t || (k => k);
  currentTasksMap.set(task.id, task);
  const subject = subjectOf(task);
  const grade = showGrade ? (task.grade ?? task.topics?.grade) : null;
  const topicLink = showTopicLink && task.topics?.slug
    ? `<a class="task-topic" href="/topic/${encodeURIComponent(task.topics.slug)}">${escapeHtml(topicTitleOf(task.topics))}</a>`
    : '';
  const isFav = isFavorite(task.id);
  /* Действия — значками, как в образце: ссылка, закладка, ошибка в задаче.
     Подпись — в title и в скрытом тексте для экранного диктора. */
  const iconBtn = (attrs, label, paths, extra = '') => `<button class="task-action-btn task-icon-btn${extra}" type="button" ${attrs} title="${escapeHtml(label)}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg><span class="visually-hidden">${escapeHtml(label)}</span></button>`;
  const shareBtn = iconBtn(`data-copy-link="${task.id}"`, tr('copy_link'),
    '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>');
  const favBtn = iconBtn(`data-fav-id="${task.id}" aria-pressed="${isFav}"`, tr(isFav ? 'favorite_active' : 'favorite'),
    '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>', isFav ? ' active' : '');
  const reportBtn = iconBtn(`data-report-task="${task.id}"`, tr('report_title'),
    '<circle cx="12" cy="12" r="9.5"/><path d="M12 16.5v-5"/><path d="M12 8h.01"/>', ' report-btn');
  const solved = isTaskSolved(task.id);
  const solvedBadge = solved ? `<span class="task-solved-badge">${escapeHtml(tr('solved_badge'))}</span>` : '';

  /* Шапка карточки по образцу: номер, подтема с кодом, сложность, справа
     значки. Раздел и ссылку на тему показываем только вне темы; класс —
     если он не совпадает с классом открытой темы. */
  const numBadge = number
    ? (linkTitle ? `<a class="task-number" href="${taskPath(task)}">${number}</a>` : `<span class="task-number">${number}</span>`)
    : '';
  const sub = task.subtopic_id ? allSubtopics.find(item => item.id === task.subtopic_id) : null;
  const subCode = sub ? subtopicCode(sub, allTopics.find(item => item.id === sub.topic_id)) : '';
  const where = sub && !topicLink
    ? `<span class="task-where">${subCode ? `<b>${escapeHtml(subCode)}</b> ` : ''}${escapeHtml(loc(sub, 'title'))}</span>`
    : '';
  const gradeShown = grade && !(currentActiveTopic && String(currentActiveTopic.grade) === String(grade));
  const meta = [
    numBadge,
    showTopicLink ? `<span class="tag ${tagClass(subject)}">${escapeHtml(loc(subject, 'title') || tr('subject_fallback'))}</span>` : '',
    gradeShown ? `<span class="grade-badge">${gradeLabel(grade)}</span>` : '',
    where,
    topicLink,
    difficultyBadge(task.difficulty),
    solvedBadge,
    `<div class="task-actions">${shareBtn}${favBtn}${reportBtn}</div>`
  ].filter(Boolean).join('');
  const unit = answerUnit(task);

  const reveal = taskRevealState(task);
  const selfCheck = reveal.checkable ? `
    <div class="task-self-check" data-self-check="${task.id}">
      <div class="quick-math-bar" hidden aria-label="Quick Math Bar"></div>
      <form class="self-check-form" data-check-id="${task.id}">
        <input type="text" class="self-check-input" placeholder="${escapeHtml(tr('self_check_placeholder'))}" aria-label="${escapeHtml(tr('self_check_placeholder'))}" autocomplete="off" ${solved ? `disabled value="${escapeHtml(tr('solved_badge'))}"` : ''} />
        ${unit ? `<span class="answer-unit">${escapeHtml(unit)}</span>` : ''}
        <button type="submit" class="self-check-btn" ${solved ? 'hidden' : ''}>${escapeHtml(tr('self_check_btn'))}</button>
      </form>
      <div class="self-check-result${solved ? ' success' : ''}" ${solved ? '' : 'hidden'}>
        ${solved ? `${escapeHtml(tr('self_check_success'))} <button type="button" class="self-check-reset" data-reset-id="${task.id}">${escapeHtml(tr('self_check_reset'))}</button>` : ''}
      </div>
      <p class="self-check-lock" ${reveal.answer ? 'hidden' : ''}>${reveal.answer ? '' : escapeHtml(revealLockText(task, reveal.attempts))}</p>
    </div>` : '';

  /* Самопроверка: ответ не сверить автоматически, поэтому ученик решает сам,
     открывает ответ и честно отмечает, сошлось ли. «Сошлось» засчитывает
     задачу в «Мой прогресс», «Не сошлось» открывает решение. */
  const selfAssess = reveal.selfAssess ? `
    <div class="task-self-assess" data-self-assess="${task.id}">
      <p class="self-assess-lead">${escapeHtml(tr('self_assess_lead'))}</p>
      <div class="self-assess-actions">
        <button type="button" class="self-check-btn" data-self-assess-reveal ${solved ? 'hidden' : ''}>${escapeHtml(tr('self_assess_reveal'))}</button>
        <span class="self-assess-verdict" hidden>
          <span>${escapeHtml(tr('self_assess_question'))}</span>
          <button type="button" class="self-assess-yes" data-self-assess-yes>${escapeHtml(tr('self_assess_yes'))}</button>
          <button type="button" class="self-assess-no" data-self-assess-no>${escapeHtml(tr('self_assess_no'))}</button>
        </span>
      </div>
      <div class="self-check-result${solved ? ' success' : ''}" ${solved ? '' : 'hidden'}>${solved ? `${escapeHtml(tr('self_assess_done'))} <button type="button" class="self-assess-reset" data-self-assess-reset>${escapeHtml(tr('self_check_reset'))}</button>` : ''}</div>
    </div>` : '';

  const hasAnswer = Boolean(loc(task, 'answer_latex'));
  const taskHint = loc(task, 'hint_latex');
  const taskSolution = loc(task, 'solution_latex');
  const taskTitle = loc(task, 'title');

  /* Ступени открываются попытками: первая ошибка — подсказка, вторая —
     ответ и решение. Без поля ответа и в решённой задаче открыто всё. */
  const toggleButtons = [];
  const revealPanels = [];

  if (taskHint) {
    const hintItem = createRevealItem('hint', '<div class="math" data-hint></div>', {
      hidden: !reveal.hint,
      icon: '💡'
    });
    toggleButtons.push(hintItem.button);
    revealPanels.push(hintItem.panel);
  }

  if (hasAnswer) {
    const ansItem = createRevealItem('answer', '<div class="math" data-answer></div>', {
      hidden: !reveal.answer,
      icon: '🔑'
    });
    toggleButtons.push(ansItem.button);
    revealPanels.push(ansItem.panel);
  }

  if (taskSolution || task.solution_image) {
    const solutionBody = `<div class="math" data-solution></div>${taskFigure(task.solution_image, taskTitle, 'Attēls pie atrisinājuma')}`;
    const solItem = createRevealItem('solution', solutionBody, {
      hidden: !reveal.solution,
      icon: '📘'
    });
    toggleButtons.push(solItem.button);
    revealPanels.push(solItem.panel);
  } else {
    revealPanels.push(`<p class="solution-missing">${escapeHtml(tr('solution_missing'))}</p>`);
  }

  const actionsBar = toggleButtons.length > 0 ? `<div class="task-actions-bar">${toggleButtons.join('')}</div>` : '';
  const revealsWrap = revealPanels.length > 0 ? `<div class="task-reveals-wrap">${revealPanels.join('')}</div>` : '';

  // Кросс-теги задачи
  const rawTaskTags = Array.isArray(task.task_tags)
    ? task.task_tags.map(tt => tt.tags).filter(Boolean)
    : (Array.isArray(task.tags) ? task.tags : []);

  const tagsRowHtml = rawTaskTags.length > 0 ? `
    <div class="task-tags-row" aria-label="${escapeHtml((window.MathTasks.t || (k => k))('tags_label'))}">
      ${rawTaskTags.map(tg => {
        const tgTitle = loc(tg, 'title') || tg.title || tg.slug;
        const tgDesc = loc(tg, 'description') || '';
        return `<a class="task-tag-chip" href="/tag/${encodeURIComponent(tg.slug)}"${tgDesc ? ` title="${escapeHtml(tgDesc)}"` : ''}>#${escapeHtml(tgTitle)}</a>`;
      }).join('')}
    </div>` : '';

  return `<article class="task" id="task-${task.id}" data-task="${task.id}" data-task-id="${task.id}">
    <div class="task-meta">${meta}</div>
    <div class="task-condition-wrap">
      <div class="math task-condition" data-condition></div>
    </div>
    ${inlineFigure ? taskFigure(task.condition_image, taskTitle, 'Zīmējums') : ''}
    ${tagsRowHtml}
    ${selfCheck}
    ${selfAssess}
    ${actionsBar}
    ${revealsWrap}
  </article>`;
}

/* Подсказку, ответ и решение рисуем не сразу, а когда панель открывают.
   Замер на боевом: формулы в закрытых панелях — 60 % узлов страницы
   (тема — 4 852 из 8 215, главная — 3 261 из 5 453), хотя ученик видит их
   только после попыток. Пока панель закрыта, её латех ждёт в pendingMath;
   открыли — дорисовываем. Следим за атрибутом hidden, а не за кнопкой:
   панель открывают и кнопка, и самопроверка, и «Не сошлось». */
const pendingMath = new WeakMap();

function deferMath(element, latex) {
  const panel = element.closest('.reveal');
  if (!panel || !panel.hidden) renderMath(element, latex);
  else pendingMath.set(element, latex);
}

function renderPendingMath(root) {
  root.querySelectorAll('[data-answer], [data-hint], [data-solution]').forEach(element => {
    if (!pendingMath.has(element)) return;
    renderMath(element, pendingMath.get(element));
    pendingMath.delete(element);
  });
}

new MutationObserver(records => {
  for (const { target } of records) {
    if (target.classList?.contains('reveal') && !target.hidden) renderPendingMath(target);
  }
}).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden'] });

// Печать с решениями открывает панели стилями, без атрибута — дорисовываем всё.
window.addEventListener('beforeprint', () => renderPendingMath(document));

/* Формулы рендерим по спискам тех задач, у которых соответствующее поле есть:
   у панелей нет собственной привязки к задаче, а порядок узлов совпадает. */
function fillTaskMath(container, tasks) {
  container.querySelectorAll('[data-condition]').forEach((element, index) => {
    renderMath(element, loc(tasks[index], 'condition_latex'));
  });
  const answerSource = tasks.filter(task => loc(task, 'answer_latex'));
  container.querySelectorAll('[data-answer]').forEach((element, index) => {
    deferMath(element, loc(answerSource[index], 'answer_latex'));
  });
  const hintSource = tasks.filter(task => loc(task, 'hint_latex'));
  container.querySelectorAll('[data-hint]').forEach((element, index) => {
    deferMath(element, loc(hintSource[index], 'hint_latex'));
  });
  const solutionSource = tasks.filter(task => loc(task, 'solution_latex'));
  container.querySelectorAll('[data-solution]').forEach((element, index) => {
    deferMath(element, loc(solutionSource[index], 'solution_latex'));
  });
}

let taskViewMode = 'list'; // 'list' | 'single' | 'compact'
try {
  const saved = localStorage.getItem('math-tasks:view-mode');
  if (saved === 'single' || saved === 'list' || saved === 'compact') taskViewMode = saved;
} catch {}

let singleTaskIndex = 0;
let lastRenderedContainer = null;
let lastRenderedTasks = [];

/* Сколько задач показывать сразу.
 *
 * Замер на теме из 51 задачи: 19 725 узлов DOM, 875 КБ разметки, 431
 * формула — то есть по 387 узлов на задачу. При полутора сотнях задач в
 * теме это под шестьдесят тысяч узлов и почти три мегабайта разметки;
 * телефон на такой странице начинает заикаться при прокрутке.
 *
 * Показываем частями. Прогрессивно, а не страницами: ученик листает тему
 * сверху вниз, и разбиение на «страницу 3 из 6» ломало бы и это чтение,
 * и переход по номеру задачи. */
const TASKS_CHUNK = 25;

/* Показываем окно из TASKS_CHUNK задач, а не наращиваем список.
 *
 * Накопительный вариант («показать ещё») выглядел естественнее, но у него
 * два изъяна, и оба всплыли на проверке. Кнопка «показать все» заново
 * собирала ту самую страницу на шестьдесят тысяч узлов, от которой мы и
 * уходим. А переход к задаче из полосы номеров промахивался: страница
 * высотой в девяносто тысяч пикселей продолжает расти, пока KaTeX
 * досчитывает полтысячи формул, и прокрутка гонится за убегающей целью.
 *
 * С окном страница всегда одного размера, и оба изъяна исчезают. */
let pageStart = 0;

/* Набор задач сменился — показываем снова с начала. Сравниваем по первому
   и последнему номеру: пересоздание того же списка (смена языка, отметка
   решённой) не должно сбрасывать то, что человек уже раскрыл. */
let visibleKey = '';
function resetVisibleFor(tasks) {
  const key = `${tasks.length}:${tasks[0]?.id ?? ''}:${tasks[tasks.length - 1]?.id ?? ''}`;
  if (key !== visibleKey) { visibleKey = key; pageStart = 0; }
  if (pageStart >= tasks.length) pageStart = 0;
}

/* Перевести окно на страницу с этой задачей. Возвращает true, если
   пришлось перерисовывать. */
function ensureVisible(index) {
  const start = Math.floor(index / TASKS_CHUNK) * TASKS_CHUNK;
  if (start === pageStart) return false;
  pageStart = start;
  return true;
}
let lastRenderedEmptyText = '';
let lastRenderedOptions = {};

/* Метку класса показываем только там, где она что-то добавляет: внутри
   выбранного класса она одинакова у всех карточек и превращается в шум. */
/* Кнопка снизу: сколько показано, сколько всего, и два способа добрать. */
/* Перерисовать текущий список, не меняя ни подборку, ни режим. */
function rerenderCurrentList() {
  if (!lastRenderedContainer) return;
  renderTaskList(lastRenderedContainer, lastRenderedTasks, lastRenderedEmptyText, lastRenderedOptions);
}

function moreButton(total) {
  if (taskViewMode === 'single' || total <= TASKS_CHUNK) return '';
  const tr = window.MathTasks.t || (k => k);
  const pages = Math.ceil(total / TASKS_CHUNK);
  const current = Math.floor(pageStart / TASKS_CHUNK);
  const from = pageStart + 1;
  const upto = Math.min(pageStart + TASKS_CHUNK, total);

  /* Номера страниц показываем не все: при сорока страницах полоса из
     сорока кнопок бесполезна. Края, соседи текущей и многоточия. */
  const wanted = new Set([0, pages - 1, current - 1, current, current + 1]);
  const nums = [...wanted].filter(n => n >= 0 && n < pages).sort((a, b) => a - b);
  let numsHtml = '';
  let prev = -1;
  for (const n of nums) {
    if (prev >= 0 && n - prev > 1) numsHtml += '<span class="tasks-page-gap">…</span>';
    numsHtml += `<button type="button" class="tasks-page-num${n === current ? ' active' : ''}" data-task-page="${n}">${n + 1}</button>`;
    prev = n;
  }

  return `
    <nav class="tasks-more" aria-label="${escapeHtml(tr('tasks_pages'))}">
      <button type="button" class="text-button" data-task-page="${current - 1}" ${current === 0 ? 'disabled' : ''}>${escapeHtml(tr('prev_page'))}</button>
      <span class="tasks-page-nums">${numsHtml}</span>
      <button type="button" class="text-button" data-task-page="${current + 1}" ${current === pages - 1 ? 'disabled' : ''}>${escapeHtml(tr('next_page'))}</button>
      <span class="tasks-more-count">${tr('tasks_range', { from, upto, total })}</span>
    </nav>`;
}

/* ── Вид «по одной» ─────────────────────────────────────────────────
   По образцу: «Задача 3 из 54» с полосой и подтемой; карточка — крупное
   условие, ответ с единицей, подсказка и решение слева, «Назад / Дальше»
   справа; ниже — карта темы: решено, с ошибкой, не решали, текущая.
   Кнопки те же по атрибутам (data-pager-dir, data-pager-idx) — клики и
   стрелки клавиатуры обрабатываются как раньше. */
function singleTaskView(tasks, index, cardOptions) {
  const tr = window.MathTasks.t || (k => k);
  const task = tasks[index];
  const total = tasks.length;
  const topic = allTopics.find(item => item.id === task.topic_id);
  const sub = task.subtopic_id ? allSubtopics.find(item => item.id === task.subtopic_id) : null;
  const nav = `<div class="sv-nav">
      <button type="button" class="sv-nav-btn" data-pager-dir="prev" ${index === 0 ? 'disabled' : ''}>← ${escapeHtml(tr('single_prev'))}</button>
      <button type="button" class="sv-nav-btn is-next" data-pager-dir="next" ${index === total - 1 ? 'disabled' : ''}>${escapeHtml(tr('single_next'))} →</button>
    </div>`;
  const cells = tasks.map((item, i) => {
    const state = i === index ? ' is-current' : isTaskSolved(item.id) ? ' is-solved' : getTaskWrongAttempts(item.id) > 0 ? ' is-wrong' : '';
    const num = taskNumber(item, i);
    return `<button type="button" class="sv-cell${state}" data-pager-idx="${i}" aria-label="${escapeHtml(tr('single_goto', { n: num }))}"${i === index ? ' aria-current="step"' : ''}>${num}</button>`;
  }).join('');
  return `<div class="single-view">
    <div class="sv-top">
      <span class="sv-count">${escapeHtml(tr('single_counter', { cur: taskNumber(task, index), total }))}</span>
      <span class="sv-track" aria-hidden="true"><i style="width:${Math.round(((index + 1) / total) * 100)}%"></i></span>
      ${sub && topic ? `<span class="sv-sub">${escapeHtml(subtopicTitle(sub, topic))}</span>` : ''}
    </div>
    <div class="sv-card">${taskCard(task, cardOptions)}${nav}</div>
    <div class="sv-map">
      <span class="sv-map-label">${escapeHtml(tr('single_map_title'))} · ${escapeHtml(countLabel('topic_tasks', total))}</span>
      <div class="sv-map-grid">${cells}</div>
      <div class="sv-legend"><span class="is-solved">${escapeHtml(tr('single_legend_solved'))}</span><span class="is-wrong">${escapeHtml(tr('single_legend_wrong'))}</span><span>${escapeHtml(tr('single_legend_new'))}</span></div>
    </div>
  </div>`;
}

/* Единица ответа («см», «м²», «кг») — подпись у поля, как в образце. Берём
   из хвоста ответа (\text{ см}); значение ответа этим не раскрывается. */
function answerUnit(task) {
  const match = String(loc(task, 'answer_latex') || '').match(/\\(?:text|mathrm)\{\s*([^{}]{1,8}?)\s*\}(\^\{?[23]\}?)?\s*\$*\s*$/);
  if (!match || !/\p{L}/u.test(match[1])) return '';
  const power = match[2] ? (match[2].includes('2') ? '²' : '³') : '';
  return match[1] + power;
}

/* «Назад / Дальше» — в одну строку с «Подсказкой» и «Решением»: кнопки
   ступеней живут внутри карточки, поэтому строку переносим к ним. */
function finishSingleView(container) {
  const nav = container.querySelector('.sv-nav');
  const bar = container.querySelector('.sv-card .task-actions-bar');
  if (nav && bar) bar.appendChild(nav);
}

function renderTaskList(container, tasks, emptyText, options = {}) {
  listCursor = -1;
  /* Полосу номеров перерисовывает не эта функция, поэтому при смене режима
     она оставалась на экране. В режиме «по одной» у пагинатора своя такая
     же полоса, и две подряд сбивали с толку. */
  if (listAnchors && listAnchors.innerHTML) {
    listAnchors.hidden = taskViewMode !== 'list';
  }
  const { showTopicLink = true, showGrade = !selectedGrade, linkTitle = true, highlightQuery = '' } = options;
  lastRenderedContainer = container;
  lastRenderedTasks = tasks || [];
  lastRenderedEmptyText = emptyText;
  lastRenderedOptions = { showTopicLink, showGrade, linkTitle, highlightQuery };

  if (!tasks || !tasks.length) {
    container.innerHTML = `<p class="empty-state">${escapeHtml(emptyText)}</p>`;
    return;
  }
  tasks.forEach(task => currentTasksMap.set(task.id, task));
  resetVisibleFor(tasks);

  /* В режиме «по одной» на экране и так одна задача — резать нечего. */
  const paged = taskViewMode !== 'single' && tasks.length > TASKS_CHUNK;
  const shown = paged ? tasks.slice(pageStart, pageStart + TASKS_CHUNK) : tasks;

  if (taskViewMode === 'single' && tasks.length > 1) {
    if (singleTaskIndex < 0) singleTaskIndex = 0;
    if (singleTaskIndex >= tasks.length) singleTaskIndex = 0;
    const task = tasks[singleTaskIndex];
    container.innerHTML = singleTaskView(tasks, singleTaskIndex, { showTopicLink, showGrade, linkTitle, highlightQuery });
    fillTaskMath(container, [task]);
    finishSingleView(container);
  } else if (taskViewMode === 'compact') {
    const tr = window.MathTasks.t || (k => k);
    const cleanFn = (window.MathTasksLib && window.MathTasksLib.cleanMathExample) || (s => s);
    const solvedTotal = tasks.filter(t => isTaskSolved(t.id)).length;

    const itemsHtml = shown.map((task, i) => {
      const index = pageStart + i;
      const solved = isTaskSolved(task.id);
      const taskTitle = loc(task, 'title');
      const answerText = loc(task, 'answer_latex');
      // Ответ, который не сверить автоматически, в экспресс-режиме не вводится.
      const hasAnswer = Boolean(answerText) && taskAutoCheckable(answerText, loc(task, 'answer_check'));
      const cleanAnswer = answerText ? answerText.replace(/^\$+|\$+$/g, '') : '';
      /* Кнопка чертежа появляется только у задач, к которым чертёж
         действительно загружен: подставного показывать нельзя. */
      const figureUrl = task.condition_image ? imageUrl(task.condition_image) : '';

      return `
        <div class="compact-drill-item${solved ? ' is-solved' : ''}" data-task-id="${task.id}" id="drill-task-${task.id}">
          <span class="compact-drill-num" title="${escapeHtml(taskTitle)}">${taskNumber(task, index)}.</span>
          <div class="compact-drill-body">
            <div class="compact-drill-expr math" data-drill-condition="${task.id}"></div>
            <div class="compact-drill-answer-wrap">
              ${hasAnswer ? `
                <input type="text" 
                       class="compact-drill-input${solved ? ' success' : ''}" 
                       data-drill-id="${task.id}" 
                       data-drill-index="${index}"
                       placeholder="${escapeHtml(tr('drill_placeholder'))}" 
                       aria-label="Ответ к примеру ${index + 1}"
                       autocomplete="off" 
                       ${solved ? `disabled value="${escapeHtml(cleanAnswer) || '✓'}"` : ''} />
                <span class="compact-drill-status${solved ? ' success' : ''}">${solved ? '✓' : ''}</span>
              ` : `
                <span class="compact-drill-no-ans">—</span>
              `}
            </div>
            <p class="compact-drill-note" hidden></p>
          </div>
          <div class="compact-drill-actions">
            ${figureUrl ? `<button type="button" class="compact-drill-figure-btn" data-drill-figure="${escapeHtml(figureUrl)}" data-figure-alt="${escapeHtml(taskTitle)}" title="${escapeHtml(tr('drill_figure_btn'))}" aria-label="${escapeHtml(tr('drill_figure_btn'))}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="9" cy="9" r="1.4"/></svg></button>` : ''}
            <button type="button" class="compact-drill-hint-btn" data-drill-hint="${task.id}" title="${escapeHtml(tr('drill_hint_btn'))}" aria-label="${escapeHtml(tr('drill_hint_btn'))}">💡</button>
            <a href="${taskPath(task)}" class="compact-drill-link-btn" title="${escapeHtml(taskTitle)}" target="_blank" aria-label="${escapeHtml((window.MathTasks.t || (k => k))('open_task'))}">↗</a>
          </div>
        </div>
      `;
    }).join('');

    const bannerHtml = `
      <div class="compact-drill-banner">
        <span>⚡ ${escapeHtml(tr('view_mode_compact'))}: ${escapeHtml(tr('drill_next_hint'))}</span>
        <div class="compact-drill-stats" id="compact-drill-stats">
          ${solvedTotal} / ${tasks.length}
        </div>
      </div>
    `;

    container.innerHTML = `<div class="task-compact-container">${bannerHtml}<div class="task-compact-grid">${itemsHtml}</div>${moreButton(tasks.length)}</div>`;

    // Рендерим формулы в примерах через KaTeX
    container.querySelectorAll('[data-drill-condition]').forEach(el => {
      const taskId = Number(el.dataset.drillCondition);
      const task = currentTasksMap.get(taskId);
      if (task) {
        const cleanedExpr = cleanFn(loc(task, 'condition_latex'));
        renderMath(el, cleanedExpr);
      }
    });
  } else {
    container.innerHTML = shown.map((task, i) => taskCard(task, { showTopicLink, showGrade, linkTitle, highlightQuery, number: taskNumber(task, pageStart + i) })).join('')
      + moreButton(tasks.length);
    fillTaskMath(container, shown);
  }
}

/* Позиция прокрутки запоминается до открытия и возвращается после закрытия:
   модальное окно уводило страницу наверх, и после просмотра чертежа ученик
   терял место в длинном списке. */
let scrollBeforeLightbox = 0;

function openLightbox(src, alt) {
  const dialog = document.querySelector('#lightbox-dialog');
  const img = document.querySelector('#lightbox-img');
  const caption = document.querySelector('#lightbox-caption');
  const content = document.querySelector('.lightbox-content');
  if (!dialog || !img) return;
  scrollBeforeLightbox = window.scrollY;

  /* Элемент картинки один на все чертежи, и браузер продолжает рисовать
     прежний кадр, пока не загрузится новый. Секунду виден чертёж чужой
     задачи — по нему можно начать рассуждать. Поэтому сначала снимаем
     старый кадр и показываем картинку только после загрузки. */
  img.hidden = true;
  img.removeAttribute('src');
  img.alt = alt || '';
  if (caption) caption.textContent = alt || '';
  content?.classList.add('is-loading');

  img.onload = () => {
    img.hidden = false;
    content?.classList.remove('is-loading');
  };
  img.onerror = () => {
    content?.classList.remove('is-loading');
    if (caption) caption.textContent = (window.MathTasks.t || (k => k))('figure_load_error');
  };
  img.src = src;

  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  requestAnimationFrame(() => window.scrollTo({ top: scrollBeforeLightbox }));
}

document.querySelector('#lightbox-dialog')?.addEventListener('close', () => {
  const img = document.querySelector('#lightbox-img');
  if (img) { img.hidden = true; img.removeAttribute('src'); }
  window.scrollTo({ top: scrollBeforeLightbox });
});

// Одно делегирование на документ — карточки перерисовываются при каждом переходе.
document.addEventListener('click', event => {
  const toggle = event.target.closest('[data-reveal]');
  if (!toggle) return;
  const kind = toggle.dataset.reveal || toggle.dataset.kind;
  const card = toggle.closest('.task');
  const panel = (kind && card)
    ? card.querySelector(`.reveal.${kind}`)
    : toggle.nextElementSibling;
  if (!panel) return;
  const shown = !panel.hidden;
  panel.hidden = shown;
  toggle.setAttribute('aria-expanded', String(!shown));
  toggle.classList.toggle('active', !shown);
  /* Открытая подсказка или разбор помечает задачу: в журнале она пойдёт
     «с подсказкой», даже если ответ потом сошёлся с первого раза. */
  if (!shown && card) markTaskHintOpened(card.dataset.taskId);

  const textEl = toggle.querySelector('.toggle-text');
  const newLabel = shown ? toggle.dataset.showLabel : toggle.dataset.hideLabel;
  if (textEl) {
    textEl.textContent = newLabel;
  } else {
    toggle.textContent = newLabel;
  }
});

/* ── Карточки тем ─────────────────────────────────────────────────── */

/* Цвет раздела: им подсвечены номер темы, прогресс и фон карточки, значок
   раздела в меню и заголовок группы тем. Смайлики — только у разделов. */
const SUBJECT_COLORS = {
  algebra: 'blue',
  geometry: 'violet',
  planimetrija: 'violet',
  stereometrija: 'bordeaux',
  funkcijas: 'cyan',
  trigonometrija: 'pink',
  'matematiskais-analizs': 'indigo',
  'kombinatorika-un-varbutibas': 'amber',
  statistics: 'amber'
};
const subjectColor = subject => SUBJECT_COLORS[subject?.slug] || 'blue';

/* «1 задача», «3 задачи», «5 задач» — форма по Intl.PluralRules языка страницы. */
function countLabel(base, count) {
  const tr = window.MathTasks.t || (k => k);
  let form = 'other';
  try {
    form = new Intl.PluralRules(progressLocale()).select(count);
  } catch {}
  const key = `${base}_${form}`;
  const word = tr(key);
  return `${count} ${word && word !== key ? word : tr(`${base}_other`)}`;
}

/* Карточка темы: полный номер в цвете раздела, раздел, состояние (процент,
   «не начата», «пройдена»), полоса прогресса, задачи и подтемы. */
function topicCard(topic, index, showGrade) {
  const tr = window.MathTasks.t || (k => k);
  const subject = subjectById(topic.subject_id);
  const count = taskCount(topic.id);
  const progress = getTopicProgress(topic.id);
  const fullTitle = topicTitleOf(topic);
  const numbered = fullTitle.match(/^(\d+(?:\.\d+)*)\.?\s+(.+)$/);
  const num = numbered ? numbered[1] : '';
  const title = numbered ? numbered[2] : fullTitle;
  const subCount = (subtopicsByTopic.get(topic.id) || []).length;

  let state = `${progress.percent}%`;
  let stateCls = '';
  if (!count) {
    state = tr('topic_no_tasks');
    stateCls = ' is-new';
  } else if (progress.isComplete) {
    state = tr('topic_state_done');
    stateCls = ' is-done';
  } else if (!progress.solved) {
    state = tr('topic_state_new');
    stateCls = ' is-new';
  }
  const foot = [showGrade && topic.grade ? gradeLabel(topic.grade) : '', count ? countLabel('topic_tasks', count) : '']
    .filter(Boolean).join(' · ');
  const progressTitle = count ? tr('topic_progress', { solved: progress.solved, total: progress.total, percent: progress.percent }) : '';

  return `<a class="topic-card tc subj-${subjectColor(subject)}" href="/topic/${encodeURIComponent(topic.slug)}" title="${escapeHtml(fullTitle)}">
    <span class="tc-head">
      ${num ? `<span class="tc-num">${escapeHtml(num)}</span>` : ''}
      <span class="tc-subject">${escapeHtml(loc(subject, 'title') || '')}</span>
      <span class="tc-state${stateCls}">${escapeHtml(state)}</span>
    </span>
    <h3 class="tc-title">${escapeHtml(title)}</h3>
    <span class="tc-bar${progress.isComplete ? ' is-done' : ''}"${progressTitle ? ` title="${escapeHtml(progressTitle)}"` : ''}><i style="width:${count ? progress.percent : 0}%"></i></span>
    <span class="tc-foot"><span>${escapeHtml(foot)}</span><span>${subCount ? escapeHtml(countLabel('topic_subtopics', subCount)) : ''}</span></span>
  </a>`;
}

function renderTopicCards(container, topics, showGrade = !selectedGrade) {
  container.hidden = !topics.length;
  container.innerHTML = topics.length ? topics.map((topic, index) => topicCard(topic, index, showGrade)).join('') : '';
}

function renderTopicGroups(container, groups) {
  container.hidden = !groups.length;
  container.innerHTML = groups.map(({ subject, topics }) => `<section class="topic-group">
    <div class="topic-group-head">
      <h2><span class="topic-group-icon tc-subj subj-${subjectColor(subject)}">${escapeHtml(subjectIcon(subject))}</span>${escapeHtml(loc(subject, 'title'))}</h2>
      <a href="/subject/${encodeURIComponent(subject.slug)}">${escapeHtml((window.MathTasks.t || (k => k))('subject_all_topics_arrow'))}</a>
    </div>
    ${topics.length
      ? `<div class="topic-grid">${topics.map((topic, index) => topicCard(topic, index, false)).join('')}</div>`
      : `<p class="empty-state">${selectedGrade ? `В ${selectedGrade} классе тем нет.` : 'Тем пока нет.'}</p>`}
  </section>`).join('');
}

/* ── Главная ──────────────────────────────────────────────────────── */

/* Заголовки разделов главной считает этот код, а не data-i18n: к названию
   добавляется выбранный класс. Атрибуты у них сняты — иначе автоперевод
   на DOMContentLoaded затирал «Темы — 9 класс» обратно на «Популярные
   темы», и класс из заголовка пропадал. */
function renderHeadings() {
  const tr = window.MathTasks.t || (k => k);
  const suffix = selectedGrade ? ` — ${gradeLabel(selectedGrade)}` : '';
  topicsHeading.textContent = (selectedGrade ? (tr('topics_heading') || 'Tēmas') : tr('popular_topics')) + suffix;
}

/* Полоса «решать весь класс»: без неё до задач класса можно было добраться
   только через тему, а прогнать всю параллель подряд — никак. */
function renderGradeActions() {
  const box = document.querySelector('#grade-actions');
  if (!box) return;
  const tr = window.MathTasks.t || (k => k);
  if (!selectedGrade) { box.hidden = true; box.innerHTML = ''; return; }
  const topics = topicsForGrade(allTopics);
  const total = topics.reduce((sum, t) => sum + (taskCounts.get(t.id) || 0), 0);
  /* Пустому классу предлагать «решать всё» незачем — вести некуда. */
  if (!total) { box.hidden = true; box.innerHTML = ''; return; }
  box.innerHTML = `<a class="grade-action" href="/grade/${encodeURIComponent(selectedGrade)}/tasks"
      title="${escapeHtml(tr('grade_solve_all_hint', { count: total, topics: topics.length }))}">
      ${escapeHtml(tr('grade_solve_all_short', { count: total }))} →
    </a>`;
  box.hidden = false;
}

/* «Популярные темы» без выбранного класса — самые наполненные темы, а не
   весь каталог подряд: туда попадали и пустые темы с плашкой «Пока пусто». */
const POPULAR_TOPICS_LIMIT = 8;
function popularTopics(topics) {
  return topics
    .filter(t => (taskCounts.get(t.id) || 0) > 0)
    .sort((a, b) => (taskCounts.get(b.id) || 0) - (taskCounts.get(a.id) || 0))
    .slice(0, POPULAR_TOPICS_LIMIT);
}

/* ── Главная: задача дня, «Продолжить», серия ────────────────────── */

/* Задача дня — одна на весь день: номер выбирается от даты, а не
   случайно, чтобы утром и вечером ученик видел ту же задачу. «Другая»
   сдвигает выбор на одну вперёд. В контексте класса — из его задач. */
let dailyShift = 0;
let dailyRequest = 0;

function dailySeed(key) {
  let hash = 0;
  for (const char of String(key)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

function dailyCandidates() {
  const topicIds = new Set(topicsForGrade(allTopics).map(topic => topic.id));
  const rows = publishedTaskRows.filter(row => topicIds.has(row.topic_id));
  return rows.length ? rows : publishedTaskRows;
}

function difficultyText(diff) {
  if (!diff) return '';
  const tr = window.MathTasks.t || (k => k);
  const d = String(diff).trim().toLowerCase();
  if (/лёгк|легк|баз|easy|pamat/.test(d)) return tr('diff_easy');
  if (/сложн|hard|проф|augst|padziļ/.test(d)) return tr('diff_hard');
  return tr('diff_medium');
}

function dailyCard(task) {
  const tr = window.MathTasks.t || (k => k);
  const topic = allTopics.find(item => item.id === task.topic_id);
  const sub = task.subtopic_id ? allSubtopics.find(item => item.id === task.subtopic_id) : null;
  const grade = task.grade ?? topic?.grade;
  const meta = [
    sub && topic ? subtopicTitle(sub, topic) : '',
    grade ? gradeLabel(grade) : '',
    difficultyText(task.difficulty)
  ].filter(Boolean).join(' · ');
  const enterHint = taskRevealState(task).checkable && !isTaskSolved(task.id)
    ? `<span>${escapeHtml(tr('home_daily_enter_hint'))}</span>`
    : '';
  const topicLink = topic
    ? `<span>${escapeHtml(tr('home_daily_topic'))} <a href="/topic/${encodeURIComponent(topic.slug)}">${escapeHtml(topicTitleOf(topic))}</a></span>`
    : '';
  /* Чертёж на главной сам не грузится: только по кнопке, поверх страницы. */
  const figureUrl = task.condition_image ? imageUrl(task.condition_image) : '';
  const figureBtn = figureUrl
    ? `<button type="button" class="home-daily-other home-daily-figure" data-daily-figure="${escapeHtml(figureUrl)}" data-figure-alt="${escapeHtml(loc(task, 'title') || tr('home_daily_badge'))}">📐 ${escapeHtml(tr('home_daily_figure'))}</button>`
    : '';
  return `<div class="home-daily-head">
      <span class="home-daily-badge">${escapeHtml(tr('home_daily_badge'))}</span>
      <span class="home-daily-meta">${escapeHtml(meta)}</span>
      ${figureBtn}
      <button type="button" class="home-daily-other" data-daily-other>↻ ${escapeHtml(tr('home_daily_other'))}</button>
    </div>
    ${taskCard(task, { linkTitle: false, inlineFigure: false })}
    <div class="home-daily-foot">${enterHint}${topicLink}</div>`;
}

function continuePlace() {
  const place = getLastPlace();
  const topic = place ? allTopics.find(item => item.id === place.topicId) : null;
  return topic ? { topic, number: place.number, progress: getTopicProgress(topic.id) } : null;
}

function homeContinueCard() {
  const tr = window.MathTasks.t || (k => k);
  const label = `<span class="home-card-label">${escapeHtml(tr('progress_continue_title'))}</span>`;
  const place = continuePlace();
  if (!place) return `<div class="home-card home-continue is-empty">${label}<p>${escapeHtml(tr('home_continue_empty'))}</p></div>`;
  const { topic, number, progress } = place;
  const href = `/topic/${encodeURIComponent(topic.slug)}`;
  const where = [
    loc(subjectById(topic.subject_id), 'title'),
    number ? tr('home_continue_stopped', { n: number }) : tr('home_continue_start')
  ].filter(Boolean).join(' · ');
  /* «Продолжить →» — ссылкой в строке с меткой, а не отдельной кнопкой внизу:
     столбец справа не выше задачи дня, и ряд не растягивается пустотой. */
  return `<div class="home-card home-continue">
    <div class="home-card-head">${label}<a class="home-continue-go" href="${href}">${escapeHtml(tr('home_continue_btn'))}</a></div>
    <a class="home-continue-title" href="${href}">${escapeHtml(topicTitleOf(topic))}</a>
    <span class="home-continue-where">${escapeHtml(where)}</span>
    ${progressBar(progress.percent)}
    <span class="home-continue-count"><span>${escapeHtml(tr('home_continue_solved', { solved: progress.solved, total: progress.total }))}</span><b>${progress.percent}%</b></span>
  </div>`;
}

/* Серия: число дней подряд и текущая неделя с понедельника. Считают те же
   функции, что и страница «Мой прогресс», — цифры там и здесь совпадают. */
function homeStreakCard() {
  const lib = window.MathTasksLib;
  if (!lib?.computeStreak || !lib?.buildActivityWeeks) return '';
  const tr = window.MathTasks.t || (k => k);
  const today = lib.localDateKey();
  const activity = getActivity();
  const streak = lib.computeStreak(activity, today);
  const [week] = lib.buildActivityWeeks(activity, today, 1);
  const days = week.map(day => {
    const [y, m, d] = day.key.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const cls = ['home-streak-day', day.count > 0 ? 'is-done' : '', day.key === today ? 'is-today' : '', day.future ? 'is-future' : '']
      .filter(Boolean).join(' ');
    const title = `${date.toLocaleDateString(progressLocale(), { weekday: 'long', day: 'numeric', month: 'long' })}: ${tr('progress_day_count', { count: day.count })}`;
    return `<span class="${cls}" title="${escapeHtml(title)}"><i></i><small>${escapeHtml(date.toLocaleDateString(progressLocale(), { weekday: 'narrow' }))}</small></span>`;
  }).join('');
  /* Нулевая серия — не «0 дней подряд», а что сделать, чтобы она началась:
     новому посетителю ноль ничего не говорит. */
  return `<a class="home-card home-streak" href="/progress" title="${escapeHtml(tr('nav_progress'))}">
    <span class="home-streak-count">
      <span class="home-card-label">${escapeHtml(tr('home_streak_title'))}</span>
      ${streak.current === 0
        ? `<span class="home-streak-empty">${escapeHtml(tr('home_streak_empty'))}</span>`
        : `<strong>${streak.current}</strong>
      <small>${escapeHtml(streakUnit(streak.current))}</small>`}
    </span>
    <span class="home-streak-week">${days}</span>
  </a>`;
}

/* «1 день», «3 дня», «5 дней» — форму выбирает Intl.PluralRules языка
   страницы. Нет ключа для формы — общая подпись «дней подряд». */
function streakUnit(count) {
  const tr = window.MathTasks.t || (k => k);
  let form = 'other';
  try {
    form = new Intl.PluralRules(progressLocale()).select(count);
  } catch {}
  const key = `home_streak_unit_${form}`;
  const text = tr(key);
  return text && text !== key ? text : tr('progress_stat_streak');
}

function refreshHomeSide() {
  const side = document.querySelector('#home-today .home-side');
  if (side) side.innerHTML = homeContinueCard() + homeStreakCard();
}

/* Задача дня показывается сразу: загруженная задача лежит в браузере до
   конца дня (ключ — дата, класс и сдвиг «Другой»), а следующая по
   «Другой» подгружается заранее. Сеть нужна только при первом заходе за день. */
const DAILY_CACHE_KEY = 'math-tasks:daily';

function dailyKey(shift) {
  const lib = window.MathTasksLib;
  const today = lib?.localDateKey ? lib.localDateKey() : new Date().toISOString().slice(0, 10);
  return `${today}|${selectedGrade ?? 'all'}|${shift}`;
}

function readDailyCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(DAILY_CACHE_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function writeDailyCache(key, task) {
  const today = key.split('|')[0];
  // Вчерашние записи выбрасываем: хранится только сегодняшний день.
  const cache = Object.fromEntries(Object.entries(readDailyCache()).filter(([k]) => k.startsWith(`${today}|`)));
  cache[key] = task;
  try {
    localStorage.setItem(DAILY_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

/* Запомненную задачу могли снять с публикации в тот же день — такую не
   показываем. Список опубликованных приходит заново при каждом входе. */
function isStillPublished(task) {
  return publishedTaskRows.some(row => row.id === task.id);
}

async function fetchDailyTask(shift) {
  const key = dailyKey(shift);
  const cached = readDailyCache()[key];
  if (cached && isStillPublished(cached)) return cached;
  const rows = dailyCandidates();
  if (!rows.length) return null;
  const pick = rows[(dailySeed(key.split('|')[0]) + shift) % rows.length];
  const { data } = await db.from('tasks').select(TASK_SELECT).eq('is_published', true).eq('id', pick.id).limit(1);
  const task = data?.[0] || null;
  if (task) writeDailyCache(key, task);
  return task;
}

async function renderHomeToday() {
  const box = document.querySelector('#home-today');
  if (!box) return;
  const request = ++dailyRequest;
  const hasCandidates = dailyCandidates().length > 0;
  box.innerHTML = `${hasCandidates ? '<div class="home-daily" id="home-daily"></div>' : ''}<div class="home-side"></div>`;
  box.classList.toggle('no-daily', !hasCandidates);
  refreshHomeSide();
  box.hidden = false;
  if (!hasCandidates) return;
  const slot = box.querySelector('#home-daily');
  const show = task => {
    slot.innerHTML = dailyCard(task);
    fillTaskMath(slot, [task]);
  };
  const stored = readDailyCache()[dailyKey(dailyShift)];
  const cached = stored && isStillPublished(stored) ? stored : null;
  if (cached) show(cached);
  else slot.innerHTML = '<div class="home-daily-skeleton" aria-hidden="true"></div>';
  const task = cached || await fetchDailyTask(dailyShift);
  if (request !== dailyRequest) return;
  if (!task) {
    slot.remove();
    box.classList.add('no-daily');
    return;
  }
  if (!cached) show(task);
  // «Другая» потом откроется без ожидания.
  fetchDailyTask(dailyShift + 1).catch(() => {});
}

document.addEventListener('click', event => {
  const figureBtn = event.target.closest('[data-daily-figure]');
  if (figureBtn) {
    event.preventDefault();
    openLightbox(figureBtn.dataset.dailyFigure, figureBtn.dataset.figureAlt || '');
    return;
  }
  if (!event.target.closest('[data-daily-other]')) return;
  event.preventDefault();
  dailyShift++;
  renderHomeToday();
});

async function loadHome() {
  renderGradeActions();
  renderHomeToday();
  const topics = topicsForGrade(allTopics);
  topicsElement.innerHTML = topics.length
    ? (selectedGrade ? topics : popularTopics(topics)).map((topic, index) => topicCard(topic, index, !selectedGrade)).join('')
    : `<p class="empty-state">${selectedGrade ? `Тем для ${gradeLabel(selectedGrade)} пока нет.` : 'Темы ещё не добавлены.'}</p>`;

  // «Новые задачи» убраны: их место заняли задача дня и карточки ниже.
  renderHomeInsights();
}

/* ── Главная: слабые места, контрольные, экзамен ─────────────────── */

/* Слабое место — тема, где у ученика больше всего неверных попыток.
   Считаем по счётчику ошибок в браузере: верная попытка — по одной на
   решённую задачу. Разобрать предлагаем то, что с ошибкой и ещё не решено. */
function weakSpot() {
  const wrong = getWrongAttemptCounts();
  const solved = new Set(getSolvedTasks());
  const topicOfTask = new Map(publishedTaskRows.map(row => [row.id, row.topic_id]));
  const byTopic = new Map();
  for (const [id, count] of Object.entries(wrong)) {
    const misses = Number(count) || 0;
    const topicId = topicOfTask.get(Number(id));
    if (!misses || !topicId) continue;
    const row = byTopic.get(topicId) || { wrong: 0, tasks: [] };
    row.wrong += misses;
    row.tasks.push(Number(id));
    byTopic.set(topicId, row);
  }
  let worst = null;
  for (const [topicId, row] of byTopic) {
    if (!worst || row.wrong > worst.wrong) worst = { topicId, ...row };
  }
  const topic = worst ? allTopics.find(item => item.id === worst.topicId) : null;
  if (!topic) return null;
  const solvedCount = worst.tasks.filter(id => solved.has(id)).length;
  return {
    topic,
    wrong: worst.wrong,
    attempts: worst.wrong + solvedCount,
    toReview: worst.tasks.length - solvedCount
  };
}

/* Экзамен по контексту класса. Цифры — со страницы пробных экзаменов:
   основная школа — 105 + 75 минут; Vispārīgais и Optimālais — 135 + 105;
   Augstākais — 180 одной частью (время — в EXAM_KINDS). */
function homeExamKind() {
  if (selectedGrade === 'matematika-1' || selectedGrade === 10 || selectedGrade === 11) return 'opt';
  if (selectedGrade === 'matematika-2' || selectedGrade === 12) return 'augst';
  if (selectedGrade === 'visparigais') return 'visp';
  return 'pamat';
}

function renderHomeInsights() {
  const box = document.querySelector('#home-insights');
  if (!box) return;
  const tr = window.MathTasks.t || (k => k);
  const card = (kind, label, body, href, go) => `<article class="home-insight is-${kind}">
      <span class="home-insight-label">${escapeHtml(label)}</span>
      <p>${body}</p>
      <a class="home-insight-go" href="${href}">${escapeHtml(go)}</a>
    </article>`;

  const weak = weakSpot();
  const weakCard = weak
    ? card('weak', tr('home_weak_title'),
      `${escapeHtml(tr('home_weak_before'))} <b>${escapeHtml(topicTitleOf(weak.topic))}</b>: ${escapeHtml(tr('home_weak_after', { wrong: weak.wrong, attempts: weak.attempts }))}`,
      `/topic/${encodeURIComponent(weak.topic.slug)}`,
      weak.toReview ? tr('home_weak_go', { count: weak.toReview }) : tr('home_weak_repeat'))
    : card('weak', tr('home_weak_title'), escapeHtml(tr('home_weak_empty')), '/tasks', tr('home_weak_empty_go'));

  const cwTopics = topicsForGrade(allTopics).filter(topic => (taskCounts.get(topic.id) || 0) >= MIN_CONTROL_WORK_TASKS).length;
  const cwCard = card('cw', tr('home_cw_title'), escapeHtml(tr('home_cw_text', { count: cwTopics })), '/control-works', tr('home_cw_go'));

  const exam = homeExamKind();
  const examCard = card('exam', tr(`home_exam_title_${exam}`), escapeHtml(tr(`home_exam_text_${exam}`)), `/exam/${exam}`, tr('home_exam_go'));

  box.innerHTML = weakCard + cwCard + examCard;
  box.hidden = false;
}

/* ── Виды и заголовок списка ──────────────────────────────────────── */

let currentView = null;
function showView(name) {
  viewHome.hidden = name !== 'home';
  viewList.hidden = name !== 'list';
  viewAbout.hidden = name !== 'about';
  if (viewControlWork) viewControlWork.hidden = name !== 'control-work';
  if (viewControlWorks) viewControlWorks.hidden = name !== 'control-works';
  if (viewProgress) viewProgress.hidden = name !== 'progress';
  // Прокручиваем только при смене вида: иначе поиск дёргал бы страницу на каждой букве.
  if (currentView !== name) window.scrollTo(0, 0);
  currentView = name;
}

function fillListHeader({ crumbs, title, description = '', meta = '' }) {
  document.querySelector('#list-breadcrumb').innerHTML = crumbs
    .map(([label, href]) => (href ? `<a href="${href}">${escapeHtml(label)}</a>` : `<span>${escapeHtml(label)}</span>`))
    .join('<span class="crumb-sep">/</span>');
  document.querySelector('#list-title').textContent = title;
  const descriptionElement = document.querySelector('#list-description');
  descriptionElement.textContent = description;
  descriptionElement.hidden = !description;
  document.querySelector('#list-meta').innerHTML = meta;
}

/* Шапка страницы темы или подтемы. Вынесена из showTopic/showSubtopic:
   при смене языка её надо собрать заново, не перезагружая задачи. */
function fillTopicHeader(topic, sub = null) {
  const tr = window.MathTasks.t || (k => k);
  const subject = subjectById(topic.subject_id);
  const topicTitle = topicTitleOf(topic);
  const title = sub ? subtopicTitle(sub, topic) : topicTitle;

  const crumbs = [[tr('nav_home'), '/']];
  if (topic.grade) crumbs.push([gradeLabel(topic.grade), `/grade/${topic.grade}`]);
  if (subject) crumbs.push([loc(subject, 'title'), `/subject/${encodeURIComponent(subject.slug)}`]);
  if (sub) {
    crumbs.push([topicTitle, `/topic/${encodeURIComponent(topic.slug)}`]);
    crumbs.push([loc(sub, 'title'), null]);
  } else {
    crumbs.push([topicTitle, null]);
  }

  fillListHeader({
    crumbs,
    title,
    description: '',
    meta: topic.grade ? `<span class="grade-badge">${gradeLabel(topic.grade)}</span>` : ''
  });
  const description = sub
    ? metaText('meta_subtopic_desc', { subtopic: loc(sub, 'title') })
    : (loc(topic, 'description') || metaText('meta_topic_desc', { topic: topicTitle }));
  setMeta(topic.grade ? `${title}, ${gradeLabel(topic.grade)}` : title, description);
}

// Каждый список сам решает, что ему нужно; остальные контейнеры гасим.
function resetListBlocks() {
  document.querySelector('#similar-tasks')?.remove();
  renderTopicCards(listTopics, []);
  renderTopicGroups(listGroups, []);
  listTasks.innerHTML = '';
  listAnchors.hidden = true;
  listAnchors.innerHTML = '';
  if (listSubtopics) { listSubtopics.hidden = true; listSubtopics.innerHTML = ''; }
  listActions.hidden = true;
  listActions.innerHTML = '';
  const cwSlot = document.querySelector('#topic-control-work-slot');
  if (cwSlot) {
    cwSlot.hidden = true;
    cwSlot.innerHTML = '';
  }
  document.querySelector('#task-nav')?.remove();
}

const gradeCrumb = () => (selectedGrade ? [gradeLabel(selectedGrade), `/grade/${selectedGrade}`] : [(window.MathTasks?.t ? window.MathTasks.t('all_grades') : 'Все классы'), '/']);

/* ── Страница класса ──────────────────────────────────────────────── */

async function showGradePage(rawGrade) {
  const grade = parseGradeValue(rawGrade);
  if (!grade) {
    applyGrade(null);
    showView('home');
    setMeta('', metaText('meta_home_desc'));
    await loadHome();
    return;
  }
  if (selectedGrade !== grade) {
    applyGrade(grade);
  }
  showView('home');
  const label = gradeLabel(grade);
  setMeta(metaText('meta_grade_title', { grade: label }), metaText('meta_grade_desc', { grade: label }));
  await loadHome();
}

/* ── Страница раздела ─────────────────────────────────────────────── */

function getTopicGradeBucket(t) {
  if (t.slug && t.slug.startsWith('visp-')) return 10;
  if (t.slug && t.slug.startsWith('opt-')) return 11;
  if (t.slug && t.slug.startsWith('augst-')) return 12;
  const num = Number(t.grade);
  if ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(num)) return num;
  if (t.grade === 'visparigais') return 10;
  if (t.grade === 'matematika-1') return 11;
  if (t.grade === 'matematika-2') return 12;
  return 1;
}

function getGradeBucketHeader(bucket) {
  const tr = window.MathTasks.t || (k => k);
  if (bucket >= 1 && bucket <= 8) {
    return {
      title: tr(`grade_${bucket}`) || tr('grade_N', { n: bucket }) || `${bucket}. klase`,
      bullet: '•',
      badge: null,
      badgeClass: ''
    };
  }
  if (bucket === 9) {
    return {
      title: tr('grade_9') || '9. klase',
      bullet: '•',
      badge: tr('track_9_desc') || '9. klases valsts eksāmens',
      badgeClass: 'gold'
    };
  }
  if (bucket === 10) {
    return {
      title: tr('grade_visparigais') || 'Vispārīgais līmenis (10. klase)',
      bullet: '•',
      badge: tr('track_visp_desc') || 'Pamatkurss',
      badgeClass: 'teal'
    };
  }
  if (bucket === 11) {
    return {
      title: tr('grade_matematika_1') || 'Optimālais līmenis — Matemātika I',
      bullet: '•',
      badge: tr('track_opt_desc') || '10.–11. klase • Centralizētais eksāmens',
      badgeClass: 'blue'
    };
  }
  if (bucket === 12) {
    return {
      title: tr('grade_matematika_2') || 'Augstākais līmenis — Matemātika II',
      bullet: '•',
      badge: tr('track_augst_desc') || '12. klase • Padziļinātais kurss',
      badgeClass: 'purple'
    };
  }
  return { title: `${bucket}. klase`, bullet: '•', badge: null, badgeClass: '' };
}

function showSubject(slug) {
  showView('list');
  resetListBlocks();
  const subject = subjects.find(item => item.slug === slug);
  const tr = window.MathTasks.t || (k => k);
  if (!subject) {
    fillListHeader({ crumbs: [[tr('nav_home'), '/']], title: 'Раздел не найден', description: 'Возможно, его удалили или ссылка устарела.' });
    setMeta(metaText('meta_not_found_subject'));
    return;
  }
  const allSubjectTopics = allTopics.filter(topic => topic.subject_id === subject.id);
  const title = loc(subject, 'title');

  fillListHeader({
    crumbs: [[tr('nav_home'), '/'], [title, null]],
    title: `${subjectIcon(subject)} ${title}`,
    description: tr('topics_per_grade_subtitle') || 'Все темы раздела по классам и курсам',
    meta: `<span class="search-count">${allSubjectTopics.length} ${tr('topics_heading').toLowerCase()}</span>`
  });
  setMeta(title, metaText('meta_subject_desc', { subject: title }));

  // Всегда отображаем все классы раздела:
  // "Раздел"
  // • 1 класс -> темы
  // • 2 класс -> темы
  // ...
  const BUCKETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const groupedBuckets = [];

  for (const b of BUCKETS) {
    const bTopics = allSubjectTopics.filter(t => getTopicGradeBucket(t) === b);
    if (bTopics.length > 0) {
      bTopics.sort((a, b) => (a.position || 0) - (b.position || 0));
      groupedBuckets.push({
        bucket: b,
        header: getGradeBucketHeader(b),
        topics: bTopics
      });
    }
  }

  if (!groupedBuckets.length) {
    listTasks.innerHTML = `<p class="empty-state">${tr('course_no_topics_yet')}</p>`;
    return;
  }

  // Навигация быстрого перехода по классам раздела (якоря)
  if (groupedBuckets.length > 1) {
    listAnchors.hidden = false;
    listAnchors.innerHTML = `
      <span class="topic-anchors-label">${tr('grade_label')}:</span>
      <div class="grade-jump-bar">
        ${groupedBuckets.map(({ bucket, header, topics }) => `
          <a class="grade-jump-chip" href="#grade-sec-${bucket}">
            <span>${header.title.split('(')[0].trim()}</span>
            <span class="jump-chip-count">${topics.length}</span>
          </a>
        `).join('')}
      </div>
    `;
  }

  // Группы по классам
  listGroups.hidden = false;
  listGroups.innerHTML = groupedBuckets.map(({ bucket, header, topics: gTopics }) => `
    <section class="subject-grade-section" id="grade-sec-${bucket}">
      <div class="subject-grade-header">
        <div class="grade-header-left">
          <span class="grade-bullet">•</span>
          <h2 class="grade-header-title">${escapeHtml(header.title)}</h2>
          ${header.badge ? `<span class="grade-header-badge badge-${header.badgeClass}">${escapeHtml(header.badge)}</span>` : ''}
        </div>
        <span class="grade-topics-count">${gTopics.length} ${tr('topics_heading').toLowerCase()}</span>
      </div>
      <div class="topic-grid">
        ${gTopics.map((t, idx) => topicCard(t, idx, false)).join('')}
      </div>
    </section>
  `).join('');
}

/* ── Якоря и печать внутри темы ───────────────────────────────────── */

/* Разбор темы читают подряд и возвращаются к нужному номеру, поэтому список
   номеров сверху экономит прокрутку. При двух задачах он бесполезен. */
/* ── Подтемы ──────────────────────────────────────────────────────── */

const subtopicsOf = topicId => subtopicsByTopic.get(topicId) || [];
const subtopicBySlug = slug => allSubtopics.find(s => s.slug === slug);
/* В базе код подтемы всегда полный («10.5.1»), а показываем его так же,
   как номер темы: в старшей школе без служебной десятки. */
const subtopicCode = (sub, topic) => {
  const grade = topic?.grade ?? allTopics.find(t => t.id === sub?.topic_id)?.grade;
  return window.MathTasksLib?.formatSubtopicCode
    ? window.MathTasksLib.formatSubtopicCode(sub?.code, grade)
    : (sub?.code || '');
};
const subtopicTitle = (s, topic) => {
  const code = subtopicCode(s, topic);
  return `${code ? code + '. ' : ''}${loc(s, 'title')}`;
};

const formatSubtopicSummary = (subCount, taskCount, lang = 'ru') => {
  return window.MathTasksLib?.formatSubtopicSummary
    ? window.MathTasksLib.formatSubtopicSummary(subCount, taskCount, lang)
    : `${subCount} • ${taskCount}`;
};

/* Компактная, элегантная и выразительная панель подтем (Skola2030) */
function renderSubtopicNav(topic, activeSubtopicId = null) {
  if (!listSubtopics) return;
  const list = subtopicsOf(topic.id);
  if (!list.length) { listSubtopics.hidden = true; listSubtopics.innerHTML = ''; return; }
  const tr = window.MathTasks.t || (k => k);
  const total = taskCounts.get(topic.id) || 0;

  const isAllActive = !activeSubtopicId;

  const allPill = `<a class="subtopic-pill subtopic-pill-all${isAllActive ? ' active' : ''}" href="/topic/${encodeURIComponent(topic.slug)}"${isAllActive ? ' aria-current="page"' : ''}>
    <span class="subtopic-pill-title">${escapeHtml(tr('subtopic_all'))}</span>
    <span class="subtopic-pill-count">${total}</span>
  </a>`;

  const pills = list.map(s => {
    const count = subtopicCounts.get(s.id) || 0;
    const isActive = s.id === activeSubtopicId;
    const code = subtopicCode(s, topic);
    return `<a class="subtopic-pill${isActive ? ' active' : ''}${count ? '' : ' empty'}" href="/subtopic/${encodeURIComponent(s.slug)}" title="${escapeHtml(subtopicTitle(s, topic))}"${isActive ? ' aria-current="page"' : ''}>
      <span class="subtopic-pill-code">${escapeHtml(code)}</span>
      <span class="subtopic-pill-title">${escapeHtml(loc(s, 'title'))}</span>
      <span class="subtopic-pill-count">${count}</span>
    </a>`;
  }).join('');

  // Одна строка подтем с прокруткой вбок; «Skola2030» — значком в шапке темы.
  listSubtopics.innerHTML = `<div class="subtopic-pills">${allPill}${pills}</div>`;
  listSubtopics.hidden = false;
}

/* Страница одной подтемы: тот же список задач, что и у темы, но суженный
   до одной подтемы. Всё управление списком (сортировка, режимы, печать)
   работает как есть — меняется только набор задач. */
async function showSubtopic(slug) {
  showView('list');
  resetListBlocks();
  const tr = window.MathTasks.t || (k => k);
  const sub = subtopicBySlug(slug);
  const topic = sub ? allTopics.find(t => t.id === sub.topic_id) : null;
  if (!sub || !topic) {
    currentActiveTopic = null;
    fillListHeader({ crumbs: [[tr('nav_home'), '/']], title: tr('subtopic_not_found'), description: '' });
    setMeta(tr('subtopic_not_found'));
    renderSidebar();
    return;
  }
  currentActiveTopic = topic;
  currentSubtopic = sub;
  if (topic.grade && selectedGrade !== topic.grade) applyGrade(topic.grade);
  else renderSidebar();

  fillTopicHeader(topic, sub);

  renderSubtopicNav(topic, sub.id);
  listTasks.innerHTML = `<p class="empty-state">${tr('state_loading_tasks')}</p>`;
  const { data, error } = await db.from('tasks').select(TASK_SELECT)
    .eq('is_published', true).eq('subtopic_id', sub.id)
    .order('position').order('created_at', { ascending: true });
  if (error) { listTasks.innerHTML = `<p class="empty-state">${tr('err_load_tasks')}</p>`; return; }

  const tasks = data || [];
  subtopicCounts.set(sub.id, tasks.length);
  currentTopicTasks = tasks;
  filterOnlyUnsolved = false;
  currentTasksSort = 'default';
  shuffledTopicTasks = null;
  currentListEmptyText = tr('subtopic_empty');
  renderCurrentTopicTasks();
}

/* Полосу номеров над списком убрали (по образцу): в списке номер стоит на
   каждой карточке, в виде «по одной» есть карта темы, в тренажёре номера
   на плитках. */
function renderTopicAnchors() {
  listAnchors.hidden = true;
  listAnchors.innerHTML = '';
}

function cleanupPrint() {
  document.body.classList.remove('printing', 'print-solutions');
}

function printTasks(withSolutions) {
  document.body.classList.add('printing');
  document.body.classList.toggle('print-solutions', withSolutions);
  window.print();
}

window.addEventListener('afterprint', cleanupPrint);

if (window.matchMedia) {
  try {
    const printMedia = window.matchMedia('print');
    printMedia.addEventListener('change', mql => {
      if (!mql.matches) cleanupPrint();
    });
  } catch {}
}

window.addEventListener('focus', () => {
  if (document.body.classList.contains('printing')) {
    setTimeout(cleanupPrint, 300);
  }
});

let currentTopicTasks = [];
let filterOnlyUnsolved = false;
let currentTasksSort = 'default';
let shuffledTopicTasks = null;
let currentListEmptyText = 'В этой теме задач пока нет.';

function renderCurrentTopicTasks() {
  const tr = window.MathTasks.t || (k => k);

  let baseList = (currentTasksSort === 'shuffle' && shuffledTopicTasks)
    ? [...shuffledTopicTasks]
    : [...currentTopicTasks];

  let tasksToRender = filterOnlyUnsolved
    ? baseList.filter(t => !isTaskSolved(t.id))
    : baseList;

  if (currentTasksSort !== 'shuffle') {
    const sortFn = window.MathTasksLib?.sortTasks || ((list) => [...list]);
    tasksToRender = sortFn(tasksToRender, currentTasksSort, {
      isSolved: id => isTaskSolved(id),
      subtopics: allSubtopics
    });
  }

  const emptyText = filterOnlyUnsolved
    ? tr('all_tasks_solved')
    : currentListEmptyText;

  const showTopicLink = !currentActiveTopic;
  renderTaskList(listTasks, tasksToRender, emptyText, { showTopicLink, showGrade: true });
  if (currentActiveTopic) {
    renderTopicAnchors(tasksToRender);
    if (!currentSubtopic) renderTopicControlWorkCard(currentActiveTopic, currentTopicTasks);
  } else {
    listAnchors.hidden = true;
    const cwSlot = document.querySelector('#topic-control-work-slot');
    if (cwSlot) {
      cwSlot.hidden = true;
      cwSlot.innerHTML = '';
    }
  }
  renderPrintActions(currentTopicTasks);
}

function renderPrintActions(tasks) {
  const enough = tasks.length > 0;
  listActions.hidden = !enough;
  if (!enough) { listActions.innerHTML = ''; return; }
  const tr = window.MathTasks.t || (k => k);

  // Вид — одним переключателем из трёх частей, как в образце.
  const modes = [['list', '≡', 'view_mode_list'], ['compact', '⚡', 'view_mode_compact'], ['single', '▤', 'view_mode_single']];
  const viewToggle = tasks.length > 1 ? `
    <div class="view-mode-toggle" role="group" aria-label="${escapeHtml(tr('view_mode'))}">
      ${modes.map(([mode, icon, key]) => `<button class="view-mode-btn${taskViewMode === mode ? ' active' : ''}" type="button" data-view-mode="${mode}" aria-pressed="${taskViewMode === mode}"><span class="view-mode-icon" aria-hidden="true">${icon}</span>${escapeHtml(tr(key))}</button>`).join('')}
    </div>
  ` : '';

  const sortControl = tasks.length > 1 ? `
    <div class="tasks-sort-wrap" title="${escapeHtml(tr('sort_label'))}">
      <span class="sort-icon" aria-hidden="true">⇅</span>
      <select id="tasks-sort-select" class="tasks-sort-select" data-tasks-sort aria-label="${escapeHtml(tr('sort_label'))}">
        <option value="default"${currentTasksSort === 'default' ? ' selected' : ''}>${escapeHtml(tr('sort_default'))}</option>
        <option value="num_desc"${currentTasksSort === 'num_desc' ? ' selected' : ''}>${escapeHtml(tr('sort_num_desc'))}</option>
        <option value="subtopic"${currentTasksSort === 'subtopic' ? ' selected' : ''}>${escapeHtml(tr('sort_subtopic'))}</option>
        <option value="diff_asc"${currentTasksSort === 'diff_asc' ? ' selected' : ''}>${escapeHtml(tr('sort_diff_asc'))}</option>
        <option value="diff_desc"${currentTasksSort === 'diff_desc' ? ' selected' : ''}>${escapeHtml(tr('sort_diff_desc'))}</option>
        <option value="unsolved"${currentTasksSort === 'unsolved' ? ' selected' : ''}>${escapeHtml(tr('sort_unsolved'))}</option>
        <option value="solved"${currentTasksSort === 'solved' ? ' selected' : ''}>${escapeHtml(tr('sort_solved'))}</option>
        <option value="shuffle"${currentTasksSort === 'shuffle' ? ' selected' : ''}>${escapeHtml(tr('sort_shuffle'))}</option>
      </select>
      ${currentTasksSort === 'shuffle' ? `
        <button type="button" class="tasks-reshuffle-btn" data-reshuffle="true" title="${escapeHtml(tr('sort_reshuffle'))}" aria-label="${escapeHtml(tr('sort_reshuffle'))}">🔀</button>
      ` : ''}
    </div>
  ` : '';

  const solvedCount = tasks.filter(t => isTaskSolved(t.id)).length;
  const unsolvedFilterBtn = (tasks.length > 1 && solvedCount > 0) ? `
    <button class="list-tool-btn${filterOnlyUnsolved ? ' active' : ''}" type="button" data-toggle-unsolved="true" aria-pressed="${filterOnlyUnsolved}" title="${escapeHtml(tr('filter_unsolved_title'))}">
      <span aria-hidden="true">🎯</span>${escapeHtml(tr('filter_unsolved_short'))}${filterOnlyUnsolved ? ` · ${tasks.length - solvedCount}` : ''}
    </button>
  ` : '';

  listActions.innerHTML = `
    ${viewToggle}
    ${sortControl}
    ${unsolvedFilterBtn}
    <div class="print-menu-wrap">
      <button class="list-tool-btn print-toggle-btn" type="button" id="print-toggle-btn" aria-haspopup="true" aria-expanded="false">
        <span aria-hidden="true">🖨</span>${escapeHtml(tr('print') || 'Печать')}
      </button>
      <div class="print-dropdown-menu" id="print-dropdown-menu" hidden>
        <button class="print-dropdown-item" type="button" data-print-mode="blank">
          <span class="print-item-icon">📄</span>
          <div class="print-item-text">
            <strong>${escapeHtml(tr('print_no_solutions') || 'Без решений')}</strong>
            <small>${escapeHtml(tr('print_no_solutions_hint') || 'Только условия для учеников')}</small>
          </div>
        </button>
        <button class="print-dropdown-item" type="button" data-print-mode="full">
          <span class="print-item-icon">📝</span>
          <div class="print-item-text">
            <strong>${escapeHtml(tr('print_with_solutions') || 'С решениями')}</strong>
            <small>${escapeHtml(tr('print_with_solutions_hint') || 'С ответами и разбором для учителя')}</small>
          </div>
        </button>
      </div>
    </div>
  `;
}

listActions.addEventListener('change', event => {
  const sortSelect = event.target.closest('[data-tasks-sort]');
  if (sortSelect) {
    currentTasksSort = sortSelect.value;
    if (currentTasksSort === 'shuffle') {
      const shuffleFn = window.MathTasksLib?.shuffleArray || ((arr) => [...arr].reverse());
      shuffledTopicTasks = shuffleFn(currentTopicTasks);
    } else {
      shuffledTopicTasks = null;
    }
    singleTaskIndex = 0;
    renderCurrentTopicTasks();
  }
});

listActions.addEventListener('click', async event => {

  const printToggle = event.target.closest('#print-toggle-btn');
  if (printToggle) {
    const menu = document.querySelector('#print-dropdown-menu');
    if (menu) {
      const isHidden = menu.hidden;
      menu.hidden = !isHidden;
      printToggle.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    }
    return;
  }

  const printItem = event.target.closest('[data-print-mode]');
  if (printItem) {
    const mode = printItem.dataset.printMode;
    const menu = document.querySelector('#print-dropdown-menu');
    if (menu) menu.hidden = true;
    const btn = document.querySelector('#print-toggle-btn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    printTasks(mode === 'full');
    return;
  }

  const filterBtn = event.target.closest('[data-toggle-unsolved]');
  if (filterBtn) {
    filterOnlyUnsolved = !filterOnlyUnsolved;
    singleTaskIndex = 0;
    renderCurrentTopicTasks();
    return;
  }

  const reshuffleBtn = event.target.closest('[data-reshuffle]');
  if (reshuffleBtn) {
    const shuffleFn = window.MathTasksLib?.shuffleArray || ((arr) => [...arr].reverse());
    shuffledTopicTasks = shuffleFn(currentTopicTasks);
    singleTaskIndex = 0;
    renderCurrentTopicTasks();
    return;
  }
});

document.addEventListener('click', event => {
  if (!event.target.closest('.print-menu-wrap')) {
    const menu = document.querySelector('#print-dropdown-menu');
    if (menu && !menu.hidden) {
      menu.hidden = true;
      document.querySelector('#print-toggle-btn')?.setAttribute('aria-expanded', 'false');
    }
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    const menu = document.querySelector('#print-dropdown-menu');
    if (menu && !menu.hidden) {
      menu.hidden = true;
      document.querySelector('#print-toggle-btn')?.setAttribute('aria-expanded', 'false');
    }
  }
});

/* ── Страница темы ────────────────────────────────────────────────── */

async function showTopic(slug) {
  showView('list');
  resetListBlocks();
  const topic = allTopics.find(item => item.slug === slug);
  if (!topic) {
    currentActiveTopic = null;
    fillListHeader({ crumbs: [[(window.MathTasks.t || (k => k))('nav_home'), '/']], title: 'Тема не найдена', description: 'Возможно, её удалили или ссылка устарела.' });
    setMeta(metaText('meta_not_found_topic'));
    renderSidebar();
    return;
  }
  // Переключаем контекст класса и переводим сайдбар в фокус-режим темы
  currentActiveTopic = topic;
  currentSubtopic = null;
  if (topic.grade && selectedGrade !== topic.grade) {
    applyGrade(topic.grade);
  } else {
    renderSidebar();
  }
  rememberPlace(topic.id);
  fillTopicHeader(topic);
  listTasks.innerHTML = `<p class="empty-state">${(window.MathTasks.t || (k => k))('state_loading_tasks')}</p>`;
  // Внутри темы порядок задаёт админ полем «порядок»; при равных значениях — по дате.
  const { data, error } = await db.from('tasks').select(TASK_SELECT)
    .eq('is_published', true).eq('topic_id', topic.id)
    .order('position').order('created_at', { ascending: true });
  if (error) { listTasks.innerHTML = `<p class="empty-state">${(window.MathTasks.t || (k => k))('err_load_tasks')}</p>`; return; }
  // Название темы в карточке здесь лишнее — мы уже внутри неё.
  // Внутри одной темы задачи могут быть для разных параллелей — класс показываем всегда.
  const tasks = data || [];
  topicTasksMap.set(topic.id, tasks.map(t => t.id));
  taskCounts.set(topic.id, tasks.length);
  currentTopicTasks = tasks;
  filterOnlyUnsolved = false;
  currentTasksSort = 'default';
  shuffledTopicTasks = null;
  currentListEmptyText = 'В этой теме задач пока нет.';

  renderTopicHeaderMeta(topic, tasks);

  renderSubtopicNav(topic);
  renderCurrentTopicTasks();
}

function renderTopicHeaderMeta(topic, tasks) {
  const metaEl = document.querySelector('#list-meta');
  if (!metaEl || !topic) return;
  const tr = window.MathTasks.t || (k => k);
  const prog = getTopicProgress(topic.id);
  const taskList = tasks || currentTopicTasks || [];
  const total = prog.total || taskList.length;
  // По образцу: полоса, «22% темы решено · 54 задачи», значок Skola2030.
  const progHtml = total > 0 ? `
    <div class="topic-header-progress${prog.isComplete ? ' done' : ''}" id="topic-header-progress" title="${escapeHtml(tr('topic_progress', { solved: prog.solved, total, percent: prog.percent }))}">
      <span class="topic-header-progress-bar" aria-hidden="true"><span class="topic-header-progress-fill" style="width:${prog.percent}%"></span></span>
      <span class="topic-header-progress-text">${escapeHtml(prog.isComplete ? tr('topic_mastered') : tr('topic_solved_share', { percent: prog.percent }))} · ${escapeHtml(countLabel('topic_tasks', total))}</span>
    </div>` : '';
  const skolaChip = subtopicsOf(topic.id).length ? '<span class="skola-chip">Skola2030</span>' : '';

  const isCwEligible = taskList.length >= MIN_CONTROL_WORK_TASKS;
  const isCwReady = prog.percent >= 80;
  const cwBtnHtml = isCwEligible ? `
    <a class="topic-header-cw-btn${isCwReady ? ' highlighted' : ''}" id="topic-header-cw-btn" href="/control-work/${encodeURIComponent(topic.slug)}" title="${escapeHtml(isCwReady ? tr('cw_ready_hint') : tr('btn_start_cw'))}">
      <span class="cw-btn-icon">📝</span>
      <span class="cw-btn-text">${escapeHtml(tr('cw_badge_short'))}</span>
      ${isCwReady ? `<span class="cw-ready-pill">${escapeHtml(tr('cw_ready_pill'))}</span>` : ''}
    </a>
  ` : '';

  metaEl.innerHTML = `<div class="topic-header-meta-row">${progHtml}${skolaChip}${cwBtnHtml}</div>`;
}

/* ── Все задачи ───────────────────────────────────────────────────── */

async function showAllTasks() {
  showView('list');
  resetListBlocks();
  fillListHeader({
    crumbs: [[(window.MathTasks.t || (k => k))('nav_home'), '/'], gradeCrumb(), ['Все задачи', null]],
    title: selectedGrade ? `Все задачи — ${gradeLabel(selectedGrade)}` : 'Все задачи'
  });
  setMeta(selectedGrade ? metaText('meta_all_tasks_grade_title', { grade: gradeLabel(selectedGrade) }) : metaText('meta_all_tasks_title'),
    metaText('meta_all_tasks_desc'));
  renderSidebar();

  listTasks.innerHTML = `<p class="empty-state">${(window.MathTasks.t || (k => k))('state_loading_tasks')}</p>`;
  /* Постранично, а не одним запросом с limit(500): класс рано или поздно
     перевалит за 500 задач, и хвост молча пропал бы из списка. */
  const scopeToGrade = query => {
    if (selectedGrade === 'matematika-1' || selectedGrade === 10 || selectedGrade === 11) return query.in('grade', [10, 11]);
    if (selectedGrade === 'matematika-2' || selectedGrade === 12) return query.eq('grade', 12);
    return selectedGrade ? query.eq('grade', Number(selectedGrade)) : query;
  };
  const { data, error } = await window.MathTasksLib.fetchAllRows(
    () => scopeToGrade(db.from('tasks').select(TASK_SELECT).eq('is_published', true)).order('id'));
  if (error) { listTasks.innerHTML = `<p class="empty-state">${(window.MathTasks.t || (k => k))('err_load_tasks')}</p>`; return; }
  currentActiveTopic = null;
  currentSubtopic = null;
  /* Порядок по дате годится для ленты «новые задачи», но не для прохода
     всего класса: там ждут порядок программы — тема за темой. */
  const topicPos = new Map(allTopics.map(t => [t.id, t.position ?? 0]));
  currentTopicTasks = (data || []).sort((a, b) =>
    (topicPos.get(a.topic_id) ?? 999) - (topicPos.get(b.topic_id) ?? 999)
    || (a.position ?? 0) - (b.position ?? 0)
    || a.id - b.id);
  filterOnlyUnsolved = false;
  currentTasksSort = 'default';
  shuffledTopicTasks = null;
  currentListEmptyText = selectedGrade ? `Задач для ${gradeLabel(selectedGrade)} пока нет.` : 'Задач пока нет.';
  renderCurrentTopicTasks();
}

async function showFavorites() {
  showView('list');
  resetListBlocks();
  const favIds = getFavorites();
  fillListHeader({
    crumbs: [[(window.MathTasks.t || (k => k))('nav_home'), '/'], ['Мои закладки', null]],
    title: 'Мои закладки',
    description: 'Задачи, которые вы сохранили для повторения или разбора.',
    meta: `<span class="search-count">Сохранено: ${favIds.length}</span>`
  });
  setMeta(metaText('meta_favorites_title'), metaText('meta_favorites_desc'));

  if (!favIds.length) {
    listTasks.innerHTML = `<p class="empty-state">${(window.MathTasks.t || (k => k))('fav_empty_hint')}</p>`;
    return;
  }

  listTasks.innerHTML = `<p class="empty-state">${(window.MathTasks.t || (k => k))('state_loading_favorites')}</p>`;
  const { data, error } = await db.from('tasks').select(TASK_SELECT)
    .eq('is_published', true).in('id', favIds).order('id', { ascending: false });

  if (error || !data || !data.length) {
    listTasks.innerHTML = `<p class="empty-state">${(window.MathTasks.t || (k => k))('err_load_favorites')}</p>`;
    return;
  }

  currentActiveTopic = null;
  currentTopicTasks = data || [];
  filterOnlyUnsolved = false;
  currentTasksSort = 'default';
  shuffledTopicTasks = null;
  currentListEmptyText = (window.MathTasks.t || (k => k))('fav_empty_hint') || 'Закладок нет.';
  renderCurrentTopicTasks();
}

/* ── Мой прогресс ─────────────────────────────────────────────────── */

function progressLocale() {
  return getLang() === 'lv' ? 'lv-LV' : 'ru-RU';
}

function progressBar(percent) {
  const width = Math.max(0, Math.min(100, Number(percent) || 0));
  return `<span class="progress-bar" aria-hidden="true"><i style="width:${width}%"></i></span>`;
}

function progressTopicRow(row, { withGrade = true } = {}) {
  const gradeNote = withGrade && row.topic.grade ? ` <small>${escapeHtml(gradeLabel(row.topic.grade))}</small>` : '';
  return `<a class="progress-topic" href="/topic/${encodeURIComponent(row.topic.slug)}">
    <span class="progress-topic-title">${escapeHtml(topicTitleOf(row.topic))}${gradeNote}</span>
    ${progressBar(row.percent)}
    <span class="progress-topic-count">${row.solved}/${row.total}</span>
  </a>`;
}

/* Страница собирается из того, что уже есть: каталог загружен при старте,
   остальное лежит в браузере. Запросов к базе она не делает. */
/* ── Блоки страницы «Мой прогресс» ────────────────────────────────── */

/* Лента активности — одна строка по неделям, а не сетка на год: за пять
   недель видно текущий ритм, а не общий стаж. */
const PROGRESS_ACTIVITY_WEEKS = 5;
/* Раздел взят меньше чем на треть — полосу красим как отстающую. */
const SUBJECT_WARN_PERCENT = 35;
/* Какой класс показан в «Освоении по разделам»: null — все классы,
   undefined — ученик ещё не выбирал, и берём его собственный класс. */
let progressSubjectScope;

/* «14 ч», пока часы целые, и «25 мин», пока часа не набралось. */
function formatProgressSpan(ms) {
  const tr = window.MathTasks.t || (k => k);
  const minutes = ms / 60000;
  if (minutes < 60) return tr('progress_unit_minutes', { value: Math.max(1, Math.round(minutes)) });
  const hours = ms / 3600000;
  const value = hours < 10 ? Math.round(hours * 10) / 10 : Math.round(hours);
  return tr('progress_unit_hours', { value: value.toLocaleString(progressLocale()) });
}

function progressDateLabel(at) {
  const tr = window.MathTasks.t || (k => k);
  const lib = window.MathTasksLib;
  const keyOf = date => (lib?.localDateKey ? lib.localDateKey(date) : new Date(date).toISOString().slice(0, 10));
  const key = keyOf(new Date(at));
  if (key === keyOf(new Date())) return tr('progress_date_today');
  if (key === keyOf(new Date(Date.now() - 86400000))) return tr('progress_date_yesterday');
  return new Date(at).toLocaleDateString(progressLocale(), { day: 'numeric', month: 'short' });
}

/* Четыре плитки сверху: сколько решено, серия, точность, время. */
function renderProgressStats(summary) {
  const tr = window.MathTasks.t || (k => k);
  const solvedSub = selectedGrade
    ? tr('progress_stat_solved_grade', {
        solved: (summary.grades.find(group => String(group.grade ?? '') === String(selectedGrade))?.solved) || 0,
        grade: gradeLabel(selectedGrade)
      })
    : (summary.total ? tr('progress_stat_solved_sub', { total: summary.total }) : '');

  const delta = summary.accuracy.deltaPoints;
  const accuracySub = delta === null
    ? (summary.solved ? tr('progress_accuracy_sub', { count: summary.firstTry }) : tr('progress_accuracy_empty'))
    : tr('progress_accuracy_delta', { sign: delta > 0 ? '+' : delta < 0 ? '−' : '±', points: Math.abs(delta) });

  const time = summary.time;
  const tiles = [
    {
      label: tr('progress_label_solved'),
      value: String(summary.solved),
      sub: solvedSub
    },
    {
      label: tr('progress_label_streak'),
      value: tr('progress_streak_value', { count: summary.streak.current }),
      sub: tr('progress_stat_streak_record', { best: summary.streak.best }),
      cls: summary.streak.today ? ' is-hot' : ''
    },
    {
      label: tr('progress_label_accuracy'),
      value: `${summary.accuracy.percent}%`,
      sub: accuracySub,
      subCls: delta === null ? '' : delta > 0 ? ' is-up' : delta < 0 ? ' is-down' : ''
    },
    {
      label: tr('progress_label_time'),
      value: time.totalMs ? formatProgressSpan(time.totalMs) : '—',
      sub: time.avgMs
        ? tr('progress_time_per_task', { value: formatProgressSpan(time.avgMs) })
        : tr('progress_time_empty')
    }
  ];

  return `<div class="progress-stats">${tiles.map(tile => `
    <div class="progress-stat${tile.cls || ''}">
      <span class="progress-stat-label">${escapeHtml(tile.label)}</span>
      <strong>${escapeHtml(tile.value)}</strong>
      ${tile.sub ? `<small class="progress-stat-sub${tile.subCls || ''}">${escapeHtml(tile.sub)}</small>` : ''}
    </div>`).join('')}</div>`;
}

/* Лента активности: строка клеток, разбитая промежутками по неделям. */
function renderProgressActivity(summary, activity) {
  const tr = window.MathTasks.t || (k => k);
  const lib = window.MathTasksLib;
  const level = count => (count <= 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 10 ? 3 : 4);
  const dayTitle = day => {
    const [y, m, d] = day.key.split('-').map(Number);
    const date = new Date(y, m - 1, d).toLocaleDateString(progressLocale(), { day: 'numeric', month: 'long' });
    return `${date}: ${tr('progress_day_count', { count: day.count })}`;
  };
  const weeks = lib.buildActivityWeeks(activity, lib.localDateKey(), PROGRESS_ACTIVITY_WEEKS);
  const strip = weeks.map(week => `<span class="progress-strip-week">${week.map(day => (day.future
    ? '<span class="progress-day is-future"></span>'
    : `<span class="progress-day l${level(day.count)}" title="${escapeHtml(dayTitle(day))}"></span>`)).join('')}</span>`).join('');
  const legend = [0, 1, 2, 3, 4].map(l => `<span class="progress-day l${l}"></span>`).join('');

  return `<section class="progress-block progress-card progress-activity">
    <div class="progress-block-head">
      <h2>${escapeHtml(tr('progress_activity_weeks', { weeks: PROGRESS_ACTIVITY_WEEKS }))}</h2>
      ${summary.streak.current ? `<span class="progress-streak-badge">${escapeHtml(tr('progress_streak_badge', { count: summary.streak.current }))}</span>` : ''}
    </div>
    <div class="progress-strip" role="img" aria-label="${escapeHtml(tr('progress_activity_aria', { days: summary.streak.activeDays }))}">${strip}</div>
    <p class="progress-legend">${escapeHtml(tr('progress_activity_less'))} ${legend} ${escapeHtml(tr('progress_activity_more'))}</p>
  </section>`;
}

/* Освоение по разделам. Переключатель «класс / все классы» показываем
   только когда класс выбран: иначе выбирать не из чего. */
function renderProgressSubjects(summary) {
  const tr = window.MathTasks.t || (k => k);
  const lib = window.MathTasksLib;
  const rows = lib.buildSubjectBreakdown(summary.rows, {
    grade: progressSubjectScope,
    subjects: summary.subjects
  });
  const totals = rows.reduce((acc, row) => ({ solved: acc.solved + row.solved, total: acc.total + row.total }), { solved: 0, total: 0 });
  const scopeLabel = progressSubjectScope ? gradeLabel(progressSubjectScope) : '';
  const sub = totals.total
    ? (scopeLabel
        ? tr('progress_subjects_sub', { solved: totals.solved, total: totals.total, grade: scopeLabel })
        : tr('progress_subjects_sub_all', { solved: totals.solved, total: totals.total }))
    : tr('progress_subjects_empty');

  const scope = selectedGrade
    ? `<div class="progress-scope">
        <button type="button" class="progress-scope-btn${progressSubjectScope ? ' is-active' : ''}" data-subject-scope="grade">${escapeHtml(gradeLabel(selectedGrade))}</button>
        <button type="button" class="progress-scope-btn${progressSubjectScope ? '' : ' is-active'}" data-subject-scope="all">${escapeHtml(tr('progress_scope_all'))}</button>
      </div>`
    : '';

  const bars = rows.map(row => {
    const title = row.subject ? loc(row.subject, 'title') : tr('progress_no_subject');
    return `<div class="progress-subject">
      <div class="progress-subject-head">
        <span class="progress-subject-name">${escapeHtml(title)}</span>
        <span class="progress-subject-count">${escapeHtml(tr('topic_progress_short', { solved: row.solved, total: row.total }))}</span>
      </div>
      <span class="progress-subject-bar${row.percent < SUBJECT_WARN_PERCENT ? ' is-warn' : ''}"><i style="width:${row.percent}%"></i></span>
    </div>`;
  }).join('');

  return `<section class="progress-block progress-card">
    <div class="progress-block-head">
      <h2>${escapeHtml(tr('progress_subjects_title'))}</h2>
      ${scope}
    </div>
    <p class="progress-block-sub">${escapeHtml(sub)}</p>
    <div class="progress-subjects">${bars}</div>
  </section>`;
}

/* Слабые места: темы, где ученик уже спотыкался. */
function renderProgressWeakSpots(summary) {
  const tr = window.MathTasks.t || (k => k);
  const rows = summary.weakSpots.map(row => `
    <div class="progress-weak">
      <div class="progress-weak-body">
        <strong>${escapeHtml(topicTitleOf(row.topic))}</strong>
        <small>${escapeHtml(tr('progress_weak_score', { correct: row.correct, attempted: row.attempted }))}${row.hinted ? ` · ${escapeHtml(tr('progress_weak_hint', { hinted: row.hinted, attempted: row.attempted }))}` : ''}</small>
      </div>
      <a class="progress-weak-link" href="/topic/${encodeURIComponent(row.topic.slug)}">${escapeHtml(tr('progress_weak_repeat'))}</a>
    </div>`).join('');

  return `<section class="progress-block progress-card">
    <div class="progress-block-head"><h2>${escapeHtml(tr('progress_weak_title'))}</h2></div>
    ${rows ? `<div class="progress-weaks">${rows}</div>` : `<p class="progress-block-sub">${escapeHtml(tr('progress_weak_empty'))}</p>`}
  </section>`;
}

/* Последние решения. Условия задач лежат в базе, а в журнале — только id,
   поэтому список дозаполняется после загрузки: так язык строк всегда
   текущий, а не тот, на котором задачу решали. */
async function fillProgressRecent(entries) {
  const host = document.querySelector('#progress-recent');
  if (!host) return;
  const tr = window.MathTasks.t || (k => k);
  const ids = entries.map(entry => entry.id);
  let tasks = [];
  if (ids.length && db) {
    const { data } = await db.from('tasks').select(TASK_SELECT).in('id', ids);
    tasks = data || [];
  }
  const byId = new Map(tasks.map(task => [Number(task.id), task]));
  const rows = entries.filter(entry => byId.has(entry.id));
  if (!rows.length) {
    host.innerHTML = `<p class="progress-block-sub">${escapeHtml(tr('progress_recent_empty'))}</p>`;
    return;
  }
  host.innerHTML = `<div class="progress-recents">${rows.map(entry => `
    <a class="progress-recent" href="/task/${entry.id}">
      <time datetime="${new Date(entry.at).toISOString()}">${escapeHtml(progressDateLabel(entry.at))}</time>
      <span class="math progress-recent-text" data-recent-id="${entry.id}"></span>
      <span class="progress-outcome is-${entry.outcome}">${escapeHtml(tr(`progress_outcome_${entry.outcome}`))}</span>
    </a>`).join('')}</div>`;
  host.querySelectorAll('[data-recent-id]').forEach(element => {
    const task = byId.get(Number(element.dataset.recentId));
    if (task) renderMath(element, loc(task, 'condition_latex'));
  });
  localizeLinks(host);
}

/* Переключатель «класс / все классы» в «Освоении по разделам». */
document.addEventListener('click', event => {
  const button = event.target.closest('[data-subject-scope]');
  if (!button) return;
  progressSubjectScope = button.dataset.subjectScope === 'all' ? null : selectedGrade;
  showProgress();
});

function showProgress() {
  showView('progress');
  const tr = window.MathTasks.t || (k => k);
  setMeta(tr('progress_title'), tr('progress_meta'));
  const root = document.querySelector('#progress-root');
  const lib = window.MathTasksLib;
  if (!root || !lib?.buildProgressSummary) return;
  if (progressSubjectScope === undefined) progressSubjectScope = selectedGrade;

  const s = lib.buildProgressSummary({
    solvedIds: getSolvedTasks(),
    topics: allTopics,
    topicTaskIds: topicTasksMap,
    wrongAttempts: getWrongAttemptCounts(),
    activity: getActivity(),
    controlWorks: getControlWorkStorage(),
    journal: getJournal(),
    subjects
  });
  const section = (title, body, extra = '') => `<section class="progress-block"><h2>${escapeHtml(title)}${extra}</h2>${body}</section>`;


  const startHref = selectedGrade ? `/grade/${encodeURIComponent(selectedGrade)}` : '/';
  const empty = s.solved || s.controlWorks.count
    ? ''
    : `<p class="progress-empty">${escapeHtml(tr('progress_empty'))} <a href="${startHref}">${escapeHtml(tr('progress_empty_link'))}</a></p>`;


  const continueBlock = s.inProgress.length
    ? section(tr('progress_continue_title'), `<div class="progress-list">${s.inProgress.slice(0, 6).map(row => progressTopicRow(row)).join('')}</div>`)
    : '';

  const order = (GRADES || []).map(String);
  const rank = group => {
    const index = order.indexOf(String(group.grade));
    return index < 0 ? order.length : index;
  };
  const grades = [...s.grades].sort((a, b) => rank(a) - rank(b)).map(group => `
    <details class="progress-grade${group.solved ? '' : ' is-empty'}">
      <summary>
        <span class="progress-grade-name">${escapeHtml(group.grade ? gradeLabel(group.grade) : tr('progress_no_grade'))}</span>
        ${progressBar(group.percent)}
        <span class="progress-grade-count">${group.solved}/${group.total}</span>
        <small>${escapeHtml(tr('progress_grade_topics', { done: group.topicsDone, total: group.topics.length }))}</small>
      </summary>
      <div class="progress-list progress-grade-topics">${group.topics.map(row => progressTopicRow(row, { withGrade: false })).join('')}</div>
    </details>`).join('');
  const gradesBlock = grades ? section(tr('progress_grades_title'), grades) : '';

  const earnedCount = s.achievements.filter(a => a.earned).length;
  const badges = s.achievements.map(a => `
    <li class="progress-badge${a.earned ? ' is-earned' : ''}">
      <span class="progress-badge-icon" aria-hidden="true">${a.icon}</span>
      <strong>${escapeHtml(tr(`ach_${a.id}`))}</strong>
      <small>${escapeHtml(tr(`ach_${a.id}_desc`))}</small>
      ${!a.earned && a.counted ? `<span class="progress-badge-count">${a.value}/${a.goal}</span>` : ''}
    </li>`).join('');
  const achievements = section(tr('progress_achievements_title'), `<ul class="progress-badges">${badges}</ul>`,
    ` <small>${escapeHtml(tr('progress_achievements_count', { earned: earnedCount, total: s.achievements.length }))}</small>`);

  const cwRows = s.controlWorks.list.map(result => {
    const topic = allTopics.find(item => item.id === result.topicId);
    if (!topic) return '';
    const slug = encodeURIComponent(topic.slug);
    const percent = result.percent ?? (result.total ? Math.round((result.score / result.total) * 100) : 0);
    const date = result.date ? new Date(result.date).toLocaleDateString(progressLocale(), { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    return `<div class="progress-cw">
      <a class="progress-cw-topic" href="/topic/${slug}">${escapeHtml(topicTitleOf(topic))}</a>
      ${date ? `<time datetime="${escapeHtml(result.date)}">${escapeHtml(date)}</time>` : '<span></span>'}
      <span class="progress-cw-grade${Number(result.grade) < 4 ? ' is-low' : ''}" title="${percent}%">${escapeHtml(tr('progress_cw_grade', { grade: result.grade }))}</span>
      <a class="progress-cw-retry" href="/control-work/${slug}">${escapeHtml(tr('progress_cw_retry'))}</a>
    </div>`;
  }).join('');
  const cwBlock = cwRows ? section(tr('progress_cw_title'), `<div class="progress-list">${cwRows}</div>`) : '';

  root.innerHTML = [
    renderProgressStats(s),
    empty,
    renderProgressActivity(s, getActivity()),
    `<div class="progress-columns">${renderProgressSubjects(s)}${renderProgressWeakSpots(s)}</div>`,
    `<section class="progress-block progress-card"><div class="progress-block-head"><h2>${escapeHtml(tr('progress_recent_title'))}</h2></div><div id="progress-recent"></div></section>`,
    continueBlock,
    gradesBlock,
    achievements,
    cwBlock,
    `<p class="progress-note">${escapeHtml(tr('progress_storage_note'))}</p>`
  ].join('');
  fillProgressRecent(s.recent);
}

/* ── Контрольные работы (Pārbaudes darbi) ─────────────────────────── */

function getControlWorkStorage() {
  try {
    const raw = localStorage.getItem('math-tasks:control-works');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getControlWorkResult(topicId) {
  const store = getControlWorkStorage();
  return store[topicId] || null;
}

function saveControlWorkResult(topicId, result) {
  try {
    const store = getControlWorkStorage();
    store[topicId] = {
      ...result,
      date: new Date().toISOString()
    };
    localStorage.setItem('math-tasks:control-works', JSON.stringify(store));
  } catch (err) {
    console.warn('Could not save control work result', err);
  }
}

function renderTopicControlWorkCard(topic, tasks) {
  const slot = document.querySelector('#topic-control-work-slot');
  if (!slot) return;
  const tr = window.MathTasks.t || (k => k);
  if (!tasks || tasks.length < MIN_CONTROL_WORK_TASKS) {
    slot.hidden = true;
    slot.innerHTML = '';
    return;
  }

  const prevResult = getControlWorkResult(topic.id);
  const cwTasks = window.MathTasksLib?.selectControlWorkTasks ? window.MathTasksLib.selectControlWorkTasks(tasks) : tasks.slice(0, 5);
  const cwCount = cwTasks.length;

  let statusBadge = '';
  if (prevResult) {
    statusBadge = `
      <div class="cw-card-status done">
        <span class="cw-status-icon">🏆</span>
        <span class="cw-status-text">${escapeHtml(tr('cw_status_done', { percent: prevResult.percent, grade: prevResult.grade }))}</span>
      </div>
    `;
  }

  slot.hidden = false;
  slot.innerHTML = `
    <div class="topic-control-work-card" id="topic-control-work">
      <div class="cw-card-top">
        <span class="cw-badge">${escapeHtml(tr('cw_badge'))}</span>
        ${statusBadge}
      </div>
      <div class="cw-card-main">
        <h3 class="cw-card-title">${escapeHtml(tr('cw_topic_card_title'))}</h3>
        <p class="cw-card-desc">${escapeHtml(tr('cw_topic_card_desc'))}</p>
        <ul class="cw-card-features">
          <li>⏱️ ${escapeHtml(tr('cw_feature_time'))}</li>
          <li>📝 ${escapeHtml(tr('cw_feature_tasks'))}</li>
          <li>📊 ${escapeHtml(tr('cw_feature_eval'))}</li>
        </ul>
      </div>
      <div class="cw-card-actions">
        <a href="/control-work/${encodeURIComponent(topic.slug)}" class="primary-button cw-start-btn">
          ${escapeHtml(prevResult ? tr('cw_retry_btn') : tr('btn_start_cw'))} · ${escapeHtml(tr('cw_tasks_count', { count: cwCount }))} →
        </a>
      </div>
    </div>
  `;
}

let currentCwTopic = null;
let currentCwTasks = [];
let currentCwUserAnswers = {};
let currentCwTimer = null;
let currentCwSubmitted = false;
let currentCwMode = 'cw'; // 'cw' — контрольная темы, 'exam' — пробный экзамен
let currentExamKind = null;
let currentExamSession = null;

/* ── Честный режим контрольной и экзамена ──────────────────────────
   Пока идёт работа, уход со страницы — другая вкладка, другое приложение,
   окно поверх браузера — и клавиша PrintScreen блокируют решение на
   минуту; время работы при этом идёт. Снимок экрана на телефоне браузер
   не видит вообще: ловится только уход в другое приложение, например
   чтобы снимком поделиться. Конец блокировки хранится в localStorage —
   перезагрузка страницы его не снимает. */
const CW_LOCK_KEY = 'math-tasks:cw-lock';
const CW_LOCK_MS = 60 * 1000;
let cwGuardObj = null;
let cwGuardActive = false;
let cwBlurTimer = null;
let cwLockTicker = null;

const cwGuard = () => (cwGuardObj ||= window.MathTasksLib.createFocusGuard({ lockMs: CW_LOCK_MS }));

function storedCwLock() {
  try {
    return Number(JSON.parse(localStorage.getItem(CW_LOCK_KEY) || '{}').lockedUntil) || 0;
  } catch {
    return 0;
  }
}

function beginCwGuard({ lockedUntil = 0, violations = 0 } = {}) {
  cwGuard().restore({ lockedUntil: Math.max(lockedUntil, storedCwLock()), violations });
  cwGuardActive = true;
  renderCwLock();
}

function endCwGuard() {
  cwGuardActive = false;
  clearTimeout(cwBlurTimer);
  renderCwLock();
}

const isCwLocked = () => cwGuardActive && cwGuard().remaining() > 0;

function onCwViolation() {
  const guard = cwGuard();
  try { localStorage.setItem(CW_LOCK_KEY, JSON.stringify({ lockedUntil: guard.lockedUntil })); } catch {}
  if (currentCwMode === 'exam' && currentExamSession) {
    currentExamSession.violations = guard.violations;
    currentExamSession.lockedUntil = guard.lockedUntil;
    saveExamSession();
  }
  renderCwLock();
}

/* Блокировка — экран поверх работы с обратным отсчётом; задания, поля
   ответа и «Сдать» на это время недоступны (inert). */
function renderCwLock() {
  const overlay = document.querySelector('#cw-lock');
  if (!overlay) return;
  const locked = isCwLocked();
  overlay.hidden = !locked;
  for (const selector of ['#cw-task-list', '#cw-sticky-bar', '#cw-actions-bar']) {
    const element = document.querySelector(selector);
    if (element) element.inert = locked;
  }
  clearInterval(cwLockTicker);
  if (!locked) return;
  const tick = () => {
    const rest = cwGuard().remaining();
    const time = document.querySelector('#cw-lock-time');
    if (time) time.textContent = window.MathTasksLib.formatTimerDisplay(Math.ceil(rest / 1000));
    if (rest <= 0) renderCwLock();
  };
  tick();
  cwLockTicker = setInterval(tick, 250);
}

document.addEventListener('visibilitychange', () => {
  if (!cwGuardActive) return;
  if (document.hidden) cwGuard().leave();
  else if (cwGuard().back()) onCwViolation();
});
window.addEventListener('blur', () => {
  if (!cwGuardActive) return;
  clearTimeout(cwBlurTimer);
  // Мгновенная потеря фокуса — клик по адресной строке, системное окно — не уход.
  cwBlurTimer = setTimeout(() => {
    if (cwGuardActive && !document.hasFocus()) cwGuard().leave();
  }, 1500);
});
window.addEventListener('focus', () => {
  clearTimeout(cwBlurTimer);
  if (cwGuardActive && cwGuard().back()) onCwViolation();
});
document.addEventListener('keyup', event => {
  if (cwGuardActive && event.key === 'PrintScreen') {
    cwGuard().strike();
    onCwViolation();
  }
});
// Закрыл вкладку посреди экзамена и открыл снова — это тоже уход.
window.addEventListener('pagehide', () => {
  if (cwGuardActive && currentCwMode === 'exam' && currentExamSession && !currentCwSubmitted) {
    currentExamSession.away = true;
    saveExamSession();
  }
});

/* Ушли с работы по ссылке внутри сайта: таймер и честный режим встают.
   Незаконченный экзамен запоминает уход — вернувшись, ученик получит ту
   же минуту блокировки, что и за другую вкладку. */
function leaveCwWork() {
  if (!cwGuardActive) return;
  if (currentCwMode === 'exam' && currentExamSession && !currentCwSubmitted) {
    currentExamSession.away = true;
    saveExamSession();
  }
  endCwGuard();
  if (currentCwTimer) currentCwTimer.stop();
}

/* Время работы: большие цифры в шапке и строка «время · отвечено · Сдать»,
   прилипающая к верху экрана. Последние 10 минут — жёлтым, последняя — красным. */
function showCwTime(seconds) {
  const text = window.MathTasksLib.formatTimerDisplay(seconds);
  for (const element of document.querySelectorAll('#cw-timer-display, #cw-sticky-time')) {
    element.textContent = text;
    element.classList.toggle('is-low', seconds <= 600 && seconds > 60);
    element.classList.toggle('warning', seconds <= 60 && seconds > 0);
  }
}

function startCwTimer(seconds) {
  if (currentCwTimer) currentCwTimer.stop();
  showCwTime(seconds);
  currentCwTimer = window.MathTasksLib.createExamTimer({ initialSeconds: seconds });
  currentCwTimer.on((event, state) => {
    if (event === 'tick') showCwTime(state.seconds);
    else if (event === 'finish' && !currentCwSubmitted) submitControlWork(true);
  });
  currentCwTimer.start();
}

function showCwWorkBars(on) {
  const bar = document.querySelector('#cw-sticky-bar');
  if (bar) bar.hidden = !on;
  const submitBtn = document.querySelector('#cw-submit-btn');
  if (submitBtn) submitBtn.hidden = !on;
  updateCwProgress();
}

function updateCwProgress() {
  const element = document.querySelector('#cw-sticky-progress');
  if (!element) return;
  const answered = currentCwTasks.filter(task => String(currentCwUserAnswers[task.id] || '').trim()).length;
  element.textContent = (window.MathTasks.t || (k => k))('cw_answered', { done: answered, total: currentCwTasks.length });
}

function rememberCwAnswer(taskId, value) {
  currentCwUserAnswers[taskId] = value;
  if (currentCwMode === 'exam' && currentExamSession) {
    currentExamSession.answers[taskId] = value;
    saveExamSession();
  }
  updateCwProgress();
}

/* «Сдать» при пустых ответах — только вторым нажатием: случайное касание
   на телефоне не должно сдать экзамен за час до конца. Без confirm():
   он уводит фокус со страницы и засчитался бы как уход. */
function requestCwSubmit(button) {
  if (currentCwSubmitted || isCwLocked()) return;
  document.querySelectorAll('.cw-answer-input').forEach(input => {
    const taskId = Number(input.dataset.taskId);
    if (taskId) currentCwUserAnswers[taskId] = input.value.trim();
  });
  const empty = currentCwTasks.filter(task => !String(currentCwUserAnswers[task.id] || '').trim()).length;
  if (empty && button.dataset.confirm !== '1') {
    const tr = window.MathTasks.t || (k => k);
    button.dataset.label = button.textContent;
    button.dataset.confirm = '1';
    button.textContent = tr('cw_submit_confirm', { count: empty });
    clearTimeout(button.confirmTimer);
    button.confirmTimer = setTimeout(() => {
      button.dataset.confirm = '';
      button.textContent = button.dataset.label;
    }, 4000);
    return;
  }
  submitControlWork();
}

/* Один экран на контрольную и экзамен: режим меняет плашку и описание
   в шапке и сбрасывает прошлую работу. */
function setCwMode(mode, kind = null) {
  endCwGuard();
  if (currentCwTimer) currentCwTimer.stop();
  currentCwMode = mode;
  currentExamKind = kind;
  if (mode !== 'exam') currentExamSession = null;
  currentCwTopic = null;
  currentCwTasks = [];
  currentCwUserAnswers = {};
  currentCwSubmitted = false;
  showCwWorkBars(false);
  const tr = window.MathTasks.t || (k => k);
  const badge = document.querySelector('.cw-badge');
  const badgeKey = mode === 'exam' ? 'exam_badge' : 'cw_badge';
  if (badge) {
    badge.dataset.i18n = badgeKey;
    badge.textContent = tr(badgeKey);
  }
  const desc = document.querySelector('#cw-desc');
  if (desc) {
    desc.dataset.i18n = 'cw_topic_card_desc';
    desc.textContent = tr('cw_topic_card_desc');
  }
  const resCard = document.querySelector('#cw-result-card');
  if (resCard) {
    resCard.hidden = true;
    resCard.innerHTML = '';
  }
}

/* ── Пробный экзамен ──────────────────────────────────────────────
   Тот же экран, что у контрольной: задания из всех тем уровня, таймер на
   всё время экзамена, автопроверка и оценка по 10-балльной шкале VISC.
   Сессия хранится в браузере: перезагрузка не сбрасывает ни вариант, ни
   ответы, ни время, ни блокировку. */
const EXAM_SESSION_KEY = 'math-tasks:exam-session';
const EXAM_RESULTS_KEY = 'math-tasks:exam-results';

function loadExamSession(kind) {
  try {
    const session = JSON.parse(localStorage.getItem(EXAM_SESSION_KEY) || 'null');
    return session && session.kind === kind && Array.isArray(session.ids) ? session : null;
  } catch {
    return null;
  }
}

function saveExamSession() {
  try {
    if (currentExamSession) localStorage.setItem(EXAM_SESSION_KEY, JSON.stringify(currentExamSession));
    else localStorage.removeItem(EXAM_SESSION_KEY);
  } catch {}
}

function saveExamResult(kind, result) {
  try {
    const list = JSON.parse(localStorage.getItem(EXAM_RESULTS_KEY) || '[]');
    list.unshift({ kind, ...result, at: Date.now() });
    localStorage.setItem(EXAM_RESULTS_KEY, JSON.stringify(list.slice(0, 30)));
  } catch {}
}

async function startExam(kind, { fresh = false } = {}) {
  showView('control-work');
  resetListBlocks();
  setCwMode('exam', kind);
  const tr = window.MathTasks.t || (k => k);
  const config = window.MathTasksLib.EXAM_KINDS[kind];
  const list = document.querySelector('#cw-task-list');
  const title = config ? tr(`home_exam_title_${kind}`) : tr('exam_not_found');

  const crumbs = document.querySelector('#cw-breadcrumb');
  if (crumbs) {
    crumbs.innerHTML = `<a href="/">${escapeHtml(tr('nav_home'))}</a><span class="crumb-sep">/</span>`
      + `<a href="/exams.html">${escapeHtml(tr('nav_exams'))}</a><span class="crumb-sep">/</span><span>${escapeHtml(title)}</span>`;
  }
  const titleEl = document.querySelector('#cw-title');
  if (titleEl) titleEl.textContent = title;
  const desc = document.querySelector('#cw-desc');
  if (!config) {
    if (desc) desc.textContent = '';
    if (list) list.innerHTML = `<p class="empty-state">${escapeHtml(tr('exam_not_found'))}</p>`;
    return;
  }
  const descText = tr('exam_desc', { count: config.tasks, minutes: config.minutes });
  if (desc) {
    delete desc.dataset.i18n;
    desc.textContent = descText;
  }
  setMeta(title, descText);
  showCwTime(config.minutes * 60);

  const session = fresh ? null : loadExamSession(kind);
  if (session) {
    await runExam(session);
    return;
  }
  if (list) {
    list.innerHTML = `
      <section class="exam-intro">
        <ul class="exam-rules">
          <li>${escapeHtml(tr('exam_rule_time', { minutes: config.minutes }))}</li>
          ${config.parts && config.parts.length > 1 ? `<li>${escapeHtml(tr('exam_rule_parts', { parts: config.parts.join(' + ') }))}</li>` : ''}
          <li>${escapeHtml(tr('exam_rule_tasks', { count: config.tasks }))}</li>
          <li>${escapeHtml(tr('exam_rule_guard'))}</li>
          <li>${escapeHtml(tr('exam_rule_save'))}</li>
        </ul>
        <button type="button" class="primary-button exam-start-btn" data-exam-start="${escapeHtml(kind)}">${escapeHtml(tr('exam_start_btn'))}</button>
      </section>`;
  }
}

// «Начать экзамен»: собрать вариант из всех тем уровня и запустить время.
async function beginExam(kind) {
  const tr = window.MathTasks.t || (k => k);
  const lib = window.MathTasksLib;
  const config = lib.EXAM_KINDS[kind];
  const list = document.querySelector('#cw-task-list');
  if (!config || !list) return;
  list.innerHTML = `<p class="empty-state">${escapeHtml(tr('state_loading_tasks'))}</p>`;
  const topicIds = allTopics.filter(topic => Number(topic.grade) === config.grade).map(topic => topic.id);
  const { data, error } = topicIds.length
    ? await lib.fetchAllRows(() => db.from('tasks').select(TASK_SELECT).eq('is_published', true).in('topic_id', topicIds).order('id'))
    : { data: [], error: null };
  if (error) {
    list.innerHTML = `<p class="empty-state">${escapeHtml(tr('err_load_tasks'))}</p>`;
    return;
  }
  const tasks = lib.selectExamTasks(data || [], { count: config.tasks });
  if (tasks.length < 3) {
    list.innerHTML = `<p class="empty-state">${escapeHtml(tr('exam_too_few'))}</p>`;
    return;
  }
  currentExamSession = {
    kind,
    ids: tasks.map(task => task.id),
    startedAt: Date.now(),
    durationSec: config.minutes * 60,
    answers: {},
    violations: 0,
    lockedUntil: 0
  };
  saveExamSession();
  await runExam(currentExamSession, tasks);
}

async function runExam(session, tasks = null) {
  const tr = window.MathTasks.t || (k => k);
  const list = document.querySelector('#cw-task-list');
  currentExamSession = session;
  if (!tasks) {
    const { data, error } = await db.from('tasks').select(TASK_SELECT).in('id', session.ids);
    if (error) {
      if (list) list.innerHTML = `<p class="empty-state">${escapeHtml(tr('err_load_tasks'))}</p>`;
      return;
    }
    const byId = new Map((data || []).map(task => [task.id, task]));
    tasks = session.ids.map(id => byId.get(id)).filter(Boolean);
  }
  // Задачи варианта сняли с публикации — начинаем заново, а не с пустым листом.
  if (!tasks.length) {
    currentExamSession = null;
    saveExamSession();
    await startExam(session.kind, { fresh: true });
    return;
  }
  currentCwTasks = tasks;
  currentCwUserAnswers = { ...(session.answers || {}) };
  renderControlWorkCards();
  showCwWorkBars(true);
  beginCwGuard({ lockedUntil: session.lockedUntil || 0, violations: session.violations || 0 });
  if (session.away) {
    session.away = false;
    cwGuard().strike();
    onCwViolation();
  }
  const remaining = session.durationSec - Math.floor((Date.now() - session.startedAt) / 1000);
  if (remaining <= 0) {
    submitControlWork(true);
    return;
  }
  startCwTimer(remaining);
}

async function startControlWork(slug) {
  showView('control-work');
  resetListBlocks();
  const tr = window.MathTasks.t || (k => k);
  setCwMode('cw');
  let topic = allTopics.find(item => item.slug === slug);
  if (!topic && db) {
    const { data } = await db.from('topics').select('*').eq('slug', slug).maybeSingle();
    if (data) topic = data;
  }
  if (!topic) {
    const list = document.querySelector('#cw-task-list');
    if (list) list.innerHTML = `<p class="empty-state">${escapeHtml(tr('err_load_tasks'))}</p>`;
    return;
  }

  currentActiveTopic = topic;
  if (topic.grade && selectedGrade !== topic.grade) {
    applyGrade(topic.grade);
  } else {
    renderSidebar();
  }

  const subject = subjectById(topic.subject_id);
  const topicTitle = topicTitleOf(topic);
  const subjectTitle = loc(subject, 'title');

  const crumbs = [[tr('nav_home') || 'Главная', '/']];
  if (topic.grade) crumbs.push([gradeLabel(topic.grade), `/grade/${topic.grade}`]);
  if (subject) crumbs.push([subjectTitle, `/subject/${encodeURIComponent(subject.slug)}`]);
  crumbs.push([topicTitle, `/topic/${encodeURIComponent(topic.slug)}`]);
  crumbs.push([tr('nav_control_works') || 'Контрольная работа', null]);

  const breadcrumbEl = document.querySelector('#cw-breadcrumb');
  if (breadcrumbEl) {
    breadcrumbEl.innerHTML = crumbs
      .map(([label, href]) => (href ? `<a href="${href}">${escapeHtml(label)}</a>` : `<span>${escapeHtml(label)}</span>`))
      .join('<span class="crumb-sep">/</span>');
  }

  const titleEl = document.querySelector('#cw-title');
  if (titleEl) {
    titleEl.textContent = tr('cw_mode_title', { topic: topicTitle });
  }
  setMeta(tr('cw_mode_title', { topic: topicTitle }), metaText('meta_cw_desc', { topic: topicTitle }));

  const cwList = document.querySelector('#cw-task-list');
  if (cwList) {
    cwList.innerHTML = `<p class="empty-state">${escapeHtml(tr('state_loading_tasks'))}</p>`;
  }

  const resCard = document.querySelector('#cw-result-card');
  if (resCard) {
    resCard.hidden = true;
    resCard.innerHTML = '';
  }
  const submitBtn = document.querySelector('#cw-submit-btn');
  if (submitBtn) submitBtn.hidden = false;

  const { data, error } = await db.from('tasks').select(TASK_SELECT)
    .eq('is_published', true).eq('topic_id', topic.id)
    .order('position').order('created_at', { ascending: true });

  if (error || !data || !data.length) {
    if (cwList) cwList.innerHTML = `<p class="empty-state">${escapeHtml(tr('err_load_tasks'))}</p>`;
    return;
  }
  /* Прямой заход по адресу минует и карточку темы, и каталог, поэтому
     порог проверяем ещё раз здесь. */
  if (data.length < MIN_CONTROL_WORK_TASKS) {
    if (submitBtn) submitBtn.hidden = true;
    if (cwList) cwList.innerHTML = `<p class="empty-state">${escapeHtml(tr('cw_too_few', { count: MIN_CONTROL_WORK_TASKS }))}</p>`;
    return;
  }

  const cwTasks = window.MathTasksLib?.selectControlWorkTasks ? window.MathTasksLib.selectControlWorkTasks(data) : data.slice(0, 5);
  currentCwTopic = topic;
  currentCwTasks = cwTasks;
  currentCwUserAnswers = {};
  currentCwSubmitted = false;

  // Таймер на 40 минут и честный режим — с первой секунды работы.
  renderControlWorkCards();
  showCwWorkBars(true);
  startCwTimer(40 * 60);
  beginCwGuard();
}

function renderControlWorkCards() {
  const cwList = document.querySelector('#cw-task-list');
  if (!cwList) return;
  const tr = window.MathTasks.t || (k => k);

  cwList.innerHTML = currentCwTasks.map((task, idx) => {
    const taskTitle = loc(task, 'title');
    const diff = task.difficulty;
    const val = currentCwUserAnswers[task.id] || '';
    const figure = task.condition_image ? `<img class="task-figure" src="${imageUrl(task.condition_image)}" alt="${escapeHtml(taskTitle)}" />` : '';

    return `
      <article class="cw-task-card" data-task-id="${task.id}" id="cw-task-${task.id}">
        <div class="cw-task-header">
          <span class="cw-task-num">№ ${idx + 1}</span>
          ${difficultyBadge(diff)}
        </div>
        <div class="cw-task-body">
          <div class="math cw-task-condition" data-cw-condition="${task.id}"></div>
          ${figure}
        </div>
        <div class="cw-task-answer-area">
          <div class="quick-math-bar" aria-label="Quick Math">
            <span class="quick-math-bar-label" title="Quick Math">${escapeHtml(tr('quick_math_label'))}</span>
            <button type="button" class="quick-math-btn" data-cw-insert="√(" title="√x">√x</button>
            <button type="button" class="quick-math-btn" data-cw-insert="²" title="x²">x²</button>
            <button type="button" class="quick-math-btn" data-cw-insert="^" title="xⁿ">xⁿ</button>
            <button type="button" class="quick-math-btn" data-cw-insert="/" title="/">/</button>
            <button type="button" class="quick-math-btn" data-cw-insert="π" title="π">π</button>
            <button type="button" class="quick-math-btn" data-cw-insert="±" title="±">±</button>
            <button type="button" class="quick-math-btn" data-cw-insert="|" title="|x|">|x|</button>
            <button type="button" class="quick-math-btn" data-cw-insert="(" title="( )">( )</button>
            <button type="button" class="quick-math-btn" data-cw-insert="x" title="x">x</button>
            <button type="button" class="quick-math-btn" data-cw-insert="·" title="·">·</button>
            <button type="button" class="quick-math-btn" data-cw-insert="≤" title="≤">≤</button>
            <button type="button" class="quick-math-btn" data-cw-insert="≥" title="≥">≥</button>
          </div>
          <div class="cw-answer-input-wrap">
            <label for="cw-input-${task.id}" class="cw-input-label">${escapeHtml(tr('atbilde') || 'Ответ')}:</label>
            <input type="text" id="cw-input-${task.id}" class="cw-answer-input" data-task-id="${task.id}" placeholder="${escapeHtml(tr('self_check_placeholder'))}" value="${escapeHtml(val)}" autocomplete="off" />
          </div>
        </div>
        <div class="cw-task-review" data-cw-review="${task.id}" hidden></div>
      </article>
    `;
  }).join('');

  cwList.querySelectorAll('[data-cw-condition]').forEach(el => {
    const taskId = Number(el.dataset.cwCondition);
    const task = currentCwTasks.find(t => t.id === taskId);
    if (task) {
      renderMath(el, loc(task, 'condition_latex'));
    }
  });
}

function submitControlWork(isTimeout = false) {
  if (currentCwSubmitted || !currentCwTasks.length) return;
  currentCwSubmitted = true;
  const tr = window.MathTasks.t || (k => k);

  let elapsedSec = 40 * 60;
  if (currentCwTimer) {
    elapsedSec = currentCwTimer.getElapsed();
    currentCwTimer.stop();
  }
  // Экзамен мог продолжиться после перезагрузки: время — от начала сессии.
  if (currentCwMode === 'exam' && currentExamSession) {
    elapsedSec = Math.min(currentExamSession.durationSec, Math.round((Date.now() - currentExamSession.startedAt) / 1000));
  }
  const violations = cwGuard().violations;
  endCwGuard();
  showCwWorkBars(false);

  document.querySelectorAll('.cw-answer-input').forEach(input => {
    const taskId = Number(input.dataset.taskId);
    if (taskId) currentCwUserAnswers[taskId] = input.value.trim();
  });

  let correctCount = 0;
  const gradedResults = currentCwTasks.map(task => {
    const userAns = currentCwUserAnswers[task.id] || '';
    const correctAns = loc(task, 'answer_latex') || '';
    const isCorrect = checkTaskAnswer(userAns, correctAns, loc(task, 'answer_check'));
    if (isCorrect) correctCount++;
    return { task, userAns, correctAns, isCorrect };
  });

  /* Функция отдаёт подпись на двух языках отдельными полями; какая нужна,
     знает только интерфейс. Пустая строка лучше слова «undefined». */
  const gradeLevelLabel = info => {
    const lang = window.MathTasks?.getLang ? window.MathTasks.getLang() : 'ru';
    return (lang === 'lv' ? info?.levelLv : info?.levelRu) || info?.level || '';
  };

  const gradeInfo = window.MathTasksLib?.calculateControlWorkGrade ? window.MathTasksLib.calculateControlWorkGrade(correctCount, currentCwTasks.length) : {
    score: correctCount,
    total: currentCwTasks.length,
    percent: Math.round((correctCount / currentCwTasks.length) * 100),
    grade: Math.round((correctCount / currentCwTasks.length) * 10),
    level: ''
  };

  if (currentCwTopic) {
    saveControlWorkResult(currentCwTopic.id, {
      score: gradeInfo.score,
      total: gradeInfo.total,
      grade: gradeInfo.grade,
      percent: gradeInfo.percent,
      timeSpentSec: elapsedSec
    });
  }
  if (currentCwMode === 'exam' && currentExamKind) {
    saveExamResult(currentExamKind, {
      score: gradeInfo.score,
      total: gradeInfo.total,
      grade: gradeInfo.grade,
      percent: gradeInfo.percent,
      timeSpentSec: elapsedSec,
      violations
    });
    currentExamSession = null;
    saveExamSession();
  }

  const resCard = document.querySelector('#cw-result-card');
  if (resCard) {
    resCard.hidden = false;
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    const timeFormatted = `${mins} мин ${secs < 10 ? '0' : ''}${secs} сек`;

    resCard.innerHTML = `
      <div class="cw-result-inner">
        <div class="cw-result-grade-badge grade-${gradeInfo.grade}">
          <span class="cw-grade-val">${gradeInfo.grade}</span>
          <span class="cw-grade-scale">/ 10</span>
        </div>
        <div class="cw-result-info">
          <h2 class="cw-result-title">${escapeHtml(tr(currentCwMode === 'exam' ? 'exam_result_heading' : 'cw_result_heading'))}</h2>
          <div class="cw-result-stats">
            <div class="cw-result-stat">
              <strong>${escapeHtml(tr('cw_score_line', { correct: gradeInfo.score, total: gradeInfo.total, percent: gradeInfo.percent }))}</strong>
            </div>
            <div class="cw-result-stat">
              <strong>${escapeHtml(tr('cw_grade_line', { grade: gradeInfo.grade, level: gradeLevelLabel(gradeInfo) }))}</strong>
            </div>
            <div class="cw-result-stat">
              <span>${escapeHtml(tr('cw_time_spent_line', { time: timeFormatted }))}</span>
            </div>
            ${violations ? `<div class="cw-result-stat cw-result-violations"><span>${escapeHtml(tr('cw_violations_line', { count: violations }))}</span></div>` : ''}
          </div>
          <p class="cw-result-notice">💡 ${escapeHtml(tr('cw_solutions_unlocked'))}</p>
        </div>
      </div>
      <div class="cw-result-footer">
        <button type="button" class="primary-button" id="btn-cw-retry">${escapeHtml(tr('cw_retry_btn'))}</button>
        ${currentCwMode === 'exam'
          ? `<a href="/exams.html" class="secondary-button" id="btn-cw-back">${escapeHtml(tr('exam_back'))}</a>`
          : `<a href="/topic/${encodeURIComponent(currentCwTopic ? currentCwTopic.slug : '')}" class="secondary-button" id="btn-cw-back">${escapeHtml(tr('cw_back_to_topic'))}</a>`}
      </div>
    `;
  }

  const submitBtn = document.querySelector('#cw-submit-btn');
  if (submitBtn) submitBtn.hidden = true;

  gradedResults.forEach(({ task, userAns, correctAns, isCorrect }) => {
    const card = document.querySelector(`#cw-task-${task.id}`);
    if (!card) return;

    card.classList.add(isCorrect ? 'cw-is-correct' : 'cw-is-wrong');
    const input = card.querySelector('.cw-answer-input');
    if (input) input.disabled = true;

    const quickBar = card.querySelector('.quick-math-bar');
    if (quickBar) quickBar.hidden = true;

    const reviewEl = card.querySelector(`[data-cw-review="${task.id}"]`);
    if (reviewEl) {
      reviewEl.hidden = false;
      const statusBadge = isCorrect
        ? `<span class="cw-eval-badge success">✅ ${escapeHtml(tr('self_check_success'))}</span>`
        : `<span class="cw-eval-badge wrong">❌ ${escapeHtml(tr('self_check_error'))}</span>`;

      const solutionLatex = loc(task, 'solution_latex');
      const solImg = task.solution_image ? `<img class="task-figure" src="${imageUrl(task.solution_image)}" alt="Solution figure" />` : '';

      reviewEl.innerHTML = `
        <div class="cw-eval-row">
          ${statusBadge}
          <div class="cw-review-answers">
            ${!isCorrect ? `<div class="cw-user-ans"><span>${escapeHtml(tr('your_answer') || 'Ваш ответ')}:</span> <code>${escapeHtml(userAns || '—')}</code></div>` : ''}
            <div class="cw-correct-ans">
              <span>${escapeHtml(tr('atbilde') || 'Правильный ответ')}:</span>
              <div class="math cw-correct-math" data-cw-ans="${task.id}"></div>
            </div>
          </div>
        </div>
        <details class="cw-solution-dropdown" open>
          <summary class="cw-solution-summary">${escapeHtml(tr('atrisinajums') || 'Разбор решения')}</summary>
          <div class="cw-solution-content">
            <div class="math cw-solution-math" data-cw-sol="${task.id}"></div>
            ${solImg}
          </div>
        </details>
      `;

      const ansEl = reviewEl.querySelector(`[data-cw-ans="${task.id}"]`);
      if (ansEl) renderMath(ansEl, correctAns);

      const solEl = reviewEl.querySelector(`[data-cw-sol="${task.id}"]`);
      if (solEl && solutionLatex) renderMath(solEl, solutionLatex);
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function showControlWorksCatalog() {
  showView('control-works');
  const tr = window.MathTasks.t || (k => k);
  setMeta(tr('cw_catalog_title'), tr('cw_catalog_desc'));
  renderSidebar();

  const container = document.querySelector('#cw-catalog-list');
  if (!container) return;

  const topicsWithTasks = allTopics.filter(topic => (taskCounts.get(topic.id) || 0) >= MIN_CONTROL_WORK_TASKS);

  if (!topicsWithTasks.length) {
    container.innerHTML = `<p class="empty-state">${escapeHtml(tr('state_loading_tasks'))}</p>`;
    return;
  }

  const stages = [
    {
      id: 'sakumskola',
      title: tr('stage_sakumskola') || '1–4 классы (Начальная школа)',
      filter: t => {
        const g = getTopicGradeBucket(t);
        return g >= 1 && g <= 4;
      }
    },
    {
      id: 'pamatskola1',
      title: tr('stage_pamatskola1') || '5–6 классы',
      filter: t => {
        const g = getTopicGradeBucket(t);
        return g >= 5 && g <= 6;
      }
    },
    {
      id: 'pamatskola2',
      title: tr('stage_pamatskola2') || '7–9 классы (Основная школа)',
      filter: t => {
        const g = getTopicGradeBucket(t);
        return g >= 7 && g <= 9;
      }
    },
    /* Три уровня старшей школы разведены по секциям: нумерация тем в
       каждом своя, с единицы, и в общем списке «1. Иррациональные
       уравнения» стояло рядом с «1. Числовые расчёты» из другого курса —
       различить их было нечем. */
    {
      id: 'visparigais',
      title: tr('grade_visparigais') || 'Vispārīgais līmenis',
      filter: t => getTopicGradeBucket(t) === 10
    },
    {
      id: 'optimalais',
      title: tr('grade_matematika_1') || 'Matemātika I (Optimālais)',
      filter: t => getTopicGradeBucket(t) === 11
    },
    {
      id: 'augstakais',
      title: tr('grade_matematika_2') || 'Matemātika II (Augstākais)',
      filter: t => getTopicGradeBucket(t) === 12
    }
  ];

  const html = stages.map(stage => {
    const stageTopics = topicsWithTasks.filter(stage.filter);
    if (!stageTopics.length) return '';

    const cardsHtml = stageTopics.map(topic => {
      const subject = subjectById(topic.subject_id);
      const title = topicTitleOf(topic);
      const count = taskCounts.get(topic.id) || 0;
      const prevResult = getControlWorkResult(topic.id);
      const grade = topic.grade ? gradeLabel(topic.grade) : '';

      let statusHtml = `<span class="cw-cat-pill">⏱️ ${escapeHtml(tr('cw_minutes'))}</span>`;
      if (prevResult) {
        statusHtml = `<span class="cw-cat-pill done">🏆 ${prevResult.percent}% (${prevResult.grade}/10)</span>`;
      }

      return `
        <div class="cw-catalog-card${prevResult ? ' is-passed' : ''}">
          <div class="cw-cat-top">
            <span class="tag ${tagClass(subject)}">${escapeHtml(loc(subject, 'title') || tr('subject_fallback'))}</span>
            ${grade ? `<span class="grade-badge">${grade}</span>` : ''}
            ${statusHtml}
          </div>
          <h3 class="cw-cat-title"><a href="/control-work/${encodeURIComponent(topic.slug)}">${escapeHtml(title)}</a></h3>
          <p class="cw-cat-desc">${escapeHtml(loc(topic, 'description') || '')}</p>
          <div class="cw-cat-footer">
            <span class="cw-cat-count">${count} ${tr('tasks_word') || 'заданий в теме'}</span>
            <a href="/control-work/${encodeURIComponent(topic.slug)}" class="secondary-button cw-cat-btn">
              ${prevResult ? escapeHtml(tr('cw_retry_btn')) : escapeHtml(tr('btn_start_cw_short'))} →
            </a>
          </div>
        </div>
      `;
    }).join('');

    return `
      <section class="cw-catalog-stage">
        <h2 class="cw-stage-heading">${escapeHtml(stage.title)}</h2>
        <div class="cw-catalog-grid">
          ${cardsHtml}
        </div>
      </section>
    `;
  }).filter(Boolean).join('');

  container.innerHTML = html || `<p class="empty-state">Тем пока нет.</p>`;
}

/* ── Поиск ────────────────────────────────────────────────────────── */

const sanitize = window.MathTasksLib.sanitizeSearch;

let searchAcrossGrades = false;

async function showSearch(rawQuery, acrossGrades) {
  const query = rawQuery.trim();
  searchAcrossGrades = acrossGrades;
  showView('list');
  resetListBlocks();
  if (searchInput.value !== query) searchInput.value = query;

  const scoped = selectedGrade && !acrossGrades;
  const crumbs = [[(window.MathTasks.t || (k => k))('nav_home'), '/'], ['Поиск', null]];

  if (query.length < 2) {
    fillListHeader({ crumbs, title: 'Поиск', description: 'Введите хотя бы два символа.' });
    return;
  }

  const needle = query.toLowerCase();
  const matchesText = topic => topic.title.toLowerCase().includes(needle) || (topic.description || '').toLowerCase().includes(needle);
  const foundTopics = allTopics.filter(topic => matchesText(topic) && (!scoped || topic.grade === selectedGrade));

  fillListHeader({ crumbs, title: `Поиск: «${query}»` });
  setMeta(metaText('meta_search_title', { query }), metaText('meta_search_desc', { query }));
  // Ищем во всех классах — значит, у каждого результата видно, к какому классу он относится.
  renderTopicCards(listTopics, foundTopics, !scoped);
  listTasks.innerHTML = `<p class="empty-state">${(window.MathTasks.t || (k => k))('state_searching')}</p>`;

  // Поиск по кросс-тегам
  const matchedTags = allTags.filter(t => {
    const tSlug = (t.slug || '').toLowerCase();
    const tTitle = (t.title || '').toLowerCase();
    const tTitleLv = (t.title_lv || '').toLowerCase();
    return tSlug.includes(needle) || tTitle.includes(needle) || tTitleLv.includes(needle);
  });

  let taggedTaskIds = [];
  if (hasTagsSupport && matchedTags.length > 0) {
    const matchedTagIds = matchedTags.map(t => t.id).filter(Boolean);
    if (matchedTagIds.length > 0) {
      try {
        const { data: tagLinks } = await db.from('task_tags').select('task_id').in('tag_id', matchedTagIds);
        if (tagLinks && tagLinks.length > 0) {
          taggedTaskIds = [...new Set(tagLinks.map(l => l.task_id))];
        }
      } catch (e) {
        console.warn('Ошибка поиска по тегам:', e);
      }
    }
  }

  const safe = sanitize(query);
  let request = db.from('tasks').select(TASK_SELECT).eq('is_published', true);
  if (scoped) request = request.eq('grade', selectedGrade);

  const orClauses = [];
  if (safe) {
    orClauses.push(`title.ilike.*${safe}*,condition_latex.ilike.*${safe}*,answer_latex.ilike.*${safe}*,answer_latex_lv.ilike.*${safe}*,solution_latex.ilike.*${safe}*`);
  }
  if (taggedTaskIds.length > 0) {
    orClauses.push(`id.in.(${taggedTaskIds.slice(0, 100).join(',')})`);
  }
  if (orClauses.length > 0) {
    request = request.or(orClauses.join(','));
  }

  const { data, error } = await request.order('created_at', { ascending: false }).limit(100);
  if (error) {
    console.warn('Поиск не удался.', error);
    listTasks.innerHTML = `<p class="empty-state">${(window.MathTasks.t || (k => k))('err_search')}</p>`;
    return;
  }

  const tasks = data || [];
  const counts = [
    matchedTags.length ? `тегов: ${matchedTags.length}` : '',
    foundTopics.length ? `тем: ${foundTopics.length}` : '',
    `задач: ${tasks.length}`
  ].filter(Boolean).join(', ');
  const where = scoped ? (window.MathTasks.t || (k => k))('search_scope_grade', { grade: selectedGrade }) : (window.MathTasks.t || (k => k))('search_scope_all');
  // Из класса всегда есть выход: иначе человек решит, что задачи просто нет.
  const escape = scoped
    ? `<a class="search-escape" href="/search?q=${encodeURIComponent(query)}&all=1">${escapeHtml((window.MathTasks.t || (k => k))('search_all_grades'))}</a>`
    : '';

  const matchedTagsHtml = matchedTags.length > 0 ? `
    <div class="search-matched-tags">
      <span class="search-matched-tags-label">${loc({ title: 'Кросс-теги', title_lv: 'Krustbirkas' }, 'title')}:</span>
      ${matchedTags.map(t => `<a class="task-tag-chip" href="/tag/${encodeURIComponent(t.slug)}" title="${escapeHtml(loc(t, 'description') || '')}">#${escapeHtml(loc(t, 'title'))}</a>`).join('')}
    </div>
  ` : '';

  document.querySelector('#list-meta').innerHTML = `
    <span class="search-count">${(window.MathTasks.t || (k => k))('search_found', { where, counts })}</span>${escape}
    ${matchedTagsHtml}
  `;

  renderTaskList(listTasks, tasks, (foundTopics.length || matchedTags.length)
    ? 'Задач с таким текстом нет, но есть подходящие темы или теги выше.'
    : 'Ничего не нашлось. Попробуйте другое слово.', { showGrade: !scoped, highlightQuery: query });
}

/* Историю не засоряем: во время набора адрес заменяем, а не добавляем запись,
   поэтому маршрут вызываем вручную — hashchange при replaceState не срабатывает. */
const goSearch = () => {
  const query = searchInput.value.trim();
  if (query.length < 2) {
    if (appPath() === '/search') navigate('/', { replace: true });
    return;
  }
  navigate(`/search?q=${encodeURIComponent(query)}${searchAcrossGrades ? '&all=1' : ''}`, { replace: true });
};

let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(goSearch, 350);
});
searchInput.addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  clearTimeout(searchTimer);
  goSearch();
});

/* ── Заголовок и описание страницы ────────────────────────────────── */

/* Google исполняет JS и увидит эти значения. Превью ссылок в мессенджерах —
   нет: они читают только исходную разметку, поэтому для них понадобится
   подстановка метатегов на стороне сервера. */
const SITE_NAME = 'MathTasks';
const descriptionTag = document.querySelector('meta[name="description"]');
const ogTitleTag = document.querySelector('meta[property="og:title"]');
const ogDescriptionTag = document.querySelector('meta[property="og:description"]');

function setMeta(title, description) {
  const full = title ? `${title} — ${SITE_NAME}` : metaText('meta_site_title');
  document.title = full;
  if (descriptionTag && description) descriptionTag.setAttribute('content', description);
  if (ogTitleTag) ogTitleTag.setAttribute('content', full);
  if (ogDescriptionTag && description) ogDescriptionTag.setAttribute('content', description);
}

/* ── Страница отдельной задачи ────────────────────────────────────── */

// Адрес вида /task/12-kvadratnoe-uravnenie: разбираем только число,
// слаг нужен человеку и поисковику, отдельной колонки под него не заводим.
async function showTask(rawId) {
  showView('list');
  resetListBlocks();
  const id = Number.parseInt(rawId, 10);
  const notFound = () => fillListHeader({
    crumbs: [[(window.MathTasks.t || (k => k))('nav_home'), '/']],
    title: 'Задача не найдена',
    description: 'Возможно, её удалили или ссылка устарела.'
  });
  if (!Number.isFinite(id)) { notFound(); setMeta(metaText('meta_not_found_task')); return; }

  listTasks.innerHTML = `<p class="empty-state">${(window.MathTasks.t || (k => k))('state_loading_task')}</p>`;
  const { data, error } = await db.from('tasks').select(TASK_SELECT)
    .eq('is_published', true).eq('id', id).limit(1);
  const task = data?.[0];
  if (error || !task) { notFound(); listTasks.innerHTML = ''; setMeta(metaText('meta_not_found_task')); return; }

  const topic = allTopics.find(item => item.id === task.topic_id);
  const subject = topic ? subjectById(topic.subject_id) : null;
  const grade = task.grade ?? topic?.grade;
  currentActiveTopic = topic || null;
  if (grade && selectedGrade !== grade) {
    applyGrade(grade);
  } else {
    renderSidebar();
  }
  const taskNum = taskNumber(task);
  if (topic) {
    rememberPlace(topic.id, taskNum);
  }
  const tr = window.MathTasks.t || (k => k);
  const crumbsTaskTitle = `${tr('task_prefix') || 'Задача'} №${taskNum}`;
  const topicTitle = topic ? topicTitleOf(topic) : '';
  const subjectTitle = loc(subject, 'title');

  const crumbs = [[tr('nav_home'), '/']];
  if (grade) crumbs.push([gradeLabel(grade), `/grade/${grade}`]);
  if (subject) crumbs.push([subjectTitle, `/subject/${encodeURIComponent(subject.slug)}`]);
  if (topic) crumbs.push([topicTitle, `/topic/${encodeURIComponent(topic.slug)}`]);
  crumbs.push([crumbsTaskTitle, null]);

  fillListHeader({
    crumbs,
    title: crumbsTaskTitle,
    description: '',
    meta: grade ? `<span class="grade-badge">${gradeLabel(grade)}</span>` : ''
  });
  /* Описание — из условия задачи, тем же текстом, что отдаёт воркер
     (worker/seo.js): у сотен задач оно иначе было одинаковым. */
  const taskDesc = window.MathTasksLib?.taskDescription
    ? window.MathTasksLib.taskDescription({
      condition: loc(task, 'condition_latex'),
      number: Number(task.position) > 0 ? Number(task.position) : null,
      topicTitle,
      lang: getLang()
    })
    : `${crumbsTaskTitle}: условие, ответ и подробное решение.${topic ? ` Тема «${topicTitle}».` : ''}`;
  setMeta(
    topic ? `${crumbsTaskTitle} — ${topicTitle}${grade ? `, ${gradeLabel(grade)}` : ''}` : crumbsTaskTitle,
    taskDesc
  );
  renderTaskList(listTasks, [task], '', { showTopicLink: false, showGrade: false, linkTitle: false });
  await renderTaskNeighbours(task);
  await renderSimilarTasks(task);
}

/* Ученик, решивший одну задачу, обычно готов решить вторую — поэтому под
   разбором показываем несколько задач той же темы. Сначала того же уровня
   сложности, потом остальные: подборка «ещё такие же» полезнее случайной. */
async function renderSimilarTasks(task) {
  document.querySelector('#similar-tasks')?.remove();
  if (!task.topic_id || !db) return;
  const tr = window.MathTasks.t || (k => k);

  const cols = multilingualColumns ? 'id, title, title_lv, difficulty, position' : 'id, title, difficulty, position';
  const { data, error } = await db.from('tasks').select(cols)
    .eq('is_published', true).eq('topic_id', task.topic_id).neq('id', task.id)
    .order('position').order('created_at', { ascending: true });
  if (error || !data || !data.length) return;

  const sameLevel = data.filter(t => t.difficulty === task.difficulty);
  const rest = data.filter(t => t.difficulty !== task.difficulty);
  const picked = sameLevel.concat(rest).slice(0, 4);
  if (!picked.length) return;

  const box = document.createElement('section');
  box.id = 'similar-tasks';
  box.className = 'similar-tasks';
  box.innerHTML = `<h2 class="similar-title">${escapeHtml(tr('similar_tasks'))}</h2>
    <ul class="similar-list">${picked.map(t => `<li>
      <a href="${taskPath(t)}">
        <span class="similar-name">${escapeHtml(loc(t, 'title'))}</span>
        ${t.difficulty ? `<span class="similar-diff">${escapeHtml(t.difficulty)}</span>` : ''}
      </a></li>`).join('')}</ul>`;
  (document.querySelector('#task-nav') || listTasks).after(box);
}

// Разбор темы читают подряд, поэтому переход к соседней задаче важнее поиска.
async function renderTaskNeighbours(task) {
  document.querySelector('#task-nav')?.remove();
  if (!task.topic_id) return;
  const { data } = await db.from('tasks').select(multilingualColumns ? 'id, title, title_lv' : 'id, title')
    .eq('is_published', true).eq('topic_id', task.topic_id)
    .order('position').order('created_at', { ascending: true });
  const siblings = data || [];
  const index = siblings.findIndex(item => item.id === task.id);
  if (index === -1 || siblings.length < 2) return;
  const link = (item, label, css) => (item
    ? `<a class="task-nav-link ${css}" href="${taskPath(item)}"><span>${label}</span><strong>${escapeHtml(loc(item, 'title'))}</strong></a>`
    : '');
  const nav = document.createElement('nav');
  nav.id = 'task-nav';
  nav.className = 'task-nav';
  nav.setAttribute('aria-label', 'Соседние задачи темы');
  nav.innerHTML = link(siblings[index - 1], (window.MathTasks.t || (k => k))('nav_prev_task'), 'prev') + link(siblings[index + 1], (window.MathTasks.t || (k => k))('nav_next_task'), 'next');
  if (nav.innerHTML) listTasks.after(nav);
}

/* ── Кросс-теги (VISC / Skola2030) ────────────────────────────────── */

async function showTagsList() {
  showView('list');
  resetListBlocks();
  const tr = window.MathTasks.t || (k => k);
  const currentLang = window.MathTasks?.getLang ? window.MathTasks.getLang() : 'ru';
  const listTitle = tr('tags_label') || (currentLang === 'lv' ? 'Krustbirkas' : 'Кросс-теги');
  const crumbs = [
    [tr('nav_home'), '/'],
    [listTitle, null]
  ];
  const listDesc = currentLang === 'lv'
    ? '23 tēmu krosstagi saskaņā ar VISC un Skola2030 standartu ļauj atrast uzdevumus pēc metodēm un prasmēm starp dažādām tēmām un klasēm.'
    : '23 кросс-тега стандарта VISC / Skola2030 позволяют находить задачи по общим методам и математическим навыкам на стыке тем и классов.';

  fillListHeader({
    crumbs,
    title: listTitle,
    description: listDesc
  });
  setMeta(listTitle, listDesc);
  renderSidebar();

  const list = allTags.length ? allTags : (window.MathTasksLib?.CROSS_TAGS || []);
  const metaEl = document.querySelector('#list-meta');
  if (metaEl) {
    metaEl.innerHTML = `<span class="search-count">${list.length} ${currentLang === 'lv' ? 'birkas' : 'тегов'}</span>`;
  }

  listTasks.innerHTML = `
    <div class="tags-catalog-grid">
      ${list.map(tag => {
        const title = loc(tag, 'title') || tag.title || tag.slug;
        const titleOther = currentLang === 'lv' ? tag.title : tag.title_lv;
        const desc = loc(tag, 'description') || '';
        return `
          <a class="tag-catalog-card" href="/tag/${encodeURIComponent(tag.slug)}">
            <div class="tag-catalog-header">
              <span class="tag-catalog-chip">#${escapeHtml(title)}</span>
              ${titleOther && titleOther !== title ? `<span class="tag-catalog-alt">${escapeHtml(titleOther)}</span>` : ''}
            </div>
            ${desc ? `<p class="tag-catalog-desc">${escapeHtml(desc)}</p>` : ''}
          </a>
        `;
      }).join('')}
    </div>
  `;
}

async function showTag(slug) {
  showView('list');
  resetListBlocks();
  const tr = window.MathTasks.t || (k => k);
  const currentLang = window.MathTasks?.getLang ? window.MathTasks.getLang() : 'ru';
  const tagsListLabel = tr('tags_label') || (currentLang === 'lv' ? 'Krustbirkas' : 'Кросс-теги');

  let tag = allTags.find(t => t.slug === slug);
  if (!tag && window.MathTasksLib?.getCrossTag) {
    tag = window.MathTasksLib.getCrossTag(slug);
  }

  if (!tag) {
    fillListHeader({
      crumbs: [[tr('nav_home'), '/'], [tagsListLabel, '/tags'], ['Тег не найден', null]],
      title: 'Тег не найден',
      description: 'Возможно, ссылка устарела или тег не существует.'
    });
    setMeta(metaText('meta_not_found_tag'));
    renderSidebar();
    return;
  }

  const tagTitle = loc(tag, 'title') || tag.title || tag.slug;
  /* Описание на языке посетителя. Латышский текст берём из базы,
     а если колонки description_lv там ещё нет — из словаря в lib.js,
     чтобы перевод работал и до применения миграции 015. */
  const tagDict = window.MathTasksLib?.getCrossTag ? window.MathTasksLib.getCrossTag(tag.slug) : null;
  /* Порядок важен: loc() вернул бы русское описание как запасное, и до
     словаря дело бы не дошло. Поэтому латышское поле проверяем явно. */
  const wantLv = (window.MathTasks?.getLang ? window.MathTasks.getLang() : 'ru') === 'lv';
  const tagDesc = (wantLv && (tag.description_lv || tagDict?.description_lv))
    || tag.description || tagDict?.description || '';
  const crumbs = [
    [tr('nav_home'), '/'],
    [tagsListLabel, '/tags'],
    [`#${tagTitle}`, null]
  ];

  fillListHeader({
    crumbs,
    title: `#${tagTitle}`,
    description: tagDesc
  });
  setMeta(`#${tagTitle}`, tagDesc || metaText('meta_tag_desc', { tag: tagTitle }));
  renderSidebar();

  listTasks.innerHTML = `<p class="empty-state">${tr('state_loading_tasks')}</p>`;

  /* Класс — глобальный контекст сайта, поэтому тег по умолчанию показывает
     задачи выбранного класса. Ссылка «во всех классах» снимает сужение —
     так же, как это уже сделано в поиске. */
  const showAllGrades = new URLSearchParams(location.search).get('all') === '1';
  const inSelectedGrade = task => {
    if (!selectedGrade) return true;
    if (selectedGrade === 'matematika-1') return task.grade === 10 || task.grade === 11;
    if (selectedGrade === 'matematika-2') return task.grade === 12;
    if (selectedGrade === 'visparigais') return task.grade === 10;
    return task.grade === Number(selectedGrade);
  };

  let tasks = [];
  let tagTaskTotal = 0;
  if (db) {
    try {
      let tagId = tag.id;
      if (!tagId) {
        const { data: tagRow } = await db.from('tags').select('id').eq('slug', slug).maybeSingle();
        if (tagRow) tagId = tagRow.id;
      }

      if (tagId) {
        /* У ходового тега задач может быть больше тысячи: связи читаем
           страницами, задачи — пачками id (тысяча id в адрес запроса не
           влезет), порядок наводим сами. */
        const lib = window.MathTasksLib;
        const { data: links, error: linkErr } = await lib.fetchAllRows(
          () => db.from('task_tags').select('task_id').eq('tag_id', tagId).order('task_id'));
        if (!linkErr && links && links.length > 0) {
          const taskIds = links.map(l => l.task_id);
          const { data: unsorted, error } = await lib.fetchByIdChunks(taskIds,
            chunk => db.from('tasks').select(TASK_SELECT).eq('is_published', true).in('id', chunk));
          const byCatalogOrder = (a, b) => (a.grade ?? 0) - (b.grade ?? 0)
            || (a.position ?? 0) - (b.position ?? 0)
            || String(a.created_at || '').localeCompare(String(b.created_at || ''));
          const data = unsorted ? unsorted.sort(byCatalogOrder) : unsorted;
          if (!error && data) {
            tagTaskTotal = data.length;
            tasks = showAllGrades ? data : data.filter(inSelectedGrade);
          }
        }
      }
    } catch (e) {
      console.warn('Ошибка загрузки задач по тегу:', e);
    }
  }

  const metaEl = document.querySelector('#list-meta');
  if (metaEl) {
    const tasksCountLabel = currentLang === 'lv' ? `Uzdevumi: ${tasks.length}` : `Задач: ${tasks.length}`;
    const allTagsLabel = currentLang === 'lv' ? '← Visas birkas' : '← Все теги';
    /* Когда фильтр класса что-то прячет, об этом надо сказать прямо: иначе
       тег с задачами выглядит пустым, и посетитель решает, что их нет. */
    const hidden = Math.max(0, tagTaskTotal - tasks.length);
    const showAllLabel = currentLang === 'lv'
      ? `Rādīt visās klasēs (vēl ${hidden}) →`
      : `Показать во всех классах (ещё ${hidden}) →`;
    const showAllLink = hidden > 0
      ? ` <a class="search-escape" href="/tag/${encodeURIComponent(slug)}?all=1">${escapeHtml(showAllLabel)}</a>`
      : '';
    metaEl.innerHTML = `<span class="search-count">${tasksCountLabel}</span>${showAllLink} <a class="search-escape" href="/tags">${allTagsLabel}</a>`;
  }

  currentActiveTopic = null;
  currentTopicTasks = tasks || [];
  filterOnlyUnsolved = false;
  currentTasksSort = 'default';
  shuffledTopicTasks = null;
  currentListEmptyText = tr('tag_empty') || (currentLang === 'lv' ? 'Šai birkai pagaidām nav pievienots neviens uzdevums.' : 'Задач с этим тегом пока нет.');
  renderCurrentTopicTasks();
}

/* ── Маршруты ─────────────────────────────────────────────────────── */

/* Смена якоря (#task-12) тоже поднимает popstate. Без этой защиты клик по
   номеру задачи перерисовывал список целиком, цель прокрутки исчезала —
   и страница оставалась на месте. Перерисовываем только смену адреса. */
let lastRoute = null;
async function route({ force = false } = {}) {
  markActiveNav();
  const key = location.pathname + location.search;
  if (!force && key === lastRoute) return;
  lastRoute = key;

  const path = appPath();
  const params = new URLSearchParams(location.search);

  if (!path.startsWith('/control-work/') && !path.startsWith('/exam/')) leaveCwWork();

  // Сброс контекста темы в сайдбаре при уходе со страницы темы или задачи
  if (!path.startsWith('/topic/') && !path.startsWith('/subtopic/') && !path.startsWith('/task/') && !path.startsWith('/control-work/') && !path.startsWith('/exam/')) {
    if (currentActiveTopic !== null) {
      currentActiveTopic = null;
      renderSidebar();
    }
  }

  if (path === '/search') {
    await showSearch(params.get('q') || '', params.get('all') === '1');
    return;
  }
  // Поле поиска чистим при уходе с выдачи, чтобы шапка не врала о текущем виде.
  if (searchInput.value) searchInput.value = '';
  searchAcrossGrades = false;

  const examMatch = path.match(/^\/exam\/([a-z]+)$/);
  if (examMatch) { await startExam(examMatch[1]); return; }
  const cwMatch = path.match(/^\/control-work\/(.+)$/);
  if (cwMatch) { await startControlWork(decodeURIComponent(cwMatch[1])); return; }
  if (path === '/control-works') { await showControlWorksCatalog(); return; }

  /* Разбираем раньше страницы класса: иначе «7/tasks» уедет в неё как в
     название класса и вместо списка задач откроется главная. */
  const gradeTasksMatch = path.match(/^\/grade\/([^\/]+)\/tasks$/);
  if (gradeTasksMatch) {
    const grade = parseGradeValue(decodeURIComponent(gradeTasksMatch[1]));
    if (grade && selectedGrade !== grade) applyGrade(grade);
    await showAllTasks();
    return;
  }

  const gradeMatch = path.match(/^\/grade\/(.+)$/);
  if (gradeMatch) { await showGradePage(decodeURIComponent(gradeMatch[1])); return; }

  const subjectMatch = path.match(/^\/subject\/(.+)$/);
  if (subjectMatch) { showSubject(decodeURIComponent(subjectMatch[1])); return; }

  const subtopicMatch = path.match(/^\/subtopic\/(.+)$/);
  if (subtopicMatch) { await showSubtopic(decodeURIComponent(subtopicMatch[1])); return; }

  const topicMatch = path.match(/^\/topic\/(.+)$/);
  if (topicMatch) { await showTopic(decodeURIComponent(topicMatch[1])); return; }

  const taskMatch = path.match(/^\/task\/(\d+)/);
  if (taskMatch) { await showTask(taskMatch[1]); return; }

  const tagMatch = path.match(/^\/tag\/([^\/]+)/);
  if (tagMatch) { await showTag(decodeURIComponent(tagMatch[1])); return; }

  if (path === '/tags') { await showTagsList(); return; }

  if (path === '/tasks') { await showAllTasks(); return; }
  if (path === '/favorites') { await showFavorites(); return; }
  if (path === '/progress') { showProgress(); return; }
  if (path === '/about') { showView('about'); setMeta(metaText('meta_about_title'), metaText('meta_about_desc')); return; }

  showView('home');
  setMeta('', metaText('meta_home_desc'));
  await loadHome();
}
/* «Назад» может вернуть и другой язык: /lv/… ↔ без префикса. */
window.addEventListener('popstate', () => {
  const urlLang = langLib.langOfPath ? langLib.langOfPath(location.pathname) : getLang();
  if (urlLang !== getLang() && window.MathTasksI18n) {
    window.MathTasksI18n.setLang(urlLang);
    route({ force: true });
    return;
  }
  route();
});

/* Переходы идут через History API: адрес /topic/<slug> должен быть настоящим,
   иначе поисковик видит один и тот же документ на все темы сразу. Путь
   получает префикс текущего языка: navigate('/topic/x') в латышской версии
   ведёт на /lv/topic/x. */
function navigate(path, { replace = false } = {}) {
  const target = langPath(path);
  if (location.pathname + location.search === target) return;
  history[replace ? 'replaceState' : 'pushState'](null, '', target);
  route();
}

/* Один перехватчик на документ вместо обработчика у каждой ссылки: списки
   перерисовываются целиком. Модификаторы, средняя кнопка, внешние адреса и
   отдельные страницы (admin.html) обязаны работать как обычные ссылки —
   ломается это первым и незаметно. */
document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[href]');
  if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
  if (link.origin !== location.origin) return;
  // Якорь внутри текущей страницы — работа браузера, а не роутера.
  if (link.hash && link.pathname === location.pathname) return;
  if (/\.[a-z0-9]+$/i.test(link.pathname)) return;
  event.preventDefault();
  navigate(link.pathname + link.search);
});

/* ── Интерактивный графопостроитель (3.4) ─────────────────────────── */
let plotterScale = 30;
let plotterOrigin = { x: 340, y: 190 };

function openPlotterDialog() {
  const dialog = document.querySelector('#plotter-dialog');
  if (!dialog) return;
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  setTimeout(drawFunctionPlot, 50);
}

function parseMathExpr(expr) {
  let clean = (expr || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/√\s*\(([^)]+)\)/g, 'sqrt($1)')
    .replace(/√\s*(\d+|[a-zA-Z]+)/g, 'sqrt($1)')
    .replace(/√/g, 'sqrt')
    .replace(/·/g, '*')
    .replace(/π/g, 'pi')
    // Поддержка модуля: |x| или |x - 2|
    .replace(/\|([^|]+)\|/g, 'abs($1)')
    // Поддержка русской математической нотации
    .replace(/ctg/g, '(1/tan)')
    .replace(/tg/g, 'tan')
    .replace(/ln/g, 'log')
    .replace(/lg/g, 'log10');

  // 1. Вставка неявного умножения: 2x -> 2*x, 2(x) -> 2*(x), (x)(y) -> (x)*(y)
  clean = clean
    .replace(/(\d)([a-zA-Z(])/g, '$1*$2')
    .replace(/(\))(\d|[a-zA-Z])/g, '$1*$2')
    .replace(/\)\(/g, ')*(');

  // 2. Исправление унарного минуса перед степенью: -x^2 или -sin(x)^2 или -(x+1)^2
  // В JS синтаксис -x**2 запрещен (SyntaxError: unparenthesized unary expression before '**')
  // В математике -x^2 означает -(x^2) = -1 * x^2
  const basePattern = '(?:[a-zA-Z0-9_\\.]+(?:\\([^)]+\\))?|\\([^)]+\\))';
  const expPattern = '(?:[a-zA-Z0-9_\\.]+|\\([^)]+\\))';
  const powerWithUnaryMinus = new RegExp(`(^|[(+\\-*/])\\s*-\\s*(${basePattern})\\s*\\^\\s*(${expPattern})`, 'g');
  clean = clean.replace(powerWithUnaryMinus, '$1-(($2)**($3))');

  // 3. Замена всех оставшихся знаков степени ^ на **
  clean = clean.replace(/\^/g, '**');

  // 4. Привязка математических функций к объекту Math
  clean = clean
    .replace(/sin/g, 'Math.sin')
    .replace(/cos/g, 'Math.cos')
    .replace(/tan/g, 'Math.tan')
    .replace(/sqrt/g, 'Math.sqrt')
    .replace(/abs/g, 'Math.abs')
    .replace(/log10/g, 'Math.log10')
    .replace(/log/g, 'Math.log')
    .replace(/exp/g, 'Math.exp')
    .replace(/pi/gi, 'Math.PI')
    .replace(/\be\b/g, 'Math.E');

  // Безопасность: разрешаем только допустимые математические символы
  if (!/^[0-9a-zA-Z_\.\+\-\*\/\(\)\,\s]+$/.test(clean)) {
    return null;
  }
  // Проверяем, что все идентификаторы входят в белый список Math-функций и переменных
  const words = clean.match(/[a-zA-Z_]+/g) || [];
  const allowedWords = new Set(['x', 'Math', 'sin', 'cos', 'tan', 'sqrt', 'abs', 'PI', 'E', 'pow', 'log', 'log10', 'exp']);
  if (!words.every(w => allowedWords.has(w))) {
    return null;
  }

  try {
    const fn = new Function('x', `"use strict"; return (${clean});`);
    const test = fn(1);
    if (typeof test !== 'number') return null;
    return fn;
  } catch {
    return null;
  }
}

/* Холст подгоняем под контейнер: жёсткие 680x380 на телефоне 360-430px
   вызывали горизонтальную прокрутку всей страницы и разваливали диалог.
   Рисуем в физических пикселях, а размер в CSS оставляем логическим —
   иначе на экранах с высокой плотностью график был бы мыльным. */
function resizePlotterCanvas(canvas) {
  const box = canvas.parentElement;
  const cssWidth = Math.max(240, Math.floor(box ? box.clientWidth : 320));
  const cssHeight = Math.max(220, Math.min(380, Math.round(cssWidth * 0.56)));
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';
  const wanted = { w: Math.round(cssWidth * ratio), h: Math.round(cssHeight * ratio) };
  if (canvas.width !== wanted.w || canvas.height !== wanted.h) {
    canvas.width = wanted.w;
    canvas.height = wanted.h;
  }
  return ratio;
}

function drawFunctionPlot() {
  const canvas = document.querySelector('#plotter-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const ratio = resizePlotterCanvas(canvas);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const w = canvas.width / ratio;
  const h = canvas.height / ratio;
  plotterOrigin = { x: w / 2, y: h / 2 };

  ctx.clearRect(0, 0, w, h);

  // Сетка
  ctx.lineWidth = 1;
  ctx.strokeStyle = document.body.classList.contains('dark') ? '#1e293b' : '#e2e8f0';
  ctx.beginPath();
  for (let x = plotterOrigin.x % plotterScale; x < w; x += plotterScale) {
    ctx.moveTo(x, 0); ctx.lineTo(x, h);
  }
  for (let y = plotterOrigin.y % plotterScale; y < h; y += plotterScale) {
    ctx.moveTo(0, y); ctx.lineTo(w, y);
  }
  ctx.stroke();

  // Оси координат
  ctx.lineWidth = 2;
  ctx.strokeStyle = document.body.classList.contains('dark') ? '#94a3b8' : '#64748b';
  ctx.beginPath();
  ctx.moveTo(0, plotterOrigin.y); ctx.lineTo(w, plotterOrigin.y);
  ctx.moveTo(plotterOrigin.x, 0); ctx.lineTo(plotterOrigin.x, h);
  ctx.stroke();

  // Подписи осей
  ctx.font = '12px Manrope, sans-serif';
  ctx.fillStyle = document.body.classList.contains('dark') ? '#cbd5e1' : '#475569';
  ctx.fillText('X', w - 16, plotterOrigin.y - 8);
  ctx.fillText('Y', plotterOrigin.x + 8, 16);
  ctx.fillText('0', plotterOrigin.x + 4, plotterOrigin.y + 14);

  // Оцифровка осей
  ctx.font = '10px Manrope, sans-serif';
  for (let x = plotterOrigin.x + plotterScale * 2; x < w - 20; x += plotterScale * 2) {
    const val = Math.round((x - plotterOrigin.x) / plotterScale);
    ctx.fillText(String(val), x - 4, plotterOrigin.y + 14);
  }
  for (let x = plotterOrigin.x - plotterScale * 2; x > 20; x -= plotterScale * 2) {
    const val = Math.round((x - plotterOrigin.x) / plotterScale);
    ctx.fillText(String(val), x - 8, plotterOrigin.y + 14);
  }
  for (let y = plotterOrigin.y - plotterScale * 2; y > 20; y -= plotterScale * 2) {
    const val = Math.round((plotterOrigin.y - y) / plotterScale);
    ctx.fillText(String(val), plotterOrigin.x + 6, y + 4);
  }
  for (let y = plotterOrigin.y + plotterScale * 2; y < h - 20; y += plotterScale * 2) {
    const val = Math.round((plotterOrigin.y - y) / plotterScale);
    ctx.fillText(String(val), plotterOrigin.x + 6, y + 4);
  }

  // Отрисовка графика функции
  const exprInput = document.querySelector('#plotter-expr');
  const expr = (exprInput ? exprInput.value : 'x^2 - 4') || 'x';
  const fn = parseMathExpr(expr);
  const infoRoots = document.querySelector('#plotter-roots');

  if (!fn) {
    if (infoRoots) infoRoots.textContent = (window.MathTasks.t || (k => k))('plot_formula_error');
    return;
  }

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#1764ff';
  ctx.beginPath();

  let started = false;
  const roots = [];
  let prevY = null;
  let prevMathX = null;
  let prevPy = null;

  for (let px = 0; px <= w; px += 1.5) {
    const mathX = (px - plotterOrigin.x) / plotterScale;
    let mathY;
    try {
      mathY = fn(mathX);
    } catch {
      started = false;
      continue;
    }

    if (!Number.isFinite(mathY)) {
      started = false;
      continue;
    }

    /* Смена знака засчитывается за ноль только на непрерывном участке.
       У tan(x) и 1/x знак меняется и через асимптоту, и без этой проверки
       точки «нулей» вставали в разрывы: у tan(x) появлялись ложные
       корни около -3.5пи и -2.5пи, где функция уходит в бесконечность. */
    const visibleSpan = h / plotterScale;
    const continuous = prevY !== null && Math.abs(mathY - prevY) < visibleSpan;
    if (continuous && ((prevY < 0 && mathY >= 0) || (prevY > 0 && mathY <= 0))) {
      const rootX = prevMathX + (mathX - prevMathX) * (-prevY) / (mathY - prevY);
      roots.push(rootX);
    }
    prevY = mathY;
    prevMathX = mathX;

    const py = plotterOrigin.y - mathY * plotterScale;
    if (py < -h * 2 || py > h * 3) {
      started = false;
      continue;
    }

    /* Разрыв функции: между соседними точками значение прыгнуло больше,
       чем на высоту холста. Так tan(x) и 1/x перестают рисовать
       паразитную вертикаль между +бесконечностью и -бесконечностью. */
    if (started && prevPy !== null && Math.abs(py - prevPy) > h) {
      started = false;
    }
    prevPy = py;

    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();

  // Нули функции (точки пересечения с осью X)
  roots.forEach(rx => {
    const rpx = plotterOrigin.x + rx * plotterScale;
    const rpy = plotterOrigin.y;
    if (rpx >= 0 && rpx <= w) {
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(rpx, rpy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  });

  if (infoRoots) {
    if (roots.length) {
      const rootStrs = roots.slice(0, 4).map(r => r.toFixed(2)).join(', ');
      infoRoots.innerHTML = `${(window.MathTasks.t || (k => k))('plot_roots')}<strong>x ≈ ${rootStrs}</strong>`;
    } else {
      infoRoots.textContent = (window.MathTasks.t || (k => k))('plot_no_roots');
    }
  }
}

/* ── Обработчики интерактивных инструментов ── */

function updateTopicHeaderProgress() {
  if (!currentActiveTopic) return;
  renderTopicHeaderMeta(currentActiveTopic, currentTopicTasks);
}

// Интерактивная самопроверка: отправка ответа
document.addEventListener('submit', event => {
  const form = event.target.closest('.self-check-form');
  if (!form) return;
  event.preventDefault();
  const tr = window.MathTasks.t || (k => k);
  const taskId = form.dataset.checkId;
  const task = currentTasksMap.get(Number(taskId));
  if (!task) return;
  const input = form.querySelector('.self-check-input');
  const userAns = input ? input.value.trim() : '';
  if (!userAns) return;
  const resultDiv = form.nextElementSibling;
  const isCorrect = checkTaskAnswer(userAns, loc(task, 'answer_latex'), loc(task, 'answer_check'));
  recordSolveEntry(taskId, isCorrect);
  if (isCorrect) {
    setTaskSolved(taskId, true);
    resultDiv.className = 'self-check-result success';
    resultDiv.innerHTML = `${escapeHtml(tr('self_check_success'))} <button type="button" class="self-check-reset" data-reset-id="${taskId}">${escapeHtml(tr('self_check_reset'))}</button>`;
    resultDiv.hidden = false;
    input.disabled = true;
    form.querySelector('.self-check-btn').hidden = true;
    const quickBar = form.closest('.task-self-check')?.querySelector('.quick-math-bar');
    if (quickBar) quickBar.hidden = true;
    const card = form.closest('.task');
    markCardSolved(card);
    // Решил сам — разбор открыт, чтобы сверить ход решения.
    if (card) {
      unlockTaskReveals(card, ['hint', 'answer', 'solution']);
      updateRevealLock(card, '');
    }
    updateTopicHeaderProgress();
  } else {
    const attempts = addTaskWrongAttempt(taskId);
    const opened = attempts >= ATTEMPTS_FOR_ANSWER;
    const hasHint = Boolean(loc(task, 'hint_latex'));
    const messageKey = opened ? 'self_check_error_open' : (hasHint ? 'self_check_error_hint' : 'self_check_error_retry');
    resultDiv.className = 'self-check-result error';
    resultDiv.innerHTML = escapeHtml(tr(messageKey));
    resultDiv.hidden = false;
    const card = form.closest('.task');
    if (card) {
      unlockTaskReveals(card, opened ? ['hint', 'answer', 'solution'] : ['hint']);
      updateRevealLock(card, revealLockText(task, attempts));
    }
  }
});

/* Самопроверка у задач, ответ которых не сверить автоматически. */
document.addEventListener('click', event => {
  const block = event.target.closest('.task-self-assess');
  if (!block) return;
  const card = block.closest('.task');
  const taskId = Number(block.dataset.selfAssess);
  const tr = window.MathTasks.t || (k => k);
  const result = block.querySelector('.self-check-result');
  const verdict = block.querySelector('.self-assess-verdict');
  const revealBtn = block.querySelector('[data-self-assess-reveal]');
  const openPanel = kind => {
    const toggle = card?.querySelector(`.solution-toggle[data-kind="${kind}"]`);
    if (toggle && toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
  };

  if (event.target.closest('[data-self-assess-reveal]')) {
    if (card) unlockTaskReveals(card, ['answer']);
    openPanel('answer');
    revealBtn.hidden = true;
    verdict.hidden = false;
    return;
  }
  if (event.target.closest('[data-self-assess-yes]')) {
    recordSolveEntry(taskId, true);
    setTaskSolved(taskId, true);
    verdict.hidden = true;
    result.className = 'self-check-result success';
    result.innerHTML = `${escapeHtml(tr('self_assess_done'))} <button type="button" class="self-assess-reset" data-self-assess-reset>${escapeHtml(tr('self_check_reset'))}</button>`;
    result.hidden = false;
    if (card) {
      unlockTaskReveals(card, ['hint', 'answer', 'solution']);
      markCardSolved(card);
    }
    updateTopicHeaderProgress();
    return;
  }
  if (event.target.closest('[data-self-assess-no]')) {
    recordSolveEntry(taskId, false);
    addTaskWrongAttempt(taskId);
    verdict.hidden = true;
    result.className = 'self-check-result error';
    result.textContent = tr('self_assess_fail');
    result.hidden = false;
    if (card) unlockTaskReveals(card, ['hint', 'answer', 'solution']);
    openPanel('solution');
    revealBtn.hidden = false;
    return;
  }
  if (event.target.closest('[data-self-assess-reset]')) {
    setTaskSolved(taskId, false);
    result.hidden = true;
    revealBtn.hidden = false;
    card?.querySelector('.task-solved-badge')?.remove();
    updateTopicHeaderProgress();
  }
});

/* ── Экспресс-тренажёр (режим «Примеры») ─────────────────────── */

function openDrillHintDialog(task) {
  const dialog = document.querySelector('#drill-hint-dialog');
  if (!dialog) return;
  const titleEl = dialog.querySelector('#drill-hint-title');
  const condEl = dialog.querySelector('#drill-hint-condition');
  const ansEl = dialog.querySelector('#drill-hint-answer');
  const solEl = dialog.querySelector('#drill-hint-solution');
  const ansSec = dialog.querySelector('#drill-hint-ans-section');
  const solSec = dialog.querySelector('#drill-hint-sol-section');
  const hintEl = dialog.querySelector('#drill-hint-hint');
  const hintSec = dialog.querySelector('#drill-hint-hint-section');
  const lockEl = dialog.querySelector('#drill-hint-lock');

  if (titleEl) titleEl.textContent = loc(task, 'title');
  if (condEl) {
    condEl.innerHTML = '';
    renderMath(condEl, loc(task, 'condition_latex'));
  }
  /* Тот же порядок, что в карточке: подсказка после первой ошибки,
     ответ и решение — после второй. */
  /* В экспресс-режиме у задачи без автопроверки поля ответа нет — окно 💡
     для неё единственный путь к ответу, поэтому там открыто всё. */
  const state = taskRevealState(task);
  const reveal = state.selfAssess ? { ...state, hint: true, answer: true, solution: true } : state;
  const showSection = (section, target, text, allowed) => {
    if (!section || !target) return;
    section.hidden = !(allowed && text);
    target.innerHTML = '';
    if (!section.hidden) renderMath(target, text);
  };
  showSection(hintSec, hintEl, loc(task, 'hint_latex'), reveal.hint);
  showSection(ansSec, ansEl, loc(task, 'answer_latex'), reveal.answer);
  showSection(solSec, solEl, loc(task, 'solution_latex'), reveal.solution);
  if (lockEl) {
    const lockText = reveal.answer ? '' : revealLockText(task, reveal.attempts);
    lockEl.textContent = lockText;
    lockEl.hidden = !lockText;
  }

  if (typeof dialog.showModal === 'function') dialog.showModal();
}

/* Сколько раз ученик нажал Enter на этой задаче с неверным ответом. */
const drillAttempts = new Map();

// Обработка ввода и проверки ответов в компактном тренажёре
document.addEventListener('keydown', event => {
  // closest() нет у document: событие могло прийти не с элемента.
  const input = event.target.closest?.('.compact-drill-input');
  if (!input) return;
  const tr = window.MathTasks.t || (k => k);

  if (event.key === 'Enter') {
    event.preventDefault();
    const taskId = Number(input.dataset.drillId);
    const task = currentTasksMap.get(taskId);
    if (!task) return;

    const userAns = input.value.trim();
    if (!userAns) return;

    const isCorrect = checkTaskAnswer(userAns, loc(task, 'answer_latex'), loc(task, 'answer_check'));
    recordSolveEntry(taskId, isCorrect);
    const item = input.closest('.compact-drill-item');
    const statusEl = item?.querySelector('.compact-drill-status');

    if (isCorrect) {
      setTaskSolved(taskId, true);
      input.classList.remove('error');
      input.classList.add('success');
      input.disabled = true;
      if (statusEl) {
        statusEl.className = 'compact-drill-status success';
        statusEl.textContent = '✓';
      }
      if (item) item.classList.add('is-solved');
      drillAttempts.delete(taskId);
      const okNote = item?.querySelector('.compact-drill-note');
      if (okNote) { okNote.textContent = ''; okNote.hidden = true; }

      updateTopicHeaderProgress();
      const statsEl = document.querySelector('#compact-drill-stats');
      if (statsEl && lastRenderedTasks.length) {
        const solvedCount = lastRenderedTasks.filter(t => isTaskSolved(t.id)).length;
        statsEl.textContent = `${solvedCount} / ${lastRenderedTasks.length}`;
      }

      // Автоматический переход к следующему нерешённому примеру
      const allInputs = Array.from(document.querySelectorAll('.compact-drill-input:not([disabled])'));
      if (allInputs.length > 0) {
        const curIdx = Number(input.dataset.drillIndex);
        const nextInput = allInputs.find(inp => Number(inp.dataset.drillIndex) > curIdx) || allInputs[0];
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }
    } else {
      /* Первое нажатие — мягкое: «не сошлось», ответ можно поправить.
         Второе по той же задаче — окончательный вердикт с верным ответом:
         иначе ученик перебирает варианты вслепую и застревает. */
      const attempts = (drillAttempts.get(taskId) || 0) + 1;
      drillAttempts.set(taskId, attempts);
      // Общий счётчик ошибок: он же открывает подсказку и разбор в 💡.
      addTaskWrongAttempt(taskId);
      input.classList.remove('success');
      input.classList.add('error');
      if (statusEl) {
        statusEl.className = 'compact-drill-status error';
        statusEl.textContent = attempts === 1 ? '?' : '✗';
      }
      const noteEl = item?.querySelector('.compact-drill-note');
      if (noteEl) {
        if (attempts === 1) {
          noteEl.className = 'compact-drill-note warn';
          noteEl.textContent = tr('drill_not_match');
        } else {
          noteEl.className = 'compact-drill-note wrong';
          noteEl.innerHTML = '<span></span> <span class="math" data-note-answer></span>';
          noteEl.firstElementChild.textContent = tr('drill_wrong_answer');
          renderMath(noteEl.querySelector('[data-note-answer]'), loc(task, 'answer_latex') || '');
        }
        noteEl.hidden = false;
      }
      input.select();
    }
  }
});

document.addEventListener('input', event => {
  // closest() нет у document: событие могло прийти не с элемента.
  const input = event.target.closest?.('.compact-drill-input');
  if (!input) return;
  if (input.classList.contains('error')) {
    input.classList.remove('error');
    const item = input.closest('.compact-drill-item');
    const statusEl = item?.querySelector('.compact-drill-status');
    if (statusEl) statusEl.textContent = '';
    const noteEl = item?.querySelector('.compact-drill-note');
    if (noteEl) { noteEl.textContent = ''; noteEl.hidden = true; }
  }
});

document.addEventListener('click', event => {
  // Подсказка / решение в режиме экспресс-тренажёра
  const drillHintBtn = event.target.closest('[data-drill-hint]');
  if (drillHintBtn) {
    event.preventDefault();
    const taskId = Number(drillHintBtn.dataset.drillHint);
    const task = currentTasksMap.get(taskId);
    if (task) openDrillHintDialog(task);
    return;
  }

  // Закрытие диалога подсказки тренажёра
  if (event.target.closest('#drill-hint-close') || event.target.matches('#drill-hint-dialog')) {
    event.preventDefault();
    document.querySelector('#drill-hint-dialog')?.close();
    return;
  }

  // Быстрая виртуальная математическая клавиатура (Quick Math Bar)
  const mathBtn = event.target.closest('.quick-math-btn');
  if (mathBtn) {
    event.preventDefault();
    if (mathBtn.dataset.plotterInsert) {
      const pInput = document.querySelector('#plotter-expr');
      if (pInput) insertIntoInput(pInput, mathBtn.dataset.plotterInsert);
      return;
    }
    if (mathBtn.dataset.cwInsert) {
      const card = mathBtn.closest('.cw-task-card');
      const input = card?.querySelector('.cw-answer-input');
      if (input && !input.disabled) {
        insertIntoInput(input, mathBtn.dataset.cwInsert);
        const taskId = Number(input.dataset.taskId);
        if (taskId) rememberCwAnswer(taskId, input.value);
      }
      return;
    }
    if (mathBtn.dataset.insert) {
      const checkBlock = mathBtn.closest('.task-self-check');
      const input = checkBlock?.querySelector('.self-check-input');
      if (input && !input.disabled) {
        insertIntoInput(input, mathBtn.dataset.insert);
      }
    }
    return;
  }

  // Кнопки сдачи и повтора контрольной работы и экзамена
  const submitCwBtn = event.target.closest('#cw-submit-btn, [data-cw-submit]');
  if (submitCwBtn) {
    event.preventDefault();
    requestCwSubmit(submitCwBtn);
    return;
  }

  const examStartBtn = event.target.closest('[data-exam-start]');
  if (examStartBtn) {
    event.preventDefault();
    examStartBtn.disabled = true;
    beginExam(examStartBtn.dataset.examStart);
    return;
  }

  const retryCwBtn = event.target.closest('#btn-cw-retry');
  if (retryCwBtn) {
    event.preventDefault();
    if (currentCwMode === 'exam' && currentExamKind) {
      startExam(currentExamKind, { fresh: true });
    } else if (currentCwTopic) {
      startControlWork(currentCwTopic.slug);
    }
    return;
  }

  // Сброс решённой задачи
  const resetBtn = event.target.closest('.self-check-reset');
  if (resetBtn) {
    event.preventDefault();
    const taskId = resetBtn.dataset.resetId;
    setTaskSolved(taskId, false);
    const checkBlock = resetBtn.closest('.task-self-check');
    if (checkBlock) {
      const input = checkBlock.querySelector('.self-check-input');
      const form = checkBlock.querySelector('.self-check-form');
      const resultDiv = checkBlock.querySelector('.self-check-result');
      if (input) { input.disabled = false; input.value = ''; input.focus(); }
      if (form) form.querySelector('.self-check-btn').hidden = false;
      if (resultDiv) resultDiv.hidden = true;
      const quickBar = checkBlock.querySelector('.quick-math-bar');
      if (quickBar) {
        ensureQuickMathBar(quickBar);
        quickBar.hidden = false;
      }
    }
    const card = resetBtn.closest('.task');
    card?.querySelector('.task-solved-badge')?.remove();
    updateTopicHeaderProgress();
    return;
  }

  // 3.6: Скопировать ссылку на задачу
  const copyLinkBtn = event.target.closest('[data-copy-link]');
  if (copyLinkBtn) {
    event.preventDefault();
    const taskId = Number(copyLinkBtn.dataset.copyLink);
    const task = currentTasksMap.get(taskId);
    const path = task ? taskPath(task) : `/task/${taskId}`;
    const url = `${location.origin}${path}`;
    copyToClipboard(url).then(ok => {
      if (ok) {
        showToast('Ссылка на задачу скопирована в буфер обмена!');
        const label = copyLinkBtn.querySelector('span');
        const origText = label ? label.textContent : '';
        copyLinkBtn.classList.add('copied');
        if (label) label.textContent = (window.MathTasks.t || (k => k))('copied');
        setTimeout(() => {
          copyLinkBtn.classList.remove('copied');
          if (label) label.textContent = origText;
        }, 1800);
      } else {
        /* prompt доступен не везде: встроенные просмотрщики и часть браузеров
           его блокируют, и тогда обещание падало необработанной ошибкой.
           Показываем адрес хотя бы уведомлением. */
        try {
          window.prompt('Скопируйте ссылку вручную:', url);
        } catch {
          showToast(url);
        }
      }
    });
    return;
  }

  // 3.6: Скопировать текст условия задачи
  const copyTextBtn = event.target.closest('[data-copy-text]');
  if (copyTextBtn) {
    event.preventDefault();
    const taskId = Number(copyTextBtn.dataset.copyText);
    const task = currentTasksMap.get(taskId);
    let conditionText = '';
    let titleText = '';
    if (task) {
      titleText = task.title || '';
      conditionText = task.condition_latex || '';
    } else {
      const card = copyTextBtn.closest('.task');
      titleText = card?.querySelector('.task-title')?.textContent || '';
      conditionText = card?.querySelector('.task-condition')?.textContent || '';
    }
    const path = task ? taskPath(task) : `/task/${taskId}`;
    const url = `${location.origin}${path}`;
    const formatted = `${titleText}\n\nУсловие:\n${conditionText}\n\nСсылка: ${url}\n— MathTasks`;
    copyToClipboard(formatted).then(ok => {
      if (ok) {
        showToast('Текст условия скопирован в буфер обмена!');
        const label = copyTextBtn.querySelector('span');
        const origText = label ? label.textContent : '';
        copyTextBtn.classList.add('copied');
        if (label) label.textContent = (window.MathTasks.t || (k => k))('copied');
        setTimeout(() => {
          copyTextBtn.classList.remove('copied');
          if (label) label.textContent = origText;
        }, 1800);
      }
    });
    return;
  }

  // Сообщить об ошибке в задаче
  const reportTaskBtn = event.target.closest('[data-report-task]');
  if (reportTaskBtn) {
    event.preventDefault();
    openReportDialog(Number(reportTaskBtn.dataset.reportTask));
    return;
  }

  // Закладки (Избранное)
  const favBtn = event.target.closest('[data-fav-id]');
  if (favBtn) {
    event.preventDefault();
    toggleFavorite(favBtn.dataset.favId);
    return;
  }

  // Справочник формул
  const formulasBtn = event.target.closest('#open-formulas-btn');
  if (formulasBtn) {
    event.preventDefault();
    openFormulasDialog();
    return;
  }

  // Переключение режима вывода задач: списком, компактно или по одной
  const viewModeBtn = event.target.closest('[data-view-mode]');
  if (viewModeBtn) {
    event.preventDefault();
    const mode = viewModeBtn.dataset.viewMode;
    if (mode === 'list' || mode === 'single' || mode === 'compact') {
      taskViewMode = mode;
      try { localStorage.setItem('math-tasks:view-mode', mode); } catch {}
      document.querySelectorAll('[data-view-mode]').forEach(b => {
        b.classList.toggle('active', b.dataset.viewMode === mode);
        b.setAttribute('aria-pressed', String(b.dataset.viewMode === mode));
      });
      if (lastRenderedContainer && lastRenderedTasks.length) {
        renderTaskList(lastRenderedContainer, lastRenderedTasks, lastRenderedEmptyText, lastRenderedOptions);
      }
    }
    return;
  }

  // Перелистывание задач в режиме "По одной" (1)
  const pagerDirBtn = event.target.closest('[data-pager-dir]');
  if (pagerDirBtn) {
    event.preventDefault();
    const dir = pagerDirBtn.dataset.pagerDir;
    if (dir === 'prev' && singleTaskIndex > 0) {
      singleTaskIndex--;
      renderTaskList(lastRenderedContainer, lastRenderedTasks, lastRenderedEmptyText, lastRenderedOptions);
      lastRenderedContainer?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (dir === 'next' && singleTaskIndex < lastRenderedTasks.length - 1) {
      singleTaskIndex++;
      renderTaskList(lastRenderedContainer, lastRenderedTasks, lastRenderedEmptyText, lastRenderedOptions);
      lastRenderedContainer?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return;
  }

  // Клик по номеру задачи в пагинаторе
  const pagerIdxBtn = event.target.closest('[data-pager-idx]');
  if (pagerIdxBtn) {
    event.preventDefault();
    const idx = Number(pagerIdxBtn.dataset.pagerIdx);
    if (Number.isFinite(idx) && idx >= 0 && idx < lastRenderedTasks.length) {
      singleTaskIndex = idx;
      renderTaskList(lastRenderedContainer, lastRenderedTasks, lastRenderedEmptyText, lastRenderedOptions);
      lastRenderedContainer?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return;
  }

  // Главные вкладки справочника формул (Официальные листы / Быстрый справочник) (3)
  const mainTabBtn = event.target.closest('.formulas-main-tab');
  if (mainTabBtn) {
    event.preventDefault();
    switchFormulasMainTab(mainTabBtn.dataset.mainTab);
    return;
  }

  // Вкладки быстрого справочника формул
  const tabBtn = event.target.closest('.formulas-tab');
  if (tabBtn) {
    event.preventDefault();
    document.querySelectorAll('.formulas-tab').forEach(t => t.classList.remove('active'));
    tabBtn.classList.add('active');
    renderFormulasTab(tabBtn.dataset.cat);
    return;
  }

  // Закрытие формул
  if (event.target.closest('#formulas-close')) {
    event.preventDefault();
    document.querySelector('#formulas-dialog')?.close();
    return;
  }

  // Построитель графиков (3.4)
  const plotterBtn = event.target.closest('#open-plotter-btn');
  if (plotterBtn) {
    event.preventDefault();
    openPlotterDialog();
    return;
  }

  if (event.target.closest('#plotter-close')) {
    event.preventDefault();
    document.querySelector('#plotter-dialog')?.close();
    return;
  }

  if (event.target.closest('#plotter-draw-btn')) {
    event.preventDefault();
    drawFunctionPlot();
    return;
  }

  const presetChip = event.target.closest('.plotter-chip');
  if (presetChip) {
    event.preventDefault();
    const input = document.querySelector('#plotter-expr');
    if (input) {
      input.value = presetChip.dataset.fn;
      drawFunctionPlot();
    }
    return;
  }

  if (event.target.closest('#plotter-zoom-in')) {
    event.preventDefault();
    plotterScale = Math.min(100, plotterScale * 1.25);
    drawFunctionPlot();
    return;
  }
  if (event.target.closest('#plotter-zoom-out')) {
    event.preventDefault();
    plotterScale = Math.max(10, plotterScale / 1.25);
    drawFunctionPlot();
    return;
  }
  if (event.target.closest('#plotter-zoom-reset')) {
    event.preventDefault();
    plotterScale = 30;
    drawFunctionPlot();
    return;
  }

  // Случайная задача
  const randomBtn = event.target.closest('#random-task-btn');
  if (randomBtn) {
    event.preventDefault();
    openRandomTask();
    return;
  }

  /* «Показать ещё»: добавляем порцию и перерисовываем список на месте.
     Прокрутку не трогаем — человек остаётся там, где читал. */
  const pageBtn = event.target.closest('[data-task-page]');
  if (pageBtn && !pageBtn.disabled) {
    event.preventDefault();
    const page = Number(pageBtn.dataset.taskPage);
    const pages = Math.ceil(lastRenderedTasks.length / TASKS_CHUNK);
    if (page < 0 || page >= pages) return;
    pageStart = page * TASKS_CHUNK;
    rerenderCurrentList();
    /* Новая страница начинается сверху: оставлять человека на середине
       предыдущей — значит показать ему середину незнакомого списка. */
    lastRenderedContainer?.scrollIntoView({ behavior: 'instant', block: 'start' });
    return;
  }

  /* Переход по полосе номеров. Идентификатор карточки зависит от режима,
     поэтому ищем по data-task-id, а не по адресу с решёткой: так полоса
     работает и в списке, и в тренажёре, и не засоряет историю браузера. */
  const anchorLink = event.target.closest('[data-anchor-task]');
  if (anchorLink) {
    event.preventDefault();
    const id = anchorLink.dataset.anchorTask;
    /* Задача может быть за пределами показанного: полоса номеров
       перечисляет всю тему, а на экране пока первые двадцать пять.
       Тогда сначала допоказываем, потом прокручиваем. */
    const idx = lastRenderedTasks.findIndex(t => String(t.id) === String(id));
    const flipped = idx >= 0 && ensureVisible(idx);
    const jump = () => goToCard(document.querySelector(`[data-task-id="${id}"], #task-${id}`));

    if (flipped) {
      rerenderCurrentList();
      /* Прыгать сразу нельзя: страница ещё имеет размеры прежней, и
         прокрутка уезжает за её конец. Сначала возвращаемся к началу
         списка — так промах невозможен в принципе, — а к самой задаче
         переходим, когда KaTeX досчитает формулы. */
      lastRenderedContainer?.scrollIntoView({ behavior: 'instant', block: 'start' });
      setTimeout(jump, 200);
    } else {
      jump();
    }
    return;
  }

  // Чертёж поверх карточки тренажёра: там самой картинки нет, только кнопка.
  const drillFigure = event.target.closest('[data-drill-figure]');
  if (drillFigure) {
    openLightbox(drillFigure.dataset.drillFigure, drillFigure.dataset.figureAlt);
    return;
  }

  // Зум чертежей (LightBox 2.3)
  const figure = event.target.closest('.task-figure');
  if (figure) {
    openLightbox(figure.src, figure.alt);
    return;
  }

  // Закрытие LightBox
  if (event.target.closest('#lightbox-close')) {
    event.preventDefault();
    document.querySelector('#lightbox-dialog')?.close();
    return;
  }
});

/* Координаты под указателем. Слушаем pointer-события, а не mousemove:
   на телефоне мыши нет, и значения так и оставались x: 0.0, y: 0.0.
   Координаты считаем в логических пикселях — холст отрисован
   с масштабом devicePixelRatio. */
const plotterCanvas = document.querySelector('#plotter-canvas');
if (plotterCanvas) {
  const showPlotterCoords = event => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const px = (event.clientX - rect.left) * (canvas.width / ratio / rect.width);
    const py = (event.clientY - rect.top) * (canvas.height / ratio / rect.height);
    const mathX = ((px - plotterOrigin.x) / plotterScale).toFixed(2);
    const mathY = ((plotterOrigin.y - py) / plotterScale).toFixed(2);
    const coords = document.querySelector('#plotter-coords');
    if (coords) coords.textContent = `x: ${mathX}, y: ${mathY}`;
  };
  plotterCanvas.addEventListener('pointermove', showPlotterCoords);
  // Касание без движения тоже должно показывать точку.
  plotterCanvas.addEventListener('pointerdown', showPlotterCoords);
  // Прокрутку страницы пальцем по графику не перехватываем: жестов тут нет.
  plotterCanvas.style.touchAction = 'pan-y';
}

// Поворот экрана и смена ширины окна меняют размер холста.
let plotterResizeTimer;
window.addEventListener('resize', () => {
  const dialog = document.querySelector('#plotter-dialog');
  if (!dialog?.open) return;
  clearTimeout(plotterResizeTimer);
  plotterResizeTimer = setTimeout(drawFunctionPlot, 150);
});

document.querySelector('#plotter-expr')?.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    drawFunctionPlot();
  }
});

// Закрытие диалогов по клику на фон
document.querySelector('#lightbox-dialog')?.addEventListener('click', event => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});
document.querySelector('#formulas-dialog')?.addEventListener('click', event => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});
document.querySelector('#plotter-dialog')?.addEventListener('click', event => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});

// Навигация стрелками на клавиатуре для режима вывода задач "По одной" (1)
/* Переход к карточке.

   Плавная прокрутка на большое расстояние обрывается на полпути: прыжок
   к пятидесятой задаче — это больше двадцати тысяч пикселей, и браузер
   не доводит анимацию до конца. Поэтому дальние переходы делаем мгновенно,
   а плавность оставляем шагам стрелками, где расстояние в один экран.

   Подсветка снимается сама: постоянная рамка на карточке остаётся висеть
   и мешает читать следующую задачу. */
let highlightTimer = 0;

function goToCard(card, { smooth = false } = {}) {
  if (!card) return false;
  const distance = Math.abs(card.getBoundingClientRect().top - window.innerHeight / 2);
  /* 'auto' значит «взять поведение из CSS», а там стоит scroll-behavior: smooth —
     поэтому дальний переход оставался плавным и не доводился до конца.
     Мгновенную прокрутку даёт только 'instant'. */
  const behavior = smooth && distance < window.innerHeight * 2 ? 'smooth' : 'instant';
  card.scrollIntoView({ behavior, block: 'center' });

  document.querySelectorAll('.is-current').forEach(el => el.classList.remove('is-current'));
  card.classList.add('is-current');
  clearTimeout(highlightTimer);
  highlightTimer = setTimeout(() => card.classList.remove('is-current'), 1500);

  const field = card.querySelector('.compact-drill-input:not([disabled]), .self-check-input:not([disabled])');
  if (field) { field.focus({ preventScroll: true }); field.select?.(); }
  return true;
}

/* Навигация стрелками между задачами.

   Раньше обработчик отступал, как только фокус был в поле ввода. В тренажёре
   поле есть у каждой задачи, поэтому стрелки не работали там вообще. Теперь
   внутри поля работают ↑ и ↓ — они переводят на соседнюю задачу и сразу
   ставят курсор в её поле ответа; ← и → остаются полю, чтобы можно было
   двигать курсор по набранному тексту. Вне поля работают все четыре. */
let listCursor = -1;

/* Поля ответов в порядке их появления на странице: в тренажёре одно,
   в списке — форма самопроверки внутри карточки. */
function answerInputs() {
  return [...document.querySelectorAll('.compact-drill-input, .self-check-input')]
    .filter(el => !el.disabled);
}

function focusTaskAt(index) {
  /* Стрелка вниз на последней показанной задаче должна открывать
     следующую, а не упираться в невидимую границу. */
  /* Стрелка за край страницы перелистывает её, а не упирается. */
  if (index >= 0 && index < lastRenderedTasks.length && ensureVisible(index)) {
    rerenderCurrentList();
  }
  const cards = [...(lastRenderedContainer?.querySelectorAll('.task, .compact-drill-item') || [])];
  if (!cards.length) return false;
  const i = Math.min(cards.length - 1, Math.max(0, index));
  listCursor = i;
  return goToCard(cards[i], { smooth: true });
}

function currentTaskIndex() {
  const cards = [...(lastRenderedContainer?.querySelectorAll('.task, .compact-drill-item') || [])];
  const active = document.activeElement?.closest?.('.task, .compact-drill-item');
  if (active) return cards.indexOf(active);
  return listCursor;
}

window.addEventListener('keydown', event => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const key = event.key;
  if (key !== 'ArrowUp' && key !== 'ArrowDown' && key !== 'ArrowLeft' && key !== 'ArrowRight') return;

  const target = event.target;
  const tagName = target?.tagName ? target.tagName.toLowerCase() : '';
  const inField = tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target?.isContentEditable;
  const inAnswerField = Boolean(target?.closest?.('.compact-drill-input, .self-check-input'));

  // В обычном поле (поиск, форма) стрелки не трогаем вовсе.
  if (inField && !inAnswerField) return;
  // В поле ответа горизонтальные стрелки нужны самому полю.
  if (inAnswerField && (key === 'ArrowLeft' || key === 'ArrowRight')) return;

  const forward = key === 'ArrowDown' || key === 'ArrowRight';

  if (taskViewMode === 'single') {
    if (!lastRenderedTasks || lastRenderedTasks.length <= 1) return;
    const next = singleTaskIndex + (forward ? 1 : -1);
    if (next < 0 || next > lastRenderedTasks.length - 1) return;
    event.preventDefault();
    singleTaskIndex = next;
    renderTaskList(lastRenderedContainer, lastRenderedTasks, lastRenderedEmptyText, lastRenderedOptions);
    lastRenderedContainer?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    /* После перерисовки узлы новые, поэтому фокус ставим следующим кадром. */
    requestAnimationFrame(() => {
      const field = answerInputs()[0];
      if (field) { field.focus({ preventScroll: true }); field.select?.(); }
    });
    return;
  }

  const cards = [...(lastRenderedContainer?.querySelectorAll('.task, .compact-drill-item') || [])];
  if (cards.length < 2) return;
  const cur = currentTaskIndex();
  const next = cur < 0 ? (forward ? 0 : cards.length - 1) : cur + (forward ? 1 : -1);
  if (next < 0 || next > cards.length - 1) return;
  event.preventDefault();
  focusTaskAt(next);
});

/* ── Загрузка справочников и сессия ───────────────────────────────── */

/* Указатель опубликованных задач: тема и подтема каждой. По нему считаются
   задачи тем и подтем и прогресс. Раньше это были два запроса на всю
   таблицу, и после тысячи задач оба молча обрезались — счётчики врали. */
let publishedTaskRows = [];
async function fetchTaskIndexRows() {
  const { fetchAllRows } = window.MathTasksLib;
  const pages = cols => fetchAllRows(() => db.from('tasks').select(cols).eq('is_published', true).order('id'));
  const withSubtopics = await pages('id, topic_id, subtopic_id');
  // Колонка subtopic_id появляется миграцией 020 — без неё счёт по темам всё равно нужен.
  return withSubtopics.error ? pages('id, topic_id') : withSubtopics;
}

async function loadCatalog() {
  await detectMultilingualColumns();
  /* Без config.js клиент Supabase не создаётся. Раньше каталог просто оставался
     пустым без объяснений — на выкладке это выглядит как «сайт сломался».
     Частая причина: config.js в .gitignore, и сборка на хостинге его не получила. */
  if (!db) {
    const message = 'Сайт не подключён к базе данных: не найден public/config.js с ключами Supabase.';
    console.error(message);
    if (topicsElement) topicsElement.innerHTML = `<p class="empty-state">${escapeHtml(message)}</p>`;
    if (tasksElement) tasksElement.innerHTML = '';
    return;
  }
  const [subjectResult, topicResult, countResult] = await Promise.all([
    db.from('subjects').select('*').order('position').order('title'),
    db.from('topics').select('*').order('position').order('title'),
    fetchTaskIndexRows()
  ]);
  if (subjectResult.error || topicResult.error) {
    console.warn('Схема ещё не готова: примените миграции из supabase/migrations.', subjectResult.error || topicResult.error);
    return;
  }
  subjects = subjectResult.data || [];
  allTopics = topicResult.data || [];
  // Счётчик задач и привязка по темам для трекинга прогресса
  taskCounts = new Map();
  topicTasksMap = new Map();
  publishedTaskRows = countResult.data || [];
  publishedTaskRows.forEach(({ id, topic_id: topicId }) => {
    if (topicId) {
      taskCounts.set(topicId, (taskCounts.get(topicId) || 0) + 1);
      if (!topicTasksMap.has(topicId)) topicTasksMap.set(topicId, []);
      topicTasksMap.get(topicId).push(id);
    }
  });
  await loadSubtopics();
  renderSidebar();
}

/* Подтемы добавляет миграция 020. Пока её не применили, PostgREST отвечает
   404 на таблицу и 400 на колонку — сайт должен продолжать работать без
   третьего уровня, а не падать целиком. */
async function loadSubtopics() {
  allSubtopics = [];
  subtopicsByTopic = new Map();
  subtopicCounts = new Map();
  try {
    const { data, error } = await db.from('subtopics').select('*').order('position');
    if (error || !data) return;
    allSubtopics = data;
    for (const s of allSubtopics) {
      if (!subtopicsByTopic.has(s.topic_id)) subtopicsByTopic.set(s.topic_id, []);
      subtopicsByTopic.get(s.topic_id).push(s);
    }
    /* Подтемы задач приходят вместе с указателем в loadCatalog — второй
       проход по всей таблице задач не нужен. */
    publishedTaskRows.forEach(({ subtopic_id: id }) => {
      if (id) subtopicCounts.set(id, (subtopicCounts.get(id) || 0) + 1);
    });
  } catch (err) {
    console.warn('Подтемы недоступны: примените миграцию 020_subtopics.sql', err);
  }
}

async function refreshSession() {
  const { user, isAdmin } = await loadViewer();
  currentUser = user;
  isCurrentUserAdmin = Boolean(isAdmin);
  /* Регистрации для учеников нет, и делать им в аккаунте пока нечего,
     поэтому «Личный кабинет» из интерфейса убран. Вошедший без прав всё же
     видит диалог — иначе ему нечем было бы выйти. */
  /* Кнопка в шапке открывает диалог аккаунта, а не админку, — и называться
     должна аккаунтом. Раньше у вошедшего администратора она подписывалась
     «Админ-панель», хотя вела в диалог, где лежала вторая кнопка с тем же
     названием. Имя «Админ-панель» теперь ровно одно и ровно там, где оно
     действительно открывает панель. */
  accountButton.textContent = (window.MathTasks.t || (k => k))(user ? 'account_plain' : 'account_signin');
  accountEmail.textContent = user?.email || '';
  accountStatus.textContent = !user ? ''
    : isAdmin ? 'Вы вошли как администратор. Панель управления на отдельной странице.'
    : 'У этого аккаунта нет прав администратора.';
  /* Ссылку на админку не держим в разметке скрытой: убрать hidden в
     инструментах разработчика может кто угодно. Создаём её только после
     того, как роль подтверждена запросом к profiles.
     Права всё равно проверяются в базе политиками RLS, так что адрес сам
     по себе ничего не открывает, — это защита от лишнего любопытства,
     а не единственный барьер. */
  if (adminPanelSlot) {
    adminPanelSlot.textContent = '';
    if (isAdmin) {
      const link = document.createElement('a');
      link.className = 'primary-button';
      link.href = '/admin.html';
      link.textContent = (window.MathTasks.t || (k => k))('open_admin_panel');
      adminPanelSlot.append(link);
    }
  }

  if (currentActiveTopic && currentTopicTasks.length > 0) {
    renderPrintActions(currentTopicTasks);
  }
}
window.addEventListener('math-tasks:authenticated', refreshSession);
window.MathTasks.openAccount = () => {
  if (!currentUser) { window.MathTasks.openLogin(); return; }
  accountDialog.showModal();
};
document.querySelector('#account-dialog-close').addEventListener('click', () => accountDialog.close());
document.querySelectorAll('[data-sign-out]').forEach(button => button.addEventListener('click', async () => {
  if (db) await db.auth.signOut();
  accountDialog.close();
  await refreshSession();
}));

/* Ссылки вида #/topic/<slug> уже могли разойтись, поэтому переводим их
   на настоящий адрес до первого разбора маршрута. */
if (location.hash.startsWith('#/')) {
  history.replaceState(null, '', location.hash.slice(1));
}

/* Язык задаётся адресом. Кто выбрал латышский раньше (выбор хранится в
   браузере), с русского адреса попадает на тот же адрес /lv/… — до первого
   разбора маршрута. */
{
  const current = location.pathname + location.search;
  const wanted = langPath(current);
  if (wanted !== current) history.replaceState(null, '', wanted + location.hash);
}

/* Внутренние ссылки получают префикс языка: шаблоны пишут /topic/…, а в
   латышской версии ссылка должна вести на /lv/topic/… — и для человека,
   и для поисковика, который идёт по ссылкам. Один наблюдатель вместо правки
   десятков шаблонов; файлы, /api и админку он не трогает (localizeHref). */
function localizeLinks(root = document) {
  const lang = getLang();
  const fix = link => {
    const href = link.getAttribute('href');
    const wanted = langPath(href, lang);
    if (wanted !== href) link.setAttribute('href', wanted);
  };
  if (root.nodeType === 1 && root.matches('a[href^="/"]')) fix(root);
  root.querySelectorAll?.('a[href^="/"]').forEach(fix);
}
new MutationObserver(records => {
  for (const record of records) {
    if (record.type === 'attributes') localizeLinks(record.target);
    else record.addedNodes.forEach(node => { if (node.nodeType === 1) localizeLinks(node); });
  }
}).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['href'] });
localizeLinks(document);

/* Переключение языка (LV / RU). Язык — часть адреса, поэтому сначала адрес
   (записью в историю: «назад» вернёт прежний язык), потом язык —
   обработчик languagechange перерисует страницу уже по новому адресу. */
document.querySelector('#lang-switcher')?.addEventListener('click', event => {
  const btn = event.target.closest('.lang-btn');
  if (!btn) return;
  const lang = btn.dataset.lang;
  if (!lang || !window.MathTasksI18n || lang === getLang()) return;
  history.pushState(null, '', langPath(location.pathname + location.search, lang) + location.hash);
  lastRoute = location.pathname + location.search;
  window.MathTasksI18n.setLang(lang);
  localizeLinks(document);
});

// Ввод ответов в контрольных работах
document.addEventListener('input', event => {
  if (event.target.matches('.cw-answer-input')) {
    const taskId = Number(event.target.dataset.taskId);
    if (taskId) rememberCwAnswer(taskId, event.target.value.trim());
  }
});

// Инициализация экзаменационного таймера в шапке
window.ExamTimer = window.MathTasksLib?.initExamTimerUi ? window.MathTasksLib.initExamTimerUi(document) : null;

/* Держим на месте первую видимую задачу, а не число пикселей: на другом
   языке заголовок и панели выше списка другой высоты, и та же прокрутка
   показала бы уже другое место. 'instant' — чтобы CSS-шный
   scroll-behavior: smooth не прокатывал страницу у человека на глазах. */
function rememberScrollAnchor() {
  const y = window.scrollY;
  const anchor = [...listTasks.querySelectorAll('[id^="task-"]')]
    .find(el => el.getBoundingClientRect().bottom > 0);
  const offset = anchor?.getBoundingClientRect().top;
  return () => {
    const same = anchor && document.getElementById(anchor.id);
    if (same) window.scrollBy({ top: same.getBoundingClientRect().top - offset, behavior: 'instant' });
    else window.scrollTo({ top: y, behavior: 'instant' });
  };
}

window.addEventListener('languagechange', async () => {
  window.MathTasksI18n?.applyTranslations(document);
  renderGradeControls();
  renderSidebar();
  renderHeadings();
  const tr = window.MathTasks.t || (k => k);
  if (window.ExamTimer && window.ExamTimer.toggleBtn) {
    window.ExamTimer.toggleBtn.textContent = window.ExamTimer.isRunning ? tr('timer_pause') : tr('timer_start');
  }
  const onTopicPage = currentView === 'list' && currentActiveTopic
    && /^\/(topic|subtopic)\//.test(appPath());
  if (currentView === 'home') {
    await loadHome();
  } else if (currentView === 'progress') {
    // Страница прогресса собрана строками на старом языке — собираем заново.
    showProgress();
  } else if (onTopicPage) {
    /* Тему пересобираем на месте, а не через route(): тот заново грузит
       задачи и сбрасывает сортировку и фильтр «нерешённые». Шапку, панель
       вида/сортировки/печати и карточку контрольной рисует
       renderCurrentTopicTasks — окно страниц и режим вида он сохраняет. */
    const restoreScroll = rememberScrollAnchor();
    fillTopicHeader(currentActiveTopic, currentSubtopic);
    if (!currentSubtopic) renderTopicHeaderMeta(currentActiveTopic, currentTopicTasks);
    if (listSubtopics && !listSubtopics.hidden) {
      renderSubtopicNav(currentActiveTopic, currentSubtopic?.id);
    }
    renderCurrentTopicTasks();
    restoreScroll();
  } else if (currentView === 'list') {
    /* Задача, поиск, тег, раздел: шапку, соседей и похожие задачи каждая
       страница собирает по-своему, проще пройти маршрут заново. */
    const restoreScroll = rememberScrollAnchor();
    await route({ force: true });
    restoreScroll();
  } else if (lastRenderedContainer && lastRenderedTasks.length) {
    renderTaskList(lastRenderedContainer, lastRenderedTasks, lastRenderedEmptyText, lastRenderedOptions);
  }
});

// Адаптация открытых графиков при смене темы
window.addEventListener('themechange', () => {
  const dialog = document.querySelector('#plotter-dialog');
  if (dialog && dialog.open && typeof drawFunctionPlot === 'function') {
    drawFunctionPlot();
  }
});

// Текстовая версия страницы из воркера (worker/seo.js) нужна только без скриптов:
// дальше ту же страницу рисует приложение.
document.querySelector('#ssr-content')?.remove();

// Инициализация переводов при старте
window.MathTasksI18n?.applyTranslations(document);
window.MathTasksI18n?.updateSwitcherUI();

renderGradeControls();
renderHeadings();
(async () => {
  await loadCatalog();
  await route();
  await refreshSession();
})();
