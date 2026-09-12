/* Перенумеровывает темы и подтемы во всех классах подряд:
 *
 * Темы:
 *   - position: 1, 2, 3… N внутри каждого класса (grade)
 *   - Обновляет номер в названии (title / title_lv): "7.1. Название"
 *
 * Подтемы:
 *   - position: 1, 2, 3… M внутри каждой темы
 *   - code: <класс>.<номер_темы>.<номер_подтемы> (например, 7.1.1, 7.1.2)
 *
 * Сухой прогон по умолчанию. Запись: --apply
 * Можно указать конкретный класс: --grade=11
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');
const targetGradeArg = process.argv.find(a => a.startsWith('--grade='));
const TARGET_GRADE = targetGradeArg ? Number(targetGradeArg.split('=')[1]) : null;

const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env'), 'utf8')
    .split(/\r?\n/)
    .filter(l => l && !l.startsWith('#'))
    .map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
if (!KEY) {
  console.error('Ошибка: нет SUPABASE_SERVICE_ROLE_KEY или SUPABASE_ANON_KEY в .env');
  process.exit(1);
}

const H = {
  apikey: KEY,
  Authorization: 'Bearer ' + KEY,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

const getAll = async (path) => {
  const out = [];
  for (let f = 0; ; f += 1000) {
    const res = await fetch(env.SUPABASE_URL + '/rest/v1/' + path, {
      headers: { ...H, Range: `${f}-${f + 999}` }
    });
    if (!res.ok) {
      throw new Error(`Ошибка запроса к ${path}: ${res.status} ${await res.text()}`);
    }
    const part = await res.json();
    out.push(...part);
    if (part.length < 1000) break;
  }
  return out;
};

const чисто = s => String(s || '').replace(/^\s*\d+(\.\d+)*\.?\s*/, '').trim();

console.log('Загрузка тем и подтем из Supabase...');
const [topics, subtopics] = await Promise.all([
  getAll('topics?select=id,title,title_lv,grade,position,slug&order=grade,position,id&limit=2000'),
  getAll('subtopics?select=id,topic_id,title,title_lv,code,position,slug&order=topic_id,position,id&limit=5000'),
]);

console.log(`Загружено: тем — ${topics.length}, подтем — ${subtopics.length}`);

// Группируем подтемы по topic_id
const subsByTopic = new Map();
for (const s of subtopics) {
  if (!subsByTopic.has(s.topic_id)) subsByTopic.set(s.topic_id, []);
  subsByTopic.get(s.topic_id).push(s);
}

// Группируем темы по классу
const topicsByGrade = new Map();
for (const t of topics) {
  const g = t.grade ?? 0;
  if (!topicsByGrade.has(g)) topicsByGrade.set(g, []);
  topicsByGrade.get(g).push(t);
}

const sortedGrades = Array.from(topicsByGrade.keys()).sort((a, b) => a - b);

const topicUpdates = [];
const subtopicUpdates = [];

for (const grade of sortedGrades) {
  if (TARGET_GRADE !== null && grade !== TARGET_GRADE) continue;

  const gradeTopics = topicsByGrade.get(grade);

  // Сортируем темы внутри класса: сначала по position, затем по номеру из заголовка или id
  gradeTopics.sort((a, b) => {
    const posA = a.position ?? 999;
    const posB = b.position ?? 999;
    if (posA !== posB) return posA - posB;
    return a.id - b.id;
  });

  gradeTopics.forEach((t, tIdx) => {
    const newTopicPos = tIdx + 1;
    const cleanTitleRu = чисто(t.title);
    const cleanTitleLv = t.title_lv ? чисто(t.title_lv) : '';

    // Формируем аккуратный заголовок с префиксом "<grade>.<pos>. " если у класса есть номер
    const prefix = grade > 0 ? `${grade}.${newTopicPos}. ` : `${newTopicPos}. `;
    const expectedTitleRu = cleanTitleRu ? `${prefix}${cleanTitleRu}` : t.title;
    const expectedTitleLv = cleanTitleLv ? `${prefix}${cleanTitleLv}` : (t.title_lv || null);

    const topicChanged = t.position !== newTopicPos
      || (t.title && t.title !== expectedTitleRu && /^\s*\d+(\.\d+)/.test(t.title));

    if (t.position !== newTopicPos) {
      topicUpdates.push({
        id: t.id,
        current: { grade, pos: t.position, title: t.title },
        patch: { position: newTopicPos },
      });
    }

    // Подтемы этой темы
    const subs = subsByTopic.get(t.id) || [];
    subs.sort((a, b) => {
      const posA = a.position ?? 999;
      const posB = b.position ?? 999;
      if (posA !== posB) return posA - posB;
      // Если позиции равны, пробуем вытащить последний номер из code вида "7.1.3"
      const numA = Number(String(a.code || '').split('.').pop()) || 999;
      const numB = Number(String(b.code || '').split('.').pop()) || 999;
      if (numA !== numB) return numA - numB;
      return a.id - b.id;
    });

    subs.forEach((s, sIdx) => {
      const newSubPos = sIdx + 1;
      const expectedCode = grade > 0
        ? `${grade}.${newTopicPos}.${newSubPos}`
        : `${newTopicPos}.${newSubPos}`;

      const posDiff = s.position !== newSubPos;
      const codeDiff = s.code !== expectedCode;

      if (posDiff || codeDiff) {
        subtopicUpdates.push({
          id: s.id,
          topic_id: t.id,
          current: { pos: s.position, code: s.code, title: s.title },
          patch: { position: newSubPos, code: expectedCode },
        });
      }
    });
  });
}

console.log('\n' + '─'.repeat(50));
console.log(`ИТОГИ АНАЛИЗА НУМЕРАЦИИ:`);
console.log(`Тем требует обновления:    ${topicUpdates.length}`);
console.log(`Подтем требует обновления: ${subtopicUpdates.length}`);
console.log('─'.repeat(50));

if (topicUpdates.length > 0) {
  console.log('\nПримеры изменений тем (первые 10):');
  for (const u of topicUpdates.slice(0, 10)) {
    console.log(`  • Тема #${u.id} (${u.current.title}): pos ${u.current.pos} -> ${u.patch.position}`);
  }
}

if (subtopicUpdates.length > 0) {
  console.log('\nПримеры изменений подтем (первые 15):');
  for (const u of subtopicUpdates.slice(0, 15)) {
    console.log(`  • Подтема #${u.id} («${u.current.title}»): pos ${u.current.pos} -> ${u.patch.position}, code "${u.current.code}" -> "${u.patch.code}"`);
  }
}

if (!APPLY) {
  console.log('\n[!] Это был сухой прогон. Чтобы применить нумерацию в Supabase, запустите:');
  console.log('    npm run renumber:topics:apply\n');
} else {
  console.log('\nПрименение изменений в базе данных Supabase...');

  let updatedTopics = 0;
  for (const u of topicUpdates) {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/topics?id=eq.${u.id}`, {
      method: 'PATCH',
      headers: H,
      body: JSON.stringify(u.patch),
    });
    if (!res.ok) {
      console.error(`Ошибка при обновлении темы #${u.id}:`, res.status, await res.text());
    } else {
      updatedTopics++;
    }
  }

  let updatedSubs = 0;
  for (const u of subtopicUpdates) {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/subtopics?id=eq.${u.id}`, {
      method: 'PATCH',
      headers: H,
      body: JSON.stringify(u.patch),
    });
    if (!res.ok) {
      console.error(`Ошибка при обновлении подтемы #${u.id}:`, res.status, await res.text());
    } else {
      updatedSubs++;
    }
  }

  console.log(`\nУспешно обновлено: тем — ${updatedTopics} из ${topicUpdates.length}, подтем — ${updatedSubs} из ${subtopicUpdates.length}`);

  // Запускаем пересборку локального кэша каталога
  console.log('\nПересборка skola2030_topics.json...');
  try {
    spawnSync('node', ['scripts/sync-catalog-from-db.mjs'], { stdio: 'inherit', cwd: ROOT });
  } catch (e) {
    console.warn('Не удалось автоматически вызвать sync-catalog-from-db.mjs:', e.message);
  }

  console.log('\nГотово!');
}
