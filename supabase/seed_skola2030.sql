-- ============================================================================
-- Seed-файл: Полный каталог тем Skola2030 (1–12 классы) и мультиязычные задачи
-- Запуск в Supabase: SQL Editor -> New query -> Вставить всё -> Run
-- ============================================================================

-- 0. Обновление ограничений до 12 классов и мультиязычность
alter table public.topics drop constraint if exists topics_grade_range;
alter table public.topics drop constraint if exists topics_grade_check;
alter table public.topics add constraint topics_grade_range check (grade is null or grade between 1 and 12);

alter table public.tasks drop constraint if exists tasks_grade_range;
alter table public.tasks drop constraint if exists tasks_grade_check;
alter table public.tasks add constraint tasks_grade_range check (grade is null or grade between 1 and 12);

alter table public.subjects add column if not exists title_lv text;

alter table public.topics add column if not exists title_lv text;
alter table public.topics add column if not exists description_lv text;

alter table public.tasks add column if not exists title_lv text;
alter table public.tasks add column if not exists condition_latex_lv text;
alter table public.tasks add column if not exists solution_latex_lv text;

-- 1. Базовые разделы Skola2030 (Lielās idejas / Mācību jomas)
insert into public.subjects (title, title_lv, slug, icon, position)
values
  ('Алгебра и числа', 'Algebra un skaitļi', 'algebra', 'x²', 1),
  ('Геометрия и измерения', 'Ģeometrija un mērījumi', 'geometry', '△', 2),
  ('Статистика и вероятность', 'Statistika un varbūtība', 'statistics', '📊', 3)
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  icon = excluded.icon,
  position = excluded.position;

-- 2. Полный каталог тем стандарта Skola2030 (1–12 классы, 81 тема)
insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values
  ('Как рассказать и показать: сколько, где, какой', 'Kā izstāsta un parāda: cik, kur, kāds', 'skola2030-g1-1-rasskazat-i-pokazat-skolko', (select id from public.subjects where slug = 'geometry'), 1, 1, 'Фигуры (линия, многоугольник, круг). Характеристика, сравнение и группировка геометрических объектов; Последовательности предметов и чисел. Расположение и направления объектов на плоскости, в пространстве; Количество, счет. Число и его изображение, цифры', 'Figūras (līnija, daudzstūris, riņķis). Ģeometrisku objektu raksturošana, salīdzināšana, grupēšana; Priekšmetu un skaitļu virknes. Objektu novietojums un virzieni plaknē, telpā; Skaits, skaitīšana. Skaitlis un tā attēlošana, cipari'),
  ('Сколько всего, сколько осталось', 'Cik kopā, cik palika (saskaitīšana un atņemšana līdz 10)', 'skola2030-g1-2-skolko-vsego-skolko-ostalos', (select id from public.subjects where slug = 'statistics'), 1, 2, 'Сложение и вычитание в пределах 10; Состав числа. Его визуализация, запись; Таблица для записи данных', 'Saskaitīšana un atņemšana 10 apjomā; Skaitļa sastāvs. Tā vizualizēšana, pierakstīšana; Tabula datu pierakstīšanai'),
  ('Как измерять длины и получать симметричные фигуры', 'Kā mēra garumus un iegūst simetriskas figūras', 'skola2030-g1-3-izmeryat-dliny-i-poluchat', (select id from public.subjects where slug = 'geometry'), 1, 3, 'Определение, сравнение и вычисление длин; Симметричные фигуры', 'Garumu noteikšana, salīdzināšana un aprēķināšana; Simetriskas figūras'),
  ('Как записывают и сравнивают числа больше 10', 'Skaitļu līdz 100 lasīšana, pierakstīšana un salīdzināšana', 'skola2030-g1-4-zapisyvayut-i-sravnivayut-chisla', (select id from public.subjects where slug = 'algebra'), 1, 4, 'Измерение длины (см) и сравнение; Десятичный состав, чтение и запись чисел 10-100; Сравнение чисел. Числовые последовательности', 'Garuma mērīšana (cm) un salīdzināšana; Skaitļu 10-100 decimālais sastāvs, lasīšana un pierakstīšana; Skaitļu salīdzināšana. Skaitļu virknes'),
  ('Как складывают и вычитают числа больше 10', 'Saskaitīšana un atņemšana 20 apjomā', 'skola2030-g1-5-skladyvayut-i-vychitayut-chisla', (select id from public.subjects where slug = 'algebra'), 1, 5, 'Вычитание в пределах 20; Прибавление однозначного числа к двузначному в пределах 20; Сложение однозначных чисел с переходом через 10', 'Atņemšana 20 apjomā; Viencipara skaitļa pieskaitīšana pie divciparu skaitļa 20 apjomā; Viencipara skaitļu saskaitīšana, ja rezultāts pārsniedz 10'),
  ('Что значит «на столько больше», «на столько меньше»', 'Divu lielumu salīdzināšana un starpības uzdevumi', 'skola2030-g1-6-znachit-na-stolko-bolshe', (select id from public.subjects where slug = 'algebra'), 1, 6, 'Сравнение двух величин в пределах 20; Бытовые задачи, решаемые сложением и вычитанием в пределах 20', 'Divu lielumu salīdzināšana 20 apjomā; Sadzīves situāciju uzdevumi, kuru atrisināšanai izmanto saskaitīšanu un atņemšanu 20 apjomā'),
  ('Где мы встречаемся с большими числами', 'Lieli skaitļi, mērījumi un nauda ikdienā', 'skola2030-g1-7-my-vstrechaemsya-s-bolshimi', (select id from public.subjects where slug = 'algebra'), 1, 7, 'Измерение длины (см, дм, м); Измерение/отсчет времени; Деньги (евро, центы); Сложение и вычитание в пределах 100. Бытовые ситуации', 'Garuma mērīšana (cm, dm, m); Laika mērīšana/skaitīšana; Nauda (eiro, centi); Saskaitīšana un atņemšana 100 apjomā. Sadzīves situācijas'),
  ('Как складывают и вычитают двузначные числа', 'Divciparu skaitļu saskaitīšana un atņemšana', 'skola2030-g2-1-skladyvayut-i-vychitayut-dvuznachnye', (select id from public.subjects where slug = 'algebra'), 2, 1, 'Сложение и вычитание в пределах 100. Бытовые ситуации; Сложение и вычитание в пределах 20. Бытовые ситуации', 'Saskaitīšana un atņemšana 100 apjomā. Sadzīves situācijas; Saskaitīšana un atņemšana 20 apjomā. Sadzīves situācijas'),
  ('Как умножают и делят на 3, 4 и 5', 'Reizināšana un dalīšana ar 3, 4 un 5', 'skola2030-g2-2-umnozhayut-i-delyat-na', (select id from public.subjects where slug = 'algebra'), 2, 2, 'Как умножают и делят на 3 и 4?; Как умножают и делят на 5? Умножение и деление в пределах 50', 'Kā reizina un dala ar 3 un 4?; Kā reizina un dala ar 5? Reizināšana un dalīšana 50 apjomā'),
  ('Как умножают и делят на 6, 7, 8, 9 и 10', 'Reizināšana un dalīšana ar 6, 7, 8, 9 un 10', 'skola2030-g3-1-umnozhayut-i-delyat-na', (select id from public.subjects where slug = 'algebra'), 3, 1, 'Умножение и деление двузначных чисел; Таблица умножения. Умножение и деление в различных ситуациях', 'Divciparu skaitļu reizināšana un dalīšana; Reizināšanas tabula. Reizināšana un dalīšana dažādās situācijās'),
  ('Как используют все действия', 'Visu četru darbību lietošana 100 apjomā', 'skola2030-g3-2-ispolzuyut-vse-deystviya', (select id from public.subjects where slug = 'geometry'), 3, 2, 'Насколько хорошо я умею выполнять действия с числами в пределах 100?; Числовые выражения; Формулы вычисления периметра прямоугольника', 'Cik labi protu veikt darbības ar skaitļiem 100 apjomā?; Skaitliskas izteiksmes; Taisnstūra perimetra aprēķināšanas formulas'),
  ('Как составляют план местности', 'Reizināšana un dalīšana ar desmitiem, telpas plāns', 'skola2030-g3-3-sostavlyayut-plan-mestnosti', (select id from public.subjects where slug = 'algebra'), 3, 3, 'Умножение и деление многозначных чисел на 10, 100 и полные десятки; План помещения; Трехзначные и четырехзначные числа', 'Daudzciparu skaitļu reizināšana un dalīšana ar 10, 100 un pilniem desmitiem; Telpas plāns; Trīsciparu un četrciparu skaitļi'),
  ('Что значит часть от целого', 'Daļa no veselā un daļa no lieluma', 'skola2030-g3-4-znachit-chast-ot-tselogo', (select id from public.subjects where slug = 'algebra'), 3, 4, 'Деление на равные части, целое и часть; Часть от количества; Запись дроби. Дроби можно складывать. Дроби на числовой прямой.; Сравнение дробей; Запись десятых долей в виде десятичной дроби', 'Dalīšana vienādās daļās, veselais un daļa; Daļa no skaita; Daļskaitļa pieraksts. Dalskaitļus var saskaitīt. Daļskaitļi uz skaitļu taisnes.; Daļu salīdzināšana; Desmitdaļu pieraksts decimāldaļu formā'),
  ('Как создают пространственные модели', 'Telpiskas figūras un to izklājumi', 'skola2030-g3-5-sozdayut-prostranstvennye-modeli', (select id from public.subjects where slug = 'geometry'), 3, 5, 'Пространственные фигуры; Развертки пространственных фигур, вид пространственной фигуры с разных сторон', 'Telpiskas figūras; Telpisku figūru izklājumi, kā telpiska figūra izskatās no dažādām pusēm'),
  ('Как складывают и вычитают многозначные числа', 'Daudzciparu skaitļu saskaitīšana un atņemšana', 'skola2030-g4-1-skladyvayut-i-vychitayut-mnogoznachnye', (select id from public.subjects where slug = 'algebra'), 4, 1, 'Первая тысяча (повторение); Четырехзначные числа. Сложение и вычитание четырехзначных чисел', 'Pirmais tūkstotis (atkārtojums); Četrciparu skaitļi. Četrciparu skaitļu saskaitīšana un atņemšana'),
  ('Как многозначные числа умножают и делят на однозначное число', 'Daudzciparu skaitļu reizināšana un dalīšana ar viencipara skaitli', 'skola2030-g4-2-mnogoznachnye-chisla-umnozhayut-i', (select id from public.subjects where slug = 'algebra'), 4, 2, 'Деление двузначного числа на однозначное; Умножение двузначного числа на однозначное; Деление трехзначного числа на однозначное; Умножение трехзначного числа на однозначное', 'Divciparu skaitļa dalīšana ar viencipara skaitli; Divciparu skaitļa reizināšana ar viencipara skaitli; Trīsciparu skaitļa dalīšana ar viencipara skaitli; Trīsciparu skaitļa reizināšana ar viencipara skaitli'),
  ('Как многозначные числа умножают и делят на двузначное число', 'Daudzciparu skaitļu reizināšana un dalīšana ar divciparu skaitli', 'skola2030-g4-3-mnogoznachnye-chisla-umnozhayut-i', (select id from public.subjects where slug = 'algebra'), 4, 3, 'Деление многозначного числа на двузначное; Умножение многозначного числа на двузначное', 'Daudzciparu skaitļa dalīšana ar divciparu skaitli; Daudzciparu skaitļa reizināšana ar divciparu skaitli'),
  ('Как сравнивают, складывают и вычитают дроби', 'Parasto daļu salīdzināšana, saskaitīšana un atņemšana', 'skola2030-g4-4-sravnivayut-skladyvayut-i-vychitayut', (select id from public.subjects where slug = 'algebra'), 4, 4, 'Дробь как произведение числителя и основной дроби; Дроби, их расположение на числовой прямой; Сложение и вычитание дробей с одинаковыми знаменателями; Сравнение дробей', 'Daļa kā skaitītāja un pamatdaļas reizinājums; Daļas, to novietojums uz skaitļu taisnes; Daļu ar vienādiem saucējiem saskaitīšana un atņemšana; Daļu salīdzināšana'),
  ('Что значит часть от целого', 'Daļa no veselā un daļa no lieluma', 'skola2030-g4-5-znachit-chast-ot-tselogo', (select id from public.subjects where slug = 'algebra'), 4, 5, 'Целое — это числовое значение величины; Целое состоит из нескольких элементов, но их нельзя напрямую показать и увидеть; Целое состоит из нескольких элементов, их можно показать и увидеть (повторение за 3 класс)', 'Veselais ir lieluma skaitliskā vērtība; Veselo veido vairāki elementi, bet tiešā veidā tos nevar parādīt un redzēt; Veselo veido vairāki elementi, tos var parādīt un redzēt (atkārtojums no 3. klases)'),
  ('Что общего в математическом описании покупок и движения', 'Kas kopigs iepirksanas un kustibas matematiskaja apraksta', 'skola2030-g4-6-obshchego-v-matematicheskom-opisanii', (select id from public.subjects where slug = 'algebra'), 4, 6, 'Время, путь, скорость; Количество, оплата, цена', 'Laiks, ceļš, ātrums; Skaits, samaksa, cena'),
  ('Как по-разному записывают натуральные числа', 'Naturālo skaitļu pieraksts un noapaļošana', 'skola2030-g5-1-po-raznomu-zapisyvayut-naturalnye', (select id from public.subjects where slug = 'algebra'), 5, 1, 'Другие системы записи натуральных чисел; Запись натуральных чисел в десятичной системе; Округление натуральных чисел; Закономерности между компонентами действий в суммах и разностях; Применение сложения и вычитания в новых ситуациях', 'Citas naturālo skaitļu pieraksta sistēmas; Naturālo skaitļu pieraksts decimālajā sistēmā; Naturālu skaitļu noapaļošana; Sakarības starp darbību locekļiem summās un starpībās; Saskaitīšanas un atņemšanas lietojums jaunās situācijās'),
  ('Как используют разложение числа на множители', 'Ka lieto skaitla sadalisanu reizinatajos', 'skola2030-g5-2-ispolzuyut-razlozhenie-chisla-na', (select id from public.subjects where slug = 'algebra'), 5, 2, 'Возведение в степень; Приемы умножения, деления и свойства действий; Разложение на множители', 'Kāpināšana; Reizināšanas, dalīšanas paņēmieni un darbību īpašības; Sadalīšana reizinātājos'),
  ('Как объясняют и применяют основное свойство дроби', 'Ka skaidro un lieto dalas pamatipasibu', 'skola2030-g5-3-obyasnyayut-i-primenyayut-osnovnoe', (select id from public.subjects where slug = 'algebra'), 5, 3, 'Основное свойство дроби; Сложение и вычитание дробей с разными знаменателями; Сравнение дробей; Деление основной дроби на целое число, деление целого числа на основную дробь', 'Daļas pamatīpašība; Daļu ar dažādiem saucējiem saskaitīšana un atņemšana; Daļu salīdzināšana; Pamatdaļas dalīšana ar veselu skaitli, vesela skaitļa dalīšana ar pamatdaļu'),
  ('Как одно число выражают как часть другого числа', 'Viena skaitļa izteikšana kā otra skaitļa daļa', 'skola2030-g5-4-odno-chislo-vyrazhayut-chast', (select id from public.subjects where slug = 'algebra'), 5, 4, 'Дробь как запись действия деления; Дробь и числовое значение целого', 'Daļa kā dalīšanas darbības pieraksts; Daļas un veselā skaitliskā vērtība'),
  ('Как складывают и вычитают смешанные числа', 'Jauktu skaitļu saskaitīšana un atņemšana', 'skola2030-g5-5-skladyvayut-i-vychitayut-smeshannye', (select id from public.subjects where slug = 'algebra'), 5, 5, 'Смешанные числа; Сложение и вычитание смешанных чисел; Сложение и вычитание смешанных чисел, если знаменатели разные', 'Jaukti skaitļi; Jauktu skaitļu saskaitīšana un atņemšana; Jauktu skaitļu saskaitīšana un atņemšana, ja saucēji ir dažādi'),
  ('Как определяют неизвестные величины фигур', 'Daudzstūru īpašības, leņķi un riņķa līnija', 'skola2030-g5-6-opredelyayut-neizvestnye-velichiny-figur', (select id from public.subjects where slug = 'geometry'), 5, 6, 'Свойства и величины многоугольников; Угол. Угол как сумма или разность других углов; Окружность и её длина', 'Daudzstūru īpašības un lielumi; Leņķis. Leņķis kā citu leņķu summa vai starpība; Riņķa līnija un tās garums'),
  ('Как используют десятичные дроби и проценты', 'Ka lieto decimaldalas un procentus', 'skola2030-g5-7-ispolzuyut-desyatichnye-drobi-i', (select id from public.subjects where slug = 'statistics'), 5, 7, 'Десятичные дроби, их изображение на числовой прямой и сравнение; Сложение и вычитание десятичных дробей; Проценты; Задачи на проценты; Круговая диаграмма', 'Decimāldaļas, to attēlojums uz skaitļu taisnes un salīdzināšana; Decimāldaļu saskaitīšana un atņemšana; Procenti; Procentu uzdevumi; Sektoru diagramma'),
  ('Как совокупность делят в определенном отношении', 'Attiecības, proporcijas un mērogs', 'skola2030-g6-1-sovokupnost-delyat-v-opredelennom', (select id from public.subjects where slug = 'algebra'), 6, 1, 'Масштаб; Пропорциональные величины; Отношения чисел. Деление совокупности в определенном отношении', 'Mērogs; Proporcionāli lielumi; Skaitļu attiecības. Kopuma sadalīšana noteiktā attiecībā'),
  ('Как умножают и делят обыкновенные дроби', 'Parasto daļu un jauktu skaitļu reizināšana un dalīšana', 'skola2030-g6-2-umnozhayut-i-delyat-obyknovennye', (select id from public.subjects where slug = 'algebra'), 6, 2, 'Умножение и деление дробей и смешанных чисел на целое число', 'Daļu un jauktu skaitļu reizināšana un dalīšana ar veselu skaitli'),
  ('Как изображают и характеризуют пространственные тела', 'Telpisku ķermeņu virsmas laukums un tilpums', 'skola2030-g6-3-izobrazhayut-i-kharakterizuyut-prostranstvennye', (select id from public.subjects where slug = 'geometry'), 6, 3, 'Объем; Площадь поверхности', 'Tilpums; Virsmas laukums'),
  ('Зачем нужны числа, которые меньше нуля', 'Negatīvi skaitļi un skaitļu taisne', 'skola2030-g6-4-nuzhny-chisla-kotorye-menshe', (select id from public.subjects where slug = 'algebra'), 6, 4, 'Противоположные числа. Положительные и отрицательные числа, их расположение на числовой прямой', 'Pretēji skaitļi. Pozitīvi un negatīvi skaitļi, to novietojums uz skaitļu taisnes'),
  ('Что значит прибавить к числу отрицательное число или вычесть отрицательное число', 'Darbības ar negatīviem skaitļiem', 'skola2030-g6-5-znachit-pribavit-k-chislu', (select id from public.subjects where slug = 'algebra'), 6, 5, 'Сложение и вычитание положительных и отрицательных дробей; Сложение и вычитание целых чисел', 'Pozitīvu un negatīvu daļskaitļu saskaitīšana un atņemšana; Veselu skaitļu saskaitīšana un atņemšana'),
  ('Как определяют все элементы множества, вычисляют вероятность события', 'Kopas, Eilera-Venna diagrammas un varbūtība', 'skola2030-g7-1-opredelyayut-vse-elementy-mnozhestva', (select id from public.subjects where slug = 'statistics'), 7, 1, 'Создание выборок, их характеристика, определение количества выборок; Множества, диаграмма Эйлера-Венна. Полный перебор; Вероятность и её применения', 'Izlašu veidošana, raksturošana, izlašu skaita noteikšana; Kopas, Eilera-Venna diagramma. Pilnā pārlase; Varbūtība un tās lietojumi'),
  ('Как определяют геометрические фигуры', 'Ģeometriskās figūras, taisnes un leņķi', 'skola2030-g7-2-opredelyayut-geometricheskie-figury', (select id from public.subjects where slug = 'geometry'), 7, 2, 'Взаимное расположение двух прямых на плоскости. Угол; Равные фигуры. Длина отрезка и её вычисление; Определение и изображение геометрических фигур', 'Divu taišņu novietojums plaknē. Leņķis; Vienādas figūras. Nogriežņa garums un tā aprēķināšana; Ģeometrisko figūru definēšana un attēlošana'),
  ('Как характеризуют зависимость между переменными величинами', 'Tiešā un apgrieztā proporcionalitāte', 'skola2030-g7-3-kharakterizuyut-zavisimost-mezhdu-peremennymi', (select id from public.subjects where slug = 'algebra'), 7, 3, 'Зависимость между обратно пропорциональными величинами и другие виды зависимостей; Зависимость между прямо пропорциональными величинами', 'Sakarība starp apgriezti proporcionāliem lielumiem un cita veida sakarības; Sakarība starp tieši proporcionāliem lielumiem'),
  ('Как записывают и исследуют функции, график которых — прямая', 'Lineārā funkcija un tās grafiks', 'skola2030-g7-4-zapisyvayut-i-issleduyut-funktsii', (select id from public.subjects where slug = 'algebra'), 7, 4, 'Функция, связанные с ней понятия. Линейная функция; Свойства линейной функции', 'Funkcija, ar to saistītie jēdzieni. Lineāra funkcija; Lineāras funkcijas īpašības'),
  ('Как характеризуют треугольник, используя его элементы', 'Trijstūris, tā elementi un vienādības pazīmes', 'skola2030-g7-5-kharakterizuyut-treugolnik-ispolzuya-ego', (select id from public.subjects where slug = 'geometry'), 7, 5, 'Серединный перпендикуляр отрезка и характерные отрезки в треугольнике; Треугольники с равными сторонами; Расположение трех точек на плоскости. Треугольник; Равные треугольники, признаки равенства и их применение', 'Nogriežņa vidusperpendikuls un raksturīgie nogriežņi trijstūrī; Trijstūri ar vienādām malām; Triju punktu novietojums plaknē.Trijstūris; Vienādi trijstūri, vienādības pazīmes un to lietošana'),
  ('Каковы зависимости между величинами в треугольнике', 'Sakarības starp malām un leņķiem trijstūrī', 'skola2030-g7-6-zavisimosti-mezhdu-velichinami-v', (select id from public.subjects where slug = 'geometry'), 7, 6, 'Зависимости между сторонами и углами треугольника. Свойства и признаки треугольника; Сумма углов треугольника; Расположение трех прямых на плоскости', 'Sakarības starp trijstūra malām un leņķiem. Trijstūra īpašības un pazīmes; Trijstūra leņķu summa; Trīs taišņu novietojums plaknē'),
  ('Что значит преобразовать выражение с переменной величиной', 'Algebriskas izteiksmes un to pārveidojumi', 'skola2030-g7-7-znachit-preobrazovat-vyrazhenie-s', (select id from public.subjects where slug = 'algebra'), 7, 7, 'Алгебраические выражения и их значение; Преобразования алгебраических выражений; Тождественно равные выражения; Числовые и алгебраические выражения', 'Algebriskas izteiksmes un to vērtība; Algebrisku izteiksmju pārveidojumi; Identiski vienādas izteiksmes; Skaitliskas un algebriskas izteiksmes'),
  ('Каковы приемы определения неизвестного, линейное уравнение', 'Lineāri vienādojumi un proporcijas', 'skola2030-g7-8-priemy-opredeleniya-neizvestnogo-lineynoe', (select id from public.subjects where slug = 'algebra'), 7, 8, 'Использование линейного уравнения при решении текстовых задач; Линейное уравнение и его решение; Пропорция. Выражение величины из пропорции; Эквивалентные преобразования уравнения', 'Lineāra vienādojuma lietojums teksta uzdevumu atrisināšanā; Lineārs vienādojums un tā atrisināšana; Proporcija. Lieluma izteikšana no proporcijas; Vienādojuma ekvivalenti pārveidojumi'),
  ('Как сравнивают выражения, где есть переменная, неравенства', 'Lineāras nevienādības', 'skola2030-g7-9-sravnivayut-vyrazheniya-est-peremennaya', (select id from public.subjects where slug = 'algebra'), 7, 9, 'Сравнение выражений. Неравенство и его решение; Решение линейных неравенств; Применение неравенств', 'Izteiksmju salīdzināšana. Nevienādība un tās atrisinājums; Lineāru nevienādību atrisināšana; Nevienādību lietošana'),
  ('Как математически описывают и анализируют данные, статистика', 'Datu vākšana, kārtošana un statistiskie rādītāji', 'skola2030-g8-1-matematicheski-opisyvayut-i-analiziruyut', (select id from public.subjects where slug = 'statistics'), 8, 1, 'Сбор, обобщение и отображение данных; Упорядочивание данных и статистические показатели', 'Datu ieguve, apkopošana un attēlošana; Datu sakārtošana un statistiskie rādītāji'),
  ('Как объясняют и применяют степень с целым показателем', 'Pakāpe ar veselu kāpinātāju', 'skola2030-g8-2-obyasnyayut-i-primenyayut-stepen', (select id from public.subjects where slug = 'algebra'), 8, 2, 'Степень с натуральным показателем и свойства; Степень с целым показателем', 'Pakāpe ar naturālu kāpinātāju un īpašības; Pakāpe ar veselu kāpinātāju'),
  ('Как поступают, если число нельзя записать в виде дроби, квадратный корень', 'Kvadrātsakne un reālie skaitļi', 'skola2030-g8-3-postupayut-esli-chislo-nelzya', (select id from public.subjects where slug = 'algebra'), 8, 3, 'Арифметический квадратный корень; Свойства арифметического квадратного корня; Приближения точного значения чисел. Рациональные и иррациональные числа', 'Aritmētiskā kvadrātsakne; Aritmētiskās kvadrātsaknes īpašības; Skaitļu precīzās vērtības tuvinājumi. Racionāli un iracionāli skaitļi'),
  ('Как вычисляют площадь для любого треугольника, круга, призмы, цилиндра', 'Trijstūra, riņķa, prizmas un cilindra laukumi un tilpumi', 'skola2030-g8-4-vychislyayut-ploshchad-dlya-lyubogo', (select id from public.subjects where slug = 'geometry'), 8, 4, 'Цилиндр, площадь его поверхности и объем; Площадь. Площадь треугольника; Площадь круга. Площадь комбинированных фигур; Прямая призма, площадь её поверхности и объем', 'Cilindrs, tā virsmas laukums un tilpums; Laukums. Trijstūra laukums; Riņķa laukums. Kombinētu figūru laukums; Taisna prizma, tās virsmas laukums un tilpums'),
  ('Что общего у четырехугольников, противоположные стороны которых попарно параллельны', 'Paralelograms, rombs un taisnstūris', 'skola2030-g8-5-obshchego-u-chetyrekhugolnikov-protivopolozhnye', (select id from public.subjects where slug = 'geometry'), 8, 5, 'Площадь параллелограмма; Параллелограмм; Ромб и прямоугольник; Признаки параллельности прямых; Четырехугольники', 'Paralelograma laukums; Paralelograms; Rombs un taisnstūris; Taišņu paralelitātes pazīmes; Četrstūri'),
  ('Как объясняют и выполняют действия с выражениями', 'Darbības ar vienaudžiem un daudzskaldņiem/polinomiem', 'skola2030-g8-6-obyasnyayut-i-vypolnyayut-deystviya', (select id from public.subjects where slug = 'algebra'), 8, 6, 'Произведение одночлена и многочлена; Одночлены, их сложение и вычитание; Умножение, деление, возведение в степень одночленов; Произведение многочлена на многочлен; Многочлены, их сложение и вычитание', 'Monoma un polinoma reizinājums; Monomi, to saskaitīšana un atņemšana; Monomu reizināšana, dalīšana, kāpināšana; Polinoma reizinājums ar polinomu; Polinomi, to saskaitīšana un atņemšana'),
  ('Как различные функции используют для математического моделирования', 'Kvadrātfunkcija un apgrieztā proporcionalitāte', 'skola2030-g8-7-razlichnye-funktsii-ispolzuyut-dlya', (select id from public.subjects where slug = 'algebra'), 8, 7, 'Функция y=k/x; Квадратичная функция, свойства; График квадратичной функции', 'Funkcija y=k/x; Kvadrātfunkcija, īpašības; Kvadrātfunkcijas grafiks'),
  ('Как определяют неизвестную сторону прямоугольного треугольника, теорема Пифагора', 'Pitagora teorēma un taisnleņķa trijstūris', 'skola2030-g8-8-opredelyayut-neizvestnuyu-storonu-pryamougolnogo', (select id from public.subjects where slug = 'geometry'), 8, 8, 'Теорема Пифагора и её применение; Прямоугольный треугольник, равенство прямоугольных треугольников', 'Pitagora teorēma un tās lietojums; Taisleņķa trijstūris, taisleņķa trijstūru vienādība'),
  ('Как определяют и характеризуют подобные треугольники', 'Līdzīgi trijstūri un Talesa teorēma', 'skola2030-g9-1-opredelyayut-i-kharakterizuyut-podobnye', (select id from public.subjects where slug = 'geometry'), 9, 1, 'Подобные треугольники, признаки подобия треугольников; Теорема Фалеса. Пропорциональные отрезки; Средняя линия треугольника; Применение подобия треугольников', 'Līdzīgi trijstūri, trijstūru līdzības pazīmes; Talesa teorēma. Proporcionāli nogriežņi; Trijstūra viduslīnija; Trijstūru līdzības lietojums'),
  ('Что общего у четырехугольников, у которых ровно две стороны параллельны, трапеция', 'Trapece un tās laukums', 'skola2030-g9-2-obshchego-u-chetyrekhugolnikov-u', (select id from public.subjects where slug = 'geometry'), 9, 2, 'Прямая четырехугольная призма, пространственные тела; Трапеция, прямоугольная трапеция; Средняя линия трапеции. Площадь трапеции; Равнобедренная трапеция', 'Taisna četrstūra prizma, telpiski ķermeņi; Trapece, taisnleņķa trapece; Trapeces viduslīnija. Trapeces laukums; Vienādsānu trapece'),
  ('Как в вычислениях используют отношение двух сторон прямоугольного треугольника', 'Sinuss, kosinuss un tangenss taisnleņķa trijstūrī', 'skola2030-g9-3-v-vychisleniyakh-ispolzuyut-otnoshenie', (select id from public.subjects where slug = 'geometry'), 9, 3, 'Зависимости в прямоугольном треугольнике в математических и реальных контекстах; Определение sin, cos, tg, вычисление неизвестных величин в прямоугольном треугольнике', 'Sakarības taisnleņķa trijstūrī matemātiskos un reālos kontekstos; Sin, cos, tg definēšana, nezināmo lielumu aprēķināšana taisnleņķa trijstūrī'),
  ('Как используют разложение выражений на множители', 'Formulas saīsinātai reizināšanai un sadalīšana reizinātājos', 'skola2030-g9-4-ispolzuyut-razlozhenie-vyrazheniy-na', (select id from public.subjects where slug = 'algebra'), 9, 4, 'Квадрат двучлена; Разность квадратов; Разложение многочлена на множители вынесением общего множителя за скобки; Применение всех действий с одночленами, многочленами', 'Binoma kvadrāts; Kvadrātu starpība; Polinoma sadalīšana reizinātājos, iznesot kopīgo reizinātāju pirms iekavām; Visu darbību ar monomiem, polinomiem lietojums'),
  ('Как объясняют и используют формулы при работе с квадратным уравнением, квадратичной функцией', 'Kvadrātvienādojumi, diskriminants un Vjeta teorēma', 'skola2030-g9-5-obyasnyayut-i-ispolzuyut-formuly', (select id from public.subjects where slug = 'algebra'), 9, 5, 'Квадратичные функции; Квадратные неравенства; Формула корней квадратного уравнения; Квадратные уравнения x²=t, ax²=t и (x+k)²=t; Квадратное уравнение; Произведение, равное 0, уравнения ax²+bx=0; Теорема Виета', 'Kvadrātfunkcijas; Kvadrātnevienādības; Kvadrātvienādojuma sakņu formula; Kvadrātvienādojumi x²=t, ax²=t un (x+k)²=t; Kvadrātvienādojums; Reizinājums vienāds ar 0, vienādojumi ax²+bx=0; Vjeta teorēma'),
  ('Как описывают ситуации с двумя неизвестными величинами', 'Divu vienādojumu sistēmas ar diviem mainīgajiem', 'skola2030-g9-6-opisyvayut-situatsii-s-dvumya', (select id from public.subjects where slug = 'algebra'), 9, 6, 'Уравнение с двумя неизвестными, его графическое изображение; Решение систем уравнений графическим способом; Аналитические способы решения систем уравнений (вместе); Способ подстановки для решения систем уравнений; Способ сложения для решения систем уравнений', 'Vienādojums ar diviem nezināmajiem, tā grafiskais attēlojums; Vienādojumu sistēmas atrisināšana grafiski; Vienādojumu sistēmas atrisināšanas analītiskie paņēmieni (kopā); Vienādojumu sistēmas atrisināšanas ievietošanas paņēmiens; Vienādojumu sistēmas atrisināšanas saskaitīšanas paņēmiens'),
  ('Как числовую последовательность записывают формулой', 'Aritmētiskā progresija', 'skola2030-g9-7-chislovuyu-posledovatelnost-zapisyvayut-formuloy', (select id from public.subjects where slug = 'algebra'), 9, 7, 'Арифметическая прогрессия, её свойства; Применение арифметической прогрессии; Числовые последовательности, упорядочивания чисел', 'Aritmētiskā progresija, tās īpašības; Aritmētiskās progresijas pielietojums; Skaitļu virknes, skaitļu sakārtojumi'),
  ('Как описывают взаимное расположение окружности и многоугольника', 'Ievilktas un apvilktas riņķa līnijas un daudzstūri', 'skola2030-g9-8-opisyvayut-vzaimnoe-raspolozhenie-okruzhnosti', (select id from public.subjects where slug = 'geometry'), 9, 8, 'Окружность, описанная около треугольника; Правильные многоугольники; Касательная к окружности, вписанная в треугольник окружность; Четырехугольник и окружность', 'Ap trijstūri apvilkta riņķa līnija; Regulāri daudzstūri; Riņķa līnijas pieskare, trijstūrī ievilkta riņķa līnija; Četrstūris un riņķa līnija'),
  ('Векторы и движение', 'Vektori plaknē un telpā, vektoru darbības', 'skola2030-g11-1-vektory-i-dvizhenie', (select id from public.subjects where slug = 'geometry'), 11, 1, 'Расстояние между двумя точками; Проекция вектора на ось; Векторы в координатной форме на плоскости; Векторы в пространстве; Вектор, его модуль. Расположение векторов; Выражение векторов; Правила сложения векторов', 'Attālums starp diviem punktiem; Vektora projekcija uz ass; Vektori koordinātu formā plaknē; Vektori telpā; Vektors, tā modulis. Vektoru novietojums; Vektoru izteikšana; Vektoru saskaitīšanas likumi'),
  ('Уравнение линии', 'Taisnes un riņķa līnijas vienādojums', 'skola2030-g11-2-uravnenie-linii', (select id from public.subjects where slug = 'geometry'), 11, 2, 'Линейная функция. Приращение функции и аргумента; Неравенство с 2 переменными; Параллельные и перпендикулярные прямые; Уравнение прямой; Уравнение с 2 переменными. Уравнение окружности', 'Lineāra funkcija. Funkcijas un argumenta pieaugums; Nevienādība ar 2 mainīgajiem; Paralēlas un perpendikulāras taisnes; Taisnes vienādojums; Vienādojums ar 2 mainīgajiem. Riņķa līnijas vienādojums'),
  ('Комбинаторика и вероятность I', 'Kombinatorika un varbūtību teorija I', 'skola2030-g11-3-kombinatorika-i-veroyatnost-i', (select id from public.subjects where slug = 'statistics'), 11, 3, 'Комбинаторика I; Комбинаторика. Введение; Множества. Действия с множествами; Вероятность суммы. Условная вероятность; Элементы теории вероятностей', 'Kombinatorika I; Kombinatorika. Ievads; Kopas. Darbības ar kopām; Summas varbūtība. Nosacītā varbūtība; Varbūtību teorijas elementi'),
  ('Статистика I', 'Aprakstošā statistika un izkliedes mēri I', 'skola2030-g11-4-statistika-i', (select id from public.subjects where slug = 'statistics'), 11, 4, 'Меры рассеяния, графическое представление данных; Популяция, выборка и данные. Средние величины', 'Izkliedes mēri, datu grafiska attēlošana; Populācija, izlase un dati. Vidējie lielumi'),
  ('Дробно-рациональная функция и алгебраические дроби', 'Algebriskās daļas un daļveida racionāla funkcija', 'skola2030-g11-5-drobno-ratsionalnaya-funktsiya-i', (select id from public.subjects where slug = 'algebra'), 11, 5, 'Алгебраические дроби. Область определения; Алгебраические уравнения; Умножение, деление, возведение в степень алгебраических дробей; Сложение и вычитание алгебраических дробей; Сокращение и расширение алгебраических дробей; Дробно-рациональная функция; Тождество. Закон смены знаков; Рациональные алгебраические выражения', 'Algebriskas daļas. Definīcijas kopa; Algebriski vienādojumi; Algebrisko daļu reizināšana, dalīšana, kāpināšana; Algebrisko daļu saskaitīšana un atņemšana; Algebrisku daļu saīsināšana un paplašināšana; Daļveida funkcija; Identitāte. Zīmju maiņas likums; Racionālas algebriskas izteiksmes'),
  ('Дробно-рациональные уравнения и неравенства', 'Daļveida racionāli vienādojumi un nevienādības', 'skola2030-g11-6-drobno-ratsionalnye-uravneniya-i', (select id from public.subjects where slug = 'algebra'), 11, 6, 'Повторение решения линейных и квадратных неравенств; Дробно-рациональные неравенства. Метод интервалов; Дробно-рациональные уравнения; Дробно-рациональные уравнения в текстовых задачах', 'Atkārtojums par lineāru un kvadrātnevienādību risināšanu; Daļveida nevienādības. Intervālu metode; Daļveida vienādojumi; Daļveida vienādojumi teksta uzdevumos'),
  ('Функции синуса и косинуса', 'Sinusa un kosinusa funkcijas, sinusu un kosinusu teorēmas', 'skola2030-g11-7-funktsii-sinusa-i-kosinusa', (select id from public.subjects where slug = 'geometry'), 11, 7, 'Синус и косинус угла поворота; Зависимости в прямоугольном треугольнике. Повторение; Теорема синусов и косинусов; Тригонометрические функции, их свойства', 'Pagrieziena leņķa sinuss un kosinuss; Sakarības taisnleņķa trijstūrī. Atkārtojums; Sinusu un kosinusu teorēma; Trigonometriskās funkcijas, to īpašības'),
  ('Тригонометрические выражения и уравнения', 'Trigonometriskās formulas un pamatvienādojumi', 'skola2030-g11-8-trigonometricheskie-vyrazheniya-i-uravneniya', (select id from public.subjects where slug = 'algebra'), 11, 8, 'Формулы суммы аргументов и двойного аргумента; Метод разложения на множители и метод подстановки; Простейшие тригонометрические уравнения; Тригонометрические выражения и основное тождество', 'Argumentu summas un divkāršā argumenta formulas; Sadalīšana reizinātājos un substitūcijas metode; Trigonometriskie pamatvienādojumi; Trigonometriskās izteiksmes un pamatidentitāte'),
  ('Степень с рациональным показателем, геометрическая прогрессия', 'Pakāpe ar racionālu kāpinātāju un ģeometriskā progresija', 'skola2030-g11-9-stepen-s-ratsionalnym-pokazatelem', (select id from public.subjects where slug = 'algebra'), 11, 9, 'Корень n-ой степени; Степень с рациональным показателем; Последовательности; Геометрическая прогрессия', 'N-tās pakāpes sakne; Pakāpe ar racionālu kāpinātāju; Virknes; Ģeometriskā progresija'),
  ('Показательная функция', 'Eksponentfunkcija, eksponentvienādojumi un logaritmi', 'skola2030-g11-10-pokazatelnaya-funktsiya', (select id from public.subjects where slug = 'algebra'), 11, 10, 'Экспоненциальные процессы; Показательная функция; Показательные неравенства; Показательные уравнения; Свойства степеней. Повторение; Простейшие неравенства. Повторение; Простейшие уравнения. Повторение; Логарифм числа', 'Eksponenciāli procesi; Eksponentfunkcija; Eksponentnevienādības; Eksponentvienādojumi; Pakāpju īpašības. Atkārtojums; Pamatnevienādības. Atkārtojums; Pamatvienādojumi. Atkārtojums; Skaitļa logaritms'),
  ('Прямые и плоскости в пространстве, многогранники', 'Taisnes un plaknes telpā, daudzskaldņi un prizmas', 'skola2030-g11-11-pryamye-i-ploskosti-v', (select id from public.subjects where slug = 'geometry'), 11, 11, 'Диагонали многогранника и сечение плоскостью; Неправильная пирамида; Поверхность и объем призмы; Правильная треугольная пирамида; Правильная четырехугольная и шестиугольная пирамида; Прямые и плоскости в пространстве; Вычисления в прямоугольном треугольнике. Повторение', 'Daudzskaldņa diagonāles un šķēlums ar plakni; Neregulāra piramīda; Prizmas virsma un tilpums; Regulāra trijstūra piramīda; Regulāra četrstūra un sešstūra piramīda; Taisnes un plaknes telpā; Taisnleņķa trijstūra aprēķināšana. Atkārtojums'),
  ('Тела вращения', 'Rotācijas ķermeņi (cilindrs, konuss, lode)', 'skola2030-g11-12-tela-vrashcheniya', (select id from public.subjects where slug = 'geometry'), 11, 12, 'Геометрические комбинации цилиндра и призмы; Цилиндр; Конус; Шар; Геометрические комбинации шара и призмы', 'Cilindra un prizmas ģeometriskās kombinācijas; Cilindrs; Konuss; Lode; Lodes un prizmas ģeometriskās kombinācijas'),
  ('Математическая индукция', 'Matemātiskā indukcija, Paskāla trijstūris un Ņūtona binoms', 'skola2030-g12-1-matematicheskaya-induktsiya', (select id from public.subjects where slug = 'statistics'), 12, 1, 'Комбинаторика II. Треугольник Паскаля; Принцип математической индукции; Элементы математической логики; Бином Ньютона', 'Kombinatorika II. Paskāla trijstūris; Matemātiskās indukcijas princips. MIP; Matemātiskās loģikas elementi; Ņūtona binoms'),
  ('Вероятность и статистика II', 'Varbūtību sadalījumi, Bernulli formula un pilnā varbūtība II', 'skola2030-g12-2-veroyatnost-i-statistika-ii', (select id from public.subjects where slug = 'statistics'), 12, 2, 'Распределения случайной величины. Формула Бернулли; Вероятность объединения событий; Формула полной вероятности; Статистика II', 'Gadījuma lieluma sadalījumi. Bernulli formula; Notikumu apvienojuma varbūtība; Pilnās varbūtības formula; Statistika II'),
  ('Последовательности и показательная функция', 'Skaitļu virkņu robeža, skaitlis e un bezgalīga ģeometriskā progresija', 'skola2030-g12-3-posledovatelnosti-i-pokazatelnaya-funktsiya', (select id from public.subjects where slug = 'algebra'), 12, 3, 'Бесконечно убывающая геометрическая прогрессия; Число e и экспоненциальные процессы; Последовательности, их монотонность и предел', 'Bezgalīgi dilstoša ģeometriskā progresija; Skaitlis e un eksponenciāli procesi; Virknes, to monotonitāte un robeža'),
  ('Степенная функция и логарифмическая функция, модуль', 'Pakāpes un logaritmiskā funkcija, moduļa vienādojumi', 'skola2030-g12-4-stepennaya-funktsiya-i-logarifmicheskaya', (select id from public.subjects where slug = 'algebra'), 12, 4, 'Обратная функция; Иррациональные и логарифмические уравнения; Логарифмические уравнения и системы; Логарифмическая функция; Логарифмические неравенства; Функция модуля, уравнения, неравенства; Степенная функция', 'Inversā funkcija; Iracionālie un logaritmiskie vienādojumi; Logaritmiskie vienādojumi un sistēmas; Logaritmiskā funkcija; Logaritmiskās nevienādības; Moduļa funkcija, vienādojumi, nevienādības; Pakāpes funkcija'),
  ('Дробно-рациональная функция и алгебраические преобразования', 'Polinomu dalīšana, Bezū teorēma un nenoteiktie koeficienti', 'skola2030-g12-5-drobno-ratsionalnaya-funktsiya-i', (select id from public.subjects where slug = 'algebra'), 12, 5, 'Дробно-рациональная функция; Метод неопределенных коэффициентов; Деление многочлена на многочлен. Теорема Безу; Разложение на множители', 'Daļveida funkcija; Nenoteikto koeficientu metode; Polinoma dalīšana ar polinomu. Bezū teorēma; Sadalīšana reizinātājos'),
  ('Производная и её применение', 'Atvasinājums, diferencēšanas kārtulas un funkciju pētīšana', 'skola2030-g12-6-proizvodnaya-i-eyo-primenenie', (select id from public.subjects where slug = 'algebra'), 12, 6, 'Определение производной и её смысл; Применение производной при исследовании функций; Правила и формулы дифференцирования; Непрерывность функции; Исследование функций в математике и других областях; Предел', 'Atvasinājuma definīcija un  interpretācija; Atvasinājuma definīcija un interpretācija; Atvasinājuma lietojums funkciju pētīšanā; Atvasināšanas likumi un formulas; Funkcijas nepārtrauktība; Funkciju pētīšana matemātikā un citās jomās; Robeža'),
  ('Интеграл и его применение', 'Nenoteiktais un noteiktais integrālis, laukumu aprēķināšana', 'skola2030-g12-7-integral-i-ego-primenenie', (select id from public.subjects where slug = 'algebra'), 12, 7, 'Интегрирование дробно-рациональных функций; Вычисление площади и объема с помощью определенного интеграла; Неопределенный интеграл; Определенный интеграл и его применение в физике; Переход к дифференциалу другой функции (замена переменной)', 'Daļveida racionālu funkciju integrēšana; Laukuma un tilpuma aprēķināšana ar noteikto integrāli; Nenoteiktais integrālis; Noteiktais integrālis un integrāļa lietojums fizikā; Pāreja uz citas funkcijas diferenciāli'),
  ('Тригонометрия II', 'Trigonometriskās nevienādības un inversās trigonometriskās funkcijas', 'skola2030-g12-8-trigonometriya-ii', (select id from public.subjects where slug = 'algebra'), 12, 8, 'Тангенс и котангенс угла; Тригонометрические уравнения и неравенства; Тригонометрические и обратные им функции', 'Leņķa tangenss un kotangenss; Trigonometriskie vienādojumi un nevienādības; Trigonometriskās un to inversās funkcijas'),
  ('Аналитическая геометрия', 'Analītiskā ģeometrija: taisnes, vektori un skalārais reizinājums', 'skola2030-g12-9-analiticheskaya-geometriya', (select id from public.subjects where slug = 'geometry'), 12, 9, 'Взаимное расположение двух прямых. Точка и прямая; Линии на плоскости; Уравнение прямой; Векторы; Скалярное произведение векторов', 'Divu taišņu savstarpējais novietojums. Punkts un taisne; Līnijas plaknē; Taisnes vienādojums; Vektori; Vektoru skalārais reizinājums'),
  ('Планиметрия II', 'Padziļinātā planimetrija: sakarības daudzstūros un riņķī', 'skola2030-g12-10-planimetriya-ii', (select id from public.subjects where slug = 'geometry'), 12, 10, 'Углы и отрезки, связанные с окружностью; Зависимости в многоугольниках, правильных многоугольниках; Зависимости в треугольниках; Зависимости в четырехугольниках; Геометрические преобразования', 'Ar riņķa līniju saistītie leņķi un nogriežņi; Sakarības daudzstūros, regulāros daudzstūros; Sakarības trijstūros; Sakarības četrstūros; Ģeometriskie pārveidojumi'),
  ('Стереометрия II', 'Padziļinātā stereometrija: ķermeņu šķēlumi un kombinācijas', 'skola2030-g12-11-stereometriya-ii', (select id from public.subjects where slug = 'geometry'), 12, 11, 'Многогранники, их сечение плоскостью; Геометрические комбинации конуса и пирамиды; Геометрические комбинации шара, цилиндра и конуса; Геометрические комбинации призмы и цилиндра; Комбинации призмы и шара, пирамиды и шара', 'Daudzskaldņi, to šķēlums ar plakni; Konusa un piramīdas ģeometriskās kombinācijas; Lodes, cilindra un konusa ģeometriskās kombinācijas; Prizmas un cilindra ģeometriskās kombinācijas; Prizmas un lodes, piramīdas un lodes kombinācijas'),
  ('Комплексные задачи по алгебре', 'Kompleksie uzdevumi algebrā, vienādojumi ar parametriem', 'skola2030-g12-12-kompleksnye-zadachi-po-algebre', (select id from public.subjects where slug = 'algebra'), 12, 12, 'Повторение. Виды простейших уравнений; Метод подстановки. Уравнения и неравенства; Уравнения с параметром; Решение уравнений разложением на множители', 'Atkārtojums. Pamatvienādojumu veidi; Substitūcijas metode. Vienādojumi un nevienādības; Vienādojumi ar parametru; Vienādojumu risināšana, sadalot reizinātājos')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  subject_id = excluded.subject_id,
  grade = excluded.grade,
  position = excluded.position,
  description = excluded.description,
  description_lv = excluded.description_lv;

-- 3. Примеры задач стандарта Skola2030 с пошаговыми решениями и мультиязычностью
insert into public.tasks (topic_id, title, title_lv, grade, condition_latex, condition_latex_lv, answer_latex, solution_latex, solution_latex_lv, difficulty, position, is_published)
select
  t.id,
  v.title, v.title_lv,
  v.grade,
  v.condition_latex, v.condition_latex_lv,
  v.answer_latex,
  v.solution_latex, v.solution_latex_lv,
  v.difficulty,
  v.position,
  true
from (
  values
    -- 1 класс: Сложение и вычитание в пределах 10
    (
      'skola2030-g1-2-vsego-ostalos',
      'Сложение в пределах 10', 'Saskaitīšana 10 apjomā',
      1,
      'Вычислите значение суммы: $$4 + 3 = ?$$',
      'Aprēķiniet summas vērtību: $$4 + 3 = ?$$',
      '$7$',
      'Прибавим к числу $4$ три единицы: $4 + 1 = 5$, $5 + 1 = 6$, $6 + 1 = 7$. Ответ: $7$.',
      'Pieskaitām skaitlim $4$ trīs vienus: $4 + 1 = 5$, $5 + 1 = 6$, $6 + 1 = 7$. Atbilde: $7$.',
      'Лёгкий', 1
    ),
    -- 7 класс: Линейные уравнения
    (
      'skola2030-g7-8-priemy-opredeleniya',
      'Линейное уравнение со скобками', 'Lineārs vienādojums ar iekavām',
      7,
      'Решите уравнение: $$3(2x - 5) + 4 = 5x - 7$$',
      'Atrisiniet vienādojumu: $$3(2x - 5) + 4 = 5x - 7$$',
      '$x = 4$',
      'Раскроем скобки в левой части уравнения:
$$6x - 15 + 4 = 5x - 7$$
$$6x - 11 = 5x - 7$$
Перенесём слагаемые с переменной влево, а числа вправо:
$$6x - 5x = -7 + 11$$
$$x = 4$$',
      'Atveriet iekavas vienādojuma kreisajā pusē:
$$6x - 15 + 4 = 5x - 7$$
$$6x - 11 = 5x - 7$$
Pārnesiet saskaitāmos ar mainīgo pa kreisi, bet skaitļus pa labi:
$$6x - 5x = -7 + 11$$
$$x = 4$$',
      'Средний', 1
    ),
    -- 8 класс: Теорема Пифагора
    (
      'skola2030-g8-8-opredelyayut-neizvestnuyu',
      'Нахождение гипотенузы', 'Hipotēzes aprēķināšana',
      8,
      'В прямоугольном треугольнике катеты равны $a = 6\text{ см}$ и $b = 8\text{ см}$. Найдите гипотенузу $c$.',
      'Taisnleņķa trijstūrī katetes ir $a = 6\text{ cm}$ un $b = 8\text{ cm}$. Aprēķiniet hipotenūzu $c$.',
      '$c = 10\text{ см}$',
      'По теореме Пифагора:
$$c^2 = a^2 + b^2$$
$$c^2 = 6^2 + 8^2 = 36 + 64 = 100$$
$$c = \sqrt{100} = 10\text{ см}$$',
      'Pēc Pitagora teorēmas:
$$c^2 = a^2 + b^2$$
$$c^2 = 6^2 + 8^2 = 36 + 64 = 100$$
$$c = \sqrt{100} = 10\text{ cm}$$',
      'Лёгкий', 1
    ),
    -- 9 класс: Квадратное уравнение и теорема Виета
    (
      'skola2030-g9-5-obyasnyayut-ispolzuyut',
      'Квадратное уравнение через дискриминант', 'Kvadrātvienādojums ar diskriminantu',
      9,
      'Решите квадратное уравнение: $$x^2 - 5x + 6 = 0$$',
      'Atrisiniet kvadrātvienādojumu: $$x^2 - 5x + 6 = 0$$',
      '$x_1 = 2,\; x_2 = 3$',
      'Коэффициенты: $a = 1, b = -5, c = 6$.
Дискриминант: $$D = b^2 - 4ac = (-5)^2 - 4 \cdot 1 \cdot 6 = 25 - 24 = 1$$
Корни уравнения:
$$x = \frac{-b \pm \sqrt{D}}{2a} = \frac{5 \pm 1}{2}$$
$$x_1 = 3,\quad x_2 = 2$$',
      'Koeficienti: $a = 1, b = -5, c = 6$.
Diskriminants: $$D = b^2 - 4ac = (-5)^2 - 4 \cdot 1 \cdot 6 = 25 - 24 = 1$$
Saknes:
$$x = \frac{-b \pm \sqrt{D}}{2a} = \frac{5 \pm 1}{2}$$
$$x_1 = 3,\quad x_2 = 2$$',
      'Средний', 1
    ),
    -- 11 класс (Matemātika I): Логарифмическое уравнение
    (
      'skola2030-g11-10-eksponentfunktsiya',
      'Логарифмическое уравнение', 'Logaritmisks vienādojums',
      11,
      'Решите уравнение: $$\log_2(x - 3) = 3$$',
      'Atrisiniet vienādojumu: $$\log_2(x - 3) = 3$$',
      '$x = 11$',
      'Область определения: $x - 3 > 0 \implies x > 3$.
По определению логарифма:
$$x - 3 = 2^3$$
$$x - 3 = 8 \implies x = 11$$
Проверка: $\log_2(11 - 3) = \log_2 8 = 3$ — верно.',
      'Definīcijas apgabals: $x - 3 > 0 \implies x > 3$.
Pēc logaritma definīcijas:
$$x - 3 = 2^3 = 8 \implies x = 11$$
Pārbaude: $\log_2 8 = 3$ — patiess.',
      'Средний', 1
    ),
    -- 12 класс (Matemātika II): Производная функции
    (
      'skola2030-g12-6-proizvodnaya-eyo',
      'Производная функции в точке', 'Funkcijas atvasinājums punktā',
      12,
      'Найдите значение производной функции $f(x) = 3x^2 - 4x + 5$ в точке $x_0 = 2$.',
      'Aprēķiniet funkcijas $f(x) = 3x^2 - 4x + 5$ atvasinājuma vērtību punktā $x_0 = 2$.',
      '$f''(2) = 8$',
      'Найдём общую формулу производной:
$$f''(x) = (3x^2)'' - (4x)'' + (5)'' = 6x - 4$$
Подставим $x_0 = 2$:
$$f''(2) = 6 \cdot 2 - 4 = 12 - 4 = 8$$',
      'Atrodiet atvasinājumu:
$$f''(x) = 6x - 4$$
Ievietojiet $x_0 = 2$:
$$f''(2) = 6 \cdot 2 - 4 = 8$$',
      'Средний', 1
    )
) as v(slug, title, title_lv, grade, condition_latex, condition_latex_lv, answer_latex, solution_latex, solution_latex_lv, difficulty, position)
join public.topics t on t.slug = v.slug
where not exists (
  select 1 from public.tasks tk where tk.topic_id = t.id and tk.title = v.title
);