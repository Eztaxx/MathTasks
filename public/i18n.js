/* ── Модуль трехъязычной локализации MathTasks (LV / RU / EN) ────────
   Поддержка стандартов Skola2030 (Latviešu), русского и английского языков.
   Работает как в браузере, так и в Node.js / Vitest тестах. */
(() => {
  const STORAGE_KEY = 'math-tasks:lang';
  const DEFAULT_LANG = 'ru';
  const SUPPORTED_LANGS = ['lv', 'ru'];

  const TRANSLATIONS = {
    lv: {
      // Navigācija & Galvene
      brand_title: 'MathTasks',
      brand_subtitle: 'Skola2030 matemātika',
      nav_home: 'Sākums',
      nav_to_home: 'Uz sākumu',
      state_loading_tasks: 'Ielādējam uzdevumus…',
      state_loading_task: 'Ielādējam uzdevumu…',
      state_loading_favorites: 'Ielādējam favorītus…',
      state_searching: 'Meklējam…',
      err_load_tasks: 'Neizdevās ielādēt uzdevumus.',
      err_load_favorites: 'Neizdevās ielādēt uzdevumus no favorītiem.',
      err_search: 'Neizdevās veikt meklēšanu.',
      fav_add: '☆ Pievienot favorītiem',
      fav_added: '★ Favorītos',
      fav_counter: '{count} saglabāti',
      fav_empty_short: 'Pagaidām tukšs',
      fav_empty_hint: 'Jums vēl nav saglabātu uzdevumu. Nospiediet «☆ Pievienot favorītiem» pie jebkura uzdevuma.',
      anchors_label: 'Uz uzdevumu:',
      nav_prev_task: '← Iepriekšējais',
      nav_next_task: 'Nākamais →',
      copied: 'Nokopēts!',
      search_found: 'Atrasts {where} — {counts}',
      search_scope_grade: '{grade}. klasē',
      search_scope_all: 'visās klasēs',
      subject_no_topics: '{grade}. klasē šī sadaļā tēmu nav.',
      course_no_topics: 'Citu šī kursa tēmu nav.',
      course_no_topics_yet: 'Šajā kursā tēmu vēl nav.',
      account_plain: 'Konts',
      account_signin: 'Ieiet',
      plot_formula_error: 'Kļūda formulā: izmantojiet x, ciparus, +, -, *, /, ^, sin, cos, sqrt',
      plot_roots: 'Krustpunkti ar X asi (nulles): ',
      plot_no_roots: 'Reālu funkcijas nuļļu pašreizējā apgabalā nav.',
      open_admin_panel: 'Administratora panelis',
      subject_fallback: 'Matemātika',
      nav_favorites: 'Mani favorīti',
      nav_about: 'Par vietni',
      search_placeholder: 'Meklēt uzdevumus pēc tēmas vai atslēgvārda...',
      auth_login: 'Ienākt',
      auth_logout: 'Iziet',
      auth_account: 'Profils',
      menu_toggle: 'Izvēlne',
      theme_toggle: 'Pārslēgt motīvu',
      sound_toggle: 'Ieslēgt / izslēgt skaņu',
      sound_label: 'Skaņa',
      theme_light: 'Gaišais motīvs',
      theme_dark: 'Tumšais motīvs',
      theme_switch_light: 'Pārslēgt uz gaišo motīvu',
      theme_switch_dark: 'Pārslēgt uz tumšo motīvu',

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
      topics_heading: 'Tēmas',
      new_tasks: 'Jauni uzdevumi',
      view_all: 'Skatīt visus →',

      // Izglītības posmi
      stage_pamatskola: 'Pamatskola (1.–9. klase)',
      stage_pamatskola_short: 'Pamatskola',
      stage_pamatskola_desc: '1.–9. klase un valsts eksāmens',
      stage_vidusskola: 'Vidusskola un tehnikums (līmeņi)',
      stage_vidusskola_short: 'Vidusskola',
      stage_vidusskola_desc: 'Vispārīgais, Optimālais un Augstākais līmenis',
      stage_all: 'Visi kursi un posmi',
      stage_pamat_heading: '🎓 Pamatskolas kurss (1.–9. klase)',
      stage_vidus_heading: '🏛️ Vidusskolas un tehnikuma kursi (līmeņi)',
      stage_exam_badge: 'Eksāmens',
      showing_grade_only: 'Tiek rādītas tēmas: {grade}',
      show_all_grades_btn: 'Rādīt visas klases',
      topics_per_grade_subtitle: 'Tēmas sadalītas pa klasēm un kursiem',

      // Sānjoslas eksāmenu treki
      track_heading: 'Valsts eksāmenu kursi',
      track_heading_pamat: 'Pamatskola',
      track_heading_vidus: 'Vidusskola (Līmeņi)',
      track_9: 'Pamatskolas eksāmens',
      track_9_desc: 'Pamatskolas noslēguma darbs',
      track_visp: 'Vispārīgais līmenis',
      track_visp_desc: 'Pamatkurss vidusskolā un tehnikumā',
      track_opt: 'Matemātika I (Optimālais)',
      track_opt_desc: 'Standarta kurss (Matemātika I)',
      track_augst: 'Matemātika II (Augstākais)',
      track_augst_desc: 'Padziļinātais kurss eksāmenam',
      track_diag: 'Diagnostikas darbi',
      track_diag_desc: '3. un 6. klase',
      track_diag_short: 'Diagnostika',
      track_heading_prep: 'Treniņi un eksāmeni',
      nav_trainer: 'Ātrā rēķināšana',
      nav_trainer_desc: 'Galvasrēķini un daļas',
      nav_exams: 'Gatavošanās eksāmeniem',
      nav_exams_desc: 'Gatavošanās programma',
      nav_mock_exams: 'Paraugeksāmeni',
      nav_mock_exams_desc: 'Struktūra un formulas',
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
      grade_label: 'Klase',
      grade_1: '1. klase',
      grade_2: '2. klase',
      grade_3: '3. klase',
      grade_4: '4. klase',
      grade_5: '5. klase',
      grade_6: '6. klase',
      grade_7: '7. klase',
      grade_8: '8. klase',
      grade_9: '9. klase',
      grade_10: 'Vispārīgais līmenis',
      grade_11: 'Matemātika I (Optimālais)',
      grade_12: 'Matemātika II (Augstākais)',
      grade_N: '{n}. klase',
      grade_visparigais: 'Vispārīgais līmenis',
      grade_short_visp: 'Vispārīgais',
      grade_short_opt: 'Matemātika I',
      grade_short_augst: 'Matemātika II',
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
      view_mode_compact: 'Trenažieris',
      drill_figure_btn: 'Rādīt zīmējumu',
      drill_placeholder: 'Atbilde',
      drill_not_match: 'Nesakrīt — pārbaudiet atbildi. Nospiediet Enter vēlreiz, lai redzētu pareizo.',
      drill_wrong_answer: 'Nepareizi. Pareizā atbilde:',
      view_mode_single: 'Pa vienam',
      drill_hint_btn: 'Rādīt atrisinājumu',
      drill_solved_all: 'Visi piemēri veiksmīgi atrisināti! Lielisks darbs! 🎉',
      drill_next_hint: 'Enter — pārbaudīt un pāriet pie nākamā',
      prev_task: '← Iepriekšējais',
      next_task: 'Nākamais →',
      task_counter: 'Uzdevums {cur} no {total}',
      keyboard_shortcuts_hint: 'Izmantojiet taustiņus ← un → navigācijai',
      copy_link: 'Kopēt saiti',
      copy_text: 'Kopēt tekstu',
      favorite: 'Favorīts',
      favorite_active: 'Favorītos',
      favorite_remove: 'Noņemt no favorītiem',
      tasks_in_topic: '{count} uzdevumi',
      progress: 'Progress',
      topic_progress: 'Atrisināti: {solved} no {total} ({percent}%)',
      topic_mastered: '🎉 Tēma apgūta!',
      topic_progress_short: '{solved}/{total}',
      filter_unsolved: 'Tikai neatrisinātie',
      filter_unsolved_title: 'Rādīt tikai vēl neatrisinātos uzdevumus',
      all_tasks_solved: '🎉 Visi uzdevumi šajā tēmā ir atrisināti! Lielisks darbs!',
      sort_label: 'Kārtošana:',
      sort_default: 'Pēc secības (1→N)',
      sort_num_desc: 'Apgrieztā secībā (N→1)',
      sort_subtopic: 'Pēc apakštēmām',
      sort_diff_asc: 'Vispirms vienkāršākie',
      sort_diff_desc: 'Vispirms sarežģītākie',
      sort_unsolved: 'Vispirms neatrisinātie',
      sort_solved: 'Vispirms atrisinātie',
      sort_shuffle: 'Sajaukt nejauši 🎲',
      sort_reshuffle: 'Sajaukt vēlreiz 🔀',
      admin_renumber: 'Pārnumurēt (1..N)',
      admin_renumber_tooltip: 'Pārnumurēt šīs tēmas uzdevumus pēc kārtas (1..N)',
      admin_renumber_confirm: 'Vai pārnumurēt visus {count} šīs tēmas uzdevumus pēc kārtas (1..N) bez izlaidumiem?',
      admin_renumber_already_perfect: 'Visiem uzdevumiem šajā tēmā jau ir pareiza numerācija (1..N).',
      admin_renumber_success: '✓ Uzdevumi veiksmīgi pārnumurēti!',

      // Taimeris
      timer_title: 'Eksāmena taimeris',
      timer_stopwatch: '⏱️ Hronometrs',
      timer_40m: '40 min (Stunda)',
      timer_90m: '90 min (Ieskaite)',
      timer_120m: '120 min (Pamatskola)',
      timer_180m: '180 min (Vidusskola)',
      timer_start: 'Sākt',
      timer_pause: 'Pauze',
      timer_reset: 'Atiestatīt',
      timer_finished: '⏰ Laiks ir beidzies! Eksāmena treniņš pabeigts.',

      // Pārbaudes darbi (Kontroldarbi)
      nav_control_works: 'Pārbaudes darbi',
      cw_too_few: 'Šajā tēmā vēl nav pietiekami daudz uzdevumu pārbaudes darbam — vajag vismaz {count}.',
      nav_control_works_desc: 'Temata noslēguma darbi (40 min)',
      cw_badge: '📝 Pārbaudes darbs • Skola2030',
      cw_topic_card_title: 'Temata pārbaudes darbs',
      cw_topic_card_desc: 'Pārbaudiet savas zināšanas skolas stundas apstākļos bez priekšā teikšanas. Ieteicamais laiks: 40 minūtes.',
      cw_feature_time: '40 minūšu taimeris',
      cw_feature_tasks: '5 uzdevumi ar dažādu sarežģītību',
      cw_feature_eval: 'Automātiska pārbaude un 10 baļļu vērtējums',
      cw_badge_short: 'Pārbaudes darbs',
      cw_ready_pill: '80%+ Gatavs!',
      cw_ready_hint: 'Jūs esat atrisinājuši vismaz 80% uzdevumu! Ir laiks izpildīt pārbaudes darbu.',
      btn_start_cw: 'Sākt pārbaudes darbu (40 min)',
      btn_start_cw_short: '📝 K/D (40 min)',
      cw_mode_title: 'Pārbaudes darbs: {topic}',
      cw_back_to_topic: '← Atpakaļ pie tēmas',
      cw_submit_btn: 'Iesniegt darbu vērtēšanai',
      cw_time_left: 'Atlikušais laiks:',
      cw_result_heading: 'Pārbaudes darba rezultāti',
      cw_score_line: 'Pareizi: {correct} no {total} ({percent}%)',
      cw_grade_line: 'Vērtējums: {grade} no 10 ballēm • {level}',
      cw_time_spent_line: 'Patērētais laiks: {time}',
      cw_solutions_unlocked: 'Visi atrisinājumi ir atvērti pārskatīšanai zemāk:',
      cw_retry_btn: 'Risināt vēlreiz',
      cw_status_done: '✅ Nodot: {percent}% ({grade} balles)',
      cw_catalog_title: 'Tematiskie pārbaudes darbi',
      cw_catalog_desc: 'Gatavojieties skolas ieskaitēm un kontroldarbiem ar 40 minūšu laika kontroli.',

      // Pašpārbaude
      self_check_placeholder: 'Ievadiet savu atbildi...',
      self_check_btn: 'Pārbaudīt',
      self_check_success: '🎉 Lieliski! Pareiza atbilde!',
      self_check_error: '🤔 Pagaidām nesakrīt. Pārbaudiet aprēķinus vai izmantojiet norādi zemāk.',
      self_check_reset: 'Risināt vēlreiz',
      solved_badge: '✓ Atrisināts',
      quick_math_label: 'Ievade:',

      // Atbildes un atrisinājumi
      reveal_answer: 'Rādīt atbildi',
      hide_answer: 'Slēpt atbildi',
      reveal_hint: 'Rādīt norādi',
      hide_hint: 'Slēpt norādi',
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
      topic_no_tasks: 'Pagaidām tukšs',
      favorites_empty: 'Jums vēl nav saglabātu uzdevumu. Noklikšķiniet uz zvaigznītes pie jebkura uzdevuma, lai to pievienotu!',

      // Tagu lapa
      tag_prefix: 'Birkas:',
      tag_title: 'Uzdevumi ar birku «{tag}»',
      tag_empty: 'Šai birkai pagaidām nav pievienots neviens uzdevums.',
      tag_heading: 'Birka',
      similar_tasks: 'Līdzīgi uzdevumi',
      similar_none: 'Šajā tēmā citu uzdevumu pagaidām nav.',
      tags_label: 'Krustbirkas',
      cw_minutes: "40 min",
      atbilde: "Atbilde",
      your_answer: "Jūsu atbilde",
      atrisinajums: "Atrisinājuma apskats",
      stage_sakumskola: "1.–4. klase (Sākumskola)",
      stage_pamatskola1: "5.–6. klase",
      stage_pamatskola2: "7.–9. klase (Pamatskola)",
      tasks_word: "uzdevumi tēmā",
      tasks_range: "Rāda {from}.–{upto}. no {total}",
      tasks_pages: "Uzdevumu lappuses",
      prev_page: "← Iepriekšējā",
      next_page: "Nākamā →",
      grade_pick: "Izvēlēties klasi",
      grade_all_short: "Visas",
      lang_switcher: "Valodas izvēle",
      lang_lv: "Latviešu valoda",
      lang_ru: "Krievu valoda",
      grade_filter: "Filtrs pēc klases",
      breadcrumbs: "Navigācijas ceļš",
      topic_tasks_nav: "Tēmas uzdevumi",
      subtopics_nav: "Apakštēmas",
      subtopics_label: "Apakštēmas:",
      subtopics_title: "Apakštēmas",
      subtopic_all: "Visas apakštēmas",
      subtopic_all_desc: "Visi šīs tēmas uzdevumi",
      subtopics_grid_label: "Tēmas apakštēmas un prasmes:",
      subtopic_active_state: "✓ Aktīva",
      tasks_unit: "uzd.",
      subtopic_whole_topic: "Visas apakštēmas",
      subtopic_not_found: "Apakštēma nav atrasta",
      subtopic_empty: "Šajā apakštēmā uzdevumu vēl nav.",
      grade_solve_all: "Risināt visus {grade} uzdevumus",
      grade_solve_all_short: "Risināt visus uzdevumus pēc kārtas ({count})",
      grade_solve_all_hint: "{count} uzdevumi {topics} tēmās — pēc kārtas, kā programmā",
      lightbox_label: "Zīmējuma apskate",
      drill_hint_badge: "💡 Skaidrojums",
      label_condition: "Nosacījums:",
      label_answer: "Atbilde:",
      label_solution: "Atrisinājums:",
      account_email: "Konts",
      account_signout: "Iziet no konta",
      formula_input: "Funkcijas formula",
      symbol_pad: "Ātrā matemātisko simbolu ievade",
      graph_canvas: "Funkcijas grafiks",
      zoom_in: "Pietuvināt",
      zoom_out: "Attālināt",
      zoom_reset: "Atiestatīt mērogu",
      sym_var_x: "Mainīgais x",
      sym_square: "Kvadrāts (²)",
      sym_power: "Pakāpe (^)",
      sym_sqrt: "Kvadrātsakne (√)",
      sym_frac: "Daļa / dalīšana",
      sym_sin: "Sinuss",
      sym_cos: "Kosinuss",
      sym_tan: "Tangenss",
      sym_ln: "Naturālais logaritms",
      sym_abs: "Modulis",
      sym_paren: "Iekavas",
      sym_pi: "Skaitlis pī",
      sym_exp: "Eksponente e",
      sym_plus: "Plus",
      sym_minus: "Mīnus",
      sym_times: "Reizināšana",
      back_to_catalog: "Atgriezties pie eksāmeniem un kursiem",
      catalog_of_tasks: "Uzdevumu katalogs",
      course_all_tasks: "Visi kursa uzdevumi",
      figure_zoom_title: "Noklikšķiniet, lai palielinātu zīmējumu",
      figure_alt: "{kind} uzdevumam «{title}» (noklikšķiniet, lai palielinātu)",
      figure_load_error: "Neizdevās ielādēt zīmējumu.",
      open_task: "Atvērt uzdevumu",
      subject_all_topics_arrow: "Visas tēmas →",
      search_all_grades: "Meklēt visās klasēs →",
      all_exams_tracks: "Visi eksāmeni un kursi",
      subject_all_topics: "Visas sadaļas tēmas",
      auth_title: "Administratora pieteikšanās",
      auth_hint: "Pieteicieties ar administratora e-pastu un paroli.",
      auth_password: "Parole",
      auth_submit: "Ieiet",
      dialog_close: "Aizvērt",

      // Par vietni
      about_title: 'Par vietni',
      about_body: '<p><strong>MathTasks</strong> ir matemātikas uzdevumu un atrisinājumu krātuve skolēniem un skolotājiem, kas izstrādāta saskaņā ar Latvijas valsts izglītības standartu <strong>Skola2030</strong>.</p><h2>Kā izmantot vietni</h2><p>Kreisajā izvēlnē izvēlieties savu klasi vai eksāmena sagatavošanās kursu (Pamatskola, Vispārīgais, Optimālais vai Augstākais līmenis). Katrā tēmā uzdevumi ir sakārtoti secīgi no vienkāršākā uz sarežģītāku.</p><p>Izmantojiet pašpārbaudes lauku un ātro matemātisko tastatūru, lai uzreiz pārbaudītu iegūtos rezultātus!</p>',

      // Trenažieris
      trainer_badge: '⚡ Galvasrēķinu trenažieris',
      trainer_title: '⚡ Ātrās galvasrēķināšanas trenažieris',
      trainer_sub: 'Attīstiet matemātisko ātrumu: nejauši piemēri, daļas, reizināšana, dalīšana un tūlītēja pārbaude.',
      tab_sheet: '📋 Visi piemēri vienā lapā (Trenažieris)',
      tab_card: '🗂️ Pa vienai kartītei (Sprints / Marafons)',
      cat_label: 'Aprēķinu kategorija:',
      cat_addsub2: '➕ Divciparu ±',
      cat_addsub3: '➕ Trīsciparu ±',
      cat_multdiv: '✖️ Reizināšana un dalīšana',
      cat_fractions: '🍰 Parastās daļas',
      cat_decimals: '🎯 Decimāldaļas',
      cat_powers: '⚡ Kvadrāti un saknes',
      cat_negatives: '❄️ Negatīvie skaitļi',
      cat_mix: '🎲 Mikss (viss kopā)',
      diff_label: 'Sarežģītības līmenis:',
      diff_normal: '🟢 Pamata',
      diff_hard: '🟡 Padziļināts',
      diff_expert: '🔴 Eksperta',
      mode_label: 'Spēles režīms:',
      mode_zen: '♾️ Marafons (bez steigas)',
      mode_sprint60: '⏱️ Sprints 60 sek',
      mode_sprint120: '⏱️ Sprints 120 sek',
      sheet_count_label: 'Piemēru skaits lapā:',
      btn_sheet_refresh: '🔄 Jauna lapa',
      btn_sheet_check_all: '✓ Pārbaudīt visu',
      sheet_banner_text: '⚡ <strong>Ātrās rēķināšanas trenažieris:</strong> ievadiet atbildes un spiediet <kbd>Enter</kbd>, lai pārietu pie nākamā piemēra',
      sheet_completed_title: 'Lielisks darbs! Lapa pabeigta!',
      sheet_completed_btn: '🚀 Ģenerēt jaunu lapu',
      hud_streak: 'sērija',
      hud_score: 'atrisināts',
      hud_accuracy: 'precizitāte',
      btn_skip: 'Izlaist',

      // Eksāmenu sagatavošanās
      exams_page_title: 'Gatavošanās matemātikas eksāmeniem — Skola2030 | MathTasks',
      exams_badge: '🎯 Gatavošanās eksāmeniem',
      exams_hero_tag: 'Valsts pārbaudījumi • Skola2030',
      exams_hero_h1: 'Gatavošanās matemātikas valsts eksāmeniem',
      exams_hero_p: 'Viss nepieciešamais sekmīgai eksāmenu nokārtošanai Latvijā: oficiālās VISC formulu lapas, uzdevumu struktūra, vērtēšanas kritēriji un uzdevumu atlases pa tēmām.',
      exams_btn_choose_level: 'Izvēlēties savu līmeni',
      exams_btn_to_mocks: 'Pāriet pie paraugeksāmeniem →',
      exams_levels_h2: '4 eksāmenu līmeņi Latvijā',
      exams_levels_p: 'Izvēlieties mācību līmeni, lai iegūtu pilnu sagatavošanās programmu, tēmas un formulu materiālus.',
      exams_pamat_title: 'Pamatskolas valsts eksāmens',
      exams_pamat_desc: 'Obligātais centralizētais eksāmens matemātikā par pamatskolas kursu. Pārbauda pamatprasmes, darbu ar formulām, teksta uzdevumus un ģeometrijas pamatus.',
      exams_pamat_sheet: '📄 Pamatskolas formulu lapa (PDF)',
      exams_pamat_btn: 'Risināt pamatskolas uzdevumus →',
      exams_visp_title: 'Vispārīgais līmenis',
      exams_visp_desc: 'Orientēts uz matemātisko pamatpratību vidējā izglītībā humanitārajiem un radošajiem virzieniem.',
      exams_visp_sheet: '📄 Vispārīgā līmeņa formulu lapa (PDF)',
      exams_visp_btn: 'Risināt Vispārīgā līmeņa uzdevumus →',
      exams_opt_title: 'Optimālais līmenis — Matemātika I',
      exams_opt_desc: 'Galvenais valsts eksāmens lielākajai daļai vidusskolas absolventu. Nepieciešams iestājai augstskolās ekonomikā, biznesā, medicīnā un sociālajās zinātnēs.',
      exams_opt_sheet: '📄 Optimālā līmeņa formulu lapa (PDF)',
      exams_opt_btn: 'Risināt Matemātika I uzdevumus →',
      exams_augst_title: 'Augstākais līmenis — Matemātika II',
      exams_augst_desc: 'Padziļinātais profila eksāmens nākamajiem programmētājiem, inženieriem, fiziķiem un matemātiķiem. Satur augstākās matemātikas un matemātiskās analīzes elementus.',
      exams_augst_sheet: '📄 Augstākā līmeņa formulu lapa (PDF)',
      exams_augst_btn: 'Risināt Matemātika II uzdevumus →',
      exams_plan_h2: 'Soli pa solim sagatavošanās stratēģija',
      exams_plan_p: 'Pārbaudīti metodiskie ieteikumi efektīvai laika un spēku plānošanai.',
      exams_footer: 'MathTasks — sagatavošanās platforma valsts pārbaudes darbiem matemātikā (Skola2030, Latvija).',

      // Paraugeksāmeni
      mock_page_title: 'Matemātikas paraugeksāmeni — Struktūra un formulas | MathTasks',
      mock_badge: '📋 Paraugeksāmeni',
      mock_hero_tag: 'Eksāmenu paraugi • Skola2030',
      mock_hero_h1: 'Valsts paraugeksāmeni (Paraugi)',
      mock_hero_p: 'Oficiālā VISC eksāmenu variantu struktūra: uzdevumu specifikācija, punktu sadalījums, kalkulatora lietošanas noteikumi un ceļvedis par formulu lapām.',
      mock_btn_formula_guide: '📖 Formulu lapu lietošanas ceļvedis',
      mock_btn_to_variants: 'Skatīt variantu struktūru ↓',
      mock_guide_h2: '📑 Kā pareizi lietot formulu lapu eksāmenā',
      mock_guide_p: 'Īsts valsts eksāmena palīgrīks — ja zināt, kā tā ir veidota un ko tajā meklēt.',
      mock_guide_badge: 'SVARĪGI KATRAM EKSAMENĒTĀJAM',
      mock_guide_banner_p: 'Oficiālā formulu lapa tiek izsniegta drukātā veidā katram skolēnam kopā ar eksāmena bukletu. <strong>To ir atļauts izmantot visa eksāmena laikā</strong> (gan 1., gan 2. daļā).',
      mock_has_h4: 'Kas IR formulu lapā (nemācieties no galvas)',
      mock_has_desc: 'Šīs formulas nav jāmācās no galvas — tikai jāprot tās ātri atrast un ievietot skaitļus:',
      mock_missing_h4: 'Kā NAV formulu lapā (jāatceras obligāti!)',
      mock_missing_desc: 'Šos noteikumus eksāmena veidotāji uzskata par bāzes zināšanām, to lapā <strong>nav</strong>:',
      mock_download_label: 'Lejupielādēt oficiālās VISC lapas treniņam:',
      mock_variants_h2: 'Paraugu struktūra pa līmeņiem',
      mock_variants_p: 'Oficiālais Skola2030 pārbaudes darbu uzbūves modelis.',
      mock_status_pill: 'Struktūras sagatave',
      mock_no_calc: '🚫 Bez kalkulatora',
      mock_has_calc: '📱 Ar kalkulatoru',
      mock_footer: 'MathTasks — uzziņu un treniņu platforma pēc Skola2030 standarta (Latvija).',

      // Pārnumurēšana
      admin_renumber_tasks: '🔢 Pārnumurēt uzdevumus',
      admin_renumber_tasks_tooltip: 'Automātiski sakārtot uzdevumu numurus (1..N) bez izlaidumiem',
      admin_renumber_topics: '🔢 Pārnumurēt tēmas',
      admin_renumber_topics_tooltip: 'Automātiski sakārtot tēmu kārtas numurus (1..N) katrā klasē',
      admin_renumber_subtopics: '🔢 Pārnumurēt apakštēmas',
      admin_renumber_subtopics_tooltip: 'Automātiski sakārtot apakštēmas (1..M) un atjaunināt Skola2030 kodus',
      admin_renumber_confirm: 'Vai tiešām vēlaties pārnumurēt {count} vienumus? Tas atjauninās secību datubāzē.',
      admin_renumber_already_perfect: 'Numurācija jau ir ideālā secībā (1..N), izmaiņas nav nepieciešamas.',
      admin_renumber_success: 'Veiksmīgi pārnumurēti {count} vienumi!',
      topic_renumber_tasks_btn: '🔢 Pārnumurēt (1..N)',
      topic_renumber_tasks_tooltip: 'Pārnumurēt šīs tēmas uzdevumus pēc kārtas (pieejams administratoriem)',
      topic_renumber_confirm: 'Pārnumurēt {count} šīs tēmas uzdevumus (1..{count}) pēc kārtas?',

      // Navigācija & Sānu josla
      nav_trainer_title: 'Rēķināšanas trenažieris',
      nav_exams_title: 'Sagatavošanās eksāmeniem',
      nav_mock_title: 'Izmēģinājuma eksāmeni',
      nav_control_works_title: 'Pārbaudes darbi',
      nav_pamatskola_title: 'Pamatskolas eksāmens',
      nav_grade_3_title: '3. klase',
      nav_grade_6_title: '6. klase',
      nav_formulas_title: 'Formulu lapas',
      nav_plotter_title: 'Funkciju grafiku veidotājs',
      nav_random_task_title: 'Nejaušs uzdevums',
      nav_favorites_title: 'Manas grāmatzīmes',
      nav_tags_title: 'Krustbirkas',
      tags_count_badge: '23 prasmju birkas',
      promo_trainer_title: 'Rēķināšanas trenažieris',
      promo_trainer_sub: 'Galvasrēķini un daļas',
      popular_topics: 'Populārākās tēmas',

      // Trenažieris (trainer.html)
      trainer_view_tabs_label: 'Attēlošanas formāts',
      trainer_view_sheet: '📋 Vairāki piemēri lapā (Trenažieris)',
      trainer_view_card: '🗂️ Pa vienai kartītei (Sprints / Maratons)',
      trainer_btn_new_sheet: '🔄 Jauna lapa',
      trainer_btn_check_all: '✓ Pārbaudīt visu',
      trainer_sheet_completed: 'Visi piemēri atrisināti pareizi!',
      trainer_btn_generate_new_sheet: '🚀 Izveidot jaunu lapu',
      trainer_hud_streak_title: 'Pašreizējā pareizo atbilžu sērija pēc kārtas',
      trainer_caption_time: 'laiks',
      trainer_input_placeholder: 'Atbilde...',
      trainer_btn_check: '↵ Pārbaudīt',
      trainer_skip_tooltip: 'Izlaist piemēru',
      trainer_btn_skip: 'Izlaist →',
      trainer_fraction_hint: 'Padoms: parastajām daļām rakstiet <code>3/4</code>, decimāldaļām — ar punktu vai komatu (<code>2.5</code> vai <code>2,5</code>).',
      trainer_feedback_correct: 'Pareizi!',
      trainer_sprint_done_title: '⏱️ Sprints pabeigts!',
      trainer_sprint_done_subtitle: 'Lielisks galvasrēķinu treniņa rezultāts!',
      trainer_sprint_stat_solved: 'Pareizi atrisināts',
      trainer_sprint_stat_accuracy: 'Precizitāte',
      trainer_sprint_stat_streak: 'Labākā sērija 🔥',
      trainer_sprint_stat_record: 'Personīgais rekords 🏆',
      trainer_btn_restart_sprint: '⚡ Mēģināt vēlreiz',
      trainer_btn_close_sprint: 'Atgriezties pie treniņa',

      // Eksāmeni (exams.html)
      exams_subtitle: 'Viss nepieciešamais sekmīgai eksāmenu nokārtošanai Latvijā: oficiālās VISC formulu lapas, uzdevumu struktūra, vērtēšanas kritēriju analīze un tēmu uzdevumu izlases.',
      exams_pamatskola_desc: 'Obligāts centralizētais eksāmens matemātikā par pamatizglītības kursu. Pārbauda matemātiskās pamatprasmes, darbu ar formulām, teksta uzdevumus un ģeometrijas pamatus.',
      exams_pamatskola_part1: '<strong>1. daļa (bez kalkulatora):</strong> elementārie galvasrēķini, procenti, pakāpes, saknes, vienādojumi.',
      exams_pamatskola_part2: '<strong>2. daļa (ar kalkulatoru):</strong> teksta uzdevumi, ģeometrija (laukumi, perimetri, Pitagora teorēma), funkcijas.',
      exams_pamatskola_duration: '<strong>Ilgums:</strong> 120 minūtes.',
      exams_pamatskola_pdf_link: '📄 Pamatskolas formulu lapa (PDF)',
      exams_visparigais_desc: 'Orientēts uz matemātisko pamatpratību vidusskolā humanitārajiem un radošajiem virzieniem.',
      exams_visparigais_topics: '<strong>Galvenās tēmas:</strong> saliktie procenti, statistika, pakāpju un sakņu īpašības, varbūtību teorijas pamati.',
      exams_visparigais_geom: '<strong>Ģeometrija:</strong> pamata planimetrijas un stereometrijas ķermeņi (prizmas, cilindri).',
      exams_visparigais_applied: '<strong>Pielietojums:</strong> matemātika ikdienas dzīvē, kredīti, budžets, proporcijas.',
      exams_visparigais_pdf_link: '📄 Vispārīgā līmeņa formulu lapa (PDF)',
      exams_optimalais_desc: 'Galvenais valsts eksāmens lielākajai daļai vidusskolas absolventu. Nepieciešams studijām universitātēs ekonomikas, biznesa, medicīnas un sociālo zinātņu jomās.',
      exams_optimalais_part1: '<strong>1. daļa (30 punkti):</strong> uzdevumi bez kalkulatora, pārveidojumi, trigonometriskais riņķis, funkciju grafiki.',
      exams_optimalais_part2: '<strong>2. daļa (40 punkti):</strong> trigonometrija, sinusu/kosinusu teorēmas, stereometrija, logaritmi, kombinatorika.',
      exams_optimalais_calc: '<strong>Kalkulators:</strong> atļauts tikai 2. daļā.',
      exams_optimalais_pdf_link: '📄 Optimālā līmeņa formulu lapa (PDF)',
      exams_augstakais_desc: 'Padziļināts profila eksāmens nākamajiem programmētājiem, inženieriem, fiziķiem un matemātiķiem. Ietver augstākās matemātikas un matemātiskās analīzes elementus.',
      exams_augstakais_analysis: '<strong>Matemātiskā analīze:</strong> atvasinājumi, diferencēšanas noteikumi, integrāļi, rotācijas ķermeņu tilpumi un laukumi.',
      exams_augstakais_algebra: '<strong>Algebra un ģeometrija:</strong> matemātiskā indukcija, Ņūtona binoms, Bezū teorēma, vektori telpā.',
      exams_augstakais_volume: '<strong>Formulu apjoms:</strong> paplašināts 6 lappušu oficiālais VISC formulu buklets.',
      exams_augstakais_pdf_link: '📄 Augstākā līmeņa formulu lapa (PDF)',
      exams_strat_formulas_title: 'Apgūstiet oficiālo formulu lapu',
      exams_strat_formulas_desc: 'Lejupielādējiet sava līmeņa formulu lapu. Skaidri noskaidrojiet, kuras formulas <strong>ir lapā</strong> (tās nav jāmācās, pietiek prast atrast), un kādu <strong>nav</strong> (tās jāatceras no galvas).',
      exams_strat_calc_title: 'Trenējiet galvasrēķinus 1. daļai',
      exams_strat_calc_desc: 'Eksāmena pirmā daļa tiek pildīta <strong>bez kalkulatora</strong>. Aritmētikas kļūdas ar daļām un negatīviem skaitļiem maksā līdz pat 30% no punktiem. Trenējieties katru dienu mūsu <a href="/trainer.html">ātrās rēķināšanas trenažierī</a>.',
      exams_strat_topics_title: 'Aizpildiet robus Skola2030 tēmās',
      exams_strat_topics_desc: 'Apgūstiet tēmas katalogā pēc kārtas. Neizlaidiet lietišķos teksta uzdevumus — mūsdienu VISC eksāmenos uzsvars likts uz reālu dzīves procesu modelēšanu.',
      exams_strat_mocks_title: 'Pildiet izmēģinājuma eksāmenus ar taimeri',
      exams_strat_mocks_desc: 'Izpildiet pilnus variantus 120 minūtēs. Tas attīsta laika izjūtu un mazina eksāmena stresu. Iepazīstieties ar struktūru lapā <a href="/mock-exams.html">izmēģinājuma eksāmeni</a>.',
      exams_visc_sheets_title: 'Oficiālās VISC formulu lapas (Valsts pārbaudes darbi)',
      exams_visc_sheets_desc: 'Visos valsts eksāmenos Latvijā katram skolēnam tiek izsniegts oficiāls formulu buklets. Pārliecinieties, ka pārzināt tā struktūru un protat ātri orientēties planimetrijas, stereometrijas un trigonometrijas sadaļās.',
      exams_sheet_btn_pamatskola: 'Pamatskolas lapa',
      exams_sheet_btn_visparigais: 'Vispārīgā līmeņa lapa',
      exams_sheet_btn_optimalais: 'Optimālā līmeņa lapa (Mat I)',
      exams_sheet_btn_augstakais: 'Augstākā līmeņa lapa (Mat II)',

      // Izmēģinājuma eksāmeni (mock-exams.html)
      mock_has_mult: '<strong>Saīsinātās reizināšanas formulas:</strong> $(a \\pm b)^2 = a^2 \\pm 2ab + b^2$, $a^2 - b^2 = (a-b)(a+b)$.',
      mock_has_powers: '<strong>Pakāpju un sakņu īpašības:</strong> $a^m \\cdot a^n$, $(a^m)^n$, $\\sqrt{a \\cdot b}$, $\\sqrt[n]{a}$.',
      mock_has_quad: '<strong>Kvadrātvienādojums:</strong> diskriminanta formula $D = b^2 - 4ac$ un sakņu formula $x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}$.',
      mock_has_trig: '<strong>Trigonometrija trijstūrī:</strong> $\\sin \\alpha, \\cos \\alpha, \\tan \\alpha$, vērtības 30°, 45°, 60° leņķiem.',
      mock_has_planimetry: '<strong>Planimetrija (Laukumi):</strong> trijstūris ($S = \\frac{1}{2}ah$, Hērona formula), trapece, paralelograms, riņķis ($S = \\pi R^2, C = 2\\pi R$).',
      mock_rule_stereometry: '<strong>Stereometrija (Tilpumi un laukumi):</strong> prizma, cilindrs, piramīda, konuss, lode ($V = \\frac{4}{3}\\pi R^3$).',
      mock_rule_mat1: '<strong>Optimālajam (Mat I):</strong> trigonometriskais riņķis, sinusu un kosinusu teorēmas, kombinatorika ($n!, C_n^k, A_n^k$), trigonometriskās pamatidentitātes.',
      mock_rule_mat2: '<strong>Augstākajam (Mat II):</strong> atvasinājumu un integrāļu tabula, Ņūtona binoms, rotācijas ķermeņu tilpumi.',
      mock_rule_vieta: '<strong>Vjeta teorēma:</strong> $x_1 + x_2 = -\\frac{b}{a}$, $x_1 \\cdot x_2 = \\frac{c}{a}$ (ātrai sakņu aprēķināšanai).',
      mock_rule_ineq_sign: '<strong>Zīmes maiņa nevienādībās:</strong> reizinot vai dalot abas puses ar <em>negatīvu</em> skaitli, nevienādības zīme obligāti mainās uz pretējo!',
      mock_rule_fractions: '<strong>Darbības ar daļām:</strong> vienādošana pie kopsaucēja, saīsināšana, dalīšana reizinot ar apgriezto daļu.',
      mock_rule_logs: '<strong>Logaritmu pamatīpašības:</strong> definīcija $\\log_a b = c \\iff a^c = b$, definīcijas apgabals ($b > 0, a > 0, a \\neq 1$).',
      mock_rule_ext_angle: '<strong>Trijstūra ārējā leņķa teorēma:</strong> trijstūra ārējais leņķis ir vienāds ar abu iekšējo leņķu summu, kas nav tā blakusleņķi.',
      mock_rule_angles_arc: '<strong>Ievilktie un centra leņķi:</strong> ievilktais leņķis ir vienāds ar pusi no centra leņķa, kas balstās uz to pašu loku.',
      mock_rule_prob_opposite: '<strong>Pretējā notikuma varbūtība:</strong> $P(\\bar{A}) = 1 - P(A)$.',
      mock_rule_linear_func: '<strong>Lineāra funkcija:</strong> virziena koeficients $k = \\tan \\alpha$, taisņu paralelitātes nosacījums ($k_1 = k_2$).',
      mock_time_120: '⏱️ 120 minūtes (2 stundas)',
      mock_time_180: '⏱️ 180 minūtes (3 stundas)',
      mock_time_210: '⏱️ 210 minūtes (3.5 stundas)',
      mock_points_50: '⭐ 50 punkti kopā',
      mock_points_70: '⭐ 70 punkti kopā',
      mock_points_80: '⭐ 80 punkti kopā',
      mock_pamatskola_title: 'Pamatskolas valsts eksāmens',
      mock_pamatskola_sub: 'Pārbauda matemātiskās pamatprasmes par visu pamatskolas kursu. Obligāts apliecības iegūšanai.',
      mock_part1_tag: '1. daļa • Pirmā daļa',
      mock_part2_tag: '2. daļa • Otrā daļa',
      mock_pamatskola_p1_format: '<strong>Formāts:</strong> 25 uzdevumi ar īsu atbildi vai izvēles variantiem (1 punkts par uzdevumu).',
      mock_pamatskola_p1_time: '<strong>Laiks:</strong> ~40 minūtes.',
      mock_pamatskola_p1_topics: '<strong>Tēmas:</strong> veselo skaitļu un daļu aritmētika, procenti, darbības ar pakāpēm, vienādojumi un izteiksmju pārveidošana, grafiku nolasīšana, vienkārša varbūtība.',
      mock_pamatskola_p2_format: '<strong>Formāts:</strong> 8–10 izvērsti uzdevumi ar pilnu soļu risinājumu (2–5 punkti par uzdevumu).',
      mock_pamatskola_p2_time: '<strong>Laiks:</strong> ~80 minūtes.',
      mock_pamatskola_p2_topics: '<strong>Tēmas:</strong> teksta uzdevumi (kustība, maisījumi, darbs), vienādojumu sistēmas, planimetrija (līdzība, taisnleņķa trijstūri), daudzskaldņi.',
      mock_mat1_title: 'Optimālais līmenis — Matemātika I',
      mock_mat1_sub: 'Centralizētais vidējās izglītības eksāmens iestājai Latvijas un Eiropas universitātēs.',
      mock_mat1_p1_tag: '1. daļa • 30 punkti',
      mock_mat1_p1_tasks: '<strong>Uzdevumi:</strong> izteiksmju pārveidojumi ar saknēm un logaritmiem, trigonometriskās vērtības riņķī, vektoru ģeometriskās īpašības.',
      mock_mat1_p1_skill: '<strong>Prasme:</strong> matemātiskais stingrums, definīciju un funkciju īpašību izpratne bez tehnikas palīdzības.',
      mock_mat1_p2_tag: '2. daļa • 40 punkti',
      mock_mat1_p2_tasks: '<strong>Uzdevumi:</strong> kompleksie stereometrijas uzdevumi (prizmu un piramīdu šķēlumi), trigonometriskie vienādojumi, reālie modeļi (eksponenciālais pieaugums, saliktie procenti), kombinatorika.',
      mock_mat1_p2_criteria: '<strong>Kritēriji:</strong> tiek vērtēta spriedumu loģika, formulu pamatojums un noapaļošanas precizitāte.',
      mock_mat2_title: 'Augstākais līmenis — Matemātika II (Padziļinātais kurss)',
      mock_mat2_sub: 'Padziļināts profila eksāmens augstākajā matemātikā inženierzinātņu un dabaszinātņu specialitātēm (RTU, LU DF, RSU).',
      mock_mat2_p1_tag: '1. daļa • 25 punkti',
      mock_mat2_p1_topics: '<strong>Tēmas:</strong> virkņu un funkciju robežas, elementāro un salikto funkciju atvasinājumi, vektoru ģeometrija telpā $\\mathbb{R}^3$.',
      mock_mat2_p2_tag: '2. daļa • 55 punkti',
      mock_mat2_p2_topics: '<strong>Tēmas:</strong> integrāļrēķini (noteiktais integrālis, līklīniju trapeču laukumi, rotācijas ķermeņu tilpumi), matemātiskās indukcijas metode, Ņūtona binoms, stereometrijas pierādījumi.',
      mock_scale_title: '📊 Vērtēšanas skala un sekmības sliekšņi (VISC)',
      mock_scale_desc: 'Saskaņā ar Latvijas Republikas Izglītības un zinātnes ministrijas valsts standartu.',
      mock_th_percent: 'Izpildes procents',
      mock_th_level: 'Apguves līmenis',
      mock_th_desc: 'Rezultāta raksturojums',
      mock_lvl_fail: 'Zem sliekšņa (Nenokārtots)',
      mock_lvl_fail_desc: 'Minimālais eksāmena sekmības slieksnis nav sasniegts. Sertifikāts netiek izsniegts.',
      mock_lvl_basic: 'Pamata līmenis',
      mock_lvl_basic_desc: 'Apmierinoša standarta algoritmu un pamata matemātisko likumu pārvaldība.',
      mock_lvl_optimal: 'Optimālais līmenis',
      mock_lvl_optimal_desc: 'Pārliecinoša tipveida un kombinēto uzdevumu risināšana ar pilnu pamatojumu.',
      mock_lvl_high: 'Augstākais līmenis',
      mock_lvl_high_desc: 'Dziļa teorijas izpratne, matemātiskā modelēšana un stingri pierādījumi.'
    },

    ru: {
      // Навигация & Шапка
      brand_title: 'MathTasks',
      brand_subtitle: 'Математика Skola2030',
      nav_home: 'Главная',
      nav_to_home: 'На главную',
      state_loading_tasks: 'Загружаем задачи…',
      state_loading_task: 'Загружаем задачу…',
      state_loading_favorites: 'Загружаем закладки…',
      state_searching: 'Ищем…',
      err_load_tasks: 'Не удалось загрузить задачи.',
      err_load_favorites: 'Не удалось загрузить задачи из закладок.',
      err_search: 'Не удалось выполнить поиск.',
      fav_add: '☆ В закладки',
      fav_added: '★ В закладках',
      fav_counter: '{count} сохранённых',
      fav_empty_short: 'Пока пусто',
      fav_empty_hint: 'У вас пока нет сохранённых задач. Нажмите «☆ В закладки» у любой задачи.',
      anchors_label: 'К задаче:',
      nav_prev_task: '← Предыдущая',
      nav_next_task: 'Следующая →',
      copied: 'Скопировано!',
      search_found: 'Найдено {where} — {counts}',
      search_scope_grade: 'в {grade} классе',
      search_scope_all: 'во всех классах',
      subject_no_topics: 'В {grade} классе тем этого раздела нет.',
      course_no_topics: 'Других тем в этом курсе нет.',
      course_no_topics_yet: 'Тем в этом курсе пока нет.',
      account_plain: 'Аккаунт',
      account_signin: 'Войти',
      plot_formula_error: 'Ошибка в формуле: используйте x, цифры, +, -, *, /, ^, sin, cos, sqrt',
      plot_roots: 'Точки пересечения с осью X (нули): ',
      plot_no_roots: 'Действительных нулей функции в текущей области не найдено.',
      open_admin_panel: 'Админ-панель',
      subject_fallback: 'Математика',
      nav_favorites: 'Мои закладки',
      nav_about: 'О сайте',
      search_placeholder: 'Поиск задач по теме или ключевому слову...',
      auth_login: 'Войти',
      auth_logout: 'Выйти',
      auth_account: 'Аккаунт',
      menu_toggle: 'Меню',
      theme_toggle: 'Переключить тему',
      sound_toggle: 'Включить / выключить звук',
      sound_label: 'Звук',
      theme_light: 'Светлая тема',
      theme_dark: 'Тёмная тема',
      theme_switch_light: 'Включить светлую тему',
      theme_switch_dark: 'Включить тёмную тему',

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
      all_grades: 'Все классы и курсы',
      all_grades_short: 'Все',
      popular_topics: 'Популярные темы',
      topics_heading: 'Темы',
      new_tasks: 'Новые задачи',
      view_all: 'Смотреть все →',

      // Образовательные ступени
      stage_pamatskola: 'Основная школа (1–9 классы)',
      stage_pamatskola_short: 'Основная школа',
      stage_pamatskola_desc: '1–9 классы и итоговый экзамен',
      stage_vidusskola: 'Старшая школа и техникум (уровни)',
      stage_vidusskola_short: 'Старшая школа',
      stage_vidusskola_desc: 'Vispārīgais, Optimālais и Augstākais līmenis',
      stage_all: 'Все ступени и курсы',
      stage_pamat_heading: '🎓 Курс основной школы (1–9 классы)',
      stage_vidus_heading: '🏛️ Курсы старшей школы и техникума (уровни)',
      stage_exam_badge: 'Экзамен',
      showing_grade_only: 'Показаны темы: {grade}',
      show_all_grades_btn: 'Показать все классы',
      topics_per_grade_subtitle: 'Темы распределены по классам и ступеням',

      // Сайдбар: треки
      track_heading: 'Государственные экзамены',
      track_heading_pamat: 'Основная школа',
      track_heading_vidus: 'Старшая школа (Уровни)',
      track_9: 'Экзамен основной школы',
      track_9_desc: 'Итоговая работа основной школы',
      track_visp: 'Vispārīgais līmenis (Общий курс)',
      track_visp_desc: 'Базовый курс: старшая школа и техникум',
      track_opt: 'Optimālais līmenis (Математика I)',
      track_opt_desc: 'Стандартный курс (Математика I)',
      track_augst: 'Augstākais līmenis (Математика II)',
      track_augst_desc: 'Углублённый курс к экзамену',
      track_diag: 'Диагностические работы',
      track_diag_desc: '3 и 6 классы',
      track_diag_short: 'Диагностика',
      track_heading_prep: 'Тренажёры и экзамены',
      nav_trainer: 'Тренажёр счёта',
      nav_trainer_desc: 'Устный счёт и дроби',
      nav_exams: 'Подготовка к экзаменам',
      nav_exams_desc: 'Уровни, формулы, стратегия',
      nav_mock_exams: 'Пробные экзамены',
      nav_mock_exams_desc: 'Структура и формулы',
      tools_heading: 'Инструменты и справка',
      tool_random: 'Случайная задача',
      tool_random_desc: 'Для быстрой разминки',
      tool_formulas: 'Листы формул',
      tool_formulas_desc: 'Официальные буклеты экзаменов и KaTeX',
      tool_plotter: 'Графопостроитель',
      tool_plotter_desc: 'Интерактивный 2D калькулятор графиков',
      all_tracks_back: '← Все экзамены и курсы',
      all_courses_title: 'Учебные курсы и экзамены',
      all_courses_sub: 'Выберите ваш класс или программу подготовки',

      // Классы
      grade_label: 'Класс',
      grade_1: '1 класс',
      grade_2: '2 класс',
      grade_3: '3 класс',
      grade_4: '4 класс',
      grade_5: '5 класс',
      grade_6: '6 класс',
      grade_7: '7 класс',
      grade_8: '8 класс',
      grade_9: '9 класс',
      grade_10: 'Vispārīgais līmenis',
      grade_11: 'Optimālais līmenis',
      grade_12: 'Augstākais līmenis',
      grade_N: '{n} класс',
      grade_visparigais: 'Vispārīgais līmenis',
      grade_short_visp: 'Vispārīgais',
      grade_short_opt: 'Matemātika I',
      grade_short_augst: 'Matemātika II',
      grade_matematika_1: 'Optimālais līmenis',
      grade_matematika_2: 'Augstākais līmenis',
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
      view_mode_compact: 'Тренажёр',
      drill_figure_btn: 'Показать чертёж',
      drill_placeholder: 'Ответ',
      drill_not_match: 'Не сошлось — проверьте ответ. Нажмите Enter ещё раз, чтобы увидеть верный.',
      drill_wrong_answer: 'Неправильно. Верный ответ:',
      view_mode_single: 'По одной',
      drill_hint_btn: 'Показать разбор',
      drill_solved_all: 'Все примеры успешно решены! Отличная работа! 🎉',
      drill_next_hint: 'Enter — проверить и перейти к следующему',
      prev_task: '← Предыдущая',
      next_task: 'Следующая →',
      task_counter: 'Задача {cur} из {total}',
      keyboard_shortcuts_hint: 'Стрелки ← и → для навигации между задачами',
      copy_link: 'Копировать ссылку',
      copy_text: 'Копировать текст',
      favorite: 'В закладки',
      favorite_active: 'В закладках',
      favorite_remove: 'Убрать из закладок',
      tasks_in_topic: '{count} задач',
      progress: 'Прогресс',
      topic_progress: 'Решено: {solved} из {total} ({percent}%)',
      topic_mastered: '🎉 Тема освоена!',
      topic_progress_short: '{solved}/{total}',
      filter_unsolved: 'Только нерешённые',
      filter_unsolved_title: 'Показывать только задачи, которые ещё не решены',
      all_tasks_solved: '🎉 Все задачи в этой теме уже решены! Отличная работа!',
      sort_label: 'Сортировка:',
      sort_default: 'По порядку (1→N)',
      sort_num_desc: 'В обратном порядке (N→1)',
      sort_subtopic: 'По подтемам',
      sort_diff_asc: 'Сначала простые',
      sort_diff_desc: 'Сначала сложные',
      sort_unsolved: 'Сначала нерешённые',
      sort_solved: 'Сначала решённые',
      sort_shuffle: 'Перемешать случайно 🎲',
      sort_reshuffle: 'Перемешать ещё раз 🔀',
      admin_renumber: 'Перенумеровать (1..N)',
      admin_renumber_tooltip: 'Перенумеровать задачи этой темы по порядку (1..N)',
      admin_renumber_confirm: 'Перенумеровать все {count} задач в этой теме строго по порядку (1..N) без пропусков?',
      admin_renumber_already_perfect: 'Все задачи в этой теме уже имеют правильные порядковые номера (1..N).',
      admin_renumber_success: '✓ Задачи успешно перенумерованы!',

      // Таймер
      timer_title: 'Экзаменационный таймер',
      timer_stopwatch: '⏱️ Секундомер',
      timer_40m: '40 мин (Урок)',
      timer_90m: '90 мин (Работа)',
      timer_120m: '120 мин (Основная школа)',
      timer_180m: '180 мин (Средняя школа)',
      timer_start: 'Старт',
      timer_pause: 'Пауза',
      timer_reset: 'Сброс',
      timer_finished: '⏰ Время вышло! Экзаменационная тренировка завершена.',

      // Контрольные работы (К/Р)
      nav_control_works: 'Контрольные работы',
      cw_too_few: 'В этой теме пока мало задач для контрольной — нужно хотя бы {count}.',
      nav_control_works_desc: 'Тематические проверочные работы (40 мин)',
      cw_badge: '📝 Контрольная работа • Skola2030',
      cw_topic_card_title: 'Контрольная работа по теме',
      cw_topic_card_desc: 'Проверьте свои знания в условиях реального школьного урока без подсказок. Рекомендуемое время: 40 минут.',
      cw_feature_time: 'Таймер на 40 минут',
      cw_feature_tasks: '5 заданий разного уровня сложности',
      cw_feature_eval: 'Автопроверка и 10-балльная оценка VISC',
      cw_badge_short: 'Контрольная работа',
      cw_ready_pill: '80%+ Готово!',
      cw_ready_hint: 'Вы решили более 80% задач! Пора написать контрольную работу.',
      btn_start_cw: 'Начать контрольную работу (40 мин)',
      btn_start_cw_short: '📝 К/Р (40 мин)',
      cw_mode_title: 'Контрольная работа: {topic}',
      cw_back_to_topic: '← Назад к теме',
      cw_submit_btn: 'Сдать работу на проверку',
      cw_time_left: 'Осталось времени:',
      cw_result_heading: 'Результаты контрольной работы',
      cw_score_line: 'Верно: {correct} из {total} ({percent}%)',
      cw_grade_line: 'Оценка: {grade} из 10 баллов • {level}',
      cw_time_spent_line: 'Затраченное время: {time}',
      cw_solutions_unlocked: 'Все разборы решений открыты для работы над ошибками ниже:',
      cw_retry_btn: 'Пройти ещё раз',
      cw_status_done: '✅ Сдано: {percent}% ({grade} баллов)',
      cw_catalog_title: 'Тематические контрольные работы',
      cw_catalog_desc: 'Подготовка к школьным проверочным работам с контролем времени (40 минут).',

      // Самопроверка
      self_check_placeholder: 'Введите ваш ответ...',
      self_check_btn: 'Проверить',
      self_check_success: '🎉 Отлично! Ответ верный!',
      self_check_error: '🤔 Пока не сошлось. Проверьте вычисления или воспользуйтесь подсказкой ниже.',
      self_check_reset: 'Решить заново',
      solved_badge: '✓ Решено',
      quick_math_label: 'Вставка:',

      // Ответы
      reveal_answer: 'Показать ответ',
      hide_answer: 'Скрыть ответ',
      reveal_hint: 'Показать подсказку',
      hide_hint: 'Скрыть подсказку',
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
      topic_no_tasks: 'Пока пусто',
      favorites_empty: 'У вас пока нет сохраненных задач. Нажмите на значок закладки у любой задачи, чтобы добавить её сюда!',

      // Страница тегов
      tag_prefix: 'Теги:',
      tag_title: 'Задачи с тегом «{tag}»',
      tag_empty: 'С этим тегом задач пока нет.',
      tag_heading: 'Тег',
      similar_tasks: 'Похожие задачи',
      similar_none: 'Других задач в этой теме пока нет.',
      tags_label: 'Кросс-теги',
      cw_minutes: "40 мин",
      atbilde: "Ответ",
      your_answer: "Ваш ответ",
      atrisinajums: "Разбор решения",
      stage_sakumskola: "1–4 классы (Начальная школа)",
      stage_pamatskola1: "5–6 классы",
      stage_pamatskola2: "7–9 классы (Основная школа)",
      tasks_word: "заданий в теме",
      tasks_range: "Показаны {from}–{upto} из {total}",
      tasks_pages: "Страницы задач",
      prev_page: "← Назад",
      next_page: "Вперёд →",
      grade_pick: "Выбрать класс",
      grade_all_short: "Все",
      lang_switcher: "Выбор языка",
      lang_lv: "Латышский язык",
      lang_ru: "Русский язык",
      grade_filter: "Фильтр по классу",
      breadcrumbs: "Хлебные крошки",
      topic_tasks_nav: "Задачи темы",
      subtopics_nav: "Подтемы",
      subtopics_label: "Подтемы:",
      subtopics_title: "Подтемы",
      subtopic_all: "Все подтемы",
      subtopic_all_desc: "Все задачи этой темы",
      subtopics_grid_label: "Подтемы и навыки темы:",
      subtopic_active_state: "✓ Активна",
      tasks_unit: "зад.",
      subtopic_whole_topic: "Все подтемы",
      subtopic_not_found: "Подтема не найдена",
      subtopic_empty: "В этой подтеме задач пока нет.",
      grade_solve_all: "Решать все задачи — {grade}",
      grade_solve_all_short: "Решать все задачи подряд ({count})",
      grade_solve_all_hint: "{count} задач в {topics} темах, подряд по программе",
      lightbox_label: "Просмотр чертежа",
      drill_hint_badge: "💡 Разбор",
      label_condition: "Условие:",
      label_answer: "Ответ:",
      label_solution: "Решение:",
      account_email: "Аккаунт",
      account_signout: "Выйти из аккаунта",
      formula_input: "Формула функции",
      symbol_pad: "Быстрый ввод математических символов",
      graph_canvas: "График функции",
      zoom_in: "Увеличить",
      zoom_out: "Уменьшить",
      zoom_reset: "Сброс масштаба",
      sym_var_x: "Переменная x",
      sym_square: "Квадрат (²)",
      sym_power: "Степень (^)",
      sym_sqrt: "Квадратный корень (√)",
      sym_frac: "Дробь / Деление",
      sym_sin: "Синус",
      sym_cos: "Косинус",
      sym_tan: "Тангенс",
      sym_ln: "Натуральный логарифм",
      sym_abs: "Модуль",
      sym_paren: "Скобки",
      sym_pi: "Число Пи",
      sym_exp: "Экспонента e",
      sym_plus: "Плюс",
      sym_minus: "Минус",
      sym_times: "Умножение",
      back_to_catalog: "Вернуться к экзаменам и каталогу",
      catalog_of_tasks: "Каталог задач",
      course_all_tasks: "Все задачи курса",
      figure_zoom_title: "Нажмите для увеличения чертежа",
      figure_alt: "{kind} к задаче «{title}» (нажмите для увеличения)",
      figure_load_error: "Не удалось загрузить чертёж.",
      open_task: "Открыть задачу",
      subject_all_topics_arrow: "Все темы →",
      search_all_grades: "Искать во всех классах →",
      all_exams_tracks: "Все экзамены и треки",
      subject_all_topics: "Все темы раздела",
      auth_title: "Вход для администратора",
      auth_hint: "Войдите с email и паролем администратора.",
      auth_password: "Пароль",
      auth_submit: "Войти",
      dialog_close: "Закрыть",

      // О сайте
      about_title: 'О сайте',
      about_body: '<p><strong>MathTasks</strong> — сборник задач по школьной математике с разбором решений, структурированный в соответствии со стандартами <strong>Skola2030</strong>.</p><h2>Как пользоваться</h2><p>Выберите свой класс в меню слева — сайт покажет только те разделы и темы, которые проходят в этой параллели. Внутри темы задачи идут от простого к сложному.</p><p>Используйте интерактивный блок самопроверки и виртуальную клавиатуру формул для тренировки решения задач!</p>',

      // Тренажёр
      trainer_badge: '⚡ Тренажёр устного счёта',
      trainer_title: '⚡ Тренажёр быстрого устного счёта',
      trainer_sub: 'Развивайте математическую скорость: рандомные примеры, дроби, умножение, деление и мгновенный разбор.',
      tab_sheet: '📋 Куча примеров на страницу (Тренажёр)',
      tab_card: '🗂️ По одной карточке (Спринт / Марафон)',
      cat_label: 'Категория вычислений:',
      cat_addsub2: '➕ Двузначные ±',
      cat_addsub3: '➕ Трёхзначные ±',
      cat_multdiv: '✖️ Умножение и деление',
      cat_fractions: '🍰 Обыкновенные дроби',
      cat_decimals: '🎯 Десятичные дроби',
      cat_powers: '⚡ Квадраты и корни',
      cat_negatives: '❄️ Отрицательные числа',
      cat_mix: '🎲 Микс (всё подряд)',
      diff_label: 'Уровень сложности:',
      diff_normal: '🟢 Базовый',
      diff_hard: '🟡 Продвинутый',
      diff_expert: '🔴 Эксперт',
      mode_label: 'Режим игры:',
      mode_zen: '♾️ Марафон (без спешки)',
      mode_sprint60: '⏱️ Спринт 60 сек',
      mode_sprint120: '⏱️ Спринт 120 сек',
      sheet_count_label: 'Примеров на странице:',
      btn_sheet_refresh: '🔄 Новый лист',
      btn_sheet_check_all: '✓ Проверить всё',
      sheet_banner_text: '⚡ <strong>Тренажёр быстрого счёта:</strong> вводите ответы и нажимайте <kbd>Enter</kbd> для перехода к следующему примеру',
      sheet_completed_title: 'Отличная работа! Страница завершена!',
      sheet_completed_btn: '🚀 Сгенерировать новый лист',
      hud_streak: 'серия',
      hud_score: 'решено',
      hud_accuracy: 'точность',
      btn_skip: 'Пропустить',

      // Подготовка к экзаменам
      exams_page_title: 'Подготовка к экзаменам по математике — Skola2030 | MathTasks',
      exams_badge: '🎯 Подготовка к экзаменам',
      exams_hero_tag: 'Valsts pārbaudījumi • Skola2030',
      exams_hero_h1: 'Подготовка к экзаменам по математике',
      exams_hero_p: 'Всё необходимое для успешной сдачи экзаменов в Латвии: официальные формульные листы VISC, структура заданий, разбор критериев оценивания и подборки задач по темам.',
      exams_btn_choose_level: 'Выбрать свой уровень',
      exams_btn_to_mocks: 'Перейти к пробным экзаменам →',
      exams_levels_h2: '4 экзаменационных уровня в Латвии',
      exams_levels_p: 'Выберите уровень обучения для получения полной программы подготовки, тем и формульных материалов.',
      exams_pamat_title: 'Экзамен за курс основной школы',
      exams_pamat_desc: 'Обязательный централизованный экзамен по математике за курс основной школы. Проверяет базовые математические навыки, работу с формулами, текстовые задачи и основы геометрии.',
      exams_pamat_sheet: '📄 Формульный лист основной школы (PDF)',
      exams_pamat_btn: 'Решать задачи основной школы →',
      exams_visp_title: 'Общий уровень (Vispārīgais līmenis)',
      exams_visp_desc: 'Ориентирован на базовую математическую грамотность в средней школе для гуманитарных и творческих направлений.',
      exams_visp_sheet: '📄 Формульный лист Vispārīgais (PDF)',
      exams_visp_btn: 'Решать задачи уровня Vispārīgais →',
      exams_opt_title: 'Оптимальный уровень — Matemātika I',
      exams_opt_desc: 'Главный государственный экзамен для большинства выпускников средней школы. Необходим для поступления в вузы на экономику, бизнес, медицину, социальные науки.',
      exams_opt_sheet: '📄 Формульный лист Optimālais (PDF)',
      exams_opt_btn: 'Решать задачи Matemātika I →',
      exams_augst_title: 'Высший уровень — Matemātika II',
      exams_augst_desc: 'Профильный углублённый экзамен для будущих программистов, инженеров, физиков и математиков. Содержит элементы высшей математики и математического анализа.',
      exams_augst_sheet: '📄 Формульный лист Augstākais (PDF)',
      exams_augst_btn: 'Решать задачи Matemātika II →',
      exams_plan_h2: 'Пошаговая стратегия подготовки к экзамену',
      exams_plan_p: 'Проверенные методические рекомендации для эффективного распределения времени и сил.',
      exams_footer: 'MathTasks — платформа подготовки к математическим экзаменам по стандарту Skola2030 (Латвия).',

      // Пробные экзамены
      mock_page_title: 'Пробные экзамены по математике — Структура и формулы | MathTasks',
      mock_badge: '📋 Пробные экзамены',
      mock_hero_tag: 'Eksāmenu paraugi • Skola2030',
      mock_hero_h1: 'Пробные государственные экзамены (Paraugi)',
      mock_hero_p: 'Официальная структура экзаменационных вариантов VISC: спецификация заданий, распределение баллов, правила работы с калькулятором и руководство по формульным листам.',
      mock_btn_formula_guide: '📖 Руководство по формульным листам',
      mock_btn_to_variants: 'Смотреть структуру вариантов ↓',
      mock_guide_h2: '📑 Как правильно пользоваться формульным листом на экзамене',
      mock_guide_p: 'Настоящий чит-код государственного экзамена — если знать, как он устроен и что в нём искать.',
      mock_guide_badge: 'ВАЖНО ДЛЯ КАЖДОГО ЭКЗАМЕНУЕМОГО',
      mock_guide_banner_p: 'Официальный формульный лист (<em>Formulu lapa</em>) выдаётся в бумажном виде каждому ученику вместе с экзаменационным буклетом. <strong>Пользоваться им разрешено на протяжении всего экзамена</strong> (и в Части 1, и в Части 2).',
      mock_has_h4: 'Что ЕСТЬ в формульном листе (не учите наизусть)',
      mock_has_desc: 'Эти формулы не нужно зубрить — нужно лишь уметь быстро их находить и подставлять числа:',
      mock_missing_h4: 'Чего НЕТ в формульном листе (обязательно помнить!)',
      mock_missing_desc: 'Эти правила составители экзамена считают базовыми, их в листе <strong>нет</strong>:',
      mock_download_label: 'Скачать официальные листы VISC для тренировки:',
      mock_variants_h2: 'Структура пробных вариантов по уровням',
      mock_variants_p: 'Официальная модель построения контрольно-измерительных материалов Skola2030.',
      mock_status_pill: 'Заготовка структуры',
      mock_no_calc: '🚫 Без калькулятора',
      mock_has_calc: '📱 С калькулятором',
      mock_footer: 'MathTasks — справочно-тренировочная платформа по стандарту Skola2030 (Латвия).',

      // Перенумерация
      admin_renumber_tasks: '🔢 Перенумеровать задачи',
      admin_renumber_tasks_tooltip: 'Автоматически выставить последовательные номера 1..N без пропусков',
      admin_renumber_topics: '🔢 Перенумеровать темы',
      admin_renumber_topics_tooltip: 'Автоматически выставить последовательные номера тем (1..N) внутри каждого класса',
      admin_renumber_subtopics: '🔢 Перенумеровать подтемы',
      admin_renumber_subtopics_tooltip: 'Автоматически упорядочить подтемы (1..M) и обновить коды Skola2030',
      admin_renumber_confirm: 'Вы уверены, что хотите перенумеровать {count} элементов? Это обновит позиции в базе данных.',
      admin_renumber_already_perfect: 'Нумерация уже идеальна (1..N), изменений не требуется.',
      admin_renumber_success: 'Успешно перенумеровано {count} элементов!',
      topic_renumber_tasks_btn: '🔢 Перенумеровать (1..N)',
      topic_renumber_tasks_tooltip: 'Перенумеровать задачи этой темы подряд (доступно администратору)',
      topic_renumber_confirm: 'Перенумеровать {count} задач этой темы подряд (1..{count})?',

      // Навигация & Боковое меню
      nav_trainer_title: 'Тренажёр счёта',
      nav_exams_title: 'Подготовка к экзаменам',
      nav_mock_title: 'Пробные экзамены',
      nav_control_works_title: 'Контрольные работы',
      nav_pamatskola_title: 'Экзамен основной школы',
      nav_grade_3_title: '3 класс',
      nav_grade_6_title: '6 класс',
      nav_formulas_title: 'Листы формул',
      nav_plotter_title: 'Графопостроитель',
      nav_random_task_title: 'Случайная задача',
      nav_favorites_title: 'Мои закладки',
      nav_tags_title: 'Кросс-теги',
      tags_count_badge: '23 тега по навыкам',
      promo_trainer_title: 'Тренажёр счёта',
      promo_trainer_sub: 'Устный счёт и дроби',
      popular_topics: 'Популярные темы',

      // Тренажёр (trainer.html)
      trainer_view_tabs_label: 'Формат отображения',
      trainer_view_sheet: '📋 Куча примеров на страницу (Тренажёр)',
      trainer_view_card: '🗂️ По одной карточке (Спринт / Марафон)',
      trainer_btn_new_sheet: '🔄 Новый лист',
      trainer_btn_check_all: '✓ Проверить всё',
      trainer_sheet_completed: 'Все примеры решены верно!',
      trainer_btn_generate_new_sheet: '🚀 Сгенерировать новый лист',
      trainer_hud_streak_title: 'Текущая серия правильных ответов подряд',
      trainer_caption_time: 'время',
      trainer_input_placeholder: 'Ответ...',
      trainer_btn_check: '↵ Проверить',
      trainer_skip_tooltip: 'Пропустить пример',
      trainer_btn_skip: 'Пропустить →',
      trainer_fraction_hint: 'Подсказка: для обыкновенных дробей пишите <code>3/4</code>, для десятичных — через точку или запятую (<code>2.5</code> или <code>2,5</code>).',
      trainer_feedback_correct: 'Правильно!',
      trainer_sprint_done_title: '⏱️ Спринт завершён!',
      trainer_sprint_done_subtitle: 'Отличный результат тренировки устного счёта!',
      trainer_sprint_stat_solved: 'Решено правильно',
      trainer_sprint_stat_accuracy: 'Точность',
      trainer_sprint_stat_streak: 'Лучшая серия 🔥',
      trainer_sprint_stat_record: 'Личный рекорд 🏆',
      trainer_btn_restart_sprint: '⚡ Попробовать снова',
      trainer_btn_close_sprint: 'Вернуться к тренировке',

      // Экзамены (exams.html)
      exams_subtitle: 'Всё необходимое для успешной сдачи экзаменов в Латвии: официальные формульные листы VISC, структура заданий, разбор критериев оценивания и подборки задач по темам.',
      exams_pamatskola_desc: 'Обязательный централизованный экзамен по математике за курс основной школы. Проверяет базовые математические навыки, работу с формулами, текстовые задачи и основы геометрии.',
      exams_pamatskola_part1: '<strong>Часть 1 (без калькулятора):</strong> базовый устный счёт, проценты, степени, корни, уравнения.',
      exams_pamatskola_part2: '<strong>Часть 2 (с калькулятором):</strong> текстовые задачи, геометрия (площади, периметры, теорема Пифагора), функции.',
      exams_pamatskola_duration: '<strong>Длительность:</strong> 120 минут.',
      exams_pamatskola_pdf_link: '📄 Формульный лист основной школы (PDF)',
      exams_visparigais_desc: 'Ориентирован на базовую математическую грамотность в средней школе для гуманитарных и творческих направлений.',
      exams_visparigais_topics: '<strong>Ключевые темы:</strong> сложные проценты, статистика, свойства степеней и корней, основы теории вероятностей.',
      exams_visparigais_geom: '<strong>Геометрия:</strong> базовые планиметрические и стереометрические тела (призмы, цилиндры).',
      exams_visparigais_applied: '<strong>Применение:</strong> математика в повседневной жизни, кредиты, бюджет, пропорции.',
      exams_visparigais_pdf_link: '📄 Формульный лист Vispārīgais (PDF)',
      exams_optimalais_desc: 'Главный государственный экзамен для большинства выпускников средней школы. Необходим для поступления в вузы на экономику, бизнес, медицину, социальные науки.',
      exams_optimalais_part1: '<strong>1. daļa (30 баллов):</strong> задания без калькулятора, преобразования, единичная окружность, графики функций.',
      exams_optimalais_part2: '<strong>2. daļa (40 баллов):</strong> тригонометрия, теоремы синусов/косинусов, стереометрия, логарифмы, комбинаторика.',
      exams_optimalais_calc: '<strong>Калькулятор:</strong> разрешён только во 2-й части.',
      exams_optimalais_pdf_link: '📄 Формульный лист Optimālais (PDF)',
      exams_augstakais_desc: 'Профильный углублённый экзамен для будущих программистов, инженеров, физиков и математиков. Содержит элементы высшей математики и математического анализа.',
      exams_augstakais_analysis: '<strong>Математический анализ:</strong> производные, правила дифференцирования, интегралы, площади и объёмы тел вращения.',
      exams_augstakais_algebra: '<strong>Алгебра и геометрия:</strong> математическая индукция, бином Ньютона, теорема Безу, векторы в пространстве.',
      exams_augstakais_volume: '<strong>Объём формул:</strong> расширенный 6-страничный официальный буклет формул VISC.',
      exams_augstakais_pdf_link: '📄 Формульный лист Augstākais (PDF)',
      exams_strat_formulas_title: 'Изучите официальный формульный лист',
      exams_strat_formulas_desc: 'Скачайте формульный лист своего уровня. Чётко определите, какие формулы <strong>есть в листе</strong> (их учить не надо, достаточно уметь находить), а каких <strong>нет</strong> (их нужно твёрдо помнить наизусть).',
      exams_strat_calc_title: 'Прокачайте устный счёт в Части 1',
      exams_strat_calc_desc: 'Первая часть экзамена пишется <strong>без калькулятора</strong>. Ошибки в арифметике с дробями и отрицательными числами стоят до 30% первичных баллов. Тренируйтесь ежедневно на нашем <a href="/trainer.html">тренажёре быстрого счёта</a>.',
      exams_strat_topics_title: 'Закройте пробелы по темам Skola2030',
      exams_strat_topics_desc: 'Пройдите темы в каталоге по порядку. Не пропускайте текстовые прикладные задачи — в современных экзаменах VISC упор делается на моделирование реальных жизненных процессов.',
      exams_strat_mocks_title: 'Решайте пробные экзамены с таймером',
      exams_strat_mocks_desc: 'Прорешивайте варианты целиком за 120 минут. Это развивает чувство времени и снижает экзаменационный стресс. Ознакомьтесь со структурой вариантов на странице <a href="/mock-exams.html">пробных экзаменов</a>.',
      exams_visc_sheets_title: 'Официальные формульные листы VISC (Valsts pārbaudes darbi)',
      exams_visc_sheets_desc: 'На всех государственных экзаменах в Латвии каждому ученику выдаётся официальный формульный буклет. Убедитесь, что вы знаете его структуру и умеете быстро ориентироваться в разделах планиметрии, стереометрии и тригонометрии.',
      exams_sheet_btn_pamatskola: 'Лист основной школы',
      exams_sheet_btn_visparigais: 'Лист Vispārīgais',
      exams_sheet_btn_optimalais: 'Лист Optimālais (Mat I)',
      exams_sheet_btn_augstakais: 'Лист Augstākais (Mat II)',

      // Пробные экзамены (mock-exams.html)
      mock_has_mult: '<strong>Формулы сокр. умножения:</strong> $(a \\pm b)^2 = a^2 \\pm 2ab + b^2$, $a^2 - b^2 = (a-b)(a+b)$.',
      mock_has_powers: '<strong>Свойства степеней и корней:</strong> $a^m \\cdot a^n$, $(a^m)^n$, $\\sqrt{a \\cdot b}$, $\\sqrt[n]{a}$.',
      mock_has_quad: '<strong>Квадратное уравнение:</strong> формула дискриминанта $D = b^2 - 4ac$ и корней $x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}$.',
      mock_has_trig: '<strong>Тригонометрия в треугольнике:</strong> $\\sin \\alpha, \\cos \\alpha, \\tan \\alpha$, значения для 30°, 45°, 60°.',
      mock_has_planimetry: '<strong>Планиметрия (Площади):</strong> треугольник ($S = \\frac{1}{2}ah$, формула Герона), трапеция, параллелограмм, круг ($S = \\pi R^2, C = 2\\pi R$).',
      mock_rule_stereometry: '<strong>Стереометрия (Объёмы и площади):</strong> призма, цилиндр, пирамида, конус, шар ($V = \\frac{4}{3}\\pi R^3$).',
      mock_rule_mat1: '<strong>Для Optimālais (Mat I):</strong> единичный круг, теоремы синусов и косинусов, комбинаторика ($n!, C_n^k, A_n^k$), тригонометрические тождества.',
      mock_rule_mat2: '<strong>Для Augstākais (Mat II):</strong> таблица производных и первообразных, бином Ньютона, объёмы тел вращения.',
      mock_rule_vieta: '<strong>Теорема Виета:</strong> $x_1 + x_2 = -\\frac{b}{a}$, $x_1 \\cdot x_2 = \\frac{c}{a}$ (для быстрого счёта корней).',
      mock_rule_ineq_sign: '<strong>Смена знака в неравенствах:</strong> при умножении или делении обеих частей на <em>отрицательное</em> число знак строго переворачивается!',
      mock_rule_fractions: '<strong>Правила работы с дробями:</strong> приведение к общему знаменателю, сокращение дробей, деление через умножение на обратную дробь.',
      mock_rule_logs: '<strong>Свойства логарифмов (базовые):</strong> определение $\\log_a b = c \\iff a^c = b$, ограничение ОДЗ ($b > 0, a > 0, a \\neq 1$).',
      mock_rule_ext_angle: '<strong>Теорема о внешнем угле:</strong> внешний угол треугольника равен сумме двух внутренних, не смежных с ним.',
      mock_rule_angles_arc: '<strong>Вписанные и центральные углы:</strong> вписанный угол равен половине центрального, опирающегося на ту же дугу.',
      mock_rule_prob_opposite: '<strong>Вероятность противоположного события:</strong> $P(\\bar{A}) = 1 - P(A)$.',
      mock_rule_linear_func: '<strong>Линейная функция:</strong> угловой коэффициент $k = \\tan \\alpha$, условие параллельности прямых ($k_1 = k_2$).',
      mock_time_120: '⏱️ 120 минут (2 часа)',
      mock_time_180: '⏱️ 180 минут (3 часа)',
      mock_time_210: '⏱️ 210 минут (3.5 часа)',
      mock_points_50: '⭐ 50 баллов суммарно',
      mock_points_70: '⭐ 70 баллов суммарно',
      mock_points_80: '⭐ 80 баллов суммарно',
      mock_pamatskola_title: 'Государственный экзамен основной школы (Pamatskola)',
      mock_pamatskola_sub: 'Проверяет базовые математические навыки за весь курс основной школы. Обязателен для получения аттестата.',
      mock_part1_tag: '1. daļa • Часть 1',
      mock_part2_tag: '2. daļa • Часть 2',
      mock_pamatskola_p1_format: '<strong>Формат:</strong> 25 заданий с кратким ответом или выбором варианта (1 балл за задание).',
      mock_pamatskola_p1_time: '<strong>Время:</strong> ~40 минут.',
      mock_pamatskola_p1_topics: '<strong>Темы:</strong> арифметика целых чисел и дробей, проценты, действия со степенями, преобразование одночленов и многочленов, чтение линейных графиков, простейшая вероятность.',
      mock_pamatskola_p2_format: '<strong>Формат:</strong> 8–10 развёрнутых задач с полным пошаговым решением (2–5 баллов за задачу).',
      mock_pamatskola_p2_time: '<strong>Время:</strong> ~80 минут.',
      mock_pamatskola_p2_topics: '<strong>Темы:</strong> текстовые прикладные задачи (движение, смеси, работа), системы уравнений, планиметрия (подобие, прямоугольные треугольники), многогранники.',
      mock_mat1_title: 'Оптимальный уровень — Matemātika I',
      mock_mat1_sub: 'Централизованный экзамен среднего образования для поступления в латвийские и европейские университеты.',
      mock_mat1_p1_tag: '1. daļa • 30 баллов',
      mock_mat1_p1_tasks: '<strong>Задания:</strong> преобразование выражений с корнями и логарифмами, тригонометрические значения на круге, геометрические свойства векторов.',
      mock_mat1_p1_skill: '<strong>Навык:</strong> математическая строгость, понимание определений и свойств функций без подсказок техники.',
      mock_mat1_p2_tag: '2. daļa • 40 баллов',
      mock_mat1_p2_tasks: '<strong>Задания:</strong> комплексные задачи на стереометрию (сечения призм и пирамид), тригонометрические уравнения, реальные модели (экспоненциальный рост, сложные проценты), комбинаторика.',
      mock_mat1_p2_criteria: '<strong>Критерии:</strong> оценивается логика рассуждений, обоснование формул и точность округления.',
      mock_mat2_title: 'Высший уровень — Matemātika II (Padziļinātais kurss)',
      mock_mat2_sub: 'Углублённый профильный экзамен по высшей математике для технических и естественных специальностей (RTU, LU DF, RSU).',
      mock_mat2_p1_tag: '1. daļa • 25 баллов',
      mock_mat2_p1_topics: '<strong>Темы:</strong> вычисление пределов последовательностей и функций, производные элементарных и сложных функций, геометрия векторов в $\\mathbb{R}^3$.',
      mock_mat2_p2_tag: '2. daļa • 55 баллов',
      mock_mat2_p2_topics: '<strong>Темы:</strong> интегральное исчисление (определённый интеграл, площади криволинейных трапеций, объёмы тел вращения), метод математической индукции, бином Ньютона, стереометрические доказательства.',
      mock_scale_title: '📊 Шкала оценивания и пороги сдачи (VISC)',
      mock_scale_desc: 'Согласно государственному регламенту Министерства образования Латвии.',
      mock_th_percent: 'Процент выполнения',
      mock_th_level: 'Уровень освоения',
      mock_th_desc: 'Характеристика результата',
      mock_lvl_fail: 'Не сдано (Zem sliekšņa)',
      mock_lvl_fail_desc: 'Минимальный порог сдачи не достигнут. Сертификат не выдаётся.',
      mock_lvl_basic: 'Базовый (Pamata līmenis)',
      mock_lvl_basic_desc: 'Удовлетворительное владение стандартными алгоритмами и правилами.',
      mock_lvl_optimal: 'Оптимальный (Optimālais līmenis)',
      mock_lvl_optimal_desc: 'Уверенное решение типовых и комбинированных задач с полным разбором.',
      mock_lvl_high: 'Высокий / Высший (Augstākais līmenis)',
      mock_lvl_high_desc: 'Глубокое понимание теории, математическое моделирование и строгие доказательства.'
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
      document.documentElement.setAttribute('data-lang', lang);
      document.documentElement.classList.remove('i18n-pending');
      updateSwitcherUI();
      applyTranslations(document);
      window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
    }
  }

  function t(key, params = {}, langOverride = null) {
    const activeLang = langOverride && TRANSLATIONS[langOverride] ? langOverride : currentLang;
    const dict = TRANSLATIONS[activeLang] || TRANSLATIONS[DEFAULT_LANG];
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

  function translateElement(el) {
    if (!el || el.nodeType !== 1) return;
    if (el.dataset.i18n) {
      const translated = t(el.dataset.i18n);
      if (translated) el.textContent = translated;
    }
    if (el.dataset.i18nHtml) {
      const translated = t(el.dataset.i18nHtml);
      if (translated) el.innerHTML = translated;
    }
    if (el.dataset.i18nPlaceholder) {
      const translated = t(el.dataset.i18nPlaceholder);
      if (translated) el.placeholder = translated;
    }
    if (el.dataset.i18nTitle) {
      const translated = t(el.dataset.i18nTitle);
      if (translated) el.title = translated;
    }
    if (el.dataset.i18nAria) {
      const translated = t(el.dataset.i18nAria);
      if (translated) el.setAttribute('aria-label', translated);
    }
  }

  function applyTranslations(root = document) {
    if (!root) return;

    if (root.nodeType === 1) {
      translateElement(root);
    }

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

    // Стриминговый перевод в процессе парсинга DOM (предотвращает даже малейшее мигание)
    let streamingObserver = null;
    if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined' && document.readyState === 'loading') {
      streamingObserver = new MutationObserver(mutations => {
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node.nodeType === 1) {
              applyTranslations(node);
            }
          }
        }
      });
      streamingObserver.observe(document.documentElement, { childList: true, subtree: true });
    }

    // Auto-init on DOMContentLoaded for any page including i18n.js
    function autoInitI18n() {
      if (streamingObserver) {
        streamingObserver.disconnect();
        streamingObserver = null;
      }
      applyTranslations(document);
      document.documentElement.classList.remove('i18n-pending');
      updateSwitcherUI();
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.lang-btn');
        if (btn && btn.dataset.lang) {
          e.preventDefault();
          setLang(btn.dataset.lang);
        }
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoInitI18n);
    } else {
      autoInitI18n();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = i18nApi;
  }
})();
