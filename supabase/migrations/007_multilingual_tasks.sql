-- Миграция 007: двуязычность разделов, тем и задач (LV / RU)
-- Базовый язык — русский, он лежит в основных колонках.
-- Латышский хранится в парных колонках с суффиксом _lv.
-- Английский не предусмотрен: на сайте его не будет.
-- Запускать в Supabase: SQL Editor -> New query -> Run

-- 1. Разделы
alter table public.subjects add column if not exists title_lv text;

update public.subjects set
  title_lv = case slug
    when 'algebra' then 'Algebra'
    when 'geometry' then 'Ģeometrija'
    when 'statistics' then 'Statistika un varbūtība'
    else title_lv
  end
where title_lv is null;

-- 2. Темы
alter table public.topics add column if not exists title_lv text;
alter table public.topics add column if not exists description_lv text;

-- 3. Задания
alter table public.tasks add column if not exists title_lv text;
alter table public.tasks add column if not exists condition_latex_lv text;
alter table public.tasks add column if not exists solution_latex_lv text;
