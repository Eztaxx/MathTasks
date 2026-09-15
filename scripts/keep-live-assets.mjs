/* Перед выкладкой кладёт в dist файлы сборки той версии, что сейчас на сайте.

   Cloudflare при выкладке сразу удаляет прежние файлы, а новая страница
   расходится по серверам не мгновенно: несколько секунд посетителю ещё
   отдаётся старая, и она ссылается на assets/style-<старый хеш>.css, которого
   уже нет. Вместо CSS приходит HTML-страница, и сайт показывается без стилей.

   Файлы с хешем в имени неизменны, поэтому держать прошлую версию рядом
   безопасно. При следующей выкладке она уйдёт — хранится одна версия назад.

   Запуск: node scripts/keep-live-assets.mjs [папка сборки, по умолчанию dist].
   Сайт не ответил или сети нет — выкладку не останавливаем, только пишем. */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ORIGIN = process.env.LIVE_ORIGIN || 'https://mathtasks.lv';
const DIST = process.argv[2] || 'dist';
const PAGES = ['/', '/lv/', '/admin.html', '/trainer.html', '/exams.html', '/mock-exams.html'];
const ASSET = /(?:^|["'(\s=])\/?(assets\/[\w.-]+\.(?:css|js))/g;
const TIMEOUT_MS = 15000;

const bust = path => `${ORIGIN}${path}${path.includes('?') ? '&' : '?'}keep=${Date.now()}`;

const found = new Set();
for (const page of PAGES) {
  try {
    const res = await fetch(bust(page), { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) continue;
    for (const match of (await res.text()).matchAll(ASSET)) found.add(match[1]);
  } catch (error) {
    console.warn(`keep-live-assets: ${page} не ответил — ${error.message}`);
  }
}

let kept = 0;
for (const asset of found) {
  const target = join(DIST, asset);
  if (existsSync(target)) continue; // тот же файл есть и в новой сборке
  try {
    const res = await fetch(`${ORIGIN}/${asset}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    // Пропавший файл Cloudflare отдаёт главной страницей с кодом 200 — такой не берём.
    if (!res.ok || (res.headers.get('content-type') || '').includes('text/html')) {
      console.warn(`keep-live-assets: ${asset} на сайте уже нет`);
      continue;
    }
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, Buffer.from(await res.arrayBuffer()));
    kept++;
  } catch (error) {
    console.warn(`keep-live-assets: ${asset} не скачался — ${error.message}`);
  }
}

console.log(`keep-live-assets: живые страницы ссылаются на ${found.size} файл(ов), из прошлой версии добавлено ${kept}`);
