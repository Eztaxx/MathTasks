/* Форма «Написать нам» на странице /privacy (worker/contact.js).

   Сообщение уходит администратору в Telegram и нигде не хранится. От
   спама — невидимая проверка Cloudflare Turnstile (её скрипт грузим только
   при отправке) и счётчик частоты в воркере. Ник подставляем из профиля на
   этом устройстве, если он есть. */
(() => {
  const tr = key => (window.MathTasks?.t ? window.MathTasks.t(key) : key);
  const lang = () => (window.MathTasks?.getLang ? window.MathTasks.getLang() : 'lv');

  let configPromise = null;
  const config = () => (configPromise ||= fetch('/api/contact', { headers: { Accept: 'application/json' } })
    .then(response => (response.ok ? response.json() : { enabled: false }))
    .catch(() => { configPromise = null; return { enabled: false }; }));

  let turnstileScript = null;
  let widget = null;
  let done = null;
  const loadTurnstile = () => {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    turnstileScript ||= new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')));
      script.onerror = () => { turnstileScript = null; reject(new Error('turnstile')); };
      document.head.append(script);
    });
    return turnstileScript;
  };

  async function humanToken(form, siteKey) {
    const box = form.querySelector('[data-contact-turnstile]');
    if (!siteKey || !box) return '';
    try {
      const turnstile = await loadTurnstile();
      return await new Promise(resolve => {
        const timer = setTimeout(() => resolve(''), 30000);
        done = token => { clearTimeout(timer); done = null; resolve(token || ''); };
        if (widget === null) {
          widget = turnstile.render(box, {
            sitekey: siteKey,
            execution: 'execute',
            appearance: 'interaction-only',
            language: lang() === 'ru' ? 'ru' : 'lv',
            theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
            callback: token => done?.(token),
            'error-callback': () => { done?.(''); return true; },
            'expired-callback': () => done?.('')
          });
        } else {
          turnstile.reset(widget);
        }
        turnstile.execute(widget);
      });
    } catch {
      return '';
    }
  }

  const ERROR_KEYS = {
    message_short: 'contact_err_short',
    message_long: 'contact_err_long',
    too_often: 'contact_err_often',
    human: 'contact_err_human',
    unavailable: 'contact_err_unavailable'
  };

  function profileNick() {
    try {
      return JSON.parse(localStorage.getItem('math-tasks:profile') || 'null')?.nick || '';
    } catch {
      return '';
    }
  }

  function bind(form) {
    if (form.dataset.bound) return;
    form.dataset.bound = '1';
    const status = form.querySelector('[data-contact-status]');
    const button = form.querySelector('button[type="submit"]');
    const setStatus = (key, kind = '') => {
      status.textContent = key ? tr(key) : '';
      status.className = `contact-status${kind ? ` is-${kind}` : ''}`;
    };
    // Кнопка в разметке выключена: без этого скрипта форма не отправляется вовсе.
    button.disabled = false;
    const nickInput = form.elements.nick;
    if (nickInput && !nickInput.value) nickInput.value = profileNick();

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const message = form.elements.message.value.trim();
      if (message.length < 5) { setStatus('contact_err_short', 'error'); form.elements.message.focus(); return; }
      button.disabled = true;
      setStatus('contact_sending');
      try {
        const settings = await config();
        if (!settings.enabled) { setStatus('contact_err_unavailable', 'error'); return; }
        const token = await humanToken(form, settings.turnstile);
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: form.elements.topic.value,
            nick: form.elements.nick.value,
            message,
            reply: form.elements.reply.value,
            lang: lang(),
            token
          })
        });
        const result = await response.json().catch(() => ({}));
        if (response.ok && result.ok) {
          form.reset();
          if (nickInput) nickInput.value = profileNick();
          setStatus('contact_sent', 'ok');
        } else {
          setStatus(ERROR_KEYS[result.error] || 'contact_err_send', 'error');
        }
      } catch {
        setStatus('contact_err_send', 'error');
      } finally {
        button.disabled = false;
      }
    });
  }

  const init = () => document.querySelectorAll('[data-contact-form]').forEach(bind);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
