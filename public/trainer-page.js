/* Логика страницы trainer.html.
   Вынесена из встроенного <script>: политика безопасности сайта
   (script-src 'self') запрещает выполнять встроенные скрипты, и
   страница молча переставала работать. */
(() => {
      // Инициализация темы
      const themeToggle = document.querySelector('#theme-toggle');
      if (themeToggle) {
        const isDarkNow = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
        themeToggle.setAttribute('aria-checked', isDarkNow ? 'true' : 'false');
        themeToggle.addEventListener('click', () => {
          const isDark = document.documentElement.classList.toggle('dark');
          document.body.classList.toggle('dark', isDark);
          localStorage.setItem('math-tasks:theme', isDark ? 'dark' : 'light');
          themeToggle.setAttribute('aria-checked', isDark ? 'true' : 'false');
        });
      }

      const escapeHtml = str => String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);

      // Ступень школы: в основной (1–9 кл.) нет тем средней — корни n-й степени,
      // свойства корней, отрицательные и дробные показатели. Выбор запоминается.
      const SCHOOL_KEY = 'math-tasks:trainer-school';

      // Состояние тренажёра
      const state = {
        view: 'sheet', // 'sheet' (куча примеров) или 'card' (по одной)
        school: localStorage.getItem(SCHOOL_KEY) === 'high' ? 'high' : 'basic',
        section: 'count', // 'count' — счёт, 'equations' — уравнения, 'expressions' — выражения
        category: 'addsub2',
        diff: 'normal', // 'normal', 'hard', 'expert'
        mode: 'zen',
        currentQuestion: null,
        phase: 'answer', // 'answer' — ждём ответ, 'checked' — проверен, сейчас будет следующий пример
        reviewQueue: [], // очередь работы над ошибками в режиме карточек
        currentFromReview: false,
        sessionLog: [], // ошибки текущей сессии карточек: показываются в итогах
        streak: 0,
        maxStreak: 0,
        score: 0,
        errors: 0,
        soundEnabled: true,
        timerSec: 60,
        totalSec: 60,
        timerInterval: null,
        timerArmed: false // спринт выбран, отсчёт начнётся с первого ввода
      };

      // Состояние режима «Куча примеров (Лист-тренажёр)»
      const sheetState = {
        count: 15,
        questions: [],
        solvedSet: new Set(),
        erredSet: new Set(), // примеры листа, где была хоть одна ошибка
        review: false, // лист собран из списка ошибок
        done: false // лист решён целиком, секундомер остановлен
      };

      // Звук
      const soundToggleBtn = document.querySelector('#btn-sound-toggle');
      const soundIcon = document.querySelector('#sound-icon');
      soundToggleBtn?.addEventListener('click', () => {
        state.soundEnabled = !state.soundEnabled;
        if (soundIcon) soundIcon.textContent = state.soundEnabled ? '🔊' : '🔇';
      });

      // Элементы UI для карточного режима
      const formulaDisplay = document.querySelector('#formula-display');
      const trainerInput = document.querySelector('#trainer-input');
      const trainerForm = document.querySelector('#trainer-form');
      const btnSkip = document.querySelector('#btn-skip-question');
      const valStreak = document.querySelector('#val-streak');
      const valScore = document.querySelector('#val-score');
      const valAccuracy = document.querySelector('#val-accuracy');
      const hudTimer = document.querySelector('#hud-timer');
      const valTimer = document.querySelector('#val-timer');
      const timerProgressWrap = document.querySelector('#timer-progress-wrap');
      const timerProgressBar = document.querySelector('#timer-progress-bar');
      const feedbackCard = document.querySelector('#feedback-card');
      const feedbackIcon = document.querySelector('#feedback-icon');
      const feedbackText = document.querySelector('#feedback-text');
      const sprintModal = document.querySelector('#sprint-modal');
      const trainerCard = document.querySelector('#trainer-card');
      const trainerArena = document.querySelector('#trainer-arena');
      const trainerModeRow = document.querySelector('#trainer-mode-row');
      const trainerSheetContainer = document.querySelector('#trainer-sheet-container');
      const trainerSheetGrid = document.querySelector('#trainer-sheet-grid');
      const tabViewSheet = document.querySelector('#tab-view-sheet');
      const tabViewCard = document.querySelector('#tab-view-card');
      const btnFinish = document.querySelector('#btn-finish-session');
      const hudReview = document.querySelector('#hud-review');
      const valReview = document.querySelector('#val-review');
      const t = (key, params) => window.MathTasks.t(key, params);

      // Где ответ бывает дробью, с минусом, с x или из нескольких корней — обычная клавиатура
      const TEXT_INPUT_CATEGORIES = new Set(['fractions', 'negatives', 'algebra_powers', 'powers']);
      const needsTextInput = q => q.type === 'roots' || q.type === 'poly' || TEXT_INPUT_CATEGORIES.has(q.category);
      const inputHintKey = q => ({ roots: 'trainer_roots_hint', poly: 'trainer_poly_hint' })[q.type]
        || (q.category === 'algebra_powers' ? 'trainer_algebra_hint' : 'trainer_fraction_hint');
      // Уравнение уже содержит «=», к выражению его дописываем
      const shownLatex = (q, tail) => (q.eq ? q.latex : `${q.latex} ${tail}`);

      /* ── Работа над ошибками ──
         Неверно решённые и пропущенные примеры копятся в списке, который
         переживает перезагрузку. Пример уходит из списка, когда в работе
         над ошибками его решили верно с первой попытки. */
      const MISTAKES_KEY = 'math-tasks:trainer-mistakes';
      let mistakes = (() => {
        try {
          const list = JSON.parse(localStorage.getItem(MISTAKES_KEY) || '[]');
          return Array.isArray(list) ? list.filter(q => q && q.latex && q.answer !== undefined) : [];
        } catch (_) {
          return [];
        }
      })();

      function setMistakes(list) {
        if (list === mistakes) return;
        mistakes = list;
        try {
          localStorage.setItem(MISTAKES_KEY, JSON.stringify(mistakes));
        } catch (_) {}
        updateReviewButtons();
      }
      const addMistake = q => setMistakes(window.MathTasksTrainer.rememberMistake(mistakes, q));
      const removeMistake = q => setMistakes(window.MathTasksTrainer.forgetMistake(mistakes, q));

      // В режиме карточек работа над ошибками — только из итогов, не по ходу
      function updateReviewButtons() {
        document.querySelectorAll('[data-review-btn]').forEach(btn => {
          btn.hidden = mistakes.length === 0 || (btn.id === 'btn-review' && state.view === 'card');
          btn.textContent = t('trainer_review_btn', { count: mistakes.length });
        });
      }

      /* ── Логика режима «Куча примеров на страницу» ──────────────────── */
      // trainer.js подключён раньше этого файла, запасная копия не нужна.
      const formatTime = sec => window.MathTasksTrainer.formatTime(sec);

      /* Секундомер стоит на 00:00, пока человек не начал вводить ответ.
         При уходе на другую вкладку встаёт на паузу и идёт дальше
         с первого же ввода. */
      function createStopwatch(onTick) {
        let accumulated = 0;
        let startedAt = null;
        let interval = null;
        const seconds = () => Math.floor((accumulated + (startedAt === null ? 0 : Date.now() - startedAt)) / 1000);
        const tick = () => onTick(seconds());
        return {
          get seconds() { return seconds(); },
          start() {
            if (startedAt !== null) return;
            startedAt = Date.now();
            interval = setInterval(tick, 1000);
            tick();
          },
          pause() {
            if (startedAt === null) return;
            accumulated += Date.now() - startedAt;
            startedAt = null;
            clearInterval(interval);
            tick();
          },
          reset() {
            this.pause();
            accumulated = 0;
            tick();
          }
        };
      }

      const sheetStopwatchEl = document.querySelector('#sheet-stopwatch');
      const sheetWatch = createStopwatch(sec => {
        if (sheetStopwatchEl) sheetStopwatchEl.textContent = `⏱️ ${formatTime(sec)}`;
      });
      const hudStopwatch = document.querySelector('#hud-stopwatch');
      const valStopwatch = document.querySelector('#val-stopwatch');
      const cardWatch = createStopwatch(sec => {
        if (valStopwatch) valStopwatch.textContent = formatTime(sec);
      });
      const isSprint = () => state.mode === 'sprint60' || state.mode === 'sprint120';

      // reviewList — примеры для работы над ошибками; без него лист генерируется заново
      function renderSheet(reviewList = null) {
        if (!window.MathTasksTrainer || !trainerSheetGrid) return;
        const solvedCountEl = document.querySelector('#sheet-solved-count');
        const totalCountEl = document.querySelector('#sheet-total-count');
        const completionCard = document.querySelector('#sheet-completion-card');
        if (completionCard) completionCard.hidden = true;

        sheetState.review = Boolean(reviewList);
        sheetState.questions = reviewList
          || window.MathTasksTrainer.generateBatch(state.category, sheetState.count, state.diff, state.school);
        sheetState.solvedSet.clear();
        sheetState.erredSet.clear();

        if (totalCountEl) totalCountEl.textContent = sheetState.questions.length;
        if (solvedCountEl) solvedCountEl.textContent = '0';
        const bannerNormal = document.querySelector('#sheet-banner-normal');
        const bannerReview = document.querySelector('#sheet-banner-review');
        if (bannerNormal) bannerNormal.hidden = sheetState.review;
        if (bannerReview) bannerReview.hidden = !sheetState.review;
        trainerSheetGrid.classList.toggle('trainer-sheet-grid--wide', sheetState.questions.some(q => q.task));

        trainerSheetGrid.innerHTML = sheetState.questions.map((q, idx) => `
          <div class="compact-drill-item" data-sheet-item="${idx}" id="sheet-item-${idx}">
            <span class="compact-drill-num">${idx + 1}.</span>
            <div class="compact-drill-body">
              ${q.task ? `<div class="compact-drill-task">${escapeHtml(t(`trainer_task_${q.task}`))}</div>` : ''}
              <div class="compact-drill-expr math" id="sheet-expr-${idx}"></div>
              <div class="compact-drill-answer-wrap">
                <input type="text" 
                       class="compact-drill-input" 
                       data-sheet-idx="${idx}" 
                       placeholder="${q.eq ? 'x = ?' : '?'}"
                       aria-label="${escapeHtml(t('trainer_answer_aria', { n: idx + 1 }))}"
                       autocomplete="off" 
                       autocorrect="off" 
                       autocapitalize="off" 
                       spellcheck="false" 
                       inputmode="${needsTextInput(q) ? 'text' : 'decimal'}" />
                <span class="compact-drill-status"></span>
              </div>
            </div>
          </div>
        `).join('');

        // Рендерим формулы через KaTeX
        sheetState.questions.forEach((q, idx) => {
          const exprEl = document.querySelector(`#sheet-expr-${idx}`);
          if (exprEl && window.katex) {
            try {
              exprEl.innerHTML = window.katex.renderToString(
                shownLatex(q, '='),
                { displayMode: false, throwOnError: false }
              );
            } catch (e) {
              exprEl.textContent = shownLatex(q, '=');
            }
          }
        });

        sheetState.done = false;
        sheetWatch.reset();

        // Фокусируем первое поле ввода
        setTimeout(() => {
          const firstInput = trainerSheetGrid.querySelector('.compact-drill-input');
          if (firstInput) firstInput.focus();
        }, 50);
      }

      function moveToNextInput(currentIdx) {
        const allInputs = Array.from(trainerSheetGrid.querySelectorAll('.compact-drill-input:not([readonly])'));
        if (!allInputs.length) return;
        const nextInput = allInputs.find(inp => Number(inp.dataset.sheetIdx) > currentIdx) || allInputs[0];
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
          try {
            nextInput.closest('.compact-drill-item')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } catch (_) {}
        }
      }

      function checkSheetInput(input, shouldAdvance = false) {
        const idx = Number(input.dataset.sheetIdx);
        const q = sheetState.questions[idx];
        if (!q || !window.MathTasksTrainer) return;

        const val = input.value.trim();
        if (!val) {
          if (shouldAdvance) moveToNextInput(idx);
          return;
        }

        const item = document.querySelector(`#sheet-item-${idx}`);
        const statusEl = item?.querySelector('.compact-drill-status');

        const check = window.MathTasksTrainer.checkAnswer(q, val);
        if (check.isCorrect) {
          sheetState.solvedSet.add(idx);
          // Верно с первой попытки в работе над ошибками — пример уходит из списка
          if (sheetState.review && !sheetState.erredSet.has(idx)) removeMistake(q);
          input.classList.remove('error');
          input.classList.add('success');
          input.readOnly = true;
          input.value = check.expectedDisplay;
          if (item) item.classList.add('is-solved');
          if (statusEl) {
            statusEl.className = 'compact-drill-status success';
            statusEl.textContent = '✓';
          }
          if (state.soundEnabled) window.MathTasksTrainer.playSound('correct');

          const solvedCountEl = document.querySelector('#sheet-solved-count');
          if (solvedCountEl) solvedCountEl.textContent = sheetState.solvedSet.size;

          if (sheetState.solvedSet.size >= sheetState.questions.length) {
            onSheetCompleted();
            return;
          }

          if (shouldAdvance) {
            moveToNextInput(idx);
          }
        } else {
          sheetState.erredSet.add(idx);
          addMistake(q);
          input.classList.remove('success');
          input.classList.add('error');
          if (statusEl) {
            statusEl.className = 'compact-drill-status error';
            statusEl.textContent = '✕';
          }
          if (state.soundEnabled) window.MathTasksTrainer.playSound('wrong');

          if (shouldAdvance) {
            moveToNextInput(idx);
          } else {
            input.select();
          }
        }
      }

      function checkAllSheetInputs() {
        document.querySelectorAll('.compact-drill-input:not([readonly])').forEach(input => {
          if (input.value.trim()) {
            checkSheetInput(input, false);
          }
        });
      }

      function onSheetCompleted() {
        sheetWatch.pause();
        sheetState.done = true;
        if (state.soundEnabled) {
          window.MathTasksTrainer.playSound('correct');
          setTimeout(() => window.MathTasksTrainer.playSound('correct'), 180);
        }
        const completionCard = document.querySelector('#sheet-completion-card');
        const textEl = document.querySelector('#sheet-completion-text');
        if (textEl) {
          const count = sheetState.questions.length;
          const time = formatTime(sheetWatch.seconds);
          textEl.innerHTML = sheetState.review
            ? t('trainer_review_done', { time, left: mistakes.length })
            : t('trainer_sheet_done_text', {
              count,
              time,
              accuracy: Math.round(((count - sheetState.erredSet.size) / count) * 100)
            });
        }
        if (completionCard) {
          completionCard.hidden = false;
          completionCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }

      /* ── Переключение вида: Карточки vs Куча примеров ─────────────── */
      function switchView(view) {
        state.view = view;
        const isSheet = view === 'sheet';

        tabViewSheet?.classList.toggle('active', isSheet);
        tabViewSheet?.setAttribute('aria-selected', isSheet ? 'true' : 'false');
        tabViewCard?.classList.toggle('active', !isSheet);
        tabViewCard?.setAttribute('aria-selected', !isSheet ? 'true' : 'false');

        if (trainerSheetContainer) trainerSheetContainer.hidden = !isSheet;
        if (trainerArena) trainerArena.hidden = isSheet;
        if (trainerModeRow) trainerModeRow.hidden = isSheet;
        updateReviewButtons();

        // Время на скрытой вкладке не идёт: продолжится с первого ввода
        if (isSheet) {
          stopTimer();
          cardWatch.pause();
          if (!sheetState.questions.length) renderSheet();
        } else {
          sheetWatch.pause();
          state.timerArmed = isSprint() && state.timerSec > 0;
          updateHUD();
          nextQuestion();
        }
      }

      tabViewSheet?.addEventListener('click', () => switchView('sheet'));
      tabViewCard?.addEventListener('click', () => switchView('card'));

      // Слушатели кнопок листа
      document.querySelector('#btn-sheet-refresh')?.addEventListener('click', () => renderSheet());
      document.querySelector('#btn-sheet-next-pack')?.addEventListener('click', () => renderSheet());
      document.querySelector('#btn-sheet-check-all')?.addEventListener('click', () => checkAllSheetInputs());

      // Секундомер листа идёт с первого введённого символа
      trainerSheetGrid?.addEventListener('input', () => {
        if (!sheetState.done) sheetWatch.start();
      });

      // Количество примеров на листе (10, 20, 30)
      document.querySelectorAll('.sheet-count-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.sheet-count-chip').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          sheetState.count = Number(btn.dataset.count) || 20;
          renderSheet();
        });
      });

      // События ввода в сетке листа
      trainerSheetGrid?.addEventListener('keydown', e => {
        const input = e.target.closest('.compact-drill-input');
        if (!input) return;

        if (e.key === 'Enter') {
          e.preventDefault();
          if (input.readOnly) {
            moveToNextInput(Number(input.dataset.sheetIdx));
          } else {
            checkSheetInput(input, true);
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const all = Array.from(trainerSheetGrid.querySelectorAll('.compact-drill-input:not([readonly])'));
          const cur = all.indexOf(input);
          if (cur >= 0 && cur < all.length - 1) all[cur + 1].focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const all = Array.from(trainerSheetGrid.querySelectorAll('.compact-drill-input:not([readonly])'));
          const cur = all.indexOf(input);
          if (cur > 0) all[cur - 1].focus();
        }
      });

      /* ── Логика режима карточек (Марафон и Спринт) ─────────────────── */
      function updateHUD() {
        if (valStreak) valStreak.textContent = state.streak;
        if (valScore) valScore.textContent = state.score;
        const total = state.score + state.errors;
        const acc = total > 0 ? Math.round((state.score / total) * 100) : 100;
        if (valAccuracy) valAccuracy.textContent = `${acc}%`;

        const streakBadge = document.querySelector('#hud-streak');
        if (streakBadge) {
          if (state.streak >= 5) streakBadge.classList.add('fire');
          else streakBadge.classList.remove('fire');
        }
      }

      function nextQuestion() {
        if (!window.MathTasksTrainer) return;
        state.currentFromReview = state.reviewQueue.length > 0;
        state.currentQuestion = state.currentFromReview
          ? state.reviewQueue.shift()
          : window.MathTasksTrainer.generateQuestion(state.category, state.diff, state.school);
        if (hudReview) hudReview.hidden = !state.currentFromReview;
        if (valReview) valReview.textContent = state.reviewQueue.length + 1;

        if (formulaDisplay && window.katex) {
          try {
            formulaDisplay.innerHTML = window.katex.renderToString(
              shownLatex(state.currentQuestion, '= ?'),
              { displayMode: true, throwOnError: false }
            );
          } catch (e) {
            formulaDisplay.textContent = shownLatex(state.currentQuestion, '= ?');
          }
        }

        const formulaTask = document.querySelector('#formula-task');
        if (formulaTask) {
          formulaTask.hidden = !state.currentQuestion.task;
          formulaTask.textContent = state.currentQuestion.task ? t(`trainer_task_${state.currentQuestion.task}`) : '';
        }
        formulaDisplay?.classList.toggle('trainer-formula--task', Boolean(state.currentQuestion.task));
        const isText = needsTextInput(state.currentQuestion);
        if (trainerInput) {
          trainerInput.setAttribute('inputmode', isText ? 'text' : 'decimal');
          trainerInput.value = '';
          trainerInput.focus();
        }

        const hintEl = document.querySelector('#trainer-input-hint');
        if (hintEl) {
          hintEl.innerHTML = t(inputHintKey(state.currentQuestion));
        }

        state.phase = 'answer';
        if (feedbackCard) feedbackCard.hidden = true;
        if (trainerCard) {
          trainerCard.classList.remove('correct-flash', 'wrong-flash');
        }
      }

      function checkCurrentAnswer() {
        if (!state.currentQuestion || !window.MathTasksTrainer) return;
        // Проверенный ответ не проверяем второй раз, пока пример не сменился
        if (state.phase !== 'answer') return;
        const val = trainerInput ? trainerInput.value : '';
        if (!val.trim()) return;
        const check = window.MathTasksTrainer.checkAnswer(state.currentQuestion, val);

        if (check.isCorrect) {
          state.phase = 'checked';
          state.score++;
          state.streak++;
          if (state.streak > state.maxStreak) state.maxStreak = state.streak;
          if (state.soundEnabled) window.MathTasksTrainer.playSound('correct');

          if (trainerCard) {
            trainerCard.classList.remove('wrong-flash');
            trainerCard.classList.add('correct-flash');
          }

          if (feedbackCard) {
            feedbackCard.className = 'trainer-feedback-card correct';
            if (feedbackIcon) feedbackIcon.textContent = '✓';
            if (feedbackText) feedbackText.textContent = t('trainer_feedback_correct_answer', { answer: check.expectedDisplay });
            feedbackCard.hidden = false;
          }

          // Верно в работе над ошибками — пример уходит из списка
          const reviewFinished = state.currentFromReview && !state.reviewQueue.length;
          if (state.currentFromReview) removeMistake(state.currentQuestion);
          if (reviewFinished && feedbackText) {
            feedbackText.textContent = t('trainer_review_finished', { left: mistakes.length });
          }

          updateHUD();
          setTimeout(() => {
            nextQuestion();
          }, reviewFinished ? 1500 : 350);
        } else {
          state.errors++;
          state.streak = 0;
          if (state.soundEnabled) window.MathTasksTrainer.playSound('wrong');

          if (trainerCard) {
            trainerCard.classList.remove('correct-flash');
            trainerCard.classList.add('wrong-flash');
          }

          // Правильный ответ — не сейчас, а в итогах сессии
          state.phase = 'checked';
          state.sessionLog.push({ q: state.currentQuestion, given: val.trim() });
          updateHUD();
          addMistake(state.currentQuestion);
          setTimeout(nextQuestion, 450);
        }
      }

      trainerForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        checkCurrentAnswer();
      });

      // Пропуск считается ошибкой; правильный ответ — в итогах сессии
      btnSkip?.addEventListener('click', () => {
        if (state.phase !== 'answer' || !state.currentQuestion) return;
        state.errors++;
        state.streak = 0;
        state.sessionLog.push({ q: state.currentQuestion, given: '' });
        updateHUD();
        addMistake(state.currentQuestion);
        nextQuestion();
      });

      /* ── Разделы: счёт, уравнения, выражения ─────────────────────── */
      const SECTION_TEXT = {
        count: ['trainer_title', 'trainer_sub'],
        equations: ['trainer_title_equations', 'trainer_sub_equations'],
        expressions: ['trainer_title_expressions', 'trainer_sub_expressions']
      };
      const isChipVisible = chip => !chip.closest('[hidden]');

      // Кнопки чужого раздела и темы средней школы в основной — скрыты
      function syncPanel() {
        document.querySelectorAll('.trainer-section-chip').forEach(b => {
          b.classList.toggle('active', b.dataset.section === state.section);
        });
        document.querySelectorAll('[data-section-group], [data-high-only]').forEach(el => {
          const offSection = el.dataset.sectionGroup && el.dataset.sectionGroup !== state.section;
          const offSchool = el.hasAttribute('data-high-only') && state.school === 'basic';
          el.hidden = Boolean(offSection || offSchool);
        });
        /* Вкладки школы нужны только разделу, где есть темы средней школы;
           в выражениях их нет — вкладки прячем. */
        const schoolTabs = document.querySelector('#trainer-school-group');
        if (schoolTabs) {
          const group = `[data-section-group="${state.section}"]`;
          schoolTabs.hidden = !document.querySelector(`${group}[data-high-only], ${group} [data-high-only]`);
        }
        const active = document.querySelector('.trainer-cat-chip.active');
        if (!active || !isChipVisible(active)) {
          const first = [...document.querySelectorAll('.trainer-cat-chip')].find(isChipVisible);
          document.querySelectorAll('.trainer-cat-chip').forEach(b => b.classList.toggle('active', b === first));
          state.category = first ? first.dataset.cat : 'addsub2';
        }
        const [titleKey, subKey] = SECTION_TEXT[state.section];
        const title = document.querySelector('.trainer-header h1');
        const sub = document.querySelector('.trainer-header p');
        if (title) {
          title.dataset.i18n = titleKey;
          title.textContent = t(titleKey);
        }
        if (sub) {
          sub.dataset.i18n = subKey;
          sub.textContent = t(subKey);
        }
        // Шапка: ссылки на все тренажёры, текущий подсвечен.
        document.querySelectorAll('[data-section-link]').forEach(link => {
          const current = link.dataset.sectionLink === state.section;
          link.classList.toggle('active', current);
          if (current) link.setAttribute('aria-current', 'page');
          else link.removeAttribute('aria-current');
        });
      }

      document.querySelectorAll('.trainer-section-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.dataset.section === state.section) return;
          state.section = btn.dataset.section;
          syncPanel();
          const url = new URL(location.href);
          url.searchParams.delete('cat');
          if (state.section === 'count') url.searchParams.delete('section');
          else url.searchParams.set('section', state.section);
          history.replaceState(null, '', url);
          restartTraining();
        });
      });

      // Новые настройки — новые примеры; работа над ошибками при этом прекращается
      function restartTraining() {
        state.streak = 0;
        state.reviewQueue = [];
        cardWatch.reset();
        if (state.view === 'sheet') {
          renderSheet();
        } else {
          updateHUD();
          nextQuestion();
        }
      }

      // Переключение категорий
      document.querySelectorAll('.trainer-cat-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.trainer-cat-chip').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.category = btn.dataset.cat || 'addsub2';
          restartTraining();
        });
      });

      // Переключение школы: основная / средняя — вкладки над панелью
      const syncSchoolChips = () => {
        document.querySelectorAll('[data-school]').forEach(b => {
          const active = b.dataset.school === state.school;
          b.classList.toggle('active', active);
          b.setAttribute('aria-selected', String(active));
        });
      };
      syncSchoolChips();
      document.querySelectorAll('[data-school]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.school = btn.dataset.school === 'high' ? 'high' : 'basic';
          localStorage.setItem(SCHOOL_KEY, state.school);
          syncSchoolChips();
          syncPanel();
          restartTraining();
        });
      });

      // Переключение сложности
      document.querySelectorAll('.trainer-diff-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.trainer-diff-chip').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.diff = btn.dataset.diff || 'normal';
          restartTraining();
        });
      });

      // Переключение режимов спринта
      document.querySelectorAll('.trainer-mode-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.trainer-mode-chip').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const mode = btn.dataset.mode || 'zen';
          state.mode = mode;
          state.reviewQueue = [];
          stopTimer();

          // Спринт — обратный отсчёт вместо секундомера; оба стартуют с первого ввода
          if (mode === 'sprint60' || mode === 'sprint120') {
            const sec = mode === 'sprint60' ? 60 : 120;
            state.timerSec = sec;
            state.totalSec = sec;
            state.timerArmed = true;
            updateTimerDisplay();
            if (hudTimer) hudTimer.hidden = false;
            if (timerProgressWrap) timerProgressWrap.hidden = false;
            if (hudStopwatch) hudStopwatch.hidden = true;
            if (btnFinish) btnFinish.hidden = true;
          } else {
            state.timerArmed = false;
            if (hudTimer) hudTimer.hidden = true;
            if (timerProgressWrap) timerProgressWrap.hidden = true;
            if (hudStopwatch) hudStopwatch.hidden = false;
            if (btnFinish) btnFinish.hidden = false;
          }

          resetSession();
          nextQuestion();
        });
      });

      // Новая сессия карточек: счёт, серия, ошибки сессии и секундомер с нуля
      function resetSession() {
        state.score = 0;
        state.errors = 0;
        state.streak = 0;
        state.maxStreak = 0;
        state.sessionLog = [];
        cardWatch.reset();
        updateHUD();
      }

      // Марафон заканчивается по кнопке, спринт — когда вышло время
      btnFinish?.addEventListener('click', () => finishSession());

      // Таймер спринта
      function startTimer() {
        stopTimer();
        updateTimerDisplay();
        state.timerInterval = setInterval(() => {
          state.timerSec--;
          updateTimerDisplay();
          if (state.timerSec <= 0) {
            finishSession();
          }
        }, 1000);
      }

      function stopTimer() {
        if (state.timerInterval) {
          clearInterval(state.timerInterval);
          state.timerInterval = null;
        }
      }

      function updateTimerDisplay() {
        if (valTimer) valTimer.textContent = `${state.timerSec}s`;
        if (timerProgressBar && state.totalSec > 0) {
          const pct = Math.max(0, Math.min(100, (state.timerSec / state.totalSec) * 100));
          timerProgressBar.style.width = `${pct}%`;
        }
      }

      // Ошибки этой сессии — в итогах: пример, ответ ученика, правильный ответ
      function renderSessionMistakes() {
        const box = document.querySelector('#res-mistakes');
        if (!box) return;
        const log = state.sessionLog;
        box.hidden = !log.length;
        if (!log.length) {
          box.innerHTML = '';
          return;
        }
        const rows = log.map(({ q, given }) => {
          let expr;
          try {
            expr = window.katex.renderToString(shownLatex(q, '='), { throwOnError: false });
          } catch (e) {
            expr = escapeHtml(shownLatex(q, '='));
          }
          return `<li class="res-mistake">
            <span class="res-mistake-expr">${expr}</span>
            <span class="res-mistake-given">${escapeHtml(given || t('trainer_res_skipped'))}</span>
            <span class="res-mistake-answer">${escapeHtml(q.answer)}</span>
          </li>`;
        }).join('');
        box.innerHTML = `<h3 class="res-mistakes-title">${escapeHtml(t('trainer_res_mistakes', { count: log.length }))}</h3>
          <ul class="res-mistakes-list">${rows}</ul>`;
      }

      // Итоги сессии карточек: спринт — по истечении времени, марафон — по кнопке «Завершить»
      function finishSession() {
        const sprint = isSprint();
        stopTimer();
        state.timerArmed = false;
        cardWatch.pause();

        // Рекорд — только у спринта и свой для каждого уровня и школы
        let prevBest = 0;
        let isNewRecord = false;
        if (sprint) {
          const key = `math-tasks:trainer-record:${state.category}:${state.diff}:${state.school}:${state.mode}`;
          prevBest = Number(localStorage.getItem(key)) || 0;
          isNewRecord = state.score > prevBest;
          if (isNewRecord) localStorage.setItem(key, String(state.score));
        }

        const title = document.querySelector('#sprint-title');
        if (title) {
          title.dataset.i18n = sprint ? 'trainer_sprint_done_title' : 'trainer_session_done_title';
          title.textContent = t(title.dataset.i18n);
        }
        const bestItem = document.querySelector('#res-best-item');
        if (bestItem) bestItem.hidden = !sprint;
        renderSessionMistakes();

        const resScore = document.querySelector('#res-score');
        const resAccuracy = document.querySelector('#res-accuracy');
        const resMaxStreak = document.querySelector('#res-max-streak');
        const resBestScore = document.querySelector('#res-best-score');
        const sprintSubtitle = document.querySelector('#sprint-subtitle');

        if (resScore) resScore.textContent = state.score;
        const total = state.score + state.errors;
        const acc = total > 0 ? Math.round((state.score / total) * 100) : 100;
        if (resAccuracy) resAccuracy.textContent = `${acc}%`;
        if (resMaxStreak) resMaxStreak.textContent = state.maxStreak;
        if (resBestScore) resBestScore.textContent = Math.max(state.score, prevBest);

        if (sprintSubtitle) {
          sprintSubtitle.textContent = sprint
            ? t(isNewRecord ? 'trainer_sprint_new_record' : 'trainer_sprint_good')
            : t('trainer_session_done_subtitle', { time: formatTime(cardWatch.seconds) });
        }

        if (sprintModal && typeof sprintModal.showModal === 'function') {
          sprintModal.showModal();
        }
      }

      document.querySelector('#btn-restart-sprint')?.addEventListener('click', () => {
        if (sprintModal) sprintModal.close();
        resetSession();
        if (isSprint()) {
          state.timerSec = state.totalSec;
          state.timerArmed = true;
          updateTimerDisplay();
        }
        nextQuestion();
      });

      // Марафон без таймера: после спринта и для работы над ошибками
      function setZenMode() {
        state.mode = 'zen';
        document.querySelectorAll('.trainer-mode-chip').forEach(b => {
          b.classList.toggle('active', b.dataset.mode === 'zen');
        });
        if (hudTimer) hudTimer.hidden = true;
        if (timerProgressWrap) timerProgressWrap.hidden = true;
        if (hudStopwatch) hudStopwatch.hidden = false;
        if (btnFinish) btnFinish.hidden = false;
        state.timerArmed = false;
        cardWatch.reset();
      }

      document.querySelector('#btn-close-sprint')?.addEventListener('click', () => {
        if (sprintModal) sprintModal.close();
        setZenMode();
        resetSession();
        nextQuestion();
      });

      /* ── Работа над ошибками: запуск ─────────────────────────────── */
      // В режиме листа — лист из ошибок, в режиме карточек — очередь без таймера
      function startReview() {
        if (!mistakes.length) return;
        if (sprintModal?.open) sprintModal.close();
        const list = window.MathTasksTrainer.shuffle(mistakes);
        state.streak = 0;
        if (state.view === 'sheet') {
          renderSheet(list);
        } else {
          stopTimer();
          setZenMode();
          resetSession();
          state.reviewQueue = list;
          updateHUD();
          nextQuestion();
        }
      }

      document.querySelectorAll('[data-review-btn]').forEach(btn => btn.addEventListener('click', startReview));
      window.addEventListener('languagechange', updateReviewButtons);

      // Время в карточках идёт с первого введённого символа:
      // в марафоне — секундомер, в спринте — обратный отсчёт
      function onCardTyping() {
        if (!isSprint()) {
          cardWatch.start();
        } else if (state.timerArmed) {
          state.timerArmed = false;
          startTimer();
        }
      }
      trainerInput?.addEventListener('input', onCardTyping);

      // Виртуальный Numpad
      document.querySelectorAll('.numpad-key').forEach(keyBtn => {
        keyBtn.addEventListener('click', () => {
          const key = keyBtn.dataset.key;
          if (!trainerInput) return;
          if (key === 'backspace') {
            trainerInput.value = trainerInput.value.slice(0, -1);
          } else if (key === 'enter') {
            checkCurrentAnswer();
          } else if (key) {
            trainerInput.value += key;
            onCardTyping();
          }
          trainerInput.focus();
        });
      });

      // Ссылка ?section=equations или ?cat=eq_quadratic открывает нужный раздел
      const params = new URLSearchParams(location.search);
      if (SECTION_TEXT[params.get('section')]) state.section = params.get('section');
      const linkedChip = params.get('cat')
        && document.querySelector(`.trainer-cat-chip[data-cat="${CSS.escape(params.get('cat'))}"]`);
      if (linkedChip) {
        document.querySelectorAll('.trainer-cat-chip').forEach(b => b.classList.toggle('active', b === linkedChip));
        state.category = linkedChip.dataset.cat;
        state.section = linkedChip.closest('[data-section-group]')?.dataset.sectionGroup || state.section;
      }
      syncPanel();

      // Запуск по умолчанию: открываем лист примеров (режим «Тренажёр»)
      updateReviewButtons();
      renderSheet();
    })();
