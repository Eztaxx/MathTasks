/* Перенумеровывает задачи внутри тем подряд: 1, 2, 3…
 *
 * Номер задачи на сайте — это её position. При слиянии тем задачи
 * приходили со своими старыми позициями, и в новой теме несколько задач
 * оказывались первыми: полоса «К задаче» показывала «1 1 1 1».
 *
 * Порядок сохраняем прежний — сначала по position, потом по id, — чтобы
 * задачи не перескакивали местами, а только получили разные номера.
 *
 * Сухой прогон по умолчанию, запись: --apply
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');

const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env'), 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error('нет SUPABASE_SERVICE_ROLE_KEY в .env'); process.exit(1); }
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

const getAll = async (path) => {
  const out = [];
  for (let f = 0; ; f += 1000) {
    const res = await fetch(env.SUPABASE_URL + '/rest/v1/' + path, { headers: { ...H, Range: `${f}-${f + 999}` } });
    const part = await res.json();
    out.push(...part);
    if (part.length < 1000) break;
  }
  return out;
};

const [topics, tasks] = await Promise.all([
  getAll('topics?select=id,title,grade,position&limit=1000'),
  getAll('tasks?select=id,topic_id,position,created_at&limit=2000'),
]);
const темаПоId = new Map(topics.map(t => [t.id, t]));

const поТемам = new Map();
for (const t of tasks) {
  if (!t.topic_id) continue;
  if (!поТемам.has(t.topic_id)) поТемам.set(t.topic_id, []);
  поТемам.get(t.topic_id).push(t);
}

const правки = [];
const темыСДублями = [];
for (const [topicId, список] of поТемам) {
  список.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)
    || String(a.created_at).localeCompare(String(b.created_at))
    || a.id - b.id);
  const позиции = список.map(t => t.position);
  if (new Set(позиции).size !== позиции.length) темыСДублями.push(topicId);
  список.forEach((t, i) => {
    if (t.position !== i + 1) правки.push({ id: t.id, было: t.position, стало: i + 1, topicId });
  });
}

console.log(`тем с задачами: ${поТемам.size}, задач: ${tasks.filter(t => t.topic_id).length}`);
console.log(`тем, где номера повторялись: ${темыСДублями.length}`);
console.log(`задач к перенумерации: ${правки.length}`);

console.log('\n── Темы с повторяющимися номерами ──');
темыСДублями.slice(0, 20).forEach(id => {
  const t = темаПоId.get(id);
  console.log(`  ${t ? `${t.grade}.${t.position}` : '?'}  «${(t?.title || '').slice(0, 52)}» — задач ${поТемам.get(id).length}`);
});
if (темыСДублями.length > 20) console.log(`  … ещё ${темыСДублями.length - 20}`);

if (!APPLY) { console.log('\nСухой прогон. Запись: --apply'); process.exit(0); }

console.log('\n=== запись ===');
/* Группируем по новому номеру: один PATCH на номер вместо сотен. */
const поНомеру = new Map();
for (const p of правки) {
  if (!поНомеру.has(p.стало)) поНомеру.set(p.стало, []);
  поНомеру.get(p.стало).push(p.id);
}
let n = 0;
for (const [pos, ids] of [...поНомеру].sort((a, b) => a[0] - b[0])) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/tasks?id=in.(${ids.join(',')})`, {
    method: 'PATCH', headers: H, body: JSON.stringify({ position: pos }),
  });
  if (!res.ok) { console.log(`✗ position ${pos}: ${res.status} ${(await res.text()).slice(0, 120)}`); continue; }
  n += ids.length;
}
console.log(`перенумеровано задач: ${n}`);
