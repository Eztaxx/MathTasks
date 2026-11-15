/* «Начала»: подписи без смайликов.
   В словаре (i18n.js) у кнопок и заголовков тренажёра и экзаменов подписи
   начинаются со смайлика — «🍰 Обыкновенные дроби», «⏱️ Спринт 60 сек».
   В новом оформлении смайликов нет. Словарь общий для страниц, воркера и
   соседних задач, поэтому строки в нём не трогаем, а на странице убираем
   смайлик в начале первого текста элемента — и после перевода, и после
   перерисовки скриптом (наблюдатель за DOM). Формулы KaTeX, поля ввода и
   примеры тренажёра не трогаем. */
(() => {
  const LEAD = /^(\s*)(?:[\p{Extended_Pictographic}\u2190-\u21FF\u2300-\u23FF\u2460-\u27BF\u2B00-\u2BFF\uFE0F\u200D]+\s*)+/u;
  const TARGETS = 'button, a, h1, h2, h3, summary, label, li, span, strong, p, div[data-i18n], div[data-i18n-html], .sheet-stopwatch';
  const SKIP = '.katex, input, textarea, [contenteditable], .trainer-formula, .trainer-formula-task, .compact-drill-expr, .compact-drill-status, .feedback-icon, .numpad-key, .math, [data-keep-emoji]';

  const cleanElement = el => {
    // Звук: скрипт пишет в значок 🔊 / 🔇 — переводим это в пометку на кнопке, значок рисует CSS.
    if (el.id === 'sound-icon') {
      const text = el.textContent.trim();
      if (text) {
        el.closest('button')?.setAttribute('data-sound', text.includes('🔇') ? 'off' : 'on');
        el.textContent = '';
      }
      return;
    }
    if (el.closest(SKIP)) return;
    // Первый непустой ребёнок должен быть текстом: «<b>…</b> 🍰» не трогаем.
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!node.textContent.trim()) continue;
        const next = node.textContent.replace(LEAD, '$1');
        if (next !== node.textContent) node.textContent = next;
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE) return;
    }
  };

  const cleanTree = root => {
    if (!root || root.nodeType !== Node.ELEMENT_NODE) return;
    if (root.matches(TARGETS)) cleanElement(root);
    root.querySelectorAll(TARGETS).forEach(cleanElement);
  };

  let pending = new Set();
  let scheduled = false;
  const flush = () => {
    scheduled = false;
    const roots = pending;
    pending = new Set();
    roots.forEach(cleanTree);
  };
  const schedule = node => {
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!el) return;
    pending.add(el);
    if (!scheduled) { scheduled = true; requestAnimationFrame(flush); }
  };

  const start = () => {
    cleanTree(document.body);
    new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData') schedule(record.target);
        else record.addedNodes.forEach(schedule);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
