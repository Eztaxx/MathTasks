# -*- coding: utf-8 -*-
import json
import os

topics_data = [
    {
        "slug": "visp-skaitliski-aprekini-dzive",
        "subject_slug": "algebra",
        "grade": 10,
        "position": 1,
        "title_ru": "Числовые расчеты в жизненных ситуациях",
        "title_lv": "Skaitliski aprēķini dzīves darbībās",
        "description_ru": "Округление, оценка правдоподобия результатов, расчет стоимости покупок, коммунальных платежей и расхода топлива.",
        "description_lv": "Noapaļošana, rezultātu ticamības novērtēšana, pirkumu, komunālo maksājumu un degvielas patēriņa aprēķini.",
        "tags": ["teksta-uzdevumi", "modelesana"],
        "tasks": [
            {
                "title_ru": "Расход топлива и стоимость поездки",
                "title_lv": "Degvielas patēriņš un brauciena izmaksas",
                "condition_latex_ru": "Автомобиль расходует в среднем $6{,}5\\text{ л}$ бензина на $100\\text{ км}$. Стоимость бензина — $1{,}60\\text{ €}$ за литр. Какова стоимость топлива для поездки из Риги в Даугавпилс длиной $220\\text{ км}$?",
                "condition_latex_lv": "Automašīna patērē vidēji $6{,}5\\text{ l}$ degvielas uz $100\\text{ km}$. Degvielas cena ir $1{,}60\\text{ €/l}$. Cik eiro izmaksās degviela braucienam no Rīgas uz Daugavpili ($220\\text{ km}$)?",
                "answer_latex": "22.88",
                "solution_latex_ru": "1) Вычисляем общий объём бензина: $V = \\frac{220}{100} \\cdot 6{,}5 = 2{,}2 \\cdot 6{,}5 = 14{,}3\\text{ л}$.\n2) Вычисляем общую стоимость: $14{,}3 \\cdot 1{,}60 = 22{,}88\\text{ €}$.",
                "solution_latex_lv": "1) Aprēķina degvielas daudzumu: $V = \\frac{220}{100} \\cdot 6{,}5 = 14{,}3\\text{ l}$.\n2) Aprēķina brauciena izmaksas: $14{,}3 \\cdot 1{,}60 = 22{,}88\\text{ €}$.",
                "difficulty": "Средний",
                "grade": 10,
                "tags": ["teksta-uzdevumi", "modelesana"]
            }
        ]
    },
    {
        "slug": "visp-procenti-krediti-finanses",
        "subject_slug": "algebra",
        "grade": 10,
        "position": 2,
        "title_ru": "Проценты, кредиты и финансовые расчеты",
        "title_lv": "Procenti, kredīti un finanšu aprēķini",
        "description_ru": "Скидки, налог на добавленную стоимость (PVN), простые и сложные проценты по вкладам и кредитам.",
        "description_lv": "Atlaides, pievienotās vērtības nodoklis (PVN), vienkāršie un saliktie procenti noguldījumiem un kredītiem.",
        "tags": ["dalas-procenti", "teksta-uzdevumi", "modelesana"],
        "tasks": [
            {
                "title_ru": "Расчет цены с налогом PVN (21%)",
                "title_lv": "Cenas aprēķins ar PVN (21%)",
                "condition_latex_ru": "Цена ноутбука без налога на добавленную стоимость (PVN) составляет $450\\text{ €}$. Ставка PVN равна $21\\%$. Какова окончательная цена ноутбука в магазине?",
                "condition_latex_lv": "Portatīvā datora cena bez pievienotās vērtības nodokļa (PVN) ir $450\\text{ €}$. PVN likme ir $21\\%$. Cik eiro jāmaksā par datoru veikalā ar PVN?",
                "answer_latex": "544.5",
                "solution_latex_ru": "1) Сумма PVN: $450 \\cdot 0{,}21 = 94{,}50\\text{ €}$.\n2) Окончательная цена: $450 + 94{,}50 = 544{,}50\\text{ €}$ (или $450 \\cdot 1{,}21 = 544{,}50\\text{ €}$).",
                "solution_latex_lv": "1) PVN summa: $450 \\cdot 0{,}21 = 94{,}50\\text{ €}$.\n2) Gala cena: $450 + 94{,}50 = 544{,}50\\text{ €}$ (jeb $450 \\cdot 1{,}21 = 544{,}50\\text{ €}$).",
                "difficulty": "Лёгкий",
                "grade": 10,
                "tags": ["dalas-procenti", "teksta-uzdevumi"]
            },
            {
                "title_ru": "Сложные проценты по банковскому депозиту",
                "title_lv": "Saliktie procenti bankas noguldījumam",
                "condition_latex_ru": "В банк положен вклад в размере $2000\\text{ €}$ под $4\\%$ годовых со сложными процентами. Какая сумма будет на счёте через $2$ года?",
                "condition_latex_lv": "Bankā noguldīti $2000\\text{ €}$ ar $4\\%$ gada procentu likmi (saliktie procenti). Kāda summa būs kontā pēc $2$ gadiem?",
                "answer_latex": "2163.2",
                "solution_latex_ru": "Используем формулу сложных процентов: $S = S_0 (1 + p)^n$.\n$S = 2000 \\cdot (1 + 0{,}04)^2 = 2000 \\cdot 1{,}0816 = 2163{,}20\\text{ €}$.",
                "solution_latex_lv": "Izmanto salikto procentu formulu: $S = S_0 (1 + p)^n$.\n$S = 2000 \\cdot (1 + 0{,}04)^2 = 2000 \\cdot 1{,}0816 = 2163{,}20\\text{ €}$.",
                "difficulty": "Средний",
                "grade": 10,
                "tags": ["dalas-procenti", "modelesana"]
            }
        ]
    },
    {
        "slug": "visp-izteiksmes-un-formulas",
        "subject_slug": "algebra",
        "grade": 10,
        "position": 3,
        "title_ru": "Преобразование выражений и работа с формулами",
        "title_lv": "Izteiksmju pārveidošana un formulu lietošana",
        "description_ru": "Выражение неизвестной переменной из формулы, раскрытие скобок, приведение подобных слагаемых.",
        "description_lv": "Nezināmā lieluma izteikšana no formulas, iekavu atvēršana, līdzīgo saskaitāmo savilkšana.",
        "tags": ["algebriskie-parveidojumi"],
        "tasks": [
            {
                "title_ru": "Выражение переменной из формулы площади трапеции",
                "title_lv": "Mainīgā izteikšana no trapeces laukuma formulas",
                "condition_latex_ru": "Площадь трапеции задаётся формулой $S = \\frac{a + b}{2} \\cdot h$. Выразите основание $a$ через $S$, $b$ и $h$.",
                "condition_latex_lv": "Trapeces laukuma formula ir $S = \\frac{a + b}{2} \\cdot h$. Izsakiet pamatu $a$ ar $S$, $b$ un $h$ palīdzību.",
                "answer_latex": "(2S)/h - b",
                "solution_latex_ru": "1) Умножаем обе части на $2$: $2S = (a + b) \\cdot h$.\n2) Делим обе части на $h$: $\\frac{2S}{h} = a + b$.\n3) Вычитаем $b$: $a = \\frac{2S}{h} - b$.",
                "solution_latex_lv": "1) Sareizina abas puses ar $2$: $2S = (a + b) \\cdot h$.\n2) Izdala abas puses ar $h$: $\\frac{2S}{h} = a + b$.\n3) Atņem $b$: $a = \\frac{2S}{h} - b$.",
                "difficulty": "Средний",
                "grade": 10,
                "tags": ["algebriskie-parveidojumi"]
            }
        ]
    },
    {
        "slug": "visp-vienadojumi-praktiski",
        "subject_slug": "algebra",
        "grade": 10,
        "position": 4,
        "title_ru": "Линейные и квадратные уравнения в практическом контексте",
        "title_lv": "Lineāri un kvadrātvienādojumi praktiskos kontekstos",
        "description_ru": "Решение уравнений, составление математических моделей для практических и сюжетных задач.",
        "description_lv": "Vienādojumu risināšana, matemātisko modeļu veidošana praktiskām un teksta situācijām.",
        "tags": ["vienadojumi", "teksta-uzdevumi"],
        "tasks": [
            {
                "title_ru": "Размеры прямоугольного участка",
                "title_lv": "Taisnstūra formas zemesgabala izmēri",
                "condition_latex_ru": "Длина прямоугольного участка на $5\\text{ м}$ больше его ширины. Площадь участка равна $300\\text{ м}^2$. Найдите ширину участка в метрах.",
                "condition_latex_lv": "Taisnstūrveida zemesgabala garums ir par $5\\text{ m}$ lielāks nekā tā platums. Zemesgabala laukums ir $300\\text{ м}^2$. Aprēķiniet zemesgabala platumu metros.",
                "answer_latex": "15",
                "solution_latex_ru": "Обозначим ширину через $x$. Тогда длина равна $x + 5$.\nПлощадь: $x(x + 5) = 300 \\implies x^2 + 5x - 300 = 0$.\nДискриминант: $D = 25 - 4 \\cdot (-300) = 1225 = 35^2$.\nКорни: $x_1 = \\frac{-5 + 35}{2} = 15$, $x_2 = -20$ (не подходит, так как длина положительна).\nШирина участка равна $15\\text{ м}$.",
                "solution_latex_lv": "Pieņemsim, ka platums ir $x\\text{ m}$. Tad garums ir $(x + 5)\\text{ m}$.\nLaukums: $x(x + 5) = 300 \\implies x^2 + 5x - 300 = 0$.\nDiskriminants: $D = 1225 = 35^2$.\nSaknes: $x_1 = \\frac{-5 + 35}{2} = 15$, $x_2 = -20$ (neder).\nZemesgabala platums ir $15\\text{ m}$.",
                "difficulty": "Средний",
                "grade": 10,
                "tags": ["vienadojumi", "teksta-uzdevumi"]
            }
        ]
    },
    {
        "slug": "visp-nevienadibas-intervali",
        "subject_slug": "algebra",
        "grade": 10,
        "position": 5,
        "title_ru": "Неравенства и числовые промежутки",
        "title_lv": "Nevienādības un skaitļu intervāli",
        "description_ru": "Линейные неравенства, числовая прямая, объединение и пересечение числовых промежутков.",
        "description_lv": "Lineāras nevienādības, skaitļu taisne, intervālu apvienojums un šķēlums.",
        "tags": ["nevienadibas", "grafiki"],
        "tasks": [
            {
                "title_ru": "Решение линейного неравенства",
                "title_lv": "Lineāras nevienādības atrisināšana",
                "condition_latex_ru": "Решите неравенство $3(x - 2) \\le 5x + 4$. Запишите наименьшее целое число, удовлетворяющее этому неравенству.",
                "condition_latex_lv": "Atrisiniet nevienādību $3(x - 2) \\le 5x + 4$. Uzrakstiet mazāko veselo skaitli, kas ir šīs nevienādības atrisinājums.",
                "answer_latex": "-5",
                "solution_latex_ru": "$3x - 6 \\le 5x + 4 \\implies -2x \\le 10 \\implies x \\ge -5$.\nНаименьшее целое число: $-5$.",
                "solution_latex_lv": "$3x - 6 \\le 5x + 4 \\implies -2x \\le 10 \\implies x \\ge -5$.\nMazākais veselais skaitlis: $-5$.",
                "difficulty": "Лёгкий",
                "grade": 10,
                "tags": ["nevienadibas"]
            }
        ]
    },
    {
        "slug": "visp-funkcija-sakariba",
        "subject_slug": "algebra",
        "grade": 10,
        "position": 6,
        "title_ru": "Функция как зависимость между величинами",
        "title_lv": "Funkcija kā sakarība starp lielumiem",
        "description_ru": "Понятие функции, аргумент и значение функции, область определения и область значений.",
        "description_lv": "Funkcijas jēdziens, arguments un funkcijas vērtība, definīcijas un vērtību apgabals.",
        "tags": ["funkcijas", "modelesana"],
        "tasks": [
            {
                "title_ru": "Вычисление значения функции по аргументу",
                "title_lv": "Funkcijas vērtības aprēķins pēc argumenta",
                "condition_latex_ru": "Функция задана формулой $f(x) = 2x^2 - 3x + 5$. Вычислите $f(-2)$.",
                "condition_latex_lv": "Funkcija dota ar formulu $f(x) = 2x^2 - 3x + 5$. Aprēķiniet $f(-2)$.",
                "answer_latex": "19",
                "solution_latex_ru": "$f(-2) = 2(-2)^2 - 3(-2) + 5 = 2 \\cdot 4 + 6 + 5 = 8 + 6 + 5 = 19$.",
                "solution_latex_lv": "$f(-2) = 2(-2)^2 - 3(-2) + 5 = 8 + 6 + 5 = 19$.",
                "difficulty": "Лёгкий",
                "grade": 10,
                "tags": ["funkcijas"]
            }
        ]
    },
    {
        "slug": "visp-lineara-funkcija",
        "subject_slug": "algebra",
        "grade": 10,
        "position": 7,
        "title_ru": "Линейная функция и её применение",
        "title_lv": "Lineāra funkcija un tās lietojums",
        "description_ru": "Прямая пропорциональность, угловой коэффициент, построение прямой и чтение графика.",
        "description_lv": "Tiešā proporcionalitāte, virziena koeficients, taisnes konstruēšana un grafika nolasīšana.",
        "tags": ["funkcijas", "grafiki", "koordinatu-metode"],
        "tasks": [
            {
                "title_ru": "Точка пересечения прямой с осью абсцисс",
                "title_lv": "Taisnes krustpunkts ar X asi",
                "condition_latex_ru": "Найдите координату $x$ точки пересечения графика функции $y = 3x - 12$ с осью $Ox$.",
                "condition_latex_lv": "Nosakiet funkcijas $y = 3x - 12$ grafika krustpunkta ar $Ox$ asi abscisu $x$.",
                "answer_latex": "4",
                "solution_latex_ru": "На оси $Ox$ значение $y = 0$. Подставляем: $0 = 3x - 12 \\implies 3x = 12 \\implies x = 4$.",
                "solution_latex_lv": "Uz $Ox$ ass $y = 0$. $0 = 3x - 12 \\implies 3x = 12 \\implies x = 4$.",
                "difficulty": "Лёгкий",
                "grade": 10,
                "tags": ["funkcijas", "grafiki"]
            }
        ]
    },
    {
        "slug": "visp-kvadratfunkcija-grafiks",
        "subject_slug": "algebra",
        "grade": 10,
        "position": 8,
        "title_ru": "Квадратичная функция и её график",
        "title_lv": "Kvadrātfunkcija un tās grafiks",
        "description_ru": "Вершина параболы, направление ветвей, нули функции, моделирование траектории движения.",
        "description_lv": "Parabolas virsotne, zaru virziens, funkcijas nulles, kustības trajektorijas modelēšana.",
        "tags": ["funkcijas", "grafiki", "modelesana"],
        "tasks": [
            {
                "title_ru": "Координаты вершины параболы",
                "title_lv": "Parabolas virsotnes koordinātas",
                "condition_latex_ru": "Дана функция $y = x^2 - 6x + 8$. Найдите координату $y$ вершины параболы.",
                "condition_latex_lv": "Dota funkcija $y = x^2 - 6x + 8$. Aprēķiniet parabolas virsotnes ordinātu $y$.",
                "answer_latex": "-1",
                "solution_latex_ru": "$x_0 = -\\frac{b}{2a} = -\\frac{-6}{2} = 3$.\n$y_0 = 3^2 - 6 \\cdot 3 + 8 = 9 - 18 + 8 = -1$.",
                "solution_latex_lv": "$x_0 = -\\frac{-6}{2} = 3$.\n$y_0 = 3^2 - 6 \\cdot 3 + 8 = -1$.",
                "difficulty": "Средний",
                "grade": 10,
                "tags": ["funkcijas", "grafiki"]
            }
        ]
    },
    {
        "slug": "visp-grafiki-tabulas-dati",
        "subject_slug": "algebra",
        "grade": 10,
        "position": 9,
        "title_ru": "Чтение графиков и таблиц в реальных данных",
        "title_lv": "Grafiku un tabulu lasīšana reālos datos",
        "description_ru": "Анализ графиков температуры, потребления электроэнергии, скорости, поиск экстремумов и интервалов возрастания.",
        "description_lv": "Temperatūras, elektrības patēriņa un ātruma grafiku analīze, ekstrēmu un pieauguma intervālu noteikšana.",
        "tags": ["grafiki", "statistika"],
        "tasks": [
            {
                "title_ru": "Анализ показаний счетчика электроэнергии",
                "title_lv": "Elektroenerģijas patēriņa aprēķins",
                "condition_latex_ru": "Показания счетчика в начале месяца — $3420\\text{ кВт}\\cdot\\text{ч}$, в конце месяца — $3610\\text{ кВт}\\cdot\\text{ч}$. Тариф составляет $0{,}18\\text{ €}$ за $1\\text{ кВт}\\cdot\\text{ч}$. Какова плата за потреблённую электроэнергию за месяц?",
                "condition_latex_lv": "Elektrības skaitītāja rādījums mēneša sākumā bija $3420\\text{ kWh}$, bet mēneša beigās — $3610\\text{ kWh}$. Maksa par $1\\text{ kWh}$ ir $0{,}18\\text{ €}$. Cik eiro jāmaksā par patērēto elektrību?",
                "answer_latex": "34.2",
                "solution_latex_ru": "1) Потребление: $3610 - 3420 = 190\\text{ кВт}\\cdot\\text{ч}$.\n2) Стоимость: $190 \\cdot 0{,}18 = 34{,}20\\text{ €}$.",
                "solution_latex_lv": "1) Patēriņš: $3610 - 3420 = 190\\text{ kWh}$.\n2) Maksa: $190 \\cdot 0{,}18 = 34{,}20\\text{ €}$.",
                "difficulty": "Лёгкий",
                "grade": 10,
                "tags": ["teksta-uzdevumi", "statistika"]
            }
        ]
    },
    {
        "slug": "visp-trigonometrija-taisnlenkis",
        "subject_slug": "geometry",
        "grade": 10,
        "position": 10,
        "title_ru": "Тригонометрические соотношения в прямоугольном треугольнике",
        "title_lv": "Trigonometriskās sakarības taisnleņķa trijstūrī",
        "description_ru": "Синус, косинус, тангенс, теорема Пифагора, прикладные задачи на наклонные плоскости и лестницы.",
        "description_lv": "Sinuss, kosinuss, tangenss, Pitagora teorēma, kāpņu un slīpumu aprēķini.",
        "tags": ["trigonometrija", "planimetrija", "merijumi"],
        "tasks": [
            {
                "title_ru": "Длина приставной лестницы",
                "title_lv": "Pieslienamo kāpņu garums",
                "condition_latex_ru": "Лестница приставлена к вертикальной стене под углом $60^\\circ$ к земле. Основание лестницы отстоит от стены на $2\\text{ м}$. Найдите длину лестницы в метрах.",
                "condition_latex_lv": "Kāpnes atbalstītas pret sienu $60^\\circ$ leņķī pret zemi. Kāpņu pamatne atrodas $2\\text{ m}$ attālumā no sienas. Aprēķiniet kāpņu garumu metros.",
                "answer_latex": "4",
                "solution_latex_ru": "В прямоугольном треугольнике прилежащий катет равен $2\\text{ м}$, угол равен $60^\\circ$.\n$\\cos 60^\\circ = \\frac{2}{L} \\implies \\frac{1}{2} = \\frac{2}{L} \\implies L = 4\\text{ м}$.",
                "solution_latex_lv": "$\\cos 60^\\circ = \\frac{2}{L} \\implies \\frac{1}{2} = \\frac{2}{L} \\implies L = 4\\text{ m}$.",
                "difficulty": "Лёгкий",
                "grade": 10,
                "tags": ["trigonometrija", "planimetrija"]
            }
        ]
    },
    {
        "slug": "visp-sinusu-kosinusu-teorema",
        "subject_slug": "geometry",
        "grade": 10,
        "position": 11,
        "title_ru": "Применение теорем синусов и косинусов",
        "title_lv": "Sinusu un kosinusu teorēmas lietojums",
        "description_ru": "Решение произвольных треугольников, нахождение третьей стороны по двум сторонам и углу между ними.",
        "description_lv": "Patvaļīgu trijstūru risināšana, trešās malas noteikšana pēc divām malām un leņķa starp tām.",
        "tags": ["trigonometrija", "planimetrija"],
        "tasks": [
            {
                "title_ru": "Вычисление стороны по теореме косинусов",
                "title_lv": "Malas aprēķins pēc kosinusu teorēmas",
                "condition_latex_ru": "В треугольнике $ABC$ стороны $AB = 5\\text{ см}$, $AC = 8\\text{ см}$, а угол $\\angle A = 60^\\circ$. Найдите сторону $BC$ в сантиметрах.",
                "condition_latex_lv": "Trijstūrī $ABC$ malas ir $AB = 5\\text{ cm}$, $AC = 8\\text{ cm}$ un leņķis $\\angle A = 60^\\circ$. Aprēķiniet malas $BC$ garumu centimetros.",
                "answer_latex": "7",
                "solution_latex_ru": "Теорема косинусов: $BC^2 = AB^2 + AC^2 - 2 \\cdot AB \\cdot AC \\cdot \\cos 60^\\circ$.\n$BC^2 = 25 + 64 - 2 \\cdot 5 \\cdot 8 \\cdot 0{,}5 = 89 - 40 = 49 \\implies BC = 7\\text{ см}$.",
                "solution_latex_lv": "$BC^2 = 5^2 + 8^2 - 2 \\cdot 5 \\cdot 8 \\cdot \\cos 60^\\circ = 25 + 64 - 40 = 49 \\implies BC = 7\\text{ cm}$.",
                "difficulty": "Средний",
                "grade": 10,
                "tags": ["trigonometrija", "planimetrija"]
            }
        ]
    },
    {
        "slug": "visp-planimetrija-laukumi",
        "subject_slug": "geometry",
        "grade": 10,
        "position": 12,
        "title_ru": "Периметр, площадь и единицы измерения",
        "title_lv": "Perimetrs, laukums un mērvienības",
        "description_ru": "Вычисление площадей треугольника, параллелограмма, трапеции, круга; перевод единиц площади (м², га, ары).",
        "description_lv": "Trijstūra, paralelograma, trapeces, riņķa laukuma aprēķini; laukuma mērvienību pārvēršana (m², ha, ari).",
        "tags": ["planimetrija", "merijumi"],
        "tasks": [
            {
                "title_ru": "Площадь земельного участка в гектарах",
                "title_lv": "Zemesgabala laukums hektāros",
                "condition_latex_ru": "Прямоугольное поле имеет размеры $250\\text{ м} \\times 400\\text{ м}$. Выразите площадь этого поля в гектарах ($1\\text{ га} = 10\\,000\\text{ м}^2$).",
                "condition_latex_lv": "Taisnstūrveida lauka izmēri ir $250\\text{ m} \\times 400\\text{ m}$. Izsakiet šī lauka laukumu hektāros ($1\\text{ ha} = 10\\,000\\text{ m}^2$).",
                "answer_latex": "10",
                "solution_latex_ru": "$S = 250 \\cdot 400 = 100\\,000\\text{ м}^2$.\n$S = \\frac{100\\,000}{10\\,000} = 10\\text{ га}$.",
                "solution_latex_lv": "$S = 250 \\cdot 400 = 100\\,000\\text{ m}^2 = 10\\text{ ha}$.",
                "difficulty": "Лёгкий",
                "grade": 10,
                "tags": ["merijumi", "planimetrija"]
            }
        ]
    },
    {
        "slug": "visp-merogs-plani-kartes",
        "subject_slug": "geometry",
        "grade": 10,
        "position": 13,
        "title_ru": "Масштаб, планы и карты местности",
        "title_lv": "Mērogs, plāni un kartes",
        "description_ru": "Чтение масштаба карты, вычисление реальных расстояний по карте и проектам зданий.",
        "description_lv": "Kartes mēroga nolasīšana, reālo attālumu noteikšana kartēs un būvprojektos.",
        "tags": ["modelesana", "teksta-uzdevumi"],
        "tasks": [
            {
                "title_ru": "Расстояние на местности по масштабу карты",
                "title_lv": "Attālums dabā pēc kartes mēroga",
                "condition_latex_ru": "Масштаб карты равен $1 : 50\\,000$. Расстояние между двумя объектами на карте равно $6\\text{ см}$. Каково реальное расстояние между ними на местности в километрах?",
                "condition_latex_lv": "Kartes mērogs ir $1 : 50\\,000$. Attālums starp diviem punktiem kartē ir $6\\text{ cm}$. Kāds ir faktiskais attālums dabā kilometros?",
                "answer_latex": "3",
                "solution_latex_ru": "$6\\text{ см} \\cdot 50\\,000 = 300\\,000\\text{ см} = 3000\\text{ м} = 3\\text{ км}$.",
                "solution_latex_lv": "$6\\text{ cm} \\cdot 50\\,000 = 300\\,000\\text{ cm} = 3\\text{ km}$.",
                "difficulty": "Лёгкий",
                "grade": 10,
                "tags": ["teksta-uzdevumi", "modelesana"]
            }
        ]
    },
    {
        "slug": "visp-trijsturu-lidziba",
        "subject_slug": "geometry",
        "grade": 10,
        "position": 14,
        "title_ru": "Подобие треугольников в практических задачах",
        "title_lv": "Trijstūru līdzība praktiskos uzdevumos",
        "description_ru": "Коэффициент подобия, отношение сторон и площадей, измерение высоты объектов по тени.",
        "description_lv": "Līdzības koeficients, malu un laukumu attiecības, objektu augstuma mērīšana pēc ēnas.",
        "tags": ["pieradijumi", "merijumi"],
        "tasks": [
            {
                "title_ru": "Вычисление высоты столба по тени человека",
                "title_lv": "Staba augstuma noteikšana pēc cilvēka ēnas",
                "condition_latex_ru": "Человек ростом $1{,}8\\text{ м}$ отбрасывает тень длиной $1{,}2\\text{ м}$. В этот же момент стоящий рядом фонарный столб отбрасывает тень длиной $4\\text{ м}$. Найдите высоту столба в метрах.",
                "condition_latex_lv": "Cilvēks, kura augums ir $1{,}8\\text{ m}$, met $1{,}2\\text{ m}$ garu ēnu. Tajā pašā laikā apgaismes stabs met $4\\text{ m}$ garu ēnu. Aprēķiniet staba augstumu metros.",
                "answer_latex": "6",
                "solution_latex_ru": "Из подобия треугольников: $\\frac{H}{1{,}8} = \\frac{4}{1{,}2} \\implies H = \\frac{4 \\cdot 1{,}8}{1{,}2} = 4 \\cdot 1{,}5 = 6\\text{ м}$.",
                "solution_latex_lv": "$\\frac{H}{1{,}8} = \\frac{4}{1{,}2} \\implies H = 6\\text{ m}$.",
                "difficulty": "Средний",
                "grade": 10,
                "tags": ["planimetrija", "teksta-uzdevumi"]
            }
        ]
    },
    {
        "slug": "visp-rinka-linija-laukums",
        "subject_slug": "geometry",
        "grade": 10,
        "position": 15,
        "title_ru": "Окружность и площадь круга",
        "title_lv": "Riņķa līnija un riņķa laukums",
        "description_ru": "Длина окружности $C = 2\\pi r$, площадь круга $S = \\pi r^2$, площадь кругового сектора.",
        "description_lv": "Riņķa līnijas garums $C = 2\\pi r$, riņķa laukums $S = \\pi r^2$, sektora laukums.",
        "tags": ["planimetrija", "merijumi"],
        "tasks": [
            {
                "title_ru": "Площадь круглой клумбы",
                "title_lv": "Apaļas puķu dobes laukums",
                "condition_latex_ru": "Диаметр круглой клумбы равен $6\\text{ м}$. Найдите площадь клумбы в квадратных метрах (примите $\\pi \\approx 3{,}14$).",
                "condition_latex_lv": "Apaļas puķu dobes diametrs ir $6\\text{ m}$. Aprēķiniet dobes laukumu kvadrātmetros (pieņemot $\\pi \\approx 3{,}14$).",
                "answer_latex": "28.26",
                "solution_latex_ru": "$r = 3\\text{ м}$. $S = \\pi r^2 = 3{,}14 \\cdot 3^2 = 3{,}14 \\cdot 9 = 28{,}26\\text{ м}^2$.",
                "solution_latex_lv": "$r = 3\\text{ m}$. $S = 3{,}14 \\cdot 9 = 28{,}26\\text{ m}^2$.",
                "difficulty": "Лёгкий",
                "grade": 10,
                "tags": ["merijumi", "planimetrija"]
            }
        ]
    },
    {
        "slug": "visp-prizma-cilindrs-tilpums",
        "subject_slug": "geometry",
        "grade": 10,
        "position": 16,
        "title_ru": "Объём и площадь поверхности призмы и цилиндра",
        "title_lv": "Prizmas un cilindra tilpums un virsma",
        "description_ru": "Прямая призма, прямоугольный параллелепипед, цилиндр, вместимость упаковок и баков.",
        "description_lv": "Taisna prizma, taisnstūra paralēlskaldnis, cilindrs, iepakojumu un tvertņu tilpums.",
        "tags": ["stereometrija", "merijumi"],
        "tasks": [
            {
                "title_ru": "Вместимость прямоугольного бассейна",
                "title_lv": "Taisnstūrveida baseina tilpums",
                "condition_latex_ru": "Бассейн имеет длину $10\\text{ м}$, ширину $4\\text{ м}$ и глубину $1{,}5\\text{ м}$. Сколько литров воды вмещает бассейн при полном заполнении ($1\\text{ м}^3 = 1000\\text{ л}$)?",
                "condition_latex_lv": "Baseina garums ir $10\\text{ m}$, platums $4\\text{ m}$ un dziļums $1{,}5\\text{ m}$. Cik litru ūdens ietilpst pilnā baseinā ($1\\text{ m}^3 = 1000\\text{ l}$)?",
                "answer_latex": "60000",
                "solution_latex_ru": "$V = 10 \\cdot 4 \\cdot 1{,}5 = 60\\text{ м}^3 = 60\\,000\\text{ л}$.",
                "solution_latex_lv": "$V = 10 \\cdot 4 \\cdot 1{,}5 = 60\\text{ m}^3 = 60\\,000\\text{ l}$.",
                "difficulty": "Лёгкий",
                "grade": 10,
                "tags": ["stereometrija", "merijumi"]
            }
        ]
    },
    {
        "slug": "visp-piramida-konuss-tilpums",
        "subject_slug": "geometry",
        "grade": 10,
        "position": 17,
        "title_ru": "Объём пирамиды и конуса",
        "title_lv": "Piramīdas un konusa tilpums",
        "description_ru": "Формула $V = \\frac{1}{3} S_{\\text{осн}} h$, насыпные кучи песка/зерна, конические крыши.",
        "description_lv": "Formula $V = \\frac{1}{3} S_{\\text{pam}} h$, smilšu un graudu kaudzes, koniskie jumti.",
        "tags": ["stereometrija", "merijumi"],
        "tasks": [
            {
                "title_ru": "Объём конической кучи песка",
                "title_lv": "Smilšu koniskās kaudzes tilpums",
                "condition_latex_ru": "Куча песка имеет форму конуса с радиусом основания $3\\text{ м}$ и высотой $2\\text{ м}$. Найдите объём песка в кубических метрах (примите $\\pi \\approx 3{,}14$).",
                "condition_latex_lv": "Smilšu kaudzei ir konusa forma ar pamatnes rādiusu $3\\text{ m}$ un augstumu $2\\text{ m}$. Aprēķiniet tilpumu kubikmetros (pieņemot $\\pi \\approx 3{,}14$).",
                "answer_latex": "18.84",
                "solution_latex_ru": "$V = \\frac{1}{3} \\pi r^2 h = \\frac{1}{3} \\cdot 3{,}14 \\cdot 3^2 \\cdot 2 = 3{,}14 \\cdot 3 \\cdot 2 = 18{,}84\\text{ м}^3$.",
                "solution_latex_lv": "$V = \\frac{1}{3} \\pi r^2 h = 3{,}14 \\cdot 3 \\cdot 2 = 18{,}84\\text{ m}^3$.",
                "difficulty": "Средний",
                "grade": 10,
                "tags": ["stereometrija", "merijumi"]
            }
        ]
    },
    {
        "slug": "visp-lode-sfera",
        "subject_slug": "geometry",
        "grade": 10,
        "position": 18,
        "title_ru": "Объём и площадь поверхности шара и сферы",
        "title_lv": "Lodes tilpums un virsmas laukums",
        "description_ru": "Формулы площади сферы $S = 4\\pi r^2$ и объёма шара $V = \\frac{4}{3}\\pi r^3$, мячи, глобусы, сферические резервуары.",
        "description_lv": "Svēras laukums $S = 4\\pi r^2$ un lodes tilpums $V = \\frac{4}{3}\\pi r^3$, bumbas, sfēriskās tvertnes.",
        "tags": ["stereometrija", "merijumi"],
        "tasks": [
            {
                "title_ru": "Площадь поверхности сферы",
                "title_lv": "Sfēras virsmas laukums",
                "condition_latex_ru": "Радиус сферического резервуара равен $3\\text{ м}$. Вычислите площадь его внешней поверхности в квадратных метрах (примите $\\pi \\approx 3{,}14$).",
                "condition_latex_lv": "Sfēriskas tvertnes rādiuss ir $3\\text{ m}$. Aprēķiniet tās virsmas laukumu kvadrātmetros (pieņemot $\\pi \\approx 3{,}14$).",
                "answer_latex": "113.04",
                "solution_latex_ru": "$S = 4\\pi r^2 = 4 \\cdot 3{,}14 \\cdot 3^2 = 4 \\cdot 3{,}14 \\cdot 9 = 113{,}04\\text{ м}^2$.",
                "solution_latex_lv": "$S = 4\\pi r^2 = 4 \\cdot 3{,}14 \\cdot 9 = 113{,}04\\text{ m}^2$.",
                "difficulty": "Средний",
                "grade": 10,
                "tags": ["stereometrija", "merijumi"]
            }
        ]
    },
    {
        "slug": "visp-materialu-izmaksu-aprekini",
        "subject_slug": "geometry",
        "grade": 10,
        "position": 19,
        "title_ru": "Расчёт материалов и затрат на строительство/ремонт",
        "title_lv": "Materiālu un izmaksu aprēķini",
        "description_ru": "Комплексные задачи: площадь стен под покраску за вычетом окон и дверей, расход краски и смета затрат.",
        "description_lv": "Kompleksi uzdevumi: sienu laukums krāsošanai atskaitot logus un durvis, krāsas patēriņš un tāme.",
        "tags": ["teksta-uzdevumi", "modelesana", "merijumi"],
        "tasks": [
            {
                "title_ru": "Количество банок краски для покраски стен",
                "title_lv": "Krāsas bundžu skaits telpas krāsošanai",
                "condition_latex_ru": "Площадь стен под покраску составляет $50\\text{ м}^2$. Одного литра краски хватает на $10\\text{ м}^2$. Краска продаётся в банках по $2{,}5\\text{ литра}$. Сколько банок краски нужно купить для покраски в два слоя?",
                "condition_latex_lv": "Krāsojamo sienu laukums ir $50\\text{ m}^2$. Ar $1\\text{ litru}$ pietiek $10\\text{ m}^2$ nokrāsošanai. Krāsa tiek pārdota $2{,}5\\text{ l}$ bundžās. Cik bundžas jānopērk krāsošanai 2 kārtās?",
                "answer_latex": "4",
                "solution_latex_ru": "1) Общая площадь с учетом 2 слоёв: $50 \\cdot 2 = 100\\text{ м}^2$.\n2) Объём краски: $\\frac{100}{10} = 10\\text{ литров}$.\n3) Число банок: $\\frac{10}{2{,}5} = 4$ банки.",
                "solution_latex_lv": "1) Laukums divās kārtās: $100\\text{ m}^2$.\n2) Krāsa: $10\\text{ l}$.\n3) Bundžu skaits: $\\frac{10}{2{,}5} = 4$ bundžas.",
                "difficulty": "Средний",
                "grade": 10,
                "tags": ["teksta-uzdevumi", "merijumi"]
            }
        ]
    },
    {
        "slug": "visp-datu-apstrade-grafiki",
        "subject_slug": "statistics",
        "grade": 10,
        "position": 20,
        "title_ru": "Сбор, группировка и представление данных",
        "title_lv": "Datu vākšana, apkopošana un attēlošana",
        "description_ru": "Интервальные ряды, частоты и относительные частоты, построение гистограмм и полигонов частот.",
        "description_lv": "Intervālu rindas, biežums un relatīvais biežums, histogrammu veidošana.",
        "tags": ["statistika", "grafiki"],
        "tasks": [
            {
                "title_ru": "Относительная частота в процентах",
                "title_lv": "Relatīvais biežums procentos",
                "condition_latex_ru": "В опросе участвовали $80$ человек. Из них $28$ выбрали вариант А. Какова относительная частота выбора варианта А в процентах?",
                "condition_latex_lv": "Aptaujā piedalījās $80$ cilvēki. No tiem $28$ izvēlējās variantu A. Kāds ir varianta A relatīvais biežums procentos?",
                "answer_latex": "35",
                "solution_latex_ru": "$\\frac{28}{80} = \\frac{7}{20} = 0{,}35 = 35\\%$.",
                "solution_latex_lv": "$\\frac{28}{80} = 0{,}35 = 35\\%$.",
                "difficulty": "Лёгкий",
                "grade": 10,
                "tags": ["statistika", "dalas-procenti"]
            }
        ]
    },
    {
        "slug": "visp-videjie-lielumi-izkliede",
        "subject_slug": "statistics",
        "grade": 10,
        "position": 21,
        "title_ru": "Средние величины и статистический размах",
        "title_lv": "Vidējie lielumi un izkliede",
        "description_ru": "Среднее взвешенное, медиана, размах выборки (максимум минус минимум), анализ выбросов.",
        "description_lv": "Svērtais vidējais, mediāna, amplitūda (maksimālā un minimālā vērtība), datu izkliedes novērtējums.",
        "tags": ["statistika"],
        "tasks": [
            {
                "title_ru": "Вычисление средневзвешенного балла",
                "title_lv": "Svērta vidējā aprēķins",
                "condition_latex_ru": "Студент сдал тест с оценкой $6$ (вес $1$), практическую работу с оценкой $8$ (вес $2$) и экзамен с оценкой $9$ (вес $3$). Найдите средневзвешенный балл.",
                "condition_latex_lv": "Skolēna vērtējums testā ir $6$ (svars $1$), praktiskajā darbā $8$ (svars $2$) un eksāmenā $9$ (svars $3$). Aprēķiniet svērto vidējo atzīmi.",
                "answer_latex": "8.17",
                "solution_latex_ru": "$\\bar{x} = \\frac{6 \\cdot 1 + 8 \\cdot 2 + 9 \\cdot 3}{1 + 2 + 3} = \\frac{6 + 16 + 27}{6} = \\frac{49}{6} \\approx 8{,}17$.",
                "solution_latex_lv": "$\\bar{x} = \\frac{6 \\cdot 1 + 8 \\cdot 2 + 9 \\cdot 3}{6} = \\frac{49}{6} \\approx 8{,}17$.",
                "difficulty": "Средний",
                "grade": 10,
                "tags": ["statistika"]
            }
        ]
    },
    {
        "slug": "visp-diagrammu-kritika",
        "subject_slug": "statistics",
        "grade": 10,
        "position": 22,
        "title_ru": "Чтение и критический анализ диаграмм",
        "title_lv": "Diagrammu lasīšana un kritiska interpretācija",
        "description_ru": "Обнаружение визуальных искажений в инфографике (урезанная шкала, несоразмерные площади).",
        "description_lv": "Vizuālo kļūdu un sagrozījumu pamanīšana infografikās (apgriezta ass, nesamērīgi laukumi).",
        "tags": ["statistika", "grafiki"],
        "tasks": [
            {
                "title_ru": "Расчет процентной доли по круговой диаграмме",
                "title_lv": "Sektora leņķis riņķa diagrammā",
                "condition_latex_ru": "На круговой диаграмме категория «Транспорт» составляет $25\\%$ всех расходов семьи. Найдите центральный угол сектора этой категории в градусах.",
                "condition_latex_lv": "Sektoru diagrammā kategorija «Transports» veido $25\\%$ no visiem ģimenes izdevumiem. Kāds ir šīs kategorijas sektora leņķis grādos?",
                "answer_latex": "90",
                "solution_latex_ru": "Полный круг составляет $360^\\circ$. Угол сектора: $360^\\circ \\cdot 0{,}25 = 90^\\circ$.",
                "solution_latex_lv": "Pilns riņķis ir $360^\\circ$. Sektora leņķis: $360^\\circ \\cdot 0{,}25 = 90^\\circ$.",
                "difficulty": "Лёгкий",
                "grade": 10,
                "tags": ["statistika", "merijumi"]
            }
        ]
    },
    {
        "slug": "visp-kombinatorika-pamatprincipi",
        "subject_slug": "statistics",
        "grade": 10,
        "position": 23,
        "title_ru": "Основные правила комбинаторики",
        "title_lv": "Kombinatorikas pamatprincipi",
        "description_ru": "Правило суммы и правило произведения, подсчёт вариантов кодов, паролей и меню.",
        "description_lv": "Saskaitīšanas un reizināšanas likums, kombināciju, kodu un paroļu skaita aprēķins.",
        "tags": ["kombinatorika"],
        "tasks": [
            {
                "title_ru": "Количество вариантов четырёхзначного PIN-кода",
                "title_lv": "Četrciparu PIN koda variantu skaits",
                "condition_latex_ru": "PIN-код состоит из $4$ цифр (от $0$ до $9$). Сколько существует различных PIN-кодов, если все цифры в коде должны быть разными?",
                "condition_latex_lv": "PIN kods sastāv no $4$ cipariem ($0-9$). Cik dažādu PIN kodu var izveidot, ja visi cipari kodā ir dažādi?",
                "answer_latex": "5040",
                "solution_latex_ru": "По правилу произведения: $10 \\cdot 9 \\cdot 8 \\cdot 7 = 5040$.",
                "solution_latex_lv": "Pēc reizināšanas likuma: $10 \\cdot 9 \\cdot 8 \\cdot 7 = 5040$.",
                "difficulty": "Средний",
                "grade": 10,
                "tags": ["kombinatorika"]
            }
        ]
    },
    {
        "slug": "visp-varbutiba-ikdiena",
        "subject_slug": "statistics",
        "grade": 10,
        "position": 24,
        "title_ru": "Вероятность в повседневных ситуациях",
        "title_lv": "Varbūtība ikdienas situācijās",
        "description_ru": "Случайные события, благоприятные исходы, вероятности в тестах с выбором ответа, контроль качества.",
        "description_lv": "Gadījuma notikumi, labvēlīgie iznākumi, izvēles testu un loteriju varbūtības.",
        "tags": ["varbutiba", "dalas-procenti"],
        "tasks": [
            {
                "title_ru": "Вероятность выигрыша в лотерее",
                "title_lv": "Laimesta varbūtība momentloterijā",
                "condition_latex_ru": "В лотерее выпущено $1000$ билетов, из которых $150$ выигрышных. Какова вероятность купить невыигрышный билет? Запишите ответ десятичной дробью.",
                "condition_latex_lv": "Loterijā ir $1000$ biļetes, no kurām $150$ ir laimējošas. Kāda ir varbūtība nopirkt biļeti bez laimesta? Atbildi uzrakstiet kā decimāldaļu.",
                "answer_latex": "0.85",
                "solution_latex_ru": "Число билетов без выигрыша: $1000 - 150 = 850$.\n$P = \\frac{850}{1000} = 0{,}85$.",
                "solution_latex_lv": "$1000 - 150 = 850$. $P = \\frac{850}{1000} = 0{,}85$.",
                "difficulty": "Лёгкий",
                "grade": 10,
                "tags": ["varbutiba", "dalas-procenti"]
            }
        ]
    },
    {
        "slug": "visp-neatkarigi-notikumi",
        "subject_slug": "statistics",
        "grade": 10,
        "position": 25,
        "title_ru": "Независимые события и произведение вероятностей",
        "title_lv": "Neatkarīgi notikumi un varbūtību reizināšana",
        "description_ru": "Теорема умножения вероятностей для независимых событий, надёжность систем из двух компонентов.",
        "description_lv": "Neatkarīgu notikumu reizināšanas teorēma, divu neatkarīgu sistēmas komponentu drošums.",
        "tags": ["varbutiba"],
        "tasks": [
            {
                "title_ru": "Вероятность безотказной работы двух приборов",
                "title_lv": "Divu iekārtu bezatteices darbības varbūtība",
                "condition_latex_ru": "Система состоит из двух независимо работающих датчиков. Вероятность безотказной работы первого датчика равна $0{,}9$, второго — $0{,}8$. Какова вероятность того, что оба датчика сработают исправно?",
                "condition_latex_lv": "Sistēma sastāv no diviem neatkarīgiem sensoriem. Pirmā sensora drošums ir $0{,}9$, otrā — $0{,}8$. Kāda ir varbūtība, ka abi sensori nostrādās pareizi?",
                "answer_latex": "0.72",
                "solution_latex_ru": "Для независимых событий: $P(A \\cap B) = P(A) \\cdot P(B) = 0{,}9 \\cdot 0{,}8 = 0{,}72$.",
                "solution_latex_lv": "$P = 0{,}9 \\cdot 0{,}8 = 0{,}72$.",
                "difficulty": "Средний",
                "grade": 10,
                "tags": ["varbutiba"]
            }
        ]
    }
]

def main():
    os.makedirs('supabase', exist_ok=True)
    json_path = os.path.join('supabase', 'visparigais_topics_tasks.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(topics_data, f, ensure_ascii=False, indent=2)
    print(f'JSON written to {json_path} with {len(topics_data)} topics.')

    # Also build SQL seed
    sql_lines = [
        '-- ============================================================================',
        '-- Seed: Темы и задачи курса Visparigais limenis (Skola2030 / 10 klase)',
        '-- Запуск в Supabase: SQL Editor -> New query -> Paste & Run',
        '-- ============================================================================',
        ''
    ]

    # Insert topics
    sql_lines.append('-- 1. Вставка тем')
    for t in topics_data:
        t_ru = t['title_ru'].replace("'", "''")
        t_lv = t['title_lv'].replace("'", "''")
        d_ru = t['description_ru'].replace("'", "''")
        d_lv = t['description_lv'].replace("'", "''")
        slug = t['slug']
        subj = t['subject_slug']
        pos = t['position']
        sql = f"""insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('{t_ru}', '{t_lv}', '{slug}', (select id from public.subjects where slug = '{subj}'), 10, {pos}, '{d_ru}', '{d_lv}')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;
"""
        sql_lines.append(sql)

    # Insert tasks and tags
    sql_lines.append('-- 2. Вставка типовых задач и привязка кросс-тегов')
    task_idx = 1
    for t in topics_data:
        for task in t.get('tasks', []):
            task_title_ru = task['title_ru'].replace("'", "''")
            task_title_lv = task['title_lv'].replace("'", "''")
            cond_ru = task['condition_latex_ru'].replace("'", "''")
            cond_lv = task['condition_latex_lv'].replace("'", "''")
            sol_ru = task['solution_latex_ru'].replace("'", "''")
            sol_lv = task['solution_latex_lv'].replace("'", "''")
            ans = task['answer_latex'].replace("'", "''")
            diff = task.get('difficulty', 'Средний')
            topic_slug = t['slug']
            tag_slugs = task.get('tags', [])

            task_sql = f"""do $$
declare
  v_topic_id bigint;
  v_task_id bigint;
  v_tag_id bigint;
begin
  select id into v_topic_id from public.topics where slug = '{topic_slug}';
  if v_topic_id is not null then
    insert into public.tasks (topic_id, grade, title, title_lv, condition_latex, condition_latex_lv, solution_latex, solution_latex_lv, answer_latex, difficulty, position, is_published)
    values (v_topic_id, 10, '{task_title_ru}', '{task_title_lv}', '{cond_ru}', '{cond_lv}', '{sol_ru}', '{sol_lv}', '{ans}', '{diff}', {task_idx}, true)
    returning id into v_task_id;
"""
            for tag_slug in tag_slugs:
                task_sql += f"""
    select id into v_tag_id from public.tags where slug = '{tag_slug}';
    if v_tag_id is not null and v_task_id is not null then
      insert into public.task_tags (task_id, tag_id) values (v_task_id, v_tag_id) on conflict do nothing;
    end if;"""
            task_sql += """
  end if;
end $$;
"""
            sql_lines.append(task_sql)
            task_idx += 1

    sql_path = os.path.join('supabase', 'seed_visparigais.sql')
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    print(f'SQL written to {sql_path}.')

if __name__ == '__main__':
    main()