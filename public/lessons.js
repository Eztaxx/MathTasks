/* Уроки в духе Mathigon — чистые функции.

   Урок — цепочка шагов. Каждый шаг: короткий текст, иногда график с
   ползунками (как в Desmos) и вопрос. Следующий шаг открывается только
   после ответа: ученик не пролистывает объяснение, а проходит его. Не
   получилось дважды — показываем разбор и пускаем дальше, чтобы урок не
   становился стеной.

   Уроки лежат файлами в public/data/lessons/: пока их единицы, база не
   нужна, а правка урока — обычная правка файла в репозитории. */
(() => {
  const PROGRESS_KEY = 'math-tasks:lessons';
  // Параметр графика — одна латинская буква, кроме x (переменная) и e (константа).
  const PARAM_NAME = /^[a-df-wyz]$/;
  const LANGS = ['ru', 'lv'];

  /* Значения ползунков подставляем в формулу текстом, в скобках:
     «k*x+b» при k = −2, b = 3 → «(-2)*x+(3)». Графопостроитель знает только
     x, pi и e, поэтому своих букв ему не передаём. */
  const substituteParams = (expr, values = {}) => String(expr || '')
    .replace(/(^|[^a-z])([a-z])(?![a-z(])/gi, (match, before, name) => (
      Object.prototype.hasOwnProperty.call(values, name) ? `${before}(${Number(values[name])})` : match
    ));

  const paramDefaults = graph => Object.fromEntries((graph?.params || []).map(param => [param.name, param.value]));

  const textOf = (value, lang) => (value && typeof value === 'object' ? (value[lang] || value.ru || '') : String(value || ''));

  /* Проверка урока до публикации: оба языка у каждого текста, ответы
     проверяются автоматически, а формула графика строится при любом
     положении ползунков. Возвращает список ошибок — пустой значит годен. */
  const validateLesson = (lesson, { parseExpr = null, isAutoCheckable = null } = {}) => {
    const errors = [];
    const needBoth = (value, where) => {
      for (const lang of LANGS) {
        if (!value || typeof value !== 'object' || !String(value[lang] || '').trim()) errors.push(`${where}: нет текста ${lang.toUpperCase()}`);
      }
    };
    if (!lesson || typeof lesson !== 'object') return ['урок не объект'];
    if (!/^[a-z0-9-]+$/.test(lesson.slug || '')) errors.push('slug: только латиница, цифры и дефис');
    needBoth(lesson.title, 'title');
    needBoth(lesson.intro, 'intro');
    if (!Array.isArray(lesson.steps) || !lesson.steps.length) {
      errors.push('steps: нет шагов');
      return errors;
    }
    const ids = new Set();
    lesson.steps.forEach((step, index) => {
      const where = `шаг ${index + 1}${step?.id ? ` (${step.id})` : ''}`;
      if (!step?.id) errors.push(`${where}: нет id`);
      else if (ids.has(step.id)) errors.push(`${where}: id повторяется`);
      ids.add(step?.id);
      needBoth(step?.text, `${where}, text`);

      const graph = step?.graph;
      if (graph) {
        if (!graph.expr) errors.push(`${where}: у графика нет формулы`);
        const params = graph.params || [];
        for (const param of params) {
          if (!PARAM_NAME.test(param.name || '')) errors.push(`${where}: параметр «${param.name}» — нужна одна буква, не x и не e`);
          if (!(param.min < param.max)) errors.push(`${where}: у «${param.name}» min не меньше max`);
          if (!(param.value >= param.min && param.value <= param.max)) errors.push(`${where}: у «${param.name}» значение вне диапазона`);
        }
        if (parseExpr && graph.expr) {
          const probes = [paramDefaults(graph)];
          for (const param of params) {
            probes.push({ ...paramDefaults(graph), [param.name]: param.min }, { ...paramDefaults(graph), [param.name]: param.max });
          }
          for (const values of probes) {
            for (const part of substituteParams(graph.expr, values).split(';')) {
              if (!parseExpr(part.trim())) errors.push(`${where}: формула «${part.trim()}» не строится`);
            }
          }
        }
      }

      const question = step?.question;
      if (!question) {
        errors.push(`${where}: нет вопроса`);
        return;
      }
      needBoth(question.prompt, `${where}, вопрос`);
      if (question.explain) needBoth(question.explain, `${where}, разбор`);
      if (question.kind === 'number') {
        if (!String(question.answer || '').trim()) errors.push(`${where}: нет ответа`);
        else if (isAutoCheckable && !isAutoCheckable(question.answer, (question.check || []).join('\n'))) {
          errors.push(`${where}: ответ «${question.answer}» не проверяется автоматически`);
        }
      } else if (question.kind === 'choice') {
        const choices = question.choices || [];
        if (choices.length < 2) errors.push(`${where}: вариантов меньше двух`);
        choices.forEach((choice, i) => needBoth(choice, `${where}, вариант ${i + 1}`));
        if (!Number.isInteger(question.correct) || question.correct < 0 || question.correct >= choices.length) {
          errors.push(`${where}: верный вариант указан неверно`);
        }
      } else {
        errors.push(`${where}: вид вопроса «${question.kind}» неизвестен`);
      }
    });
    return errors;
  };

  // ── Прогресс ────────────────────────────────────────────────────────
  // { slug: { step: сколько шагов открыто, done: пройден ли, at: когда } }
  const readProgress = (storage = globalThis.localStorage) => {
    try {
      const data = JSON.parse(storage?.getItem(PROGRESS_KEY) || '{}');
      return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    } catch {
      return {};
    }
  };

  const writeProgress = (progress, storage = globalThis.localStorage) => {
    try { storage?.setItem(PROGRESS_KEY, JSON.stringify(progress)); } catch {}
  };

  /* Шаг вперёд. Открытое не закрывается: вернувшись в урок, ученик видит
     всё, что уже прошёл, и продолжает с того же места. */
  const advanceProgress = (progress, slug, stepsTotal, now = Date.now()) => {
    const current = progress[slug] || { step: 1, done: false };
    const step = Math.min(stepsTotal, Math.max(1, current.step) + 1);
    const done = current.done || Math.max(1, current.step) >= stepsTotal;
    return { ...progress, [slug]: { step, done, at: now } };
  };

  const resetProgress = (progress, slug) => {
    const next = { ...progress };
    delete next[slug];
    return next;
  };

  const api = {
    PROGRESS_KEY,
    substituteParams,
    paramDefaults,
    textOf,
    validateLesson,
    readProgress,
    writeProgress,
    advanceProgress,
    resetProgress
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof globalThis !== 'undefined') globalThis.MathTasksLessons = api;
})();
