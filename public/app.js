const { db, escapeHtml, loadViewer, renderMath, imageUrl, GRADES, fillGradeSelect, t = (k => k), getLang = () => 'ru', setLang = () => {}, applyTranslations = () => {} } = window.MathTasks;

const sidebarNav = document.querySelector('#sidebar-nav');
const gradeSelect = document.querySelector('#grade-select');
const gradePill = document.querySelector('#grade-pill');
const viewHome = document.querySelector('#view-home');
const viewList = document.querySelector('#view-list');
const viewAbout = document.querySelector('#view-about');
const topicsElement = document.querySelector('#topics');
const tasksElement = document.querySelector('#tasks');
const gradeFilter = document.querySelector('#grade-filter');
const searchInput = document.querySelector('#search-input');
const listTopics = document.querySelector('#list-topics');
const listGroups = document.querySelector('#list-groups');
const listTasks = document.querySelector('#list-tasks');
const listAnchors = document.querySelector('#list-anchors');
const listActions = document.querySelector('#list-actions');
const topicsHeading = document.querySelector('#topics-heading');
const tasksHeading = document.querySelector('#tasks-heading');
const accountButton = document.querySelector('#account-button');
const accountDialog = document.querySelector('#account-dialog');
const accountEmail = document.querySelector('#account-email');
const accountStatus = document.querySelector('#account-status');
const adminPanelSlot = document.querySelector('#admin-panel-slot');

let currentUser = null;
let subjects = [];
let allTopics = [];
let taskCounts = new Map();
let topicTasksMap = new Map();

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

const gradeLabel = grade => {
  const tr = window.MathTasks.t || (k => k);
  if (!grade) return tr('all_grades') !== 'all_grades' ? tr('all_grades') : 'Все классы';
  if (grade === 'visparigais' || grade === 'vispārīgais') return tr('grade_visparigais') !== 'grade_visparigais' ? tr('grade_visparigais') : 'Vispārīgais līmenis';
  if (grade === 'matematika-1') return tr('grade_matematika_1') !== 'grade_matematika_1' ? tr('grade_matematika_1') : 'Matemātika I (Optimālais)';
  if (grade === 'matematika-2') return tr('grade_matematika_2') !== 'grade_matematika_2' ? tr('grade_matematika_2') : 'Matemātika II (Augstākais)';
  const key = `grade_${grade}`;
  const translated = tr(key);
  if (translated && translated !== key) return translated;
  const nForm = tr('grade_N', { n: grade });
  if (nForm && nForm !== 'grade_N') return nForm;
  return `${grade} класс`;
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
  gradeSelect.value = selectedGrade ? String(selectedGrade) : '';
  let pillText = tr('all_grades_short');
  if (selectedGrade) {
    if (selectedGrade === 'visparigais') pillText = 'Visp.';
    else if (selectedGrade === 'matematika-1') pillText = 'Mat. I';
    else if (selectedGrade === 'matematika-2') pillText = 'Mat. II';
    else pillText = String(selectedGrade);
  }
  gradePill.textContent = pillText;
  gradePill.title = selectedGrade ? gradeLabel(selectedGrade) : tr('all_grades');

  const isCurrent = val => {
    if (val === '' && selectedGrade == null) return true;
    if (val === 'visparigais' && selectedGrade === 'visparigais') return true;
    if (val === 'matematika-1' && (selectedGrade === 'matematika-1' || selectedGrade === 10 || selectedGrade === 11)) return true;
    if (val === 'matematika-2' && (selectedGrade === 'matematika-2' || selectedGrade === 12)) return true;
    return String(selectedGrade ?? '') === String(val);
  };

  const renderChip = ([value, label, href, isExam]) => {
    const active = isCurrent(value);
    const cls = ['grade-chip', active ? 'active' : '', isExam ? 'grade-chip-exam' : ''].filter(Boolean).join(' ');
    return `<a class="${cls}" href="${href}"${active ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a>`;
  };

  const pamatChips = [
    ['', tr('all_grades_short') || 'Visi', '/'],
    ...[1, 2, 3, 4, 5, 6, 7, 8].map(g => [String(g), tr(`grade_${g}`) || tr('grade_N', { n: g }) || `${g}. klase`, `/grade/${g}`]),
    ['9', `${tr('grade_9') || '9. klase'} 🎯`, '/grade/9', true]
  ];

  const vidusChips = [
    ['visparigais', tr('grade_visparigais') || 'Vispārīgais līmenis', '/grade/visparigais'],
    ['matematika-1', tr('grade_matematika_1') || 'Matemātika I (Optimālais)', '/grade/matematika-1'],
    ['matematika-2', tr('grade_matematika_2') || 'Matemātika II (Augstākais)', '/grade/matematika-2']
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
  const href = chip.getAttribute('href');
  const raw = href === '/' ? null : href.replace('/grade/', '');
  if (location.pathname !== href) {
    history.pushState(null, '', href);
    lastRoute = location.pathname + location.search;
  }
  applyGrade(raw);
  const label = gradeLabel(selectedGrade);
  setMeta(
    selectedGrade ? `Задачи — ${label}` : '',
    selectedGrade ? `Разделы, темы и задачи по математике (${label}) с разбором решений.` : 'Сборник задач по школьной математике: условия, ответы и разбор решений по классам и темам.'
  );
  await loadHome();
});

// Смена класса из селектора в сайдбаре
gradeSelect.addEventListener('change', async () => {
  const raw = gradeSelect.value || null;
  const parsed = parseGradeValue(raw);
  const target = parsed ? `/grade/${parsed}` : '/';
  if (currentView === 'home' && location.pathname !== target) {
    history.pushState(null, '', target);
    lastRoute = location.pathname + location.search;
  }
  applyGrade(raw);
  if (currentView === 'home') {
    const label = gradeLabel(selectedGrade);
    setMeta(
      selectedGrade ? `Задачи — ${label}` : '',
      selectedGrade ? `Разделы, темы и задачи по математике (${label}) с разбором решений.` : 'Сборник задач по школьной математике: условия, ответы и разбор решений по классам и темам.'
    );
    await loadHome();
    return;
  }
  if (location.pathname.startsWith('/grade/')) {
    navigate(target);
    return;
  }
  route({ force: true });
});

/* ── Боковое меню: Два режима (Хаб экзаменов / Фокус на теме) ───── */

let currentActiveTopic = null;

function renderTopicSidebar(topic) {
  const subject = subjectById(topic.subject_id);
  const grade = topic.grade ?? selectedGrade;
  const gradeSlug = (grade === 10 || grade === 11 || grade === 'matematika-1') ? 'matematika-1' : (grade === 12 || grade === 'matematika-2') ? 'matematika-2' : grade;
  const backHref = grade ? `/grade/${gradeSlug}` : '/';

  // Кнопка возврата к общему списку / экзаменам
  const backBtn = `<a class="sidebar-back-button" href="${backHref}" title="Вернуться к экзаменам и каталогу">
    <span class="back-icon">←</span>
    <span class="label">${escapeHtml((window.MathTasks.t || (k => k))('all_exams_tracks'))}</span>
  </a>`;

  const topicTitle = loc(topic, 'title');
  const subjectTitle = loc(subject, 'title');

  // Контекстная плашка открытой темы
  const banner = `<div class="sidebar-topic-banner">
    <div class="topic-banner-top">
      ${grade ? `<span class="topic-banner-pill">${gradeLabel(grade)}</span>` : ''}
      <span class="topic-banner-subject">${escapeHtml(subjectTitle || 'Математика')}</span>
    </div>
    <div class="topic-banner-title">${escapeHtml(topicTitle)}</div>
  </div>`;

  // Темы текущего класса по разделам
  const gradeTopics = topicsForGrade(allTopics);
  const heading = `<div class="sidebar-focus-heading">
    <span>Темы (${gradeLabel(grade)})</span>
    <span class="focus-count">${gradeTopics.length}</span>
  </div>`;

  const groups = subjects.map((subj, index) => {
    const sTopics = gradeTopics.filter(t => t.subject_id === subj.id);
    if (!sTopics.length) return '';
    const links = sTopics.map(t => {
      const isCurrent = t.id === topic.id;
      return `<a class="${isCurrent ? 'active' : ''}" href="/topic/${encodeURIComponent(t.slug)}">${escapeHtml(loc(t, 'title'))}</a>`;
    }).join('');
    const sTitle = loc(subj, 'title');
    return `<section class="nav-group open" data-subject="${subj.id}">
      <button class="group-title" title="${escapeHtml(sTitle)}"><span class="nav-icon ${index % 2 ? 'blue' : 'purple'}">${escapeHtml(subjectIcon(subj))}</span><span class="label">${escapeHtml(sTitle)}</span><span class="chevron">⌃</span></button>
      <div class="subnav"><a class="subnav-all" href="/subject/${encodeURIComponent(subj.slug)}">${escapeHtml((window.MathTasks.t || (k => k))('subject_all_topics'))}</a>${links}</div>
    </section>`;
  }).filter(Boolean).join('');

  sidebarNav.innerHTML = backBtn + banner + heading + (groups || `<p class="subnav-empty">${(window.MathTasks.t || (k => k))('course_no_topics_yet')}</p>`);
  markActiveNav(topic.slug);
}

function renderClassSidebar(grade) {
  const label = gradeLabel(grade);
  const backHref = '/';

  const backBtn = `<a class="sidebar-back-button" href="${backHref}" title="Вернуться к экзаменам и каталогу">
    <span class="back-icon">←</span>
    <span class="label">${escapeHtml((window.MathTasks.t || (k => k))('all_exams_tracks'))}</span>
  </a>`;

  const banner = `<div class="sidebar-topic-banner">
    <div class="topic-banner-top">
      <span class="topic-banner-pill">${escapeHtml(label)}</span>
      <span class="topic-banner-subject">Каталог задач</span>
    </div>
    <div class="topic-banner-title">Все задачи курса</div>
  </div>`;

  const gradeTopics = topicsForGrade(allTopics);
  const heading = `<div class="sidebar-focus-heading">
    <span>Темы (${label})</span>
    <span class="focus-count">${gradeTopics.length}</span>
  </div>`;

  const groups = subjects.map((subj, index) => {
    const sTopics = gradeTopics.filter(t => t.subject_id === subj.id);
    if (!sTopics.length) return '';
    const links = sTopics.map(t => `<a href="/topic/${encodeURIComponent(t.slug)}">${escapeHtml(loc(t, 'title'))}</a>`).join('');
    return `<section class="nav-group open" data-subject="${subj.id}">
      <button class="group-title" title="${escapeHtml(subj.title)}"><span class="nav-icon ${index % 2 ? 'blue' : 'purple'}">${escapeHtml(subjectIcon(subj))}</span><span class="label">${escapeHtml(subj.title)}</span><span class="chevron">⌃</span></button>
      <div class="subnav"><a class="subnav-all" href="/subject/${encodeURIComponent(subj.slug)}">${escapeHtml((window.MathTasks.t || (k => k))('subject_all_topics'))}</a>${links}</div>
    </section>`;
  }).filter(Boolean).join('');

  sidebarNav.innerHTML = backBtn + banner + heading + (groups || `<p class="subnav-empty">${(window.MathTasks.t || (k => k))('course_no_topics_yet')}</p>`);
  markActiveNav();
}

function renderHubSidebar() {
  const tr = window.MathTasks.t || (k => k);
  const home = `<a class="nav-link" href="/" title="${escapeHtml(tr('nav_home'))}"><span class="nav-icon">⌂</span><span class="label">${escapeHtml(tr('nav_home'))}</span></a>`;

  const isGradeActive = val => {
    if (val === 'visparigais') return selectedGrade === 'visparigais';
    if (val === 'matematika-1') return selectedGrade === 'matematika-1' || selectedGrade === 10 || selectedGrade === 11;
    if (val === 'matematika-2') return selectedGrade === 'matematika-2' || selectedGrade === 12;
    return selectedGrade === val;
  };

  // 1. Pamatskola: 9. klases valsts eksāmens un diagnostikas darbi (3. un 6. klase)
  const pamatTrack = `
    <div class="sidebar-track-header">
      <span class="track-header-icon">🎓</span>
      <span class="track-header-title">${escapeHtml(tr('track_heading_pamat') || 'Pamatskola (1.–9. klase)')}</span>
    </div>
    <div class="sidebar-track-subgroup">
      <a class="sidebar-track-card${isGradeActive(9) ? ' active' : ''}" href="/grade/9" title="${escapeHtml(tr('track_9'))}">
        <div class="track-card-badge gold">9. kl.</div>
        <div class="track-card-body">
          <strong>${escapeHtml(tr('track_9'))} 🎯</strong>
          <span>${escapeHtml(tr('track_9_desc'))}</span>
        </div>
      </a>
    </div>

    <div class="sidebar-track-subgroup">
      <span class="track-subgroup-label">${escapeHtml(tr('track_diag'))}</span>
      <a class="sidebar-track-card${isGradeActive(3) ? ' active' : ''}" href="/grade/3" title="${escapeHtml(tr('grade_3'))}">
        <div class="track-card-badge orange">3. kl.</div>
        <div class="track-card-body">
          <strong>${escapeHtml(tr('grade_3'))}</strong>
          <span>${escapeHtml(tr('track_diag'))}</span>
        </div>
      </a>
      <a class="sidebar-track-card${isGradeActive(6) ? ' active' : ''}" href="/grade/6" title="${escapeHtml(tr('grade_6'))}">
        <div class="track-card-badge green">6. kl.</div>
        <div class="track-card-body">
          <strong>${escapeHtml(tr('grade_6'))}</strong>
          <span>${escapeHtml(tr('track_diag'))}</span>
        </div>
      </a>
    </div>
  `;

  // 2. Vidusskola: Centralizētie eksāmeni (Vispārīgais, Optimālais, Augstākais līmenis)
  const vidusTrack = `
    <div class="sidebar-track-header">
      <span class="track-header-icon">🏛️</span>
      <span class="track-header-title">${escapeHtml(tr('track_heading_vidus') || 'Vidusskola (Līmeņi)')}</span>
    </div>
    <div class="sidebar-track-subgroup">
      <a class="sidebar-track-card${isGradeActive('visparigais') ? ' active' : ''}" href="/grade/visparigais" title="${escapeHtml(tr('track_visp'))}">
        <div class="track-card-badge teal">Visp</div>
        <div class="track-card-body">
          <strong>${escapeHtml(tr('track_visp'))}</strong>
          <span>${escapeHtml(tr('track_visp_desc'))}</span>
        </div>
      </a>
      <a class="sidebar-track-card${isGradeActive('matematika-1') ? ' active' : ''}" href="/grade/matematika-1" title="${escapeHtml(tr('track_opt'))}">
        <div class="track-card-badge blue">Opt</div>
        <div class="track-card-body">
          <strong>${escapeHtml(tr('track_opt'))}</strong>
          <span>${escapeHtml(tr('track_opt_desc'))}</span>
        </div>
      </a>
      <a class="sidebar-track-card${isGradeActive('matematika-2') ? ' active' : ''}" href="/grade/matematika-2" title="${escapeHtml(tr('track_augst'))}">
        <div class="track-card-badge purple">Aug</div>
        <div class="track-card-body">
          <strong>${escapeHtml(tr('track_augst'))}</strong>
          <span>${escapeHtml(tr('track_augst_desc'))}</span>
        </div>
      </a>
    </div>
  `;

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

      <a class="sidebar-action-card${location.pathname === '/favorites' ? ' active' : ''}" href="/favorites" title="${escapeHtml(tr('nav_favorites'))}">
        <div class="action-card-icon star-icon">★</div>
        <div class="action-card-body">
          <strong>${escapeHtml(tr('nav_favorites'))}</strong>
          <span id="fav-count-text">${favCount ? `${favCount} ${escapeHtml(tr('favorite_active'))}` : '0'}</span>
        </div>
      </a>

      <a class="sidebar-action-card${location.pathname === '/tags' ? ' active' : ''}" href="/tags" title="${escapeHtml(tr('tags_label') || (getLang() === 'lv' ? 'Krustbirkas' : 'Кросс-теги'))}">
        <div class="action-card-icon tag-icon" style="background:#f0f7ff;color:#1764ff">🏷️</div>
        <div class="action-card-body">
          <strong>${escapeHtml(tr('tags_label') || (getLang() === 'lv' ? 'Krustbirkas' : 'Кросс-теги'))}</strong>
          <span>${getLang() === 'lv' ? '23 krostagi prasmēm' : '23 тега по навыкам'}</span>
        </div>
      </a>
    </div>
  `;

  sidebarNav.innerHTML = home + pamatTrack + vidusTrack + toolsSection;
  markActiveNav();
}

function renderSidebar() {
  if (currentActiveTopic) {
    renderTopicSidebar(currentActiveTopic);
  } else if (location.pathname === '/tasks' && selectedGrade) {
    renderClassSidebar(selectedGrade);
  } else {
    renderHubSidebar();
  }
}

function markActiveNav(activeTopicSlug = null) {
  const current = location.pathname;
  sidebarNav.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    const isDirectMatch = href === current;
    const isTopicMatch = Boolean(activeTopicSlug && href === `/topic/${encodeURIComponent(activeTopicSlug)}`);
    link.classList.toggle('active', isDirectMatch || isTopicMatch);
  });
}

/* ── Справочник формул Skola2030 ──────────────────────────────────── */
const FORMULAS_DATA = {
  algebra: [
    { title: 'Квадратное уравнение', math: 'ax^2 + bx + c = 0 \\implies D = b^2 - 4ac, \\; x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}' },
    { title: 'Теорема Виета', math: 'x_1 + x_2 = -\\frac{b}{a}, \\quad x_1 \\cdot x_2 = \\frac{c}{a}' },
    { title: 'Формулы сокращенного умножения', math: '(a \\pm b)^2 = a^2 \\pm 2ab + b^2, \\quad a^2 - b^2 = (a-b)(a+b)' },
    { title: 'Разность и сумма кубов', math: 'a^3 \\pm b^3 = (a \\pm b)(a^2 \\mp ab + b^2)' },
    { title: 'Арифметическая прогрессия', math: 'a_n = a_1 + (n-1)d, \\quad S_n = \\frac{a_1 + a_n}{2} \\cdot n' },
    { title: 'Геометрическая прогрессия', math: 'b_n = b_1 \\cdot q^{n-1}, \\quad S_n = \\frac{b_1(q^n - 1)}{q - 1} \\; (q \\ne 1)' },
    { title: 'Свойства логарифмов', math: '\\log_a(xy) = \\log_a x + \\log_a y, \\quad \\log_a\\left(\\frac{x}{y}\\right) = \\log_a x - \\log_a y, \\quad \\log_a(x^k) = k\\log_a x' }
  ],
  geometry: [
    { title: 'Теорема Пифагора', math: 'a^2 + b^2 = c^2 \\quad (\\text{для прямого угла})' },
    { title: 'Площадь треугольника', math: 'S = \\frac{1}{2}ah = \\frac{1}{2}ab \\sin \\gamma = \\sqrt{p(p-a)(p-b)(p-c)}' },
    { title: 'Теорема косинусов', math: 'c^2 = a^2 + b^2 - 2ab \\cos \\gamma' },
    { title: 'Теорема синусов', math: '\\frac{a}{\\sin \\alpha} = \\frac{b}{\\sin \\beta} = \\frac{c}{\\sin \\gamma} = 2R' },
    { title: 'Площадь параллелограмма и ромба', math: 'S = ah = ab \\sin \\alpha, \\quad S_{\\text{ромба}} = \\frac{1}{2}d_1 d_2' },
    { title: 'Площадь трапеции', math: 'S = \\frac{a + b}{2} \\cdot h' },
    { title: 'Окружность и круг', math: 'C = 2\\pi r, \\quad S = \\pi r^2, \\quad l_{\\text{дуги}} = \\frac{\\pi r \\alpha}{180^\\circ}' }
  ],
  trig: [
    { title: 'Основное тригонометрическое тождество', math: '\\sin^2 \\alpha + \\cos^2 \\alpha = 1, \\quad \\tan \\alpha = \\frac{\\sin \\alpha}{\\cos \\alpha}' },
    { title: 'Связь тангенса и косинуса', math: '1 + \\tan^2 \\alpha = \\frac{1}{\\cos^2 \\alpha}, \\quad 1 + \\cot^2 \\alpha = \\frac{1}{\\sin^2 \\alpha}' },
    { title: 'Формулы двойного угла', math: '\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha, \\quad \\cos 2\\alpha = \\cos^2\\alpha - \\sin^2\\alpha' },
    { title: 'Формулы сложения', math: '\\sin(\\alpha \\pm \\beta) = \\sin\\alpha\\cos\\beta \\pm \\cos\\alpha\\sin\\beta' },
    { title: 'Значения (30°, 45°, 60°)', math: '\\sin 30^\\circ = \\frac{1}{2}, \\; \\cos 30^\\circ = \\frac{\\sqrt{3}}{2}, \\; \\tan 45^\\circ = 1' }
  ],
  analysis: [
    { title: 'Таблица производных', math: '(x^n)\' = n x^{n-1}, \\quad (\\sin x)\' = \\cos x, \\quad (\\cos x)\' = -\\sin x, \\quad (e^x)\' = e^x' },
    { title: 'Правила дифференцирования', math: '(u \\pm v)\' = u\' \\pm v\', \\quad (uv)\' = u\'v + uv\', \\quad \\left(\\frac{u}{v}\\right)\' = \\frac{u\'v - uv\'}{v^2}' },
    { title: 'Геометрический смысл производной', math: 'k = f\'(x_0) = \\tan \\alpha, \\quad y = f(x_0) + f\'(x_0)(x - x_0)' },
    { title: 'Первообразные и интегралы', math: '\\int x^n dx = \\frac{x^{n+1}}{n+1} + C, \\quad \\int_a^b f(x)dx = F(b) - F(a)' },
    { title: 'Схема Бернулли (вероятность)', math: 'P_n(k) = C_n^k p^k (1-p)^{n-k}, \\quad C_n^k = \\frac{n!}{k!(n-k)!}' }
  ]
};

function renderFormulasTab(category = 'algebra') {
  const container = document.querySelector('#formulas-content');
  if (!container) return;
  const items = FORMULAS_DATA[category] || [];
  container.innerHTML = items.map(item => `
    <div class="formula-card">
      <div class="formula-card-title">${escapeHtml(item.title)}</div>
      <div class="formula-card-math">$${item.math}$</div>
    </div>
  `).join('');
  renderMath(container);
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
    const active = favs.includes(id);
    btn.classList.toggle('active', active);
    btn.textContent = active ? (window.MathTasks.t || (k => k))('fav_added') : (window.MathTasks.t || (k => k))('fav_add');
    btn.title = active ? 'В закладках' : 'Добавить в закладки';
  });

  const counter = document.querySelector('#fav-count-text');
  if (counter) {
    counter.textContent = favs.length ? (window.MathTasks.t || (k => k))('fav_counter', { count: favs.length }) : (window.MathTasks.t || (k => k))('fav_empty_short');
  }
}

/* ── Случайная задача ─────────────────────────────────────────────── */
async function openRandomTask() {
  let query = db.from('tasks').select('id, title, topic_id, grade').eq('is_published', true);
  if (selectedGrade) query = query.eq('grade', selectedGrade);
  const { data, error } = await query;
  if (error || !data || !data.length) {
    alert(selectedGrade ? `В ${selectedGrade} классе задач пока нет.` : 'Задач пока нет.');
    return;
  }
  const randomTask = data[Math.floor(Math.random() * data.length)];
  navigate(taskPath(randomTask));
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
  const alt = `${kind} к задаче «${title}» (нажмите для увеличения)`;
  return `<img class="task-figure" src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" title="Нажмите для увеличения чертежа" loading="lazy" />`;
}

/* Раскрываемая ступень: кнопка и панель идут парой, обработчик один на документ.
   Панель обязана иметь [hidden]{display:none} в стилях — авторское display
   в этом проекте уже дважды перебивало атрибут. */
function revealBlock(kind, label, body) {
  const tr = window.MathTasks.t || (k => k);
  /* Ступеней раскрытия три: ответ, подсказка, решение. Подписи берём
     по виду блока, а метку внутри — из той же строки без глагола. */
  const KEYS = {
    answer: ['reveal_answer', 'hide_answer'],
    hint: ['reveal_hint', 'hide_hint'],
    solution: ['reveal_solution', 'hide_solution']
  };
  const [showKey, hideKey] = KEYS[kind] || KEYS.solution;
  const showText = tr(showKey);
  const hideText = tr(hideKey);
  const labelText = showText.replace(/^(Rādīt|Показать|Show)\s*/i, '');
  return `<button class="solution-toggle" type="button" data-reveal aria-expanded="false"
       data-show-label="${escapeHtml(showText)}" data-hide-label="${escapeHtml(hideText)}">${escapeHtml(showText)}</button>
     <div class="reveal ${kind}" hidden><span class="reveal-label">${escapeHtml(labelText)}</span>${body}</div>`;
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
      if (!list.includes(id)) list.push(id);
    } else {
      list = list.filter(item => item !== id);
    }
    localStorage.setItem('math-tasks:solved', JSON.stringify(list));
  } catch {}
}

const normalizeMathAnswer = window.MathTasks?.normalizeMathAnswer || (val => String(val || '').trim());
const compareAnswers = window.MathTasks?.compareAnswers || ((u, c) => u === c);
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

function taskCard(task, { showTopicLink, showGrade, linkTitle, highlightQuery } = {}) {
  const tr = window.MathTasks.t || (k => k);
  currentTasksMap.set(task.id, task);
  const subject = subjectOf(task);
  const grade = showGrade ? (task.grade ?? task.topics?.grade) : null;
  const topicLink = showTopicLink && task.topics?.slug
    ? `<a class="task-topic" href="/topic/${encodeURIComponent(task.topics.slug)}">${escapeHtml(loc(task.topics, 'title'))}</a>`
    : '';
  const isFav = isFavorite(task.id);
  const favBtn = `<button class="task-action-btn${isFav ? ' active' : ''}" type="button" data-fav-id="${task.id}" title="${isFav ? escapeHtml(tr('favorite_remove')) : escapeHtml(tr('favorite'))}" aria-label="${escapeHtml(tr('favorite'))}">${isFav ? `★ ${escapeHtml(tr('favorite_active'))}` : `☆ ${escapeHtml(tr('favorite'))}`}</button>`;
  const shareBtn = `<button class="task-action-btn" type="button" data-copy-link="${task.id}" title="${escapeHtml(tr('copy_link'))}" aria-label="${escapeHtml(tr('copy_link'))}">
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
    <span>${escapeHtml(tr('copy_link'))}</span>
  </button>`;
  const copyBtn = `<button class="task-action-btn" type="button" data-copy-text="${task.id}" title="${escapeHtml(tr('copy_text'))}" aria-label="${escapeHtml(tr('copy_text'))}">
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
    <span>${escapeHtml(tr('copy_text'))}</span>
  </button>`;
  const solved = isTaskSolved(task.id);
  const solvedBadge = solved ? `<span class="task-solved-badge">${escapeHtml(tr('solved_badge'))}</span>` : '';
  const meta = [
    `<span class="tag ${tagClass(subject)}">${escapeHtml(loc(subject, 'title') || tr('subject_fallback'))}</span>`,
    grade ? `<span class="grade-badge">${gradeLabel(grade)}</span>` : '',
    difficultyBadge(task.difficulty),
    solvedBadge,
    topicLink,
    `<div class="task-actions">${shareBtn}${copyBtn}${favBtn}</div>`
  ].filter(Boolean).join('');

  const selfCheck = task.answer_latex ? `
    <div class="task-self-check" data-self-check="${task.id}">
      <div class="quick-math-bar" ${solved ? 'hidden' : ''} aria-label="Quick Math Bar">
        <span class="quick-math-bar-label" title="Quick Math">${escapeHtml(tr('quick_math_label'))}</span>
        <button type="button" class="quick-math-btn" data-insert="√(" title="√x">√x</button>
        <button type="button" class="quick-math-btn" data-insert="²" title="x²">x²</button>
        <button type="button" class="quick-math-btn" data-insert="^" title="xⁿ">xⁿ</button>
        <button type="button" class="quick-math-btn" data-insert="/" title="/">/</button>
        <button type="button" class="quick-math-btn" data-insert="π" title="π">π</button>
        <button type="button" class="quick-math-btn" data-insert="±" title="±">±</button>
        <button type="button" class="quick-math-btn" data-insert="|" title="|x|">|x|</button>
        <button type="button" class="quick-math-btn" data-insert="(" title="( )">( )</button>
        <button type="button" class="quick-math-btn" data-insert="x" title="x">x</button>
        <button type="button" class="quick-math-btn" data-insert="·" title="·">·</button>
        <button type="button" class="quick-math-btn" data-insert="≤" title="≤">≤</button>
        <button type="button" class="quick-math-btn" data-insert="≥" title="≥">≥</button>
        <button type="button" class="quick-math-btn" data-insert="∞" title="∞">∞</button>
      </div>
      <form class="self-check-form" data-check-id="${task.id}">
        <span class="self-check-icon" aria-hidden="true">✏️</span>
        <input type="text" class="self-check-input" placeholder="${escapeHtml(tr('self_check_placeholder'))}" aria-label="${escapeHtml(tr('self_check_placeholder'))}" autocomplete="off" ${solved ? `disabled value="${escapeHtml(tr('solved_badge'))}"` : ''} />
        <button type="submit" class="self-check-btn" ${solved ? 'hidden' : ''}>${escapeHtml(tr('self_check_btn'))}</button>
      </form>
      <div class="self-check-result${solved ? ' success' : ''}" ${solved ? '' : 'hidden'}>
        ${solved ? `${escapeHtml(tr('self_check_success'))} <button type="button" class="self-check-reset" data-reset-id="${task.id}">${escapeHtml(tr('self_check_reset'))}</button>` : ''}
      </div>
    </div>` : '';

  const answer = task.answer_latex
    ? revealBlock('answer', 'atbilde', '<div class="math" data-answer></div>')
    : '';
  /* Подсказка — вторая ступень: называет приём, не выдавая ответа.
     Колонка появляется миграцией 016, до неё блок просто не рисуется. */
  const taskHint = loc(task, 'hint_latex');
  const hint = taskHint
    ? revealBlock('hint', 'norāde', '<div class="math" data-hint></div>')
    : '';
  const taskTitle = loc(task, 'title');
  const taskSolution = loc(task, 'solution_latex');
  const solutionBody = `<div class="math" data-solution></div>${taskFigure(task.solution_image, taskTitle, 'Attēls pie atrisinājuma')}`;
  const solution = taskSolution || task.solution_image
    ? revealBlock('solution', 'atrisinājums', solutionBody)
    : `<p class="solution-missing">${escapeHtml(tr('solution_missing'))}</p>`;

  const titleText = highlightQuery ? highlightText(taskTitle, highlightQuery) : escapeHtml(taskTitle);
  const title = linkTitle
    ? `<a class="task-title" href="${taskPath(task)}">${titleText}</a>`
    : `<strong class="task-title">${titleText}</strong>`;

  // Кросс-теги задачи
  const rawTaskTags = Array.isArray(task.task_tags)
    ? task.task_tags.map(tt => tt.tags).filter(Boolean)
    : (Array.isArray(task.tags) ? task.tags : []);

  const tagsRowHtml = rawTaskTags.length > 0 ? `
    <div class="task-tags-row" aria-label="Теги">
      ${rawTaskTags.map(tg => {
        const tgTitle = loc(tg, 'title') || tg.title || tg.slug;
        const tgDesc = tg.description || '';
        return `<a class="task-tag-chip" href="/tag/${encodeURIComponent(tg.slug)}"${tgDesc ? ` title="${escapeHtml(tgDesc)}"` : ''}>#${escapeHtml(tgTitle)}</a>`;
      }).join('')}
    </div>` : '';

  return `<article class="task" id="task-${task.id}" data-task="${task.id}">
    <div class="task-meta">${meta}</div>
    ${title}
    ${tagsRowHtml}
    <div class="math task-condition" data-condition></div>
    ${taskFigure(task.condition_image, taskTitle, 'Zīmējums')}
    ${selfCheck}
    ${answer}
    ${hint}
    ${solution}
  </article>`;
}

/* Формулы рендерим по спискам тех задач, у которых соответствующее поле есть:
   у панелей нет собственной привязки к задаче, а порядок узлов совпадает. */
function fillTaskMath(container, tasks) {
  container.querySelectorAll('[data-condition]').forEach((element, index) => {
    renderMath(element, loc(tasks[index], 'condition_latex'));
  });
  const answerSource = tasks.filter(task => task.answer_latex);
  container.querySelectorAll('[data-answer]').forEach((element, index) => {
    renderMath(element, answerSource[index].answer_latex);
  });
  const hintSource = tasks.filter(task => loc(task, 'hint_latex'));
  container.querySelectorAll('[data-hint]').forEach((element, index) => {
    renderMath(element, loc(hintSource[index], 'hint_latex'));
  });
  const solutionSource = tasks.filter(task => loc(task, 'solution_latex'));
  container.querySelectorAll('[data-solution]').forEach((element, index) => {
    renderMath(element, loc(solutionSource[index], 'solution_latex'));
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
let lastRenderedEmptyText = '';
let lastRenderedOptions = {};

/* Метку класса показываем только там, где она что-то добавляет: внутри
   выбранного класса она одинакова у всех карточек и превращается в шум. */
function renderTaskList(container, tasks, emptyText, options = {}) {
  listCursor = -1;
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

  if (taskViewMode === 'single' && tasks.length > 1) {
    if (singleTaskIndex < 0) singleTaskIndex = 0;
    if (singleTaskIndex >= tasks.length) singleTaskIndex = 0;
    const task = tasks[singleTaskIndex];
    const currentNum = singleTaskIndex + 1;
    const totalNum = tasks.length;

    const tr = window.MathTasks.t || (k => k);
    const pagerTop = `
      <div class="single-task-pager">
        <div class="single-task-nav">
          <button type="button" class="pager-btn prev" data-pager-dir="prev" ${singleTaskIndex === 0 ? 'disabled' : ''} aria-label="${escapeHtml(tr('prev_task'))}">${escapeHtml(tr('prev_task'))}</button>
          <div class="pager-counter">
            ${tr('task_counter', { cur: `<strong>${currentNum}</strong>`, total: `<strong>${totalNum}</strong>` })}
          </div>
          <button type="button" class="pager-btn next" data-pager-dir="next" ${singleTaskIndex === totalNum - 1 ? 'disabled' : ''} aria-label="${escapeHtml(tr('next_task'))}">${escapeHtml(tr('next_task'))}</button>
        </div>
        <div class="pager-dots" role="tablist" aria-label="Tabs">
          ${tasks.map((_, i) => `
            <button type="button" class="pager-dot${i === singleTaskIndex ? ' active' : ''}" data-pager-idx="${i}" title="${i + 1}" aria-label="${i + 1}">${i + 1}</button>
          `).join('')}
        </div>
      </div>
    `;

    const cardHtml = taskCard(task, { showTopicLink, showGrade, linkTitle, highlightQuery });

    const pagerBottom = `
      <div class="single-task-bottom-nav">
        <button type="button" class="text-button" data-pager-dir="prev" ${singleTaskIndex === 0 ? 'disabled' : ''}>${escapeHtml(tr('prev_task'))}</button>
        <span class="pager-shortcuts-hint">${escapeHtml(tr('keyboard_shortcuts_hint'))}</span>
        <button type="button" class="text-button" data-pager-dir="next" ${singleTaskIndex === totalNum - 1 ? 'disabled' : ''}>${escapeHtml(tr('next_task'))}</button>
      </div>
    `;

    container.innerHTML = pagerTop + cardHtml + pagerBottom;
    fillTaskMath(container, [task]);
  } else if (taskViewMode === 'compact') {
    const tr = window.MathTasks.t || (k => k);
    const cleanFn = (window.MathTasksLib && window.MathTasksLib.cleanMathExample) || (s => s);
    const solvedTotal = tasks.filter(t => isTaskSolved(t.id)).length;

    const itemsHtml = tasks.map((task, index) => {
      const solved = isTaskSolved(task.id);
      const taskTitle = loc(task, 'title');
      const hasAnswer = Boolean(task.answer_latex);
      const cleanAnswer = task.answer_latex ? task.answer_latex.replace(/^\$+|\$+$/g, '') : '';
      /* Кнопка чертежа появляется только у задач, к которым чертёж
         действительно загружен: подставного показывать нельзя. */
      const figureUrl = task.condition_image ? imageUrl(task.condition_image) : '';

      return `
        <div class="compact-drill-item${solved ? ' is-solved' : ''}" data-task-id="${task.id}" id="drill-task-${task.id}">
          <span class="compact-drill-num" title="${escapeHtml(taskTitle)}">${index + 1}.</span>
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
            <a href="${taskPath(task)}" class="compact-drill-link-btn" title="${escapeHtml(taskTitle)}" target="_blank" aria-label="Открыть задачу">↗</a>
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

    container.innerHTML = `<div class="task-compact-container">${bannerHtml}<div class="task-compact-grid">${itemsHtml}</div></div>`;

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
    container.innerHTML = tasks.map(task => taskCard(task, { showTopicLink, showGrade, linkTitle, highlightQuery })).join('');
    fillTaskMath(container, tasks);
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
  if (!dialog || !img) return;
  scrollBeforeLightbox = window.scrollY;
  img.src = src;
  img.alt = alt || '';
  // До открытия картинка скрыта: img без src невалиден и скринридер
  // объявляет его как «пустое изображение».
  img.hidden = false;
  if (caption) caption.textContent = alt || '';
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  requestAnimationFrame(() => window.scrollTo({ top: scrollBeforeLightbox }));
}

document.querySelector('#lightbox-dialog')?.addEventListener('close', () => {
  window.scrollTo({ top: scrollBeforeLightbox });
});

// Одно делегирование на документ — карточки перерисовываются при каждом переходе.
document.addEventListener('click', event => {
  const toggle = event.target.closest('[data-reveal]');
  if (!toggle) return;
  const panel = toggle.nextElementSibling;
  const shown = !panel.hidden;
  panel.hidden = shown;
  toggle.setAttribute('aria-expanded', String(!shown));
  toggle.textContent = shown ? toggle.dataset.showLabel : toggle.dataset.hideLabel;
});

/* ── Карточки тем ─────────────────────────────────────────────────── */

function topicCard(topic, index, showGrade) {
  const tr = window.MathTasks.t || (k => k);
  const subject = subjectById(topic.subject_id);
  const count = taskCount(topic.id);
  const progress = getTopicProgress(topic.id);

  let progressBadge = '';
  if (count > 0 && progress.solved > 0) {
    progressBadge = `<span class="topic-progress-badge${progress.isComplete ? ' done' : ''}" title="${escapeHtml(tr('topic_progress', { solved: progress.solved, total: progress.total, percent: progress.percent }))}">
      ${progress.isComplete ? '✓ ' : ''}${progress.solved}/${progress.total} (${progress.percent}%)
    </span>`;
  }

  const progressBar = (count > 0 && progress.solved > 0) ? `
    <div class="topic-progress-bar-wrap" title="${escapeHtml(tr('topic_progress', { solved: progress.solved, total: progress.total, percent: progress.percent }))}">
      <div class="topic-progress-bar-fill${progress.isComplete ? ' done' : ''}" style="width: ${progress.percent}%"></div>
    </div>
  ` : '';

  const badges = [
    showGrade && topic.grade ? `<span class="grade-badge">${gradeLabel(topic.grade)}</span>` : '',
    `<span class="topic-count">${count ? tr('tasks_in_topic', { count }) : tr('topic_no_tasks')}</span>`,
    progressBadge
  ].filter(Boolean).join('');

  const topicTitle = loc(topic, 'title');
  const topicDesc = loc(topic, 'description');

  return `<a class="topic-card" href="/topic/${encodeURIComponent(topic.slug)}">
    <div class="topic-icon ${topicClass(index)}">${escapeHtml(subjectIcon(subject))}</div>
    <div class="topic-card-content">
      <h3>${escapeHtml(topicTitle)}</h3>
      <p>${escapeHtml(topicDesc || '')}</p>
      ${progressBar}
      <div class="topic-badges">${badges}</div>
    </div>
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
      <h2><span class="topic-group-icon">${escapeHtml(subjectIcon(subject))}</span>${escapeHtml(loc(subject, 'title'))}</h2>
      <a href="/subject/${encodeURIComponent(subject.slug)}">Все темы →</a>
    </div>
    ${topics.length
      ? `<div class="topic-grid">${topics.map((topic, index) => topicCard(topic, index, false)).join('')}</div>`
      : `<p class="empty-state">${selectedGrade ? `В ${selectedGrade} классе тем нет.` : 'Тем пока нет.'}</p>`}
  </section>`).join('');
}

/* ── Главная ──────────────────────────────────────────────────────── */

function renderHeadings() {
  const tr = window.MathTasks.t || (k => k);
  const suffix = selectedGrade ? ` — ${gradeLabel(selectedGrade)}` : '';
  topicsHeading.textContent = (selectedGrade ? (tr('topics_heading') || 'Tēmas') : tr('popular_topics')) + suffix;
  tasksHeading.textContent = tr('new_tasks') + suffix;
}

async function loadHome() {
  const topics = topicsForGrade(allTopics);
  topicsElement.innerHTML = topics.length
    ? topics.map((topic, index) => topicCard(topic, index, !selectedGrade)).join('')
    : `<p class="empty-state">${selectedGrade ? `Тем для ${gradeLabel(selectedGrade)} пока нет.` : 'Темы ещё не добавлены.'}</p>`;

  let query = db.from('tasks').select(TASK_SELECT).eq('is_published', true).order('created_at', { ascending: false }).limit(10);
  if (selectedGrade === 'matematika-1' || selectedGrade === 10 || selectedGrade === 11) {
    query = query.in('grade', [10, 11]);
  } else if (selectedGrade === 'matematika-2' || selectedGrade === 12) {
    query = query.eq('grade', 12);
  } else if (selectedGrade) {
    query = query.eq('grade', Number(selectedGrade));
  }
  const { data, error } = await query;
  if (error) { console.warn('Не удалось загрузить задачи.', error); return; }
  renderTaskList(tasksElement, data || [], selectedGrade ? `Задач для ${gradeLabel(selectedGrade)} пока нет.` : 'Задач пока нет. Загляните позже.');
}

/* ── Виды и заголовок списка ──────────────────────────────────────── */

let currentView = null;
function showView(name) {
  viewHome.hidden = name !== 'home';
  viewList.hidden = name !== 'list';
  viewAbout.hidden = name !== 'about';
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

// Каждый список сам решает, что ему нужно; остальные контейнеры гасим.
function resetListBlocks() {
  document.querySelector('#similar-tasks')?.remove();
  renderTopicCards(listTopics, []);
  renderTopicGroups(listGroups, []);
  listTasks.innerHTML = '';
  listAnchors.hidden = true;
  listAnchors.innerHTML = '';
  listActions.hidden = true;
  listActions.innerHTML = '';
  document.querySelector('#task-nav')?.remove();
}

const gradeCrumb = () => (selectedGrade ? [gradeLabel(selectedGrade), `/grade/${selectedGrade}`] : [(window.MathTasks?.t ? window.MathTasks.t('all_grades') : 'Все классы'), '/']);

/* ── Страница класса ──────────────────────────────────────────────── */

async function showGradePage(rawGrade) {
  const grade = parseGradeValue(rawGrade);
  if (!grade) {
    applyGrade(null);
    showView('home');
    setMeta('', 'Сборник задач по школьной математике: условия, ответы и разбор решений по классам и темам.');
    await loadHome();
    return;
  }
  if (selectedGrade !== grade) {
    applyGrade(grade);
  }
  showView('home');
  const label = gradeLabel(grade);
  setMeta(`Задачи — ${label}`, `Разделы, темы и задачи по математике (${label}) с разбором решений.`);
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
    setMeta('Раздел не найден');
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
  setMeta(title, `Темы раздела «${subject.title}» по всем классам (1–12) с задачами и решениями.`);

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
function renderTopicAnchors(tasks) {
  const enough = tasks.length >= 3;
  listAnchors.hidden = !enough;
  if (!enough) { listAnchors.innerHTML = ''; return; }
  listAnchors.innerHTML = `<span class="topic-anchors-label">${(window.MathTasks.t || (k => k))('anchors_label')}</span>` + tasks
    .map((task, index) => `<a class="topic-anchor" href="#task-${task.id}" title="${escapeHtml(task.title)}">${index + 1}</a>`)
    .join('');
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

function renderCurrentTopicTasks() {
  const tr = window.MathTasks.t || (k => k);
  const tasksToRender = filterOnlyUnsolved
    ? currentTopicTasks.filter(t => !isTaskSolved(t.id))
    : currentTopicTasks;

  const emptyText = filterOnlyUnsolved
    ? tr('all_tasks_solved')
    : 'В этой теме задач пока нет.';

  renderTaskList(listTasks, tasksToRender, emptyText, { showTopicLink: false, showGrade: true });
  renderTopicAnchors(tasksToRender);
  renderPrintActions(currentTopicTasks);
}

function renderPrintActions(tasks) {
  const enough = tasks.length > 0;
  listActions.hidden = !enough;
  if (!enough) { listActions.innerHTML = ''; return; }
  const tr = window.MathTasks.t || (k => k);

  const viewToggle = tasks.length > 1 ? `
    <div class="view-mode-toggle" role="radiogroup" aria-label="${escapeHtml(tr('view_mode'))}">
      <span class="view-mode-label">${escapeHtml(tr('view_mode'))}</span>
      <button class="view-mode-btn${taskViewMode === 'list' ? ' active' : ''}" type="button" data-view-mode="list" title="${escapeHtml(tr('view_mode_list'))}">
        <span class="view-mode-icon">☰</span> ${escapeHtml(tr('view_mode_list'))}
      </button>
      <button class="view-mode-btn${taskViewMode === 'compact' ? ' active' : ''}" type="button" data-view-mode="compact" title="${escapeHtml(tr('view_mode_compact'))}">
        <span class="view-mode-icon">⚡</span> ${escapeHtml(tr('view_mode_compact'))}
      </button>
      <button class="view-mode-btn${taskViewMode === 'single' ? ' active' : ''}" type="button" data-view-mode="single" title="${escapeHtml(tr('view_mode_single'))}">
        <span class="view-mode-icon">📄</span> ${escapeHtml(tr('view_mode_single'))} (${tasks.length})
      </button>
    </div>
  ` : '';

  const solvedCount = tasks.filter(t => isTaskSolved(t.id)).length;
  const unsolvedFilterBtn = (tasks.length > 1 && solvedCount > 0) ? `
    <button class="view-mode-btn${filterOnlyUnsolved ? ' active' : ''}" type="button" data-toggle-unsolved="true" title="${escapeHtml(tr('filter_unsolved_title'))}">
      <span class="view-mode-icon">🎯</span> ${escapeHtml(tr('filter_unsolved'))} ${filterOnlyUnsolved ? `(${tasks.length - solvedCount})` : ''}
    </button>
  ` : '';

  listActions.innerHTML = `
    ${viewToggle}
    ${unsolvedFilterBtn}
    <div class="print-actions-group">
      <span class="list-actions-label">${escapeHtml(tr('print'))}:</span>
      <button class="ghost-button" type="button" data-print="full">${escapeHtml(tr('print_with_solutions'))}</button>
      <button class="ghost-button" type="button" data-print="blank">${escapeHtml(tr('print_no_solutions'))}</button>
    </div>
  `;
}

listActions.addEventListener('click', event => {
  const button = event.target.closest('[data-print]');
  if (button) printTasks(button.dataset.print === 'full');
  const filterBtn = event.target.closest('[data-toggle-unsolved]');
  if (filterBtn) {
    filterOnlyUnsolved = !filterOnlyUnsolved;
    renderCurrentTopicTasks();
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
    setMeta('Тема не найдена');
    renderSidebar();
    return;
  }
  // Переключаем контекст класса и переводим сайдбар в фокус-режим темы
  currentActiveTopic = topic;
  if (topic.grade && selectedGrade !== topic.grade) {
    applyGrade(topic.grade);
  } else {
    renderSidebar();
  }
  const tr = window.MathTasks.t || (k => k);
  const subject = subjectById(topic.subject_id);
  const topicTitle = loc(topic, 'title');
  const topicDesc = loc(topic, 'description');
  const subjectTitle = loc(subject, 'title');

  const crumbs = [[(window.MathTasks.t || (k => k))('nav_home'), '/']];
  if (topic.grade) crumbs.push([gradeLabel(topic.grade), `/grade/${topic.grade}`]);
  if (subject) crumbs.push([subjectTitle, `/subject/${encodeURIComponent(subject.slug)}`]);
  crumbs.push([topicTitle, null]);

  fillListHeader({
    crumbs,
    title: topicTitle,
    description: topicDesc || '',
    meta: topic.grade ? `<span class="grade-badge">${gradeLabel(topic.grade)}</span>` : ''
  });
  setMeta(topic.grade ? `${topicTitle}, ${gradeLabel(topic.grade)}` : topicTitle,
    topicDesc || `Задачи по теме «${topicTitle}» с условиями, ответами и разбором решений.`);
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

  const prog = getTopicProgress(topic.id);
  const progHtml = prog.total > 0 ? `
    <div class="topic-header-progress${prog.isComplete ? ' done' : ''}" id="topic-header-progress">
      <span class="topic-header-progress-text">${prog.isComplete ? escapeHtml(tr('topic_mastered')) : escapeHtml(tr('topic_progress', { solved: prog.solved, total: prog.total, percent: prog.percent }))}</span>
      <div class="topic-header-progress-bar">
        <div class="topic-header-progress-fill" style="width: ${prog.percent}%"></div>
      </div>
    </div>
  ` : '';

  const metaEl = document.querySelector('#list-meta');
  if (metaEl) {
    const gradeBadge = topic.grade ? `<span class="grade-badge">${gradeLabel(topic.grade)}</span>` : '';
    metaEl.innerHTML = `${gradeBadge} ${progHtml}`;
  }

  renderCurrentTopicTasks();
}

/* ── Все задачи ───────────────────────────────────────────────────── */

async function showAllTasks() {
  showView('list');
  resetListBlocks();
  fillListHeader({
    crumbs: [[(window.MathTasks.t || (k => k))('nav_home'), '/'], gradeCrumb(), ['Все задачи', null]],
    title: selectedGrade ? `Все задачи — ${gradeLabel(selectedGrade)}` : 'Все задачи'
  });
  setMeta(selectedGrade ? `Все задачи, ${gradeLabel(selectedGrade)}` : 'Все задачи',
    'Полный список задач с разбором решений.');
  renderSidebar();

  listTasks.innerHTML = `<p class="empty-state">${(window.MathTasks.t || (k => k))('state_loading_tasks')}</p>`;
  let query = db.from('tasks').select(TASK_SELECT).eq('is_published', true).order('created_at', { ascending: false }).limit(200);
  if (selectedGrade === 'matematika-1' || selectedGrade === 10 || selectedGrade === 11) {
    query = query.in('grade', [10, 11]);
  } else if (selectedGrade === 'matematika-2' || selectedGrade === 12) {
    query = query.eq('grade', 12);
  } else if (selectedGrade) {
    query = query.eq('grade', Number(selectedGrade));
  }
  const { data, error } = await query;
  if (error) { listTasks.innerHTML = `<p class="empty-state">${(window.MathTasks.t || (k => k))('err_load_tasks')}</p>`; return; }
  renderPrintActions(data || []);
  renderTaskList(listTasks, data || [], 'Задач пока нет.');
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
  setMeta('Мои закладки', 'Сохранённые задачи по математике для повторения.');

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

  renderPrintActions(data || []);
  renderTaskList(listTasks, data, 'Закладок нет.', { showTopicLink: true, showGrade: true });
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
  setMeta(`Поиск: ${query}`, `Результаты поиска по задачам: ${query}.`);
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
    orClauses.push(`title.ilike.*${safe}*,condition_latex.ilike.*${safe}*,answer_latex.ilike.*${safe}*,solution_latex.ilike.*${safe}*`);
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
    ? `<a class="search-escape" href="/search?q=${encodeURIComponent(query)}&all=1">Искать во всех классах →</a>`
    : '';

  const matchedTagsHtml = matchedTags.length > 0 ? `
    <div class="search-matched-tags">
      <span class="search-matched-tags-label">${loc({ title: 'Кросс-теги', title_lv: 'Krustbirkas' }, 'title')}:</span>
      ${matchedTags.map(t => `<a class="task-tag-chip" href="/tag/${encodeURIComponent(t.slug)}" title="${escapeHtml(t.description || '')}">#${escapeHtml(loc(t, 'title'))}</a>`).join('')}
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
    if (location.pathname === '/search') navigate('/', { replace: true });
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
  const full = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — сборник задач по математике`;
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
  if (!Number.isFinite(id)) { notFound(); setMeta('Задача не найдена'); return; }

  listTasks.innerHTML = `<p class="empty-state">${(window.MathTasks.t || (k => k))('state_loading_task')}</p>`;
  const { data, error } = await db.from('tasks').select(TASK_SELECT)
    .eq('is_published', true).eq('id', id).limit(1);
  const task = data?.[0];
  if (error || !task) { notFound(); listTasks.innerHTML = ''; setMeta('Задача не найдена'); return; }

  const topic = allTopics.find(item => item.id === task.topic_id);
  const subject = topic ? subjectById(topic.subject_id) : null;
  const grade = task.grade ?? topic?.grade;
  currentActiveTopic = topic || null;
  if (grade && selectedGrade !== grade) {
    applyGrade(grade);
  } else {
    renderSidebar();
  }
  const taskTitle = loc(task, 'title');
  const topicTitle = loc(topic, 'title');
  const subjectTitle = loc(subject, 'title');

  const crumbs = [[(window.MathTasks.t || (k => k))('nav_home'), '/']];
  if (grade) crumbs.push([gradeLabel(grade), `/grade/${grade}`]);
  if (subject) crumbs.push([subjectTitle, `/subject/${encodeURIComponent(subject.slug)}`]);
  if (topic) crumbs.push([topicTitle, `/topic/${encodeURIComponent(topic.slug)}`]);
  crumbs.push([taskTitle, null]);

  fillListHeader({
    crumbs,
    title: taskTitle,
    description: '',
    meta: grade ? `<span class="grade-badge">${gradeLabel(grade)}</span>` : ''
  });
  setMeta(
    topic ? `${taskTitle} — ${topicTitle}${grade ? `, ${gradeLabel(grade)}` : ''}` : taskTitle,
    `${taskTitle}: условие, ответ и подробное решение.${topic ? ` Тема «${topicTitle}».` : ''}`
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
        const desc = tag.description || '';
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
    setMeta('Тег не найден');
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
  setMeta(`#${tagTitle}`, tagDesc || `Задачи с тегом #${tagTitle}`);
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
        const { data: links, error: linkErr } = await db.from('task_tags').select('task_id').eq('tag_id', tagId);
        if (!linkErr && links && links.length > 0) {
          const taskIds = links.map(l => l.task_id);
          const taskQuery = db.from('tasks').select(TASK_SELECT).eq('is_published', true).in('id', taskIds);
          const { data, error } = await taskQuery
            .order('grade', { ascending: true })
            .order('position', { ascending: true })
            .order('created_at', { ascending: true });
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

  renderPrintActions(tasks);
  renderTaskList(listTasks, tasks, tr('tag_empty') || (currentLang === 'lv' ? 'Šai birkai pagaidām nav pievienots neviens uzdevums.' : 'Задач с этим тегом пока нет.'), { showTopicLink: true, showGrade: true });
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

  const path = location.pathname || '/';
  const params = new URLSearchParams(location.search);

  // Сброс контекста темы в сайдбаре при уходе со страницы темы или задачи
  if (!path.startsWith('/topic/') && !path.startsWith('/task/')) {
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

  const gradeMatch = path.match(/^\/grade\/(.+)$/);
  if (gradeMatch) { await showGradePage(decodeURIComponent(gradeMatch[1])); return; }

  const subjectMatch = path.match(/^\/subject\/(.+)$/);
  if (subjectMatch) { showSubject(decodeURIComponent(subjectMatch[1])); return; }

  const topicMatch = path.match(/^\/topic\/(.+)$/);
  if (topicMatch) { await showTopic(decodeURIComponent(topicMatch[1])); return; }

  const taskMatch = path.match(/^\/task\/(\d+)/);
  if (taskMatch) { await showTask(taskMatch[1]); return; }

  const tagMatch = path.match(/^\/tag\/([^\/]+)/);
  if (tagMatch) { await showTag(decodeURIComponent(tagMatch[1])); return; }

  if (path === '/tags') { await showTagsList(); return; }

  if (path === '/tasks') { await showAllTasks(); return; }
  if (path === '/favorites') { await showFavorites(); return; }
  if (path === '/about') { showView('about'); setMeta('О сайте', 'Как устроен MathTasks: классы, разделы, темы и разбор решений.'); return; }

  showView('home');
  setMeta('', 'Сборник задач по школьной математике: условия, ответы и разбор решений по классам и темам.');
  await loadHome();
}
window.addEventListener('popstate', () => route());

/* Переходы идут через History API: адрес /topic/<slug> должен быть настоящим,
   иначе поисковик видит один и тот же документ на все темы сразу. */
function navigate(path, { replace = false } = {}) {
  if (location.pathname + location.search === path) return;
  history[replace ? 'replaceState' : 'pushState'](null, '', path);
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
  const tr = window.MathTasks.t || (k => k);
  const prog = getTopicProgress(currentActiveTopic.id);
  const progEl = document.querySelector('#topic-header-progress');
  if (progEl) {
    progEl.className = `topic-header-progress${prog.isComplete ? ' done' : ''}`;
    const textEl = progEl.querySelector('.topic-header-progress-text');
    if (textEl) {
      textEl.textContent = prog.isComplete
        ? tr('topic_mastered')
        : tr('topic_progress', { solved: prog.solved, total: prog.total, percent: prog.percent });
    }
    const fillEl = progEl.querySelector('.topic-header-progress-fill');
    if (fillEl) {
      fillEl.style.width = `${prog.percent}%`;
    }
  }
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
  const isCorrect = compareAnswers(userAns, task.answer_latex);
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
    if (card && !card.querySelector('.task-solved-badge')) {
      const meta = card.querySelector('.task-meta');
      if (meta) {
        const badge = document.createElement('span');
        badge.className = 'task-solved-badge';
        badge.textContent = tr('solved_badge');
        meta.appendChild(badge);
      }
    }
    updateTopicHeaderProgress();
  } else {
    resultDiv.className = 'self-check-result error';
    resultDiv.innerHTML = escapeHtml(tr('self_check_error'));
    resultDiv.hidden = false;
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

  if (titleEl) titleEl.textContent = loc(task, 'title');
  if (condEl) {
    condEl.innerHTML = '';
    renderMath(condEl, loc(task, 'condition_latex'));
  }
  if (ansEl && ansSec) {
    if (task.answer_latex) {
      ansSec.hidden = false;
      ansEl.innerHTML = '';
      renderMath(ansEl, task.answer_latex);
    } else {
      ansSec.hidden = true;
    }
  }
  if (solEl && solSec) {
    const sol = loc(task, 'solution_latex');
    if (sol) {
      solSec.hidden = false;
      solEl.innerHTML = '';
      renderMath(solEl, sol);
    } else {
      solSec.hidden = true;
    }
  }

  if (typeof dialog.showModal === 'function') dialog.showModal();
}

/* Сколько раз ученик нажал Enter на этой задаче с неверным ответом. */
const drillAttempts = new Map();

// Обработка ввода и проверки ответов в компактном тренажёре
document.addEventListener('keydown', event => {
  const input = event.target.closest('.compact-drill-input');
  if (!input) return;
  const tr = window.MathTasks.t || (k => k);

  if (event.key === 'Enter') {
    event.preventDefault();
    const taskId = Number(input.dataset.drillId);
    const task = currentTasksMap.get(taskId);
    if (!task) return;

    const userAns = input.value.trim();
    if (!userAns) return;

    const isCorrect = compareAnswers(userAns, task.answer_latex);
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
          renderMath(noteEl.querySelector('[data-note-answer]'), task.answer_latex || '');
        }
        noteEl.hidden = false;
      }
      input.select();
    }
  }
});

document.addEventListener('input', event => {
  const input = event.target.closest('.compact-drill-input');
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
    if (mathBtn.dataset.insert) {
      const checkBlock = mathBtn.closest('.task-self-check');
      const input = checkBlock?.querySelector('.self-check-input');
      if (input && !input.disabled) {
        insertIntoInput(input, mathBtn.dataset.insert);
      }
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
      if (quickBar) quickBar.hidden = false;
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
      document.querySelectorAll('[data-view-mode]').forEach(b => b.classList.toggle('active', b.dataset.viewMode === mode));
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
  const cards = [...(lastRenderedContainer?.querySelectorAll('.task, .compact-drill-item') || [])];
  if (!cards.length) return false;
  const i = Math.min(cards.length - 1, Math.max(0, index));
  listCursor = i;
  cards.forEach((c, n) => c.classList.toggle('is-current', n === i));
  cards[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
  /* Переход сразу в поле ответа: ученик набирает, не трогая мышь. */
  const field = cards[i].querySelector('.compact-drill-input:not([disabled]), .self-check-input:not([disabled])');
  if (field) { field.focus(); field.select?.(); }
  return true;
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
      if (field) { field.focus(); field.select?.(); }
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
    db.from('tasks').select('id, topic_id').eq('is_published', true)
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
  (countResult.data || []).forEach(({ id, topic_id: topicId }) => {
    if (topicId) {
      taskCounts.set(topicId, (taskCounts.get(topicId) || 0) + 1);
      if (!topicTasksMap.has(topicId)) topicTasksMap.set(topicId, []);
      topicTasksMap.get(topicId).push(id);
    }
  });
  renderSidebar();
}

async function refreshSession() {
  const { user, isAdmin } = await loadViewer();
  currentUser = user;
  /* Регистрации для учеников нет, и делать им в аккаунте пока нечего,
     поэтому «Личный кабинет» из интерфейса убран. Вошедший без прав всё же
     видит диалог — иначе ему нечем было бы выйти. */
  accountButton.textContent = user ? (isAdmin ? (window.MathTasks.t || (k => k))('account_admin') : (window.MathTasks.t || (k => k))('account_plain')) : (window.MathTasks.t || (k => k))('account_signin');
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

// Переключение языка (LV / RU)
document.querySelector('#lang-switcher')?.addEventListener('click', event => {
  const btn = event.target.closest('.lang-btn');
  if (!btn) return;
  const lang = btn.dataset.lang;
  if (lang && window.MathTasksI18n) {
    window.MathTasksI18n.setLang(lang);
  }
});

window.addEventListener('languagechange', async () => {
  window.MathTasksI18n?.applyTranslations(document);
  fillGradeSelect(gradeSelect, window.MathTasks.t('all_grades'));
  renderGradeControls();
  renderSidebar();
  renderHeadings();
  const tr = window.MathTasks.t || (k => k);
  if (ExamTimer.toggleBtn) {
    ExamTimer.toggleBtn.textContent = ExamTimer.isRunning ? tr('timer_pause') : tr('timer_start');
  }
  if (currentView === 'home') {
    await loadHome();
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

// Инициализация переводов при старте
window.MathTasksI18n?.applyTranslations(document);
window.MathTasksI18n?.updateSwitcherUI();

fillGradeSelect(gradeSelect, window.MathTasks.t ? window.MathTasks.t('all_grades') : 'Все классы');
renderGradeControls();
renderHeadings();
(async () => {
  await loadCatalog();
  await route();
  await refreshSession();
})();
