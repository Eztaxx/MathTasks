-- ============================================================================
-- Seed: Темы и задачи курса Visparigais limenis (Skola2030 / 10 klase)
-- Запуск в Supabase: SQL Editor -> New query -> Paste & Run
-- ============================================================================

-- 1. Вставка тем
insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Числовые расчеты в жизненных ситуациях', 'Skaitliski aprēķini dzīves darbībās', 'visp-skaitliski-aprekini-dzive', (select id from public.subjects where slug = 'algebra'), 10, 1, 'Округление, оценка правдоподобия результатов, расчет стоимости покупок, коммунальных платежей и расхода топлива.', 'Noapaļošana, rezultātu ticamības novērtēšana, pirkumu, komunālo maksājumu un degvielas patēriņa aprēķini.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Проценты, кредиты и финансовые расчеты', 'Procenti, kredīti un finanšu aprēķini', 'visp-procenti-krediti-finanses', (select id from public.subjects where slug = 'algebra'), 10, 2, 'Скидки, налог на добавленную стоимость (PVN), простые и сложные проценты по вкладам и кредитам.', 'Atlaides, pievienotās vērtības nodoklis (PVN), vienkāršie un saliktie procenti noguldījumiem un kredītiem.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Преобразование выражений и работа с формулами', 'Izteiksmju pārveidošana un formulu lietošana', 'visp-izteiksmes-un-formulas', (select id from public.subjects where slug = 'algebra'), 10, 3, 'Выражение неизвестной переменной из формулы, раскрытие скобок, приведение подобных слагаемых.', 'Nezināmā lieluma izteikšana no formulas, iekavu atvēršana, līdzīgo saskaitāmo savilkšana.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Линейные и квадратные уравнения в практическом контексте', 'Lineāri un kvadrātvienādojumi praktiskos kontekstos', 'visp-vienadojumi-praktiski', (select id from public.subjects where slug = 'algebra'), 10, 4, 'Решение уравнений, составление математических моделей для практических и сюжетных задач.', 'Vienādojumu risināšana, matemātisko modeļu veidošana praktiskām un teksta situācijām.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Неравенства и числовые промежутки', 'Nevienādības un skaitļu intervāli', 'visp-nevienadibas-intervali', (select id from public.subjects where slug = 'algebra'), 10, 5, 'Линейные неравенства, числовая прямая, объединение и пересечение числовых промежутков.', 'Lineāras nevienādības, skaitļu taisne, intervālu apvienojums un šķēlums.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Функция как зависимость между величинами', 'Funkcija kā sakarība starp lielumiem', 'visp-funkcija-sakariba', (select id from public.subjects where slug = 'algebra'), 10, 6, 'Понятие функции, аргумент и значение функции, область определения и область значений.', 'Funkcijas jēdziens, arguments un funkcijas vērtība, definīcijas un vērtību apgabals.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Линейная функция и её применение', 'Lineāra funkcija un tās lietojums', 'visp-lineara-funkcija', (select id from public.subjects where slug = 'algebra'), 10, 7, 'Прямая пропорциональность, угловой коэффициент, построение прямой и чтение графика.', 'Tiešā proporcionalitāte, virziena koeficients, taisnes konstruēšana un grafika nolasīšana.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Квадратичная функция и её график', 'Kvadrātfunkcija un tās grafiks', 'visp-kvadratfunkcija-grafiks', (select id from public.subjects where slug = 'algebra'), 10, 8, 'Вершина параболы, направление ветвей, нули функции, моделирование траектории движения.', 'Parabolas virsotne, zaru virziens, funkcijas nulles, kustības trajektorijas modelēšana.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Чтение графиков и таблиц в реальных данных', 'Grafiku un tabulu lasīšana reālos datos', 'visp-grafiki-tabulas-dati', (select id from public.subjects where slug = 'algebra'), 10, 9, 'Анализ графиков температуры, потребления электроэнергии, скорости, поиск экстремумов и интервалов возрастания.', 'Temperatūras, elektrības patēriņa un ātruma grafiku analīze, ekstrēmu un pieauguma intervālu noteikšana.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Тригонометрические соотношения в прямоугольном треугольнике', 'Trigonometriskās sakarības taisnleņķa trijstūrī', 'visp-trigonometrija-taisnlenkis', (select id from public.subjects where slug = 'geometry'), 10, 10, 'Синус, косинус, тангенс, теорема Пифагора, прикладные задачи на наклонные плоскости и лестницы.', 'Sinuss, kosinuss, tangenss, Pitagora teorēma, kāpņu un slīpumu aprēķini.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Применение теорем синусов и косинусов', 'Sinusu un kosinusu teorēmas lietojums', 'visp-sinusu-kosinusu-teorema', (select id from public.subjects where slug = 'geometry'), 10, 11, 'Решение произвольных треугольников, нахождение третьей стороны по двум сторонам и углу между ними.', 'Patvaļīgu trijstūru risināšana, trešās malas noteikšana pēc divām malām un leņķa starp tām.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Периметр, площадь и единицы измерения', 'Perimetrs, laukums un mērvienības', 'visp-planimetrija-laukumi', (select id from public.subjects where slug = 'geometry'), 10, 12, 'Вычисление площадей треугольника, параллелограмма, трапеции, круга; перевод единиц площади (м², га, ары).', 'Trijstūra, paralelograma, trapeces, riņķa laukuma aprēķini; laukuma mērvienību pārvēršana (m², ha, ari).')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Масштаб, планы и карты местности', 'Mērogs, plāni un kartes', 'visp-merogs-plani-kartes', (select id from public.subjects where slug = 'geometry'), 10, 13, 'Чтение масштаба карты, вычисление реальных расстояний по карте и проектам зданий.', 'Kartes mēroga nolasīšana, reālo attālumu noteikšana kartēs un būvprojektos.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Подобие треугольников в практических задачах', 'Trijstūru līdzība praktiskos uzdevumos', 'visp-trijsturu-lidziba', (select id from public.subjects where slug = 'geometry'), 10, 14, 'Коэффициент подобия, отношение сторон и площадей, измерение высоты объектов по тени.', 'Līdzības koeficients, malu un laukumu attiecības, objektu augstuma mērīšana pēc ēnas.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Окружность и площадь круга', 'Riņķa līnija un riņķa laukums', 'visp-rinka-linija-laukums', (select id from public.subjects where slug = 'geometry'), 10, 15, 'Длина окружности $C = 2\pi r$, площадь круга $S = \pi r^2$, площадь кругового сектора.', 'Riņķa līnijas garums $C = 2\pi r$, riņķa laukums $S = \pi r^2$, sektora laukums.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Объём и площадь поверхности призмы и цилиндра', 'Prizmas un cilindra tilpums un virsma', 'visp-prizma-cilindrs-tilpums', (select id from public.subjects where slug = 'geometry'), 10, 16, 'Прямая призма, прямоугольный параллелепипед, цилиндр, вместимость упаковок и баков.', 'Taisna prizma, taisnstūra paralēlskaldnis, cilindrs, iepakojumu un tvertņu tilpums.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Объём пирамиды и конуса', 'Piramīdas un konusa tilpums', 'visp-piramida-konuss-tilpums', (select id from public.subjects where slug = 'geometry'), 10, 17, 'Формула $V = \frac{1}{3} S_{\text{осн}} h$, насыпные кучи песка/зерна, конические крыши.', 'Formula $V = \frac{1}{3} S_{\text{pam}} h$, smilšu un graudu kaudzes, koniskie jumti.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Объём и площадь поверхности шара и сферы', 'Lodes tilpums un virsmas laukums', 'visp-lode-sfera', (select id from public.subjects where slug = 'geometry'), 10, 18, 'Формулы площади сферы $S = 4\pi r^2$ и объёма шара $V = \frac{4}{3}\pi r^3$, мячи, глобусы, сферические резервуары.', 'Svēras laukums $S = 4\pi r^2$ un lodes tilpums $V = \frac{4}{3}\pi r^3$, bumbas, sfēriskās tvertnes.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Расчёт материалов и затрат на строительство/ремонт', 'Materiālu un izmaksu aprēķini', 'visp-materialu-izmaksu-aprekini', (select id from public.subjects where slug = 'geometry'), 10, 19, 'Комплексные задачи: площадь стен под покраску за вычетом окон и дверей, расход краски и смета затрат.', 'Kompleksi uzdevumi: sienu laukums krāsošanai atskaitot logus un durvis, krāsas patēriņš un tāme.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Сбор, группировка и представление данных', 'Datu vākšana, apkopošana un attēlošana', 'visp-datu-apstrade-grafiki', (select id from public.subjects where slug = 'statistics'), 10, 20, 'Интервальные ряды, частоты и относительные частоты, построение гистограмм и полигонов частот.', 'Intervālu rindas, biežums un relatīvais biežums, histogrammu veidošana.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Средние величины и статистический размах', 'Vidējie lielumi un izkliede', 'visp-videjie-lielumi-izkliede', (select id from public.subjects where slug = 'statistics'), 10, 21, 'Среднее взвешенное, медиана, размах выборки (максимум минус минимум), анализ выбросов.', 'Svērtais vidējais, mediāna, amplitūda (maksimālā un minimālā vērtība), datu izkliedes novērtējums.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Чтение и критический анализ диаграмм', 'Diagrammu lasīšana un kritiska interpretācija', 'visp-diagrammu-kritika', (select id from public.subjects where slug = 'statistics'), 10, 22, 'Обнаружение визуальных искажений в инфографике (урезанная шкала, несоразмерные площади).', 'Vizuālo kļūdu un sagrozījumu pamanīšana infografikās (apgriezta ass, nesamērīgi laukumi).')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Основные правила комбинаторики', 'Kombinatorikas pamatprincipi', 'visp-kombinatorika-pamatprincipi', (select id from public.subjects where slug = 'statistics'), 10, 23, 'Правило суммы и правило произведения, подсчёт вариантов кодов, паролей и меню.', 'Saskaitīšanas un reizināšanas likums, kombināciju, kodu un paroļu skaita aprēķins.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Вероятность в повседневных ситуациях', 'Varbūtība ikdienas situācijās', 'visp-varbutiba-ikdiena', (select id from public.subjects where slug = 'statistics'), 10, 24, 'Случайные события, благоприятные исходы, вероятности в тестах с выбором ответа, контроль качества.', 'Gadījuma notikumi, labvēlīgie iznākumi, izvēles testu un loteriju varbūtības.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Независимые события и произведение вероятностей', 'Neatkarīgi notikumi un varbūtību reizināšana', 'visp-neatkarigi-notikumi', (select id from public.subjects where slug = 'statistics'), 10, 25, 'Теорема умножения вероятностей для независимых событий, надёжность систем из двух компонентов.', 'Neatkarīgu notikumu reizināšanas teorēma, divu neatkarīgu sistēmas komponentu drošums.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

-- 2. Вставка типовых задач и привязка кросс-тегов
do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-skaitliski-aprekini-dzive';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Расход топлива и стоимость поездки', 'Degvielas patēriņš un brauciena izmaksas', 'Автомобиль расходует в среднем $6{,}5\text{ л}$ бензина на $100\text{ км}$. Стоимость бензина — $1{,}60\text{ €}$ за литр. Какова стоимость топлива для поездки из Риги в Даугавпилс длиной $220\text{ км}$?', 'Automašīna patērē vidēji $6{,}5\text{ l}$ degvielas uz $100\text{ km}$. Degvielas cena ir $1{,}60\text{ €/l}$. Cik eiro izmaksās degviela braucienam no Rīgas uz Daugavpili ($220\text{ km}$)?', '1) Вычисляем общий объём бензина: $V = \frac{220}{100} \cdot 6{,}5 = 2{,}2 \cdot 6{,}5 = 14{,}3\text{ л}$.
2) Вычисляем общую стоимость: $14{,}3 \cdot 1{,}60 = 22{,}88\text{ €}$.', '1) Aprēķina degvielas daudzumu: $V = \frac{220}{100} \cdot 6{,}5 = 14{,}3\text{ l}$.
2) Aprēķina brauciena izmaksas: $14{,}3 \cdot 1{,}60 = 22{,}88\text{ €}$.', '22.88', 'Средний', 1, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'teksta-uzdevumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'modelesana';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-procenti-krediti-finanses';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Расчет цены с налогом PVN (21%)', 'Cenas aprēķins ar PVN (21%)', 'Цена ноутбука без налога на добавленную стоимость (PVN) составляет $450\text{ €}$. Ставка PVN равна $21\%$. Какова окончательная цена ноутбука в магазине?', 'Portatīvā datora cena bez pievienotās vērtības nodokļa (PVN) ir $450\text{ €}$. PVN likme ir $21\%$. Cik eiro jāmaksā par datoru veikalā ar PVN?', '1) Сумма PVN: $450 \cdot 0{,}21 = 94{,}50\text{ €}$.
2) Окончательная цена: $450 + 94{,}50 = 544{,}50\text{ €}$ (или $450 \cdot 1{,}21 = 544{,}50\text{ €}$).', '1) PVN summa: $450 \cdot 0{,}21 = 94{,}50\text{ €}$.
2) Gala cena: $450 + 94{,}50 = 544{,}50\text{ €}$ (jeb $450 \cdot 1{,}21 = 544{,}50\text{ €}$).', '544.5', 'Лёгкий', 2, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'dalas-procenti';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'teksta-uzdevumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-procenti-krediti-finanses';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Сложные проценты по банковскому депозиту', 'Saliktie procenti bankas noguldījumam', 'В банк положен вклад в размере $2000\text{ €}$ под $4\%$ годовых со сложными процентами. Какая сумма будет на счёте через $2$ года?', 'Bankā noguldīti $2000\text{ €}$ ar $4\%$ gada procentu likmi (saliktie procenti). Kāda summa būs kontā pēc $2$ gadiem?', 'Используем формулу сложных процентов: $S = S_0 (1 + p)^n$.
$S = 2000 \cdot (1 + 0{,}04)^2 = 2000 \cdot 1{,}0816 = 2163{,}20\text{ €}$.', 'Izmanto salikto procentu formulu: $S = S_0 (1 + p)^n$.
$S = 2000 \cdot (1 + 0{,}04)^2 = 2000 \cdot 1{,}0816 = 2163{,}20\text{ €}$.', '2163.2', 'Средний', 3, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'dalas-procenti';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'modelesana';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-izteiksmes-un-formulas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Выражение переменной из формулы площади трапеции', 'Mainīgā izteikšana no trapeces laukuma formulas', 'Площадь трапеции задаётся формулой $S = \frac{a + b}{2} \cdot h$. Выразите основание $a$ через $S$, $b$ и $h$.', 'Trapeces laukuma formula ir $S = \frac{a + b}{2} \cdot h$. Izsakiet pamatu $a$ ar $S$, $b$ un $h$ palīdzību.', '1) Умножаем обе части на $2$: $2S = (a + b) \cdot h$.
2) Делим обе части на $h$: $\frac{2S}{h} = a + b$.
3) Вычитаем $b$: $a = \frac{2S}{h} - b$.', '1) Sareizina abas puses ar $2$: $2S = (a + b) \cdot h$.
2) Izdala abas puses ar $h$: $\frac{2S}{h} = a + b$.
3) Atņem $b$: $a = \frac{2S}{h} - b$.', '(2S)/h - b', 'Средний', 4, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'algebriskie-parveidojumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-vienadojumi-praktiski';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Размеры прямоугольного участка', 'Taisnstūra formas zemesgabala izmēri', 'Длина прямоугольного участка на $5\text{ м}$ больше его ширины. Площадь участка равна $300\text{ м}^2$. Найдите ширину участка в метрах.', 'Taisnstūrveida zemesgabala garums ir par $5\text{ m}$ lielāks nekā tā platums. Zemesgabala laukums ir $300\text{ м}^2$. Aprēķiniet zemesgabala platumu metros.', 'Обозначим ширину через $x$. Тогда длина равна $x + 5$.
Площадь: $x(x + 5) = 300 \implies x^2 + 5x - 300 = 0$.
Дискриминант: $D = 25 - 4 \cdot (-300) = 1225 = 35^2$.
Корни: $x_1 = \frac{-5 + 35}{2} = 15$, $x_2 = -20$ (не подходит, так как длина положительна).
Ширина участка равна $15\text{ м}$.', 'Pieņemsim, ka platums ir $x\text{ m}$. Tad garums ir $(x + 5)\text{ m}$.
Laukums: $x(x + 5) = 300 \implies x^2 + 5x - 300 = 0$.
Diskriminants: $D = 1225 = 35^2$.
Saknes: $x_1 = \frac{-5 + 35}{2} = 15$, $x_2 = -20$ (neder).
Zemesgabala platums ir $15\text{ m}$.', '15', 'Средний', 5, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'vienadojumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'teksta-uzdevumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-nevienadibas-intervali';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Решение линейного неравенства', 'Lineāras nevienādības atrisināšana', 'Решите неравенство $3(x - 2) \le 5x + 4$. Запишите наименьшее целое число, удовлетворяющее этому неравенству.', 'Atrisiniet nevienādību $3(x - 2) \le 5x + 4$. Uzrakstiet mazāko veselo skaitli, kas ir šīs nevienādības atrisinājums.', '$3x - 6 \le 5x + 4 \implies -2x \le 10 \implies x \ge -5$.
Наименьшее целое число: $-5$.', '$3x - 6 \le 5x + 4 \implies -2x \le 10 \implies x \ge -5$.
Mazākais veselais skaitlis: $-5$.', '-5', 'Лёгкий', 6, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'nevienadibas';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-funkcija-sakariba';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Вычисление значения функции по аргументу', 'Funkcijas vērtības aprēķins pēc argumenta', 'Функция задана формулой $f(x) = 2x^2 - 3x + 5$. Вычислите $f(-2)$.', 'Funkcija dota ar formulu $f(x) = 2x^2 - 3x + 5$. Aprēķiniet $f(-2)$.', '$f(-2) = 2(-2)^2 - 3(-2) + 5 = 2 \cdot 4 + 6 + 5 = 8 + 6 + 5 = 19$.', '$f(-2) = 2(-2)^2 - 3(-2) + 5 = 8 + 6 + 5 = 19$.', '19', 'Лёгкий', 7, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'funkcijas';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-lineara-funkcija';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Точка пересечения прямой с осью абсцисс', 'Taisnes krustpunkts ar X asi', 'Найдите координату $x$ точки пересечения графика функции $y = 3x - 12$ с осью $Ox$.', 'Nosakiet funkcijas $y = 3x - 12$ grafika krustpunkta ar $Ox$ asi abscisu $x$.', 'На оси $Ox$ значение $y = 0$. Подставляем: $0 = 3x - 12 \implies 3x = 12 \implies x = 4$.', 'Uz $Ox$ ass $y = 0$. $0 = 3x - 12 \implies 3x = 12 \implies x = 4$.', '4', 'Лёгкий', 8, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'funkcijas';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'grafiki';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-kvadratfunkcija-grafiks';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Координаты вершины параболы', 'Parabolas virsotnes koordinātas', 'Дана функция $y = x^2 - 6x + 8$. Найдите координату $y$ вершины параболы.', 'Dota funkcija $y = x^2 - 6x + 8$. Aprēķiniet parabolas virsotnes ordinātu $y$.', '$x_0 = -\frac{b}{2a} = -\frac{-6}{2} = 3$.
$y_0 = 3^2 - 6 \cdot 3 + 8 = 9 - 18 + 8 = -1$.', '$x_0 = -\frac{-6}{2} = 3$.
$y_0 = 3^2 - 6 \cdot 3 + 8 = -1$.', '-1', 'Средний', 9, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'funkcijas';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'grafiki';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-grafiki-tabulas-dati';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Анализ показаний счетчика электроэнергии', 'Elektroenerģijas patēriņa aprēķins', 'Показания счетчика в начале месяца — $3420\text{ кВт}\cdot\text{ч}$, в конце месяца — $3610\text{ кВт}\cdot\text{ч}$. Тариф составляет $0{,}18\text{ €}$ за $1\text{ кВт}\cdot\text{ч}$. Какова плата за потреблённую электроэнергию за месяц?', 'Elektrības skaitītāja rādījums mēneša sākumā bija $3420\text{ kWh}$, bet mēneša beigās — $3610\text{ kWh}$. Maksa par $1\text{ kWh}$ ir $0{,}18\text{ €}$. Cik eiro jāmaksā par patērēto elektrību?', '1) Потребление: $3610 - 3420 = 190\text{ кВт}\cdot\text{ч}$.
2) Стоимость: $190 \cdot 0{,}18 = 34{,}20\text{ €}$.', '1) Patēriņš: $3610 - 3420 = 190\text{ kWh}$.
2) Maksa: $190 \cdot 0{,}18 = 34{,}20\text{ €}$.', '34.2', 'Лёгкий', 10, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'teksta-uzdevumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'statistika';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-trigonometrija-taisnlenkis';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Длина приставной лестницы', 'Pieslienamo kāpņu garums', 'Лестница приставлена к вертикальной стене под углом $60^\circ$ к земле. Основание лестницы отстоит от стены на $2\text{ м}$. Найдите длину лестницы в метрах.', 'Kāpnes atbalstītas pret sienu $60^\circ$ leņķī pret zemi. Kāpņu pamatne atrodas $2\text{ m}$ attālumā no sienas. Aprēķiniet kāpņu garumu metros.', 'В прямоугольном треугольнике прилежащий катет равен $2\text{ м}$, угол равен $60^\circ$.
$\cos 60^\circ = \frac{2}{L} \implies \frac{1}{2} = \frac{2}{L} \implies L = 4\text{ м}$.', '$\cos 60^\circ = \frac{2}{L} \implies \frac{1}{2} = \frac{2}{L} \implies L = 4\text{ m}$.', '4', 'Лёгкий', 11, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'trigonometrija';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'planimetrija';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-sinusu-kosinusu-teorema';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Вычисление стороны по теореме косинусов', 'Malas aprēķins pēc kosinusu teorēmas', 'В треугольнике $ABC$ стороны $AB = 5\text{ см}$, $AC = 8\text{ см}$, а угол $\angle A = 60^\circ$. Найдите сторону $BC$ в сантиметрах.', 'Trijstūrī $ABC$ malas ir $AB = 5\text{ cm}$, $AC = 8\text{ cm}$ un leņķis $\angle A = 60^\circ$. Aprēķiniet malas $BC$ garumu centimetros.', 'Теорема косинусов: $BC^2 = AB^2 + AC^2 - 2 \cdot AB \cdot AC \cdot \cos 60^\circ$.
$BC^2 = 25 + 64 - 2 \cdot 5 \cdot 8 \cdot 0{,}5 = 89 - 40 = 49 \implies BC = 7\text{ см}$.', '$BC^2 = 5^2 + 8^2 - 2 \cdot 5 \cdot 8 \cdot \cos 60^\circ = 25 + 64 - 40 = 49 \implies BC = 7\text{ cm}$.', '7', 'Средний', 12, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'trigonometrija';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'planimetrija';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-planimetrija-laukumi';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Площадь земельного участка в гектарах', 'Zemesgabala laukums hektāros', 'Прямоугольное поле имеет размеры $250\text{ м} \times 400\text{ м}$. Выразите площадь этого поля в гектарах ($1\text{ га} = 10\,000\text{ м}^2$).', 'Taisnstūrveida lauka izmēri ir $250\text{ m} \times 400\text{ m}$. Izsakiet šī lauka laukumu hektāros ($1\text{ ha} = 10\,000\text{ m}^2$).', '$S = 250 \cdot 400 = 100\,000\text{ м}^2$.
$S = \frac{100\,000}{10\,000} = 10\text{ га}$.', '$S = 250 \cdot 400 = 100\,000\text{ m}^2 = 10\text{ ha}$.', '10', 'Лёгкий', 13, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'merijumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'planimetrija';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-merogs-plani-kartes';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Расстояние на местности по масштабу карты', 'Attālums dabā pēc kartes mēroga', 'Масштаб карты равен $1 : 50\,000$. Расстояние между двумя объектами на карте равно $6\text{ см}$. Каково реальное расстояние между ними на местности в километрах?', 'Kartes mērogs ir $1 : 50\,000$. Attālums starp diviem punktiem kartē ir $6\text{ cm}$. Kāds ir faktiskais attālums dabā kilometros?', '$6\text{ см} \cdot 50\,000 = 300\,000\text{ см} = 3000\text{ м} = 3\text{ км}$.', '$6\text{ cm} \cdot 50\,000 = 300\,000\text{ cm} = 3\text{ km}$.', '3', 'Лёгкий', 14, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'teksta-uzdevumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'modelesana';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-trijsturu-lidziba';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Вычисление высоты столба по тени человека', 'Staba augstuma noteikšana pēc cilvēka ēnas', 'Человек ростом $1{,}8\text{ м}$ отбрасывает тень длиной $1{,}2\text{ м}$. В этот же момент стоящий рядом фонарный столб отбрасывает тень длиной $4\text{ м}$. Найдите высоту столба в метрах.', 'Cilvēks, kura augums ir $1{,}8\text{ m}$, met $1{,}2\text{ m}$ garu ēnu. Tajā pašā laikā apgaismes stabs met $4\text{ m}$ garu ēnu. Aprēķiniet staba augstumu metros.', 'Из подобия треугольников: $\frac{H}{1{,}8} = \frac{4}{1{,}2} \implies H = \frac{4 \cdot 1{,}8}{1{,}2} = 4 \cdot 1{,}5 = 6\text{ м}$.', '$\frac{H}{1{,}8} = \frac{4}{1{,}2} \implies H = 6\text{ m}$.', '6', 'Средний', 15, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'planimetrija';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'teksta-uzdevumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-rinka-linija-laukums';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Площадь круглой клумбы', 'Apaļas puķu dobes laukums', 'Диаметр круглой клумбы равен $6\text{ м}$. Найдите площадь клумбы в квадратных метрах (примите $\pi \approx 3{,}14$).', 'Apaļas puķu dobes diametrs ir $6\text{ m}$. Aprēķiniet dobes laukumu kvadrātmetros (pieņemot $\pi \approx 3{,}14$).', '$r = 3\text{ м}$. $S = \pi r^2 = 3{,}14 \cdot 3^2 = 3{,}14 \cdot 9 = 28{,}26\text{ м}^2$.', '$r = 3\text{ m}$. $S = 3{,}14 \cdot 9 = 28{,}26\text{ m}^2$.', '28.26', 'Лёгкий', 16, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'merijumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'planimetrija';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-prizma-cilindrs-tilpums';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Вместимость прямоугольного бассейна', 'Taisnstūrveida baseina tilpums', 'Бассейн имеет длину $10\text{ м}$, ширину $4\text{ м}$ и глубину $1{,}5\text{ м}$. Сколько литров воды вмещает бассейн при полном заполнении ($1\text{ м}^3 = 1000\text{ л}$)?', 'Baseina garums ir $10\text{ m}$, platums $4\text{ m}$ un dziļums $1{,}5\text{ m}$. Cik litru ūdens ietilpst pilnā baseinā ($1\text{ m}^3 = 1000\text{ l}$)?', '$V = 10 \cdot 4 \cdot 1{,}5 = 60\text{ м}^3 = 60\,000\text{ л}$.', '$V = 10 \cdot 4 \cdot 1{,}5 = 60\text{ m}^3 = 60\,000\text{ l}$.', '60000', 'Лёгкий', 17, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'stereometrija';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'merijumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-piramida-konuss-tilpums';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Объём конической кучи песка', 'Smilšu koniskās kaudzes tilpums', 'Куча песка имеет форму конуса с радиусом основания $3\text{ м}$ и высотой $2\text{ м}$. Найдите объём песка в кубических метрах (примите $\pi \approx 3{,}14$).', 'Smilšu kaudzei ir konusa forma ar pamatnes rādiusu $3\text{ m}$ un augstumu $2\text{ m}$. Aprēķiniet tilpumu kubikmetros (pieņemot $\pi \approx 3{,}14$).', '$V = \frac{1}{3} \pi r^2 h = \frac{1}{3} \cdot 3{,}14 \cdot 3^2 \cdot 2 = 3{,}14 \cdot 3 \cdot 2 = 18{,}84\text{ м}^3$.', '$V = \frac{1}{3} \pi r^2 h = 3{,}14 \cdot 3 \cdot 2 = 18{,}84\text{ m}^3$.', '18.84', 'Средний', 18, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'stereometrija';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'merijumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-lode-sfera';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Площадь поверхности сферы', 'Sfēras virsmas laukums', 'Радиус сферического резервуара равен $3\text{ м}$. Вычислите площадь его внешней поверхности в квадратных метрах (примите $\pi \approx 3{,}14$).', 'Sfēriskas tvertnes rādiuss ir $3\text{ m}$. Aprēķiniet tās virsmas laukumu kvadrātmetros (pieņemot $\pi \approx 3{,}14$).', '$S = 4\pi r^2 = 4 \cdot 3{,}14 \cdot 3^2 = 4 \cdot 3{,}14 \cdot 9 = 113{,}04\text{ м}^2$.', '$S = 4\pi r^2 = 4 \cdot 3{,}14 \cdot 9 = 113{,}04\text{ m}^2$.', '113.04', 'Средний', 19, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'stereometrija';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'merijumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-materialu-izmaksu-aprekini';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Количество банок краски для покраски стен', 'Krāsas bundžu skaits telpas krāsošanai', 'Площадь стен под покраску составляет $50\text{ м}^2$. Одного литра краски хватает на $10\text{ м}^2$. Краска продаётся в банках по $2{,}5\text{ литра}$. Сколько банок краски нужно купить для покраски в два слоя?', 'Krāsojamo sienu laukums ir $50\text{ m}^2$. Ar $1\text{ litru}$ pietiek $10\text{ m}^2$ nokrāsošanai. Krāsa tiek pārdota $2{,}5\text{ l}$ bundžās. Cik bundžas jānopērk krāsošanai 2 kārtās?', '1) Общая площадь с учетом 2 слоёв: $50 \cdot 2 = 100\text{ м}^2$.
2) Объём краски: $\frac{100}{10} = 10\text{ литров}$.
3) Число банок: $\frac{10}{2{,}5} = 4$ банки.', '1) Laukums divās kārtās: $100\text{ m}^2$.
2) Krāsa: $10\text{ l}$.
3) Bundžu skaits: $\frac{10}{2{,}5} = 4$ bundžas.', '4', 'Средний', 20, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'teksta-uzdevumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'merijumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-datu-apstrade-grafiki';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Относительная частота в процентах', 'Relatīvais biežums procentos', 'В опросе участвовали $80$ человек. Из них $28$ выбрали вариант А. Какова относительная частота выбора варианта А в процентах?', 'Aptaujā piedalījās $80$ cilvēki. No tiem $28$ izvēlējās variantu A. Kāds ir varianta A relatīvais biežums procentos?', '$\frac{28}{80} = \frac{7}{20} = 0{,}35 = 35\%$.', '$\frac{28}{80} = 0{,}35 = 35\%$.', '35', 'Лёгкий', 21, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'statistika';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'dalas-procenti';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-videjie-lielumi-izkliede';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Вычисление средневзвешенного балла', 'Svērta vidējā aprēķins', 'Студент сдал тест с оценкой $6$ (вес $1$), практическую работу с оценкой $8$ (вес $2$) и экзамен с оценкой $9$ (вес $3$). Найдите средневзвешенный балл.', 'Skolēna vērtējums testā ir $6$ (svars $1$), praktiskajā darbā $8$ (svars $2$) un eksāmenā $9$ (svars $3$). Aprēķiniet svērto vidējo atzīmi.', '$\bar{x} = \frac{6 \cdot 1 + 8 \cdot 2 + 9 \cdot 3}{1 + 2 + 3} = \frac{6 + 16 + 27}{6} = \frac{49}{6} \approx 8{,}17$.', '$\bar{x} = \frac{6 \cdot 1 + 8 \cdot 2 + 9 \cdot 3}{6} = \frac{49}{6} \approx 8{,}17$.', '8.17', 'Средний', 22, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'statistika';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-diagrammu-kritika';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Расчет процентной доли по круговой диаграмме', 'Sektora leņķis riņķa diagrammā', 'На круговой диаграмме категория «Транспорт» составляет $25\%$ всех расходов семьи. Найдите центральный угол сектора этой категории в градусах.', 'Sektoru diagrammā kategorija «Transports» veido $25\%$ no visiem ģimenes izdevumiem. Kāds ir šīs kategorijas sektora leņķis grādos?', 'Полный круг составляет $360^\circ$. Угол сектора: $360^\circ \cdot 0{,}25 = 90^\circ$.', 'Pilns riņķis ir $360^\circ$. Sektora leņķis: $360^\circ \cdot 0{,}25 = 90^\circ$.', '90', 'Лёгкий', 23, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'statistika';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'merijumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-kombinatorika-pamatprincipi';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Количество вариантов четырёхзначного PIN-кода', 'Četrciparu PIN koda variantu skaits', 'PIN-код состоит из $4$ цифр (от $0$ до $9$). Сколько существует различных PIN-кодов, если все цифры в коде должны быть разными?', 'PIN kods sastāv no $4$ cipariem ($0-9$). Cik dažādu PIN kodu var izveidot, ja visi cipari kodā ir dažādi?', 'По правилу произведения: $10 \cdot 9 \cdot 8 \cdot 7 = 5040$.', 'Pēc reizināšanas likuma: $10 \cdot 9 \cdot 8 \cdot 7 = 5040$.', '5040', 'Средний', 24, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'kombinatorika';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-varbutiba-ikdiena';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Вероятность выигрыша в лотерее', 'Laimesta varbūtība momentloterijā', 'В лотерее выпущено $1000$ билетов, из которых $150$ выигрышных. Какова вероятность купить невыигрышный билет? Запишите ответ десятичной дробью.', 'Loterijā ir $1000$ biļetes, no kurām $150$ ir laimējošas. Kāda ir varbūtība nopirkt biļeti bez laimesta? Atbildi uzrakstiet kā decimāldaļu.', 'Число билетов без выигрыша: $1000 - 150 = 850$.
$P = \frac{850}{1000} = 0{,}85$.', '$1000 - 150 = 850$. $P = \frac{850}{1000} = 0{,}85$.', '0.85', 'Лёгкий', 25, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'varbutiba';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'dalas-procenti';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;

do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'visp-neatkarigi-notikumi';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, 'Вероятность безотказной работы двух приборов', 'Divu iekārtu bezatteices darbības varbūtība', 'Система состоит из двух независимо работающих датчиков. Вероятность безотказной работы первого датчика равна $0{,}9$, второго — $0{,}8$. Какова вероятность того, что оба датчика сработают исправно?', 'Sistēma sastāv no diviem neatkarīgiem sensoriem. Pirmā sensora drošums ir $0{,}9$, otrā — $0{,}8$. Kāda ir varbūtība, ka abi sensori nostrādās pareizi?', 'Для независимых событий: $P(A \cap B) = P(A) \cdot P(B) = 0{,}9 \cdot 0{,}8 = 0{,}72$.', '$P = 0{,}9 \cdot 0{,}8 = 0{,}72$.', '0.72', 'Средний', 26, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'varbutiba';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;
