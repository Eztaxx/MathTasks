-- ============================================================================
-- Seed: Каталог тем и задач курса Matemātika I (Optimālais līmenis, 11 klase)
-- Соответствует официальной таксономии Skola2030 (все 52 темы)
-- Запуск в Supabase: SQL Editor -> New query -> Paste & Run
-- ============================================================================

-- 1. Базовые разделы (Subjects), если ещё не созданы
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

-- 2. Темы курса Optimālais līmenis (52 темы)
insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Действительные числа и преобразование выражений', 'Reālie skaitļi un izteiksmju pārveidošana', 'opt-realie-skaitli-izteiksmes', (select id from public.subjects where slug = 'algebra'), 11, 1, 'Множества чисел, свойства действий, формулы сокращенного умножения, разложение на множители.', 'Skaitļu kopas, darbību īpašības, saīsinātās reizināšanas formulas, sadalīšana reizinātājos.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Линейные и квадратные уравнения, их системы', 'Lineāri un kvadrātvienādojumi, to sistēmas', 'opt-lineari-kvadratvienadojumi', (select id from public.subjects where slug = 'algebra'), 11, 2, 'Дискриминант, теорема Виета, методы решения систем нелинейных уравнений (подстановка, сложение).', 'Diskriminants, Vjeta teorēma, nelineāru vienādojumu sistēmu risināšanas metodes (ievietošana, saskaitīšana).')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Неравенства и метод интервалов', 'Nevienādības un intervālu metode', 'opt-nevienadibas-intervalu-metode', (select id from public.subjects where slug = 'algebra'), 11, 3, 'Квадратные неравенства, разложение на линейные множители, метод интервалов, строгие и нестрогие знаки.', 'Kvadrātnevienādības, sadalīšana lineāros reizinātājos, intervālu metode, stingrās un nestingrās zīmes.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Алгебраические дроби и действия с ними', 'Algebriskās daļas un darbības ar tām', 'opt-algebriskas-dalas', (select id from public.subjects where slug = 'algebra'), 11, 4, 'Область допустимых значений (ОДЗ), сокращение дробей, приведение к общему знаменателю, умножение и деление.', 'Definīcijas apgabals (pieļaujamās vērtības), daļu saīsināšana, kopsaucējs, algebrisko daļu reizināšana un dalīšana.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Дробно-рациональные уравнения и неравенства', 'Daļveida racionāli vienādojumi un nevienādības', 'opt-dalveida-racionali-vienadojumi', (select id from public.subjects where slug = 'algebra'), 11, 5, 'Решение дробно-рациональных уравнений, учет ограничений знаменателя, решение дробных неравенств методом интервалов.', 'Daļveida vienādojumu risināšana, saucēja ierobežojumi, daļveida nevienādību risināšana ar intervālu metodi.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Корень n-й степени и степень с рациональным показателем', 'N-tās pakāpes sakne un pakāpe ar racionālu kāpinātāju', 'opt-n-tas-pakapes-sakne', (select id from public.subjects where slug = 'algebra'), 11, 6, 'Свойства арифметического корня, переход от корня к дробному показателю $a^{m/n} = \sqrt[n]{a^m}$, вычисления со степенями.', 'Aritmētiskās saknes īpašības, pāreja no saknes uz racionālu kāpinātāju $a^{m/n} = \sqrt[n]{a^m}$, darbības ar pakāpēm.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Последовательности, арифметическая и геометрическая прогрессия', 'Virknes, aritmētiskā un ģeometriskā progresija', 'opt-virknes-progresijas', (select id from public.subjects where slug = 'algebra'), 11, 7, 'Формулы n-го члена, разность $d$ и знаменатель $q$, суммы первых $n$ членов прогрессий, практические задачи.', 'N-tā locekļa formulas, diference $d$ un kvocients $q$, pirmo $n$ locekļu summas formulas, praktiskie uzdevumi.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Показательные уравнения и неравенства', 'Eksponentvienādojumi un eksponentnevienādības', 'opt-eksponentvienadojumi-nevienadibas', (select id from public.subjects where slug = 'algebra'), 11, 8, 'Приведение к одинаковому основанию, вынесение общего множителя, замена переменной, учет монотонности основания при неравенствах.', 'Vienādo bāzu metode, kopīgā reizinātāja iznešana, mainīgā nomaiņa, bāzes monotonitātes ievērošana nevienādībās.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Логарифм и логарифмические уравнения', 'Logaritms, logaritmiskie vienādojumi', 'opt-logaritmi-vienadojumi', (select id from public.subjects where slug = 'algebra'), 11, 9, 'Определение логарифма, основные свойства (логарифм произведения, частного, степени), простейшие уравнения, ОДЗ.', 'Logaritma definīcija, pamatīpašības (reizinājuma, dalījuma, pakāpes logaritms), pamatvienādojumi, definīcijas kopa.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Уравнения и неравенства с модулем', 'Moduļa vienādojumi un nevienādības', 'opt-modula-vienadojumi-nevienadibas', (select id from public.subjects where slug = 'algebra'), 11, 10, 'Геометрический смысл модуля как расстояния, решение уравнений $|f(x)| = a$ и неравенств $|f(x)| < a$, $|f(x)| > a$.', 'Moduļa ģeometriskā jēga kā attālums, vienādojumu $|f(x)| = a$ un nevienādību $|f(x)| < a$, $|f(x)| > a$ risināšana.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Понятие функции, область определения и область значений', 'Funkcijas jēdziens, definīcijas un vērtību kopa', 'opt-funkcijas-jedziens-kopas', (select id from public.subjects where slug = 'algebra'), 11, 11, 'Определение функции, способы задания, нахождение области определения $D(f)$ и множества значений $E(f)$.', 'Funkcijas jēdziens, uzdošanas veidi, definīcijas kopas $D(f)$ un vērtību kopas $E(f)$ noteikšana.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Линейная функция и её график', 'Lineāra funkcija un tās grafiks', 'opt-lineara-funkcija-grafiks', (select id from public.subjects where slug = 'algebra'), 11, 12, 'Угловой коэффициент $k$, свободный член $b$, геометрический смысл $k = \tan \alpha$, параллельность и перпендикулярность прямых.', 'Virziena koeficients $k$, brīvais loceklis $b$, ģeometriskā jēga, paralēlas un perpendikulāras taisnes.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Квадратичная функция и вершина параболы', 'Kvadrātfunkcija un parabolas virsotne', 'opt-kvadratfunkcija-virsotne', (select id from public.subjects where slug = 'algebra'), 11, 13, 'Канонический вид $y = a(x - x_0)^2 + y_0$, координаты вершины $x_0 = -b/(2a)$, направление ветвей, ось симметрии.', 'Parabolas virsotnes koordinātas $x_0 = -b/(2a)$, zaru virziens, simetrijas ass, lielākā un mazākā vērtība.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Свойства функций: монотонность, нули, экстремумы', 'Funkciju īpašības: monotonitāte, nulles, ekstrēmi', 'opt-funkciju-ipasibas', (select id from public.subjects where slug = 'algebra'), 11, 14, 'Промежутки возрастания и убывания, нули функции $f(x) = 0$, знаки постоянства, точки локального максимума и минимума.', 'Augšanas un dilšanas intervāli, funkcijas nulles, zīmju pastāvības intervāli, lokālie ekstrēmi.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Дробно-линейная функция y = k/x', 'Daļveida racionāla funkcija y = k/x', 'opt-dalveida-funkcija', (select id from public.subjects where slug = 'algebra'), 11, 15, 'Обратная пропорциональность, гипербола, вертикальные и горизонтальные асимптоты, смещение графика.', 'Apgrieztā proporcionalitāte, hiperbola, asimptotas, grafika pārbīde koordinātu plaknē.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Степенная функция', 'Pakāpes funkcija', 'opt-pakapes-funkcija', (select id from public.subjects where slug = 'algebra'), 11, 16, 'Функции $y = x^n$ и $y = \sqrt[n]{x}$, поведение графиков в зависимости от четности и знака показателя.', 'Funkcijas $y = x^n$ un $y = \sqrt[n]{x}$, grafiku izskats un īpašības atkarībā no kāpinātāja paritātes un zīmes.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Показательная функция и экспоненциальные процессы', 'Eksponentfunkcija un eksponenciāli procesi', 'opt-eksponentfunkcija-procesi', (select id from public.subjects where slug = 'algebra'), 11, 17, 'График функции $y = a^x$ ($a > 0, a \ne 1$), экспоненциальный рост и распад, период полураспада, моделирование процессов.', 'Funkcijas $y = a^x$ grafiks un īpašības, eksponenciāls pieaugums un dilšana, pussabrukšanas periods.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Логарифмическая функция', 'Logaritmiskā funkcija', 'opt-logaritmiska-funkcija', (select id from public.subjects where slug = 'algebra'), 11, 18, 'График функции $y = \log_a x$, свойства монотонности в зависимости от основания $a$, взаимно обратная связь с показательной функцией.', 'Funkcijas $y = \log_a x$ grafiks, monotonitāte atkarībā no bāzes $a$, saistība ar eksponentfunkciju kā inverso funkciju.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Преобразования графиков функций', 'Funkciju grafiku transformācijas', 'opt-grafiku-transformacijas', (select id from public.subjects where slug = 'algebra'), 11, 19, 'Параллельный перенос вдоль осей координат $y = f(x \pm a) \pm b$, растяжение и сжатие, симметрия относительно осей.', 'Paralēlā pārnese pa koordinātu asīm $y = f(x \pm a) \pm b$, stiepšana, saspiešana, simetrija pret asīm.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Математическое моделирование с помощью функций', 'Matemātiskā modelēšana ar funkcijām', 'opt-matematiska-modelesana-funkcijas', (select id from public.subjects where slug = 'algebra'), 11, 20, 'Построение математических моделей реальных процессов, выбор оптимальных параметров, поиск экстремумов в прикладных задачах.', 'Reālu procesu modelēšana ar funkcijām, optimālo parametru izvēle, ekstrēmu atrašana lietišķos uzdevumos.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Соотношения в прямоугольном треугольнике (повторение)', 'Sakarības taisnleņķa trijstūrī (atkārtojums)', 'opt-trig-taisnlenka-trijsturi', (select id from public.subjects where slug = 'geometry'), 11, 21, 'Определения $\sin, \cos, \tan$ острого угла, теорема Пифагора, табличные значения для $30^\circ, 45^\circ, 60^\circ$.', 'Šaurā leņķa $\sin, \cos, \tan$ definīcijas, Pitagora teorēma, tabulas vērtības leņķiem $30^\circ, 45^\circ, 60^\circ$.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Угол поворота, радианы и единичная окружность', 'Pagrieziena leņķis, radiāni un vienības riņķa līnija', 'opt-pagrieziena-lenkis-radiani', (select id from public.subjects where slug = 'geometry'), 11, 22, 'Перевод градусов в радианы и обратно, тригонометрический круг, координаты точки $P_\alpha(\cos \alpha; \sin \alpha)$, четверти.', 'Pāreja no grādiem uz radiāniem un otrādi, trigonometriskais vienības riņķis, leņķa ceturkšņi.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Функции синуса и косинуса, их свойства', 'Sinusa un kosinusa funkcijas, to īpašības', 'opt-sinusa-kosinusa-funkcijas', (select id from public.subjects where slug = 'algebra'), 11, 23, 'Графики $y = \sin x$ и $y = \cos x$, периодичность ($T = 2\pi$), амплитуда, четность/нечетность, нули.', 'Funkciju $y = \sin x$ un $y = \cos x$ grafiki, periodiskums ($T = 2\pi$), amplitūda, paritāte, nulles.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Основное тригонометрическое тождество', 'Trigonometriskā pamatidentitāte', 'opt-trig-pamatidentitate', (select id from public.subjects where slug = 'algebra'), 11, 24, 'Формулы $\sin^2 \alpha + \cos^2 \alpha = 1$, связь тангенса и косинуса $1 + \tan^2 \alpha = \frac{1}{\cos^2 \alpha}$, нахождение триг-функций по одной известной.', 'Formulas $\sin^2 \alpha + \cos^2 \alpha = 1$, tangensa un kosinusa sakarības, pārējo funkciju noteikšana pēc dotās vērtības.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Теорема синусов и теорема косинусов', 'Sinusu un kosinusu teorēma', 'opt-sinusu-kosinusu-teorema', (select id from public.subjects where slug = 'geometry'), 11, 25, 'Решение произвольных треугольников, нахождение неизвестных сторон и углов, радиус описанной окружности $R = a / (2\sin \alpha)$.', 'Patvaļīgu trijstūru risināšana, nezināmo malu un leņķu aprēķināšana, apvilktās riņķa līnijas rādiuss.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Формулы сложения и двойного угла', 'Argumentu summas un divkāršā argumenta formulas', 'opt-argumentu-summas-formulas', (select id from public.subjects where slug = 'algebra'), 11, 26, 'Формулы $\sin(\alpha \pm \beta)$, $\cos(\alpha \pm \beta)$, $\sin 2\alpha = 2\sin \alpha \cos \alpha$, $\cos 2\alpha = \cos^2 \alpha - \sin^2 \alpha$.', 'Formulas $\sin(\alpha \pm \beta)$, $\cos(\alpha \pm \beta)$, $\sin 2\alpha$, $\cos 2\alpha$, izteiksmju vienkāršošana.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Преобразование тригонометрических выражений', 'Trigonometrisko izteiksmju pārveidošana', 'opt-trig-izteiksmju-parveidosana', (select id from public.subjects where slug = 'algebra'), 11, 27, 'Формулы приведения, понижение степени, доказательство тригонометрических тождеств.', 'Redukcijas formulas, pakāpes pazemināšana, trigonometrisko identitāšu pierādīšana.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Простейшие тригонометрические уравнения', 'Pamatvienādojumi sin x = a, cos x = a', 'opt-trig-pamatvienadojumi', (select id from public.subjects where slug = 'algebra'), 11, 28, 'Решение простейших уравнений $\sin x = a$, $\cos x = a$, $\tan x = a$, общие формулы корней с периодом $\pi k$ и $2\pi k$, отбор корней на отрезке.', 'Pamatvienādojumu $\sin x = a$, $\cos x = a$, $\tan x = a$ atrisināšana, sakņu formulas un atlase dotajā intervālā.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Равенство и подобие треугольников (повторение)', 'Trijstūru vienādība un līdzība (atkārtojums)', 'opt-trijsturu-vienadiba-lidziba', (select id from public.subjects where slug = 'geometry'), 11, 29, 'Признаки подобия треугольников, коэффициент подобия $k$, отношение периметров и площадей ($S_1/S_2 = k^2$).', 'Trijstūru līdzības pazīmes, līdzības koeficients $k$, perimetru un laukumu attiecība ($S_1/S_2 = k^2$).')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Геометрические преобразования плоскости', 'Ģeometriskie pārveidojumi: simetrija, pagrieziens, paralēlā pārnese', 'opt-geometriskie-parveidojumi', (select id from public.subjects where slug = 'geometry'), 11, 30, 'Движения плоскости: осевая и центральная симметрия, поворот вокруг точки, параллельный перенос.', 'Plaknes kustības: aksiālā un centrālā simetrija, pagrieziens ap punktu, paralēlā pārnese.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Площади многоугольников', 'Daudzstūru laukumi', 'opt-daudzsturu-laukumi', (select id from public.subjects where slug = 'geometry'), 11, 31, 'Формулы площадей параллелограмма, ромба ($S = \frac{1}{2}d_1 d_2$), трапеции, треугольника (формула Герона).', 'Paralelograma, romba ($S = \frac{1}{2}d_1 d_2$), trapeces un trijstūra laukumu formulas (Hērona formula).')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Окружность: центральные и вписанные углы, касательные', 'Riņķa līnija: leņķi, pieskares, ievilktie daudzstūri', 'opt-rinka-linija-lenki-pieskares', (select id from public.subjects where slug = 'geometry'), 11, 32, 'Свойства вписанного угла (половина центрального), угол, опирающийся на диаметр ($90^\circ$), свойства касательной и секущей.', 'Ievilktā un centra leņķa sakarība, leņķis pret diametru ($90^\circ$), pieskares un sekantes īpašības.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Вписанная и описанная окружность треугольника', 'Trijstūrī ievilktā un apvilktā riņķa līnija', 'opt-ievilkta-apvilkta-rinka-linija', (select id from public.subjects where slug = 'geometry'), 11, 33, 'Радиус вписанной окружности $r = S/p$, радиус описанной окружности $R = abc/(4S)$, правильные многоугольники.', 'Ievilktās riņķa līnijas rādiuss $r = S/p$, apvilktās riņķa līnijas rādiuss $R = abc/(4S)$, regulāri daudzstūri.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Векторы на плоскости и действия с ними', 'Vektori plaknē un darbības ar tiem', 'opt-vektori-plakne', (select id from public.subjects where slug = 'geometry'), 11, 34, 'Определение вектора, сложение векторов (правило треугольника и параллелограмма), умножение на число, коллинеарность.', 'Vektora definīcija, saskaitīšana (trijstūra un paralelograma likums), reizināšana ar skaitli, kolineāri vektori.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Координаты векторов и скалярное произведение', 'Vektoru koordinātas un skalārais reizinājums', 'opt-vektoru-skalarais-reizinajums', (select id from public.subjects where slug = 'geometry'), 11, 35, 'Длина вектора $|\vec{a}| = \sqrt{x^2 + y^2}$, формула $\vec{a} \cdot \vec{b} = x_1 x_2 + y_1 y_2$, косинус угла между векторами, перпендикулярность.', 'Vektora modulis, skalārais reizinājums $\vec{a} \cdot \vec{b} = x_1 x_2 + y_1 y_2$, leņķis starp vektoriem, perpendikularitātes nosacījums.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Уравнение прямой, параллельные и перпендикулярные прямые', 'Taisnes vienādojums, paralēlas un perpendikulāras taisnes', 'opt-taisnes-vienadojums', (select id from public.subjects where slug = 'geometry'), 11, 36, 'Общий вид $Ax + By + C = 0$, угловой вид $y = kx + b$, условие параллельности $k_1 = k_2$, условие перпендикулярности $k_1 k_2 = -1$.', 'Taisnes vispārīgais un virziena koeficienta vienādojums, paralelitātes ($k_1 = k_2$) un perpendikularitātes ($k_1 k_2 = -1$) nosacījumi.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Уравнение окружности', 'Riņķa līnijas vienādojums', 'opt-rinka-linijas-vienadojums', (select id from public.subjects where slug = 'geometry'), 11, 37, 'Каноническое уравнение $(x - x_0)^2 + (y - y_0)^2 = R^2$, нахождение центра и радиуса, взаимное расположение прямой и окружности.', 'Riņķa līnijas vienādojums $(x - x_0)^2 + (y - y_0)^2 = R^2$, centra un rādiusa noteikšana, taisnes un riņķa līnijas savstarpējais novietojums.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Прямые и плоскости в пространстве', 'Taisnes un plaknes telpā, to savstarpējais novietojums', 'opt-taisnes-plaknes-telpa', (select id from public.subjects where slug = 'geometry'), 11, 38, 'Аксиомы стереометрии, параллельность прямых и плоскостей, скрещивающиеся прямые, признак перпендикулярности прямой и плоскости.', 'Stereometrijas aksiomas, taišņu un plakņu savstarpējais novietojums, šķērsas taisnes, taisnes un plaknes perpendikularitāte.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Многогранники и их сечения плоскостью', 'Daudzskaldņi, to elementi un šķēlums ar plakni', 'opt-daudzskaldni-skelumi', (select id from public.subjects where slug = 'geometry'), 11, 39, 'Элементы многогранников (вершины, ребра, грани), построение следов секущей плоскости, диагональные сечения.', 'Daudzskaldņu elementi (virsotnes, šķautnes, skaldnes), šķēlumu plakņu veidošana, diagonālšķēlumi.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Призма: площадь поверхности и объем', 'Prizma: virsmas laukums un tilpums', 'opt-prizma-virsma-tilpums', (select id from public.subjects where slug = 'geometry'), 11, 40, 'Прямая и правильная призма, площадь боковой поверхности $S_{s\bar{a}nu} = P_{pam} \cdot H$, полная поверхность $S_{pilna}$, объем $V = S_{pam} \cdot H$.', 'Taisna un regulāra prizma, sānu virsmas, pilnas virsmas laukums un tilpums $V = S_{pam} \cdot H$.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Пирамида: правильная и произвольная', 'Piramīda: regulāra un neregulāra', 'opt-piramida-regulara', (select id from public.subjects where slug = 'geometry'), 11, 41, 'Вершина, апофема, боковое ребро, угол наклона боковой грани и ребра к основанию, объем $V = \frac{1}{3} S_{pam} \cdot H$.', 'Virsotne, apotēma, sānu šķautne, slīpuma leņķi, tilpums $V = \frac{1}{3} S_{pam} \cdot H$.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Цилиндр', 'Cilindrs', 'opt-cilindrs', (select id from public.subjects where slug = 'geometry'), 11, 42, 'Тело вращения прямоугольника, радиус основания $R$, высота $H$, развертка, боковая поверхность $2\pi RH$, объем $V = \pi R^2 H$.', 'Rotācijas ķermenis, pamata rādiuss $R$, augstums $H$, izklājums, virsmas laukums un tilpums $V = \pi R^2 H$.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Конус', 'Konuss', 'opt-konuss', (select id from public.subjects where slug = 'geometry'), 11, 43, 'Образующая $l$, радиус $R$, высота $H$, соотношение $l^2 = R^2 + H^2$, боковая поверхность $S = \pi R l$, объем $V = \frac{1}{3}\pi R^2 H$.', 'Veidule $l$, rādiuss $R$, augstums $H$, sānu virsma $S = \pi R l$, tilpums $V = \frac{1}{3}\pi R^2 H$.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Шар и сфера', 'Lode un sfēra', 'opt-lode-sfera', (select id from public.subjects where slug = 'geometry'), 11, 44, 'Площадь поверхности сферы $S = 4\pi R^2$, объем шара $V = \frac{4}{3}\pi R^3$, сечение шара плоскостью.', 'Sfēras virsmas laukums $S = 4\pi R^2$, lodes tilpums $V = \frac{4}{3}\pi R^3$, lodes šķēlums ar plakni.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Векторы в пространстве', 'Vektori telpā', 'opt-vektori-telpa', (select id from public.subjects where slug = 'geometry'), 11, 45, 'Трехмерная декартова система координат $(x; y; z)$, координаты вектора, длина вектора $|\vec{v}| = \sqrt{x^2+y^2+z^2}$, скалярное произведение.', 'Trīsdimensiju koordinātu sistēma $(x; y; z)$, vektora modulis, skalārais reizinājums telpā.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Множества и операции над множествами', 'Kopas un darbības ar kopām', 'opt-kopas-darbibas', (select id from public.subjects where slug = 'statistics'), 11, 46, 'Элементы множества, объединение $A \cup B$, пересечение $A \cap B$, разность $A \setminus B$, диаграммы Эйлера–Венна.', 'Kopu elementi, apvienojums $A \cup B$, šķēlums $A \cap B$, starpība $A \setminus B$, Venna diagrammas.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Основные принципы комбинаторики', 'Kombinatorikas pamatprincipi', 'opt-kombinatorikas-pamatprincipi', (select id from public.subjects where slug = 'statistics'), 11, 47, 'Правило суммы и правило произведения, дерево вариантов, подсчет числа исходов в практических ситуациях.', 'Saskaitīšanas un reizināšanas likums, koka diagramma, iespēju skaita noteikšana.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Перестановки, сочетания и размещения', 'Permutācijas, kombinācijas un variācijas', 'opt-permutacijas-kombinacijas', (select id from public.subjects where slug = 'statistics'), 11, 48, 'Формулы факториала $n!$, размещений $A_n^k$, сочетаний $C_n^k = \frac{n!}{k!(n-k)!}$, выбор формулы в зависимости от важности порядка.', 'Faktoriāls $n!$, permutācijas $P_n$, variācijas $A_n^k$, kombinācijas $C_n^k$, formulas izvēle pēc sakārtojuma nozīmīguma.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Классическое определение вероятности', 'Klasiskā varbūtība un pilna pārlase', 'opt-klasiska-varbutiba', (select id from public.subjects where slug = 'statistics'), 11, 49, 'Формула $P(A) = m/n$, равновозможные элементарные исходы, свойства вероятности $0 \le P(A) \le 1$, противоположное событие.', 'Klasiskā varbūtības definīcija $P(A) = m/n$, vienādi iespējami iznākumi, pretējā notikuma varbūtība $P(\bar{A}) = 1 - P(A)$.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Сложение вероятностей и условная вероятность', 'Summas varbūtība un nosacītā varbūtība', 'opt-summas-un-nosacita-varbutiba', (select id from public.subjects where slug = 'statistics'), 11, 50, 'Несовместные и совместные события $P(A \cup B)$, независимые события $P(A \cap B) = P(A) \cdot P(B)$, условная вероятность $P(A|B)$.', 'Nesavienojami un savienojami notikumi, neatkarīgi notikumi, nosacītā varbūtība $P(A|B)$.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Генеральная совокупность, выборка и средние величины', 'Populācija, izlase un vidējie lielumi', 'opt-populacija-izlase-videjie', (select id from public.subjects where slug = 'statistics'), 11, 51, 'Статистическая выборка, репрезентативность, среднее арифметическое $\bar{x}$, медиана $Me$, мода $Mo$.', 'Statistiskā izlase, reprezentativitāte, aritmētiskais vidējais $\bar{x}$, mediāna $Me$, moda $Mo$.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Меры рассеяния и графическое представление данных', 'Izkliedes mēri un datu grafiska attēlošana', 'opt-izkliedes-meri-grafika', (select id from public.subjects where slug = 'statistics'), 11, 52, 'Размах вариации $R = x_{\max} - x_{\min}$, дисперсия $s^2$, стандартное отклонение $s$, гистограммы, коробчатые диаграммы (box-plot).', 'Izkliedes amplitūda $R$, dispersija $s^2$, standartnovirze $s$, histogrammas, lodziņu diagrammas (box plot).')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

-- 3. Вставка типовых задач и привязка кросс-тегов
do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'opt-realie-skaitli-izteiksmes';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Упрощение выражения по формулам сокращённого умножения', 'Izteiksmes vienkāršošana, lietojot saīsinātās reizināšanas formulas', 'Упростите алгебраическое выражение: $(2x - 3)^2 - (2x + 1)(2x - 1)$.', 'Vienkāršojiet algebrisko izteiksmi: $(2x - 3)^2 - (2x + 1)(2x - 1)$.', '1) Раскрываем квадрат разности: $(2x - 3)^2 = 4x^2 - 12x + 9$.
2) Раскрываем разность квадратов: $(2x + 1)(2x - 1) = 4x^2 - 1$.
3) Вычитаем: $(4x^2 - 12x + 9) - (4x^2 - 1) = 4x^2 - 12x + 9 - 4x^2 + 1 = -12x + 10$.', '1) Atver kvadrātu starpībai: $(2x - 3)^2 = 4x^2 - 12x + 9$.
2) Izmanto kvadrātu starpības formulu: $(2x + 1)(2x - 1) = 4x^2 - 1$.
3) Atņem: $(4x^2 - 12x + 9) - (4x^2 - 1) = -12x + 10$.', '-12x + 10', 'Лёгкий', 1, true)
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
  select id into v_topic_id from public.topics where slug = 'opt-lineari-kvadratvienadojumi';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Решение системы уравнений (прямая и парабола)', 'Vienādojumu sistēmas atrisināšana (taisna un parabola)', 'Найдите все пары решений системы уравнений: $\begin{cases} y = x^2 - 4x + 3 \\ y = x - 1 \end{cases}$. В ответе укажите точки пересечения $(x; y)$.', 'Atrisiniet vienādojumu sistēmu: $\begin{cases} y = x^2 - 4x + 3 \\ y = x - 1 \end{cases}$. Atbildē norādiet krustpunktu koordinātas $(x; y)$.', '1) Приравниваем правые части: $x^2 - 4x + 3 = x - 1$.
2) Переносим слагаемые: $x^2 - 5x + 4 = 0$.
3) По теореме Виета корни: $x_1 = 1$, $x_2 = 4$.
4) Находим $y$: если $x_1 = 1$, то $y_1 = 1 - 1 = 0$; если $x_2 = 4$, то $y_2 = 4 - 1 = 3$.
Ответ: $(1; 0)$ и $(4; 3)$.', '1) Pielīdzina labās puses: $x^2 - 4x + 3 = x - 1$.
2) Pārnes visus locekļus: $x^2 - 5x + 4 = 0$.
3) Pēc Vjeta teorēmas saknes ir $x_1 = 1$ un $x_2 = 4$.
4) Aprēķina atbilstošās $y$ vērtības: $y_1 = 1 - 1 = 0$; $y_2 = 4 - 1 = 3$.
Atbilde: $(1; 0)$ un $(4; 3)$.', '(1; 0), (4; 3)', 'Средний', 2, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'vienadojumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
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
  select id into v_topic_id from public.topics where slug = 'opt-nevienadibas-intervalu-metode';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Квадратное неравенство методом интервалов', 'Kvadrātnevienādības risināšana ar intervālu metodi', 'Решите неравенство методом интервалов: $x^2 - 3x - 10 \le 0$. Запишите ответ в виде числового промежутка.', 'Atrisiniet nevienādību ar intervālu metodi: $x^2 - 3x - 10 \le 0$. Pierakstiet atbildi intervāla formā.', '1) Находим нули квадратного трехчлена: $x^2 - 3x - 10 = 0 \implies (x - 5)(x + 2) = 0 \implies x_1 = -2, x_2 = 5$.
2) Наносим точки на числовую прямую (точки закрашенные, так как знак $\le$).
3) Ветви параболы направлены вверх ($a = 1 > 0$), поэтому выражение отрицательно между корнями: $x \in [-2; 5]$.', '1) Atrod kvadrāttrīskalņa nulles: $(x - 5)(x + 2) = 0 \implies x_1 = -2, x_2 = 5$.
2) Atliek punktus uz skaitļu taisnes (ieskaitot robežpunktus, jo zīme $\le$).
3) Parabola vērsta ar zariem uz augšu, vērtības ir nepozitīvas intervālā starp saknēm: $x \in [-2; 5]$.', '[-2; 5]', 'Средний', 3, true)
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
  select id into v_topic_id from public.topics where slug = 'opt-algebriskas-dalas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Сокращение и вычитание алгебраических дробей', 'Algebrisko daļu atņemšana un saīsināšana', 'Выполните вычитание и сократите результат: $\frac{x^2 + 2x}{x^2 - 4} - \frac{1}{x - 2}$.', 'Veiciet atņemšanu un saīsiniet rezultātu: $\frac{x^2 + 2x}{x^2 - 4} - \frac{1}{x - 2}$.', '1) Разложим знаменатель первой дроби: $x^2 - 4 = (x - 2)(x + 2)$, а числитель: $x(x + 2)$.
2) При $x \ne -2$ первая дробь равна $\frac{x(x + 2)}{(x - 2)(x + 2)} = \frac{x}{x - 2}$.
3) Вычитаем: $\frac{x}{x - 2} - \frac{1}{x - 2} = \frac{x - 1}{x - 2}$.', '1) Sadala saucēju reizinātājos: $x^2 - 4 = (x - 2)(x + 2)$, skaitītāju: $x(x + 2)$.
2) Saīsina pirmo daļu ar $(x + 2)$: $\frac{x}{x - 2}$.
3) Veic atņemšanu ar kopsaucēju $(x - 2)$: $\frac{x - 1}{x - 2}$.', '(x-1)/(x-2)', 'Средний', 4, true)
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
  select id into v_topic_id from public.topics where slug = 'opt-dalveida-racionali-vienadojumi';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Дробно-рациональное уравнение с проверкой ОДЗ', 'Daļveida racionāls vienādojums ar definīcijas kopas pārbaudi', 'Решите уравнение: $\frac{x^2 - 4x}{x - 3} = \frac{x - 6}{x - 3}$.', 'Atrisiniet vienādojumu: $\frac{x^2 - 4x}{x - 3} = \frac{x - 6}{x - 3}$.', '1) Область допустимых значений: $x - 3 \ne 0 \implies x \ne 3$.
2) Умножаем обе части на $(x - 3)$: $x^2 - 4x = x - 6$.
3) Переносим: $x^2 - 5x + 6 = 0 \implies (x - 2)(x - 3) = 0$.
4) Корни: $x_1 = 2$, $x_2 = 3$. Корень $x = 3$ посторонний по ОДЗ.
Ответ: $x = 2$.', '1) Definīcijas kopa: $x - 3 \ne 0 \implies x \ne 3$.
2) Reizina abas puses ar $(x - 3)$: $x^2 - 4x = x - 6$.
3) Pārnes locekļus: $x^2 - 5x + 6 = 0 \implies (x - 2)(x - 3) = 0$.
4) Saknes ir $x_1 = 2$ un $x_2 = 3$. Tā kā $x = 3$ neietilpst definīcijas kopā, derīgā sakne ir tikai $x = 2$.', '2', 'Средний', 5, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'vienadojumi';
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
  select id into v_topic_id from public.topics where slug = 'opt-n-tas-pakapes-sakne';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Вычисление числового значения степени с дробным показателем', 'Pakāpes ar racionālu kāpinātāju aprēķināšana', 'Вычислите значение числового выражения: $27^{2/3} + 16^{-3/4} \cdot 8$.', 'Aprēķiniet skaitliskās izteiksmes vērtību: $27^{2/3} + 16^{-3/4} \cdot 8$.', '1) $27^{2/3} = (3^3)^{2/3} = 3^2 = 9$.
2) $16^{-3/4} = (2^4)^{-3/4} = 2^{-3} = \frac{1}{8}$.
3) $\frac{1}{8} \cdot 8 = 1$.
4) Итого: $9 + 1 = 10$.', '1) $27^{2/3} = (3^3)^{2/3} = 3^2 = 9$.
2) $16^{-3/4} = (2^4)^{-3/4} = 2^{-3} = \frac{1}{8}$.
3) $\frac{1}{8} \cdot 8 = 1$.
4) Aprēķina summu: $9 + 1 = 10$.', '10', 'Средний', 6, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'pakapes-saknes';
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
  select id into v_topic_id from public.topics where slug = 'opt-virknes-progresijas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Сумма членов арифметической прогрессии', 'Aritmētiskās progresijas locekļu summa', 'В арифметической прогрессии первый член $a_1 = 7$, а разность $d = 4$. Найдите сумму первых $15$ членов этой прогрессии ($S_{15}$).', 'Aritmētiskajā progresijā pirmais loceklis $a_1 = 7$ un diference $d = 4$. Aprēķiniet pirmo $15$ locekļu summu ($S_{15}$).', '1) Используем формулу суммы: $S_n = \frac{2a_1 + (n - 1)d}{2} \cdot n$.
2) Подставляем: $S_{15} = \frac{2 \cdot 7 + (15 - 1) \cdot 4}{2} \cdot 15 = \frac{14 + 56}{2} \cdot 15 = \frac{70}{2} \cdot 15 = 35 \cdot 15 = 525$.', '1) Izmanto summas formulu: $S_n = \frac{2a_1 + (n - 1)d}{2} \cdot n$.
2) Ievieto dotos lielumus: $S_{15} = \frac{14 + 14 \cdot 4}{2} \cdot 15 = \frac{70}{2} \cdot 15 = 35 \cdot 15 = 525$.', '525', 'Средний', 7, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'virknes';
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
  select id into v_topic_id from public.topics where slug = 'opt-eksponentvienadojumi-nevienadibas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Показательное уравнение с вынесением степени за скобки', 'Eksponentvienādojums ar kopīgā reizinātāja iznešanu', 'Решите уравнение: $3^{x+2} - 3^x = 72$.', 'Atrisiniet vienādojumu: $3^{x+2} - 3^x = 72$.', '1) Распишем первое слагаемое: $3^{x+2} = 3^x \cdot 3^2 = 9 \cdot 3^x$.
2) Выносим $3^x$ за скобки: $3^x (9 - 1) = 72 \implies 8 \cdot 3^x = 72$.
3) Делим на $8$: $3^x = 9 \implies 3^x = 3^2 \implies x = 2$.', '1) Pārveido: $3^{x+2} = 3^x \cdot 3^2 = 9 \cdot 3^x$.
2) Iznes kopīgo reizinātāju pirms iekavām: $3^x (9 - 1) = 72 \implies 8 \cdot 3^x = 72$.
3) Izdala ar $8$: $3^x = 9 \implies 3^x = 3^2 \implies x = 2$.', '2', 'Средний', 8, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'vienadojumi';
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
  select id into v_topic_id from public.topics where slug = 'opt-logaritmi-vienadojumi';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Решение логарифмического уравнения со сложением', 'Logaritmiskā vienādojuma risināšana ar saskaitīšanu', 'Решите уравнение: $\log_2(x) + \log_2(x - 2) = 3$.', 'Atrisiniet vienādojumu: $\log_2(x) + \log_2(x - 2) = 3$.', '1) ОДЗ: $x > 0$ и $x - 2 > 0 \implies x > 2$.
2) Применяем формулу суммы логарифмов: $\log_2(x(x - 2)) = 3$.
3) По определению логарифма: $x(x - 2) = 2^3 = 8$.
4) Решаем квадратное уравнение: $x^2 - 2x - 8 = 0 \implies (x - 4)(x + 2) = 0$.
5) Корни: $x_1 = 4$, $x_2 = -2$. С учётом ОДЗ ($x > 2$) подходит только $x = 4$.', '1) Definīcijas kopa: $x > 0$ un $x - 2 > 0 \implies x > 2$.
2) Izmanto logaritmu summas formulu: $\log_2(x(x - 2)) = 3$.
3) Pēc logaritma definīcijas: $x(x - 2) = 2^3 = 8$.
4) Atrisina kvadrātvienādojumu: $x^2 - 2x - 8 = 0 \implies (x - 4)(x + 2) = 0$.
5) Saknes ir $x_1 = 4$ un $x_2 = -2$. Der tikai $x = 4$, jo $x > 2$.', '4', 'Средний', 9, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'logaritmi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'vienadojumi';
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
  select id into v_topic_id from public.topics where slug = 'opt-modula-vienadojumi-nevienadibas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Решение уравнения с модулем', 'Moduļa vienādojuma risināšana', 'Решите уравнение: $|2x - 5| = 9$. В ответе укажите все корни.', 'Atrisiniet vienādojumu: $|2x - 5| = 9$. Norādiet visas saknes.', '1) По определению модуля распадается на два случая:
- $2x - 5 = 9 \implies 2x = 14 \implies x = 7$;
- $2x - 5 = -9 \implies 2x = -4 \implies x = -2$.
Ответ: $x_1 = -2$, $x_2 = 7$.', '1) Pēc moduļa definīcijas iegūst divus gadījumus:
- $2x - 5 = 9 \implies 2x = 14 \implies x = 7$;
- $2x - 5 = -9 \implies 2x = -4 \implies x = -2$.
Atbilde: $x = -2$ un $x = 7$.', '-2; 7', 'Лёгкий', 10, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'vienadojumi';
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
  select id into v_topic_id from public.topics where slug = 'opt-funkcijas-jedziens-kopas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Нахождение области определения дробно-иррациональной функции', 'Funkcijas definīcijas kopas noteikšana', 'Найдите область определения функции $f(x) = \frac{\sqrt{2x + 6}}{x - 1}$. Запишите ответ в виде объединения числовых промежутков.', 'Nosakiet funkcijas $f(x) = \frac{\sqrt{2x + 6}}{x - 1}$ definīcijas kopu. Pierakstiet atbildi intervālu formā.', '1) Подкоренное выражение должно быть неотрицательным: $2x + 6 \ge 0 \implies x \ge -3$.
2) Знаменатель не равен нулю: $x - 1 \ne 0 \implies x \ne 1$.
3) Пересекаем условия: $x \in [-3; 1) \cup (1; +\infty)$.', '1) Zemsaknes izteiksme ir nenegatīva: $2x + 6 \ge 0 \implies x \ge -3$.
2) Saucējs nedrīkst būt vienāds ar nulli: $x - 1 \ne 0 \implies x \ne 1$.
3) Apvieno abus nosacījumus: $D(f) = [-3; 1) \cup (1; +\infty)$.', '[-3; 1) U (1; +inf)', 'Средний', 11, true)
    returning id into v_task_id;

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
  select id into v_topic_id from public.topics where slug = 'opt-lineara-funkcija-grafiks';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Составление уравнения прямой по двум точкам', 'Taisnes vienādojuma sastādīšana caur diviem punktiem', 'Прямая проходит через точки $A(2; 1)$ и $B(6; 9)$. Запишите её уравнение в виде $y = kx + b$.', 'Taisne iet caur punktiem $A(2; 1)$ un $B(6; 9)$. Uzrakstiet tās vienādojumu formā $y = kx + b$.', '1) Угловой коэффициент: $k = \frac{y_2 - y_1}{x_2 - x_1} = \frac{9 - 1}{6 - 2} = \frac{8}{4} = 2$.
2) Находим $b$, подставив точку $A(2; 1)$: $1 = 2 \cdot 2 + b \implies 1 = 4 + b \implies b = -3$.
Ответ: $y = 2x - 3$.', '1) Aprēķina virziena koeficientu: $k = \frac{9 - 1}{6 - 2} = \frac{8}{4} = 2$.
2) Aprēķina $b$, ievietojot punkta $A(2; 1)$ koordinātas: $1 = 2 \cdot 2 + b \implies b = -3$.
Atbilde: $y = 2x - 3$.', 'y = 2x - 3', 'Лёгкий', 12, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'grafiki';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'koordinatu-metode';
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
  select id into v_topic_id from public.topics where slug = 'opt-kvadratfunkcija-virsotne';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Координаты вершины параболы и область значений', 'Parabolas virsotnes koordinātas un vērtību apgabals', 'Дана квадратичная функция $y = -2x^2 + 8x - 3$. Найдите координаты вершины параболы $(x_0; y_0)$ и укажите её наибольшее значение.', 'Dota kvadrātfunkcija $y = -2x^2 + 8x - 3$. Nosakiet parabolas virsotnes koordinātas $(x_0; y_0)$ un tās lielāko vērtību.', '1) Абсцисса вершины: $x_0 = -\frac{b}{2a} = -\frac{8}{2 \cdot (-2)} = \frac{-8}{-4} = 2$.
2) Ордината вершины: $y_0 = -2(2)^2 + 8(2) - 3 = -8 + 16 - 3 = 5$.
3) Ветви параболы направлены вниз ($a = -2 < 0$), поэтому вершина является точкой максимума: $y_{\max} = 5$.
Ответ: вершина $(2; 5)$, наибольшее значение $5$.', '1) Virsotnes abscisa: $x_0 = -\frac{8}{2 \cdot (-2)} = 2$.
2) Virsotnes ordināta: $y_0 = -2 \cdot 2^2 + 8 \cdot 2 - 3 = 5$.
3) Tā kā $a < 0$, zari vērsti uz leju un virsotnē ir funkcijas lielākā vērtība: $y_{\max} = 5$.
Atbilde: virsotne $(2; 5)$, lielākā vērtība $5$.', '(2; 5), max = 5', 'Средний', 13, true)
    returning id into v_task_id;

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
  select id into v_topic_id from public.topics where slug = 'opt-funkciju-ipasibas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Исследование функции по графическим свойствам', 'Funkcijas īpašību noteikšana pēc analītiskas formulas', 'Найдите промежуток возрастания функции $f(x) = 3 - (x + 4)^2$.', 'Nosakiet funkcijas $f(x) = 3 - (x + 4)^2$ augšanas intervālu.', '1) Графиком функции является парабола с вершиной в точке $(-4; 3)$.
2) Ветви параболы направлены вниз из-за знака минус перед квадратом.
3) Парабола с ветвями вниз возрастает слева от вершины: $x \in (-\infty; -4]$.', '1) Funkcijas grafiks ir parabola ar virsotni punktā $(-4; 3)$.
2) Zari ir vērsti uz leju (koeficients pie kvadrāta ir negatīvs).
3) Funkcija aug pa kreisi no virsotnes: $x \in (-\infty; -4]$.', '(-inf; -4]', 'Средний', 14, true)
    returning id into v_task_id;

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
  select id into v_topic_id from public.topics where slug = 'opt-dalveida-funkcija';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Асимптоты дробно-линейной функции', 'Daļveida funkcijas asimptotu noteikšana', 'Найдите уравнения вертикальной и горизонтальной асимптот графика функции $y = \frac{6}{x - 3} + 2$.', 'Nosakiet funkcijas $y = \frac{6}{x - 3} + 2$ vertikālās un horizontālās asimptotas vienādojumus.', '1) Вертикальная асимптота соответствует точке, где знаменатель обращается в ноль: $x - 3 = 0 \implies x = 3$.
2) При стремлении $x \to \pm\infty$ дробь $\frac{6}{x - 3} \to 0$, поэтому горизонтальная асимптота: $y = 2$.', '1) Vertikālā asimptota ir taisne, kurā saucējs kļūst $0$: $x - 3 = 0 \implies x = 3$.
2) Kad $x \to \pm\infty$, daļas vērtība tiecas uz $0$, tādēļ horizontālā asimptota ir $y = 2$.', 'x = 3, y = 2', 'Средний', 15, true)
    returning id into v_task_id;

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
  select id into v_topic_id from public.topics where slug = 'opt-pakapes-funkcija';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Сравнение значений степенной функции', 'Pakāpes funkcijas vērtību salīdzināšana', 'Определите, какое из чисел больше: $f(8)$ или $f(27)$ для функции $f(x) = \sqrt[3]{x}$. Вычислите их точные значения.', 'Salīdziniet funkcijas $f(x) = \sqrt[3]{x}$ vērtības $f(8)$ un $f(27)$. Aprēķiniet to precīzās vērtības.', '1) $f(8) = \sqrt[3]{8} = 2$.
2) $f(27) = \sqrt[3]{27} = 3$.
3) Функция кубического корня строго возрастает на всей области определения, поэтому $f(8) < f(27)$.', '1) $f(8) = \sqrt[3]{8} = 2$.
2) $f(27) = \sqrt[3]{27} = 3$.
3) Kuba saknes funkcija ir stingri augoša visā definīcijas apgabalā, tātad $f(8) < f(27)$.', 'f(8) = 2 < f(27) = 3', 'Лёгкий', 16, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'pakapes-saknes';
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
  select id into v_topic_id from public.topics where slug = 'opt-eksponentfunkcija-procesi';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Моделирование бактериального роста показательной функцией', 'Baktēriju vairošanās modelēšana ar eksponentfunkciju', 'Количество бактерий в колонии удваивается каждые $3$ часа. В начальный момент было $500$ бактерий. Сколько бактерий будет в колонии через $12$ часов?', 'Baktēriju skaits kolonijā dubultojas ik pēc $3$ stundām. Sākotnēji bija $500$ baktērijas. Cik baktēriju būs pēc $12$ stundām?', '1) Число циклов удвоения за $12$ часов: $n = \frac{12}{3} = 4$.
2) Закон роста: $N(t) = N_0 \cdot 2^n = 500 \cdot 2^4 = 500 \cdot 16 = 8000$ бактерий.', '1) Dubultošanās ciklu skaits $12$ stundās: $n = \frac{12}{3} = 4$.
2) Baktēriju skaits: $N = 500 \cdot 2^4 = 500 \cdot 16 = 8000$.', '8000', 'Средний', 17, true)
    returning id into v_task_id;

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
  select id into v_topic_id from public.topics where slug = 'opt-logaritmiska-funkcija';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Свойства монотонности логарифмической функции', 'Logaritmiskās funkcijas monotonitāte', 'При каких значениях аргумента функция $f(x) = \log_{0{,}5}(x - 4)$ принимает положительные значения ($f(x) > 0$)?', 'Kādām argumenta vērtībām funkcija $f(x) = \log_{0{,}5}(x - 4)$ pieņem pozitīvas vērtības ($f(x) > 0$)?', '1) ОДЗ логарифма: $x - 4 > 0 \implies x > 4$.
2) Решаем неравенство: $\log_{0{,}5}(x - 4) > \log_{0{,}5}(1)$.
3) Так как основание $0 < 0{,}5 < 1$, знак неравенства меняется на противоположный: $x - 4 < 1 \implies x < 5$.
4) С учётом ОДЗ: $x \in (4; 5)$.', '1) Definīcijas kopa: $x - 4 > 0 \implies x > 4$.
2) Nevienādība: $\log_{0{,}5}(x - 4) > \log_{0{,}5}(1)$.
3) Tā kā bāze ir mazāka par 1 ($0 < 0{,}5 < 1$), maina nevienādības zīmi: $x - 4 < 1 \implies x < 5$.
4) Apvienojot ar definīcijas kopu: $x \in (4; 5)$.', '(4; 5)', 'Средний', 18, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'logaritmi';
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
  select id into v_topic_id from public.topics where slug = 'opt-grafiku-transformacijas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Параллельный перенос графика функции', 'Funkcijas grafika paralēlā pārnese', 'График функции $y = x^2$ сместили на $3$ единицы вправо и на $5$ единиц вниз. Запишите формулу полученной функции.', 'Funkcijas $y = x^2$ grafiks tika pārbīdīts par $3$ vienībām pa labi un par $5$ vienībām uz leju. Uzrakstiet iegūtās funkcijas vienādojumu.', '1) Смещение вправо на $3$ соответствует замене $x$ на $(x - 3)$.
2) Смещение вниз на $5$ соответствует вычитанию $5$ из всего выражения.
Итоговая формула: $y = (x - 3)^2 - 5$ (или $y = x^2 - 6x + 4$).', '1) Pārbīde pa labi par 3 vienībām nozīmē $x$ aizstāšanu ar $(x - 3)$.
2) Pārbīde uz leju par 5 vienībām nozīmē $5$ atņemšanu no funkcijas vērtības.
Iegūst: $y = (x - 3)^2 - 5$.', 'y = (x - 3)^2 - 5', 'Лёгкий', 19, true)
    returning id into v_task_id;

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
  select id into v_topic_id from public.topics where slug = 'opt-matematiska-modelesana-funkcijas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Оптимизация площади прямоугольного участка', 'Taisnstūra laukuma maksimizēšana ar doto perimetru', 'Фермер хочет огородить забором прямоугольный участок земли, примыкающий к прямой стене сарая (сторона у стены забором не огораживается). Длина имеющегося забора равна $40\text{ м}$. Какую максимальную площадь может иметь такой участок?', 'Saimnieks vēlas ar žogu nožogot taisnstūrveida laukumu pie taisnas šķūņa sienas (pie sienas žogs nav vajadzīgs). Žoga kopējais garums ir $40\text{ m}$. Kāds ir maksimālais iespējamais laukuma lielums?', '1) Пусть ширина участка равна $x$ метров. Так как сторон ширины две, длина участка равна $40 - 2x$.
2) Площадь выражается функцией: $S(x) = x(40 - 2x) = -2x^2 + 40x$.
3) Это квадратичная функция с ветвями вниз. Максимум достигается в вершине: $x_0 = -\frac{40}{2 \cdot (-2)} = 10\text{ м}$.
4) Максимальная площадь: $S(10) = 10 \cdot (40 - 20) = 10 \cdot 20 = 200\text{ м}^2$.', '1) Apzīmē taisnstūra platumu ar $x$. Tad garums ir $40 - 2x$.
2) Laukuma funkcija ir $S(x) = x(40 - 2x) = -2x^2 + 40x$.
3) Parabola ir ar zariem uz leju, maksimums ir virsotnē: $x_0 = -\frac{40}{2 \cdot (-2)} = 10\text{ m}$.
4) Maksimālais laukums: $S(10) = 10 \cdot 20 = 200\text{ m}^2$.', '200', 'Средний', 20, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'modelesana';
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
  select id into v_topic_id from public.topics where slug = 'opt-trig-taisnlenka-trijsturi';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Нахождение катета и гипотенузы через синус угла', 'Katetes un hipotenūzas aprēķināšana ar sinusa palīdzību', 'В прямоугольном треугольнике гипотенуза равна $12\text{ см}$, а один из острых углов равен $30^\circ$. Найдите противолежащий катет и прилежащий катет.', 'Taisnleņķa trijstūrī hipotenūza ir $12\text{ cm}$ un viens šaurais leņķis ir $30^\circ$. Aprēķiniet pretkatetes un piekatetes garumu.', '1) Противолежащий катет равен половине гипотенузы: $a = c \cdot \sin 30^\circ = 12 \cdot \frac{1}{2} = 6\text{ см}$.
2) Прилежащий катет: $b = c \cdot \cos 30^\circ = 12 \cdot \frac{\sqrt{3}}{2} = 6\sqrt{3}\text{ см}$.', '1) Pretkatete: $a = 12 \cdot \sin 30^\circ = 12 \cdot 0{,}5 = 6\text{ cm}$.
2) Piekatete: $b = 12 \cdot \cos 30^\circ = 12 \cdot \frac{\sqrt{3}}{2} = 6\sqrt{3}\text{ cm}$.', '6; 6sqrt(3)', 'Лёгкий', 21, true)
    returning id into v_task_id;

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
  select id into v_topic_id from public.topics where slug = 'opt-pagrieziena-lenkis-radiani';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Перевод градусов в радианы', 'Leņķa pārvēršana no grādiem uz radiāniem', 'Выразите угол $150^\circ$ в радианной мере. Ответ запишите в виде несократимой дроби с $\pi$.', 'Izsakiet leņķi $150^\circ$ radiānos. Atbildi pierakstiet kā nesaīsināmu daļu ar $\pi$.', 'Формула перевода: $\alpha = \frac{\pi}{180^\circ} \cdot 150^\circ = \frac{150\pi}{180} = \frac{5\pi}{6}$.', 'Pārejas formula: $\alpha = \frac{150^\circ}{180^\circ} \cdot \pi = \frac{5\pi}{6}$.', '(5pi)/6', 'Лёгкий', 22, true)
    returning id into v_task_id;

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
  select id into v_topic_id from public.topics where slug = 'opt-sinusa-kosinusa-funkcijas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Область значений и период гармонической функции', 'Trigonometriskās funkcijas vērtību apgabals un periods', 'Найдите область значений и наименьший положительный период функции $y = 3\cos(2x) - 1$.', 'Nosakiet funkcijas $y = 3\cos(2x) - 1$ vērtību apgabalu un mazāko pozitīvo periodu.', '1) Так как $-1 \le \cos(2x) \le 1$, умножаем на $3$: $-3 \le 3\cos(2x) \le 3$.
2) Вычитаем $1$: $-4 \le y \le 2$. Значит, $E(y) = [-4; 2]$.
3) Период косинуса равен $\frac{2\pi}{\omega} = \frac{2\pi}{2} = \pi$.', '1) Tā kā $-1 \le \cos(2x) \le 1$, reizinot ar 3: $-3 \le 3\cos(2x) \le 3$.
2) Atņem 1: $-4 \le y \le 2$. Tātad $E(y) = [-4; 2]$.
3) Periods ir $T = \frac{2\pi}{2} = \pi$.', 'E(y) = [-4; 2], T = pi', 'Средний', 23, true)
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
  select id into v_topic_id from public.topics where slug = 'opt-trig-pamatidentitate';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Нахождение синуса по косинусу во второй четверти', 'Sinusa aprēķināšana pēc dota kosinusa otrajā ceturksnī', 'Известно, что $\cos \alpha = -0{,}6$ и угол $\alpha$ лежит во второй четверти ($\frac{\pi}{2} < \alpha < \pi$). Найдите $\sin \alpha$ и $\tan \alpha$.', 'Zināms, ka $\cos \alpha = -0{,}6$ un leņķis atrodas otrajā ceturksnī ($\frac{\pi}{2} < \alpha < \pi$). Aprēķiniet $\sin \alpha$ un $\tan \alpha$.', '1) По основному тождеству: $\sin^2 \alpha = 1 - \cos^2 \alpha = 1 - (-0{,}6)^2 = 1 - 0{,}36 = 0{,}64$.
2) Во второй четверти синус положителен: $\sin \alpha = +\sqrt{0{,}64} = 0{,}8$.
3) Тангенс: $\tan \alpha = \frac{\sin \alpha}{\cos \alpha} = \frac{0{,}8}{-0{,}6} = -\frac{4}{3}$.', '1) Pēc trigonometriskās pamatidentitātes: $\sin^2 \alpha = 1 - (-0{,}6)^2 = 0{,}64$.
2) Otrajā ceturksnī sinuss ir pozitīvs: $\sin \alpha = 0{,}8$.
3) Tangenss: $\tan \alpha = \frac{0{,}8}{-0{,}6} = -\frac{4}{3}$.', 'sin = 0.8, tan = -4/3', 'Средний', 24, true)
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
  select id into v_topic_id from public.topics where slug = 'opt-sinusu-kosinusu-teorema';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Нахождение третьей стороны треугольника по теореме косинусов', 'Trijstūra malas aprēķināšana ar kosinusu teorēmu', 'В треугольнике две стороны равны $5\text{ см}$ и $8\text{ см}$, а угол между ними равен $60^\circ$. Найдите длину третьей стороны треугольника.', 'Trijstūrī divas malas ir $5\text{ cm}$ un $8\text{ cm}$, un leņķis starp tām ir $60^\circ$. Aprēķiniet trešās malas garumu.', '1) Применяем теорему косинусов: $c^2 = a^2 + b^2 - 2ab\cos 60^\circ$.
2) Подставляем значения: $c^2 = 5^2 + 8^2 - 2 \cdot 5 \cdot 8 \cdot \frac{1}{2} = 25 + 64 - 40 = 49$.
3) $c = \sqrt{49} = 7\text{ см}$.', '1) Lieto kosinusu teorēmu: $c^2 = a^2 + b^2 - 2ab\cos 60^\circ$.
2) Ievieto datus: $c^2 = 25 + 64 - 2 \cdot 5 \cdot 8 \cdot 0{,}5 = 89 - 40 = 49$.
3) $c = \sqrt{49} = 7\text{ cm}$.', '7', 'Средний', 25, true)
    returning id into v_task_id;

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
  select id into v_topic_id from public.topics where slug = 'opt-argumentu-summas-formulas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Применение формулы синуса двойного угла', 'Divkāršā leņķa sinusa formulas lietošana', 'Вычислите значение выражения: $4\sin 15^\circ \cos 15^\circ$.', 'Aprēķiniet izteiksmes vērtību: $4\sin 15^\circ \cos 15^\circ$.', '1) Группируем множители: $4\sin 15^\circ \cos 15^\circ = 2 \cdot (2\sin 15^\circ \cos 15^\circ)$.
2) По формуле синуса двойного угла: $2\sin 15^\circ \cos 15^\circ = \sin(30^\circ) = \frac{1}{2}$.
3) Итого: $2 \cdot \frac{1}{2} = 1$.', '1) Pārveido: $4\sin 15^\circ \cos 15^\circ = 2 \cdot (2\sin 15^\circ \cos 15^\circ)$.
2) Lieto divkāršā leņķa formulu: $2\sin 15^\circ \cos 15^\circ = \sin 30^\circ = \frac{1}{2}$.
3) Rezultāts: $2 \cdot \frac{1}{2} = 1$.', '1', 'Лёгкий', 26, true)
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
  select id into v_topic_id from public.topics where slug = 'opt-trig-izteiksmju-parveidosana';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Упрощение тригонометрического выражения', 'Trigonometriskās izteiksmes vienkāršošana', 'Упростите выражение: $\frac{\cos^2 x - 1}{\sin x \cos x}$.', 'Vienkāršojiet izteiksmi: $\frac{\cos^2 x - 1}{\sin x \cos x}$.', '1) Из основного тождества: $\cos^2 x - 1 = -\sin^2 x$.
2) Подставляем в дробь: $\frac{-\sin^2 x}{\sin x \cos x} = -\frac{\sin x}{\cos x} = -\tan x$.', '1) No trigonometriskās pamatidentitātes: $\cos^2 x - 1 = -\sin^2 x$.
2) Ievieto daļā: $\frac{-\sin^2 x}{\sin x \cos x} = -\tan x$.', '-tan x', 'Лёгкий', 27, true)
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
  select id into v_topic_id from public.topics where slug = 'opt-trig-pamatvienadojumi';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Отбор корней тригонометрического уравнения на отрезке', 'Trigonometriskā vienādojuma sakņu atlase nogrieznī', 'Найдите все корни уравнения $\sin x = \frac{1}{2}$, принадлежащие отрезку $[0; 2\pi]$.', 'Atrodiet visas vienādojuma $\sin x = \frac{1}{2}$ saknes intervālā $[0; 2\pi]$.', '1) Общее решение: $x = (-1)^k \frac{\pi}{6} + \pi k, k \in \mathbb{Z}$.
2) В первом обороте окружности $[0; 2\pi]$ синус равен $\frac{1}{2}$ при углах первой и второй четвертей:
$x_1 = \frac{\pi}{6}$ и $x_2 = \pi - \frac{\pi}{6} = \frac{5\pi}{6}$.', '1) Vienības riņķī sinuss ir vienāds ar $\frac{1}{2}$ I un II ceturksnī.
2) Saknes intervālā $[0; 2\pi]$ ir $x_1 = \frac{\pi}{6}$ un $x_2 = \pi - \frac{\pi}{6} = \frac{5\pi}{6}$.', 'pi/6; (5pi)/6', 'Средний', 28, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'vienadojumi';
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
  select id into v_topic_id from public.topics where slug = 'opt-trijsturu-vienadiba-lidziba';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Отношение площадей подобных треугольников', 'Līdzīgu trijstūru laukumu attiecība', 'Два треугольника подобны, причём коэффициент подобия равен $k = 3$. Площадь меньшего треугольника равна $8\text{ см}^2$. Найдите площадь большего треугольника.', 'Divi trijstūri ir līdzīgi ar līdzības koeficientu $k = 3$. Mazākā trijstūra laukums ir $8\text{ cm}^2$. Aprēķiniet lielākā trijstūra laukumu.', '1) Отношение площадей подобных фигур равно квадрату коэффициента подобия: $\frac{S_2}{S_1} = k^2 = 3^2 = 9$.
2) $S_2 = 9 \cdot S_1 = 9 \cdot 8 = 72\text{ см}^2$.', '1) Līdzīgu figūru laukumu attiecība ir vienāda ar līdzības koeficienta kvadrātu: $\frac{S_2}{S_1} = k^2 = 9$.
2) Lielākā trijstūra laukums: $S_2 = 9 \cdot 8 = 72\text{ cm}^2$.', '72', 'Лёгкий', 29, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'pieradijumi';
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
  select id into v_topic_id from public.topics where slug = 'opt-geometriskie-parveidojumi';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Координаты точки при центральной симметрии', 'Punkta koordinātas pie centrālās simetrijas', 'Точка $A(3; -5)$ симметрична точке $A''$ относительно начала координат $O(0; 0)$. Найдите координаты точки $A''$.', 'Punkts $A(3; -5)$ ir simetrisks punktam $A''$ attiecībā pret koordinātu sākumpunktu $O(0; 0)$. Nosakiet punkta $A''$ koordinātas.', 'При центральной симметрии относительно начала координат знаки обеих координат меняются на противоположные: $x'' = -x = -3$, $y'' = -y = 5$. Значит, $A''(-3; 5)$.', 'Centrālajā simetrijā pret koordinātu sākumpunktu abām koordinātām mainās zīmes: $x'' = -3, y'' = 5$. Tātad $A''(-3; 5)$.', '(-3; 5)', 'Лёгкий', 30, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'koordinatu-metode';
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
  select id into v_topic_id from public.topics where slug = 'opt-daudzsturu-laukumi';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Площадь треугольника по формуле Герона', 'Trijstūra laukuma aprēķināšana ar Hērona formulu', 'Найдите площадь треугольника со сторонами $13\text{ см}$, $14\text{ см}$ и $15\text{ см}$.', 'Aprēķiniet trijstūra laukumu, ja tā malu garumi ir $13\text{ cm}$, $14\text{ cm}$ un $15\text{ cm}$.', '1) Полупериметр: $p = \frac{13 + 14 + 15}{2} = \frac{42}{2} = 21\text{ см}$.
2) Формула Герона: $S = \sqrt{p(p-a)(p-b)(p-c)} = \sqrt{21 \cdot 8 \cdot 7 \cdot 6}$.
3) Раскладываем: $21 \cdot 7 = 147 = 3 \cdot 7^2$, $8 \cdot 6 = 48 = 3 \cdot 16$.
$S = \sqrt{7^2 \cdot 3^2 \cdot 16} = 7 \cdot 3 \cdot 4 = 84\text{ см}^2$.', '1) Pusperimetrs: $p = \frac{13 + 14 + 15}{2} = 21\text{ cm}$.
2) Hērona formula: $S = \sqrt{21 \cdot (21-13) \cdot (21-14) \cdot (21-15)} = \sqrt{21 \cdot 8 \cdot 7 \cdot 6}$.
3) $S = \sqrt{7056} = 84\text{ cm}^2$.', '84', 'Средний', 31, true)
    returning id into v_task_id;

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
  select id into v_topic_id from public.topics where slug = 'opt-rinka-linija-lenki-pieskares';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Вычисление вписанного угла через центральный', 'Ieviltā leņķa lieluma noteikšana', 'Центральный угол опирается на дугу окружности и равен $110^\circ$. Найдите градусную меру вписанного угла, опирающегося на ту же самую дугу.', 'Centra leņķis balstās uz riņķa līnijas loku un ir $110^\circ$. Aprēķiniet ievilktā leņķa lielumu, kas balstās uz to pašu loku.', 'Вписанный угол равен половине центрального угла, опирающегося на ту же дугу: $\beta = \frac{110^\circ}{2} = 55^\circ$.', 'Ievilktais leņķis ir vienāds ar pusi no centra leņķa, kas balstās uz to pašu loku: $\beta = \frac{110^\circ}{2} = 55^\circ$.', '55', 'Лёгкий', 32, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'pieradijumi';
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
  select id into v_topic_id from public.topics where slug = 'opt-ievilkta-apvilkta-rinka-linija';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Радиус вписанной окружности прямоугольного треугольника', 'Taisnleņķa trijstūrī ievilktās riņķa līnijas rādiuss', 'Катеты прямоугольного треугольника равны $6\text{ см}$ и $8\text{ см}$. Найдите радиус вписанной окружности.', 'Taisnleņķa trijstūra katetes ir $6\text{ cm}$ un $8\text{ cm}$. Aprēķiniet ievilktās riņķa līnijas rādiusu.', '1) Гипотенуза: $c = \sqrt{6^2 + 8^2} = \sqrt{36 + 64} = 10\text{ см}$.
2) Для прямоугольного треугольника: $r = \frac{a + b - c}{2} = \frac{6 + 8 - 10}{2} = \frac{4}{2} = 2\text{ см}$.', '1) Hipotenūza: $c = \sqrt{36 + 64} = 10\text{ cm}$.
2) Ievilktās riņķa līnijas rādiuss taisnleņķa trijstūrī: $r = \frac{a + b - c}{2} = \frac{6 + 8 - 10}{2} = 2\text{ cm}$.', '2', 'Средний', 33, true)
    returning id into v_task_id;

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
  select id into v_topic_id from public.topics where slug = 'opt-vektori-plakne';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Линейная комбинация векторов', 'Vektoru lineāra kombinācija', 'Даны векторы $\vec{a} = (3; -2)$ и $\vec{b} = (-1; 4)$. Найдите координаты вектора $\vec{c} = 2\vec{a} + 3\vec{b}$.', 'Doti vektori $\vec{a} = (3; -2)$ un $\vec{b} = (-1; 4)$. Nosakiet vektora $\vec{c} = 2\vec{a} + 3\vec{b}$ koordinātas.', '1) Координаты $2\vec{a} = (2 \cdot 3; 2 \cdot (-2)) = (6; -4)$.
2) Координаты $3\vec{b} = (3 \cdot (-1); 3 \cdot 4) = (-3; 12)$.
3) Складываем: $\vec{c} = (6 + (-3); -4 + 12) = (3; 8)$.', '1) $2\vec{a} = (6; -4)$.
2) $3\vec{b} = (-3; 12)$.
3) Saskaita: $\vec{c} = (6 - 3; -4 + 12) = (3; 8)$.', '(3; 8)', 'Лёгкий', 34, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'vektori';
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
  select id into v_topic_id from public.topics where slug = 'opt-vektoru-skalarais-reizinajums';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Условие перпендикулярности векторов через скалярное произведение', 'Vektoru perpendikularitātes nosacījums', 'При каком значении параметра $m$ векторы $\vec{u} = (4; m)$ и $\vec{v} = (3; -6)$ взаимно перпендикулярны?', 'Kādai parametra $m$ vērtībai vektori $\vec{u} = (4; m)$ un $\vec{v} = (3; -6)$ ir savstarpēji perpendikulāri?', '1) Векторы перпендикулярны тогда и только тогда, когда их скалярное произведение равно нулю: $\vec{u} \cdot \vec{v} = 0$.
2) Вычисляем: $4 \cdot 3 + m \cdot (-6) = 0 \implies 12 - 6m = 0 \implies 6m = 12 \implies m = 2$.', '1) Vektori ir perpendikulāri tad un tikai tad, kad to skalārais reizinājums ir $0$: $\vec{u} \cdot \vec{v} = 0$.
2) $4 \cdot 3 + m \cdot (-6) = 0 \implies 12 - 6m = 0 \implies m = 2$.', '2', 'Средний', 35, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'vektori';
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
  select id into v_topic_id from public.topics where slug = 'opt-taisnes-vienadojums';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Составление уравнения перпендикулярной прямой', 'Perpendikulāras taisnes vienādojuma sastādīšana', 'Напишите уравнение прямой, проходящей через точку $P(1; 4)$ перпендикулярно прямой $y = 2x - 5$.', 'Uzrakstiet vienādojumu taisnei, kas iet caur punktu $P(1; 4)$ perpendikulāri taisnei $y = 2x - 5$.', '1) Исходная прямая имеет угловой коэффициент $k_1 = 2$.
2) Для перпендикулярной прямой: $k_2 = -\frac{1}{k_1} = -\frac{1}{2} = -0{,}5$.
3) Подставляем точку $P(1; 4)$ в уравнение $y = -0{,}5x + b$: $4 = -0{,}5(1) + b \implies b = 4{,}5$.
Ответ: $y = -0{,}5x + 4{,}5$.', '1) Dotās taisnes virziena koeficients ir $k_1 = 2$.
2) Perpendikulārajai taisnei: $k_2 = -\frac{1}{2} = -0{,}5$.
3) Ievieto punktu $P(1; 4)$: $4 = -0{,}5 \cdot 1 + b \implies b = 4{,}5$.
Atbilde: $y = -0{,}5x + 4{,}5$.', 'y = -0.5x + 4.5', 'Средний', 36, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'koordinatu-metode';
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
  select id into v_topic_id from public.topics where slug = 'opt-rinka-linijas-vienadojums';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Нахождение центра и радиуса окружности', 'Riņķa līnijas centra un rādiusa noteikšana', 'Окружность задана уравнением $(x + 3)^2 + (y - 5)^2 = 49$. Найдите координаты её центра и длину радиуса.', 'Riņķa līnija dota ar vienādojumu $(x + 3)^2 + (y - 5)^2 = 49$. Nosakiet tās centra koordinātas un rādiusu.', '1) Сравниваем с каноническим видом $(x - x_0)^2 + (y - y_0)^2 = R^2$.
2) Центр: $x_0 = -3$, $y_0 = 5$, то есть точка $(-3; 5)$.
3) Радиус: $R = \sqrt{49} = 7$.', '1) Salīdzina ar formulu $(x - x_0)^2 + (y - y_0)^2 = R^2$.
2) Centra koordinātas: $(-3; 5)$.
3) Rādiuss: $R = \sqrt{49} = 7$.', '(-3; 5), R = 7', 'Лёгкий', 37, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'koordinatu-metode';
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
  select id into v_topic_id from public.topics where slug = 'opt-taisnes-plaknes-telpa';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Угол между скрещивающимися прямыми в кубе', 'Leņķis starp šķērsām taisnēm kubā', 'В кубе $ABCDA_1B_1C_1D_1$ найдите градусную меру угла между прямыми $A_1B$ и $B_1C$.', 'Kubā $ABCDA_1B_1C_1D_1$ nosakiet leņķi starp taisnēm $A_1B$ un $B_1C$.', '1) Прямая $B_1C$ параллельна прямой $A_1D$ (противоположные грани куба параллельны).
2) Угол между скрещивающимися прямыми $A_1B$ и $B_1C$ равен углу между пересекающимися прямыми $A_1B$ и $A_1D$.
3) Соединим точки $B$ и $D$. В треугольнике $A_1BD$ все три стороны являются диагоналями граней куба ($A_1B = BD = A_1D = a\sqrt{2}$).
4) Треугольник равносторонний, следовательно, угол равен $60^\circ$.', '1) Taisne $B_1C$ ir paralēla taisnei $A_1D$.
2) Leņķis starp $A_1B$ un $B_1C$ ir vienāds ar leņķi starp $A_1B$ un $A_1D$.
3) Trijstūris $A_1BD$ ir vienādmalu, jo visas trīs malas ir kuba skaldņu diagonāles ($a\sqrt{2}$).
4) Tātad leņķis ir $60^\circ$.', '60', 'Средний', 38, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'pieradijumi';
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
  select id into v_topic_id from public.topics where slug = 'opt-daudzskaldni-skelumi';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Площадь диагонального сечения прямоугольного параллелепипеда', 'Taisnstūra paralēlskaldņa diagonālšķēluma laukums', 'Основание прямоугольного параллелепипеда имеет стороны $3\text{ см}$ и $4\text{ см}$, а его высота равна $10\text{ см}$. Найдите площадь диагонального сечения.', 'Taisnstūra paralēlskaldņa pamata malas ir $3\text{ cm}$ un $4\text{ cm}$, un augstums ir $10\text{ cm}$. Aprēķiniet diagonālšķēluma laukumu.', '1) Диагональ основания (по теореме Пифагора): $d = \sqrt{3^2 + 4^2} = 5\text{ см}$.
2) Диагональное сечение представляет собой прямоугольник со сторонами $d = 5\text{ см}$ и $H = 10\text{ см}$.
3) Площадь сечения: $S = d \cdot H = 5 \cdot 10 = 50\text{ см}^2$.', '1) Pamata diagonāle: $d = \sqrt{3^2 + 4^2} = 5\text{ cm}$.
2) Diagonālšķēlums ir taisnstūris ar malām $5\text{ cm}$ un $10\text{ cm}$.
3) Laukums: $S = 5 \cdot 10 = 50\text{ cm}^2$.', '50', 'Средний', 39, true)
    returning id into v_task_id;

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
  select id into v_topic_id from public.topics where slug = 'opt-prizma-virsma-tilpums';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Объем правильной треугольной призмы', 'Regulāras trijstūra prizmas tilpums', 'Основание правильной треугольной призмы — равносторонний треугольник со стороной $4\text{ см}$. Высота призмы равна $6\sqrt{3}\text{ см}$. Найдите объем призмы.', 'Regulāras trijstūra prizmas pamata mala ir $4\text{ cm}$, un augstums ir $6\sqrt{3}\text{ cm}$. Aprēķiniet prizmas tilpumu.', '1) Площадь равностороннего треугольника: $S_{pam} = \frac{a^2 \sqrt{3}}{4} = \frac{16\sqrt{3}}{4} = 4\sqrt{3}\text{ см}^2$.
2) Объем призмы: $V = S_{pam} \cdot H = 4\sqrt{3} \cdot 6\sqrt{3} = 24 \cdot 3 = 72\text{ см}^3$.', '1) Pamata vienādmalu trijstūra laukums: $S_{pam} = \frac{a^2\sqrt{3}}{4} = \frac{16\sqrt{3}}{4} = 4\sqrt{3}\text{ cm}^2$.
2) Prizmas tilpums: $V = S_{pam} \cdot H = 4\sqrt{3} \cdot 6\sqrt{3} = 72\text{ cm}^3$.', '72', 'Средний', 40, true)
    returning id into v_task_id;

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
  select id into v_topic_id from public.topics where slug = 'opt-piramida-regulara';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Объем правильной четырехугольной пирамиды', 'Regulāras četrstūra piramīdas tilpuma aprēķināšana', 'В правильной четырехугольной пирамиде сторона основания равна $6\text{ см}$, а боковое ребро равно $5\text{ см}$. Найдите объем пирамиды.', 'Regulārā četrstūra piramīdā pamata mala ir $6\text{ cm}$ un sānu šķautne ir $5\text{ cm}$. Aprēķiniet piramīdas tilpumu.', '1) Площадь основания: $S_{pam} = 6^2 = 36\text{ см}^2$.
2) Диагональ основания: $d = 6\sqrt{2}\text{ см}$, половина диагонали: $\frac{d}{2} = 3\sqrt{2}\text{ см}$.
3) Высота $H$ из прямоугольного треугольника: $H = \sqrt{5^2 - (3\sqrt{2})^2} = \sqrt{25 - 18} = \sqrt{7}\text{ см}$.
4) Объем: $V = \frac{1}{3} S_{pam} H = \frac{1}{3} \cdot 36 \cdot \sqrt{7} = 12\sqrt{7}\text{ см}^3$.', '1) Pamata kvadrāta laukums: $S_{pam} = 36\text{ cm}^2$.
2) Diagonāles puse: $3\sqrt{2}\text{ cm}$.
3) Augstums $H = \sqrt{5^2 - (3\sqrt{2})^2} = \sqrt{7}\text{ cm}$.
4) Tilpums: $V = \frac{1}{3} \cdot 36 \cdot \sqrt{7} = 12\sqrt{7}\text{ cm}^3$.', '12sqrt(7)', 'Средний', 41, true)
    returning id into v_task_id;

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
  select id into v_topic_id from public.topics where slug = 'opt-cilindrs';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Полная поверхность и объем цилиндра', 'Cilindra pilnas virsmas laukums un tilpums', 'Радиус основания цилиндра равен $3\text{ см}$, а его высота равна $5\text{ см}$. Найдите объем цилиндра (в ответах с $\pi$).', 'Cilindra pamata rādiuss ir $3\text{ cm}$ un augstums ir $5\text{ cm}$. Aprēķiniet cilindra tilpumu (izteiktu ar $\pi$).', 'Формула объема цилиндра: $V = \pi R^2 H = \pi \cdot 3^2 \cdot 5 = 45\pi\text{ см}^3$.', 'Cilindra tilpuma formula: $V = \pi R^2 H = \pi \cdot 9 \cdot 5 = 45\pi\text{ cm}^3$.', '45pi', 'Лёгкий', 42, true)
    returning id into v_task_id;

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
  select id into v_topic_id from public.topics where slug = 'opt-konuss';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Вычисление объема конуса по образующей и радиусу', 'Konusa tilpuma aprēķināšana pēc veidules un rādiusa', 'Образующая конуса равна $10\text{ см}$, а радиус основания равен $6\text{ см}$. Найдите объем конуса.', 'Konusa veidule ir $10\text{ cm}$ un pamata rādiuss ir $6\text{ cm}$. Aprēķiniet konusa tilpumu (ar $\pi$).', '1) Высота конуса: $H = \sqrt{l^2 - R^2} = \sqrt{10^2 - 6^2} = \sqrt{64} = 8\text{ см}$.
2) Объем конуса: $V = \frac{1}{3} \pi R^2 H = \frac{1}{3} \pi \cdot 36 \cdot 8 = 96\pi\text{ см}^3$.', '1) Konusa augstums: $H = \sqrt{10^2 - 6^2} = 8\text{ cm}$.
2) Tilpums: $V = \frac{1}{3} \pi R^2 H = \frac{1}{3} \pi \cdot 36 \cdot 8 = 96\pi\text{ cm}^3$.', '96pi', 'Средний', 43, true)
    returning id into v_task_id;

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
  select id into v_topic_id from public.topics where slug = 'opt-lode-sfera';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Площадь сферы и объем шара', 'Sfēras laukums un lodes tilpums', 'Радиус шара равен $3\text{ см}$. Найдите площадь его поверхности и объем (запишите ответ через $\pi$).', 'Lodes rādiuss ir $3\text{ cm}$. Aprēķiniet tās sfēras laukumu un tilpumu (ar $\pi$).', '1) Площадь сферы: $S = 4\pi R^2 = 4\pi \cdot 3^2 = 36\pi\text{ см}^2$.
2) Объем шара: $V = \frac{4}{3}\pi R^3 = \frac{4}{3}\pi \cdot 27 = 36\pi\text{ см}^3$.', '1) Sfēras laukums: $S = 4\pi R^2 = 36\pi\text{ cm}^2$.
2) Lodes tilpums: $V = \frac{4}{3}\pi R^3 = 36\pi\text{ cm}^3$.', 'S = 36pi, V = 36pi', 'Лёгкий', 44, true)
    returning id into v_task_id;

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
  select id into v_topic_id from public.topics where slug = 'opt-vektori-telpa';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Расстояние между двумя точками в трехмерном пространстве', 'Attālums starp diviem punktiem telpā', 'Найдите расстояние между точками $A(1; 2; -3)$ и $B(4; -2; 9)$.', 'Aprēķiniet attālumu starp punktiem $A(1; 2; -3)$ un $B(4; -2; 9)$.', '1) Формула расстояния: $d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2 + (z_2 - z_1)^2}$.
2) Разности координат: $\Delta x = 4 - 1 = 3$, $\Delta y = -2 - 2 = -4$, $\Delta z = 9 - (-3) = 12$.
3) $d = \sqrt{3^2 + (-4)^2 + 12^2} = \sqrt{9 + 16 + 144} = \sqrt{169} = 13$.', '1) Attāluma formula: $d = \sqrt{\Delta x^2 + \Delta y^2 + \Delta z^2}$.
2) Koordinātu starpības: $\Delta x = 3$, $\Delta y = -4$, $\Delta z = 12$.
3) $d = \sqrt{9 + 16 + 144} = \sqrt{169} = 13$.', '13', 'Средний', 45, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'vektori';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'koordinatu-metode';
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
  select id into v_topic_id from public.topics where slug = 'opt-kopas-darbibas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Пересечение и объединение множеств', 'Kopu šķēlums un apvienojums', 'Даны множества $A = \{1; 2; 3; 4; 5\}$ и $B = \{3; 4; 5; 6; 7\}$. Найдите количество элементов в объединении $A \cup B$ и в пересечении $A \cap B$.', 'Dotas kopas $A = \{1; 2; 3; 4; 5\}$ un $B = \{3; 4; 5; 6; 7\}$. Cik elementu ir kopu apvienojumā $A \cup B$ un šķēlumā $A \cap B$?', '1) Пересечение $A \cap B = \{3; 4; 5\}$, число элементов равно $3$.
2) Объединение $A \cup B = \{1; 2; 3; 4; 5; 6; 7\}$, число элементов равно $7$.', '1) Šķēlums $A \cap B = \{3; 4; 5\}$ satur 3 elementus.
2) Apvienojums $A \cup B = \{1; 2; 3; 4; 5; 6; 7\}$ satur 7 elementus.', '|A U B| = 7, |A n B| = 3', 'Лёгкий', 46, true)
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
  select id into v_topic_id from public.topics where slug = 'opt-kombinatorikas-pamatprincipi';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Правило произведения при составлении PIN-кода', 'Reizināšanas likums PIN koda veidošanā', 'Сколько различных четырехзначных PIN-кодов можно составить из цифр от $0$ до $9$, если все цифры в коде должны быть различными?', 'Cik dažādu četrciparu PIN kodu var izveidot no cipariem no $0$ līdz $9$, ja visi koda cipari ir dažādi?', '1) Для первой цифры есть $10$ вариантов.
2) Для второй — $9$ оставшихся.
3) Для третьей — $8$.
4) Для четвертой — $7$.
По правилу произведения: $10 \cdot 9 \cdot 8 \cdot 7 = 5040$ кодов.', 'Pēc reizināšanas likuma: $10 \cdot 9 \cdot 8 \cdot 7 = 5040$ dažādi kodi.', '5040', 'Лёгкий', 47, true)
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
  select id into v_topic_id from public.topics where slug = 'opt-permutacijas-kombinacijas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Выбор делегации с помощью сочетаний', 'Delegācijas izvēle, izmantojot kombinācijas', 'В классе учатся $12$ учеников. Сколькими способами можно выбрать команду из $3$ человек для участия в олимпиаде?', 'Klasē ir $12$ skolēni. Cik dažādos veidos var izvēlēties $3$ skolēnu komandu dalībai olimpiādē?', 'Так как порядок выбора учеников не имеет значения, используем формулу сочетаний:
$C_{12}^3 = \frac{12!}{3!(12-3)!} = \frac{12 \cdot 11 \cdot 10}{3 \cdot 2 \cdot 1} = 2 \cdot 11 \cdot 10 = 220$.', 'Tā kā kārtībai nav nozīmes, izmanto kombināciju formulu:
$C_{12}^3 = \frac{12 \cdot 11 \cdot 10}{3 \cdot 2 \cdot 1} = 220$.', '220', 'Средний', 48, true)
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
  select id into v_topic_id from public.topics where slug = 'opt-klasiska-varbutiba';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Вероятность суммы очков при бросании двух игральных костей', 'Varbūtība uzmest noteiktu punktu summu ar diviem kauliņiem', 'Одновременно бросают две стандартные игральные кости с гранями от $1$ до $6$. Какова вероятность того, что сумма выпавших очков будет равна $8$?', 'Vienlaicīgi met divus parastus spēļu kauliņus. Kāda ir varbūtība, ka uzmesto punktu summa būs tieši $8$?', '1) Общее число исходов при броске двух костей: $n = 6 \times 6 = 36$.
2) Благоприятные исходы с суммой $8$:
$(2; 6), (3; 5), (4; 4), (5; 3), (6; 2)$ — всего $m = 5$ исходов.
3) Вероятность: $P(A) = \frac{m}{n} = \frac{5}{36}$.', '1) Kopējais iespējamo iznākumu skaits: $n = 6 \cdot 6 = 36$.
2) Labvēlīgie iznākumi ar summu 8 ir $(2;6), (3;5), (4;4), (5;3), (6;2)$ — kopā $m = 5$.
3) Varbūtība: $P = \frac{5}{36}$.', '5/36', 'Средний', 49, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'varbutiba';
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
  select id into v_topic_id from public.topics where slug = 'opt-summas-un-nosacita-varbutiba';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Вероятность независимых событий в серии выстрелов', 'Neatkarīgu notikumu varbūtība šaušanā', 'Стрелок делает два независимых выстрела по мишени. Вероятность попадания при каждом выстреле равна $0{,}8$. Какова вероятность того, что стрелок попадет в мишень хотя бы один раз?', 'Šāvējs izdara divus neatkarīgus šāvienus mērķī. Trāpījuma varbūtība katrā šāvienā ir $0{,}8$. Kāda ir varbūtība, ka viņš trāpīs mērķī vismaz vienu reizi?', '1) Вероятность промаха при одном выстреле: $q = 1 - 0{,}8 = 0{,}2$.
2) Вероятность двух промахов подряд: $P(\text{оба промаха}) = 0{,}2 \cdot 0{,}2 = 0{,}04$.
3) Вероятность хотя бы одного попадания (противоположное событие): $P = 1 - 0{,}04 = 0{,}96$.', '1) Netrāpīšanas varbūtība: $q = 1 - 0{,}8 = 0{,}2$.
2) Varbūtība netrāpīt nevienu reizi: $0{,}2 \cdot 0{,}2 = 0{,}04$.
3) Varbūtība trāpīt vismaz vienu reizi: $P = 1 - 0{,}04 = 0{,}96$.', '0.96', 'Средний', 50, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'varbutiba';
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
  select id into v_topic_id from public.topics where slug = 'opt-populacija-izlase-videjie';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Вычисление среднего, медианы и моды числового ряда', 'Skaitļu rindas vidējā, mediānas un modas aprēķināšana', 'Дана выборка результатов теста: $4, 6, 7, 7, 8, 8, 8, 10$. Найдите среднее арифметическое, медиану и моду этой выборки.', 'Dota testa rezultātu izlase: $4, 6, 7, 7, 8, 8, 8, 10$. Aprēķiniet vidējo aritmētisko, mediānu un modu.', '1) Сумма значений: $4 + 6 + 7 + 7 + 8 + 8 + 8 + 10 = 58$.
Количество значений: $n = 8$. Среднее: $\bar{x} = \frac{58}{8} = 7{,}25$.
2) Значения уже упорядочены. Четное число элементов ($8$), поэтому медиана — среднее двух средних ($4$-го и $5$-го): $Me = \frac{7 + 8}{2} = 7{,}5$.
3) Мода — самое часто встречающееся число: $Mo = 8$ (встречается $3$ раза).', '1) Vidējais aritmētiskais: $\bar{x} = \frac{58}{8} = 7{,}25$.
2) Mediāna ir 4. un 5. locekļa vidējais: $Me = \frac{7 + 8}{2} = 7{,}5$.
3) Moda ir visbiežāk sastopamā vērtība: $Mo = 8$.', 'mean = 7.25, Me = 7.5, Mo = 8', 'Лёгкий', 51, true)
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
  select id into v_topic_id from public.topics where slug = 'opt-izkliedes-meri-grafika';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 11, 'Вычисление стандартного отклонения выборки', 'Izlases standartnovirzes aprēķināšana', 'Даны пять измерений: $2, 4, 4, 4, 6$. Вычислите стандартное отклонение данной выборки.', 'Doti pieci mērījumi: $2, 4, 4, 4, 6$. Aprēķiniet šīs izlases standartnovirzi.', '1) Среднее арифметическое: $\bar{x} = \frac{2 + 4 + 4 + 4 + 6}{5} = \frac{20}{5} = 4$.
2) Отклонения от среднего: $(2-4)=-2$, $(4-4)=0$, $(6-4)=2$.
3) Квадраты отклонений: $(-2)^2 = 4$, $0^2 = 0$, $2^2 = 4$.
4) Дисперсия: $s^2 = \frac{4 + 0 + 0 + 0 + 4}{5} = \frac{8}{5} = 1{,}6$.
5) Стандартное отклонение: $s = \sqrt{1{,}6} \approx 1{,}26$.', '1) Vidējais: $\bar{x} = 4$.
2) Noviržu kvadrātu summa: $(-2)^2 + 0 + 0 + 0 + 2^2 = 8$.
3) Dispersija: $s^2 = \frac{8}{5} = 1{,}6$.
4) Standartnovirze: $s = \sqrt{1{,}6} \approx 1{,}26$.', 'sqrt(1.6) ~= 1.26', 'Средний', 52, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'statistika';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;
