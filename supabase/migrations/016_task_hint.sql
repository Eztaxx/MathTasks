-- Миграция 016: подсказка к задаче
-- Третья ступень раскрытия между «Ответом» и «Решением».
-- Ученику чаще нужно понять, где он свернул, чем увидеть готовое решение:
-- подсказка называет приём или первый шаг, не выдавая ответа.
-- Запускать в Supabase: SQL Editor -> New query -> Run

alter table public.tasks add column if not exists hint_latex text;
alter table public.tasks add column if not exists hint_latex_lv text;

comment on column public.tasks.hint_latex is
  'Подсказка: направление решения без готового ответа. Формулы — между $…$';
comment on column public.tasks.hint_latex_lv is
  'То же на латышском. Пусто — на латышской версии показывается русский текст';
