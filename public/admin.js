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
  const taskFilterCount = document.querySelector('#task-filter-count');
  const taskFilterReset = document.querySelector('#task-filter-reset');

  const bulkDialog = document.querySelector('#bulk-dialog');
  const bulkDialogTitle = document.querySelector('#bulk-dialog-title');
  const bulkDialogDesc = document.querySelector('#bulk-dialog-desc');
  const bulkDialogTextarea = document.querySelector('#bulk-dialog-textarea');
  const bulkDialogStatus = document.querySelector('#bulk-dialog-status');
  const bulkDialogSubmit = document.querySelector('#bulk-dialog-submit');
  const bulkDialogCopy = document.querySelector('#bulk-dialog-copy');
  const bulkDialogClose = document.querySelector('#bulk-dialog-close');
  const bulkDialogCancel = document.querySelector('#bulk-dialog-cancel');
  const btnExportTasks = document.querySelector('#btn-export-tasks');
  const btnImportTasks = document.querySelector('#btn-import-tasks');

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
    if (val === 'visparigais') return 10;
    if (val === 'matematika-1') return 11;
    if (val === 'matematika-2') return 12;
    const num = Number(val);
    return Number.isFinite(num) ? num : null;
  };
  const gradeText = grade => (grade ? `${grade} класс` : 'без класса');
  const subjectTitle = id => subjects.find(item => item.id === id)?.title || 'Без раздела';

  /* ── Разделы ──────────────────────────────────────────────────────── */

  function setSubjectMode(subject) {
    editingSubjectId = subject?.id ?? null;
    document.querySelector('#subject-form-title').textContent = subject ? `Редактировать раздел: ${subject.title}` : 'Добавить раздел';
    document.querySelector('#subject-submit').textContent = subject ? 'Сохранить раздел' : 'Добавить раздел';
    document.querySelector('#subject-cancel').hidden = !subject;
    subjectForm.elements.title.value = subject?.title || '';
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
        <span class="admin-row-main"><strong>${escapeHtml(subject.title)}</strong><small>тем: ${count} · порядок: ${subject.position}</small></span>
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
    const payload = {
      title,
      icon: form.get('icon').trim() || 'x²',
      position: Number(form.get('position')) || 0
    };
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
    document.querySelector('#topic-form-title').textContent = topic ? `Редактировать тему: ${topic.title}` : 'Добавить тему';
    document.querySelector('#topic-submit').textContent = topic ? 'Сохранить тему' : 'Добавить тему';
    document.querySelector('#topic-cancel').hidden = !topic;
    topicForm.elements.title.value = topic?.title || '';
    // Тема без раздела не попадёт в меню сайта, поэтому для новой подставляем первый раздел.
    topicForm.elements.subject_id.value = String(topic?.subject_id ?? subjects[0]?.id ?? '');
    topicForm.elements.grade.value = topic?.grade ? String(topic.grade) : '';
    topicForm.elements.position.value = topic?.position ?? 0;
    topicForm.elements.description.value = topic?.description || '';
    if (topic) topicForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function renderTopicList() {
    if (!topics.length) { topicList.innerHTML = '<p class="admin-empty">Тем пока нет.</p>'; return; }
    topicList.innerHTML = topics.map(topic => {
      const count = tasks.filter(task => task.topic_id === topic.id).length;
      /* Класс — глобальный контекст сайта: тему без него посетитель увидит
         только в режиме «Все классы», поэтому предупреждаем прямо в списке. */
      const warning = topic.grade ? '' : '<span class="admin-warn">не видна в меню при выбранном классе</span>';
      return `<div class="admin-row">
        <span class="admin-row-main"><strong>${escapeHtml(topic.title)}</strong><small>${escapeHtml(subjectTitle(topic.subject_id))} · ${gradeText(topic.grade)} · задач: ${count}</small>${warning}</span>
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
    const payload = {
      title,
      subject_id: form.get('subject_id') ? Number(form.get('subject_id')) : null,
      grade: parseFormGrade(form.get('grade')),
      position: Number(form.get('position')) || 0,
      description: form.get('description').trim() || null
    };
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
    const editId = event.target.closest('[data-edit-topic]')?.dataset.editTopic;
    if (editId) { setTopicMode(topics.find(topic => String(topic.id) === editId)); return; }
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
  const solutionInput = document.querySelector('#solution-input');
  const conditionPreview = document.querySelector('#condition-preview');
  const answerPreview = document.querySelector('#answer-preview');
  const solutionPreview = document.querySelector('#solution-preview');

  // Предпросмотр показывает ровно то, что увидит посетитель, — до сохранения.
  const updatePreviews = () => {
    renderMath(conditionPreview, conditionInput.value);
    renderMath(answerPreview, answerInput.value);
    renderMath(solutionPreview, solutionInput.value);
  };
  [conditionInput, answerInput, solutionInput].forEach(input => input.addEventListener('input', updatePreviews));

  /* ── Чертежи ──────────────────────────────────────────────────────
     Файл уходит в хранилище сразу при выборе, чтобы админ увидел его до
     сохранения. Поэтому у каждого поля два состояния: saved — то, что
     записано в задаче, current — то, что показано сейчас. Всё, что
     оказалось лишним, удаляем из бакета: иначе он зарастёт сиротами. */
  const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
  const EXTENSIONS = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
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
        errorElement.textContent = 'Нужен файл png, jpg или webp.';
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

  function setTaskMode(task) {
    editingTaskId = task?.id ?? null;
    document.querySelector('#task-form-title').textContent = task ? `Редактировать задачу: ${task.title}` : 'Добавить задание';
    document.querySelector('#task-submit').textContent = task ? 'Сохранить задачу' : 'Добавить задачу';
    document.querySelector('#task-cancel').hidden = !task;
    taskForm.elements.title.value = task?.title || '';
    taskForm.elements.topic_id.value = task?.topic_id ? String(task.topic_id) : '';
    taskForm.elements.grade.value = task?.grade ? String(task.grade) : '';
    taskForm.elements.difficulty.value = task?.difficulty || 'Средний';
    taskForm.elements.position.value = task?.position ?? 0;
    conditionInput.value = task?.condition_latex || '';
    answerInput.value = task?.answer_latex || '';
    solutionInput.value = task?.solution_latex || '';
    taskForm.elements.is_published.checked = task ? task.is_published : true;
    setImages(task);
    updatePreviews();
    if (task) taskForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Класс обычно совпадает с классом темы — подставляем, но не запрещаем менять.
  topicSelect.addEventListener('change', () => {
    if (taskForm.elements.grade.value) return;
    const topic = topics.find(item => String(item.id) === topicSelect.value);
    if (topic?.grade) taskForm.elements.grade.value = String(topic.grade);
  });

  /* Порядок задаётся внутри темы: соседи по списку — только задачи той же темы,
     иначе стрелка перекинула бы задачу через границу раздела. */
  const siblingsOf = topicId => tasks.filter(task => (task.topic_id ?? null) === (topicId ?? null));

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
    if (!tasks.length) {
      taskList.innerHTML = '<p class="admin-empty">Задач пока нет.</p>';
      if (taskFilterCount) taskFilterCount.textContent = '0 задач';
      return;
    }

    const filtered = getFilteredTasks();
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

      // Бейджи статусов и индикация черновиков / ошибок (4.4)
      const badges = [
        task.is_published
          ? '<span class="admin-status-badge published">✓ Опубликована</span>'
          : '<span class="admin-status-badge draft">🟡 Черновик</span>',
        !task.topic_id ? '<span class="admin-status-badge danger">Без темы</span>' : '',
        (!task.solution_latex && !task.solution_image) ? '<span class="admin-status-badge warning">Без решения</span>' : '',
        (task.condition_image || task.solution_image) ? '<span class="admin-status-badge info">🖼️ С чертежом</span>' : '',
        difficultyBadge(task.difficulty)
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
    const task = tasks.find(item => String(item.id) === String(taskId));
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
    await loadTasks();
  }

  taskForm.addEventListener('submit', async event => {
    event.preventDefault();
    taskSuccess.textContent = '';
    const form = new FormData(taskForm);
    const topicId = form.get('topic_id') ? Number(form.get('topic_id')) : null;
    const payload = {
      title: form.get('title').trim(),
      condition_latex: conditionInput.value.trim(),
      answer_latex: answerInput.value.trim() || null,
      solution_latex: solutionInput.value.trim() || null,
      condition_image: images.condition.current,
      solution_image: images.solution.current,
      difficulty: form.get('difficulty'),
      position: nextPosition(topicId, form.get('position')),
      grade: parseFormGrade(form.get('grade')),
      topic_id: topicId,
      is_published: form.get('is_published') === 'on'
    };
    const { error } = editingTaskId
      ? await db.from('tasks').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingTaskId)
      : await db.from('tasks').insert(payload);
    if (error) { taskSuccess.textContent = 'Ошибка: ' + error.message; return; }
    // Сохранились — прежние файлы больше не нужны.
    for (const kind of ['condition', 'solution']) {
      const { saved, current } = images[kind];
      if (saved && saved !== current) await removeFile(saved);
      images[kind].saved = current;
    }
    taskSuccess.textContent = editingTaskId ? 'Задача сохранена.' : 'Задача добавлена.';
    taskForm.reset();
    setTaskMode(null);
    await loadTasks();
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
    if (editId) { setTaskMode(tasks.find(task => String(task.id) === editId)); return; }

    // 4.2: Клонирование задачи
    const cloneId = event.target.closest('[data-clone-task]')?.dataset.cloneTask;
    if (cloneId) {
      const source = tasks.find(item => String(item.id) === cloneId);
      if (!source) return;
      editingTaskId = null; // Гарантирует создание новой задачи при отправке
      taskForm.elements.title.value = `[Копия] ${source.title}`;
      taskForm.elements.topic_id.value = source.topic_id ? String(source.topic_id) : '';
      taskForm.elements.grade.value = source.grade ? String(source.grade) : '';
      taskForm.elements.difficulty.value = source.difficulty || 'Средний';
      taskForm.elements.position.value = nextPosition(source.topic_id, null);
      conditionInput.value = source.condition_latex || '';
      answerInput.value = source.answer_latex || '';
      solutionInput.value = source.solution_latex || '';
      taskForm.elements.is_published.checked = false; // Копия по умолчанию создаётся черновиком
      setImages(source);
      updatePreviews();
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
    if (!confirm(`Удалить задачу «${task.title}»? Это действие необратимо.`)) return;
    const { error } = await db.from('tasks').delete().eq('id', deleteId);
    if (error) { taskSuccess.textContent = 'Ошибка: ' + error.message; return; }
    // Задачи нет — её чертежам в бакете делать нечего.
    await removeFile(task.condition_image);
    await removeFile(task.solution_image);
    if (String(editingTaskId) === deleteId) { taskForm.reset(); setTaskMode(null); }
    taskSuccess.textContent = 'Задача удалена.';
    await loadTasks();
  });

  /* ── Фильтры задач (4.1) ─────────────────────────────────────────── */
  [taskSearchInput, taskFilterGrade, taskFilterTopic, taskFilterStatus].forEach(el => {
    el?.addEventListener('input', renderTaskList);
    el?.addEventListener('change', renderTaskList);
  });
  taskFilterReset?.addEventListener('click', resetTaskFilters);

  /* ── Массовый импорт и экспорт задач (4.3) ────────────────────────── */
  let bulkMode = 'export'; // 'export' | 'import'

  function openBulkDialog(mode) {
    if (!bulkDialog) return;
    bulkMode = mode;
    if (bulkDialogStatus) {
      bulkDialogStatus.hidden = true;
      bulkDialogStatus.textContent = '';
    }
    if (mode === 'export') {
      const filtered = getFilteredTasks();
      const exportData = filtered.map(task => {
        const topic = topics.find(t => t.id === task.topic_id);
        return {
          title: task.title,
          condition_latex: task.condition_latex,
          answer_latex: task.answer_latex || null,
          solution_latex: task.solution_latex || null,
          difficulty: task.difficulty || 'Средний',
          grade: task.grade ?? topic?.grade ?? null,
          topic_title: topic?.title || null,
          position: task.position ?? 0,
          is_published: Boolean(task.is_published)
        };
      });
      bulkDialogTitle.textContent = `Экспорт задач (${exportData.length} шт.)`;
      bulkDialogDesc.innerHTML = 'Экспорт текущего списка задач в формате JSON. Можно скопировать текст или сохранить файл резервной копии.';
      bulkDialogTextarea.value = JSON.stringify(exportData, null, 2);
      bulkDialogSubmit.textContent = 'Скачать tasks-export.json';
      bulkDialogCopy.hidden = false;
    } else {
      bulkDialogTitle.textContent = 'Массовый импорт задач (JSON)';
      bulkDialogDesc.innerHTML = 'Вставьте массив задач в формате JSON. Обязательные поля: <code>title</code> и <code>condition_latex</code>. Поле <code>topic_title</code> автоматически свяжет задачу с существующей темой.';
      bulkDialogTextarea.value = '';
      bulkDialogTextarea.placeholder = '[\n  {\n    "title": "Квадратное уравнение",\n    "condition_latex": "Решите $x^2 - 4 = 0$",\n    "answer_latex": "$x = \\\\pm 2$",\n    "difficulty": "Лёгкий",\n    "grade": 8\n  }\n]';
      bulkDialogSubmit.textContent = 'Импортировать в базу';
      bulkDialogCopy.hidden = true;
    }
    bulkDialog.showModal();
  }

  btnExportTasks?.addEventListener('click', () => openBulkDialog('export'));
  btnImportTasks?.addEventListener('click', () => openBulkDialog('import'));
  bulkDialogClose?.addEventListener('click', () => bulkDialog?.close());
  bulkDialogCancel?.addEventListener('click', () => bulkDialog?.close());

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
      bulkDialogStatus.textContent = 'Вставьте JSON для импорта.';
      bulkDialogStatus.hidden = false;
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      bulkDialogStatus.className = 'bulk-dialog-status error';
      bulkDialogStatus.textContent = 'Ошибка формата JSON: ' + e.message;
      bulkDialogStatus.hidden = false;
      return;
    }

    const items = Array.isArray(parsed) ? parsed : [parsed];
    if (!items.length) {
      bulkDialogStatus.className = 'bulk-dialog-status error';
      bulkDialogStatus.textContent = 'Массив задач пуст.';
      bulkDialogStatus.hidden = false;
      return;
    }

    bulkDialogSubmit.disabled = true;
    bulkDialogSubmit.textContent = 'Импортируем…';

    let successCount = 0;
    const errors = [];

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

      const payload = {
        title: String(item.title).trim(),
        condition_latex: String(item.condition_latex).trim(),
        answer_latex: item.answer_latex ? String(item.answer_latex).trim() : null,
        solution_latex: item.solution_latex ? String(item.solution_latex).trim() : null,
        difficulty: item.difficulty || 'Средний',
        grade: parseFormGrade(item.grade),
        topic_id: topicId,
        position: item.position !== undefined ? Number(item.position) : nextPosition(topicId, null),
        is_published: item.is_published !== undefined ? Boolean(item.is_published) : true
      };

      const { error } = await db.from('tasks').insert(payload);
      if (error) {
        errors.push(`Задача #${i + 1} («${item.title}»): ${error.message}`);
      } else {
        successCount++;
      }
    }

    bulkDialogSubmit.disabled = false;
    bulkDialogSubmit.textContent = 'Импортировать в базу';

    if (errors.length) {
      bulkDialogStatus.className = 'bulk-dialog-status ' + (successCount > 0 ? 'warning' : 'error');
      bulkDialogStatus.innerHTML = `Успешно импортировано: ${successCount} из ${items.length}.<br>Ошибки:<br>${errors.map(escapeHtml).join('<br>')}`;
      bulkDialogStatus.hidden = false;
    } else {
      bulkDialogStatus.className = 'bulk-dialog-status success';
      bulkDialogStatus.textContent = `🎉 Успешно импортировано задач: ${successCount}!`;
      bulkDialogStatus.hidden = false;
      setTimeout(() => bulkDialog?.close(), 1600);
    }

    await loadTasks();
  });

  /* ── Загрузка ─────────────────────────────────────────────────────── */

  async function loadCatalog() {
    const [subjectResult, topicResult] = await Promise.all([
      db.from('subjects').select('*').order('position').order('title'),
      db.from('topics').select('*').order('position').order('title')
    ]);
    if (subjectResult.error || topicResult.error) {
      const message = (subjectResult.error || topicResult.error).message;
      subjectList.innerHTML = `<p class="admin-empty">Не удалось загрузить разделы: ${escapeHtml(message)}. Возможно, не применена миграция 002_subjects.sql.</p>`;
      return;
    }
    subjects = subjectResult.data || [];
    topics = topicResult.data || [];

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
      fillGradeSelect(taskFilterGrade, 'Все классы');
    }
    if (taskFilterTopic) {
      const keepFilterTopic = taskFilterTopic.value;
      taskFilterTopic.innerHTML = '<option value="">Все темы</option>' +
        topics.map(topic => `<option value="${topic.id}">${escapeHtml(topic.title)} (${gradeText(topic.grade)})</option>`).join('');
      taskFilterTopic.value = keepFilterTopic;
    }

    renderSubjectList();
    renderTopicList();
    renderTaskList();
  }

  async function loadTasks() {
    const { data, error } = await db.from('tasks').select('*').order('topic_id').order('position').order('created_at', { ascending: true });
    if (error) { taskList.innerHTML = `<p class="admin-empty">Не удалось загрузить задачи: ${escapeHtml(error.message)}</p>`; return; }
    tasks = data || [];
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
    fillGradeSelect(document.querySelector('#topic-grade'), 'Без класса');
    fillGradeSelect(document.querySelector('#task-grade'), 'Без класса');
    setSubjectMode(null);
    setTopicMode(null);
    setTaskMode(null);
    await loadTasks();
    await loadCatalog();
  })();
})();
