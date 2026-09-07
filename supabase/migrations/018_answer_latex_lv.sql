-- Миграция 018: латышский ответ к задаче
--
-- У задачи двуязычными были название, условие, решение и подсказка,
-- а ответ — одной колонкой на оба языка. Формулы язык не выдают, но текст
-- внутри них выдаёт: латышский посетитель видел «$12\text{ см}$»,
-- «$\text{Доказано}$» и «Первая за $7{,}5\text{ ч}$, вторая за $30\text{ ч}$».
--
-- Запускать в Supabase: SQL Editor -> New query -> Run

alter table public.tasks add column if not exists answer_latex_lv text;

-- Ответы без единой кириллической буквы одинаковы на обоих языках:
-- «$x = 4$» по-латышски выглядит так же. Их копируем сразу, чтобы
-- не переводить вручную двести с лишним задач.
update public.tasks
   set answer_latex_lv = answer_latex
 where answer_latex is not null
   and answer_latex_lv is null
   and answer_latex !~ '[А-Яа-яЁё]';

-- Двадцать семь ответов содержали русский текст: единицы измерения,
-- «Доказано», «Минимум равен», «Первая за … вторая за». Их переводим,
-- остальные скопированы запросом выше как есть.
update public.tasks set answer_latex_lv = case id
  when 4 then '$\frac{3}{5}$ (jeb $0{,}6$)'
  when 6 then '$54\text{ cm}^2$'
  when 7 then '$\overline{x} \approx 7{,}44$, $\text{Mediāna} = 8$, $\text{Amplitūda} = 6$'
  when 10 then '$40\text{ cm}$'
  when 15 then '$V = 48\text{ cm}^3$, $S_{\text{sānu}} = 60\text{ cm}^2$'
  when 16 then '$-22$ (punktā $x = 3$)'
  when 22 then '$100\text{ g}$'
  when 28 then '$\text{Minimums ir } 1$'
  when 29 then '$b = 12\text{ cm}$'
  when 30 then '$h = 8\text{ cm},\; S = 128\text{ cm}^2$'
  when 31 then '$h = 12\text{ cm},\; S_1 = 30\text{ cm}^2,\; S_2 = 54\text{ cm}^2$'
  when 36 then '$10\text{ km/h}$'
  when 37 then 'Pirmā — $7{,}5\text{ h}$, otrā — $30\text{ h}$'
  when 39 then '$20(\sqrt{3} + 1)\text{ m} \approx 54{,}64\text{ m}$'
  when 40 then '$c = 2\sqrt{19}\text{ cm},\; S = 20\sqrt{3}\text{ cm}^2,\; r = \frac{20\sqrt{3}}{9 + \sqrt{19}}\text{ cm}$'
  when 42 then '$\text{Pierādīts}$'
  when 45 then '$120\text{ grāmatas}$'
  when 46 then '$60\text{ km}$'
  when 51 then 'Burtnīca $1{,}00\text{ EUR}$, pildspalva $0{,}80\text{ EUR}$'
  when 57 then '$a = 10\text{ cm};\; S = 96\text{ cm}^2;\; h = 9{,}6\text{ cm}$'
  when 58 then '$BK = 7\text{ cm};\; KC = 4\text{ cm};\; S_{ABKD} : S_{KCD} = 9 : 2$'
  when 62 then '$k = 2{,}5;\; S_{A_1B_1C_1} = 100\text{ cm}^2$'
  when 63 then '$CM = 3\text{ cm};\; MD = 12\text{ cm}$'
  when 64 then '$PB = 18\text{ cm}$'
  when 65 then '$\text{LKD}(24, 36) = 12$'
  when 67 then '$(7; 0)$ un $(2; 5)$; lielākais skaitlis $47520$'
  when 74 then '$(3; 0)$ un $(0; 9)$'
end
where id in (4, 6, 7, 10, 15, 16, 22, 28, 29, 30, 31, 36, 37, 39, 40, 42, 45, 46, 51, 57, 58, 62, 63, 64, 65, 67, 74);

comment on column public.tasks.answer_latex_lv is
  'Ответ на латышском. Пусто — сайт покажет answer_latex.';
