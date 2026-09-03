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
  window.MathTasks.gradeLabel = grade => {
    if (!grade) return 'Без класса';
    if (grade === 'visparigais' || grade === 'vispārīgais') return 'Vispārīgais līmenis';
    if (grade === 'matematika-1' || grade === 10 || grade === 11 || grade === '10' || grade === '11') return 'Matemātika I (Optimālais)';
    if (grade === 'matematika-2' || grade === 12 || grade === '12') return 'Matemātika II (Augstākais)';
    return `${grade} класс`;
  };
  window.MathTasks.fillGradeSelect = (select, emptyLabel) => {
    if (!select) return;
    select.innerHTML = `<option value="">${emptyLabel}</option>` +
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map(grade => `<option value="${grade}">${grade} класс</option>`).join('') +
      `<option value="10">10 класс (Vispārīgais / Mat I)</option>` +
      `<option value="11">11 класс (Matemātika I)</option>` +
      `<option value="12">12 класс (Matemātika II)</option>`;
  };

  // Чистые функции живут в lib.js — их же покрывают тесты.
  const lib = window.MathTasksLib;
  window.MathTasks.makeSlug = lib.makeSlug;

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
