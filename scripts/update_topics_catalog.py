import json
import os
import re

# Official Skola2030 basic school curriculum (1.–9. klase) from Valsts izglītības satura centrs
# Appendix 4: "Tematu pārskats 1.–9. klasei matemātikā", pages 329–330.

TOPICS_DEF = [
    # --- 1. klase ---
    {
        "grade": 1, "position": 1, "subject": "geometry",
        "slug": "skola2030-g1-1-rasskazat-i-pokazat-skolko",
        "title_lv": "1.1. Kā izstāsta un parāda: cik, kur, kāds?",
        "title_ru": "1.1. Как рассказать и показать: сколько, где, какой",
        "desc_lv": "Figūras (līnija, daudzstūris, riņķis). Ģeometrisku objektu raksturošana, salīdzināšana, grupēšana; Priekšmetu un skaitļu virknes. Objektu novietojums un virzieni plaknē, telpā; Skaits, skaitīšana. Skaitlis un tā attēlošana, cipari",
        "desc_ru": "Фигуры (линия, многоугольник, круг). Характеристика, сравнение и группировка геометрических объектов; Последовательности предметов и чисел. Расположение и направления объектов на плоскости, в пространстве; Количество, счет. Число и его изображение, цифры"
    },
    {
        "grade": 1, "position": 2, "subject": "algebra",
        "slug": "skola2030-g1-2-skolko-vsego-skolko-ostalos",
        "title_lv": "1.2. Cik kopā, cik palika?",
        "title_ru": "1.2. Сколько всего, сколько осталось",
        "desc_lv": "Saskaitīšana un atņemšana 10 apjomā; Skaitļa sastāvs. Tā vizualizēšana, pierakstīšana; Tabula datu pierakstīšanai",
        "desc_ru": "Сложение и вычитание в пределах 10; Состав числа. Его визуализация, запись; Таблица для записи данных"
    },
    {
        "grade": 1, "position": 3, "subject": "geometry",
        "slug": "skola2030-g1-3-izmeryat-dliny-i-poluchat",
        "title_lv": "1.3. Kā mēra garumus un kā iegūst simetrisku figūru?",
        "title_ru": "1.3. Как измерять длины и получать симметричные фигуры",
        "desc_lv": "Garumu noteikšana, salīdzināšana un aprēķināšana; Simetriskas figūras",
        "desc_ru": "Определение, сравнение и вычисление длин; Симметричные фигуры"
    },
    {
        "grade": 1, "position": 4, "subject": "algebra",
        "slug": "skola2030-g1-4-zapisyvayut-i-sravnivayut-chisla",
        "title_lv": "1.4. Kā pieraksta un salīdzina skaitļus, kuri ir lielāki nekā 10?",
        "title_ru": "1.4. Как записывают и сравнивают числа больше 10",
        "desc_lv": "Garuma mērīšana (cm) un salīdzināšana; Skaitļu 10-100 decimālais sastāvs, lasīšana un pierakstīšana; Skaitļu salīdzināšana. Skaitļu virknes",
        "desc_ru": "Измерение длины (см) и сравнение; Десятичный состав, чтение и запись чисел 10-100; Сравнение чисел. Числовые последовательности"
    },
    {
        "grade": 1, "position": 5, "subject": "algebra",
        "slug": "skola2030-g1-5-skladyvayut-i-vychitayut-chisla",
        "title_lv": "1.5. Kā saskaita un atņem skaitļus, kuri lielāki nekā 10?",
        "title_ru": "1.5. Как складывают и вычитают числа больше 10",
        "desc_lv": "Atņemšana 20 apjomā; Viencipara skaitļa pieskaitīšana pie divciparu skaitļa 20 apjomā; Viencipara skaitļu saskaitīšana, ja rezultāts pārsniedz 10",
        "desc_ru": "Вычитание в пределах 20; Прибавление однозначного числа к двузначному в пределах 20; Сложение однозначных чисел с переходом через 10"
    },
    {
        "grade": 1, "position": 6, "subject": "algebra",
        "slug": "skola2030-g1-6-znachit-na-stolko-bolshe",
        "title_lv": "1.6. Ko nozīmē “par tik vairāk”, “par tik mazāk”?",
        "title_ru": "1.6. Что значит «на столько больше», «на столько меньше»",
        "desc_lv": "Divu lielumu salīdzināšana 20 apjomā; Sadzīves situāciju uzdevumi, kuru atrisināšanai izmanto saskaitīšanu un atņemšanu 20 apjomā",
        "desc_ru": "Сравнение двух величин в пределах 20; Бытовые задачи, решаемые сложением и вычитанием в пределах 20"
    },
    {
        "grade": 1, "position": 7, "subject": "algebra",
        "slug": "skola2030-g1-7-my-vstrechaemsya-s-bolshimi",
        "title_lv": "1.7. Kur sastopamies ar lieliem skaitļiem?",
        "title_ru": "1.7. Где мы встречаемся с большими числами",
        "desc_lv": "Garuma mērīšana (cm, dm, m); Laika mērīšana/skaitīšana; Nauda (eiro, centi); Saskaitīšana un atņemšana 100 apjomā. Sadzīves situācijas",
        "desc_ru": "Измерение длины (см, дм, м); Измерение/отсчет времени; Деньги (евро, центы); Сложение и вычитание в пределах 100. Бытовые ситуации"
    },
    {
        "grade": 1, "position": 8, "subject": "geometry",
        "slug": "skola2030-g1-8-apraksta-un-veido-figuras",
        "title_lv": "1.8. Kā apraksta un veido figūras?",
        "title_ru": "1.8. Как описывают и создают фигуры",
        "desc_lv": "Ģeometriskas figūras plaknē un telpā. Figūru veidošana no detaļām, zīmēšana un raksturošana",
        "desc_ru": "Геометрические фигуры на плоскости и в пространстве. Создание фигур из деталей, рисование и характеристика"
    },

    # --- 2. klase ---
    {
        "grade": 2, "position": 1, "subject": "statistics",
        "slug": "skola2030-g2-1-grupe-objektus",
        "title_lv": "2.1. Kā grupē objektus?",
        "title_ru": "2.1. Как группируют объекты",
        "desc_lv": "Objektu grupēšana pēc pazīmēm, datu kārtošana tabulās un diagrammās",
        "desc_ru": "Группировка объектов по признакам, упорядочивание данных в таблицах и диаграммах"
    },
    {
        "grade": 2, "position": 2, "subject": "geometry",
        "slug": "skola2030-g2-2-nosaka-dazadus-garumus",
        "title_lv": "2.2. Kā nosaka dažādus garumus?",
        "title_ru": "2.2. Как определяют различные длины",
        "desc_lv": "Garuma mērīšana un salīdzināšana (milimetri, centimetri, decimetri, metri). Nogriežņu zīmēšana",
        "desc_ru": "Измерение и сравнение длины (миллиметры, сантиметры, дециметры, метры). Построение отрезков"
    },
    {
        "grade": 2, "position": 3, "subject": "algebra",
        "slug": "skola2030-g2-1-skladyvayut-i-vychitayut-dvuznachnye",
        "title_lv": "2.3. Kā saskaita un atņem divciparu skaitļus?",
        "title_ru": "2.3. Как складывают и вычитают двузначные числа",
        "desc_lv": "Saskaitīšana un atņemšana 100 apjomā. Sadzīves situācijas; Saskaitīšana un atņemšana 20 apjomā",
        "desc_ru": "Сложение и вычитание в пределах 100. Бытовые ситуации; Сложение и вычитание в пределах 20"
    },
    {
        "grade": 2, "position": 4, "subject": "algebra",
        "slug": "skola2030-g2-4-laika-rekini-palidz-planot",
        "title_lv": "2.4. Kā laika rēķini palīdz plānot?",
        "title_ru": "2.4. Как расчет времени помогает планировать",
        "desc_lv": "Laika mērvienības (stundas, minūtes, dienas, mēneši), pulksteņa lasīšana un laika plānošana",
        "desc_ru": "Единицы измерения времени (часы, минуты, дни, месяцы), чтение часов и планирование времени"
    },
    {
        "grade": 2, "position": 5, "subject": "algebra",
        "slug": "skola2030-g2-5-rodas-izteiksme",
        "title_lv": "2.5. Kā rodas izteiksme?",
        "title_ru": "2.5. Как возникает выражение",
        "desc_lv": "Skaitliskas izteiksmes ar iekavām un bez tām. Darbību secība un tekstveida situāciju modelēšana",
        "desc_ru": "Числовые выражения со скобками и без. Порядок действий и моделирование текстовых ситуаций"
    },
    {
        "grade": 2, "position": 6, "subject": "geometry",
        "slug": "skola2030-g2-6-veido-un-raksturo-figuras",
        "title_lv": "2.6. Kā veido un raksturo figūras?",
        "title_ru": "2.6. Как создают и характеризуют фигуры",
        "desc_lv": "Daudzstūru veidi (trijstūri, četrstūri), to malas un virsotnes. Figūru salīdzināšana",
        "desc_ru": "Виды многоугольников (треугольники, четырёхугольники), их стороны и вершины. Сравнение фигур"
    },
    {
        "grade": 2, "position": 7, "subject": "algebra",
        "slug": "skola2030-g2-7-reizinat-un-dalit-ar-2",
        "title_lv": "2.7. Ko nozīmē reizināt un dalīt ar 2?",
        "title_ru": "2.7. Что значит умножать и делить на 2",
        "desc_lv": "Reizināšanas un dalīšanas ar 2 jēga, puse un divkāršs apjoms, uzdevumu risināšana",
        "desc_ru": "Смысл умножения и деления на 2, половина и удвоенное количество, решение задач"
    },
    {
        "grade": 2, "position": 8, "subject": "algebra",
        "slug": "skola2030-g2-2-umnozhayut-i-delyat-na",
        "title_lv": "2.8. Kā reizina un dala ar 3, 4 un 5?",
        "title_ru": "2.8. Как умножают и делят на 3, 4 и 5",
        "desc_lv": "Kā reizina un dala ar 3 un 4?; Kā reizina un dala ar 5? Reizināšana un dalīšana 50 apjomā",
        "desc_ru": "Как умножают и делят на 3 и 4?; Как умножают и делят на 5? Умножение и деление в пределах 50"
    },

    # --- 3. klase ---
    {
        "grade": 3, "position": 1, "subject": "algebra",
        "slug": "skola2030-g3-1-umnozhayut-i-delyat-na",
        "title_lv": "3.1. Kā reizina un dala ar 6, 7, 8, 9 un 10?",
        "title_ru": "3.1. Как умножают и делят на 6, 7, 8, 9 и 10",
        "desc_lv": "Divciparu skaitļu reizināšana un dalīšana; Reizināšanas tabula. Reizināšana un dalīšana dažādās situācijās",
        "desc_ru": "Умножение и деление двузначных чисел; Таблица умножения. Умножение и деление в различных ситуациях"
    },
    {
        "grade": 3, "position": 2, "subject": "algebra",
        "slug": "skola2030-g3-2-ispolzuyut-vse-deystviya",
        "title_lv": "3.2. Kā izmanto visas darbības?",
        "title_ru": "3.2. Как используют все действия",
        "desc_lv": "Cik labi protu veikt darbības ar skaitļiem 100 apjomā?; Skaitliskas izteiksmes; Taisnstūra perimetra aprēķināšanas formulas",
        "desc_ru": "Насколько хорошо я умею выполнять действия с числами в пределах 100?; Числовые выражения; Формулы вычисления периметра прямоугольника"
    },
    {
        "grade": 3, "position": 3, "subject": "geometry",
        "slug": "skola2030-g3-3-sostavlyayut-plan-mestnosti",
        "title_lv": "3.3. Kā veido vietas plānu?",
        "title_ru": "3.3. Как составляют план местности",
        "desc_lv": "Daudzciparu skaitļu reizināšana un dalīšana ar 10, 100 un pilniem desmitiem; Telpas plāns; Trīsciparu un četrciparu skaitļi",
        "desc_ru": "Умножение и деление многозначных чисел на 10, 100 и полные десятки; План помещения; Трехзначные и четырехзначные числа"
    },
    {
        "grade": 3, "position": 4, "subject": "algebra",
        "slug": "skola2030-g3-4-znachit-chast-ot-tselogo",
        "title_lv": "3.4. Ko nozīmē daļa no veselā?",
        "title_ru": "3.4. Что значит часть от целого",
        "desc_lv": "Dalīšana vienādās daļās, veselais un daļa; Daļa no skaita; Daļskaitļa pieraksts. Daļskaitļi uz skaitļu taisnes; Daļu salīdzināšana",
        "desc_ru": "Деление на равные части, целое и часть; Часть от количества; Запись дроби. Дроби можно складывать. Дроби на числовой прямой.; Сравнение дробей"
    },
    {
        "grade": 3, "position": 5, "subject": "geometry",
        "slug": "skola2030-g3-5-kadi-lielumi-raksturo-figuru",
        "title_lv": "3.5. Kādi lielumi raksturo figūru?",
        "title_ru": "3.5. Какие величины характеризуют фигуру",
        "desc_lv": "Taisnstūra un kvadrāta perimetrs, laukuma mērīšana ar kvadrātvienībām",
        "desc_ru": "Периметр прямоугольника и квадрата, измерение площади квадратными единицами"
    },
    {
        "grade": 3, "position": 6, "subject": "algebra",
        "slug": "skola2030-g3-6-saskaita-un-atnem-trisciparu",
        "title_lv": "3.6. Kā saskaita un atņem trīsciparu skaitļus?",
        "title_ru": "3.6. Как складывают и вычитают трёхзначные числа",
        "desc_lv": "Trīsciparu skaitļu saskaitīšana un atņemšana stabiņā un galvā, sadzīves aprēķini",
        "desc_ru": "Сложение и вычитание трёхзначных чисел столбиком и устно, бытовые расчёты"
    },
    {
        "grade": 3, "position": 7, "subject": "geometry",
        "slug": "skola2030-g3-5-sozdayut-prostranstvennye-modeli",
        "title_lv": "3.7. Kā veido telpiskus modeļus?",
        "title_ru": "3.7. Как создают пространственные модели",
        "desc_lv": "Telpiskas figūras; Telpisku figūru izklājumi, kā telpiska figūra izskatās no dažādām pusēm",
        "desc_ru": "Пространственные фигуры; Развертки пространственных фигур, вид пространственной фигуры с разных сторон"
    },

    # --- 4. klase ---
    {
        "grade": 4, "position": 1, "subject": "algebra",
        "slug": "skola2030-g4-1-skladyvayut-i-vychitayut-mnogoznachnye",
        "title_lv": "4.1. Kā saskaita un atņem daudzciparu skaitļus?",
        "title_ru": "4.1. Как складывают и вычитают многозначные числа",
        "desc_lv": "Pirmais tūkstotis (atkārtojums); Četrciparu skaitļi. Četrciparu skaitļu saskaitīšana un atņemšana",
        "desc_ru": "Первая тысяча (повторение); Четырехзначные числа. Сложение и вычитание четырехзначных чисел"
    },
    {
        "grade": 4, "position": 2, "subject": "algebra",
        "slug": "skola2030-g4-2-mnogoznachnye-chisla-umnozhayut-i",
        "title_lv": "4.2. Kā daudzciparu skaitļus reizina un dala ar viencipara skaitli?",
        "title_ru": "4.2. Как многозначные числа умножают и делят на однозначное число",
        "desc_lv": "Divciparu skaitļa dalīšana ar viencipara skaitli; Divciparu skaitļa reizināšana ar viencipara skaitli; Trīsciparu skaitļa dalīšana ar viencipara skaitli; Trīsciparu skaitļa reizināšana ar viencipara skaitli",
        "desc_ru": "Деление двузначного числа на однозначное; Умножение двузначного числа на однозначное; Деление трехзначного числа на однозначное; Умножение трехзначного числа на однозначное"
    },
    {
        "grade": 4, "position": 3, "subject": "geometry",
        "slug": "skola2030-g4-3-ka-mera-lenki",
        "title_lv": "4.3. Kā mēra leņķi?",
        "title_ru": "4.3. Как измеряют углы",
        "desc_lv": "Leņķa jēdziens, leņķu veidi (šaurs, taisns, plats, izstiepts), leņķu mērīšana ar transportieri un zīmēšana",
        "desc_ru": "Понятие угла, виды углов (острый, прямой, тупой, развёрнутый), измерение углов транспортиром и построение"
    },
    {
        "grade": 4, "position": 4, "subject": "algebra",
        "slug": "skola2030-g4-3-mnogoznachnye-chisla-umnozhayut-i",
        "title_lv": "4.4. Kā daudzciparu skaitļus reizina un dala ar divciparu skaitli?",
        "title_ru": "4.4. Как многозначные числа умножают и делят на двузначное число",
        "desc_lv": "Daudzciparu skaitļa dalīšana ar divciparu skaitli; Daudzciparu skaitļa reizināšana ar divciparu skaitli",
        "desc_ru": "Деление многозначного числа на двузначное; Умножение многозначного числа на двузначное"
    },
    {
        "grade": 4, "position": 5, "subject": "algebra",
        "slug": "skola2030-g4-4-sravnivayut-skladyvayut-i-vychitayut",
        "title_lv": "4.5. Kā salīdzina, saskaita un atņem daļskaitļus?",
        "title_ru": "4.5. Как сравнивают, складывают и вычитают дроби",
        "desc_lv": "Daļa kā skaitītāja un pamatdaļas reizinājums; Daļas, to novietojums uz skaitļu taisnes; Daļu ar vienādiem saucējiem saskaitīšana un atņemšana; Daļu salīdzināšana",
        "desc_ru": "Дробь как произведение числителя и основной дроби; Дроби, их расположение на числовой прямой; Сложение и вычитание дробей с одинаковыми знаменателями; Сравнение дробей"
    },
    {
        "grade": 4, "position": 6, "subject": "algebra",
        "slug": "skola2030-g4-5-znachit-chast-ot-tselogo",
        "title_lv": "4.6. Ko nozīmē daļa no veselā?",
        "title_ru": "4.6. Что значит часть от целого",
        "desc_lv": "Veselais ir lieluma skaitliskā vērtība; Veselo veido vairāki elementi; Daļa no lieluma un daļa no skaita",
        "desc_ru": "Целое — это числовое значение величины; Целое состоит из нескольких элементов; Нахождение части от величины и числа"
    },
    {
        "grade": 4, "position": 7, "subject": "geometry",
        "slug": "skola2030-g4-7-nosaka-dazadu-figuru-laukumu",
        "title_lv": "4.7. Kā nosaka dažādu figūru laukumu?",
        "title_ru": "4.7. Как определяют площадь различных фигур",
        "desc_lv": "Taisnstūra un kombinētu taisnstūrveida figūru laukuma aprēķināšana, laukuma mērvienības (cm², dm², m²)",
        "desc_ru": "Вычисление площади прямоугольника и составных фигур, единицы площади (см², дм², м²)"
    },
    {
        "grade": 4, "position": 8, "subject": "algebra",
        "slug": "skola2030-g4-6-obshchego-v-matematicheskom-opisanii",
        "title_lv": "4.8. Kas kopīgs iepirkšanās un kustības matemātiskajā aprakstā?",
        "title_ru": "4.8. Что общего в математическом описании покупок и движения",
        "desc_lv": "Laiks, ceļš, ātrums; Skaits, samaksa, cena. Vienādojumi un sakarības starp lielumiem",
        "desc_ru": "Время, путь, скорость; Количество, оплата, цена. Уравнения и зависимости между величинами"
    },

    # --- 5. klase ---
    {
        "grade": 5, "position": 1, "subject": "algebra",
        "slug": "skola2030-g5-1-po-raznomu-zapisyvayut-naturalnye",
        "title_lv": "5.1. Kā dažādi pieraksta naturālos skaitļus?",
        "title_ru": "5.1. Как по-разному записывают натуральные числа",
        "desc_lv": "Citas naturālo skaitļu pieraksta sistēmas; Naturālo skaitļu pieraksts decimālajā sistēmā; Naturālu skaitļu noapaļošana; Sakarības starp darbību locekļiem summās un starpībās",
        "desc_ru": "Другие системы записи натуральных чисел; Запись натуральных чисел в десятичной системе; Округление натуральных чисел; Закономерности между компонентами действий в суммах и разностях"
    },
    {
        "grade": 5, "position": 2, "subject": "algebra",
        "slug": "skola2030-g5-2-ispolzuyut-razlozhenie-chisla-na",
        "title_lv": "5.2. Kā lieto skaitļa sadalīšanu reizinātājos?",
        "title_ru": "5.2. Как используют разложение числа на множители",
        "desc_lv": "Kāpināšana; Reizināšanas, dalīšanas paņēmieni un darbību īpašības; Sadalīšana reizinātājos",
        "desc_ru": "Возведение в степень; Приемы умножения, деления и свойства действий; Разложение на множители"
    },
    {
        "grade": 5, "position": 3, "subject": "algebra",
        "slug": "skola2030-g5-3-obyasnyayut-i-primenyayut-osnovnoe",
        "title_lv": "5.3. Kā skaidro un lieto daļas pamatīpašību?",
        "title_ru": "5.3. Как объясняют и применяют основное свойство дроби",
        "desc_lv": "Daļas pamatīpašība; Daļu ar dažādiem saucējiem saskaitīšana un atņemšana; Daļu salīdzināšana; Pamatdaļas dalīšana ar veselu skaitli",
        "desc_ru": "Основное свойство дроби; Сложение и вычитание дробей с разными знаменателями; Сравнение дробей; Деление основной дроби на целое число"
    },
    {
        "grade": 5, "position": 4, "subject": "algebra",
        "slug": "skola2030-g5-4-odno-chislo-vyrazhayut-chast",
        "title_lv": "5.4. Kā vienu skaitli izsaka kā otra skaitļa daļu?",
        "title_ru": "5.4. Как одно число выражают как часть другого числа",
        "desc_lv": "Daļa kā dalīšanas darbības pieraksts; Daļas un veselā skaitliskā vērtība",
        "desc_ru": "Дробь как запись действия деления; Дробь и числовое значение целого"
    },
    {
        "grade": 5, "position": 5, "subject": "algebra",
        "slug": "skola2030-g5-5-skladyvayut-i-vychitayut-smeshannye",
        "title_lv": "5.5. Kā saskaita un atņem jauktus skaitļus?",
        "title_ru": "5.5. Как складывают и вычитают смешанные числа",
        "desc_lv": "Jaukti skaitļi; Jauktu skaitļu saskaitīšana un atņemšana; Jauktu skaitļu saskaitīšana un atņemšana, ja saucēji ir dažādi",
        "desc_ru": "Смешанные числа; Сложение и вычитание смешанных чисел; Сложение и вычитание смешанных чисел, если знаменатели разные"
    },
    {
        "grade": 5, "position": 6, "subject": "geometry",
        "slug": "skola2030-g5-6-opredelyayut-neizvestnye-velichiny-figur",
        "title_lv": "5.6. Kā nosaka figūru nezināmos lielumus?",
        "title_ru": "5.6. Как определяют неизвестные величины фигур",
        "desc_lv": "Daudzstūru īpašības un lielumi; Leņķis. Leņķis kā citu leņķu summa vai starpība; Riņķa līnija un tās garums",
        "desc_ru": "Свойства и величины многоугольников; Угол. Угол как сумма или разность других углов; Окружность и её длина"
    },
    {
        "grade": 5, "position": 7, "subject": "statistics",
        "slug": "skola2030-g5-7-ispolzuyut-desyatichnye-drobi-i",
        "title_lv": "5.7. Kā lieto decimāldaļas un procentus?",
        "title_ru": "5.7. Как используют десятичные дроби и проценты",
        "desc_lv": "Decimāldaļas, to attēlojums uz skaitļu taisnes un salīdzināšana; Decimāldaļu saskaitīšana un atņemšana; Procenti; Procentu uzdevumi; Sektoru diagramma",
        "desc_ru": "Десятичные дроби, их изображение на числовой прямой и сравнение; Сложение и вычитание десятичных дробей; Проценты; Задачи на проценты; Круговая диаграмма"
    },
    {
        "grade": 5, "position": 8, "subject": "statistics",
        "slug": "skola2030-g5-8-vizuali-attelo-sakaribu",
        "title_lv": "5.8. Kā vizuāli attēlo sakarību starp lielumiem?",
        "title_ru": "5.8. Как визуально отображают зависимость между величинами",
        "desc_lv": "Datu grafiskā attēlošana, stabiņu un līniju diagrammas, divu mainīgo sakarību nolasīšana",
        "desc_ru": "Графическое представление данных, столбчатые и линейные диаграммы, считывание зависимостей между переменными"
    },

    # --- 6. klase ---
    {
        "grade": 6, "position": 1, "subject": "algebra",
        "slug": "skola2030-g6-1-sovokupnost-delyat-v-opredelennom",
        "title_lv": "6.1. Kā kopumu sadala noteiktā attiecībā?",
        "title_ru": "6.1. Как совокупность делят в определенном отношении",
        "desc_lv": "Mērogs; Proporcionāli lielumi; Skaitļu attiecības. Kopuma sadalīšana noteiktā attiecībā",
        "desc_ru": "Масштаб; Пропорциональные величины; Отношения чисел. Деление совокупности в определенном отношении"
    },
    {
        "grade": 6, "position": 2, "subject": "algebra",
        "slug": "skola2030-g6-2-umnozhayut-i-delyat-obyknovennye",
        "title_lv": "6.2. Kā reizina un dala parastās daļas?",
        "title_ru": "6.2. Как умножают и делят обыкновенные дроби",
        "desc_lv": "Daļu un jauktu skaitļu reizināšana un dalīšana ar veselu skaitli; Parasto daļu reizināšana un dalīšana savā starpā",
        "desc_ru": "Умножение и деление дробей и смешанных чисел на целое число; Умножение и деление обыкновенных дробей между собой"
    },
    {
        "grade": 6, "position": 3, "subject": "algebra",
        "slug": "skola2030-g6-3-komata-lietojums-decimaldalas",
        "title_lv": "6.3. Kā izpratne par komata lietojumu palīdz, ja reizina un dala decimāldaļas?",
        "title_ru": "6.3. Как понимание запятой помогает при умножении и делении десятичных дробей",
        "desc_lv": "Decimāldaļu reizināšana un dalīšana ar 10, 100, 1000 un savā starpā. Komata pārvietošanas likumi un noapaļošana",
        "desc_ru": "Умножение и деление десятичных дробей на 10, 100, 1000 и между собой. Правила переноса запятой и округление"
    },
    {
        "grade": 6, "position": 4, "subject": "geometry",
        "slug": "skola2030-g6-3-izobrazhayut-i-kharakterizuyut-prostranstvennye",
        "title_lv": "6.4. Kā attēlo un raksturo telpiskus ķermeņus?",
        "title_ru": "6.4. Как изображают и характеризуют пространственные тела",
        "desc_lv": "Tilpums; Virsmas laukums; Taisnstūra paralēlskaldnis un kubs, to izklājumi",
        "desc_ru": "Объем; Площадь поверхности; Прямоугольный параллелепипед и куб, их развертки"
    },
    {
        "grade": 6, "position": 5, "subject": "statistics",
        "slug": "skola2030-g6-5-sadzives-situacijas-procentus",
        "title_lv": "6.5. Kā sadzīves situācijās izmanto procentus?",
        "title_ru": "6.5. Как в жизненных ситуациях используют проценты",
        "desc_lv": "Procentu aprēķināšana no skaitļa, skaitļa atrašana pēc tā procentiem, cenu izmaiņas, atlaides un nodokļi",
        "desc_ru": "Нахождение процента от числа, нахождение числа по его проценту, изменение цен, скидки и налоги"
    },
    {
        "grade": 6, "position": 6, "subject": "algebra",
        "slug": "skola2030-g6-4-nuzhny-chisla-kotorye-menshe",
        "title_lv": "6.6. Kāpēc nepieciešami skaitļi, kuri ir mazāki nekā nulle?",
        "title_ru": "6.6. Зачем нужны числа, которые меньше нуля",
        "desc_lv": "Pretēji skaitļi. Pozitīvi un negatīvi skaitļi, to novietojums uz skaitļu taisnes, moduļa jēdziens un salīdzināšana",
        "desc_ru": "Противоположные числа. Положительные и отрицательные числа, их расположение на числовой прямой, модуль и сравнение"
    },
    {
        "grade": 6, "position": 7, "subject": "algebra",
        "slug": "skola2030-g6-5-znachit-pribavit-k-chislu",
        "title_lv": "6.7. Ko nozīmē skaitlim pieskaitīt negatīvu skaitli, no skaitļa atņemt negatīvu skaitli?",
        "title_ru": "6.7. Что значит прибавить к числу отрицательное число или вычесть отрицательное число",
        "desc_lv": "Pozitīvu un negatīvu daļskaitļu saskaitīšana un atņemšana; Veselu skaitļu saskaitīšana un atņemšana",
        "desc_ru": "Сложение и вычитание положительных и отрицательных дробей; Сложение и вычитание целых чисел"
    },
    {
        "grade": 6, "position": 8, "subject": "algebra",
        "slug": "skola2030-g6-8-plano-darbibu-izpildi",
        "title_lv": "6.8. Kā plāno darbību izpildi ar visu veidu skaitļiem?",
        "title_ru": "6.8. Как планируют порядок действий со всеми видами чисел",
        "desc_lv": "Visas četras darbības ar racionāliem skaitļiem (veseli skaitļi, parastās daļas, decimāldaļas). Izteiksmju aprēķināšana",
        "desc_ru": "Все четыре действия с рациональными числами (целые числа, обыкновенные дроби, десятичные дроби). Вычисление сложных выражений"
    },

    # --- 7. klase ---
    {
        "grade": 7, "position": 1, "subject": "statistics",
        "slug": "skola2030-g7-1-opredelyayut-vse-elementy-mnozhestva",
        "title_lv": "7.1. Kā nosaka kopas visus elementus, aprēķina notikuma varbūtību?",
        "title_ru": "7.1. Как определяют все элементы множества, вычисляют вероятность события",
        "desc_lv": "Izlašu veidošana, raksturošana, izlašu skaita noteikšana; Kopas, Eilera-Venna diagramma. Pilnā pārlase; Varbūtība un tās lietojumi",
        "desc_ru": "Создание выборок, их характеристика, определение количества выборок; Множества, диаграмма Эйлера-Венна. Полный перебор; Вероятность и её применения"
    },
    {
        "grade": 7, "position": 2, "subject": "geometry",
        "slug": "skola2030-g7-2-opredelyayut-geometricheskie-figury",
        "title_lv": "7.2. Kā definē ģeometriskas figūras?",
        "title_ru": "7.2. Как определяют геометрические фигуры",
        "desc_lv": "Divu taišņu novietojums plaknē. Leņķis; Vienādas figūras. Nogriežņa garums un tā aprēķināšana; Ģeometrisko figūru definēšana un attēlošana",
        "desc_ru": "Взаимное расположение двух прямых на плоскости. Угол; Равные фигуры. Длина отрезка и её вычисление; Определение и изображение геометрических фигур"
    },
    {
        "grade": 7, "position": 3, "subject": "algebra",
        "slug": "skola2030-g7-3-kharakterizuyut-zavisimost-mezhdu-peremennymi",
        "title_lv": "7.3. Kā raksturo sakarību starp mainīgiem lielumiem?",
        "title_ru": "7.3. Как характеризуют зависимость между переменными величинами",
        "desc_lv": "Sakarība starp apgriezti proporcionāliem lielumiem un cita veida sakarības; Sakarība starp tieši proporcionāliem lielumiem",
        "desc_ru": "Зависимость между обратно пропорциональными величинами и другие виды зависимостей; Зависимость между прямо пропорциональными величинами"
    },
    {
        "grade": 7, "position": 4, "subject": "algebra",
        "slug": "skola2030-g7-4-zapisyvayut-i-issleduyut-funktsii",
        "title_lv": "7.4. Kā pieraksta un pēta funkcijas, kuru grafiks ir taisne?",
        "title_ru": "7.4. Как записывают и исследуют функции, график которых — прямая",
        "desc_lv": "Funkcija, ar to saistītie jēdzieni. Lineāra funkcija; Lineāras funkcijas īpašības",
        "desc_ru": "Функция, связанные с ней понятия. Линейная функция; Свойства линейной функции"
    },
    {
        "grade": 7, "position": 5, "subject": "geometry",
        "slug": "skola2030-g7-5-kharakterizuyut-treugolnik-ispolzuya-ego",
        "title_lv": "7.5. Kā raksturo trijstūri, izmantojot tā elementus?",
        "title_ru": "7.5. Как характеризуют треугольник, используя его элементы",
        "desc_lv": "Nogriežņa vidusperpendikuls un raksturīgie nogriežņi trijstūrī; Trijstūri ar vienādām malām; Triju punktu novietojums plaknē.Trijstūris; Vienādi trijstūri, vienādības pazīmes un to lietošana",
        "desc_ru": "Серединный перпендикуляр отрезка и характерные отрезки в треугольнике; Треугольники с равными сторонами; Расположение трех точек на плоскости. Треугольник; Равные треугольники, признаки равенства и их применение"
    },
    {
        "grade": 7, "position": 6, "subject": "geometry",
        "slug": "skola2030-g7-6-zavisimosti-mezhdu-velichinami-v",
        "title_lv": "7.6. Kādas ir sakarības starp lielumiem trijstūrī?",
        "title_ru": "7.6. Каковы зависимости между величинами в треугольнике",
        "desc_lv": "Sakarības starp trijstūra malām un leņķiem. Trijstūra īpašības un pazīmes; Trijstūra leņķu summa; Trīs taišņu novietojums plaknē",
        "desc_ru": "Зависимости между сторонами и углами треугольника. Свойства и признаки треугольника; Сумма углов треугольника; Расположение трех прямых на плоскости"
    },
    {
        "grade": 7, "position": 7, "subject": "algebra",
        "slug": "skola2030-g7-7-znachit-preobrazovat-vyrazhenie-s",
        "title_lv": "7.7. Ko nozīmē pārveidot izteiksmi ar mainīgo lielumu?",
        "title_ru": "7.7. Что значит преобразовать выражение с переменной величиной",
        "desc_lv": "Algebriskas izteiksmes un to vērtība; Algebrisku izteiksmju pārveidojumi; Identiski vienādas izteiksmes; Skaitliskas un algebriskas izteiksmes",
        "desc_ru": "Алгебраические выражения и их значение; Преобразования алгебраических выражений; Тождественно равные выражения; Числовые и алгебраические выражения"
    },
    {
        "grade": 7, "position": 8, "subject": "algebra",
        "slug": "skola2030-g7-8-priemy-opredeleniya-neizvestnogo-lineynoe",
        "title_lv": "7.8. Kādi ir paņēmieni nezināmā noteikšanai?",
        "title_ru": "7.8. Каковы приемы определения неизвестного, линейное уравнение",
        "desc_lv": "Lineāra vienādojuma lietojums teksta uzdevumu atrisināšanā; Lineārs vienādojums un tā atrisināšana; Proporcija. Lieluma izteikšana no proporcijas; Vienādojuma ekvivalenti pārveidojumi",
        "desc_ru": "Использование линейного уравнения при решении текстовых задач; Линейное уравнение и его решение; Пропорция. Выражение величины из пропорции; Эквивалентные преобразования уравнения"
    },
    {
        "grade": 7, "position": 9, "subject": "algebra",
        "slug": "skola2030-g7-9-sravnivayut-vyrazheniya-est-peremennaya",
        "title_lv": "7.9. Kā salīdzina izteiksmes, kurās ir mainīgais lielums?",
        "title_ru": "7.9. Как сравнивают выражения, где есть переменная, неравенства",
        "desc_lv": "Izteiksmju salīdzināšana. Nevienādība un tās atrisinājums; Lineāru nevienādību atrisināšana; Nevienādību lietošana",
        "desc_ru": "Сравнение выражений. Неравенство и его решение; Решение линейных неравенств; Применение неравенств"
    },

    # --- 8. klase ---
    {
        "grade": 8, "position": 1, "subject": "statistics",
        "slug": "skola2030-g8-1-matematicheski-opisyvayut-i-analiziruyut",
        "title_lv": "8.1. Kā matemātiski raksturo un analizē datus?",
        "title_ru": "8.1. Как математически описывают и анализируют данные, статистика",
        "desc_lv": "Datu ieguve, apkopošana un attēlošana; Datu sakārtošana un statistiskie rādītāji",
        "desc_ru": "Сбор, обобщение и отображение данных; Упорядочивание данных и статистические показатели"
    },
    {
        "grade": 8, "position": 2, "subject": "algebra",
        "slug": "skola2030-g8-2-obyasnyayut-i-primenyayut-stepen",
        "title_lv": "8.2. Kā skaidro un lieto pakāpi ar veselu kāpinātāju?",
        "title_ru": "8.2. Как объясняют и применяют степень с целым показателем",
        "desc_lv": "Pakāpe ar naturālu kāpinātāju un īpašības; Pakāpe ar veselu kāpinātāju",
        "desc_ru": "Степень с натуральным показателем и свойства; Степень с целым показателем"
    },
    {
        "grade": 8, "position": 3, "subject": "algebra",
        "slug": "skola2030-g8-3-postupayut-esli-chislo-nelzya",
        "title_lv": "8.3. Kā rīkojas, ja skaitli nevar pierakstīt kā daļu?",
        "title_ru": "8.3. Как поступают, если число нельзя записать в виде дроби, квадратный корень",
        "desc_lv": "Aritmētiskā kvadrātsakne; Aritmētiskās kvadrātsaknes īpašības; Skaitļu precīzās vērtības tuvinājumi. Racionāli un iracionāli skaitļi",
        "desc_ru": "Арифметический квадратный корень; Свойства арифметического квадратного корня; Приближения точного значения чисел. Рациональные и иррациональные числа"
    },
    {
        "grade": 8, "position": 4, "subject": "geometry",
        "slug": "skola2030-g8-4-vychislyayut-ploshchad-dlya-lyubogo",
        "title_lv": "8.4. Kā aprēķina laukumu jebkuram trijstūrim, riņķim?",
        "title_ru": "8.4. Как вычисляют площадь для любого треугольника, круга, призмы, цилиндра",
        "desc_lv": "Cilindrs, tā virsmas laukums un tilpums; Laukums. Trijstūra laukums; Riņķa laukums. Kombinētu figūru laukums; Taisna prizma, tās virsmas laukums un tilpums",
        "desc_ru": "Цилиндр, площадь его поверхности и объем; Площадь. Площадь треугольника; Площадь круга. Площадь комбинированных фигур; Прямая призма, площадь её поверхности и объем"
    },
    {
        "grade": 8, "position": 5, "subject": "geometry",
        "slug": "skola2030-g8-5-obshchego-u-chetyrekhugolnikov-protivopolozhnye",
        "title_lv": "8.5. Kas kopīgs četrstūriem, kuru pretējās malas ir pa pāriem paralēlas?",
        "title_ru": "8.5. Что общего у четырехугольников, противоположные стороны которых попарно параллельны",
        "desc_lv": "Paralelograma laukums; Paralelograms; Rombs un taisnstūris; Taišņu paralelitātes pazīmes; Četrstūri",
        "desc_ru": "Площадь параллелограмма; Параллелограмм; Ромб и прямоугольник; Признаки параллельности прямых; Четырехугольники"
    },
    {
        "grade": 8, "position": 6, "subject": "algebra",
        "slug": "skola2030-g8-6-obyasnyayut-i-vypolnyayut-deystviya",
        "title_lv": "8.6. Kā skaidro un izpilda darbības ar izteiksmēm?",
        "title_ru": "8.6. Как объясняют и выполняют действия с выражениями",
        "desc_lv": "Monoma un polinoma reizinājums; Monomi, to saskaitīšana un atņemšana; Monomu reizināšana, dalīšana, kāpināšana; Polinoma reizinājums ar polinomu; Polinomi, to saskaitīšana un atņemšana",
        "desc_ru": "Произведение одночлена и многочлена; Одночлены, их сложение и вычитание; Умножение, деление, возведение в степень одночленов; Произведение многочлена на многочлен; Многочлены, их сложение и вычитание"
    },
    {
        "grade": 8, "position": 7, "subject": "algebra",
        "slug": "skola2030-g8-7-razlichnye-funktsii-ispolzuyut-dlya",
        "title_lv": "8.7. Kā dažādas funkcijas izmanto matemātiskai modelēšanai?",
        "title_ru": "8.7. Как различные функции используют для математического моделирования",
        "desc_lv": "Funkcija y=k/x; Kvadrātfunkcija, īpašības; Kvadrātfunkcijas grafiks",
        "desc_ru": "Функция y=k/x; Квадратичная функция, свойства; График квадратичной функции"
    },
    {
        "grade": 8, "position": 8, "subject": "geometry",
        "slug": "skola2030-g8-8-opredelyayut-neizvestnuyu-storonu-pryamougolnogo",
        "title_lv": "8.8. Kā nosaka taisnleņķa trijstūra nezināmās malas garumu?",
        "title_ru": "8.8. Как определяют неизвестную сторону прямоугольного треугольника, теорема Пифагора",
        "desc_lv": "Pitagora teorēma un tās lietojums; Taisleņķa trijstūris, taisleņķa trijstūru vienādība",
        "desc_ru": "Теорема Пифагора и её применение; Прямоугольный треугольник, равенство прямоугольных треугольников"
    },

    # --- 9. klase ---
    {
        "grade": 9, "position": 1, "subject": "geometry",
        "slug": "skola2030-g9-1-opredelyayut-i-kharakterizuyut-podobnye",
        "title_lv": "9.1. Kā definē un raksturo līdzīgus trijstūrus?",
        "title_ru": "9.1. Как определяют и характеризуют подобные треугольники",
        "desc_lv": "Līdzīgi trijstūri, trijstūru līdzības pazīmes; Talesa teorēma. Proporcionāli nogriežņi; Trijstūra viduslīnija; Trijstūru līdzības lietojums",
        "desc_ru": "Подобные треугольники, признаки подобия треугольников; Теорема Фалеса. Пропорциональные отрезки; Средняя линия треугольника; Применение подобия треугольников"
    },
    {
        "grade": 9, "position": 2, "subject": "geometry",
        "slug": "skola2030-g9-2-obshchego-u-chetyrekhugolnikov-u",
        "title_lv": "9.2. Kas kopīgs četrstūriem, kuriem tieši divas malas ir paralēlas?",
        "title_ru": "9.2. Что общего у четырехугольников, у которых ровно две стороны параллельны, трапеция",
        "desc_lv": "Taisna četrstūra prizma, telpiski ķermeņi; Trapece, taisnleņķa trapece; Trapeces viduslīnija. Trapeces laukums; Vienādsānu trapece",
        "desc_ru": "Прямая четырехугольная призма, пространственные тела; Трапеция, прямоугольная трапеция; Средняя линия трапеции. Площадь трапеции; Равнобедренная трапеция"
    },
    {
        "grade": 9, "position": 3, "subject": "geometry",
        "slug": "skola2030-g9-3-v-vychisleniyakh-ispolzuyut-otnoshenie",
        "title_lv": "9.3. Kā aprēķinos izmanto taisnleņķa trijstūra divu malu attiecību?",
        "title_ru": "9.3. Как в вычислениях используют отношение двух сторон прямоугольного треугольника",
        "desc_lv": "Sakarības taisnleņķa trijstūrī matemātiskos un reālos kontekstos; Sin, cos, tg definēšana, nezināmo lielumu aprēķināšana taisnleņķa trijstūrī",
        "desc_ru": "Зависимости в прямоугольном треугольнике в математических и реальных контекстах; Определение sin, cos, tg, вычисление неизвестных величин в прямоугольном треугольнике"
    },
    {
        "grade": 9, "position": 4, "subject": "algebra",
        "slug": "skola2030-g9-4-ispolzuyut-razlozhenie-vyrazheniy-na",
        "title_lv": "9.4. Kā izmanto izteiksmju sadalīšanu reizinājos?",
        "title_ru": "9.4. Как используют разложение выражений на множители",
        "desc_lv": "Binoma kvadrāts; Kvadrātu starpība; Polinoma sadalīšana reizinātājos, iznesot kopīgo reizinātāju pirms iekavām; Visu darbību ar monomiem, polinomiem lietojums",
        "desc_ru": "Квадрат двучлена; Разность квадратов; Разложение многочлена на множители вынесением общего множителя за скобки; Применение всех действий с одночленами, многочленами"
    },
    {
        "grade": 9, "position": 5, "subject": "algebra",
        "slug": "skola2030-g9-5-obyasnyayut-i-ispolzuyut-formuly",
        "title_lv": "9.5. Kā skaidro un izmanto formulas darbā ar kvadrātvienādojumu, kvadrātfunkciju?",
        "title_ru": "9.5. Как объясняют и используют формулы при работе с квадратным уравнением, квадратичной функцией",
        "desc_lv": "Kvadrātfunkcijas; Kvadrātnevienādības; Kvadrātvienādojuma sakņu formula; Kvadrātvienādojumi x²=t, ax²=t un (x+k)²=t; Kvadrātvienādojums; Reizinājums vienāds ar 0, vienādojumi ax²+bx=0; Vjeta teorēma",
        "desc_ru": "Квадратичные функции; Квадратные неравенства; Формула корней квадратного уравнения; Квадратные уравнения x²=t, ax²=t и (x+k)²=t; Квадратное уравнение; Произведение, равное 0, уравнения ax²+bx=0; Теорема Виета"
    },
    {
        "grade": 9, "position": 6, "subject": "algebra",
        "slug": "skola2030-g9-6-opisyvayut-situatsii-s-dvumya",
        "title_lv": "9.6. Kā apraksta situācijas ar diviem nezināmiem lielumiem?",
        "title_ru": "9.6. Как описывают ситуации с двумя неизвестными величинами",
        "desc_lv": "Vienādojums ar diviem nezināmajiem, tā grafiskais attēlojums; Vienādojumu sistēmas atrisināšana grafiski; Vienādojumu sistēmas atrisināšanas analītiskie paņēmieni; Ievietošanas paņēmiens; Saskaitīšanas paņēmiens",
        "desc_ru": "Уравнение с двумя неизвестными, его графическое изображение; Решение систем уравнений графическим способом; Аналитические способы решения систем уравнений; Способ подстановки; Способ сложения"
    },
    {
        "grade": 9, "position": 7, "subject": "algebra",
        "slug": "skola2030-g9-7-chislovuyu-posledovatelnost-zapisyvayut-formuloy",
        "title_lv": "9.7. Kā skaitļu virkni pieraksta ar formulu?",
        "title_ru": "9.7. Как числовую последовательность записывают формулой",
        "desc_lv": "Aritmētiskā progresija, tās īpašības; Aritmētiskās progresijas pielietojums; Skaitļu virknes, skaitļu sakārtojumi",
        "desc_ru": "Арифметическая прогрессия, её свойства; Применение арифметической прогрессии; Числовые последовательности, упорядочивания чисел"
    },
    {
        "grade": 9, "position": 8, "subject": "geometry",
        "slug": "skola2030-g9-8-opisyvayut-vzaimnoe-raspolozhenie-okruzhnosti",
        "title_lv": "9.8. Kā raksturo riņķa līnijas un daudzstūra savstarpējo novietojumu?",
        "title_ru": "9.8. Как описывают взаимное расположение окружности и многоугольника",
        "desc_lv": "Ap trijstūri apvilkta riņķa līnija; Regulāri daudzstūri; Riņķa līnijas pieskare, trijstūrī ievilkta riņķa līnija; Četrstūris un riņķa līnija",
        "desc_ru": "Окружность, описанная около треугольника; Правильные многоугольники; Касательная к окружности, вписанная в треугольник окружность; Четырехугольник и окружность"
    },

    # --- 11. klase (Matemātika I / Vidusskola) ---
    {
        "grade": 11, "position": 1, "subject": "geometry",
        "slug": "skola2030-g11-1-vektory-i-dvizhenie",
        "title_lv": "11.1. Vektori plaknē un telpā, vektoru darbības",
        "title_ru": "11.1. Векторы и движение",
        "desc_lv": "Attālums starp diviem punktiem; Vektora projekcija uz ass; Vektori koordinātu formā plaknē; Vektori telpā; Vektors, tā modulis. Vektoru novietojums; Vektoru izteikšana; Vektoru saskaitīšanas likumi",
        "desc_ru": "Расстояние между двумя точками; Проекция вектора на ось; Векторы в координатной форме на плоскости; Векторы в пространстве; Вектор, его модуль. Расположение векторов; Выражение векторов; Правила сложения векторов"
    },
    {
        "grade": 11, "position": 2, "subject": "geometry",
        "slug": "skola2030-g11-2-uravnenie-linii",
        "title_lv": "11.2. Taisnes un riņķa līnijas vienādojums",
        "title_ru": "11.2. Уравнение линии",
        "desc_lv": "Lineāra funkcija. Funkcijas un argumenta pieaugums; Nevienādība ar 2 mainīgajiem; Paralēlas un perpendikulāras taisnes; Taisnes vienādojums; Vienādojums ar 2 mainīgajiem. Riņķa līnijas vienādojums",
        "desc_ru": "Линейная функция. Приращение функции и аргумента; Неравенство с 2 переменными; Параллельные и перпендикулярные прямые; Уравнение прямой; Уравнение с 2 переменными. Уравнение окружности"
    },
    {
        "grade": 11, "position": 3, "subject": "statistics",
        "slug": "skola2030-g11-3-kombinatorika-i-veroyatnost-i",
        "title_lv": "11.3. Kombinatorika un varbūtību teorija I",
        "title_ru": "11.3. Комбинаторика и вероятность I",
        "desc_lv": "Kombinatorika I; Kombinatorika. Ievads; Kopas. Darbības ar kopām; Summas varbūtība. Nosacītā varbūtība; Varbūtību teorijas elementi",
        "desc_ru": "Комбинаторика I; Комбинаторика. Введение; Множества. Действия с множествами; Вероятность суммы. Условная вероятность; Элементы теории вероятностей"
    },
    {
        "grade": 11, "position": 4, "subject": "statistics",
        "slug": "skola2030-g11-4-statistika-i",
        "title_lv": "11.4. Aprakstošā statistika un izkliedes mēri I",
        "title_ru": "11.4. Статистика I",
        "desc_lv": "Izkliedes mēri, datu grafiska attēlošana; Populācija, izlase un dati. Vidējie lielumi",
        "desc_ru": "Меры рассеяния, графическое представление данных; Популяция, выборка и данные. Средние величины"
    },
    {
        "grade": 11, "position": 5, "subject": "algebra",
        "slug": "skola2030-g11-5-drobno-ratsionalnaya-funktsiya-i",
        "title_lv": "11.5. Algebriskās daļas un daļveida racionāla funkcija",
        "title_ru": "11.5. Дробно-рациональная функция и алгебраические дроби",
        "desc_lv": "Algebriskas daļas. Definīcijas kopa; Algebriski vienādojumi; Algebrisko daļu reizināšana, dalīšana, kāpināšana; Algebrisko daļu saskaitīšana un atņemšana; Algebrisku daļu saīsināšana un paplašināšana; Daļveida funkcija; Identitāte. Zīmju maiņas likums; Racionālas algebriskas izteiksmes",
        "desc_ru": "Алгебраические дроби. Область определения; Алгебраические уравнения; Умножение, деление, возведение в степень алгебраических дробей; Сложение и вычитание алгебраических дробей; Сокращение и расширение алгебраических дробей; Дробно-рациональная функция; Тождество. Закон смены знаков; Рациональные алгебраические выражения"
    },
    {
        "grade": 11, "position": 6, "subject": "algebra",
        "slug": "skola2030-g11-6-drobno-ratsionalnye-uravneniya-i",
        "title_lv": "11.6. Daļveida racionāli vienādojumi un nevienādības",
        "title_ru": "11.6. Дробно-рациональные уравнения и неравенства",
        "desc_lv": "Atkārtojums par lineāru un kvadrātnevienādību risināšanu; Daļveida nevienādības. Intervālu metode; Daļveida vienādojumi; Daļveida vienādojumi teksta uzdevumos",
        "desc_ru": "Повторение решения линейных и квадратных неравенств; Дробно-рациональные неравенства. Метод интервалов; Дробно-рациональные уравнения; Дробно-рациональные уравнения в текстовых задачах"
    },
    {
        "grade": 11, "position": 7, "subject": "geometry",
        "slug": "skola2030-g11-7-funktsii-sinusa-i-kosinusa",
        "title_lv": "11.7. Sinusa un kosinusa funkcijas, sinusu un kosinusu teorēmas",
        "title_ru": "11.7. Функции синуса и косинуса",
        "desc_lv": "Pagrieziena leņķa sinuss un kosinuss; Sakarības taisnleņķa trijstūrī. Atkārtojums; Sinusu un kosinusu teorēma; Trigonometriskās funkcijas, to īpašības",
        "desc_ru": "Синус и косинус угла поворота; Зависимости в прямоугольном треугольнике. Повторение; Теорема синусов и косинусов; Тригонометрические функции, их свойства"
    },
    {
        "grade": 11, "position": 8, "subject": "algebra",
        "slug": "skola2030-g11-8-trigonometricheskie-vyrazheniya-i-uravneniya",
        "title_lv": "11.8. Trigonometriskās formulas un pamatvienādojumi",
        "title_ru": "11.8. Тригонометрические выражения и уравнения",
        "desc_lv": "Argumentu summas un divkāršā argumenta formulas; Sadalīšana reizinātājos un substitūcijas metode; Trigonometriskie pamatvienādojumi; Trigonometriskās izteiksmes un pamatidentitāte",
        "desc_ru": "Формулы суммы аргументов и двойного аргумента; Метод разложения на множители и метод подстановки; Простейшие тригонометрические уравнения; Тригонометрические выражения и основное тождество"
    },
    {
        "grade": 11, "position": 9, "subject": "algebra",
        "slug": "skola2030-g11-9-stepen-s-ratsionalnym-pokazatelem",
        "title_lv": "11.9. Pakāpe ar racionālu kāpinātāju un ģeometriskā progresija",
        "title_ru": "11.9. Степень с рациональным показателем, геометрическая прогрессия",
        "desc_lv": "N-tās pakāpes sakne; Pakāpe ar racionālu kāpinātāju; Virknes; Ģeometriskā progresija",
        "desc_ru": "Корень n-ой степени; Степень с рациональным показателем; Последовательности; Геометрическая прогрессия"
    },
    {
        "grade": 11, "position": 10, "subject": "algebra",
        "slug": "skola2030-g11-10-pokazatelnaya-funktsiya",
        "title_lv": "11.10. Eksponentfunkcija, eksponentvienādojumi un logaritmi",
        "title_ru": "11.10. Показательная функция",
        "desc_lv": "Eksponenciāli procesi; Eksponentfunkcija; Eksponentnevienādības; Eksponentvienādojumi; Pakāpju īpašības. Atkārtojums; Pamatnevienādības. Atkārtojums; Pamatvienādojumi. Atkārtojums; Skaitļa logaritms",
        "desc_ru": "Экспоненциальные процессы; Показательная функция; Показательные неравенства; Показательные уравнения; Свойства степеней. Повторение; Простейшие неравенства. Повторение; Простейшие уравнения. Повторение; Логарифм числа"
    },
    {
        "grade": 11, "position": 11, "subject": "geometry",
        "slug": "skola2030-g11-11-pryamye-i-ploskosti-v",
        "title_lv": "11.11. Taisnes un plaknes telpā, daudzskaldņi un prizmas",
        "title_ru": "11.11. Прямые и плоскости в пространстве, многогранники",
        "desc_lv": "Daudzskaldņa diagonāles un šķēlums ar plakni; Neregulāra piramīda; Prizmas virsma un tilpums; Regulāra trijstūra piramīda; Regulāra četrstūra un sešstūra piramīda; Taisnes un plaknes telpā; Taisnleņķa trijstūra aprēķināšana. Atkārtojums",
        "desc_ru": "Диагонали многогранника и сечение плоскостью; Неправильная пирамида; Поверхность и объем призмы; Правильная треугольная пирамида; Правильная четырехугольная и шестиугольная пирамида; Прямые и плоскости в пространстве; Вычисления в прямоугольном треугольнике. Повторение"
    },
    {
        "grade": 11, "position": 12, "subject": "geometry",
        "slug": "skola2030-g11-12-tela-vrashcheniya",
        "title_lv": "11.12. Rotācijas ķermeņi (cilindrs, konuss, lode)",
        "title_ru": "11.12. Тела вращения",
        "desc_lv": "Cilindra un prizmas ģeometriskās kombinācijas; Cilindrs; Konuss; Lode; Lodes un prizmas ģeometriskās kombinācijas",
        "desc_ru": "Геометрические комбинации цилиндра и призмы; Цилиндр; Конус; Шар; Геометрические комбинации шара и призмы"
    },

    # --- 12. klase (Matemātika II / Padziļinātais kurss) ---
    {
        "grade": 12, "position": 1, "subject": "statistics",
        "slug": "skola2030-g12-1-matematicheskaya-induktsiya",
        "title_lv": "12.1. Matemātiskā indukcija, Paskāla trijstūris un Ņūtona binoms",
        "title_ru": "12.1. Математическая индукция",
        "desc_lv": "Kombinatorika II. Paskāla trijstūris; Matemātiskās indukcijas princips. MIP; Matemātiskās loģikas elementi; Ņūtona binoms",
        "desc_ru": "Комбинаторика II. Треугольник Паскаля; Принцип математической индукции; Элементы математической логики; Бином Ньютона"
    },
    {
        "grade": 12, "position": 2, "subject": "statistics",
        "slug": "skola2030-g12-2-veroyatnost-i-statistika-ii",
        "title_lv": "12.2. Varbūtību sadalījumi, Bernulli formula un pilnā varbūtība II",
        "title_ru": "12.2. Вероятность и статистика II",
        "desc_lv": "Gadījuma lieluma sadalījumi. Bernulli formula; Notikumu apvienojuma varbūtība; Pilnās varbūtības formula; Statistika II",
        "desc_ru": "Распределения случайной величины. Формула Бернулли; Вероятность объединения событий; Формула полной вероятности; Статистика II"
    },
    {
        "grade": 12, "position": 3, "subject": "algebra",
        "slug": "skola2030-g12-3-posledovatelnosti-i-pokazatelnaya-funktsiya",
        "title_lv": "12.3. Skaitļu virkņu robeža, skaitlis e un bezgalīga ģeometriskā progresija",
        "title_ru": "12.3. Последовательности и показательная функция",
        "desc_lv": "Bezgalīgi dilstoša ģeometriskā progresija; Skaitlis e un eksponenciāli procesi; Virknes, to monotonitāte un robeža",
        "desc_ru": "Бесконечно убывающая геометрическая прогрессия; Число e и экспоненциальные процессы; Последовательности, их монотонность и предел"
    },
    {
        "grade": 12, "position": 4, "subject": "algebra",
        "slug": "skola2030-g12-4-stepennaya-funktsiya-i-logarifmicheskaya",
        "title_lv": "12.4. Pakāpes un logaritmiskā funkcija, moduļa vienādojumi",
        "title_ru": "12.4. Степенная функция и логарифмическая функция, модуль",
        "desc_lv": "Inversā funkcija; Iracionālie un logaritmiskie vienādojumi; Logaritmiskie vienādojumi un sistēmas; Logaritmiskā funkcija; Logaritmiskās nevienādības; Moduļa funkcija, vienādojumi, nevienādības; Pakāpes funkcija",
        "desc_ru": "Обратная функция; Иррациональные и логарифмические уравнения; Логарифмические уравнения и системы; Логарифмическая функция; Логарифмические неравенства; Функция модуля, уравнения, неравенства; Степенная функция"
    },
    {
        "grade": 12, "position": 5, "subject": "algebra",
        "slug": "skola2030-g12-5-drobno-ratsionalnaya-funktsiya-i",
        "title_lv": "12.5. Polinomu dalīšana, Bezū teorēma un nenoteiktie koeficienti",
        "title_ru": "12.5. Дробно-рациональная функция и алгебраические преобразования",
        "desc_lv": "Daļveida funkcija; Nenoteikto koeficientu metode; Polinoma dalīšana ar polinomu. Bezū teorēma; Sadalīšana reizinātājos",
        "desc_ru": "Дробно-рациональная функция; Метод неопределенных коэффициентов; Деление многочлена на многочлен. Теорема Безу; Разложение на множители"
    },
    {
        "grade": 12, "position": 6, "subject": "algebra",
        "slug": "skola2030-g12-6-proizvodnaya-i-eyo-primenenie",
        "title_lv": "12.6. Atvasinājums, diferencēšanas kārtulas un funkciju pētīšana",
        "title_ru": "12.6. Производная и её применение",
        "desc_lv": "Atvasinājuma definīcija un interpretācija; Atvasinājuma lietojums funkciju pētīšanā; Atvasināšanas likumi un formulas; Funkcijas nepārtrauktība; Funkciju pētīšana matemātikā un citās jomās; Robeža",
        "desc_ru": "Определение производной и её смысл; Применение производной при исследовании функций; Правила и формулы дифференцирования; Непрерывность функции; Исследование функций в математике и других областях; Предел"
    },
    {
        "grade": 12, "position": 7, "subject": "algebra",
        "slug": "skola2030-g12-7-integral-i-ego-primenenie",
        "title_lv": "12.7. Nenoteiktais un noteiktais integrālis, laukumu aprēķināšana",
        "title_ru": "12.7. Интеграл и его применение",
        "desc_lv": "Daļveida racionālu funkciju integrēšana; Laukuma un tilpuma aprēķināšana ar noteikto integrāli; Nenoteiktais integrālis; Noteiktais integrālis un integrāļa lietojums fizikā; Pāreja uz citas funkcijas diferenciāli",
        "desc_ru": "Интегрирование дробно-рациональных функций; Вычисление площади и объема с помощью определенного интеграла; Неопределенный интеграл; Определенный интеграл и его применение в физике; Переход к дифференциалу другой функции (замена переменной)"
    },
    {
        "grade": 12, "position": 8, "subject": "algebra",
        "slug": "skola2030-g12-8-trigonometriya-ii",
        "title_lv": "12.8. Trigonometriskās nevienādības un inversās trigonometriskās funkcijas",
        "title_ru": "12.8. Тригонометрия II",
        "desc_lv": "Leņķa tangenss un kotangenss; Trigonometriskie vienādojumi un nevienādības; Trigonometriskās un to inversās funkcijas",
        "desc_ru": "Тангенс и котангенс угла; Тригонометрические уравнения и неравенства; Тригонометрические и обратные им функции"
    },
    {
        "grade": 12, "position": 9, "subject": "geometry",
        "slug": "skola2030-g12-9-analiticheskaya-geometriya",
        "title_lv": "12.9. Analītiskā ģeometrija: taisnes, vektori un skalārais reizinājums",
        "title_ru": "12.9. Аналитическая геометрия",
        "desc_lv": "Divu taišņu savstarpējais novietojums. Punkts un taisne; Līnijas plaknē; Taisnes vienādojums; Vektori; Vektoru skalārais reizinājums",
        "desc_ru": "Взаимное расположение двух прямых. Точка и прямая; Линии на плоскости; Уравнение прямой; Векторы; Скалярное произведение векторов"
    },
    {
        "grade": 12, "position": 10, "subject": "geometry",
        "slug": "skola2030-g12-10-planimetriya-ii",
        "title_lv": "12.10. Padziļinātā planimetrija: sakarības daudzstūros un riņķī",
        "title_ru": "12.10. Планиметрия II",
        "desc_lv": "Ar riņķa līniju saistītie leņķi un nogriežņi; Sakarības daudzstūros, regulāros daudzstūros; Sakarības trijstūros; Sakarības četrstūros; Ģeometriskie pārveidojumi",
        "desc_ru": "Углы и отрезки, связанные с окружностью; Зависимости в многоугольниках, правильных многоугольниках; Зависимости в треугольниках; Зависимости в четырехугольниках; Геометрические преобразования"
    },
    {
        "grade": 12, "position": 11, "subject": "geometry",
        "slug": "skola2030-g12-11-stereometriya-ii",
        "title_lv": "12.11. Padziļinātā stereometrija: ķermeņu šķēlumi un kombinācijas",
        "title_ru": "12.11. Стереометрия II",
        "desc_lv": "Daudzskaldņi, to šķēlums ar plakni; Konusa un piramīdas ģeometriskās kombinācijas; Lodes, cilindra un konusa ģeometriskās kombinācijas; Prizmas un cilindra ģeometriskās kombinācijas; Prizmas un lodes, piramīdas un lodes kombinācijas",
        "desc_ru": "Многогранники, их сечение плоскостью; Геометрические комбинации конуса и пирамиды; Геометрические комбинации шара, цилиндра и конуса; Геометрические комбинации призмы и цилиндра; Комбинации призмы и шара, пирамиды и шара"
    },
    {
        "grade": 12, "position": 12, "subject": "algebra",
        "slug": "skola2030-g12-12-kompleksnye-zadachi-po-algebre",
        "title_lv": "12.12. Kompleksie uzdevumi algebrā, vienādojumi ar parametriem",
        "title_ru": "12.12. Комплексные задачи по алгебре",
        "desc_lv": "Atkārtojums. Pamatvienādojumu veidi; Substitūcijas metode. Vienādojumi un nevienādības; Vienādojumi ar parametru; Vienādojumu risināšana, sadalot reizinātājos",
        "desc_ru": "Повторение. Виды простейших уравнений; Метод подстановки. Уравнения и неравенства; Уравнения с параметром; Решение уравнений разложением на множители"
    }
]

def generate_sql():
    sql_lines = [
        "-- ============================================================================",
        "-- Seed-файл: Полный каталог тем Skola2030 (1–12 классы) и мультиязычные задачи",
        "-- Запуск в Supabase: SQL Editor -> New query -> Вставить всё -> Run",
        "-- ============================================================================",
        "",
        "-- 0. Обновление ограничений до 12 классов и мультиязычность",
        "alter table public.topics drop constraint if exists topics_grade_range;",
        "alter table public.topics drop constraint if exists topics_grade_check;",
        "alter table public.topics add constraint topics_grade_range check (grade is null or grade between 1 and 12);",
        "",
        "alter table public.tasks drop constraint if exists tasks_grade_range;",
        "alter table public.tasks drop constraint if exists tasks_grade_check;",
        "alter table public.tasks add constraint tasks_grade_range check (grade is null or grade between 1 and 12);",
        "",
        "alter table public.subjects add column if not exists title_lv text;",
        "",
        "alter table public.topics add column if not exists title_lv text;",
        "alter table public.topics add column if not exists description_lv text;",
        "",
        "alter table public.tasks add column if not exists title_lv text;",
        "alter table public.tasks add column if not exists condition_latex_lv text;",
        "alter table public.tasks add column if not exists solution_latex_lv text;",
        "",
        "-- 1. Базовые разделы Skola2030 (Lielās idejas / Mācību jomas)",
        "insert into public.subjects (title, title_lv, slug, icon, position)",
        "values",
        "  ('Алгебра и числа', 'Algebra un skaitļi', 'algebra', 'x²', 1),",
        "  ('Геометрия и измерения', 'Ģeometrija un mērījumi', 'geometry', '△', 2),",
        "  ('Статистика и вероятность', 'Statistika un varbūtība', 'statistics', '📊', 3)",
        "on conflict (slug) do update set",
        "  title = excluded.title,",
        "  title_lv = excluded.title_lv,",
        "  icon = excluded.icon,",
        "  position = excluded.position;",
        "",
        f"-- 2. Полный каталог тем стандарта Skola2030 (1–12 классы, {len(TOPICS_DEF)} тем)",
        "insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)",
        "values"
    ]

    val_lines = []
    for t in TOPICS_DEF:
        esc_title_ru = t['title_ru'].replace("'", "''")
        esc_title_lv = t['title_lv'].replace("'", "''")
        esc_desc_ru = t['desc_ru'].replace("'", "''") if t['desc_ru'] else ""
        esc_desc_lv = t['desc_lv'].replace("'", "''") if t['desc_lv'] else ""
        line = f"  ('{esc_title_ru}', '{esc_title_lv}', '{t['slug']}', (select id from public.subjects where slug = '{t['subject']}'), {t['grade']}, {t['position']}, '{esc_desc_ru}', '{esc_desc_lv}')"
        val_lines.append(line)

    sql_lines.append(",\n".join(val_lines))
    sql_lines.extend([
        "on conflict (slug) do update set",
        "  title = excluded.title,",
        "  title_lv = excluded.title_lv,",
        "  subject_id = excluded.subject_id,",
        "  grade = excluded.grade,",
        "  position = excluded.position,",
        "  description = excluded.description,",
        "  description_lv = excluded.description_lv;",
        "",
        "-- 3. Примеры задач стандарта Skola2030 с пошаговыми решениями и мультиязычностью",
        "insert into public.tasks (topic_id, title, title_lv, grade, condition_latex, condition_latex_lv, answer_latex, solution_latex, solution_latex_lv, difficulty, position, is_published)",
        "select",
        "  t.id,",
        "  v.title, v.title_lv,",
        "  v.grade,",
        "  v.condition_latex, v.condition_latex_lv,",
        "  v.answer_latex,",
        "  v.solution_latex, v.solution_latex_lv,",
        "  v.difficulty,",
        "  v.position,",
        "  true",
        "from (",
        "  values",
        "    -- 1 класс: Сложение и вычитание в пределах 10",
        "    (",
        "      'skola2030-g1-2-skolko-vsego-skolko-ostalos',",
        "      'Сложение в пределах 10', 'Saskaitīšana 10 apjomā',",
        "      1,",
        "      'Вычислите значение суммы: $$4 + 3 = ?$$',",
        "      'Aprēķiniet summas vērtību: $$4 + 3 = ?$$',",
        "      '$7$',",
        "      'Прибавим к числу $4$ три единицы: $4 + 1 = 5$, $5 + 1 = 6$, $6 + 1 = 7$. Ответ: $7$.',",
        "      'Pieskaitām skaitlim $4$ trīs vienus: $4 + 1 = 5$, $5 + 1 = 6$, $6 + 1 = 7$. Atbilde: $7$.',",
        "      'Лёгкий', 1",
        "    ),",
        "    -- 7 класс: Линейные уравнения",
        "    (",
        "      'skola2030-g7-8-priemy-opredeleniya-neizvestnogo-lineynoe',",
        "      'Линейное уравнение со скобками', 'Lineārs vienādojums ar iekavām',",
        "      7,",
        "      'Решите уравнение: $$3(2x - 5) + 4 = 5x - 7$$',",
        "      'Atrisiniet vienādojumu: $$3(2x - 5) + 4 = 5x - 7$$',",
        "      '$x = 4$',",
        "      'Раскроем скобки в левой части уравнения:\n$$6x - 15 + 4 = 5x - 7$$\n$$6x - 11 = 5x - 7$$\nПеренесём слагаемые с переменной влево, а числа вправо:\n$$6x - 5x = -7 + 11$$\n$$x = 4$$',",
        "      'Atveriet iekavas vienādojuma kreisajā pusē:\n$$6x - 15 + 4 = 5x - 7$$\n$$6x - 11 = 5x - 7$$\nPārnesiet saskaitāmos ar mainīgo pa kreisi, bet skaitļus pa labi:\n$$6x - 5x = -7 + 11$$\n$$x = 4$$',",
        "      'Средний', 1",
        "    ),",
        "    -- 8 класс: Теорема Пифагора",
        "    (",
        "      'skola2030-g8-8-opredelyayut-neizvestnuyu-storonu-pryamougolnogo',",
        "      'Нахождение гипотенузы', 'Hipotēzes aprēķināšana',",
        "      8,",
        "      'В прямоугольном треугольнике катеты равны $a = 6$ см и $b = 8$ см. Найдите длину гипотенузы $c$.',",
        "      'Taisnleņķa trijstūrī katetes ir $a = 6$ cm un $b = 8$ cm. Aprēķiniet hipotenūzas $c$ garumu.',",
        "      '$10$ см',",
        "      'По теореме Пифагора для прямоугольного треугольника:\n$$c^2 = a^2 + b^2$$\nПодставим известные значения:\n$$c^2 = 6^2 + 8^2 = 36 + 64 = 100$$\nТак как длина стороны положительна, $c = \\sqrt{100} = 10$ см.',",
        "      'Pēc Pitagora teorēmas taisnleņķa trijstūrī:\n$$c^2 = a^2 + b^2$$\nIevietojam dotās vērtības:\n$$c^2 = 6^2 + 8^2 = 36 + 64 = 100$$\nTā kā malas garums ir pozitīvs, $c = \\sqrt{100} = 10$ cm.',",
        "      'Легкий', 1",
        "    ),",
        "    -- 9 класс: Подобные треугольники",
        "    (",
        "      'skola2030-g9-1-opredelyayut-i-kharakterizuyut-podobnye',",
        "      'Коэффициент подобия треугольников', 'Trijstūru līdzības koeficients',",
        "      9,",
        "      'Треугольники $ABC$ и $A_1B_1C_1$ подобны. Стороны первого треугольника равны $3$, $4$ и $5$, а сходственная меньшая сторона второго треугольника равна $6$. Найдите коэффициент подобия и периметр второго треугольника.',",
        "      'Trijstūri $ABC$ un $A_1B_1C_1$ ir līdzīgi. Pirmā trijstūra malas ir $3$, $4$ un $5$, bet otrā trijstūra atbilstošā mazākā mala ir $6$. Atrodiet līdzības koeficientu un otrā trijstūra perimetru.',",
        "      '$k = 2$, $P = 24$',",
        "      '1) Найдём коэффициент подобия $k$ по отношению наименьших сходственных сторон:\n$$k = \\frac{6}{3} = 2$$\n2) Периметр первого треугольника:\n$$P_1 = 3 + 4 + 5 = 12$$\n3) Периметр подобного треугольника пропорционален коэффициенту $k$:\n$$P_2 = k \\cdot P_1 = 2 \\cdot 12 = 24$$',",
        "      '1) Atrodam līdzības koeficientu $k$ no mazāko atbilstošo malu attiecības:\n$$k = \\frac{6}{3} = 2$$\n2) Pirmā trijstūra perimetrs:\n$$P_1 = 3 + 4 + 5 = 12$$\n3) Līdzīgā trijstūra perimetrs ir proporcionāls koeficientam $k$:\n$$P_2 = k \\cdot P_1 = 2 \\cdot 12 = 24$$',",
        "      'Средний', 1",
        "    ),",
        "    -- 11 класс (Matemātika I): Показательные уравнения",
        "    (",
        "      'skola2030-g11-10-pokazatelnaya-funktsiya',",
        "      'Простейшее логарифмическое уравнение', 'Vienkāršs logaritmiskais vienādojums',",
        "      11,",
        "      'Решите уравнение: $$\\log_2(x - 3) = 3$$',",
        "      'Atrisiniet vienādojumu: $$\\log_2(x - 3) = 3$$',",
        "      '$x = 11$',",
        "      'По определению логарифма $\\log_a b = c \\iff b = a^c$ при $b > 0$:\n$$x - 3 = 2^3 = 8 \\implies x = 11$$\nПроверка: $11 - 3 = 8 > 0$ — верно.',",
        "      'Pēc logaritma definīcijas:\n$$x - 3 = 2^3 = 8 \\implies x = 11$$\nPārbaude: $\\log_2 8 = 3$ — patiess.',",
        "      'Средний', 1",
        "    ),",
        "    -- 12 класс (Matemātika II): Производная функции",
        "    (",
        "      'skola2030-g12-6-proizvodnaya-i-eyo-primenenie',",
        "      'Производная функции в точке', 'Funkcijas atvasinājums punktā',",
        "      12,",
        "      'Найдите значение производной функции $f(x) = 3x^2 - 4x + 5$ в точке $x_0 = 2$.',",
        "      'Aprēķiniet funkcijas $f(x) = 3x^2 - 4x + 5$ atvasinājuma vērtību punktā $x_0 = 2$.',",
        "      '$f''(2) = 8$',",
        "      'Найдём общую формулу производной:\n$$f''(x) = (3x^2)'' - (4x)'' + (5)'' = 6x - 4$$\nПодставим $x_0 = 2$:\n$$f''(2) = 6 \\cdot 2 - 4 = 12 - 4 = 8$$',",
        "      'Atrodiet atvasinājumu:\n$$f''(x) = 6x - 4$$\nIevietojiet $x_0 = 2$:\n$$f''(2) = 6 \\cdot 2 - 4 = 8$$',",
        "      'Средний', 1",
        "    )",
        ") as v(slug, title, title_lv, grade, condition_latex, condition_latex_lv, answer_latex, solution_latex, solution_latex_lv, difficulty, position)",
        "join public.topics t on t.slug = v.slug",
        "where not exists (",
        "  select 1 from public.tasks tk where tk.topic_id = t.id and tk.title = v.title",
        ");",
        ""
    ])

    return "\n".join(sql_lines)

def generate_json_catalog():
    catalog = []
    for idx, t in enumerate(TOPICS_DEF, start=1):
        g = t['grade']
        grade_name = f"{g} класс" if g <= 9 else ("Matemātika I (11 класс)" if g == 11 else "Matemātika II (12 класс)")
        
        subtopics_ru = [s.strip() for s in (t['desc_ru'] or '').split(';') if s.strip()]
        subtopics_lv = [s.strip() for s in (t['desc_lv'] or '').split(';') if s.strip()]
        subtopics = []
        for i in range(max(len(subtopics_ru), len(subtopics_lv))):
            s_ru = subtopics_ru[i] if i < len(subtopics_ru) else (subtopics_lv[i] if i < len(subtopics_lv) else "")
            s_lv = subtopics_lv[i] if i < len(subtopics_lv) else s_ru
            subtopics.append({"ru": s_ru, "lv": s_lv})

        catalog.append({
            "id": idx,
            "slug": t['slug'],
            "grade": t['grade'],
            "grade_name": grade_name,
            "subject_slug": t['subject'],
            "position": t['position'],
            "title_ru": t['title_ru'],
            "title_lv": t['title_lv'],
            "description_ru": t['desc_ru'],
            "description_lv": t['desc_lv'],
            "subtopics": subtopics
        })
    return catalog

def main():
    sql = generate_sql()
    with open('supabase/seed_skola2030.sql', 'w', encoding='utf-8') as f:
        f.write(sql)
    print("Updated supabase/seed_skola2030.sql")

    cat = generate_json_catalog()
    cat_json = json.dumps(cat, ensure_ascii=False, indent=2)
    
    with open('supabase/skola2030_topics.json', 'w', encoding='utf-8') as f:
        f.write(cat_json)
    print("Updated supabase/skola2030_topics.json")

    with open('public/data/skola2030_topics.json', 'w', encoding='utf-8') as f:
        f.write(cat_json)
    print("Updated public/data/skola2030_topics.json")

    if os.path.exists('dist/data/skola2030_topics.json'):
        with open('dist/data/skola2030_topics.json', 'w', encoding='utf-8') as f:
            f.write(cat_json)
        print("Updated dist/data/skola2030_topics.json")

    print(f"All done! Total topics: {len(TOPICS_DEF)}")

if __name__ == '__main__':
    main()
