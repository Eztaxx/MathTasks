/* public/i18n.js — обычный скрипт браузера. Как и lib.js, без window и
   module он кладёт себя в globalThis (esbuild не видит в нём модуля).
   Воркер берёт отсюда те же строки заголовков и описаний, что ставит
   приложение (ключи meta_*): после загрузки скриптов они не меняются. */
import '../public/i18n.js';

const i18n = globalThis.MathTasksI18n;
if (!i18n) throw new Error('public/i18n.js не положил словарь в globalThis.MathTasksI18n');

export const t = (key, params, lang) => i18n.t(key, params || {}, lang);
