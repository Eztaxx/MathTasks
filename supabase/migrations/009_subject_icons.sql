-- Миграция 009: по одному узнаваемому значку на раздел
-- Значки показываются в боковом меню, на карточках тем и в панели.
-- До этого часть разделов имела математические глифы (△, θ), у двух
-- стояла одинаковая заглушка «x²» из формы добавления, а у стереометрии
-- в значении был невидимый символ — в списках это выглядело как
-- пропавшие или совпадающие значки.
-- Уже применена на боевой базе; здесь — чтобы её можно было повторить.
-- Запускать в Supabase: SQL Editor -> New query -> Run

update public.subjects set icon = '🔢' where title = 'Арифметика';
update public.subjects set icon = '🧮' where title = 'Алгебра';
update public.subjects set icon = '📈' where title = 'Функции';
update public.subjects set icon = '📐' where title = 'Планиметрия';
update public.subjects set icon = '🌊' where title = 'Тригонометрия';
update public.subjects set icon = '🧊' where title = 'Стереометрия';
update public.subjects set icon = '📊' where title = 'Статистика, вероятность и комбинаторика';
update public.subjects set icon = '🧩' where title = 'Логика и текстовые задачи';
update public.subjects set icon = '📉' where title = 'Математический анализ';

-- Подчистка на будущее: невидимые символы в значке приводят к тому,
-- что он «не показывается», хотя поле не пустое.
update public.subjects
   set icon = regexp_replace(icon, '[​-‍﻿]', '', 'g')
 where icon ~ '[​-‍﻿]';
