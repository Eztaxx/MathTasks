(() => {
  const { db, escapeHtml, makeSlug, loadViewer, renderMath, fillGradeSelect, directLogin } = window.MathTasks;
  const byId = id => document.getElementById(id);
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
  const taskListDefer = document.querySelector('#task-list-defer');
  const btnLoadTasks = document.querySelector('#btn-load-tasks');
  const taskListCloseTop = document.querySelector('#task-list-close');

  const bulkDialog = document.querySelector('#bulk-dialog');
  const bulkDialogTitle = document.querySelector('#bulk-dialog-title');
  const bulkDialogDesc = document.querySelector('#bulk-dialog-desc');
  const bulkDialogTextarea = document.querySelector('#bulk-dialog-textarea');
  const bulkDialogStatus = document.querySelector('#bulk-dialog-status');
  const bulkDialogSubmit = document.querySelector('#bulk-dialog-submit');
  const bulkDialogCopy = document.querySelector('#bulk-dialog-copy');
  const bulkDialogTagList = document.querySelector('#bulk-dialog-taglist');
  const bulkDialogClose = document.querySelector('#bulk-dialog-close');
  /* Эти семь объявлений однажды пропали при правке, а обращения к ним
     остались. Обращение к необъявленной переменной — ReferenceError даже
     через ?., и скрипт падал до initAdminApp: экран «Проверяем доступ…»
     не сменялся формой входа. Тест admin-refs.test.js это ловит. */
  const bulkDialogCancel = document.querySelector('#bulk-dialog-cancel');
  const bulkDialogFileInput = document.querySelector('#bulk-dialog-file-input');
  const btnUploadFileTasks = document.querySelector('#btn-upload-file-tasks');
  const bulkDialogPickFileBtn = document.querySelector('#bulk-dialog-pick-file-btn');
  const bulkDialogTemplateBtn = document.querySelector('#bulk-dialog-template-btn');
  const bulkDialogCsvTemplateBtn = document.querySelector('#bulk-dialog-csv-template-btn');
  const topicListCloseTop = document.querySelector('#topic-list-close');
  const bulkFileTasksLabel = document.querySelector('#btn-upload-file-tasks-label');
  const bulkFileInput = document.querySelector('#bulk-file-input');
  const btnExportCsv = document.querySelector('#btn-export-csv');
  const btnExportTasks = document.querySelector('#btn-export-tasks');
  const btnImportTasks = document.querySelector('#btn-import-tasks');
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
  const admReviewApprove = document.querySelector('#adm-review-approve');
  const admReviewEdit = document.querySelector('#adm-review-edit');
  const admReviewReject = document.querySelector('#adm-review-reject');
  const admReviewSkip = document.querySelector('#adm-review-skip');

  /* Белый список колонок защищает от PGRST204, если миграция 007 ещё не
     выполнена. Латышские колонки добавляются в него на лету: без этого
     миграцию можно было выполнить, а перевод из админки всё равно
     не сохранялся бы — молча, потому что поле просто отбрасывалось. */
  /* Колонки для списка задач: нужны для поиска по условию, фильтрации по чертежам,
     решениям, сортировки по дате и подтемам. */
  const TASK_LIST_COLS = 'id,title,topic_id,subtopic_id,grade,difficulty,is_published,position,condition_image,solution_image,condition_latex,condition_latex_lv,solution_latex,created_at';
  /* title_lv нужен выгрузке (иначе столбец topic_title_lv пуст у всех задач)
     и импорту — без него тема по латышскому названию не находилась, и
     вместо совпадения заводился дубль. */
  const TOPIC_LIST_COLS = 'id,title,title_lv,subject_id,grade,position,slug';
  const TASK_INDEX_COLS = 'id,topic_id,subtopic_id,grade,position,is_published';

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
  /* Задачу открыли кнопкой «Править» на экране проверки — после сохранения
     или отмены возвращаемся туда. Помним id: если админ ушёл и открыл
     другую задачу, возврат не сработает. */
  let editorReturnView = null;

  const deny = (message, showLogin = false) => {
    content.hidden = true;
    gate.hidden = false;
    if (showLogin) {
      gate.innerHTML = `
        <div class="admin-login-card" style="max-width:380px;margin:30px auto;padding:24px;border-radius:12px;background:var(--card-bg,#fff);border:1px solid var(--border,#e2e8f0);box-shadow:0 4px 20px rgba(0,0,0,0.06);text-align:left;">
          <h3 style="margin:0 0 8px;font-size:18px;">Вход для администратора</h3>
          <p style="margin:0 0 16px;color:var(--muted,#64748b);font-size:13px;">${escapeHtml(message || 'Войдите с учётной записью администратора:')}</p>
          <form id="admin-gate-login-form">
            <label style="display:block;margin-bottom:12px;">
              <span style="display:block;font-size:13px;font-weight:600;margin-bottom:4px;">Email</span>
              <input type="email" id="admin-gate-email" required autofocus style="width:100%;box-sizing:border-box;padding:9px 12px;border:1px solid var(--border,#cbd5e1);border-radius:8px;font-size:14px;" autocomplete="username" />
            </label>
            <label style="display:block;margin-bottom:14px;">
              <span style="display:block;font-size:13px;font-weight:600;margin-bottom:4px;">Пароль</span>
              <input type="password" id="admin-gate-password" required style="width:100%;box-sizing:border-box;padding:9px 12px;border:1px solid var(--border,#cbd5e1);border-radius:8px;font-size:14px;" autocomplete="current-password" />
            </label>
            <div id="admin-gate-login-error" style="color:#e53e3e;font-size:13px;margin-bottom:12px;" hidden></div>
            <div style="display:flex;gap:10px;align-items:center;justify-content:space-between;margin-top:16px;flex-wrap:wrap;">
              <button type="submit" class="primary-button" id="admin-gate-submit-btn">Войти</button>
              <button type="button" class="text-button" id="admin-gate-signout-btn" style="font-size:13px;" title="Очистить сохранённую сессию и кэш">Сбросить сессию</button>
              <a href="/" style="font-size:13px;color:#1764ff;text-decoration:none;">На главную</a>
            </div>
          </form>
        </div>
      `;
      // autofocus не срабатывает у формы, вставленной после загрузки страницы.
      document.querySelector('#admin-gate-email')?.focus();
      const loginForm = document.querySelector('#admin-gate-login-form');
      loginForm?.addEventListener('submit', async ev => {
        ev.preventDefault();
        const emailInput = document.querySelector('#admin-gate-email');
        const passwordInput = document.querySelector('#admin-gate-password');
        const errEl = document.querySelector('#admin-gate-login-error');
        const submitBtn = document.querySelector('#admin-gate-submit-btn');

        const email = emailInput?.value.trim();
        const password = passwordInput?.value;

        if (!email || !password) {
          if (errEl) { errEl.hidden = false; errEl.textContent = 'Введите email и пароль'; }
          return;
        }

        if (errEl) { errEl.hidden = true; errEl.textContent = ''; }
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Входим…'; }

        try {
          const loginFn = directLogin || window.MathTasks.directLogin;
          const loginRes = loginFn ? await loginFn(email, password) : await db.auth.signInWithPassword({ email, password });
          if (loginRes.error) {
            if (errEl) {
              errEl.hidden = false;
              let msg = loginRes.error.message || String(loginRes.error);
              if (msg.includes('invalid_credentials') || msg.includes('Invalid login credentials')) {
                msg = 'Неверный email или пароль';
              }
              errEl.textContent = msg;
            }
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Войти'; }
            return;
          }

          const user = loginRes.data?.user;
          const session = loginRes.data?.session;

          /* Права — только по роли в profiles. Адрес администратора в коде
             не держим: этот файл открыт любому посетителю. */
          let isAdmin = false;

          if (!isAdmin && session?.access_token && user?.id) {
            try {
              const config = window.SUPABASE_CONFIG;
              const r = await fetch(`${config.url}/rest/v1/profiles?id=eq.${user.id}&select=role`, {
                headers: {
                  apikey: config.publishableKey,
                  Authorization: `Bearer ${session.access_token}`
                }
              });
              if (r.ok) {
                const rows = await r.json().catch(() => []);
                if (rows?.[0]?.role === 'admin') isAdmin = true;
              }
            } catch {}
          }

          if (!isAdmin) {
            if (errEl) {
              errEl.hidden = false;
              errEl.textContent = `У аккаунта ${user?.email || email} нет прав администратора`;
            }
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Войти'; }
            return;
          }

          // Успешный вход админа: сразу открываем интерфейс без задержек и повторных проверок
          gate.hidden = true;
          gate.innerHTML = '';
          content.hidden = false;
          const adminEmailEl = document.querySelector('#admin-email');
          if (adminEmailEl) adminEmailEl.textContent = user?.email || email;

          await startAdminApp();
        } catch (err) {
          console.error('Ошибка авторизации в форме входа:', err);
          if (errEl) {
            errEl.hidden = false;
            errEl.textContent = 'Ошибка подключения: ' + (err.message || err);
          }
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Войти'; }
        }
      });
      document.querySelector('#admin-gate-signout-btn')?.addEventListener('click', async () => {
        try { if (db) await db.auth.signOut(); } catch {}
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && (k.includes('supabase') || k.includes('auth'))) localStorage.removeItem(k);
          }
        } catch {}
        location.reload();
      });
    } else {
      gate.innerHTML = `
        <div style="max-width:440px;margin:40px auto;padding:20px;text-align:center;">
          <p style="margin-bottom:16px;">${escapeHtml(message)}</p>
          <button type="button" class="primary-button" id="admin-retry-btn">Повторить</button>
          <button type="button" class="text-button" id="admin-signout-retry-btn" style="margin-left:8px;">Сбросить сессию</button>
          <a href="/" style="margin-left:12px;font-size:14px;">На главную</a>
        </div>
      `;
      document.querySelector('#admin-retry-btn')?.addEventListener('click', () => {
        gate.innerHTML = '<p class="admin-gate" style="margin:40px auto;text-align:center;">Проверяем доступ…</p>';
        initAdminApp();
      });
      document.querySelector('#admin-signout-retry-btn')?.addEventListener('click', async () => {
        try { if (db) await db.auth.signOut(); } catch {}
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && (k.includes('supabase') || k.includes('auth'))) localStorage.removeItem(k);
          }
        } catch {}
        location.reload();
      });
    }
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
  const gradeRank = value => (value == null || value === '' ? 999 : Number(parseFormGrade(value) ?? 999));
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
    // В каркасе «развернуть раздел» значит «открыть его экран».
    showViewOfElement(section);
    if (!section || !section.classList.contains('is-collapsed')) return;
    const toggleBtn = section.querySelector('.admin-section-toggle');
    applySectionCollapsed(section, toggleBtn, false);
    const currentSet = getCollapsedSections();
    currentSet.delete(sectionId);
    saveCollapsedSections(currentSet);
  }

  function initCollapsibleSections() {
    /* На экранах сворачивать нечего: у каждого раздела свой экран. Раздел,
       свёрнутый ещё в старой ленте, иначе так и остался бы пустым. */
    if (document.querySelector('.adm-shell')) {
      document.querySelectorAll('.admin-section.is-collapsed').forEach(section => section.classList.remove('is-collapsed'));
      return;
    }
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
    catEditorShow('section-subjects', Boolean(subject));
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
    renderCat3();
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
    if (deleteId) await deleteSubjectById(deleteId);
  });

  // Удаление раздела — из прежнего списка и из колонок каталога.
  async function deleteSubjectById(subjectId) {
    const deleteId = String(subjectId);
    const subject = subjects.find(item => String(item.id) === deleteId);
    if (!subject) return false;
    const count = topics.filter(topic => String(topic.subject_id) === deleteId).length;
    const warning = count ? ` Его темы (${count} шт.) останутся, но потеряют раздел.` : '';
    if (!confirm(`Удалить раздел «${subject.title}»?${warning}`)) return false;
    const { error } = await db.from('subjects').delete().eq('id', deleteId);
    if (error) { subjectSuccess.textContent = 'Ошибка: ' + error.message; return false; }
    if (String(editingSubjectId) === deleteId) { subjectForm.reset(); setSubjectMode(null); }
    subjectSuccess.textContent = 'Раздел удалён.';
    await loadCatalog();
    return true;
  }

  /* ── Темы ─────────────────────────────────────────────────────────── */

  function setTopicMode(topic) {
    catEditorShow('section-topics', Boolean(topic));
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
    renderCat3();
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
    if (deleteId) await deleteTopicById(deleteId);
  });

  // Удаление темы — из прежнего списка и из колонок каталога.
  async function deleteTopicById(topicId) {
    const deleteId = String(topicId);
    const topic = topics.find(item => String(item.id) === deleteId);
    if (!topic) return false;
    const count = getTopicTaskCount(deleteId);
    const note = count ? ` Задачи этой темы (${count}) останутся, но потеряют привязку.` : ' Задач в ней нет.';
    if (!confirm(`Удалить тему «${topic.title}»?${note}`)) return false;
    const { error } = await db.from('topics').delete().eq('id', deleteId);
    if (error) { topicSuccess.textContent = 'Ошибка: ' + error.message; return false; }
    topics = topics.filter(t => String(t.id) !== deleteId);
    if (topic.grade != null) {
      await rebalanceTopicPositions(topic.grade);
    }
    if (String(editingTopicId) === deleteId) { topicForm.reset(); setTopicMode(null); }
    topicSuccess.textContent = 'Тема удалена.';
    await loadCatalog();
    return true;
  }

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
    catEditorShow('section-subtopics', Boolean(sub));
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
    renderCat3();
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
    if (deleteId) await deleteSubtopicById(deleteId);
  });

  // Удаление подтемы — из прежнего списка и из колонок каталога.
  async function deleteSubtopicById(subtopicId) {
    const deleteId = String(subtopicId);
    const sub = subtopics.find(s => String(s.id) === deleteId);
    if (!sub) return false;
    const count = taskIndex.filter(t => String(t.subtopic_id) === deleteId).length;
    if (!confirm(`Удалить подтему «${subtopicLabel(sub)}»?${count ? ` ${count} задач останутся в теме, но потеряют подтему.` : ''}`)) return false;
    const { error } = await db.from('subtopics').delete().eq('id', deleteId);
    if (error) { subtopicSuccess.textContent = 'Ошибка: ' + error.message; return false; }
    subtopics = subtopics.filter(s => String(s.id) !== deleteId);
    if (sub.topic_id) {
      await rebalanceSubtopicPositions(sub.topic_id);
    }
    if (String(editingSubtopicId) === deleteId) { subtopicForm.reset(); setSubtopicMode(null); }
    subtopicSuccess.textContent = 'Подтема удалена.';
    await loadCatalog();
    return true;
  }

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
    .forEach(input => input.addEventListener('input', () => {
      updatePreviews();
      if (typeof updateReadyBar === 'function') updateReadyBar();
    }));

  // Переключение языковых вкладок в форме задания (RU / LV)
  const admEditorLangRu = byId('adm-editor-lang-ru');
  const admEditorLangLv = byId('adm-editor-lang-lv');
  const admEditorLangBoth = byId('adm-editor-lang-both');
  const taskLangTabs = document.querySelectorAll('.task-lang-tab');
  const taskLangGroups = document.querySelectorAll('.task-lang-group');
  /* Режим «RU + LV» — русские поля слева, латышские справа — помнится между
     задачами и визитами; одиночный язык при открытии задачи — русский. */
  const EDITOR_LANG_KEY = 'mt-admin-editor-lang';
  let currentEditorLang = 'ru';
  try { if (localStorage.getItem(EDITOR_LANG_KEY) === 'both') currentEditorLang = 'both'; } catch {}

  function setEditorLanguage(lang) {
    currentEditorLang = ['lv', 'both'].includes(lang) ? lang : 'ru';
    const both = currentEditorLang === 'both';
    [[admEditorLangRu, 'ru'], [admEditorLangLv, 'lv'], [admEditorLangBoth, 'both']].forEach(([btn, value]) => {
      if (!btn) return;
      btn.classList.toggle('active', currentEditorLang === value);
      btn.setAttribute('aria-pressed', String(currentEditorLang === value));
    });
    taskLangTabs.forEach(t => t.classList.toggle('active', t.dataset.taskLang === currentEditorLang));
    // Группы полей (.task-lang-group) тоже помечены data-lang-group — один проход на всё.
    document.querySelectorAll('[data-lang-group]').forEach(el => {
      el.hidden = !both && el.dataset.langGroup !== currentEditorLang;
    });
    taskForm?.classList.toggle('is-lang-both', both);
    updatePreviews();
    if (typeof updateReadyBar === 'function') updateReadyBar();
  }

  // Показать поле нужного языка: в режиме «RU + LV» оба уже на экране.
  function ensureLangVisible(lang) {
    if (currentEditorLang !== 'both' && currentEditorLang !== lang) setEditorLanguage(lang);
  }

  [['ru', admEditorLangRu], ['lv', admEditorLangLv], ['both', admEditorLangBoth]].forEach(([lang, btn]) => {
    btn?.addEventListener('click', () => {
      setEditorLanguage(lang);
      try { localStorage.setItem(EDITOR_LANG_KEY, lang === 'both' ? 'both' : 'single'); } catch {}
    });
  });

  taskLangTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      setEditorLanguage(tab.dataset.taskLang);
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

  /* Чертёж разметкой — из импорта или от генератора — ложится в хранилище
     тем же путём, что и загруженный файл. Перед загрузкой вычищаем и
     проверяем разбором: SVG с одной неэкранированной «&» в подписи браузер
     не покажет вовсе, и узнать об этом лучше при импорте, чем на сайте. */
  async function uploadSvgMarkup(kind, markup) {
    const clean = window.MathTasksLib.sanitizeSvg(markup);
    if (clean.error) return { error: clean.error };
    const doc = new DOMParser().parseFromString(clean.svg, 'image/svg+xml');
    if (doc.querySelector('parsererror') || doc.documentElement.nodeName.toLowerCase() !== 'svg') {
      return { error: 'в разметке ошибка, браузер её не покажет' };
    }
    const path = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.svg`;
    const blob = new Blob([clean.svg], { type: 'image/svg+xml' });
    const { error } = await storage().upload(path, blob, { contentType: 'image/svg+xml' });
    if (error) return { error: 'не удалось загрузить: ' + error.message };
    return { path };
  }

  function paintImage(kind) {
    const thumb = document.querySelector(`#${kind}-image-thumb`);
    const url = window.MathTasks.imageUrl(images[kind].current);
    thumb.hidden = !url;
    if (url) thumb.src = url;
    document.querySelector(`#${kind}-image-clear`).hidden = !url;
    if (typeof updateReadyBar === 'function') updateReadyBar();
  }

  /* ── Код чертежа: правка SVG прямо в форме ──────────────────────────
     Поле с живым предпросмотром — так же, как увидит посетитель (через
     img). При открытии задачи в поле подгружается текущий SVG. Изменённый
     код сохраняется новым файлом при сохранении задачи, а старый файл
     удаляется тем же путём, что и при замене загрузкой. Пустое поле
     чертёж не убирает — для этого есть кнопка «Убрать». */
  const SVG_CODE_HINT = 'Вставьте или измените SVG — предпросмотр обновится сразу.';
  const svgCode = {};
  for (const kind of ['condition', 'solution']) {
    const area = document.querySelector(`#${kind}-svg-code`);
    if (!area) continue;
    svgCode[kind] = {
      area,
      preview: document.querySelector(`#${kind}-svg-preview`),
      status: document.querySelector(`#${kind}-svg-status`),
      loaded: ''
    };
    area.addEventListener('input', () => paintSvgCode(kind));
  }

  function paintSvgCode(kind) {
    const box = svgCode[kind];
    if (!box) return;
    const code = box.area.value.trim();
    const say = text => { if (box.status) box.status.textContent = text; };
    if (!code) {
      box.preview.hidden = true;
      say(box.loaded ? 'Поле пустое — чертёж останется прежним. Убрать его — кнопка «Убрать».' : SVG_CODE_HINT);
      return;
    }
    const clean = window.MathTasksLib.sanitizeSvg(code);
    let problem = clean.error;
    if (!problem && new DOMParser().parseFromString(clean.svg, 'image/svg+xml').querySelector('parsererror')) {
      problem = 'в разметке ошибка — проверьте закрытые теги и кавычки';
    }
    if (problem) {
      box.preview.hidden = true;
      say('Не показать: ' + problem + '.');
      return;
    }
    box.preview.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(clean.svg);
    box.preview.hidden = false;
    say(code === box.loaded ? 'Текущий чертёж.' : 'Изменено — сохранится вместе с задачей.');
  }

  async function loadSvgCode(kind, path) {
    const box = svgCode[kind];
    if (!box) return;
    box.area.value = '';
    box.loaded = '';
    if (path && /\.svg$/i.test(path)) {
      try {
        const res = await fetch(window.MathTasks.imageUrl(path), { cache: 'no-store' });
        const text = res.ok ? (await res.text()).trim() : '';
        // Пока файл грузился, могли открыть другую задачу — чужой код не ставим.
        if (text && images[kind].current === path) {
          box.area.value = text;
          box.loaded = text;
        }
      } catch (err) {
        console.warn('Не удалось загрузить код чертежа:', err.message);
      }
    }
    paintSvgCode(kind);
  }

  /* Перед сохранением: изменённый код — новым файлом, как при загрузке. */
  async function applySvgCodeEdits() {
    for (const kind of ['condition', 'solution']) {
      const box = svgCode[kind];
      const code = box?.area.value.trim();
      if (!box || !code || code === box.loaded) continue;
      const uploaded = await uploadSvgMarkup(kind, code);
      if (!uploaded.path) return `Чертёж ${kind === 'condition' ? 'условия' : 'решения'} не сохранён: ${uploaded.error}.`;
      const previous = images[kind].current;
      images[kind].current = uploaded.path;
      if (previous && previous !== images[kind].saved) await removeFile(previous);
      box.loaded = code;
      paintImage(kind);
    }
    return null;
  }

  function setImages(task) {
    for (const kind of ['condition', 'solution']) {
      const path = task?.[`${kind}_image`] || null;
      images[kind] = { saved: path, current: path };
      document.querySelector(`#${kind}-image-input`).value = '';
      document.querySelector(`#${kind}-image-error`).textContent = '';
      paintImage(kind);
      loadSvgCode(kind, path);
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
      loadSvgCode(kind, path);
    });

    document.querySelector(`#${kind}-image-clear`).addEventListener('click', async () => {
      const { saved, current } = images[kind];
      if (current && current !== saved) await removeFile(current);
      images[kind].current = null;
      input.value = '';
      errorElement.textContent = '';
      paintImage(kind);
      loadSvgCode(kind, null);
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
    if (typeof updateReadyBar === 'function') updateReadyBar();
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

  /* ── Место задачи: класс → тема → подтема ─────────────────────────
     Три обычных списка в цепочке над формой. Они — поля самой формы
     (атрибут form="task-form"), поэтому сохранение, «Клонировать» и
     генератор читают их как раньше. Класс сужает темы, тема — подтемы;
     без класса видны темы всех классов, сгруппированные по классам.
     В скобках — сколько задач уже лежит в этом месте. */
  const PLACE_GRADES = [
    { g: 1, label: '1. klase' }, { g: 2, label: '2. klase' }, { g: 3, label: '3. klase' },
    { g: 4, label: '4. klase' }, { g: 5, label: '5. klase' }, { g: 6, label: '6. klase' },
    { g: 7, label: '7. klase' }, { g: 8, label: '8. klase' }, { g: 9, label: '9. klase (Eksāmens)' },
    { g: 10, label: '10. klase (Vispārīgais)' }, { g: 11, label: '11. klase (Matemātika I)' },
    { g: 12, label: '12. klase (Matemātika II)' }
  ];
  const PLACE_STAGES = [
    { label: 'Pamatskola (1.–9. klase)', grades: PLACE_GRADES.slice(0, 9) },
    { label: 'Vidusskola (10.–12. klase)', grades: PLACE_GRADES.slice(9) }
  ];
  const naturalCompare = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  const positionOf = item => (item.position == null ? 9999 : Number(item.position));
  const titleCompare = (a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'ru');

  function cleanTopicTitle(title) {
    return String(title || '').replace(/^(\d+(?:\.\d+)*)\.?\s+/, '').trim();
  }

  /* Номер темы по Skola2030 («7.3»): из названия, иначе из кода первой
     подтемы («7.3.2» → «7.3»), иначе класс и позиция темы. */
  function getTopicCode(topic) {
    if (!topic) return '';
    const own = String(topic.title || '').trim().match(/^(\d+(?:\.\d+)+)\.?\s+/);
    if (own) return own[1];
    const sub = subtopics.find(s => String(s.topic_id) === String(topic.id) && /^\d+\.\d+/.test(s.code || ''));
    if (sub) return sub.code.match(/^\d+\.\d+/)[0];
    const g = parseFormGrade(topic.grade);
    return g && positionOf(topic) < 9999 ? `${g}.${positionOf(topic)}` : '';
  }

  function topicCodeMap() {
    return new Map(topics.map(t => [t.id, getTopicCode(t)]));
  }

  // Класс → номер темы → позиция → название. Темы без номера — в конце класса.
  function sortTopics(list, codes) {
    return [...list].sort((a, b) =>
      gradeRank(a.grade) - gradeRank(b.grade)
      || (codes.get(a.id) ? 0 : 1) - (codes.get(b.id) ? 0 : 1)
      || naturalCompare(codes.get(a.id) || '', codes.get(b.id) || '')
      || positionOf(a) - positionOf(b)
      || titleCompare(a, b));
  }

  const topicOptionText = (topic, codes) => {
    const code = codes.get(topic.id);
    return `${code ? code + '. ' : ''}${cleanTopicTitle(topic.title)}`;
  };

  /* Сколько задач в каждом классе, теме и подтеме — одним проходом по
     указателю задач. Класс задачи — её собственный, иначе класс темы. */
  function countPlaces() {
    const topicGrade = new Map(topics.map(t => [String(t.id), parseFormGrade(t.grade)]));
    const counts = { grade: new Map(), topic: new Map(), sub: new Map() };
    const bump = (map, key) => map.set(key, (map.get(key) || 0) + 1);
    for (const task of taskIndex) {
      const g = parseFormGrade(task.grade) ?? topicGrade.get(String(task.topic_id)) ?? null;
      if (g !== null) bump(counts.grade, g);
      if (task.topic_id) bump(counts.topic, String(task.topic_id));
      if (task.subtopic_id) bump(counts.sub, String(task.subtopic_id));
    }
    return counts;
  }
  function getGradeTaskCount(grade, counts = countPlaces()) {
    return counts.grade.get(parseFormGrade(grade)) || 0;
  }
  function getTopicTaskCount(topicId, counts = countPlaces()) {
    return counts.topic.get(String(topicId)) || 0;
  }
  function getSubtopicTaskCount(subtopicId, counts = countPlaces()) {
    return counts.sub.get(String(subtopicId)) || 0;
  }

  function updateTaskGradeDropdown() {
    if (!taskGradeSelect) return;
    const keep = taskGradeSelect.value;
    const counts = countPlaces();
    taskGradeSelect.innerHTML = '<option value="">Без класса</option>' + PLACE_STAGES.map(stage =>
      `<optgroup label="${stage.label}">${stage.grades.map(({ g, label }) =>
        `<option value="${g}" data-label="${label}" data-count="${getGradeTaskCount(g, counts)}">${label} (${getGradeTaskCount(g, counts)})</option>`).join('')}</optgroup>`
    ).join('');
    taskGradeSelect.value = keep;
    if (taskGradeSelect.selectedIndex < 0) taskGradeSelect.value = '';
  }

  /* preferredTopicId — тема открытой задачи (undefined или '' — «без темы»).
     Без аргумента список просто пересобирается, выбор сохраняется, если
     тема есть в текущем классе. */
  function updateTaskTopicDropdown(preferredTopicId = null) {
    if (!topicSelect) return;
    const wanted = preferredTopicId !== null ? String(preferredTopicId ?? '') : topicSelect.value;
    // Тему задаёт задача, а класс в форме другой — подгоняем класс под тему.
    const wantedTopic = preferredTopicId !== null && wanted ? topics.find(t => String(t.id) === wanted) : null;
    if (wantedTopic?.grade != null && taskGradeSelect && parseFormGrade(taskGradeSelect.value) !== parseFormGrade(wantedTopic.grade)) {
      taskGradeSelect.value = toAdminGradeVal(wantedTopic.grade);
    }
    const grade = parseFormGrade(taskGradeSelect?.value);
    const pool = grade === null ? topics : topics.filter(t => parseFormGrade(t.grade) === grade);
    const codes = topicCodeMap();
    const counts = countPlaces();
    // data-* — для оформленного окна выбора: номер, название и число задач по отдельности.
    const option = t => {
      const n = getTopicTaskCount(t.id, counts);
      return `<option value="${t.id}" data-code="${escapeHtml(codes.get(t.id) || '')}" data-label="${escapeHtml(cleanTopicTitle(t.title))}" data-count="${n}">${escapeHtml(topicOptionText(t, codes))} (${n})</option>`;
    };
    const sorted = sortTopics(pool, codes);
    let html = '<option value="">Без темы</option>';
    if (grade !== null) {
      html += sorted.map(option).join('');
    } else {
      const groups = new Map();
      for (const t of sorted) {
        const g = parseFormGrade(t.grade);
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g).push(t);
      }
      for (const [g, list] of groups) {
        const label = PLACE_GRADES.find(item => item.g === g)?.label || 'Без класса';
        html += `<optgroup label="${escapeHtml(label)}">${list.map(option).join('')}</optgroup>`;
      }
    }
    topicSelect.innerHTML = html;
    topicSelect.value = pool.some(t => String(t.id) === wanted) ? wanted : '';
  }

  function updateFilterTopicDropdown() {
    if (!taskFilterTopic) return;
    const grade = parseFormGrade(taskFilterGrade?.value);
    const keep = taskFilterTopic.value;
    const pool = grade === null ? topics : topics.filter(t => parseFormGrade(t.grade) === grade);
    const codes = topicCodeMap();
    taskFilterTopic.innerHTML = '<option value="">Все темы</option>' + sortTopics(pool, codes).map(t =>
      `<option value="${t.id}">${escapeHtml(topicOptionText(t, codes))} (${gradeText(t.grade)})</option>`
    ).join('');
    taskFilterTopic.value = pool.some(t => String(t.id) === keep) ? keep : '';
  }

  /* Подтемы принадлежат теме, поэтому список пересобирается при каждой
     смене темы. Пустой список — не ошибка: у темы может не быть подтем. */
  function updateSubtopicDropdown(preferredSubtopicId = null) {
    if (!subtopicSelect) return;
    const topicId = topicSelect?.value || '';
    const wanted = preferredSubtopicId !== null ? String(preferredSubtopicId ?? '') : subtopicSelect.value;
    const mine = topicId ? subtopics.filter(s => String(s.topic_id) === topicId) : [];
    mine.sort((a, b) =>
      (a.code ? 0 : 1) - (b.code ? 0 : 1)
      || naturalCompare(a.code || '', b.code || '')
      || positionOf(a) - positionOf(b)
      || titleCompare(a, b));
    const counts = countPlaces();
    const empty = !topicId ? 'Сначала выберите тему' : 'Без подтемы';
    subtopicSelect.innerHTML = `<option value="">${empty}</option>` + mine.map(s =>
      `<option value="${s.id}" data-code="${escapeHtml(s.code || '')}" data-label="${escapeHtml(s.title)}" data-count="${getSubtopicTaskCount(s.id, counts)}">${escapeHtml(`${s.code ? s.code + ' ' : ''}${s.title}`)} (${getSubtopicTaskCount(s.id, counts)})</option>`
    ).join('');
    subtopicSelect.value = mine.some(s => String(s.id) === wanted) ? wanted : '';
    subtopicSelect.disabled = !mine.length;
  }

  taskGradeSelect?.addEventListener('change', () => {
    updateTaskTopicDropdown();
    updateSubtopicDropdown();
    updateEditorCrumbs();
  });

  topicSelect?.addEventListener('change', () => {
    const topic = topics.find(item => String(item.id) === topicSelect.value);
    // Тему выбрали из списка всех классов — класс берём у темы.
    if (topic?.grade != null && parseFormGrade(taskGradeSelect?.value) !== parseFormGrade(topic.grade)) {
      updateTaskTopicDropdown(topic.id);
    }
    updateSubtopicDropdown();
    if (getSelectedTagSlugs().length === 0 && topic) {
      const text = `${topic.title} ${topic.description || ''}`;
      const suggested = window.MathTasksLib?.suggestTagsForTopic(text) || [];
      if (suggested.length) setSelectedTagSlugs(suggested);
    }
    updateEditorCrumbs();
  });

  subtopicSelect?.addEventListener('change', () => updateEditorCrumbs());

  const admPlaceCount = byId('adm-place-count');

  function declTasks(n) {
    const mod10 = n % 10, mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 14) return 'задач';
    if (mod10 === 1) return 'задача';
    if (mod10 >= 2 && mod10 <= 4) return 'задачи';
    return 'задач';
  }

  function declItems(n) {
    const mod10 = n % 10, mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 14) return 'пунктов';
    if (mod10 === 1) return 'пункт';
    if (mod10 >= 2 && mod10 <= 4) return 'пункта';
    return 'пунктов';
  }

  // Справа в цепочке: сколько задач уже лежит в выбранном месте.
  function updateEditorCrumbs() {
    if (admPlaceCount) {
      const counts = countPlaces();
      const subId = subtopicSelect?.value;
      const topicId = topicSelect?.value;
      const grade = parseFormGrade(taskGradeSelect?.value);
      let text = '';
      if (subId) {
        const n = getSubtopicTaskCount(subId, counts);
        text = `в подтеме уже ${n} ${declTasks(n)}`;
      } else if (topicId) {
        const n = getTopicTaskCount(topicId, counts);
        text = `в теме уже ${n} ${declTasks(n)}`;
      } else if (grade !== null) {
        const n = getGradeTaskCount(grade, counts);
        text = `в классе уже ${n} ${declTasks(n)}`;
      } else if (taskIndex.length) {
        text = `всего ${taskIndex.length} ${declTasks(taskIndex.length)}`;
      }
      admPlaceCount.textContent = text;
    }
    updateReadyBar();
  }

  // После загрузки каталога или указателя задач — пересобрать списки и числа.
  function refreshPlaceLists() {
    updateTaskGradeDropdown();
    updateTaskTopicDropdown();
    updateSubtopicDropdown();
    updateEditorCrumbs();
    renderCat3();
  }

  // ── Полоса «чего не хватает» и действия сохранения ──────────
  const admEditorReadyBar = byId('adm-editor-ready-bar');
  const admReadyDot = byId('adm-ready-dot');
  const admReadyText = byId('adm-ready-text');
  const admMissingChips = byId('adm-missing-chips');
  const admBtnSaveDraft = byId('adm-btn-save-draft');
  const admBtnPublish = byId('adm-btn-publish');
  const admBtnCancelEdit = byId('adm-btn-cancel-edit');

  function checkFormulaSyntax(text) {
    if (!text) return { ok: true };
    const dollars = (text.match(/\$/g) || []).length;
    if (dollars % 2 !== 0) {
      return { ok: false, error: 'Непарный знак $ (формула не закрыта)' };
    }
    if (window.katex && dollars > 0) {
      const parts = text.split('$');
      for (let i = 1; i < parts.length; i += 2) {
        const expr = parts[i].trim();
        if (expr) {
          try {
            window.katex.renderToString(expr, { throwOnError: true });
          } catch (err) {
            const previewSnippet = expr.length > 20 ? expr.slice(0, 18) + '…' : expr;
            return { ok: false, error: `Ошибка в формуле $${previewSnippet}$: ${err.message}` };
          }
        }
      }
    }
    return { ok: true };
  }

  /* Условия всех задач базы — для метки «такое условие уже есть». Ключ тот
     же, что у поиска дублей при импорте (importDupKey). Грузим один раз, при
     первой проверке; сама редактируемая задача себе не повтор. */
  let dupIndex = null;
  let dupIndexLoading = false;

  function loadDupIndex() {
    const lib = window.MathTasksLib;
    if (dupIndexLoading || !db || !lib?.fetchAllRows || !lib.importDupKey) return;
    dupIndexLoading = true;
    lib.fetchAllRows(() => db.from('tasks').select('id,condition_latex').order('id'))
      .then(({ data, error }) => {
        if (error) return;
        const index = new Map();
        for (const row of data || []) {
          const key = lib.importDupKey(row.condition_latex);
          if (!key) continue;
          if (!index.has(key)) index.set(key, []);
          index.get(key).push(row.id);
        }
        dupIndex = index;
        updateReadyBar();
      })
      .catch(() => {})
      .finally(() => { dupIndexLoading = false; });
  }

  function duplicateTaskIds(condition) {
    const lib = window.MathTasksLib;
    if (!condition || !lib?.importDupKey) return [];
    if (!dupIndex) {
      loadDupIndex();
      return [];
    }
    return (dupIndex.get(lib.importDupKey(condition)) || []).filter(id => id !== editingTaskId);
  }

  function updateReadyBar() {
    // Полосу зовут при каждом изменении формы — заодно обновляем всё, что показывает её состояние.
    syncEditorWidgets();
    if (!admReadyText || !admReadyDot) return;
    const condRu = conditionInput?.value.trim() || '';
    const condLv = conditionInputLv?.value.trim() || '';
    const ansRu = answerInput?.value.trim() || '';
    const ansLv = answerInputLv?.value.trim() || '';
    const solRu = solutionInput?.value.trim() || '';
    const solLv = solutionInputLv?.value.trim() || '';
    const hintRu = hintInput?.value.trim() || '';
    const hintLv = hintInputLv?.value.trim() || '';

    const chips = [];

    // 1. Условие (RU)
    if (!condRu) {
      chips.push({ level: 'bad', text: 'Нет условия (RU)', action: 'focus-cond-ru' });
    } else {
      const fCheck = checkFormulaSyntax(condRu);
      if (!fCheck.ok) {
        chips.push({ level: 'bad', text: 'Ошибка $ в условии RU', action: 'focus-cond-ru', title: fCheck.error });
      }
      const hasQuestion = /[?]|найдите|вычислите|определите|решите|докажите|упростите|постройте|сколько|какой|назовите/i.test(condRu);
      if (!hasQuestion && condRu.length < 50) {
        chips.push({ level: 'info', text: 'Нет вопроса в условии', action: 'focus-cond-ru', title: 'Рекомендуется добавить чёткий вопрос или требование к задаче' });
      }
    }

    // 2. Перевод условия на латышский (LV)
    if (!condLv) {
      chips.push({ level: 'warn', text: 'Нет перевода на LV', action: 'switch-lv', title: 'Нажмите, чтобы переключить вкладку на латышский язык' });
    } else {
      const fCheckLv = checkFormulaSyntax(condLv);
      if (!fCheckLv.ok) {
        chips.push({ level: 'bad', text: 'Ошибка $ в условии LV', action: 'focus-cond-lv', title: fCheckLv.error });
      }
    }

    // 3. Краткий ответ (RU / LV)
    if (!ansRu && !ansLv) {
      chips.push({ level: 'warn', text: 'Нет краткого ответа', action: 'focus-ans', title: 'Краткий ответ нужен для мгновенной самопроверки ученика' });
    } else {
      if (ansRu && !checkFormulaSyntax(ansRu).ok) {
        chips.push({ level: 'bad', text: 'Ошибка $ в ответе RU', action: 'focus-ans' });
      }
      if (ansLv && !checkFormulaSyntax(ansLv).ok) {
        chips.push({ level: 'bad', text: 'Ошибка $ в ответе LV', action: 'focus-ans-lv' });
      }
      if (condLv && ansRu && !ansLv) {
        chips.push({ level: 'info', text: 'Нет ответа на LV', action: 'focus-ans-lv', title: 'Atbilde на латышском языке' });
      }
    }

    // 4. Пошаговое решение / разбор (RU / LV)
    if (!solRu && !solLv) {
      chips.push({ level: 'warn', text: 'Нет пошагового решения', action: 'focus-sol', title: 'Разбор решения помогает ученику разобраться в ошибках' });
    } else {
      if (solRu && !checkFormulaSyntax(solRu).ok) {
        chips.push({ level: 'bad', text: 'Ошибка $ в решении RU', action: 'focus-sol' });
      }
      if (solLv && !checkFormulaSyntax(solLv).ok) {
        chips.push({ level: 'bad', text: 'Ошибка $ в решении LV', action: 'focus-sol-lv' });
      }
      if (condLv && solRu && !solLv) {
        chips.push({ level: 'info', text: 'Нет решения на LV', action: 'focus-sol-lv', title: 'Atrisinājums на латышском языке' });
      }
    }

    // 5. Подсказка для ученика (RU / LV). У задачи с полем ответа подсказка
    //    открывается после первой ошибки — без неё ученику нечего открыть до второй.
    const lib = window.MathTasksLib || {};
    const answerForField = ansRu || ansLv;
    const hasAnswerField = Boolean(answerForField) && (!lib.isAnswerAutoCheckable || lib.isAnswerAutoCheckable(answerForField));
    if (!hintRu && !hintLv) {
      chips.push(hasAnswerField
        ? { level: 'warn', text: 'Нет подсказки', action: 'focus-hint', title: 'Подсказка открывается после первой неверной попытки — без неё ученику нечего открыть до второй' }
        : { level: 'info', text: 'Нет подсказки', action: 'focus-hint', title: 'Подсказка даёт направление мысли без готового ответа' });
    } else {
      if (hintRu && !checkFormulaSyntax(hintRu).ok) {
        chips.push({ level: 'bad', text: 'Ошибка $ в подсказке RU', action: 'focus-hint' });
      }
      if (hintLv && !checkFormulaSyntax(hintLv).ok) {
        chips.push({ level: 'bad', text: 'Ошибка $ в подсказке LV', action: 'focus-hint-lv' });
      }
      if (condLv && hintRu && !hintLv) {
        chips.push({ level: 'info', text: 'Нет подсказки на LV', action: 'focus-hint-lv', title: 'Norāde на латышском языке' });
      }
    }

    // 5а. Поля между собой: то, что не видно, пока смотришь на каждое поле отдельно.
    if (lib.isAnswerAutoCheckable) {
      const notCheckable = [[ansRu, 'focus-ans', ''], [ansLv, 'focus-ans-lv', ' (LV)']]
        .find(([answer]) => answer && !lib.isAnswerAutoCheckable(answer));
      if (notCheckable) {
        chips.push({ level: 'warn', text: `Ответ не проверяется автоматически${notCheckable[2]}`, action: notCheckable[1],
          title: 'У задачи не будет поля ответа: ответ и решение откроются сразу. Запишите ответ числом, выражением или списком значений — без слов («120», а не «120 книг»)' });
      }
    }
    if (lib.answersDisagree && lib.answersDisagree(ansRu, ansLv)) {
      chips.push({ level: 'bad', text: 'Ответы RU и LV расходятся', action: 'focus-ans-lv', title: 'В русском и латышском ответе разные числа' });
    }
    if (lib.missingAnswerNumbers) {
      for (const [answer, solution, action, suffix] of [[ansRu, solRu, 'focus-sol', 'RU'], [ansLv || ansRu, solLv, 'focus-sol-lv', 'LV']]) {
        const missing = lib.missingAnswerNumbers(answer, solution);
        if (missing.length) {
          chips.push({ level: 'warn', text: `Ответа нет в решении ${suffix}`, action,
            title: `В решении не встречается: ${missing.join('; ')}. Проверьте, что решение приходит к ответу` });
        }
      }
    }
    if (lib.hintRevealsAnswer) {
      const reveals = [[ansRu, hintRu, 'focus-hint', ''], [ansLv || ansRu, hintLv, 'focus-hint-lv', ' (LV)']]
        .find(([answer, hint]) => answer && hint && lib.hintRevealsAnswer(answer, hint));
      if (reveals) {
        chips.push({ level: 'warn', text: `Подсказка выдаёт ответ${reveals[3]}`, action: reveals[2],
          title: 'В подсказке уже записан результат («= …»). Подсказка даёт направление, а ответ открывается позже' });
      }
    }
    const latvianInRu = [[condRu, 'focus-cond-ru'], [ansRu, 'focus-ans'], [solRu, 'focus-sol'], [hintRu, 'focus-hint']]
      .find(([text]) => /[āčēģīķļņšūž]/i.test(text));
    if (latvianInRu) {
      chips.push({ level: 'warn', text: 'Латышские буквы в русском тексте', action: latvianInRu[1], title: 'Похоже, в русское поле попал латышский текст' });
    }
    const cyrillicInLv = [[condLv, 'focus-cond-lv'], [ansLv, 'focus-ans-lv'], [solLv, 'focus-sol-lv'], [hintLv, 'focus-hint-lv']]
      .find(([text]) => /[а-яё]/i.test(text));
    if (cyrillicInLv) {
      chips.push({ level: 'warn', text: 'Кириллица в латышском тексте', action: cyrillicInLv[1],
        title: 'В латышской версии осталась кириллица — русский текст или единицы («см» вместо «cm»)' });
    }
    const dupIds = duplicateTaskIds(condRu);
    if (dupIds.length) {
      chips.push({ level: 'warn', text: `Такое условие уже есть (id ${dupIds.slice(0, 3).join(', ')})`, action: 'focus-cond-ru',
        title: 'В базе уже есть задача с тем же условием — возможно, это повтор' });
    }

    // 6. Класс, тема и подтема Skola2030
    const g = parseFormGrade(taskGradeSelect?.value);
    if (!g) {
      chips.push({ level: 'warn', text: 'Не указан класс', action: 'pick-grade', title: 'Выберите класс от 1 до 12' });
    }

    const curTopicId = Number(topicSelect?.value) || null;
    if (!curTopicId) {
      chips.push({ level: 'warn', text: 'Не привязана тема', action: 'pick-topic', title: 'Привяжите задачу к теме каталога' });
    } else {
      const curSubId = Number(subtopicSelect?.value) || null;
      const topicSubs = subtopics.filter(s => s.topic_id === curTopicId);
      if (topicSubs.length > 0 && !curSubId) {
        chips.push({ level: 'warn', text: 'Не выбрана подтема Skola2030', action: 'pick-subtopic', title: 'Выберите подтему/навык стандарта Skola2030' });
      }
    }

    // 7. Кросс-теги
    const tags = getSelectedTagSlugs();
    if (tags.length === 0) {
      chips.push({ level: 'warn', text: 'Нет кросс-тегов (0/3)', action: 'suggest-tags', title: 'Нажмите для автоматического подбора тегов по теме' });
    } else if (tags.length > 3) {
      chips.push({ level: 'warn', text: `Слишком много тегов (${tags.length}/3)`, action: 'scroll-tags' });
    }

    // 8. Чертёж / иллюстрация
    const allText = `${condRu} ${condLv} ${solRu}`;
    const mentionsDrawing = /черт[её]ж|рисун|график|треугольн|окружност|угол|трапеци|пирамид|конус|призм|прямоугольн|квадрат|координат|диаграмм|вектор|эскиз|zīmējum|grafik|trijstūr|leņķ|riņķ|trapec|koordināt|vektor/i.test(allText);
    const hasDrawing = Boolean(images?.condition?.current || images?.solution?.current || svgCode.condition?.area.value.trim() || svgCode.solution?.area.value.trim());
    if (mentionsDrawing && !hasDrawing) {
      chips.push({ level: 'warn', text: 'Вероятно, нужен чертёж', action: 'scroll-drawing', title: 'В тексте упоминается геометрия или график, но чертёж не прикреплён' });
    }

    // Статус в плашке
    const badChips = chips.filter(c => c.level === 'bad');
    const warnChips = chips.filter(c => c.level === 'warn');
    const infoChips = chips.filter(c => c.level === 'info');

    if (badChips.length > 0) {
      admReadyDot.className = 'adm-ready-dot bad';
      admReadyText.textContent = `Ошибки в карточке (${badChips.length}) — исправьте перед сохранением`;
    } else if (warnChips.length > 0) {
      admReadyDot.className = 'adm-ready-dot warn';
      admReadyText.textContent = `Черновик готов. До полной карточки не хватает: ${warnChips.length + infoChips.length} ${declItems(warnChips.length + infoChips.length)}`;
    } else if (infoChips.length > 0) {
      admReadyDot.className = 'adm-ready-dot ok';
      admReadyText.textContent = `Готово к публикации. Рекомендаций: ${infoChips.length}`;
    } else {
      admReadyDot.className = 'adm-ready-dot ok';
      admReadyText.textContent = 'Все параметры задачи заполнены — карточка идеальна!';
    }

    // Отрисовка интерактивных фишек
    if (admMissingChips) {
      if (chips.length > 0) {
        admMissingChips.innerHTML = `<span class="adm-missing-caption">Чего не хватает:</span>` +
          chips.map(c => `<button type="button" class="adm-missing-chip ${c.level}" data-missing-action="${c.action}" title="${escapeHtml(c.title || 'Нажмите, чтобы исправить')}"><span>${escapeHtml(c.text)}</span><span class="adm-missing-chip-arrow">→</span></button>`).join('');
      } else {
        admMissingChips.innerHTML = `<span class="adm-missing-all-ok">✅ Все параметры задачи заполнены — можно публиковать!</span>`;
      }
    }
  }

  /* ── «Как увидит посетитель»: карточка справа от формы, как в макете ──
     Условие с чертежом, подсказка, ответ и решение на выбранном языке,
     место задачи и кросс-теги. Сломанная формула подсвечивается красным:
     renderMath рисует её с throwOnError: false. Элементы ищем при каждом
     вызове — функцию зовут и до того, как дошла очередь до констант ниже. */
  function renderVisitorPreview() {
    const cond = byId('adm-preview-cond');
    if (!cond) return;
    const both = currentEditorLang === 'both';
    const lv = currentEditorLang === 'lv';
    // В режиме «RU + LV» основной текст русский, латышский — под ним.
    const value = (ruInput, lvInput) => ((lv ? lvInput : ruInput)?.value || '').trim();
    const put = (el, text, emptyText) => {
      if (!el) return;
      if (!text) {
        el.innerHTML = emptyText ? `<span class="adm-preview-empty">${emptyText}</span>` : '';
        return;
      }
      renderMath(el, text);
      /* Формулу с непарной скобкой KaTeX не находит вовсе и оставляет сырым
         текстом, без красного, — поэтому ошибку называем явно. */
      const check = checkFormulaSyntax(text);
      if (!check.ok) el.insertAdjacentHTML('beforeend', `<span class="adm-preview-bad">${escapeHtml(check.error)}</span>`);
    };
    const putLv = (el, lvInput) => {
      if (!el || !both) return;
      const box = document.createElement('div');
      box.className = 'adm-preview-lv';
      box.innerHTML = '<span class="adm-preview-lv-tag">LV</span><div class="adm-preview-lv-text"></div>';
      el.append(box);
      put(box.lastElementChild, (lvInput?.value || '').trim(), 'Перевода пока нет');
    };
    const lang = byId('adm-preview-lang');
    if (lang) lang.textContent = both ? 'RU + LV' : (lv ? 'latviešu' : 'русский');

    const grade = parseFormGrade(taskGradeSelect?.value);
    const topic = topics.find(t => String(t.id) === topicSelect?.value);
    const sub = subtopics.find(s => String(s.id) === subtopicSelect?.value);
    const path = [
      grade ? `${grade}. klase` : '',
      topic ? topicOptionText(topic, new Map([[topic.id, getTopicCode(topic)]])) : '',
      sub?.code || ''
    ].filter(Boolean).join(' · ');
    const pathEl = byId('adm-preview-path');
    if (pathEl) pathEl.textContent = path || 'Место не выбрано';

    put(cond, value(conditionInput, conditionInputLv), lv ? 'Латышского условия пока нет' : 'Условие пока пустое');
    putLv(cond, conditionInputLv);
    const solEl = byId('adm-preview-sol');
    put(solEl, value(solutionInput, solutionInputLv), 'Решения пока нет');
    putLv(solEl, solutionInputLv);
    const hint = value(hintInput, hintInputLv);
    const answer = value(answerInput, answerInputLv);
    const lvHint = both && Boolean((hintInputLv?.value || '').trim());
    const lvAnswer = both && Boolean((answerInputLv?.value || '').trim());
    const hintWrap = byId('adm-preview-hint-wrap');
    const answerWrap = byId('adm-preview-answer-wrap');
    if (hintWrap) hintWrap.hidden = !hint && !lvHint;
    if (answerWrap) answerWrap.hidden = !answer && !lvAnswer;
    const hintEl = byId('adm-preview-hint');
    const answerEl = byId('adm-preview-answer');
    put(hintEl, hint, both ? 'Подсказки пока нет' : '');
    putLv(hintEl, hintInputLv);
    put(answerEl, answer, both ? 'Ответа пока нет' : '');
    putLv(answerEl, answerInputLv);

    // Чертёж: сначала то, что сейчас в поле SVG-кода, иначе сохранённый файл.
    const figure = (img, kind) => {
      if (!img) return;
      const svgPreview = document.querySelector(`#${kind}-svg-preview`);
      const src = (svgPreview && !svgPreview.hidden && svgPreview.getAttribute('src')) || window.MathTasks.imageUrl(images[kind].current);
      img.hidden = !src;
      if (!src) img.removeAttribute('src');
      else if (img.getAttribute('src') !== src) img.src = src;
    };
    figure(byId('adm-preview-cond-img'), 'condition');
    figure(byId('adm-preview-sol-img'), 'solution');

    const tagsBox = byId('adm-preview-tags');
    if (tagsBox) {
      tagsBox.innerHTML = getSelectedTagSlugs().map(slug => {
        const tag = allTags.find(t => t.slug === slug);
        const name = (lv ? tag?.title_lv : tag?.title) || tag?.title || slug;
        return `<span class="adm-preview-tag">${escapeHtml(name)}</span>`;
      }).join('');
    }
  }
  // Правка SVG-кода перерисовывает его превью — после этого обновляем карточку.
  ['condition', 'solution'].forEach(kind => {
    document.querySelector(`#${kind}-svg-code`)?.addEventListener('input', () => setTimeout(renderVisitorPreview, 0));
  });

  // Всё, что показывает состояние формы: превью, кнопки «Места», сложность, номер по стандарту.
  function syncEditorWidgets() {
    renderVisitorPreview();
    paintCrumbButtons();
    paintDifficulty();
    fillSubtopicCode();
  }

  /* ── «Место»: оформленные списки вместо системных ─────────────────
     Кнопка в цепочке открывает окно: номер темы или подтемы отдельно,
     название целиком, справа — сколько задач уже лежит; классы и темы
     сгруппированы, есть поиск по номеру и названию. Значения по-прежнему
     в скрытых <select> — это поля формы, и сохранение, клон и генератор
     работают с ними как раньше. Выбрали класс — сразу открываются темы,
     выбрали тему — подтемы. */
  const PLACE_KINDS = ['grade', 'topic', 'subtopic'];
  const placeSelect = kind => ({ grade: taskGradeSelect, topic: topicSelect, subtopic: subtopicSelect })[kind];
  const crumbButton = kind => document.querySelector(`[data-crumb="${kind}"]`);
  let popKind = null;

  function paintCrumbButtons() {
    for (const kind of PLACE_KINDS) {
      const btn = crumbButton(kind);
      const select = placeSelect(kind);
      if (!btn || !select) continue;
      const opt = select.options[select.selectedIndex];
      const code = opt?.dataset.code || '';
      const label = opt?.dataset.label || opt?.textContent.trim() || '';
      const val = btn.querySelector('.adm-crumb-val');
      if (val) val.innerHTML = `${code ? `<span class="adm-crumb-code">${escapeHtml(code)}</span>` : ''}${escapeHtml(label)}`;
      btn.title = opt ? opt.textContent.trim() : '';
      btn.disabled = select.disabled;
      btn.classList.toggle('is-empty', !select.value);
    }
  }

  function placeOptions(select) {
    const item = opt => ({ value: opt.value, code: opt.dataset.code || '', label: opt.dataset.label || opt.textContent.trim(), count: opt.dataset.count ?? '' });
    const items = [];
    for (const node of select.children) {
      if (node.tagName === 'OPTGROUP') {
        items.push({ group: node.label });
        for (const opt of node.children) items.push(item(opt));
      } else {
        items.push(item(node));
      }
    }
    return items;
  }

  function renderPlacePop() {
    const list = byId('adm-place-pop-list');
    const select = placeSelect(popKind);
    if (!list || !select) return;
    const query = (byId('adm-place-pop-search')?.value || '').trim().toLowerCase();
    let html = '';
    let group = null;
    for (const it of placeOptions(select)) {
      if (it.group !== undefined) {
        group = it.group;
        continue;
      }
      if (query && !`${it.code} ${it.label}`.toLowerCase().includes(query)) continue;
      // Заголовок группы — только если под ним есть что показать.
      if (group) {
        html += `<div class="adm-pop-group">${escapeHtml(group)}</div>`;
        group = null;
      }
      const on = it.value === select.value;
      html += `<button type="button" class="adm-pop-opt${on ? ' is-selected' : ''}" role="option" aria-selected="${on}" data-value="${escapeHtml(it.value)}">`
        + (it.code ? `<span class="adm-pop-code">${escapeHtml(it.code)}</span>` : '')
        + `<span class="adm-pop-label">${escapeHtml(it.label)}</span>`
        + (it.count !== '' ? `<span class="adm-pop-count">${escapeHtml(String(it.count))}</span>` : '')
        + '</button>';
    }
    list.innerHTML = html || '<p class="adm-pop-empty">Ничего не нашлось</p>';
  }

  function openPlacePop(kind) {
    const pop = byId('adm-place-pop');
    const bar = byId('adm-editor-place');
    const btn = crumbButton(kind);
    const select = placeSelect(kind);
    if (!pop || !bar || !btn || !select || select.disabled) return;
    popKind = kind;
    PLACE_KINDS.forEach(k => crumbButton(k)?.setAttribute('aria-expanded', String(k === kind)));
    const search = byId('adm-place-pop-search');
    if (search) {
      search.value = '';
      search.hidden = kind === 'grade';
      search.placeholder = kind === 'topic' ? 'Номер или название темы…' : 'Номер или название подтемы…';
    }
    pop.setAttribute('aria-label', { grade: 'Выбор класса', topic: 'Выбор темы', subtopic: 'Выбор подтемы' }[kind]);
    pop.hidden = false;
    renderPlacePop();
    // Под кнопкой, но в пределах строки «Место».
    const barBox = bar.getBoundingClientRect();
    const btnBox = btn.getBoundingClientRect();
    const width = Math.min(kind === 'grade' ? 300 : 480, barBox.width - 16);
    const left = Math.max(8, Math.min(btnBox.left - barBox.left, barBox.width - width - 8));
    pop.style.width = `${width}px`;
    pop.style.left = `${left}px`;
    pop.style.top = `${btnBox.bottom - barBox.top + 6}px`;
    const selected = pop.querySelector('.adm-pop-opt.is-selected');
    selected?.scrollIntoView({ block: 'nearest' });
    (search && !search.hidden ? search : (selected || pop.querySelector('.adm-pop-opt')))?.focus();
  }

  function closePlacePop({ focusButton = false } = {}) {
    if (!popKind) return;
    const btn = crumbButton(popKind);
    popKind = null;
    const pop = byId('adm-place-pop');
    if (pop) pop.hidden = true;
    PLACE_KINDS.forEach(k => crumbButton(k)?.setAttribute('aria-expanded', 'false'));
    if (focusButton) btn?.focus();
  }

  function choosePlace(value) {
    const kind = popKind;
    const select = placeSelect(kind);
    if (!select) return;
    closePlacePop();
    if (select.value !== value) {
      select.value = value;
      select.dispatchEvent(new Event('change'));
    }
    // Дальше по цепочке: класс → темы, тема → подтемы, если они у темы есть.
    if (kind === 'grade' && value) openPlacePop('topic');
    else if (kind === 'topic' && value && !subtopicSelect?.disabled) openPlacePop('subtopic');
    else crumbButton(kind)?.focus();
  }

  document.querySelectorAll('[data-crumb]').forEach(btn => btn.addEventListener('click', () => {
    if (popKind === btn.dataset.crumb) closePlacePop();
    else openPlacePop(btn.dataset.crumb);
  }));
  byId('adm-place-pop-list')?.addEventListener('click', event => {
    const opt = event.target.closest('.adm-pop-opt');
    if (opt) choosePlace(opt.dataset.value);
  });
  byId('adm-place-pop-search')?.addEventListener('input', renderPlacePop);
  byId('adm-place-pop')?.addEventListener('keydown', event => {
    const search = byId('adm-place-pop-search');
    const opts = [...(byId('adm-place-pop-list')?.querySelectorAll('.adm-pop-opt') || [])];
    const i = opts.indexOf(document.activeElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      closePlacePop({ focusButton: true });
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      opts[Math.min(i + 1, opts.length - 1)]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (i > 0) opts[i - 1].focus();
      else if (search && !search.hidden) search.focus();
    } else if (event.key === 'Enter' && event.target === search) {
      // Enter в поиске — первый найденный вариант.
      event.preventDefault();
      if (search.value.trim() && opts.length) choosePlace(opts[0].dataset.value);
    }
  });
  byId('adm-place-pop')?.addEventListener('focusout', event => {
    if (popKind && event.relatedTarget && !event.relatedTarget.closest('#adm-place-pop, [data-crumb]')) closePlacePop();
  });
  document.addEventListener('mousedown', event => {
    if (popKind && !event.target.closest('#adm-place-pop, [data-crumb]')) closePlacePop();
  });

  /* ── Сложность — три кнопки, как в макете; значение — в скрытом <select> ── */
  const difficultyButtons = [...document.querySelectorAll('[data-difficulty]')];
  function paintDifficulty() {
    const value = taskForm.elements.difficulty?.value;
    difficultyButtons.forEach(btn => {
      const on = btn.dataset.difficulty === value;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = on ? 0 : -1;
    });
  }
  difficultyButtons.forEach(btn => btn.addEventListener('click', () => {
    if (taskForm.elements.difficulty) taskForm.elements.difficulty.value = btn.dataset.difficulty;
    paintDifficulty();
  }));
  byId('task-difficulty-group')?.addEventListener('keydown', event => {
    const i = difficultyButtons.indexOf(document.activeElement);
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (i < 0 || !step) return;
    event.preventDefault();
    const next = difficultyButtons[(i + step + difficultyButtons.length) % difficultyButtons.length];
    next.click();
    next.focus();
  });

  /* ── «Номер по стандарту»: 6.1.5 — подтема вместе с её темой и классом,
     6.1 — тема. Выбор в цепочке сам заполняет поле. ── */
  function setCodeHint(text, tone = '') {
    const hint = byId('task-subtopic-code-hint');
    if (!hint) return;
    hint.textContent = text;
    hint.className = `adm-meta-hint${tone ? ` ${tone}` : ''}`;
  }
  function fillSubtopicCode() {
    const input = byId('task-subtopic-code');
    if (!input || document.activeElement === input) return;
    const sub = subtopics.find(s => String(s.id) === subtopicSelect?.value);
    input.value = sub?.code || '';
    setCodeHint('');
  }
  function applySubtopicCode(final = false) {
    const code = (byId('task-subtopic-code')?.value || '').trim().replace(/\.$/, '');
    if (!code) {
      setCodeHint('');
      return;
    }
    const sub = subtopics.find(s => String(s.code || '').trim() === code);
    const topic = sub ? topics.find(t => String(t.id) === String(sub.topic_id)) : topics.find(t => getTopicCode(t) === code);
    if (sub || topic) {
      if (topic?.grade != null && taskGradeSelect) taskGradeSelect.value = toAdminGradeVal(topic.grade);
      updateTaskGradeDropdown();
      updateTaskTopicDropdown(topic ? topic.id : '');
      updateSubtopicDropdown(sub ? sub.id : '');
      updateEditorCrumbs();
      setCodeHint(sub ? sub.title : `тема «${cleanTopicTitle(topic.title)}», подтема не выбрана`, 'ok');
    } else if (final || /^\d+\.\d+\.\d+$/.test(code)) {
      setCodeHint('Подтемы с таким номером нет', 'warn');
    } else {
      setCodeHint('');
    }
  }
  byId('task-subtopic-code')?.addEventListener('input', () => applySubtopicCode(false));
  byId('task-subtopic-code')?.addEventListener('change', () => applySubtopicCode(true));
  byId('task-subtopic-code')?.addEventListener('keydown', event => {
    if (event.key === 'Enter') applySubtopicCode(true);
  });

  /* ── «Как увидит посетитель» выдвигается кнопкой в шапке редактора и
     помнит, открыта ли. По умолчанию закрыта — форма на всю ширину. ── */
  const PREVIEW_KEY = 'mt-admin-preview-open';
  function setPreviewOpen(open, remember = true) {
    const body = document.querySelector('.adm-editor-body');
    if (!body) return;
    body.classList.toggle('preview-open', open);
    byId('adm-preview-col')?.setAttribute('aria-hidden', String(!open));
    const toggle = byId('adm-preview-toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.classList.toggle('is-on', open);
    }
    // При загрузке страницы данных ещё нет — превью заполнит первое обновление формы.
    if (open && remember) renderVisitorPreview();
    if (remember) {
      try { localStorage.setItem(PREVIEW_KEY, open ? '1' : '0'); } catch {}
    }
  }
  byId('adm-preview-toggle')?.addEventListener('click', () => {
    setPreviewOpen(!document.querySelector('.adm-editor-body')?.classList.contains('preview-open'));
  });
  byId('adm-preview-close')?.addEventListener('click', () => {
    setPreviewOpen(false);
    byId('adm-preview-toggle')?.focus();
  });
  try {
    if (localStorage.getItem(PREVIEW_KEY) === '1') setPreviewOpen(true, false);
  } catch {}

  admMissingChips?.addEventListener('click', event => {
    const btn = event.target.closest('[data-missing-action]');
    if (!btn) return;
    const action = btn.dataset.missingAction;
    switch (action) {
      case 'focus-cond-ru':
        ensureLangVisible('ru');
        conditionInput?.focus();
        conditionInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'switch-lv':
      case 'focus-cond-lv':
        ensureLangVisible('lv');
        conditionInputLv?.focus();
        conditionInputLv?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'focus-ans':
        ensureLangVisible('ru');
        answerInput?.focus();
        answerInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'focus-ans-lv':
        ensureLangVisible('lv');
        answerInputLv?.focus();
        answerInputLv?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'focus-sol':
        ensureLangVisible('ru');
        solutionInput?.focus();
        solutionInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'focus-sol-lv':
        ensureLangVisible('lv');
        solutionInputLv?.focus();
        solutionInputLv?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'focus-hint':
        ensureLangVisible('ru');
        hintInput?.focus();
        hintInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'focus-hint-lv':
        ensureLangVisible('lv');
        hintInputLv?.focus();
        hintInputLv?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'pick-grade':
      case 'pick-topic':
      case 'pick-subtopic':
        // «Место» прилипает под шапкой — окно выбора открывается прямо там.
        openPlacePop(action.replace('pick-', ''));
        break;
      case 'suggest-tags':
        document.querySelector('#btn-suggest-tags')?.click();
        document.querySelector('#task-tags-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'scroll-tags':
        document.querySelector('#task-tags-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'scroll-drawing':
        const imgField = document.querySelector('.image-field');
        imgField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.querySelector('#condition-image-input')?.focus();
        break;
    }
  });

  admBtnSaveDraft?.addEventListener('click', () => {
    if (taskForm.elements.is_published) taskForm.elements.is_published.checked = false;
    if (typeof taskForm.requestSubmit === 'function') taskForm.requestSubmit();
    else taskForm.dispatchEvent(new Event('submit', { cancelable: true }));
  });

  admBtnPublish?.addEventListener('click', () => {
    if (taskForm.elements.is_published) taskForm.elements.is_published.checked = true;
    if (typeof taskForm.requestSubmit === 'function') taskForm.requestSubmit();
    else taskForm.dispatchEvent(new Event('submit', { cancelable: true }));
  });

  admBtnCancelEdit?.addEventListener('click', () => cancelTaskEdit());

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
    if (admBtnCancelEdit) admBtnCancelEdit.hidden = !task;
    if (admBtnPublish) admBtnPublish.textContent = task ? (task.is_published ? 'Сохранить (опубликовано)' : 'Опубликовать') : 'Опубликовать';
    if (admBtnSaveDraft) admBtnSaveDraft.textContent = task ? (task.is_published ? 'Снять с публикации (в черновик)' : 'Сохранить черновик') : 'Сохранить черновик';
    if (taskForm.elements.title) taskForm.elements.title.value = task?.title || '';
    if (taskForm.elements.title_lv) taskForm.elements.title_lv.value = task?.title_lv || '';
    taskForm.elements.grade.value = toAdminGradeVal(task?.grade);
    updateTaskGradeDropdown();
    updateTaskTopicDropdown(task?.topic_id ?? '');
    updateSubtopicDropdown(task?.subtopic_id ?? '');
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
    updateEditorCrumbs();
    setEditorLanguage(currentEditorLang === 'both' ? 'both' : 'ru');
    if (task && tagsReady) {
      db.from('task_tags').select('tags(slug)').eq('task_id', task.id)
        .then(({ data: tagLinks }) => {
          const slugs = (tagLinks || []).map(l => l.tags?.slug).filter(Boolean);
          setSelectedTagSlugs(slugs);
          updateReadyBar();
        })
        .catch(() => {
          setSelectedTagSlugs([]);
          updateReadyBar();
        });
    } else {
      setSelectedTagSlugs([]);
      updateReadyBar();
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

  // Класс может быть числом или курсом старшей школы (gradeRank объявлен выше).
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
        const titleStr = `${task.title || ''} ${task.title_lv || ''}`.toLowerCase();
        const condStr = `${task.condition_latex || ''} ${task.condition_latex_lv || ''}`.toLowerCase();
        if (!titleStr.includes(query) && !condStr.includes(query)) return false;
      }
      if (gradeVal !== null) {
        const taskGrade = parseFormGrade(task.grade ?? topics.find(t => t.id === task.topic_id)?.grade);
        if (taskGrade !== gradeVal) return false;
      }
      if (topicVal !== null && task.topic_id !== topicVal) return false;
      if (statusVal === 'published' && !task.is_published) return false;
      if (statusVal === 'draft' && task.is_published) return false;
      const hasSolution = Boolean((task.solution_latex && task.solution_latex.trim()) || (task.solution_image && task.solution_image.trim()));
      if (statusVal === 'no_solution' && hasSolution) return false;
      const hasImage = Boolean((task.condition_image && task.condition_image.trim()) || (task.solution_image && task.solution_image.trim()));
      if (statusVal === 'with_image' && !hasImage) return false;
      if (statusVal === 'without_image' && hasImage) return false;
      if (statusVal === 'no_lv' && (task.condition_latex_lv || '').trim()) return false;
      return true;
    });
  }

  function resetTaskFilters() {
    if (taskSearchInput) taskSearchInput.value = '';
    const globalSearch = document.querySelector('#adm-global-search');
    if (globalSearch) globalSearch.value = '';
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
      paintStatusSegments();
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
      taskList.innerHTML = '<p class="admin-empty">По этому фильтру ничего нет. <button class="text-button" type="button" data-reset-task-filters>Сбросить фильтры</button></p>';
      paintStatusSegments();
      return;
    }

    /* Каталог — таблица, как в макете: №, задача с началом условия, тема,
       класс, языки и статус. Правка открывается кликом по названию или
       кнопкой «Правка»; остальные действия — значками в конце строки.
       Кнопки несут те же data-атрибуты, что и раньше, — обработчики
       списка не менялись. */
    const codes = topicCodeMap();
    const rows = filtered.map(task => {
      const topic = topics.find(item => item.id === task.topic_id);
      const grade = parseFormGrade(task.grade ?? topic?.grade);
      const sub = task.subtopic_id ? subtopics.find(s => s.id === task.subtopic_id) : null;
      const siblings = siblingsOf(task.topic_id);
      const index = siblings.findIndex(item => item.id === task.id);
      const arrows = siblings.length > 1
        ? `<span class="adm-tmove">
            <button class="adm-rowbtn icon" type="button" data-move="${task.id}" data-dir="up" ${index === 0 ? 'disabled' : ''} title="Выше в теме" aria-label="Выше в теме">↑</button>
            <button class="adm-rowbtn icon" type="button" data-move="${task.id}" data-dir="down" ${index === siblings.length - 1 ? 'disabled' : ''} title="Ниже в теме" aria-label="Ниже в теме">↓</button>
          </span>`
        : '';
      const hasLv = Boolean((task.condition_latex_lv || '').trim());
      const hasSolution = Boolean((task.solution_latex || '').trim() || task.solution_image);
      const image = task.condition_image || task.solution_image;
      const flags = [
        task.difficulty ? `<span class="adm-tflag">${escapeHtml(task.difficulty)}</span>` : '',
        !task.topic_id ? '<span class="adm-tflag bad">без темы</span>' : '',
        !hasSolution ? '<span class="adm-tflag warn">без решения</span>' : '',
        image ? `<span class="adm-tflag" title="${escapeHtml(image)}">чертёж</span>` : ''
      ].join('');
      const title = task.title || `Задача #${task.id}`;
      const snippet = (task.condition_latex || task.condition_latex_lv || '').replace(/\s+/g, ' ').trim().slice(0, 160);
      const topicText = topic ? topicOptionText(topic, codes) : 'Без темы';
      const subText = sub ? `${sub.code ? sub.code + ' ' : ''}${sub.title}` : '';
      return `<div class="adm-trow${task.is_published ? '' : ' is-draft'}">
        <div class="adm-tnum"><b>№${task.position ?? 0}</b><span>#${task.id}</span>${arrows}</div>
        <div class="adm-tmain">
          <button class="adm-ttitle" type="button" data-edit-task="${task.id}" title="Открыть в редакторе">${escapeHtml(title)}</button>
          <div class="adm-tcond" title="${escapeHtml(snippet)}">${escapeHtml(snippet) || '—'}</div>
          ${flags ? `<div class="adm-tflags">${flags}</div>` : ''}
        </div>
        <div class="adm-ttopic" title="${escapeHtml(subText ? `${topicText} · ${subText}` : topicText)}"><span>${escapeHtml(topicText)}</span>${subText ? `<small>${escapeHtml(subText)}</small>` : ''}</div>
        <div class="adm-tgrade">${grade ? `${grade}. klase` : '—'}</div>
        <div class="adm-tlang ${hasLv ? 'ok' : 'warn'}">${hasLv ? 'RU LV' : 'RU —'}</div>
        <div class="adm-tact">
          <span class="adm-chip ${task.is_published ? 'ok' : 'warn'}">${task.is_published ? 'опубликована' : 'на проверке'}</span>
          <button class="adm-rowbtn edit" type="button" data-edit-task="${task.id}">Правка</button>
          ${task.is_published
            ? `<button class="adm-rowbtn icon" type="button" data-unpublish-task="${task.id}" title="Вернуть на проверку — задача пропадёт с сайта" aria-label="Вернуть на проверку">↩</button>`
            : `<button class="adm-rowbtn icon ok" type="button" data-publish-task="${task.id}" title="Опубликовать на сайте" aria-label="Опубликовать">✓</button>`}
          <button class="adm-rowbtn icon" type="button" data-clone-task="${task.id}" title="Клонировать в редактор" aria-label="Клонировать">⧉</button>
          <button class="adm-rowbtn icon bad" type="button" data-delete-task="${task.id}" title="Удалить задачу" aria-label="Удалить">✕</button>
        </div>
      </div>`;
    }).join('');
    taskList.innerHTML = `<div class="adm-ttable">
      <div class="adm-thead"><div>№</div><div>Задача</div><div>Тема</div><div>Класс</div><div>Языки</div><div class="adm-tact">Статус</div></div>
      ${rows}
    </div>`;
    paintStatusSegments();
  }

  /* Сегменты над таблицей — быстрые значения того же фильтра статуса:
     активный сегмент совпадает со значением списка «Отбор», числа
     считаются по загруженному списку задач. */
  function paintStatusSegments() {
    const value = taskFilterStatus?.value || '';
    document.querySelectorAll('[data-seg-status]').forEach(btn => {
      const on = btn.dataset.segStatus === value;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    /* До загрузки списка числа берём из указателя задач — в нём нет
       латышского условия, поэтому «Без LV» показываем только после загрузки. */
    const source = tasksLoaded ? tasks : taskIndex;
    const counts = { all: source.length, draft: 0, published: 0, no_lv: tasksLoaded ? 0 : '' };
    for (const task of source) {
      if (task.is_published) counts.published++;
      else counts.draft++;
      if (tasksLoaded && !(task.condition_latex_lv || '').trim()) counts.no_lv++;
    }
    document.querySelectorAll('[data-seg-count]').forEach(el => {
      el.textContent = counts[el.dataset.segCount] ?? '';
    });
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
    const svgProblem = await applySvgCodeEdits();
    if (svgProblem) { taskSuccess.textContent = svgProblem; return; }
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
    const isPub = payload.is_published;
    taskSuccess.textContent = isPub
      ? (editingTaskId ? 'Задача обновлена и опубликована.' : 'Задача добавлена и опубликована.')
      : (editingTaskId ? 'Черновик обновлён.' : 'Черновик сохранён в очередь на проверку.');
    const back = takeEditorReturnView(savedTaskId);
    taskForm.reset();
    setTaskMode(null);
    await refreshTasks();
    updateEditorCrumbs();
    updateReadyBar();
    if (back) showView(back);
  });

  function takeEditorReturnView(taskId) {
    const back = editorReturnView && String(editorReturnView.taskId) === String(taskId) ? editorReturnView.view : null;
    editorReturnView = null;
    return back;
  }

  async function cancelTaskEdit() {
    const back = takeEditorReturnView(editingTaskId);
    await discardPendingImages();
    taskForm.reset();
    setTaskMode(null);
    updateEditorCrumbs();
    updateReadyBar();
    if (back) showView(back);
  }
  document.querySelector('#task-cancel').addEventListener('click', cancelTaskEdit);

  /* Кнопка отправки формы спрятана — публикует «Опубликовать» внизу.
     Enter в однострочном поле отправил бы форму молча и с прежней отметкой
     публикации, поэтому гасим его. */
  taskForm.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target.matches?.('input:not([type="button"]):not([type="submit"]):not([type="checkbox"])')) {
      event.preventDefault();
    }
  });

  taskList.addEventListener('click', async event => {
    const move = event.target.closest('[data-move]');
    if (move) { await moveTask(move.dataset.move, move.dataset.dir); return; }
    /* Отметить как проверенную (опубликовать) или вернуть на проверку */
    const publishId = event.target.closest('[data-publish-task]')?.dataset.publishTask;
    if (publishId) {
      const { error } = await db.from('tasks').update({ is_published: true }).eq('id', publishId);
      if (error) { taskSuccess.textContent = 'Не удалось отметить: ' + error.message; return; }
      for (const list of [tasks, taskIndex]) {
        const row = list.find(item => String(item.id) === String(publishId));
        if (row) row.is_published = true;
      }
      taskSuccess.textContent = `Задача #${publishId} отмечена как проверенная.`;
      renderTaskList();
      updateReviewChip();
      return;
    }
    const unpublishId = event.target.closest('[data-unpublish-task]')?.dataset.unpublishTask;
    if (unpublishId) {
      const { error } = await db.from('tasks').update({ is_published: false }).eq('id', unpublishId);
      if (error) { taskSuccess.textContent = 'Не удалось вернуть на проверку: ' + error.message; return; }
      for (const list of [tasks, taskIndex]) {
        const row = list.find(item => String(item.id) === String(unpublishId));
        if (row) row.is_published = false;
      }
      taskSuccess.textContent = `Задача #${unpublishId} возвращена на проверку.`;
      renderTaskList();
      updateReviewChip();
      return;
    }
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
      taskForm.elements.grade.value = toAdminGradeVal(source.grade);
      updateTaskGradeDropdown();
      updateTaskTopicDropdown(source.topic_id ?? '');
      updateSubtopicDropdown(source.subtopic_id ?? '');
      updateEditorCrumbs();
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
      taskSuccess.textContent = '✨ Копия открыта в редакторе. Измените её и нажмите «Сохранить черновик» или «Опубликовать».';
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

  let tasksLoadingPromise = null;
  async function ensureTasksLoaded() {
    if (tasksLoaded) {
      setTasksShown(true);
      renderTaskList();
      return;
    }
    if (tasksLoadingPromise) {
      await tasksLoadingPromise;
      setTasksShown(true);
      renderTaskList();
      return;
    }
    if (btnLoadTasks) {
      btnLoadTasks.disabled = true;
      btnLoadTasks.textContent = 'Загружаю…';
    }
    try {
      await loadTasks();
    } finally {
      if (btnLoadTasks) {
        btnLoadTasks.disabled = false;
        btnLoadTasks.textContent = 'Показать задачи';
      }
    }
  }

  /* ── Фильтры задач (4.1) ─────────────────────────────────────────── */
  /* Список задач грузится только кнопкой «Показать задачи»: так админка и
     каталог открываются сразу. До загрузки фильтры лишь запоминаются и
     применятся, когда список появится. */
  const showTasksThenRender = () => {
    if (!tasksLoaded) {
      paintStatusSegments();
      return;
    }
    setTasksShown(true);
    renderTaskList();
  };
  [taskSearchInput, taskFilterGrade, taskFilterTopic, taskFilterStatus, taskFilterSort].forEach(el => {
    el?.addEventListener('input', showTasksThenRender);
    el?.addEventListener('change', showTasksThenRender);
  });
  taskFilterReset?.addEventListener('click', resetTaskFilters);

  /* ── Массовый импорт и экспорт задач (4.3) ────────────────────────── */
  let bulkMode = 'export'; // 'export' | 'import'

  async function openBulkDialog(mode) {
    if (!bulkDialog) return;
    bulkMode = mode;
    const publishRow = document.querySelector('#bulk-dialog-publish-row');
    if (publishRow) publishRow.hidden = mode !== 'import';
    const publishBox = document.querySelector('#bulk-dialog-publish');
    if (publishBox) publishBox.checked = false;
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
        /* Без связи с тегами столбец tags в выгрузке был пуст всегда. */
        /* Пачками id: все id сразу — адрес длиннее допустимого и ответ,
           обрезанный на тысяче строк. */
        const { data, error } = await window.MathTasksLib.fetchByIdChunks(ids,
          chunk => db.from('tasks').select(tagsReady ? '*,task_tags(tags(slug))' : '*').in('id', chunk));
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
        /* Без связи с тегами столбец tags в выгрузке был пуст всегда. */
        /* Пачками id: все id сразу — адрес длиннее допустимого и ответ,
           обрезанный на тысяче строк. */
        const { data, error } = await window.MathTasksLib.fetchByIdChunks(ids,
          chunk => db.from('tasks').select(tagsReady ? '*,task_tags(tags(slug))' : '*').in('id', chunk));
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

  /* 🤖 Промпт для ИИ: собирается под выбранные класс, тему и подтему — с
     точными названиями из базы, настоящими номерами подтем и закрытым
     списком тегов (lib.buildTaskPrompt). С общим промптом модель выдумывала
     номера и теги, и импорт отвечал предупреждениями. */
  const aiPromptGrade = document.querySelector('#ai-prompt-grade');
  const aiPromptTopic = document.querySelector('#ai-prompt-topic');
  const aiPromptSubtopic = document.querySelector('#ai-prompt-subtopic');
  const aiPromptCount = document.querySelector('#ai-prompt-count');
  const byPosition = (a, b) => (a.position ?? 0) - (b.position ?? 0);

  /* Темы — с номерами Skola2030 («6.1. …») и в их порядке, как во всей
     админке. Раньше номер собирался из позиции и клеился к названию, в
     котором свой номер уже был: «9. 6.1. Как совокупность…». */
  function fillAiPromptTopics() {
    if (!aiPromptTopic) return;
    const g = parseFormGrade(aiPromptGrade?.value);
    const codes = topicCodeMap();
    const list = sortTopics(topics.filter(t => !g || parseFormGrade(t.grade) === g), codes);
    const prev = aiPromptTopic.value;
    aiPromptTopic.innerHTML = '<option value="">— тема не выбрана —</option>' + list.map(t =>
      `<option value="${t.id}">${escapeHtml(`${g ? '' : gradeText(t.grade) + ' · '}${topicOptionText(t, codes)}`)}</option>`).join('');
    if (list.some(t => String(t.id) === prev)) aiPromptTopic.value = prev;
  }

  function aiPromptTopicSubtopics() {
    const topicId = Number(aiPromptTopic?.value) || null;
    return topicId ? subtopics.filter(s => s.topic_id === topicId).sort(byPosition) : [];
  }

  function fillAiPromptSubtopics() {
    if (!aiPromptSubtopic) return;
    const list = aiPromptTopicSubtopics();
    const prev = aiPromptSubtopic.value;
    aiPromptSubtopic.innerHTML = '<option value="">Все подтемы темы</option>' + list.map(s =>
      `<option value="${s.id}">${escapeHtml(`${s.code ? s.code + ' ' : ''}${s.title}`)}</option>`).join('');
    aiPromptSubtopic.disabled = !list.length;
    if (list.some(s => String(s.id) === prev)) aiPromptSubtopic.value = prev;
  }

  function renderAiPrompt() {
    if (!aiPromptTextarea) return;
    const topic = topics.find(t => t.id === Number(aiPromptTopic?.value)) || null;
    const topicSubs = aiPromptTopicSubtopics();
    const subtopic = topicSubs.find(s => s.id === Number(aiPromptSubtopic?.value)) || null;
    const grade = topic?.grade ?? parseFormGrade(aiPromptGrade?.value) ?? null;
    aiPromptTextarea.value = window.MathTasksLib.buildTaskPrompt({
      grade,
      gradeLabel: grade ? gradeText(grade) : '',
      topic,
      subtopics: topicSubs,
      subtopic,
      count: Number(aiPromptCount?.value) || 30,
      tags: (allTags || []).map(t => t.slug).filter(Boolean)
    });
    // Без темы в промпте остаются заглушки [КЛАСС] и [НАЗВАНИЕ ТЕМЫ] — предупреждаем.
    const warn = document.querySelector('#ai-prompt-warn');
    if (warn) warn.hidden = Boolean(topic);
  }

  function showAiPromptModal() {
    if (!aiPromptDialog) return;
    if (aiPromptGrade && aiPromptGrade.children.length <= 1) fillGradeSelect(aiPromptGrade, 'Все классы и курсы', { numeric: true });
    /* Тема ещё не выбрана — берём ту, с которой сейчас работали: выбранную
       в «Разделах, темах, подтемах» или в редакторе задачи. */
    const contextTopic = aiPromptTopic?.value ? null : topics.find(t => t.id === (catState.topic || Number(topicSelect?.value) || null));
    if (contextTopic && aiPromptGrade) aiPromptGrade.value = toAdminGradeVal(contextTopic.grade);
    fillAiPromptTopics();
    if (contextTopic) aiPromptTopic.value = String(contextTopic.id);
    fillAiPromptSubtopics();
    renderAiPrompt();
    aiPromptDialog.showModal();
  }

  aiPromptGrade?.addEventListener('change', () => { fillAiPromptTopics(); fillAiPromptSubtopics(); renderAiPrompt(); });
  aiPromptTopic?.addEventListener('change', () => { fillAiPromptSubtopics(); renderAiPrompt(); });
  aiPromptSubtopic?.addEventListener('change', renderAiPrompt);
  aiPromptCount?.addEventListener('input', renderAiPrompt);
  btnShowAiPrompt?.addEventListener('click', showAiPromptModal);
  bulkDialogAiPromptBtn?.addEventListener('click', showAiPromptModal);
  aiPromptDialogClose?.addEventListener('click', () => aiPromptDialog?.close());
  aiPromptCloseBtn?.addEventListener('click', () => aiPromptDialog?.close());
  aiPromptCopyBtn?.addEventListener('click', async () => {
    const text = aiPromptTextarea?.value || '';
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

  /* Сохранение разобранного импорта: недостающие темы и подтемы, задачи,
     чертежи из SVG и кросс-теги. Общая часть окна импорта и мастера на
     экране «Импорт и экспорт». labelOf подписывает задачу в сообщениях:
     окно — «Задача #N», мастер — номером строки файла. */
  async function importParsedItems({ uniqueTopics = [], uniqueSubtopics = [], items = [], parseWarnings = [], publishNow = false, onProgress = null, labelOf = i => `Задача #${i + 1}` }) {
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
    let uploadedFigures = 0;
    /* Импорт — непроверенный текст, чаще всего от нейросети. На сайт он
       уходит только по явному флажку, иначе черновиками — в очередь проверки. */
    /* Предупреждения разбора — например, сдвиг столбцов из-за запятой
       в формуле без кавычек — показываем вместе с остальными. */
    warnings.push(...parseWarnings);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      onProgress?.(i + 1, items.length);
      if (!item.condition_latex) {
        errors.push(`${labelOf(i)}: отсутствует condition_latex`);
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
        else warnings.push(`${labelOf(i)}: подтема «${code || sNeedle || sNeedleLv}» не найдена, задача легла прямо в тему.`);
      }

      if (!topicId) withoutTopic++;
      const taskPos = nextPosition(topicId, null);
      const titleVal = item.title ? String(item.title).trim() : `Задача №${taskPos}`;

      /* Чертёж разметкой (condition_svg / solution_svg) сохраняем файлом в
         хранилище и подставляем путь, как при загрузке через форму. Не
         вышло — задача всё равно сохраняется, без рисунка, и об этом
         говорим. Готовый путь в condition_image важнее разметки. */
      const figurePaths = {};
      for (const kind of ['condition', 'solution']) {
        const markup = item[`${kind}_svg`];
        if (!markup || item[`${kind}_image`]) continue;
        const uploaded = await uploadSvgMarkup(kind, markup);
        if (uploaded.path) figurePaths[kind] = uploaded.path;
        else warnings.push(`${labelOf(i)}: чертёж ${kind === 'condition' ? 'условия' : 'решения'} не сохранён — ${uploaded.error}.`);
      }

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
        condition_image: figurePaths.condition || (item.condition_image ? String(item.condition_image).trim() : null),
        solution_image: figurePaths.solution || (item.solution_image ? String(item.solution_image).trim() : null),
        hint_latex_lv: item.hint_latex_lv ? String(item.hint_latex_lv).trim() : null,
        difficulty: item.difficulty || 'Средний',
        grade: parseFormGrade(item.grade),
        topic_id: topicId,
        /* Позицию из файла не берём: в наборах она у каждой задачи была
           единицей, и все задачи темы слипались в один номер. Номер внутри
           темы назначаем сами, по порядку добавления. */
        position: taskPos,
        is_published: publishNow && item.is_published !== false
      });

      const { data: insertedTask, error } = await db.from('tasks').insert(payload).select('id').maybeSingle();
      if (error) {
        errors.push(`${labelOf(i)}: ${error.message}`);
        for (const path of Object.values(figurePaths)) await removeFile(path);
      } else {
        successCount++;
        uploadedFigures += Object.keys(figurePaths).length;
        const newTaskId = insertedTask?.id;
        /* Указатель пополняем сразу, не дожидаясь конца импорта: следующая
           задача считает свой номер по нему, и без этой строки все задачи
           одной темы получили бы одну и ту же позицию — ровно то, из-за чего
           пришлось перенумеровывать весь каталог. */
        taskIndex.push({ id: newTaskId, topic_id: payload.topic_id ?? null, position: payload.position, is_published: payload.is_published });
        // Привязываем кросс-теги Skola2030 если они переданы в массиве tags
        if (newTaskId && Array.isArray(item.tags) && item.tags.length) {
          if (!tagsReady) {
            warnings.push(`${labelOf(i)}: теги не сохранены — не выполнена миграция 010_cross_tags.sql.`);
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
              warnings.push(`${labelOf(i)}: неизвестные теги — ${unknown.join(', ')}. Допустимые слаги перечислены под полем ввода.`);
            }
            if (matched.length > 3) {
              warnings.push(`${labelOf(i)}: тегов больше трёх, сохранены первые три (${matched.slice(0, 3).map(t => t.slug).join(', ')}).`);
            }
            const tagInserts = matched.slice(0, 3).map(t => ({ task_id: newTaskId, tag_id: t.id }));
            if (tagInserts.length) {
              const { error: tagErr } = await db.from('task_tags').insert(tagInserts);
              if (tagErr) warnings.push(`${labelOf(i)}: теги не сохранены — ${tagErr.message}`);
            }
          } catch (tErr) {
            warnings.push(`${labelOf(i)}: ошибка сохранения тегов — ${tErr.message}`);
          }
        }
      }
    }

    /* Без темы задача не видна на страницах тем — только в поиске и общем
       списке. Сохраняем, но говорим прямо, а не молча. */
    if (withoutTopic) {
      warnings.unshift(`Задач без темы: ${withoutTopic}. В файле нет столбца темы или её название не совпало ни с одной темой — на страницах тем их не будет.`);
    }

    return { createdTopicsCount, createdSubtopicsCount, successCount, errors, warnings, uploadedFigures };
  }

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

    const publishNow = Boolean(document.querySelector('#bulk-dialog-publish')?.checked);
    const { createdTopicsCount, createdSubtopicsCount, successCount, errors, warnings, uploadedFigures } = await importParsedItems({
      uniqueTopics, uniqueSubtopics, items, publishNow,
      parseWarnings: Array.isArray(parsedResult.warnings) ? parsedResult.warnings : []
    });

    bulkDialogSubmit.disabled = false;
    bulkDialogSubmit.textContent = 'Импортировать в базу';

    const draftNote = successCount && !publishNow
      ? '<br>Задачи сохранены <strong>черновиками</strong> и на сайте не видны. Проверьте и опубликуйте их: кнопка «🟡 На проверке» над списком задач.'
      : '';
    const warnBlock = warnings.length
      ? `<br><br><strong>Предупреждения (${warnings.length}):</strong><br>${warnings.slice(0, 12).map(escapeHtml).join('<br>')}${warnings.length > 12 ? '<br>…' : ''}`
      : '';

    if (errors.length) {
      bulkDialogStatus.className = 'bulk-dialog-status ' + (successCount > 0 ? 'warning' : 'error');
      bulkDialogStatus.innerHTML = `Обработано тем: <strong>${uniqueTopics.length}</strong> (создано новых: ${createdTopicsCount}), ` +
        `подтем: <strong>${uniqueSubtopics.length}</strong>` + (createdSubtopicsCount ? ` (создано новых: ${createdSubtopicsCount})` : '') + `.<br>` +
        `Успешно сохранено задач: <strong>${successCount}</strong> из ${items.length}` +
        (uploadedFigures ? `, чертежей: ${uploadedFigures}` : '') + `.<br>` + warnBlock +
        `Ошибки:<br>${errors.map(escapeHtml).join('<br>')}`;
      bulkDialogStatus.hidden = false;
    } else {
      bulkDialogStatus.className = 'bulk-dialog-status success';
      bulkDialogStatus.innerHTML = `🎉 Успешно импортировано! Тем обработано: <strong>${uniqueTopics.length}</strong> (создано новых: ${createdTopicsCount}), ` +
        `подтем: <strong>${uniqueSubtopics.length}</strong>` + (createdSubtopicsCount ? ` (создано новых: ${createdSubtopicsCount})` : '') + `, ` +
        `задач сохранено: <strong>${successCount}</strong> из ${items.length}` +
        (uploadedFigures ? `, чертежей: <strong>${uploadedFigures}</strong>` : '') + '!' + draftNote + warnBlock;
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

  btnLoadTasks?.addEventListener('click', () => ensureTasksLoaded());

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

        /* 30 задач за запрос: в потолок ответа модели (65 536 токенов) их
           помещается около 60, а запросов втрое меньше, чем по 10, — реже
           упираемся в минутный лимит бесплатного тарифа. */
        const BATCH_SIZE = usingGemini ? 30 : 10;
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
            /* Большая пачка, оборванная по длине или по времени, делится
               пополам и запрашивается заново: иначе один сбой терял бы все
               30 задач разом. */
            if (batchCount > 10 && /оборван|не ответила/.test(String(batchErr?.message))) {
              let recovered = 0;
              for (const part of [Math.ceil(batchCount / 2), Math.floor(batchCount / 2)]) {
                if (aiGenCancelled) break;
                try {
                  aiGenStatus.innerHTML = `<span>⏳</span> Пакет ${batchIdx + 1} оборвался — запрашиваем по ${part} задач…`;
                  const partTasks = await generator.generateTasksBatch({
                    grade: g, topicTitle: batchTopics[0] || topicTitle, topicsList: batchTopics, count: part,
                    subtopic, subtopicCode, difficulty: selectedDifficulty, taskType, context, customPrompt,
                    apiKey, useGemini: usingGemini
                  });
                  for (const task of partTasks) {
                    const diff = task.difficulty || 'Средний';
                    generatedResults.push({ result: task, difficulty: diff });
                    if (diff === 'Лёгкий') easyCount++;
                    else if (diff === 'Средний') medCount++;
                    else hardCount++;
                    recovered++;
                  }
                } catch (partErr) {
                  console.warn(`Половина пакета ${batchIdx + 1} не удалась:`, partErr);
                }
              }
              for (let k = 0; k < batchCount - recovered; k++) {
                failures.push({ index: generatedResults.length + k + 1, message: batchErr.message });
              }
              continue;
            }
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

        // Всё сгенерированное — в колонку «Результат»: там «Править» или «В очередь проверки».
        showAiResults(generatedResults, { g, topicTitle, topicItem, subtopicCode, count, failures, easyCount, medCount, hardCount });
      } catch (err) {
        // Часть задач уже готова — показываем их, а не теряем вместе с ошибкой.
        if (generatedResults.length) {
          showAiResults(generatedResults, { g, topicTitle, topicItem, subtopicCode, count, failures, easyCount, medCount, hardCount, error: err.message });
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

  /* ── Генератор: колонка «Результат» (макет «Админка Skola2030») ─────
     Сгенерированное сначала показывается здесь, а не уходит сразу в форму
     или в окно импорта. «Править» открывает задачу в редакторе (вместе
     с чертежом), «В очередь проверки» сохраняет оставшиеся черновиками —
     той же функцией, что и мастер импорта. */
  let aiResultItems = [];
  let aiLastSaved = null;

  // Задача генератора → строка импорта. Тему и подтему ищем именно в базе.
  function aiResultToItem(r, difficulty, idx, ctx) {
    const { g, topicTitle, topicItem, subtopicCode } = ctx;
    const clean = s => String(s || '').replace(/^\s*\d+(\.\d+)*\.?\s*/, '').trim().toLowerCase();
    const taskTopicTitle = r.topic_title || topicTitle;
    const catalogHit = skola2030Catalog.find(t => t.title_ru === taskTopicTitle || t.slug === r.topic_slug);
    const selectedTopic = topics.find(t => t.grade === g && (
      (t.slug && topicItem?.slug && t.slug === topicItem.slug) || clean(t.title) === clean(topicTitle)
    )) || (topicItem?.position ? topics.find(t => t.grade === g && t.position === topicItem.position) : null);
    const dbHit = topics.find(t => t.grade === g && clean(t.title) === clean(taskTopicTitle))
      || (catalogHit ? topics.find(t => t.grade === catalogHit.grade && t.position === catalogHit.position) : null)
      || selectedTopic || null;
    const subCode = r.subtopic_code || subtopicCode || null;
    const subHit = subCode && dbHit
      ? subtopics.find(s => s.topic_id === dbHit.id && String(s.code || '') === String(subCode))
      : null;
    return {
      key: `${Date.now()}-${idx}`,
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
      hint_latex: r.hint_latex_ru || r.hint_latex || null,
      hint_latex_lv: r.hint_latex_lv || null,
      condition_svg: r.condition_svg || null,
      solution_svg: r.solution_svg || null,
      difficulty: difficulty || 'Средний',
      grade: g,
      topic_id: dbHit?.id || null,
      topic_title: taskTopicTitle,
      is_published: false
    };
  }

  function showAiResults(results, ctx) {
    aiLastSaved = null;
    aiResultItems = results.map(({ result, difficulty }, idx) => aiResultToItem(result, difficulty, idx, ctx));
    renderAiResults();
    const { count, failures = [], easyCount, medCount, hardCount, error } = ctx;
    const made = aiResultItems.length;
    const failLine = failures.length
      ? ` Не удалось получить ${failures.length}: ${failures.slice(0, 3).map(f => `#${f.index} — ${String(f.message).slice(0, 80)}`).join('; ')}${failures.length > 3 ? '…' : ''}`
      : '';
    aiGenStatus.className = `ai-gen-status${error ? ' error' : (failures.length ? '' : ' success')}`;
    aiGenStatus.textContent = error
      ? `Генерация прервалась: ${error}. Готово ${made} из ${count} — они справа.`
      : `Готово: ${made} из ${count} (лёгких ${easyCount}, средних ${medCount}, сложных ${hardCount}) — результат справа.${failLine}`;
  }

  function renderAiResults() {
    const list = byId('ai-results-list');
    if (!list) return;
    const n = aiResultItems.length;
    const countEl = byId('ai-results-count');
    if (countEl) countEl.textContent = n ? String(n) : '';
    const foot = byId('ai-results-foot');
    if (foot) foot.hidden = !n;
    const queueBtn = byId('ai-results-queue');
    if (queueBtn) queueBtn.textContent = `В очередь проверки (${n})`;
    if (!n) {
      list.innerHTML = aiLastSaved
        ? `<p class="ai-results-empty">Сохранено черновиками: ${aiLastSaved.saved}.<br /><a href="#review">Открыть «Проверку»</a></p>`
        : '<p class="ai-results-empty">Пока ничего не сгенерировано.<br />Заполните настройки слева и нажмите «Сгенерировать».</p>';
      return;
    }
    const codes = topicCodeMap();
    const diffTone = { 'Лёгкий': 'ok', 'Сложный': 'bad' };
    list.innerHTML = aiResultItems.map(item => {
      const topic = topics.find(t => t.id === item.topic_id);
      const sub = item.subtopic_id ? subtopics.find(s => s.id === item.subtopic_id) : null;
      const path = ['черновик', `${item.grade}. klase`, topic ? topicOptionText(topic, codes) : '', sub?.code || ''].filter(Boolean).join(' · ');
      const hasLv = Boolean(String(item.condition_latex_lv || '').trim());
      return `<article class="ai-result" data-ai-key="${item.key}">
        <div class="ai-result-path">${escapeHtml(path)}</div>
        <div class="ai-result-cond"></div>
        <div class="ai-result-meta">
          <span class="adm-chip ${diffTone[item.difficulty] || 'warn'}">${escapeHtml(item.difficulty)}</span>
          <span class="adm-chip ${hasLv ? 'ok' : 'warn'}">${hasLv ? 'RU + LV' : 'только RU'}</span>
          ${item.condition_svg ? '<span class="adm-chip">чертёж</span>' : ''}
          ${topic ? '' : '<span class="adm-chip bad" title="Задача ляжет без темы — поправьте её в редакторе">тема не найдена</span>'}
        </div>
        <div class="ai-result-actions">
          <button type="button" class="adm-btn soft" data-ai-edit="${item.key}">Править</button>
          <button type="button" class="adm-btn text" data-ai-drop="${item.key}" title="Убрать из результата — задача нигде не сохранится">Убрать</button>
        </div>
      </article>`;
    }).join('');
    // Условие — через KaTeX, как увидит посетитель.
    list.querySelectorAll('.ai-result').forEach(card => {
      const item = aiResultItems.find(i => i.key === card.dataset.aiKey);
      renderMath(card.querySelector('.ai-result-cond'), item?.condition_latex || '');
    });
  }

  // «Править»: задача генератора — в форму редактора, чертёж — в поле рисунка.
  async function openAiItemInEditor(item) {
    await discardPendingImages();
    taskForm.reset();
    setTaskMode(null);
    if (taskForm.elements.title) taskForm.elements.title.value = item.title || '';
    if (taskForm.elements.title_lv) taskForm.elements.title_lv.value = item.title_lv || '';
    if (taskGradeSelect) taskGradeSelect.value = toAdminGradeVal(item.grade);
    updateTaskGradeDropdown();
    updateTaskTopicDropdown(item.topic_id ?? '');
    updateSubtopicDropdown(item.subtopic_id ?? '');
    if (taskForm.elements.difficulty) taskForm.elements.difficulty.value = item.difficulty || 'Средний';
    conditionInput.value = item.condition_latex || '';
    if (conditionInputLv) conditionInputLv.value = item.condition_latex_lv || '';
    answerInput.value = item.answer_latex || '';
    if (answerInputLv) answerInputLv.value = item.answer_latex_lv || '';
    solutionInput.value = item.solution_latex || '';
    if (solutionInputLv) solutionInputLv.value = item.solution_latex_lv || '';
    if (hintInput) hintInput.value = item.hint_latex || '';
    if (hintInputLv) hintInputLv.value = item.hint_latex_lv || '';
    if (taskForm.elements.is_published) taskForm.elements.is_published.checked = false;
    updatePreviews();
    updateEditorCrumbs();
    taskSuccess.textContent = '✨ Задача из генератора открыта в редакторе — сохраните её черновиком или опубликуйте.';
    showView('new');
    for (const kind of ['condition', 'solution']) {
      const markup = item[`${kind}_svg`];
      if (!markup) continue;
      const errorElement = document.querySelector(`#${kind}-image-error`);
      const uploaded = await uploadSvgMarkup(kind, markup);
      if (!uploaded.path) {
        if (errorElement) errorElement.textContent = 'Чертёж от генератора не подошёл: ' + uploaded.error;
        continue;
      }
      const previous = images[kind].current;
      images[kind].current = uploaded.path;
      if (previous && previous !== images[kind].saved) await removeFile(previous);
      if (errorElement) errorElement.textContent = '';
      paintImage(kind);
      loadSvgCode(kind, uploaded.path);
    }
  }

  byId('ai-results-list')?.addEventListener('click', async event => {
    const editKey = event.target.closest('[data-ai-edit]')?.dataset.aiEdit;
    const dropKey = event.target.closest('[data-ai-drop]')?.dataset.aiDrop;
    const key = editKey || dropKey;
    if (!key) return;
    const item = aiResultItems.find(i => i.key === key);
    // Открытая в редакторе задача уходит из списка — иначе её легко сохранить дважды.
    aiResultItems = aiResultItems.filter(i => i.key !== key);
    renderAiResults();
    if (editKey && item) await openAiItemInEditor(item);
  });

  byId('ai-results-clear')?.addEventListener('click', () => {
    if (!aiResultItems.length) return;
    if (!confirm(`Убрать все задачи из результата (${aiResultItems.length})? Они нигде не сохранены.`)) return;
    aiResultItems = [];
    aiLastSaved = null;
    renderAiResults();
  });

  byId('ai-results-queue')?.addEventListener('click', async () => {
    if (!aiResultItems.length) return;
    const btn = byId('ai-results-queue');
    const items = aiResultItems.map(({ key, ...rest }) => rest);
    btn.disabled = true;
    let res;
    try {
      res = await importParsedItems({
        items,
        publishNow: false,
        labelOf: i => `Задача ${i + 1}`,
        onProgress: (i, total) => { btn.textContent = `Сохраняем… ${i} из ${total}`; }
      });
    } catch (err) {
      res = { successCount: 0, errors: [err.message], warnings: [] };
    } finally {
      btn.disabled = false;
    }
    const problems = [...(res.errors || []), ...(res.warnings || [])];
    if (res.successCount) {
      aiResultItems = [];
      aiLastSaved = { saved: res.successCount };
    }
    renderAiResults();
    aiGenStatus.className = `ai-gen-status${res.errors?.length ? ' error' : ' success'}`;
    aiGenStatus.textContent = res.successCount
      ? `Сохранено черновиками: ${res.successCount} из ${items.length} — они ждут в «Проверке».${problems.length ? ` Замечания: ${problems.slice(0, 3).join('; ')}${problems.length > 3 ? '…' : ''}` : ''}`
      : `Не сохранено: ${problems.slice(0, 3).join('; ') || 'неизвестная ошибка'}`;
    if (res.successCount) await refreshTasks();
  });

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

    updateTaskGradeDropdown();
    updateTaskTopicDropdown();
    updateSubtopicDropdown();
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
    updateEditorCrumbs();
  }

  /* ── Сообщения об ошибках от посетителей (миграция 023) ─────────── */
  const reportSection = document.querySelector('#section-reports');
  const reportList = document.querySelector('#report-list');
  const reportCount = document.querySelector('#reports-count');
  const REPORT_KIND_LABELS = { condition: 'В условии', answer: 'В ответе', solution: 'В решении', figure: 'В чертеже', translation: 'В переводе', other: 'Другое' };
  let reports = [];

  async function loadReports() {
    if (!reportSection || !reportList) return;
    reportSection.hidden = false;
    const { data, error } = await db.from('task_reports')
      .select('id,task_id,kind,message,lang,created_at,tasks(title,position,topic_id,subtopic_id,grade,is_published)')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      /* Таблицы нет, пока не применена миграция: говорим, что сделать,
         а не прячем раздел — иначе о нём просто не узнать. */
      reports = [];
      if (reportCount) reportCount.textContent = '';
      reportList.innerHTML = '<p class="admin-empty">Сообщения пока недоступны: примените миграцию <code>supabase/migrations/023_task_reports.sql</code> в SQL Editor Supabase.</p>';
      return;
    }
    reports = data || [];
    renderReports();
  }

  // «2 дня назад» — когда посетитель написал; точная дата — во всплывающей подсказке.
  function timeAgo(iso) {
    const plural = (n, one, few, many) => {
      const m10 = n % 10, m100 = n % 100;
      if (m100 >= 11 && m100 <= 14) return many;
      if (m10 === 1) return one;
      return m10 >= 2 && m10 <= 4 ? few : many;
    };
    const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} ${plural(minutes, 'минуту', 'минуты', 'минут')} назад`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} ${plural(hours, 'час', 'часа', 'часов')} назад`;
    const days = Math.round(hours / 24);
    if (days === 1) return 'вчера';
    if (days < 31) return `${days} ${plural(days, 'день', 'дня', 'дней')} назад`;
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* Последнее закрытое сообщение: 10 секунд его можно вернуть. В таблице
     есть только отметка resolved, поэтому и «Решено», и «Не ошибка»
     закрывают сообщение — «Вернуть» страхует от случайного клика. */
  let lastResolved = null;
  let lastResolvedTimer = null;
  function setLastResolved(value) {
    clearTimeout(lastResolvedTimer);
    lastResolved = value;
    if (value) {
      lastResolvedTimer = setTimeout(() => {
        lastResolved = null;
        renderReports();
      }, 10000);
    }
  }

  /* Карточка на сообщение, как в макете: слева задача и что написал
     посетитель, справа — «Открыть задачу», «Решено», «Не ошибка». */
  function renderReports() {
    updateShellCounts();
    if (reportCount) reportCount.textContent = reports.length ? `(${reports.length})` : '';
    const undo = lastResolved
      ? `<div class="adm-report-undo" role="status"><span>Сообщение по задаче #${lastResolved.report.task_id} закрыто: ${lastResolved.verdict === 'not-error' ? '«не ошибка»' : '«решено»'}.</span><button type="button" class="adm-link-btn" data-report-undo>Вернуть</button></div>`
      : '';
    if (!reports.length) {
      reportList.innerHTML = `${undo}<div class="adm-reports-empty"><div class="adm-reports-empty-title">Открытых сообщений нет</div><p>Посетители отмечают ошибки кнопкой «Нашли ошибку?» на странице задачи.</p></div>`;
      return;
    }
    const codes = topicCodeMap();
    reportList.innerHTML = undo + reports.map(r => {
      const task = r.tasks;
      const topic = task ? topics.find(t => t.id === task.topic_id) : null;
      const sub = task?.subtopic_id ? subtopics.find(s => s.id === task.subtopic_id) : null;
      const grade = parseFormGrade(task?.grade ?? topic?.grade);
      const path = [grade ? `${grade}. klase` : '', topic ? topicOptionText(topic, codes) : '', sub?.code || ''].filter(Boolean).join(' · ');
      const title = task ? (task.title || `Задача №${task.position ?? r.task_id}`) : 'Задача удалена';
      const meta = [
        timeAgo(r.created_at),
        r.lang ? `страница ${r.lang.toUpperCase()}` : '',
        task && !task.is_published ? 'задача сейчас в черновиках' : ''
      ].filter(Boolean).join(' · ');
      const exact = new Date(r.created_at).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' });
      return `<article class="adm-report">
        <div class="adm-report-main">
          <div class="adm-report-head">
            <span class="adm-report-id">#${r.task_id}</span>
            <span class="adm-report-title">${escapeHtml(title)}</span>
            ${path ? `<span class="adm-report-path">${escapeHtml(path)}</span>` : ''}
          </div>
          <div class="adm-report-text"><span class="adm-report-kind">${escapeHtml(REPORT_KIND_LABELS[r.kind] || r.kind)}</span>${r.message ? escapeHtml(r.message) : '<span class="adm-report-no-text">Посетитель не оставил комментария.</span>'}</div>
          <div class="adm-report-meta" title="${escapeHtml(exact)}">${escapeHtml(meta)}</div>
        </div>
        <div class="adm-report-actions">
          <button type="button" class="adm-btn soft" data-report-open="${r.task_id}"${task ? '' : ' disabled'}>Открыть задачу</button>
          <button type="button" class="adm-btn ok" data-report-resolve="${r.id}" data-verdict="fixed">Решено</button>
          <button type="button" class="adm-btn text" data-report-resolve="${r.id}" data-verdict="not-error">Не ошибка</button>
        </div>
      </article>`;
    }).join('');
  }

  reportList?.addEventListener('click', async event => {
    const openBtn = event.target.closest('[data-report-open]');
    if (openBtn) {
      const full = await fetchFullRow('tasks', openBtn.dataset.reportOpen);
      if (!full) { alert('Задача не найдена — возможно, её удалили.'); return; }
      setTaskMode(full);
      // После сохранения или отмены правки — обратно к сообщениям.
      editorReturnView = { view: 'reports', taskId: full.id };
      showView('new');
      return;
    }
    const resolveBtn = event.target.closest('[data-report-resolve]');
    if (resolveBtn) {
      const id = resolveBtn.dataset.reportResolve;
      resolveBtn.disabled = true;
      const { error } = await db.from('task_reports').update({ resolved: true }).eq('id', id);
      if (error) {
        resolveBtn.disabled = false;
        alert('Не удалось отметить: ' + error.message);
        return;
      }
      const report = reports.find(r => String(r.id) === String(id));
      reports = reports.filter(r => String(r.id) !== String(id));
      setLastResolved(report ? { report, verdict: resolveBtn.dataset.verdict } : null);
      renderReports();
      return;
    }
    if (event.target.closest('[data-report-undo]') && lastResolved) {
      const { report } = lastResolved;
      const { error } = await db.from('task_reports').update({ resolved: false }).eq('id', report.id);
      if (error) { alert('Не удалось вернуть: ' + error.message); return; }
      reports = [report, ...reports].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      setLastResolved(null);
      renderReports();
    }
  });

  /* «На проверке: N» — черновики, которые ждут вычитки. Считается по
     указателю, чтобы счётчик был виден сразу, без загрузки полного списка. */
  const taskReviewChip = document.querySelector('#task-review-chip');
  function updateReviewChip() {
    updateShellCounts();
    if (!taskReviewChip) return;
    const drafts = taskIndex.filter(t => t.is_published === false).length;
    taskReviewChip.hidden = !drafts;
    taskReviewChip.textContent = `🟡 На проверке: ${drafts}`;
  }
  taskReviewChip?.addEventListener('click', async () => {
    if (taskFilterStatus) taskFilterStatus.value = 'draft';
    await ensureTasksLoaded();
  });

  async function loadTaskIndex() {
    /* Страницами: одним запросом указатель обрезался бы на тысяче задач, и
       новые задачи получали бы уже занятые номера. */
    const pages = cols => window.MathTasksLib.fetchAllRows(() => db.from('tasks').select(cols).order('id'));
    const { data, error } = await pages(TASK_INDEX_COLS);
    if (!error) {
      taskIndex = data || [];
      updateReviewChip();
      refreshPlaceLists();
      return;
    }
    /* Колонка subtopic_id появляется миграцией 020. Без отката весь указатель
       оставался бы пустым, и у каждой темы значилось бы «задач: 0». */
    const retry = await pages('id,topic_id,position,grade');
    taskIndex = retry.error ? [] : (retry.data || []);
    updateReviewChip();
    refreshPlaceLists();
  }

  /* После правки всегда обновляем указатель, а список — только если
     администратор его уже открыл: иначе кнопка теряет смысл. */
  async function refreshTasks() {
    await loadTaskIndex();
    if (tasksLoaded) await loadTasks();
    else renderTopicList();
  }

  async function loadTasks() {
    if (tasksLoadingPromise) return tasksLoadingPromise;
    tasksLoadingPromise = (async () => {
      let selectCols = TASK_LIST_COLS;
      if (multilingualReady) selectCols += ',title_lv,condition_latex_lv,solution_latex_lv';
      if (tagsReady) selectCols += ',task_tags(tags(slug,title,title_lv))';
      /* id в конце порядка — чтобы страницы не теряли и не повторяли задачи
         с одинаковыми темой, номером и временем. */
      const { data, error } = await window.MathTasksLib.fetchAllRows(() => db.from('tasks').select(selectCols)
        .order('topic_id').order('position').order('created_at', { ascending: true }).order('id'));
      if (error) { taskList.innerHTML = `<p class="admin-empty">Не удалось загрузить задачи: ${escapeHtml(error.message)}</p>`; return; }
      tasks = data || [];
      tasksLoaded = true;
      setTasksShown(true);
      if (tasks.length > 0 && tasks[0]) {
        Object.keys(tasks[0]).forEach(k => supportedTaskCols.add(k));
      }
      renderTaskList();
      renderTopicList();
    })().finally(() => {
      tasksLoadingPromise = null;
    });
    return tasksLoadingPromise;
  }

  document.querySelectorAll('[data-sign-out]').forEach(button => button.addEventListener('click', async () => {
    try { if (db) await db.auth.signOut(); } catch {}
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.includes('supabase') || k.includes('auth'))) localStorage.removeItem(k);
      }
    } catch {}
    location.href = 'index.html';
  }));

  let adminAppStarted = false;
  async function startAdminApp() {
    if (adminAppStarted) return;
    adminAppStarted = true;
    try {
      initCollapsibleSections();
      fillGradeSelect(document.querySelector('#topic-grade'), 'Без класса', { numeric: true });
      updateTaskGradeDropdown();
      updateTaskTopicDropdown();
      updateSubtopicDropdown();
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
      await Promise.all([
        detectTagsSupport(),
        loadSkola2030Catalog(),
        loadCatalog(),
        loadTaskIndex()
      ]);
      renderTopicList();
      // Без await: раздел сообщений не должен задерживать остальную панель.
      loadReports();
      loadOverview();
      activateCurrentView();
    } catch (err) {
      console.error('Ошибка загрузки данных каталога:', err);
    }
  }

  async function initAdminApp() {
    if (!db && !window.SUPABASE_CONFIG?.url) {
      deny('Сервис недоступен: не настроено подключение к Supabase.');
      return;
    }
    let viewer;
    try {
      viewer = await loadViewer();
    } catch (err) {
      console.error('Ошибка проверки пользователя:', err);
      deny('Не удалось связаться с сервером авторизации: ' + (err.message || 'таймаут соединения'), true);
      return;
    }
    const { user, isAdmin, error: viewerErr } = viewer || {};
    if (!user) {
      deny('Войдите с учётной записью администратора:', true);
      return;
    }
    if (!isAdmin) {
      const detail = viewerErr?.message ? ` (${viewerErr.message})` : '';
      deny(`У этого аккаунта (${user.email || ''}) нет прав администратора${detail}. Войдите под аккаунтом администратора:`, true);
      return;
    }

    document.querySelector('#admin-email').textContent = user.email || '';
    gate.hidden = true;
    gate.innerHTML = '';
    content.hidden = false;

    await startAdminApp();
  }

  /* ── Каркас: боковое меню и экраны ─────────────────────────────────
     Админка была одной длинной лентой разделов. Теперь у каждой части
     свой экран, как в макете «Админка Skola2030»: меню слева, наверху
     поиск и «+ Новая задача». Разделы остаются в разметке на своих
     местах и при загрузке переезжают на экраны — их id и обработчики не
     меняются. Экран выбирается адресом (#new, #tasks…): работают «назад»
     в браузере и прямые ссылки. */
  const shell = document.querySelector('.adm-shell');
  const viewEls = {};
  document.querySelectorAll('.adm-view').forEach(el => { viewEls[el.dataset.view] = el; });
  const VIEW_ALIASES = {};
  let currentView = null;
  let reviewFilterApplied = false;

  const slot = name => shell?.querySelector(`[data-slot="${name}"]`);
  const viewBody = view => viewEls[view]?.querySelector('.adm-view-body');
  const moveInto = (target, ...nodes) => {
    if (target) nodes.filter(Boolean).forEach(node => target.appendChild(node));
  };

  if (shell) {
    moveInto(viewBody('catalog'), byId('section-subjects'), byId('section-topics'), byId('section-subtopics'));
    // Перенумерация — в шапку экрана: старые панели фильтров под колонками скрыты.
    moveInto(slot('catalog-actions'), byId('btn-renumber-topics'), byId('btn-renumber-subtopics'));
    moveInto(viewBody('ai'), byId('ai-generator-section'));
    // «Настройки AI» жили в шапке раздела, а она на этом экране скрыта — кнопку в шапку экрана.
    moveInto(slot('ai-actions'), byId('btn-toggle-ai-settings'));
    moveInto(viewBody('new'), byId('section-task-form'));
    moveInto(viewBody('reports'), byId('section-reports'));
    moveInto(viewBody('tasks'), byId('section-tasks-database'));
    // Кнопки загрузки, выгрузки, образцы и промпт — из тулбара каталога на экран импорта.
    moveInto(slot('import-tools'), document.querySelector('#task-toolbar .admin-bulk-actions'));
    moveInto(viewBody('import'), byId('csv-sample-card'), byId('json-sample-card'));
    // Перенумерация — действие каталога, а не импорта.
    moveInto(slot('tasks-actions'), byId('btn-renumber-tasks'));
    // Заголовок формы меняет код («Редактировать задачу №…») — он и есть заголовок экрана.
    const formTitle = byId('task-form-title');
    if (formTitle) {
      formTitle.classList.add('adm-view-title');
      slot('new-title')?.prepend(formTitle);
    }
    moveInto(slot('new-actions'), byId('btn-toggle-math-guide'));
    /* Модальные окна — в конец страницы: внутри скрытого экрана окно
       могло не показаться. */
    [bulkDialog, aiPromptDialog].forEach(dialog => dialog && document.body.appendChild(dialog));
  }

  function showView(view, { push = true } = {}) {
    if (!shell) return;
    if (!viewEls[view] && !VIEW_ALIASES[view]) view = 'home';
    const target = VIEW_ALIASES[view] || view;
    for (const [name, el] of Object.entries(viewEls)) el.hidden = name !== target;
    shell.querySelectorAll('[data-view-link]').forEach(link => {
      const on = link.dataset.viewLink === view;
      link.classList.toggle('is-active', on);
      if (on) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    const changed = currentView !== view;
    currentView = view;
    if (push && location.hash !== '#' + view) window.history.pushState(null, '', '#' + view);
    if (changed) window.scrollTo(0, 0);
    activateCurrentView();
  }

  /* До входа ничего не грузим: список, запрошенный без прав админа,
     закешировался бы без черновиков. */
  function activateCurrentView() {
    if (!adminAppStarted || !shell) return;
    if (currentView === 'review') {
      loadReviewQueue();
    } else if (currentView === 'tasks') {
      if (reviewFilterApplied && taskFilterStatus?.value === 'draft') taskFilterStatus.value = '';
      reviewFilterApplied = false;
      showTasksThenRender();
    } else if (currentView === 'home') {
      scheduleOverview();
    }
  }

  function showViewOfElement(el) {
    const view = el?.closest?.('.adm-view')?.dataset.view;
    if (view && view !== (VIEW_ALIASES[currentView] || currentView)) showView(view);
  }
  /* Код, который открывает задачу в форме (генератор, «Клонировать»,
     «Открыть задачу»), прокручивает к ней страницу. Элемент на скрытом
     экране сначала показываем — иначе прокрутка вела в пустоту. */
  const nativeScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (...args) {
    showViewOfElement(this);
    return nativeScrollIntoView.apply(this, args);
  };

  window.addEventListener('hashchange', () => showView(location.hash.slice(1) || 'home', { push: false }));

  shell?.addEventListener('click', event => {
    const filterLink = event.target.closest('[data-status-filter]');
    if (filterLink && taskFilterStatus) {
      taskFilterStatus.value = filterLink.dataset.statusFilter;
      reviewFilterApplied = false;
      if (currentView === 'tasks') showTasksThenRender();
    }
  });

  async function startNewTask() {
    if (editingTaskId && !confirm('Бросить правку текущей задачи и начать новую?')) return;
    await discardPendingImages();
    taskForm.reset();
    setTaskMode(null);
    showView('new');
    conditionInput?.focus();
  }
  byId('adm-new-task')?.addEventListener('click', startNewTask);
  document.addEventListener('keydown', event => {
    if (!shell || content.hidden) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable="true"]') || document.querySelector('dialog[open]')) return;

    // В режиме «Проверка»: Enter — опубликовать, Стрелка вправо — пропустить.
    // На кнопке или ссылке в фокусе Enter нажимает её, а не публикует.
    if (currentView === 'review' && !event.target.closest?.('button, a, summary')) {
      if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        approveCurrentReviewTask();
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        skipCurrentReviewTask();
        return;
      }
    }

    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (!['n', 'N', 'т', 'Т'].includes(event.key)) return;
    event.preventDefault();
    startNewTask();
  });

  const globalSearch = byId('adm-global-search');
  globalSearch?.addEventListener('input', () => {
    if (taskSearchInput) {
      taskSearchInput.value = globalSearch.value;
      taskSearchInput.dispatchEvent(new Event('input'));
    }
    if (currentView !== 'tasks') showView('tasks');
  });

  const paintThemeLabel = () => {
    const label = byId('adm-theme-label');
    if (label) label.textContent = document.body.classList.contains('dark') ? 'Тёмная тема' : 'Светлая тема';
  };
  byId('adm-theme-btn')?.addEventListener('click', () => {
    // Тему переключает переключатель сайта — он в скрытой шапке страницы входа.
    document.querySelector('#theme-toggle')?.click();
    paintThemeLabel();
  });
  new MutationObserver(paintThemeLabel).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  paintThemeLabel();

  const setShellText = (selector, value) => {
    const el = shell?.querySelector(selector);
    if (el) el.textContent = value;
  };
  const setShellBadge = (selector, value) => {
    const el = shell?.querySelector(selector);
    if (!el) return;
    el.textContent = value;
    el.hidden = !value;
  };

  function updateShellCounts() {
    if (!shell) return;
    const drafts = taskIndex.filter(t => t.is_published === false).length;
    setShellBadge('#adm-count-review', drafts);
    setShellBadge('#adm-count-reports', reports.length);
    setShellText('#adm-count-tasks', taskIndex.length || '');
    setShellText('#adm-stat-drafts', drafts);
    setShellText('#adm-stat-reports', reports.length);
    setShellText('#adm-stat-published', taskIndex.length - drafts);
    paintStatusSegments();
    scheduleOverview();
  }

  let overviewTimer = null;
  function scheduleOverview() {
    clearTimeout(overviewTimer);
    overviewTimer = setTimeout(loadOverview, 300);
  }

  /* Обзор: задачи без латышского условия и четыре свежих черновика —
     два маленьких запроса; остальные числа уже есть в указателе. */
  async function loadOverview() {
    if (!shell || !adminAppStarted || !db) return;
    const email = byId('admin-email')?.textContent.trim() || '';
    setShellText('#adm-avatar', email ? email[0] : '·');
    const [noLv, drafts] = await Promise.all([
      db.from('tasks').select('id', { count: 'exact', head: true }).or('condition_latex_lv.is.null,condition_latex_lv.eq.'),
      db.from('tasks').select('id,title,topic_id,subtopic_id,grade,condition_latex_lv')
        .eq('is_published', false).order('created_at', { ascending: false }).limit(4)
    ]);
    setShellText('#adm-stat-nolv', noLv.error ? '—' : (noLv.count ?? '—'));
    const peek = byId('adm-queue-peek');
    if (!peek) return;
    if (drafts.error) {
      peek.innerHTML = `<p class="adm-empty">Очередь не загрузилась: ${escapeHtml(drafts.error.message)}</p>`;
      return;
    }
    const rows = drafts.data || [];
    peek.innerHTML = rows.length ? rows.map(row => {
      const topic = topics.find(t => t.id === row.topic_id);
      const sub = row.subtopic_id ? subtopics.find(s => s.id === row.subtopic_id) : null;
      const grade = row.grade ?? topic?.grade;
      const path = [grade ? gradeText(grade) : '', topic?.title || 'без темы', sub?.code || ''].filter(Boolean).join(' · ');
      const hasLv = Boolean((row.condition_latex_lv || '').trim());
      return `<button type="button" class="adm-queue-row" data-open-task="${row.id}">
        <span class="adm-queue-id">#${row.id}</span>
        <span class="adm-queue-title">${escapeHtml(row.title || `Задача #${row.id}`)}</span>
        <span class="adm-queue-path">${escapeHtml(path)}</span>
        <span class="adm-chip ${hasLv ? 'ok' : 'warn'}">${hasLv ? 'RU + LV' : 'только RU'}</span>
      </button>`;
    }).join('') : '<p class="adm-empty">Очередь пуста — всё опубликовано.</p>';
  }

  byId('adm-queue-peek')?.addEventListener('click', async event => {
    const id = event.target.closest('[data-open-task]')?.dataset.openTask;
    if (!id) return;
    const full = await fetchFullRow('tasks', id);
    if (full) setTaskMode(full);
  });

  /* ── Экран проверки по одной задаче (макет «Админка Skola2030») ───
     Показывает черновики по одному: условие и решение в KaTeX,
     автопроверки (формулы, ответ, перевод на латышский, чертёж),
     кнопки «Опубликовать», «Править», «Отклонить», «Пропустить» и
     горячие клавиши Enter и →. */
  let reviewQueue = [];
  let reviewIndex = 0;
  let reviewLoading = false;

  async function loadReviewQueue(preserveIndex = false) {
    if (!shell || !adminAppStarted || !db) return;
    reviewLoading = true;
    const progressEl = byId('adm-review-progress');
    if (progressEl && !reviewQueue.length) progressEl.textContent = 'Загружаем…';
    try {
      const { data, error } = await db.from('tasks')
        .select('*')
        .eq('is_published', false)
        .order('created_at', { ascending: false });
      if (error) {
        if (progressEl) progressEl.textContent = 'Ошибка загрузки';
        return;
      }
      reviewQueue = data || [];
      if (!preserveIndex || reviewIndex >= reviewQueue.length) {
        reviewIndex = 0;
      }
      await renderReviewCard();
    } finally {
      reviewLoading = false;
    }
  }

  function getTaskImageUrl(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('<svg')) {
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(trimmed);
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('/')) {
      return trimmed;
    }
    if (window.MathTasks?.imageUrl) {
      return window.MathTasks.imageUrl(trimmed);
    }
    if (window.MathTasks?.db) {
      const bucket = window.MathTasks.IMAGE_BUCKET || 'task-images';
      return window.MathTasks.db.storage.from(bucket).getPublicUrl(trimmed)?.data?.publicUrl || trimmed;
    }
    return trimmed;
  }

  async function renderReviewCard() {
    const card = byId('adm-review-card');
    const empty = byId('adm-review-empty');
    const progress = byId('adm-review-progress');
    if (!card || !empty) return;

    if (!reviewQueue.length) {
      card.hidden = true;
      empty.hidden = false;
      if (progress) progress.textContent = 'Очередь пуста';
      return;
    }

    card.hidden = false;
    empty.hidden = true;
    const task = reviewQueue[Math.min(reviewIndex, reviewQueue.length - 1)];
    if (!task) return;

    if (progress) {
      progress.textContent = `${reviewIndex + 1} из ${reviewQueue.length}`;
    }

    const idEl = byId('adm-review-id');
    if (idEl) idEl.textContent = `#${task.id}`;

    const titleEl = byId('adm-review-title');
    if (titleEl) titleEl.textContent = task.title || `Задача #${task.id}`;

    const topic = topics.find(t => t.id === task.topic_id);
    const sub = task.subtopic_id ? subtopics.find(s => s.id === task.subtopic_id) : null;
    const grade = task.grade ?? topic?.grade;
    const pathParts = [];
    if (grade) pathParts.push(gradeText(grade));
    if (topic?.subject_id) {
      const subject = subjects.find(s => s.id === topic.subject_id);
      if (subject?.title) pathParts.push(subject.title);
    }
    if (topic?.title) pathParts.push(topic.title);
    if (sub?.code) pathParts.push(`${sub.code} ${sub.title || ''}`.trim());
    else if (sub?.title) pathParts.push(sub.title);
    const pathEl = byId('adm-review-path');
    if (pathEl) pathEl.textContent = pathParts.join(' · ') || 'Без темы';

    const diffEl = byId('adm-review-diff');
    if (diffEl) diffEl.textContent = task.difficulty || 'Средний';

    const hasLv = Boolean((task.condition_latex_lv || '').trim());
    const lvEl = byId('adm-review-lv');
    if (lvEl) {
      lvEl.textContent = hasLv ? 'RU + LV' : 'только RU';
      lvEl.className = `adm-chip ${hasLv ? 'ok' : 'warn'}`;
    }

    // Условие задачи с рендерингом KaTeX
    const hasRuCond = Boolean((task.condition_latex || '').trim());
    const hasLvCond = Boolean((task.condition_latex_lv || '').trim());
    const condEl = byId('adm-review-cond');
    const condLvWrap = byId('adm-review-cond-lv-wrap');
    const condLvEl = byId('adm-review-cond-lv');

    if (condEl) {
      renderMath(condEl, hasRuCond ? task.condition_latex : (hasLvCond ? task.condition_latex_lv : '—'));
    }
    if (condLvWrap && condLvEl) {
      if (hasRuCond && hasLvCond) {
        condLvWrap.hidden = false;
        renderMath(condLvEl, task.condition_latex_lv);
      } else {
        condLvWrap.hidden = true;
        condLvEl.textContent = '';
      }
    }

    const condImgWrap = byId('adm-review-cond-img');
    if (condImgWrap) {
      const imgUrl = getTaskImageUrl(task.condition_image);
      if (imgUrl) {
        condImgWrap.hidden = false;
        condImgWrap.innerHTML = `<img src="${escapeHtml(imgUrl)}" alt="Чертёж к условию" />`;
      } else {
        condImgWrap.hidden = true;
        condImgWrap.innerHTML = '';
      }
    }

    // Решение и ответ с рендерингом KaTeX
    const hasRuSol = Boolean((task.solution_latex || '').trim() || (task.answer_latex || '').trim());
    const hasLvSol = Boolean((task.solution_latex_lv || '').trim() || (task.answer_latex_lv || '').trim());
    const solEl = byId('adm-review-sol');
    const solLvWrap = byId('adm-review-sol-lv-wrap');
    const solLvEl = byId('adm-review-sol-lv');

    if (solEl) {
      const parts = [];
      if (task.solution_latex && task.solution_latex.trim()) parts.push(task.solution_latex);
      if (task.answer_latex && task.answer_latex.trim()) parts.push(`Ответ: ${task.answer_latex}`);
      if (!parts.length && hasLvSol) {
        if (task.solution_latex_lv && task.solution_latex_lv.trim()) parts.push(task.solution_latex_lv);
        if (task.answer_latex_lv && task.answer_latex_lv.trim()) parts.push(`Atbilde: ${task.answer_latex_lv}`);
      }
      renderMath(solEl, parts.join('\n\n') || '—');
    }

    if (solLvWrap && solLvEl) {
      if (hasRuSol && hasLvSol) {
        const lvParts = [];
        if (task.solution_latex_lv && task.solution_latex_lv.trim()) lvParts.push(task.solution_latex_lv);
        if (task.answer_latex_lv && task.answer_latex_lv.trim()) lvParts.push(`Atbilde: ${task.answer_latex_lv}`);
        solLvWrap.hidden = false;
        renderMath(solLvEl, lvParts.join('\n\n'));
      } else {
        solLvWrap.hidden = true;
        solLvEl.textContent = '';
      }
    }

    const solImgWrap = byId('adm-review-sol-img');
    if (solImgWrap) {
      const imgUrl = getTaskImageUrl(task.solution_image);
      if (imgUrl) {
        solImgWrap.hidden = false;
        solImgWrap.innerHTML = `<img src="${escapeHtml(imgUrl)}" alt="Рисунок к решению" />`;
      } else {
        solImgWrap.hidden = true;
        solImgWrap.innerHTML = '';
      }
    }

    // Язык карточки — по переключателю «Русский / Latviešu / RU + LV».
    applyReviewLang(task);

    // Кросс-теги
    const tagsEl = byId('adm-review-tags');
    if (tagsEl) {
      tagsEl.innerHTML = '';
      try {
        const { data: tagLinks } = await db.from('task_tags').select('tags(title)').eq('task_id', task.id);
        const tagNames = (tagLinks || []).map(tl => tl.tags?.title).filter(Boolean);
        if (tagNames.length) {
          tagsEl.innerHTML = tagNames.map(t => `<span class="adm-chip">${escapeHtml(t)}</span>`).join('');
        }
      } catch (_) {}
    }

    // Автопроверки (формулы, ответ, перевод, чертёж)
    const checksEl = byId('adm-review-checks');
    if (checksEl) {
      const checks = [];

      // 1. Формулы: каждое поле отдельно — склеенные поля сдвигали пары $ друг другу.
      const latexFields = [
        ['условии', task.condition_latex], ['ответе', task.answer_latex],
        ['решении', task.solution_latex], ['подсказке', task.hint_latex],
        ['условии LV', task.condition_latex_lv], ['ответе LV', task.answer_latex_lv],
        ['решении LV', task.solution_latex_lv], ['подсказке LV', task.hint_latex_lv]
      ];
      const badField = latexFields.find(([, text]) => !checkFormulaSyntax(text).ok);
      checks.push(badField
        ? { ok: false, text: `Формула не разбирается в ${badField[0]}` }
        : { ok: true, text: 'Формулы KaTeX разбираются' });

      // 2. Ответ и решение
      const hasAns = Boolean((task.answer_latex || '').trim());
      const hasSol = Boolean((task.solution_latex || '').trim());
      if (hasAns && hasSol) checks.push({ ok: true, text: 'Есть ответ и решение' });
      else if (hasAns || hasSol) checks.push({ ok: false, warn: true, text: hasAns ? 'Нет решения' : 'Нет ответа' });
      else checks.push({ ok: false, text: 'Нет ни ответа, ни решения' });

      // 3. Перевод LV
      checks.push({
        ok: hasLv,
        text: hasLv ? 'Перевод LV готов' : 'Нет перевода на LV'
      });

      // 4. Чертёж
      const hasDrawing = Boolean(task.condition_image || task.solution_image);
      const textMentionsDrawing = /черт[её]ж|рисун|график|треугольн|окружност|угол|трапеци/i.test(task.condition_latex || '');
      if (hasDrawing) {
        checks.push({ ok: true, text: 'Чертёж прикреплён' });
      } else if (textMentionsDrawing) {
        checks.push({ ok: false, warn: true, text: 'Возможно, нужен чертёж' });
      } else {
        checks.push({ ok: true, text: 'Чертёж не требуется' });
      }

      checksEl.innerHTML = checks.map(c => {
        const cls = c.ok ? 'ok' : (c.warn ? 'warn' : 'bad');
        return `<div class="adm-review-check ${cls}"><span class="adm-check-dot"></span><span>${escapeHtml(c.text)}</span></div>`;
      }).join('');
    }

    // Откуда
    const originEl = byId('adm-review-origin');
    if (originEl) {
      // Источник задачи в базе не хранится — показываем только то, что известно точно.
      const fmt = iso => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
      const lines = [];
      if (task.created_at) lines.push(`Создана ${fmt(task.created_at)}`);
      if (task.updated_at && fmt(task.updated_at) !== fmt(task.created_at || task.updated_at)) lines.push(`изменена ${fmt(task.updated_at)}`);
      originEl.textContent = lines.join(', ') || '—';
    }
  }

  /* Язык в «Проверке»: русский, латышский или оба рядом (латышский справа).
     Выбор помнится. Отсутствующий перевод называется прямо, а не прячется. */
  const REVIEW_LANG_KEY = 'mt-admin-review-lang';
  let reviewLang = 'ru';
  try {
    const saved = localStorage.getItem(REVIEW_LANG_KEY);
    if (['ru', 'lv', 'both'].includes(saved)) reviewLang = saved;
  } catch {}

  function paintReviewLang() {
    document.querySelectorAll('[data-review-lang]').forEach(btn => {
      const on = btn.dataset.reviewLang === reviewLang;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
  }

  function applyReviewLang(task) {
    paintReviewLang();
    const both = reviewLang === 'both';
    byId('adm-review-card')?.classList.toggle('is-both', both);
    const solution = (sol, ans, word) => [
      String(sol || '').trim(),
      String(ans || '').trim() ? `${word}: ${String(ans).trim()}` : ''
    ].filter(Boolean).join('\n\n');
    const ru = { cond: String(task.condition_latex || '').trim(), sol: solution(task.solution_latex, task.answer_latex, 'Ответ') };
    const lv = { cond: String(task.condition_latex_lv || '').trim(), sol: solution(task.solution_latex_lv, task.answer_latex_lv, 'Atbilde') };
    const set = (el, text, empty) => {
      if (!el) return;
      if (text) renderMath(el, text);
      else el.innerHTML = `<span class="adm-review-missing">${empty}</span>`;
    };
    const main = reviewLang === 'lv' ? lv : ru;
    set(byId('adm-review-cond'), main.cond, reviewLang === 'lv' ? 'Латышского условия нет' : 'Русского условия нет');
    set(byId('adm-review-sol'), main.sol, reviewLang === 'lv' ? 'Латышского решения и ответа нет' : 'Решения и ответа нет');
    const condLvWrap = byId('adm-review-cond-lv-wrap');
    const solLvWrap = byId('adm-review-sol-lv-wrap');
    if (condLvWrap) condLvWrap.hidden = !both;
    if (solLvWrap) solLvWrap.hidden = !both;
    if (both) {
      set(byId('adm-review-cond-lv'), lv.cond, 'Перевода нет');
      set(byId('adm-review-sol-lv'), lv.sol, 'Перевода нет');
    }
  }

  document.querySelectorAll('[data-review-lang]').forEach(btn => btn.addEventListener('click', () => {
    reviewLang = btn.dataset.reviewLang;
    try { localStorage.setItem(REVIEW_LANG_KEY, reviewLang); } catch {}
    const task = reviewQueue[reviewIndex];
    if (task) applyReviewLang(task);
    else paintReviewLang();
  }));
  paintReviewLang();

  /* Пока идёт запрос, второе нажатие Enter не принимаем: оно вырезало бы
     из очереди следующую задачу, так её и не опубликовав. */
  let reviewBusy = false;

  async function approveCurrentReviewTask() {
    if (reviewBusy || !reviewQueue.length) return;
    const task = reviewQueue[reviewIndex];
    if (!task) return;
    reviewBusy = true;
    if (admReviewApprove) admReviewApprove.disabled = true;
    try {
      const { error } = await db.from('tasks').update({ is_published: true }).eq('id', task.id);
      if (error) {
        alert('Ошибка при публикации: ' + error.message);
        return;
      }
      task.is_published = true;
      for (const list of [tasks, taskIndex]) {
        const row = list.find(item => String(item.id) === String(task.id));
        if (row) row.is_published = true;
      }
      updateReviewChip();
      reviewQueue.splice(reviewIndex, 1);
      if (reviewIndex >= reviewQueue.length) reviewIndex = 0;
      await renderReviewCard();
    } finally {
      reviewBusy = false;
      if (admReviewApprove) admReviewApprove.disabled = false;
    }
  }

  async function editCurrentReviewTask() {
    if (!reviewQueue.length) return;
    const task = reviewQueue[reviewIndex];
    if (!task) return;
    const full = await fetchFullRow('tasks', task.id);
    if (full) {
      setTaskMode(full);
      editorReturnView = { view: 'review', taskId: full.id };
      showView('new');
    }
  }

  async function rejectCurrentReviewTask() {
    if (!reviewQueue.length) return;
    const task = reviewQueue[reviewIndex];
    if (!task) return;
    if (reviewBusy) return;
    if (!confirm(`Отклонить и удалить задачу #${task.id}? Это действие необратимо.`)) return;
    reviewBusy = true;
    if (admReviewReject) admReviewReject.disabled = true;
    try {
      const { error } = await db.from('tasks').delete().eq('id', task.id);
      if (error) {
        alert('Ошибка при удалении: ' + error.message);
        return;
      }
      if (task.condition_image) await removeFile(task.condition_image);
      if (task.solution_image) await removeFile(task.solution_image);
      taskIndex = taskIndex.filter(t => String(t.id) !== String(task.id));
      tasks = tasks.filter(t => String(t.id) !== String(task.id));
      updateReviewChip();
      reviewQueue.splice(reviewIndex, 1);
      if (reviewIndex >= reviewQueue.length) reviewIndex = 0;
      await renderReviewCard();
    } finally {
      reviewBusy = false;
      if (admReviewReject) admReviewReject.disabled = false;
    }
  }

  function skipCurrentReviewTask() {
    if (reviewQueue.length > 1) {
      reviewIndex = (reviewIndex + 1) % reviewQueue.length;
      renderReviewCard();
    }
  }

  admReviewApprove?.addEventListener('click', approveCurrentReviewTask);
  admReviewEdit?.addEventListener('click', editCurrentReviewTask);
  admReviewReject?.addEventListener('click', rejectCurrentReviewTask);
  admReviewSkip?.addEventListener('click', skipCurrentReviewTask);

  /* Каталог: список открыт сразу — без блока «Показать задачи». Сегменты
     ставят значение фильтра статуса и запускают ту же перерисовку. */
  byId('task-status-seg')?.addEventListener('click', event => {
    const btn = event.target.closest('[data-seg-status]');
    if (!btn || !taskFilterStatus) return;
    taskFilterStatus.value = btn.dataset.segStatus;
    reviewFilterApplied = false;
    taskFilterStatus.dispatchEvent(new Event('change'));
  });
  taskFilterStatus?.addEventListener('change', paintStatusSegments);
  taskList.addEventListener('click', event => {
    if (event.target.closest('[data-reset-task-filters]')) resetTaskFilters();
  });

  /* ── Импорт: мастер «Файл → Разбор и проверка → Импорт в очередь» ──
     Ничего не попадает в базу, пока не нажата кнопка импорта. Разбор
     показывает каждую строку: готова, с ошибкой или дублирует задачу.
     Импортируются только готовые строки — той же функцией, что и окно
     импорта, поэтому темы, подтемы, чертежи и теги сохраняются одинаково. */
  const imp = {
    steps: shell ? shell.querySelectorAll('#imp-steps [data-step]') : [],
    drop: byId('imp-drop'),
    file: byId('imp-file'),
    text: byId('imp-text'),
    fileName: byId('imp-file-name'),
    analyzeBtn: byId('imp-analyze'),
    clearBtn: byId('imp-clear'),
    error: byId('imp-error'),
    result: byId('imp-result'),
    notes: byId('imp-notes'),
    rows: byId('imp-rows'),
    publish: byId('imp-publish'),
    runBtn: byId('imp-run'),
    done: byId('imp-done')
  };
  let impAnalysis = null;
  let impFilter = 'all';
  let impBusy = false;
  // «Импортировать 1 задачу», «Опубликовать 21 задачу» — винительный падеж.
  const tasksAcc = n => (declTasks(n) === 'задача' ? 'задачу' : declTasks(n));

  function setImportStep(step) {
    imp.steps.forEach(el => {
      const n = Number(el.dataset.step);
      el.classList.toggle('is-active', n === step);
      el.classList.toggle('is-done', n < step);
      if (n === step) el.setAttribute('aria-current', 'step');
      else el.removeAttribute('aria-current');
    });
  }

  function resetImportResult() {
    impAnalysis = null;
    if (imp.result) imp.result.hidden = true;
    if (imp.done) imp.done.hidden = true;
    if (imp.error) {
      imp.error.hidden = true;
      imp.error.textContent = '';
    }
    setImportStep(1);
  }

  function showImportError(message) {
    if (!imp.error) return;
    imp.error.textContent = message;
    imp.error.hidden = false;
  }

  async function loadImportSource(file) {
    if (!file || !imp.text) return;
    imp.text.value = await file.text();
    if (imp.fileName) imp.fileName.textContent = file.name;
    await analyzeImport();
  }

  async function analyzeImport() {
    if (impBusy || !imp.text) return;
    resetImportResult();
    const raw = imp.text.value.trim();
    if (imp.clearBtn) imp.clearBtn.hidden = !raw;
    if (!raw) {
      showImportError('Вставьте JSON или таблицу либо выберите файл.');
      return;
    }
    let parsed;
    try {
      // Сломанный JSON иначе молча разбирался бы как таблица и давал мусор.
      if (/^[[{]/.test(raw)) {
        try { JSON.parse(raw); } catch (err) { throw new Error(`JSON не разобрался: ${err.message}`); }
      }
      parsed = window.MathTasksLib.parseTasksImport(raw);
    } catch (err) {
      showImportError(err.message);
      return;
    }
    if (!parsed.tasks.length) {
      showImportError('Задач не найдено. В таблице первая строка — названия столбцов, и нужен столбец condition_latex (или «Условие»).');
      return;
    }
    impBusy = true;
    imp.analyzeBtn.disabled = true;
    imp.analyzeBtn.textContent = 'Разбираем…';
    try {
      // Для поиска дублей нужны условия всех задач базы — только id и текст.
      const { data: existing, error } = await window.MathTasksLib.fetchAllRows(
        () => db.from('tasks').select('id,condition_latex').order('id'));
      const analysis = window.MathTasksLib.analyzeImportRows(parsed.tasks, {
        topics,
        subtopics,
        existingConditions: existing || [],
        tags: tagsReady && allTags.length ? allTags : null,
        checkFormula: checkFormulaSyntax
      });
      impAnalysis = { parsed, ...analysis, dupCheckFailed: Boolean(error) };
      impFilter = 'all';
      renderImportAnalysis();
      setImportStep(2);
    } finally {
      impBusy = false;
      imp.analyzeBtn.disabled = false;
      imp.analyzeBtn.textContent = 'Разобрать';
    }
  }

  function renderImportAnalysis() {
    const a = impAnalysis;
    if (!a || !imp.result) return;
    imp.result.hidden = false;
    byId('imp-stat-ok').textContent = a.counts.ok;
    byId('imp-stat-bad').textContent = a.counts.bad;
    byId('imp-stat-dup').textContent = a.counts.dup;
    byId('imp-stat-new').textContent = `${a.newTopics} / ${a.newSubtopics}`;
    // Разбор отдаёт format: 'csv' для любой таблицы — TSV узнаём по табуляции в первой строке.
    const firstLine = (imp.text?.value || '').split(/\r?\n/).find(line => line.trim()) || '';
    const tableLabel = firstLine.includes('\t') ? 'таблица TSV (через табуляцию)' : 'таблица CSV';
    const notes = [`Формат: ${a.parsed.format === 'json' ? 'JSON' : tableLabel}, строк с задачами: ${a.rows.length}.`];
    if (a.dupCheckFailed) notes.push('С задачами базы сверить не удалось — дубликаты проверены только внутри файла.');
    for (const warning of a.parsed.warnings || []) notes.push(warning);
    imp.notes.innerHTML = notes.map(text => `<p>${escapeHtml(text)}</p>`).join('');
    renderImportRows();
    const n = a.counts.ok;
    imp.runBtn.textContent = n ? `Импортировать ${n} ${tasksAcc(n)}` : 'Нечего импортировать';
    imp.runBtn.disabled = !n;
  }

  function renderImportRows() {
    const a = impAnalysis;
    if (!a || !imp.rows) return;
    shell.querySelectorAll('[data-imp-filter]').forEach(btn => {
      const on = btn.dataset.impFilter === impFilter;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    const head = '<div class="imp-thead"><div>№</div><div>Условие</div><div>Тема</div><div>Класс</div><div>Проверка</div></div>';
    const list = impFilter === 'bad' ? a.rows.filter(r => r.status !== 'ok') : a.rows;
    if (!list.length) {
      imp.rows.innerHTML = head + '<p class="adm-empty">Проблемных строк нет — импортируется всё.</p>';
      return;
    }
    const codes = topicCodeMap();
    imp.rows.innerHTML = head + list.map(r => {
      const cond = String(r.item.condition_latex || '').replace(/\s+/g, ' ').trim();
      const topicText = r.topic ? topicOptionText(r.topic, codes) : (r.topicTitle ? `новая: ${r.topicTitle}` : '—');
      const sub = r.subtopic
        ? `${r.subtopic.code ? r.subtopic.code + ' ' : ''}${r.subtopic.title}`
        : String(r.item.subtopic_code || r.item.subtopic_title || '').trim();
      const grade = parseFormGrade(r.grade);
      const check = r.problems.length ? r.problems.map(p => p.text).join('; ') : ['готово', ...r.notes].join(' · ');
      const full = [...r.problems.map(p => p.text), ...r.notes].join('; ') || 'готово';
      return `<div class="imp-trow ${r.status}">
        <div class="imp-n">${r.n}</div>
        <div class="imp-cond" title="${escapeHtml(cond)}">${escapeHtml(cond.slice(0, 220)) || '—'}</div>
        <div class="imp-topic" title="${escapeHtml(sub ? `${topicText} · ${sub}` : topicText)}"><span>${escapeHtml(topicText)}</span>${sub ? `<small>${escapeHtml(sub)}</small>` : ''}</div>
        <div class="imp-grade">${grade ? `${grade}. klase` : '—'}</div>
        <div class="imp-check ${r.status}" title="${escapeHtml(full)}">${escapeHtml(check)}</div>
      </div>`;
    }).join('');
  }

  async function runImport() {
    const a = impAnalysis;
    if (!a || impBusy) return;
    const okRows = a.rows.filter(r => r.status === 'ok');
    if (!okRows.length) return;
    const publishNow = Boolean(imp.publish?.checked);
    if (publishNow && !confirm(`Опубликовать ${okRows.length} ${tasksAcc(okRows.length)} на сайте сразу, без проверки?`)) return;
    impBusy = true;
    imp.runBtn.disabled = true;
    imp.analyzeBtn.disabled = true;
    setImportStep(3);
    const items = okRows.map(r => r.item);
    // Темы и подтемы создаём только для строк, которые импортируются.
    const low = value => String(value || '').trim().toLowerCase();
    const topicKeys = new Set(items.flatMap(it => [low(it.topic_title), low(it.topic_title_lv)]).filter(Boolean));
    const subKeys = new Set(items.map(it => `${low(it.topic_title)}::${low(it.subtopic_code || it.subtopic_title)}`));
    let result;
    try {
      result = await importParsedItems({
        uniqueTopics: (a.parsed.uniqueTopics || []).filter(t => topicKeys.has(low(t.title)) || topicKeys.has(low(t.title_lv))),
        uniqueSubtopics: (a.parsed.uniqueSubtopics || []).filter(s => subKeys.has(`${low(s.topic_title)}::${low(s.code || s.title)}`)),
        items,
        publishNow,
        labelOf: i => `Строка ${okRows[i].n}`,
        onProgress: (i, total) => { imp.runBtn.textContent = `Импортируем… ${i} из ${total}`; }
      });
    } catch (err) {
      result = { successCount: 0, createdTopicsCount: 0, createdSubtopicsCount: 0, uploadedFigures: 0, errors: [err.message], warnings: [] };
    } finally {
      impBusy = false;
      imp.analyzeBtn.disabled = false;
    }
    renderImportDone(result, okRows.length, publishNow);
    await loadCatalog();
    await refreshTasks();
  }

  function renderImportDone(res, total, publishNow) {
    if (!imp.done) return;
    const list = (title, items, cls) => (items.length
      ? `<div class="imp-done-list ${cls}"><strong>${title} (${items.length})</strong><ul>${items.slice(0, 20).map(t => `<li>${escapeHtml(t)}</li>`).join('')}${items.length > 20 ? `<li>…и ещё ${items.length - 20}</li>` : ''}</ul></div>`
      : '');
    const created = [
      res.createdTopicsCount ? `новых тем: ${res.createdTopicsCount}` : '',
      res.createdSubtopicsCount ? `новых подтем: ${res.createdSubtopicsCount}` : '',
      res.uploadedFigures ? `чертежей: ${res.uploadedFigures}` : ''
    ].filter(Boolean).join(', ');
    const where = res.successCount
      ? (publishNow ? 'Задачи опубликованы и уже видны на сайте.' : 'Задачи сохранены черновиками: на сайте их не видно, пока вы не опубликуете их на экране «Проверка».')
      : '';
    imp.done.innerHTML = `<div class="imp-done-title">${res.successCount ? `Импортировано ${res.successCount} из ${total}` : 'Ничего не импортировано'}</div>
      <p>${where}${created ? ` Создано: ${created}.` : ''}</p>
      ${list('Предупреждения', res.warnings || [], 'warn')}${list('Ошибки', res.errors || [], 'bad')}
      <div class="imp-done-actions">
        ${res.successCount ? `<a class="adm-btn primary" href="${publishNow ? '#tasks' : '#review'}">${publishNow ? 'Открыть каталог' : 'Перейти к проверке'}</a>` : ''}
        <button type="button" class="adm-btn soft" data-imp-restart>Новый импорт</button>
      </div>`;
    imp.done.hidden = false;
    if (imp.result) imp.result.hidden = true;
    imp.done.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function restartImport() {
    if (imp.text) imp.text.value = '';
    if (imp.fileName) imp.fileName.textContent = '';
    if (imp.clearBtn) imp.clearBtn.hidden = true;
    resetImportResult();
    imp.text?.focus();
  }

  imp.analyzeBtn?.addEventListener('click', () => analyzeImport());
  imp.runBtn?.addEventListener('click', () => runImport());
  imp.clearBtn?.addEventListener('click', restartImport);
  imp.text?.addEventListener('input', () => {
    // Текст изменился — прежний разбор больше не про него.
    if (impAnalysis || (imp.error && !imp.error.hidden) || (imp.done && !imp.done.hidden)) resetImportResult();
    if (imp.fileName) imp.fileName.textContent = '';
    if (imp.clearBtn) imp.clearBtn.hidden = !imp.text.value.trim();
  });
  imp.file?.addEventListener('change', () => {
    const file = imp.file.files?.[0];
    imp.file.value = '';
    loadImportSource(file);
  });
  imp.drop?.addEventListener('click', () => imp.file?.click());
  imp.drop?.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      imp.file?.click();
    }
  });
  /* Файл можно бросить в любое место экрана импорта: брошенный мимо зоны
     файл браузер иначе открыл бы вместо админки. */
  const onImportScreen = () => currentView === 'import' && !content.hidden;
  document.addEventListener('dragover', event => {
    if (!onImportScreen()) return;
    event.preventDefault();
    imp.drop?.classList.add('is-over');
  });
  document.addEventListener('dragleave', event => {
    if (onImportScreen() && !event.relatedTarget) imp.drop?.classList.remove('is-over');
  });
  document.addEventListener('drop', event => {
    if (!onImportScreen()) return;
    event.preventDefault();
    imp.drop?.classList.remove('is-over');
    loadImportSource(event.dataTransfer?.files?.[0]);
  });
  shell?.addEventListener('click', event => {
    const filterBtn = event.target.closest('[data-imp-filter]');
    if (filterBtn) {
      impFilter = filterBtn.dataset.impFilter;
      renderImportRows();
      return;
    }
    if (event.target.closest('[data-imp-restart]')) {
      restartImport();
      return;
    }
    const sample = event.target.closest('[data-imp-sample]');
    if (sample && imp.text) {
      const kind = sample.dataset.impSample;
      const csv = byId('csv-sample-code')?.textContent || '';
      // TSV собирается из образца CSV, отдельной копии в разметке нет.
      imp.text.value = kind === 'tsv'
        ? (window.MathTasksLib?.csvToTsv?.(csv) || csv)
        : ((kind === 'csv' ? csv : byId('json-sample-code')?.textContent) || '');
      if (imp.fileName) imp.fileName.textContent = `образец ${sample.dataset.impSample.toUpperCase()}`;
      analyzeImport();
    }
  });

  /* ── Разделы, темы, подтемы: три колонки (макет «Админка Skola2030») ──
     Выбрали раздел — справа его темы (с фильтром по классу), выбрали тему —
     её подтемы; справа в строке — число задач. Добавление — полем внизу
     колонки, правка (✎) открывает прежнюю форму под колонками, порядок —
     стрелками, удаление — ✕. Сохраняет всё прежний код форм, поэтому
     перенумерация тем и кодов подтем работает как раньше. */
  const catState = { subject: null, grade: '', topic: null };
  let catStatusTimer = null;

  function setCatStatus(text, tone = '') {
    const el = byId('cat3-status');
    if (!el) return;
    el.textContent = text;
    el.className = `adm-cat3-status${tone ? ` ${tone}` : ''}`;
    clearTimeout(catStatusTimer);
    if (text) catStatusTimer = setTimeout(() => setCatStatus(''), 7000);
  }

  /* В каркасе прежние разделы каталога скрыты — их заменяют колонки.
     Раздел показывается, только пока в нём открыта правка. */
  function catEditorShow(sectionId, on) {
    if (!document.querySelector('.adm-shell')) return;
    ['section-subjects', 'section-topics', 'section-subtopics'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (on) el.classList.toggle('is-editing', id === sectionId);
      else if (id === sectionId) el.classList.remove('is-editing');
    });
  }

  const declTopics = n => {
    const m10 = n % 10, m100 = n % 100;
    if (m100 >= 11 && m100 <= 14) return 'тем';
    if (m10 === 1) return 'тема';
    return m10 >= 2 && m10 <= 4 ? 'темы' : 'тем';
  };
  const catAct = (kind, id, act, label, text, disabled = false) =>
    `<button type="button" class="adm-cat3-act${act === 'delete' ? ' bad' : ''}" data-cat-act="${act}" data-kind="${kind}" data-id="${id}" title="${label}" aria-label="${label}"${disabled ? ' disabled' : ''}>${text}</button>`;

  function renderCat3() {
    const root = byId('adm-cat3');
    if (!root) return;
    const counts = countPlaces();
    const codes = topicCodeMap();

    // Разделы. Темы без раздела не видны в меню сайта — их собираем отдельной строкой.
    const subjectsSorted = [...subjects].sort((a, b) => positionOf(a) - positionOf(b) || titleCompare(a, b));
    const orphans = topics.filter(t => !subjects.some(s => s.id === t.subject_id));
    const subjectOk = catState.subject === 'none' ? orphans.length > 0 : subjects.some(s => s.id === catState.subject);
    if (!subjectOk) {
      catState.subject = subjectsSorted[0]?.id ?? (orphans.length ? 'none' : null);
      catState.topic = null;
    }
    const subjectRows = subjectsSorted.map(s => {
      const n = topics.filter(t => t.subject_id === s.id).length;
      const on = catState.subject === s.id;
      return `<div class="adm-cat3-row${on ? ' is-selected' : ''}">
        <button type="button" class="adm-cat3-pick" data-cat-subject="${s.id}" aria-pressed="${on}">
          <span class="adm-cat3-name"><b>${escapeHtml(s.title)}</b>${s.title_lv ? `<small>${escapeHtml(s.title_lv)}</small>` : ''}</span>
          <span class="adm-cat3-n">${n} ${declTopics(n)}</span>
        </button>
        <span class="adm-cat3-acts">${catAct('subject', s.id, 'edit', 'Изменить раздел', '✎')}${catAct('subject', s.id, 'delete', 'Удалить раздел', '✕')}</span>
      </div>`;
    }).join('') + (orphans.length ? `<div class="adm-cat3-row${catState.subject === 'none' ? ' is-selected' : ''}">
        <button type="button" class="adm-cat3-pick" data-cat-subject="none" aria-pressed="${catState.subject === 'none'}">
          <span class="adm-cat3-name"><b>Без раздела</b><small>эти темы не видны в меню сайта</small></span>
          <span class="adm-cat3-n">${orphans.length} ${declTopics(orphans.length)}</span>
        </button>
      </div>` : '');
    byId('cat3-subjects').innerHTML = subjectRows || '<p class="adm-cat3-empty">Разделов пока нет — добавьте первый ниже.</p>';
    byId('cat3-subjects-count').textContent = subjects.length || '';

    // Темы выбранного раздела, с фильтром по классу.
    const gradeSelect = byId('cat3-grade');
    if (gradeSelect && gradeSelect.options.length <= 1) {
      gradeSelect.innerHTML = '<option value="">Все классы</option>' + PLACE_GRADES.map(({ g, label }) => `<option value="${g}">${label}</option>`).join('');
    }
    if (gradeSelect) gradeSelect.value = catState.grade;
    const grade = parseFormGrade(catState.grade);
    const subjectName = catState.subject === 'none' ? 'Без раздела' : (subjects.find(s => s.id === catState.subject)?.title || '');
    byId('cat3-topics-title').innerHTML = `Темы${subjectName ? ` <span>· ${escapeHtml(subjectName)}</span>` : ''}`;
    const pool = (catState.subject === 'none' ? orphans : topics.filter(t => t.subject_id === catState.subject))
      .filter(t => grade === null || parseFormGrade(t.grade) === grade);
    if (catState.topic && !pool.some(t => t.id === catState.topic)) catState.topic = null;
    let lastGrade;
    const topicRows = sortTopics(pool, codes).map(t => {
      const tg = parseFormGrade(t.grade);
      let head = '';
      if (grade === null && tg !== lastGrade) {
        lastGrade = tg;
        head = `<div class="adm-cat3-group">${escapeHtml(PLACE_GRADES.find(x => x.g === tg)?.label || 'Без класса')}</div>`;
      }
      const n = getTopicTaskCount(t.id, counts);
      const on = catState.topic === t.id;
      const siblings = topicSiblingsOf(t);
      const i = siblings.findIndex(x => x.id === t.id);
      return `${head}<div class="adm-cat3-row${on ? ' is-selected' : ''}">
        <button type="button" class="adm-cat3-pick" data-cat-topic="${t.id}" aria-pressed="${on}" title="${escapeHtml(t.title)}">
          <span class="adm-cat3-code">${escapeHtml(codes.get(t.id) || '—')}</span>
          <span class="adm-cat3-name">${escapeHtml(cleanTopicTitle(t.title))}</span>
          <span class="adm-cat3-n${n ? '' : ' zero'}">${n} зад.</span>
        </button>
        <span class="adm-cat3-acts">${catAct('topic', t.id, 'up', 'Выше в классе', '↑', i <= 0)}${catAct('topic', t.id, 'down', 'Ниже в классе', '↓', i < 0 || i >= siblings.length - 1)}${catAct('topic', t.id, 'edit', 'Изменить тему', '✎')}${catAct('topic', t.id, 'delete', 'Удалить тему', '✕')}</span>
      </div>`;
    }).join('');
    byId('cat3-topics').innerHTML = topicRows
      || `<p class="adm-cat3-empty">${catState.subject ? `В этом разделе нет тем${grade !== null ? ' для выбранного класса' : ''}.` : 'Выберите раздел.'}</p>`;
    const topicInput = byId('cat3-add-topic')?.querySelector('input');
    if (topicInput) topicInput.placeholder = grade !== null ? `Новая тема · ${grade}. klase` : 'Новая тема — сначала выберите класс';

    // Подтемы выбранной темы.
    const topic = topics.find(t => t.id === catState.topic);
    byId('cat3-subtopics-title').innerHTML = `Подтемы${topic ? ` <span>· ${escapeHtml(codes.get(topic.id) || cleanTopicTitle(topic.title))}</span>` : ''}`;
    const byPosition = topic ? subtopicSiblingsOf(topic.id) : [];
    const subRows = [...byPosition]
      .sort((a, b) => (a.code ? 0 : 1) - (b.code ? 0 : 1) || naturalCompare(a.code || '', b.code || '') || positionOf(a) - positionOf(b))
      .map(s => {
        const n = getSubtopicTaskCount(s.id, counts);
        const i = byPosition.findIndex(x => x.id === s.id);
        return `<div class="adm-cat3-row static">
          <span class="adm-cat3-pick" title="${escapeHtml(s.title_lv || '')}">
            <span class="adm-cat3-code">${escapeHtml(s.code || '—')}</span>
            <span class="adm-cat3-name">${escapeHtml(s.title)}</span>
            <span class="adm-cat3-n${n ? '' : ' zero'}">${n} зад.</span>
          </span>
          <span class="adm-cat3-acts">${catAct('subtopic', s.id, 'up', 'Выше в теме', '↑', i <= 0)}${catAct('subtopic', s.id, 'down', 'Ниже в теме', '↓', i >= byPosition.length - 1)}${catAct('subtopic', s.id, 'edit', 'Изменить подтему', '✎')}${catAct('subtopic', s.id, 'delete', 'Удалить подтему', '✕')}</span>
        </div>`;
      }).join('');
    byId('cat3-subtopics').innerHTML = !topic
      ? '<p class="adm-cat3-empty">Выберите тему — здесь появятся её подтемы.</p>'
      : (subRows || '<p class="adm-cat3-empty">В этой теме пока нет подтем.</p>');
    const subForm = byId('cat3-add-subtopic');
    subForm?.querySelectorAll('input, button').forEach(el => { el.disabled = !topic; });
  }

  byId('adm-cat3')?.addEventListener('click', async event => {
    const subjectBtn = event.target.closest('[data-cat-subject]');
    if (subjectBtn) {
      const value = subjectBtn.dataset.catSubject;
      catState.subject = value === 'none' ? 'none' : Number(value);
      catState.topic = null;
      renderCat3();
      return;
    }
    const topicBtn = event.target.closest('[data-cat-topic]');
    if (topicBtn) {
      catState.topic = Number(topicBtn.dataset.catTopic);
      // «Перенумеровать подтемы» в шапке работает с выбранной темой.
      if (subtopicFilterTopic) {
        fillSubtopicFilterTopicSelect();
        subtopicFilterTopic.value = String(catState.topic);
      }
      renderCat3();
      return;
    }
    const act = event.target.closest('[data-cat-act]');
    if (!act) return;
    const { kind, id } = act.dataset;
    const what = act.dataset.catAct;
    if (what === 'up' || what === 'down') {
      if (kind === 'topic') await moveTopic(id, what);
      else await moveSubtopic(id, what);
    } else if (what === 'edit') {
      const table = { subject: 'subjects', topic: 'topics', subtopic: 'subtopics' }[kind];
      const full = await fetchFullRow(table, id);
      if (!full) { setCatStatus('Не удалось загрузить для правки.', 'bad'); return; }
      ({ subject: setSubjectMode, topic: setTopicMode, subtopic: setSubtopicMode })[kind](full);
    } else if (what === 'delete') {
      const deleted = await ({ subject: deleteSubjectById, topic: deleteTopicById, subtopic: deleteSubtopicById })[kind](id);
      if (deleted && kind === 'topic' && String(catState.topic) === String(id)) catState.topic = null;
      renderCat3();
    }
  });
  byId('cat3-grade')?.addEventListener('change', event => {
    catState.grade = event.target.value;
    catState.topic = null;
    renderCat3();
  });

  // Добавление полем внизу колонки — через прежние формы, со всей их логикой.
  byId('cat3-add-subject')?.addEventListener('submit', event => {
    event.preventDefault();
    const input = event.target.querySelector('input');
    const title = input.value.trim();
    if (!title) return;
    setSubjectMode(null);
    subjectForm.elements.title.value = title;
    subjectForm.elements.position.value = Math.max(0, ...subjects.map(s => Number(s.position) || 0)) + 1;
    input.value = '';
    subjectForm.requestSubmit();
  });
  byId('cat3-add-topic')?.addEventListener('submit', event => {
    event.preventDefault();
    const input = event.target.querySelector('input');
    const title = input.value.trim();
    if (!title) return;
    const grade = parseFormGrade(catState.grade);
    if (grade === null) { setCatStatus('Выберите класс над списком тем — новая тема встанет в него.', 'warn'); return; }
    if (!catState.subject || catState.subject === 'none') { setCatStatus('Выберите раздел — тема без раздела не видна в меню сайта.', 'warn'); return; }
    setTopicMode(null);
    topicForm.elements.title.value = title;
    topicForm.elements.subject_id.value = String(catState.subject);
    topicForm.elements.grade.value = toAdminGradeVal(grade);
    topicForm.elements.position.value = nextTopicPosition(grade, catState.subject, null);
    input.value = '';
    topicForm.requestSubmit();
  });
  byId('cat3-add-subtopic')?.addEventListener('submit', event => {
    event.preventDefault();
    const input = event.target.querySelector('input');
    const title = input.value.trim();
    const topic = topics.find(t => t.id === catState.topic);
    if (!title || !topic) return;
    setSubtopicMode(null);
    if (subtopicFormGrade) subtopicFormGrade.value = toAdminGradeVal(topic.grade);
    fillSubtopicFormTopicSelect();
    subtopicTopicSelect.value = String(topic.id);
    updateSubtopicFormDefaults();
    subtopicForm.elements.title.value = title;
    input.value = '';
    subtopicForm.requestSubmit();
  });

  // Сообщения прежних форм («Тема добавлена», ошибки) — в строку под колонками.
  [subjectSuccess, topicSuccess, subtopicSuccess].forEach(el => {
    if (!el) return;
    new MutationObserver(() => {
      const text = el.textContent.trim();
      if (text) setCatStatus(text, /^(Ошибка|Не удалось)/.test(text) ? 'bad' : 'ok');
    }).observe(el, { childList: true, characterData: true, subtree: true });
  });

  /* Высота шапки — для всего, что прилипает под ней (строка «Место»,
     карточка превью). Шапка растёт, когда кнопки переносятся. */
  const topBar = shell?.querySelector('.adm-top');
  if (topBar && 'ResizeObserver' in window) {
    new ResizeObserver(() => shell.style.setProperty('--adm-top-h', `${topBar.offsetHeight}px`)).observe(topBar);
  }

  if (shell) showView(location.hash.slice(1) || 'home', { push: false });

  initAdminApp();
})();
