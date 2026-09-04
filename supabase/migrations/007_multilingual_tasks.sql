-- Миграция 007: Мультиязычность для разделов, тем и задач (LV / RU / EN)
-- Запускать в Supabase: SQL Editor -> New query -> Run

-- 1. Таблица subjects (разделы)
alter table public.subjects add column if not exists title_lv text;
alter table public.subjects add column if not exists title_en text;

update public.subjects set
  title_lv = case slug
    when 'algebra' then 'Algebra'
    when 'geometry' then 'Ģeometrija'
    when 'statistics' then 'Statistika un varbūtība'
    else title_lv
  end,
  title_en = case slug
    when 'algebra' then 'Algebra'
    when 'geometry' then 'Geometry'
    when 'statistics' then 'Statistics & Probability'
    else title_en
  end
where title_lv is null or title_en is null;

-- 2. Таблица topics (темы)
alter table public.topics add column if not exists title_lv text;
alter table public.topics add column if not exists title_en text;
alter table public.topics add column if not exists description_lv text;
alter table public.topics add column if not exists description_en text;

-- 3. Таблица tasks (задания)
alter table public.tasks add column if not exists title_lv text;
alter table public.tasks add column if not exists title_en text;
alter table public.tasks add column if not exists condition_latex_lv text;
alter table public.tasks add column if not exists condition_latex_en text;
alter table public.tasks add column if not exists solution_latex_lv text;
alter table public.tasks add column if not exists solution_latex_en text;
