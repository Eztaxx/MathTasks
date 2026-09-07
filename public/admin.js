(() => {
  const { db, escapeHtml, makeSlug, loadViewer, renderMath, fillGradeSelect } = window.MathTasks;
  const gate = document.querySelector('#admin-gate');
  const content = document.querySelector('#admin-content');
  const subjectForm = document.querySelector('#subject-form');
  const topicForm = document.querySelector('#topic-form');
  const taskForm = document.querySelector('#task-form');
  const subjectSelect = document.querySelector('#subject-select');
  const topicSelect = document.querySelector('#topic-select');
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
  const btnImportTasks = document.querySelector('#btn-import-tasks');
  const bulkFileInput = document.querySelector('#bulk-file-input');
  const bulkDialogFileInput = document.querySelector('#bulk-dialog-file-input');
  const btnUploadFileTasks = document.querySelector('#btn-upload-file-tasks');
  const bulkDialogPickFileBtn = document.querySelector('#bulk-dialog-pick-file-btn');
  const bulkDialogTemplateBtn = document.querySelector('#bulk-dialog-template-btn');
  const aiGenCount = document.querySelector('#ai-gen-count');

  const btnToggleMathGuide = document.querySelector('#btn-toggle-math-guide');
  const btnCloseMathGuide = document.querySelector('#btn-close-math-guide');
  const mathGuideCard = document.querySelector('#math-guide-card');

  const btnToggleSampleJson = document.querySelector('#btn-toggle-sample-json');
  const btnCloseSampleJson = document.querySelector('#btn-close-sample-json');
  const btnCopySampleJson = document.querySelector('#btn-copy-sample-json');
  const btnInsertSampleToDialog = document.querySelector('#btn-insert-sample-to-dialog');
  const jsonSampleCard = document.querySelector('#json-sample-card');
  const jsonSampleCode = document.querySelector('#json-sample-code');

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
  const TASK_INDEX_COLS = 'id,topic_id,position';

  /* Указатель — три колонки на задачу (3 КБ на 81 задачу). Его хватает,
     чтобы показать «задач: N» у темы и посчитать номер новой задачи,
     поэтому сам список можно не грузить, пока его не попросят. */
  let taskIndex = [];
  let tasksLoaded = false;
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
    ['title_lv', 'condition_latex_lv', 'solution_latex_lv'].forEach(c => supportedTaskCols.add(c));
    supportedSubjectCols.add('title_lv');
  }

  /* Пока миграции нет, поля LV выглядят рабочими, но введённое молча
     отбрасывается санитайзером. Честнее сказать об этом прямо в форме. */
  function markLatvianFieldsUnavailable() {
    if (multilingualReady) return;
    const ids = ['subject-title-lv', 'topic-title-lv', 'topic-desc-lv', 'title-input-lv', 'condition-input-lv', 'solution-input-lv'];
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

  /* ── Разделы ──────────────────────────────────────────────────────── */

  function setSubjectMode(subject) {
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

  /* Соседи темы — темы того же класса в том же разделе: именно внутри
     этой пары идёт нумерация, поэтому и стрелки переставляют внутри неё. */
  const topicSiblingsOf = topic => topics
    .filter(t => (t.grade ?? null) === (topic.grade ?? null)
              && (t.subject_id ?? null) === (topic.subject_id ?? null))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id - b.id);

  /* После перестановки перенумеровываем группу подряд: у старых тем
     позиции могли совпадать, и простой обмен значениями ничего бы не дал. */
  async function moveTopic(topicId, direction) {
    const topic = topics.find(t => String(t.id) === String(topicId));
    if (!topic) return;
    const siblings = topicSiblingsOf(topic);
    const from = siblings.findIndex(t => t.id === topic.id);
    const to = direction === 'up' ? from - 1 : from + 1;
    if (to < 0 || to >= siblings.length) return;
    siblings.splice(to, 0, siblings.splice(from, 1)[0]);

    const updates = siblings
      .map((item, index) => ({ item, position: index + 1 }))
      .filter(({ item, position }) => item.position !== position);
    for (const { item, position } of updates) {
      const { error } = await db.from('topics').update({ position }).eq('id', item.id);
      if (error) { topicSuccess.textContent = 'Ошибка: ' + error.message; return; }
    }
    topicSuccess.textContent = 'Порядок тем изменён.';
    await loadCatalog();
  }

  /* Новая тема встаёт в конец своей группы, а не в начало: иначе
     каждая добавленная тема оказывалась бы выше всех уже расставленных. */
  function nextTopicPosition(grade, subjectId, rawValue) {
    const typed = Number(rawValue);
    if (editingTopicId && Number.isFinite(typed) && typed >= 1) return typed;
    if (Number.isFinite(typed) && typed >= 1) return typed;
    const siblings = topicSiblingsOf({ grade, subject_id: subjectId });
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
      return `<div class="admin-row">
        <span class="admin-row-main"><strong><span class="admin-row-num">${Math.max(1, topic.position ?? 1)}.</span> ${escapeHtml(topic.title)}</strong><small>${escapeHtml(subjectTitle(topic.subject_id))} · ${gradeText(topic.grade)} · задач: ${count}</small>${warning}</span>
        ${topicArrows(topic)}
        <button class="text-button" type="button" data-edit-topic="${topic.id}">Изменить</button>
        <button class="text-button danger" type="button" data-delete-topic="${topic.id}">Удалить</button>
      </div>`;
    }).join('');
  }

  topicForm.addEventListener('submit', async event => {
    event.preventDefault();
    topicSuccess.textContent = '';
    const form = new FormData(topicForm);
    const title = form.get('title').trim();
    const payload = sanitizeTopicPayload({
      title,
      title_lv: form.get('title_lv')?.trim() || null,
      subject_id: form.get('subject_id') ? Number(form.get('subject_id')) : null,
      grade: parseFormGrade(form.get('grade')),
      position: nextTopicPosition(parseFormGrade(form.get('grade')), form.get('subject_id') ? Number(form.get('subject_id')) : null, form.get('position')),
      description: form.get('description')?.trim() || null,
      description_lv: form.get('description_lv')?.trim() || null,
    });
    const { error } = editingTopicId
      ? await db.from('topics').update(payload).eq('id', editingTopicId)
      : await db.from('topics').insert({ ...payload, slug: `${makeSlug(title)}-${Date.now()}` });
    if (error) { topicSuccess.textContent = 'Ошибка: ' + error.message; return; }
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
    if (String(editingTopicId) === deleteId) { topicForm.reset(); setTopicMode(null); }
    topicSuccess.textContent = 'Тема удалена.';
    await loadCatalog();
  });

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
  [conditionInput, answerInput, solutionInput, conditionInputLv, solutionInputLv, hintInput, hintInputLv]
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

    const candidateModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
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
            const cleanJson = candidateText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (Array.isArray(parsed) && parsed.length === texts.length) {
              return parsed;
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
    const fields = toLv
      ? [[taskForm.elements.title, taskForm.elements.title_lv],
         [conditionInput, conditionInputLv],
         [solutionInput, solutionInputLv]]
      : [[taskForm.elements.title_lv, taskForm.elements.title],
         [conditionInputLv, conditionInput],
         [solutionInputLv, solutionInput]];

    const [titleField, conditionField] = [fields[0][0], fields[1][0]];
    if (!titleField?.value.trim() && !conditionField?.value.trim()) {
      taskSuccess.textContent = toLv
        ? 'Сначала заполните название или условие на русском.'
        : 'Сначала заполните название или условие на латышском.';
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

  taskGradeSelect?.addEventListener('change', () => {
    updateTaskTopicDropdown();
  });

  // Класс обычно совпадает с классом темы — подставляем, но не запрещаем менять.
  topicSelect.addEventListener('change', () => {
    if (topicSelect.value === '__all__') {
      topicSelect.innerHTML = '<option value="">Без темы</option>' +
        topics.map(t => `<option value="${t.id}">${escapeHtml(t.title)} (${gradeText(t.grade)})</option>`).join('');
      return;
    }
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
    editingTaskId = task?.id ?? null;
    document.querySelector('#task-form-title').textContent = task ? `Редактировать задачу: ${task.title}` : 'Создание и редактирование задачи';
    document.querySelector('#task-submit').textContent = task ? 'Сохранить задачу' : 'Добавить задачу';
    document.querySelector('#task-cancel').hidden = !task;
    taskForm.elements.title.value = task?.title || '';
    if (taskForm.elements.title_lv) taskForm.elements.title_lv.value = task?.title_lv || '';
    taskForm.elements.grade.value = toAdminGradeVal(task?.grade);
    updateTaskTopicDropdown(task?.topic_id);
    taskForm.elements.topic_id.value = task?.topic_id ? String(task.topic_id) : '';
    taskForm.elements.difficulty.value = task?.difficulty || 'Средний';
    taskForm.elements.position.value = task?.position ?? 0;
    conditionInput.value = task?.condition_latex || '';
    if (conditionInputLv) conditionInputLv.value = task?.condition_latex_lv || '';
    answerInput.value = task?.answer_latex || '';
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
      case 'difficulty':
        return copy.sort((a, b) =>
          (DIFFICULTY_RANK[a.difficulty] || 9) - (DIFFICULTY_RANK[b.difficulty] || 9)
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
        (task.condition_image || task.solution_image) ? '<span class="admin-status-badge info">🖼️ С чертежом</span>' : '',
        difficultyBadge(task.difficulty),
        tagBadges
      ].filter(Boolean).join('');

      return `<div class="admin-row">
        ${arrows}
        <div class="admin-row-main">
          <strong>${escapeHtml(task.title)}</strong>
          <small>${escapeHtml(topic?.title || 'Без темы')} · ${escapeHtml(gradeText(grade))} · №${task.position ?? 0}</small>
          <div class="admin-badge-group">${badges}</div>
        </div>
        <button class="text-button" type="button" data-edit-task="${task.id}" title="Редактировать">Изменить</button>
        <button class="text-button" type="button" data-clone-task="${task.id}" title="Создать копию задачи в форме (4.2)">Клонировать</button>
        <button class="text-button danger" type="button" data-delete-task="${task.id}" title="Удалить">Удалить</button>
      </div>`;
    }).join('');
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
    const payload = sanitizeTaskPayload({
      title: form.get('title').trim(),
      title_lv: form.get('title_lv')?.trim() || null,
      condition_latex: conditionInput.value.trim(),
      condition_latex_lv: conditionInputLv?.value.trim() || null,
      answer_latex: answerInput.value.trim() || null,
      hint_latex: hintInput?.value.trim() || null,
      hint_latex_lv: hintInputLv?.value.trim() || null,
      solution_latex: solutionInput.value.trim() || null,
      solution_latex_lv: solutionInputLv?.value.trim() || null,
      condition_image: images.condition.current,
      solution_image: images.solution.current,
      difficulty: form.get('difficulty'),
      position: nextPosition(topicId, form.get('position')),
      grade: parseFormGrade(form.get('grade')),
      topic_id: topicId,
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
      taskForm.elements.title.value = `[Копия] ${source.title}`;
      if (taskForm.elements.title_lv) taskForm.elements.title_lv.value = source.title_lv ? `[Kopija] ${source.title_lv}` : '';
      taskForm.elements.topic_id.value = source.topic_id ? String(source.topic_id) : '';
      taskForm.elements.grade.value = toAdminGradeVal(source.grade);
      taskForm.elements.difficulty.value = source.difficulty || 'Средний';
      taskForm.elements.position.value = nextPosition(source.topic_id, null);
      conditionInput.value = source.condition_latex || '';
      if (conditionInputLv) conditionInputLv.value = source.condition_latex_lv || '';
      answerInput.value = source.answer_latex || '';
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
      document.querySelector('#task-form-title').textContent = `Клонирование: ${source.title}`;
      document.querySelector('#task-submit').textContent = 'Добавить задачу (сохранить копию)';
      document.querySelector('#task-cancel').hidden = false;
      taskSuccess.textContent = '✨ Черновик копии задачи создан. Измените параметры и нажмите «Добавить задачу».';
      taskForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const deleteId = event.target.closest('[data-delete-task]')?.dataset.deleteTask;
    if (!deleteId) return;
    const task = tasks.find(item => String(item.id) === deleteId);
    const label = task ? `«${task.title}»` : 'выбранную задачу';
    if (!confirm(`Удалить ${label}? Это действие необратимо.`)) return;
    const { error } = await db.from('tasks').delete().eq('id', deleteId);
    if (error) { taskSuccess.textContent = 'Ошибка: ' + error.message; return; }
    // Задачи нет — её чертежам в бакете делать нечего.
    await removeFile(task.condition_image);
    await removeFile(task.solution_image);
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
    if (mode === 'export') {
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
      bulkDialogTitle.textContent = 'Массовый импорт задач (JSON)';
      bulkDialogDesc.innerHTML = 'Загрузите <code>.json</code> файл или вставьте массив. Недостающие темы создаются автоматически. Обязательны только <code>title</code> и <code>condition_latex</code>, остальное — по желанию. Кнопка «Вставить образец» подставляет одну задачу со всеми полями сразу: латышские версии, подсказка, теги, сложность и порядок.';
      bulkDialogTextarea.value = '';
      bulkDialogTextarea.placeholder = 'Вставьте сюда массив JSON или нажмите «Вставить образец».';
      /* Словарь тегов закрытый, и угадать слаг невозможно — показываем
         его прямо под полем, рядом с местом, где его вводят. */
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

  /* ── Парсер JSON с поддержкой нескольких тем и задач ────────────── */
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
    const normalizedTasks = [];

    for (const item of parsed) {
      if (!item) continue;
      // Вариант 1: Объект темы со вложенным списком задач tasks: [...]
      if (Array.isArray(item.tasks)) {
        const topicInfo = {
          title: String(item.topic_title || item.title || item.name || '').trim(),
          title_lv: item.topic_title_lv || item.title_lv ? String(item.topic_title_lv || item.title_lv).trim() : null,
          grade: parseFormGrade(item.grade),
          subject_id: item.subject_id ? Number(item.subject_id) : null,
          description: item.description ? String(item.description).trim() : null,
          description_lv: item.description_lv ? String(item.description_lv).trim() : null
        };
        if (topicInfo.title) {
          normalizedTopics.push(topicInfo);
        }
        for (const t of item.tasks) {
          if (!t) continue;
          normalizedTasks.push({
            ...t,
            topic_title: t.topic_title || topicInfo.title,
            topic_title_lv: t.topic_title_lv || topicInfo.title_lv,
            grade: t.grade !== undefined ? parseFormGrade(t.grade) : topicInfo.grade,
            subject_id: t.subject_id ? Number(t.subject_id) : topicInfo.subject_id
          });
        }
      } else {
        // Вариант 2: Плоская задача со свойством topic_title или topic
        const t = item;
        const topicTitle = String(t.topic_title || t.topic || '').trim();
        if (topicTitle) {
          normalizedTopics.push({
            title: topicTitle,
            title_lv: t.topic_title_lv ? String(t.topic_title_lv).trim() : null,
            grade: parseFormGrade(t.grade),
            subject_id: t.subject_id ? Number(t.subject_id) : null,
            description: null,
            description_lv: null
          });
        }
        normalizedTasks.push(t);
      }
    }

    // Уникальные темы по названию
    const uniqueTopics = [];
    const seen = new Set();
    for (const top of normalizedTopics) {
      const key = top.title.toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        uniqueTopics.push(top);
      }
    }

    return { uniqueTopics, tasks: normalizedTasks };
  }

  btnExportTasks?.addEventListener('click', () => { openBulkDialog('export').catch(e => console.error('экспорт:', e)); });
  btnImportTasks?.addEventListener('click', () => { openBulkDialog('import').catch(e => console.error('импорт:', e)); });
  bulkDialogClose?.addEventListener('click', () => bulkDialog?.close());
  bulkDialogCancel?.addEventListener('click', () => bulkDialog?.close());

  // Выбор файла .json с диска
  const handleBulkFile = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target.result;
      openBulkDialog('import');
      bulkDialogTextarea.value = content;
      try {
        const { uniqueTopics, tasks: parsedTasks } = parseMultiTopicJson(content);
        bulkDialogStatus.className = 'bulk-dialog-status success';
        bulkDialogStatus.innerHTML = `📁 Файл <strong>${escapeHtml(file.name)}</strong> загружен!<br>` +
          `Обнаружено тем: <strong>${uniqueTopics.length}</strong>, задач: <strong>${parsedTasks.length}</strong>.<br>` +
          `Нажмите <strong>«Импортировать в базу»</strong>, чтобы сохранить данные в Supabase.`;
        bulkDialogStatus.hidden = false;
      } catch (err) {
        bulkDialogStatus.className = 'bulk-dialog-status error';
        bulkDialogStatus.textContent = 'Ошибка синтаксиса JSON в выбранном файле: ' + err.message;
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

  // Шаблон формата с несколькими темами
  bulkDialogTemplateBtn?.addEventListener('click', () => {
    const sampleData = [
      {
        "topic_title": "Квадратные уравнения",
        "topic_title_lv": "Kvadrātvienādojumi",
        "grade": 8,
        "tasks": [
          {
            "title": "Неполное квадратное уравнение",
            "title_lv": "Nepilns kvadrātvienādojums",
            "condition_latex": "Решите уравнение $x^2 - 9 = 0$.",
            "condition_latex_lv": "Atrisiniet vienādojumu $x^2 - 9 = 0$.",
            "answer_latex": "$x = \\pm 3$",
            "solution_latex": "Разложим на множители разность квадратов:\n$$(x - 3)(x + 3) = 0$$\nОткуда $x_1 = 3,\\; x_2 = -3$.",
            "solution_latex_lv": "Sadalām reizinātājos kvadrātu starpību:\n$$(x - 3)(x + 3) = 0$$\nTātad $x_1 = 3,\\; x_2 = -3$.",
            "tags": ["vienadojumi", "algebriskie-parveidojumi"],
            "difficulty": "Лёгкий",
            "is_published": true
          },
          {
            "title": "Полное квадратное уравнение",
            "title_lv": "Pilns kvadrātvienādojums",
            "condition_latex": "Решите уравнение $x^2 - 5x + 6 = 0$.",
            "condition_latex_lv": "Atrisiniet vienādojumu $x^2 - 5x + 6 = 0$.",
            "answer_latex": "$x_1 = 2,\\; x_2 = 3$",
            "solution_latex": "По формуле корней через дискриминант:\n$$D = (-5)^2 - 4 \\cdot 1 \\cdot 6 = 25 - 24 = 1$$\n$$x = \\frac{5 \\pm \\sqrt{1}}{2} \\implies x_1 = 2,\\; x_2 = 3$$",
            "solution_latex_lv": "Pēc sakņu formulas ar diskriminantu:\n$$D = (-5)^2 - 4 \\cdot 1 \\cdot 6 = 25 - 24 = 1$$\n$$x = \\frac{5 \\pm \\sqrt{1}}{2} \\implies x_1 = 2,\\; x_2 = 3$$",
            "tags": ["vienadojumi"],
            "difficulty": "Средний",
            "is_published": true
          }
        ]
      },
      {
        "topic_title": "Теорема Пифагора",
        "topic_title_lv": "Pitagora teorēma",
        "grade": 8,
        "tasks": [
          {
            "title": "Нахождение гипотенузы треугольника",
            "title_lv": "Taisnleņķa trijstūra hipotenūzas aprēķināšana",
            "condition_latex": "В прямоугольном треугольнике катеты равны $a = 3\\text{ см}$ и $b = 4\\text{ см}$. Найдите длину гипотенузы $c$.",
            "condition_latex_lv": "Taisnleņķa trijstūrī katetes ir $a = 3\\text{ cm}$ un $b = 4\\text{ cm}$. Aprēķiniet hipotenūzas $c$ garumu.",
            "answer_latex": "$c = 5\\text{ см}$",
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
    bulkDialogStatus.className = 'bulk-dialog-status';
    bulkDialogStatus.innerHTML = '📋 Образец формата с 2 темами и 3 задачами вставлен в поле. Нажмите «Импортировать в базу» для добавления.';
    bulkDialogStatus.hidden = false;
  });

  // Подсчёт тем и задач при вводе в поле
  bulkDialogTextarea?.addEventListener('input', () => {
    if (bulkMode !== 'import') return;
    const val = bulkDialogTextarea.value.trim();
    if (!val) {
      bulkDialogStatus.hidden = true;
      return;
    }
    try {
      const { uniqueTopics, tasks: parsedTasks } = parseMultiTopicJson(val);
      if (parsedTasks.length > 0) {
        bulkDialogStatus.className = 'bulk-dialog-status';
        bulkDialogStatus.innerHTML = `📊 Введено: тем: <strong>${uniqueTopics.length}</strong>, задач: <strong>${parsedTasks.length}</strong>. Нажмите «Импортировать в базу».`;
        bulkDialogStatus.hidden = false;
      }
    } catch {
      // Игнорируем промежуточные синтаксические ошибки при ручном наборе
    }
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
    try {
      await navigator.clipboard.writeText(bulkDialogTextarea.value);
      bulkDialogStatus.className = 'bulk-dialog-status success';
      bulkDialogStatus.textContent = '✓ JSON скопирован в буфер обмена!';
      bulkDialogStatus.hidden = false;
    } catch {
      bulkDialogTextarea.select();
      document.execCommand('copy');
      bulkDialogStatus.className = 'bulk-dialog-status success';
      bulkDialogStatus.textContent = '✓ JSON скопирован в буфер обмена!';
      bulkDialogStatus.hidden = false;
    }
  });

  bulkDialogSubmit?.addEventListener('click', async () => {
    if (bulkMode === 'export') {
      const blob = new Blob([bulkDialogTextarea.value], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `math-tasks-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      bulkDialogStatus.className = 'bulk-dialog-status success';
      bulkDialogStatus.textContent = '✓ Файл tasks-export.json сохранён!';
      bulkDialogStatus.hidden = false;
      return;
    }

    // Режим импорта
    bulkDialogStatus.hidden = true;
    const raw = bulkDialogTextarea.value.trim();
    if (!raw) {
      bulkDialogStatus.className = 'bulk-dialog-status error';
      bulkDialogStatus.textContent = 'Вставьте JSON или выберите файл для импорта.';
      bulkDialogStatus.hidden = false;
      return;
    }

    let parsedResult;
    try {
      parsedResult = parseMultiTopicJson(raw);
    } catch (e) {
      bulkDialogStatus.className = 'bulk-dialog-status error';
      bulkDialogStatus.textContent = 'Ошибка формата JSON: ' + e.message;
      bulkDialogStatus.hidden = false;
      return;
    }

    const { uniqueTopics, tasks: items } = parsedResult;
    if (!items.length) {
      bulkDialogStatus.className = 'bulk-dialog-status error';
      bulkDialogStatus.textContent = 'В JSON не найдено задач для импорта.';
      bulkDialogStatus.hidden = false;
      return;
    }

    bulkDialogSubmit.disabled = true;
    bulkDialogSubmit.textContent = 'Импортируем в Supabase…';

    let createdTopicsCount = 0;
    const errors = [];

    // 1. Создаём недостающие темы в Supabase
    for (const top of uniqueTopics) {
      const titleKey = top.title.toLowerCase();
      let existing = topics.find(t => t.title.toLowerCase() === titleKey);
      if (!existing) {
        let targetSubjectId = top.subject_id;
        if (!targetSubjectId && (top.subject_slug || top.subject_title)) {
          const foundSubj = subjects.find(s =>
            (top.subject_slug && s.slug?.toLowerCase() === top.subject_slug.toLowerCase()) ||
            (top.subject_title && s.title?.toLowerCase() === top.subject_title.toLowerCase())
          );
          if (foundSubj) targetSubjectId = foundSubj.id;
        }
        if (!targetSubjectId) targetSubjectId = subjects[0]?.id || null;

        const newTopicPayload = sanitizeTopicPayload({
          title: top.title,
          title_lv: top.title_lv || null,
          subject_id: targetSubjectId,
          grade: top.grade,
          position: 0,
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

    // 2. Добавляем задачи
    let successCount = 0;
    const warnings = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.title || !item.condition_latex) {
        errors.push(`Задача #${i + 1}: отсутствует title или condition_latex`);
        continue;
      }
      let topicId = item.topic_id || null;
      if (!topicId && item.topic_title) {
        const foundTopic = topics.find(t => t.title.toLowerCase() === String(item.topic_title).trim().toLowerCase());
        if (foundTopic) topicId = foundTopic.id;
      }

      const payload = sanitizeTaskPayload({
        title: String(item.title).trim(),
        title_lv: item.title_lv ? String(item.title_lv).trim() : null,
        condition_latex: String(item.condition_latex).trim(),
        condition_latex_lv: item.condition_latex_lv ? String(item.condition_latex_lv).trim() : null,
        answer_latex: item.answer_latex ? String(item.answer_latex).trim() : null,
        solution_latex: item.solution_latex ? String(item.solution_latex).trim() : null,
        solution_latex_lv: item.solution_latex_lv ? String(item.solution_latex_lv).trim() : null,
        hint_latex: item.hint_latex ? String(item.hint_latex).trim() : null,
        condition_image: item.condition_image ? String(item.condition_image).trim() : null,
        solution_image: item.solution_image ? String(item.solution_image).trim() : null,
        hint_latex_lv: item.hint_latex_lv ? String(item.hint_latex_lv).trim() : null,
        difficulty: item.difficulty || 'Средний',
        grade: parseFormGrade(item.grade),
        topic_id: topicId,
        position: item.position !== undefined ? Number(item.position) : nextPosition(topicId, null),
        is_published: item.is_published !== undefined ? Boolean(item.is_published) : true
      });

      const { data: insertedTask, error } = await db.from('tasks').insert(payload).select('id').maybeSingle();
      if (error) {
        errors.push(`Задача #${i + 1} («${item.title}»): ${error.message}`);
      } else {
        successCount++;
        const newTaskId = insertedTask?.id;
        // Привязываем кросс-теги Skola2030 если они переданы в массиве tags
        if (newTaskId && Array.isArray(item.tags) && item.tags.length) {
          if (!tagsReady) {
            warnings.push(`Задача «${item.title}»: теги не сохранены — не выполнена миграция 010_cross_tags.sql.`);
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
              warnings.push(`Задача «${item.title}»: неизвестные теги — ${unknown.join(', ')}. Допустимые слаги перечислены под полем ввода.`);
            }
            if (matched.length > 3) {
              warnings.push(`Задача «${item.title}»: тегов больше трёх, сохранены первые три (${matched.slice(0, 3).map(t => t.slug).join(', ')}).`);
            }
            const tagInserts = matched.slice(0, 3).map(t => ({ task_id: newTaskId, tag_id: t.id }));
            if (tagInserts.length) {
              const { error: tagErr } = await db.from('task_tags').insert(tagInserts);
              if (tagErr) warnings.push(`Задача «${item.title}»: теги не сохранены — ${tagErr.message}`);
            }
          } catch (tErr) {
            warnings.push(`Задача «${item.title}»: ошибка сохранения тегов — ${tErr.message}`);
          }
        }
      }
    }

    bulkDialogSubmit.disabled = false;
    bulkDialogSubmit.textContent = 'Импортировать в базу';

    const warnBlock = warnings.length
      ? `<br><br><strong>Предупреждения (${warnings.length}):</strong><br>${warnings.slice(0, 12).map(escapeHtml).join('<br>')}${warnings.length > 12 ? '<br>…' : ''}`
      : '';

    if (errors.length) {
      bulkDialogStatus.className = 'bulk-dialog-status ' + (successCount > 0 ? 'warning' : 'error');
      bulkDialogStatus.innerHTML = `Обработано тем: <strong>${uniqueTopics.length}</strong> (создано новых: ${createdTopicsCount}).<br>` +
        `Успешно сохранено задач: <strong>${successCount}</strong> из ${items.length}.<br>` + warnBlock +
        `Ошибки:<br>${errors.map(escapeHtml).join('<br>')}`;
      bulkDialogStatus.hidden = false;
    } else {
      bulkDialogStatus.className = 'bulk-dialog-status success';
      bulkDialogStatus.innerHTML = `🎉 Успешно импортировано! Тем обработано: <strong>${uniqueTopics.length}</strong> (создано новых: ${createdTopicsCount}), задач сохранено: <strong>${successCount}</strong> из ${items.length}!` + warnBlock;
      bulkDialogStatus.hidden = false;
      setTimeout(() => bulkDialog?.close(), 2200);
    }

    await loadCatalog();
    await refreshTasks();
  });

  /* ── Skola2030 Помощник тем и AI Генератор задач ────────────────── */
  const skolaPresetGrade = document.querySelector('#skola-preset-grade');
  const skolaPresetTopic = document.querySelector('#skola-preset-topic');
  const btnApplySkolaPreset = document.querySelector('#btn-apply-skola-preset');
  const btnBatchSeedTopics = document.querySelector('#btn-batch-seed-topics');
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
  const topicListCloseBottom = document.querySelector('#topic-list-close-bottom');
  const taskListCloseTop = document.querySelector('#task-list-close');
  const taskListCloseBottom = document.querySelector('#task-list-close-bottom');

  function setTopicsShown(shown) {
    topicsShown = shown;
    if (topicListDefer) topicListDefer.hidden = shown;
    if (topicList) topicList.hidden = !shown;
    if (topicListCloseTop) topicListCloseTop.hidden = !shown;
    if (topicListCloseBottom) topicListCloseBottom.hidden = !shown;
    if (shown) renderTopicList();
  }

  function setTasksShown(shown) {
    if (taskListDefer) taskListDefer.hidden = shown;
    if (taskList) taskList.hidden = !shown;
    if (taskListCloseTop) taskListCloseTop.hidden = !shown;
    if (taskListCloseBottom) taskListCloseBottom.hidden = !shown;
  }

  document.querySelector('#btn-load-topics')?.addEventListener('click', () => setTopicsShown(true));
  document.querySelector('#btn-hide-topics')?.addEventListener('click', () => setTopicsShown(false));
  document.querySelector('#btn-hide-topics-bottom')?.addEventListener('click', () => setTopicsShown(false));
  document.querySelector('#btn-hide-tasks')?.addEventListener('click', () => setTasksShown(false));
  document.querySelector('#btn-hide-tasks-bottom')?.addEventListener('click', () => setTasksShown(false));

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
  const aiGenStatus = document.querySelector('#ai-gen-status');
  const btnToggleAiSettings = document.querySelector('#btn-toggle-ai-settings');
  const aiSettingsCard = document.querySelector('#ai-settings-card');
  const aiEngineSelect = document.querySelector('#ai-engine-select');
  const geminiKeyWrap = document.querySelector('#gemini-key-wrap');
  const aiGeminiKey = document.querySelector('#ai-gemini-key');
  const btnSaveGeminiKey = document.querySelector('#btn-save-gemini-key');

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
    checkSkolaTopicsSeeded();
  }

  function checkSkolaTopicsSeeded() {
    if (!btnBatchSeedTopics) return;
    const isSeeded = topics.length >= 81 || (skola2030Catalog.length > 0 && skola2030Catalog.every(ct => topics.some(t => t.slug === ct.slug || t.title.toLowerCase() === ct.title_ru.toLowerCase())));
    // Кнопку загрузки прячем, когда всё уже залито; отдельной плашки об этом
    // не показываем — она только занимала место в шапке блока.
    btnBatchSeedTopics.hidden = isSeeded;
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
    if (!skolaPresetGrade || !skolaPresetTopic) return;
    fillGradeSelect(skolaPresetGrade, 'Все классы и курсы', { numeric: true });

    createRichSelect(skolaPresetGrade, {
      searchable: false,
      renderItem(val, text) {
        const g = parseFormGrade(val);
        if (g === null) return { main: 'Все классы и курсы', sub: 'Полный каталог Skola2030 (81 тема)' };
        const gradePrefix = g <= 9 ? `${g}. klase (${g} класс)` : (g === 10 ? 'Vispārīgais (10 кл)' : (g === 11 ? 'Matemātika I (11 кл)' : 'Matemātika II (12 кл)'));
        return { main: gradePrefix, sub: '' };
      }
    });

    function refreshPresetTopics() {
      const g = parseFormGrade(skolaPresetGrade.value);
      const list = g !== null ? skola2030Catalog.filter(t => t.grade === g) : skola2030Catalog;
      skolaPresetTopic.innerHTML = list.length
        ? list.map(t => {
            const gradePrefix = t.grade <= 9 ? `${t.grade} кл` : (t.grade === 10 ? 'Vispārīgais' : (t.grade === 11 ? 'Matemātika I' : 'Matemātika II'));
            return `<option value="${t.slug}">${gradePrefix}: ${escapeHtml(t.title_ru)} (${escapeHtml(t.title_lv)})</option>`;
          }).join('')
        : '<option value="">Тем не найдено</option>';

      createRichSelect(skolaPresetTopic, {
        searchable: true,
        renderItem(slug) {
          const t = skola2030Catalog.find(item => item.slug === slug);
          if (t) {
            const gradePrefix = t.grade <= 9 ? `${t.grade} кл` : (t.grade === 10 ? 'Visp' : (t.grade === 11 ? 'Opt' : 'Augst'));
            return {
              main: `[${gradePrefix}] ${t.title_ru}`,
              sub: t.title_lv,
              triggerHtml: `[${gradePrefix}] ${escapeHtml(t.title_ru)} <span class="cs-sub">${escapeHtml(t.title_lv)}</span>`
            };
          }
          return { main: slug, sub: '' };
        }
      });
    }

    skolaPresetGrade.addEventListener('change', refreshPresetTopics);
    refreshPresetTopics();
    checkSkolaTopicsSeeded();

    btnApplySkolaPreset?.addEventListener('click', () => {
      const slug = skolaPresetTopic.value;
      const topicData = skola2030Catalog.find(t => t.slug === slug);
      if (!topicData) return;

      topicForm.elements.title.value = topicData.title_ru;
      if (topicForm.elements.title_lv) topicForm.elements.title_lv.value = topicData.title_lv;
      topicForm.elements.grade.value = String(topicData.grade);

      const matchingSubj = subjects.find(s => s.slug === topicData.subject_slug) || subjects[0];
      if (matchingSubj) topicForm.elements.subject_id.value = String(matchingSubj.id);

      topicForm.elements.position.value = topicData.position || 0;
      topicForm.elements.description.value = topicData.description_ru || '';
      if (topicForm.elements.description_lv) topicForm.elements.description_lv.value = topicData.description_lv || '';

      skolaPresetStatus.className = 'skola-preset-status success';
      skolaPresetStatus.textContent = `✨ Тема «${topicData.title_ru}» успешно заполнена в форме! Нажмите «Добавить тему».`;
      skolaPresetStatus.hidden = false;
      setTimeout(() => { skolaPresetStatus.hidden = true; }, 5000);
      topicForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    btnBatchSeedTopics?.addEventListener('click', async () => {
      if (!skola2030Catalog.length) {
        alert('Каталог Skola2030 ещё загружается. Подождите пару секунд.');
        return;
      }
      if (!confirm(`Импортировать все ${skola2030Catalog.length} тем стандарта Skola2030 в базу данных Supabase?`)) return;

      btnBatchSeedTopics.disabled = true;
      skolaPresetStatus.className = 'skola-preset-status';
      skolaPresetStatus.textContent = `⏳ Загрузка тем в базу Supabase (0 из ${skola2030Catalog.length})…`;
      skolaPresetStatus.hidden = false;

      let insertedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < skola2030Catalog.length; i++) {
        const item = skola2030Catalog[i];
        const matchingSubj = subjects.find(s => s.slug === item.subject_slug) || subjects[0];
        const payload = sanitizeTopicPayload({
          title: item.title_ru,
          title_lv: item.title_lv,
          slug: item.slug,
          subject_id: matchingSubj ? matchingSubj.id : null,
          grade: item.grade,
          position: item.position,
          description: item.description_ru,
          description_lv: item.description_lv
        });

        const { error } = await db.from('topics').upsert(payload, { onConflict: 'slug' });
        if (error) {
          console.warn('Ошибка темы:', item.slug, error.message);
          errorCount++;
        } else {
          insertedCount++;
        }

        if ((i + 1) % 15 === 0 || i === skola2030Catalog.length - 1) {
          skolaPresetStatus.textContent = `⏳ Загружено ${insertedCount} из ${skola2030Catalog.length} тем…`;
        }
      }

      btnBatchSeedTopics.disabled = false;
      skolaPresetStatus.className = 'skola-preset-status success';
      skolaPresetStatus.innerHTML = `🎉 Готово! Успешно загружено тем в Supabase: <strong>${insertedCount}</strong>.${errorCount ? ` Ошибок: ${errorCount}.` : ''}`;
      await loadCatalog();
      checkSkolaTopicsSeeded();
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
        aiGenTopic.innerHTML = catalogTopics.map(t => `<option value="${t.slug}">${escapeHtml(t.title_ru)} (${escapeHtml(t.title_lv)})</option>`).join('');
      } else {
        const dbTopics = g !== null ? topics.filter(t => t.grade === g) : topics;
        aiGenTopic.innerHTML = dbTopics.length
          ? dbTopics.map(t => `<option value="${t.id}">${escapeHtml(t.title)}</option>`).join('')
          : '<option value="">Нет тем</option>';
      }

      createRichSelect(aiGenTopic, {
        searchable: true,
        renderItem(value, text) {
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
      const topicItem = skola2030Catalog.find(t => t.slug === slugOrId) || topics.find(t => String(t.id) === slugOrId);
      const subtopics = topicItem?.subtopics || [];
      if (subtopics.length) {
        aiGenSubtopic.innerHTML = '<option value="">Все навыки темы</option>' +
          subtopics.map(s => `<option value="${escapeHtml(s.ru)}">${escapeHtml(s.ru)}</option>`).join('');
      } else {
        aiGenSubtopic.innerHTML = '<option value="">Все навыки темы</option>';
      }

      createRichSelect(aiGenSubtopic, {
        searchable: subtopics.length > 4,
        renderItem(value, text) {
          if (!value) return { main: 'Все навыки темы', sub: 'Случайный выбор из программы Skola2030' };
          const s = subtopics.find(st => st.ru === value);
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

    btnRunAiGenerator?.addEventListener('click', async () => {
      const g = parseFormGrade(aiGenGrade.value) || 7;
      const topicSlugOrId = aiGenTopic.value;
      const topicItem = skola2030Catalog.find(t => t.slug === topicSlugOrId) || topics.find(t => String(t.id) === topicSlugOrId);
      const topicTitle = topicItem ? (topicItem.title_ru || topicItem.title) : 'Математика';
      const subtopic = aiGenSubtopic?.value || '';
      const selectedDifficulty = aiGenDifficulty?.value || 'mix';
      const taskType = aiGenType?.value || 'Уравнение';
      const context = (aiGenContext?.value || '').trim();
      const customPrompt = (aiGenPrompt?.value || '').trim();
      const engine = aiEngineSelect?.value || 'builtin';
      const apiKey = (aiGeminiKey?.value || '').trim() || localStorage.getItem('math_tasks_gemini_api_key') || '';
      const rawCount = Number(aiGenCount?.value) || 1;
      const count = Math.min(Math.max(1, rawCount), 25);

      btnRunAiGenerator.disabled = true;
      aiGenStatus.className = 'ai-gen-status';
      aiGenStatus.innerHTML = `<span>⏳</span> Генерация ${count === 1 ? 'задачи' : `задач (${count} шт.)`}…`;

      try {
        const generator = window.MathTasks.aiGenerator;
        if (!generator) throw new Error('Модуль ai-generator.js не загружен');

        const generatedResults = [];
        let easyCount = 0;
        let medCount = 0;
        let hardCount = 0;

        for (let i = 0; i < count; i++) {
          const currentDiff = getDifficultyForTask(selectedDifficulty, i, count);
          if (currentDiff === 'Лёгкий') easyCount++;
          else if (currentDiff === 'Средний') medCount++;
          else hardCount++;

          aiGenStatus.className = 'ai-gen-status';
          aiGenStatus.innerHTML = `<span>⏳</span> Генерация задачи ${i + 1} из ${count} [уровень: ${currentDiff}]…`;

          const result = await generator.generateTask({
            grade: g,
            topicTitle,
            subtopic,
            difficulty: currentDiff,
            taskType,
            context,
            customPrompt,
            apiKey,
            useGemini: engine === 'gemini'
          });

          generatedResults.push({ result, difficulty: currentDiff });
        }

        const first = generatedResults[0];

        // Заполняем форму первой сгенерированной задачей для предпросмотра
        taskForm.elements.title.value = first.result.title_ru || first.result.title || '';
        if (taskForm.elements.title_lv) taskForm.elements.title_lv.value = first.result.title_lv || '';

        taskGradeSelect.value = String(g);
        updateTaskTopicDropdown();

        // Ищем подходящую тему в БД
        const dbMatchingTopic = topics.find(t => t.grade === g && (
          (t.slug && topicItem?.slug && t.slug === topicItem.slug) ||
          t.title.toLowerCase().includes(topicTitle.toLowerCase()) ||
          topicTitle.toLowerCase().includes(t.title.toLowerCase())
        ));
        if (dbMatchingTopic) {
          topicSelect.value = String(dbMatchingTopic.id);
        }

        taskForm.elements.difficulty.value = first.difficulty;

        conditionInput.value = first.result.condition_latex_ru || first.result.condition_latex || '';
        if (conditionInputLv) conditionInputLv.value = first.result.condition_latex_lv || '';

        answerInput.value = first.result.answer_latex || '';

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
          const tasksForBulk = generatedResults.map(({ result: r, difficulty: diff }, idx) => ({
            title: r.title_ru || r.title || `${topicTitle} #${idx + 1}`,
            title_lv: r.title_lv || null,
            condition_latex: r.condition_latex_ru || r.condition_latex || '',
            condition_latex_lv: r.condition_latex_lv || null,
            answer_latex: r.answer_latex || null,
            solution_latex: r.solution_latex_ru || r.solution_latex || null,
            solution_latex_lv: r.solution_latex_lv || null,
            difficulty: diff,
            grade: g,
            topic_id: dbMatchingTopic ? dbMatchingTopic.id : null,
            topic_title: topicTitle,
            is_published: true
          }));

          openBulkDialog('import');
          bulkDialogTitle.textContent = `Сгенерировано задач: ${count}`;
          bulkDialogDesc.innerHTML = `Сгенерировано <strong>${count}</strong> задач по теме «${escapeHtml(topicTitle)}» (${easyCount} лёгких, ${medCount} средних, ${hardCount} сложных). Вы можете проверить JSON и нажать <strong>«Импортировать в базу»</strong>. Первая задача также перенесена в форму.`;
          bulkDialogTextarea.value = JSON.stringify(tasksForBulk, null, 2);
          bulkDialogSubmit.textContent = `Импортировать все ${count} задач в базу`;
          bulkDialogCopy.hidden = false;
          bulkDialogStatus.className = 'bulk-dialog-status success';
          bulkDialogStatus.innerHTML = `🎉 Сгенерировано: <strong>${count}</strong> задач (${easyCount} лёгких ~45%, ${medCount} средних ~35%, ${hardCount} сложных ~20%).`;
          bulkDialogStatus.hidden = false;

          aiGenStatus.className = 'ai-gen-status success';
          aiGenStatus.innerHTML = `🎉 Сгенерировано ${count} задач (${easyCount} лёгких, ${medCount} средних, ${hardCount} сложных)! Открыто окно массового импорта.`;
        }
      } catch (err) {
        aiGenStatus.className = 'ai-gen-status error';
        aiGenStatus.textContent = 'Ошибка генерации: ' + err.message;
      } finally {
        btnRunAiGenerator.disabled = false;
      }
    });
  }

  /* ── Загрузка ─────────────────────────────────────────────────────── */

  async function loadCatalog() {
    const [subjectResult, topicResult] = await Promise.all([
      db.from('subjects').select('*').order('position').order('title'),
      db.from('topics').select(TOPIC_LIST_COLS).order('position').order('title')
    ]);
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

    renderSubjectList();
    renderTopicList();
    renderTaskList();
    checkSkolaTopicsSeeded();
  }

  async function loadTaskIndex() {
    const { data, error } = await db.from('tasks').select(TASK_INDEX_COLS);
    if (error) { taskIndex = []; return; }
    taskIndex = data || [];
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
    fillGradeSelect(document.querySelector('#topic-grade'), 'Без класса', { numeric: true });
    fillGradeSelect(document.querySelector('#task-grade'), 'Без класса', { numeric: true });
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
