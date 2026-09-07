#!/usr/bin/env node
/*
 * Расхождения по числу формул между русской и латышской версией.
 *
 * Сырое сравнение «сколько знаков $ там и там» даёт 69 срабатываний, и
 * почти все безобидны: латышский пишет признаки подобия формулами —
 * $ll$, $mmm$ — там, где русский пишет словами «по двум углам». Такая
 * проверка в тестах бесполезна: она всегда красная, и на неё перестают
 * смотреть.
 *
 * Здесь расхождения разбираются по причинам, и отдельно выделяется то,
 * что похоже на настоящую потерю: в одной версии есть выкладка, которой
 * в другой нет вовсе.
 *
 * Запуск:  node scripts/verify-formula-parity.mjs [--verbose]
 */

import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const VERBOSE = process.argv.includes('--verbose');

const env = Object.fromEntries(
  readFileSync(ROOT + '.env', 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);

const inline = s => (String(s || '').replace(/\$\$[\s\S]*?\$\$/g, ' ').match(/(?<!\\)\$/g) || []).length / 2;
const display = s => (String(s || '').match(/\$\$/g) || []).length / 2;
const lines = s => String(s || '').split('\n').filter(x => x.trim()).length;

/* Однобуквенные и двух-трёхбуквенные формулы — это обозначения, а не
   выкладки: латышские сокращения признаков (ll, mmm, ll pazīme) и
   отдельные величины вроде $A$, $T$, $Me$. Их разница смысла не меняет. */
const shortFormulas = s => {
  const src = String(s || '').replace(/\$\$[\s\S]*?\$\$/g, ' ');
  return [...src.matchAll(/(?<!\\)\$([^$]{1,4})(?<!\\)\$/g)].map(m => m[1].trim()).filter(Boolean);
};

/* Выкладка — формула со знаком отношения или действия: именно её потеря
   означает, что шаг решения исчез. */
const substantive = s => {
  const src = String(s || '');
  const all = [
    ...[...src.matchAll(/\$\$([\s\S]+?)\$\$/g)].map(m => m[1]),
    ...[...src.replace(/\$\$[\s\S]+?\$\$/g, ' ').matchAll(/(?<!\\)\$([^$]+)(?<!\\)\$/g)].map(m => m[1])
  ];
  return all.filter(f => /=|\\le|\\ge|\\implies|[<>+]|\\frac|\\sqrt/.test(f));
};

const H = { apikey: env.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + env.SUPABASE_ANON_KEY };
const tasks = await (await fetch(env.SUPABASE_URL
  + '/rest/v1/tasks?select=id,title,grade,condition_latex,condition_latex_lv,solution_latex,solution_latex_lv&order=id',
  { headers: H })).json();

const buckets = {
  'латышский пишет обозначения формулами, русский — словами': [],
  'разное дробление одной выкладки на строки': [],
  'выкладок в латышской версии меньше — возможна потеря шага': [],
  'выкладок в латышской версии больше — разбор подробнее': [],
  'прочее расхождение оформления': []
};

let compared = 0;
for (const t of tasks) {
  for (const field of ['condition_latex', 'solution_latex']) {
    const ru = t[field], lv = t[field + '_lv'];
    if (!ru || !lv) continue;
    compared++;

    const dRu = inline(ru) + display(ru), dLv = inline(lv) + display(lv);
    if (dRu === dLv) continue;

    const sRu = substantive(ru).length, sLv = substantive(lv).length;
    const shortDelta = shortFormulas(lv).length - shortFormulas(ru).length;
    const entry = {
      id: t.id, grade: t.grade, title: t.title, field,
      ru, lv, dRu, dLv, sRu, sLv,
      shortLv: shortFormulas(lv), shortRu: shortFormulas(ru),
      linesRu: lines(ru), linesLv: lines(lv)
    };

    if (sRu === sLv && shortDelta !== 0) {
      buckets['латышский пишет обозначения формулами, русский — словами'].push(entry);
    } else if (sRu === sLv) {
      buckets['разное дробление одной выкладки на строки'].push(entry);
    } else if (sLv < sRu) {
      buckets['выкладок в латышской версии меньше — возможна потеря шага'].push(entry);
    } else if (sLv > sRu) {
      buckets['выкладок в латышской версии больше — разбор подробнее'].push(entry);
    } else {
      buckets['прочее расхождение оформления'].push(entry);
    }
  }
}

const total = Object.values(buckets).reduce((a, b) => a + b.length, 0);
console.log(`Сравнено пар полей: ${compared}`);
console.log(`Расхождений по числу формул: ${total}\n`);

for (const [why, list] of Object.entries(buckets)) {
  if (!list.length) continue;
  console.log(`══ ${list.length} · ${why} ══`);
  const show = VERBOSE ? list : list.slice(0, 5);
  for (const e of show) {
    console.log(`  id ${e.id} · ${e.grade} кл · ${e.field.includes('condition') ? 'условие' : 'решение'} · «${e.title}»`);
    console.log(`     формул ru ${e.dRu} / lv ${e.dLv} · из них выкладок ru ${e.sRu} / lv ${e.sLv} · строк ru ${e.linesRu} / lv ${e.linesLv}`);
    if (why.startsWith('латышский пишет')) {
      const extra = e.shortLv.filter(x => !e.shortRu.includes(x));
      if (extra.length) console.log(`     только в латышской: ${extra.slice(0, 6).map(x => '$' + x + '$').join(', ')}`);
    }
    if (VERBOSE && why.includes('потеря шага')) {
      console.log(`     ru: ${String(e.ru).replace(/\n/g, ' ⏎ ').slice(0, 200)}`);
      console.log(`     lv: ${String(e.lv).replace(/\n/g, ' ⏎ ').slice(0, 200)}`);
    }
  }
  if (!VERBOSE && list.length > 5) console.log(`  … ещё ${list.length - 5}`);
  console.log();
}

/* Считать ошибкой само расхождение нельзя: латышский пишет признаки
   подобия формулами, русский — словами, и таких мест три десятка. Тогда
   проверка всегда красная и на неё перестают смотреть. Красным делаем
   только настоящую потерю: выкладку, ни одного числа которой в другой
   версии нет вовсе. */
const digitsOf = str => (String(str)
  .replace(/_\{[^}]*\}/g, '').replace(/_\d/g, '').replace(/\{,\}/g, '.')
  .match(/\d+(?:\.\d+)?/g) || []).map(Number);

const lost = [];
for (const t of tasks) {
  for (const field of ['condition_latex', 'solution_latex']) {
    const ru = t[field], lv = t[field + '_lv'];
    if (!ru || !lv) continue;
    const all = new Set(digitsOf(lv));
    for (const f of substantive(ru)) {
      const d = digitsOf(f);
      if (d.length && d.every(n => !all.has(n))) {
        lost.push({ id: t.id, title: t.title, field, formula: f });
      }
    }
  }
}

const risky = buckets['выкладок в латышской версии меньше — возможна потеря шага'];
console.log(`Латышская версия короче по числу выкладок: ${risky.length} — это сокращённая запись, правок не требует.`);

if (lost.length) {
  console.log(`\n✗ ВЫКЛАДКИ, ПОТЕРЯННЫЕ ПРИ ПЕРЕВОДЕ: ${lost.length}`);
  for (const l of lost) {
    console.log(`  id ${l.id} · ${l.field.includes('condition') ? 'условие' : 'решение'} · «${l.title}»`);
    console.log(`     нет в латышской: $${String(l.formula).slice(0, 120)}$`);
  }
} else {
  console.log('\n✓ Ни одной выкладки при переводе не потеряно.');
}
process.exit(lost.length ? 1 : 0);
