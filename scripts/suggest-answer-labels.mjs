/*
 * Подписи к полям ответа: что можно проставить автоматически.
 *
 * Ученик должен вписывать только число, а что именно — говорит подпись над
 * полем: «Периметр =», «Время =», «AB =». Подпись берётся из ответа, но у
 * большинства задач ответ — голое значение, и подписи нет.
 *
 * Скрипт читает условие, ищет, какую величину спрашивают, и предлагает
 * переписать ответ как «Периметр = 48 см». Ничего не меняет без --apply:
 * по умолчанию это отчёт для глаз, потому что имя величины — смысл задачи,
 * и ошибиться здесь хуже, чем не подписать вовсе.
 *
 * Запуск:
 *   node scripts/suggest-answer-labels.mjs            — отчёт
 *   node scripts/suggest-answer-labels.mjs --limit 40 — больше примеров
 *   node scripts/suggest-answer-labels.mjs --apply    — записать в базу
 *
 * Перед --apply сделайте копию: npm run backup
 */

import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const LIMIT = argv.includes('--limit') ? Number(argv[argv.indexOf('--limit') + 1]) : 20;

function loadEnv() {
  return Object.fromEntries(
    readFileSync(ROOT + '.env', 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'))
      .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
  );
}

new Function(readFileSync(ROOT + 'public/lib.js', 'utf8'))();
const lib = globalThis.MathTasksLib;

/* Величины, которые спрашивают в условии. Слева — как пишут в задаче
   (винительный падеж и прочие формы), справа — как подписать поле. */
const NOUNS = [
  [/(?<!\p{L})(?:периметр\p{L}*)(?!\p{L})/iu, 'Периметр'],
  [/(?<!\p{L})(?:площад[ьи]\p{L}*)(?!\p{L})/iu, 'Площадь'],
  [/(?<!\p{L})(?:объ[её]м\p{L}*)(?!\p{L})/iu, 'Объём'],
  [/(?<!\p{L})(?:длин[ауы])(?!\p{L})/iu, 'Длина'],
  [/(?<!\p{L})(?:ширин[ауы])(?!\p{L})/iu, 'Ширина'],
  [/(?<!\p{L})(?:высот[ауы])(?!\p{L})/iu, 'Высота'],
  [/(?<!\p{L})(?:радиус\p{L}*)(?!\p{L})/iu, 'Радиус'],
  [/(?<!\p{L})(?:диаметр\p{L}*)(?!\p{L})/iu, 'Диаметр'],
  [/(?<!\p{L})(?:масс[ауы])(?!\p{L})/iu, 'Масса'],
  [/(?<!\p{L})(?:скорост[ьи])(?!\p{L})/iu, 'Скорость'],
  [/(?<!\p{L})(?:врем[яени]|времени)(?!\p{L})/iu, 'Время'],
  [/(?<!\p{L})(?:расстояни[еяю])(?!\p{L})/iu, 'Расстояние'],
  [/(?<!\p{L})(?:масштаб\p{L}*)(?!\p{L})/iu, 'Масштаб'],
  [/(?<!\p{L})(?:стоимост[ьи])(?!\p{L})/iu, 'Стоимость'],
  [/(?<!\p{L})(?:цен[ауы])(?!\p{L})/iu, 'Цена'],
  [/(?<!\p{L})(?:градусн\p{L}+ мер\p{L}*|угол|угла)(?!\p{L})/iu, 'Угол'],
  [/(?<!\p{L})(?:сумм[ауы])(?!\p{L})/iu, 'Сумма'],
  [/(?<!\p{L})(?:произведени[еяю])(?!\p{L})/iu, 'Произведение'],
  [/(?<!\p{L})(?:разност[ьи])(?!\p{L})/iu, 'Разность'],
  [/(?<!\p{L})(?:частное)(?!\p{L})/iu, 'Частное'],
  [/(?<!\p{L})(?:вероятност[ьи])(?!\p{L})/iu, 'Вероятность'],
  [/(?<!\p{L})(?:медиан[ауы])(?!\p{L})/iu, 'Медиана'],
  [/(?<!\p{L})(?:размах\p{L}*)(?!\p{L})/iu, 'Размах'],
  [/(?<!\p{L})(?:количеств[оа])(?!\p{L})/iu, 'Количество'],
  [/(?<!\p{L})(?:средне[ег]\p{L}* арифметическо\p{L}*)(?!\p{L})/iu, 'Среднее арифметическое']
];

const ASK = /(?:найдите|найти|вычислите|определите|чему равн\w*|посчитайте|укажите)([^.?!]{0,90})/i;

/* Что спрашивают. Сначала имя в формуле — «Найдите $AB$», потом слово. */
function suggestLabel(condition) {
  const ask = ASK.exec(String(condition || ''));
  if (!ask) return null;
  const tail = ask[1];

  const formula = /\$([^$]{1,14})\$/.exec(tail);
  if (formula) {
    const name = formula[1].trim();
    /* Имя величины — латиница или команда LaTeX: «AB», «\angle A», «x_1».
       Кириллица внутри долларов — это кусок текста, случайно попавший в
       формулу («$на отрезке$»), и именем он быть не может. */
    if (/^[\\{}A-Za-z_^\s0-9]+$/.test(name) && /[A-Za-z]/.test(name)) {
      return { label: name, kind: 'формула' };
    }
  }
  /* Берём слово, которое стоит ближе к «Найдите»: в условии их бывает
     несколько («найдите объём и площадь поверхности»). */
  let best = null;
  for (const [re, label] of NOUNS) {
    const at = tail.search(re);
    if (at >= 0 && (!best || at < best.at)) best = { at, label };
  }
  return best ? { label: best.label, kind: 'слово' } : null;
}

// «48\text{ см}» + «Периметр» → «$\text{Периметр} = 48\text{ см}$».
function withLabel(answer, suggestion) {
  const inner = String(answer).trim().replace(/^\$+|\$+$/g, '').trim();
  const name = suggestion.kind === 'формула' ? suggestion.label : `\\text{${suggestion.label}}`;
  return `$${name} = ${inner}$`;
}

async function main() {
  const env = loadEnv();
  const key = APPLY ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_ANON_KEY;
  const H = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
  const res = await fetch(env.SUPABASE_URL + '/rest/v1/tasks?select=id,title,condition_latex,answer_latex,answer_check,is_published&order=id', { headers: { ...H, Range: '0-999' } });
  const tasks = await res.json();
  if (!Array.isArray(tasks)) throw new Error('Supabase: ' + JSON.stringify(tasks).slice(0, 200));

  const plan = [];
  const skipped = { естьПодпись: 0, несверяемые: 0, сложныйОтвет: 0, неНашлиИмя: 0, подписьНеПрижилась: 0 };

  for (const task of tasks) {
    const answer = (task.answer_latex || '').trim();
    const variants = task.answer_check || '';
    if (!answer || !lib.isTaskAutoCheckable(answer, variants)) { skipped.несверяемые++; continue; }
    if (lib.answerFields(answer, variants).length || lib.answerLabelMarkup(answer)) { skipped.естьПодпись++; continue; }

    /* Неравенство, тождество и ответ с пояснением в скобках подписывать
       нельзя: «$m = m > 4$» — бессмыслица. */
    const bare = answer.replace(/\$/g, '').trim();
    if (/[=<>≤≥∈]/.test(bare) || /\([^)]*[а-яёa-z]{3}/i.test(bare)) { skipped.сложныйОтвет++; continue; }

    const suggestion = suggestLabel(task.condition_latex);
    if (!suggestion) { skipped.неНашлиИмя++; continue; }

    const next = withLabel(answer, suggestion);
    /* Проверяем предложение на себе: подпись должна появиться, задача —
       остаться проверяемой, а прежний ответ — по-прежнему приниматься. */
    const parts = lib.parseAnswerParts(next);
    const ok = Boolean(lib.answerLabelMarkup(next))
      && lib.isTaskAutoCheckable(next, variants)
      && lib.checkTaskAnswer(answer, next, variants)
      && parts.length === 1
      && Boolean(parts[0].label)
      && parts[0].pieceCount === 1
      // Значение должно остаться тем же — подпись только добавляется.
      && lib.normalizeMathAnswer(parts[0].values[0]) === lib.normalizeMathAnswer(answer.replace(/\$/g, ''));
    if (!ok) { skipped.подписьНеПрижилась++; continue; }

    plan.push({ task, next, suggestion });
  }

  console.log(`\nзадач: ${tasks.length}`);
  console.log(`подпись можно проставить: ${plan.length}`);
  for (const [name, n] of Object.entries(skipped)) console.log(`  пропущено — ${name}: ${n}`);

  console.log('\n── что получится ──');
  for (const item of plan.slice(0, LIMIT)) {
    console.log(`  #${item.task.id} (${item.suggestion.kind})`);
    console.log(`      было:  ${item.task.answer_latex}`);
    console.log(`      стало: ${item.next}`);
  }
  if (plan.length > LIMIT) console.log(`  … и ещё ${plan.length - LIMIT}`);

  if (!APPLY) {
    console.log('\nНичего не изменено. Записать: node scripts/suggest-answer-labels.mjs --apply (сначала npm run backup).');
    return;
  }

  let done = 0;
  for (const item of plan) {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/tasks?id=eq.${item.task.id}`, {
      method: 'PATCH',
      headers: { ...H, Prefer: 'return=minimal' },
      body: JSON.stringify({ answer_latex: item.next })
    });
    if (!response.ok) {
      console.log(`  #${item.task.id}: ошибка ${response.status} ${(await response.text()).slice(0, 120)}`);
      continue;
    }
    done++;
  }
  console.log(`\nзаписано: ${done} из ${plan.length}`);
}

await main();
