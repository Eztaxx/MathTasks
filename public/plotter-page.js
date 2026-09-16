/* Логика полноэкранной страницы графика (plotter.html).
   Встроенные скрипты запрещены политикой безопасности (script-src 'self'),
   поэтому весь код страницы живёт здесь. Рисование берём из plotter.js —
   тот же движок работает и в диалоге на главной. */
(() => {
  const engine = globalThis.MathPlotter;
  const canvas = document.querySelector('#plot-canvas');
  if (!engine || !canvas) return;

  const t = (key, params) => (window.MathTasks && window.MathTasks.t ? window.MathTasks.t(key, params) : key);

  const input = document.querySelector('#plot-expr');
  const form = document.querySelector('#plot-form');
  const legendBox = document.querySelector('#plot-legend');
  const readout = document.querySelector('#plot-readout');
  const rootsBox = document.querySelector('#plot-roots');
  const copyBtn = document.querySelector('#plot-copy-link');

  // Тема: переключатель как на остальных страницах, график перерисовываем
  const themeToggle = document.querySelector('#theme-toggle');
  if (themeToggle) {
    const isDarkNow = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
    themeToggle.setAttribute('aria-checked', isDarkNow ? 'true' : 'false');
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      document.body.classList.toggle('dark', isDark);
      localStorage.setItem('math-tasks:theme', isDark ? 'dark' : 'light');
      themeToggle.setAttribute('aria-checked', isDark ? 'true' : 'false');
      plotter.redraw();
    });
  }

  const fmt = value => {
    if (!Number.isFinite(value)) return '—';
    const abs = Math.abs(value);
    if (abs !== 0 && (abs < 1e-4 || abs >= 1e6)) return value.toExponential(2);
    return String(Math.round(value * 1000) / 1000);
  };

  let lastRoots = [];
  let lastItems = [];

  function renderLegend(items) {
    lastItems = items;
    legendBox.innerHTML = '';
    items.forEach((item, i) => {
      const chip = document.createElement('span');
      chip.className = 'plot-legend-item' + (item.ok ? '' : ' is-bad');
      const dot = document.createElement('i');
      dot.style.background = engine.COLORS[i % engine.COLORS.length];
      chip.append(dot, document.createTextNode('y = ' + item.src));
      chip.title = item.ok ? '' : t('plot_formula_error');
      legendBox.append(chip);
    });
    const broken = items.some(item => !item.ok);
    legendBox.classList.toggle('has-error', broken);
    if (broken) {
      const err = document.createElement('span');
      err.className = 'plot-legend-error';
      err.textContent = t('plot_formula_error');
      legendBox.append(err);
    }
  }

  function renderRoots() {
    if (!lastItems.length || !lastItems[0].ok) {
      rootsBox.textContent = '';
      return;
    }
    rootsBox.textContent = lastRoots.length
      ? t('plot_roots') + lastRoots.map(r => 'x ≈ ' + fmt(r)).join(';  ')
      : t('plot_no_roots');
  }

  function renderReadout(point) {
    if (!point) {
      readout.textContent = '';
      readout.classList.remove('is-on');
      return;
    }
    const values = plotter.valueAt(point.x);
    const parts = [`x = ${fmt(point.x)}`];
    values.forEach((y, i) => {
      const label = values.length > 1 ? `y${i + 1}` : 'y';
      parts.push(`${label} = ${y === null ? '—' : fmt(y)}`);
    });
    readout.textContent = parts.join('   ');
    readout.classList.add('is-on');
  }

  /* Адрес страницы держим в актуальном состоянии: ссылку можно скинуть
     ученику, и он увидит ровно тот же график в том же масштабе. */
  let urlTimer = 0;
  function syncUrl(view) {
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => {
      const params = new URLSearchParams();
      params.set('f', input.value.trim());
      params.set('cx', String(Math.round(view.cx * 1000) / 1000));
      params.set('cy', String(Math.round(view.cy * 1000) / 1000));
      params.set('s', String(Math.round(view.scale * 1000) / 1000));
      history.replaceState(null, '', location.pathname + '?' + params.toString());
    }, 250);
  }

  const plotter = engine.createPlotter(canvas, {
    fillParent: true,
    minHeight: 260,
    onCoords: point => renderReadout(point),
    onRoots: roots => {
      lastRoots = roots;
      renderRoots();
    },
    onViewChange: syncUrl
  });

  function apply(expr) {
    const items = plotter.setExpressions(expr);
    renderLegend(items);
  }

  // Стартовое состояние из адреса: формула и окно просмотра
  const params = new URLSearchParams(location.search);
  const startExpr = (params.get('f') || '').trim();
  if (startExpr) input.value = startExpr;
  /* Пустой параметр — не ноль: Number(null) даёт 0, и масштаб из адреса
     обнулялся, а график открывался вытянутым на десятки тысяч единиц. */
  const num = key => {
    const raw = params.get(key);
    if (raw === null || raw.trim() === '') return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  };
  plotter.setView({ cx: num('cx'), cy: num('cy'), scale: num('s') });
  apply(input.value);

  form.addEventListener('submit', e => {
    e.preventDefault();
    apply(input.value);
    canvas.focus();
  });

  document.querySelectorAll('.plotter-chip[data-fn]').forEach(chip => {
    chip.addEventListener('click', () => {
      input.value = chip.dataset.fn;
      apply(input.value);
    });
  });

  document.querySelector('#plot-zoom-in').addEventListener('click', () => plotter.zoomBy(1.4));
  document.querySelector('#plot-zoom-out').addEventListener('click', () => plotter.zoomBy(1 / 1.4));
  document.querySelector('#plot-zoom-reset').addEventListener('click', () => plotter.reset());

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        const before = copyBtn.textContent;
        copyBtn.textContent = t('plotter_link_copied');
        copyBtn.classList.add('is-done');
        setTimeout(() => {
          copyBtn.textContent = before;
          copyBtn.classList.remove('is-done');
        }, 1600);
      } catch {
        input.focus();
      }
    });
  }

  function syncTitle() {
    document.title = t('plotter_page_title') + ' — MathTasks';
  }
  syncTitle();

  window.addEventListener('languagechange', () => {
    syncTitle();
    renderLegend(lastItems);
    renderRoots();
  });
})();
