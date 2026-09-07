#!/usr/bin/env node
/*
 * Численная проверка ответов.
 *
 * Задача 162 показала, чем опасен решебник без такой проверки: в базе
 * лежал неверный ответ, и обе языковые версии решения его подтверждали.
 * Нашлось это случайно. Глазами 435 задач не пересчитать, машиной —
 * можно, но не все: чертежи, доказательства и сюжетные задачи со
 * сложным пересказом условия остаются за пределами.
 *
 * Что проверяется:
 *   уравнение   — каждый корень подставляется в условие, сравниваются
 *                 левая и правая части;
 *   неравенство — по промежуткам из ответа берутся пробные точки внутри
 *                 и снаружи, и проверяется, что истинность неравенства
 *                 совпадает с принадлежностью ответу.
 *
 * Запуск:  node scripts/verify-answers.mjs [--id 162] [--verbose]
 */

import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const argv = process.argv.slice(2);
const ONLY_ID = argv.includes('--id') ? Number(argv[argv.indexOf('--id') + 1]) : null;
const VERBOSE = argv.includes('--verbose');

/* ── Доступ к базе ────────────────────────────────────────────────── */
const env = Object.fromEntries(
  readFileSync(ROOT + '.env', 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);

/* ── LaTeX → выражение, которое умеет считать JS ──────────────────── */
/* Полноценный разбор TeX здесь не нужен и вреден: чем больше движок
   понимает, тем чаще он «понимает» неправильно и выдаёт ложную тревогу.
   Поддерживаем узкий набор и честно отказываемся от всего остального. */

const UNSUPPORTED = /\\(begin|end|int|sum|prod|lim|overline|vec|binom|choose|matrix|cases|text|mathbb|angle|triangle|sim|parallel|perp|approx)\b/;

function latexToJs(src) {
  let s = String(src);

  if (UNSUPPORTED.test(s)) throw new Error('конструкция вне поддержки: ' + (s.match(UNSUPPORTED) || [])[0]);

  s = s.replace(/\\left|\\right/g, '');
  s = s.replace(/\\,|\\;|\\!|\\quad|\\qquad|\s/g, '');
  s = s.replace(/(\d)\{,\}(\d)/g, '$1.$2');   // 0{,}5 → 0.5
  s = s.replace(/(\d),(\d)/g, '$1.$2');       // 0,5   → 0.5

  /* Дроби и корни разворачиваем изнутри наружу, пока есть что разворачивать. */
  const braced = '\\{((?:[^{}]|\\{[^{}]*\\})*)\\}';
  for (let pass = 0; pass < 12; pass++) {
    const before = s;
    s = s.replace(new RegExp('\\\\d?frac' + braced + braced, 'g'), '(($1)/($2))');
    s = s.replace(new RegExp('\\\\sqrt\\[3\\]' + braced, 'g'), 'Math.cbrt($1)');
    s = s.replace(new RegExp('\\\\sqrt' + braced, 'g'), 'Math.sqrt($1)');
    if (s === before) break;
  }
  if (/\\frac|\\sqrt/.test(s)) throw new Error('вложенность дробей или корней слишком глубокая');

  /* Логарифмы: \log_a(x), \log_{a}(x), \lg, \ln. */
  s = s.replace(/\\log_\{([^{}]+)\}/g, '__LOGBASE($1)__');
  s = s.replace(/\\log_([0-9.]+)/g, '__LOGBASE($1)__');
  /* Основание может быть и буквой: log_x(3x - 2). Без этой строки
     задача 162 — та самая, с которой всё началось — не проверялась. */
  s = s.replace(/\\log_([A-Za-z])/g, '__LOGBASE($1)__');
  s = s.replace(/\\lg/g, '__LOGBASE(10)__');
  s = s.replace(/\\ln/g, '__LOGBASE(Math.E)__');
  s = s.replace(/\\log/g, '__LOGBASE(10)__');
  s = s.replace(/__LOGBASE\(([^)]+)\)__\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, '(Math.log($2)/Math.log($1))');
  if (s.includes('__LOGBASE')) throw new Error('логарифм записан непривычно');

  s = s.replace(/\\(sin|cos|tan|arcsin|arccos|arctan)\b/g, (_, f) =>
    'Math.' + ({ arcsin: 'asin', arccos: 'acos', arctan: 'atan' }[f] || f));
  s = s.replace(/\\pi\b/g, 'Math.PI');
  s = s.replace(/\\cdot|\\times/g, '*');
  s = s.replace(/\\div/g, '/');
  s = s.replace(/\|([^|]+)\|/g, 'Math.abs($1)');

  if (/\\[a-zA-Z]/.test(s)) throw new Error('неизвестная команда: ' + (s.match(/\\[a-zA-Z]+/) || [])[0]);

  s = s.replace(/[{}]/g, (m, off, str) => /\^/.test(str.slice(Math.max(0, off - 2), off)) ? m : '');

  /* Подразумеваемое умножение: 2x, 3(x+1), (x+1)(x-1), 2Math.sqrt(...).
     Расставляем до степеней — иначе «2x^2» прочитается как «(2x)^2». */
  s = s.replace(/(\d)(?=[A-Za-z(])/g, '$1*');
  s = s.replace(/\)(?=[A-Za-z0-9(])/g, ')*');
  s = s.replace(/([A-Za-z])(?=\()/g, (m, ch, off, str) =>
    /Math|abs|sqrt|pow|cbrt|log|sin|cos|tan|asin|acos|atan/.test(str.slice(Math.max(0, off - 6), off + 1)) ? m : m + '*');
  s = s.replace(/\*+/g, '*').replace(/Math\.\*/g, 'Math.').replace(/\*\./g, '.');

  /* Степени: основание — один множитель, скобка или вызов функции. */
  for (let pass = 0; pass < 8; pass++) {
    const before = s;
    s = s.replace(/(\([^()]*\)|Math\.\w+\([^()]*\)|[A-Za-z0-9_.]+)\^\{([^{}]*)\}/g, 'Math.pow($1,($2))');
    s = s.replace(/(\([^()]*\)|Math\.\w+\([^()]*\)|[A-Za-z0-9_.]+)\^(-?[A-Za-z0-9.]+)/g, 'Math.pow($1,($2))');
    if (s === before) break;
  }
  if (s.includes('^')) throw new Error('степень записана непривычно');

  s = s.replace(/[{}]/g, '');

  return s;
}

const VAR = /\b(?!Math|PI|E\b|pow|sqrt|cbrt|abs|log|sin|cos|tan|asin|acos|atan)([a-zA-Z])\b/g;

function compile(expr) {
  const js = latexToJs(expr);
  const vars = [...new Set([...js.matchAll(VAR)].map(m => m[1]))];
  if (vars.length > 1) throw new Error('переменных больше одной: ' + vars.join(', '));
  const v = vars[0] || 'x';
  let fn;
  try { fn = new Function(v, `"use strict"; return (${js});`); }
  catch (e) { throw new Error('выражение не компилируется: ' + e.message); }
  return { fn, variable: v, js };
}

/* ── Что из условия можно взять ───────────────────────────────────── */
const mathBlocks = text => {
  const out = [];
  const src = String(text || '');
  for (const m of src.matchAll(/\$\$([\s\S]+?)\$\$/g)) out.push(m[1]);
  const withoutDisplay = src.replace(/\$\$[\s\S]+?\$\$/g, ' ');
  for (const m of withoutDisplay.matchAll(/\$([^$]+)\$/g)) out.push(m[1]);
  return out;
};

const RELATION = /(\\le\b|\\leq\b|\\ge\b|\\geq\b|<|>|=)/;

/* Проверять можно только то, что условие прямо просит решить. Иначе
   «Вероятность попадания равна $p = 0{,}8$» читается как уравнение
   относительно p, ответ 0,4096 подставляется вместо p — и проверка
   рапортует о расхождении там, где всё верно. Ложная тревога хуже
   отсутствия проверки: она заставляет перепроверять исправное. */
/* Без \b: в JS граница слова определена через [A-Za-z0-9_], поэтому
   внутри кириллицы её не бывает вовсе и «реши(те|ть)\b» не совпадает
   ни с чем. В этом проекте такая ловушка срабатывает уже второй раз. */
const SOLVE_INTENT = /реши(те|ть)|найдите\s+корн|atrisin|найдите\s+все\s+значения|при\s+каких\s+значениях|найдите\s+значени[ея]\s+[a-zA-Z$]/i;

/* Запись вида «p = 0,8» или «k = 3» — это данное, а не уравнение:
   слева одна буква, справа ни одной. */
const isGiven = (lhs, rhs) =>
  /^\s*[a-zA-Z](_\{?\d\}?)?\s*$/.test(lhs) && !/[a-zA-Z]/.test(rhs.replace(/\\[a-z]+/gi, ''));

const varsIn = str => [...new Set(
  String(str).replace(/\\[a-zA-Z]+/g, ' ').match(/[a-zA-Z]/g) || []
)];

function findRelation(text, answer) {
  if (!SOLVE_INTENT.test(String(text))) return null;

  /* Переменная ответа, если она названа: «$x = 4$» → x. По ней выбираем
     нужное равенство, когда в условии их несколько. */
  const named = String(answer || '').replace(/\$/g, '').match(/([a-zA-Z])(?:_\{?\d\}?)?\s*(?:=|\\in)/);
  const wanted = named ? named[1] : null;

  const candidates = [];
  for (const block of mathBlocks(text)) {
    const parts = block.split(/\\le\b|\\leq\b|\\ge\b|\\geq\b|<|>|=/);
    if (parts.length !== 2) continue;
    const op = (block.match(RELATION) || [])[0];
    if (!op) continue;
    const [lhs, rhs] = parts;
    if (!lhs.trim() || !rhs.trim()) continue;
    if (!/[a-zA-Z]/.test(lhs + rhs)) continue;
    if (isGiven(lhs, rhs)) continue;
    const vars = varsIn(lhs + rhs);
    if (vars.length !== 1) continue;
    if (wanted && vars[0] !== wanted) continue;
    candidates.push({ lhs, rhs, op: op.replace(/\\|leq|geq/g, m => m === '\\' ? '' : m.slice(0, 2)) });
  }
  /* Ровно одно подходящее равенство — иначе неясно, что именно решают. */
  return candidates.length === 1 ? candidates[0] : null;
}

/* ── Ответ: корни и промежутки ────────────────────────────────────── */
const numFrom = s => {
  const t = String(s).replace(/\{,\}/g, '.').replace(/(\d),(\d)/g, '$1.$2').replace(/\s|\\;|\\,/g, '');
  if (/^[-+]?\d+(\.\d+)?$/.test(t)) return Number(t);
  const frac = t.match(/^\\d?frac\{(-?\d+(?:\.\d+)?)\}\{(-?\d+(?:\.\d+)?)\}$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const plain = t.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (plain) return Number(plain[1]) / Number(plain[2]);
  return null;
};

function extractRoots(answer) {
  /* Десятичную запятую разворачиваем до разбора: иначе «$x_2 = 0{,}5$»
     режется по запятой внутри {,} и корень теряется. */
  const a = String(answer || '').replace(/\$/g, '').replace(/(\d)\{,\}(\d)/g, '$1.$2');
  if (/\\in|\\cup|\\infty/.test(a)) return null;      // это множество, не корни
  const roots = [];
  for (const m of a.matchAll(/[a-zA-Z](?:_\{?\d\}?)?\s*=\s*([^,;]+)/g)) {
    const n = numFrom(m[1]);
    if (n === null) return null;
    roots.push(n);
  }
  if (roots.length) return roots;
  const single = numFrom(a);
  return single === null ? null : [single];
}

const INF = 1e9;
function extractIntervals(answer) {
  const a = String(answer || '').replace(/\$/g, '').replace(/\\left|\\right/g, '');
  if (!/[\[(]/.test(a)) return null;
  const out = [];
  for (const m of a.matchAll(/([\[(])\s*([^;]+?)\s*;\s*([^\])]+?)\s*([\])])/g)) {
    const lo = /-\s*\\infty/.test(m[2]) ? -INF : numFrom(m[2]);
    const hi = /\+?\s*\\infty/.test(m[3]) ? INF : numFrom(m[3]);
    if (lo === null || hi === null) return null;
    out.push({ lo, hi, loOpen: m[1] === '(', hiOpen: m[4] === ')' });
  }
  return out.length ? out : null;
}

const inSet = (x, ivs) => ivs.some(i =>
  (i.loOpen ? x > i.lo + 1e-12 : x >= i.lo - 1e-12) &&
  (i.hiOpen ? x < i.hi - 1e-12 : x <= i.hi + 1e-12));

/* ── Проверки ─────────────────────────────────────────────────────── */
const CLOSE = (a, b) => Number.isFinite(a) && Number.isFinite(b)
  && Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));

function checkEquation(rel, roots) {
  const L = compile(rel.lhs), Rt = compile(rel.rhs);
  const bad = [];
  for (const r of roots) {
    const l = L.fn(r), rr = Rt.fn(r);
    if (!Number.isFinite(l) || !Number.isFinite(rr)) { bad.push(`при ${r} значение не определено`); continue; }
    if (!CLOSE(l, rr)) bad.push(`при ${L.variable} = ${r}: слева ${l.toPrecision(8)}, справа ${rr.toPrecision(8)}`);
  }
  return { ok: !bad.length, detail: bad, variable: L.variable };
}

function checkInequality(rel, ivs) {
  const L = compile(rel.lhs), Rt = compile(rel.rhs);
  const holds = x => {
    const l = L.fn(x), r = Rt.fn(x);
    if (!Number.isFinite(l) || !Number.isFinite(r)) return null;
    switch (rel.op) {
      case '<': return l < r; case '>': return l > r;
      case '\\le': case 'le': return l <= r + 1e-12;
      case '\\ge': case 'ge': return l >= r - 1e-12;
      default: return null;
    }
  };

  /* Точки берём и внутри промежутков, и снаружи, и вплотную к границам —
     ровно там, где обычно и прячется лишний или потерянный кусок. */
  const pts = new Set();
  const edges = ivs.flatMap(i => [i.lo, i.hi]).filter(v => Math.abs(v) < INF);
  for (const e of edges) for (const d of [-1, -0.1, -0.001, 0, 0.001, 0.1, 1]) pts.add(Number((e + d).toFixed(6)));
  for (const i of ivs) {
    const lo = i.lo === -INF ? (Math.min(...edges, 0) - 20) : i.lo;
    const hi = i.hi === INF ? (Math.max(...edges, 0) + 20) : i.hi;
    for (let k = 1; k <= 7; k++) pts.add(Number((lo + (hi - lo) * k / 8).toFixed(6)));
  }
  const span = Math.max(20, ...edges.map(Math.abs));
  for (let x = -span - 5; x <= span + 5; x += span / 12) pts.add(Number(x.toFixed(6)));

  const wrong = [];
  let tested = 0;
  for (const x of pts) {
    const h = holds(x);
    if (h === null) continue;              // вне области определения — пропускаем
    tested++;
    const want = inSet(x, ivs);
    if (h !== want) wrong.push({ x, holds: h, inAnswer: want });
  }
  /* Одиночное расхождение у самой границы — почти всегда округление,
     а не ошибка: строгость границы так не проверить. */
  const real = wrong.filter(w => !edges.some(e => Math.abs(w.x - e) < 0.005));
  return {
    ok: real.length === 0,
    tested,
    detail: real.slice(0, 6).map(w => `${L.variable} = ${w.x}: неравенство ${w.holds ? 'верно' : 'неверно'}, а в ответе ${w.inAnswer ? 'есть' : 'нет'}`)
  };
}

/* ── Прогон ───────────────────────────────────────────────────────── */
export { latexToJs, compile, findRelation, extractRoots, extractIntervals, inSet, checkEquation, checkInequality };

/* Прогон по базе только при прямом запуске: при импорте из тестов
   лишний запрос к Supabase не нужен. */
const isDirectRun = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isDirectRun) {
  await main();
}

async function main() {
  const H = { apikey: env.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + env.SUPABASE_ANON_KEY };
  const tasks = await (await fetch(env.SUPABASE_URL
    + '/rest/v1/tasks?select=id,title,grade,condition_latex,answer_latex&order=id', { headers: H })).json();

  const stat = { passed: [], failed: [], skipped: {} };
  const skip = (t, why) => { (stat.skipped[why] ||= []).push(t.id); };

  for (const t of tasks) {
    if (ONLY_ID && t.id !== ONLY_ID) continue;
    const rel = findRelation(t.condition_latex, t.answer_latex);
    if (!rel) { skip(t, 'условие не сводится к одному уравнению или неравенству'); continue; }

    const isIneq = rel.op !== '=';
    try {
      if (isIneq) {
        const ivs = extractIntervals(t.answer_latex);
        if (!ivs) { skip(t, 'ответ не разобран как промежуток'); continue; }
        const r = checkInequality(rel, ivs);
        (r.ok ? stat.passed : stat.failed).push({ ...t, kind: 'неравенство', ...r });
      } else {
        const roots = extractRoots(t.answer_latex);
        if (!roots) { skip(t, 'ответ не разобран как корни'); continue; }
        const r = checkEquation(rel, roots);
        (r.ok ? stat.passed : stat.failed).push({ ...t, kind: 'уравнение', ...r });
      }
    } catch (e) {
      skip(t, e.message.slice(0, 60));
    }
  }

  console.log(`Задач в базе: ${tasks.length}`);
  console.log(`Проверено:    ${stat.passed.length + stat.failed.length}`);
  console.log(`  сошлось:    ${stat.passed.length}`);
  console.log(`  НЕ сошлось: ${stat.failed.length}`);
  console.log(`Пропущено:    ${Object.values(stat.skipped).reduce((a, b) => a + b.length, 0)}\n`);

  if (stat.failed.length) {
    console.log('══ РАСХОЖДЕНИЯ ══');
    for (const f of stat.failed) {
      console.log(`\nid ${f.id} · ${f.grade} кл · ${f.kind} · «${f.title}»`);
      console.log(`  условие: ${String(f.condition_latex).replace(/\n/g, ' ').slice(0, 130)}`);
      console.log(`  ответ:   ${f.answer_latex}`);
      f.detail.forEach(d => console.log(`  → ${d}`));
    }
  }

  console.log('\n══ ПОЧЕМУ ПРОПУЩЕНО ══');
  for (const [why, ids] of Object.entries(stat.skipped).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`${String(ids.length).padStart(4)}  ${why}`);
    if (VERBOSE) console.log(`      ${ids.slice(0, 25).join(', ')}${ids.length > 25 ? '…' : ''}`);
  }

  process.exit(stat.failed.length ? 1 : 0);

}
