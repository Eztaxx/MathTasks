/* ── Модуль трехъязычной локализации MathTasks (LV / RU / EN) ────────
   Поддержка стандартов Skola2030 (Latviešu), русского и английского языков.
   Работает как в браузере, так и в Node.js / Vitest тестах. */
(() => {
  const STORAGE_KEY = 'math-tasks:lang';
  const DEFAULT_LANG = 'ru';
  const SUPPORTED_LANGS = ['lv', 'ru', 'en'];

  const TRANSLATIONS = {
    lv: {
      // Navigācija & Galvene
      brand_title: 'MathTasks',
      brand_subtitle: 'Skola2030 matemātika',
      nav_home: 'Sākums',
      nav_favorites: 'Mani favorīti',
      nav_about: 'Par vietni',
      search_placeholder: 'Meklēt uzdevumus pēc tēmas vai atslēgvārda...',
      auth_login: 'Ienākt',
      auth_logout: 'Iziet',
      auth_account: 'Profils',
      menu_toggle: 'Izvēlne',

      // Hero sadaļa
      hero_title: 'Matemātikas uzdevumu krātuve',
      hero_subtitle: 'Izvēlieties tēmu, risiniet uzdevumus un sagatavojieties valsts pārbaudes darbiem!',
      badge_solutions_title: 'Skaidri atrisinājumi',
      badge_solutions_sub: 'Soli pa solim',
      badge_levels_title: 'Visi līmeņi',
      badge_levels_sub: 'No pamata līdz padziļinātam',
      badge_skola_title: 'Skola2030 standarts',
      badge_skola_sub: 'Valsts eksāmenu sagatavošana',

      // Klases & Filtri
      section_grades: 'Klases un kursi',
      all_grades: 'Visas klases',
      all_grades_short: 'Visi',
      popular_topics: 'Populāras tēmas',
      new_tasks: 'Jauni uzdevumi',
      view_all: 'Skatīt visus →',

      // Sānjoslas eksāmenu treki
      track_heading: 'Valsts eksāmenu kursi',
      track_9: '9. klases eksāmens',
      track_9_desc: 'Pamatskolas noslēguma darbs',
      track_visp: 'Vispārīgais līmenis',
      track_visp_desc: 'Vidusskolas pamatkurss (10. kl.)',
      track_opt: 'Matemātika I (Optimālais)',
      track_opt_desc: 'Vidusskolas kurss (10.–11. kl.)',
      track_augst: 'Matemātika II (Augstākais)',
      track_augst_desc: 'Padziļinātais kurss (12. kl.)',
      track_diag: 'Diagnostikas darbi',
      track_diag_desc: '3. un 6. klase',
      tools_heading: 'Rīki un uzziņa',
      tool_random: 'Nejaušs uzdevums',
      tool_random_desc: 'Ātrai prāta iesildīšanai',
      tool_formulas: 'Formulu lapas',
      tool_formulas_desc: 'Oficiālie eksāmenu bukleti un KaTeX',
      tool_plotter: 'Grafiku zīmētājs',
      tool_plotter_desc: 'Interaktīvs 2D funkciju kalkulators',
      all_tracks_back: '← Visi eksāmeni un kursi',
      all_courses_title: 'Mācību kursi un eksāmeni',
      all_courses_sub: 'Izvēlieties savu klasi vai sagatavošanās kursu',

      // Klases nosaukumi
      grade_1: '1. klase',
      grade_2: '2. klase',
      grade_3: '3. klase',
      grade_4: '4. klase',
      grade_5: '5. klase',
      grade_6: '6. klase',
      grade_7: '7. klase',
      grade_8: '8. klase',
      grade_9: '9. klase',
      grade_10: '10. klase',
      grade_11: '11. klase',
      grade_12: '12. klase',
      grade_visparigais: 'Vispārīgais līmenis',
      grade_matematika_1: 'Matemātika I (Optimālais)',
      grade_matematika_2: 'Matemātika II (Augstākais)',
      without_grade: 'Bez klases',

      // Sarežģītības pakāpes
      diff_easy: 'Pamatlīmenis',
      diff_medium: 'Vidējs',
      diff_hard: 'Padziļināts',
      diff_olympiad: 'Olimpiāžu',

      // Uzdevumu darbības & Pārlūkošana
      print: 'Drukāt',
      print_with_solutions: 'Ar atrisinājumiem',
      print_no_solutions: 'Bez atrisinājumiem',
      view_mode: 'Skats:',
      view_mode_list: 'Saraksts',
      view_mode_single: 'Pa vienam',
      prev_task: '← Iepriekšējais',
      next_task: 'Nākamais →',
      task_counter: 'Uzdevums {cur} no {total}',
      keyboard_shortcuts_hint: 'Izmantojiet taustiņus ← un → navigācijai',
      copy_link: 'Kopēt saiti',
      copy_text: 'Kopēt tekstu',
      favorite: 'Favorīts',
      favorite_active: 'Favorītos',
      tasks_in_topic: '{count} uzdevumi',
      progress: 'Progress',
      topic_progress: 'Atrisināti: {solved} no {total} ({percent}%)',
      topic_mastered: '🎉 Tēma apgūta!',
      topic_progress_short: '{solved}/{total}',
      filter_unsolved: 'Tikai neatrisinātie',
      filter_unsolved_title: 'Rādīt tikai vēl neatrisinātos uzdevumus',
      all_tasks_solved: '🎉 Visi uzdevumi šajā tēmā ir atrisināti! Lielisks darbs!',

      // Taimeris
      timer_title: 'Eksāmena taimeris',
      timer_stopwatch: '⏱️ Hronometrs',
      timer_40m: '40 min (Stunda)',
      timer_90m: '90 min (Ieskaite)',
      timer_120m: '120 min (9. klase)',
      timer_180m: '180 min (Vidusskola)',
      timer_start: 'Sākt',
      timer_pause: 'Pauze',
      timer_reset: 'Atiestatīt',
      timer_finished: '⏰ Laiks ir beidzies! Eksāmena treniņš pabeigts.',

      // Pašpārbaude
      self_check_placeholder: 'Ievadiet savu atbildi...',
      self_check_btn: 'Pārbaudīt',
      self_check_success: '🎉 Lieliski! Pareiza atbilde!',
      self_check_error: '🤔 Pagaidām nesakrīt. Pārbaudiet aprēķinus vai atveriet atrisinājumu.',
      self_check_reset: 'Risināt vēlreiz',
      solved_badge: '✓ Atrisināts',
      quick_math_label: 'Ievade:',

      // Atbildes un atrisinājumi
      reveal_answer: 'Rādīt atbildi',
      hide_answer: 'Slēpt atbildi',
      reveal_solution: 'Rādīt atrisinājumu',
      hide_solution: 'Slēpt atrisinājumu',
      solution_missing: 'Atrisinājums šim uzdevumam vēl tiek sagatavots.',

      // Paziņojumi (Toasts)
      toast_link_copied: 'Saite nokopēta starpliktuvē!',
      toast_text_copied: 'Uzdevuma teksts nokopēts!',
      toast_fav_added: 'Uzdevums pievienots favorītiem!',
      toast_fav_removed: 'Uzdevums izņemts no favorītiem.',

      // Formulu logs
      formulas_title: '📐 Eksāmenu formulu lapas un uzziņa',
      formulas_subtitle: 'Valsts pārbaudes darbu formulu lapas un interaktīvā uzziņa',
      tab_sheets: '📄 Oficiālās eksāmenu lapas',
      tab_quick: '⚡ Ātrā rokasgrāmata',
      open_pdf: 'Atvērt PDF',
      download_pdf: 'Lejupielādēt',
      cat_algebra: 'Algebra',
      cat_geometry: 'Ģeometrija',
      cat_trig: 'Trigonometrija',
      cat_analysis: 'Analīze un varbūtība',

      // Grafiku zīmētājs
      plotter_title: '📈 Funkciju grafiku zīmētājs',
      plotter_subtitle: 'Interaktīva funkciju izpēte: ievadiet formulu vai izvēlieties gatavu piemēru.',
      plotter_draw: 'Zīmēt',
      plotter_presets: 'Piemēri:',
      plotter_roots_title: 'Krustpunkti ar X asi (saknes):',
      plotter_roots_none: 'Reālu sakņu redzamajā apgabalā nav.',

      // Favorītu lapa
      favorites_title: 'Mani favorīti',
      favorites_empty: 'Jums vēl nav saglabātu uzdevumu. Noklikšķiniet uz zvaigznītes pie jebkura uzdevuma, lai to pievienotu!',

      // Par vietni
      about_title: 'Par vietni',
      about_body: '<p><strong>MathTasks</strong> ir matemātikas uzdevumu un atrisinājumu krātuve skolēniem un skolotājiem, kas izstrādāta saskaņā ar Latvijas valsts izglītības standartu <strong>Skola2030</strong>.</p><h2>Kā izmantot vietni</h2><p>Kreisajā izvēlnē izvēlieties savu klasi vai eksāmena sagatavošanās kursu (9. klase, Vispārīgais, Optimālais vai Augstākais līmenis). Katrā tēmā uzdevumi ir sakārtoti secīgi no vienkāršākā uz sarežģītāku.</p><p>Izmantojiet pašpārbaudes lauku un ātro matemātisko tastatūru, lai uzreiz pārbaudītu iegūtos rezultātus!</p>'
    },

    ru: {
      // Навигация & Шапка
      brand_title: 'MathTasks',
      brand_subtitle: 'Математика Skola2030',
      nav_home: 'Главная',
      nav_favorites: 'Мои закладки',
      nav_about: 'О сайте',
      search_placeholder: 'Поиск задач по теме или ключевому слову...',
      auth_login: 'Войти',
      auth_logout: 'Выйти',
      auth_account: 'Аккаунт',
      menu_toggle: 'Меню',

      // Hero секция
      hero_title: 'Сборник задач по математике',
      hero_subtitle: 'Выбирайте тему, решайте задачи и прокачивайте свои знания!',
      badge_solutions_title: 'Понятные решения',
      badge_solutions_sub: 'Пошаговый разбор',
      badge_levels_title: 'Все уровни',
      badge_levels_sub: 'От базы до профиля',
      badge_skola_title: 'Стандарт Skola2030',
      badge_skola_sub: 'Подготовка к экзаменам',

      // Классы & Фильтры
      section_grades: 'Классы и ступени',
      all_grades: 'Все классы',
      all_grades_short: 'Все',
      popular_topics: 'Популярные темы',
      new_tasks: 'Новые задачи',
      view_all: 'Смотреть все →',

      // Сайдбар: треки
      track_heading: 'Государственные экзамены',
      track_9: 'Экзамен 9 класс',
      track_9_desc: 'Основная школа • Valsts pārbaudes darbs',
      track_visp: 'Vispārīgais līmenis',
      track_visp_desc: 'Средняя школа • Общий уровень (10 кл.)',
      track_opt: 'Matemātika I (Optimālais)',
      track_opt_desc: 'Средняя школа • 10–11 классы',
      track_augst: 'Matemātika II (Augstākais)',
      track_augst_desc: 'Углубленный курс • 12 класс',
      track_diag: 'Диагностирующие работы',
      track_diag_desc: '3 и 6 классы',
      tools_heading: 'Инструменты и справочник',
      tool_random: 'Случайная задача',
      tool_random_desc: 'Быстрая тренировка',
      tool_formulas: 'Справочник формул',
      tool_formulas_desc: 'Официальные листы к экзаменам и KaTeX',
      tool_plotter: 'Графопостроитель',
      tool_plotter_desc: 'Интерактивный 2D Canvas',
      all_tracks_back: '← Все экзамены и треки',
      all_courses_title: 'Учебные курсы и экзамены',
      all_courses_sub: 'Выберите ваш класс или программу подготовки',

      // Классы
      grade_1: '1 класс',
      grade_2: '2 класс',
      grade_3: '3 класс',
      grade_4: '4 класс',
      grade_5: '5 класс',
      grade_6: '6 класс',
      grade_7: '7 класс',
      grade_8: '8 класс',
      grade_9: '9 класс',
      grade_10: '10 класс',
      grade_11: '11 класс',
      grade_12: '12 класс',
      grade_visparigais: 'Vispārīgais līmenis',
      grade_matematika_1: 'Matemātika I (Optimālais)',
      grade_matematika_2: 'Matemātika II (Augstākais)',
      without_grade: 'Без класса',

      // Сложности
      diff_easy: 'Базовый',
      diff_medium: 'Средний',
      diff_hard: 'Сложный',
      diff_olympiad: 'Олимпиадный',

      // Карточки задач
      print: 'Печать',
      print_with_solutions: 'С решениями',
      print_no_solutions: 'Без решений',
      view_mode: 'Вид:',
      view_mode_list: 'Списком',
      view_mode_single: 'По одной',
      prev_task: '← Предыдущая',
      next_task: 'Следующая →',
      task_counter: 'Задача {cur} из {total}',
      keyboard_shortcuts_hint: 'Стрелки ← и → для навигации между задачами',
      copy_link: 'Копировать ссылку',
      copy_text: 'Копировать текст',
      favorite: 'В закладки',
      favorite_active: 'В закладках',
      tasks_in_topic: '{count} задач',
      progress: 'Прогресс',
      topic_progress: 'Решено: {solved} из {total} ({percent}%)',
      topic_mastered: '🎉 Тема освоена!',
      topic_progress_short: '{solved}/{total}',
      filter_unsolved: 'Только нерешённые',
      filter_unsolved_title: 'Показывать только задачи, которые ещё не решены',
      all_tasks_solved: '🎉 Все задачи в этой теме уже решены! Отличная работа!',

      // Таймер
      timer_title: 'Экзаменационный таймер',
      timer_stopwatch: '⏱️ Секундомер',
      timer_40m: '40 мин (Урок)',
      timer_90m: '90 мин (Работа)',
      timer_120m: '120 мин (9 класс)',
      timer_180m: '180 мин (12 класс)',
      timer_start: 'Старт',
      timer_pause: 'Пауза',
      timer_reset: 'Сброс',
      timer_finished: '⏰ Время вышло! Экзаменационная тренировка завершена.',

      // Самопроверка
      self_check_placeholder: 'Введите ваш ответ...',
      self_check_btn: 'Проверить',
      self_check_success: '🎉 Отлично! Ответ верный!',
      self_check_error: '🤔 Пока не сошлось. Проверьте вычисления или нажмите «Показать ответ / решение».',
      self_check_reset: 'Решить заново',
      solved_badge: '✓ Решено',
      quick_math_label: 'Вставка:',

      // Ответы
      reveal_answer: 'Показать ответ',
      hide_answer: 'Скрыть ответ',
      reveal_solution: 'Показать решение',
      hide_solution: 'Скрыть решение',
      solution_missing: 'Решение пока не добавлено.',

      // Тосты
      toast_link_copied: 'Ссылка скопирована в буфер обмена!',
      toast_text_copied: 'Условие скопировано в буфер обмена!',
      toast_fav_added: 'Задача добавлена в закладки!',
      toast_fav_removed: 'Задача удалена из закладок.',

      // Справочник формул
      formulas_title: '📐 Справочник формул и официальные листы',
      formulas_subtitle: 'Официальные листы экзаменов Skola2030 и интерактивная шпаргалка',
      tab_sheets: '📄 Официальные листы к экзаменам',
      tab_quick: '⚡ Быстрый справочник',
      open_pdf: 'Открыть PDF',
      download_pdf: 'Скачать',
      cat_algebra: 'Алгебра',
      cat_geometry: 'Геометрия',
      cat_trig: 'Тригонометрия',
      cat_analysis: 'Анализ и вероятность',

      // Графопостроитель
      plotter_title: '📈 Графопостроитель функций',
      plotter_subtitle: 'Интерактивное исследование функций: введите формулу или выберите готовую.',
      plotter_draw: 'Построить',
      plotter_presets: 'Примеры:',
      plotter_roots_title: 'Точки пересечения с осью X (нули):',
      plotter_roots_none: 'Действительных нулей функции в текущей области не найдено.',

      // Закладки
      favorites_title: 'Мои закладки',
      favorites_empty: 'У вас пока нет сохраненных задач. Нажмите на значок закладки у любой задачи, чтобы добавить её сюда!',

      // О сайте
      about_title: 'О сайте',
      about_body: '<p><strong>MathTasks</strong> — сборник задач по школьной математике с разбором решений, структурированный в соответствии со стандартами <strong>Skola2030</strong>.</p><h2>Как пользоваться</h2><p>Выберите свой класс в меню слева — сайт покажет только те разделы и темы, которые проходят в этой параллели. Внутри темы задачи идут от простого к сложному.</p><p>Используйте интерактивный блок самопроверки и виртуальную клавиатуру формул для тренировки решения задач!</p>'
    },

    en: {
      // Navigation & Header
      brand_title: 'MathTasks',
      brand_subtitle: 'Skola2030 Mathematics',
      nav_home: 'Home',
      nav_favorites: 'Bookmarks',
      nav_about: 'About',
      search_placeholder: 'Search tasks by topic or keyword...',
      auth_login: 'Sign In',
      auth_logout: 'Sign Out',
      auth_account: 'Account',
      menu_toggle: 'Menu',

      // Hero Section
      hero_title: 'Mathematics Problem Bank',
      hero_subtitle: 'Select a topic, solve problems, and master your math skills for state exams!',
      badge_solutions_title: 'Clear Solutions',
      badge_solutions_sub: 'Step-by-step guidance',
      badge_levels_title: 'All Levels',
      badge_levels_sub: 'From basic to advanced',
      badge_skola_title: 'Skola2030 Standards',
      badge_skola_sub: 'Exam preparation',

      // Grades & Filters
      section_grades: 'Grades & Courses',
      all_grades: 'All Grades',
      all_grades_short: 'All',
      popular_topics: 'Popular Topics',
      new_tasks: 'Recent Tasks',
      view_all: 'View all →',

      // Sidebar tracks
      track_heading: 'State Examination Tracks',
      track_9: 'Grade 9 Exam',
      track_9_desc: 'Basic school final exam',
      track_visp: 'General Level',
      track_visp_desc: 'High school general course (Grade 10)',
      track_opt: 'Mathematics I (Optimal)',
      track_opt_desc: 'High school optimal track (Grades 10–11)',
      track_augst: 'Mathematics II (Higher)',
      track_augst_desc: 'Advanced level course (Grade 12)',
      track_diag: 'Diagnostic Tests',
      track_diag_desc: 'Grades 3 and 6',
      tools_heading: 'Tools & Reference',
      tool_random: 'Random Problem',
      tool_random_desc: 'Quick practice session',
      tool_formulas: 'Formula Sheets',
      tool_formulas_desc: 'Official exam sheets & KaTeX quick sheet',
      tool_plotter: 'Function Plotter',
      tool_plotter_desc: 'Interactive 2D Canvas calculator',
      all_tracks_back: '← All exams and tracks',
      all_courses_title: 'Study Courses and Exams',
      all_courses_sub: 'Select your grade or exam preparation track',

      // Grades
      grade_1: 'Grade 1',
      grade_2: 'Grade 2',
      grade_3: 'Grade 3',
      grade_4: 'Grade 4',
      grade_5: 'Grade 5',
      grade_6: 'Grade 6',
      grade_7: 'Grade 7',
      grade_8: 'Grade 8',
      grade_9: 'Grade 9',
      grade_10: 'Grade 10',
      grade_11: 'Grade 11',
      grade_12: 'Grade 12',
      grade_visparigais: 'General Level',
      grade_matematika_1: 'Mathematics I (Optimal)',
      grade_matematika_2: 'Mathematics II (Higher)',
      without_grade: 'No grade',

      // Difficulties
      diff_easy: 'Basic',
      diff_medium: 'Intermediate',
      diff_hard: 'Advanced',
      diff_olympiad: 'Olympiad',

      // Task actions
      print: 'Print',
      print_with_solutions: 'With solutions',
      print_no_solutions: 'Without solutions',
      view_mode: 'View:',
      view_mode_list: 'List',
      view_mode_single: 'Single task',
      prev_task: '← Previous',
      next_task: 'Next →',
      task_counter: 'Task {cur} of {total}',
      keyboard_shortcuts_hint: 'Use ← and → keys to navigate tasks',
      copy_link: 'Copy link',
      copy_text: 'Copy text',
      favorite: 'Bookmark',
      favorite_active: 'Bookmarked',
      tasks_in_topic: '{count} tasks',
      progress: 'Progress',
      topic_progress: 'Solved: {solved} of {total} ({percent}%)',
      topic_mastered: '🎉 Topic mastered!',
      topic_progress_short: '{solved}/{total}',
      filter_unsolved: 'Unsolved only',
      filter_unsolved_title: 'Show only tasks that are not solved yet',
      all_tasks_solved: '🎉 All tasks in this topic are solved! Great job!',

      // Timer
      timer_title: 'Exam Timer',
      timer_stopwatch: '⏱️ Stopwatch',
      timer_40m: '40 min (Lesson)',
      timer_90m: '90 min (Test)',
      timer_120m: '120 min (Grade 9)',
      timer_180m: '180 min (High School)',
      timer_start: 'Start',
      timer_pause: 'Pause',
      timer_reset: 'Reset',
      timer_finished: '⏰ Time is up! Exam practice completed.',

      // Self-check
      self_check_placeholder: 'Enter your answer...',
      self_check_btn: 'Check',
      self_check_success: '🎉 Great! Correct answer!',
      self_check_error: '🤔 Not quite right yet. Check your calculations or reveal the solution.',
      self_check_reset: 'Solve again',
      solved_badge: '✓ Solved',
      quick_math_label: 'Insert:',

      // Solutions
      reveal_answer: 'Show answer',
      hide_answer: 'Hide answer',
      reveal_solution: 'Show solution',
      hide_solution: 'Hide solution',
      solution_missing: 'Solution for this problem is being prepared.',

      // Toasts
      toast_link_copied: 'Link copied to clipboard!',
      toast_text_copied: 'Problem text copied to clipboard!',
      toast_fav_added: 'Task added to bookmarks!',
      toast_fav_removed: 'Task removed from bookmarks.',

      // Formulas
      formulas_title: '📐 Formula Sheets & Reference',
      formulas_subtitle: 'Official Skola2030 exam formula sheets and interactive quick reference',
      tab_sheets: '📄 Official Exam Sheets',
      tab_quick: '⚡ Quick Reference',
      open_pdf: 'Open PDF',
      download_pdf: 'Download',
      cat_algebra: 'Algebra',
      cat_geometry: 'Geometry',
      cat_trig: 'Trigonometry',
      cat_analysis: 'Analysis & Probability',

      // Plotter
      plotter_title: '📈 Function Graph Plotter',
      plotter_subtitle: 'Interactive function analysis: type an expression or pick a preset.',
      plotter_draw: 'Plot',
      plotter_presets: 'Presets:',
      plotter_roots_title: 'X-axis intercepts (roots):',
      plotter_roots_none: 'No real roots found in the current viewport.',

      // Bookmarks
      favorites_title: 'My Bookmarks',
      favorites_empty: 'You have no saved tasks yet. Click the bookmark icon on any task to add it here!',

      // About
      about_title: 'About',
      about_body: '<p><strong>MathTasks</strong> is a comprehensive mathematics problem collection aligned with the Latvian <strong>Skola2030</strong> education standard.</p><h2>How to use</h2><p>Select your grade or examination course in the left sidebar to view topics and tasks designed for your level.</p><p>Practice with interactive self-checking and the quick math keyboard on any device!</p>'
    }
  };

  let currentLang = DEFAULT_LANG;

  // Инициализация языка из LocalStorage или браузера
  function initLang() {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && SUPPORTED_LANGS.includes(saved)) {
          currentLang = saved;
          return;
        }
      } catch {}
    }
    if (typeof navigator !== 'undefined' && navigator.language) {
      const code = navigator.language.slice(0, 2).toLowerCase();
      if (SUPPORTED_LANGS.includes(code)) {
        currentLang = code;
        return;
      }
    }
    currentLang = DEFAULT_LANG;
  }

  initLang();

  function getLang() {
    return currentLang;
  }

  function setLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return;
    currentLang = lang;
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      updateSwitcherUI();
      applyTranslations(document);
      window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
    }
  }

  function t(key, params = {}) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS[DEFAULT_LANG];
    let text = dict[key] || TRANSLATIONS[DEFAULT_LANG][key] || key;
    if (params && typeof params === 'object') {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  }

  function updateSwitcherUI() {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const active = btn.dataset.lang === currentLang;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  function applyTranslations(root = document) {
    if (!root) return;

    // Текстовое содержимое
    root.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const translated = t(key);
      if (translated) el.textContent = translated;
    });

    // HTML-содержимое (для форматированных блоков)
    root.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.dataset.i18nHtml;
      const translated = t(key);
      if (translated) el.innerHTML = translated;
    });

    // Placeholder
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      const translated = t(key);
      if (translated) el.placeholder = translated;
    });

    // Title / Tooltip
    root.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.dataset.i18nTitle;
      const translated = t(key);
      if (translated) el.title = translated;
    });

    // Aria-label
    root.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.dataset.i18nAria;
      const translated = t(key);
      if (translated) el.setAttribute('aria-label', translated);
    });
  }

  const i18nApi = {
    getLang,
    setLang,
    t,
    applyTranslations,
    updateSwitcherUI,
    SUPPORTED_LANGS,
    TRANSLATIONS
  };

  if (typeof window !== 'undefined') {
    window.MathTasksI18n = i18nApi;
    window.MathTasks = window.MathTasks || {};
    window.MathTasks.t = t;
    window.MathTasks.getLang = getLang;
    window.MathTasks.setLang = setLang;
    window.MathTasks.applyTranslations = applyTranslations;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = i18nApi;
  }
})();
