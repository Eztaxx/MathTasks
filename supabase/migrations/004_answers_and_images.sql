-- Ответ отдельно от разбора и чертежи к задачам.
-- Решебник обычно даёт три ступени: условие -> ответ -> полное решение.
-- Без картинок геометрию за 7-9 класс в базу не залить: половина условий
-- не помещается в текст.
-- Запускать в Supabase: SQL Editor -> New query.

alter table public.tasks add column if not exists answer_latex text;

-- Хранится путь внутри бакета, а не готовый URL: бакет можно переименовать
-- или закрыть, пути это переживут. Ссылка собирается на клиенте.
alter table public.tasks add column if not exists condition_image text;
alter table public.tasks add column if not exists solution_image text;
