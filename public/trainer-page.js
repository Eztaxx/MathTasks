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
        phase: 'answer', // 'answer' — ждём ответ, 'correct' — засчитан, 'reveal' — показан правильный ответ
        reviewQueue: [], // очередь работы над ошибками в режиме карточек
        currentFromReview: false,
        streak: 0,
        maxStreak: 0,
        score: 0,
        errors: 0,
        soundEnabled: true,
        timerSec: 60,
        totalSec: 60,
        timerInterval: null
      };

      // Состояние режима «Куча примеров (Лист-тренажёр)»
      const sheetState = {
        count: 15,
        questions: [],
        solvedSet: new Set(),
        erredSet: new Set(), // примеры листа, где была хоть одна ошибка
        review: false, // лист собран из списка ошибок
        elapsedSec: 0,
        startTime: null,
        timerInterval: null
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
      const feedbackHintWrap = document.querySelector('#feedback-hint-wrap');
      const feedbackHintContent = document.querySelector('#feedback-hint-content');
      const sprintModal = document.querySelector('#sprint-modal');
      const trainerCard = document.querySelector('#trainer-card');
      const trainerArena = document.querySelector('#trainer-arena');
      const trainerModeRow = document.querySelector('#trainer-mode-row');
      const trainerSheetContainer = document.querySelector('#trainer-sheet-container');
      const trainerSheetGrid = document.querySelector('#trainer-sheet-grid');
      const tabViewSheet = document.querySelector('#tab-view-sheet');
      const tabViewCard = document.querySelector('#tab-view-card');
      const btnNext = document.querySelector('#btn-next-question');
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

      function updateReviewButtons() {
        document.querySelectorAll('[data-review-btn]').forEach(btn => {
          btn.hidden = mistakes.length === 0;
          btn.textContent = t('trainer_review_btn', { count: mistakes.length });
        });
      }

      /* ── Логика режима «Куча примеров на страницу» ──────────────────── */
      // trainer.js подключён раньше этого файла, запасная копия не нужна.
      const formatTime = sec => window.MathTasksTrainer.formatTime(sec);

      function startSheetStopwatch() {
        stopSheetStopwatch();
        sheetState.elapsedSec = 0;
        sheetState.startTime = Date.now();
        const swEl = document.querySelector('#sheet-stopwatch');
        if (swEl) swEl.textContent = '⏱️ 00:00';
        sheetState.timerInterval = setInterval(() => {
          sheetState.elapsedSec = Math.floor((Date.now() - sheetState.startTime) / 1000);
          if (swEl) swEl.textContent = `⏱️ ${formatTime(sheetState.elapsedSec)}`;
        }, 1000);
      }

      function stopSheetStopwatch() {
        if (sheetState.timerInterval) {
          clearInterval(sheetState.timerInterval);
          sheetState.timerInterval = null;
        }
      }

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

        startSheetStopwatch();

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
        stopSheetStopwatch();
        if (state.soundEnabled) {
          window.MathTasksTrainer.playSound('correct');
          setTimeout(() => window.MathTasksTrainer.playSound('correct'), 180);
        }
        const completionCard = document.querySelector('#sheet-completion-card');
        const textEl = document.querySelector('#sheet-completion-text');
        if (textEl) {
          const count = sheetState.questions.length;
          const time = formatTime(sheetState.elapsedSec);
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

        if (isSheet) {
          stopTimer();
          if (!sheetState.questions.length) {
            renderSheet();
          } else {
            startSheetStopwatch();
          }
        } else {
          stopSheetStopwatch();
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
        if (feedbackHintWrap) feedbackHintWrap.hidden = true;
        if (btnNext) btnNext.hidden = true;
        if (trainerCard) {
          trainerCard.classList.remove('correct-flash', 'wrong-flash');
        }
      }

      // Показывает правильный ответ и разбор; дальше — по Enter или кнопке «Дальше»
      function revealAnswer(message) {
        const q = state.currentQuestion;
        state.phase = 'reveal';
        if (!feedbackCard) return;
        feedbackCard.className = 'trainer-feedback-card wrong';
        if (feedbackIcon) feedbackIcon.textContent = '✕';
        if (feedbackText) feedbackText.textContent = message;
        if (feedbackHintContent && q.hint) {
          // В подсказках десятичные через точку, а в примерах — через запятую
          const hint = q.hint.replace(/(\d)\.(\d)/g, '$1{,}$2');
          try {
            feedbackHintContent.innerHTML = window.katex.renderToString(hint, { displayMode: true, throwOnError: false });
          } catch (e) {
            feedbackHintContent.textContent = hint;
          }
        }
        if (feedbackHintWrap) feedbackHintWrap.hidden = !q.hint;
        feedbackCard.hidden = false;
        if (btnNext) {
          btnNext.hidden = false;
          btnNext.focus();
        }
      }

      function checkCurrentAnswer() {
        if (!state.currentQuestion || !window.MathTasksTrainer) return;
        if (state.phase === 'reveal') {
          nextQuestion();
          return;
        }
        // Засчитанный ответ не проверяем второй раз, пока пример не сменился
        if (state.phase !== 'answer') return;
        const val = trainerInput ? trainerInput.value : '';
        if (!val.trim()) return;
        const check = window.MathTasksTrainer.checkAnswer(state.currentQuestion, val);

        if (check.isCorrect) {
          state.phase = 'correct';
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

          updateHUD();
          addMistake(state.currentQuestion);
          revealAnswer(t('trainer_feedback_wrong', { answer: check.expectedDisplay }));
        }
      }

      trainerForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        checkCurrentAnswer();
      });

      // Пропуск тоже показывает правильный ответ
      btnSkip?.addEventListener('click', () => {
        if (state.phase === 'reveal') {
          nextQuestion();
          return;
        }
        if (state.phase !== 'answer' || !state.currentQuestion) return;
        state.errors++;
        state.streak = 0;
        updateHUD();
        addMistake(state.currentQuestion);
        revealAnswer(t('trainer_feedback_skipped', { answer: state.currentQuestion.answer }));
      });

      btnNext?.addEventListener('click', () => nextQuestion());

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

      // Переключение школы: основная / средняя
      const syncSchoolChips = () => {
        document.querySelectorAll('.trainer-school-chip').forEach(b => {
          b.classList.toggle('active', b.dataset.school === state.school);
        });
      };
      syncSchoolChips();
      document.querySelectorAll('.trainer-school-chip').forEach(btn => {
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

          if (mode === 'sprint60' || mode === 'sprint120') {
            const sec = mode === 'sprint60' ? 60 : 120;
            state.timerSec = sec;
            state.totalSec = sec;
            if (hudTimer) hudTimer.hidden = false;
            if (timerProgressWrap) timerProgressWrap.hidden = false;
            startTimer();
          } else {
            if (hudTimer) hudTimer.hidden = true;
            if (timerProgressWrap) timerProgressWrap.hidden = true;
          }

          state.score = 0;
          state.errors = 0;
          state.streak = 0;
          state.maxStreak = 0;
          updateHUD();
          nextQuestion();
        });
      });

      // Таймер спринта
      function startTimer() {
        stopTimer();
        updateTimerDisplay();
        state.timerInterval = setInterval(() => {
          state.timerSec--;
          updateTimerDisplay();
          if (state.timerSec <= 0) {
            stopTimer();
            finishSprint();
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

      function finishSprint() {
        // Рекорд — свой для каждого уровня и школы: рекорд «Базового» не должен закрывать «Эксперт»
        const key = `math-tasks:trainer-record:${state.category}:${state.diff}:${state.school}:${state.mode}`;
        const prevBest = Number(localStorage.getItem(key)) || 0;
        const isNewRecord = state.score > prevBest;
        if (isNewRecord) {
          localStorage.setItem(key, String(state.score));
        }

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
          sprintSubtitle.textContent = t(isNewRecord ? 'trainer_sprint_new_record' : 'trainer_sprint_good');
        }

        if (sprintModal && typeof sprintModal.showModal === 'function') {
          sprintModal.showModal();
        }
      }

      document.querySelector('#btn-restart-sprint')?.addEventListener('click', () => {
        if (sprintModal) sprintModal.close();
        state.score = 0;
        state.errors = 0;
        state.streak = 0;
        state.maxStreak = 0;
        state.timerSec = state.totalSec;
        updateHUD();
        startTimer();
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
      }

      document.querySelector('#btn-close-sprint')?.addEventListener('click', () => {
        if (sprintModal) sprintModal.close();
        setZenMode();
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
          state.reviewQueue = list;
          updateHUD();
          nextQuestion();
        }
      }

      document.querySelectorAll('[data-review-btn]').forEach(btn => btn.addEventListener('click', startReview));
      window.addEventListener('languagechange', updateReviewButtons);

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
