-- Миграция 008: латышские названия остальных разделов
-- Миграция 007 заполнила только три исходных раздела (algebra, geometry,
-- statistics). Разделы, добавленные вручную позже, остались без title_lv,
-- и на латышской версии сайта показывались по-русски.
-- Уже применена на боевой базе; здесь — чтобы её можно было повторить.
-- Запускать в Supabase: SQL Editor -> New query -> Run

update public.subjects set title_lv = 'Aritmētika'
  where title = 'Арифметика' and title_lv is null;

update public.subjects set title_lv = 'Funkcijas'
  where title = 'Функции' and title_lv is null;

update public.subjects set title_lv = 'Trigonometrija'
  where title = 'Тригонометрия' and title_lv is null;

update public.subjects set title_lv = 'Stereometrija'
  where title = 'Стереометрия' and title_lv is null;

update public.subjects set title_lv = 'Loģika un tekstuālie uzdevumi'
  where title = 'Логика и текстовые задачи' and title_lv is null;

update public.subjects set title_lv = 'Matemātiskā analīze'
  where title = 'Математический анализ' and title_lv is null;
