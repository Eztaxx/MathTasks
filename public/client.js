// Общий слой: клиент Supabase, утилиты и тема — используется и на главной, и в админке.
window.MathTasks = window.MathTasks || {};
(() => {
  const config = window.SUPABASE_CONFIG;
  window.MathTasks.db = config?.url && config?.publishableKey && window.supabase
    ? window.supabase.createClient(config.url, config.publishableKey)
    : null;

  window.MathTasks.escapeHtml = (value = '') => {
    const el = document.createElement('div');
    el.textContent = value;
    return el.innerHTML;
  };

  // Справочник ступеней обучения по стандартам Skola2030 (1–9 классы и средняя школа: Vispārīgais, Matemātika I, Matemātika II)
  window.MathTasks.GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'visparigais', 'matematika-1', 'matematika-2'];
  const resolveGradeName = (grade, t) => {
    const specific = t(`grade_${grade}`);
    if (specific && specific !== `grade_${grade}`) return specific;
    const nForm = t('grade_N', { n: grade });
    if (nForm && nForm !== 'grade_N') return nForm;
    return `${grade} класс`;
  };

  window.MathTasks.gradeLabel = grade => {
    const t = window.MathTasks.t || (k => k);
    if (!grade) return t('without_grade') !== 'without_grade' ? t('without_grade') : 'Без класса';
    if (grade === 'visparigais' || grade === 'vispārīgais') return t('grade_visparigais') !== 'grade_visparigais' ? t('grade_visparigais') : 'Vispārīgais līmenis';
    if (grade === 'matematika-1') return t('grade_matematika_1') !== 'grade_matematika_1' ? t('grade_matematika_1') : 'Matemātika I (Optimālais)';
    if (grade === 'matematika-2') return t('grade_matematika_2') !== 'grade_matematika_2' ? t('grade_matematika_2') : 'Matemātika II (Augstākais)';
    return resolveGradeName(grade, t);
  };

  window.MathTasks.fillGradeSelect = (select, emptyLabel, options = {}) => {
    if (!select) return;
    const previousVal = select.value;
    const t = window.MathTasks.t || (k => k);
    const emptyText = emptyLabel || (t('all_grades') !== 'all_grades' ? t('all_grades') : 'Все классы и курсы');
    const stagePamatskola = t('stage_pamatskola') !== 'stage_pamatskola' ? t('stage_pamatskola') : 'Pamatskola (1.–9. klase)';
    const stageVidusskola = t('stage_vidusskola') !== 'stage_vidusskola' ? t('stage_vidusskola') : 'Vidusskola (10.–12. klase / Līmeņi)';
    const examSuffix = t('stage_exam_badge') !== 'stage_exam_badge' ? ` (${t('stage_exam_badge')})` : ' (Eksāmens)';

    const optVisp = t('grade_visparigais') !== 'grade_visparigais' ? t('grade_visparigais') : 'Vispārīgais līmenis';
    const optOpt = t('grade_matematika_1') !== 'grade_matematika_1' ? t('grade_matematika_1') : 'Optimālais līmenis (Matemātika I)';
    const optAugst = t('grade_matematika_2') !== 'grade_matematika_2' ? t('grade_matematika_2') : 'Augstākais līmenis (Matemātika II)';

    const pamatHtml = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(grade => {
      const name = resolveGradeName(grade, t);
      const is9 = grade === 9;
      return `<option value="${grade}">${name}${is9 ? examSuffix : ''}</option>`;
    }).join('');

    const useNumeric = Boolean(options && (options.numeric || options.useNumeric || select.dataset.numeric === 'true'));
    const valVisp = useNumeric ? '10' : 'visparigais';
    const valOpt = useNumeric ? '11' : 'matematika-1';
    const valAugst = useNumeric ? '12' : 'matematika-2';

    const vidusHtml = `<option value="${valVisp}">${optVisp}</option>` +
      `<option value="${valOpt}">${optOpt}</option>` +
      `<option value="${valAugst}">${optAugst}</option>`;

    select.innerHTML = `<option value="">${emptyText}</option>` +
      `<optgroup label="${stagePamatskola}">${pamatHtml}</optgroup>` +
      `<optgroup label="${stageVidusskola}">${vidusHtml}</optgroup>`;

    if (previousVal) {
      if (select.querySelector(`option[value="${previousVal}"]`)) {
        select.value = previousVal;
      } else if (useNumeric) {
        if (previousVal === 'visparigais') select.value = '10';
        else if (previousVal === 'matematika-1') select.value = '11';
        else if (previousVal === 'matematika-2') select.value = '12';
      } else {
        if (previousVal === '10') select.value = 'visparigais';
        else if (previousVal === '11') select.value = 'matematika-1';
        else if (previousVal === '12') select.value = 'matematika-2';
      }
    }
  };

  // Чистые функции живут в lib.js — их же покрывают тесты.
  const lib = window.MathTasksLib;
  window.MathTasks.makeSlug = lib.makeSlug;
  window.MathTasks.normalizeMathAnswer = lib.normalizeMathAnswer;
  window.MathTasks.compareAnswers = lib.compareAnswers;

  window.MathTasks.insertIntoInput = (input, text) => {
    if (!input) return;
    input.focus();
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const val = input.value;

    let inserted = text;
    let newCursor = start + inserted.length;

    if (text === '²') {
      if (start === 0 || /[\+\-\*\/\(\s,;]$/.test(val.slice(0, start))) {
        inserted = 'x²';
        newCursor = start + 2;
      } else {
        inserted = '²';
        newCursor = start + 1;
      }
    } else if (text === '√(' || text === '√') {
      inserted = '√()';
      newCursor = start + 2;
    } else if (text === '(') {
      inserted = '()';
      newCursor = start + 1;
    } else if (text === '|') {
      inserted = '||';
      newCursor = start + 1;
    } else if (/^(sin|cos|tan|tg|ctg|ln|lg|sqrt)\($/.test(text)) {
      inserted = text + ')';
      newCursor = start + text.length;
    }

    input.value = val.slice(0, start) + inserted + val.slice(end);
    input.setSelectionRange(newCursor, newCursor);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  window.MathTasks.renderMath = (element, text = '') => {
    element.textContent = text; // textContent — и экранирование, и запасной вид без KaTeX
    if (typeof window.renderMathInElement !== 'function') return;
    try {
      window.renderMathInElement(element, { delimiters: lib.KATEX_DELIMITERS, throwOnError: false, errorColor: '#dc3151' });
    } catch {
      element.textContent = text;
    }
  };

  /* Чертежи лежат в публичном бакете, а в базе — только путь.
     Ссылку собираем здесь, чтобы бакет упоминался ровно в одном месте. */
  window.MathTasks.IMAGE_BUCKET = 'task-images';
  window.MathTasks.imageUrl = path => {
    if (!path) return null;
    if (path.startsWith('/') || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    const db = window.MathTasks.db;
    if (!db) return null;
    return db.storage.from(window.MathTasks.IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  };

  // Кто вошёл и админ ли он — один запрос для обеих страниц.
  window.MathTasks.loadViewer = async () => {
    const db = window.MathTasks.db;
    if (!db) return { user: null, isAdmin: false };
    const { data: { user } } = await db.auth.getUser();
    if (!user) return { user: null, isAdmin: false };
    try {
      const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
      return { user, isAdmin: profile?.role === 'admin' };
    } catch {
      return { user, isAdmin: false };
    }
  };

  /* Тёмная тема временно выключена: переключатель убран из шапки, а код и стили
     body.dark оставлены. Чтобы вернуть — поставьте true и верните в разметку кнопку
     <button class="theme-toggle" type="button" aria-label="Переключить тему">
       <span data-theme-icon>☼</span> <span data-theme-label>Светлая тема</span></button> */
  const THEME_ENABLED = false;

  // Тема запоминается и работает одинаково на всех страницах.
  const applyTheme = theme => {
    document.body.classList.toggle('dark', theme === 'dark');
    document.querySelectorAll('.theme-toggle').forEach(button => {
      button.querySelector('[data-theme-icon]').textContent = theme === 'dark' ? '☾' : '☼';
      button.querySelector('[data-theme-label]').textContent = theme === 'dark' ? 'Тёмная тема' : 'Светлая тема';
    });
  };
  let theme = 'light';
  // Сохранённый выбор читаем только когда тема включена: иначе у тех, кто уже
  // переключился на тёмную, она осталась бы навсегда — кнопки-то больше нет.
  if (THEME_ENABLED) {
    try { theme = localStorage.getItem('math-tasks:theme') || 'light'; } catch {}
  }
  applyTheme(theme);
  document.querySelectorAll('.theme-toggle').forEach(button => button.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('math-tasks:theme', theme); } catch {}
    applyTheme(theme);
  }));
})();
