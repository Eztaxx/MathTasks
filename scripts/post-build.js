// scripts/post-build.js
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const indexPath = path.join(distDir, 'index.html');
const fallbackPath = path.join(distDir, '200.html');

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, fallbackPath);
  console.log('✅ scripts/post-build.js: dist/200.html created for Cloudflare Pages SPA.');
}

const redirectsPath = path.join(distDir, '_redirects');
if (fs.existsSync(redirectsPath)) {
  fs.unlinkSync(redirectsPath);
  console.log('⛕ scripts/post-build.js: dist/_redirects removed.');
}

/* Номер сборки в service worker — хеш всех файлов сборки. Браузер
   обновляет воркер, только если изменился сам sw.js; с номером каждая
   выкладка заново скачивает страницы для работы без сети, а сборка без
   изменений даёт тот же номер и лишний раз ничего не качает. */
const swPath = path.join(distDir, 'sw.js');
if (fs.existsSync(swPath)) {
  const hash = crypto.createHash('sha256');
  const files = fs.readdirSync(distDir, { recursive: true })
    .map(name => name.split(path.sep).join('/'))
    .filter(name => name !== 'sw.js' && fs.statSync(path.join(distDir, name)).isFile())
    .sort();
  for (const name of files) hash.update(name).update(fs.readFileSync(path.join(distDir, name)));
  const build = hash.digest('hex').slice(0, 12);
  const source = fs.readFileSync(swPath, 'utf8');
  // Метки нет — номер уже подставлен прошлым запуском (сама метка в public/sw.js проверяется тестом).
  if (source.includes("'__BUILD__'")) {
    fs.writeFileSync(swPath, source.replace("'__BUILD__'", `'${build}'`));
    console.log(`✅ scripts/post-build.js: dist/sw.js — сборка ${build}.`);
  }
}
