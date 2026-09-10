/* Перенумеровывает задачи внутри каждой темы подряд: 1, 2, 3… N.
 *
 * Нумерация обнуляется с каждой новой ТЕМОЙ.
 * Порядок задач внутри темы:
 *   1. Номер подтемы (subtopic.position: 1, 2, 3…)
 *   2. Позиция задачи (task.position)
 *   3. Дата создания (created_at) / id
 *
 * Если задача добавлена в середину темы/подтемы, её номер
 * выстраивается строго относительно порядка задач этой темы,
 * а все последующие сдвигаются.
 *
 * Сухой прогон по умолчанию. Запись: --apply
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
const KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY;
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

console.log('Загрузка данных из Supabase...');
const [topics, tasks, subs] = await Promise.all([
  getAll('topics?select=id,title,grade,position&order=grade,position&limit=1000'),
  getAll('tasks?select=id,topic_id,subtopic_id,grade,position,created_at&limit=5000'),
  getAll('subtopics?select=id,topic_id,position,code&limit=2000'),
]);

const topicMap = new Map(topics.map(t => [t.id, t]));
const subMap = new Map(subs.map(s => [s.id, s]));

// Группируем задачи по темам
const tasksByTopic = new Map();
let unassigned = 0;

for (const t of tasks) {
  if (!t.topic_id) {
    unassigned++;
    continue;
  }
  if (!tasksByTopic.has(t.topic_id)) tasksByTopic.set(t.topic_id, []);
  tasksByTopic.get(t.topic_id).push(t);
}

// Сортируем темы по классу и позиции в программе
const sortedTopicIds = Array.from(tasksByTopic.keys()).sort((a, b) => {
  const tA = topicMap.get(a);
  const tB = topicMap.get(b);
  const gA = tA?.grade ?? 999;
  const gB = tB?.grade ?? 999;
  if (gA !== gB) return gA - gB;
  const pA = tA?.position ?? 999;
  const pB = tB?.position ?? 999;
  if (pA !== pB) return pA - pB;
  return a - b;
});

const allChanges = [];
let topicsWithDups = 0;

console.log(`\nОбработка ${sortedTopicIds.length} тем с задачами...\n`);

for (const topicId of sortedTopicIds) {
  const list = tasksByTopic.get(topicId);
  const topic = topicMap.get(topicId);
  const topicTitle = topic ? `${topic.grade}.${topic.position} «${topic.title}»` : `Тема #${topicId}`;

  // Сортировка: подтема -> позиция -> created_at -> id
  list.sort((a, b) => {
    const subA = subMap.get(a.subtopic_id)?.position ?? 999;
    const subB = subMap.get(b.subtopic_id)?.position ?? 999;
    if (subA !== subB) return subA - subB;

    const posA = a.position ?? 9999;
    const posB = b.position ?? 9999;
    if (posA !== posB) return posA - posB;

    return String(a.created_at || '').localeCompare(String(b.created_at || '')) || a.id - b.id;
  });

  const oldPositions = list.map(t => t.position);
  const hasDups = new Set(oldPositions).size !== oldPositions.length;
  if (hasDups) topicsWithDups++;

  let topicChanges = 0;
  list.forEach((task, index) => {
    const newPos = index + 1; // Обнуление с каждой новой ТЕМОЙ: 1, 2, 3...
    if (task.position !== newPos) {
      allChanges.push({
        id: task.id,
        topicId: task.topic_id,
        was: task.position,
        now: newPos
      });
      topicChanges++;
    }
  });

  if (topicChanges > 0 || hasDups) {
    console.log(`  • ${topicTitle.slice(0, 52).padEnd(52)}: ${list.length} зад. -> № 1..${list.length}${hasDups ? ' (были дубли номеров)' : ''}`);
  }
}

console.log(`\n────────────────────────────────────────`);
console.log(`Тем с задачами: ${tasksByTopic.size}`);
console.log(`Тем с дублями/нарушенным порядком: ${topicsWithDups}`);
console.log(`Всего задач: ${tasks.length}`);
if (unassigned > 0) console.log(`Задач без темы: ${unassigned}`);
console.log(`Задач, требующих обновления номера: ${allChanges.length}`);

if (!APPLY) {
  console.log('\n[!] Это был сухой прогон. Чтобы применить нумерацию 1..N по темам, запустите:');
  console.log('    node scripts/renumber-tasks.mjs --apply');
} else {
  console.log('\nПрименение изменений в базе данных Supabase...');

  // Группируем по id и обновляем
  let updatedCount = 0;
  
  // Для надежности обновляем пачками по задаче или небольшими группами
  for (let i = 0; i < allChanges.length; i += 50) {
    const batch = allChanges.slice(i, i + 50);
    await Promise.all(batch.map(async ch => {
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/tasks?id=eq.${ch.id}`, {
        method: 'PATCH',
        headers: H,
        body: JSON.stringify({ position: ch.now }),
      });
      if (res.ok) {
        updatedCount++;
      } else {
        console.error(`Ошибка обновления задачи #${ch.id}: ${res.status}`);
      }
    }));
    process.stdout.write(`  Обновлено ${Math.min(i + 50, allChanges.length)} / ${allChanges.length}...\r`);
  }

  console.log(`\nУспешно обновлено задач в базе: ${updatedCount} из ${allChanges.length}`);
}
