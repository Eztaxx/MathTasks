/* Синхронизация прогресса ученика — без интерфейса.

   Профиль (profile.js, карточка на «Моём прогрессе») создаёт вход и
   показывает состояние, а переносит прогресс этот файл. Он же работает на
   страницах тренажёра и дуэли: рекорд из тренажёра уходит на сервер сразу,
   а не при следующем заходе в каталог. Приложению из Google Play это
   особенно важно — его часто открывают прямо на тренажёре.

   Страница без каталога ставит на тег скрипта data-auto и запускает
   синхронизацию сама — и только если на устройстве уже есть профиль:
   обычный посетитель тренажёра не делает ни одного лишнего запроса.

   Запись на сервер — через save_progress (миграция 032) с номером версии:
   если за это время записало другое устройство, снимок читается заново и
   сливается ещё раз. Пока миграции нет — прежняя запись upsert. */
(() => {
  const SYNC_EVERY_MS = 30 * 1000;
  const MAX_ATTEMPTS = 3;
  const TOUCH_KEY = 'math-tasks:profile-touched';
  // Списки после прошлого слияния на этом устройстве — из них journal узнаёт, что убрали.
  const BASE_KEY = 'math-tasks:sync-base';
  const auto = Boolean(document.currentScript?.hasAttribute('data-auto'));

  /* Страница тренажёра не грузит ни клиент Supabase, ни lib.js. Их
     подгружаем только ученику с профилем; адрес и хеш supabase-js — те же,
     что на остальных страницах (проверяет tests/progress-sync.test.js). */
  const SCRIPTS = [
    { src: '/config.js', present: () => window.SUPABASE_CONFIG },
    {
      src: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.113.0/dist/umd/supabase.js',
      integrity: 'sha384-6RfftBe0Rakn679H2xsb03EtYfeYGfNLCmLKWQCR71Xg7Z/hDhZc2N2ZIuJwREJX',
      present: () => window.supabase?.createClient
    },
    { src: '/lib.js', present: () => window.MathTasksLib }
  ];

  let db = null;
  let profileId = null;
  let versioned = null;   // есть ли столбец version (миграция 032); null — ещё не знаем
  let lastSignature = null;
  let lastSyncAt = 0;
  let syncing = false;
  let timer = null;
  let started = false;

  const lib = () => window.MathTasksLib;

  // Сессия supabase-js лежит в localStorage: читаем её сами, без запросов.
  const storedUser = () => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
        const session = JSON.parse(localStorage.getItem(key));
        if (session?.user) return session.user;
      }
    } catch {}
    return null;
  };
  const hasStudentSession = () => Boolean(storedUser()?.is_anonymous);
  // Вход администратора анонимный вход бы заменил — и выкинул его из админки.
  const hasAdminSession = () => {
    const user = storedUser();
    return Boolean(user && !user.is_anonymous);
  };

  const readBase = () => {
    try {
      const base = JSON.parse(localStorage.getItem(BASE_KEY));
      return base && typeof base === 'object' ? base : null;
    } catch {
      return null;
    }
  };
  const writeBase = data => {
    try { localStorage.setItem(BASE_KEY, JSON.stringify(lib().syncBaseOf(data))); } catch {}
  };

  const errorText = error => `${error?.code || ''} ${error?.message || ''}`;
  const missingColumn = error => /42703/.test(errorText(error)) || /column .*version/i.test(errorText(error));
  const missingFunction = error => /PGRST202|42883/.test(errorText(error)) || /could not find the function/i.test(errorText(error));

  async function readRemote() {
    if (versioned !== false) {
      const { data, error } = await db.from('student_progress').select('data,version').eq('profile_id', profileId).maybeSingle();
      if (!error) {
        versioned = true;
        return { data: data?.data || {}, version: Number(data?.version) || 0 };
      }
      if (!missingColumn(error)) throw error;
      versioned = false;
    }
    const { data, error } = await db.from('student_progress').select('data').eq('profile_id', profileId).maybeSingle();
    if (error) throw error;
    return { data: data?.data || {}, version: null };
  }

  // true — записано; false — строку успели поменять с другого устройства.
  async function writeRemote(merged, version) {
    if (versioned) {
      const { data, error } = await db.rpc('save_progress', { p_data: merged, p_version: version });
      if (!error) return data !== null;
      if (!missingFunction(error)) throw error;
      versioned = false;
    }
    const { error } = await db.from('student_progress')
      .upsert({ profile_id: profileId, data: merged, updated_at: new Date().toISOString() });
    if (error) throw error;
    return true;
  }

  /* Прочитать снимок с сервера, слить с местным, записать и то и другое.
     Снимок на сервере пишем, только если после слияния он отличается. */
  async function sync() {
    const L = lib();
    if (!db || !profileId || !L || syncing) return false;
    syncing = true;
    try {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const remote = await readRemote();
        const current = L.collectProgress(localStorage);
        const local = L.noteListChanges(current, readBase());
        const merged = L.mergeProgress(local, remote.data);
        const signature = L.progressSignature(merged);
        if (signature !== L.progressSignature(current)) {
          L.applyProgress(localStorage, merged);
          window.dispatchEvent(new CustomEvent('math-tasks:progress-synced'));
        }
        writeBase(merged);
        if (signature !== L.progressSignature(remote.data) && !(await writeRemote(merged, remote.version))) continue;
        lastSignature = signature;
        lastSyncAt = Date.now();
        window.dispatchEvent(new CustomEvent('math-tasks:sync-done', { detail: { at: lastSyncAt } }));
        return true;
      }
    } catch {
      // Сеть пропала или база ответила ошибкой — попробуем в следующий раз, прогресс в браузере цел.
    } finally {
      syncing = false;
    }
    return false;
  }

  // Раз в полминуты — только если прогресс поменялся с прошлой синхронизации.
  const syncIfChanged = () => {
    const L = lib();
    if (!profileId || !L) return;
    if (L.progressSignature(L.collectProgress(localStorage)) !== lastSignature) sync();
  };

  // Ушёл со страницы — отправляем; вернулся — забираем с других устройств.
  const onVisibility = () => (document.visibilityState === 'hidden' ? syncIfChanged() : sync());
  // Сеть вернулась (урок в метро, режим полёта) — отправляем накопленное сразу.
  const onOnline = () => sync();

  function start() {
    if (started || !profileId) return;
    started = true;
    timer = setInterval(syncIfChanged, SYNC_EVERY_MS);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
    // Отметка активности раз в день: по ней чистятся заброшенные профили.
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (localStorage.getItem(TOUCH_KEY) !== today) {
        db.rpc('touch_profile').then(() => localStorage.setItem(TOUCH_KEY, today)).catch(() => {});
      }
    } catch {}
  }

  function stop() {
    started = false;
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('online', onOnline);
  }

  // Профиль сменился (создан, подключён по коду, удалён) — синхронизация начинается заново.
  function attach(client, id) {
    db = client;
    if (id === profileId) return;
    profileId = id || null;
    lastSignature = null;
    if (!profileId) {
      stop();
      try { localStorage.removeItem(BASE_KEY); } catch {}
    }
  }

  const loadScript = ({ src, integrity }) => new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    if (integrity) {
      el.integrity = integrity;
      el.crossOrigin = 'anonymous';
      el.referrerPolicy = 'no-referrer';
    }
    el.onload = resolve;
    el.onerror = reject;
    document.head.append(el);
  });

  /* Профиль на этом устройстве есть — profile.js пишет его ник сюда.
     Анонимный вход без профиля (неверный код переноса, профиль удалён на
     другом устройстве) не повод грузить Supabase на каждой странице. */
  const hasProfileMark = () => {
    try { return Boolean(localStorage.getItem('math-tasks:profile')); } catch { return false; }
  };

  async function autoStart() {
    if (!hasStudentSession() || !hasProfileMark()) return;
    try {
      for (const script of SCRIPTS) if (!script.present()) await loadScript(script);
      const cfg = window.SUPABASE_CONFIG;
      if (!cfg?.url || !cfg?.publishableKey || !window.supabase?.createClient || !lib()) return;
      // Параметры — как в client.js: тот же ключ хранения, значит, та же сессия.
      const client = window.MathTasks?.db || window.supabase.createClient(cfg.url, cfg.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      const { data, error } = await client.from('student_profiles').select('id').maybeSingle();
      if (error) return;
      if (!data?.id) {
        // Профиль удалён на другом устройстве — больше не грузим Supabase на каждой странице.
        try { localStorage.removeItem('math-tasks:profile'); } catch {}
        return;
      }
      attach(client, data.id);
      await sync();
      start();
    } catch {
      // Нет сети или профиля — страница работает как обычно, прогресс остаётся в браузере.
    }
  }

  window.MathTasksSync = {
    hasStudentSession,
    hasAdminSession,
    attach,
    start,
    stop,
    sync,
    get lastSyncAt() { return lastSyncAt; }
  };

  if (auto) autoStart();
})();
