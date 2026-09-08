/* Логика страницы exams.html.
   Вынесена из встроенного <script>: политика безопасности сайта
   (script-src 'self') запрещает выполнять встроенные скрипты, и
   страница молча переставала работать. */
(() => {
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
      window.MathTasksLib?.initExamTimerUi();
    })();
