// scripts/make-icons.mjs
// Иконки приложения (PWA) из public/favicon.svg: node scripts/make-icons.mjs
// Рисует их установленный Chrome или Edge в режиме без окна — отдельные
// пакеты для работы с картинками проекту не нужны. Путь к браузеру можно
// задать переменной CHROME.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = fs.readFileSync(path.join(root, 'public/favicon.svg'), 'utf8');
const outDir = path.join(root, 'public/icons');

// logo — доля стороны под эмблему, radius — скругление белой подложки (0 — во всю площадь).
const ICONS = [
  { file: 'icon-192.png', size: 192, logo: 0.74, radius: 0.22 },
  { file: 'icon-512.png', size: 512, logo: 0.74, radius: 0.22 },
  // Android сам вырезает из неё круг или «капсулу»: эмблема держится в центральном круге 80%.
  { file: 'icon-maskable-512.png', size: 512, logo: 0.56, radius: 0 },
  // iPhone скругляет углы сам, а прозрачность заливает чёрным.
  { file: 'apple-touch-icon.png', size: 180, logo: 0.7, radius: 0 }
];

const BROWSERS = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
];
const browser = BROWSERS.find(candidate => candidate && fs.existsSync(candidate));
if (!browser) {
  console.error('❌ Не найден Chrome или Edge — укажите путь в переменной CHROME.');
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mt-icons-'));
fs.mkdirSync(outDir, { recursive: true });

for (const { file, size, logo, radius } of ICONS) {
  const page = path.join(tmp, `${file}.html`);
  fs.writeFileSync(page, `<!doctype html><style>
html,body{margin:0;width:${size}px;height:${size}px;overflow:hidden;background:transparent}
div{width:${size}px;height:${size}px;display:grid;place-items:center;background:#fff;border-radius:${radius * 100}%}
svg{width:${Math.round(size * logo)}px;height:${Math.round(size * logo)}px}
</style><div>${svg}</div>`);
  execFileSync(browser, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--user-data-dir=${path.join(tmp, 'profile')}`, `--window-size=${size},${size}`,
    '--default-background-color=00000000', `--screenshot=${path.join(outDir, file)}`,
    pathToFileURL(page).href
  ], { stdio: 'ignore' });
  console.log(`✅ public/icons/${file}`);
}

fs.rmSync(tmp, { recursive: true, force: true });
