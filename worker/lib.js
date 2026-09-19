/* public/lib.js — обычный скрипт браузера без export. esbuild, которым
   wrangler собирает воркер, не видит в нём модуля и на любой именованный
   импорт отдавал бы undefined («has no exports») — тесты этого не ловят,
   vitest такие файлы понимает. Поэтому файл подключается ради побочного
   эффекта: без window и module он кладёт свои функции в
   globalThis.MathTasksLib, а отсюда они расходятся обычными экспортами. */
import '../public/lib.js';

const lib = globalThis.MathTasksLib;
if (!lib) throw new Error('public/lib.js не положил функции в globalThis.MathTasksLib');

export const {
  formatSubtopicCode,
  formatTopicTitle,
  getCrossTag,
  getDifficultyWeight,
  getLocalizedText,
  isLocalizablePath,
  langOfPath,
  latexToPlainText,
  localizeHref,
  makeSlug,
  stripLangPath,
  taskDescription,
  toLangPath
} = lib;
