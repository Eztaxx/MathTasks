import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Сайт многостраничный: публичная часть и отдельная админ-панель.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html')
      }
    }
  }
});
