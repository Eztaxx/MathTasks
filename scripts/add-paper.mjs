/*
 * Собранная контрольная из файла: задания + рисунки + работа (exam_papers, kind = 'cw').
 *
 *   node scripts/add-paper.mjs <папка>              — офлайн-проверки и превью, база не трогается, .env не нужен
 *   node scripts/add-paper.mjs <папка> --apply             — проверки базы, загрузка SVG, вставка заданий-черновиков
 *                                                            и работ-черновиков (is_published = false), state/inserted.json
 *   node scripts/add-paper.mjs <папка> --apply --publish   — перечитать из базы, сверить с файлом, опубликовать работы
 *                                                            и проверить, что посетитель их видит (иначе — снять публикацию)
 *   node scripts/add-paper.mjs <папка> --apply --rollback  — удалить всё, что записано по state/inserted.json
 *                                                            (после сбоя --apply или чтобы переписать работу)
 *
 * Все шаги, которые пишут в базу, идут с --apply: страж (.claude/hooks/guard-prod.mjs) спрашивает владельца.
 *
 * <папка> — например scripts/papers/kd-varbutiba-statistika: в ней paper.json (собирает build.py) и verify.py.
 *
 * Проверки, вставка, публикация и откат — в scripts/lib/paper-core.mjs (их же зовёт автопоток
 * контрольных .claude/skills/add-papers). Проверки до записи: обязательные поля, парные $, «%» только
 * в формуле, KaTeX сайта без ошибок, робот сайта (lib.taskIssues), ответ сверяется автоматически;
 * verify.py независимо пересчитывает ответ, сайт принимает это значение как ответ ученика, а значение
 * на единицу больше — нет; SVG проходит sanitizeSvg без изменений и drawingIssues, не больше 8000 знаков.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { checkPaper, allTasks, dbContext, insertPaper, rollbackPaper, publishPaper } from './lib/paper-core.mjs';
import { exitSafely } from './lib/exit-safely.mjs';

const args = process.argv.slice(2);
const dirArg = args.find(a => !a.startsWith('--'));
const APPLY = args.includes('--apply');
const PUBLISH = args.includes('--publish');
const ROLLBACK = args.includes('--rollback');
const unknown = args.filter(a => a.startsWith('--') && !['--apply', '--publish', '--rollback'].includes(a));
if (!dirArg || unknown.length || ((PUBLISH || ROLLBACK) && !APPLY) || (PUBLISH && ROLLBACK)) {
  console.log('использование: node scripts/add-paper.mjs <папка> [--apply [--publish | --rollback]]');
  process.exit(1);
}
const INSERT = APPLY && !PUBLISH && !ROLLBACK;
const DIR = resolve(dirArg);

// ── 1. Офлайн-проверки (всегда) ──
const data = JSON.parse(readFileSync(join(DIR, 'paper.json'), 'utf8'));
const problems = checkPaper(DIR, data);
console.log(`работ ${data.papers.length}, заданий ${allTasks(data).length}, рисунков ${Object.keys(data.figures || {}).length}; проблем: ${problems.length}`);
for (const p of problems) console.log('  ' + p);
if (problems.length) process.exit(2);
if (!APPLY) {
  console.log(`офлайн-проверки чисты; превью: ${join(DIR, 'state', 'preview.html')}`);
  console.log(`дальше: node scripts/add-paper.mjs ${dirArg} --apply`);
  process.exit(0);
}

// ── 2. База (нужен .env с SUPABASE_SERVICE_ROLE_KEY) ──
let db;
try { db = await dbContext(); } catch (e) { console.log(e.message); process.exit(1); }

if (INSERT) {
  const { code, reason } = await insertPaper(DIR, data, db);
  if (reason === 'exists') console.log(`дальше: node scripts/add-paper.mjs ${dirArg} --apply --publish, или --apply --rollback, чтобы начать заново`);
  if (reason === 'failed') console.log(`Откат: node scripts/add-paper.mjs ${dirArg} --apply --rollback`);
  if (code) await exitSafely(code);
  console.log(`проверить: node scripts/audit-tasks.mjs --drafts --grade ${data.grade}; затем node scripts/add-paper.mjs ${dirArg} --apply --publish`);
}

if (ROLLBACK) {
  const { code } = await rollbackPaper(DIR, db);
  if (code) await exitSafely(code);
}

if (PUBLISH) {
  const { code } = await publishPaper(DIR, data, db);
  if (code) await exitSafely(code);
  console.log('готово: https://mathtasks.lv/control-works');
}
