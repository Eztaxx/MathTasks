/*
 * Какие задачи ждут чертежа: node scripts/figs/candidates.mjs [классы через запятую, по умолчанию 8,9]
 *
 * Берёт опубликованные задачи без condition_image, в условии которых есть геометрическая лексика
 * (фильтр широкий — часть найденного чертежа не требует), печатает счёт по подтемам и пишет
 * out/candidates.json: build.mjs подпишет им листы просмотра.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { fetchAll } from '../lib/fetch-all.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const OUT = join(HERE, 'out');
mkdirSync(OUT, { recursive: true });
const env = Object.fromEntries(readFileSync(join(ROOT, '.env'), 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; }));
const KEY = env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const U = env.SUPABASE_URL + '/rest/v1/';
const grades = (process.argv[2] || '8,9').split(',').map(Number);

const rows = await fetchAll(U + `tasks?select=id,grade,subtopic_id,title,condition_latex,condition_image&is_published=eq.true&grade=in.(${grades.join(',')})&order=id`, H);
const subs = await fetchAll(U + 'subtopics?select=id,code,title&order=id', H);
const subMap = Object.fromEntries(subs.map(s => [s.id, s]));
const GEO = /треугольник|трапец|параллелограмм|ромб|прямоугольник|квадрат[ае]?\b|окружност|круг|призм|цилиндр|параллелепипед|хорд|касательн|вписан|описан|диагонал|биссектрис|высот|медиан|многоугольник|шестиугольник|четырёхугольник|отрезк|секущ|параллельн|перпендикуляр|катет|гипотенуз/i;
const cand = rows.filter(r => !r.condition_image && GEO.test(r.condition_latex));
console.log(`Задач в классах ${grades}: ${rows.length}; уже с чертежом: ${rows.filter(r => r.condition_image).length}; кандидатов без чертежа: ${cand.length}`);
const bySub = {};
for (const r of cand) (bySub[r.subtopic_id] ||= []).push(r);
for (const [sid, list] of Object.entries(bySub)) console.log(`  ${subMap[sid]?.code} ${String(subMap[sid]?.title).slice(0, 48)}: ${list.length}`);
writeFileSync(join(OUT, 'candidates.json'), JSON.stringify(cand.map(r => ({ id: r.id, grade: r.grade, sub: r.subtopic_id, code: subMap[r.subtopic_id]?.code, title: r.title, c: r.condition_latex.replace(/\s+/g, ' ') })), null, 1));
