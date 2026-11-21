/*
 * Квоты пачки — чистые функции без базы и .env (их проверяет tests/add-tasks-quota.test.js).
 *
 * Подтема заполняется до TARGET опубликованных задач; из них примерно каждая
 * SELF_EVERY-я — с самопроверкой (ответ сайт не сверяет, ученик сравнивает
 * с эталоном сам): при 45 задачах — 9. Запуск пишет до PER_RUN задач, из них
 * не больше SELF_PER_RUN с самопроверкой, в одну или до MAX_SUBS подтем одной темы.
 */
export const TARGET = 45;
export const SELF_EVERY = 5;
export const PER_RUN = 12;
export const SELF_PER_RUN = 3;
export const MAX_SUBS = 2;

// Сколько задач с самопроверкой положено подтеме, в которой total опубликованных.
export const selfTarget = (total, { target = TARGET, every = SELF_EVERY } = {}) =>
  Math.floor(Math.min(total, target) / every);

/* Порядок подтем: сначала приоритетные классы, пока в них есть место; затем
   самые тонкие (меньше всего опубликованных), младший класс, порядок тем и подтем.
   sub: { id, position, total, grade, topicPosition }. */
export function compareSubs(a, b, { priority = [], target = TARGET } = {}) {
  const open = s => (priority.includes(s.grade) && s.total < target ? 0 : 1);
  return open(a) - open(b) || a.total - b.total || a.grade - b.grade
    || (a.topicPosition ?? 999) - (b.topicPosition ?? 999)
    || (a.position ?? 999) - (b.position ?? 999) || a.id - b.id;
}

/* План пачки по подтемам одной темы, уже отсортированным compareSubs (первая — главная).
   sub: { id, total, self } — опубликовано всего и из них с самопроверкой.
   Возвращает [{ id, wantAuto, wantSelf }] — только подтемы, куда что-то пишем. */
export function planBatch(subs, {
  target = TARGET, every = SELF_EVERY, perRun = PER_RUN, selfPerRun = SELF_PER_RUN, maxSubs = MAX_SUBS
} = {}) {
  const plan = [];
  let left = perRun;
  let selfLeft = selfPerRun;
  for (const s of subs) {
    if (left <= 0 || plan.length >= maxSubs) break;
    const take = Math.min(left, target - s.total);
    if (take <= 0) continue;
    const owed = selfTarget(s.total + take, { target, every }) - s.self;
    const wantSelf = Math.max(0, Math.min(owed, selfLeft, take));
    plan.push({ id: s.id, wantAuto: take - wantSelf, wantSelf });
    left -= take;
    selfLeft -= wantSelf;
  }
  return plan;
}
