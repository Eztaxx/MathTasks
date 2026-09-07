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
        mockExams: resolve(__dirname, 'mock-exams.html')
      }
    }
  }
});
