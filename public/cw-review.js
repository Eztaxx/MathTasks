/* Проверка сданной контрольной учителем (админка → «Результаты учеников»).

   Чистые функции без страницы, чтобы их можно было проверить тестом:
   балл за задание с учётом отметки учителя (0, ½ или 1), итог работы по
   шкале сайта, сводка «ученики × задания» и её выгрузка в CSV.

   Строка сдачи — cw_submissions (миграции 036 и 037): answers — то, что
   прислал браузер ученика ({task_id, ok, accepted, answer}), review — баллы,
   которые учитель поставил сам ({"<task_id>": 0 | 0.5 | 1}). */
(function () {
  const POINTS = [0, 0.5, 1];

  const reviewOf = row => (row && row.review && typeof row.review === 'object' && !Array.isArray(row.review) ? row.review : {});

  // Отметка учителя за задание или null, если её нет.
  const teacherMark = (row, taskId) => {
    const value = reviewOf(row)[String(taskId)];
    return POINTS.includes(value) ? value : null;
  };

  // Балл за задание: отметка учителя, иначе автопроверка (верно — 1, нет — 0).
  const taskPoints = (row, answer) => {
    const mark = teacherMark(row, answer && answer.task_id);
    if (mark !== null) return mark;
    return answer && answer.ok ? 1 : 0;
  };

  // Итог работы с учётом отметок. Оценка — той же шкалой, что видит ученик.
  const reviewTotals = (row, gradeFn) => {
    const answers = Array.isArray(row && row.answers) ? row.answers : [];
    const total = answers.length || Number(row && row.total) || 0;
    const score = answers.reduce((sum, answer) => sum + taskPoints(row, answer), 0);
    const marks = answers.filter(answer => teacherMark(row, answer.task_id) !== null).length;
    const info = typeof gradeFn === 'function' ? gradeFn(score, total) : null;
    const percent = info && Number.isFinite(info.percent) ? info.percent : (total ? Math.round((score / total) * 100) : 0);
    const grade = info && Number.isFinite(info.grade) ? info.grade : null;
    return { score, total, percent, grade, marks };
  };

  // Ученик изменил работу («Ответ всё же совпал») уже после проверки учителя.
  const changedAfterReview = row => Boolean(row && row.reviewed_at && row.updated_at
    && new Date(row.updated_at).getTime() > new Date(row.reviewed_at).getTime() + 1000);

  // Задание, на которое учителю стоит посмотреть: ученик сам отметил «Ответ всё же совпал», а учитель ещё не ставил балл.
  const needsLook = (row, answer) => teacherMark(row, answer.task_id) === null && Boolean(answer.accepted);

  // Записать отметку: null — убрать (вернуть автопроверку по заданию).
  const withMark = (review, taskId, value) => {
    const next = { ...(review && typeof review === 'object' && !Array.isArray(review) ? review : {}) };
    if (value === null || value === undefined) delete next[String(taskId)];
    else if (POINTS.includes(value)) next[String(taskId)] = value;
    return next;
  };

  const formatPoints = value => (Number.isInteger(value) ? String(value) : String(value).replace('.', ','));

  /* Сводка по одной работе: столбцы — задания в порядке order (если он
     известен), затем задания, которых в нём нет; строки — сдачи. */
  const buildMatrix = (rows, order = [], gradeFn) => {
    const columns = [];
    const seen = new Set();
    const add = id => {
      const key = Number(id);
      if (!key || seen.has(key)) return;
      seen.add(key);
      columns.push(key);
    };
    order.forEach(add);
    (rows || []).forEach(row => (row.answers || []).forEach(answer => add(answer.task_id)));
    const lines = (rows || []).map(row => {
      const byTask = new Map((row.answers || []).map(answer => [Number(answer.task_id), answer]));
      const cells = columns.map(id => {
        const answer = byTask.get(id);
        if (!answer) return null;
        return { points: taskPoints(row, answer), mark: teacherMark(row, id) !== null, accepted: Boolean(answer.accepted) };
      });
      return { row, cells, totals: reviewTotals(row, gradeFn) };
    });
    const solved = columns.map((_, index) => {
      const present = lines.map(line => line.cells[index]).filter(Boolean);
      if (!present.length) return null;
      return Math.round((present.reduce((sum, cell) => sum + cell.points, 0) / present.length) * 100);
    });
    return { columns, lines, solved };
  };

  // Ячейка CSV: в кавычках, а «= + - @» в начале не дают Excel принять текст за формулу.
  const csvCell = value => {
    let text = value === null || value === undefined ? '' : String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };

  // Дата и время по часам компьютера учителя — как в списке сдач, а не в UTC.
  const localStamp = value => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const two = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`;
  };

  // CSV для Excel: разделитель «;», запятая в дробях, BOM — чтобы кириллица и латышские буквы читались.
  const matrixCsv = (matrix, labels = {}) => {
    const head = ['Ник', 'Дата', ...matrix.columns.map((id, index) => labels[id] || `№${index + 1}`), 'Баллы', 'Из', '%', 'Оценка', 'Проверено'];
    const body = matrix.lines.map(({ row, cells, totals }) => [
      row.nick,
      row.created_at ? localStamp(row.created_at) : '',
      ...cells.map(cell => (cell ? formatPoints(cell.points) : '')),
      formatPoints(totals.score),
      totals.total,
      totals.percent,
      totals.grade === null ? '' : totals.grade,
      row.reviewed_at ? 'да' : ''
    ]);
    return '\uFEFF' + [head, ...body].map(line => line.map(csvCell).join(';')).join('\r\n') + '\r\n';
  };

  const api = {
    POINTS,
    teacherMark,
    taskPoints,
    reviewTotals,
    changedAfterReview,
    needsLook,
    withMark,
    formatPoints,
    buildMatrix,
    csvCell,
    matrixCsv
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof globalThis !== 'undefined') globalThis.MathTasksCwReview = api;
})();
