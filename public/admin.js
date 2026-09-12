(() => {
  const { db, escapeHtml, makeSlug, loadViewer, renderMath, fillGradeSelect } = window.MathTasks;
  const gate = document.querySelector('#admin-gate');
  const content = document.querySelector('#admin-content');
  const subjectForm = document.querySelector('#subject-form');
  const topicForm = document.querySelector('#topic-form');
  const taskForm = document.querySelector('#task-form');
  const subjectSelect = document.querySelector('#subject-select');
  const topicSelect = document.querySelector('#topic-select');
  const subtopicSelect = document.querySelector('#subtopic-select');
  const subjectList = document.querySelector('#subject-list');
  const topicList = document.querySelector('#topic-list');
  const taskList = document.querySelector('#task-list');
  const subjectSuccess = document.querySelector('#subject-success');
  const topicSuccess = document.querySelector('#topic-success');
  const taskSuccess = document.querySelector('#task-success');

  const taskSearchInput = document.querySelector('#task-search-input');
  const taskFilterGrade = document.querySelector('#task-filter-grade');
  const taskFilterTopic = document.querySelector('#task-filter-topic');
  const taskFilterStatus = document.querySelector('#task-filter-status');
  const taskFilterSort = document.querySelector('#task-filter-sort');
  const topicSearchInput = document.querySelector('#topic-search-input');
  const topicFilterGrade = document.querySelector('#topic-filter-grade');
  const topicFilterSubject = document.querySelector('#topic-filter-subject');
  const topicFilterSort = document.querySelector('#topic-filter-sort');
  const topicFilterCount = document.querySelector('#topic-filter-count');
  const topicFilterReset = document.querySelector('#topic-filter-reset');
  const taskFilterCount = document.querySelector('#task-filter-count');
  const taskFilterReset = document.querySelector('#task-filter-reset');

  const bulkDialog = document.querySelector('#bulk-dialog');
  const bulkDialogTitle = document.querySelector('#bulk-dialog-title');
  const bulkDialogDesc = document.querySelector('#bulk-dialog-desc');
  const bulkDialogTextarea = document.querySelector('#bulk-dialog-textarea');
  const bulkDialogStatus = document.querySelector('#bulk-dialog-status');
  const bulkDialogSubmit = document.querySelector('#bulk-dialog-submit');
  const bulkDialogCopy = document.querySelector('#bulk-dialog-copy');
  const bulkDialogTagList = document.querySelector('#bulk-dialog-taglist');
  const bulkDialogClose = document.querySelector('#bulk-dialog-close');
  const bulkDialogCancel = document.querySelector('#bulk-dialog-cancel');
  const btnExportTasks = document.querySelector('#btn-export-tasks');
  const btnExportCsv = document.querySelector('#btn-export-csv');
  const btnImportTasks = document.querySelector('#btn-import-tasks');
  const bulkFileInput = document.querySelector('#bulk-file-input');
  const bulkDialogFileInput = document.querySelector('#bulk-dialog-file-input');
  const btnUploadFileTasks = document.querySelector('#btn-upload-file-tasks');
  const bulkDialogPickFileBtn = document.querySelector('#bulk-dialog-pick-file-btn');
  const bulkDialogTemplateBtn = document.querySelector('#bulk-dialog-template-btn');
  const bulkDialogCsvTemplateBtn = document.querySelector('#bulk-dialog-csv-template-btn');
  const bulkDialogAiPromptBtn = document.querySelector('#bulk-dialog-ai-prompt-btn');
  const aiGenCount = document.querySelector('#ai-gen-count');
  const btnRenumberTasks = document.querySelector('#btn-renumber-tasks');
  const btnRenumberTopics = document.querySelector('#btn-renumber-topics');
  const btnRenumberSubtopics = document.querySelector('#btn-renumber-subtopics');

  const btnToggleMathGuide = document.querySelector('#btn-toggle-math-guide');
  const btnCloseMathGuide = document.querySelector('#btn-close-math-guide');
  const mathGuideCard = document.querySelector('#math-guide-card');

  const btnToggleSampleJson = document.querySelector('#btn-toggle-sample-json');
  const btnCloseSampleJson = document.querySelector('#btn-close-sample-json');
  const btnCopySampleJson = document.querySelector('#btn-copy-sample-json');
  const btnInsertSampleToDialog = document.querySelector('#btn-insert-sample-to-dialog');
  const jsonSampleCard = document.querySelector('#json-sample-card');
  const jsonSampleCode = document.querySelector('#json-sample-code');

  const btnToggleSampleCsv = document.querySelector('#btn-toggle-sample-csv');
  const btnCloseSampleCsv = document.querySelector('#btn-close-sample-csv');
  const btnCopySampleCsv = document.querySelector('#btn-copy-sample-csv');
  const btnInsertSampleCsvToDialog = document.querySelector('#btn-insert-sample-csv-to-dialog');
  const csvSampleCard = document.querySelector('#csv-sample-card');
  const csvSampleCode = document.querySelector('#csv-sample-code');

  const btnShowAiPrompt = document.querySelector('#btn-show-ai-prompt');
  const aiPromptDialog = document.querySelector('#ai-prompt-dialog');
  const aiPromptDialogClose = document.querySelector('#ai-prompt-dialog-close');
  const aiPromptCloseBtn = document.querySelector('#ai-prompt-close-btn');
  const aiPromptCopyBtn = document.querySelector('#ai-prompt-copy-btn');
  const aiPromptTextarea = document.querySelector('#ai-prompt-textarea');

  /* Белый список колонок защищает от PGRST204, если миграция 007 ещё не
     выполнена. Латышские колонки добавляются в него на лету: без этого
     миграцию можно было выполнить, а перевод из админки всё равно
     не сохранялся бы — молча, потому что поле просто отбрасывалось. */
  /* Списки в панели показывают только заголовки, а условие и решение
     занимают почти весь вес строки: 81 задача с полными текстами — это
     108 КБ, без них — 17 КБ. Полную строку забираем по одной, когда
     задачу открывают на правку. */
  const TASK_LIST_COLS = 'id,title,topic_id,grade,difficulty,is_published,position';
  const TOPIC_LIST_COLS = 'id,title,subject_id,grade,position,slug';
  const TASK_INDEX_COLS = 'id,topic_id,subtopic_id,position';

  /* Указатель — три колонки на задачу (3 КБ на 81 задачу). Его хватает,
     чтобы показать «задач: N» у темы и посчитать номер новой задачи,
     поэтому сам список можно не грузить, пока его не попросят. */
  let taskIndex = [];
  let tasksLoaded = false;
  let aiGenCancelled = false;
  /* Темы всё равно нужны в памяти — из них собираются выпадающие списки
     в формах. Откладываем не загрузку, а отрисовку: на трёх сотнях тем
     построение разметки заметно дороже самого запроса. */
  let topicsShown = false;

  const supportedTopicCols = new Set(['title', 'slug', 'subject_id', 'grade', 'position', 'description']);
  const supportedTaskCols = new Set(['topic_id', 'title', 'condition_latex', 'solution_latex', 'difficulty', 'is_published', 'grade', 'position', 'answer_latex', 'condition_image', 'solution_image']);
  const supportedSubjectCols = new Set(['title', 'slug', 'icon', 'position']);
  let multilingualReady = false;

  /* Колонка подсказки появляется миграцией 016. Пока её нет, поле в форме
     блокируем: иначе введённое молча пропадало бы, а то и роняло сохранение. */
  let hintReady = false;
  async function detectHintColumn() {
    const { error } = await db.from('tasks').select('hint_latex').limit(1);
    if (error) {
      console.warn('Колонка hint_latex не найдена — выполните supabase/migrations/016_task_hint.sql.');
      for (const el of [hintInput, hintInputLv]) {
        if (!el) continue;
        el.disabled = true;
        el.title = 'Недоступно: не выполнена миграция 016_task_hint.sql';
        el.placeholder = 'Недоступно до применения миграции 016';
      }
      return;
    }
    hintReady = true;
    supportedTaskCols.add('hint_latex');
    if (multilingualReady) supportedTaskCols.add('hint_latex_lv');
  }

  async function detectMultilingualColumns() {
    const { error } = await db.from('topics').select('title_lv').limit(1);
    if (error) {
      console.warn('Латышские колонки не найдены — выполните supabase/migrations/007_multilingual_tasks.sql. Поля LV пока не сохраняются.');
      return;
    }
    multilingualReady = true;
    ['title_lv', 'description_lv'].forEach(c => supportedTopicCols.add(c));
    ['title_lv', 'condition_latex_lv', 'solution_latex_lv', 'answer_latex_lv'].forEach(c => supportedTaskCols.add(c));
    supportedSubjectCols.add('title_lv');
  }

  /* Пока миграции нет, поля LV выглядят рабочими, но введённое молча
     отбрасывается санитайзером. Честнее сказать об этом прямо в форме. */
  function markLatvianFieldsUnavailable() {
    if (multilingualReady) return;
    const ids = ['subject-title-lv', 'topic-title-lv', 'topic-desc-lv', 'title-input-lv', 'condition-input-lv', 'solution-input-lv', 'answer-input-lv'];
    const hint = 'Недоступно: не выполнена миграция 007_multilingual_tasks.sql';
    for (const id of ids) {
      const field = document.querySelector('#' + id);
      if (!field) continue;
      field.disabled = true;
      field.title = hint;
      const label = field.closest('label');
      if (label && !label.querySelector('.admin-warn')) {
        const note = document.createElement('span');
        note.className = 'admin-warn';
        note.textContent = hint;
        label.append(note);
      }
    }
  }

  const sanitizeTopicPayload = payload => {
    const clean = {};
    for (const [k, v] of Object.entries(payload)) {
      if (supportedTopicCols.has(k)) clean[k] = v;
    }
    return clean;
  };

  const sanitizeSubjectPayload = payload => {
    const clean = {};
    for (const [k, v] of Object.entries(payload)) {
      if (supportedSubjectCols.has(k)) clean[k] = v;
    }
    return clean;
  };

  const sanitizeTaskPayload = payload => {
    const clean = {};
    for (const [k, v] of Object.entries(payload)) {
      if (supportedTaskCols.has(k)) clean[k] = v;
    }
    return clean;
  };

  // Одна форма работает и на создание, и на правку: id заполнен — значит правим.
  let editingSubjectId = null;
  let editingTopicId = null;
  let editingTaskId = null;
  let subjects = [];
  let topics = [];
  let subtopics = [];
  let tasks = [];

  const deny = message => {
    content.hidden = true;
    gate.hidden = false;
    gate.innerHTML = `${escapeHtml(message)} <a href="/">Вернуться на сайт</a>`;
  };

  const parseFormGrade = val => {
    if (!val) return null;
    if (val === 'visparigais' || val === '10' || val === 10) return 10;
    if (val === 'matematika-1' || val === '11' || val === 11) return 11;
    if (val === 'matematika-2' || val === '12' || val === 12) return 12;
    const num = Number(val);
    return Number.isFinite(num) ? num : null;
  };
  const toAdminGradeVal = g => {
    if (g === 'visparigais') return '10';
    if (g === 'matematika-1') return '11';
    if (g === 'matematika-2') return '12';
    return g ? String(g) : '';
  };
  const gradeText = grade => {
    if (!grade) return 'без класса';
    if (grade === 10 || grade === 'visparigais') return 'Vispārīgais līmenis';
    if (grade === 11 || grade === 'matematika-1') return 'Optimālais līmenis (Matemātika I)';
    if (grade === 12 || grade === 'matematika-2') return 'Augstākais līmenis (Matemātika II)';
    return `${grade} класс`;
  };
  const subjectTitle = id => subjects.find(item => item.id === id)?.title || 'Без раздела';

  /* ── Сворачивание / разворачивание отделов админ-панели ───────────── */
  const COLLAPSED_STORAGE_KEY = 'math-tasks:admin-collapsed-sections';
  function getCollapsedSections() {
    try {
      return new Set(JSON.parse(localStorage.getItem(COLLAPSED_STORAGE_KEY) || '[]'));
    } catch {
      return new Set();
    }
  }
  function saveCollapsedSections(set) {
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify([...set]));
    } catch {}
  }

  function applySectionCollapsed(section, toggleBtn, collapsed) {
    if (!section) return;
    section.classList.toggle('is-collapsed', collapsed);
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', String(!collapsed));
      const icon = toggleBtn.querySelector('.toggle-icon');
      const text = toggleBtn.querySelector('.toggle-text');
      if (icon) icon.textContent = collapsed ? '▼' : '▲';
      if (text) text.textContent = collapsed ? 'Развернуть' : 'Свернуть';
      toggleBtn.title = collapsed ? 'Развернуть отдел' : 'Свернуть отдел';
    }
  }

  function ensureSectionExpanded(sectionId) {
    const section = document.querySelector('#' + sectionId);
    if (!section || !section.classList.contains('is-collapsed')) return;
    const toggleBtn = section.querySelector('.admin-section-toggle');
    applySectionCollapsed(section, toggleBtn, false);
    const currentSet = getCollapsedSections();
    currentSet.delete(sectionId);
    saveCollapsedSections(currentSet);
  }

  function initCollapsibleSections() {
    const collapsedSet = getCollapsedSections();
    document.querySelectorAll('.admin-section').forEach(section => {
      const sectionId = section.id;
      const toggleBtn = section.querySelector('.admin-section-toggle');
      if (!toggleBtn) return;

      const isCollapsed = collapsedSet.has(sectionId);
      applySectionCollapsed(section, toggleBtn, isCollapsed);

      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nextCollapsed = !section.classList.contains('is-collapsed');
        applySectionCollapsed(section, toggleBtn, nextCollapsed);
        const currentSet = getCollapsedSections();
        if (nextCollapsed) currentSet.add(sectionId);
        else currentSet.delete(sectionId);
        saveCollapsedSections(currentSet);
      });

      // При клике на свернутую шапку разворачиваем отдел
      const head = section.querySelector('.admin-feature-head');
      head?.addEventListener('click', (e) => {
        if (section.classList.contains('is-collapsed') && !e.target.closest('button, input, select, a')) {
          applySectionCollapsed(section, toggleBtn, false);
          const currentSet = getCollapsedSections();
          currentSet.delete(sectionId);
          saveCollapsedSections(currentSet);
        }
      });
    });
  }

  /* ── Разделы ──────────────────────────────────────────────────────── */

  function setSubjectMode(subject) {
    if (subject) ensureSectionExpanded('section-subjects');
    editingSubjectId = subject?.id ?? null;
    document.querySelector('#subject-form-title').textContent = subject ? `Редактировать раздел: ${subject.title}` : 'Разделы математики';
    document.querySelector('#subject-submit').textContent = subject ? 'Сохранить раздел' : 'Добавить раздел';
    document.querySelector('#subject-cancel').hidden = !subject;
    subjectForm.elements.title.value = subject?.title || '';
    subjectForm.elements.title_lv.value = subject?.title_lv || '';
    subjectForm.elements.icon.value = subject?.icon || '';
    subjectForm.elements.position.value = subject?.position ?? 0;
    if (subject) subjectForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function renderSubjectList() {
    if (!subjects.length) { subjectList.innerHTML = '<p class="admin-empty">Разделов пока нет.</p>'; return; }
    subjectList.innerHTML = subjects.map(subject => {
      const count = topics.filter(topic => topic.subject_id === subject.id).length;
      return `<div class="admin-row">
        <span class="admin-row-icon">${escapeHtml(subject.icon)}</span>
        <span class="admin-row-main"><strong>${escapeHtml(subject.title)}</strong><small>${subject.title_lv ? escapeHtml(subject.title_lv) + ' · ' : ''}тем: ${count} · порядок: ${subject.position}</small>${multilingualReady && !subject.title_lv ? '<span class="admin-warn">нет названия на латышском</span>' : ''}</span>
        <button class="text-button" type="button" data-edit-subject="${subject.id}">Изменить</button>
        <button class="text-button danger" type="button" data-delete-subject="${subject.id}">Удалить</button>
      </div>`;
    }).join('');
  }

  subjectForm.addEventListener('submit', async event => {
    event.preventDefault();
    subjectSuccess.textContent = '';
    const form = new FormData(subjectForm);
    const title = form.get('title').trim();
    const payload = sanitizeSubjectPayload({
      title,
      title_lv: form.get('title_lv')?.trim() || null,
      icon: form.get('icon').trim() || 'x²',
      position: Number(form.get('position')) || 0
    });
    const { error } = editingSubjectId
      ? await db.from('subjects').update(payload).eq('id', editingSubjectId)
      : await db.from('subjects').insert({ ...payload, slug: `${makeSlug(title)}-${Date.now()}` });
    if (error) { subjectSuccess.textContent = 'Ошибка: ' + error.message; return; }
    subjectSuccess.textContent = editingSubjectId ? 'Раздел сохранён.' : 'Раздел добавлен.';
    subjectForm.reset();
    setSubjectMode(null);
    await loadCatalog();
  });

  document.querySelector('#subject-cancel').addEventListener('click', () => { subjectForm.reset(); setSubjectMode(null); });

  subjectList.addEventListener('click', async event => {
    const editId = event.target.closest('[data-edit-subject]')?.dataset.editSubject;
    if (editId) { setSubjectMode(subjects.find(item => String(item.id) === editId)); return; }
    const deleteId = event.target.closest('[data-delete-subject]')?.dataset.deleteSubject;
    if (!deleteId) return;
    const subject = subjects.find(item => String(item.id) === deleteId);
    const count = topics.filter(topic => String(topic.subject_id) === deleteId).length;
    const warning = count ? ` Его темы (${count} шт.) останутся, но потеряют раздел.` : '';
    if (!confirm(`Удалить раздел «${subject.title}»?${warning}`)) return;
    const { error } = await db.from('subjects').delete().eq('id', deleteId);
    if (error) { subjectSuccess.textContent = 'Ошибка: ' + error.message; return; }
    if (String(editingSubjectId) === deleteId) { subjectForm.reset(); setSubjectMode(null); }
    subjectSuccess.textContent = 'Раздел удалён.';
    await loadCatalog();
  });

  /* ── Темы ─────────────────────────────────────────────────────────── */

  function setTopicMode(topic) {
    if (topic) ensureSectionExpanded('section-topics');
    editingTopicId = topic?.id ?? null;
    document.querySelector('#topic-form-title').textContent = topic ? `Редактировать тему: ${topic.title}` : 'Темы и программа Skola2030';
    document.querySelector('#topic-submit').textContent = topic ? 'Сохранить тему' : 'Добавить тему';
    document.querySelector('#topic-cancel').hidden = !topic;
    topicForm.elements.title.value = topic?.title || '';
    if (topicForm.elements.title_lv) topicForm.elements.title_lv.value = topic?.title_lv || '';
    // Тема без раздела не попадёт в меню сайта, поэтому для новой подставляем первый раздел.
    topicForm.elements.subject_id.value = String(topic?.subject_id ?? subjects[0]?.id ?? '');
    topicForm.elements.grade.value = toAdminGradeVal(topic?.grade);
    topicForm.elements.position.value = Math.max(1, topic?.position ?? 1);
    topicForm.elements.description.value = topic?.description || '';
    if (topicForm.elements.description_lv) topicForm.elements.description_lv.value = topic?.description_lv || '';
    if (topic) topicForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const cleanTitlePrefix = s => String(s || '').replace(/^\s*\d+(\.\d+)*\.?\s*/, '').trim();
  const updateTitlePrefix = (title, grade, newPos) => {
    if (!title) return title;
    if (!/^\s*\d+(\.\d+)*\.?\s+/.test(title)) return title;
    const clean = cleanTitlePrefix(title);
    if (!clean) return title;
    const g = parseFormGrade(grade);
    const prefix = (g != null && g > 0) ? `${g}.${newPos}. ` : `${newPos}. `;
    return `${prefix}${clean}`;
  };

  /* Соседи темы — темы того же класса (в стандарте Skola2030 нумерация 1..N сквозная в пределах класса). */
  const topicSiblingsOf = topicOrGrade => {
    const g = (topicOrGrade && typeof topicOrGrade === 'object') ? topicOrGrade.grade : topicOrGrade;
    const parsedG = parseFormGrade(g);
    return topics
      .filter(t => parseFormGrade(t.grade) === parsedG)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id - b.id);
  };

  /* Синхронизирует префиксы кодов подтем при изменении позиции родительской темы */
  async function syncSubtopicCodesForTopic(topicId, topicPosition, grade) {
    const subs = subtopics
      .filter(s => s.topic_id === topicId)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id - b.id);
    const g = grade != null ? grade : (topics.find(t => t.id === topicId)?.grade ?? '');
    for (let i = 0; i < subs.length; i++) {
      const s = subs[i];
      const subPos = s.position || (i + 1);
      const expectedCode = (g != null && g !== '') ? `${g}.${topicPosition}.${subPos}` : `${topicPosition}.${subPos}`;
      if (s.code && /^\d+(\.\d+)*$/.test(s.code) && s.code !== expectedCode) {
        const { error } = await db.from('subtopics').update({ code: expectedCode }).eq('id', s.id);
        if (!error) {
          s.code = expectedCode;
        }
      }
    }
  }

  /* Ребалансировка тем класса 1..N: автосдвиг при вставке в середину или удалении */
  async function rebalanceTopicPositions(grade, targetTopicId = null, desiredPosition = null) {
    const parsedG = parseFormGrade(grade);
    let siblings = topics
      .filter(t => parseFormGrade(t.grade) === parsedG)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id - b.id);

    if (targetTopicId != null && desiredPosition != null) {
      const existingIdx = siblings.findIndex(t => String(t.id) === String(targetTopicId));
      let targetItem;
      if (existingIdx >= 0) {
        targetItem = siblings.splice(existingIdx, 1)[0];
      } else {
        const found = topics.find(t => String(t.id) === String(targetTopicId));
        targetItem = found || { id: targetTopicId, grade: parsedG, position: desiredPosition };
      }
      const insertIdx = Math.max(0, Math.min(desiredPosition - 1, siblings.length));
      siblings.splice(insertIdx, 0, targetItem);
    }

    const updates = siblings
      .map((item, index) => {
        const newPos = index + 1;
        const newTitleRu = updateTitlePrefix(item.title, parsedG, newPos);
        const newTitleLv = updateTitlePrefix(item.title_lv, parsedG, newPos);
        return { item, position: newPos, title: newTitleRu, title_lv: newTitleLv };
      })
      .filter(({ item, position, title, title_lv }) => item.position !== position || item.title !== title || item.title_lv !== title_lv);

    for (const { item, position, title, title_lv } of updates) {
      const patch = { position };
      if (title !== item.title) patch.title = title;
      if (title_lv !== item.title_lv) patch.title_lv = title_lv;
      const { error } = await db.from('topics').update(patch).eq('id', item.id);
      if (error) {
        console.warn('Ошибка обновления позиции темы:', item.id, error.message);
      } else {
        item.position = position;
        if (title !== item.title) item.title = title;
        if (title_lv !== item.title_lv) item.title_lv = title_lv;
        const inTopics = topics.find(t => t.id === item.id);
        if (inTopics) {
          inTopics.position = position;
          if (title !== item.title) inTopics.title = title;
          if (title_lv !== item.title_lv) inTopics.title_lv = title_lv;
        }
        await syncSubtopicCodesForTopic(item.id, position, parsedG);
      }
    }
  }

  /* Перестановка тем стрелочками вверх/вниз */
  async function moveTopic(topicId, direction) {
    const topic = topics.find(t => String(t.id) === String(topicId));
    if (!topic) return;
    const siblings = topicSiblingsOf(topic);
    const from = siblings.findIndex(t => t.id === topic.id);
    const to = direction === 'up' ? from - 1 : from + 1;
    if (to < 0 || to >= siblings.length) return;
    siblings.splice(to, 0, siblings.splice(from, 1)[0]);

    const grade = parseFormGrade(topic.grade);
    const updates = siblings
      .map((item, index) => {
        const newPos = index + 1;
        const newTitleRu = updateTitlePrefix(item.title, grade, newPos);
        const newTitleLv = updateTitlePrefix(item.title_lv, grade, newPos);
        return { item, position: newPos, title: newTitleRu, title_lv: newTitleLv };
      })
      .filter(({ item, position, title, title_lv }) => item.position !== position || item.title !== title || item.title_lv !== title_lv);

    for (const { item, position, title, title_lv } of updates) {
      const patch = { position };
      if (title !== item.title) patch.title = title;
      if (title_lv !== item.title_lv) patch.title_lv = title_lv;
      const { error } = await db.from('topics').update(patch).eq('id', item.id);
      if (error) { topicSuccess.textContent = 'Ошибка: ' + error.message; return; }
      item.position = position;
      if (title !== item.title) item.title = title;
      if (title_lv !== item.title_lv) item.title_lv = title_lv;
      const inTopics = topics.find(t => t.id === item.id);
      if (inTopics) {
        inTopics.position = position;
        if (title !== item.title) inTopics.title = title;
        if (title_lv !== item.title_lv) inTopics.title_lv = title_lv;
      }
      await syncSubtopicCodesForTopic(item.id, position, grade);
    }
    topicSuccess.textContent = 'Порядок тем изменён.';
    renderTopicList();
  }

  /* Новая тема встаёт в конец своей группы, а не в начало */
  function nextTopicPosition(grade, subjectId, rawValue) {
    const typed = Number(rawValue);
    if (editingTopicId && Number.isFinite(typed) && typed >= 1) return typed;
    if (Number.isFinite(typed) && typed >= 1) return typed;
    const siblings = topicSiblingsOf(grade);
    return siblings.length ? Math.max(...siblings.map(t => t.position ?? 1)) + 1 : 1;
  }

  function topicArrows(topic) {
    const siblings = topicSiblingsOf(topic);
    if (siblings.length < 2) return '';
    const index = siblings.findIndex(t => t.id === topic.id);
    return `<span class="admin-move">
      <button class="move-button" type="button" data-move-topic="${topic.id}" data-dir="up" ${index === 0 ? 'disabled' : ''} aria-label="Выше в разделе">↑</button>
      <button class="move-button" type="button" data-move-topic="${topic.id}" data-dir="down" ${index === siblings.length - 1 ? 'disabled' : ''} aria-label="Ниже в разделе">↓</button>
    </span>`;
  }

  function renderTopicList() {
    if (!topicsShown) return;
    if (!topics.length) {
      topicList.innerHTML = '<p class="admin-empty">Тем пока нет.</p>';
      if (topicFilterCount) topicFilterCount.textContent = '0 тем';
      return;
    }

    const filtered = sortTopics(getFilteredTopics());
    const isFiltered = Boolean((topicSearchInput?.value || '').trim() || topicFilterGrade?.value || topicFilterSubject?.value);

    if (topicFilterCount) {
      topicFilterCount.textContent = isFiltered
        ? `Найдено: ${filtered.length} из ${topics.length}`
        : `Всего тем: ${topics.length}`;
    }
    if (topicFilterReset) topicFilterReset.hidden = !isFiltered;

    if (!filtered.length) {
      topicList.innerHTML = '<p class="admin-empty">Ничего не найдено по фильтрам. <button class="text-button" type="button" id="topic-empty-reset">Сбросить фильтры</button></p>';
      document.querySelector('#topic-empty-reset')?.addEventListener('click', resetTopicFilters);
      return;
    }

    topicList.innerHTML = filtered.map(topic => {
      const count = taskIndex.filter(task => task.topic_id === topic.id).length;
      /* Класс — глобальный контекст сайта: тему без него посетитель увидит
         только в режиме «Все классы», поэтому предупреждаем прямо в списке. */
      const warning = topic.grade ? '' : '<span class="admin-warn">не видна в меню при выбранном классе</span>';
      const hasPrefix = /^\d+(\.\d+)/.test(topic.title || '');
      const rowNum = hasPrefix ? '' : `<span class="admin-row-num">${Math.max(1, topic.position ?? 1)}.</span> `;
      return `<div class="admin-row">
        <span class="admin-row-main"><strong>${rowNum}${escapeHtml(topic.title)}</strong><small>${escapeHtml(subjectTitle(topic.subject_id))} · ${gradeText(topic.grade)} · задач: ${count}</small>${warning}</span>
        ${topicArrows(topic)}
        <button class="text-button" type="button" data-edit-topic="${topic.id}">Изменить</button>
        <button class="text-button danger" type="button" data-delete-topic="${topic.id}">Удалить</button>
      </div>`;
    }).join('');
  }

  document.querySelector('#topic-grade')?.addEventListener('change', () => {
    if (!editingTopicId && topicForm?.elements.position) {
      topicForm.elements.position.value = nextTopicPosition(parseFormGrade(topicForm.elements.grade.value), null, null);
    }
  });

  topicForm.addEventListener('submit', async event => {
    event.preventDefault();
    topicSuccess.textContent = '';
    const form = new FormData(topicForm);
    const title = form.get('title').trim();
    const grade = parseFormGrade(form.get('grade'));
    const subjectId = form.get('subject_id') ? Number(form.get('subject_id')) : null;
    const rawPos = Number(form.get('position'));
    const desiredPos = Number.isFinite(rawPos) && rawPos >= 1 ? rawPos : nextTopicPosition(grade, subjectId, null);

    const payload = sanitizeTopicPayload({
      title,
      title_lv: form.get('title_lv')?.trim() || null,
      subject_id: subjectId,
      grade,
      position: desiredPos,
      description: form.get('description')?.trim() || null,
      description_lv: form.get('description_lv')?.trim() || null,
    });

    let savedTopicId = editingTopicId;
    if (editingTopicId) {
      const { error } = await db.from('topics').update(payload).eq('id', editingTopicId);
      if (error) { topicSuccess.textContent = 'Ошибка: ' + error.message; return; }
    } else {
      const newSlug = `${makeSlug(title)}-${Date.now()}`;
      const { data: inserted, error } = await db.from('topics').insert({ ...payload, slug: newSlug }).select().single();
      if (error) { topicSuccess.textContent = 'Ошибка: ' + error.message; return; }
      savedTopicId = inserted?.id;
      if (inserted) topics.push(inserted);
    }

    if (savedTopicId) {
      await rebalanceTopicPositions(grade, savedTopicId, desiredPos);
    }

    topicSuccess.textContent = editingTopicId ? 'Тема сохранена.' : 'Тема добавлена.';
    topicForm.reset();
    setTopicMode(null);
    await loadCatalog();
  });

  document.querySelector('#topic-cancel').addEventListener('click', () => { topicForm.reset(); setTopicMode(null); });

  topicList.addEventListener('click', async event => {
    const moveTopicBtn = event.target.closest('[data-move-topic]');
    if (moveTopicBtn) { await moveTopic(moveTopicBtn.dataset.moveTopic, moveTopicBtn.dataset.dir); return; }

    const editId = event.target.closest('[data-edit-topic]')?.dataset.editTopic;
    if (editId) {
      const full = await fetchFullRow('topics', editId);
      if (!full) { topicSuccess.textContent = 'Не удалось загрузить тему для правки.'; return; }
      setTopicMode(full);
      return;
    }
    const deleteId = event.target.closest('[data-delete-topic]')?.dataset.deleteTopic;
    if (!deleteId) return;
    const topic = topics.find(item => String(item.id) === deleteId);
    if (!confirm(`Удалить тему «${topic.title}»? Задачи этой темы останутся, но потеряют привязку.`)) return;
    const { error } = await db.from('topics').delete().eq('id', deleteId);
    if (error) { topicSuccess.textContent = 'Ошибка: ' + error.message; return; }
    topics = topics.filter(t => String(t.id) !== deleteId);
    if (topic?.grade != null) {
      await rebalanceTopicPositions(topic.grade);
    }
    if (String(editingTopicId) === deleteId) { topicForm.reset(); setTopicMode(null); }
    topicSuccess.textContent = 'Тема удалена.';
    await loadCatalog();
  });

  /* Автоматическая перенумерация тем (1..N) внутри каждого класса */
  async function handleRenumberTopics() {
    if (!topics || !topics.length) {
      alert('Список тем пуст.');
      return;
    }
    const computeFn = window.MathTasksLib?.computeTopicRenumbering;
    if (!computeFn) return;
    const plan = computeFn(topics);

    const itemsToUpdate = [];
    for (const item of plan) {
      const t = item.topic;
      const parsedG = parseFormGrade(item.grade);
      const newTitleRu = updateTitlePrefix(t.title, parsedG, item.newPosition);
      const newTitleLv = updateTitlePrefix(t.title_lv, parsedG, item.newPosition);
      const titleChanged = (newTitleRu && newTitleRu !== t.title) || (newTitleLv && newTitleLv !== t.title_lv);
      if (item.changed || titleChanged) {
        itemsToUpdate.push({
          ...item,
          newTitleRu: newTitleRu || t.title,
          newTitleLv: newTitleLv || t.title_lv,
          titleChanged
        });
      }
    }

    if (!itemsToUpdate.length) {
      alert('Все темы уже упорядочены (1..N), изменений не требуется.');
      return;
    }

    if (!confirm(`Перенумеровать темы по порядку (1..N внутри каждого класса)? Будут обновлены ${itemsToUpdate.length} тем.`)) {
      return;
    }

    if (btnRenumberTopics) {
      btnRenumberTopics.disabled = true;
      btnRenumberTopics.textContent = '⏳ Перенумерация...';
    }

    try {
      for (const item of itemsToUpdate) {
        const patch = { position: item.newPosition };
        if (item.newTitleRu !== item.topic.title) patch.title = item.newTitleRu;
        if (item.newTitleLv !== item.topic.title_lv) patch.title_lv = item.newTitleLv;
        const { error } = await db.from('topics').update(patch).eq('id', item.id);
        if (error) {
          console.warn('Ошибка обновления темы:', item.id, error.message);
        } else {
          item.topic.position = item.newPosition;
          if (patch.title) item.topic.title = patch.title;
          if (patch.title_lv) item.topic.title_lv = patch.title_lv;
          const inTopics = topics.find(t => t.id === item.id);
          if (inTopics) {
            inTopics.position = item.newPosition;
            if (patch.title) inTopics.title = patch.title;
            if (patch.title_lv) inTopics.title_lv = patch.title_lv;
          }
          await syncSubtopicCodesForTopic(item.id, item.newPosition, item.grade);
        }
      }
      topicSuccess.textContent = `Успешно перенумеровано тем: ${itemsToUpdate.length}.`;
      renderTopicList();
      renderSubtopics();
    } catch (err) {
      topicSuccess.textContent = 'Ошибка перенумерации тем: ' + err.message;
    } finally {
      if (btnRenumberTopics) {
        btnRenumberTopics.disabled = false;
        btnRenumberTopics.textContent = '🔢 Перенумеровать темы';
      }
    }
  }

  btnRenumberTopics?.addEventListener('click', handleRenumberTopics);

  /* ── Подтемы ──────────────────────────────────────────────────────── */

  const subtopicForm = document.querySelector('#subtopic-form');
  const subtopicList = document.querySelector('#subtopic-list');
  const subtopicSuccess = document.querySelector('#subtopic-success');
  const subtopicTopicSelect = document.querySelector('#subtopic-topic-select');
  const subtopicFormGrade = document.querySelector('#subtopic-form-grade');
  const subtopicFilterTopic = document.querySelector('#subtopic-filter-topic');
  const subtopicFilterGrade = document.querySelector('#subtopic-filter-grade');
  const subtopicFilterSort = document.querySelector('#subtopic-filter-sort');
  let editingSubtopicId = null;
  let subtopicsShown = false;

  const topicLabel = topic => `${topic.title}${topic.grade ? ` (${gradeText(topic.grade)})` : ''}`;
  const subtopicLabel = s => `${s.code ? s.code + '. ' : ''}${s.title}`;

  /* Соседи подтемы — подтемы той же темы */
  const subtopicSiblingsOf = topicId => subtopics
    .filter(s => s.topic_id === Number(topicId))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id - b.id);

  /* Стрелочки вверх/вниз для подтем */
  function subtopicArrows(sub) {
    const siblings = subtopicSiblingsOf(sub.topic_id);
    if (siblings.length < 2) return '';
    const index = siblings.findIndex(s => s.id === sub.id);
    return `<span class="admin-move">
      <button class="move-button" type="button" data-move-subtopic="${sub.id}" data-dir="up" ${index === 0 ? 'disabled' : ''} aria-label="Выше в теме">↑</button>
      <button class="move-button" type="button" data-move-subtopic="${sub.id}" data-dir="down" ${index === siblings.length - 1 ? 'disabled' : ''} aria-label="Ниже в теме">↓</button>
    </span>`;
  }

  /* Перемещение подтемы вверх/вниз со сквозной перенумерацией кодов и позиций */
  async function moveSubtopic(subtopicId, direction) {
    const sub = subtopics.find(s => String(s.id) === String(subtopicId));
    if (!sub) return;
    const siblings = subtopicSiblingsOf(sub.topic_id);
    const from = siblings.findIndex(s => s.id === sub.id);
    const to = direction === 'up' ? from - 1 : from + 1;
    if (to < 0 || to >= siblings.length) return;
    siblings.splice(to, 0, siblings.splice(from, 1)[0]);

    const parentTopic = topics.find(t => t.id === sub.topic_id);
    const grade = parentTopic ? parseFormGrade(parentTopic.grade) : null;
    const topicPos = parentTopic ? (parentTopic.position ?? 1) : 1;

    const updates = siblings
      .map((item, index) => {
        const newPos = index + 1;
        const expectedCode = (grade != null && grade !== '')
          ? `${grade}.${topicPos}.${newPos}`
          : `${topicPos}.${newPos}`;
        const shouldUpdateCode = !item.code || /^\d+(\.\d+)*$/.test(item.code);
        const newCode = shouldUpdateCode ? expectedCode : item.code;
        return { item, position: newPos, code: newCode };
      })
      .filter(({ item, position, code }) => item.position !== position || item.code !== code);

    for (const { item, position, code } of updates) {
      const { error } = await db.from('subtopics').update({ position, code }).eq('id', item.id);
      if (error) { subtopicSuccess.textContent = 'Ошибка: ' + error.message; return; }
      item.position = position;
      item.code = code;
      const inSubs = subtopics.find(s => s.id === item.id);
      if (inSubs) {
        inSubs.position = position;
        inSubs.code = code;
      }
    }
    subtopicSuccess.textContent = 'Порядок подтем изменён.';
    renderSubtopics();
  }

  /* Ребалансировка подтем 1..M: автосдвиг при вставке в середину или удалении */
  async function rebalanceSubtopicPositions(topicId, targetSubtopicId = null, desiredPosition = null) {
    const tId = Number(topicId);
    if (!tId) return;
    const parentTopic = topics.find(t => t.id === tId);
    const grade = parentTopic ? parseFormGrade(parentTopic.grade) : null;
    const topicPos = parentTopic ? (parentTopic.position ?? 1) : 1;

    let siblings = subtopicSiblingsOf(tId);

    if (targetSubtopicId != null && desiredPosition != null) {
      const existingIdx = siblings.findIndex(s => String(s.id) === String(targetSubtopicId));
      let targetItem;
      if (existingIdx >= 0) {
        targetItem = siblings.splice(existingIdx, 1)[0];
      } else {
        const found = subtopics.find(s => String(s.id) === String(targetSubtopicId));
        targetItem = found || { id: targetSubtopicId, topic_id: tId, position: desiredPosition };
      }
      const insertIdx = Math.max(0, Math.min(desiredPosition - 1, siblings.length));
      siblings.splice(insertIdx, 0, targetItem);
    }

    const updates = siblings
      .map((item, index) => {
        const newPos = index + 1;
        const expectedCode = (grade != null && grade !== '')
          ? `${grade}.${topicPos}.${newPos}`
          : `${topicPos}.${newPos}`;
        const shouldUpdateCode = !item.code || /^\d+(\.\d+)*$/.test(item.code);
        const newCode = shouldUpdateCode ? expectedCode : item.code;
        return { item, position: newPos, code: newCode };
      })
      .filter(({ item, position, code }) => item.position !== position || item.code !== code);

    for (const { item, position, code } of updates) {
      const { error } = await db.from('subtopics').update({ position, code }).eq('id', item.id);
      if (error) {
        console.warn('Ошибка обновления подтемы:', item.id, error.message);
      } else {
        item.position = position;
        item.code = code;
        const inSubs = subtopics.find(s => s.id === item.id);
        if (inSubs) {
          inSubs.position = position;
          inSubs.code = code;
        }
      }
    }
  }

  function updateSubtopicFormDefaults() {
    if (editingSubtopicId) return;
    const topicId = Number(subtopicTopicSelect?.value);
    if (!topicId) return;
    const parentTopic = topics.find(t => t.id === topicId);
    if (!parentTopic) return;
    const siblings = subtopicSiblingsOf(topicId);
    const nextPos = siblings.length + 1;
    if (subtopicForm?.elements.position) {
      subtopicForm.elements.position.value = nextPos;
    }
    if (subtopicForm?.elements.code) {
      const g = parseFormGrade(parentTopic.grade);
      const tPos = parentTopic.position ?? 1;
      subtopicForm.elements.code.value = (g != null && g !== '')
        ? `${g}.${tPos}.${nextPos}`
        : `${tPos}.${nextPos}`;
    }
  }

  function fillSubtopicFormTopicSelect() {
    if (!subtopicTopicSelect) return;
    const gradeVal = parseFormGrade(subtopicFormGrade?.value);
    const sorted = [...topics]
      .filter(t => gradeVal === null || parseFormGrade(t.grade) === gradeVal)
      .sort((a, b) => (a.grade ?? 99) - (b.grade ?? 99) || (a.position ?? 0) - (b.position ?? 0));
    const options = sorted.map(t => `<option value="${t.id}">${escapeHtml(topicLabel(t))}</option>`).join('');
    const keepForm = subtopicTopicSelect.value;
    subtopicTopicSelect.innerHTML = '<option value="">Выберите тему...</option>' + options;
    if (keepForm && sorted.some(t => String(t.id) === String(keepForm))) {
      subtopicTopicSelect.value = keepForm;
    }
  }

  function fillSubtopicFilterTopicSelect() {
    if (!subtopicFilterTopic) return;
    const gradeVal = parseFormGrade(subtopicFilterGrade?.value);
    const sorted = [...topics]
      .filter(t => gradeVal === null || parseFormGrade(t.grade) === gradeVal)
      .sort((a, b) => (a.grade ?? 99) - (b.grade ?? 99) || (a.position ?? 0) - (b.position ?? 0));
    const options = sorted.map(t => `<option value="${t.id}">${escapeHtml(topicLabel(t))}</option>`).join('');
    const keepFilter = subtopicFilterTopic.value;
    subtopicFilterTopic.innerHTML = '<option value="">Все темы</option>' + options;
    if (keepFilter && sorted.some(t => String(t.id) === String(keepFilter))) {
      subtopicFilterTopic.value = keepFilter;
    } else {
      subtopicFilterTopic.value = '';
    }
  }

  /* Оба выпадающих списка тем живут рядом с подтемами и обновляются вместе
     с каталогом: тему могли только что завести или переименовать. */
  function fillSubtopicTopicSelects() {
    fillSubtopicFormTopicSelect();
    fillSubtopicFilterTopicSelect();
  }

  function setSubtopicMode(sub) {
    if (sub) ensureSectionExpanded('section-subtopics');
    editingSubtopicId = sub?.id ?? null;
    document.querySelector('#subtopic-form-title').textContent = sub ? `Редактировать подтему: ${subtopicLabel(sub)}` : 'Подтемы';
    document.querySelector('#subtopic-submit').textContent = sub ? 'Сохранить подтему' : 'Добавить подтему';
    document.querySelector('#subtopic-cancel').hidden = !sub;
    if (sub?.topic_id) {
      const parentTopic = topics.find(t => t.id === sub.topic_id);
      if (parentTopic && subtopicFormGrade) {
        subtopicFormGrade.value = toAdminGradeVal(parentTopic.grade);
      }
      fillSubtopicFormTopicSelect();
      subtopicTopicSelect.value = String(sub.topic_id);
    } else {
      fillSubtopicFormTopicSelect();
    }
    subtopicForm.elements.code.value = sub?.code || '';
    subtopicForm.elements.position.value = Math.max(1, sub?.position ?? 1);
    subtopicForm.elements.title.value = sub?.title || '';
    if (subtopicForm.elements.title_lv) subtopicForm.elements.title_lv.value = sub?.title_lv || '';
    if (!sub) {
      updateSubtopicFormDefaults();
    }
    if (sub) subtopicForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function renderSubtopics() {
    if (!subtopicList || !subtopicsShown) return;
    const gradeVal = parseFormGrade(subtopicFilterGrade?.value);
    const topicVal = subtopicFilterTopic?.value ? Number(subtopicFilterTopic.value) : null;
    const sortMode = subtopicFilterSort?.value || 'position';
    const taskCount = sub => taskIndex.filter(t => t.subtopic_id === sub.id).length;
    const filtered = subtopics
      .filter(s => {
        const t = topics.find(item => item.id === s.topic_id);
        if (gradeVal !== null && parseFormGrade(t?.grade) !== gradeVal) return false;
        if (topicVal !== null && s.topic_id !== topicVal) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortMode === 'code') {
          return byText(a.code, b.code) || (a.position ?? 0) - (b.position ?? 0);
        }
        if (sortMode === 'title') {
          return byText(a.title, b.title);
        }
        if (sortMode === 'tasks_desc') {
          return taskCount(b) - taskCount(a) || (a.position ?? 0) - (b.position ?? 0);
        }
        if (sortMode === 'tasks_asc') {
          return taskCount(a) - taskCount(b) || (a.position ?? 0) - (b.position ?? 0);
        }
        const ta = topics.find(t => t.id === a.topic_id), tb = topics.find(t => t.id === b.topic_id);
        return (ta?.grade ?? 99) - (tb?.grade ?? 99)
          || (ta?.position ?? 0) - (tb?.position ?? 0)
          || (a.position ?? 0) - (b.position ?? 0);
      });
    const countEl = document.querySelector('#subtopic-filter-count');
    if (countEl) countEl.textContent = `Подтем: ${filtered.length} из ${subtopics.length}`;
    if (!filtered.length) {
      subtopicList.innerHTML = '<p class="admin-empty">Подтем не найдено по выбранным фильтрам. Заведите первую в форме выше.</p>';
      return;
    }
    subtopicList.innerHTML = filtered.map(s => {
      const topic = topics.find(t => t.id === s.topic_id);
      const count = taskIndex.filter(t => t.subtopic_id === s.id).length;
      return `<div class="admin-row">
        <span class="admin-row-main"><strong>${escapeHtml(subtopicLabel(s))}</strong><small>${escapeHtml(topic ? topicLabel(topic) : 'тема не найдена')} · задач: ${count}</small></span>
        ${subtopicArrows(s)}
        <button class="text-button" type="button" data-edit-subtopic="${s.id}">Изменить</button>
        <button class="text-button danger" type="button" data-delete-subtopic="${s.id}">Удалить</button>
      </div>`;
    }).join('');
  }

  function setSubtopicsShown(shown) {
    subtopicsShown = shown;
    if (subtopicList) subtopicList.hidden = !shown;
    const defer = document.querySelector('#subtopic-list-defer');
    if (defer) defer.hidden = shown;
    const closeTop = document.querySelector('#subtopic-list-close');
    if (closeTop) closeTop.hidden = !shown;
    if (shown) renderSubtopics();
  }

  document.querySelector('#btn-load-subtopics')?.addEventListener('click', () => setSubtopicsShown(true));
  document.querySelector('#btn-hide-subtopics')?.addEventListener('click', () => setSubtopicsShown(false));
  subtopicFilterGrade?.addEventListener('change', () => {
    fillSubtopicFilterTopicSelect();
    renderSubtopics();
  });
  subtopicFilterTopic?.addEventListener('change', renderSubtopics);
  subtopicFilterSort?.addEventListener('change', renderSubtopics);
  subtopicFormGrade?.addEventListener('change', () => {
    fillSubtopicFormTopicSelect();
    updateSubtopicFormDefaults();
  });
  subtopicTopicSelect?.addEventListener('change', updateSubtopicFormDefaults);

  subtopicForm?.addEventListener('submit', async event => {
    event.preventDefault();
    subtopicSuccess.textContent = '';
    const form = new FormData(subtopicForm);
    const topicId = Number(form.get('topic_id'));
    const title = form.get('title').trim();
    if (!topicId) { subtopicSuccess.textContent = 'Выберите тему.'; return; }

    const rawPos = Number(form.get('position'));
    const siblings = subtopicSiblingsOf(topicId);
    const desiredPos = (Number.isFinite(rawPos) && rawPos >= 1)
      ? rawPos
      : (siblings.length + 1);

    const payload = {
      topic_id: topicId,
      title,
      title_lv: form.get('title_lv')?.trim() || null,
      code: form.get('code')?.trim() || null,
      position: desiredPos,
    };

    let savedSubtopicId = editingSubtopicId;
    if (editingSubtopicId) {
      const { error } = await db.from('subtopics').update(payload).eq('id', editingSubtopicId);
      if (error) { subtopicSuccess.textContent = 'Ошибка: ' + error.message; return; }
    } else {
      const newSlug = `${makeSlug(title)}-${Date.now()}`;
      const { data: inserted, error } = await db.from('subtopics').insert({ ...payload, slug: newSlug }).select().single();
      if (error) { subtopicSuccess.textContent = 'Ошибка: ' + error.message; return; }
      savedSubtopicId = inserted?.id;
      if (inserted) subtopics.push(inserted);
    }

    if (savedSubtopicId) {
      await rebalanceSubtopicPositions(topicId, savedSubtopicId, desiredPos);
    }

    subtopicSuccess.textContent = editingSubtopicId ? 'Подтема сохранена.' : 'Подтема добавлена.';
    subtopicForm.reset();
    setSubtopicMode(null);
    await loadCatalog();
  });

  document.querySelector('#subtopic-cancel')?.addEventListener('click', () => {
    subtopicForm.reset();
    if (subtopicFormGrade) subtopicFormGrade.value = '';
    setSubtopicMode(null);
  });

  subtopicList?.addEventListener('click', async event => {
    const moveSubBtn = event.target.closest('[data-move-subtopic]');
    if (moveSubBtn) {
      await moveSubtopic(moveSubBtn.dataset.moveSubtopic, moveSubBtn.dataset.dir);
      return;
    }

    const editId = event.target.closest('[data-edit-subtopic]')?.dataset.editSubtopic;
    if (editId) {
      const full = await fetchFullRow('subtopics', editId);
      if (!full) { subtopicSuccess.textContent = 'Не удалось загрузить подтему для правки.'; return; }
      setSubtopicMode(full);
      return;
    }
    const deleteId = event.target.closest('[data-delete-subtopic]')?.dataset.deleteSubtopic;
    if (!deleteId) return;
    const sub = subtopics.find(s => String(s.id) === deleteId);
    const count = taskIndex.filter(t => String(t.subtopic_id) === deleteId).length;
    if (!confirm(`Удалить подтему «${subtopicLabel(sub)}»?${count ? ` ${count} задач останутся в теме, но потеряют подтему.` : ''}`)) return;
    const { error } = await db.from('subtopics').delete().eq('id', deleteId);
    if (error) { subtopicSuccess.textContent = 'Ошибка: ' + error.message; return; }
    subtopics = subtopics.filter(s => String(s.id) !== deleteId);
    if (sub?.topic_id) {
      await rebalanceSubtopicPositions(sub.topic_id);
    }
    if (String(editingSubtopicId) === deleteId) { subtopicForm.reset(); setSubtopicMode(null); }
    subtopicSuccess.textContent = 'Подтема удалена.';
    await loadCatalog();
  });

  /* Автоматическая перенумерация подтем (1..M) и кодов Skola2030 */
  async function handleRenumberSubtopics() {
    if (!subtopics || !subtopics.length) {
      alert('Список подтем пуст.');
      return;
    }
    const computeFn = window.MathTasksLib?.computeSubtopicRenumbering;
    if (!computeFn) return;

    const selectedTopicId = Number(subtopicFilterTopic?.value) || null;
    const targetTopicIds = selectedTopicId ? [selectedTopicId] : [...new Set(subtopics.map(s => s.topic_id).filter(Boolean))];

    const itemsToUpdate = [];
    for (const tId of targetTopicIds) {
      const topicSubs = subtopics.filter(s => s.topic_id === tId);
      const parentTopic = topics.find(t => t.id === tId);
      const plan = computeFn(topicSubs, parentTopic);
      for (const item of plan) {
        if (item.changed) itemsToUpdate.push(item);
      }
    }

    if (!itemsToUpdate.length) {
      alert('Все подтемы уже упорядочены (1..M) с корректными кодами Skola2030, изменений не требуется.');
      return;
    }

    const scopeMsg = selectedTopicId
      ? 'подтемы выбранной темы'
      : 'все подтемы во всех темах';
    if (!confirm(`Перенумеровать ${scopeMsg} (1..M) и обновить коды Skola2030? Будут обновлены ${itemsToUpdate.length} подтем.`)) {
      return;
    }

    if (btnRenumberSubtopics) {
      btnRenumberSubtopics.disabled = true;
      btnRenumberSubtopics.textContent = '⏳ Перенумерация...';
    }

    try {
      for (const item of itemsToUpdate) {
        const patch = { position: item.newPosition };
        if (item.newCode) patch.code = item.newCode;
        const { error } = await db.from('subtopics').update(patch).eq('id', item.id);
        if (error) {
          console.warn('Ошибка обновления подтемы:', item.id, error.message);
        } else {
          item.subtopic.position = item.newPosition;
          if (item.newCode) item.subtopic.code = item.newCode;
          const inSubs = subtopics.find(s => s.id === item.id);
          if (inSubs) {
            inSubs.position = item.newPosition;
            if (item.newCode) inSubs.code = item.newCode;
          }
        }
      }
      subtopicSuccess.textContent = `Успешно перенумеровано подтем: ${itemsToUpdate.length}.`;
      renderSubtopics();
    } catch (err) {
      subtopicSuccess.textContent = 'Ошибка перенумерации подтем: ' + err.message;
    } finally {
      if (btnRenumberSubtopics) {
        btnRenumberSubtopics.disabled = false;
        btnRenumberSubtopics.textContent = '🔢 Перенумеровать подтемы';
      }
    }
  }

  btnRenumberSubtopics?.addEventListener('click', handleRenumberSubtopics);

  /* ── Задачи ───────────────────────────────────────────────────────── */

  const conditionInput = document.querySelector('#condition-input');
  const answerInput = document.querySelector('#answer-input');
  const hintInput = document.querySelector('#hint-input');
  const hintInputLv = document.querySelector('#hint-input-lv');
  const solutionInput = document.querySelector('#solution-input');
  const conditionPreview = document.querySelector('#condition-preview');
  const answerPreview = document.querySelector('#answer-preview');
  const solutionPreview = document.querySelector('#solution-preview');

  const conditionInputLv = document.querySelector('#condition-input-lv');
  const answerInputLv = document.querySelector('#answer-input-lv');
  const solutionInputLv = document.querySelector('#solution-input-lv');
  const conditionPreviewLv = document.querySelector('#condition-preview-lv');
  const solutionPreviewLv = document.querySelector('#solution-preview-lv');

  // Предпросмотр показывает ровно то, что увидит посетитель, — до сохранения.
  const updatePreviews = () => {
    if (conditionPreview && conditionInput) renderMath(conditionPreview, conditionInput.value);
    if (answerPreview && answerInput) renderMath(answerPreview, answerInput.value);
    if (solutionPreview && solutionInput) renderMath(solutionPreview, solutionInput.value);
    if (conditionPreviewLv && conditionInputLv) renderMath(conditionPreviewLv, conditionInputLv.value);
    if (solutionPreviewLv && solutionInputLv) renderMath(solutionPreviewLv, solutionInputLv.value);
  };
  [conditionInput, answerInput, answerInputLv, solutionInput, conditionInputLv, solutionInputLv, hintInput, hintInputLv]
    .filter(Boolean)
    .forEach(input => input.addEventListener('input', updatePreviews));

  // Переключение языковых вкладок в форме задания
  const taskLangTabs = document.querySelectorAll('.task-lang-tab');
  const taskLangGroups = document.querySelectorAll('.task-lang-group');
  taskLangTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      taskLangTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const lang = tab.dataset.taskLang;
      taskLangGroups.forEach(group => {
        group.hidden = group.dataset.langGroup !== lang;
      });
      updatePreviews();
    });
  });

  // Встроенный математический глоссарий для надежного перевода терминов
  const MATH_GLOSSARY = {
    lv: [
      [/^Решите уравнение/i, 'Atrisiniet vienādojumu'],
      [/^Решить уравнение/i, 'Atrisināt vienādojumu'],
      [/^Вычислите значение/i, 'Aprēķiniet izteiksmes vērtību'],
      [/^Вычислите/i, 'Aprēķiniet'],
      [/^Вычислить/i, 'Aprēķināt'],
      [/^Упростите выражение/i, 'Vienkāršojiet izteiksmi'],
      [/^Упростить выражение/i, 'Vienkāršot izteiksmi'],
      [/^Упростите/i, 'Vienkāršojiet'],
      [/^Найдите корни уравнения/i, 'Atrodiet vienādojuma saknes'],
      [/^Найдите корень/i, 'Atrodiet sakni'],
      [/^Найдите/i, 'Atrodiet'],
      [/^Найти/i, 'Atrast'],
      [/Раскроем скобки в левой части уравнения/i, 'Atveriet iekavas vienādojuma kreisajā pusē'],
      [/Раскроем скобки/i, 'Atveriet iekavas'],
      [/Перенесём слагаемые/i, 'Pārnesiet saskaitāmos'],
      [/Проверка/i, 'Pārbaude'],
      [/Дискриминант/i, 'Diskriminants'],
      [/значит/i, 'tātad'],
      [/Следовательно/i, 'Tātad'],
      [/Равенство верное/i, 'Vienādība ir patiesa'],
      [/Ответ/i, 'Atbilde'],
      [/Решение/i, 'Atrisinājums']
    ],
    ru: [
      [/^Atrisiniet vienādojumu/i, 'Решите уравнение'],
      [/^Atrisināt vienādojumu/i, 'Решить уравнение'],
      [/^Aprēķiniet izteiksmes vērtību/i, 'Вычислите значение выражения'],
      [/^Aprēķiniet/i, 'Вычислите'],
      [/^Aprēķināt/i, 'Вычислить'],
      [/^Vienkāršojiet izteiksmi/i, 'Упростите выражение'],
      [/^Vienkāršojiet/i, 'Упростите'],
      [/^Atrodiet vienādojuma saknes/i, 'Найдите корни уравнения'],
      [/^Atrodiet sakni/i, 'Найдите корень'],
      [/^Atrodiet/i, 'Найдите'],
      [/^Atrast/i, 'Найти'],
      [/Atveriet iekavas/i, 'Раскроем скобки'],
      [/Pārnesiet saskaitāmos/i, 'Перенесём слагаемые'],
      [/Pārbaude/i, 'Проверка'],
      [/Diskriminants/i, 'Дискриминант'],
      [/Vienādība ir patiesa/i, 'Равенство верное'],
      [/tātad/i, 'значит'],
      [/Atbilde/i, 'Ответ'],
      [/Atrisinājums/i, 'Решение']
    ]
  };

  /* Перевод работает в обе стороны: раньше пара языков была зашита как ru|lv,
     и заполнить русские поля по латышским было нечем. */
  async function translateTextWithLatex(text, targetLang = 'lv') {
    if (!text || !text.trim()) return '';
    const sourceLang = targetLang === 'ru' ? 'lv' : 'ru';
    const { maskedText, tokens } = window.MathTasksLib.maskLatexForTranslation(text);
    if (!maskedText.trim()) return '';

    let translated = '';
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(maskedText)}&langpair=${sourceLang}|${targetLang}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json?.responseData?.translatedText && !json.responseData.translatedText.startsWith('MYMEMORY WARNING')) {
          translated = json.responseData.translatedText;
        }
      }
    } catch (e) {
      console.warn('Translate API fetch failed, using fallback glossary:', e);
    }

    if (!translated) {
      translated = maskedText;
      const rules = MATH_GLOSSARY[targetLang] || [];
      for (const [pattern, replacement] of rules) {
        translated = translated.replace(pattern, replacement);
      }
    }

    return window.MathTasksLib.unmaskLatexAfterTranslation(translated, tokens);
  }

  function translateWithGlossaryFast(text, targetLang = 'lv') {
    if (!text || !String(text).trim()) return null;
    const { maskedText, tokens } = window.MathTasksLib.maskLatexForTranslation(String(text));
    if (!maskedText.trim()) return null;
    let translated = maskedText;
    const rules = MATH_GLOSSARY[targetLang] || [];
    let modified = false;
    for (const [pattern, replacement] of rules) {
      if (pattern.test(translated)) {
        translated = translated.replace(pattern, replacement);
        modified = true;
      }
    }
    return modified ? window.MathTasksLib.unmaskLatexAfterTranslation(translated, tokens) : null;
  }

  function extractCleanJson(raw) {
    if (!raw) return '';
    let str = String(raw).trim();

    const fenceMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch && fenceMatch[1]) {
      str = fenceMatch[1].trim();
    }

    const firstBrace = str.indexOf('{');
    const firstBracket = str.indexOf('[');
    let startIdx = -1;
    let endChar = '';

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endChar = '}';
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endChar = ']';
    }

    if (startIdx !== -1) {
      const lastEnd = str.lastIndexOf(endChar);
      if (lastEnd > startIdx) {
        str = str.slice(startIdx, lastEnd + 1);
      }
    }

    return str;
  }

  function safeParseJson(raw) {
    if (window.MathTasksLib?.safeParseJson) {
      return window.MathTasksLib.safeParseJson(raw);
    }
    const clean = extractCleanJson(raw);
    try {
      return JSON.parse(clean);
    } catch (initialErr) {
      try {
        let sanitized = clean.replace(/\\([bfrtn])([a-zA-Z]{2,})/g, '\\\\$1$2');
        sanitized = sanitized.replace(/\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, '\\\\');
        return JSON.parse(sanitized);
      } catch (secondErr) {
        try {
          let sanitized2 = clean.replace(/\\([^"\\])/g, '\\\\$1');
          return JSON.parse(sanitized2);
        } catch (thirdErr) {
          throw initialErr;
        }
      }
    }
  }

  async function translateWithGemini(texts, direction, apiKey) {
    const toLv = direction === 'ru2lv';
    const prompt = `Ты эксперт по латвийской школьной математике и стандартам Skola2030.
Переведи массив текстов задачи ${toLv ? 'с русского на латышский язык' : 'с латышского на русский язык'}.

ПРАВИЛА:
1. Используй официальную латвийскую терминологию Skola2030 (например: vienādojums, atrisināt vienādojumu, aprēķināt, saknes, trijstūris, laukums, perimetrs, taisnleņķa, riņķa līnija).
2. СТРОГО СОХРАНЯЙ все формулы LaTeX / KaTeX внутри $...$ и $$...$$ БЕЗ ИЗМЕНЕНИЙ.
3. Верни ТОЛЬКО валидный JSON-массив строк той же длины [${texts.map(() => '""').join(', ')}], без markdown-блоков и без \`\`\`json.

Тексты:
${JSON.stringify(texts)}`;

    const requestBody = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const candidateModels = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
    let lastError = null;
    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody
        });
        if (r.ok) {
          const data = await r.json();
          const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            try {
              const parsed = (window.MathTasksLib?.safeParseJson || safeParseJson)(candidateText);
              if (Array.isArray(parsed) && parsed.length === texts.length) {
                return parsed;
              }
            } catch (err) {
              console.warn('Ошибка парсинга перевода:', err);
            }
          }
        }
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError || new Error('Не удалось получить перевод от Gemini AI');
  }

  /* Одна процедура на оба направления: раньше перевод был только RU → LV,
     и заполнить русские поля по латышским было нечем. */
  async function runTranslation(button, direction) {
    const toLv = direction === 'ru2lv';
    const fields = (toLv
      ? [[taskForm.elements.title, taskForm.elements.title_lv],
         [conditionInput, conditionInputLv],
         [solutionInput, solutionInputLv],
         [answerInput, answerInputLv],
         [hintInput, hintInputLv]]
      : [[taskForm.elements.title_lv, taskForm.elements.title],
         [conditionInputLv, conditionInput],
         [solutionInputLv, solutionInput],
         [answerInputLv, answerInput],
         [hintInputLv, hintInput]]
    ).filter(([src, dst]) => src || dst);

    const conditionField = toLv ? conditionInput : conditionInputLv;
    const titleField = toLv ? taskForm.elements.title : taskForm.elements.title_lv;
    if (!conditionField?.value.trim() && !titleField?.value.trim()) {
      taskSuccess.textContent = toLv
        ? 'Сначала заполните условие на русском.'
        : 'Сначала заполните условие на латышском.';
      return;
    }

    const label = button.innerHTML;
    button.disabled = true;

    const apiKey = (document.querySelector('#ai-gemini-key')?.value || '').trim() || localStorage.getItem('math_tasks_gemini_api_key') || '';

    try {
      if (apiKey) {
        button.innerHTML = '<span class="ai-icon">✨</span> Gemini AI переводит…';
        try {
          const sourceTexts = fields.map(([from]) => from?.value?.trim() || '');
          const results = await translateWithGemini(sourceTexts, direction, apiKey);
          fields.forEach(([, to], i) => { if (to && results[i]) to.value = results[i]; });
          updatePreviews();
          taskSuccess.textContent = toLv
            ? '✨ Качественный перевод через Google Gemini AI готов — проверьте вкладку LV.'
            : '✨ Качественный перевод через Google Gemini AI готов — проверьте вкладку RU.';
          setTimeout(() => { if (taskSuccess.textContent.startsWith('✨')) taskSuccess.textContent = ''; }, 6000);
          return;
        } catch (geminiErr) {
          console.warn('Gemini translation failed, falling back to MyMemory:', geminiErr);
        }
      }

      button.innerHTML = '<span class="ai-icon">⏳</span> Переводим…';
      const target = toLv ? 'lv' : 'ru';
      const results = await Promise.all(fields.map(([from]) => translateTextWithLatex(from?.value.trim() || '', target)));
      fields.forEach(([, to], i) => { if (to) to.value = results[i]; });
      updatePreviews();
      taskSuccess.textContent = toLv
        ? '✨ Перевод на латышский готов — проверьте вкладку LV.'
        : '✨ Перевод на русский готов — проверьте вкладку RU.';
      setTimeout(() => { if (taskSuccess.textContent.startsWith('✨')) taskSuccess.textContent = ''; }, 6000);
    } catch (err) {
      taskSuccess.textContent = 'Ошибка при переводе: ' + err.message;
    } finally {
      button.disabled = false;
      button.innerHTML = label;
    }
  }

  document.querySelector('#btn-ai-translate')
    ?.addEventListener('click', event => runTranslation(event.currentTarget, 'ru2lv'));
  document.querySelector('#btn-ai-translate-back')
    ?.addEventListener('click', event => runTranslation(event.currentTarget, 'lv2ru'));

  /* ── Чертежи ──────────────────────────────────────────────────────
     Файл уходит в хранилище сразу при выборе, чтобы админ увидел его до
     сохранения. Поэтому у каждого поля два состояния: saved — то, что
     записано в задаче, current — то, что показано сейчас. Всё, что
     оказалось лишним, удаляем из бакета: иначе он зарастёт сиротами. */
  const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
  /* SVG нужен для чертежей: нейросеть выдаёт их разметкой, а не картинкой,
     и такой чертёж остаётся чётким при любом увеличении и весит килобайты.
     Скрипты внутри SVG при загрузке через тег img не выполняются, поэтому
     показывать такой файл безопасно — но только через img, не через iframe. */
  const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
  const EXTENSIONS = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg' };
  const storage = () => db.storage.from(window.MathTasks.IMAGE_BUCKET);
  const images = {
    condition: { saved: null, current: null },
    solution: { saved: null, current: null }
  };

  const removeFile = async path => {
    if (!path) return;
    const { error } = await storage().remove([path]);
    if (error) console.warn('Не удалось удалить файл из хранилища:', path, error.message);
  };

  function paintImage(kind) {
    const thumb = document.querySelector(`#${kind}-image-thumb`);
    const url = window.MathTasks.imageUrl(images[kind].current);
    thumb.hidden = !url;
    if (url) thumb.src = url;
    document.querySelector(`#${kind}-image-clear`).hidden = !url;
  }

  function setImages(task) {
    for (const kind of ['condition', 'solution']) {
      const path = task?.[`${kind}_image`] || null;
      images[kind] = { saved: path, current: path };
      document.querySelector(`#${kind}-image-input`).value = '';
      document.querySelector(`#${kind}-image-error`).textContent = '';
      paintImage(kind);
    }
  }

  // Загрузка, не доведённая до сохранения, откатывается — файл в бакете не нужен.
  async function discardPendingImages() {
    for (const kind of ['condition', 'solution']) {
      const { saved, current } = images[kind];
      if (current && current !== saved) await removeFile(current);
      images[kind].current = saved;
    }
  }

  for (const kind of ['condition', 'solution']) {
    const input = document.querySelector(`#${kind}-image-input`);
    const errorElement = document.querySelector(`#${kind}-image-error`);

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      errorElement.textContent = '';
      if (!file) return;
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        errorElement.textContent = 'Нужен файл png, jpg, webp или svg.';
        input.value = '';
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        errorElement.textContent = `Файл ${(file.size / 1024 / 1024).toFixed(1)} МБ — больше допустимых 2 МБ.`;
        input.value = '';
        return;
      }
      // Имя строим сами: кириллица и пробелы из исходного имени в путь не идут.
      const path = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${EXTENSIONS[file.type]}`;
      const { error } = await storage().upload(path, file, { contentType: file.type });
      if (error) {
        errorElement.textContent = 'Не удалось загрузить: ' + error.message;
        input.value = '';
        return;
      }
      const previous = images[kind].current;
      images[kind].current = path;
      if (previous && previous !== images[kind].saved) await removeFile(previous);
      paintImage(kind);
    });

    document.querySelector(`#${kind}-image-clear`).addEventListener('click', async () => {
      const { saved, current } = images[kind];
      if (current && current !== saved) await removeFile(current);
      images[kind].current = null;
      input.value = '';
      errorElement.textContent = '';
      paintImage(kind);
    });
  }

  /* ── Кросс-теги (VISC/Skola2030) ─────────────────────────────────── */
  let tagsReady = false;
  let allTags = [];

  async function detectTagsSupport() {
    if (!db) return;
    try {
      const { data, error } = await db.from('tags').select('id,slug,title,title_lv,description').order('position');
      if (!error && data && data.length > 0) {
        tagsReady = true;
        allTags = data;
      } else {
        tagsReady = false;
        allTags = window.MathTasksLib?.CROSS_TAGS || [];
      }
    } catch {
      tagsReady = false;
      allTags = window.MathTasksLib?.CROSS_TAGS || [];
    }
    renderTagSelector();
  }

  const TAG_CATEGORIES = {
    algebra: ['algebriskie-parveidojumi', 'vienadojumi', 'nevienadibas', 'dalas-procenti', 'dalamiba', 'pakapes-saknes', 'logaritmi'],
    geometry: ['planimetrija', 'stereometrija', 'merijumi', 'vektori', 'koordinatu-metode'],
    functions: ['funkcijas', 'grafiki', 'trigonometrija', 'matematiska-analize', 'virknes'],
    data: ['varbutiba', 'statistika', 'kombinatorika', 'teksta-uzdevumi', 'modelesana', 'pieradijumi']
  };

  function getTagCategory(slug) {
    for (const [cat, slugs] of Object.entries(TAG_CATEGORIES)) {
      if (slugs.includes(slug)) return cat;
    }
    return 'algebra';
  }

  let activeTagCategory = 'all';
  let tagSearchQuery = '';
  let tagFiltersInitialized = false;

  function renderTagSelector() {
    const container = document.querySelector('#task-tags-selector');
    if (!container) return;
    const list = allTags.length ? allTags : (window.MathTasksLib?.CROSS_TAGS || []);

    container.innerHTML = list.map(tag => {
      const cat = getTagCategory(tag.slug);
      return `
        <label class="tag-chip" data-slug="${escapeHtml(tag.slug)}" data-cat="${cat}" title="${escapeHtml(tag.description || tag.title)}">
          <input type="checkbox" name="task_tag" value="${escapeHtml(tag.slug)}" data-tag-id="${tag.id || ''}" class="tag-chip-checkbox" />
          <span class="tag-chip-icon">+</span>
          <span class="tag-chip-title">${escapeHtml(tag.title)}</span>
        </label>
      `;
    }).join('');

    container.querySelectorAll('input[name="task_tag"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = container.querySelectorAll('input[name="task_tag"]:checked');
        if (checked.length > 3) {
          cb.checked = false;
          alert('Можно выбрать не более 3 кросс-тегов для одной задачи.');
        }
        updateSelectedTagsCount();
      });
    });

    if (!tagFiltersInitialized) {
      setupTagFilters();
      tagFiltersInitialized = true;
    }
    applyTagFilters();
    updateSelectedTagsCount();
  }

  function setupTagFilters() {
    const searchInput = document.querySelector('#task-tags-search');
    const catContainer = document.querySelector('#task-tags-categories');

    searchInput?.addEventListener('input', () => {
      tagSearchQuery = (searchInput.value || '').toLowerCase().trim();
      applyTagFilters();
    });

    catContainer?.addEventListener('click', (e) => {
      const btn = e.target.closest('.tag-cat-btn');
      if (!btn) return;
      catContainer.querySelectorAll('.tag-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTagCategory = btn.dataset.cat || 'all';
      applyTagFilters();
    });
  }

  function applyTagFilters() {
    const chips = document.querySelectorAll('#task-tags-selector .tag-chip');
    chips.forEach(chip => {
      const slug = chip.dataset.slug || '';
      const cat = chip.dataset.cat || '';
      const text = chip.querySelector('.tag-chip-title')?.textContent?.toLowerCase() || '';
      const matchesCat = activeTagCategory === 'all' || cat === activeTagCategory;
      const matchesSearch = !tagSearchQuery || text.includes(tagSearchQuery) || slug.includes(tagSearchQuery);
      chip.hidden = !(matchesCat && matchesSearch);
    });
  }

  function updateSelectedTagsCount() {
    const countEl = document.querySelector('#task-tags-count');
    const checked = document.querySelectorAll('#task-tags-selector input[name="task_tag"]:checked');
    const totalSelected = checked.length;
    if (countEl) countEl.textContent = `(выбрано: ${totalSelected} / макс. 3)`;

    const allChips = document.querySelectorAll('#task-tags-selector .tag-chip');
    allChips.forEach(chip => {
      const cb = chip.querySelector('input[type="checkbox"]');
      const icon = chip.querySelector('.tag-chip-icon');
      if (cb?.checked) {
        chip.classList.add('active');
        chip.classList.remove('disabled');
        if (icon) icon.textContent = '✓';
      } else {
        chip.classList.remove('active');
        if (icon) icon.textContent = '+';
        if (totalSelected >= 3) {
          chip.classList.add('disabled');
        } else {
          chip.classList.remove('disabled');
        }
      }
    });

    // Панель выбранных тегов с кнопкой удаления
    const selectedBar = document.querySelector('#task-tags-selected-bar');
    const selectedList = document.querySelector('#tags-selected-list');
    if (selectedBar && selectedList) {
      if (totalSelected === 0) {
        selectedBar.hidden = true;
        selectedList.innerHTML = '';
      } else {
        selectedBar.hidden = false;
        selectedList.innerHTML = Array.from(checked).map(cb => {
          const chip = cb.closest('.tag-chip');
          const title = chip?.querySelector('.tag-chip-title')?.textContent || cb.value;
          return `
            <span class="tag-selected-badge" data-slug="${escapeHtml(cb.value)}">
              <span class="badge-text">${escapeHtml(title)}</span>
              <button type="button" class="badge-remove-btn" title="Удалить тег">&times;</button>
            </span>
          `;
        }).join('');

        selectedList.querySelectorAll('.badge-remove-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const badge = btn.closest('.tag-selected-badge');
            const slug = badge?.dataset.slug;
            if (slug) {
              const targetCb = document.querySelector(`#task-tags-selector input[value="${slug}"]`);
              if (targetCb) {
                targetCb.checked = false;
                updateSelectedTagsCount();
              }
            }
          });
        });
      }
    }
  }

  function getSelectedTagSlugs() {
    const checked = document.querySelectorAll('#task-tags-selector input[name="task_tag"]:checked');
    return Array.from(checked).map(cb => cb.value);
  }

  function setSelectedTagSlugs(slugs = []) {
    const set = new Set(slugs);
    document.querySelectorAll('#task-tags-selector input[name="task_tag"]').forEach(cb => {
      cb.checked = set.has(cb.value);
    });
    updateSelectedTagsCount();
  }

  document.querySelector('#btn-suggest-tags')?.addEventListener('click', () => {
    const topic = topics.find(item => String(item.id) === topicSelect.value);
    const titleVal = taskForm.elements.title?.value || '';
    const condVal = conditionInput?.value || '';
    const text = `${topic ? topic.title + ' ' + (topic.description || '') : ''} ${titleVal} ${condVal}`;
    const suggested = window.MathTasksLib?.suggestTagsForTopic(text) || [];
    if (suggested.length) {
      setSelectedTagSlugs(suggested);
    }
  });

  const taskGradeSelect = document.querySelector('#task-grade');

  function updateTaskTopicDropdown(preferredTopicId = null) {
    const selectedGrade = parseFormGrade(taskGradeSelect?.value);
    const currentVal = preferredTopicId !== null ? String(preferredTopicId) : topicSelect.value;
    const filtered = (selectedGrade !== null)
      ? topics.filter(t => t.grade === selectedGrade)
      : topics;

    topicSelect.innerHTML = '<option value="">Без темы</option>' +
      filtered.map(t => `<option value="${t.id}">${escapeHtml(t.title)} (${gradeText(t.grade)})</option>`).join('') +
      (selectedGrade !== null && filtered.length < topics.length ? `<option value="__all__">-- Показать все темы (${topics.length}) --</option>` : '');

    if (filtered.some(t => String(t.id) === currentVal)) {
      topicSelect.value = currentVal;
    } else if (currentVal === '') {
      topicSelect.value = '';
    }
  }

  function updateFilterTopicDropdown() {
    if (!taskFilterTopic) return;
    const selectedGrade = parseFormGrade(taskFilterGrade?.value);
    const currentVal = taskFilterTopic.value;
    const filtered = (selectedGrade !== null)
      ? topics.filter(t => t.grade === selectedGrade)
      : topics;

    taskFilterTopic.innerHTML = '<option value="">Все темы</option>' +
      filtered.map(t => `<option value="${t.id}">${escapeHtml(t.title)} (${gradeText(t.grade)})</option>`).join('');

    if (filtered.some(t => String(t.id) === currentVal)) {
      taskFilterTopic.value = currentVal;
    } else {
      taskFilterTopic.value = '';
    }
  }

  /* Подтемы принадлежат теме, поэтому список пересобирается при каждой
     смене темы. Пустой список — не ошибка: у темы может не быть подтем. */
  function updateSubtopicDropdown(preferredSubtopicId = null) {
    if (!subtopicSelect) return;
    const topicId = Number(topicSelect.value) || null;
    const currentVal = preferredSubtopicId !== null ? String(preferredSubtopicId) : subtopicSelect.value;
    const mine = subtopics.filter(s => s.topic_id === topicId);
    subtopicSelect.innerHTML = '<option value="">Без подтемы</option>' +
      mine.map(s => `<option value="${s.id}">${escapeHtml(`${s.code ? s.code + '. ' : ''}${s.title}`)}</option>`).join('');
    subtopicSelect.value = mine.some(s => String(s.id) === currentVal) ? currentVal : '';
    subtopicSelect.disabled = !mine.length;
  }

  taskGradeSelect?.addEventListener('change', () => {
    updateTaskTopicDropdown();
    updateSubtopicDropdown();
  });

  // Класс обычно совпадает с классом темы — подставляем, но не запрещаем менять.
  topicSelect.addEventListener('change', () => {
    if (topicSelect.value === '__all__') {
      topicSelect.innerHTML = '<option value="">Без темы</option>' +
        topics.map(t => `<option value="${t.id}">${escapeHtml(t.title)} (${gradeText(t.grade)})</option>`).join('');
      return;
    }
    updateSubtopicDropdown();
    const topic = topics.find(item => String(item.id) === topicSelect.value);
    if (topic?.grade && !taskGradeSelect.value) {
      taskGradeSelect.value = String(topic.grade);
      updateTaskTopicDropdown(topic.id);
    }
    if (getSelectedTagSlugs().length === 0 && topic) {
      const text = `${topic.title} ${topic.description || ''}`;
      const suggested = window.MathTasksLib?.suggestTagsForTopic(text) || [];
      if (suggested.length) {
        setSelectedTagSlugs(suggested);
      }
    }
  });

  /* В списках лежат укороченные строки, поэтому перед правкой добираем
     полную запись. Одна строка по идентификатору — это быстро. */
  async function fetchFullRow(table, id) {
    const { data, error } = await db.from(table).select('*').eq('id', id).limit(1);
    if (error || !data || !data[0]) return null;
    return data[0];
  }

  function setTaskMode(task) {
    if (task) ensureSectionExpanded('section-task-form');
    editingTaskId = task?.id ?? null;
    document.querySelector('#task-form-title').textContent = task ? `Редактировать задачу №${task.position ?? task.id}` : 'Создание и редактирование задачи';
    document.querySelector('#task-submit').textContent = task ? 'Сохранить задачу' : 'Добавить задачу';
    document.querySelector('#task-cancel').hidden = !task;
    if (taskForm.elements.title) taskForm.elements.title.value = task?.title || '';
    if (taskForm.elements.title_lv) taskForm.elements.title_lv.value = task?.title_lv || '';
    taskForm.elements.grade.value = toAdminGradeVal(task?.grade);
    updateTaskTopicDropdown(task?.topic_id);
    taskForm.elements.topic_id.value = task?.topic_id ? String(task.topic_id) : '';
    updateSubtopicDropdown(task?.subtopic_id ?? null);
    taskForm.elements.difficulty.value = task?.difficulty || 'Средний';
    taskForm.elements.position.value = task?.position ?? 0;
    conditionInput.value = task?.condition_latex || '';
    if (conditionInputLv) conditionInputLv.value = task?.condition_latex_lv || '';
    answerInput.value = task?.answer_latex || '';
    if (answerInputLv) answerInputLv.value = task?.answer_latex_lv || '';
    if (hintInput) hintInput.value = task?.hint_latex || '';
    if (hintInputLv) hintInputLv.value = task?.hint_latex_lv || '';
    solutionInput.value = task?.solution_latex || '';
    if (solutionInputLv) solutionInputLv.value = task?.solution_latex_lv || '';
    taskForm.elements.is_published.checked = task ? task.is_published : true;
    setImages(task);
    updatePreviews();
    if (task && tagsReady) {
      db.from('task_tags').select('tags(slug)').eq('task_id', task.id)
        .then(({ data: tagLinks }) => {
          const slugs = (tagLinks || []).map(l => l.tags?.slug).filter(Boolean);
          setSelectedTagSlugs(slugs);
        })
        .catch(() => setSelectedTagSlugs([]));
    } else {
      setSelectedTagSlugs([]);
    }
    if (task) taskForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* Порядок задаётся внутри темы: соседи по списку — только задачи той же темы,
     иначе стрелка перекинула бы задачу через границу раздела. */
  const siblingsOf = topicId => taskIndex.filter(task => (task.topic_id ?? null) === (topicId ?? null));

  // Новая задача без явно указанного номера встаёт в конец своей темы:
  // набивать номера руками при добавлении двадцати задач невыносимо.
  function nextPosition(topicId, rawValue) {
    const typed = Number(rawValue) || 0;
    if (editingTaskId || typed) return typed;
    const siblings = siblingsOf(topicId);
    return siblings.length ? Math.max(...siblings.map(task => task.position ?? 0)) + 1 : 1;
  }

  function difficultyBadge(diff) {
    if (!diff) return '';
    const d = String(diff).trim().toLowerCase();
    let cls = 'medium';
    if (d.includes('лёгк') || d.includes('легк') || d.includes('баз') || d.includes('easy')) {
      cls = 'easy';
    } else if (d.includes('сложн') || d.includes('hard') || d.includes('проф') || d.includes('augst')) {
      cls = 'hard';
    }
    return `<span class="task-diff ${cls}"><span class="diff-dot">●</span>${escapeHtml(diff)}</span>`;
  }

  /* Выбранная сортировка переживает перезагрузку: админ обычно работает
     в одном режиме подряд, и сбрасывать его на каждый F5 — мучение. */
  const SORT_KEY = 'math-tasks:admin-sort';
  const loadSort = () => { try { return JSON.parse(localStorage.getItem(SORT_KEY)) || {}; } catch { return {}; } };
  const saveSort = () => {
    try {
      localStorage.setItem(SORT_KEY, JSON.stringify({
        tasks: taskFilterSort?.value || 'recent',
        topics: topicFilterSort?.value || 'grade'
      }));
    } catch {}
  };

  // Класс может быть числом или курсом старшей школы — сравниваем по числу.
  const gradeRank = value => (value == null ? 999 : Number(parseFormGrade(value) ?? 999));
  const byText = (a, b) => String(a || '').localeCompare(String(b || ''), 'ru');
  const DIFFICULTY_RANK = { 'Лёгкий': 1, 'Средний': 2, 'Сложный': 3 };

  function sortTasks(list) {
    const mode = taskFilterSort?.value || 'recent';
    const topicOf = task => topics.find(t => t.id === task.topic_id);
    const subOf = task => subtopics.find(s => s.id === task.subtopic_id);
    const copy = [...list];
    switch (mode) {
      case 'title':
        return copy.sort((a, b) => byText(a.title, b.title));
      case 'grade':
        return copy.sort((a, b) =>
          gradeRank(a.grade ?? topicOf(a)?.grade) - gradeRank(b.grade ?? topicOf(b)?.grade)
          || byText(a.title, b.title));
      case 'topic':
        return copy.sort((a, b) =>
          byText(topicOf(a)?.title || 'яяя', topicOf(b)?.title || 'яяя')
          || (a.position ?? 0) - (b.position ?? 0));
      case 'subtopic':
        return copy.sort((a, b) =>
          byText(topicOf(a)?.title || 'яяя', topicOf(b)?.title || 'яяя')
          || (subOf(a)?.position ?? 9999) - (subOf(b)?.position ?? 9999)
          || byText(subOf(a)?.code, subOf(b)?.code)
          || (a.position ?? 0) - (b.position ?? 0)
          || byText(a.title, b.title));
      case 'num_asc':
        return copy.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || byText(a.title, b.title));
      case 'num_desc':
        return copy.sort((a, b) => (b.position ?? 0) - (a.position ?? 0) || byText(a.title, b.title));
      case 'diff_asc':
      case 'difficulty':
        return copy.sort((a, b) =>
          (DIFFICULTY_RANK[a.difficulty] || 9) - (DIFFICULTY_RANK[b.difficulty] || 9)
          || (a.position ?? 0) - (b.position ?? 0)
          || byText(a.title, b.title));
      case 'diff_desc':
        return copy.sort((a, b) =>
          (DIFFICULTY_RANK[b.difficulty] || 9) - (DIFFICULTY_RANK[a.difficulty] || 9)
          || (a.position ?? 0) - (b.position ?? 0)
          || byText(a.title, b.title));
      case 'status':
        // Черновики сверху: именно их обычно и ищут, чтобы доделать.
        return copy.sort((a, b) => Number(a.is_published) - Number(b.is_published) || byText(a.title, b.title));
      default:
        return copy.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    }
  }

  function sortTopics(list) {
    const mode = topicFilterSort?.value || 'grade';
    const taskCount = topic => taskIndex.filter(t => t.topic_id === topic.id).length;
    const copy = [...list];
    switch (mode) {
      case 'title':
        return copy.sort((a, b) => byText(a.title, b.title));
      case 'subject':
        return copy.sort((a, b) =>
          byText(subjectTitle(a.subject_id), subjectTitle(b.subject_id))
          || gradeRank(a.grade) - gradeRank(b.grade)
          || (a.position ?? 0) - (b.position ?? 0));
      case 'tasks_desc':
        return copy.sort((a, b) => taskCount(b) - taskCount(a) || byText(a.title, b.title));
      case 'tasks_asc':
        // Пустые темы сверху — так видно, что осталось наполнить.
        return copy.sort((a, b) => taskCount(a) - taskCount(b) || byText(a.title, b.title));
      default:
        return copy.sort((a, b) =>
          gradeRank(a.grade) - gradeRank(b.grade)
          || (a.position ?? 0) - (b.position ?? 0)
          || byText(a.title, b.title));
    }
  }

  function getFilteredTopics() {
    const query = (topicSearchInput?.value || '').trim().toLowerCase();
    const gradeVal = parseFormGrade(topicFilterGrade?.value);
    const subjectVal = topicFilterSubject?.value ? Number(topicFilterSubject.value) : null;
    return topics.filter(topic => {
      if (query) {
        const haystack = `${topic.title || ''} ${topic.title_lv || ''} ${topic.description || ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (gradeVal !== null && topic.grade !== gradeVal) return false;
      if (subjectVal !== null && topic.subject_id !== subjectVal) return false;
      return true;
    });
  }

  function resetTopicFilters() {
    if (topicSearchInput) topicSearchInput.value = '';
    if (topicFilterGrade) topicFilterGrade.value = '';
    if (topicFilterSubject) topicFilterSubject.value = '';
    renderTopicList();
  }

  function getFilteredTasks() {
    const query = (taskSearchInput?.value || '').trim().toLowerCase();
    const gradeVal = parseFormGrade(taskFilterGrade?.value);
    const topicVal = taskFilterTopic?.value ? Number(taskFilterTopic.value) : null;
    const statusVal = taskFilterStatus?.value || '';

    return tasks.filter(task => {
      if (query) {
        const titleStr = (task.title || '').toLowerCase();
        const condStr = (task.condition_latex || '').toLowerCase();
        if (!titleStr.includes(query) && !condStr.includes(query)) return false;
      }
      if (gradeVal !== null) {
        const taskGrade = task.grade ?? topics.find(t => t.id === task.topic_id)?.grade;
        if (taskGrade !== gradeVal) return false;
      }
      if (topicVal !== null && task.topic_id !== topicVal) return false;
      if (statusVal === 'published' && !task.is_published) return false;
      if (statusVal === 'draft' && task.is_published) return false;
      if (statusVal === 'no_solution' && (task.solution_latex || task.solution_image)) return false;
      if (statusVal === 'with_image' && !task.condition_image && !task.solution_image) return false;
      return true;
    });
  }

  function resetTaskFilters() {
    if (taskSearchInput) taskSearchInput.value = '';
    if (taskFilterGrade) taskFilterGrade.value = '';
    if (taskFilterTopic) taskFilterTopic.value = '';
    if (taskFilterStatus) taskFilterStatus.value = '';
    renderTaskList();
  }

  function renderTaskList() {
    // Список ещё не запрошен: на экране блок с кнопкой, рисовать нечего.
    if (!tasksLoaded) return;
    if (!tasks.length) {
      taskList.innerHTML = '<p class="admin-empty">Задач пока нет.</p>';
      if (taskFilterCount) taskFilterCount.textContent = '0 задач';
      return;
    }

    const filtered = sortTasks(getFilteredTasks());
    const isFiltered = Boolean((taskSearchInput?.value || '').trim() || taskFilterGrade?.value || taskFilterTopic?.value || taskFilterStatus?.value);

    if (taskFilterCount) {
      taskFilterCount.textContent = isFiltered
        ? `Найдено: ${filtered.length} из ${tasks.length}`
        : `Всего задач: ${tasks.length}`;
    }
    if (taskFilterReset) taskFilterReset.hidden = !isFiltered;

    if (!filtered.length) {
      taskList.innerHTML = `<p class="admin-empty">Ничего не найдено по фильтрам. <button class="text-button" type="button" id="empty-reset-btn">Сбросить фильтры</button></p>`;
      document.querySelector('#empty-reset-btn')?.addEventListener('click', resetTaskFilters);
      return;
    }

    taskList.innerHTML = filtered.map(task => {
      const topic = topics.find(item => item.id === task.topic_id);
      const grade = task.grade ?? topic?.grade;
      const siblings = siblingsOf(task.topic_id);
      const index = siblings.findIndex(item => item.id === task.id);
      const arrows = siblings.length > 1
        ? `<span class="admin-move">
            <button class="move-button" type="button" data-move="${task.id}" data-dir="up" ${index === 0 ? 'disabled' : ''} aria-label="Выше в теме">↑</button>
            <button class="move-button" type="button" data-move="${task.id}" data-dir="down" ${index === siblings.length - 1 ? 'disabled' : ''} aria-label="Ниже в теме">↓</button>
          </span>`
        : '';

      const tagBadges = (task.task_tags || []).map(tt => {
        const title = tt.tags?.title || tt.tags?.slug;
        return title ? `<span class="admin-status-badge info" style="background:#eef4ff;color:#1764ff;border:1px solid #c3d2ea">#${escapeHtml(title)}</span>` : '';
      }).join('');

      // Бейджи статусов и индикация черновиков / ошибок (4.4)
      const badges = [
        task.is_published
          ? '<span class="admin-status-badge published">✓ Опубликована</span>'
          : '<span class="admin-status-badge draft">🟡 Черновик</span>',
        !task.topic_id ? '<span class="admin-status-badge danger">Без темы</span>' : '',
        (!task.solution_latex && !task.solution_image) ? '<span class="admin-status-badge warning">Без решения</span>' : '',
        (task.condition_image || task.solution_image) ? `<span class="admin-status-badge info" title="${escapeHtml(task.condition_image || task.solution_image)}">🖼️ ${escapeHtml((task.condition_image || task.solution_image).split('/').pop())}</span>` : '',
        difficultyBadge(task.difficulty),
        tagBadges
      ].filter(Boolean).join('');

      const conditionSnippet = task.condition_latex ? task.condition_latex.slice(0, 110).replace(/\s+/g, ' ') : '';
      const sub = task.subtopic_id ? subtopics.find(s => s.id === task.subtopic_id) : null;

      return `<div class="admin-row">
        ${arrows}
        <div class="admin-row-main">
          <strong>№${task.position ?? 0} · ${escapeHtml(topic?.title || 'Без темы')} <span style="font-weight:600;opacity:0.6;font-size:12px;margin-left:4px;">#${task.id}</span></strong>
          <small>${escapeHtml(gradeText(grade))}${sub ? ` · ${escapeHtml(sub.code ? sub.code + ' ' : '')}${escapeHtml(sub.title)}` : ''}${conditionSnippet ? ` · <em>${escapeHtml(conditionSnippet)}</em>` : ''}</small>
          <div class="admin-badge-group">${badges}</div>
        </div>
        <button class="text-button" type="button" data-edit-task="${task.id}" title="Редактировать">Изменить</button>
        <button class="text-button" type="button" data-clone-task="${task.id}" title="Создать копию задачи в форме (4.2)">Клонировать</button>
        <button class="text-button danger" type="button" data-delete-task="${task.id}" title="Удалить">Удалить</button>
      </div>`;
    }).join('');
  }

  /* Ребалансировка задач темы 1..N: автосдвиг при вставке в середину или удалении */
  async function rebalanceTaskPositions(topicId, targetTaskId = null, desiredPosition = null) {
    if (!topicId) return;
    let siblings = taskIndex
      .filter(task => (task.topic_id ?? null) === (topicId ?? null))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id - b.id);

    if (targetTaskId != null && desiredPosition != null) {
      const existingIdx = siblings.findIndex(t => String(t.id) === String(targetTaskId));
      let targetItem;
      if (existingIdx >= 0) {
        targetItem = siblings.splice(existingIdx, 1)[0];
      } else {
        targetItem = { id: targetTaskId, topic_id: topicId, position: desiredPosition };
      }
      const insertIdx = Math.max(0, Math.min(desiredPosition - 1, siblings.length));
      siblings.splice(insertIdx, 0, targetItem);
    }

    const updates = siblings
      .map((item, index) => ({ item, position: index + 1 }))
      .filter(({ item, position }) => item.position !== position);

    for (const { item, position } of updates) {
      const { error } = await db.from('tasks').update({ position }).eq('id', item.id);
      if (!error) {
        item.position = position;
        const inIdx = taskIndex.find(t => String(t.id) === String(item.id));
        if (inIdx) inIdx.position = position;
        const inTasks = tasks.find(t => String(t.id) === String(item.id));
        if (inTasks) inTasks.position = position;
      }
    }
  }

  /* После перестановки перенумеровываем всю тему подряд: если у соседей
     позиции совпадали (а у старых задач это ноль), простой обмен значениями
     ничего бы не изменил. */
  async function moveTask(taskId, direction) {
    const task = taskIndex.find(item => String(item.id) === String(taskId));
    if (!task) return;
    const siblings = [...siblingsOf(task.topic_id)];
    const from = siblings.findIndex(item => item.id === task.id);
    const to = direction === 'up' ? from - 1 : from + 1;
    if (to < 0 || to >= siblings.length) return;
    siblings.splice(to, 0, siblings.splice(from, 1)[0]);

    const updates = siblings
      .map((item, index) => ({ item, position: index + 1 }))
      .filter(({ item, position }) => item.position !== position);
    for (const { item, position } of updates) {
      const { error } = await db.from('tasks').update({ position }).eq('id', item.id);
      if (error) { taskSuccess.textContent = 'Ошибка: ' + error.message; return; }
    }
    taskSuccess.textContent = 'Порядок изменён.';
    await refreshTasks();
  }

  taskForm.addEventListener('submit', async event => {
    event.preventDefault();
    taskSuccess.textContent = '';
    const form = new FormData(taskForm);
    const topicId = form.get('topic_id') ? Number(form.get('topic_id')) : null;
    const taskPos = nextPosition(topicId, form.get('position'));
    const defaultTitle = editingTaskId
      ? (taskIndex.find(t => t.id === editingTaskId)?.title || `Задача №${taskPos}`)
      : `Задача №${taskPos}`;
    const payload = sanitizeTaskPayload({
      title: form.get('title')?.trim() || defaultTitle,
      title_lv: form.get('title_lv')?.trim() || null,
      condition_latex: conditionInput.value.trim(),
      condition_latex_lv: conditionInputLv?.value.trim() || null,
      answer_latex: answerInput.value.trim() || null,
      answer_latex_lv: answerInputLv?.value.trim() || null,
      hint_latex: hintInput?.value.trim() || null,
      hint_latex_lv: hintInputLv?.value.trim() || null,
      solution_latex: solutionInput.value.trim() || null,
      solution_latex_lv: solutionInputLv?.value.trim() || null,
      condition_image: images.condition.current,
      solution_image: images.solution.current,
      difficulty: form.get('difficulty'),
      position: taskPos,
      grade: parseFormGrade(form.get('grade')),
      topic_id: topicId,
      subtopic_id: form.get('subtopic_id') ? Number(form.get('subtopic_id')) : null,
      is_published: form.get('is_published') === 'on'
    });
    let savedTaskId = editingTaskId;
    if (editingTaskId) {
      const { error } = await db.from('tasks').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingTaskId);
      if (error) { taskSuccess.textContent = 'Ошибка: ' + error.message; return; }
    } else {
      const { data: inserted, error } = await db.from('tasks').insert(payload).select('id').maybeSingle();
      if (error) { taskSuccess.textContent = 'Ошибка: ' + error.message; return; }
      savedTaskId = inserted?.id;
      if (savedTaskId) {
        taskIndex.push({ id: savedTaskId, topic_id: payload.topic_id ?? null, position: payload.position });
      }
    }

    // Автосдвиг задач внутри темы при вставке в середину
    if (savedTaskId && topicId) {
      await rebalanceTaskPositions(topicId, savedTaskId, taskPos);
    }

    // Синхронизируем кросс-теги в task_tags
    if (savedTaskId && tagsReady) {
      try {
        await db.from('task_tags').delete().eq('task_id', savedTaskId);
        const slugs = getSelectedTagSlugs();
        if (slugs.length) {
          const tagRows = allTags.filter(t => slugs.includes(t.slug));
          const inserts = tagRows.map(t => ({ task_id: savedTaskId, tag_id: t.id }));
          if (inserts.length) {
            await db.from('task_tags').insert(inserts);
          }
        }
      } catch (tagErr) {
        console.warn('Ошибка сохранения тегов:', tagErr.message);
      }
    }
    // Сохранились — прежние файлы больше не нужны.
    for (const kind of ['condition', 'solution']) {
      const { saved, current } = images[kind];
      if (saved && saved !== current) await removeFile(saved);
      images[kind].saved = current;
    }
    taskSuccess.textContent = editingTaskId ? 'Задача сохранена.' : 'Задача добавлена.';
    taskForm.reset();
    setTaskMode(null);
    await refreshTasks();
  });

  document.querySelector('#task-cancel').addEventListener('click', async () => {
    await discardPendingImages();
    taskForm.reset();
    setTaskMode(null);
  });

  taskList.addEventListener('click', async event => {
    const move = event.target.closest('[data-move]');
    if (move) { await moveTask(move.dataset.move, move.dataset.dir); return; }
    const editId = event.target.closest('[data-edit-task]')?.dataset.editTask;
    if (editId) {
      const full = await fetchFullRow('tasks', editId);
      if (!full) { taskSuccess.textContent = 'Не удалось загрузить задачу для правки.'; return; }
      setTaskMode(full);
      return;
    }

    // 4.2: Клонирование задачи
    const cloneId = event.target.closest('[data-clone-task]')?.dataset.cloneTask;
    if (cloneId) {
      const source = await fetchFullRow('tasks', cloneId);
      if (!source) { taskSuccess.textContent = 'Не удалось загрузить задачу для копирования.'; return; }
      editingTaskId = null; // Гарантирует создание новой задачи при отправке
      if (taskForm.elements.title) taskForm.elements.title.value = source.title ? `[Копия] ${source.title}` : '';
      if (taskForm.elements.title_lv) taskForm.elements.title_lv.value = source.title_lv ? `[Kopija] ${source.title_lv}` : '';
      taskForm.elements.topic_id.value = source.topic_id ? String(source.topic_id) : '';
      taskForm.elements.grade.value = toAdminGradeVal(source.grade);
      taskForm.elements.difficulty.value = source.difficulty || 'Средний';
      taskForm.elements.position.value = nextPosition(source.topic_id, null);
      conditionInput.value = source.condition_latex || '';
      if (conditionInputLv) conditionInputLv.value = source.condition_latex_lv || '';
      answerInput.value = source.answer_latex || '';
      if (answerInputLv) answerInputLv.value = source.answer_latex_lv || '';
      solutionInput.value = source.solution_latex || '';
      if (solutionInputLv) solutionInputLv.value = source.solution_latex_lv || '';
      taskForm.elements.is_published.checked = false; // Копия по умолчанию создаётся черновиком
      setImages(source);
      updatePreviews();
      if (tagsReady) {
        db.from('task_tags').select('tags(slug)').eq('task_id', cloneId)
          .then(({ data: tagLinks }) => {
            const slugs = (tagLinks || []).map(l => l.tags?.slug).filter(Boolean);
            setSelectedTagSlugs(slugs);
          })
          .catch(() => setSelectedTagSlugs([]));
      } else {
        setSelectedTagSlugs([]);
      }
      document.querySelector('#task-form-title').textContent = `Клонирование: задача №${source.position ?? source.id}`;
      document.querySelector('#task-submit').textContent = 'Добавить задачу (сохранить копию)';
      document.querySelector('#task-cancel').hidden = false;
      taskSuccess.textContent = '✨ Черновик копии задачи создан. Измените параметры и нажмите «Добавить задачу».';
      taskForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const deleteId = event.target.closest('[data-delete-task]')?.dataset.deleteTask;
    if (!deleteId) return;
    const task = tasks.find(item => String(item.id) === deleteId);
    const label = task ? (task.title ? `«${task.title}»` : `задачу №${task.position ?? task.id}`) : 'выбранную задачу';
    if (!confirm(`Удалить ${label}? Это действие необратимо.`)) return;
    const { error } = await db.from('tasks').delete().eq('id', deleteId);
    if (error) { taskSuccess.textContent = 'Ошибка: ' + error.message; return; }
    // Задачи нет — её чертежам в бакете делать нечего.
    await removeFile(task.condition_image);
    await removeFile(task.solution_image);
    if (task?.topic_id) {
      taskIndex = taskIndex.filter(t => String(t.id) !== deleteId);
      await rebalanceTaskPositions(task.topic_id);
    }
    if (String(editingTaskId) === deleteId) { taskForm.reset(); setTaskMode(null); }
    taskSuccess.textContent = 'Задача удалена.';
    await refreshTasks();
  });

  /* ── Фильтры и сортировка тем ─────────────────────────────────────
     Со Skola2030 тем уже под три десятка, и дальше их будет больше:
     листать плоский список станет невозможно. */
  /* Любой ввод в поиск или фильтр сам раскрывает список: искать вслепую
     в свёрнутом списке бессмысленно. */
  const showTopicsThenRender = () => { if (!topicsShown) setTopicsShown(true); else renderTopicList(); };
  [topicSearchInput, topicFilterGrade, topicFilterSubject, topicFilterSort].forEach(el => {
    el?.addEventListener('input', showTopicsThenRender);
    el?.addEventListener('change', showTopicsThenRender);
  });
  topicFilterReset?.addEventListener('click', resetTopicFilters);
  [taskFilterSort, topicFilterSort].forEach(el => el?.addEventListener('change', saveSort));

  /* ── Фильтры задач (4.1) ─────────────────────────────────────────── */
  [taskSearchInput, taskFilterGrade, taskFilterTopic, taskFilterStatus, taskFilterSort].forEach(el => {
    el?.addEventListener('input', renderTaskList);
    el?.addEventListener('change', renderTaskList);
  });
  taskFilterReset?.addEventListener('click', resetTaskFilters);

  /* ── Массовый импорт и экспорт задач (4.3) ────────────────────────── */
  let bulkMode = 'export'; // 'export' | 'import'

  async function openBulkDialog(mode) {
    if (!bulkDialog) return;
    bulkMode = mode;
    if (bulkDialogStatus) {
      bulkDialogStatus.hidden = true;
      bulkDialogStatus.textContent = '';
    }
    if (mode === 'export_csv') {
      if (!tasksLoaded) await loadTasks();
      const filtered = getFilteredTasks();
      const ids = filtered.map(t => t.id);
      let fullById = {};
      if (ids.length) {
        const { data, error } = await db.from('tasks').select('*').in('id', ids);
        if (error) {
          bulkDialogTitle.textContent = 'Экспорт в Excel / CSV';
          bulkDialogDesc.textContent = 'Не удалось получить полные тексты задач: ' + error.message;
          bulkDialogTextarea.value = '';
          bulkDialogSubmit.textContent = 'Закрыть';
          bulkDialog?.showModal();
          return;
        }
        fullById = Object.fromEntries((data || []).map(row => [row.id, row]));
      }
      const fullTasks = filtered.map(light => fullById[light.id] || light);
      const csvContent = window.MathTasksLib?.exportTasksToCsv ? window.MathTasksLib.exportTasksToCsv(fullTasks, topics, subtopics) : '';
      bulkDialogTitle.textContent = `Экспорт в Excel / CSV (${fullTasks.length} шт.)`;
      bulkDialogDesc.innerHTML = 'Экспорт текущих отфильтрованных задач в формате CSV (с меткой UTF-8 BOM). Файл можно скачать и сразу открыть в Excel или Google Таблицах.';
      bulkDialogTextarea.value = csvContent;
      bulkDialogSubmit.textContent = 'Скачать tasks-export.csv';
      bulkDialogCopy.hidden = false;
      if (bulkDialogTagList) bulkDialogTagList.hidden = true;
    } else if (mode === 'export') {
      /* Списки в панели укорочены до заголовков, поэтому перед выгрузкой
         добираем полные строки: иначе резервная копия молча вышла бы
         без условий, ответов и решений. */
      if (!tasksLoaded) await loadTasks();
      const filtered = getFilteredTasks();
      const ids = filtered.map(t => t.id);
      let fullById = {};
      if (ids.length) {
        const { data, error } = await db.from('tasks').select('*').in('id', ids);
        if (error) {
          bulkDialogTitle.textContent = 'Экспорт задач';
          bulkDialogDesc.textContent = 'Не удалось получить полные тексты задач: ' + error.message;
          bulkDialogTextarea.value = '';
          bulkDialogSubmit.textContent = 'Закрыть';
          bulkDialog?.showModal();
          return;
        }
        fullById = Object.fromEntries((data || []).map(row => [row.id, row]));
      }
      const exportData = filtered.map(light => {
        const task = fullById[light.id] || light;
        const topic = topics.find(t => t.id === task.topic_id);
        const tagSlugs = (task.task_tags || []).map(tt => tt.tags?.slug).filter(Boolean);
        const obj = {
          title: task.title,
          title_lv: task.title_lv || null,
          condition_latex: task.condition_latex,
          condition_latex_lv: task.condition_latex_lv || null,
          answer_latex: task.answer_latex || null,
          answer_latex_lv: task.answer_latex_lv || null,
          solution_latex: task.solution_latex || null,
          solution_latex_lv: task.solution_latex_lv || null,
          hint_latex: task.hint_latex || null,
          condition_image: task.condition_image || null,
          solution_image: task.solution_image || null,
          hint_latex_lv: task.hint_latex_lv || null,
          difficulty: task.difficulty || 'Средний',
          grade: task.grade ?? topic?.grade ?? null,
          topic_title: topic?.title || null,
          topic_title_lv: topic?.title_lv || null,
          position: task.position ?? 0,
          is_published: Boolean(task.is_published)
        };
        if (tagSlugs.length) {
          obj.tags = tagSlugs;
        }
        return obj;
      });
      bulkDialogTitle.textContent = `Экспорт задач (${exportData.length} шт.)`;
      bulkDialogDesc.innerHTML = 'Экспорт текущего списка задач в формате JSON. Можно скопировать текст или сохранить файл резервной копии.';
      bulkDialogTextarea.value = JSON.stringify(exportData, null, 2);
      bulkDialogSubmit.textContent = 'Скачать tasks-export.json';
      bulkDialogCopy.hidden = false;
      if (bulkDialogTagList) bulkDialogTagList.hidden = true;
    } else {
      bulkDialogTitle.textContent = 'Массовый импорт задач (JSON / CSV / Таблица)';
      bulkDialogDesc.innerHTML = 'Загрузите файл <code>.json</code>, <code>.csv</code>, <code>.tsv</code> или вставьте скопированную таблицу из Excel / Google Таблиц прямо в поле ниже. Формат определится автоматически. Недостающие темы и подтемы создаются автоматически.';
      bulkDialogTextarea.value = '';
      bulkDialogTextarea.placeholder = 'Вставьте сюда JSON, CSV или скопированные из Google Таблиц / Excel ячейки...';
      const vocab = (allTags.length ? allTags : (window.MathTasksLib?.CROSS_TAGS || []));
      if (bulkDialogTagList) {
        bulkDialogTagList.innerHTML = vocab.length
          ? '<summary>Допустимые кросс-теги (' + vocab.length + ') — не больше трёх на задачу</summary><div class="bulk-tag-vocab">' +
            vocab.map(t => '<code>' + escapeHtml(t.slug) + '</code> <span>' + escapeHtml(t.title_lv || t.title || '') + '</span>').join('') + '</div>'
          : '<summary>Словарь тегов недоступен</summary><div class="bulk-tag-vocab">Выполните миграцию 010_cross_tags.sql.</div>';
        bulkDialogTagList.hidden = false;
      }
      bulkDialogSubmit.textContent = 'Импортировать в базу';
      bulkDialogCopy.hidden = true;
    }
    if (bulkDialog && !bulkDialog.open) {
      bulkDialog.showModal();
    }
  }

  /* ── Умное сопоставление разделов (Subject Resolver) ───────────── */
  function resolveSubject(slugOrTitle, subjectsList) {
    if (window.MathTasksLib?.resolveSubject) {
      return window.MathTasksLib.resolveSubject(slugOrTitle, subjectsList);
    }
    if (!slugOrTitle || !Array.isArray(subjectsList) || !subjectsList.length) return null;
    const raw = String(slugOrTitle).trim().toLowerCase();
    const clean = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9а-яё]/gi, '');
    if (!clean) return null;

    const directSlug = subjectsList.find(s => s.slug?.toLowerCase() === raw);
    if (directSlug) return directSlug;

    const directTitle = subjectsList.find(s => s.title?.toLowerCase() === raw || s.title_lv?.toLowerCase() === raw);
    if (directTitle) return directTitle;

    const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9а-яё]/gi, '');
    const normMatch = subjectsList.find(s => norm(s.slug) === clean || norm(s.title) === clean || norm(s.title_lv) === clean);
    if (normMatch) return normMatch;

    const ALIAS_RULES = [
      { keys: ['algebra', 'skaitli', 'chisla', 'алгебр', 'числа'], slug: 'algebra' },
      { keys: ['geometr', 'geometry', 'figuras', 'геометр', 'фигур'], slug: 'geometry' },
      { keys: ['planimetr', 'планиметр'], slug: 'planimetrija' },
      { keys: ['stereometr', 'стереометр'], slug: 'stereometrija' },
      { keys: ['trigonometr', 'тригонометр'], slug: 'trigonometrija' },
      { keys: ['funkcij', 'function', 'функци'], slug: 'funkcijas' },
      { keys: ['statist', 'статист'], slug: 'statistics' },
      { keys: ['kombinatorik', 'varbutib', 'комбинаторик', 'вероятност'], slug: 'kombinatorika-un-varbutibas' },
      { keys: ['analiz', 'calculus', 'анализ'], slug: 'matematiskais-analizs' }
    ];
    for (const rule of ALIAS_RULES) {
      if (rule.keys.some(k => clean.includes(k) || raw.includes(k))) {
        const found = subjectsList.find(s => s.slug === rule.slug);
        if (found) return found;
      }
    }
    return null;
  }

  /* ── Парсер JSON с поддержкой тем, подтем и задач ────────────── */
  function parseMultiTopicJson(raw) {
    let parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      if (Array.isArray(parsed.topics)) {
        parsed = parsed.topics;
      } else if (Array.isArray(parsed.tasks)) {
        parsed = parsed.tasks;
      } else {
        parsed = [parsed];
      }
    }

    const normalizedTopics = [];
    const normalizedSubtopics = [];
    const normalizedTasks = [];

    for (const item of parsed) {
      if (!item) continue;
      // Вариант 1: Объект темы со вложенным списком подтем subtopics: [...]
      if (Array.isArray(item.subtopics)) {
        const topicInfo = {
          title: String(item.topic_title || item.title || item.name || '').trim(),
          title_lv: item.topic_title_lv || item.title_lv ? String(item.topic_title_lv || item.title_lv).trim() : null,
          grade: parseFormGrade(item.grade),
          subject_id: item.subject_id ? Number(item.subject_id) : null,
          subject_slug: item.subject_slug ? String(item.subject_slug).trim() : null,
          subject_title: item.subject_title ? String(item.subject_title).trim() : null,
          description: item.description ? String(item.description).trim() : null,
          description_lv: item.description_lv ? String(item.description_lv).trim() : null
        };
        if (topicInfo.title) {
          normalizedTopics.push(topicInfo);
        }

        for (const sub of item.subtopics) {
          if (!sub) continue;
          const subInfo = {
            topic_title: topicInfo.title,
            topic_title_lv: topicInfo.title_lv,
            title: String(sub.title || sub.name || sub.subtopic_title || '').trim(),
            title_lv: sub.title_lv || sub.subtopic_title_lv ? String(sub.title_lv || sub.subtopic_title_lv).trim() : null,
            code: sub.code || sub.subtopic_code ? String(sub.code || sub.subtopic_code).trim() : null,
            position: Number(sub.position) || null
          };
          if (subInfo.title || subInfo.code) {
            normalizedSubtopics.push(subInfo);
          }
          if (Array.isArray(sub.tasks)) {
            for (const t of sub.tasks) {
              if (!t) continue;
              normalizedTasks.push({
                ...t,
                topic_title: t.topic_title || topicInfo.title,
                topic_title_lv: t.topic_title_lv || topicInfo.title_lv,
                subtopic_title: t.subtopic_title || subInfo.title,
                subtopic_title_lv: t.subtopic_title_lv || subInfo.title_lv,
                subtopic_code: t.subtopic_code || subInfo.code,
                grade: t.grade !== undefined ? parseFormGrade(t.grade) : topicInfo.grade,
                subject_id: t.subject_id ? Number(t.subject_id) : topicInfo.subject_id
              });
            }
          }
        }

        if (Array.isArray(item.tasks)) {
          for (const t of item.tasks) {
            if (!t) continue;
            const subTitle = String(t.subtopic_title || t.subtopic || '').trim();
            const subCode = String(t.subtopic_code || '').trim();
            if (subTitle || subCode) {
              normalizedSubtopics.push({
                topic_title: topicInfo.title,
                topic_title_lv: topicInfo.title_lv,
                title: subTitle,
                title_lv: t.subtopic_title_lv ? String(t.subtopic_title_lv).trim() : null,
                code: subCode || null
              });
            }
            normalizedTasks.push({
              ...t,
              topic_title: t.topic_title || topicInfo.title,
              topic_title_lv: t.topic_title_lv || topicInfo.title_lv,
              grade: t.grade !== undefined ? parseFormGrade(t.grade) : topicInfo.grade,
              subject_id: t.subject_id ? Number(t.subject_id) : topicInfo.subject_id
            });
          }
        }
      } else if (Array.isArray(item.tasks)) {
        // Вариант 2: Объект темы со вложенным списком задач tasks: [...]
        const topicInfo = {
          title: String(item.topic_title || item.title || item.name || '').trim(),
          title_lv: item.topic_title_lv || item.title_lv ? String(item.topic_title_lv || item.title_lv).trim() : null,
          grade: parseFormGrade(item.grade),
          subject_id: item.subject_id ? Number(item.subject_id) : null,
          subject_slug: item.subject_slug ? String(item.subject_slug).trim() : null,
          subject_title: item.subject_title ? String(item.subject_title).trim() : null,
          description: item.description ? String(item.description).trim() : null,
          description_lv: item.description_lv ? String(item.description_lv).trim() : null
        };
        if (topicInfo.title) {
          normalizedTopics.push(topicInfo);
        }
        for (const t of item.tasks) {
          if (!t) continue;
          const subTitle = String(t.subtopic_title || t.subtopic || '').trim();
          const subCode = String(t.subtopic_code || '').trim();
          if (subTitle || subCode) {
            normalizedSubtopics.push({
              topic_title: topicInfo.title,
              topic_title_lv: topicInfo.title_lv,
              title: subTitle,
              title_lv: t.subtopic_title_lv ? String(t.subtopic_title_lv).trim() : null,
              code: subCode || null
            });
          }
          normalizedTasks.push({
            ...t,
            topic_title: t.topic_title || topicInfo.title,
            topic_title_lv: t.topic_title_lv || topicInfo.title_lv,
            grade: t.grade !== undefined ? parseFormGrade(t.grade) : topicInfo.grade,
            subject_id: t.subject_id ? Number(t.subject_id) : topicInfo.subject_id
          });
        }
      } else {
        // Вариант 3: Плоская задача со свойством topic_title или topic
        const t = item;
        const topicTitle = String(t.topic_title || t.topic || '').trim();
        if (topicTitle) {
          normalizedTopics.push({
            title: topicTitle,
            title_lv: t.topic_title_lv ? String(t.topic_title_lv).trim() : null,
            grade: parseFormGrade(t.grade),
            subject_id: t.subject_id ? Number(t.subject_id) : null,
            subject_slug: t.subject_slug ? String(t.subject_slug).trim() : null,
            subject_title: t.subject_title ? String(t.subject_title).trim() : null,
            description: null,
            description_lv: null
          });
        }
        const subTitle = String(t.subtopic_title || t.subtopic || '').trim();
        const subCode = String(t.subtopic_code || '').trim();
        if (subTitle || subCode) {
          normalizedSubtopics.push({
            topic_title: topicTitle,
            topic_title_lv: t.topic_title_lv ? String(t.topic_title_lv).trim() : null,
            title: subTitle,
            title_lv: t.subtopic_title_lv ? String(t.subtopic_title_lv).trim() : null,
            code: subCode || null
          });
        }
        normalizedTasks.push(t);
      }
    }

    // Уникальные темы по названию
    const uniqueTopics = [];
    const seenTopics = new Set();
    for (const top of normalizedTopics) {
      const key = top.title.toLowerCase();
      if (key && !seenTopics.has(key)) {
        seenTopics.add(key);
        uniqueTopics.push(top);
      }
    }

    // Уникальные подтемы по коду или (тема + название)
    const uniqueSubtopics = [];
    const seenSubtopics = new Set();
    for (const sub of normalizedSubtopics) {
      const key = (sub.code ? `code:${sub.code}` : `${sub.topic_title}:::${sub.title}`).toLowerCase();
      if ((sub.title || sub.code) && !seenSubtopics.has(key)) {
        seenSubtopics.add(key);
        uniqueSubtopics.push(sub);
      }
    }

    return { uniqueTopics, uniqueSubtopics, tasks: normalizedTasks };
  }

  btnExportTasks?.addEventListener('click', () => { openBulkDialog('export').catch(e => console.error('экспорт:', e)); });
  btnExportCsv?.addEventListener('click', () => { openBulkDialog('export_csv').catch(e => console.error('экспорт csv:', e)); });
  btnImportTasks?.addEventListener('click', () => { openBulkDialog('import').catch(e => console.error('импорт:', e)); });

  /* Автоматическая перенумерация задач (1..N) без пропусков */
  async function handleRenumberTasks() {
    const computeFn = window.MathTasksLib?.computeTaskRenumbering;
    if (!computeFn) return;

    if (!tasksLoaded) {
      if (btnRenumberTasks) {
        btnRenumberTasks.disabled = true;
        btnRenumberTasks.textContent = '⏳ Загрузка задач...';
      }
      try {
        await loadTasks();
      } finally {
        if (btnRenumberTasks) {
          btnRenumberTasks.disabled = false;
          btnRenumberTasks.textContent = '🔢 Перенумеровать задачи';
        }
      }
    }

    if (!tasks || !tasks.length) {
      alert('Список задач пуст.');
      return;
    }

    const selectedTopicId = Number(taskFilterTopic?.value) || null;
    const targetTopicIds = selectedTopicId ? [selectedTopicId] : [...new Set(tasks.map(t => t.topic_id).filter(Boolean))];

    const itemsToUpdate = [];
    for (const tId of targetTopicIds) {
      const topicTasks = tasks.filter(t => t.topic_id === tId);
      const plan = computeFn(topicTasks, subtopics);
      for (const item of plan) {
        if (item.changed) itemsToUpdate.push(item);
      }
    }

    if (!itemsToUpdate.length) {
      alert('Все задачи уже упорядочены подряд (1..N), изменений не требуется.');
      return;
    }

    const topicObj = selectedTopicId ? topics.find(t => t.id === selectedTopicId) : null;
    const scopeMsg = topicObj
      ? `задачи темы «${topicObj.title}»`
      : 'задачи во всех темах';

    if (!confirm(`Перенумеровать ${scopeMsg} подряд (1..N)? Будут обновлены позиции у ${itemsToUpdate.length} задач.`)) {
      return;
    }

    if (btnRenumberTasks) {
      btnRenumberTasks.disabled = true;
      btnRenumberTasks.textContent = '⏳ Перенумерация...';
    }

    try {
      for (const item of itemsToUpdate) {
        const { error } = await db.from('tasks').update({ position: item.newPosition }).eq('id', item.id);
        if (error) {
          console.warn('Ошибка обновления задачи:', item.id, error.message);
        } else {
          item.task.position = item.newPosition;
          const inTasks = tasks.find(t => t.id === item.id);
          if (inTasks) inTasks.position = item.newPosition;
          const inIndex = taskIndex.find(t => t.id === item.id);
          if (inIndex) inIndex.position = item.newPosition;
        }
      }
      taskSuccess.textContent = `Успешно перенумеровано задач: ${itemsToUpdate.length}.`;
      renderTaskList();
    } catch (err) {
      taskSuccess.textContent = 'Ошибка перенумерации задач: ' + err.message;
    } finally {
      if (btnRenumberTasks) {
        btnRenumberTasks.disabled = false;
        btnRenumberTasks.textContent = '🔢 Перенумеровать задачи';
      }
    }
  }

  btnRenumberTasks?.addEventListener('click', handleRenumberTasks);
  bulkDialogClose?.addEventListener('click', () => bulkDialog?.close());
  bulkDialogCancel?.addEventListener('click', () => bulkDialog?.close());

  // Выбор файла .json, .csv или .tsv с диска
  const handleBulkFile = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target.result;
      openBulkDialog('import');
      bulkDialogTextarea.value = content;
      try {
        const parseFn = window.MathTasksLib?.parseTasksImport || parseMultiTopicJson;
        const result = parseFn(content);
        const isCsv = result.format === 'csv';
        const { uniqueTopics, uniqueSubtopics, tasks: parsedTasks } = result;
        bulkDialogStatus.className = 'bulk-dialog-status success';
        bulkDialogStatus.innerHTML = `📁 Файл <strong>${escapeHtml(file.name)}</strong> (${isCsv ? 'Таблица CSV/TSV' : 'JSON'}) загружен!<br>` +
          `Обнаружено: тем: <strong>${uniqueTopics.length}</strong>, подтем: <strong>${uniqueSubtopics.length}</strong>, задач: <strong>${parsedTasks.length}</strong>.<br>` +
          `Нажмите <strong>«Выполнить импорт»</strong>, чтобы сохранить данные в Supabase.`;
        bulkDialogStatus.hidden = false;
      } catch (err) {
        bulkDialogStatus.className = 'bulk-dialog-status error';
        bulkDialogStatus.textContent = 'Ошибка синтаксиса в выбранном файле: ' + err.message;
        bulkDialogStatus.hidden = false;
      }
    };
    reader.readAsText(file, 'utf-8');
    event.target.value = '';
  };

  bulkFileInput?.addEventListener('change', handleBulkFile);
  bulkDialogFileInput?.addEventListener('change', handleBulkFile);
  btnUploadFileTasks?.addEventListener('click', () => bulkFileInput?.click());
  bulkDialogPickFileBtn?.addEventListener('click', () => {
    if (bulkDialogFileInput) bulkDialogFileInput.click();
    else if (bulkFileInput) bulkFileInput.click();
  });

  // 📚 Руководство по формулам KaTeX / LaTeX
  btnToggleMathGuide?.addEventListener('click', () => {
    if (!mathGuideCard) return;
    mathGuideCard.hidden = !mathGuideCard.hidden;
    if (!mathGuideCard.hidden && typeof window.renderMathInElement === 'function') {
      window.renderMathInElement(mathGuideCard, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    }
  });

  btnCloseMathGuide?.addEventListener('click', () => {
    if (mathGuideCard) mathGuideCard.hidden = true;
  });

  // Клик по любому образцу кода в руководстве вставляет его в поле условия
  mathGuideCard?.addEventListener('click', e => {
    const codeEl = e.target.closest('code');
    if (!codeEl) return;
    const snippet = codeEl.textContent.trim();
    if (!snippet) return;
    if (conditionInput) {
      const start = conditionInput.selectionStart ?? conditionInput.value.length;
      const end = conditionInput.selectionEnd ?? conditionInput.value.length;
      const val = conditionInput.value;
      const needSpaceBefore = start > 0 && !val.slice(0, start).endsWith(' ') && !val.slice(0, start).endsWith('\n');
      const needSpaceAfter = end < val.length && !val.slice(end).startsWith(' ') && !val.slice(end).startsWith('\n');
      const insertText = (needSpaceBefore ? ' ' : '') + snippet + (needSpaceAfter ? ' ' : ' ');
      conditionInput.value = val.slice(0, start) + insertText + val.slice(end);
      const newPos = start + insertText.length;
      conditionInput.focus();
      conditionInput.setSelectionRange(newPos, newPos);
      updatePreviews();
    }
  });

  // 📄 Карточка образца иерархического JSON рядом с загрузкой файлов
  btnToggleSampleJson?.addEventListener('click', () => {
    if (!jsonSampleCard) return;
    jsonSampleCard.hidden = !jsonSampleCard.hidden;
  });

  btnCloseSampleJson?.addEventListener('click', () => {
    if (jsonSampleCard) jsonSampleCard.hidden = true;
  });

  btnCopySampleJson?.addEventListener('click', async () => {
    const text = jsonSampleCode?.textContent?.trim() || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    const orig = btnCopySampleJson.textContent;
    btnCopySampleJson.textContent = '✓ Скопировано!';
    setTimeout(() => { btnCopySampleJson.textContent = orig; }, 2000);
  });

  btnInsertSampleToDialog?.addEventListener('click', () => {
    const text = jsonSampleCode?.textContent?.trim() || '';
    openBulkDialog('import');
    bulkDialogTextarea.value = text;
    bulkDialogStatus.className = 'bulk-dialog-status success';
    bulkDialogStatus.innerHTML = '📋 Образец иерархического формата JSON вставлен в окно! Нажмите «Импортировать в базу» для добавления.';
    bulkDialogStatus.hidden = false;
  });

  // Шаблон формата с несколькими темами и подтемами
  bulkDialogTemplateBtn?.addEventListener('click', () => {
    const sampleData = [
      {
        "topic_title": "Квадратные уравнения",
        "topic_title_lv": "Kvadrātvienādojumi",
        "grade": 8,
        "subtopics": [
          {
            "title": "Неполные квадратные уравнения",
            "title_lv": "Nepilni kvadrātvienādojumi",
            "code": "8.1.1",
            "tasks": [
              {
                "condition_latex": "Решите уравнение $x^2 - 9 = 0$.",
                "condition_latex_lv": "Atrisiniet vienādojumu $x^2 - 9 = 0$.",
                "answer_latex": "$x = \\pm 3$",
                "answer_latex_lv": "$x = \\pm 3$",
                "solution_latex": "Разложим на множители разность квадратов:\n$$(x - 3)(x + 3) = 0$$\nОткуда $x_1 = 3,\\; x_2 = -3$.",
                "solution_latex_lv": "Sadalām reizinātājos kvadrātu starpību:\n$$(x - 3)(x + 3) = 0$$\nTātad $x_1 = 3,\\; x_2 = -3$.",
                "tags": ["vienadojumi", "algebriskie-parveidojumi"],
                "difficulty": "Лёгкий",
                "is_published": true
              }
            ]
          },
          {
            "title": "Полные квадратные уравнения",
            "title_lv": "Pilni kvadrātvienādojumi",
            "code": "8.1.2",
            "tasks": [
              {
                "condition_latex": "Решите уравнение $x^2 - 5x + 6 = 0$.",
                "condition_latex_lv": "Atrisiniet vienādojumu $x^2 - 5x + 6 = 0$.",
                "answer_latex": "$x_1 = 2,\\; x_2 = 3$",
                "answer_latex_lv": "$x_1 = 2,\\; x_2 = 3$",
                "solution_latex": "По формуле корней через дискриминант:\n$$D = (-5)^2 - 4 \\cdot 1 \\cdot 6 = 25 - 24 = 1$$\n$$x = \\frac{5 \\pm \\sqrt{1}}{2} \\implies x_1 = 2,\\; x_2 = 3$$",
                "solution_latex_lv": "Pēc sakņu formulas ar diskriminantu:\n$$D = (-5)^2 - 4 \\cdot 1 \\cdot 6 = 25 - 24 = 1$$\n$$x = \\frac{5 \\pm \\sqrt{1}}{2} \\implies x_1 = 2,\\; x_2 = 3$$",
                "tags": ["vienadojumi"],
                "difficulty": "Средний",
                "is_published": true
              }
            ]
          }
        ]
      },
      {
        "topic_title": "Теорема Пифагора",
        "topic_title_lv": "Pitagora teorēma",
        "grade": 8,
        "tasks": [
          {
            "subtopic_title": "Прямоугольный треугольник",
            "subtopic_code": "8.2.1",
            "condition_latex": "В прямоугольном треугольнике катеты равны $a = 3\\text{ см}$ и $b = 4\\text{ см}$. Найдите длину гипотенузы $c$.",
            "condition_latex_lv": "Taisnleņķa trijstūrī katetes ir $a = 3\\text{ cm}$ un $b = 4\\text{ cm}$. Aprēķiniet hipotenūzas $c$ garumu.",
            "answer_latex": "$c = 5\\text{ см}$",
            "answer_latex_lv": "$c = 5\\text{ cm}$",
            "solution_latex": "По теореме Пифагора:\n$$c = \\sqrt{a^2 + b^2} = \\sqrt{3^2 + 4^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5\\text{ см}$$",
            "solution_latex_lv": "Pēc Pitagora teorēmas:\n$$c = \\sqrt{a^2 + b^2} = \\sqrt{3^2 + 4^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5\\text{ cm}$$",
            "tags": ["planimetrija", "merijumi"],
            "difficulty": "Лёгкий",
            "is_published": true
          }
        ]
      }
    ];

    openBulkDialog('import');
    bulkDialogTextarea.value = JSON.stringify(sampleData, null, 2);
    const { uniqueTopics, uniqueSubtopics, tasks: parsedTasks } = parseMultiTopicJson(bulkDialogTextarea.value);
    bulkDialogStatus.className = 'bulk-dialog-status';
    bulkDialogStatus.innerHTML = `📋 Образец формата вставлен (тем: <strong>${uniqueTopics.length}</strong>, подтем: <strong>${uniqueSubtopics.length}</strong>, задач: <strong>${parsedTasks.length}</strong>). Нажмите «Импортировать в базу».`;
    bulkDialogStatus.hidden = false;
  });

  // Подсчёт тем, подтем и задач при вводе в поле (JSON / CSV / TSV)
  bulkDialogTextarea?.addEventListener('input', () => {
    if (bulkMode !== 'import') return;
    const val = bulkDialogTextarea.value.trim();
    if (!val) {
      bulkDialogStatus.hidden = true;
      return;
    }
    try {
      const parseFn = window.MathTasksLib?.parseTasksImport || parseMultiTopicJson;
      const result = parseFn(val);
      const { uniqueTopics, uniqueSubtopics, tasks: parsedTasks, format } = result;
      if (parsedTasks.length > 0 || uniqueTopics.length > 0) {
        bulkDialogStatus.className = 'bulk-dialog-status';
        const formatBadge = format === 'csv' ? 'Таблица CSV / TSV' : 'JSON';
        bulkDialogStatus.innerHTML = `📊 Обнаружено (<strong>${formatBadge}</strong>): тем: <strong>${uniqueTopics.length}</strong>, подтем: <strong>${uniqueSubtopics.length}</strong>, задач: <strong>${parsedTasks.length}</strong>. Нажмите «Выполнить импорт».`;
        bulkDialogStatus.hidden = false;
      }
    } catch {
      // Игнорируем промежуточные синтаксические ошибки при ручном наборе
    }
  });

  /* 📊 Образец таблицы CSV / Excel / Google Таблиц */
  btnToggleSampleCsv?.addEventListener('click', () => {
    if (!csvSampleCard) return;
    csvSampleCard.hidden = !csvSampleCard.hidden;
  });

  btnCloseSampleCsv?.addEventListener('click', () => {
    if (csvSampleCard) csvSampleCard.hidden = true;
  });

  btnCopySampleCsv?.addEventListener('click', async () => {
    const text = csvSampleCode?.textContent?.trim() || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    const orig = btnCopySampleCsv.textContent;
    btnCopySampleCsv.textContent = '✓ Скопировано!';
    setTimeout(() => { btnCopySampleCsv.textContent = orig; }, 2000);
  });

  const insertCsvSampleToDialog = () => {
    const text = csvSampleCode?.textContent?.trim() || '';
    openBulkDialog('import');
    bulkDialogTextarea.value = text;
    bulkDialogStatus.className = 'bulk-dialog-status success';
    bulkDialogStatus.innerHTML = '📊 Образец таблицы CSV вставлен в окно! Нажмите «Выполнить импорт» для добавления.';
    bulkDialogStatus.hidden = false;
  };

  btnInsertSampleCsvToDialog?.addEventListener('click', insertCsvSampleToDialog);
  bulkDialogCsvTemplateBtn?.addEventListener('click', insertCsvSampleToDialog);

  /* 🤖 Промпт для ИИ (30-50 задач за один запрос) */
  const AI_PROMPT_TEXT = `Составь 30 математических задач по теме [НАЗВАНИЕ ТЕМЫ], класс [КЛАСС], согласно латвийскому стандарту Skola2030.

Выведи результат СТРОГО в виде таблицы, где столбцы разделены символом ТАБУЛЯЦИИ, а не запятой: запятая стоит в каждой десятичной дроби ($0{,}5$) и во многих формулах, и таблица через запятую при вставке разъезжается по столбцам. Первая строка — заголовки:
grade\ttopic_title\ttopic_title_lv\tsubtopic_code\tcondition_latex\tcondition_latex_lv\tanswer_latex\tanswer_latex_lv\tsolution_latex\tsolution_latex_lv\tdifficulty\ttags

Каждая задача на двух языках: столбцы с суффиксом _lv — латышская версия того же условия, ответа и решения на терминологии Skola2030. Числа, формулы и знаки $ в обеих версиях совпадают до символа, расходится только текст.

Требования к оформлению:
1. Формулы и математические выражения пиши в LaTeX с долларами: $x^2 + 5x = 0$, $\\frac{a}{b}$, $\\sqrt{x}$.
2. Внутри ячейки не должно быть табуляции. Если в ячейке нужен перевод строки (многошаговое решение) — оберни всю ячейку в двойные кавычки "...". Если внутри кавычек встречается кавычка, удваивай её: """".
3. difficulty: Лёгкий, Средний или Сложный.
4. subtopic_code: номер подтемы по стандарту (например 7.1.1, 8.2.3 и т.д.).
5. tags: список тегов через точку с запятой (например: vienadojumi; algebriskie-parveidojumi).
6. Выведи сразу 30 задач одной непрерывной таблицей без лишнего вступительного и заключительного текста, чтобы я мог скопировать её в один клик.`;

  function showAiPromptModal() {
    if (!aiPromptDialog) return;
    if (aiPromptTextarea) aiPromptTextarea.value = AI_PROMPT_TEXT;
    aiPromptDialog.showModal();
  }

  btnShowAiPrompt?.addEventListener('click', showAiPromptModal);
  bulkDialogAiPromptBtn?.addEventListener('click', showAiPromptModal);
  aiPromptDialogClose?.addEventListener('click', () => aiPromptDialog?.close());
  aiPromptCloseBtn?.addEventListener('click', () => aiPromptDialog?.close());
  aiPromptCopyBtn?.addEventListener('click', async () => {
    const text = aiPromptTextarea?.value || AI_PROMPT_TEXT;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    const orig = aiPromptCopyBtn.textContent;
    aiPromptCopyBtn.textContent = '✓ Промпт скопирован!';
    setTimeout(() => { aiPromptCopyBtn.textContent = orig; }, 2000);
  });

  /* Образец лежит отдельным файлом, а не строкой в коде: его удобно
     открыть, скачать и держать рядом как справку по полям. */
  document.querySelector('#bulk-dialog-example')?.addEventListener('click', async () => {
    const btn = document.querySelector('#bulk-dialog-example');
    btn.disabled = true;
    try {
      const res = await fetch('/data/task-import-example.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      bulkDialogTextarea.value = JSON.stringify(await res.json(), null, 2);
      bulkDialogStatus.className = 'bulk-dialog-status';
      bulkDialogStatus.textContent = 'Образец вставлен. Замените содержимое своими данными и нажмите «Выполнить импорт».';
    } catch (e) {
      bulkDialogStatus.className = 'bulk-dialog-status error';
      bulkDialogStatus.textContent = 'Не удалось загрузить образец: ' + e.message;
    } finally {
      btn.disabled = false;
    }
  });

  bulkDialogCopy?.addEventListener('click', async () => {
    const isCsv = bulkMode === 'export_csv';
    const label = isCsv ? 'Таблица CSV' : 'Текст';
    try {
      await navigator.clipboard.writeText(bulkDialogTextarea.value);
      bulkDialogStatus.className = 'bulk-dialog-status success';
      bulkDialogStatus.textContent = `✓ ${label} скопирован(а) в буфер обмена!`;
      bulkDialogStatus.hidden = false;
    } catch {
      bulkDialogTextarea.select();
      document.execCommand('copy');
      bulkDialogStatus.className = 'bulk-dialog-status success';
      bulkDialogStatus.textContent = `✓ ${label} скопирован(а) в буфер обмена!`;
      bulkDialogStatus.hidden = false;
    }
  });

  bulkDialogSubmit?.addEventListener('click', async () => {
    if (bulkMode === 'export' || bulkMode === 'export_csv') {
      const isCsv = bulkMode === 'export_csv';
      const type = isCsv ? 'text/csv;charset=utf-8;' : 'application/json';
      const ext = isCsv ? 'csv' : 'json';
      const blob = new Blob([bulkDialogTextarea.value], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `math-tasks-export-${new Date().toISOString().slice(0, 10)}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      bulkDialogStatus.className = 'bulk-dialog-status success';
      bulkDialogStatus.textContent = `✓ Файл tasks-export.${ext} сохранён!`;
      bulkDialogStatus.hidden = false;
      return;
    }

    // Режим импорта (JSON / CSV / TSV)
    bulkDialogStatus.hidden = true;
    const raw = bulkDialogTextarea.value.trim();
    if (!raw) {
      bulkDialogStatus.className = 'bulk-dialog-status error';
      bulkDialogStatus.textContent = 'Вставьте JSON, CSV или выберите файл для импорта.';
      bulkDialogStatus.hidden = false;
      return;
    }

    let parsedResult;
    try {
      const parseFn = window.MathTasksLib?.parseTasksImport || parseMultiTopicJson;
      parsedResult = parseFn(raw);
    } catch (e) {
      bulkDialogStatus.className = 'bulk-dialog-status error';
      bulkDialogStatus.textContent = 'Ошибка синтаксиса: ' + e.message;
      bulkDialogStatus.hidden = false;
      return;
    }

    const { uniqueTopics, uniqueSubtopics, tasks: items, format } = parsedResult;
    if (!items.length) {
      bulkDialogStatus.className = 'bulk-dialog-status error';
      bulkDialogStatus.textContent = 'В данных не найдено задач для импорта (проверьте формат JSON или CSV).';
      bulkDialogStatus.hidden = false;
      return;
    }

    bulkDialogSubmit.disabled = true;
    bulkDialogSubmit.textContent = 'Импортируем в Supabase…';

    let createdTopicsCount = 0;
    let createdSubtopicsCount = 0;
    const errors = [];

    // 1. Создаём недостающие темы в Supabase
    for (const top of uniqueTopics) {
      const titleKey = top.title?.toLowerCase().trim();
      const titleLvKey = top.title_lv?.toLowerCase().trim();
      let existing = topics.find(t =>
        (titleKey && t.title?.toLowerCase().trim() === titleKey) ||
        (titleLvKey && t.title_lv?.toLowerCase().trim() === titleLvKey) ||
        (titleKey && t.title_lv?.toLowerCase().trim() === titleKey) ||
        (titleLvKey && t.title?.toLowerCase().trim() === titleLvKey)
      );
      if (!existing) {
        let targetSubjectId = top.subject_id;
        if (!targetSubjectId && (top.subject_slug || top.subject_title)) {
          const foundSubj = resolveSubject(top.subject_slug || top.subject_title, subjects);
          if (foundSubj) targetSubjectId = foundSubj.id;
        }
        if (!targetSubjectId) targetSubjectId = subjects[0]?.id || null;

        const newTopicPayload = sanitizeTopicPayload({
          title: top.title,
          title_lv: top.title_lv || null,
          subject_id: targetSubjectId,
          grade: top.grade,
          /* В конец своего класса, а не нулём: нулевая позиция выпадала из
             нумерации 1..N, и у темы на сайте не было номера. */
          position: nextTopicPosition(top.grade, targetSubjectId, null),
          slug: `${makeSlug(top.title)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          description: top.description || null,
          description_lv: top.description_lv || null
        });
        const { data: createdTopic, error: topErr } = await db.from('topics').insert(newTopicPayload).select().single();
        if (!topErr && createdTopic) {
          topics.push(createdTopic);
          createdTopicsCount++;
        } else if (topErr) {
          errors.push(`Не удалось создать тему «${top.title}»: ${topErr.message}`);
        }
      }
    }

    // 1b. Создаём недостающие подтемы в Supabase
    for (const sub of uniqueSubtopics) {
      const parentTopic = topics.find(t =>
        (sub.topic_title && t.title?.toLowerCase().trim() === sub.topic_title.toLowerCase().trim()) ||
        (sub.topic_title_lv && t.title_lv?.toLowerCase().trim() === sub.topic_title_lv.toLowerCase().trim())
      );
      if (!parentTopic) continue;

      const code = sub.code ? String(sub.code).trim() : '';
      const sNeedle = sub.title ? String(sub.title).trim().toLowerCase() : '';
      const sNeedleLv = sub.title_lv ? String(sub.title_lv).trim().toLowerCase() : '';

      let existingSub = subtopics.find(s =>
        s.topic_id === parentTopic.id && (
          (code && String(s.code || '').trim() === code) ||
          (sNeedle && s.title?.toLowerCase().trim() === sNeedle) ||
          (sNeedleLv && s.title_lv?.toLowerCase().trim() === sNeedleLv)
        )
      );

      if (!existingSub && (sub.title || sub.code)) {
        const titleVal = sub.title || sub.code || 'Подтема';
        const newSubPayload = {
          topic_id: parentTopic.id,
          title: titleVal,
          title_lv: sub.title_lv || null,
          code: sub.code || null,
          position: sub.position || (subtopics.filter(s => s.topic_id === parentTopic.id).length + 1),
          slug: `${makeSlug(titleVal)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        };
        const { data: createdSub, error: subErr } = await db.from('subtopics').insert(newSubPayload).select().single();
        if (!subErr && createdSub) {
          subtopics.push(createdSub);
          createdSubtopicsCount++;
        }
      }
    }

    // 2. Добавляем задачи
    let successCount = 0;
    const warnings = [];
    let withoutTopic = 0;
    /* Предупреждения разбора — например, сдвиг столбцов из-за запятой
       в формуле без кавычек — показываем вместе с остальными. */
    if (Array.isArray(parsedResult.warnings)) warnings.push(...parsedResult.warnings);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.condition_latex) {
        errors.push(`Задача #${i + 1}: отсутствует condition_latex`);
        continue;
      }
      let topicId = item.topic_id || null;
      if (!topicId && (item.topic_title || item.topic_title_lv)) {
        const needle = String(item.topic_title || '').trim().toLowerCase();
        const needleLv = String(item.topic_title_lv || '').trim().toLowerCase();
        const foundTopic = topics.find(t =>
          (needle && t.title?.toLowerCase().trim() === needle) ||
          (needleLv && t.title_lv?.toLowerCase().trim() === needleLv) ||
          (needle && t.title_lv?.toLowerCase().trim() === needle) ||
          (needleLv && t.title?.toLowerCase().trim() === needleLv)
        );
        if (foundTopic) topicId = foundTopic.id;
      }

      /* Подтему ищем по номеру («8.8.3») — он уникален и не зависит от того,
         как модель перевела название. Название берём запасным вариантом. */
      let subtopicId = item.subtopic_id || null;
      if (!subtopicId && (item.subtopic_code || item.subtopic_title || item.subtopic_title_lv)) {
        const code = String(item.subtopic_code || '').trim();
        const sNeedle = String(item.subtopic_title || '').trim().toLowerCase();
        const sNeedleLv = String(item.subtopic_title_lv || '').trim().toLowerCase();
        const pool = topicId ? subtopics.filter(s => s.topic_id === topicId) : subtopics;
        const found = pool.find(s => code && String(s.code || '').trim() === code)
          || pool.find(s =>
            (sNeedle && s.title?.toLowerCase().trim() === sNeedle) ||
            (sNeedleLv && s.title_lv?.toLowerCase().trim() === sNeedleLv));
        if (found) subtopicId = found.id;
        else warnings.push(`Задача #${i + 1}: подтема «${code || sNeedle || sNeedleLv}» не найдена, задача легла прямо в тему.`);
      }

      if (!topicId) withoutTopic++;
      const taskPos = nextPosition(topicId, null);
      const titleVal = item.title ? String(item.title).trim() : `Задача №${taskPos}`;

      const payload = sanitizeTaskPayload({
        subtopic_id: subtopicId,
        title: titleVal,
        title_lv: item.title_lv ? String(item.title_lv).trim() : null,
        condition_latex: String(item.condition_latex).trim(),
        condition_latex_lv: item.condition_latex_lv ? String(item.condition_latex_lv).trim() : null,
        answer_latex: item.answer_latex ? String(item.answer_latex).trim() : null,
        answer_latex_lv: item.answer_latex_lv ? String(item.answer_latex_lv).trim() : null,
        solution_latex: item.solution_latex ? String(item.solution_latex).trim() : null,
        solution_latex_lv: item.solution_latex_lv ? String(item.solution_latex_lv).trim() : null,
        hint_latex: item.hint_latex ? String(item.hint_latex).trim() : null,
        condition_image: item.condition_image ? String(item.condition_image).trim() : null,
        solution_image: item.solution_image ? String(item.solution_image).trim() : null,
        hint_latex_lv: item.hint_latex_lv ? String(item.hint_latex_lv).trim() : null,
        difficulty: item.difficulty || 'Средний',
        grade: parseFormGrade(item.grade),
        topic_id: topicId,
        /* Позицию из файла не берём: в наборах она у каждой задачи была
           единицей, и все задачи темы слипались в один номер. Номер внутри
           темы назначаем сами, по порядку добавления. */
        position: taskPos,
        is_published: item.is_published !== undefined ? Boolean(item.is_published) : true
      });

      const { data: insertedTask, error } = await db.from('tasks').insert(payload).select('id').maybeSingle();
      if (error) {
        errors.push(`Задача #${i + 1}: ${error.message}`);
      } else {
        successCount++;
        const newTaskId = insertedTask?.id;
        /* Указатель пополняем сразу, не дожидаясь конца импорта: следующая
           задача считает свой номер по нему, и без этой строки все задачи
           одной темы получили бы одну и ту же позицию — ровно то, из-за чего
           пришлось перенумеровывать весь каталог. */
        taskIndex.push({ id: newTaskId, topic_id: payload.topic_id ?? null, position: payload.position });
        // Привязываем кросс-теги Skola2030 если они переданы в массиве tags
        if (newTaskId && Array.isArray(item.tags) && item.tags.length) {
          if (!tagsReady) {
            warnings.push(`Задача #${i + 1}: теги не сохранены — не выполнена миграция 010_cross_tags.sql.`);
          } else try {
            const rawTags = item.tags.map(t => String(t).trim().toLowerCase()).filter(Boolean);
            const matched = [];
            const unknown = [];
            for (const raw of rawTags) {
              const row = allTags.find(t => t.slug?.toLowerCase() === raw || t.title?.toLowerCase() === raw || t.title_lv?.toLowerCase() === raw);
              row ? matched.push(row) : unknown.push(raw);
            }
            /* Словарь тегов закрытый. Молча выбросить непонятый тег — значит
               потерять разметку без единого следа, поэтому говорим об этом. */
            if (unknown.length) {
              warnings.push(`Задача #${i + 1}: неизвестные теги — ${unknown.join(', ')}. Допустимые слаги перечислены под полем ввода.`);
            }
            if (matched.length > 3) {
              warnings.push(`Задача #${i + 1}: тегов больше трёх, сохранены первые три (${matched.slice(0, 3).map(t => t.slug).join(', ')}).`);
            }
            const tagInserts = matched.slice(0, 3).map(t => ({ task_id: newTaskId, tag_id: t.id }));
            if (tagInserts.length) {
              const { error: tagErr } = await db.from('task_tags').insert(tagInserts);
              if (tagErr) warnings.push(`Задача #${i + 1}: теги не сохранены — ${tagErr.message}`);
            }
          } catch (tErr) {
            warnings.push(`Задача #${i + 1}: ошибка сохранения тегов — ${tErr.message}`);
          }
        }
      }
    }

    /* Без темы задача не видна на страницах тем — только в поиске и общем
       списке. Сохраняем, но говорим прямо, а не молча. */
    if (withoutTopic) {
      warnings.unshift(`Задач без темы: ${withoutTopic}. В файле нет столбца темы или её название не совпало ни с одной темой — на страницах тем их не будет.`);
    }

    bulkDialogSubmit.disabled = false;
    bulkDialogSubmit.textContent = 'Импортировать в базу';

    const warnBlock = warnings.length
      ? `<br><br><strong>Предупреждения (${warnings.length}):</strong><br>${warnings.slice(0, 12).map(escapeHtml).join('<br>')}${warnings.length > 12 ? '<br>…' : ''}`
      : '';

    if (errors.length) {
      bulkDialogStatus.className = 'bulk-dialog-status ' + (successCount > 0 ? 'warning' : 'error');
      bulkDialogStatus.innerHTML = `Обработано тем: <strong>${uniqueTopics.length}</strong> (создано новых: ${createdTopicsCount}), ` +
        `подтем: <strong>${uniqueSubtopics.length}</strong>` + (createdSubtopicsCount ? ` (создано новых: ${createdSubtopicsCount})` : '') + `.<br>` +
        `Успешно сохранено задач: <strong>${successCount}</strong> из ${items.length}.<br>` + warnBlock +
        `Ошибки:<br>${errors.map(escapeHtml).join('<br>')}`;
      bulkDialogStatus.hidden = false;
    } else {
      bulkDialogStatus.className = 'bulk-dialog-status success';
      bulkDialogStatus.innerHTML = `🎉 Успешно импортировано! Тем обработано: <strong>${uniqueTopics.length}</strong> (создано новых: ${createdTopicsCount}), ` +
        `подтем: <strong>${uniqueSubtopics.length}</strong>` + (createdSubtopicsCount ? ` (создано новых: ${createdSubtopicsCount})` : '') + `, ` +
        `задач сохранено: <strong>${successCount}</strong> из ${items.length}!` + warnBlock;
      bulkDialogStatus.hidden = false;
      setTimeout(() => bulkDialog?.close(), 2200);
    }

    await loadCatalog();
    await refreshTasks();
  });

  /* ── Skola2030 Помощник тем и AI Генератор задач ────────────────── */
  const btnApplySkolaSample = document.querySelector('#btn-apply-skola-sample');
  const skolaPresetStatus = document.querySelector('#skola-preset-status');

  const aiGenGrade = document.querySelector('#ai-gen-grade');
  const aiGenTopic = document.querySelector('#ai-gen-topic');
  const aiGenSubtopic = document.querySelector('#ai-gen-subtopic');
  const aiGenDifficulty = document.querySelector('#ai-gen-difficulty');
  const aiGenType = document.querySelector('#ai-gen-type');
  const aiGenContext = document.querySelector('#ai-gen-context');
  const aiGenPrompt = document.querySelector('#ai-gen-prompt');
  const topicListDefer = document.querySelector('#topic-list-defer');
  const topicListCloseTop = document.querySelector('#topic-list-close');
  const taskListCloseTop = document.querySelector('#task-list-close');

  function setTopicsShown(shown) {
    topicsShown = shown;
    if (topicListDefer) topicListDefer.hidden = shown;
    if (topicList) topicList.hidden = !shown;
    if (topicListCloseTop) topicListCloseTop.hidden = !shown;
    if (shown) renderTopicList();
  }

  function setTasksShown(shown) {
    if (taskListDefer) taskListDefer.hidden = shown;
    if (taskList) taskList.hidden = !shown;
    if (taskListCloseTop) taskListCloseTop.hidden = !shown;
  }

  document.querySelector('#btn-load-topics')?.addEventListener('click', () => setTopicsShown(true));
  document.querySelector('#btn-hide-topics')?.addEventListener('click', () => setTopicsShown(false));
  document.querySelector('#btn-hide-tasks')?.addEventListener('click', () => setTasksShown(false));

  const taskListDefer = document.querySelector('#task-list-defer');
  const btnLoadTasks = document.querySelector('#btn-load-tasks');
  btnLoadTasks?.addEventListener('click', async () => {
    btnLoadTasks.disabled = true;
    btnLoadTasks.textContent = 'Загружаю…';
    await loadTasks();
    btnLoadTasks.disabled = false;
    btnLoadTasks.textContent = 'Показать задачи';
  });

  const btnRunAiGenerator = document.querySelector('#btn-run-ai-generator');
  const btnCancelAiGenerator = document.querySelector('#btn-cancel-ai-generator');
  const aiGenStatus = document.querySelector('#ai-gen-status');
  const btnToggleAiSettings = document.querySelector('#btn-toggle-ai-settings');
  const aiSettingsCard = document.querySelector('#ai-settings-card');
  const aiEngineSelect = document.querySelector('#ai-engine-select');
  const geminiKeyWrap = document.querySelector('#gemini-key-wrap');
  const aiGeminiKey = document.querySelector('#ai-gemini-key');
  const btnSaveGeminiKey = document.querySelector('#btn-save-gemini-key');

  function updateAiFieldsVisibility() {
    const isGemini = aiEngineSelect?.value === 'gemini';
    if (geminiKeyWrap) geminiKeyWrap.hidden = !isGemini;
    const keyHint = document.querySelector('#ai-key-hint');
    if (keyHint) {
      keyHint.textContent = isGemini
        ? 'Введите API-ключ Google Gemini для генерации задач через нейросеть. Получить ключ: aistudio.google.com'
        : 'Встроенный генератор создаёт аутентичные задачи Skola2030 без API-ключа. Переключитесь на Google Gemini для использования нейросети.';
    }
    // Show/hide Gemini-only fields (context, custom prompt, subtopic, task type)
    document.querySelectorAll('.ai-custom-card').forEach(card => {
      card.style.display = isGemini ? '' : 'none';
    });
    const subtopicField = document.querySelector('#ai-gen-subtopic');
    if (subtopicField) {
      const subtopicLabel = subtopicField.closest('label') || subtopicField.parentElement;
      if (subtopicLabel) subtopicLabel.style.display = isGemini ? '' : 'none';
    }
    const typeField = document.querySelector('#ai-gen-type');
    if (typeField) {
      const typeLabel = typeField.closest('label') || typeField.parentElement;
      if (typeLabel) typeLabel.style.display = isGemini ? '' : 'none';
    }
  }

  function initAiSettings() {
    const savedKey = localStorage.getItem('math_tasks_gemini_api_key') || '';
    if (aiGeminiKey && savedKey) {
      aiGeminiKey.value = savedKey;
    }
    const savedEngine = localStorage.getItem('math_tasks_ai_engine') || (savedKey ? 'gemini' : 'builtin');
    if (aiEngineSelect) {
      aiEngineSelect.value = savedEngine;
      aiEngineSelect.addEventListener('change', () => {
        localStorage.setItem('math_tasks_ai_engine', aiEngineSelect.value);
        updateAiFieldsVisibility();
      });
    }

    btnToggleAiSettings?.addEventListener('click', () => {
      if (!aiSettingsCard) return;
      aiSettingsCard.hidden = !aiSettingsCard.hidden;
      if (!aiSettingsCard.hidden && aiGeminiKey) {
        aiGeminiKey.focus();
      }
    });

    function saveKey() {
      const k = (aiGeminiKey?.value || '').trim();
      localStorage.setItem('math_tasks_gemini_api_key', k);
      if (k) {
        localStorage.setItem('math_tasks_ai_engine', 'gemini');
        if (aiEngineSelect) aiEngineSelect.value = 'gemini';
        updateAiFieldsVisibility();
      }
      if (btnSaveGeminiKey) {
        btnSaveGeminiKey.textContent = '✓ Сохранено';
        setTimeout(() => { btnSaveGeminiKey.textContent = 'Сохранить'; }, 2000);
      }
    }

    btnSaveGeminiKey?.addEventListener('click', saveKey);
    aiGeminiKey?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveKey();
      }
    });
    
    updateAiFieldsVisibility();
  }

  initAiSettings();

  let skola2030Catalog = [];

  async function loadSkola2030Catalog() {
    try {
      const res = await fetch('/data/skola2030_topics.json');
      if (res.ok) {
        skola2030Catalog = await res.json();
      }
    } catch (e) {
      console.warn('Не удалось загрузить skola2030_topics.json:', e);
    }
    setupSkolaPresetControls();
    setupAiGeneratorControls();
  }

  /* ── Кастомный rich-dropdown поверх нативного <select> ─────────── */
  function createRichSelect(nativeSelect, opts = {}) {
    if (!nativeSelect) return null;
    const { searchable = false, placeholder = 'Выберите...', renderItem, onSelect } = opts;
    if (nativeSelect._richSelect) {
      nativeSelect._richSelect.destroy();
    }

    nativeSelect.style.display = 'none';
    const wrap = document.createElement('div');
    wrap.className = 'custom-select-wrap';
    nativeSelect.parentNode.insertBefore(wrap, nativeSelect);
    wrap.appendChild(nativeSelect);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.innerHTML = '<span class="custom-select-text">—</span><span class="custom-select-arrow">▾</span>';
    wrap.insertBefore(trigger, nativeSelect);

    const dropdown = document.createElement('div');
    dropdown.className = 'custom-select-dropdown';
    let searchInput = null;
    if (searchable) {
      const searchWrap = document.createElement('div');
      searchWrap.className = 'custom-select-search-wrap';
      searchInput = document.createElement('input');
      searchInput.type = 'search';
      searchInput.className = 'custom-select-search';
      searchInput.placeholder = 'Поиск по списку…';
      searchInput.autocomplete = 'off';
      searchWrap.appendChild(searchInput);
      dropdown.appendChild(searchWrap);
    }
    const list = document.createElement('div');
    list.className = 'custom-select-list';
    dropdown.appendChild(list);
    wrap.appendChild(dropdown);

    let isOpen = false;
    let items = [];

    function setTriggerText(value) {
      const textEl = trigger.querySelector('.custom-select-text');
      const opt = items.find(i => String(i.value) === String(value));
      if (opt) {
        textEl.innerHTML = opt.triggerHtml || escapeHtml(opt.main);
      } else {
        const selOpt = nativeSelect.selectedOptions?.[0];
        textEl.textContent = selOpt ? selOpt.textContent : placeholder;
      }
    }

    function buildItems() {
      items = [];
      for (const option of nativeSelect.options) {
        const raw = option.textContent;
        let main = raw, sub = '';
        if (renderItem) {
          const r = renderItem(option.value, raw);
          main = r.main;
          sub = r.sub || '';
          items.push({ value: option.value, main, sub, text: raw, triggerHtml: r.triggerHtml });
        } else {
          items.push({ value: option.value, main, sub, text: raw });
        }
      }
      renderList('');
      setTriggerText(nativeSelect.value);
    }

    function renderList(query) {
      const q = (query || '').toLowerCase().trim();
      const filtered = q
        ? items.filter(i => (i.text && i.text.toLowerCase().includes(q)) || (i.main && i.main.toLowerCase().includes(q)) || (i.sub && i.sub.toLowerCase().includes(q)))
        : items;
      if (!filtered.length) {
        list.innerHTML = '<div class="custom-select-empty">Ничего не найдено</div>';
        return;
      }
      list.innerHTML = filtered.map(i => {
        const activeClass = String(i.value) === String(nativeSelect.value) ? ' active' : '';
        const subHtml = i.sub ? `<span class="custom-select-item-sub">${escapeHtml(i.sub)}</span>` : '';
        return `
          <div class="custom-select-item${activeClass}" data-value="${escapeHtml(String(i.value))}">
            <div class="custom-select-item-content">
              <span class="custom-select-item-main">${escapeHtml(i.main)}</span>
              ${subHtml}
            </div>
            <span class="custom-select-check">✓</span>
          </div>
        `;
      }).join('');
    }

    function open() {
      if (isOpen) return;
      document.querySelectorAll('.custom-select-trigger.open').forEach(t => t.classList.remove('open'));
      document.querySelectorAll('.custom-select-dropdown.open').forEach(d => d.classList.remove('open'));
      isOpen = true;
      trigger.classList.add('open');
      dropdown.classList.add('open');
      if (searchInput) {
        searchInput.value = '';
        renderList('');
        setTimeout(() => searchInput.focus(), 20);
      }
      const activeEl = list.querySelector('.active');
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      trigger.classList.remove('open');
      dropdown.classList.remove('open');
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      isOpen ? close() : open();
    });

    if (searchInput) {
      searchInput.addEventListener('input', () => renderList(searchInput.value));
      searchInput.addEventListener('click', e => e.stopPropagation());
    }

    list.addEventListener('click', (e) => {
      const el = e.target.closest('.custom-select-item');
      if (!el) return;
      const val = el.dataset.value;
      nativeSelect.value = val;
      setTriggerText(val);
      close();
      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      if (onSelect) onSelect(val);
    });

    document.addEventListener('click', (e) => {
      if (isOpen && !wrap.contains(e.target)) close();
    });

    const api = {
      refresh() { buildItems(); },
      setValue(val) {
        nativeSelect.value = val;
        setTriggerText(val);
        renderList(searchInput?.value || '');
      },
      destroy() {
        nativeSelect.style.display = '';
        if (wrap.parentNode) {
          wrap.parentNode.insertBefore(nativeSelect, wrap);
          wrap.remove();
        }
        nativeSelect._richSelect = null;
      }
    };
    nativeSelect._richSelect = api;
    buildItems();
    return api;
  }

  function setupSkolaPresetControls() {
    if (!btnApplySkolaSample) return;

    btnApplySkolaSample.addEventListener('click', () => {
      // Подставляем качественный образец темы Skola2030 для удобства заполнения
      const sample = (skola2030Catalog && skola2030Catalog.length > 0)
        ? skola2030Catalog[0]
        : {
            title_ru: 'Линейные уравнения и неравенства с одной переменной',
            title_lv: 'Lineāri vienādojumi un nevienādības ar vienu mainīgo',
            grade: 7,
            subject_slug: 'algebra',
            position: 1,
            description_ru: 'Решение линейных уравнений, числовые промежутки, линейные неравенства.',
            description_lv: 'Lineāru vienādojumu risināšana, skaitļu intervāli, lineāras nevienādības.'
          };

      topicForm.elements.title.value = sample.title_ru || sample.title || '';
      if (topicForm.elements.title_lv) topicForm.elements.title_lv.value = sample.title_lv || '';
      topicForm.elements.grade.value = String(sample.grade ?? 7);

      const matchingSubj = resolveSubject(sample.subject_slug, subjects) || subjects[0];
      if (matchingSubj) topicForm.elements.subject_id.value = String(matchingSubj.id);

      topicForm.elements.position.value = sample.position || 1;
      topicForm.elements.description.value = sample.description_ru || sample.description || '';
      if (topicForm.elements.description_lv) topicForm.elements.description_lv.value = sample.description_lv || '';

      if (skolaPresetStatus) {
        skolaPresetStatus.className = 'skola-preset-status success';
        skolaPresetStatus.textContent = `✨ Образец темы «${sample.title_ru || sample.title}» подставлен в форму! Нажмите «Добавить тему».`;
        skolaPresetStatus.hidden = false;
        setTimeout(() => { skolaPresetStatus.hidden = true; }, 4000);
      }
      topicForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function setupAiGeneratorControls() {
    if (!aiGenGrade || !aiGenTopic) return;
    fillGradeSelect(aiGenGrade, '7 класс', { numeric: true });
    aiGenGrade.value = '7';

    createRichSelect(aiGenGrade, {
      searchable: false,
      renderItem(val, text) {
        const g = parseFormGrade(val);
        let main = text;
        let sub = '';
        if (g !== null && g <= 9) {
          main = `${g}. klase (${g} класс)`;
          sub = g === 9 ? '🎯 Valsts eksāmens (Госэкзамен)' : (g === 3 || g === 6 ? '📋 Diagnostikas darbs' : 'Pamatskola');
        } else if (g === 10) {
          main = 'Vispārīgais līmenis';
          sub = '10. klase / Общий школьный курс';
        } else if (g === 11) {
          main = 'Matemātika I (Optimālais)';
          sub = '11. klase / Оптимальный уровень экзамена';
        } else if (g === 12) {
          main = 'Matemātika II (Augstākais)';
          sub = '12. klase / Высший уровень экзамена';
        }
        return { main, sub, triggerHtml: escapeHtml(main) };
      }
    });

    createRichSelect(aiGenDifficulty, {
      searchable: false,
      renderItem(value) {
        if (value === 'mix') return { main: 'Сбалансированный микс', sub: '45% лёгкий, 35% средний, 20% сложный' };
        if (value === 'Лёгкий') return { main: 'Лёгкий уровень', sub: 'pamata līmenis (базовые понятия и алгоритмы)' };
        if (value === 'Средний') return { main: 'Средний уровень', sub: 'optimālais līmenis (стандартная программа)' };
        if (value === 'Сложный') return { main: 'Сложный уровень', sub: 'padziļinātais līmenis (олимпиадные и комплексные)' };
        return { main: value, sub: '' };
      }
    });

    createRichSelect(aiGenType, {
      searchable: false,
      renderItem(value) {
        if (value === 'Уравнение или пример') return { main: 'Уравнение или пример', sub: 'Алгебра, формулы, тождества и вычисления' };
        if (value === 'Текстовая прикладная задача') return { main: 'Текстовая прикладная задача', sub: 'Жизненный сюжет, движение, проценты, работа' };
        if (value === 'Геометрическая задача') return { main: 'Геометрическая задача', sub: 'Фигуры, углы, площади, стереометрия' };
        return { main: value, sub: '' };
      }
    });

    function refreshAiTopics() {
      const g = parseFormGrade(aiGenGrade.value);
      const catalogTopics = g !== null ? skola2030Catalog.filter(t => t.grade === g) : skola2030Catalog;
      if (catalogTopics.length) {
        aiGenTopic.innerHTML = `<option value="__ALL__">🌐 Все темы класса (Skola2030, равномерно)</option>` +
          catalogTopics.map(t => `<option value="${t.slug}">${escapeHtml(t.title_ru)} (${escapeHtml(t.title_lv)})</option>`).join('');
      } else {
        const dbTopics = g !== null ? topics.filter(t => t.grade === g) : topics;
        aiGenTopic.innerHTML = dbTopics.length
          ? (dbTopics.length > 1 ? `<option value="__ALL__">🌐 Все темы класса (равномерно)</option>` : '') +
            dbTopics.map(t => `<option value="${t.id}">${escapeHtml(t.title)}</option>`).join('')
          : '<option value="">Нет тем</option>';
      }

      createRichSelect(aiGenTopic, {
        searchable: true,
        renderItem(value, text) {
          if (value === '__ALL__') {
            const countTopics = catalogTopics.length || (g !== null ? topics.filter(t => t.grade === g).length : 0);
            return {
              main: '🌐 Все темы класса (Skola2030)',
              sub: `Равномерно распределить по всем ${countTopics} темам`,
              triggerHtml: '<strong>🌐 Все темы класса (Skola2030)</strong>'
            };
          }
          const t = skola2030Catalog.find(c => c.slug === value);
          if (t) {
            return {
              main: t.title_ru,
              sub: t.title_lv,
              triggerHtml: `${escapeHtml(t.title_ru)} <span class="cs-sub">${escapeHtml(t.title_lv)}</span>`
            };
          }
          const dbT = topics.find(t => String(t.id) === value);
          if (dbT) {
            return { main: dbT.title, sub: dbT.title_lv || '', triggerHtml: escapeHtml(dbT.title) };
          }
          return { main: text, sub: '' };
        }
      });

      refreshAiSubtopics();
    }

    function refreshAiSubtopics() {
      if (!aiGenSubtopic) return;
      const slugOrId = aiGenTopic.value;
      if (slugOrId === '__ALL__') {
        aiGenSubtopic.innerHTML = '<option value="">Все темы и навыки класса</option>';
        createRichSelect(aiGenSubtopic, { searchable: false });
        return;
      }
      const topicItem = skola2030Catalog.find(t => t.slug === slugOrId) || topics.find(t => String(t.id) === slugOrId);
      /* Значением делаем номер «7.5.2», а не название: по номеру задача
         потом ложится в нужную подтему базы, как бы модель ни перевела
         текст. Название остаётся видимым и уходит в промпт. */
      const catalogSubs = topicItem?.subtopics || [];
      if (catalogSubs.length) {
        aiGenSubtopic.innerHTML = '<option value="">Все навыки темы</option>' +
          catalogSubs.map(s => `<option value="${escapeHtml(s.num || s.ru)}">${escapeHtml(`${s.num ? s.num + '. ' : ''}${s.ru}`)}</option>`).join('');
      } else {
        aiGenSubtopic.innerHTML = '<option value="">Все навыки темы</option>';
      }

      createRichSelect(aiGenSubtopic, {
        searchable: catalogSubs.length > 4,
        renderItem(value, text) {
          if (!value) return { main: 'Все навыки темы', sub: 'Случайный выбор из программы Skola2030' };
          const s = catalogSubs.find(st => (st.num || st.ru) === value);
          if (s && s.lv) {
            return {
              main: s.ru || text,
              sub: s.lv,
              triggerHtml: `${escapeHtml(s.ru || text)} <span class="cs-sub">${escapeHtml(s.lv)}</span>`
            };
          }
          return { main: text, sub: '' };
        }
      });
    }

    aiGenGrade.addEventListener('change', refreshAiTopics);
    aiGenTopic.addEventListener('change', refreshAiSubtopics);
    refreshAiTopics();

    // Быстрые сюжеты и требования к формулам
    document.querySelectorAll('.ai-preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const targetId = chip.closest('.ai-preset-chips')?.dataset.target;
        const targetInput = targetId ? document.getElementById(targetId) : null;
        if (!targetInput) return;
        const textToInsert = chip.dataset.text || chip.textContent.trim();
        const currentVal = targetInput.value.trim();
        if (!currentVal) {
          targetInput.value = textToInsert;
        } else if (!currentVal.includes(textToInsert)) {
          targetInput.value = currentVal + '; ' + textToInsert;
        }
        targetInput.focus();
        chip.classList.add('applied');
        setTimeout(() => chip.classList.remove('applied'), 600);
      });
    });

    document.querySelectorAll('.ai-field-clear-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const targetInput = targetId ? document.getElementById(targetId) : null;
        if (targetInput) {
          targetInput.value = '';
          targetInput.focus();
        }
      });
    });


    function getDifficultyForTask(selectedDifficulty, taskIndex, totalCount) {
      if (selectedDifficulty !== 'mix') {
        return selectedDifficulty;
      }
      if (totalCount <= 1) {
        const r = Math.random();
        if (r < 0.45) return 'Лёгкий';
        if (r < 0.80) return 'Средний';
        return 'Сложный';
      }
      // 45% лёгкий, 35% средний, 20% сложный
      const easyCount = Math.max(1, Math.round(totalCount * 0.45));
      const medCount = Math.max(1, Math.round(totalCount * 0.35));
      if (taskIndex < easyCount) return 'Лёгкий';
      if (taskIndex < easyCount + medCount) return 'Средний';
      return 'Сложный';
    }

    /* Отмену держим снаружи обработчика: кнопка «Остановить» живёт
       в другом обработчике и должна дотянуться до идущего цикла. */
    btnCancelAiGenerator?.addEventListener('click', () => {
      aiGenCancelled = true;
      btnCancelAiGenerator.hidden = true;
      aiGenStatus.className = 'ai-gen-status';
      aiGenStatus.innerHTML = '⏹ Останавливаем после текущей задачи…';
    });

    btnRunAiGenerator?.addEventListener('click', async () => {
      const g = parseFormGrade(aiGenGrade.value) || 7;
      const topicSlugOrId = aiGenTopic.value;
      const isAllTopics = topicSlugOrId === '__ALL__';
      const gradeCatalogTopics = skola2030Catalog.filter(t => t.grade === g);
      const gradeDbTopics = topics.filter(t => t.grade === g);

      const topicItem = !isAllTopics
        ? (skola2030Catalog.find(t => t.slug === topicSlugOrId) || topics.find(t => String(t.id) === topicSlugOrId))
        : null;

      const topicTitle = isAllTopics
        ? `Все темы ${g} класса`
        : (topicItem ? (topicItem.title_ru || topicItem.title) : 'Математика');

      const allTopicTitles = isAllTopics
        ? (gradeCatalogTopics.length ? gradeCatalogTopics.map(t => t.title_ru) : gradeDbTopics.map(t => t.title))
        : [topicTitle];

      /* В списке лежит номер подтемы, а модели нужен текст навыка. Номер
         несём отдельно: по нему готовые задачи лягут в нужную подтему. */
      const subtopicCode = isAllTopics ? '' : (aiGenSubtopic?.value || '');
      const subtopicItem = subtopicCode
        ? (topicItem?.subtopics || []).find(s => (s.num || s.ru) === subtopicCode)
        : null;
      const subtopic = subtopicItem ? subtopicItem.ru : (isAllTopics ? '' : subtopicCode);
      const selectedDifficulty = aiGenDifficulty?.value || 'mix';
      const taskType = aiGenType?.value || 'Уравнение';
      const context = (aiGenContext?.value || '').trim();
      const customPrompt = (aiGenPrompt?.value || '').trim();
      const engine = aiEngineSelect?.value || 'builtin';
      const apiKey = (aiGeminiKey?.value || '').trim() || localStorage.getItem('math_tasks_gemini_api_key') || '';
      const rawCount = Number(aiGenCount?.value) || 1;
      const count = Math.min(Math.max(1, rawCount), 100);

      btnRunAiGenerator.disabled = true;
      aiGenStatus.className = 'ai-gen-status';
      aiGenStatus.innerHTML = `<span>⏳</span> Генерация ${count === 1 ? 'задачи' : `задач (${count} шт.)`}…`;

      const generatedResults = [];
      const failures = [];
      let easyCount = 0;
      let medCount = 0;
      let hardCount = 0;

      try {
        const generator = window.MathTasks.aiGenerator;
        if (!generator) throw new Error('Модуль ai-generator.js не загружен');

        const usingGemini = engine === 'gemini';
        const PACE_MS = usingGemini ? 1500 : 0;
        const sleep = ms => new Promise(r => setTimeout(r, ms));

        aiGenCancelled = false;
        if (btnCancelAiGenerator) btnCancelAiGenerator.hidden = false;

        // Определяем размер пакета (для Gemini: до 10 задач за 1 запрос)
        const BATCH_SIZE = usingGemini ? 10 : 10;
        const totalBatches = Math.ceil(count / BATCH_SIZE);

        for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
          if (aiGenCancelled) break;

          const batchCount = Math.min(BATCH_SIZE, count - generatedResults.length);
          if (batchCount <= 0) break;

          // Подбираем темы для этого пакета (если выбраны «Все темы»)
          let batchTopics = allTopicTitles;
          if (isAllTopics && allTopicTitles.length > 2) {
            const startIdx = (batchIdx * 2) % allTopicTitles.length;
            batchTopics = [
              allTopicTitles[startIdx],
              allTopicTitles[(startIdx + 1) % allTopicTitles.length]
            ];
          }

          aiGenStatus.className = 'ai-gen-status';
          aiGenStatus.innerHTML = `<span>⏳</span> Пакет ${batchIdx + 1} из ${totalBatches}: генерация ${generatedResults.length + 1}–${generatedResults.length + batchCount} из ${count} задач…`;

          try {
            const batchTasks = await generator.generateTasksBatch({
              grade: g,
              topicTitle: batchTopics[0] || topicTitle,
              topicsList: batchTopics,
              count: batchCount,
              subtopic,
              subtopicCode,
              difficulty: selectedDifficulty,
              taskType,
              context,
              customPrompt,
              apiKey,
              useGemini: usingGemini,
              onRetry: ({ status, attempt, waitMs }) => {
                aiGenStatus.innerHTML = `<span>⏳</span> Пакет ${batchIdx + 1}: модель занята${status ? ` (${status})` : ''}, ждём ${Math.round(waitMs / 1000)} с — попытка ${attempt + 1}…`;
              }
            });

            for (const task of batchTasks) {
              const diff = task.difficulty || 'Средний';
              generatedResults.push({ result: task, difficulty: diff });
              if (diff === 'Лёгкий') easyCount++;
              else if (diff === 'Средний') medCount++;
              else hardCount++;
            }
            /* Недостача без ошибки — обычное дело: модель решила, что
               хватит. Молчать нельзя, иначе «50 из 50» окажется неправдой. */
            for (let k = batchTasks.length; k < batchCount; k++) {
              failures.push({ index: generatedResults.length + k + 1, message: 'модель вернула меньше задач, чем просили' });
            }
          } catch (batchErr) {
            console.warn(`Ошибка в пакете ${batchIdx + 1}:`, batchErr);
            /* Считаем потерянные задачи, а не пачки: иначе сорванный
               пакет из десяти показывался как «не вышло: 1», и итог
               «40 из 50» выглядел необъяснимо. */
            for (let k = 0; k < batchCount; k++) {
              failures.push({ index: generatedResults.length + k + 1, message: batchErr.message });
            }
          }

          if (PACE_MS && batchIdx < totalBatches - 1 && !aiGenCancelled) {
            await sleep(PACE_MS);
          }
        }

        if (btnCancelAiGenerator) btnCancelAiGenerator.hidden = true;

        if (!generatedResults.length) {
          const why = failures.length ? failures[failures.length - 1].message : 'генерация остановлена';
          throw new Error(why);
        }

        const first = generatedResults[0];

        // Заполняем форму первой сгенерированной задачей для предпросмотра
        if (taskForm.elements.title) taskForm.elements.title.value = first.result.title_ru || first.result.title || '';
        if (taskForm.elements.title_lv) taskForm.elements.title_lv.value = first.result.title_lv || '';

        taskGradeSelect.value = String(g);
        updateTaskTopicDropdown();

        // Ищем подходящую тему в БД
        /* Номер «7.1.» в начале названия каталога мешает прямому сравнению:
           в базе названия без него. Сравниваем очищенные, а если не сошлось —
           по позиции темы внутри класса. */
        const stripNum = s => String(s || '').replace(/^\s*\d+(\.\d+)*\.?\s*/, '').trim().toLowerCase();
        const dbMatchingTopic = topics.find(t => t.grade === g && (
          (t.slug && topicItem?.slug && t.slug === topicItem.slug) ||
          stripNum(t.title) === stripNum(topicTitle)
        )) || (topicItem?.position ? topics.find(t => t.grade === g && t.position === topicItem.position) : null);
        if (dbMatchingTopic) {
          topicSelect.value = String(dbMatchingTopic.id);
          updateSubtopicDropdown();
          if (subtopicCode) {
            const hit = subtopics.find(s => s.topic_id === dbMatchingTopic.id && String(s.code || '') === String(subtopicCode));
            if (hit) updateSubtopicDropdown(hit.id);
          }
        }

        taskForm.elements.difficulty.value = first.difficulty;

        conditionInput.value = first.result.condition_latex_ru || first.result.condition_latex || '';
        if (conditionInputLv) conditionInputLv.value = first.result.condition_latex_lv || '';

        answerInput.value = first.result.answer_latex || '';
        if (answerInputLv) answerInputLv.value = first.result.answer_latex_lv || '';

        solutionInput.value = first.result.solution_latex_ru || first.result.solution_latex || '';
        if (solutionInputLv) solutionInputLv.value = first.result.solution_latex_lv || '';

        updatePreviews();

        if (count === 1) {
          aiGenStatus.className = 'ai-gen-status success';
          aiGenStatus.innerHTML = `🎉 Задача сгенерирована [${first.difficulty}] и перенесена в форму ниже!`;
          taskSuccess.textContent = '✨ Сгенерированная задача готова к публикации или редактированию.';
          setTimeout(() => {
            taskForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300);
        } else {
          // Формируем пакет задач для массового окна
          const tasksForBulk = generatedResults.map(({ result: r, difficulty: diff }, idx) => {
            const taskTopicTitle = r.topic_title || topicTitle;
            /* Ищем тему именно в базе. Раньше сюда попадал элемент каталога,
               и его id (1…96) уходил в topic_id как настоящий — задача
               оказывалась в случайной чужой теме. */
            const catalogHit = skola2030Catalog.find(t => t.title_ru === taskTopicTitle || t.slug === r.topic_slug);
            const cleanTitle = s => String(s || '').replace(/^\s*\d+(\.\d+)*\.?\s*/, '').trim().toLowerCase();
            const dbHit = topics.find(t => t.grade === g && cleanTitle(t.title) === cleanTitle(taskTopicTitle))
              || (catalogHit ? topics.find(t => t.grade === catalogHit.grade && t.position === catalogHit.position) : null)
              || dbMatchingTopic || null;
            const topicId = dbHit?.id || null;
            const subCode = r.subtopic_code || subtopicCode || null;
            const subHit = subCode && topicId
              ? subtopics.find(s => s.topic_id === topicId && String(s.code || '') === String(subCode))
              : null;
            return {
              subtopic_id: subHit?.id || null,
              subtopic_code: subCode,
              title: r.title_ru || r.title || `${taskTopicTitle} #${idx + 1}`,
              title_lv: r.title_lv || null,
              condition_latex: r.condition_latex_ru || r.condition_latex || '',
              condition_latex_lv: r.condition_latex_lv || null,
              answer_latex: r.answer_latex || null,
              answer_latex_lv: r.answer_latex_lv || null,
              solution_latex: r.solution_latex_ru || r.solution_latex || null,
              solution_latex_lv: r.solution_latex_lv || null,
              difficulty: diff,
              grade: g,
              topic_id: topicId,
              topic_title: taskTopicTitle,
              is_published: true
            };
          });

          openBulkDialog('import');
          const madeCount = generatedResults.length;
          const failLine = failures.length
            ? ` Не удалось получить ${failures.length}: ${failures.slice(0, 3).map(f => `#${f.index} — ${f.message.slice(0, 80)}`).join('; ')}${failures.length > 3 ? '…' : ''}`
            : '';
          bulkDialogTitle.textContent = `Сгенерировано задач: ${madeCount} из ${count}`;
          bulkDialogDesc.innerHTML = `Сгенерировано <strong>${madeCount}</strong> задач из ${count} по теме «${escapeHtml(topicTitle)}» (${easyCount} лёгких, ${medCount} средних, ${hardCount} сложных). Вы можете проверить JSON и нажать <strong>«Импортировать в базу»</strong>. Первая задача также перенесена в форму.${escapeHtml(failLine)}`;
          bulkDialogTextarea.value = JSON.stringify(tasksForBulk, null, 2);
          bulkDialogSubmit.textContent = `Импортировать все ${madeCount} задач в базу`;
          bulkDialogCopy.hidden = false;
          bulkDialogStatus.className = 'bulk-dialog-status success';
          bulkDialogStatus.className = failures.length ? 'bulk-dialog-status' : 'bulk-dialog-status success';
          bulkDialogStatus.innerHTML = `🎉 Сгенерировано: <strong>${madeCount}</strong> из ${count} (${easyCount} лёгких, ${medCount} средних, ${hardCount} сложных).${escapeHtml(failLine)}`;
          bulkDialogStatus.hidden = false;

          aiGenStatus.className = 'ai-gen-status success';
          aiGenStatus.className = failures.length ? 'ai-gen-status' : 'ai-gen-status success';
          aiGenStatus.innerHTML = `🎉 Готово: ${madeCount} из ${count} (${easyCount} лёгких, ${medCount} средних, ${hardCount} сложных). Открыто окно массового импорта.${escapeHtml(failLine)}`;
        }
      } catch (err) {
        if (generatedResults.length > 0) {
          // Partial results available — offer them
          aiGenStatus.className = 'ai-gen-status error';
          aiGenStatus.innerHTML = `⚠️ Ошибка на задаче ${generatedResults.length + 1}: ${err.message}. Но ${generatedResults.length} задач(а) уже готовы!`;

          const first = generatedResults[0];
          if (taskForm.elements.title) taskForm.elements.title.value = first.result.title_ru || first.result.title || '';
          if (taskForm.elements.title_lv) taskForm.elements.title_lv.value = first.result.title_lv || '';
          taskGradeSelect.value = String(g);
          updateTaskTopicDropdown();
          const dbMatchingTopic = topics.find(t => t.grade === g && (
            (t.slug && topicItem?.slug && t.slug === topicItem.slug) ||
            t.title.toLowerCase().includes(topicTitle.toLowerCase()) ||
            topicTitle.toLowerCase().includes(t.title.toLowerCase())
          ));
          if (dbMatchingTopic) topicSelect.value = String(dbMatchingTopic.id);
          taskForm.elements.difficulty.value = first.difficulty;
          conditionInput.value = first.result.condition_latex_ru || first.result.condition_latex || '';
          if (conditionInputLv) conditionInputLv.value = first.result.condition_latex_lv || '';
          answerInput.value = first.result.answer_latex || '';
          if (answerInputLv) answerInputLv.value = first.result.answer_latex_lv || '';
          solutionInput.value = first.result.solution_latex_ru || first.result.solution_latex || '';
          if (solutionInputLv) solutionInputLv.value = first.result.solution_latex_lv || '';
          updatePreviews();

          if (generatedResults.length > 1) {
            const tasksForBulk = generatedResults.map(({ result: r, difficulty: diff }, idx) => ({
              title: r.title_ru || r.title || `${topicTitle} #${idx + 1}`,
              title_lv: r.title_lv || null,
              condition_latex: r.condition_latex_ru || r.condition_latex || '',
              condition_latex_lv: r.condition_latex_lv || null,
              answer_latex: r.answer_latex || null,
              answer_latex_lv: r.answer_latex_lv || null,
              solution_latex: r.solution_latex_ru || r.solution_latex || null,
              solution_latex_lv: r.solution_latex_lv || null,
              difficulty: diff,
              grade: g,
              topic_id: dbMatchingTopic ? dbMatchingTopic.id : null,
              topic_title: topicTitle,
              is_published: true
            }));
            openBulkDialog('import');
            bulkDialogTitle.textContent = `Частично сгенерировано: ${generatedResults.length} из ${count}`;
            bulkDialogDesc.innerHTML = `Сгенерировано <strong>${generatedResults.length}</strong> задач до ошибки. Вы можете импортировать то, что получилось.`;
            bulkDialogTextarea.value = JSON.stringify(tasksForBulk, null, 2);
            bulkDialogSubmit.textContent = `Импортировать ${generatedResults.length} задач в базу`;
            bulkDialogCopy.hidden = false;
            bulkDialogStatus.className = 'bulk-dialog-status';
            bulkDialogStatus.innerHTML = `⚠️ Генерация прервана: ${err.message}`;
            bulkDialogStatus.hidden = false;
          }
        } else {
          aiGenStatus.className = 'ai-gen-status error';
          aiGenStatus.textContent = 'Ошибка генерации: ' + err.message;
        }
      } finally {
        btnRunAiGenerator.disabled = false;
        if (btnCancelAiGenerator) btnCancelAiGenerator.hidden = true;
        aiGenCancelled = false;
      }
    });
  }

  /* ── Загрузка ─────────────────────────────────────────────────────── */

  async function loadCatalog() {
    const [subjectResult, topicResult, subtopicResult] = await Promise.all([
      db.from('subjects').select('*').order('position').order('title'),
      db.from('topics').select(TOPIC_LIST_COLS).order('position').order('title'),
      /* Подтемы появляются миграцией 020. До неё запрос падает, и админка
         должна работать без третьего уровня, а не отказывать целиком. */
      db.from('subtopics').select('id,topic_id,title,title_lv,code,position').order('position')
    ]);
    /* Колонку tasks.subtopic_id разрешаем к записи только когда таблица
       подтем реально ответила: иначе до миграции 020 сохранение задачи
       упало бы на неизвестной колонке. */
    subtopics = subtopicResult?.error ? [] : (subtopicResult?.data || []);
    if (!subtopicResult?.error) supportedTaskCols.add('subtopic_id');
    if (subtopicSelect) subtopicSelect.title = subtopicResult?.error ? 'Недоступно: не выполнена миграция 020_subtopics.sql' : '';
    if (subjectResult.error || topicResult.error) {
      const message = (subjectResult.error || topicResult.error).message;
      subjectList.innerHTML = `<p class="admin-empty">Не удалось загрузить разделы: ${escapeHtml(message)}. Возможно, не применена миграция 002_subjects.sql.</p>`;
      return;
    }
    subjects = subjectResult.data || [];
    topics = topicResult.data || [];
    if (topics.length > 0 && topics[0]) {
      Object.keys(topics[0]).forEach(k => supportedTopicCols.add(k));
    }
    fillSubtopicTopicSelects();
    renderSubtopics();

    const keepSubject = subjectSelect.value;
    subjectSelect.innerHTML = '<option value="">Без раздела</option>' +
      subjects.map(subject => `<option value="${subject.id}">${escapeHtml(subject.title)}</option>`).join('');
    subjectSelect.value = keepSubject;

    const keepTopic = topicSelect.value;
    topicSelect.innerHTML = '<option value="">Без темы</option>' +
      topics.map(topic => `<option value="${topic.id}">${escapeHtml(topic.title)} (${gradeText(topic.grade)})</option>`).join('');
    topicSelect.value = keepTopic;

    if (!editingTopicId && !topicForm.elements.subject_id.value) {
      topicForm.elements.subject_id.value = String(subjects[0]?.id ?? '');
    }

    if (taskFilterGrade && taskFilterGrade.children.length <= 1) {
      fillGradeSelect(taskFilterGrade, 'Все классы', { numeric: true });
    }
    if (taskFilterTopic) {
      const keepFilterTopic = taskFilterTopic.value;
      taskFilterTopic.innerHTML = '<option value="">Все темы</option>' +
        topics.map(topic => `<option value="${topic.id}">${escapeHtml(topic.title)} (${gradeText(topic.grade)})</option>`).join('');
      taskFilterTopic.value = keepFilterTopic;
    }

    if (topicFilterGrade && topicFilterGrade.children.length <= 1) {
      fillGradeSelect(topicFilterGrade, 'Все классы', { numeric: true });
    }
    if (topicFilterSubject) {
      const keepSubject = topicFilterSubject.value;
      topicFilterSubject.innerHTML = '<option value="">Все разделы</option>' +
        subjects.map(sub => `<option value="${sub.id}">${escapeHtml(sub.title)}</option>`).join('');
      topicFilterSubject.value = keepSubject;
    }

    updateTaskTopicDropdown();
    updateFilterTopicDropdown();

    if (subtopicFormGrade && subtopicFormGrade.children.length <= 1) {
      fillGradeSelect(subtopicFormGrade, 'Все классы и курсы', { numeric: true });
    }
    if (subtopicFilterGrade && subtopicFilterGrade.children.length <= 1) {
      fillGradeSelect(subtopicFilterGrade, 'Все классы и курсы', { numeric: true });
    }

    renderSubjectList();
    renderTopicList();
    renderTaskList();
  }

  async function loadTaskIndex() {
    const { data, error } = await db.from('tasks').select(TASK_INDEX_COLS);
    if (!error) { taskIndex = data || []; return; }
    /* Колонка subtopic_id появляется миграцией 020. Без отката весь указатель
       оставался бы пустым, и у каждой темы значилось бы «задач: 0». */
    const retry = await db.from('tasks').select('id,topic_id,position');
    taskIndex = retry.error ? [] : (retry.data || []);
  }

  /* После правки всегда обновляем указатель, а список — только если
     администратор его уже открыл: иначе кнопка теряет смысл. */
  async function refreshTasks() {
    await loadTaskIndex();
    if (tasksLoaded) await loadTasks();
    else renderTopicList();
  }

  async function loadTasks() {
    let selectCols = TASK_LIST_COLS;
    if (tagsReady) selectCols += ',task_tags(tags(slug,title,title_lv))';
    const { data, error } = await db.from('tasks').select(selectCols).order('topic_id').order('position').order('created_at', { ascending: true });
    if (error) { taskList.innerHTML = `<p class="admin-empty">Не удалось загрузить задачи: ${escapeHtml(error.message)}</p>`; return; }
    tasks = data || [];
    tasksLoaded = true;
    setTasksShown(true);
    if (tasks.length > 0 && tasks[0]) {
      Object.keys(tasks[0]).forEach(k => supportedTaskCols.add(k));
    }
    renderTaskList();
    renderTopicList();
  }

  document.querySelectorAll('[data-sign-out]').forEach(button => button.addEventListener('click', async () => {
    if (db) await db.auth.signOut();
    location.href = 'index.html';
  }));

  (async () => {
    if (!db) { deny('Сервис недоступен: не настроено подключение к Supabase.'); return; }
    const { user, isAdmin } = await loadViewer();
    if (!user) { deny('Нужно войти в аккаунт администратора.'); return; }
    if (!isAdmin) { deny('У аккаунта нет прав администратора.'); return; }
    document.querySelector('#admin-email').textContent = user.email || '';
    gate.hidden = true;
    content.hidden = false;
    initCollapsibleSections();
    fillGradeSelect(document.querySelector('#topic-grade'), 'Без класса', { numeric: true });
    fillGradeSelect(document.querySelector('#task-grade'), 'Без класса', { numeric: true });
    if (subtopicFormGrade) fillGradeSelect(subtopicFormGrade, 'Все классы и курсы', { numeric: true });
    if (subtopicFilterGrade) fillGradeSelect(subtopicFilterGrade, 'Все классы и курсы', { numeric: true });
    setSubjectMode(null);
    setTopicMode(null);
    setTaskMode(null);
    await detectMultilingualColumns();
    await detectHintColumn();
    markLatvianFieldsUnavailable();
    // Возвращаем режим сортировки, выбранный в прошлый раз.
    const savedSort = loadSort();
    if (taskFilterSort && savedSort.tasks) taskFilterSort.value = savedSort.tasks;
    if (topicFilterSort && savedSort.topics) topicFilterSort.value = savedSort.topics;
    /* Раньше эти три вызова шли по очереди, и органы управления
       генератором включались последними — после того как приезжали все
       задачи и темы целиком. Теперь запросы идут параллельно, задачи
       представлены лёгким указателем, а сам список ждёт кнопки. */
    await Promise.all([
      detectTagsSupport(),
      loadSkola2030Catalog(),
      loadCatalog(),
      loadTaskIndex()
    ]);
    renderTopicList();
  })();
})();
