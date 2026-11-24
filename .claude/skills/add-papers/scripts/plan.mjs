/*
 * Чистые правила автопотока контрольных (без базы и файлов) — их проверяет tests/add-papers-plan.test.js.
 *
 * Тема получает VARIANTS вариантов (A, B). Порядок: меньше вариантов → классы по GRADE_ORDER →
 * позиция темы. Олимпиадные темы и темы без подтем пропускаются; тема с двумя неудачами подряд —
 * тоже (её разбирает человек).
 */
export const VARIANTS = ['A', 'B'];
export const GRADE_ORDER = [10, 11, 9, 12, 8, 7, 6];
export const TASKS = { min: 18, max: 22, target: 20 };
export const MINUTES = 45;

export const isOlympiad = topic => /olimpi/i.test(`${topic.slug} ${topic.title_lv || ''}`);

/** Латышский текст → часть слага: без диакритики, a-z0-9 и «-». */
export function slugPart(text, words = 4) {
  return String(text || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean).slice(0, words).join('-');
}

export const paperSlug = (topic, variant) => `kd-${topic.grade}-${topic.position}-${slugPart(topic.title_lv)}-${variant.toLowerCase()}`;
export const paperTitle = (topic, variant) => `Kontroldarbs: ${String(topic.title_lv || '').replace(/\?\s*$/, '').trim()} (${variant} variants)`;
export const taskPrefix = (topic, variant) => `KD ${topic.grade}.${topic.position} ${variant}:`;

/**
 * Следующая работа: { topic, variant } или null.
 * topics — [{ id, grade, position, slug, title_lv }]; subCount — Map topicId → число подтем;
 * variantsOf — Map topicId → Set уже занятых букв (опубликованные и черновые работы этой темы;
 * работа по нескольким темам считается занявшей одну букву у каждой); failedTwice — Set topicId.
 */
export function nextPaper({ topics, subCount, variantsOf, failedTwice = new Set(), grades = GRADE_ORDER }) {
  const rank = g => { const i = GRADE_ORDER.indexOf(g); return i < 0 ? 99 : i; };
  const cands = topics
    .filter(t => grades.includes(t.grade) && !isOlympiad(t) && (subCount.get(t.id) || 0) > 0 && !failedTwice.has(t.id))
    .map(t => ({ t, have: variantsOf.get(t.id) || new Set() }))
    .filter(x => x.have.size < VARIANTS.length)
    .sort((a, b) => a.have.size - b.have.size || rank(a.t.grade) - rank(b.t.grade) || a.t.position - b.t.position || a.t.id - b.t.id);
  if (!cands.length) return null;
  const { t, have } = cands[0];
  // Буква: первая свободная. У темы с ручной работой A/B/C букв уже три — до сюда она не доходит.
  const variant = VARIANTS.find(v => !have.has(v)) || VARIANTS[have.size];
  return { topic: t, variant };
}

/** Буква варианта по слагу работы (…-a, …-b); иначе — по порядку. */
export function variantLetter(slug, fallbackIndex = 0) {
  const m = String(slug).match(/-([a-z])$/);
  return m ? m[1].toUpperCase() : VARIANTS[fallbackIndex] || String.fromCharCode(65 + fallbackIndex);
}

/** Сколько заданий на подтему: каждой хотя бы одно, остаток по порядку. */
export function perSubtopic(n, total = TASKS.target) {
  if (n <= 0) return [];
  const base = Math.max(1, Math.floor(total / n));
  const out = Array(n).fill(base);
  let left = total - base * n;
  for (let i = 0; left > 0; i = (i + 1) % n, left--) out[i]++;
  return out;
}

/** Смесь сложности для N заданий: ~40 % лёгких, ~40 % средних, ~20 % сложных. */
export function difficultyMix(n) {
  const hard = Math.max(2, Math.round(n * 0.2));
  const easy = Math.round((n - hard) / 2);
  return { 'Лёгкий': easy, 'Средний': n - hard - easy, 'Сложный': hard };
}
