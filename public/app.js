const { db, escapeHtml, loadViewer, renderMath, GRADES, fillGradeSelect } = window.MathTasks;

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
const topicsHeading = document.querySelector('#topics-heading');
const tasksHeading = document.querySelector('#tasks-heading');
const accountButton = document.querySelector('#account-button');
const accountDialog = document.querySelector('#account-dialog');
const accountEmail = document.querySelector('#account-email');
const accountStatus = document.querySelector('#account-status');
const openAdminPanelLink = document.querySelector('#open-admin-panel');

let currentUser = null;
let subjects = [];
let allTopics = [];
let taskCounts = new Map();

/* Класс — глобальный контекст: он выбирается один раз и определяет,
   что показывают меню, главная, страницы разделов и поиск. */
let selectedGrade = null;
try {
  const stored = Number(localStorage.getItem('math-tasks:grade'));
  if (GRADES.includes(stored)) selectedGrade = stored;
} catch {}

const TASK_SELECT = '*, topics(title, slug, subjects(title, icon))';
const subjectOf = task => task.topics?.subjects;
const tagClass = subject => (subject?.title === 'Геометрия' ? 'geometry' : 'algebra');
const subjectById = id => subjects.find(item => item.id === id);
const topicClass = index => ['lavender', 'green', 'orange', 'blue', 'pink', 'aqua', 'violet'][index % 7];
const gradeLabel = grade => `${grade} класс`;
// В контексте класса показываем только его темы; тема без класса живёт лишь в режиме «Все классы».
const topicsForGrade = list => (selectedGrade ? list.filter(topic => topic.grade === selectedGrade) : list);
const taskCount = topicId => taskCounts.get(topicId) || 0;

/* ── Контекст класса ──────────────────────────────────────────────── */

function renderGradeControls() {
  gradeSelect.value = selectedGrade ? String(selectedGrade) : '';
  gradePill.textContent = selectedGrade ? String(selectedGrade) : 'Все';
  gradePill.title = selectedGrade ? gradeLabel(selectedGrade) : 'Все классы';

  const chips = [['', 'Все классы', '#/'], ...GRADES.map(grade => [String(grade), gradeLabel(grade), `#/grade/${grade}`])];
  gradeFilter.innerHTML = chips.map(([value, label, href]) => {
    const active = String(selectedGrade ?? '') === value;
    return `<a class="grade-chip${active ? ' active' : ''}" href="${href}"${active ? ' aria-current="page"' : ''}>${label}</a>`;
  }).join('');
}

function applyGrade(grade) {
  selectedGrade = grade;
  try {
    if (grade) localStorage.setItem('math-tasks:grade', String(grade));
    else localStorage.removeItem('math-tasks:grade');
  } catch {}
  renderGradeControls();
  renderSidebar();
  renderHeadings();
}

// Смена класса из селектора: со страницы класса уводим на её же новый адрес,
// в остальных случаях просто перерисовываем текущий вид — тему не теряем.
gradeSelect.addEventListener('change', () => {
  const grade = gradeSelect.value ? Number(gradeSelect.value) : null;
  applyGrade(grade);
  const path = location.hash.replace(/^#/, '').split('?')[0];
  if (path.startsWith('/grade/')) {
    location.hash = grade ? `#/grade/${grade}` : '#/';
    return;
  }
  route();
});

/* ── Боковое меню ─────────────────────────────────────────────────── */

function renderSidebar() {
  const home = '<a class="nav-link" href="#/" title="Главная"><span class="nav-icon">⌂</span><span class="label">Главная</span></a>';
  const groups = subjects.map((subject, index) => {
    const topics = topicsForGrade(allTopics.filter(topic => topic.subject_id === subject.id));
    const links = topics.length
      ? topics.map(topic => {
          const badge = selectedGrade || !topic.grade ? '' : `<span class="subnav-grade">${topic.grade}</span>`;
          return `<a href="#/topic/${encodeURIComponent(topic.slug)}">${escapeHtml(topic.title)}${badge}</a>`;
        }).join('')
      : `<span class="subnav-empty">${selectedGrade ? `В ${selectedGrade} классе тем нет` : 'Тем пока нет'}</span>`;
    return `<section class="nav-group open" data-subject="${subject.id}">
      <button class="group-title" title="${escapeHtml(subject.title)}"><span class="nav-icon ${index % 2 ? 'blue' : 'purple'}">${escapeHtml(subject.icon)}</span><span class="label">${escapeHtml(subject.title)}</span><span class="chevron">⌃</span></button>
      <div class="subnav"><a class="subnav-all" href="#/subject/${encodeURIComponent(subject.slug)}">Все темы раздела</a>${links}</div>
    </section>`;
  }).join('');
  sidebarNav.innerHTML = home + groups;
  markActiveNav();
}

function markActiveNav() {
  const hash = location.hash || '#/';
  sidebarNav.querySelectorAll('a').forEach(link => link.classList.toggle('active', link.getAttribute('href') === hash));
}

/* ── Карточка задачи с раскрывающимся решением ────────────────────── */

function taskCard(task, { showTopicLink, showGrade }) {
  const subject = subjectOf(task);
  const grade = showGrade ? (task.grade ?? task.topics?.grade) : null;
  const level = task.difficulty === 'Лёгкий' ? 'easy' : task.difficulty === 'Сложный' ? 'hard' : '';
  const topicLink = showTopicLink && task.topics?.slug
    ? `<a class="task-topic" href="#/topic/${encodeURIComponent(task.topics.slug)}">${escapeHtml(task.topics.title)}</a>`
    : '';
  const meta = [
    `<span class="tag ${tagClass(subject)}">${escapeHtml(subject?.title || 'Математика')}</span>`,
    grade ? `<span class="grade-badge">${gradeLabel(grade)}</span>` : '',
    `<span class="level ${level}">${escapeHtml(task.difficulty)}</span>`,
    topicLink
  ].join('');
  const solution = task.solution_latex
    ? `<button class="solution-toggle" type="button" aria-expanded="false">Показать решение</button>
       <div class="solution" hidden><span class="solution-label">Решение</span><div class="math" data-solution></div></div>`
    : '<p class="solution-missing">Решение пока не добавлено.</p>';
  return `<article class="task" data-task="${task.id}">
    <div class="task-meta">${meta}</div>
    <strong class="task-title">${escapeHtml(task.title)}</strong>
    <div class="math task-condition" data-condition></div>
    ${solution}
  </article>`;
}

function fillTaskMath(container, tasks) {
  container.querySelectorAll('[data-condition]').forEach((element, index) => renderMath(element, tasks[index].condition_latex));
  const withSolution = tasks.filter(task => task.solution_latex);
  container.querySelectorAll('[data-solution]').forEach((element, index) => renderMath(element, withSolution[index].solution_latex));
}

/* Метку класса показываем только там, где она что-то добавляет: внутри
   выбранного класса она одинакова у всех карточек и превращается в шум. */
function renderTaskList(container, tasks, emptyText, { showTopicLink = true, showGrade = !selectedGrade } = {}) {
  if (!tasks.length) { container.innerHTML = `<p class="empty-state">${escapeHtml(emptyText)}</p>`; return; }
  container.innerHTML = tasks.map(task => taskCard(task, { showTopicLink, showGrade })).join('');
  fillTaskMath(container, tasks);
}

// Одно делегирование на документ — карточки перерисовываются при каждом переходе.
document.addEventListener('click', event => {
  const toggle = event.target.closest('.solution-toggle');
  if (!toggle) return;
  const solution = toggle.nextElementSibling;
  const shown = !solution.hidden;
  solution.hidden = shown;
  toggle.setAttribute('aria-expanded', String(!shown));
  toggle.textContent = shown ? 'Показать решение' : 'Скрыть решение';
});

/* ── Карточки тем ─────────────────────────────────────────────────── */

function topicCard(topic, index, showGrade) {
  const subject = subjectById(topic.subject_id);
  const count = taskCount(topic.id);
  const badges = [
    showGrade && topic.grade ? `<span class="grade-badge">${gradeLabel(topic.grade)}</span>` : '',
    `<span class="topic-count">${count ? `задач: ${count}` : 'пока пусто'}</span>`
  ].join('');
  return `<a class="topic-card" href="#/topic/${encodeURIComponent(topic.slug)}"><div class="topic-icon ${topicClass(index)}">${escapeHtml(subject?.icon || 'x²')}</div><div><h3>${escapeHtml(topic.title)}</h3><p>${escapeHtml(topic.description || 'Задачи по теме')}</p><div class="topic-badges">${badges}</div></div></a>`;
}

function renderTopicCards(container, topics, showGrade = !selectedGrade) {
  container.hidden = !topics.length;
  container.innerHTML = topics.length ? topics.map((topic, index) => topicCard(topic, index, showGrade)).join('') : '';
}

function renderTopicGroups(container, groups) {
  container.hidden = !groups.length;
  container.innerHTML = groups.map(({ subject, topics }) => `<section class="topic-group">
    <div class="topic-group-head">
      <h2><span class="topic-group-icon">${escapeHtml(subject.icon)}</span>${escapeHtml(subject.title)}</h2>
      <a href="#/subject/${encodeURIComponent(subject.slug)}">Все темы →</a>
    </div>
    ${topics.length
      ? `<div class="topic-grid">${topics.map((topic, index) => topicCard(topic, index, false)).join('')}</div>`
      : `<p class="empty-state">${selectedGrade ? `В ${selectedGrade} классе тем нет.` : 'Тем пока нет.'}</p>`}
  </section>`).join('');
}

/* ── Главная ──────────────────────────────────────────────────────── */

function renderHeadings() {
  const suffix = selectedGrade ? ` — ${gradeLabel(selectedGrade)}` : '';
  topicsHeading.textContent = (selectedGrade ? 'Темы' : 'Популярные темы') + suffix;
  tasksHeading.textContent = 'Новые задачи' + suffix;
}

async function loadHome() {
  const topics = topicsForGrade(allTopics);
  topicsElement.innerHTML = topics.length
    ? topics.map((topic, index) => topicCard(topic, index, !selectedGrade)).join('')
    : `<p class="empty-state">${selectedGrade ? `Тем для ${selectedGrade} класса пока нет.` : 'Темы ещё не добавлены.'}</p>`;

  let query = db.from('tasks').select(TASK_SELECT).eq('is_published', true).order('created_at', { ascending: false }).limit(10);
  if (selectedGrade) query = query.eq('grade', selectedGrade);
  const { data, error } = await query;
  if (error) { console.warn('Не удалось загрузить задачи.', error); return; }
  renderTaskList(tasksElement, data || [], selectedGrade ? `Задач для ${selectedGrade} класса пока нет.` : 'Задач пока нет. Загляните позже.');
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
  renderTopicCards(listTopics, []);
  renderTopicGroups(listGroups, []);
  listTasks.innerHTML = '';
}

const gradeCrumb = () => (selectedGrade ? [gradeLabel(selectedGrade), `#/grade/${selectedGrade}`] : ['Все классы', '#/']);

/* ── Страница класса ──────────────────────────────────────────────── */

function showGradePage(rawGrade) {
  const grade = Number(rawGrade);
  if (GRADES.includes(grade) && grade !== selectedGrade) applyGrade(grade);
  showView('list');
  resetListBlocks();

  if (!GRADES.includes(grade)) {
    fillListHeader({ crumbs: [['Главная', '#/']], title: 'Такого класса нет', description: 'Классы идут с 1 по 11.' });
    return;
  }
  const groups = subjects.map(subject => ({
    subject,
    topics: allTopics.filter(topic => topic.subject_id === subject.id && topic.grade === grade)
  }));
  const total = groups.reduce((sum, group) => sum + group.topics.length, 0);
  fillListHeader({
    crumbs: [['Главная', '#/'], [gradeLabel(grade), null]],
    title: gradeLabel(grade),
    description: 'Разделы и темы, которые проходят в этом классе.',
    meta: `<span class="search-count">Тем: ${total}</span>`
  });
  renderTopicGroups(listGroups, groups);
}

/* ── Страница раздела ─────────────────────────────────────────────── */

function showSubject(slug) {
  showView('list');
  resetListBlocks();
  const subject = subjects.find(item => item.slug === slug);
  if (!subject) {
    fillListHeader({ crumbs: [['Главная', '#/']], title: 'Раздел не найден', description: 'Возможно, его удалили или ссылка устарела.' });
    return;
  }
  const topics = topicsForGrade(allTopics.filter(topic => topic.subject_id === subject.id));
  fillListHeader({
    crumbs: [['Главная', '#/'], gradeCrumb(), [subject.title, null]],
    title: subject.title,
    description: selectedGrade ? `Темы раздела в ${selectedGrade} классе.` : 'Все темы раздела.',
    meta: `<span class="search-count">Тем: ${topics.length}</span>`
  });
  if (topics.length) renderTopicCards(listTopics, topics);
  else listTasks.innerHTML = `<p class="empty-state">${selectedGrade ? `В ${selectedGrade} классе тем этого раздела нет.` : 'Тем в этом разделе пока нет.'}</p>`;
}

/* ── Страница темы ────────────────────────────────────────────────── */

async function showTopic(slug) {
  showView('list');
  resetListBlocks();
  const topic = allTopics.find(item => item.slug === slug);
  if (!topic) {
    fillListHeader({ crumbs: [['Главная', '#/']], title: 'Тема не найдена', description: 'Возможно, её удалили или ссылка устарела.' });
    return;
  }
  const subject = subjectById(topic.subject_id);
  const crumbs = [['Главная', '#/']];
  if (topic.grade) crumbs.push([gradeLabel(topic.grade), `#/grade/${topic.grade}`]);
  if (subject) crumbs.push([subject.title, `#/subject/${encodeURIComponent(subject.slug)}`]);
  crumbs.push([topic.title, null]);

  fillListHeader({
    crumbs,
    title: topic.title,
    description: topic.description || '',
    meta: topic.grade ? `<span class="grade-badge">${gradeLabel(topic.grade)}</span>` : ''
  });
  listTasks.innerHTML = '<p class="empty-state">Загружаем задачи…</p>';
  // Внутри темы порядок задаёт админ полем «порядок»; при равных значениях — по дате.
  const { data, error } = await db.from('tasks').select(TASK_SELECT)
    .eq('is_published', true).eq('topic_id', topic.id)
    .order('position').order('created_at', { ascending: true });
  if (error) { listTasks.innerHTML = '<p class="empty-state">Не удалось загрузить задачи.</p>'; return; }
  // Название темы в карточке здесь лишнее — мы уже внутри неё.
  // Внутри одной темы задачи могут быть для разных параллелей — класс показываем всегда.
  renderTaskList(listTasks, data || [], 'В этой теме задач пока нет.', { showTopicLink: false, showGrade: true });
}

/* ── Все задачи ───────────────────────────────────────────────────── */

async function showAllTasks() {
  showView('list');
  resetListBlocks();
  fillListHeader({
    crumbs: [['Главная', '#/'], gradeCrumb(), ['Все задачи', null]],
    title: selectedGrade ? `Все задачи — ${gradeLabel(selectedGrade)}` : 'Все задачи'
  });
  listTasks.innerHTML = '<p class="empty-state">Загружаем задачи…</p>';
  let query = db.from('tasks').select(TASK_SELECT).eq('is_published', true).order('created_at', { ascending: false }).limit(200);
  if (selectedGrade) query = query.eq('grade', selectedGrade);
  const { data, error } = await query;
  if (error) { listTasks.innerHTML = '<p class="empty-state">Не удалось загрузить задачи.</p>'; return; }
  renderTaskList(listTasks, data || [], 'Задач пока нет.');
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
  const crumbs = [['Главная', '#/'], ['Поиск', null]];

  if (query.length < 2) {
    fillListHeader({ crumbs, title: 'Поиск', description: 'Введите хотя бы два символа.' });
    return;
  }

  const needle = query.toLowerCase();
  const matchesText = topic => topic.title.toLowerCase().includes(needle) || (topic.description || '').toLowerCase().includes(needle);
  const foundTopics = allTopics.filter(topic => matchesText(topic) && (!scoped || topic.grade === selectedGrade));

  fillListHeader({ crumbs, title: `Поиск: «${query}»` });
  // Ищем во всех классах — значит, у каждого результата видно, к какому классу он относится.
  renderTopicCards(listTopics, foundTopics, !scoped);
  listTasks.innerHTML = '<p class="empty-state">Ищем…</p>';

  const safe = sanitize(query);
  let request = db.from('tasks').select(TASK_SELECT).eq('is_published', true);
  if (scoped) request = request.eq('grade', selectedGrade);
  if (safe) request = request.or(`title.ilike.*${safe}*,condition_latex.ilike.*${safe}*`);
  const { data, error } = await request.order('created_at', { ascending: false }).limit(100);
  if (error) {
    console.warn('Поиск не удался.', error);
    listTasks.innerHTML = '<p class="empty-state">Не удалось выполнить поиск.</p>';
    return;
  }

  const tasks = data || [];
  const counts = [foundTopics.length ? `тем: ${foundTopics.length}` : '', `задач: ${tasks.length}`].filter(Boolean).join(', ');
  const where = scoped ? `в ${selectedGrade} классе` : 'во всех классах';
  // Из класса всегда есть выход: иначе человек решит, что задачи просто нет.
  const escape = scoped
    ? `<a class="search-escape" href="#/search?q=${encodeURIComponent(query)}&all=1">Искать во всех классах →</a>`
    : '';
  document.querySelector('#list-meta').innerHTML = `<span class="search-count">Найдено ${where} — ${counts}</span>${escape}`;

  renderTaskList(listTasks, tasks, foundTopics.length
    ? 'Задач с таким текстом нет, но есть подходящие темы выше.'
    : 'Ничего не нашлось. Попробуйте другое слово.', { showGrade: !scoped });
}

/* Историю не засоряем: во время набора адрес заменяем, а не добавляем запись,
   поэтому маршрут вызываем вручную — hashchange при replaceState не срабатывает. */
const goSearch = () => {
  const query = searchInput.value.trim();
  if (query.length < 2) {
    if (location.hash.startsWith('#/search')) { history.replaceState(null, '', '#/'); route(); }
    return;
  }
  const hash = `#/search?q=${encodeURIComponent(query)}${searchAcrossGrades ? '&all=1' : ''}`;
  if (location.hash === hash) return;
  history.replaceState(null, '', hash);
  route();
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

/* ── Маршруты ─────────────────────────────────────────────────────── */

async function route() {
  markActiveNav();
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, queryString = ''] = raw.split('?');
  const params = new URLSearchParams(queryString);

  if (path === '/search') {
    await showSearch(params.get('q') || '', params.get('all') === '1');
    return;
  }
  // Поле поиска чистим при уходе с выдачи, чтобы шапка не врала о текущем виде.
  if (searchInput.value) searchInput.value = '';
  searchAcrossGrades = false;

  const gradeMatch = path.match(/^\/grade\/(.+)$/);
  if (gradeMatch) { showGradePage(decodeURIComponent(gradeMatch[1])); return; }

  const subjectMatch = path.match(/^\/subject\/(.+)$/);
  if (subjectMatch) { showSubject(decodeURIComponent(subjectMatch[1])); return; }

  const topicMatch = path.match(/^\/topic\/(.+)$/);
  if (topicMatch) { await showTopic(decodeURIComponent(topicMatch[1])); return; }

  if (path === '/tasks') { await showAllTasks(); return; }
  if (path === '/about') { showView('about'); return; }

  showView('home');
  await loadHome();
}
window.addEventListener('hashchange', route);

/* ── Загрузка справочников и сессия ───────────────────────────────── */

async function loadCatalog() {
  if (!db) return;
  const [subjectResult, topicResult, countResult] = await Promise.all([
    db.from('subjects').select('*').order('position').order('title'),
    db.from('topics').select('*').order('position').order('title'),
    db.from('tasks').select('topic_id').eq('is_published', true)
  ]);
  if (subjectResult.error || topicResult.error) {
    console.warn('Схема ещё не готова: примените миграции из supabase/migrations.', subjectResult.error || topicResult.error);
    return;
  }
  subjects = subjectResult.data || [];
  allTopics = topicResult.data || [];
  // Счётчик задач по темам: одним запросом, чтобы на карточке было видно, где пусто.
  taskCounts = new Map();
  (countResult.data || []).forEach(({ topic_id: topicId }) => {
    if (topicId) taskCounts.set(topicId, (taskCounts.get(topicId) || 0) + 1);
  });
  renderSidebar();
}

async function refreshSession() {
  const { user, isAdmin } = await loadViewer();
  currentUser = user;
  /* Регистрации для учеников нет, и делать им в аккаунте пока нечего,
     поэтому «Личный кабинет» из интерфейса убран. Вошедший без прав всё же
     видит диалог — иначе ему нечем было бы выйти. */
  accountButton.textContent = user ? (isAdmin ? 'Админ-панель' : 'Аккаунт') : 'Войти';
  accountEmail.textContent = user?.email || '';
  accountStatus.textContent = !user ? ''
    : isAdmin ? 'Вы вошли как администратор. Панель управления на отдельной странице.'
    : 'У этого аккаунта нет прав администратора.';
  openAdminPanelLink.hidden = !isAdmin;
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

fillGradeSelect(gradeSelect, 'Все классы');
renderGradeControls();
renderHeadings();
(async () => {
  await loadCatalog();
  await route();
  await refreshSession();
})();
