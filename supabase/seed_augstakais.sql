-- ============================================================================
-- Seed: Каталог тем и задач курса Matemātika II (Augstākais līmenis, 12 klase)
-- Соответствует официальной таксономии Skola2030 (все 45 тем)
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

-- 2. Темы курса Augstākais līmenis (45 тем)
insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Иррациональные уравнения', 'Iracionālie vienādojumi', 'augst-iracionalie-vienadojumi', (select id from public.subjects where slug = 'algebra'), 12, 1, 'Возведение обеих частей в степень, учет ОДЗ, замена переменной, появление посторонних корней.', 'Abu pušu kāpināšana pakāpē, definīcijas apgabala ievērošana, mainīgā nomaiņa, svešu sakņu atsijāšana.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Логарифмические уравнения, неравенства и системы', 'Logaritmiskie vienādojumi, nevienādības un sistēmas', 'augst-logaritmiskie-vienadojumi-sistemas', (select id from public.subjects where slug = 'algebra'), 12, 2, 'Переход к новому основанию, переменное основание логарифма $\log_{g(x)} f(x)$, метод рационализации.', 'Pāreja uz jaunu bāzi, mainīga logaritma bāze $\log_{g(x)} f(x)$, racionalizācijas metode.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Деление многочленов и теорема Безу', 'Polinomu dalīšana un Bezū teorēma', 'augst-polinomu-dalisana-bezu', (select id from public.subjects where slug = 'algebra'), 12, 3, 'Деление многочлена на многочлен «уголком», теорема Безу $P(a) = R$, схема Горнера, нахождение рациональных корней.', 'Polinomu dalīšana stabiņā, Bezū teorēma $P(a) = R$, Hornera shēma, racionālu sakņu atrašana.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Метод неопределенных коэффициентов', 'Nenoteikto koeficientu metode', 'augst-nenoteikto-koeficientu-metode', (select id from public.subjects where slug = 'algebra'), 12, 4, 'Разложение рациональных дробей на сумму простейших, равенство многочленов, составление систем линейных уравнений.', 'Racionālu daļu sadalīšana pamatdaļās, polinomu vienādība, lineāru vienādojumu sistēmu veidošana.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Уравнения и неравенства с параметром', 'Vienādojumi un nevienādības ar parametru', 'augst-vienadojumi-parametri', (select id from public.subjects where slug = 'algebra'), 12, 5, 'Аналитический и графический методы исследования количества корней в зависимости от значений параметра $a$.', 'Analītiskā un grafiskā metode sakņu skaita pētīšanai atkarībā no parametra $a$ vērtībām.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Комплексные приемы решения уравнений', 'Kompleksi vienādojumu risināšanas paņēmieni', 'augst-kompleksi-vienadojumu-panemieni', (select id from public.subjects where slug = 'algebra'), 12, 6, 'Однородные уравнения, симметрические системы, метод оценки (мажорант), функционально-графический метод.', 'Homogēni vienādojumi, simetriskas sistēmas, mažorantu metode, funkcionāli grafiskā metode.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Обратная функция', 'Inversā funkcija', 'augst-inversa-funkcija', (select id from public.subjects where slug = 'algebra'), 12, 7, 'Условие обратимости (строгая монотонность), нахождение формулы обратной функции $y = f^{-1}(x)$, симметрия графиков относительно $y = x$.', 'Invertējamības nosacījums (monotonitāte), inversās funkcijas atrašana, grafiku simetrija pret taisni $y = x$.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Последовательности, их монотонность и предел', 'Virknes, to monotonitāte un robeža', 'augst-virknes-monotonitate-robeza', (select id from public.subjects where slug = 'algebra'), 12, 8, 'Ограниченность и монотонность числовых последовательностей, понятие предела $\lim_{n \to \infty} a_n$, вычисление пределов отношений многочленов.', 'Skaitļu virkņu ierobežotība un monotonitāte, virknes robežas jēdziens $\lim_{n \to \infty} a_n$, robežu aprēķināšana.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Бесконечно убывающая геометрическая прогрессия', 'Bezgalīgi dilstoša ģeometriskā progresija', 'augst-bezgaligi-dilstosa-progresija', (select id from public.subjects where slug = 'algebra'), 12, 9, 'Условие сходимости $|q| < 1$, формула суммы $S = \frac{b_1}{1 - q}$, обращение периодических десятичных дробей в обыкновенные.', 'Konverģences nosacījums $|q| < 1$, summas formula $S = \frac{b_1}{1 - q}$, bezgalīgu periodisku decimāldaļu pārvēršana parastajās daļās.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Число e и экспоненциальные процессы', 'Skaitlis e un eksponenciāli procesi', 'augst-skaitlis-e-eksponenciali-procesi', (select id from public.subjects where slug = 'algebra'), 12, 10, 'Число Эйлера $e = \lim (1 + 1/n)^n \approx 2{,}718$, натуральный логарифм $\ln x$, непрерывное начисление процентов, дифференциальные уравнения радиоактивного распада.', 'Eilera skaitlis $e \approx 2{,}718$, naturāllogaritms $\ln x$, nepārtraukti procentu aprēķini, sabrukšanas vienādojums.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Непрерывность функции', 'Funkcijas nepārtrauktība', 'augst-funkcijas-nepartrauktiba', (select id from public.subjects where slug = 'algebra'), 12, 11, 'Определение непрерывности в точке $\lim_{x \to x_0} f(x) = f(x_0)$, точки разрыва, теорема Больцано–Коши о промежуточных значениях.', 'Nepārtrauktība punktā $\lim_{x \to x_0} f(x) = f(x_0)$, pārtraukuma punkti, teorēma par funkcijas starpvērtībām.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Исследование дробно-рациональной функции', 'Daļveida racionālas funkcijas pētīšana', 'augst-dalveida-racionalas-funkcijas-petisana', (select id from public.subjects where slug = 'algebra'), 12, 12, 'Наклонные асимптоты $y = kx + b$, точки пересечения с осями координат, знаки постоянства.', 'Slīpās asimptotas $y = kx + b$, krustpunkti ar asīm, zīmju pastāvība.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Тангенс и котангенс угла', 'Leņķa tangenss un kotangenss', 'augst-lenka-tangenss-kotangenss', (select id from public.subjects where slug = 'algebra'), 12, 13, 'Функции $y = \tan x$ и $y = \cot x$, период $T = \pi$, область определения, вертикальные асимптоты.', 'Funkcijas $y = \tan x$ un $y = \cot x$, periods $T = \pi$, definīcijas apgabals, asimptotas.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Обратные тригонометрические функции', 'Apgrieztās trigonometriskās funkcijas', 'augst-apgrieztas-trig-funkcijas', (select id from public.subjects where slug = 'algebra'), 12, 14, 'Определения и графики $\arcsin x, \arccos x, \arctan x$, их области определения и множества главных значений.', 'Funkcijas $\arcsin x, \arccos x, \arctan x$, to definīcijas un vērtību apgabali, identitātes.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Тригонометрические неравенства', 'Trigonometriskās nevienādības', 'augst-trigonometriskas-nevienadibas', (select id from public.subjects where slug = 'algebra'), 12, 15, 'Решение неравенств $\sin x > a$, $\cos x \le a$ с помощью тригонометрического круга и графиков функций.', 'Nevienādību risināšana ar vienības riņķi un grafiku palīdzību, perioda pieskaitīšana.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Системы тригонометрических уравнений', 'Trigonometrisko vienādojumu sistēmas', 'augst-trig-vienadojumu-sistemas', (select id from public.subjects where slug = 'algebra'), 12, 16, 'Методы сложения и подстановки, формулы преобразования произведения функций в сумму и суммы в произведение.', 'Saskaitīšanas un ievietošanas metodes, reizinājuma pārvēršana summā un otrādi.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Гармонические колебания и тригонометрические модели', 'Harmoniskās svārstības un trigonometriskie modeļi', 'augst-harmoniskas-svarstibas-modeli', (select id from public.subjects where slug = 'algebra'), 12, 17, 'Уравнение колебаний $x(t) = A \cos(\omega t + \varphi_0)$, амплитуда $A$, циклическая частота $\omega$, начальная фаза $\varphi_0$, период $T = 2\pi/\omega$.', 'Svārstību vienādojums $x(t) = A \cos(\omega t + \varphi_0)$, amplitūda, cikliskā frekvence, sākumfāze, periods.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Соотношения в треугольниках (углубленно)', 'Sakarības trijstūros (padziļināti)', 'augst-sakaribas-trijsturos-padzilinati', (select id from public.subjects where slug = 'geometry'), 12, 18, 'Теорема о медианах (точка пересечения делит в отношении 2:1), биссектрисах (деление противоположной стороны), теорема Менелая и Чевы.', 'Mediānu krustpunkta īpašība ($2:1$), bisektrises īpašība, Menelāja un Čevas teorēmas.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Соотношения в четырехугольниках и правильных многоугольниках', 'Sakarības četrstūros un regulāros daudzstūros', 'augst-sakaribas-cetrsturos-daudzsturos', (select id from public.subjects where slug = 'geometry'), 12, 19, 'Вписанные четырехугольники (сумма противоположных углов $180^\circ$), описанные четырехугольники (суммы противоположных сторон равны), теорема Птолемея.', 'Ievilkti un apvilkti četrstūri, pretējo leņķu un malu summas, Ptolemaja teorēma.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Отрезки и углы, связанные с окружностью', 'Ar riņķa līniju saistīti leņķi un nogriežņi', 'augst-rinka-linija-lenki-nogriezni', (select id from public.subjects where slug = 'geometry'), 12, 20, 'Теорема о произведении отрезков пересекающихся хорд, теорема о касательной и секущей ($AK^2 = AM \cdot AN$).', 'Hordu krustošanās teorēma, pieskares un sekantes teorēma ($AK^2 = AM \cdot AN$).')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Геометрические преобразования (углубленно)', 'Ģeometriskie pārveidojumi', 'augst-geometriskie-parveidojumi-padzilinati', (select id from public.subjects where slug = 'geometry'), 12, 21, 'Гомотетия и подобие, композиция движений, инварианты преобразований, применение преобразований при решении геометрических задач.', 'Homotētija, kustību kompozīcija, invarianti, pārveidojumu izmantošana uzdevumu risināšanā.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Аналитическая геометрия: прямая и окружность', 'Analītiskā ģeometrija: taisne un riņķa līnija', 'augst-analitiska-geometrija-taisne-rinkis', (select id from public.subjects where slug = 'geometry'), 12, 22, 'Расстояние от точки до прямой $d = \frac{|Ax_0 + By_0 + C|}{\sqrt{A^2 + B^2}}$, касание прямой и окружности, пересечение фигур.', 'Attālums no punkta līdz taisnei, pieskaršanās nosacījumi, taisnes un riņķa līnijas krustpunkti.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Скалярное произведение векторов в геометрических задачах', 'Vektoru skalārais reizinājums uzdevumos', 'augst-vektoru-skalarais-uzdevumos', (select id from public.subjects where slug = 'geometry'), 12, 23, 'Применение векторов для вычисления углов между прямыми, доказательства ортогональности, нахождения проекции вектора на вектор.', 'Leņķa aprēķināšana starp taisnēm, ortogonalitātes pierādīšana, vektora projekcija.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Сечения многогранников плоскостью (углубленно)', 'Daudzskaldņi un to šķēlumi ar plakni', 'augst-daudzskaldnu-skelumi-padzilinati', (select id from public.subjects where slug = 'geometry'), 12, 24, 'Метод следов, внутреннее проектирование, построение сечений через три точки, не лежащие на одной грани, вычисление площадей сечений.', 'Pēdu metode, iekšējā projektēšana, šķēlumu konstrukcija caur 3 punktiem, šķēluma laukuma aprēķināšana.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Комбинации призмы и цилиндра', 'Prizmas un cilindra ģeometriskās kombinācijas', 'augst-prizmas-cilindra-kombinacijas', (select id from public.subjects where slug = 'geometry'), 12, 25, 'Вписанные и описанные призмы около цилиндра, соотношение объемов, осевые сечения.', 'Apvilkta un ievilkta prizma, tilpumu attiecības, aksiālšķēlumi.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Комбинации конуса и пирамиды', 'Konusa un piramīdas ģeometriskās kombinācijas', 'augst-konusa-piramidas-kombinacijas', (select id from public.subjects where slug = 'geometry'), 12, 26, 'Вписанная и описанная пирамида относительно конуса, общая вершина и высота, связь радиуса основания конуса с многоугольником основания.', 'Ievilktas un apvilktas piramīdas, kopējā virsotne un augstums, sakarības starp rādiusu un pamata daudzstūri.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Комбинации шара, цилиндра и конуса', 'Lodes, cilindra un konusa ģeometriskās kombinācijas', 'augst-lodes-cilindra-konusa-kombinacijas', (select id from public.subjects where slug = 'geometry'), 12, 27, 'Шар, вписанный в цилиндр (задача Архимеда), шар, вписанный в конус и описанный около конуса, осевые сечения.', 'Lodes un cilindra kombinācija (Arhimēda uzdevums), lodē ievilkts un apvilkts konuss, aksiālšķēlumi.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Комбинации призмы, пирамиды и сферы', 'Prizmas un lodes, piramīdas un lodes kombinācijas', 'augst-prizmas-piramidas-lodes-kombinacijas', (select id from public.subjects where slug = 'geometry'), 12, 28, 'Центр описанной сферы многогранника, радиус сферы, описанной около куба и правильной пирамиды.', 'Daudzskaldnim apvilktas sfēras centrs un rādiuss, kubam un piramīdai apvilkta lode.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Комбинаторика II: Треугольник Паскаля', 'Kombinatorika II: Paskāla trijstūris', 'augst-kombinatorika-paskala-trijsturis', (select id from public.subjects where slug = 'statistics'), 12, 29, 'Свойства биномиальных коэффициентов $C_n^k = C_{n-1}^{k-1} + C_{n-1}^k$, симметрия $C_n^k = C_n^{n-k}$, сумма элементов строки $\sum C_n^k = 2^n$.', 'Binomiālo koeficientu īpašības, simetrija, rindas elementu summa $2^n$.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Бином Ньютона', 'Ņūtona binoms', 'augst-nutona-binoms', (select id from public.subjects where slug = 'statistics'), 12, 30, 'Формула $(a + b)^n = \sum_{k=0}^n C_n^k a^{n-k} b^k$, нахождение конкретного члена разложения $T_{k+1}$, свободный член.', 'Binoma formula, konkrēta locekļa $T_{k+1}$ noteikšana, no mainīgā neatkarīgais loceklis.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Элементы математической логики', 'Matemātiskās loģikas elementi', 'augst-matematiskas-logikas-elementi', (select id from public.subjects where slug = 'statistics'), 12, 31, 'Высказывания, конъюнкция, дизъюнкция, импликация $A \implies B$, эквивалентность, кванторы $\forall$ и $\exists$, доказательство от противного.', 'Izteikumi, loģiskās operācijas, implikācija, kvantori $\forall$ un $\exists$, pierādījums no pretējā.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Принцип математической индукции', 'Matemātiskās indukcijas princips', 'augst-matematiskas-indukcijas-princips', (select id from public.subjects where slug = 'statistics'), 12, 32, 'База индукции $n = 1$, индукционный переход $n = k \implies n = k + 1$, доказательство формул сумм и делимости.', 'Indukcijas bāze, indukcijas pāreja, vienādību un dalāmības pierādīšana.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Распределения случайной величины и формула Бернулли', 'Gadījuma lieluma sadalījumi un Bernulli formula', 'augst-bernulli-formula-sadalijumi', (select id from public.subjects where slug = 'statistics'), 12, 33, 'Схема независимых испытаний Бернулли $P_n(k) = C_n^k p^k (1-p)^{n-k}$, закон распределения дискретной случайной величины, математическое ожидание $E(X)$ и дисперсия $D(X)$.', 'Bernulli formula, diskrēta gadījuma lieluma sadalījuma likums, matemātiskā cerība $E(X)$ un dispersija $D(X)$.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Формула полной вероятности и формула Байеса', 'Notikumu apvienojuma un pilnās varbūtības formula', 'augst-pilnas-varbutibas-formula', (select id from public.subjects where slug = 'statistics'), 12, 34, 'Полная группа гипотез $H_1, \dots, H_n$, формула $P(A) = \sum P(H_i) P(A|H_i)$, переоценка вероятностей по формуле Байеса.', 'Pilnās varbūtības formula $P(A) = \sum P(H_i) P(A|H_i)$, hipotēžu varbūtību pārrēķins ar Beijesa formulu.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Статистика II: Выводы о генеральной совокупности', 'Statistika II: secinājumi par populāciju', 'augst-statistika-secinajumi-populacija', (select id from public.subjects where slug = 'statistics'), 12, 35, 'Доверительные интервалы для среднего значения, погрешность выборки, проверка статистических гипотез, нормальное распределение (правило трех сигм).', 'Ticamības intervāli vidējai vērtībai, izlases kļūda, statistisko hipotēžu pārbaude, normālais sadalījums (3 sigmu likums).')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Предел функции', 'Funkcijas robeža', 'augst-funkcijas-robeza', (select id from public.subjects where slug = 'algebra'), 12, 36, 'Понятие предела функции в точке $\lim_{x \to x_0} f(x)$, раскрытие неопределенностей $[0/0]$ и $[\infty/\infty]$, первый замечательный предел $\lim_{x \to 0} \frac{\sin x}{x} = 1$.', 'Funkcijas robeža punktā, nenoteiktību $[0/0]$ un $[\infty/\infty]$ novēršana, pirmā ievērojamā robeža $\lim_{x \to 0} \frac{\sin x}{x} = 1$.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Определение производной и её геометрический смысл', 'Atvasinājuma definīcija un tā ģeometriskā jēga', 'augst-atvasinajuma-definicija-geometriska-jega', (select id from public.subjects where slug = 'algebra'), 12, 37, 'Производная как предел отношения приращений $f''(x) = \lim_{\Delta x \to 0} \frac{\Delta y}{\Delta x}$, угловой коэффициент касательной $k = f''(x_0) = \tan \alpha$, механический смысл (мгновенная скорость).', 'Atvasinājuma definīcija, pieskares virziena koeficients $k = f''(x_0) = \tan \alpha$, momentānais ātrums.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Правила и формулы дифференцирования', 'Diferencēšanas likumi un formulas', 'augst-diferencesanas-likumi-formulas', (select id from public.subjects where slug = 'algebra'), 12, 38, 'Таблица производных ($x^n, e^x, \ln x, \sin x, \cos x$), производная суммы, произведения $(uv)''$, частного $(u/v)''$, производная сложной функции $f(g(x))''$.', 'Atvasinājumu tabula, reizinājuma un dalījuma diferencēšana, saliktas funkcijas atvasinājums.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Касательная к графику функции', 'Pieskare funkcijas grafikam', 'augst-pieskare-grafikam', (select id from public.subjects where slug = 'algebra'), 12, 39, 'Уравнение касательной $y = f(x_0) + f''(x_0)(x - x_0)$, параллельность касательной заданной прямой, нахождение точек касания.', 'Pieskares vienādojums $y = f(x_0) + f''(x_0)(x - x_0)$, pieskares paralelitāte dotajai taisnei.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Исследование функций с помощью производной', 'Funkciju pētīšana ar atvasinājumu: monotonitāte un ekstrēmi', 'augst-funkciju-petisana-ar-atvasinajumu', (select id from public.subjects where slug = 'algebra'), 12, 40, 'Критические (стационарные) точки $f''(x) = 0$, достаточные признаки максимума и минимума (смена знака производной), выпуклость и точки перегиба $f''''(x) = 0$.', 'Kritiskie punkti $f''(x) = 0$, ekstrēmu noteikšana, ieliekums, izliekums un pārliekuma punkti $f''''(x) = 0$.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Прикладные задачи на оптимизацию', 'Lietišķi optimizācijas uzdevumi', 'augst-lietiski-optimizacijas-uzdevumi', (select id from public.subjects where slug = 'algebra'), 12, 41, 'Нахождение наименьшего и наибольшего значения функции на отрезке, составление целевой функции, оптимизация расхода материалов и прибыли.', 'Lielākā un mazākā vērtība slēgtā intervālā, mērķfunkcijas sastādīšana, izmaksu un materiālu optimizācija.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Первообразная и неопределенный интеграл', 'Primitīvā funkcija un nenoteiktais integrālis', 'augst-primitiva-funkcija-integraliss', (select id from public.subjects where slug = 'algebra'), 12, 42, 'Определение первообразной $F''(x) = f(x)$, неопределенный интеграл $\int f(x)dx = F(x) + C$, таблица интегралов, метод замены переменной.', 'Primitīvā funkcija, nenoteiktā integrāļa definīcija, integrāļu tabula, substitūcijas metode.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Определенный интеграл и формула Ньютона–Лейбница', 'Noteiktais integrālis un Ņūtona–Leibnica formula', 'augst-noteiktais-integralis-nutona-leibnica', (select id from public.subjects where slug = 'algebra'), 12, 43, 'Геометрический смысл определенного интеграла, формула $\int_a^b f(x)dx = F(b) - F(a)$, свойства определенного интеграла.', 'Noteiktā integrāļa ģeometriskā jēga, Ņūtona–Leibnica formula $\int_a^b f(x)dx = F(b) - F(a)$, īpašības.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Вычисление площадей и объемов с помощью интеграла', 'Laukumu un tilpumu aprēķināšana ar integrāli', 'augst-laukumi-tilpumi-integralis', (select id from public.subjects where slug = 'algebra'), 12, 44, 'Площадь криволинейной трапеции $S = \int_a^b (f_1(x) - f_2(x))dx$, объем тела вращения вокруг оси $Ox$: $V = \pi \int_a^b f(x)^2 dx$.', 'Liekliniju trapeces laukums, rotācijas ķermeņa tilpums $V = \pi \int_a^b f(x)^2 dx$.')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('Применение интеграла в физике', 'Integrāļa lietojums fizikā', 'augst-integrala-lietojums-fizika', (select id from public.subjects where slug = 'algebra'), 12, 45, 'Путь по переменной скорости $s = \int_{t_1}^{t_2} v(t)dt$, работа переменной силы $A = \int F(x)dx$ (растяжение пружины по закону Гука).', 'Noietā ceļa aprēķināšana ar mainīgu ātrumu, spēka padarītais darbs (Huka likums).')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;

-- 3. Вставка типовых задач высшего уровня и привязка кросс-тегов
do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = 'augst-iracionalie-vienadojumi';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Решение иррационального уравнения с проверкой корней', 'Iracionāla vienādojuma atrisināšana ar sakņu pārbaudi', 'Решите уравнение: $\sqrt{2x + 7} = x + 2$.', 'Atrisiniet vienādojumu: $\sqrt{2x + 7} = x + 2$.', '1) Ограничение правой части: $x + 2 \ge 0 \implies x \ge -2$.
2) Возводим обе части в квадрат: $2x + 7 = (x + 2)^2 = x^2 + 4x + 4$.
3) Приводим уравнение к стандартному квадратному виду: $x^2 + 2x - 3 = 0$.
4) Корни по теореме Виета: $x_1 = 1, x_2 = -3$.
5) С учётом условия $x \ge -2$ корень $x_2 = -3$ является посторонним. Единственный корень: $x = 1$.', '1) Saknes vērtība ir nenegatīva, tātad labajai pusei jābūt $x + 2 \ge 0 \implies x \ge -2$.
2) Kāpina abas puses kvadrātā: $2x + 7 = x^2 + 4x + 4$.
3) Pārnes locekļus: $x^2 + 2x - 3 = 0$.
4) Saknes ir $x_1 = 1$ un $x_2 = -3$.
5) Tā kā $x \ge -2$, derīgā sakne ir tikai $x = 1$ ($x = -3$ ir blakussakne).', '1', 'Средний', 1, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'vienadojumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
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
  select id into v_topic_id from public.topics where slug = 'augst-logaritmiskie-vienadojumi-sistemas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Логарифмическое неравенство с переменным основанием', 'Logaritmiskā nevienādība ar mainīgu bāzi', 'Решите неравенство: $\log_x(3x - 2) \le 2$.', 'Atrisiniet nevienādību: $\log_x(3x - 2) \le 2$.', '1) ОДЗ: $x > 0$, $x \ne 1$, $3x - 2 > 0 \implies x > \frac{2}{3}$ и $x \ne 1$.
2) Случай 1: $0 < x < 1$ (то есть $\frac{2}{3} < x < 1$). Знак меняется: $3x - 2 \ge x^2 \implies x^2 - 3x + 2 \le 0 \implies (x - 1)(x - 2) \le 0 \implies x \in [1; 2]$. Пересечение со случаем 1 пусто: решений нет, но граничные условия показывают при $x \in (\frac{2}{3}; 1)$ неравенство верно.
3) Метод рационализации: $(x - 1)(3x - 2 - x^2) \le 0 \implies (x - 1)(x^2 - 3x + 2) \ge 0 \implies (x - 1)^2(x - 2) \ge 0$.
Так как $(x - 1)^2 > 0$ при $x \ne 1$, остаётся $x - 2 \ge 0 \implies x \ge 2$.
А при $x \in (\frac{2}{3}; 1)$ множитель $(x-1)$ отрицателен, поэтому исходное отношение выполнено.
Ответ: $x \in (\frac{2}{3}; 1) \cup [2; +\infty)$.', '1) Definīcijas kopa: $x > 0, x \ne 1, 3x - 2 > 0 \implies x \in (\frac{2}{3}; 1) \cup (1; +\infty)$.
2) Racionalizācijas metode: $(x - 1)(3x - 2 - x^2) \le 0 \implies (x - 1)(x^2 - 3x + 2) \ge 0 \implies (x - 1)^2(x - 2) \ge 0$.
3) Tā kā $(x - 1)^2 \ge 0$, tad $x - 2 \ge 0 \implies x \ge 2$. Pārbaudot intervālu $(\frac{2}{3}; 1)$, iegūst, ka tas arī ir atrisinājums.
Atbilde: $x \in (\frac{2}{3}; 1) \cup [2; +\infty)$.', '(2/3; 1) U [2; +inf)', 'Сложный', 2, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'logaritmi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
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
  select id into v_topic_id from public.topics where slug = 'augst-polinomu-dalisana-bezu';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Разложение многочлена 3-й степени с применением теоремы Безу', 'Trešās pakāpes polinoma sadalīšana reizinātājos ar Bezū teorēmu', 'Найдите все действительные корни многочлена $P(x) = x^3 - 4x^2 + x + 6$.', 'Atrodiet visas polinoma $P(x) = x^3 - 4x^2 + x + 6$ reālās saknes.', '1) Возможные целые корни — делители свободного члена $6$: $\pm 1, \pm 2, \pm 3, \pm 6$.
2) Проверяем $x = -1$: $P(-1) = (-1)^3 - 4(-1)^2 + (-1) + 6 = -1 - 4 - 1 + 6 = 0$. Значит, $x = -1$ — корень.
3) Делим $P(x)$ на $(x + 1)$: $x^3 - 4x^2 + x + 6 = (x + 1)(x^2 - 5x + 6)$.
4) Корни квадратного трехчлена $x^2 - 5x + 6 = 0$: $x_2 = 2, x_3 = 3$.
Ответ: $-1; 2; 3$.', '1) Iespējamās veselās saknes ir skaitļa 6 dalītāji: $\pm 1, \pm 2, \pm 3, \pm 6$.
2) Pārbauda $x = -1$: $P(-1) = -1 - 4 - 1 + 6 = 0$, tātad $x = -1$ ir sakne.
3) Izdala polinomu ar $(x + 1)$: $P(x) = (x + 1)(x^2 - 5x + 6)$.
4) Kvadrātvienādojuma $x^2 - 5x + 6 = 0$ saknes ir $x = 2$ un $x = 3$.
Atbilde: $-1; 2; 3$.', '-1; 2; 3', 'Средний', 3, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-nenoteikto-koeficientu-metode';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Разложение дроби на простейшие методом неопределенных коэффициентов', 'Daļas sadalīšana vienkāršākajās pamatdaļās', 'Найдите коэффициенты $A$ и $B$ такие, что для всех $x \ne 1, x \ne 3$: $\frac{4x - 2}{(x - 1)(x - 3)} = \frac{A}{x - 1} + \frac{B}{x - 3}$.', 'Nosakiet koeficientus $A$ un $B$, lai visiem $x \ne 1, x \ne 3$ izpildītos vienādība: $\frac{4x - 2}{(x - 1)(x - 3)} = \frac{A}{x - 1} + \frac{B}{x - 3}$.', '1) Приводим правую часть к общему знаменателю: $\frac{A(x - 3) + B(x - 1)}{(x - 1)(x - 3)} = \frac{(A + B)x - (3A + B)}{(x - 1)(x - 3)}$.
2) Приравниваем коэффициенты при одинаковых степенях $x$:
$\begin{cases} A + B = 4 \\ 3A + B = 2 \end{cases}$.
3) Вычитаем первое из второго: $2A = -2 \implies A = -1$.
4) Находим $B$: $B = 4 - A = 4 - (-1) = 5$.
Ответ: $A = -1, B = 5$.', '1) Vienādo labo pusi ar kopsaucēju: $A(x - 3) + B(x - 1) = (A + B)x - (3A + B)$.
2) Pielīdzina koeficientus: $\begin{cases} A + B = 4 \\ 3A + B = 2 \end{cases}$.
3) Atņem pirmo vienādojumu no otrā: $2A = -2 \implies A = -1$.
4) Aprēķina $B = 4 - (-1) = 5$.
Atbilde: $A = -1, B = 5$.', 'A = -1, B = 5', 'Средний', 4, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-vienadojumi-parametri';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Число решений квадратного уравнения с параметром', 'Kvadrātvienādojuma sakņu skaits atkarībā no parametra', 'При каких значениях параметра $a$ уравнение $(a - 1)x^2 + 2(a - 1)x + 3 = 0$ имеет ровно одно действительное решение?', 'Kādām parametra $a$ vērtībām vienādojumam $(a - 1)x^2 + 2(a - 1)x + 3 = 0$ ir tieši viena reāla sakne?', '1) Случай 1 (линейный): если $a - 1 = 0 \implies a = 1$, то уравнение принимает вид $0 \cdot x^2 + 0 \cdot x + 3 = 0$ ($3 = 0$ — решений нет). Значит, $a = 1$ не подходит для одного решения.
2) Случай 2 (квадратный): $a \ne 1$. Уравнение имеет одно решение, когда дискриминант равен нулю ($D = 0$).
$D = (2(a - 1))^2 - 4(a - 1) \cdot 3 = 4(a - 1)^2 - 12(a - 1) = 4(a - 1)((a - 1) - 3) = 4(a - 1)(a - 4)$.
3) $D = 0 \implies a = 1$ (исключено условием $a \ne 1$) или $a = 4$.
При $a = 4$: $3x^2 + 6x + 3 = 0 \implies 3(x + 1)^2 = 0 \implies x = -1$ (ровно одно решение).
Ответ: $a = 4$.', '1) Ja $a = 1$, vienādojums ir $3 = 0$ (atrisinājuma nav).
2) Ja $a \ne 1$, vienādojumam ir tieši viena sakne, ja diskriminants $D = 0$.
$D = 4(a - 1)^2 - 12(a - 1) = 4(a - 1)(a - 4) = 0$.
3) Tā kā $a \ne 1$, tad $a - 4 = 0 \implies a = 4$.
Atbilde: $a = 4$.', 'a = 1; a = 4', 'Сложный', 5, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-kompleksi-vienadojumu-panemieni';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Решение уравнения методом мажорант (оценки)', 'Vienādojuma risināšana ar mažorantu (novērtēšanas) metodi', 'Решите уравнение: $x^2 + 4x + 5 = \cos(\pi x)$.', 'Atrisiniet vienādojumu: $x^2 + 4x + 5 = \cos(\pi x)$.', '1) Выделим полный квадрат в левой части: $x^2 + 4x + 5 = (x + 2)^2 + 1 \ge 1$.
2) Оценим правую часть: $\cos(\pi x) \le 1$.
3) Равенство возможно только тогда, когда обе части одновременно равны $1$:
$(x + 2)^2 + 1 = 1 \implies x = -2$.
4) Проверим правую часть при $x = -2$: $\cos(-2\pi) = \cos(2\pi) = 1$. Равенство выполняется!
Ответ: $x = -2$.', '1) Kreisās puses novērtējums: $(x + 2)^2 + 1 \ge 1$.
2) Labās puses novērtējums: $\cos(\pi x) \le 1$.
3) Vienādība iespējama vienīgi tad, ja abas puses ir vienādas ar 1: $(x + 2)^2 = 0 \implies x = -2$.
4) Pārbaude: $\cos(-2\pi) = 1$. Vienādība ir spēkā.
Atbilde: $x = -2$.', '-2', 'Сложный', 6, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-inversa-funkcija';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Нахождение формулы обратной функции', 'Inversās funkcijas formulas atrašana', 'Найдите обратную функцию для $f(x) = \frac{2x + 1}{x - 3}$, где $x \ne 3$.', 'Atrodiet funkcijas $f(x) = \frac{2x + 1}{x - 3}$ ($x \ne 3$) inverso funkciju $f^{-1}(x)$.', '1) Запишем $y = \frac{2x + 1}{x - 3}$.
2) Выражаем $x$ через $y$: $y(x - 3) = 2x + 1 \implies yx - 3y = 2x + 1$.
3) Группируем слагаемые с $x$: $yx - 2x = 3y + 1 \implies x(y - 2) = 3y + 1 \implies x = \frac{3y + 1}{y - 2}$.
4) Меняем переменные: $f^{-1}(x) = \frac{3x + 1}{x - 2}$ при $x \ne 2$.', '1) $y = \frac{2x + 1}{x - 3}$.
2) Pārveido: $y(x - 3) = 2x + 1 \implies yx - 2x = 3y + 1$.
3) Izsaka $x$: $x = \frac{3y + 1}{y - 2}$.
4) Inversā funkcija ir $f^{-1}(x) = \frac{3x + 1}{x - 2}$.', 'f^(-1)(x) = (3x + 1)/(x - 2)', 'Средний', 7, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-virknes-monotonitate-robeza';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Вычисление предела числовой последовательности', 'Skaitļu virknes robežas aprēķināšana', 'Вычислите предел последовательности: $\lim_{n \to \infty} \frac{6n^2 - 5n + 1}{2n^2 + 3n - 4}$.', 'Aprēķiniet virknes robežu: $\lim_{n \to \infty} \frac{6n^2 - 5n + 1}{2n^2 + 3n - 4}$.', '1) Делим числитель и знаменатель на высшую степень $n^2$:
$\lim_{n \to \infty} \frac{6 - \frac{5}{n} + \frac{1}{n^2}}{2 + \frac{3}{n} - \frac{4}{n^2}}$.
2) Так как при $n \to \infty$ слагаемые $\frac{1}{n}, \frac{1}{n^2} \to 0$, получаем $\frac{6 - 0 + 0}{2 + 0 - 0} = \frac{6}{2} = 3$.', '1) Izdala skaitītāju un saucēju ar $n^2$: $\lim_{n \to \infty} \frac{6 - 5/n + 1/n^2}{2 + 3/n - 4/n^2}$.
2) Tā kā $1/n \to 0$, robeža ir $\frac{6}{2} = 3$.', '3', 'Лёгкий', 8, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'virknes';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'matematiska-analize';
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
  select id into v_topic_id from public.topics where slug = 'augst-bezgaligi-dilstosa-progresija';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Сумма бесконечно убывающей геометрической прогрессии', 'Bezgalīgi dilstošas ģeometriskās progresijas summa', 'Найдите сумму бесконечной геометрической прогрессии: $12 + 4 + \frac{4}{3} + \frac{4}{9} + \dots$.', 'Aprēķiniet bezgalīgi dilstošās ģeometriskās progresijas summu: $12 + 4 + \frac{4}{3} + \frac{4}{9} + \dots$.', '1) Первый член $b_1 = 12$.
2) Знаменатель прогрессии: $q = \frac{4}{12} = \frac{1}{3}$. Так как $|q| < 1$, прогрессия сходится.
3) Сумма: $S = \frac{b_1}{1 - q} = \frac{12}{1 - 1/3} = \frac{12}{2/3} = 12 \cdot \frac{3}{2} = 18$.', '1) Pirmais loceklis $b_1 = 12$, kvocients $q = \frac{4}{12} = \frac{1}{3}$.
2) Tā kā $|q| < 1$, lieto summas formulu: $S = \frac{b_1}{1 - q} = \frac{12}{1 - 1/3} = 18$.', '18', 'Лёгкий', 9, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-skaitlis-e-eksponenciali-procesi';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Непрерывный экспоненциальный распад вещества', 'Vielas radioaktīvās sabrukšanas laika aprēķins', 'Масса радиоактивного изотопа уменьшается по закону $m(t) = m_0 e^{-0{,}05 t}$ ($t$ в годах). Через сколько лет масса изотопа уменьшится в $2$ раза (найдите период полураспада, округлив до десятых, приняв $\ln 2 \approx 0{,}693$)?', 'Radioaktīvā izotopa masa samazinās pēc likuma $m(t) = m_0 e^{-0{,}05 t}$ ($t$ gados). Pēc cik gadiem masa samazināsies 2 reizes (aprēķiniet pussabrukšanas periodu, ja $\ln 2 \approx 0{,}693$)?', '1) Составляем уравнение: $\frac{m(t)}{m_0} = 0{,}5 \implies e^{-0{,}05 t} = 0{,}5$.
2) Логарифмируем по основанию $e$: $-0{,}05 t = \ln(0{,}5) = -\ln 2$.
3) Находим $t$: $t = \frac{\ln 2}{0{,}05} = \frac{0{,}693}{0{,}05} = 13{,}86 \approx 13{,}9$ лет.', '1) $e^{-0{,}05 t} = 0{,}5 \implies -0{,}05 t = -\ln 2$.
2) $t = \frac{\ln 2}{0{,}05} \approx \frac{0{,}693}{0{,}05} = 13{,}86 \approx 13{,}9$ gadi.', '13.9', 'Средний', 10, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'modelesana';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'logaritmi';
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
  select id into v_topic_id from public.topics where slug = 'augst-funkcijas-nepartrauktiba';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Условие непрерывности кусочно-заданной функции', 'Gabaliem uzdotas funkcijas nepārtrauktības nosacījums', 'При каком значении параметра $a$ функция $f(x) = \begin{cases} 2x + a, & x \le 1 \\ x^2 + 3, & x > 1 \end{cases}$ является непрерывной во всех точках?', 'Kādai parametra $a$ vērtībai funkcija $f(x) = \begin{cases} 2x + a, & x \le 1 \\ x^2 + 3, & x > 1 \end{cases}$ ir nepārtraukta visā definīcijas apgabalā?', '1) Функция составлена из многочленов, поэтому непрерывна при $x < 1$ и $x > 1$. Точка возможного разрыва — $x = 1$.
2) Значение функции и предел слева: $\lim_{x \to 1^-} f(x) = f(1) = 2(1) + a = 2 + a$.
3) Предел справа: $\lim_{x \to 1^+} f(x) = 1^2 + 3 = 4$.
4) Для непрерывности пределы должны совпадать: $2 + a = 4 \implies a = 2$.', '1) Pārbauda nepārtrauktību sadures punktā $x = 1$.
2) Robeža no kreisās puses: $f(1) = 2 \cdot 1 + a = 2 + a$.
3) Robeža no labās puses: $\lim_{x \to 1^+} (x^2 + 3) = 4$.
4) Funkcija ir nepārtraukta, ja abas robežas sakrīt: $2 + a = 4 \implies a = 2$.', '2', 'Средний', 11, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'matematiska-analize';
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
  select id into v_topic_id from public.topics where slug = 'augst-dalveida-racionalas-funkcijas-petisana';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Нахождение наклонной асимптоты дробно-рациональной функции', 'Daļveida funkcijas slīpās asimptotas atrašana', 'Найдите уравнение наклонной асимптоты графика функции $f(x) = \frac{2x^2 + 3x - 1}{x + 1}$.', 'Atrodiet funkcijas $f(x) = \frac{2x^2 + 3x - 1}{x + 1}$ slīpās asimptotas vienādojumu.', '1) Разделим числитель на знаменатель «уголком»:
$\frac{2x^2 + 3x - 1}{x + 1} = 2x + 1 - \frac{2}{x + 1}$.
2) При $x \to \pm\infty$ остаток $-\frac{2}{x + 1} \to 0$.
3) Следовательно, наклонная асимптота задается уравнением $y = 2x + 1$.', '1) Izdala daļas skaitītāju ar saucēju: $\frac{2x^2 + 3x - 1}{x + 1} = 2x + 1 - \frac{2}{x + 1}$.
2) Kad $x \to \infty$, atlikums tiecas uz nulli: $\lim_{x \to \infty} \frac{-2}{x + 1} = 0$.
3) Slīpās asimptotas vienādojums ir $y = 2x + 1$.', 'y = 2x + 1', 'Средний', 12, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-lenka-tangenss-kotangenss';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Область определения функции тангенса', 'Tangensa funkcijas definīcijas kopas noteikšana', 'Найдите область определения функции $y = \tan(2x - \frac{\pi}{4})$.', 'Nosakiet funkcijas $y = \tan(2x - \frac{\pi}{4})$ definīcijas kopu.', '1) Тангенс не определен там, где аргумент равен $\frac{\pi}{2} + \pi k, k \in \mathbb{Z}$.
2) Составляем условие: $2x - \frac{\pi}{4} \ne \frac{\pi}{2} + \pi k$.
3) Переносим: $2x \ne \frac{3\pi}{4} + \pi k \implies x \ne \frac{3\pi}{8} + \frac{\pi k}{2}, k \in \mathbb{Z}$.', '1) Tangenss nav definēts, ja arguments ir $\frac{\pi}{2} + \pi k$.
2) $2x - \frac{\pi}{4} \ne \frac{\pi}{2} + \pi k \implies 2x \ne \frac{3\pi}{4} + \pi k$.
3) $x \ne \frac{3\pi}{8} + \frac{\pi k}{2}, k \in \mathbb{Z}$.', 'x != (3pi)/8 + (pi*k)/2', 'Средний', 13, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-apgrieztas-trig-funkcijas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Вычисление значения выражения с аркфункциями', 'Arktriogonometriskās izteiksmes vērtības aprēķināšana', 'Вычислите точное значение выражения: $\sin(\arccos(-\frac{3}{5}))$.', 'Aprēķiniet izteiksmes precīzo vērtību: $\sin(\arccos(-\frac{3}{5}))$.', '1) Пусть $\alpha = \arccos(-\frac{3}{5})$. По определению $\alpha \in [0; \pi]$, а так как аргумент отрицателен, $\alpha \in (\frac{\pi}{2}; \pi]$ (вторая четверть).
2) Во второй четверти синус положителен: $\sin \alpha = +\sqrt{1 - \cos^2 \alpha}$.
3) Подставляем: $\sin \alpha = \sqrt{1 - (-\frac{3}{5})^2} = \sqrt{1 - \frac{9}{25}} = \sqrt{\frac{16}{25}} = \frac{4}{5}$.', '1) Apzīmē $\alpha = \arccos(-\frac{3}{5})$, kur $\alpha$ pieder II ceturksnim.
2) Otrajā ceturksnī sinuss ir pozitīvs: $\sin \alpha = \sqrt{1 - \cos^2 \alpha}$.
3) $\sin \alpha = \sqrt{1 - 9/25} = \frac{4}{5}$.', '4/5', 'Средний', 14, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-trigonometriskas-nevienadibas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Решение тригонометрического неравенства на единичной окружности', 'Trigonometriskās nevienādības risināšana ar vienības riņķi', 'Решите неравенство: $\cos x > -\frac{1}{2}$. Запишите общее решение.', 'Atrisiniet nevienādību: $\cos x > -\frac{1}{2}$. Pierakstiet vispārīgo atrisinājumu.', '1) На единичной окружности абсцисса точки должна быть строго больше $-\frac{1}{2}$.
2) Точки пересечения с вертикалью $x = -\frac{1}{2}$ соответствуют углам $\frac{2\pi}{3}$ и $-\frac{2\pi}{3}$.
3) Дуга, лежащая правее этой прямой, охватывает угол от $-\frac{2\pi}{3}$ до $\frac{2\pi}{3}$.
4) С учетом периода $2\pi k$: $x \in \left(-\frac{2\pi}{3} + 2\pi k; \frac{2\pi}{3} + 2\pi k\right), k \in \mathbb{Z}$.', '1) Vienības riņķī meklē loku, kur abscisa ir lielāka par $-1/2$.
2) Robežleņķi ir $\pm \frac{2\pi}{3}$.
3) Vispārīgais atrisinājums: $x \in \left(-\frac{2\pi}{3} + 2\pi k; \frac{2\pi}{3} + 2\pi k\right), k \in \mathbb{Z}$.', '(- (2pi)/3 + 2pi*k; (2pi)/3 + 2pi*k)', 'Средний', 15, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-trig-vienadojumu-sistemas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Решение системы двух тригонометрических уравнений', 'Divu trigonometrisko vienādojumu sistēmas atrisināšana', 'Найдите решения системы уравнений: $\begin{cases} \sin x \cos y = \frac{3}{4} \\ \cos x \sin y = \frac{1}{4} \end{cases}$ для углов $x, y \in [0; \pi]$.', 'Atrisiniet sistēmu: $\begin{cases} \sin x \cos y = \frac{3}{4} \\ \cos x \sin y = \frac{1}{4} \end{cases}$, ja $x, y \in [0; \pi]$.', '1) Складываем уравнения: $\sin x \cos y + \cos x \sin y = \sin(x + y) = \frac{3}{4} + \frac{1}{4} = 1$.
Отсюда $x + y = \frac{\pi}{2}$ (так как $x, y \in [0; \pi]$).
2) Вычитаем второе уравнение из первого: $\sin x \cos y - \cos x \sin y = \sin(x - y) = \frac{3}{4} - \frac{1}{4} = \frac{1}{2}$.
Отсюда $x - y = \frac{\pi}{6}$.
3) Складываем: $2x = \frac{\pi}{2} + \frac{\pi}{6} = \frac{2\pi}{3} \implies x = \frac{\pi}{3}$.
Тогда $y = \frac{\pi}{2} - \frac{\pi}{3} = \frac{\pi}{6}$.', '1) Saskaita vienādojumus: $\sin(x + y) = 1 \implies x + y = \frac{\pi}{2}$.
2) Atņem vienādojumus: $\sin(x - y) = \frac{1}{2} \implies x - y = \frac{\pi}{6}$.
3) Atrisinot lineāro sistēmu: $x = \frac{\pi}{3}, y = \frac{\pi}{6}$.', 'x = pi/3, y = pi/6', 'Сложный', 16, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-harmoniskas-svarstibas-modeli';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Определение параметров колебательного процесса по графической модели', 'Svārstību procesa parametru noteikšana', 'Колебательный процесс описывается формулой $y(t) = 5 \sin(10\pi t + \frac{\pi}{3})$. Найдите амплитуду колебаний $A$, частоту $\nu$ (в Гц) и период $T$ (в секундах).', 'Svārstību process doti ar funkciju $y(t) = 5 \sin(10\pi t + \frac{\pi}{3})$. Nosakiet svārstību amplitūdu $A$, frekvenci $\nu$ (Hz) un periodu $T$ (s).', '1) Амплитуда: коэффициент перед синусом $A = 5$.
2) Циклическая частота $\omega = 10\pi$.
3) Период колебаний: $T = \frac{2\pi}{\omega} = \frac{2\pi}{10\pi} = \frac{1}{5} = 0{,}2\text{ с}$.
4) Частота: $\nu = \frac{1}{T} = \frac{1}{0{,}2} = 5\text{ Гц}$.', '1) Amplitūda $A = 5$.
2) Cikliskā frekvence $\omega = 10\pi$.
3) Periods $T = \frac{2\pi}{10\pi} = 0{,}2\text{ s}$.
4) Frekvence $\nu = \frac{1}{T} = 5\text{ Hz}$.', 'A = 5, nu = 5, T = 0.2', 'Средний', 17, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-sakaribas-trijsturos-padzilinati';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Свойство биссектрисы угла треугольника', 'Trijstūra bisektrises īpašība', 'В треугольнике $ABC$ стороны $AB = 10\text{ см}$ и $AC = 15\text{ см}$, а сторона $BC = 20\text{ см}$. Биссектриса угла $A$ делит сторону $BC$ на отрезки $BD$ и $DC$. Найдите длину отрезка $BD$.', 'Trijstūrī $ABC$ malas ir $AB = 10\text{ cm}$, $AC = 15\text{ cm}$ un $BC = 20\text{ cm}$. Leņķa $A$ bisektrise krusto malu $BC$ punktā $D$. Aprēķiniet nogriežņa $BD$ garumu.', '1) По свойству биссектрисы: $\frac{BD}{DC} = \frac{AB}{AC} = \frac{10}{15} = \frac{2}{3}$.
2) Пусть $BD = 2x$, тогда $DC = 3x$. Вся сторона $BC = 2x + 3x = 5x = 20$.
3) $x = 4\text{ см}$, следовательно, $BD = 2 \cdot 4 = 8\text{ см}$.', '1) Pēc bisektrises īpašības: $\frac{BD}{DC} = \frac{AB}{AC} = \frac{10}{15} = \frac{2}{3}$.
2) $BD + DC = 2x + 3x = 5x = 20 \implies x = 4$.
3) $BD = 2 \cdot 4 = 8\text{ cm}$.', '8', 'Средний', 18, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-sakaribas-cetrsturos-daudzsturos';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Периметр описанного четырехугольника', 'Apvilkta četrstūra perimetra aprēķināšana', 'Около окружности описан четырехугольник $ABCD$, у которого $AB = 7\text{ см}$ и $CD = 11\text{ см}$. Найдите периметр этого четырехугольника.', 'Ap riņķa līniju apvilkts četrstūris $ABCD$, kura malas ir $AB = 7\text{ cm}$ un $CD = 11\text{ cm}$. Aprēķiniet šī četrstūra perimetru.', '1) В описанном четырехугольнике суммы противоположных сторон равны: $AB + CD = BC + AD$.
2) Сумма первой пары: $7 + 11 = 18\text{ см}$.
3) Сумма второй пары сторон также равна $18\text{ см}$.
4) Периметр: $P = (AB + CD) + (BC + AD) = 18 + 18 = 36\text{ см}$.', '1) Apvilktā četrstūrī pretējo malu summas ir vienādas: $AB + CD = BC + AD = 7 + 11 = 18\text{ cm}$.
2) Perimetrs: $P = 18 + 18 = 36\text{ cm}$.', '36', 'Лёгкий', 19, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-rinka-linija-lenki-nogriezni';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Теорема о касательной и секущей к окружности', 'Pieskares un sekantes teorēmas lietošana', 'Из точки $A$, расположенной вне окружности, проведены касательная $AK$ и секущая, которая пересекает окружность в точках $B$ и $C$. Известно, что $AB = 4\text{ см}$ и $BC = 12\text{ см}$. Найдите длину отрезка касательной $AK$.', 'No punkta $A$ ārpus riņķa līnijas novilkta pieskare $AK$ un sekante $ABC$, kur $AB = 4\text{ cm}$ un $BC = 12\text{ cm}$. Aprēķiniet pieskares nogriežņa $AK$ garumu.', '1) Вся секущая: $AC = AB + BC = 4 + 12 = 16\text{ см}$.
2) По теореме о касательной и секущей: $AK^2 = AB \cdot AC = 4 \cdot 16 = 64$.
3) $AK = \sqrt{64} = 8\text{ см}$.', '1) Sekantes kopējais garums: $AC = 4 + 12 = 16\text{ cm}$.
2) Pēc teorēmas: $AK^2 = AB \cdot AC = 4 \cdot 16 = 64$.
3) $AK = 8\text{ cm}$.', '8', 'Средний', 20, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-geometriskie-parveidojumi-padzilinati';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Координаты образа точки при гомотетии', 'Punkta koordinātas pēc homotētijas', 'Точка $M(5; 7)$ преобразуется гомотетией с центром в точке $S(1; 3)$ и коэффициентом $k = -2$. Найдите координаты полученной точки $M''$.', 'Punkts $M(5; 7)$ tiek pārveidots ar homotētiju, kuras centrs ir $S(1; 3)$ un koeficients $k = -2$. Nosakiet attēla punkta $M''$ koordinātas.', '1) Вектор из центра в точку $M$: $\vec{SM} = (5 - 1; 7 - 3) = (4; 4)$.
2) Умножаем вектор на коэффициент гомотетии $k = -2$: $\vec{SM''} = -2 \cdot (4; 4) = (-8; -8)$.
3) Координаты точки $M''$: $M'' = S + \vec{SM''} = (1 + (-8); 3 + (-8)) = (-7; -5)$.', '1) Vektors no centra: $\vec{SM} = (4; 4)$.
2) Pēc homotētijas: $\vec{SM''} = -2 \cdot (4; 4) = (-8; -8)$.
3) Punkta $M''$ koordinātas: $(1 - 8; 3 - 8) = (-7; -5)$.', '(-7; -5)', 'Средний', 21, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-analitiska-geometrija-taisne-rinkis';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Вычисление расстояния от точки до прямой', 'Attāluma aprēķināšana no punkta līdz taisnei', 'Найдите расстояние от точки $M(2; -1)$ до прямой, заданной уравнением $3x - 4y + 5 = 0$.', 'Aprēķiniet attālumu no punkta $M(2; -1)$ līdz taisnei $3x - 4y + 5 = 0$.', '1) Применяем формулу расстояния от точки до прямой: $d = \frac{|Ax_0 + By_0 + C|}{\sqrt{A^2 + B^2}}$.
2) Подставляем координаты точки $(2; -1)$ и коэффициенты $A = 3, B = -4, C = 5$:
$d = \frac{|3(2) - 4(-1) + 5|}{\sqrt{3^2 + (-4)^2}} = \frac{|6 + 4 + 5|}{\sqrt{25}} = \frac{15}{5} = 3$.', '1) Izmanto attāluma formulu: $d = \frac{|Ax_0 + By_0 + C|}{\sqrt{A^2 + B^2}}$.
2) $d = \frac{|3 \cdot 2 - 4 \cdot (-1) + 5|}{\sqrt{9 + 16}} = \frac{15}{5} = 3$.', '3', 'Средний', 22, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-vektoru-skalarais-uzdevumos';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Косинус угла между диагоналями четырехугольника через векторы', 'Leņķa aprēķināšana starp diviem vektoriem', 'Найдите косинус угла между векторами $\vec{a} = (1; 2)$ и $\vec{b} = (3; 4)$.', 'Aprēķiniet kosinusu leņķim starp vektoriem $\vec{a} = (1; 2)$ un $\vec{b} = (3; 4)$.', '1) Скалярное произведение: $\vec{a} \cdot \vec{b} = 1 \cdot 3 + 2 \cdot 4 = 3 + 8 = 11$.
2) Длины векторов: $|\vec{a}| = \sqrt{1^2 + 2^2} = \sqrt{5}$, $|\vec{b}| = \sqrt{3^2 + 4^2} = 5$.
3) Косинус угла: $\cos \varphi = \frac{\vec{a} \cdot \vec{b}}{|\vec{a}| \cdot |\vec{b}|} = \frac{11}{5\sqrt{5}}$.', '1) Skalārais reizinājums: $\vec{a} \cdot \vec{b} = 1 \cdot 3 + 2 \cdot 4 = 11$.
2) Vektoru moduļi: $|\vec{a}| = \sqrt{5}$, $|\vec{b}| = 5$.
3) $\cos \varphi = \frac{11}{5\sqrt{5}}$.', '11/(5sqrt(5))', 'Средний', 23, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-daudzskaldnu-skelumi-padzilinati';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Площадь сечения правильного тетраэдра', 'Regulāra tetraedra šķēluma laukums', 'Ребро правильного тетраэдра равно $6\text{ см}$. Найдите площадь сечения, проходящего через ребро тетраэдра и середину противоположного ребра.', 'Regulāra tetraedra šķautne ir $6\text{ cm}$. Aprēķiniet laukumu šķēlumam, kas iet caur vienu šķautni un pretējās šķautnes viduspunktu.', '1) Сечением является равнобедренный треугольник, основание которого равно ребру тетраэдра $a = 6\text{ см}$, а боковые стороны — высотам правильных граней: $h = \frac{a\sqrt{3}}{2} = \frac{6\sqrt{3}}{2} = 3\sqrt{3}\text{ см}$.
2) Высота этого сечения к основанию $a$: $H_{sek} = \sqrt{h^2 - (a/2)^2} = \sqrt{(3\sqrt{3})^2 - 3^2} = \sqrt{27 - 9} = \sqrt{18} = 3\sqrt{2}\text{ см}$.
3) Площадь сечения: $S = \frac{1}{2} \cdot 6 \cdot 3\sqrt{2} = 9\sqrt{2}\text{ см}^2$.', '1) Šķēlums ir vienādsānu trijstūris ar pamatu $a = 6\text{ cm}$ un sānu malām $h = \frac{6\sqrt{3}}{2} = 3\sqrt{3}\text{ cm}$.
2) Šķēluma trijstūra augstums: $H = \sqrt{27 - 9} = \sqrt{18} = 3\sqrt{2}\text{ cm}$.
3) Šķēluma laukums: $S = \frac{1}{2} \cdot 6 \cdot 3\sqrt{2} = 9\sqrt{2}\text{ cm}^2$.', '9sqrt(2)', 'Сложный', 24, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-prizmas-cilindra-kombinacijas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Объем правильной призмы, вписанной в цилиндр', 'Cilindrā ievilktas regulāras četrstūra prizmas tilpums', 'В цилиндр с радиусом основания $R = 4\text{ см}$ и высотой $H = 10\text{ см}$ вписана правильная четырехугольная призма. Найдите объем призмы.', 'Cilindrā ar pamata rādiusu $R = 4\text{ cm}$ un augstumu $H = 10\text{ cm}$ ievilkta regulāra četrstūra prizma. Aprēķiniet prizmas tilpumu.', '1) Основание призмы — квадрат, вписанный в круг радиуса $R = 4\text{ см}$. Диагональ квадрата равна диаметру круга: $d = 2R = 8\text{ см}$.
2) Площадь квадрата: $S_{pam} = \frac{d^2}{2} = \frac{64}{2} = 32\text{ см}^2$.
3) Объем призмы: $V = S_{pam} \cdot H = 32 \cdot 10 = 320\text{ см}^3$.', '1) Prizmas pamats ir kvadrāts ar diagonāli $d = 2R = 8\text{ cm}$.
2) Kvadrāta laukums: $S_{pam} = \frac{d^2}{2} = 32\text{ cm}^2$.
3) Prizmas tilpums: $V = S_{pam} \cdot H = 32 \cdot 10 = 320\text{ cm}^3$.', '320', 'Средний', 25, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-konusa-piramidas-kombinacijas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Отношение объемов правильной пирамиды и описанного конуса', 'Regulāras piramīdas un apvilkta konusa tilpumu attiecība', 'Около правильной четырехугольной пирамиды описан конус. Найдите отношение объема пирамиды к объему конуса.', 'Ap regulāru četrstūra piramīdu apvilkts konuss. Aprēķiniet piramīdas un konusa tilpumu attiecību $V_{\text{pir}} / V_{\text{kon}}$.', '1) Высота конуса и пирамиды одинакова: $H$.
2) Радиус основания конуса равен расстоянию от центра квадрата до вершины: $R = \frac{a}{\sqrt{2}} \implies a = R\sqrt{2}$.
3) Площадь основания пирамиды: $S_{\text{кв}} = a^2 = (R\sqrt{2})^2 = 2R^2$.
4) Площадь основания конуса: $S_{\text{круг}} = \pi R^2$.
5) Отношение объемов: $\frac{V_{\text{pir}}}{V_{\text{kon}}} = \frac{\frac{1}{3} S_{\text{кв}} H}{\frac{1}{3} S_{\text{круг}} H} = \frac{2R^2}{\pi R^2} = \frac{2}{\pi}$.', '1) Augstumi ir vienādi. Konusa pamata rādiuss ir kvadrāta apvilktās riņķa līnijas rādiuss: $a = R\sqrt{2}$.
2) $S_{\text{pam}} = 2R^2$, bet riņķa laukums ir $\pi R^2$.
3) Tilpumu attiecība: $\frac{2R^2}{\pi R^2} = \frac{2}{\pi}$.', '2/pi', 'Средний', 26, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-lodes-cilindra-konusa-kombinacijas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Отношение объемов шара и описанного около него цилиндра', 'Lodes un apvilkta cilindra tilpumu attiecība', 'Шар вписан в цилиндр (касается оснований и боковой поверхности). Найдите отношение объема шара к объему цилиндра.', 'Lode ir ievilkta cilindrā (pieskaras pamatiem un sānu virsmai). Aprēķiniet lodes un cilindra tilpumu attiecību $V_{\text{lode}} / V_{\text{cil}}$.', '1) Радиус цилиндра равен радиусу шара $R$, а высота цилиндра равна диаметру шара: $H = 2R$.
2) Объем цилиндра: $V_{\text{cil}} = \pi R^2 H = \pi R^2 (2R) = 2\pi R^3$.
3) Объем шара: $V_{\text{lode}} = \frac{4}{3}\pi R^3$.
4) Отношение: $\frac{V_{\text{lode}}}{V_{\text{cil}}} = \frac{\frac{4}{3}\pi R^3}{2\pi R^3} = \frac{4}{6} = \frac{2}{3}$.', '1) Cilindra augstums ir $H = 2R$.
2) Cilindra tilpums: $V_{\text{cil}} = 2\pi R^3$.
3) Lodes tilpums: $V_{\text{lode}} = \frac{4}{3}\pi R^3$.
4) Attiecība: $\frac{4/3}{2} = \frac{2}{3}$.', '2/3', 'Средний', 27, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-prizmas-piramidas-lodes-kombinacijas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Радиус сферы, описанной около куба', 'Kubam apvilktas sfēras rādiusa aprēķināšana', 'Ребро куба равно $4\text{ см}$. Найдите радиус сферы, описанной около этого куба.', 'Kuba šķautnes garums ir $4\text{ cm}$. Aprēķiniet šim kubam apvilktās sfēras rādiusu.', '1) Главная диагональ куба со стороной $a$ равна $D = a\sqrt{3} = 4\sqrt{3}\text{ см}$.
2) Диагональ куба является диаметром описанной сферы: $2R = D = 4\sqrt{3}$.
3) Радиус сферы: $R = \frac{4\sqrt{3}}{2} = 2\sqrt{3}\text{ см}$.', '1) Kuba telpiskā diagonāle ir $D = a\sqrt{3} = 4\sqrt{3}\text{ cm}$.
2) Sfēras rādiuss ir puse no kuba diagonāles: $R = \frac{D}{2} = 2\sqrt{3}\text{ cm}$.', '2sqrt(3)', 'Лёгкий', 28, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-kombinatorika-paskala-trijsturis';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Сумма биномиальных коэффициентов строки треугольника Паскаля', 'Paskāla trijstūra rindas koeficientu summa', 'Найдите сумму всех биномиальных коэффициентов в $8$-й строке треугольника Паскаля ($C_8^0 + C_8^1 + \dots + C_8^8$).', 'Aprēķiniet visu binomiālo koeficientu summu Paskāla trijstūra 8. rindā ($C_8^0 + C_8^1 + \dots + C_8^8$).', 'По свойству биномиальных коэффициентов сумма элементов $n$-й строки равна $2^n$. Для $n = 8$: $S = 2^8 = 256$.', 'Paskāla trijstūra $n$-tās rindas koeficientu summa ir $2^n$. Ja $n = 8$, tad $S = 2^8 = 256$.', '256', 'Лёгкий', 29, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-nutona-binoms';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Нахождение члена разложения бинома, не содержащего переменную', 'No $x$ neatkarīgā locekļa atrašana binoma izvirzījumā', 'В разложении бинома $(x^2 + \frac{1}{x})^6$ найдите член, не содержащий переменную $x$ (свободный член).', 'Binoma $(x^2 + \frac{1}{x})^6$ izvirzījumā atrodiet locekli, kas nesatur mainīgo $x$.', '1) Общий член разложения: $T_{k+1} = C_6^k (x^2)^{6-k} (x^{-1})^k = C_6^k x^{12 - 2k} x^{-k} = C_6^k x^{12 - 3k}$.
2) Член не содержит $x$, если показатель степени равен нулю: $12 - 3k = 0 \implies 3k = 12 \implies k = 4$.
3) Вычисляем коэффициент: $T_5 = C_6^4 = C_6^2 = \frac{6 \cdot 5}{2 \cdot 1} = 15$.', '1) Vispārīgais loceklis: $T_{k+1} = C_6^k (x^2)^{6-k} (x^{-1})^k = C_6^k x^{12 - 3k}$.
2) Loceklis nesatur $x$, ja $12 - 3k = 0 \implies k = 4$.
3) $C_6^4 = C_6^2 = \frac{6 \cdot 5}{2} = 15$.', '15', 'Средний', 30, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'kombinatorika';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
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
  select id into v_topic_id from public.topics where slug = 'augst-matematiskas-logikas-elementi';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Отрицание высказывания с квантором всеобщности', 'Izteikuma ar kvantoru nolieguma veidošana', 'Сформулируйте отрицание высказывания: «Для каждого действительного числа $x$ выполняется $x^2 > 0$». Истинно ли исходное высказывание или его отрицание?', 'Uzrakstiet izteikuma «Katram reālam skaitlim $x$ izpildās $x^2 > 0$» noliegumu. Kurš no izteikumiem ir patiess?', '1) Исходное высказывание: $\forall x \in \mathbb{R} : x^2 > 0$.
2) Отрицание: $\exists x \in \mathbb{R} : x^2 \le 0$.
3) При $x = 0$ имеем $0^2 = 0 \le 0$, что истинно. Значит, исходное утверждение ложно, а его отрицание истинно.', '1) Izteikuma noliegums: $\exists x \in \mathbb{R} : x^2 \le 0$ («Eksistē tāds reāls skaitlis $x$, kuram $x^2 \le 0$»).
2) Pie $x = 0$ iegūst $0^2 \le 0$, tātad noliegums ir patiess, bet sākotnējais apgalvojums ir aplams.', 'Eksistē x tāds, ka x^2 <= 0 (patiess pie x = 0)', 'Лёгкий', 31, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-matematiskas-indukcijas-princips';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Доказательство делимости методом математической индукции', 'Dalāmības pierādīšana ar matemātiskās indukcijas metodi', 'Докажите, что для любого натурального числа $n$ выражение $4^n - 1$ делится на $3$. Каков индукционный шаг?', 'Pierādiet, ka visiem naturāliem $n$ izteiksme $4^n - 1$ dalās ar $3$. Kāds ir indukcijas pārejas solis?', '1) База: при $n = 1$: $4^1 - 1 = 3$, делится на $3$.
2) Предположение: пусть при $n = k$ выражение $4^k - 1 = 3m, m \in \mathbb{N}$.
3) Шаг: при $n = k + 1$ имеем $4^{k+1} - 1 = 4 \cdot 4^k - 1 = 4(4^k - 1) + 3 = 4 \cdot 3m + 3 = 3(4m + 1)$, что кратно $3$.
Утверждение доказано для всех $n \in \mathbb{N}$.', '1) Bāze: pie $n = 1$: $4^1 - 1 = 3$ dalās ar 3.
2) Pieņēmums: $4^k - 1 = 3m$.
3) Pāreja: $4^{k+1} - 1 = 4 \cdot 4^k - 1 = 4(4^k - 1) + 3 = 4 \cdot 3m + 3 = 3(4m + 1)$, kas dalās ar 3.', '4^(k+1) - 1 = 4*(4^k - 1) + 3', 'Средний', 32, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-bernulli-formula-sadalijumi';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Вероятность ровно трех успехов по формуле Бернулли', 'Varbūtības aprēķināšana pēc Bernulli formulas', 'Вероятность попадания в цель при одном выстреле равна $p = 0{,}6$. Производится $5$ независимых выстрелов. Какова вероятность того, что цель будет поражена ровно $3$ раза?', 'Trāpījuma varbūtība vienā šāvienā ir $p = 0{,}6$. Tiek izdarīti $5$ neatkarīgi šāvieni. Kāda ir varbūtība trāpīt mērķī tieši $3$ reizes?', '1) По формуле Бернулли: $P_n(k) = C_n^k p^k q^{n-k}$, где $n = 5, k = 3, p = 0{,}6, q = 1 - 0{,}6 = 0{,}4$.
2) Число сочетаний: $C_5^3 = \frac{5 \cdot 4}{2} = 10$.
3) Вычисляем: $P_5(3) = 10 \cdot (0{,}6)^3 \cdot (0{,}4)^2 = 10 \cdot 0{,}216 \cdot 0{,}16 = 10 \cdot 0{,}03456 = 0{,}3456$.', '1) Pēc Bernulli formulas: $P_5(3) = C_5^3 p^3 q^2$.
2) $C_5^3 = 10$, $p^3 = 0{,}6^3 = 0{,}216$, $q^2 = 0{,}4^2 = 0{,}16$.
3) $P_5(3) = 10 \cdot 0{,}216 \cdot 0{,}16 = 0{,}3456$.', '0.3456', 'Средний', 33, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-pilnas-varbutibas-formula';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Вычисление вероятности брака по формуле полной вероятности', 'Pilnās varbūtības formulas lietošana ražošanas brāķa uzdevumā', 'На завод поступают детали с двух станков: $60\%$ с первого и $40\%$ со второго. Первый станок дает $2\%$ брака, а второй — $5\%$. Какова вероятность того, что случайно взятая деталь окажется бракованной?', 'Detaļas tiek ražotas divos darbgaldos: $60\%$ pirmajā un $40\%$ otrajā. Pirmais darbgalds ražo $2\%$ brāķa, bet otrais — $5\%$. Kāda ir varbūtība, ka nejauši izvēlēta detaļa ir brāķis?', '1) Гипотезы: $H_1$ — деталь с 1-го станка ($P(H_1) = 0{,}6$), $H_2$ — со 2-го станка ($P(H_2) = 0{,}4$).
2) Условные вероятности брака: $P(A|H_1) = 0{,}02$, $P(A|H_2) = 0{,}05$.
3) По формуле полной вероятности: $P(A) = 0{,}6 \cdot 0{,}02 + 0{,}4 \cdot 0{,}05 = 0{,}012 + 0{,}020 = 0{,}032$ (или $3{,}2\%$).', '1) Hipotēzes: $P(H_1) = 0{,}6$, $P(H_2) = 0{,}4$.
2) Nosacītās varbūtības: $P(A|H_1) = 0{,}02$, $P(A|H_2) = 0{,}05$.
3) Pēc pilnās varbūtības formulas: $P(A) = 0{,}6 \cdot 0{,}02 + 0{,}4 \cdot 0{,}05 = 0{,}032$.', '0.032', 'Средний', 34, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-statistika-secinajumi-populacija';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Применение правила трех сигм нормального распределения', 'Normālā sadalījuma 3 sigmu likuma lietošana', 'Рост призывников подчиняется нормальному распределению со средним $\mu = 180\text{ см}$ и стандартным отклонением $\sigma = 6\text{ см}$. Какой процент призывников имеет рост в интервале от $168\text{ см}$ до $192\text{ см}$?', 'Auguma rādītāji atbilst normālajam sadalījumam ar vidējo $\mu = 180\text{ cm}$ un standartnovirzi $\sigma = 6\text{ cm}$. Cik procentu cilvēku augums ir robežās no $168\text{ cm}$ līdz $192\text{ cm}$?', '1) Границы интервала: $168 = 180 - 2 \cdot 6 = \mu - 2\sigma$ и $192 = 180 + 2 \cdot 6 = \mu + 2\sigma$.
2) По правилу нормального распределения в интервал $[\mu - 2\sigma; \mu + 2\sigma]$ попадает примерно $95{,}4\%$ всех значений генеральной совокупности.', '1) Robežas ir $\mu - 2\sigma = 180 - 12 = 168\text{ cm}$ un $\mu + 2\sigma = 180 + 12 = 192\text{ cm}$.
2) Pēc normālā sadalījuma īpašības divu standartnoviržu intervālā $[\mu - 2\sigma; \mu + 2\sigma]$ atrodas aptuveni $95{,}4\%$ no populācijas.', '95.4', 'Средний', 35, true)
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
  select id into v_topic_id from public.topics where slug = 'augst-funkcijas-robeza';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Раскрытие неопределенности [0/0] через домножение на сопряженное', 'Nenoteiktības [0/0] novēršana, reizinot ar saistīto izteiksmi', 'Вычислите предел функции: $\lim_{x \to 0} \frac{\sqrt{x + 4} - 2}{x}$.', 'Aprēķiniet funkcijas robežu: $\lim_{x \to 0} \frac{\sqrt{x + 4} - 2}{x}$.', '1) Подстановка $x = 0$ дает неопределенность $[\frac{0}{0}]$.
2) Умножаем числитель и знаменатель на сопряженное выражение $(\sqrt{x + 4} + 2)$:
$\lim_{x \to 0} \frac{(\sqrt{x + 4} - 2)(\sqrt{x + 4} + 2)}{x(\sqrt{x + 4} + 2)} = \lim_{x \to 0} \frac{(x + 4) - 4}{x(\sqrt{x + 4} + 2)} = \lim_{x \to 0} \frac{x}{x(\sqrt{x + 4} + 2)}$.
3) Сокращаем на $x \ne 0$: $\lim_{x \to 0} \frac{1}{\sqrt{x + 4} + 2} = \frac{1}{\sqrt{4} + 2} = \frac{1}{4}$.', '1) Ievietojot $x = 0$, iegūst nenoteiktību $[0/0]$.
2) Reizina ar saistīto izteiksmi $(\sqrt{x + 4} + 2)$:
$\frac{(x + 4) - 4}{x(\sqrt{x + 4} + 2)} = \frac{1}{\sqrt{x + 4} + 2}$.
3) Robeža ir $\frac{1}{2 + 2} = \frac{1}{4}$.', '1/4', 'Средний', 36, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'matematiska-analize';
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
  select id into v_topic_id from public.topics where slug = 'augst-atvasinajuma-definicija-geometriska-jega';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Мгновенная скорость движения как значение производной', 'Momentānā ātruma aprēķināšana kā atvasinājums', 'Точка движется по прямой согласно закону $s(t) = 3t^2 - 4t + 1$ ($s$ в метрах, $t$ в секундах). Найдите мгновенную скорость точки в момент времени $t = 3\text{ с}$.', 'Materiāls punkts pārvietojas taisnā virzienā pēc likuma $s(t) = 3t^2 - 4t + 1$ ($s$ metros, $t$ sekundēs). Aprēķiniet punkta momentāno ātrumu laika momentā $t = 3\text{ s}$.', '1) Мгновенная скорость — это производная пути по времени: $v(t) = s''(t)$.
2) Находим производную: $v(t) = (3t^2 - 4t + 1)'' = 6t - 4$.
3) Подставляем $t = 3$: $v(3) = 6(3) - 4 = 18 - 4 = 14\text{ м/с}$.', '1) Ātrums ir ceļa atvasinājums pēc laika: $v(t) = s''(t) = 6t - 4$.
2) Pie $t = 3\text{ s}$: $v(3) = 6 \cdot 3 - 4 = 14\text{ m/s}$.', '14', 'Лёгкий', 37, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'matematiska-analize';
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
  select id into v_topic_id from public.topics where slug = 'augst-diferencesanas-likumi-formulas';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Дифференцирование сложной тригонометрической функции', 'Saliktas trigonometriskas funkcijas atvasināšana', 'Найдите производную функции $f(x) = \sin(3x^2 - 1)$.', 'Atrodiet funkcijas $f(x) = \sin(3x^2 - 1)$ atvasinājumu $f''(x)$.', '1) По правилу дифференцирования сложной функции: $(f(g(x)))'' = f''(g(x)) \cdot g''(x)$.
2) Внешняя функция: $(\sin u)'' = \cos u$, где $u = 3x^2 - 1$.
3) Внутренняя функция: $u'' = (3x^2 - 1)'' = 6x$.
4) Итого: $f''(x) = \cos(3x^2 - 1) \cdot 6x = 6x \cos(3x^2 - 1)$.', '1) Pēc saliktas funkcijas atvasināšanas likuma: $(f(g(x)))'' = f''(g(x)) \cdot g''(x)$.
2) Ārējā funkcija: $(\sin u)'' = \cos u$.
3) Iekšējās funkcijas atvasinājums: $(3x^2 - 1)'' = 6x$.
4) $f''(x) = 6x \cos(3x^2 - 1)$.', '6x*cos(3x^2 - 1)', 'Средний', 38, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'algebriskie-parveidojumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'matematiska-analize';
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
  select id into v_topic_id from public.topics where slug = 'augst-pieskare-grafikam';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Составление уравнения касательной к параболе', 'Pieskares vienādojuma sastādīšana parabolas grafikam', 'Составьте уравнение касательной к графику функции $f(x) = x^2 - 3x + 2$ в точке с абсциссой $x_0 = 2$.', 'Uzrakstiet pieskares vienādojumu funkcijas $f(x) = x^2 - 3x + 2$ grafikam punktā ar abscisu $x_0 = 2$.', '1) Значение функции в точке касания: $f(2) = 2^2 - 3(2) + 2 = 4 - 6 + 2 = 0$.
2) Находим производную: $f''(x) = 2x - 3$.
3) Угловой коэффициент касательной: $k = f''(2) = 2(2) - 3 = 1$.
4) Уравнение касательной: $y = f(x_0) + f''(x_0)(x - x_0) = 0 + 1(x - 2) = x - 2$.
Ответ: $y = x - 2$.', '1) Funkcijas vērtība: $f(2) = 4 - 6 + 2 = 0$.
2) Atvasinājums: $f''(x) = 2x - 3$.
3) Virziena koeficients: $k = f''(2) = 4 - 3 = 1$.
4) Pieskares vienādojums: $y - 0 = 1(x - 2) \implies y = x - 2$.', 'y = x - 2', 'Средний', 39, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'matematiska-analize';
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
  select id into v_topic_id from public.topics where slug = 'augst-funkciju-petisana-ar-atvasinajumu';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Нахождение точек локального экстремума функции 3-й степени', 'Funkcijas lokālo ekstrēmu punktu atrašana', 'Найдите точки локального минимума и максимума функции $f(x) = x^3 - 3x^2 - 9x + 5$.', 'Atrodiet funkcijas $f(x) = x^3 - 3x^2 - 9x + 5$ lokālā maksimuma un minimuma punktus.', '1) Находим производную: $f''(x) = 3x^2 - 6x - 9$.
2) Приравниваем к нулю: $3(x^2 - 2x - 3) = 0 \implies 3(x - 3)(x + 1) = 0$.
Стационарные точки: $x_1 = -1, x_2 = 3$.
3) Знаки производной:
- при $x < -1$: $f''(x) > 0$ (функция возрастает);
- при $-1 < x < 3$: $f''(x) < 0$ (функция убывает);
- при $x > 3$: $f''(x) > 0$ (функция возрастает).
4) В точке $x = -1$ знак меняется с $+$ на $-$, это точка максимума ($x_{\max} = -1$).
В точке $x = 3$ знак меняется с $-$ на $+$, это точка минимума ($x_{\min} = 3$).', '1) Atvasinājums: $f''(x) = 3x^2 - 6x - 9 = 3(x - 3)(x + 1)$.
2) Kritiskie punkti ir $x = -1$ un $x = 3$.
3) Zīmju maiņa:
- punktā $x = -1$ atvasinājums maina zīmi no $+$ uz $-$, tātad tas ir maksimuma punkts ($x_{\max} = -1$);
- punktā $x = 3$ zīme mainās no $-$ uz $+$, tātad tas ir minimuma punkts ($x_{\min} = 3$).', 'x_max = -1, x_min = 3', 'Средний', 40, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'matematiska-analize';
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
  select id into v_topic_id from public.topics where slug = 'augst-lietiski-optimizacijas-uzdevumi';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Оптимизация объема открытой коробки из листа картона', 'Kastes tilpuma maksimizēšana no kartona loksnes', 'Из квадратного листа картона со стороной $12\text{ см}$ изготавливают открытую сверху коробку, вырезая по углам равные квадраты со стороной $x$ и загибая края. При каком значении $x$ объем коробки будет наибольшим?', 'No kvadrātveida kartona loksnes ar malu $12\text{ cm}$ izgatavo vaļēju kārbu, stūros izgriežot vienādus kvadrātus ar malu $x$. Kādam $x$ kārbas tilpums būs maksimāls?', '1) Стороны дна коробки равны $12 - 2x$, высота равна $x$ ($0 < x < 6$).
2) Объем коробки: $V(x) = x(12 - 2x)^2 = x(144 - 48x + 4x^2) = 4x^3 - 48x^2 + 144x$.
3) Производная объема: $V''(x) = 12x^2 - 96x + 144 = 12(x^2 - 8x + 12) = 12(x - 2)(x - 6)$.
4) В интервале $(0; 6)$ стационарная точка $x = 2$.
5) При переходе через $x = 2$ производная меняет знак с $+$ на $-$, следовательно, при $x = 2\text{ см}$ объем максимален ($V_{\max} = 2 \cdot 8^2 = 128\text{ см}^3$).', '1) Tilpuma funkcija: $V(x) = x(12 - 2x)^2 = 4x^3 - 48x^2 + 144x$, kur $x \in (0; 6)$.
2) Atvasinājums: $V''(x) = 12(x^2 - 8x + 12) = 12(x - 2)(x - 6)$.
3) Intervālā $(0; 6)$ atrodas punkts $x = 2$, kurā ir funkcijas maksimums.
Atbilde: $x = 2\text{ cm}$.', '2', 'Средний', 41, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'modelesana';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'matematiska-analize';
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
  select id into v_topic_id from public.topics where slug = 'augst-primitiva-funkcija-integraliss';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Нахождение первообразной, проходящей через заданную точку', 'Primitīvās funkcijas atrašana caur doto punktu', 'Для функции $f(x) = 3x^2 - 4x + 1$ найдите первообразную $F(x)$, график которой проходит через точку $M(1; 5)$.', 'Funkcijai $f(x) = 3x^2 - 4x + 1$ atrodiet primitīvo funkciju $F(x)$, kuras grafiks iet caur punktu $M(1; 5)$.', '1) Общий вид первообразной:
$F(x) = \int (3x^2 - 4x + 1)dx = x^3 - 2x^2 + x + C$.
2) Подставляем координаты точки $M(1; 5)$:
$5 = 1^3 - 2(1)^2 + 1 + C \implies 5 = 1 - 2 + 1 + C \implies 5 = 0 + C \implies C = 5$.
3) Искомая первообразная: $F(x) = x^3 - 2x^2 + x + 5$.', '1) Vispārīgā primitīvā funkcija: $F(x) = x^3 - 2x^2 + x + C$.
2) Ievieto punkta $M(1; 5)$ koordinātas: $5 = 1 - 2 + 1 + C \implies C = 5$.
3) $F(x) = x^3 - 2x^2 + x + 5$.', 'F(x) = x^3 - 2x^2 + x + 5', 'Средний', 42, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'matematiska-analize';
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
  select id into v_topic_id from public.topics where slug = 'augst-noteiktais-integralis-nutona-leibnica';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Вычисление определенного интеграла по формуле Ньютона–Лейбница', 'Noteiktā integrāļa aprēķināšana ar Ņūtona–Leibnica formulu', 'Вычислите определенный интеграл: $\int_1^3 (3x^2 - 2x) dx$.', 'Aprēķiniet noteikto integrāli: $\int_1^3 (3x^2 - 2x) dx$.', '1) Находим первообразную: $F(x) = x^3 - x^2$.
2) Применяем формулу Ньютона–Лейбница:
$\int_1^3 (3x^2 - 2x) dx = [x^3 - x^2]_1^3 = (3^3 - 3^2) - (1^3 - 1^2) = (27 - 9) - (1 - 1) = 18 - 0 = 18$.', '1) Primitīvā funkcija: $F(x) = x^3 - x^2$.
2) Pēc Ņūtona–Leibnica formulas: $[x^3 - x^2]_1^3 = (27 - 9) - (1 - 1) = 18$.', '18', 'Лёгкий', 43, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'matematiska-analize';
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
  select id into v_topic_id from public.topics where slug = 'augst-laukumi-tilpumi-integralis';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Площадь фигуры, ограниченной параболой и прямой', 'Ar parabolu un taisni ierobežotas figūras laukums', 'Вычислите площадь фигуры, ограниченной линиями $y = 4 - x^2$ и $y = 0$.', 'Aprēķiniet laukumu plaknes figūrai, ko ierobežo līnijas $y = 4 - x^2$ un $y = 0$.', '1) Точки пересечения параболы с осью $Ox$: $4 - x^2 = 0 \implies x_1 = -2, x_2 = 2$.
2) Площадь фигуры: $S = \int_{-2}^2 (4 - x^2) dx$.
3) Из-за четности функции: $S = 2 \int_0^2 (4 - x^2) dx = 2 [4x - \frac{x^3}{3}]_0^2 = 2 (8 - \frac{8}{3}) = 2 \cdot \frac{16}{3} = \frac{32}{3} = 10\frac{2}{3}$.', '1) Krustpunkti ar $Ox$ asi: $4 - x^2 = 0 \implies x = \pm 2$.
2) Laukums: $S = \int_{-2}^2 (4 - x^2) dx = [4x - \frac{x^3}{3}]_{-2}^2 = (8 - 8/3) - (-8 + 8/3) = 16 - 16/3 = \frac{32}{3}$.', '32/3', 'Средний', 44, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'merijumi';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'matematiska-analize';
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
  select id into v_topic_id from public.topics where slug = 'augst-integrala-lietojums-fizika';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 12, 'Работа переменной силы при растяжении пружины', 'Mainīga spēka padarītā darba aprēķināšana ar integrāli', 'Сила упругости пружины подчиняется закону Гука $F(x) = kx$, где жесткость $k = 200\text{ Н/м}$. Какую работу необходимо совершить, чтобы растянуть пружину на $0{,}1\text{ м}$ из состояния покоя?', 'Atsperes elastības spēks atbilst Huka likumam $F(x) = kx$, kur $k = 200\text{ N/m}$. Kāds darbs jāpadara, lai izstieptu atsperi par $0{,}1\text{ m}$ no miera stāvokļa?', '1) Работа силы равна определенному интегралу: $A = \int_0^{0{,}1} F(x) dx = \int_0^{0{,}1} 200x dx$.
2) Вычисляем: $A = [100 x^2]_0^{0{,}1} = 100 \cdot (0{,}1)^2 = 100 \cdot 0{,}01 = 1\text{ Дж}$.', '1) Darba formula: $A = \int_0^{0{,}1} 200x dx = [100x^2]_0^{0{,}1}$.
2) $A = 100 \cdot 0{,}01 = 1\text{ J}$.', '1', 'Средний', 45, true)
    returning id into v_task_id;

    select id into v_tag_id from public.tags where slug = 'modelesana';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
    select id into v_tag_id from public.tags where slug = 'matematiska-analize';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;
  end if;
end $$;
