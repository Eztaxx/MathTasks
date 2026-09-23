import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Сайт многостраничный: публичная часть и отдельная админ-панель.
export default defineConfig({
  plugins: [],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        trainer: resolve(__dirname, 'trainer.html'),
        exams: resolve(__dirname, 'exams.html'),
        mockExams: resolve(__dirname, 'mock-exams.html'),
        plotter: resolve(__dirname, 'plotter.html'),
        duel: resolve(__dirname, 'duel.html')
      }
    }
  },
  test: {
    /* Соседние сессии держат рабочие деревья в .claude/worktrees, и vitest
       прогонял их копии тестов вместе с нашими: 87 файлов вместо 23 и чужие
       красные тесты из незаконченной работы. Первые два пункта — умолчания
       vitest; configDefaults не импортируем, чтобы сборка сайта не тянула
       vitest/config. */
    exclude: ['**/node_modules/**', '**/.git/**', '.claude/**']
  }
});
