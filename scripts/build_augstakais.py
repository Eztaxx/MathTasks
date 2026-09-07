# -*- coding: utf-8 -*-
"""
Script to build:
1. supabase/augstakais_topics_tasks.json (All 45 topics + exam tasks with cross-tags)
2. supabase/seed_augstakais.sql (Idempotent Supabase SQL seed)
for Matemātika II (Augstākais līmenis, 12 klase) - Skola2030.
"""
import json
import os

topics_data = [
    # ── ALGEBRA (1..6) ───────────────────────────────────────────────────────────
    {
        "slug": "augst-iracionalie-vienadojumi",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 1,
        "title_ru": "Иррациональные уравнения",
        "title_lv": "Iracionālie vienādojumi",
        "description_ru": "Возведение обеих частей в степень, учет ОДЗ, замена переменной, появление посторонних корней.",
        "description_lv": "Abu pušu kāpināšana pakāpē, definīcijas apgabala ievērošana, mainīgā nomaiņa, svešu sakņu atsijāšana.",
        "tags": ["vienadojumi", "pakapes-saknes"],
        "tasks": [
            {
                "title_ru": "Решение иррационального уравнения с проверкой корней",
                "title_lv": "Iracionāla vienādojuma atrisināšana ar sakņu pārbaudi",
                "condition_latex_ru": "Решите уравнение: $\\sqrt{2x + 7} = x + 2$.",
                "condition_latex_lv": "Atrisiniet vienādojumu: $\\sqrt{2x + 7} = x + 2$.",
                "answer_latex": "$1$",
                "solution_latex_ru": "1) Ограничение правой части: $x + 2 \\ge 0 \\implies x \\ge -2$.\n2) Возводим обе части в квадрат: $2x + 7 = (x + 2)^2 = x^2 + 4x + 4$.\n3) Приводим уравнение к стандартному квадратному виду: $x^2 + 2x - 3 = 0$.\n4) Корни по теореме Виета: $x_1 = 1, x_2 = -3$.\n5) С учётом условия $x \\ge -2$ корень $x_2 = -3$ является посторонним. Единственный корень: $x = 1$.",
                "solution_latex_lv": "1) Saknes vērtība ir nenegatīva, tātad labajai pusei jābūt $x + 2 \\ge 0 \\implies x \\ge -2$.\n2) Kāpina abas puses kvadrātā: $2x + 7 = x^2 + 4x + 4$.\n3) Pārnes locekļus: $x^2 + 2x - 3 = 0$.\n4) Saknes ir $x_1 = 1$ un $x_2 = -3$.\n5) Tā kā $x \\ge -2$, derīgā sakne ir tikai $x = 1$ ($x = -3$ ir blakussakne).",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["vienadojumi", "pakapes-saknes"]
            }
        ]
    },
    {
        "slug": "augst-logaritmiskie-vienadojumi-sistemas",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 2,
        "title_ru": "Логарифмические уравнения, неравенства и системы",
        "title_lv": "Logaritmiskie vienādojumi, nevienādības un sistēmas",
        "description_ru": "Переход к новому основанию, переменное основание логарифма $\\log_{g(x)} f(x)$, метод рационализации.",
        "description_lv": "Pāreja uz jaunu bāzi, mainīga logaritma bāze $\\log_{g(x)} f(x)$, racionalizācijas metode.",
        "tags": ["logaritmi", "vienadojumi", "nevienadibas"],
        "tasks": [
            {
                "title_ru": "Логарифмическое неравенство с переменным основанием",
                "title_lv": "Logaritmiskā nevienādība ar mainīgu bāzi",
                "condition_latex_ru": "Решите неравенство: $\\log_x(3x - 2) \\le 2$.",
                "condition_latex_lv": "Atrisiniet nevienādību: $\\log_x(3x - 2) \\le 2$.",
                "answer_latex": "$x \\in [2; +\\infty)$",
                "solution_latex_ru": "1) Область определения: основание $x > 0$, $x \\ne 1$; под логарифмом $3x - 2 > 0 \\implies x > \\frac{2}{3}$. Итого $x \\in \\left(\\frac{2}{3}; 1\\right) \\cup (1; +\\infty)$.\n2) Запишем правую часть как логарифм по тому же основанию: $2 = \\log_x x^2$. Сравнивать аргументы можно, но направление неравенства зависит от основания, поэтому разбираем два случая.\n3) Случай $\\frac{2}{3} < x < 1$. Основание меньше единицы, логарифмическая функция убывает, знак неравенства меняется на противоположный:\n$$3x - 2 \\ge x^2 \\implies x^2 - 3x + 2 \\le 0 \\implies (x - 1)(x - 2) \\le 0 \\implies x \\in [1; 2]$$\nПересечение с промежутком $\\left(\\frac{2}{3}; 1\\right)$ пусто, поэтому в этом случае решений нет.\n4) Случай $x > 1$. Основание больше единицы, функция возрастает, знак сохраняется:\n$$3x - 2 \\le x^2 \\implies x^2 - 3x + 2 \\ge 0 \\implies (x - 1)(x - 2) \\ge 0 \\implies x \\le 1 \\text{ или } x \\ge 2$$\nПересечение с промежутком $(1; +\\infty)$ даёт $x \\ge 2$.\n5) Проверка. При $x = 2$: $\\log_2 4 = 2$, равенство выполняется, граница входит в ответ. При $x = 0{,}8$: $\\log_{0{,}8} 0{,}4 \\approx 4{,}11 > 2$, то есть промежуток $\\left(\\frac{2}{3}; 1\\right)$ решением не является.\nОтвет: $x \\in [2; +\\infty)$.",
                "solution_latex_lv": "1) Definīcijas kopa: bāze $x > 0$, $x \\ne 1$; zem logaritma $3x - 2 > 0 \\implies x > \\frac{2}{3}$. Kopā $x \\in \\left(\\frac{2}{3}; 1\\right) \\cup (1; +\\infty)$.\n2) Pierakstām labo pusi kā logaritmu ar to pašu bāzi: $2 = \\log_x x^2$. Argumentus var salīdzināt, bet nevienādības zīmes virziens ir atkarīgs no bāzes, tāpēc aplūkojam divus gadījumus.\n3) Gadījums $\\frac{2}{3} < x < 1$. Bāze ir mazāka par vienu, logaritmiskā funkcija dilst, nevienādības zīme mainās uz pretējo:\n$$3x - 2 \\ge x^2 \\implies x^2 - 3x + 2 \\le 0 \\implies (x - 1)(x - 2) \\le 0 \\implies x \\in [1; 2]$$\nŠķēlums ar intervālu $\\left(\\frac{2}{3}; 1\\right)$ ir tukšs, tāpēc šajā gadījumā atrisinājumu nav.\n4) Gadījums $x > 1$. Bāze ir lielāka par vienu, funkcija aug, zīme saglabājas:\n$$3x - 2 \\le x^2 \\implies x^2 - 3x + 2 \\ge 0 \\implies (x - 1)(x - 2) \\ge 0 \\implies x \\le 1 \\text{ vai } x \\ge 2$$\nŠķēlums ar intervālu $(1; +\\infty)$ dod $x \\ge 2$.\n5) Pārbaude. Ja $x = 2$: $\\log_2 4 = 2$, vienādība izpildās, robeža ietilpst atbildē. Ja $x = 0{,}8$: $\\log_{0{,}8} 0{,}4 \\approx 4{,}11 > 2$, tātad intervāls $\\left(\\frac{2}{3}; 1\\right)$ nav atrisinājums.\nAtbilde: $x \\in [2; +\\infty)$.",
                "difficulty": "Сложный",
                "grade": 12,
                "tags": ["logaritmi", "nevienadibas"]
            }
        ]
    },
    {
        "slug": "augst-polinomu-dalisana-bezu",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 3,
        "title_ru": "Деление многочленов и теорема Безу",
        "title_lv": "Polinomu dalīšana un Bezū teorēma",
        "description_ru": "Деление многочлена на многочлен «уголком», теорема Безу $P(a) = R$, схема Горнера, нахождение рациональных корней.",
        "description_lv": "Polinomu dalīšana stabiņā, Bezū teorēma $P(a) = R$, Hornera shēma, racionālu sakņu atrašana.",
        "tags": ["algebriskie-parveidojumi", "pieradijumi"],
        "tasks": [
            {
                "title_ru": "Разложение многочлена 3-й степени с применением теоремы Безу",
                "title_lv": "Trešās pakāpes polinoma sadalīšana reizinātājos ar Bezū teorēmu",
                "condition_latex_ru": "Найдите все действительные корни многочлена $P(x) = x^3 - 4x^2 + x + 6$.",
                "condition_latex_lv": "Atrodiet visas polinoma $P(x) = x^3 - 4x^2 + x + 6$ reālās saknes.",
                "answer_latex": "$x_1 = -1,\\; x_2 = 2,\\; x_3 = 3$",
                "solution_latex_ru": "1) Возможные целые корни — делители свободного члена $6$: $\\pm 1, \\pm 2, \\pm 3, \\pm 6$.\n2) Проверяем $x = -1$: $P(-1) = (-1)^3 - 4(-1)^2 + (-1) + 6 = -1 - 4 - 1 + 6 = 0$. Значит, $x = -1$ — корень.\n3) Делим $P(x)$ на $(x + 1)$: $x^3 - 4x^2 + x + 6 = (x + 1)(x^2 - 5x + 6)$.\n4) Корни квадратного трехчлена $x^2 - 5x + 6 = 0$: $x_2 = 2, x_3 = 3$.\nОтвет: $-1; 2; 3$.",
                "solution_latex_lv": "1) Iespējamās veselās saknes ir skaitļa 6 dalītāji: $\\pm 1, \\pm 2, \\pm 3, \\pm 6$.\n2) Pārbauda $x = -1$: $P(-1) = -1 - 4 - 1 + 6 = 0$, tātad $x = -1$ ir sakne.\n3) Izdala polinomu ar $(x + 1)$: $P(x) = (x + 1)(x^2 - 5x + 6)$.\n4) Kvadrātvienādojuma $x^2 - 5x + 6 = 0$ saknes ir $x = 2$ un $x = 3$.\nAtbilde: $-1; 2; 3$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["algebriskie-parveidojumi"]
            }
        ]
    },
    {
        "slug": "augst-nenoteikto-koeficientu-metode",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 4,
        "title_ru": "Метод неопределенных коэффициентов",
        "title_lv": "Nenoteikto koeficientu metode",
        "description_ru": "Разложение рациональных дробей на сумму простейших, равенство многочленов, составление систем линейных уравнений.",
        "description_lv": "Racionālu daļu sadalīšana pamatdaļās, polinomu vienādība, lineāru vienādojumu sistēmu veidošana.",
        "tags": ["algebriskie-parveidojumi"],
        "tasks": [
            {
                "title_ru": "Разложение дроби на простейшие методом неопределенных коэффициентов",
                "title_lv": "Daļas sadalīšana vienkāršākajās pamatdaļās",
                "condition_latex_ru": "Найдите коэффициенты $A$ и $B$ такие, что для всех $x \\ne 1, x \\ne 3$: $\\frac{4x - 2}{(x - 1)(x - 3)} = \\frac{A}{x - 1} + \\frac{B}{x - 3}$.",
                "condition_latex_lv": "Nosakiet koeficientus $A$ un $B$, lai visiem $x \\ne 1, x \\ne 3$ izpildītos vienādība: $\\frac{4x - 2}{(x - 1)(x - 3)} = \\frac{A}{x - 1} + \\frac{B}{x - 3}$.",
                "answer_latex": "$A = -1$, $B = 5$",
                "solution_latex_ru": "1) Приводим правую часть к общему знаменателю: $\\frac{A(x - 3) + B(x - 1)}{(x - 1)(x - 3)} = \\frac{(A + B)x - (3A + B)}{(x - 1)(x - 3)}$.\n2) Приравниваем коэффициенты при одинаковых степенях $x$:\n$\\begin{cases} A + B = 4 \\\\ 3A + B = 2 \\end{cases}$.\n3) Вычитаем первое из второго: $2A = -2 \\implies A = -1$.\n4) Находим $B$: $B = 4 - A = 4 - (-1) = 5$.\nОтвет: $A = -1, B = 5$.",
                "solution_latex_lv": "1) Vienādo labo pusi ar kopsaucēju: $A(x - 3) + B(x - 1) = (A + B)x - (3A + B)$.\n2) Pielīdzina koeficientus: $\\begin{cases} A + B = 4 \\\\ 3A + B = 2 \\end{cases}$.\n3) Atņem pirmo vienādojumu no otrā: $2A = -2 \\implies A = -1$.\n4) Aprēķina $B = 4 - (-1) = 5$.\nAtbilde: $A = -1, B = 5$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["algebriskie-parveidojumi"]
            }
        ]
    },
    {
        "slug": "augst-vienadojumi-parametri",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 5,
        "title_ru": "Уравнения и неравенства с параметром",
        "title_lv": "Vienādojumi un nevienādības ar parametru",
        "description_ru": "Аналитический и графический методы исследования количества корней в зависимости от значений параметра $a$.",
        "description_lv": "Analītiskā un grafiskā metode sakņu skaita pētīšanai atkarībā no parametra $a$ vērtībām.",
        "tags": ["vienadojumi", "grafiki"],
        "tasks": [
            {
                "title_ru": "Число решений квадратного уравнения с параметром",
                "title_lv": "Kvadrātvienādojuma sakņu skaits atkarībā no parametra",
                "condition_latex_ru": "При каких значениях параметра $a$ уравнение $(a - 1)x^2 + 2(a - 1)x + 3 = 0$ имеет ровно одно действительное решение?",
                "condition_latex_lv": "Kādām parametra $a$ vērtībām vienādojumam $(a - 1)x^2 + 2(a - 1)x + 3 = 0$ ir tieši viena reāla sakne?",
                "answer_latex": "$a = 1$; $a = 4$",
                "solution_latex_ru": "1) Случай 1 (линейный): если $a - 1 = 0 \\implies a = 1$, то уравнение принимает вид $0 \\cdot x^2 + 0 \\cdot x + 3 = 0$ ($3 = 0$ — решений нет). Значит, $a = 1$ не подходит для одного решения.\n2) Случай 2 (квадратный): $a \\ne 1$. Уравнение имеет одно решение, когда дискриминант равен нулю ($D = 0$).\n$D = (2(a - 1))^2 - 4(a - 1) \\cdot 3 = 4(a - 1)^2 - 12(a - 1) = 4(a - 1)((a - 1) - 3) = 4(a - 1)(a - 4)$.\n3) $D = 0 \\implies a = 1$ (исключено условием $a \\ne 1$) или $a = 4$.\nПри $a = 4$: $3x^2 + 6x + 3 = 0 \\implies 3(x + 1)^2 = 0 \\implies x = -1$ (ровно одно решение).\nОтвет: $a = 4$.",
                "solution_latex_lv": "1) Ja $a = 1$, vienādojums ir $3 = 0$ (atrisinājuma nav).\n2) Ja $a \\ne 1$, vienādojumam ir tieši viena sakne, ja diskriminants $D = 0$.\n$D = 4(a - 1)^2 - 12(a - 1) = 4(a - 1)(a - 4) = 0$.\n3) Tā kā $a \\ne 1$, tad $a - 4 = 0 \\implies a = 4$.\nAtbilde: $a = 4$.",
                "difficulty": "Сложный",
                "grade": 12,
                "tags": ["vienadojumi"]
            }
        ]
    },
    {
        "slug": "augst-kompleksi-vienadojumu-panemieni",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 6,
        "title_ru": "Комплексные приемы решения уравнений",
        "title_lv": "Kompleksi vienādojumu risināšanas paņēmieni",
        "description_ru": "Однородные уравнения, симметрические системы, метод оценки (мажорант), функционально-графический метод.",
        "description_lv": "Homogēni vienādojumi, simetriskas sistēmas, mažorantu metode, funkcionāli grafiskā metode.",
        "tags": ["vienadojumi", "funkcijas"],
        "tasks": [
            {
                "title_ru": "Решение уравнения методом мажорант (оценки)",
                "title_lv": "Vienādojuma risināšana ar mažorantu (novērtēšanas) metodi",
                "condition_latex_ru": "Решите уравнение: $x^2 + 4x + 5 = \\cos(\\pi x)$.",
                "condition_latex_lv": "Atrisiniet vienādojumu: $x^2 + 4x + 5 = \\cos(\\pi x)$.",
                "answer_latex": "$-2$",
                "solution_latex_ru": "1) Выделим полный квадрат в левой части: $x^2 + 4x + 5 = (x + 2)^2 + 1 \\ge 1$.\n2) Оценим правую часть: $\\cos(\\pi x) \\le 1$.\n3) Равенство возможно только тогда, когда обе части одновременно равны $1$:\n$(x + 2)^2 + 1 = 1 \\implies x = -2$.\n4) Проверим правую часть при $x = -2$: $\\cos(-2\\pi) = \\cos(2\\pi) = 1$. Равенство выполняется!\nОтвет: $x = -2$.",
                "solution_latex_lv": "1) Kreisās puses novērtējums: $(x + 2)^2 + 1 \\ge 1$.\n2) Labās puses novērtējums: $\\cos(\\pi x) \\le 1$.\n3) Vienādība iespējama vienīgi tad, ja abas puses ir vienādas ar 1: $(x + 2)^2 = 0 \\implies x = -2$.\n4) Pārbaude: $\\cos(-2\\pi) = 1$. Vienādība ir spēkā.\nAtbilde: $x = -2$.",
                "difficulty": "Сложный",
                "grade": 12,
                "tags": ["vienadojumi", "funkcijas"]
            }
        ]
    },

    # ── FUNKCIJAS (7..12) ────────────────────────────────────────────────────────
    {
        "slug": "augst-inversa-funkcija",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 7,
        "title_ru": "Обратная функция",
        "title_lv": "Inversā funkcija",
        "description_ru": "Условие обратимости (строгая монотонность), нахождение формулы обратной функции $y = f^{-1}(x)$, симметрия графиков относительно $y = x$.",
        "description_lv": "Invertējamības nosacījums (monotonitāte), inversās funkcijas atrašana, grafiku simetrija pret taisni $y = x$.",
        "tags": ["grafiki", "logaritmi"],
        "tasks": [
            {
                "title_ru": "Нахождение формулы обратной функции",
                "title_lv": "Inversās funkcijas formulas atrašana",
                "condition_latex_ru": "Найдите обратную функцию для $f(x) = \\frac{2x + 1}{x - 3}$, где $x \\ne 3$.",
                "condition_latex_lv": "Atrodiet funkcijas $f(x) = \\frac{2x + 1}{x - 3}$ ($x \\ne 3$) inverso funkciju $f^{-1}(x)$.",
                "answer_latex": "$f^{-1}(x) = \\frac{3x + 1}{x - 2}$",
                "solution_latex_ru": "1) Запишем $y = \\frac{2x + 1}{x - 3}$.\n2) Выражаем $x$ через $y$: $y(x - 3) = 2x + 1 \\implies yx - 3y = 2x + 1$.\n3) Группируем слагаемые с $x$: $yx - 2x = 3y + 1 \\implies x(y - 2) = 3y + 1 \\implies x = \\frac{3y + 1}{y - 2}$.\n4) Меняем переменные: $f^{-1}(x) = \\frac{3x + 1}{x - 2}$ при $x \\ne 2$.",
                "solution_latex_lv": "1) $y = \\frac{2x + 1}{x - 3}$.\n2) Pārveido: $y(x - 3) = 2x + 1 \\implies yx - 2x = 3y + 1$.\n3) Izsaka $x$: $x = \\frac{3y + 1}{y - 2}$.\n4) Inversā funkcija ir $f^{-1}(x) = \\frac{3x + 1}{x - 2}$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["grafiki"]
            }
        ]
    },
    {
        "slug": "augst-virknes-monotonitate-robeza",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 8,
        "title_ru": "Последовательности, их монотонность и предел",
        "title_lv": "Virknes, to monotonitāte un robeža",
        "description_ru": "Ограниченность и монотонность числовых последовательностей, понятие предела $\\lim_{n \\to \\infty} a_n$, вычисление пределов отношений многочленов.",
        "description_lv": "Skaitļu virkņu ierobežotība un monotonitāte, virknes robežas jēdziens $\\lim_{n \\to \\infty} a_n$, robežu aprēķināšana.",
        "tags": ["virknes", "matematiska-analize"],
        "tasks": [
            {
                "title_ru": "Вычисление предела числовой последовательности",
                "title_lv": "Skaitļu virknes robežas aprēķināšana",
                "condition_latex_ru": "Вычислите предел последовательности: $\\lim_{n \\to \\infty} \\frac{6n^2 - 5n + 1}{2n^2 + 3n - 4}$.",
                "condition_latex_lv": "Aprēķiniet virknes robežu: $\\lim_{n \\to \\infty} \\frac{6n^2 - 5n + 1}{2n^2 + 3n - 4}$.",
                "answer_latex": "$3$",
                "solution_latex_ru": "1) Делим числитель и знаменатель на высшую степень $n^2$:\n$\\lim_{n \\to \\infty} \\frac{6 - \\frac{5}{n} + \\frac{1}{n^2}}{2 + \\frac{3}{n} - \\frac{4}{n^2}}$.\n2) Так как при $n \\to \\infty$ слагаемые $\\frac{1}{n}, \\frac{1}{n^2} \\to 0$, получаем $\\frac{6 - 0 + 0}{2 + 0 - 0} = \\frac{6}{2} = 3$.",
                "solution_latex_lv": "1) Izdala skaitītāju un saucēju ar $n^2$: $\\lim_{n \\to \\infty} \\frac{6 - 5/n + 1/n^2}{2 + 3/n - 4/n^2}$.\n2) Tā kā $1/n \\to 0$, robeža ir $\\frac{6}{2} = 3$.",
                "difficulty": "Лёгкий",
                "grade": 12,
                "tags": ["virknes", "matematiska-analize"]
            }
        ]
    },
    {
        "slug": "augst-bezgaligi-dilstosa-progresija",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 9,
        "title_ru": "Бесконечно убывающая геометрическая прогрессия",
        "title_lv": "Bezgalīgi dilstoša ģeometriskā progresija",
        "description_ru": "Условие сходимости $|q| < 1$, формула суммы $S = \\frac{b_1}{1 - q}$, обращение периодических десятичных дробей в обыкновенные.",
        "description_lv": "Konverģences nosacījums $|q| < 1$, summas formula $S = \\frac{b_1}{1 - q}$, bezgalīgu periodisku decimāldaļu pārvēršana parastajās daļās.",
        "tags": ["virknes", "matematiska-analize"],
        "tasks": [
            {
                "title_ru": "Сумма бесконечно убывающей геометрической прогрессии",
                "title_lv": "Bezgalīgi dilstošas ģeometriskās progresijas summa",
                "condition_latex_ru": "Найдите сумму бесконечной геометрической прогрессии: $12 + 4 + \\frac{4}{3} + \\frac{4}{9} + \\dots$.",
                "condition_latex_lv": "Aprēķiniet bezgalīgi dilstošās ģeometriskās progresijas summu: $12 + 4 + \\frac{4}{3} + \\frac{4}{9} + \\dots$.",
                "answer_latex": "$18$",
                "solution_latex_ru": "1) Первый член $b_1 = 12$.\n2) Знаменатель прогрессии: $q = \\frac{4}{12} = \\frac{1}{3}$. Так как $|q| < 1$, прогрессия сходится.\n3) Сумма: $S = \\frac{b_1}{1 - q} = \\frac{12}{1 - 1/3} = \\frac{12}{2/3} = 12 \\cdot \\frac{3}{2} = 18$.",
                "solution_latex_lv": "1) Pirmais loceklis $b_1 = 12$, kvocients $q = \\frac{4}{12} = \\frac{1}{3}$.\n2) Tā kā $|q| < 1$, lieto summas formulu: $S = \\frac{b_1}{1 - q} = \\frac{12}{1 - 1/3} = 18$.",
                "difficulty": "Лёгкий",
                "grade": 12,
                "tags": ["virknes"]
            }
        ]
    },
    {
        "slug": "augst-skaitlis-e-eksponenciali-procesi",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 10,
        "title_ru": "Число e и экспоненциальные процессы",
        "title_lv": "Skaitlis e un eksponenciāli procesi",
        "description_ru": "Число Эйлера $e = \\lim (1 + 1/n)^n \\approx 2{,}718$, натуральный логарифм $\\ln x$, непрерывное начисление процентов, дифференциальные уравнения радиоактивного распада.",
        "description_lv": "Eilera skaitlis $e \\approx 2{,}718$, naturāllogaritms $\\ln x$, nepārtraukti procentu aprēķini, sabrukšanas vienādojums.",
        "tags": ["logaritmi", "modelesana"],
        "tasks": [
            {
                "title_ru": "Непрерывный экспоненциальный распад вещества",
                "title_lv": "Vielas radioaktīvās sabrukšanas laika aprēķins",
                "condition_latex_ru": "Масса радиоактивного изотопа уменьшается по закону $m(t) = m_0 e^{-0{,}05 t}$ ($t$ в годах). Через сколько лет масса изотопа уменьшится в $2$ раза (найдите период полураспада, округлив до десятых, приняв $\\ln 2 \\approx 0{,}693$)?",
                "condition_latex_lv": "Radioaktīvā izotopa masa samazinās pēc likuma $m(t) = m_0 e^{-0{,}05 t}$ ($t$ gados). Pēc cik gadiem masa samazināsies 2 reizes (aprēķiniet pussabrukšanas periodu, ja $\\ln 2 \\approx 0{,}693$)?",
                "answer_latex": "$13{,}9$",
                "solution_latex_ru": "1) Составляем уравнение: $\\frac{m(t)}{m_0} = 0{,}5 \\implies e^{-0{,}05 t} = 0{,}5$.\n2) Логарифмируем по основанию $e$: $-0{,}05 t = \\ln(0{,}5) = -\\ln 2$.\n3) Находим $t$: $t = \\frac{\\ln 2}{0{,}05} = \\frac{0{,}693}{0{,}05} = 13{,}86 \\approx 13{,}9$ лет.",
                "solution_latex_lv": "1) $e^{-0{,}05 t} = 0{,}5 \\implies -0{,}05 t = -\\ln 2$.\n2) $t = \\frac{\\ln 2}{0{,}05} \\approx \\frac{0{,}693}{0{,}05} = 13{,}86 \\approx 13{,}9$ gadi.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["modelesana", "logaritmi"]
            }
        ]
    },
    {
        "slug": "augst-funkcijas-nepartrauktiba",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 11,
        "title_ru": "Непрерывность функции",
        "title_lv": "Funkcijas nepārtrauktība",
        "description_ru": "Определение непрерывности в точке $\\lim_{x \\to x_0} f(x) = f(x_0)$, точки разрыва, теорема Больцано–Коши о промежуточных значениях.",
        "description_lv": "Nepārtrauktība punktā $\\lim_{x \\to x_0} f(x) = f(x_0)$, pārtraukuma punkti, teorēma par funkcijas starpvērtībām.",
        "tags": ["matematiska-analize", "grafiki"],
        "tasks": [
            {
                "title_ru": "Условие непрерывности кусочно-заданной функции",
                "title_lv": "Gabaliem uzdotas funkcijas nepārtrauktības nosacījums",
                "condition_latex_ru": "При каком значении параметра $a$ функция $f(x) = \\begin{cases} 2x + a, & x \\le 1 \\\\ x^2 + 3, & x > 1 \\end{cases}$ является непрерывной во всех точках?",
                "condition_latex_lv": "Kādai parametra $a$ vērtībai funkcija $f(x) = \\begin{cases} 2x + a, & x \\le 1 \\\\ x^2 + 3, & x > 1 \\end{cases}$ ir nepārtraukta visā definīcijas apgabalā?",
                "answer_latex": "$2$",
                "solution_latex_ru": "1) Функция составлена из многочленов, поэтому непрерывна при $x < 1$ и $x > 1$. Точка возможного разрыва — $x = 1$.\n2) Значение функции и предел слева: $\\lim_{x \\to 1^-} f(x) = f(1) = 2(1) + a = 2 + a$.\n3) Предел справа: $\\lim_{x \\to 1^+} f(x) = 1^2 + 3 = 4$.\n4) Для непрерывности пределы должны совпадать: $2 + a = 4 \\implies a = 2$.",
                "solution_latex_lv": "1) Pārbauda nepārtrauktību sadures punktā $x = 1$.\n2) Robeža no kreisās puses: $f(1) = 2 \\cdot 1 + a = 2 + a$.\n3) Robeža no labās puses: $\\lim_{x \\to 1^+} (x^2 + 3) = 4$.\n4) Funkcija ir nepārtraukta, ja abas robežas sakrīt: $2 + a = 4 \\implies a = 2$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["matematiska-analize"]
            }
        ]
    },
    {
        "slug": "augst-dalveida-racionalas-funkcijas-petisana",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 12,
        "title_ru": "Исследование дробно-рациональной функции",
        "title_lv": "Daļveida racionālas funkcijas pētīšana",
        "description_ru": "Наклонные асимптоты $y = kx + b$, точки пересечения с осями координат, знаки постоянства.",
        "description_lv": "Slīpās asimptotas $y = kx + b$, krustpunkti ar asīm, zīmju pastāvība.",
        "tags": ["algebriskie-parveidojumi", "grafiki"],
        "tasks": [
            {
                "title_ru": "Нахождение наклонной асимптоты дробно-рациональной функции",
                "title_lv": "Daļveida funkcijas slīpās asimptotas atrašana",
                "condition_latex_ru": "Найдите уравнение наклонной асимптоты графика функции $f(x) = \\frac{2x^2 + 3x - 1}{x + 1}$.",
                "condition_latex_lv": "Atrodiet funkcijas $f(x) = \\frac{2x^2 + 3x - 1}{x + 1}$ slīpās asimptotas vienādojumu.",
                "answer_latex": "$y = 2x + 1$",
                "solution_latex_ru": "1) Разделим числитель на знаменатель «уголком»:\n$\\frac{2x^2 + 3x - 1}{x + 1} = 2x + 1 - \\frac{2}{x + 1}$.\n2) При $x \\to \\pm\\infty$ остаток $-\\frac{2}{x + 1} \\to 0$.\n3) Следовательно, наклонная асимптота задается уравнением $y = 2x + 1$.",
                "solution_latex_lv": "1) Izdala daļas skaitītāju ar saucēju: $\\frac{2x^2 + 3x - 1}{x + 1} = 2x + 1 - \\frac{2}{x + 1}$.\n2) Kad $x \\to \\infty$, atlikums tiecas uz nulli: $\\lim_{x \\to \\infty} \\frac{-2}{x + 1} = 0$.\n3) Slīpās asimptotas vienādojums ir $y = 2x + 1$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["grafiki"]
            }
        ]
    },

    # ── TRIGONOMETRIJA (13..17) ──────────────────────────────────────────────────
    {
        "slug": "augst-lenka-tangenss-kotangenss",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 13,
        "title_ru": "Тангенс и котангенс угла",
        "title_lv": "Leņķa tangenss un kotangenss",
        "description_ru": "Функции $y = \\tan x$ и $y = \\cot x$, период $T = \\pi$, область определения, вертикальные асимптоты.",
        "description_lv": "Funkcijas $y = \\tan x$ un $y = \\cot x$, periods $T = \\pi$, definīcijas apgabals, asimptotas.",
        "tags": ["funkcijas", "grafiki"],
        "tasks": [
            {
                "title_ru": "Область определения функции тангенса",
                "title_lv": "Tangensa funkcijas definīcijas kopas noteikšana",
                "condition_latex_ru": "Найдите область определения функции $y = \\tan(2x - \\frac{\\pi}{4})$.",
                "condition_latex_lv": "Nosakiet funkcijas $y = \\tan(2x - \\frac{\\pi}{4})$ definīcijas kopu.",
                "answer_latex": "$x \\ne \\frac{3\\pi}{8} + \\frac{\\pi k}{2}$, $k \\in \\mathbb{Z}$",
                "solution_latex_ru": "1) Тангенс не определен там, где аргумент равен $\\frac{\\pi}{2} + \\pi k, k \\in \\mathbb{Z}$.\n2) Составляем условие: $2x - \\frac{\\pi}{4} \\ne \\frac{\\pi}{2} + \\pi k$.\n3) Переносим: $2x \\ne \\frac{3\\pi}{4} + \\pi k \\implies x \\ne \\frac{3\\pi}{8} + \\frac{\\pi k}{2}, k \\in \\mathbb{Z}$.",
                "solution_latex_lv": "1) Tangenss nav definēts, ja arguments ir $\\frac{\\pi}{2} + \\pi k$.\n2) $2x - \\frac{\\pi}{4} \\ne \\frac{\\pi}{2} + \\pi k \\implies 2x \\ne \\frac{3\\pi}{4} + \\pi k$.\n3) $x \\ne \\frac{3\\pi}{8} + \\frac{\\pi k}{2}, k \\in \\mathbb{Z}$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["funkcijas"]
            }
        ]
    },
    {
        "slug": "augst-apgrieztas-trig-funkcijas",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 14,
        "title_ru": "Обратные тригонометрические функции",
        "title_lv": "Apgrieztās trigonometriskās funkcijas",
        "description_ru": "Определения и графики $\\arcsin x, \\arccos x, \\arctan x$, их области определения и множества главных значений.",
        "description_lv": "Funkcijas $\\arcsin x, \\arccos x, \\arctan x$, to definīcijas un vērtību apgabali, identitātes.",
        "tags": ["funkcijas", "grafiki"],
        "tasks": [
            {
                "title_ru": "Вычисление значения выражения с аркфункциями",
                "title_lv": "Arktriogonometriskās izteiksmes vērtības aprēķināšana",
                "condition_latex_ru": "Вычислите точное значение выражения: $\\sin(\\arccos(-\\frac{3}{5}))$.",
                "condition_latex_lv": "Aprēķiniet izteiksmes precīzo vērtību: $\\sin(\\arccos(-\\frac{3}{5}))$.",
                "answer_latex": "$\\frac{4}{5}$",
                "solution_latex_ru": "1) Пусть $\\alpha = \\arccos(-\\frac{3}{5})$. По определению $\\alpha \\in [0; \\pi]$, а так как аргумент отрицателен, $\\alpha \\in (\\frac{\\pi}{2}; \\pi]$ (вторая четверть).\n2) Во второй четверти синус положителен: $\\sin \\alpha = +\\sqrt{1 - \\cos^2 \\alpha}$.\n3) Подставляем: $\\sin \\alpha = \\sqrt{1 - (-\\frac{3}{5})^2} = \\sqrt{1 - \\frac{9}{25}} = \\sqrt{\\frac{16}{25}} = \\frac{4}{5}$.",
                "solution_latex_lv": "1) Apzīmē $\\alpha = \\arccos(-\\frac{3}{5})$, kur $\\alpha$ pieder II ceturksnim.\n2) Otrajā ceturksnī sinuss ir pozitīvs: $\\sin \\alpha = \\sqrt{1 - \\cos^2 \\alpha}$.\n3) $\\sin \\alpha = \\sqrt{1 - 9/25} = \\frac{4}{5}$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["funkcijas"]
            }
        ]
    },
    {
        "slug": "augst-trigonometriskas-nevienadibas",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 15,
        "title_ru": "Тригонометрические неравенства",
        "title_lv": "Trigonometriskās nevienādības",
        "description_ru": "Решение неравенств $\\sin x > a$, $\\cos x \\le a$ с помощью тригонометрического круга и графиков функций.",
        "description_lv": "Nevienādību risināšana ar vienības riņķi un grafiku palīdzību, perioda pieskaitīšana.",
        "tags": ["nevienadibas", "grafiki"],
        "tasks": [
            {
                "title_ru": "Решение тригонометрического неравенства на единичной окружности",
                "title_lv": "Trigonometriskās nevienādības risināšana ar vienības riņķi",
                "condition_latex_ru": "Решите неравенство: $\\cos x > -\\frac{1}{2}$. Запишите общее решение.",
                "condition_latex_lv": "Atrisiniet nevienādību: $\\cos x > -\\frac{1}{2}$. Pierakstiet vispārīgo atrisinājumu.",
                "answer_latex": "$x \\in \\left(-\\frac{2\\pi}{3} + 2\\pi k;\\; \\frac{2\\pi}{3} + 2\\pi k\\right)$, $k \\in \\mathbb{Z}$",
                "solution_latex_ru": "1) На единичной окружности абсцисса точки должна быть строго больше $-\\frac{1}{2}$.\n2) Точки пересечения с вертикалью $x = -\\frac{1}{2}$ соответствуют углам $\\frac{2\\pi}{3}$ и $-\\frac{2\\pi}{3}$.\n3) Дуга, лежащая правее этой прямой, охватывает угол от $-\\frac{2\\pi}{3}$ до $\\frac{2\\pi}{3}$.\n4) С учетом периода $2\\pi k$: $x \\in \\left(-\\frac{2\\pi}{3} + 2\\pi k; \\frac{2\\pi}{3} + 2\\pi k\\right), k \\in \\mathbb{Z}$.",
                "solution_latex_lv": "1) Vienības riņķī meklē loku, kur abscisa ir lielāka par $-1/2$.\n2) Robežleņķi ir $\\pm \\frac{2\\pi}{3}$.\n3) Vispārīgais atrisinājums: $x \\in \\left(-\\frac{2\\pi}{3} + 2\\pi k; \\frac{2\\pi}{3} + 2\\pi k\\right), k \\in \\mathbb{Z}$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["nevienadibas"]
            }
        ]
    },
    {
        "slug": "augst-trig-vienadojumu-sistemas",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 16,
        "title_ru": "Системы тригонометрических уравнений",
        "title_lv": "Trigonometrisko vienādojumu sistēmas",
        "description_ru": "Методы сложения и подстановки, формулы преобразования произведения функций в сумму и суммы в произведение.",
        "description_lv": "Saskaitīšanas un ievietošanas metodes, reizinājuma pārvēršana summā un otrādi.",
        "tags": ["vienadojumi", "algebriskie-parveidojumi"],
        "tasks": [
            {
                "title_ru": "Решение системы двух тригонометрических уравнений",
                "title_lv": "Divu trigonometrisko vienādojumu sistēmas atrisināšana",
                "condition_latex_ru": "Найдите решения системы уравнений: $\\begin{cases} \\sin x \\cos y = \\frac{3}{4} \\\\ \\cos x \\sin y = \\frac{1}{4} \\end{cases}$ для углов $x, y \\in [0; \\pi]$.",
                "condition_latex_lv": "Atrisiniet sistēmu: $\\begin{cases} \\sin x \\cos y = \\frac{3}{4} \\\\ \\cos x \\sin y = \\frac{1}{4} \\end{cases}$, ja $x, y \\in [0; \\pi]$.",
                "answer_latex": "$x = \\frac{\\pi}{3}$, $y = \\frac{\\pi}{6}$",
                "solution_latex_ru": "1) Складываем уравнения: $\\sin x \\cos y + \\cos x \\sin y = \\sin(x + y) = \\frac{3}{4} + \\frac{1}{4} = 1$.\nОтсюда $x + y = \\frac{\\pi}{2}$ (так как $x, y \\in [0; \\pi]$).\n2) Вычитаем второе уравнение из первого: $\\sin x \\cos y - \\cos x \\sin y = \\sin(x - y) = \\frac{3}{4} - \\frac{1}{4} = \\frac{1}{2}$.\nОтсюда $x - y = \\frac{\\pi}{6}$.\n3) Складываем: $2x = \\frac{\\pi}{2} + \\frac{\\pi}{6} = \\frac{2\\pi}{3} \\implies x = \\frac{\\pi}{3}$.\nТогда $y = \\frac{\\pi}{2} - \\frac{\\pi}{3} = \\frac{\\pi}{6}$.",
                "solution_latex_lv": "1) Saskaita vienādojumus: $\\sin(x + y) = 1 \\implies x + y = \\frac{\\pi}{2}$.\n2) Atņem vienādojumus: $\\sin(x - y) = \\frac{1}{2} \\implies x - y = \\frac{\\pi}{6}$.\n3) Atrisinot lineāro sistēmu: $x = \\frac{\\pi}{3}, y = \\frac{\\pi}{6}$.",
                "difficulty": "Сложный",
                "grade": 12,
                "tags": ["vienadojumi"]
            }
        ]
    },
    {
        "slug": "augst-harmoniskas-svarstibas-modeli",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 17,
        "title_ru": "Гармонические колебания и тригонометрические модели",
        "title_lv": "Harmoniskās svārstības un trigonometriskie modeļi",
        "description_ru": "Уравнение колебаний $x(t) = A \\cos(\\omega t + \\varphi_0)$, амплитуда $A$, циклическая частота $\\omega$, начальная фаза $\\varphi_0$, период $T = 2\\pi/\\omega$.",
        "description_lv": "Svārstību vienādojums $x(t) = A \\cos(\\omega t + \\varphi_0)$, amplitūda, cikliskā frekvence, sākumfāze, periods.",
        "tags": ["modelesana", "funkcijas"],
        "tasks": [
            {
                "title_ru": "Определение параметров колебательного процесса по графической модели",
                "title_lv": "Svārstību procesa parametru noteikšana",
                "condition_latex_ru": "Колебательный процесс описывается формулой $y(t) = 5 \\sin(10\\pi t + \\frac{\\pi}{3})$. Найдите амплитуду колебаний $A$, частоту $\\nu$ (в Гц) и период $T$ (в секундах).",
                "condition_latex_lv": "Svārstību process doti ar funkciju $y(t) = 5 \\sin(10\\pi t + \\frac{\\pi}{3})$. Nosakiet svārstību amplitūdu $A$, frekvenci $\\nu$ (Hz) un periodu $T$ (s).",
                "answer_latex": "$A = 5$, $\\nu = 5\\text{ Гц}$, $T = 0{,}2\\text{ с}$",
                "solution_latex_ru": "1) Амплитуда: коэффициент перед синусом $A = 5$.\n2) Циклическая частота $\\omega = 10\\pi$.\n3) Период колебаний: $T = \\frac{2\\pi}{\\omega} = \\frac{2\\pi}{10\\pi} = \\frac{1}{5} = 0{,}2\\text{ с}$.\n4) Частота: $\\nu = \\frac{1}{T} = \\frac{1}{0{,}2} = 5\\text{ Гц}$.",
                "solution_latex_lv": "1) Amplitūda $A = 5$.\n2) Cikliskā frekvence $\\omega = 10\\pi$.\n3) Periods $T = \\frac{2\\pi}{10\\pi} = 0{,}2\\text{ s}$.\n4) Frekvence $\\nu = \\frac{1}{T} = 5\\text{ Hz}$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["modelesana"]
            }
        ]
    },

    # ── PLANIMETRIJA (18..23) ────────────────────────────────────────────────────
    {
        "slug": "augst-sakaribas-trijsturos-padzilinati",
        "subject_slug": "geometry",
        "grade": 12,
        "position": 18,
        "title_ru": "Соотношения в треугольниках (углубленно)",
        "title_lv": "Sakarības trijstūros (padziļināti)",
        "description_ru": "Теорема о медианах (точка пересечения делит в отношении 2:1), биссектрисах (деление противоположной стороны), теорема Менелая и Чевы.",
        "description_lv": "Mediānu krustpunkta īpašība ($2:1$), bisektrises īpašība, Menelāja un Čevas teorēmas.",
        "tags": ["trigonometrija", "pieradijumi"],
        "tasks": [
            {
                "title_ru": "Свойство биссектрисы угла треугольника",
                "title_lv": "Trijstūra bisektrises īpašība",
                "condition_latex_ru": "В треугольнике $ABC$ стороны $AB = 10\\text{ см}$ и $AC = 15\\text{ см}$, а сторона $BC = 20\\text{ см}$. Биссектриса угла $A$ делит сторону $BC$ на отрезки $BD$ и $DC$. Найдите длину отрезка $BD$.",
                "condition_latex_lv": "Trijstūrī $ABC$ malas ir $AB = 10\\text{ cm}$, $AC = 15\\text{ cm}$ un $BC = 20\\text{ cm}$. Leņķa $A$ bisektrise krusto malu $BC$ punktā $D$. Aprēķiniet nogriežņa $BD$ garumu.",
                "answer_latex": "$8$",
                "solution_latex_ru": "1) По свойству биссектрисы: $\\frac{BD}{DC} = \\frac{AB}{AC} = \\frac{10}{15} = \\frac{2}{3}$.\n2) Пусть $BD = 2x$, тогда $DC = 3x$. Вся сторона $BC = 2x + 3x = 5x = 20$.\n3) $x = 4\\text{ см}$, следовательно, $BD = 2 \\cdot 4 = 8\\text{ см}$.",
                "solution_latex_lv": "1) Pēc bisektrises īpašības: $\\frac{BD}{DC} = \\frac{AB}{AC} = \\frac{10}{15} = \\frac{2}{3}$.\n2) $BD + DC = 2x + 3x = 5x = 20 \\implies x = 4$.\n3) $BD = 2 \\cdot 4 = 8\\text{ cm}$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["planimetrija"]
            }
        ]
    },
    {
        "slug": "augst-sakaribas-cetrsturos-daudzsturos",
        "subject_slug": "geometry",
        "grade": 12,
        "position": 19,
        "title_ru": "Соотношения в четырехугольниках и правильных многоугольниках",
        "title_lv": "Sakarības četrstūros un regulāros daudzstūros",
        "description_ru": "Вписанные четырехугольники (сумма противоположных углов $180^\\circ$), описанные четырехугольники (суммы противоположных сторон равны), теорема Птолемея.",
        "description_lv": "Ievilkti un apvilkti četrstūri, pretējo leņķu un malu summas, Ptolemaja teorēma.",
        "tags": ["merijumi", "pieradijumi"],
        "tasks": [
            {
                "title_ru": "Периметр описанного четырехугольника",
                "title_lv": "Apvilkta četrstūra perimetra aprēķināšana",
                "condition_latex_ru": "Около окружности описан четырехугольник $ABCD$, у которого $AB = 7\\text{ см}$ и $CD = 11\\text{ см}$. Найдите периметр этого четырехугольника.",
                "condition_latex_lv": "Ap riņķa līniju apvilkts četrstūris $ABCD$, kura malas ir $AB = 7\\text{ cm}$ un $CD = 11\\text{ cm}$. Aprēķiniet šī četrstūra perimetru.",
                "answer_latex": "$36$",
                "solution_latex_ru": "1) В описанном четырехугольнике суммы противоположных сторон равны: $AB + CD = BC + AD$.\n2) Сумма первой пары: $7 + 11 = 18\\text{ см}$.\n3) Сумма второй пары сторон также равна $18\\text{ см}$.\n4) Периметр: $P = (AB + CD) + (BC + AD) = 18 + 18 = 36\\text{ см}$.",
                "solution_latex_lv": "1) Apvilktā četrstūrī pretējo malu summas ir vienādas: $AB + CD = BC + AD = 7 + 11 = 18\\text{ cm}$.\n2) Perimetrs: $P = 18 + 18 = 36\\text{ cm}$.",
                "difficulty": "Лёгкий",
                "grade": 12,
                "tags": ["merijumi"]
            }
        ]
    },
    {
        "slug": "augst-rinka-linija-lenki-nogriezni",
        "subject_slug": "geometry",
        "grade": 12,
        "position": 20,
        "title_ru": "Отрезки и углы, связанные с окружностью",
        "title_lv": "Ar riņķa līniju saistīti leņķi un nogriežņi",
        "description_ru": "Теорема о произведении отрезков пересекающихся хорд, теорема о касательной и секущей ($AK^2 = AM \\cdot AN$).",
        "description_lv": "Hordu krustošanās teorēma, pieskares un sekantes teorēma ($AK^2 = AM \\cdot AN$).",
        "tags": ["pieradijumi"],
        "tasks": [
            {
                "title_ru": "Теорема о касательной и секущей к окружности",
                "title_lv": "Pieskares un sekantes teorēmas lietošana",
                "condition_latex_ru": "Из точки $A$, расположенной вне окружности, проведены касательная $AK$ и секущая, которая пересекает окружность в точках $B$ и $C$. Известно, что $AB = 4\\text{ см}$ и $BC = 12\\text{ см}$. Найдите длину отрезка касательной $AK$.",
                "condition_latex_lv": "No punkta $A$ ārpus riņķa līnijas novilkta pieskare $AK$ un sekante $ABC$, kur $AB = 4\\text{ cm}$ un $BC = 12\\text{ cm}$. Aprēķiniet pieskares nogriežņa $AK$ garumu.",
                "answer_latex": "$8$",
                "solution_latex_ru": "1) Вся секущая: $AC = AB + BC = 4 + 12 = 16\\text{ см}$.\n2) По теореме о касательной и секущей: $AK^2 = AB \\cdot AC = 4 \\cdot 16 = 64$.\n3) $AK = \\sqrt{64} = 8\\text{ см}$.",
                "solution_latex_lv": "1) Sekantes kopējais garums: $AC = 4 + 12 = 16\\text{ cm}$.\n2) Pēc teorēmas: $AK^2 = AB \\cdot AC = 4 \\cdot 16 = 64$.\n3) $AK = 8\\text{ cm}$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["pieradijumi"]
            }
        ]
    },
    {
        "slug": "augst-geometriskie-parveidojumi-padzilinati",
        "subject_slug": "geometry",
        "grade": 12,
        "position": 21,
        "title_ru": "Геометрические преобразования (углубленно)",
        "title_lv": "Ģeometriskie pārveidojumi",
        "description_ru": "Гомотетия и подобие, композиция движений, инварианты преобразований, применение преобразований при решении геометрических задач.",
        "description_lv": "Homotētija, kustību kompozīcija, invarianti, pārveidojumu izmantošana uzdevumu risināšanā.",
        "tags": ["koordinatu-metode"],
        "tasks": [
            {
                "title_ru": "Координаты образа точки при гомотетии",
                "title_lv": "Punkta koordinātas pēc homotētijas",
                "condition_latex_ru": "Точка $M(5; 7)$ преобразуется гомотетией с центром в точке $S(1; 3)$ и коэффициентом $k = -2$. Найдите координаты полученной точки $M'$.",
                "condition_latex_lv": "Punkts $M(5; 7)$ tiek pārveidots ar homotētiju, kuras centrs ir $S(1; 3)$ un koeficients $k = -2$. Nosakiet attēla punkta $M'$ koordinātas.",
                "answer_latex": "$(-7; -5)$",
                "solution_latex_ru": "1) Вектор из центра в точку $M$: $\\vec{SM} = (5 - 1; 7 - 3) = (4; 4)$.\n2) Умножаем вектор на коэффициент гомотетии $k = -2$: $\\vec{SM'} = -2 \\cdot (4; 4) = (-8; -8)$.\n3) Координаты точки $M'$: $M' = S + \\vec{SM'} = (1 + (-8); 3 + (-8)) = (-7; -5)$.",
                "solution_latex_lv": "1) Vektors no centra: $\\vec{SM} = (4; 4)$.\n2) Pēc homotētijas: $\\vec{SM'} = -2 \\cdot (4; 4) = (-8; -8)$.\n3) Punkta $M'$ koordinātas: $(1 - 8; 3 - 8) = (-7; -5)$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["koordinatu-metode"]
            }
        ]
    },
    {
        "slug": "augst-analitiska-geometrija-taisne-rinkis",
        "subject_slug": "geometry",
        "grade": 12,
        "position": 22,
        "title_ru": "Аналитическая геометрия: прямая и окружность",
        "title_lv": "Analītiskā ģeometrija: taisne un riņķa līnija",
        "description_ru": "Расстояние от точки до прямой $d = \\frac{|Ax_0 + By_0 + C|}{\\sqrt{A^2 + B^2}}$, касание прямой и окружности, пересечение фигур.",
        "description_lv": "Attālums no punkta līdz taisnei, pieskaršanās nosacījumi, taisnes un riņķa līnijas krustpunkti.",
        "tags": ["koordinatu-metode", "vienadojumi"],
        "tasks": [
            {
                "title_ru": "Вычисление расстояния от точки до прямой",
                "title_lv": "Attāluma aprēķināšana no punkta līdz taisnei",
                "condition_latex_ru": "Найдите расстояние от точки $M(2; -1)$ до прямой, заданной уравнением $3x - 4y + 5 = 0$.",
                "condition_latex_lv": "Aprēķiniet attālumu no punkta $M(2; -1)$ līdz taisnei $3x - 4y + 5 = 0$.",
                "answer_latex": "$3$",
                "solution_latex_ru": "1) Применяем формулу расстояния от точки до прямой: $d = \\frac{|Ax_0 + By_0 + C|}{\\sqrt{A^2 + B^2}}$.\n2) Подставляем координаты точки $(2; -1)$ и коэффициенты $A = 3, B = -4, C = 5$:\n$d = \\frac{|3(2) - 4(-1) + 5|}{\\sqrt{3^2 + (-4)^2}} = \\frac{|6 + 4 + 5|}{\\sqrt{25}} = \\frac{15}{5} = 3$.",
                "solution_latex_lv": "1) Izmanto attāluma formulu: $d = \\frac{|Ax_0 + By_0 + C|}{\\sqrt{A^2 + B^2}}$.\n2) $d = \\frac{|3 \\cdot 2 - 4 \\cdot (-1) + 5|}{\\sqrt{9 + 16}} = \\frac{15}{5} = 3$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["koordinatu-metode"]
            }
        ]
    },
    {
        "slug": "augst-vektoru-skalarais-uzdevumos",
        "subject_slug": "geometry",
        "grade": 12,
        "position": 23,
        "title_ru": "Скалярное произведение векторов в геометрических задачах",
        "title_lv": "Vektoru skalārais reizinājums uzdevumos",
        "description_ru": "Применение векторов для вычисления углов между прямыми, доказательства ортогональности, нахождения проекции вектора на вектор.",
        "description_lv": "Leņķa aprēķināšana starp taisnēm, ortogonalitātes pierādīšana, vektora projekcija.",
        "tags": ["vektori", "trigonometrija"],
        "tasks": [
            {
                "title_ru": "Косинус угла между диагоналями четырехугольника через векторы",
                "title_lv": "Leņķa aprēķināšana starp diviem vektoriem",
                "condition_latex_ru": "Найдите косинус угла между векторами $\\vec{a} = (1; 2)$ и $\\vec{b} = (3; 4)$.",
                "condition_latex_lv": "Aprēķiniet kosinusu leņķim starp vektoriem $\\vec{a} = (1; 2)$ un $\\vec{b} = (3; 4)$.",
                "answer_latex": "$\\frac{11}{5\\sqrt{5}}$",
                "solution_latex_ru": "1) Скалярное произведение: $\\vec{a} \\cdot \\vec{b} = 1 \\cdot 3 + 2 \\cdot 4 = 3 + 8 = 11$.\n2) Длины векторов: $|\\vec{a}| = \\sqrt{1^2 + 2^2} = \\sqrt{5}$, $|\\vec{b}| = \\sqrt{3^2 + 4^2} = 5$.\n3) Косинус угла: $\\cos \\varphi = \\frac{\\vec{a} \\cdot \\vec{b}}{|\\vec{a}| \\cdot |\\vec{b}|} = \\frac{11}{5\\sqrt{5}}$.",
                "solution_latex_lv": "1) Skalārais reizinājums: $\\vec{a} \\cdot \\vec{b} = 1 \\cdot 3 + 2 \\cdot 4 = 11$.\n2) Vektoru moduļi: $|\\vec{a}| = \\sqrt{5}$, $|\\vec{b}| = 5$.\n3) $\\cos \\varphi = \\frac{11}{5\\sqrt{5}}$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["vektori"]
            }
        ]
    },

    # ── STEREOMETRIJA (24..28) ──────────────────────────────────────────────────
    {
        "slug": "augst-daudzskaldnu-skelumi-padzilinati",
        "subject_slug": "geometry",
        "grade": 12,
        "position": 24,
        "title_ru": "Сечения многогранников плоскостью (углубленно)",
        "title_lv": "Daudzskaldņi un to šķēlumi ar plakni",
        "description_ru": "Метод следов, внутреннее проектирование, построение сечений через три точки, не лежащие на одной грани, вычисление площадей сечений.",
        "description_lv": "Pēdu metode, iekšējā projektēšana, šķēlumu konstrukcija caur 3 punktiem, šķēluma laukuma aprēķināšana.",
        "tags": ["planimetrija", "pieradijumi"],
        "tasks": [
            {
                "title_ru": "Площадь сечения правильного тетраэдра",
                "title_lv": "Regulāra tetraedra šķēluma laukums",
                "condition_latex_ru": "Ребро правильного тетраэдра равно $6\\text{ см}$. Найдите площадь сечения, проходящего через ребро тетраэдра и середину противоположного ребра.",
                "condition_latex_lv": "Regulāra tetraedra šķautne ir $6\\text{ cm}$. Aprēķiniet laukumu šķēlumam, kas iet caur vienu šķautni un pretējās šķautnes viduspunktu.",
                "answer_latex": "$9\\sqrt{2}$",
                "solution_latex_ru": "1) Сечением является равнобедренный треугольник, основание которого равно ребру тетраэдра $a = 6\\text{ см}$, а боковые стороны — высотам правильных граней: $h = \\frac{a\\sqrt{3}}{2} = \\frac{6\\sqrt{3}}{2} = 3\\sqrt{3}\\text{ см}$.\n2) Высота этого сечения к основанию $a$: $H_{sek} = \\sqrt{h^2 - (a/2)^2} = \\sqrt{(3\\sqrt{3})^2 - 3^2} = \\sqrt{27 - 9} = \\sqrt{18} = 3\\sqrt{2}\\text{ см}$.\n3) Площадь сечения: $S = \\frac{1}{2} \\cdot 6 \\cdot 3\\sqrt{2} = 9\\sqrt{2}\\text{ см}^2$.",
                "solution_latex_lv": "1) Šķēlums ir vienādsānu trijstūris ar pamatu $a = 6\\text{ cm}$ un sānu malām $h = \\frac{6\\sqrt{3}}{2} = 3\\sqrt{3}\\text{ cm}$.\n2) Šķēluma trijstūra augstums: $H = \\sqrt{27 - 9} = \\sqrt{18} = 3\\sqrt{2}\\text{ cm}$.\n3) Šķēluma laukums: $S = \\frac{1}{2} \\cdot 6 \\cdot 3\\sqrt{2} = 9\\sqrt{2}\\text{ cm}^2$.",
                "difficulty": "Сложный",
                "grade": 12,
                "tags": ["planimetrija"]
            }
        ]
    },
    {
        "slug": "augst-prizmas-cilindra-kombinacijas",
        "subject_slug": "geometry",
        "grade": 12,
        "position": 25,
        "title_ru": "Комбинации призмы и цилиндра",
        "title_lv": "Prizmas un cilindra ģeometriskās kombinācijas",
        "description_ru": "Вписанные и описанные призмы около цилиндра, соотношение объемов, осевые сечения.",
        "description_lv": "Apvilkta un ievilkta prizma, tilpumu attiecības, aksiālšķēlumi.",
        "tags": ["merijumi", "planimetrija"],
        "tasks": [
            {
                "title_ru": "Объем правильной призмы, вписанной в цилиндр",
                "title_lv": "Cilindrā ievilktas regulāras četrstūra prizmas tilpums",
                "condition_latex_ru": "В цилиндр с радиусом основания $R = 4\\text{ см}$ и высотой $H = 10\\text{ см}$ вписана правильная четырехугольная призма. Найдите объем призмы.",
                "condition_latex_lv": "Cilindrā ar pamata rādiusu $R = 4\\text{ cm}$ un augstumu $H = 10\\text{ cm}$ ievilkta regulāra četrstūra prizma. Aprēķiniet prizmas tilpumu.",
                "answer_latex": "$320$",
                "solution_latex_ru": "1) Основание призмы — квадрат, вписанный в круг радиуса $R = 4\\text{ см}$. Диагональ квадрата равна диаметру круга: $d = 2R = 8\\text{ см}$.\n2) Площадь квадрата: $S_{pam} = \\frac{d^2}{2} = \\frac{64}{2} = 32\\text{ см}^2$.\n3) Объем призмы: $V = S_{pam} \\cdot H = 32 \\cdot 10 = 320\\text{ см}^3$.",
                "solution_latex_lv": "1) Prizmas pamats ir kvadrāts ar diagonāli $d = 2R = 8\\text{ cm}$.\n2) Kvadrāta laukums: $S_{pam} = \\frac{d^2}{2} = 32\\text{ cm}^2$.\n3) Prizmas tilpums: $V = S_{pam} \\cdot H = 32 \\cdot 10 = 320\\text{ cm}^3$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["merijumi"]
            }
        ]
    },
    {
        "slug": "augst-konusa-piramidas-kombinacijas",
        "subject_slug": "geometry",
        "grade": 12,
        "position": 26,
        "title_ru": "Комбинации конуса и пирамиды",
        "title_lv": "Konusa un piramīdas ģeometriskās kombinācijas",
        "description_ru": "Вписанная и описанная пирамида относительно конуса, общая вершина и высота, связь радиуса основания конуса с многоугольником основания.",
        "description_lv": "Ievilktas un apvilktas piramīdas, kopējā virsotne un augstums, sakarības starp rādiusu un pamata daudzstūri.",
        "tags": ["merijumi", "trigonometrija"],
        "tasks": [
            {
                "title_ru": "Отношение объемов правильной пирамиды и описанного конуса",
                "title_lv": "Regulāras piramīdas un apvilkta konusa tilpumu attiecība",
                "condition_latex_ru": "Около правильной четырехугольной пирамиды описан конус. Найдите отношение объема пирамиды к объему конуса.",
                "condition_latex_lv": "Ap regulāru četrstūra piramīdu apvilkts konuss. Aprēķiniet piramīdas un konusa tilpumu attiecību $V_{\\text{pir}} / V_{\\text{kon}}$.",
                "answer_latex": "$\\frac{2}{\\pi}$",
                "solution_latex_ru": "1) Высота конуса и пирамиды одинакова: $H$.\n2) Радиус основания конуса равен расстоянию от центра квадрата до вершины: $R = \\frac{a}{\\sqrt{2}} \\implies a = R\\sqrt{2}$.\n3) Площадь основания пирамиды: $S_{\\text{кв}} = a^2 = (R\\sqrt{2})^2 = 2R^2$.\n4) Площадь основания конуса: $S_{\\text{круг}} = \\pi R^2$.\n5) Отношение объемов: $\\frac{V_{\\text{pir}}}{V_{\\text{kon}}} = \\frac{\\frac{1}{3} S_{\\text{кв}} H}{\\frac{1}{3} S_{\\text{круг}} H} = \\frac{2R^2}{\\pi R^2} = \\frac{2}{\\pi}$.",
                "solution_latex_lv": "1) Augstumi ir vienādi. Konusa pamata rādiuss ir kvadrāta apvilktās riņķa līnijas rādiuss: $a = R\\sqrt{2}$.\n2) $S_{\\text{pam}} = 2R^2$, bet riņķa laukums ir $\\pi R^2$.\n3) Tilpumu attiecība: $\\frac{2R^2}{\\pi R^2} = \\frac{2}{\\pi}$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["merijumi"]
            }
        ]
    },
    {
        "slug": "augst-lodes-cilindra-konusa-kombinacijas",
        "subject_slug": "geometry",
        "grade": 12,
        "position": 27,
        "title_ru": "Комбинации шара, цилиндра и конуса",
        "title_lv": "Lodes, cilindra un konusa ģeometriskās kombinācijas",
        "description_ru": "Шар, вписанный в цилиндр (задача Архимеда), шар, вписанный в конус и описанный около конуса, осевые сечения.",
        "description_lv": "Lodes un cilindra kombinācija (Arhimēda uzdevums), lodē ievilkts un apvilkts konuss, aksiālšķēlumi.",
        "tags": ["merijumi"],
        "tasks": [
            {
                "title_ru": "Отношение объемов шара и описанного около него цилиндра",
                "title_lv": "Lodes un apvilkta cilindra tilpumu attiecība",
                "condition_latex_ru": "Шар вписан в цилиндр (касается оснований и боковой поверхности). Найдите отношение объема шара к объему цилиндра.",
                "condition_latex_lv": "Lode ir ievilkta cilindrā (pieskaras pamatiem un sānu virsmai). Aprēķiniet lodes un cilindra tilpumu attiecību $V_{\\text{lode}} / V_{\\text{cil}}$.",
                "answer_latex": "$\\frac{2}{3}$",
                "solution_latex_ru": "1) Радиус цилиндра равен радиусу шара $R$, а высота цилиндра равна диаметру шара: $H = 2R$.\n2) Объем цилиндра: $V_{\\text{cil}} = \\pi R^2 H = \\pi R^2 (2R) = 2\\pi R^3$.\n3) Объем шара: $V_{\\text{lode}} = \\frac{4}{3}\\pi R^3$.\n4) Отношение: $\\frac{V_{\\text{lode}}}{V_{\\text{cil}}} = \\frac{\\frac{4}{3}\\pi R^3}{2\\pi R^3} = \\frac{4}{6} = \\frac{2}{3}$.",
                "solution_latex_lv": "1) Cilindra augstums ir $H = 2R$.\n2) Cilindra tilpums: $V_{\\text{cil}} = 2\\pi R^3$.\n3) Lodes tilpums: $V_{\\text{lode}} = \\frac{4}{3}\\pi R^3$.\n4) Attiecība: $\\frac{4/3}{2} = \\frac{2}{3}$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["merijumi"]
            }
        ]
    },
    {
        "slug": "augst-prizmas-piramidas-lodes-kombinacijas",
        "subject_slug": "geometry",
        "grade": 12,
        "position": 28,
        "title_ru": "Комбинации призмы, пирамиды и сферы",
        "title_lv": "Prizmas un lodes, piramīdas un lodes kombinācijas",
        "description_ru": "Центр описанной сферы многогранника, радиус сферы, описанной около куба и правильной пирамиды.",
        "description_lv": "Daudzskaldnim apvilktas sfēras centrs un rādiuss, kubam un piramīdai apvilkta lode.",
        "tags": ["merijumi", "trigonometrija"],
        "tasks": [
            {
                "title_ru": "Радиус сферы, описанной около куба",
                "title_lv": "Kubam apvilktas sfēras rādiusa aprēķināšana",
                "condition_latex_ru": "Ребро куба равно $4\\text{ см}$. Найдите радиус сферы, описанной около этого куба.",
                "condition_latex_lv": "Kuba šķautnes garums ir $4\\text{ cm}$. Aprēķiniet šim kubam apvilktās sfēras rādiusu.",
                "answer_latex": "$2\\sqrt{3}$",
                "solution_latex_ru": "1) Главная диагональ куба со стороной $a$ равна $D = a\\sqrt{3} = 4\\sqrt{3}\\text{ см}$.\n2) Диагональ куба является диаметром описанной сферы: $2R = D = 4\\sqrt{3}$.\n3) Радиус сферы: $R = \\frac{4\\sqrt{3}}{2} = 2\\sqrt{3}\\text{ см}$.",
                "solution_latex_lv": "1) Kuba telpiskā diagonāle ir $D = a\\sqrt{3} = 4\\sqrt{3}\\text{ cm}$.\n2) Sfēras rādiuss ir puse no kuba diagonāles: $R = \\frac{D}{2} = 2\\sqrt{3}\\text{ cm}$.",
                "difficulty": "Лёгкий",
                "grade": 12,
                "tags": ["merijumi"]
            }
        ]
    },

    # ── KOMBINATORIKA UN VARBŪTĪBA (29..35) ──────────────────────────────────────
    {
        "slug": "augst-kombinatorika-paskala-trijsturis",
        "subject_slug": "statistics",
        "grade": 12,
        "position": 29,
        "title_ru": "Комбинаторика II: Треугольник Паскаля",
        "title_lv": "Kombinatorika II: Paskāla trijstūris",
        "description_ru": "Свойства биномиальных коэффициентов $C_n^k = C_{n-1}^{k-1} + C_{n-1}^k$, симметрия $C_n^k = C_n^{n-k}$, сумма элементов строки $\\sum C_n^k = 2^n$.",
        "description_lv": "Binomiālo koeficientu īpašības, simetrija, rindas elementu summa $2^n$.",
        "tags": ["kombinatorika", "virknes"],
        "tasks": [
            {
                "title_ru": "Сумма биномиальных коэффициентов строки треугольника Паскаля",
                "title_lv": "Paskāla trijstūra rindas koeficientu summa",
                "condition_latex_ru": "Найдите сумму всех биномиальных коэффициентов в $8$-й строке треугольника Паскаля ($C_8^0 + C_8^1 + \\dots + C_8^8$).",
                "condition_latex_lv": "Aprēķiniet visu binomiālo koeficientu summu Paskāla trijstūra 8. rindā ($C_8^0 + C_8^1 + \\dots + C_8^8$).",
                "answer_latex": "$256$",
                "solution_latex_ru": "По свойству биномиальных коэффициентов сумма элементов $n$-й строки равна $2^n$. Для $n = 8$: $S = 2^8 = 256$.",
                "solution_latex_lv": "Paskāla trijstūra $n$-tās rindas koeficientu summa ir $2^n$. Ja $n = 8$, tad $S = 2^8 = 256$.",
                "difficulty": "Лёгкий",
                "grade": 12,
                "tags": ["kombinatorika"]
            }
        ]
    },
    {
        "slug": "augst-nutona-binoms",
        "subject_slug": "statistics",
        "grade": 12,
        "position": 30,
        "title_ru": "Бином Ньютона",
        "title_lv": "Ņūtona binoms",
        "description_ru": "Формула $(a + b)^n = \\sum_{k=0}^n C_n^k a^{n-k} b^k$, нахождение конкретного члена разложения $T_{k+1}$, свободный член.",
        "description_lv": "Binoma formula, konkrēta locekļa $T_{k+1}$ noteikšana, no mainīgā neatkarīgais loceklis.",
        "tags": ["kombinatorika", "algebriskie-parveidojumi"],
        "tasks": [
            {
                "title_ru": "Нахождение члена разложения бинома, не содержащего переменную",
                "title_lv": "No $x$ neatkarīgā locekļa atrašana binoma izvirzījumā",
                "condition_latex_ru": "В разложении бинома $(x^2 + \\frac{1}{x})^6$ найдите член, не содержащий переменную $x$ (свободный член).",
                "condition_latex_lv": "Binoma $(x^2 + \\frac{1}{x})^6$ izvirzījumā atrodiet locekli, kas nesatur mainīgo $x$.",
                "answer_latex": "$15$",
                "solution_latex_ru": "1) Общий член разложения: $T_{k+1} = C_6^k (x^2)^{6-k} (x^{-1})^k = C_6^k x^{12 - 2k} x^{-k} = C_6^k x^{12 - 3k}$.\n2) Член не содержит $x$, если показатель степени равен нулю: $12 - 3k = 0 \\implies 3k = 12 \\implies k = 4$.\n3) Вычисляем коэффициент: $T_5 = C_6^4 = C_6^2 = \\frac{6 \\cdot 5}{2 \\cdot 1} = 15$.",
                "solution_latex_lv": "1) Vispārīgais loceklis: $T_{k+1} = C_6^k (x^2)^{6-k} (x^{-1})^k = C_6^k x^{12 - 3k}$.\n2) Loceklis nesatur $x$, ja $12 - 3k = 0 \\implies k = 4$.\n3) $C_6^4 = C_6^2 = \\frac{6 \\cdot 5}{2} = 15$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["kombinatorika", "algebriskie-parveidojumi"]
            }
        ]
    },
    {
        "slug": "augst-matematiskas-logikas-elementi",
        "subject_slug": "statistics",
        "grade": 12,
        "position": 31,
        "title_ru": "Элементы математической логики",
        "title_lv": "Matemātiskās loģikas elementi",
        "description_ru": "Высказывания, конъюнкция, дизъюнкция, импликация $A \\implies B$, эквивалентность, кванторы $\\forall$ и $\\exists$, доказательство от противного.",
        "description_lv": "Izteikumi, loģiskās operācijas, implikācija, kvantori $\\forall$ un $\\exists$, pierādījums no pretējā.",
        "tags": ["pieradijumi"],
        "tasks": [
            {
                "title_ru": "Отрицание высказывания с квантором всеобщности",
                "title_lv": "Izteikuma ar kvantoru nolieguma veidošana",
                "condition_latex_ru": "Сформулируйте отрицание высказывания: «Для каждого действительного числа $x$ выполняется $x^2 > 0$». Истинно ли исходное высказывание или его отрицание?",
                "condition_latex_lv": "Uzrakstiet izteikuma «Katram reālam skaitlim $x$ izpildās $x^2 > 0$» noliegumu. Kurš no izteikumiem ir patiess?",
                "answer_latex": "Существует $x$, для которого $x^2 \\le 0$ (верно при $x = 0$)",
                "solution_latex_ru": "1) Исходное высказывание: $\\forall x \\in \\mathbb{R} : x^2 > 0$.\n2) Отрицание: $\\exists x \\in \\mathbb{R} : x^2 \\le 0$.\n3) При $x = 0$ имеем $0^2 = 0 \\le 0$, что истинно. Значит, исходное утверждение ложно, а его отрицание истинно.",
                "solution_latex_lv": "1) Izteikuma noliegums: $\\exists x \\in \\mathbb{R} : x^2 \\le 0$ («Eksistē tāds reāls skaitlis $x$, kuram $x^2 \\le 0$»).\n2) Pie $x = 0$ iegūst $0^2 \\le 0$, tātad noliegums ir patiess, bet sākotnējais apgalvojums ir aplams.",
                "difficulty": "Лёгкий",
                "grade": 12,
                "tags": ["pieradijumi"]
            }
        ]
    },
    {
        "slug": "augst-matematiskas-indukcijas-princips",
        "subject_slug": "statistics",
        "grade": 12,
        "position": 32,
        "title_ru": "Принцип математической индукции",
        "title_lv": "Matemātiskās indukcijas princips",
        "description_ru": "База индукции $n = 1$, индукционный переход $n = k \\implies n = k + 1$, доказательство формул сумм и делимости.",
        "description_lv": "Indukcijas bāze, indukcijas pāreja, vienādību un dalāmības pierādīšana.",
        "tags": ["pieradijumi", "virknes"],
        "tasks": [
            {
                "title_ru": "Доказательство делимости методом математической индукции",
                "title_lv": "Dalāmības pierādīšana ar matemātiskās indukcijas metodi",
                "condition_latex_ru": "Докажите, что для любого натурального числа $n$ выражение $4^n - 1$ делится на $3$. Каков индукционный шаг?",
                "condition_latex_lv": "Pierādiet, ka visiem naturāliem $n$ izteiksme $4^n - 1$ dalās ar $3$. Kāds ir indukcijas pārejas solis?",
                "answer_latex": "$4^{k+1} - 1 = 4(4^k - 1) + 3$",
                "solution_latex_ru": "1) База: при $n = 1$: $4^1 - 1 = 3$, делится на $3$.\n2) Предположение: пусть при $n = k$ выражение $4^k - 1 = 3m, m \\in \\mathbb{N}$.\n3) Шаг: при $n = k + 1$ имеем $4^{k+1} - 1 = 4 \\cdot 4^k - 1 = 4(4^k - 1) + 3 = 4 \\cdot 3m + 3 = 3(4m + 1)$, что кратно $3$.\nУтверждение доказано для всех $n \\in \\mathbb{N}$.",
                "solution_latex_lv": "1) Bāze: pie $n = 1$: $4^1 - 1 = 3$ dalās ar 3.\n2) Pieņēmums: $4^k - 1 = 3m$.\n3) Pāreja: $4^{k+1} - 1 = 4 \\cdot 4^k - 1 = 4(4^k - 1) + 3 = 4 \\cdot 3m + 3 = 3(4m + 1)$, kas dalās ar 3.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["pieradijumi"]
            }
        ]
    },
    {
        "slug": "augst-bernulli-formula-sadalijumi",
        "subject_slug": "statistics",
        "grade": 12,
        "position": 33,
        "title_ru": "Распределения случайной величины и формула Бернулли",
        "title_lv": "Gadījuma lieluma sadalījumi un Bernulli formula",
        "description_ru": "Схема независимых испытаний Бернулли $P_n(k) = C_n^k p^k (1-p)^{n-k}$, закон распределения дискретной случайной величины, математическое ожидание $E(X)$ и дисперсия $D(X)$.",
        "description_lv": "Bernulli formula, diskrēta gadījuma lieluma sadalījuma likums, matemātiskā cerība $E(X)$ un dispersija $D(X)$.",
        "tags": ["varbutiba", "statistika"],
        "tasks": [
            {
                "title_ru": "Вероятность ровно трех успехов по формуле Бернулли",
                "title_lv": "Varbūtības aprēķināšana pēc Bernulli formulas",
                "condition_latex_ru": "Вероятность попадания в цель при одном выстреле равна $p = 0{,}6$. Производится $5$ независимых выстрелов. Какова вероятность того, что цель будет поражена ровно $3$ раза?",
                "condition_latex_lv": "Trāpījuma varbūtība vienā šāvienā ir $p = 0{,}6$. Tiek izdarīti $5$ neatkarīgi šāvieni. Kāda ir varbūtība trāpīt mērķī tieši $3$ reizes?",
                "answer_latex": "$0{,}3456$",
                "solution_latex_ru": "1) По формуле Бернулли: $P_n(k) = C_n^k p^k q^{n-k}$, где $n = 5, k = 3, p = 0{,}6, q = 1 - 0{,}6 = 0{,}4$.\n2) Число сочетаний: $C_5^3 = \\frac{5 \\cdot 4}{2} = 10$.\n3) Вычисляем: $P_5(3) = 10 \\cdot (0{,}6)^3 \\cdot (0{,}4)^2 = 10 \\cdot 0{,}216 \\cdot 0{,}16 = 10 \\cdot 0{,}03456 = 0{,}3456$.",
                "solution_latex_lv": "1) Pēc Bernulli formulas: $P_5(3) = C_5^3 p^3 q^2$.\n2) $C_5^3 = 10$, $p^3 = 0{,}6^3 = 0{,}216$, $q^2 = 0{,}4^2 = 0{,}16$.\n3) $P_5(3) = 10 \\cdot 0{,}216 \\cdot 0{,}16 = 0{,}3456$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["varbutiba"]
            }
        ]
    },
    {
        "slug": "augst-pilnas-varbutibas-formula",
        "subject_slug": "statistics",
        "grade": 12,
        "position": 34,
        "title_ru": "Формула полной вероятности и формула Байеса",
        "title_lv": "Notikumu apvienojuma un pilnās varbūtības formula",
        "description_ru": "Полная группа гипотез $H_1, \\dots, H_n$, формула $P(A) = \\sum P(H_i) P(A|H_i)$, переоценка вероятностей по формуле Байеса.",
        "description_lv": "Pilnās varbūtības formula $P(A) = \\sum P(H_i) P(A|H_i)$, hipotēžu varbūtību pārrēķins ar Beijesa formulu.",
        "tags": ["varbutiba"],
        "tasks": [
            {
                "title_ru": "Вычисление вероятности брака по формуле полной вероятности",
                "title_lv": "Pilnās varbūtības formulas lietošana ražošanas brāķa uzdevumā",
                "condition_latex_ru": "На завод поступают детали с двух станков: $60\\%$ с первого и $40\\%$ со второго. Первый станок дает $2\\%$ брака, а второй — $5\\%$. Какова вероятность того, что случайно взятая деталь окажется бракованной?",
                "condition_latex_lv": "Detaļas tiek ražotas divos darbgaldos: $60\\%$ pirmajā un $40\\%$ otrajā. Pirmais darbgalds ražo $2\\%$ brāķa, bet otrais — $5\\%$. Kāda ir varbūtība, ka nejauši izvēlēta detaļa ir brāķis?",
                "answer_latex": "$0{,}032$",
                "solution_latex_ru": "1) Гипотезы: $H_1$ — деталь с 1-го станка ($P(H_1) = 0{,}6$), $H_2$ — со 2-го станка ($P(H_2) = 0{,}4$).\n2) Условные вероятности брака: $P(A|H_1) = 0{,}02$, $P(A|H_2) = 0{,}05$.\n3) По формуле полной вероятности: $P(A) = 0{,}6 \\cdot 0{,}02 + 0{,}4 \\cdot 0{,}05 = 0{,}012 + 0{,}020 = 0{,}032$ (или $3{,}2\\%$).",
                "solution_latex_lv": "1) Hipotēzes: $P(H_1) = 0{,}6$, $P(H_2) = 0{,}4$.\n2) Nosacītās varbūtības: $P(A|H_1) = 0{,}02$, $P(A|H_2) = 0{,}05$.\n3) Pēc pilnās varbūtības formulas: $P(A) = 0{,}6 \\cdot 0{,}02 + 0{,}4 \\cdot 0{,}05 = 0{,}032$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["varbutiba"]
            }
        ]
    },
    {
        "slug": "augst-statistika-secinajumi-populacija",
        "subject_slug": "statistics",
        "grade": 12,
        "position": 35,
        "title_ru": "Статистика II: Выводы о генеральной совокупности",
        "title_lv": "Statistika II: secinājumi par populāciju",
        "description_ru": "Доверительные интервалы для среднего значения, погрешность выборки, проверка статистических гипотез, нормальное распределение (правило трех сигм).",
        "description_lv": "Ticamības intervāli vidējai vērtībai, izlases kļūda, statistisko hipotēžu pārbaude, normālais sadalījums (3 sigmu likums).",
        "tags": ["statistika", "modelesana"],
        "tasks": [
            {
                "title_ru": "Применение правила трех сигм нормального распределения",
                "title_lv": "Normālā sadalījuma 3 sigmu likuma lietošana",
                "condition_latex_ru": "Рост призывников подчиняется нормальному распределению со средним $\\mu = 180\\text{ см}$ и стандартным отклонением $\\sigma = 6\\text{ см}$. Какой процент призывников имеет рост в интервале от $168\\text{ см}$ до $192\\text{ см}$?",
                "condition_latex_lv": "Auguma rādītāji atbilst normālajam sadalījumam ar vidējo $\\mu = 180\\text{ cm}$ un standartnovirzi $\\sigma = 6\\text{ cm}$. Cik procentu cilvēku augums ir robežās no $168\\text{ cm}$ līdz $192\\text{ cm}$?",
                "answer_latex": "$95{,}4$",
                "solution_latex_ru": "1) Границы интервала: $168 = 180 - 2 \\cdot 6 = \\mu - 2\\sigma$ и $192 = 180 + 2 \\cdot 6 = \\mu + 2\\sigma$.\n2) По правилу нормального распределения в интервал $[\\mu - 2\\sigma; \\mu + 2\\sigma]$ попадает примерно $95{,}4\\%$ всех значений генеральной совокупности.",
                "solution_latex_lv": "1) Robežas ir $\\mu - 2\\sigma = 180 - 12 = 168\\text{ cm}$ un $\\mu + 2\\sigma = 180 + 12 = 192\\text{ cm}$.\n2) Pēc normālā sadalījuma īpašības divu standartnoviržu intervālā $[\\mu - 2\\sigma; \\mu + 2\\sigma]$ atrodas aptuveni $95{,}4\\%$ no populācijas.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["statistika"]
            }
        ]
    },

    # ── MATEMĀTISKĀ ANALĪZE (36..45) ─────────────────────────────────────────────
    {
        "slug": "augst-funkcijas-robeza",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 36,
        "title_ru": "Предел функции",
        "title_lv": "Funkcijas robeža",
        "description_ru": "Понятие предела функции в точке $\\lim_{x \\to x_0} f(x)$, раскрытие неопределенностей $[0/0]$ и $[\\infty/\\infty]$, первый замечательный предел $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$.",
        "description_lv": "Funkcijas robeža punktā, nenoteiktību $[0/0]$ un $[\\infty/\\infty]$ novēršana, pirmā ievērojamā robeža $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$.",
        "tags": ["funkcijas", "virknes"],
        "tasks": [
            {
                "title_ru": "Раскрытие неопределенности [0/0] через домножение на сопряженное",
                "title_lv": "Nenoteiktības [0/0] novēršana, reizinot ar saistīto izteiksmi",
                "condition_latex_ru": "Вычислите предел функции: $\\lim_{x \\to 0} \\frac{\\sqrt{x + 4} - 2}{x}$.",
                "condition_latex_lv": "Aprēķiniet funkcijas robežu: $\\lim_{x \\to 0} \\frac{\\sqrt{x + 4} - 2}{x}$.",
                "answer_latex": "$\\frac{1}{4}$",
                "solution_latex_ru": "1) Подстановка $x = 0$ дает неопределенность $[\\frac{0}{0}]$.\n2) Умножаем числитель и знаменатель на сопряженное выражение $(\\sqrt{x + 4} + 2)$:\n$\\lim_{x \\to 0} \\frac{(\\sqrt{x + 4} - 2)(\\sqrt{x + 4} + 2)}{x(\\sqrt{x + 4} + 2)} = \\lim_{x \\to 0} \\frac{(x + 4) - 4}{x(\\sqrt{x + 4} + 2)} = \\lim_{x \\to 0} \\frac{x}{x(\\sqrt{x + 4} + 2)}$.\n3) Сокращаем на $x \\ne 0$: $\\lim_{x \\to 0} \\frac{1}{\\sqrt{x + 4} + 2} = \\frac{1}{\\sqrt{4} + 2} = \\frac{1}{4}$.",
                "solution_latex_lv": "1) Ievietojot $x = 0$, iegūst nenoteiktību $[0/0]$.\n2) Reizina ar saistīto izteiksmi $(\\sqrt{x + 4} + 2)$:\n$\\frac{(x + 4) - 4}{x(\\sqrt{x + 4} + 2)} = \\frac{1}{\\sqrt{x + 4} + 2}$.\n3) Robeža ir $\\frac{1}{2 + 2} = \\frac{1}{4}$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["matematiska-analize"]
            }
        ]
    },
    {
        "slug": "augst-atvasinajuma-definicija-geometriska-jega",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 37,
        "title_ru": "Определение производной и её геометрический смысл",
        "title_lv": "Atvasinājuma definīcija un tā ģeometriskā jēga",
        "description_ru": "Производная как предел отношения приращений $f'(x) = \\lim_{\\Delta x \\to 0} \\frac{\\Delta y}{\\Delta x}$, угловой коэффициент касательной $k = f'(x_0) = \\tan \\alpha$, механический смысл (мгновенная скорость).",
        "description_lv": "Atvasinājuma definīcija, pieskares virziena koeficients $k = f'(x_0) = \\tan \\alpha$, momentānais ātrums.",
        "tags": ["funkcijas", "grafiki"],
        "tasks": [
            {
                "title_ru": "Мгновенная скорость движения как значение производной",
                "title_lv": "Momentānā ātruma aprēķināšana kā atvasinājums",
                "condition_latex_ru": "Точка движется по прямой согласно закону $s(t) = 3t^2 - 4t + 1$ ($s$ в метрах, $t$ в секундах). Найдите мгновенную скорость точки в момент времени $t = 3\\text{ с}$.",
                "condition_latex_lv": "Materiāls punkts pārvietojas taisnā virzienā pēc likuma $s(t) = 3t^2 - 4t + 1$ ($s$ metros, $t$ sekundēs). Aprēķiniet punkta momentāno ātrumu laika momentā $t = 3\\text{ s}$.",
                "answer_latex": "$14$",
                "solution_latex_ru": "1) Мгновенная скорость — это производная пути по времени: $v(t) = s'(t)$.\n2) Находим производную: $v(t) = (3t^2 - 4t + 1)' = 6t - 4$.\n3) Подставляем $t = 3$: $v(3) = 6(3) - 4 = 18 - 4 = 14\\text{ м/с}$.",
                "solution_latex_lv": "1) Ātrums ir ceļa atvasinājums pēc laika: $v(t) = s'(t) = 6t - 4$.\n2) Pie $t = 3\\text{ s}$: $v(3) = 6 \\cdot 3 - 4 = 14\\text{ m/s}$.",
                "difficulty": "Лёгкий",
                "grade": 12,
                "tags": ["matematiska-analize", "modelesana"]
            }
        ]
    },
    {
        "slug": "augst-diferencesanas-likumi-formulas",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 38,
        "title_ru": "Правила и формулы дифференцирования",
        "title_lv": "Diferencēšanas likumi un formulas",
        "description_ru": "Таблица производных ($x^n, e^x, \\ln x, \\sin x, \\cos x$), производная суммы, произведения $(uv)'$, частного $(u/v)'$, производная сложной функции $f(g(x))'$.",
        "description_lv": "Atvasinājumu tabula, reizinājuma un dalījuma diferencēšana, saliktas funkcijas atvasinājums.",
        "tags": ["algebriskie-parveidojumi"],
        "tasks": [
            {
                "title_ru": "Дифференцирование сложной тригонометрической функции",
                "title_lv": "Saliktas trigonometriskas funkcijas atvasināšana",
                "condition_latex_ru": "Найдите производную функции $f(x) = \\sin(3x^2 - 1)$.",
                "condition_latex_lv": "Atrodiet funkcijas $f(x) = \\sin(3x^2 - 1)$ atvasinājumu $f'(x)$.",
                "answer_latex": "$6x\\cos(3x^2 - 1)$",
                "solution_latex_ru": "1) По правилу дифференцирования сложной функции: $(f(g(x)))' = f'(g(x)) \\cdot g'(x)$.\n2) Внешняя функция: $(\\sin u)' = \\cos u$, где $u = 3x^2 - 1$.\n3) Внутренняя функция: $u' = (3x^2 - 1)' = 6x$.\n4) Итого: $f'(x) = \\cos(3x^2 - 1) \\cdot 6x = 6x \\cos(3x^2 - 1)$.",
                "solution_latex_lv": "1) Pēc saliktas funkcijas atvasināšanas likuma: $(f(g(x)))' = f'(g(x)) \\cdot g'(x)$.\n2) Ārējā funkcija: $(\\sin u)' = \\cos u$.\n3) Iekšējās funkcijas atvasinājums: $(3x^2 - 1)' = 6x$.\n4) $f'(x) = 6x \\cos(3x^2 - 1)$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["algebriskie-parveidojumi", "matematiska-analize"]
            }
        ]
    },
    {
        "slug": "augst-pieskare-grafikam",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 39,
        "title_ru": "Касательная к графику функции",
        "title_lv": "Pieskare funkcijas grafikam",
        "description_ru": "Уравнение касательной $y = f(x_0) + f'(x_0)(x - x_0)$, параллельность касательной заданной прямой, нахождение точек касания.",
        "description_lv": "Pieskares vienādojums $y = f(x_0) + f'(x_0)(x - x_0)$, pieskares paralelitāte dotajai taisnei.",
        "tags": ["grafiki", "koordinatu-metode"],
        "tasks": [
            {
                "title_ru": "Составление уравнения касательной к параболе",
                "title_lv": "Pieskares vienādojuma sastādīšana parabolas grafikam",
                "condition_latex_ru": "Составьте уравнение касательной к графику функции $f(x) = x^2 - 3x + 2$ в точке с абсциссой $x_0 = 2$.",
                "condition_latex_lv": "Uzrakstiet pieskares vienādojumu funkcijas $f(x) = x^2 - 3x + 2$ grafikam punktā ar abscisu $x_0 = 2$.",
                "answer_latex": "$y = x - 2$",
                "solution_latex_ru": "1) Значение функции в точке касания: $f(2) = 2^2 - 3(2) + 2 = 4 - 6 + 2 = 0$.\n2) Находим производную: $f'(x) = 2x - 3$.\n3) Угловой коэффициент касательной: $k = f'(2) = 2(2) - 3 = 1$.\n4) Уравнение касательной: $y = f(x_0) + f'(x_0)(x - x_0) = 0 + 1(x - 2) = x - 2$.\nОтвет: $y = x - 2$.",
                "solution_latex_lv": "1) Funkcijas vērtība: $f(2) = 4 - 6 + 2 = 0$.\n2) Atvasinājums: $f'(x) = 2x - 3$.\n3) Virziena koeficients: $k = f'(2) = 4 - 3 = 1$.\n4) Pieskares vienādojums: $y - 0 = 1(x - 2) \\implies y = x - 2$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["matematiska-analize", "grafiki"]
            }
        ]
    },
    {
        "slug": "augst-funkciju-petisana-ar-atvasinajumu",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 40,
        "title_ru": "Исследование функций с помощью производной",
        "title_lv": "Funkciju pētīšana ar atvasinājumu: monotonitāte un ekstrēmi",
        "description_ru": "Критические (стационарные) точки $f'(x) = 0$, достаточные признаки максимума и минимума (смена знака производной), выпуклость и точки перегиба $f''(x) = 0$.",
        "description_lv": "Kritiskie punkti $f'(x) = 0$, ekstrēmu noteikšana, ieliekums, izliekums un pārliekuma punkti $f''(x) = 0$.",
        "tags": ["funkcijas", "grafiki"],
        "tasks": [
            {
                "title_ru": "Нахождение точек локального экстремума функции 3-й степени",
                "title_lv": "Funkcijas lokālo ekstrēmu punktu atrašana",
                "condition_latex_ru": "Найдите точки локального минимума и максимума функции $f(x) = x^3 - 3x^2 - 9x + 5$.",
                "condition_latex_lv": "Atrodiet funkcijas $f(x) = x^3 - 3x^2 - 9x + 5$ lokālā maksimuma un minimuma punktus.",
                "answer_latex": "$x_{\\max} = -1$, $x_{\\min} = 3$",
                "solution_latex_ru": "1) Находим производную: $f'(x) = 3x^2 - 6x - 9$.\n2) Приравниваем к нулю: $3(x^2 - 2x - 3) = 0 \\implies 3(x - 3)(x + 1) = 0$.\nСтационарные точки: $x_1 = -1, x_2 = 3$.\n3) Знаки производной:\n- при $x < -1$: $f'(x) > 0$ (функция возрастает);\n- при $-1 < x < 3$: $f'(x) < 0$ (функция убывает);\n- при $x > 3$: $f'(x) > 0$ (функция возрастает).\n4) В точке $x = -1$ знак меняется с $+$ на $-$, это точка максимума ($x_{\\max} = -1$).\nВ точке $x = 3$ знак меняется с $-$ на $+$, это точка минимума ($x_{\\min} = 3$).",
                "solution_latex_lv": "1) Atvasinājums: $f'(x) = 3x^2 - 6x - 9 = 3(x - 3)(x + 1)$.\n2) Kritiskie punkti ir $x = -1$ un $x = 3$.\n3) Zīmju maiņa:\n- punktā $x = -1$ atvasinājums maina zīmi no $+$ uz $-$, tātad tas ir maksimuma punkts ($x_{\\max} = -1$);\n- punktā $x = 3$ zīme mainās no $-$ uz $+$, tātad tas ir minimuma punkts ($x_{\\min} = 3$).",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["matematiska-analize", "funkcijas"]
            }
        ]
    },
    {
        "slug": "augst-lietiski-optimizacijas-uzdevumi",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 41,
        "title_ru": "Прикладные задачи на оптимизацию",
        "title_lv": "Lietišķi optimizācijas uzdevumi",
        "description_ru": "Нахождение наименьшего и наибольшего значения функции на отрезке, составление целевой функции, оптимизация расхода материалов и прибыли.",
        "description_lv": "Lielākā un mazākā vērtība slēgtā intervālā, mērķfunkcijas sastādīšana, izmaksu un materiālu optimizācija.",
        "tags": ["modelesana", "teksta-uzdevumi"],
        "tasks": [
            {
                "title_ru": "Оптимизация объема открытой коробки из листа картона",
                "title_lv": "Kastes tilpuma maksimizēšana no kartona loksnes",
                "condition_latex_ru": "Из квадратного листа картона со стороной $12\\text{ см}$ изготавливают открытую сверху коробку, вырезая по углам равные квадраты со стороной $x$ и загибая края. При каком значении $x$ объем коробки будет наибольшим?",
                "condition_latex_lv": "No kvadrātveida kartona loksnes ar malu $12\\text{ cm}$ izgatavo vaļēju kārbu, stūros izgriežot vienādus kvadrātus ar malu $x$. Kādam $x$ kārbas tilpums būs maksimāls?",
                "answer_latex": "$2$",
                "solution_latex_ru": "1) Стороны дна коробки равны $12 - 2x$, высота равна $x$ ($0 < x < 6$).\n2) Объем коробки: $V(x) = x(12 - 2x)^2 = x(144 - 48x + 4x^2) = 4x^3 - 48x^2 + 144x$.\n3) Производная объема: $V'(x) = 12x^2 - 96x + 144 = 12(x^2 - 8x + 12) = 12(x - 2)(x - 6)$.\n4) В интервале $(0; 6)$ стационарная точка $x = 2$.\n5) При переходе через $x = 2$ производная меняет знак с $+$ на $-$, следовательно, при $x = 2\\text{ см}$ объем максимален ($V_{\\max} = 2 \\cdot 8^2 = 128\\text{ см}^3$).",
                "solution_latex_lv": "1) Tilpuma funkcija: $V(x) = x(12 - 2x)^2 = 4x^3 - 48x^2 + 144x$, kur $x \\in (0; 6)$.\n2) Atvasinājums: $V'(x) = 12(x^2 - 8x + 12) = 12(x - 2)(x - 6)$.\n3) Intervālā $(0; 6)$ atrodas punkts $x = 2$, kurā ir funkcijas maksimums.\nAtbilde: $x = 2\\text{ cm}$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["modelesana", "matematiska-analize"]
            }
        ]
    },
    {
        "slug": "augst-primitiva-funkcija-integraliss",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 42,
        "title_ru": "Первообразная и неопределенный интеграл",
        "title_lv": "Primitīvā funkcija un nenoteiktais integrālis",
        "description_ru": "Определение первообразной $F'(x) = f(x)$, неопределенный интеграл $\\int f(x)dx = F(x) + C$, таблица интегралов, метод замены переменной.",
        "description_lv": "Primitīvā funkcija, nenoteiktā integrāļa definīcija, integrāļu tabula, substitūcijas metode.",
        "tags": ["algebriskie-parveidojumi"],
        "tasks": [
            {
                "title_ru": "Нахождение первообразной, проходящей через заданную точку",
                "title_lv": "Primitīvās funkcijas atrašana caur doto punktu",
                "condition_latex_ru": "Для функции $f(x) = 3x^2 - 4x + 1$ найдите первообразную $F(x)$, график которой проходит через точку $M(1; 5)$.",
                "condition_latex_lv": "Funkcijai $f(x) = 3x^2 - 4x + 1$ atrodiet primitīvo funkciju $F(x)$, kuras grafiks iet caur punktu $M(1; 5)$.",
                "answer_latex": "$F(x) = x^3 - 2x^2 + x + 5$",
                "solution_latex_ru": "1) Общий вид первообразной:\n$F(x) = \\int (3x^2 - 4x + 1)dx = x^3 - 2x^2 + x + C$.\n2) Подставляем координаты точки $M(1; 5)$:\n$5 = 1^3 - 2(1)^2 + 1 + C \\implies 5 = 1 - 2 + 1 + C \\implies 5 = 0 + C \\implies C = 5$.\n3) Искомая первообразная: $F(x) = x^3 - 2x^2 + x + 5$.",
                "solution_latex_lv": "1) Vispārīgā primitīvā funkcija: $F(x) = x^3 - 2x^2 + x + C$.\n2) Ievieto punkta $M(1; 5)$ koordinātas: $5 = 1 - 2 + 1 + C \\implies C = 5$.\n3) $F(x) = x^3 - 2x^2 + x + 5$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["matematiska-analize"]
            }
        ]
    },
    {
        "slug": "augst-noteiktais-integralis-nutona-leibnica",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 43,
        "title_ru": "Определенный интеграл и формула Ньютона–Лейбница",
        "title_lv": "Noteiktais integrālis un Ņūtona–Leibnica formula",
        "description_ru": "Геометрический смысл определенного интеграла, формула $\\int_a^b f(x)dx = F(b) - F(a)$, свойства определенного интеграла.",
        "description_lv": "Noteiktā integrāļa ģeometriskā jēga, Ņūtona–Leibnica formula $\\int_a^b f(x)dx = F(b) - F(a)$, īpašības.",
        "tags": ["merijumi"],
        "tasks": [
            {
                "title_ru": "Вычисление определенного интеграла по формуле Ньютона–Лейбница",
                "title_lv": "Noteiktā integrāļa aprēķināšana ar Ņūtona–Leibnica formulu",
                "condition_latex_ru": "Вычислите определенный интеграл: $\\int_1^3 (3x^2 - 2x) dx$.",
                "condition_latex_lv": "Aprēķiniet noteikto integrāli: $\\int_1^3 (3x^2 - 2x) dx$.",
                "answer_latex": "$18$",
                "solution_latex_ru": "1) Находим первообразную: $F(x) = x^3 - x^2$.\n2) Применяем формулу Ньютона–Лейбница:\n$\\int_1^3 (3x^2 - 2x) dx = [x^3 - x^2]_1^3 = (3^3 - 3^2) - (1^3 - 1^2) = (27 - 9) - (1 - 1) = 18 - 0 = 18$.",
                "solution_latex_lv": "1) Primitīvā funkcija: $F(x) = x^3 - x^2$.\n2) Pēc Ņūtona–Leibnica formulas: $[x^3 - x^2]_1^3 = (27 - 9) - (1 - 1) = 18$.",
                "difficulty": "Лёгкий",
                "grade": 12,
                "tags": ["matematiska-analize"]
            }
        ]
    },
    {
        "slug": "augst-laukumi-tilpumi-integralis",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 44,
        "title_ru": "Вычисление площадей и объемов с помощью интеграла",
        "title_lv": "Laukumu un tilpumu aprēķināšana ar integrāli",
        "description_ru": "Площадь криволинейной трапеции $S = \\int_a^b (f_1(x) - f_2(x))dx$, объем тела вращения вокруг оси $Ox$: $V = \\pi \\int_a^b f(x)^2 dx$.",
        "description_lv": "Liekliniju trapeces laukums, rotācijas ķermeņa tilpums $V = \\pi \\int_a^b f(x)^2 dx$.",
        "tags": ["merijumi", "stereometrija"],
        "tasks": [
            {
                "title_ru": "Площадь фигуры, ограниченной параболой и прямой",
                "title_lv": "Ar parabolu un taisni ierobežotas figūras laukums",
                "condition_latex_ru": "Вычислите площадь фигуры, ограниченной линиями $y = 4 - x^2$ и $y = 0$.",
                "condition_latex_lv": "Aprēķiniet laukumu plaknes figūrai, ko ierobežo līnijas $y = 4 - x^2$ un $y = 0$.",
                "answer_latex": "$\\frac{32}{3}$",
                "solution_latex_ru": "1) Точки пересечения параболы с осью $Ox$: $4 - x^2 = 0 \\implies x_1 = -2, x_2 = 2$.\n2) Площадь фигуры: $S = \\int_{-2}^2 (4 - x^2) dx$.\n3) Из-за четности функции: $S = 2 \\int_0^2 (4 - x^2) dx = 2 [4x - \\frac{x^3}{3}]_0^2 = 2 (8 - \\frac{8}{3}) = 2 \\cdot \\frac{16}{3} = \\frac{32}{3} = 10\\frac{2}{3}$.",
                "solution_latex_lv": "1) Krustpunkti ar $Ox$ asi: $4 - x^2 = 0 \\implies x = \\pm 2$.\n2) Laukums: $S = \\int_{-2}^2 (4 - x^2) dx = [4x - \\frac{x^3}{3}]_{-2}^2 = (8 - 8/3) - (-8 + 8/3) = 16 - 16/3 = \\frac{32}{3}$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["merijumi", "matematiska-analize"]
            }
        ]
    },
    {
        "slug": "augst-integrala-lietojums-fizika",
        "subject_slug": "algebra",
        "grade": 12,
        "position": 45,
        "title_ru": "Применение интеграла в физике",
        "title_lv": "Integrāļa lietojums fizikā",
        "description_ru": "Путь по переменной скорости $s = \\int_{t_1}^{t_2} v(t)dt$, работа переменной силы $A = \\int F(x)dx$ (растяжение пружины по закону Гука).",
        "description_lv": "Noietā ceļa aprēķināšana ar mainīgu ātrumu, spēka padarītais darbs (Huka likums).",
        "tags": ["modelesana", "teksta-uzdevumi"],
        "tasks": [
            {
                "title_ru": "Работа переменной силы при растяжении пружины",
                "title_lv": "Mainīga spēka padarītā darba aprēķināšana ar integrāli",
                "condition_latex_ru": "Сила упругости пружины подчиняется закону Гука $F(x) = kx$, где жесткость $k = 200\\text{ Н/м}$. Какую работу необходимо совершить, чтобы растянуть пружину на $0{,}1\\text{ м}$ из состояния покоя?",
                "condition_latex_lv": "Atsperes elastības spēks atbilst Huka likumam $F(x) = kx$, kur $k = 200\\text{ N/m}$. Kāds darbs jāpadara, lai izstieptu atsperi par $0{,}1\\text{ m}$ no miera stāvokļa?",
                "answer_latex": "$1$",
                "solution_latex_ru": "1) Работа силы равна определенному интегралу: $A = \\int_0^{0{,}1} F(x) dx = \\int_0^{0{,}1} 200x dx$.\n2) Вычисляем: $A = [100 x^2]_0^{0{,}1} = 100 \\cdot (0{,}1)^2 = 100 \\cdot 0{,}01 = 1\\text{ Дж}$.",
                "solution_latex_lv": "1) Darba formula: $A = \\int_0^{0{,}1} 200x dx = [100x^2]_0^{0{,}1}$.\n2) $A = 100 \\cdot 0{,}01 = 1\\text{ J}$.",
                "difficulty": "Средний",
                "grade": 12,
                "tags": ["modelesana", "matematiska-analize"]
            }
        ]
    }
]

def main():
    # 1. Write JSON
    json_path = os.path.join('supabase', 'augstakais_topics_tasks.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(topics_data, f, ensure_ascii=False, indent=2)
    print(f'JSON written to {json_path} ({len(topics_data)} topics).')

    # 2. Generate SQL
    sql_lines = [
        "-- ============================================================================",
        "-- Seed: Каталог тем и задач курса Matemātika II (Augstākais līmenis, 12 klase)",
        "-- Соответствует официальной таксономии Skola2030 (все 45 тем)",
        "-- Запуск в Supabase: SQL Editor -> New query -> Paste & Run",
        "-- ============================================================================",
        "",
        "-- 1. Базовые разделы (Subjects), если ещё не созданы",
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
        "-- 2. Темы курса Augstākais līmenis (45 тем)"
    ]

    for t in topics_data:
        t_ru = t['title_ru'].replace("'", "''")
        t_lv = t['title_lv'].replace("'", "''")
        d_ru = t['description_ru'].replace("'", "''")
        d_lv = t['description_lv'].replace("'", "''")
        slug = t['slug']
        subj = t['subject_slug']
        pos = t['position']
        sql = f"""insert into public.topics (title, title_lv, slug, subject_id, grade, position, description, description_lv)
values ('{t_ru}', '{t_lv}', '{slug}', (select id from public.subjects where slug = '{subj}'), 12, {pos}, '{d_ru}', '{d_lv}')
on conflict (slug) do update set
  title = excluded.title,
  title_lv = excluded.title_lv,
  description = excluded.description,
  description_lv = excluded.description_lv,
  position = excluded.position;
"""
        sql_lines.append(sql)

    # Insert tasks and tags
    sql_lines.append('-- 3. Вставка типовых задач высшего уровня и привязка кросс-тегов')
    task_idx = 1
    total_tasks = 0
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
    values (v_topic_id, 12, '{task_title_ru}', '{task_title_lv}', '{cond_ru}', '{cond_lv}', '{sol_ru}', '{sol_lv}', '{ans}', '{diff}', {task_idx}, true)
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
            total_tasks += 1

    sql_path = os.path.join('supabase', 'seed_augstakais.sql')
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    print(f'SQL written to {sql_path} ({total_tasks} tasks).')

if __name__ == '__main__':
    main()
