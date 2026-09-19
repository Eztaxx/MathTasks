/* Картинка превью ссылки (node scripts/make-og-cover.cjs): 1200×630, как ждут Facebook, WhatsApp и Telegram.
   Рисуется из того же логотипа и тех же цветов, что на сайте. */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');

const LOGO = fs.readFileSync(path.join(ROOT, 'public/favicon.svg'), 'utf8')
  .replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const chip = (x, text) => {
  const width = text.length * 17 + 46;
  return `<g>
    <rect x="${x}" y="470" width="${width}" height="56" rx="28" fill="#ffffff" fill-opacity="0.10" stroke="#7fb0ff" stroke-opacity="0.45"/>
    <text x="${x + width / 2}" y="507" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="600" fill="#cfe0ff">${text}</text>
  </g>`;
};

const chips = ['1.–9. klase', 'Optimālais', 'Augstākais', 'Kontroldarbi'];
let x = 96;
const chipHtml = chips.map(text => {
  const html = chip(x, text);
  x += text.length * 17 + 46 + 18;
  return html;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0d2456"/>
      <stop offset="1" stop-color="#1c4498"/>
    </linearGradient>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M60 0H0V60" fill="none" stroke="#ffffff" stroke-opacity="0.06" stroke-width="1.5"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect x="0" y="0" width="1200" height="8" fill="#1764ff"/>

  <g transform="translate(96, 104) scale(3.1)">${LOGO}</g>

  <text x="270" y="200" font-family="Segoe UI, Arial, sans-serif" font-size="92" font-weight="700" fill="#ffffff">MathTasks</text>
  <text x="274" y="258" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="400" fill="#9dbdff">Skola2030 · mathtasks.lv</text>

  <text x="96" y="380" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="600" fill="#ffffff">Skolas matemātikas uzdevumi ar atbildēm un risinājumiem</text>
  <text x="96" y="432" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="400" fill="#bcd3ff">Задачи по школьной математике с ответами и разбором</text>

  ${chipHtml}
</svg>`;

sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toFile(path.join(ROOT, 'public/og-cover.png'))
  .then(info => console.log('og-cover.png:', info.width + '×' + info.height, Math.round(info.size / 1024) + ' КБ'))
  .catch(error => { console.error('не отрисовалось:', error.message); process.exit(1); });
