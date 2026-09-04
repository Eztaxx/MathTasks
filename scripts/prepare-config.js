// scripts/prepare-config.js
// Автоматическая подготовка public/config.js перед vite build
// Если проект собирается в Cloudflare Pages / CI / Vercel, где public/config.js в .gitignore,
// этот скрипт генерирует его из переменных окружения SUPABASE_URL и SUPABASE_KEY (или SUPABASE_ANON_KEY).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, '../public/config.js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!fs.existsSync(configPath)) {
  if (supabaseUrl && supabaseKey) {
    const content = `window.SUPABASE_CONFIG = {
  url: ${JSON.stringify(supabaseUrl)},
  publishableKey: ${JSON.stringify(supabaseKey)}
};
`;
    fs.writeFileSync(configPath, content, 'utf8');
    console.log('✓ scripts/prepare-config.js: public/config.js успешно создан из переменных окружения.');
  } else {
    console.warn('⚠ scripts/prepare-config.js: public/config.js отсутствует и переменные SUPABASE_URL / SUPABASE_KEY не заданы.');
  }
} else {
  console.log('✓ scripts/prepare-config.js: локальный public/config.js уже существует, пропуск генерации.');
}
