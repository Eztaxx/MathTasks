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
import { fetchAll } from './lib/fetch-all.mjs';

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
  /* Тригонометрия идёт раньше «угла»: в «найдите косинус угла» спрашивают
     косинус, а не угол, и подпись «Угол» к дроби была бы враньём. */
  [/(?<!\p{L})косинус\p{L}*(?!\p{L})/iu, 'Косинус'],
  [/(?<!\p{L})синус\p{L}*(?!\p{L})/iu, 'Синус'],
  [/(?<!\p{L})тангенс\p{L}*(?!\p{L})/iu, 'Тангенс'],
  [/(?<!\p{L})котангенс\p{L}*(?!\p{L})/iu, 'Котангенс'],
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

/* «Какова масса…», «Сколько евро…» — тот же вопрос, что и «Найдите…».
   Без них русская сторона оставалась без подписи там, где латышская её
   получала, и ученик видел разные поля в двух языках. */
const ASK = /(найдите|найти|вычислите|определите|чему равн\w*|посчитайте|укажите|какова|каков|каково|сколько)([^.?!]{0,90})/i;

// «Сколько часов», «сколько евро» — величина названа самой единицей.
const ASK_UNITS = [
  [/^\s*(?:часов|часа|час)\b/i, 'Время'],
  [/^\s*(?:минут|мин)\b/i, 'Время'],
  [/^\s*(?:евро|центов)\b/i, 'Стоимость'],
  [/^\s*(?:километров|км|метров|сантиметров)\b/i, 'Расстояние'],
  [/^\s*(?:литров|л)\b/i, 'Объём'],
  [/^\s*(?:граммов|грамм|килограммов|кг)\b/i, 'Масса'],
  [/^\s*(?:градусов)\b/i, 'Угол'],
  [/^\s*(?:процентов)\b/i, 'Доля']
];

/* Латышская сторона: без неё ученик, читающий сайт по-латышски, видит
   поле без подписи там, где русский видит «Периметр =». */
const NOUNS_LV = [
  [/(?<!\p{L})perimetr\p{L}*(?!\p{L})/iu, 'Perimetrs'],
  [/(?<!\p{L})laukum\p{L}*(?!\p{L})/iu, 'Laukums'],
  [/(?<!\p{L})tilpum\p{L}*(?!\p{L})/iu, 'Tilpums'],
  [/(?<!\p{L})garum\p{L}*(?!\p{L})/iu, 'Garums'],
  [/(?<!\p{L})platum\p{L}*(?!\p{L})/iu, 'Platums'],
  [/(?<!\p{L})augstum\p{L}*(?!\p{L})/iu, 'Augstums'],
  [/(?<!\p{L})rādius\p{L}*(?!\p{L})/iu, 'Rādiuss'],
  [/(?<!\p{L})diametr\p{L}*(?!\p{L})/iu, 'Diametrs'],
  [/(?<!\p{L})mas[au](?!\p{L})/iu, 'Masa'],
  [/(?<!\p{L})ātrum\p{L}*(?!\p{L})/iu, 'Ātrums'],
  [/(?<!\p{L})laik\p{L}*(?!\p{L})/iu, 'Laiks'],
  [/(?<!\p{L})attālum\p{L}*(?!\p{L})/iu, 'Attālums'],
  [/(?<!\p{L})mērogs?(?!\p{L})/iu, 'Mērogs'],
  [/(?<!\p{L})cen[au](?!\p{L})/iu, 'Cena'],
  [/(?<!\p{L})leņķ\p{L}*(?!\p{L})/iu, 'Leņķis'],
  [/(?<!\p{L})summ[au](?!\p{L})/iu, 'Summa'],
  [/(?<!\p{L})reizinājum\p{L}*(?!\p{L})/iu, 'Reizinājums'],
  [/(?<!\p{L})starpīb[au](?!\p{L})/iu, 'Starpība'],
  [/(?<!\p{L})varbūtīb[au](?!\p{L})/iu, 'Varbūtība'],
  [/(?<!\p{L})skaits?(?!\p{L})/iu, 'Skaits']
];

const ASK_LV = /(?:aprēķin\p{L}*|atrod\p{L}*|nosaki\p{L}*|noteic\p{L}*|cik)([^.?!]{0,90})/iu;

// Имя величины по-латышски — то же, что по-русски, только словом Skola2030.
const LABEL_LV = {
  'Периметр': 'Perimetrs', 'Площадь': 'Laukums', 'Объём': 'Tilpums',
  'Длина': 'Garums', 'Ширина': 'Platums', 'Высота': 'Augstums',
  'Радиус': 'Rādiuss', 'Диаметр': 'Diametrs', 'Масса': 'Masa',
  'Скорость': 'Ātrums', 'Время': 'Laiks', 'Расстояние': 'Attālums',
  'Масштаб': 'Mērogs', 'Стоимость': 'Izmaksas', 'Цена': 'Cena',
  'Косинус': 'Kosinuss', 'Синус': 'Sinuss', 'Тангенс': 'Tangenss', 'Котангенс': 'Kotangenss',
  'Угол': 'Leņķis', 'Сумма': 'Summa', 'Произведение': 'Reizinājums',
  'Разность': 'Starpība', 'Частное': 'Dalījums', 'Вероятность': 'Varbūtība',
  'Медиана': 'Mediāna', 'Размах': 'Amplitūda', 'Количество': 'Skaits',
  'Среднее арифметическое': 'Vidējais aritmētiskais', 'Градусная мера': 'Leņķa lielums'
};

/* Что спрашивают. Сначала имя в формуле — «Найдите $AB$», потом слово. */
function suggestLabel(condition, lang = 'ru') {
  const nouns = lang === 'lv' ? NOUNS_LV : NOUNS;
  const ask = (lang === 'lv' ? ASK_LV : ASK).exec(String(condition || ''));
  if (!ask) return null;
  const verb = (lang === 'lv' ? '' : (ask[1] || '')).toLowerCase();
  const tail = lang === 'lv' ? ask[1] : ask[2];

  /* «Сколько …» спрашивает величину единицей сразу после себя. Общий
     поиск слова здесь опасен: дальше в предложении стоят данные задачи. */
  if (verb === 'сколько') {
    const unit = ASK_UNITS.find(([re]) => re.test(tail));
    return unit ? { label: unit[1], kind: 'слово' } : null;
  }

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
  const head = tail.slice(0, 40);
  for (const [re, label] of nouns) {
    const at = head.search(re);
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

/* Подпись для одной языковой версии ответа. Возвращает null, если
   подписывать нечего или предложение не проходит проверку на себе. */
function planFor(task, lang) {
  const answer = String((lang === 'lv' ? task.answer_latex_lv : task.answer_latex) || '').trim();
  const condition = lang === 'lv' ? task.condition_latex_lv : task.condition_latex;
  const variants = task.answer_check || '';
  if (!answer) return { skip: 'несверяемые' };
  if (!lib.isTaskAutoCheckable(answer, variants)) return { skip: 'несверяемые' };
  if (lib.answerFields(answer, variants).length || lib.answerLabelMarkup(answer)) return { skip: 'естьПодпись' };

  /* Неравенство, тождество и ответ с пояснением в скобках подписывать
     нельзя: «$m = m > 4$» — бессмыслица. */
  const bare = answer.replace(/\$/g, '').trim();
  if (/[=<>≤≥∈]/.test(bare) || /\([^)]*[а-яёa-zāčēģīķļņšūž]{3}/i.test(bare)) return { skip: 'сложныйОтвет' };

  /* Для латышской версии имя берём из русского условия и переводим:
     отдельный разбор латышского текста ошибался на словах из данных. */
  const ruSuggestion = suggestLabel(task.condition_latex, 'ru');
  if (!ruSuggestion) return { skip: 'неНашлиИмя' };
  const suggestion = lang === 'lv'
    ? (ruSuggestion.kind === 'формула'
      ? ruSuggestion
      : (LABEL_LV[ruSuggestion.label] ? { label: LABEL_LV[ruSuggestion.label], kind: 'слово' } : null))
    : ruSuggestion;
  if (!suggestion) return { skip: 'неНашлиИмя' };

  const next = withLabel(answer, suggestion);
  /* Проверяем предложение на себе: подпись должна появиться, задача —
     остаться проверяемой, значение — не измениться, а прежний ответ —
     по-прежнему приниматься. */
  const parts = lib.parseAnswerParts(next);
  const ok = Boolean(lib.answerLabelMarkup(next))
    && lib.isTaskAutoCheckable(next, variants)
    && lib.checkTaskAnswer(answer, next, variants)
    && parts.length === 1
    && Boolean(parts[0].label)
    && parts[0].pieceCount === 1
    && lib.normalizeMathAnswer(parts[0].values[0]) === lib.normalizeMathAnswer(answer.replace(/\$/g, ''));
  if (!ok) return { skip: 'подписьНеПрижилась' };
  return { answer, next, suggestion };
}

async function main() {
  const env = loadEnv();
  const key = APPLY ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_ANON_KEY;
  const H = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
    /* Страницами по 1000: Supabase режет выдачу молча, и при росте базы
     хвост задач просто не попал бы в отчёт. */
  const tasks = await fetchAll(env.SUPABASE_URL + '/rest/v1/tasks?select=id,title,condition_latex,condition_latex_lv,answer_latex,answer_latex_lv,answer_check,is_published&order=id', H);

  const plan = [];
  const skipped = { естьПодпись: 0, несверяемые: 0, сложныйОтвет: 0, неНашлиИмя: 0, подписьНеПрижилась: 0 };

  for (const task of tasks) {
    for (const lang of ['ru', 'lv']) {
      const result = planFor(task, lang);
      if (result.skip) { skipped[result.skip]++; continue; }
      plan.push({ task, lang, ...result });
    }
  }

  console.log(`\nзадач: ${tasks.length}`);
  console.log(`подпись можно проставить: ${plan.length}`);
  for (const [name, n] of Object.entries(skipped)) console.log(`  пропущено — ${name}: ${n}`);

  console.log('\n── что получится ──');
  for (const item of plan.slice(0, LIMIT)) {
    console.log(`  #${item.task.id} ${item.lang.toUpperCase()} (${item.suggestion.kind})`);
    console.log(`      было:  ${item.answer}`);
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
      body: JSON.stringify(item.lang === 'lv' ? { answer_latex_lv: item.next } : { answer_latex: item.next })
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
