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
    if (topicForm.elements.title_lv) topicForm.elements.title_lv.value = topic?.title_lv || '';
    // Тема без раздела не попадёт в меню сайта, поэтому для новой подставляем первый раздел.
    topicForm.elements.subject_id.value = String(topic?.subject_id ?? subjects[0]?.id ?? '');
    topicForm.elements.grade.value = topic?.grade ? String(topic.grade) : '';
    topicForm.elements.position.value = topic?.position ?? 0;
    topicForm.elements.description.value = topic?.description || '';
    if (topicForm.elements.description_lv) topicForm.elements.description_lv.value = topic?.description_lv || '';
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
      title_lv: form.get('title_lv')?.trim() || null,
      subject_id: form.get('subject_id') ? Number(form.get('subject_id')) : null,
      grade: parseFormGrade(form.get('grade')),
      position: Number(form.get('position')) || 0,
      description: form.get('description')?.trim() || null,
      description_lv: form.get('description_lv')?.trim() || null,
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

  const conditionInputLv = document.querySelector('#condition-input-lv');
  const solutionInputLv = document.querySelector('#solution-input-lv');
  const conditionPreviewLv = document.querySelector('#condition-preview-lv');
  const solutionPreviewLv = document.querySelector('#solution-preview-lv');

  const conditionInputEn = document.querySelector('#condition-input-en');
  const solutionInputEn = document.querySelector('#solution-input-en');
  const conditionPreviewEn = document.querySelector('#condition-preview-en');
  const solutionPreviewEn = document.querySelector('#solution-preview-en');

  // Предпросмотр показывает ровно то, что увидит посетитель, — до сохранения.
  const updatePreviews = () => {
    if (conditionPreview && conditionInput) renderMath(conditionPreview, conditionInput.value);
    if (answerPreview && answerInput) renderMath(answerPreview, answerInput.value);
    if (solutionPreview && solutionInput) renderMath(solutionPreview, solutionInput.value);
    if (conditionPreviewLv && conditionInputLv) renderMath(conditionPreviewLv, conditionInputLv.value);
    if (solutionPreviewLv && solutionInputLv) renderMath(solutionPreviewLv, solutionInputLv.value);
    if (conditionPreviewEn && conditionInputEn) renderMath(conditionPreviewEn, conditionInputEn.value);
    if (solutionPreviewEn && solutionInputEn) renderMath(solutionPreviewEn, solutionInputEn.value);
  };
  [conditionInput, answerInput, solutionInput, conditionInputLv, solutionInputLv, conditionInputEn, solutionInputEn]
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
    en: [
      [/^Решите уравнение/i, 'Solve the equation'],
      [/^Решить уравнение/i, 'Solve the equation'],
      [/^Вычислите значение/i, 'Calculate the value of the expression'],
      [/^Вычислите/i, 'Calculate'],
      [/^Вычислить/i, 'Calculate'],
      [/^Упростите выражение/i, 'Simplify the expression'],
      [/^Упростить выражение/i, 'Simplify the expression'],
      [/^Упростите/i, 'Simplify'],
      [/^Найдите корни уравнения/i, 'Find the roots of the equation'],
      [/^Найдите корень/i, 'Find the root'],
      [/^Найдите/i, 'Find'],
      [/^Найти/i, 'Find'],
      [/Раскроем скобки/i, 'Expand the brackets'],
      [/Перенесём слагаемые/i, 'Group the terms'],
      [/Проверка/i, 'Check'],
      [/Дискриминант/i, 'Discriminant'],
      [/значит/i, 'thus'],
      [/Следовательно/i, 'Therefore'],
      [/Ответ/i, 'Answer'],
      [/Решение/i, 'Solution']
    ]
  };

  async function translateTextWithLatex(text, targetLang = 'lv') {
    if (!text || !text.trim()) return '';
    const { maskedText, tokens } = window.MathTasksLib.maskLatexForTranslation(text);
    if (!maskedText.trim()) return '';

    let translated = '';
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(maskedText)}&langpair=ru|${targetLang}`;
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

  const btnAiTranslate = document.querySelector('#btn-ai-translate');
  if (btnAiTranslate) {
    btnAiTranslate.addEventListener('click', async () => {
      const titleRu = taskForm.elements.title.value.trim();
      const condRu = conditionInput.value.trim();
      const solRu = solutionInput.value.trim();

      if (!titleRu && !condRu) {
        alert('Сначала заполните Название или Условие задачи на русском языке!');
        return;
      }

      btnAiTranslate.disabled = true;
      btnAiTranslate.innerHTML = '<span>⏳</span> Выполняется AI-перевод…';

      try {
        const [titleLv, condLv, solLv, titleEn, condEn, solEn] = await Promise.all([
          translateTextWithLatex(titleRu, 'lv'),
          translateTextWithLatex(condRu, 'lv'),
          translateTextWithLatex(solRu, 'lv'),
          translateTextWithLatex(titleRu, 'en'),
          translateTextWithLatex(condRu, 'en'),
          translateTextWithLatex(solRu, 'en')
        ]);

        if (taskForm.elements.title_lv) taskForm.elements.title_lv.value = titleLv;
        if (conditionInputLv) conditionInputLv.value = condLv;
        if (solutionInputLv) solutionInputLv.value = solLv;

        if (taskForm.elements.title_en) taskForm.elements.title_en.value = titleEn;
        if (conditionInputEn) conditionInputEn.value = condEn;
        if (solutionInputEn) solutionInputEn.value = solEn;

        updatePreviews();
        taskSuccess.textContent = '✨ Перевод на латышский и английский сгенерирован! Проверьте вкладки LV и EN.';
        setTimeout(() => { if (taskSuccess.textContent.startsWith('✨')) taskSuccess.textContent = ''; }, 6000);
      } catch (err) {
        alert('Ошибка при переводе: ' + err.message);
      } finally {
        btnAiTranslate.disabled = false;
        btnAiTranslate.innerHTML = '<span class="ai-icon">✨</span> Автоперевод AI (LV & EN)';
      }
    });
  }

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
  });

  function setTaskMode(task) {
    editingTaskId = task?.id ?? null;
    document.querySelector('#task-form-title').textContent = task ? `Редактировать задачу: ${task.title}` : 'Добавить задание';
    document.querySelector('#task-submit').textContent = task ? 'Сохранить задачу' : 'Добавить задачу';
    document.querySelector('#task-cancel').hidden = !task;
    taskForm.elements.title.value = task?.title || '';
    if (taskForm.elements.title_lv) taskForm.elements.title_lv.value = task?.title_lv || '';
    if (taskForm.elements.title_en) taskForm.elements.title_en.value = task?.title_en || '';
    taskForm.elements.grade.value = task?.grade ? String(task.grade) : '';
    updateTaskTopicDropdown(task?.topic_id);
    taskForm.elements.topic_id.value = task?.topic_id ? String(task.topic_id) : '';
    taskForm.elements.difficulty.value = task?.difficulty || 'Средний';
    taskForm.elements.position.value = task?.position ?? 0;
    conditionInput.value = task?.condition_latex || '';
    if (conditionInputLv) conditionInputLv.value = task?.condition_latex_lv || '';
    if (conditionInputEn) conditionInputEn.value = task?.condition_latex_en || '';
    answerInput.value = task?.answer_latex || '';
    solutionInput.value = task?.solution_latex || '';
    if (solutionInputLv) solutionInputLv.value = task?.solution_latex_lv || '';
    if (solutionInputEn) solutionInputEn.value = task?.solution_latex_en || '';
    taskForm.elements.is_published.checked = task ? task.is_published : true;
    setImages(task);
    updatePreviews();
    if (task) taskForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

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
      title_lv: form.get('title_lv')?.trim() || null,
      title_en: form.get('title_en')?.trim() || null,
      condition_latex: conditionInput.value.trim(),
      condition_latex_lv: conditionInputLv?.value.trim() || null,
      condition_latex_en: conditionInputEn?.value.trim() || null,
      answer_latex: answerInput.value.trim() || null,
      solution_latex: solutionInput.value.trim() || null,
      solution_latex_lv: solutionInputLv?.value.trim() || null,
      solution_latex_en: solutionInputEn?.value.trim() || null,
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
      if (taskForm.elements.title_lv) taskForm.elements.title_lv.value = source.title_lv ? `[Kopija] ${source.title_lv}` : '';
      if (taskForm.elements.title_en) taskForm.elements.title_en.value = source.title_en ? `[Copy] ${source.title_en}` : '';
      taskForm.elements.topic_id.value = source.topic_id ? String(source.topic_id) : '';
      taskForm.elements.grade.value = source.grade ? String(source.grade) : '';
      taskForm.elements.difficulty.value = source.difficulty || 'Средний';
      taskForm.elements.position.value = nextPosition(source.topic_id, null);
      conditionInput.value = source.condition_latex || '';
      if (conditionInputLv) conditionInputLv.value = source.condition_latex_lv || '';
      if (conditionInputEn) conditionInputEn.value = source.condition_latex_en || '';
      answerInput.value = source.answer_latex || '';
      solutionInput.value = source.solution_latex || '';
      if (solutionInputLv) solutionInputLv.value = source.solution_latex_lv || '';
      if (solutionInputEn) solutionInputEn.value = source.solution_latex_en || '';
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
          title_lv: task.title_lv || null,
          condition_latex: task.condition_latex,
          condition_latex_lv: task.condition_latex_lv || null,
          answer_latex: task.answer_latex || null,
          solution_latex: task.solution_latex || null,
          solution_latex_lv: task.solution_latex_lv || null,
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
        title_lv: item.title_lv ? String(item.title_lv).trim() : null,
        condition_latex: String(item.condition_latex).trim(),
        condition_latex_lv: item.condition_latex_lv ? String(item.condition_latex_lv).trim() : null,
        answer_latex: item.answer_latex ? String(item.answer_latex).trim() : null,
        solution_latex: item.solution_latex ? String(item.solution_latex).trim() : null,
        solution_latex_lv: item.solution_latex_lv ? String(item.solution_latex_lv).trim() : null,
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
  const btnRunAiGenerator = document.querySelector('#btn-run-ai-generator');
  const aiGenStatus = document.querySelector('#ai-gen-status');
  const btnToggleAiSettings = document.querySelector('#btn-toggle-ai-settings');
  const aiSettingsCard = document.querySelector('#ai-settings-card');
  const aiEngineSelect = document.querySelector('#ai-engine-select');
  const geminiKeyWrap = document.querySelector('#gemini-key-wrap');
  const aiGeminiKey = document.querySelector('#ai-gemini-key');
  const btnSaveGeminiKey = document.querySelector('#btn-save-gemini-key');

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

  function setupSkolaPresetControls() {
    if (!skolaPresetGrade || !skolaPresetTopic) return;
    fillGradeSelect(skolaPresetGrade, 'Все классы (1–12)');

    function refreshPresetTopics() {
      const g = parseFormGrade(skolaPresetGrade.value);
      const list = g !== null ? skola2030Catalog.filter(t => t.grade === g) : skola2030Catalog;
      skolaPresetTopic.innerHTML = list.length
        ? list.map(t => `<option value="${t.slug}">${t.grade} кл: ${escapeHtml(t.title_ru)} (${escapeHtml(t.title_lv)})</option>`).join('')
        : '<option value="">Тем не найдено</option>';
    }

    skolaPresetGrade.addEventListener('change', refreshPresetTopics);
    refreshPresetTopics();

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
        const payload = {
          title: item.title_ru,
          title_lv: item.title_lv,
          slug: item.slug,
          subject_id: matchingSubj ? matchingSubj.id : null,
          grade: item.grade,
          position: item.position,
          description: item.description_ru,
          description_lv: item.description_lv
        };

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
    });
  }

  function setupAiGeneratorControls() {
    if (!aiGenGrade || !aiGenTopic) return;
    fillGradeSelect(aiGenGrade, '7 класс');
    aiGenGrade.value = '7';

    // Settings
    const savedKey = localStorage.getItem('math_tasks_gemini_api_key') || '';
    if (aiGeminiKey) aiGeminiKey.value = savedKey;
    const savedEngine = localStorage.getItem('math_tasks_ai_engine') || 'builtin';
    if (aiEngineSelect) {
      aiEngineSelect.value = savedEngine;
      if (geminiKeyWrap) geminiKeyWrap.hidden = savedEngine !== 'gemini';
      aiEngineSelect.addEventListener('change', () => {
        const eng = aiEngineSelect.value;
        localStorage.setItem('math_tasks_ai_engine', eng);
        if (geminiKeyWrap) geminiKeyWrap.hidden = eng !== 'gemini';
      });
    }

    btnToggleAiSettings?.addEventListener('click', () => {
      if (aiSettingsCard) aiSettingsCard.hidden = !aiSettingsCard.hidden;
    });

    btnSaveGeminiKey?.addEventListener('click', () => {
      const k = (aiGeminiKey?.value || '').trim();
      localStorage.setItem('math_tasks_gemini_api_key', k);
      btnSaveGeminiKey.textContent = '✓ Сохранено';
      setTimeout(() => { btnSaveGeminiKey.textContent = 'Сохранить'; }, 2000);
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
    }

    aiGenGrade.addEventListener('change', refreshAiTopics);
    aiGenTopic.addEventListener('change', refreshAiSubtopics);
    refreshAiTopics();

    btnRunAiGenerator?.addEventListener('click', async () => {
      const g = parseFormGrade(aiGenGrade.value) || 7;
      const topicSlugOrId = aiGenTopic.value;
      const topicItem = skola2030Catalog.find(t => t.slug === topicSlugOrId) || topics.find(t => String(t.id) === topicSlugOrId);
      const topicTitle = topicItem ? (topicItem.title_ru || topicItem.title) : 'Математика';
      const subtopic = aiGenSubtopic?.value || '';
      const difficulty = aiGenDifficulty?.value || 'Средний';
      const taskType = aiGenType?.value || 'Уравнение';
      const context = (aiGenContext?.value || '').trim();
      const customPrompt = (aiGenPrompt?.value || '').trim();
      const engine = aiEngineSelect?.value || 'builtin';
      const apiKey = (aiGeminiKey?.value || '').trim() || localStorage.getItem('math_tasks_gemini_api_key') || '';

      btnRunAiGenerator.disabled = true;
      aiGenStatus.className = 'ai-gen-status';
      aiGenStatus.innerHTML = '<span>⏳</span> Генератор создаёт условие, KaTeX-формулы и решение…';

      try {
        const generator = window.MathTasks.aiGenerator;
        if (!generator) throw new Error('Модуль ai-generator.js не загружен');

        const result = await generator.generateTask({
          grade: g,
          topicTitle,
          subtopic,
          difficulty,
          taskType,
          context,
          customPrompt,
          apiKey,
          useGemini: engine === 'gemini'
        });

        // Заполняем форму задания
        taskForm.elements.title.value = result.title_ru || result.title || '';
        if (taskForm.elements.title_lv) taskForm.elements.title_lv.value = result.title_lv || '';

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

        taskForm.elements.difficulty.value = difficulty;

        conditionInput.value = result.condition_latex_ru || result.condition_latex || '';
        if (conditionInputLv) conditionInputLv.value = result.condition_latex_lv || '';
        if (conditionInputEn) conditionInputEn.value = result.condition_latex_en || '';

        answerInput.value = result.answer_latex || '';

        solutionInput.value = result.solution_latex_ru || result.solution_latex || '';
        if (solutionInputLv) solutionInputLv.value = result.solution_latex_lv || '';
        if (solutionInputEn) solutionInputEn.value = result.solution_latex_en || '';

        updatePreviews();

        aiGenStatus.className = 'ai-gen-status success';
        aiGenStatus.innerHTML = '🎉 Задача сгенерирована и перенесена в форму ниже!';

        taskSuccess.textContent = '✨ Сгенерированная задача готова к публикации или редактированию.';
        setTimeout(() => {
          taskForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
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

    updateTaskTopicDropdown();
    updateFilterTopicDropdown();

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
    await loadSkola2030Catalog();
  })();
})();
