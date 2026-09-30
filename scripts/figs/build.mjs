/*
 * Сборка чертежей к задачам: node scripts/figs/build.mjs specs8a [specs8b …]
 *
 * Читает файлы specs*.mjs (id задачи → функция, возвращающая рисунок Fig из figlib.mjs),
 * рисует SVG, проверяет тем же разбором, что и админка (lib.drawingIssues, lib.sanitizeSvg),
 * пишет out/task-<id>-v1.svg и листы просмотра out/sheet-<имя>-<страница>.html
 * (по 12 чертежей на страницу; если есть out/candidates.json — с подписью-условием).
 * Загрузка в базу — upload.mjs.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const OUT = join(HERE, 'out');
mkdirSync(OUT, { recursive: true });
new Function(readFileSync(join(ROOT, 'public/lib.js'), 'utf8'))();
const lib = globalThis.MathTasksLib;
const candFile = join(OUT, 'candidates.json');
const cand = existsSync(candFile) ? Object.fromEntries(JSON.parse(readFileSync(candFile, 'utf8')).map(r => [r.id, r])) : {};

const names = process.argv.slice(2);
if (!names.length) { console.log('Укажите файлы: node scripts/figs/build.mjs specs8a specs9c'); process.exit(1); }
const PER = 12;
let total = 0, bad = 0;
for (const name of names) {
  const specs = (await import(pathToFileURL(join(HERE, name + '.mjs')).href)).default;
  const cards = [];
  for (const [id, fn] of Object.entries(specs)) {
    let svg;
    try { svg = fn().render(); } catch (e) { console.log(`#${id}: ОШИБКА построения — ${e.message}`); bad++; continue; }
    const clean = lib.sanitizeSvg(svg);
    const issue = lib.drawingIssues(svg);
    if (clean.error || issue) { console.log(`#${id}: ${clean.error || issue}`); bad++; }
    if (/\n/.test(svg)) { console.log(`#${id}: перевод строки в SVG`); bad++; }
    writeFileSync(join(OUT, `task-${id}-v1.svg`), svg);
    total++;
    const c = cand[id];
    cards.push(`<div class="card"><div class="img">${svg}</div><div class="cap"><b>#${id}</b> ${c ? c.code : ''}<br>${c ? c.c.replace(/</g, '&lt;').slice(0, 95) : ''}</div></div>`);
  }
  for (let p = 0; p * PER < cards.length; p++) {
    const html = `<!doctype html><meta charset="utf-8"><title>${name} ${p + 1}</title><style>
body{font:12px system-ui;margin:6px;background:#fff;color:#111}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.card{border:1px solid #ccc;border-radius:5px;padding:4px;background:#fff}
.img svg{width:100%;height:auto;display:block;background:#fff}
.cap{font-size:10px;line-height:1.25;margin-top:2px;color:#333;height:38px;overflow:hidden}
</style><div class="grid">${cards.slice(p * PER, (p + 1) * PER).join('')}</div>`;
    writeFileSync(join(OUT, `sheet-${name}-${p + 1}.html`), html);
  }
  console.log(`  ${name}: чертежей ${cards.length}, страниц просмотра ${Math.ceil(cards.length / PER)}`);
}
console.log(`собрано: ${total}; проблем: ${bad}`);
if (bad) process.exitCode = 1;
