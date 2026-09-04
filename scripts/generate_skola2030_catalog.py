import os
import re
import json
import sys

# Ensure UTF-8 output
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def parse_doc(filename):
    with open(filename, encoding='utf-8') as f:
        text = f.read()
    grades = {}
    current_grade = None
    current_theme = None
    for line in text.split('\n'):
        line = line.strip()
        if line.startswith('## '):
            current_grade = line[3:].strip()
            grades[current_grade] = {}
        elif line.startswith('### ') and current_grade:
            current_theme = line[4:].strip()
            grades[current_grade][current_theme] = []
        elif line.startswith('- ') and current_grade and current_theme:
            grades[current_grade][current_theme].append(line[2:].strip())
    return grades

def get_grade_num(grade_name):
    if '1 klase' in grade_name or '1 класс' in grade_name: return 1
    if '2 klase' in grade_name or '2 класс' in grade_name: return 2
    if '3 klase' in grade_name or '3 класс' in grade_name: return 3
    if '4 klase' in grade_name or '4 класс' in grade_name: return 4
    if '5 klase' in grade_name or '5 класс' in grade_name: return 5
    if '6 klase' in grade_name or '6 класс' in grade_name: return 6
    if '7 klase' in grade_name or '7 класс' in grade_name: return 7
    if '8 klase' in grade_name or '8 класс' in grade_name: return 8
    if '9 klase' in grade_name or '9 класс' in grade_name: return 9
    if 'Matemātika II' in grade_name or 'Математика II' in grade_name: return 12
    if 'Matemātika I' in grade_name or 'Математика I' in grade_name: return 11
    m = re.search(r'\d+', grade_name)
    return int(m.group(0)) if m else 10

def classify_subject(title_ru, subtopics_ru):
    text = (title_ru + ' ' + ' '.join(subtopics_ru)).lower()
    # Statistics & probability
    if any(k in text for k in ['статистик', 'вероятност', 'комбинаторик', 'выборк', 'данны', 'диаграмм', 'множеств', 'бернулли']):
        return 'statistics'
    # Exclude geometric progression from geometry
    if 'геометрическая прогрессия' in text and not any(k in text for k in ['треугольник', 'стереометр', 'тела вращения', 'многогранник']):
        return 'algebra'
    # Exclude sequences and functions
    if 'последовательности и показательная' in text:
        return 'algebra'
    # Geometry & measurements
    if any(k in text for k in ['фигур', 'треугольник', 'четырехугольник', 'окружност', 'геометр', 'вектор', 'пространственн', 'призм', 'цилиндр', 'конус', 'пирамид', 'шар', 'стереометр', 'планиметр', 'угол', 'трапеци', 'параллелограмм', 'ромб', 'пифагор', 'симметри', 'тела вращения', 'многогранник', 'синуса и косинуса']):
        return 'geometry'
    # Integral / analysis
    if 'интеграл' in text:
        return 'algebra'
    return 'algebra'

def make_slug(grade, idx, title_ru):
    translit_map = {
        'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y',
        'к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f',
        'х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
        'ā':'a','č':'c','ē':'e','ģ':'g','ī':'i','ķ':'k','ļ':'l','ņ':'n','š':'s','ū':'u','ž':'z'
    }
    slug = title_ru.lower()
    res = []
    for ch in slug:
        if ch in translit_map:
            res.append(translit_map[ch])
        elif ch.isalnum():
            res.append(ch)
        elif ch in [' ', '-', '_']:
            res.append('-')
    raw = ''.join(res)
    raw = re.sub(r'-+', '-', raw).strip('-')
    parts = [p for p in raw.split('-') if p not in ['kak', 'chto', 'kakovy', 'gde', 'zachem']][:4]
    short = '-'.join(parts) if parts else 'topic'
    return f"skola2030-g{grade}-{idx+1}-{short}"

# Dictionary of English titles for all 81 themes
EN_TITLES = {
    # Grade 1
    "Как рассказать и показать: сколько, где, какой": "Representing Quantities, Positions and Shapes",
    "Сколько всего, сколько осталось": "Addition and Subtraction within 10",
    "Как измерять длины и получать симметричные фигуры": "Measuring Lengths and Symmetrical Figures",
    "Как записывают и сравнивают числа больше 10": "Reading, Writing and Comparing Numbers 10–100",
    "Как складывают и вычитают числа больше 10": "Addition and Subtraction within 20",
    "Что значит «на столько больше», «на столько меньше»": "Comparing Quantities and Difference Word Problems",
    "Где мы встречаемся с большими числами": "Large Numbers, Money and Measurements in Daily Life",
    # Grade 2
    "Как складывают и вычитают двузначные числа": "Adding and Subtracting Two-Digit Numbers",
    "Как умножают и делят на 3, 4 и 5": "Multiplication and Division by 3, 4 and 5",
    # Grade 3
    "Как умножают и делят на 6, 7, 8, 9 и 10": "Multiplication and Division by 6, 7, 8, 9 and 10",
    "Как используют все действия": "Using All Four Operations with Numbers up to 100",
    "Как составляют план местности": "Multiplication/Division by Tens and Room Floor Plans",
    "Что значит часть от целого": "Fractions and Parts of a Whole",
    "Как создают пространственные модели": "Spatial Figures and 3D Net Models",
    # Grade 4
    "Как складывают и вычитают многозначные числа": "Adding and Subtracting Multi-Digit Numbers",
    "Как многозначные числа умножают и делят на однозначное число": "Multiplying and Dividing Multi-Digit Numbers by Single-Digit",
    "Как многозначные числа умножают и делят на двузначное число": "Multiplying and Dividing by Two-Digit Numbers",
    "Как сравнивают, складывают и вычитают дроби": "Comparing, Adding and Subtracting Common Fractions",
    "Что значит часть от целого (4 класс)": "Parts of a Whole: Fractions of Quantities",
    "Что общего в математическом описании покупок и движения": "Word Problems: Speed, Time, Distance and Cost",
    # Grade 5
    "Как по-разному записывают натуральные числа": "Natural Number Notation, Decimal Place Value and Rounding",
    "Как используют разложение числа на множители": "Prime Factorization, Powers and Divisibility",
    "Как объясняют и применяют основное свойство дроби": "Fundamental Property of Fractions and Unlike Denominators",
    "Как одно число выражают как часть другого числа": "Expressing Quantities as Fractions and Division",
    "Как складывают и вычитают смешанные числа": "Adding and Subtracting Mixed Numbers",
    "Как определяют неизвестные величины фигур": "Properties of Polygons, Angles and Circles",
    "Как используют десятичные дроби и проценты": "Decimal Fractions, Percentages and Pie Charts",
    # Grade 6
    "Как совокупность делят в определенном отношении": "Ratios, Proportions and Scale",
    "Как умножают и делят обыкновенные дроби": "Multiplying and Dividing Fractions and Mixed Numbers",
    "Как изображают и характеризуют пространственные тела": "Surface Area and Volume of 3D Solids",
    "Зачем нужны числа, которые меньше нуля": "Negative Numbers and the Number Line",
    "Что значит прибавить к числу отрицательное число или вычесть отрицательное число": "Adding and Subtracting Negative Numbers and Fractions",
    # Grade 7
    "Как определяют все элементы множества, вычисляют вероятность события": "Sets, Venn Diagrams and Classical Probability",
    "Как определяют геометрические фигуры": "Lines, Segments, Angles and Congruent Figures",
    "Как характеризуют зависимость между переменными величинами": "Direct and Inverse Proportions",
    "Как записывают и исследуют функции, график которых — прямая": "Linear Functions and Their Graphs",
    "Как характеризуют треугольник, используя его элементы": "Triangle Elements, Bisectors and Congruence Theorems",
    "Каковы зависимости между величинами в треугольнике": "Relationships Between Sides and Angles in Triangles",
    "Что значит преобразовать выражение с переменной величиной": "Algebraic Expressions and Equivalent Transformations",
    "Каковы приемы определения неизвестного, линейное уравнение": "Linear Equations in One Variable and Proportions",
    "Как сравнивают выражения, где есть переменная, неравенства": "Linear Inequalities and Applications",
    # Grade 8
    "Как математически описывают и анализируют данные, статистика": "Data Collection, Frequency, Mean, Median, Mode and Range",
    "Как объясняют и применяют степень с целым показателем": "Integer Exponents and Scientific Notation",
    "Как поступают, если число нельзя записать в виде дроби, квадратный корень": "Square Roots, Radicals and Real Numbers",
    "Как вычисляют площадь для любого треугольника, круга, призмы, цилиндра": "Areas of Triangles, Circles, Prisms and Cylinders",
    "Что общего у четырехугольников, противоположные стороны которых попарно параллельны": "Parallelograms, Rhombi, Rectangles and Properties",
    "Как объясняют и выполняют действия с выражениями": "Polynomials: Monomials, Operations and Factorization",
    "Как различные функции используют для математического моделирования": "Quadratic Function y=kx² and Inverse Variation y=k/x",
    "Как определяют неизвестную сторону прямоугольного треугольника, теорема Пифагора": "The Pythagorean Theorem and Right Triangle Applications",
    # Grade 9
    "Как определяют и характеризуют подобные треугольники": "Similar Triangles, Thales's Theorem and Ratios",
    "Что общего у четырехугольников, у которых ровно две стороны параллельны, трапеция": "Trapezoids, Midsegments and Trapezoid Area",
    "Как в вычислениях используют отношение двух сторон прямоугольного треугольника": "Trigonometric Ratios: Sine, Cosine and Tangent",
    "Как используют разложение выражений на множители": "Factoring Polynomials: Difference of Squares and Perfect Squares",
    "Как объясняют и используют формулы при работе с квадратным уравнением, квадратичной функцией": "Quadratic Equations, Discriminant and Vieta's Formulas",
    "Как описывают ситуации с двумя неизвестными величинами": "Systems of Two Equations in Two Variables",
    "Как числовую последовательность записывают формулой": "Arithmetic Progressions and Formulas",
    "Как описывают взаимное расположение окружности и многоугольника": "Inscribed and Circumscribed Circles and Polygons",
    # Matemātika I (Grades 10–11)
    "Векторы и движение": "Vectors on the Plane and in Space, Vector Operations",
    "Уравнение линии": "Equation of a Line, Circles and Perpendicular Lines",
    "Комбинаторика и вероятность I": "Combinatorics, Sets and Conditional Probability I",
    "Статистика I": "Descriptive Statistics, Measures of Spread and Sampling I",
    "Дробно-рациональная функция и алгебраические дроби": "Rational Expressions and Rational Functions",
    "Дробно-рациональные уравнения и неравенства": "Rational Equations, Inequalities and Sign Intervals",
    "Функции синуса и косинуса": "Sine and Cosine of an Angle, Laws of Sines and Cosines",
    "Тригонометрические выражения и уравнения": "Trigonometric Identities and Elementary Equations",
    "Степень с рациональным показателем, геометрическая прогрессия": "Rational Exponents, Roots and Geometric Progressions",
    "Показательная функция": "Exponential Functions, Exponential Equations and Logarithms",
    "Прямые и плоскости в пространстве, многогранники": "Lines and Planes in Space, Prisms and Pyramids",
    "Тела вращения": "Solids of Revolution: Cylinders, Cones and Spheres",
    # Matemātika II (Grade 12)
    "Математическая индукция": "Mathematical Induction, Pascal's Triangle and Binomial Theorem",
    "Вероятность и статистика II": "Probability Distributions, Bernoulli Trials and Total Probability II",
    "Последовательности и показательная функция": "Limits of Sequences, Number e and Infinite Geometric Series",
    "Степенная функция и логарифмическая функция, модуль": "Power and Logarithmic Functions, Absolute Value Equations",
    "Дробно-рациональная функция и алгебраические преобразования": "Polynomial Division, Bézout's Theorem and Undetermined Coefficients",
    "Производная и её применение": "Derivatives, Differentiation Rules and Function Extremes",
    "Интеграл и его применение": "Indefinite and Definite Integrals, Newton-Leibniz and Area",
    "Тригонометрия II": "Advanced Trigonometric Equations and Inverse Trigonometric Functions",
    "Аналитическая геометрия": "Analytic Geometry: Lines, Distance and Dot Product in 2D/3D",
    "Планиметрия II": "Advanced Planimetry: Circle Theorems, Theorems for Polygons",
    "Стереометрия II": "Advanced Stereometry: Polyhedron Sections and Combinations of Solids",
    "Комплексные задачи по алгебре": "Complex Algebraic Problems, Equations with Parameters"
}

# Polish Latvian titles for better readability
LV_TITLE_POLISH = {
    "Ka izstasta un parada cik kur kads": "Kā izstāsta un parāda: cik, kur, kāds",
    "Cik kopa cik palika": "Cik kopā, cik palika (saskaitīšana un atņemšana līdz 10)",
    "Ka mera garumus un ka iegust simetrisku figuru": "Kā mēra garumus un iegūst simetriskas figūras",
    "Ka pieraksta un salidzina skaitlus kuri ir lielaki neka 10": "Skaitļu līdz 100 lasīšana, pierakstīšana un salīdzināšana",
    "Ka saskaita un atnem skaitlus kuri lielaki neka 10": "Saskaitīšana un atņemšana 20 apjomā",
    "Ko nozime par tik vairak par tik mazak": "Divu lielumu salīdzināšana un starpības uzdevumi",
    "Kur sastopamies ar lieliem skaitliem": "Lieli skaitļi, mērījumi un nauda ikdienā",
    "Ka saskaita un atnem divciparu skaitlus": "Divciparu skaitļu saskaitīšana un atņemšana",
    "Ka reizina un dala ar 3 4 un 5": "Reizināšana un dalīšana ar 3, 4 un 5",
    "Ka reizina un dala ar 6 7 8 9 un 10": "Reizināšana un dalīšana ar 6, 7, 8, 9 un 10",
    "Ka izmanto visas darbibas": "Visu četru darbību lietošana 100 apjomā",
    "Ka veido vietas planu": "Reizināšana un dalīšana ar desmitiem, telpas plāns",
    "Ko nozime dala no vesela": "Daļa no veselā un daļskaitļi",
    "Ka veido telpiskus modelus": "Telpiskas figūras un to izklājumi",
    "Ka saskaita un atnem daudzciparu skaitlus": "Daudzciparu skaitļu saskaitīšana un atņemšana",
    "Ka daudzciparu skaitlus reizina un dala ar viencipara skaitli": "Daudzciparu skaitļu reizināšana un dalīšana ar viencipara skaitli",
    "Ka daudzciparu skaitlus reizina un dala ar divciparu skaitli": "Daudzciparu skaitļu reizināšana un dalīšana ar divciparu skaitli",
    "Ka salidzina saskaita un atnem dalskaitlus": "Parasto daļu salīdzināšana, saskaitīšana un atņemšana",
    "Ko nozime dala no vesela (4 klase)": "Daļa no veselā un daļa no lieluma",
    "Ko nozime dala no vesela": "Daļa no veselā un daļa no lieluma",
    "Ko kopejs iepirksanas un kustibas matematiskaja apraksta": "Kustības un iepirkšanās uzdevumi (ātrums, laiks, ceļš, cena)",
    "Ka dazadi pieraksta naturalos skaitlus": "Naturālo skaitļu pieraksts un noapaļošana",
    "Ka izmanto skaitla sadalisana reizinatajos": "Skaitļa sadalīšana reizinātājos un pakāpes",
    "Ka skaidro un izmanto dalas pamatipasibu": "Daļas pamatīpašība un darbības ar daļām",
    "Ka vienu skaitli izsaka ka otra skaitla dalu": "Viena skaitļa izteikšana kā otra skaitļa daļa",
    "Ka saskaita un atnem jauktus skaitlus": "Jauktu skaitļu saskaitīšana un atņemšana",
    "Ka nosaka figuru nezinamos lielumus": "Daudzstūru īpašības, leņķi un riņķa līnija",
    "Ka izmanto decimaldalas un procentus": "Decimāldaļas, procenti un diagrammas",
    "Ka kopumu sadala noteikta attieciba": "Attiecības, proporcijas un mērogs",
    "Ka reizina un dala parastas dalas": "Parasto daļu un jauktu skaitļu reizināšana un dalīšana",
    "Ka attelo un raksturo telpiskus kermenus": "Telpisku ķermeņu virsmas laukums un tilpums",
    "Kapec nepieciesami skaitli kuri ir mazaki neka nulle": "Negatīvi skaitļi un skaitļu taisne",
    "Ko nozime skaitlim pieskaitit negativu skaitli no skaitla atnemt negativu_": "Darbības ar negatīviem skaitļiem",
    "Ka nosaka kopas visus elementus aprekina notikuma varbutibu": "Kopas, Eilera-Venna diagrammas un varbūtība",
    "Ka define geometriskas figuras": "Ģeometriskās figūras, taisnes un leņķi",
    "Ka raksturo sakaribu starp mainigiem lielumiem": "Tiešā un apgrieztā proporcionalitāte",
    "Ka pieraksta un peta funkcijas kuru grafiks ir taisne": "Lineārā funkcija un tās grafiks",
    "Ka raksturo trijsturi izmantojot ta elementus": "Trijstūris, tā elementi un vienādības pazīmes",
    "Kadas ir sakaribas starp lielumiem trijsturi": "Sakarības starp malām un leņķiem trijstūrī",
    "Ko nozime parveidot izteiksmi ar mainigo lielumu": "Algebriskas izteiksmes un to pārveidojumi",
    "Kadi ir panemieni nezinama noteiksanai linears vienadojums": "Lineāri vienādojumi un proporcijas",
    "Ka salidzina izteiksmes kuras ir mainigais lielums nevienadibas": "Lineāras nevienādības",
    "Ka matematiski raksturo un analize datus statistika": "Datu vākšana, kārtošana un statistiskie rādītāji",
    "Ka skaidro un lieto pakapi ar veselu kapinataju": "Pakāpe ar veselu kāpinātāju",
    "Ka rikojas ja skaitli nevar pierakstit ka dalu kvadratsakne": "Kvadrātsakne un reālie skaitļi",
    "Ka aprekina laukumu jebkuram trijsturim rinkim prizma cilindrs": "Trijstūra, riņķa, prizmas un cilindra laukumi un tilpumi",
    "Kas kopigs cetrsturiem kuru pretejas malas ir pa pariem paralelas paralel_": "Paralelograms, rombs un taisnstūris",
    "Ka skaidro un izpilda darbibas ar izteiksmem": "Darbības ar vienaudžiem un daudzskaldņiem/polinomiem",
    "Ka dazadas funkcijas izmanto matematiskai modelesanai": "Kvadrātfunkcija un apgrieztā proporcionalitāte",
    "Ka nosaka taisnlenka trijstura nezinamas malas garumu pitagora teorema": "Pitagora teorēma un taisnleņķa trijstūris",
    "Ka define un raksturo lidzigus trijsturus": "Līdzīgi trijstūri un Talesa teorēma",
    "Kas kopigs cetrsturiem kuriem tiesi divas malas ir paralelas trapece": "Trapece un tās laukums",
    "Ka aprekinos izmanto taisnlenka trijstura divu malu attiecibu": "Sinuss, kosinuss un tangenss taisnleņķa trijstūrī",
    "Ka izmanto izteiksmju sadalisanu reizinatajos": "Formulas saīsinātai reizināšanai un sadalīšana reizinātājos",
    "Ka skaidro un izmanto formulas darba ar kvadratvienadojumu kvadratfunkciju": "Kvadrātvienādojumi, diskriminants un Vjeta teorēma",
    "Ka apraksta situacijas ar diviem nezinamiem lielumiem": "Divu vienādojumu sistēmas ar diviem mainīgajiem",
    "Ka skaitlu virkni pieraksta ar formulu": "Aritmētiskā progresija",
    "Ka raksturo rinka linijas un daudzstura savstarpejo novietojumu": "Ievilktas un apvilktas riņķa līnijas un daudzstūri",
    "Vektori un kustiba": "Vektori plaknē un telpā, vektoru darbības",
    "Linijas vienadojums": "Taisnes un riņķa līnijas vienādojums",
    "Kombinatorika un varbutiba i": "Kombinatorika un varbūtību teorija I",
    "Statistika i": "Aprakstošā statistika un izkliedes mēri I",
    "Dalveida funkcija un algebriskas dalas": "Algebriskās daļas un daļveida racionāla funkcija",
    "Dalveida vienadojumi un nevienadibas": "Daļveida racionāli vienādojumi un nevienādības",
    "Sinusa un kosinusa funkcijas": "Sinusa un kosinusa funkcijas, sinusu un kosinusu teorēmas",
    "Trigonometriskas izteiksmes un vienadojumi": "Trigonometriskās formulas un pamatvienādojumi",
    "Pakape ar racionalu kapinataju geometriska progresija": "Pakāpe ar racionālu kāpinātāju un ģeometriskā progresija",
    "Eksponentfunkcija": "Eksponentfunkcija, eksponentvienādojumi un logaritmi",
    "Taisnes un plaknes telpa daudzskaldni": "Taisnes un plaknes telpā, daudzskaldņi un prizmas",
    "Rotacijas kermeni": "Rotācijas ķermeņi (cilindrs, konuss, lode)",
    "Matematiska indukcija": "Matemātiskā indukcija, Paskāla trijstūris un Ņūtona binoms",
    "Varbutiba un statistika ii": "Varbūtību sadalījumi, Bernulli formula un pilnā varbūtība II",
    "Virknes un eksponentfunkcija": "Skaitļu virkņu robeža, skaitlis e un bezgalīga ģeometriskā progresija",
    "Pakapes funkcija un logaritmiska funkcija modulis": "Pakāpes un logaritmiskā funkcija, moduļa vienādojumi",
    "Dalveida funkcija un algebriskie parveidojumi": "Polinomu dalīšana, Bezū teorēma un nenoteiktie koeficienti",
    "Atvasinajums un ta lietojums": "Atvasinājums, diferencēšanas kārtulas un funkciju pētīšana",
    "Integralis un ta lietojums": "Nenoteiktais un noteiktais integrālis, laukumu aprēķināšana",
    "Trigonometrija ii": "Trigonometriskās nevienādības un inversās trigonometriskās funkcijas",
    "Analitiska geometrija": "Analītiskā ģeometrija: taisnes, vektori un skalārais reizinājums",
    "Planimetrija ii": "Padziļinātā planimetrija: sakarības daudzstūros un riņķī",
    "Stereometrija ii": "Padziļinātā stereometrija: ķermeņu šķēlumi un kombinācijas",
    "Kompleksi uzdevumi algebra": "Kompleksie uzdevumi algebrā, vienādojumi ar parametriem"
}

def main():
    lv_data = parse_doc('Skola2030_Matematika_LV.md')
    ru_data = parse_doc('Skola2030_Matematika_RU.md')

    all_topics = []
    seen_slugs = set()

    for (lg, rg) in zip(lv_data.keys(), ru_data.keys()):
        grade = get_grade_num(rg)
        l_themes = list(lv_data[lg].keys())
        r_themes = list(ru_data[rg].keys())

        for idx, (l_th, r_th) in enumerate(zip(l_themes, r_themes)):
            l_subs = lv_data[lg][l_th]
            r_subs = ru_data[rg][r_th]

            subj = classify_subject(r_th, r_subs)
            slug = make_slug(grade, idx, r_th)
            # Ensure unique slug
            counter = 1
            orig_slug = slug
            while slug in seen_slugs:
                counter += 1
                slug = f"{orig_slug}-{counter}"
            seen_slugs.add(slug)

            # Polished LV title
            title_lv = LV_TITLE_POLISH.get(l_th, l_th)
            # Polished EN title
            title_en = EN_TITLES.get(r_th, EN_TITLES.get(r_th + f" ({grade} класс)", r_th))

            # Descriptions combining subtopics
            desc_ru = "; ".join(r_subs) if r_subs else None
            desc_lv = "; ".join(l_subs) if l_subs else None

            # Generate subtopic objects
            subtopic_items = []
            for i in range(max(len(r_subs), len(l_subs))):
                sub_r = r_subs[i] if i < len(r_subs) else (l_subs[i] if i < len(l_subs) else "")
                sub_l = l_subs[i] if i < len(l_subs) else sub_r
                subtopic_items.append({
                    "ru": sub_r,
                    "lv": sub_l
                })

            all_topics.append({
                "id": len(all_topics) + 1,
                "slug": slug,
                "grade": grade,
                "grade_name": rg,
                "subject_slug": subj,
                "position": idx + 1,
                "title_ru": r_th,
                "title_lv": title_lv,
                "title_en": title_en,
                "description_ru": desc_ru,
                "description_lv": desc_lv,
                "subtopics": subtopic_items
            })

    os.makedirs('public/data', exist_ok=True)
    os.makedirs('supabase', exist_ok=True)

    # Save to JSON
    json_path = 'public/data/skola2030_topics.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(all_topics, f, ensure_ascii=False, indent=2)

    with open('supabase/skola2030_topics.json', 'w', encoding='utf-8') as f:
        json.dump(all_topics, f, ensure_ascii=False, indent=2)

    print(f"Generated {len(all_topics)} topics to {json_path}")

    # Generate complete SQL seed file
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
        "alter table public.subjects add column if not exists title_en text;",
        "",
        "alter table public.topics add column if not exists title_lv text;",
        "alter table public.topics add column if not exists title_en text;",
        "alter table public.topics add column if not exists description_lv text;",
        "alter table public.topics add column if not exists description_en text;",
        "",
        "alter table public.tasks add column if not exists title_lv text;",
        "alter table public.tasks add column if not exists title_en text;",
        "alter table public.tasks add column if not exists condition_latex_lv text;",
        "alter table public.tasks add column if not exists condition_latex_en text;",
        "alter table public.tasks add column if not exists solution_latex_lv text;",
        "alter table public.tasks add column if not exists solution_latex_en text;",
        "",
        "-- 1. Базовые разделы Skola2030 (Lielās idejas / Mācību jomas)",
        "insert into public.subjects (title, title_lv, title_en, slug, icon, position)",
        "values",
        "  ('Алгебра и числа', 'Algebra un skaitļi', 'Algebra & Numbers', 'algebra', 'x²', 1),",
        "  ('Геометрия и измерения', 'Ģeometrija un mērījumi', 'Geometry & Measurement', 'geometry', '△', 2),",
        "  ('Статистика и вероятность', 'Statistika un varbūtība', 'Statistics & Probability', 'statistics', '📊', 3)",
        "on conflict (slug) do update set",
        "  title = excluded.title,",
        "  title_lv = excluded.title_lv,",
        "  title_en = excluded.title_en,",
        "  icon = excluded.icon,",
        "  position = excluded.position;",
        "",
        "-- 2. Полный каталог тем стандарта Skola2030 (1–12 классы, 81 тема)"
    ]

    def esc_sql(val):
        if val is None:
            return "null"
        return "'" + str(val).replace("'", "''") + "'"

    sql_lines.append("insert into public.topics (title, title_lv, title_en, slug, subject_id, grade, position, description, description_lv)")
    sql_lines.append("values")

    val_chunks = []
    for t in all_topics:
        s_subj = f"(select id from public.subjects where slug = '{t['subject_slug']}')"
        val_chunk = (
            f"  ({esc_sql(t['title_ru'])}, {esc_sql(t['title_lv'])}, {esc_sql(t['title_en'])}, "
            f"{esc_sql(t['slug'])}, {s_subj}, {t['grade']}, {t['position']}, "
            f"{esc_sql(t['description_ru'])}, {esc_sql(t['description_lv'])})"
        )
        val_chunks.append(val_chunk)

    sql_lines.append(",\n".join(val_chunks))
    sql_lines.append("on conflict (slug) do update set")
    sql_lines.append("  title = excluded.title,")
    sql_lines.append("  title_lv = excluded.title_lv,")
    sql_lines.append("  title_en = excluded.title_en,")
    sql_lines.append("  subject_id = excluded.subject_id,")
    sql_lines.append("  grade = excluded.grade,")
    sql_lines.append("  position = excluded.position,")
    sql_lines.append("  description = excluded.description,")
    sql_lines.append("  description_lv = excluded.description_lv;")
    sql_lines.append("")

    # Add starter multilingual tasks
    sql_lines.extend([
        "-- 3. Примеры задач стандарта Skola2030 с пошаговыми решениями и мультиязычностью",
        "insert into public.tasks (topic_id, title, title_lv, title_en, grade, condition_latex, condition_latex_lv, condition_latex_en, answer_latex, solution_latex, solution_latex_lv, solution_latex_en, difficulty, position, is_published)",
        "select",
        "  t.id,",
        "  v.title, v.title_lv, v.title_en,",
        "  v.grade,",
        "  v.condition_latex, v.condition_latex_lv, v.condition_latex_en,",
        "  v.answer_latex,",
        "  v.solution_latex, v.solution_latex_lv, v.solution_latex_en,",
        "  v.difficulty,",
        "  v.position,",
        "  true",
        "from (",
        "  values",
        "    -- 1 класс: Сложение и вычитание в пределах 10",
        "    (",
        "      'skola2030-g1-2-vsego-ostalos',",
        "      'Сложение в пределах 10', 'Saskaitīšana 10 apjomā', 'Addition within 10',",
        "      1,",
        "      'Вычислите значение суммы: $$4 + 3 = ?$$',",
        "      'Aprēķiniet summas vērtību: $$4 + 3 = ?$$',",
        "      'Calculate the sum: $$4 + 3 = ?$$',",
        "      '$7$',",
        "      'Прибавим к числу $4$ три единицы: $4 + 1 = 5$, $5 + 1 = 6$, $6 + 1 = 7$. Ответ: $7$.',",
        "      'Pieskaitām skaitlim $4$ trīs vienus: $4 + 1 = 5$, $5 + 1 = 6$, $6 + 1 = 7$. Atbilde: $7$.',",
        "      'Add 3 to 4: $4 + 3 = 7$. Answer: $7$.',",
        "      'Лёгкий', 1",
        "    ),",
        "    -- 7 класс: Линейные уравнения",
        "    (",
        "      'skola2030-g7-8-priemy-opredeleniya',",
        "      'Линейное уравнение со скобками', 'Lineārs vienādojums ar iekavām', 'Linear equation with brackets',",
        "      7,",
        "      'Решите уравнение: $$3(2x - 5) + 4 = 5x - 7$$',",
        "      'Atrisiniet vienādojumu: $$3(2x - 5) + 4 = 5x - 7$$',",
        "      'Solve the equation: $$3(2x - 5) + 4 = 5x - 7$$',",
        "      '$x = 4$',",
        "      'Раскроем скобки в левой части уравнения:\n$$6x - 15 + 4 = 5x - 7$$\n$$6x - 11 = 5x - 7$$\nПеренесём слагаемые с переменной влево, а числа вправо:\n$$6x - 5x = -7 + 11$$\n$$x = 4$$',",
        "      'Atveriet iekavas vienādojuma kreisajā pusē:\n$$6x - 15 + 4 = 5x - 7$$\n$$6x - 11 = 5x - 7$$\nPārnesiet saskaitāmos ar mainīgo pa kreisi, bet skaitļus pa labi:\n$$6x - 5x = -7 + 11$$\n$$x = 4$$',",
        "      'Expand the brackets on the left side:\n$$6x - 15 + 4 = 5x - 7$$\n$$6x - 11 = 5x - 7$$\nMove variables to the left and constants to the right:\n$$6x - 5x = -7 + 11$$\n$$x = 4$$',",
        "      'Средний', 1",
        "    ),",
        "    -- 8 класс: Теорема Пифагора",
        "    (",
        "      'skola2030-g8-8-opredelyayut-neizvestnuyu',",
        "      'Нахождение гипотенузы', 'Hipotēzes aprēķināšana', 'Finding the hypotenuse',",
        "      8,",
        "      'В прямоугольном треугольнике катеты равны $a = 6\\text{ см}$ и $b = 8\\text{ см}$. Найдите гипотенузу $c$.',",
        "      'Taisnleņķa trijstūrī katetes ir $a = 6\\text{ cm}$ un $b = 8\\text{ cm}$. Aprēķiniet hipotenūzu $c$.',",
        "      'In a right triangle, the legs are $a = 6\\text{ cm}$ and $b = 8\\text{ cm}$. Find hypotenuse $c$.',",
        "      '$c = 10\\text{ см}$',",
        "      'По теореме Пифагора:\n$$c^2 = a^2 + b^2$$\n$$c^2 = 6^2 + 8^2 = 36 + 64 = 100$$\n$$c = \\sqrt{100} = 10\\text{ см}$$',",
        "      'Pēc Pitagora teorēmas:\n$$c^2 = a^2 + b^2$$\n$$c^2 = 6^2 + 8^2 = 36 + 64 = 100$$\n$$c = \\sqrt{100} = 10\\text{ cm}$$',",
        "      'By the Pythagorean theorem:\n$$c^2 = a^2 + b^2 = 36 + 64 = 100$$\n$$c = 10\\text{ cm}$$',",
        "      'Лёгкий', 1",
        "    ),",
        "    -- 9 класс: Квадратное уравнение и теорема Виета",
        "    (",
        "      'skola2030-g9-5-obyasnyayut-ispolzuyut',",
        "      'Квадратное уравнение через дискриминант', 'Kvadrātvienādojums ar diskriminantu', 'Quadratic equation using discriminant',",
        "      9,",
        "      'Решите квадратное уравнение: $$x^2 - 5x + 6 = 0$$',",
        "      'Atrisiniet kvadrātvienādojumu: $$x^2 - 5x + 6 = 0$$',",
        "      'Solve the quadratic equation: $$x^2 - 5x + 6 = 0$$',",
        "      '$x_1 = 2,\\; x_2 = 3$',",
        "      'Коэффициенты: $a = 1, b = -5, c = 6$.\nДискриминант: $$D = b^2 - 4ac = (-5)^2 - 4 \\cdot 1 \\cdot 6 = 25 - 24 = 1$$\nКорни уравнения:\n$$x = \\frac{-b \\pm \\sqrt{D}}{2a} = \\frac{5 \\pm 1}{2}$$\n$$x_1 = 3,\\quad x_2 = 2$$',",
        "      'Koeficienti: $a = 1, b = -5, c = 6$.\nDiskriminants: $$D = b^2 - 4ac = (-5)^2 - 4 \\cdot 1 \\cdot 6 = 25 - 24 = 1$$\nSaknes:\n$$x = \\frac{-b \\pm \\sqrt{D}}{2a} = \\frac{5 \\pm 1}{2}$$\n$$x_1 = 3,\\quad x_2 = 2$$',",
        "      'Coefficients: $a = 1, b = -5, c = 6$.\nDiscriminant: $$D = 25 - 24 = 1$$\nRoots: $$x_1 = 3,\\; x_2 = 2$$',",
        "      'Средний', 1",
        "    ),",
        "    -- 11 класс (Matemātika I): Логарифмическое уравнение",
        "    (",
        "      'skola2030-g11-10-eksponentfunktsiya',",
        "      'Логарифмическое уравнение', 'Logaritmisks vienādojums', 'Logarithmic equation',",
        "      11,",
        "      'Решите уравнение: $$\\log_2(x - 3) = 3$$',",
        "      'Atrisiniet vienādojumu: $$\\log_2(x - 3) = 3$$',",
        "      'Solve the equation: $$\\log_2(x - 3) = 3$$',",
        "      '$x = 11$',",
        "      'Область определения: $x - 3 > 0 \\implies x > 3$.\nПо определению логарифма:\n$$x - 3 = 2^3$$\n$$x - 3 = 8 \\implies x = 11$$\nПроверка: $\\log_2(11 - 3) = \\log_2 8 = 3$ — верно.',",
        "      'Definīcijas apgabals: $x - 3 > 0 \\implies x > 3$.\nPēc logaritma definīcijas:\n$$x - 3 = 2^3 = 8 \\implies x = 11$$\nPārbaude: $\\log_2 8 = 3$ — patiess.',",
        "      'Domain: $x > 3$.\nBy definition of logarithm:\n$$x - 3 = 2^3 = 8 \\implies x = 11$$',",
        "      'Средний', 1",
        "    ),",
        "    -- 12 класс (Matemātika II): Производная функции",
        "    (",
        "      'skola2030-g12-6-proizvodnaya-eyo',",
        "      'Производная функции в точке', 'Funkcijas atvasinājums punktā', 'Derivative at a point',",
        "      12,",
        "      'Найдите значение производной функции $f(x) = 3x^2 - 4x + 5$ в точке $x_0 = 2$.',",
        "      'Aprēķiniet funkcijas $f(x) = 3x^2 - 4x + 5$ atvasinājuma vērtību punktā $x_0 = 2$.',",
        "      'Find the derivative of $f(x) = 3x^2 - 4x + 5$ at $x_0 = 2$.',",
        "      '$f''(2) = 8$',",
        "      'Найдём общую формулу производной:\n$$f''(x) = (3x^2)'' - (4x)'' + (5)'' = 6x - 4$$\nПодставим $x_0 = 2$:\n$$f''(2) = 6 \\cdot 2 - 4 = 12 - 4 = 8$$',",
        "      'Atrodiet atvasinājumu:\n$$f''(x) = 6x - 4$$\nIevietojiet $x_0 = 2$:\n$$f''(2) = 6 \\cdot 2 - 4 = 8$$',",
        "      'Find the derivative: $$f''(x) = 6x - 4$$\nEvaluate at $x = 2$: $$f''(2) = 12 - 4 = 8$$',",
        "      'Средний', 1",
        "    )",
        ") as v(slug, title, title_lv, title_en, grade, condition_latex, condition_latex_lv, condition_latex_en, answer_latex, solution_latex, solution_latex_lv, solution_latex_en, difficulty, position)",
        "join public.topics t on t.slug = v.slug",
        "where not exists (",
        "  select 1 from public.tasks tk where tk.topic_id = t.id and tk.title = v.title",
        ");"
    ])

    sql_path = 'supabase/seed_skola2030.sql'
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(sql_lines))

    print(f"Generated complete SQL seed to {sql_path}")

if __name__ == '__main__':
    main()
