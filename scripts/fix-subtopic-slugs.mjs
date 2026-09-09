/* Чинит слаги подтем 1–9 классов.
 *
 * При заливке слаг собирался из русского названия, а из него оставляли
 * только латиницу и цифры — от русского не оставалось ничего, и адрес
 * выходил вида /subtopic/-6-1-1. Пересобираем из латышского названия,
 * как это уже делается для старшей школы.
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

/* Транслитерация кириллицы нужна для подтем, у которых нет латышского
   названия: иначе они снова остались бы без слага. */
const КИР = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ы: 'y', э: 'e',
  ю: 'yu', я: 'ya', ь: '', ъ: '',
};

const слаг = s => String(s || '')
  .toLowerCase()
  .split('').map(c => КИР[c] ?? c).join('')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 50)
  .replace(/-$/, '');

const subs = await getAll('subtopics?select=id,code,slug,title,title_lv&limit=2000');
const занятые = new Set(subs.map(s => s.slug));

/* Чинить надо те, у кого от названия в слаге ничего не осталось: слаг
   начинается с дефиса или состоит из одних цифр и дефисов. */
const битые = subs.filter(s => /^-/.test(s.slug || '') || /^[\d-]+$/.test(s.slug || ''));

console.log(`подтем всего: ${subs.length}, с пустым слагом: ${битые.length}`);
if (!битые.length) { console.log('чинить нечего'); process.exit(0); }

const план = [];
for (const s of битые) {
  const основа = слаг(s.title_lv) || слаг(s.title) || 'apakstema';
  const хвост = String(s.code || s.id).replace(/\./g, '-');
  let кандидат = `${основа}-${хвост}`;
  /* Слаг уникален по всей таблице: если совпал — добавляем id. */
  if (занятые.has(кандидат) && кандидат !== s.slug) кандидат = `${основа}-${хвост}-${s.id}`;
  занятые.delete(s.slug);
  занятые.add(кандидат);
  план.push({ id: s.id, было: s.slug, стало: кандидат });
}

console.log('\n── Первые 15 ──');
план.slice(0, 15).forEach(p => console.log(`  ${p.было}\n    → ${p.стало}`));

if (!APPLY) { console.log('\nСухой прогон. Запись: --apply'); process.exit(0); }

console.log('\n=== запись ===');
let n = 0;
for (const p of план) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/subtopics?id=eq.${p.id}`, {
    method: 'PATCH', headers: H, body: JSON.stringify({ slug: p.стало }),
  });
  if (!res.ok) { console.log(`✗ #${p.id}: ${res.status} ${(await res.text()).slice(0, 120)}`); continue; }
  n++;
}
console.log(`переименовано: ${n} из ${план.length}`);
