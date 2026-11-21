-- Миграция 034: указатель опубликованных задач одним запросом.
--
-- Каталог сайта (loadCatalog в public/app.js) тянул id всех задач страницами
-- по 1000 строк строго по очереди: ~1,6 с до первой отрисовки, и каждая новая
-- тысяча задач добавляла ещё ~0,12 с. Функция отдаёт тот же указатель одним
-- скалярным json — PostgREST не режет его лимитом строк.
--
-- Только новая функция: таблицы, политики и права таблиц не меняются.
-- security invoker — действуют те же RLS, что при чтении tasks напрямую.
-- Явный is_published = true обязателен: политика из 026 пускает anon к
-- черновикам внутри опубликованных работ, а администратор видит все черновики.
-- stable — чтобы функцию можно было звать через GET (его кэширует sw.js).
--
-- До применения сайт читает указатель страницами, как раньше.
-- Проверка после применения (SQL Editor):
--   select sum(json_array_length(g->'ids')) from json_array_elements(public.catalog_index()) g;
--   select count(*) from public.tasks where is_published;   -- числа совпадают
--   set role anon; (повторить первый запрос) reset role;

create or replace function public.catalog_index()
returns json
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    json_agg(json_build_object('t', g.topic_id, 's', g.subtopic_id, 'ids', g.ids)
             order by g.topic_id, g.subtopic_id),
    '[]'::json)
  from (
    select t.topic_id, t.subtopic_id, array_agg(t.id order by t.id) as ids
    from public.tasks t
    where t.is_published = true
    group by t.topic_id, t.subtopic_id
  ) g
$$;

revoke all on function public.catalog_index() from public;
grant execute on function public.catalog_index() to anon, authenticated, service_role;

notify pgrst, 'reload schema';
