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
    gate.innerHTML = `${escapeHtml(message)} <a href="index.html">Вернуться на сайт</a>`;
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
      grade: form.get('grade') ? Number(form.get('grade')) : null,
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
  const solutionInput = document.querySelector('#solution-input');
  const conditionPreview = document.querySelector('#condition-preview');
  const solutionPreview = document.querySelector('#solution-preview');

  // Предпросмотр показывает ровно то, что увидит посетитель, — до сохранения.
  const updatePreviews = () => {
    renderMath(conditionPreview, conditionInput.value);
    renderMath(solutionPreview, solutionInput.value);
  };
  conditionInput.addEventListener('input', updatePreviews);
  solutionInput.addEventListener('input', updatePreviews);

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
    solutionInput.value = task?.solution_latex || '';
    taskForm.elements.is_published.checked = task ? task.is_published : true;
    updatePreviews();
    if (task) taskForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Класс обычно совпадает с классом темы — подставляем, но не запрещаем менять.
  topicSelect.addEventListener('change', () => {
    if (taskForm.elements.grade.value) return;
    const topic = topics.find(item => String(item.id) === topicSelect.value);
    if (topic?.grade) taskForm.elements.grade.value = String(topic.grade);
  });

  function renderTaskList() {
    if (!tasks.length) { taskList.innerHTML = '<p class="admin-empty">Задач пока нет.</p>'; return; }
    taskList.innerHTML = tasks.map(task => {
      const topic = topics.find(item => item.id === task.topic_id);
      const parts = [topic?.title || 'Без темы', gradeText(task.grade), task.difficulty, `порядок: ${task.position ?? 0}`, task.is_published ? 'опубликована' : 'черновик'];
      const solution = task.solution_latex ? '' : ' · без решения';
      return `<div class="admin-row">
        <span class="admin-row-main"><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(parts.join(' · '))}${solution}</small></span>
        <button class="text-button" type="button" data-edit-task="${task.id}">Изменить</button>
        <button class="text-button danger" type="button" data-delete-task="${task.id}">Удалить</button>
      </div>`;
    }).join('');
  }

  taskForm.addEventListener('submit', async event => {
    event.preventDefault();
    taskSuccess.textContent = '';
    const form = new FormData(taskForm);
    const payload = {
      title: form.get('title').trim(),
      condition_latex: conditionInput.value.trim(),
      solution_latex: solutionInput.value.trim() || null,
      difficulty: form.get('difficulty'),
      position: Number(form.get('position')) || 0,
      grade: form.get('grade') ? Number(form.get('grade')) : null,
      topic_id: form.get('topic_id') ? Number(form.get('topic_id')) : null,
      is_published: form.get('is_published') === 'on'
    };
    const { error } = editingTaskId
      ? await db.from('tasks').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingTaskId)
      : await db.from('tasks').insert(payload);
    if (error) { taskSuccess.textContent = 'Ошибка: ' + error.message; return; }
    taskSuccess.textContent = editingTaskId ? 'Задача сохранена.' : 'Задача добавлена.';
    taskForm.reset();
    setTaskMode(null);
    await loadTasks();
  });

  document.querySelector('#task-cancel').addEventListener('click', () => { taskForm.reset(); setTaskMode(null); });

  taskList.addEventListener('click', async event => {
    const editId = event.target.closest('[data-edit-task]')?.dataset.editTask;
    if (editId) { setTaskMode(tasks.find(task => String(task.id) === editId)); return; }
    const deleteId = event.target.closest('[data-delete-task]')?.dataset.deleteTask;
    if (!deleteId) return;
    const task = tasks.find(item => String(item.id) === deleteId);
    if (!confirm(`Удалить задачу «${task.title}»? Это действие необратимо.`)) return;
    const { error } = await db.from('tasks').delete().eq('id', deleteId);
    if (error) { taskSuccess.textContent = 'Ошибка: ' + error.message; return; }
    if (String(editingTaskId) === deleteId) { taskForm.reset(); setTaskMode(null); }
    taskSuccess.textContent = 'Задача удалена.';
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
