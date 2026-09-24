/*
 * Чтение таблицы Supabase целиком.
 *
 * PostgREST отдаёт не больше 1000 строк за запрос и режет молча: ни
 * ошибки, ни признака обрезки в ответе. Так restore.mjs видел в task_tags
 * 1000 строк из 1420 и звал «вернуть» 420 связок, которые в базе есть.
 * Поэтому таблицу читаем страницами через заголовок Range.
 *
 * Порядок обязателен и должен быть однозначным — по ключу таблицы: без
 * него страницы на стыках теряют и повторяют строки, а число строк при
 * этом сходится, и обрыв не виден. Запрос без order= помощник не
 * выполняет, чтобы скопированный в новый скрипт вызов не унёс эту ошибку.
 */

export const PAGE = 1000;

export async function fetchAll(url, headers) {
  if (!/[?&]order=/.test(url)) {
    throw new Error(`Чтение без порядка: ${url} — добавьте order= по ключу таблицы`);
  }
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const res = await fetch(url, { headers: { ...headers, Range: `${from}-${from + PAGE - 1}` } });
    // Ошибка на любой странице — таблица не прочитана: неполный список
    // выдал бы имеющиеся строки за пропавшие.
    if (!res.ok) throw new Error(`${url} → ${res.status} ${(await res.text()).slice(0, 200)}`);
    const chunk = await res.json();
    rows.push(...chunk);
    if (chunk.length < PAGE) return rows;
  }
}
