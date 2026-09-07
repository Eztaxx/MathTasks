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

      // Состояние тренажёра
      const state = {
        view: 'sheet', // 'sheet' (куча примеров) или 'card' (по одной)
        category: 'addsub2',
        diff: 'normal', // 'normal', 'hard', 'expert'
        mode: 'zen',
        currentQuestion: null,
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
        count: 20,
        questions: [],
        solvedSet: new Set(),
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

      /* ── Логика режима «Куча примеров на страницу» ──────────────────── */
      function formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }

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

      function renderSheet() {
        if (!window.MathTasksTrainer || !trainerSheetGrid) return;
        const solvedCountEl = document.querySelector('#sheet-solved-count');
        const totalCountEl = document.querySelector('#sheet-total-count');
        const completionCard = document.querySelector('#sheet-completion-card');
        if (completionCard) completionCard.hidden = true;

        sheetState.questions = window.MathTasksTrainer.generateBatch(state.category, sheetState.count, state.diff);
        sheetState.solvedSet.clear();

        if (totalCountEl) totalCountEl.textContent = sheetState.count;
        if (solvedCountEl) solvedCountEl.textContent = '0';

        trainerSheetGrid.innerHTML = sheetState.questions.map((q, idx) => `
          <div class="compact-drill-item" data-sheet-item="${idx}" id="sheet-item-${idx}">
            <span class="compact-drill-num">${idx + 1}.</span>
            <div class="compact-drill-body">
              <div class="compact-drill-expr math" id="sheet-expr-${idx}"></div>
              <div class="compact-drill-answer-wrap">
                <input type="text" 
                       class="compact-drill-input" 
                       data-sheet-idx="${idx}" 
                       placeholder="?" 
                       aria-label="Ответ к примеру ${idx + 1}"
                       autocomplete="off" 
                       autocorrect="off" 
                       autocapitalize="off" 
                       spellcheck="false" 
                       inputmode="decimal" />
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
                `${q.latex} =`,
                { displayMode: false, throwOnError: false }
              );
            } catch (e) {
              exprEl.textContent = `${q.latex} =`;
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
          const timeStr = formatTime(sheetState.elapsedSec);
          textEl.innerHTML = `Вы решили все <strong>${sheetState.questions.length}</strong> примеров за <strong>${timeStr}</strong>! Точность: <strong>100%</strong> 🎯`;
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
          checkSheetInput(input, true);
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
        state.currentQuestion = window.MathTasksTrainer.generateQuestion(state.category, state.diff);

        if (formulaDisplay && window.katex) {
          try {
            formulaDisplay.innerHTML = window.katex.renderToString(
              `${state.currentQuestion.latex} = ?`,
              { displayMode: true, throwOnError: false }
            );
          } catch (e) {
            formulaDisplay.textContent = `${state.currentQuestion.latex} = ?`;
          }
        }

        if (trainerInput) {
          trainerInput.value = '';
          trainerInput.focus();
        }
        if (feedbackCard) feedbackCard.hidden = true;
        if (trainerCard) {
          trainerCard.classList.remove('correct-flash', 'wrong-flash');
        }
      }

      function checkCurrentAnswer() {
        if (!state.currentQuestion || !window.MathTasksTrainer) return;
        const val = trainerInput ? trainerInput.value : '';
        const check = window.MathTasksTrainer.checkAnswer(state.currentQuestion, val);

        if (check.isCorrect) {
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
            if (feedbackText) feedbackText.textContent = `Правильно! (${check.expectedDisplay})`;
            feedbackCard.hidden = false;
          }

          updateHUD();
          setTimeout(() => {
            nextQuestion();
          }, 350);
        } else {
          state.errors++;
          state.streak = 0;
          if (state.soundEnabled) window.MathTasksTrainer.playSound('wrong');

          if (trainerCard) {
            trainerCard.classList.remove('correct-flash');
            trainerCard.classList.add('wrong-flash');
          }

          if (feedbackCard) {
            feedbackCard.className = 'trainer-feedback-card wrong';
            if (feedbackIcon) feedbackIcon.textContent = '✕';
            if (feedbackText) feedbackText.textContent = 'Неверно, попробуйте ещё раз!';
            feedbackCard.hidden = false;
          }

          updateHUD();
          setTimeout(() => {
            nextQuestion();
          }, 1200);
        }
      }

      trainerForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        checkCurrentAnswer();
      });

      btnSkip?.addEventListener('click', () => {
        state.errors++;
        state.streak = 0;
        updateHUD();
        nextQuestion();
      });

      // Переключение категорий
      document.querySelectorAll('.trainer-cat-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.trainer-cat-chip').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.category = btn.dataset.cat || 'addsub2';
          state.streak = 0;
          if (state.view === 'sheet') {
            renderSheet();
          } else {
            updateHUD();
            nextQuestion();
          }
        });
      });

      // Переключение сложности
      document.querySelectorAll('.trainer-diff-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.trainer-diff-chip').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.diff = btn.dataset.diff || 'normal';
          state.streak = 0;
          if (state.view === 'sheet') {
            renderSheet();
          } else {
            updateHUD();
            nextQuestion();
          }
        });
      });

      // Переключение режимов спринта
      document.querySelectorAll('.trainer-mode-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.trainer-mode-chip').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const mode = btn.dataset.mode || 'zen';
          state.mode = mode;
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
        const key = `math-tasks:trainer-record:${state.category}:${state.mode}`;
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
          sprintSubtitle.textContent = isNewRecord
            ? '🏆 Поздравляем! Вы установили новый личный рекорд!'
            : 'Отличная скорость и концентрация!';
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

      document.querySelector('#btn-close-sprint')?.addEventListener('click', () => {
        if (sprintModal) sprintModal.close();
        state.mode = 'zen';
        document.querySelectorAll('.trainer-mode-chip').forEach(b => {
          b.classList.toggle('active', b.dataset.mode === 'zen');
        });
        if (hudTimer) hudTimer.hidden = true;
        if (timerProgressWrap) timerProgressWrap.hidden = true;
        nextQuestion();
      });

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

      // Запуск по умолчанию: открываем лист примеров (режим «Тренажёр»)
      renderSheet();
    })();
