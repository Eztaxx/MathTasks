/**
 * Модуль генерации математических задач по стандарту Skola2030
 * Поддерживает:
 * 1. Прямой вызов Google Gemini API (gemini-2.5-flash / gemini-1.5-flash) или через /api/generate-task
 * 2. Встроенный автономный генератор параметризованных задач Skola2030 для всех классов (1–12)
 * 3. Полную мультиязычность: условие, ответ и пошаговое решение на RU, LV, EN с формулами KaTeX
 */

(() => {
  const isNode = typeof module !== 'undefined' && module.exports;

  // Математические термины и фразы для автоматической локализации
  const GLOSSARY_LV = [
    [/Решите уравнение/gi, 'Atrisiniet vienādojumu'],
    [/Решить уравнение/gi, 'Atrisināt vienādojumu'],
    [/Решите квадратное уравнение/gi, 'Atrisiniet kvadrātvienādojumu'],
    [/Решите систему уравнений/gi, 'Atrisiniet vienādojumu sistēmu'],
    [/Решите неравенство/gi, 'Atrisiniet nevienādību'],
    [/Вычислите значение суммы/gi, 'Aprēķiniet summas vērtību'],
    [/Вычислите значение разности/gi, 'Aprēķiniet starpības vērtību'],
    [/Вычислите значение выражения/gi, 'Aprēķiniet izteiksmes vērtību'],
    [/Вычислите значение/gi, 'Aprēķiniet vērtību'],
    [/Вычислите/gi, 'Aprēķiniet'],
    [/Упростите выражение/gi, 'Vienkāršojiet izteiksmi'],
    [/Найдите корни уравнения/gi, 'Atrodiet vienādojuma saknes'],
    [/Найдите корень уравнения/gi, 'Atrodiet vienādojuma sakni'],
    [/Найдите значение производной функции/gi, 'Aprēķiniet funkcijas atvasinājuma vērtību'],
    [/В прямоугольном треугольнике катеты равны/gi, 'Taisnleņķa trijstūrī katetes ir'],
    [/Найдите гипотенузу/gi, 'Aprēķiniet hipotenūzu'],
    [/Найдите площадь/gi, 'Aprēķiniet laukumu'],
    [/Найдите периметр/gi, 'Aprēķiniet perimetru'],
    [/По теореме Пифагора/gi, 'Pēc Pitagora teorēmas'],
    [/По формуле корней/gi, 'Pēc kvadrātvienādojuma sakņu formulas'],
    [/По формуле n-го члена/gi, 'Pēc n-tā locekļa formulas'],
    [/Раскроем скобки/gi, 'Atveriet iekavas'],
    [/Перенесём слагаемые/gi, 'Pārnesiet saskaitāmos'],
    [/Дискриминант/gi, 'Diskriminants'],
    [/Коэффициенты/gi, 'Koeficienti'],
    [/Корни уравнения/gi, 'Vienādojuma saknes'],
    [/Ответ:/gi, 'Atbilde:'],
    [/верно/gi, 'patiess']
  ];

  const GLOSSARY_EN = [
    [/Решите уравнение/gi, 'Solve the equation'],
    [/Решить уравнение/gi, 'Solve the equation'],
    [/Решите квадратное уравнение/gi, 'Solve the quadratic equation'],
    [/Решите систему уравнений/gi, 'Solve the system of equations'],
    [/Решите неравенство/gi, 'Solve the inequality'],
    [/Вычислите значение суммы/gi, 'Calculate the sum'],
    [/Вычислите значение разности/gi, 'Calculate the difference'],
    [/Вычислите значение выражения/gi, 'Calculate the value of the expression'],
    [/Вычислите значение/gi, 'Calculate the value'],
    [/Вычислите/gi, 'Calculate'],
    [/Упростите выражение/gi, 'Simplify the expression'],
    [/Найдите корни уравнения/gi, 'Find the roots of the equation'],
    [/Найдите корень уравнения/gi, 'Find the root of the equation'],
    [/Найдите значение производной функции/gi, 'Find the derivative of the function'],
    [/В прямоугольном треугольнике катеты равны/gi, 'In a right triangle, the legs are'],
    [/Найдите гипотенузу/gi, 'Find the hypotenuse'],
    [/Найдите площадь/gi, 'Find the area'],
    [/Найдите периметр/gi, 'Find the perimeter'],
    [/По теореме Пифагора/gi, 'By the Pythagorean theorem'],
    [/По формуле корней/gi, 'Using the quadratic formula'],
    [/По формуле n-го члена/gi, 'Using the n-th term formula'],
    [/Раскроем скобки/gi, 'Expand the brackets'],
    [/Перенесём слагаемые/gi, 'Group the terms'],
    [/Дискриминант/gi, 'Discriminant'],
    [/Коэффициенты/gi, 'Coefficients'],
    [/Корни уравнения/gi, 'Roots of the equation'],
    [/Ответ:/gi, 'Answer:'],
    [/верно/gi, 'is true']
  ];

  function translateMathText(text, targetLang) {
    if (!text) return '';
    let res = text;
    const glossary = targetLang === 'lv' ? GLOSSARY_LV : GLOSSARY_EN;
    for (const [pattern, repl] of glossary) {
      res = res.replace(pattern, repl);
    }
    return res;
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /* ── Встроенные генераторы параметризованных задач Skola2030 ─────── */
  const GENERATORS = {
    // 1 класс
    g1: (difficulty, topicTitle) => {
      const a = randInt(1, 5);
      const b = randInt(1, 10 - a);
      const sum = a + b;
      return {
        title_ru: 'Сложение в пределах 10',
        title_lv: 'Saskaitīšana 10 apjomā',
        title_en: 'Addition within 10',
        condition_latex_ru: `Вычислите значение суммы: $$${a} + ${b} = ?$$`,
        condition_latex_lv: `Aprēķiniet summas vērtību: $$${a} + ${b} = ?$$`,
        condition_latex_en: `Calculate the sum: $$${a} + ${b} = ?$$`,
        answer_latex: `$${sum}$`,
        solution_latex_ru: `Сложим числа $${a}$ и $${b}$:\n$$${a} + ${b} = ${sum}$$\nОтвет: $${sum}$.`,
        solution_latex_lv: `Saskaitīsim skaitļus $${a}$ un $${b}$:\n$$${a} + ${b} = ${sum}$$\nAtbilde: $${sum}$.`,
        solution_latex_en: `Add numbers $${a}$ and $${b}$:\n$$${a} + ${b} = ${sum}$$\nAnswer: $${sum}$.`,
        grade: 1
      };
    },

    // 2 класс
    g2: (difficulty, topicTitle) => {
      const a = randInt(12, 48);
      const b = randInt(11, 49);
      const sum = a + b;
      return {
        title_ru: 'Сложение двузначных чисел',
        title_lv: 'Divciparu skaitļu saskaitīšana',
        title_en: 'Adding two-digit numbers',
        condition_latex_ru: `Вычислите значение выражения: $$${a} + ${b} = ?$$`,
        condition_latex_lv: `Aprēķiniet izteiksmes vērtību: $$${a} + ${b} = ?$$`,
        condition_latex_en: `Calculate the value of the expression: $$${a} + ${b} = ?$$`,
        answer_latex: `$${sum}$`,
        solution_latex_ru: `Сложим десятки и единицы:\nДесятки: $${Math.floor(a/10)*10} + ${Math.floor(b/10)*10} = ${(Math.floor(a/10)+Math.floor(b/10))*10}$\nЕдиницы: $${a%10} + ${b%10} = ${(a%10)+(b%10)}$\nИтого: $${sum}$.`,
        solution_latex_lv: `Saskaitīsim desmitus un vienus:\nDesmiti: $${Math.floor(a/10)*10} + ${Math.floor(b/10)*10} = ${(Math.floor(a/10)+Math.floor(b/10))*10}$\nVieni: $${a%10} + ${b%10} = ${(a%10)+(b%10)}$\nKopā: $${sum}$.`,
        solution_latex_en: `Add tens and ones:\nTens: $${Math.floor(a/10)*10} + ${Math.floor(b/10)*10} = ${(Math.floor(a/10)+Math.floor(b/10))*10}$\nOnes: $${a%10} + ${b%10} = ${(a%10)+(b%10)}$\nTotal: $${sum}$.`,
        grade: 2
      };
    },

    // 3 класс
    g3: (difficulty, topicTitle) => {
      const a = randInt(3, 9);
      const b = randInt(4, 9);
      const prod = a * b;
      return {
        title_ru: 'Таблица умножения и периметр',
        title_lv: 'Reizināšanas tabula un taisnstūra perimetrs',
        title_en: 'Multiplication table and rectangle perimeter',
        condition_latex_ru: `Стороны прямоугольника равны $a = ${a}\\text{ см}$ и $b = ${b}\\text{ см}$. Найдите площадь $S$ и периметр $P$ прямоугольника.`,
        condition_latex_lv: `Taisnstūra malas ir $a = ${a}\\text{ cm}$ un $b = ${b}\\text{ cm}$. Aprēķiniet taisnstūra laukumu $S$ un perimetru $P$.`,
        condition_latex_en: `A rectangle has sides $a = ${a}\\text{ cm}$ and $b = ${b}\\text{ cm}$. Find its area $S$ and perimeter $P$.`,
        answer_latex: `$S = ${prod}\\text{ см}^2,\\; P = ${2*(a+b)}\\text{ см}$`,
        solution_latex_ru: `1) Площадь прямоугольника:\n$$S = a \\cdot b = ${a} \\cdot ${b} = ${prod}\\text{ см}^2$$\n2) Периметр прямоугольника:\n$$P = 2(a + b) = 2(${a} + ${b}) = 2 \\cdot ${a+b} = ${2*(a+b)}\\text{ см}$$`,
        solution_latex_lv: `1) Taisnstūra laukums:\n$$S = a \\cdot b = ${a} \\cdot ${b} = ${prod}\\text{ cm}^2$$\n2) Taisnstūra perimetrs:\n$$P = 2(a + b) = 2(${a} + ${b}) = 2 \\cdot ${a+b} = ${2*(a+b)}\\text{ cm}$$`,
        solution_latex_en: `1) Area of the rectangle:\n$$S = a \\cdot b = ${a} \\cdot ${b} = ${prod}\\text{ cm}^2$$\n2) Perimeter of the rectangle:\n$$P = 2(a + b) = 2(${a} + ${b}) = 2 \\cdot ${a+b} = ${2*(a+b)}\\text{ cm}$$`,
        grade: 3
      };
    },

    // 4 класс
    g4: (difficulty, topicTitle) => {
      const denom = pick([5, 7, 8, 9, 10]);
      const n1 = randInt(1, denom - 2);
      const n2 = randInt(1, denom - n1);
      const sumN = n1 + n2;
      return {
        title_ru: 'Сложение обыкновенных дробей',
        title_lv: 'Parasto daļu saskaitīšana',
        title_en: 'Addition of common fractions',
        condition_latex_ru: `Вычислите сумму дробей с одинаковыми знаменателями: $$\\frac{${n1}}{${denom}} + \\frac{${n2}}{${denom}} = ?$$`,
        condition_latex_lv: `Aprēķiniet daļu summu ar vienādiem saucējiem: $$\\frac{${n1}}{${denom}} + \\frac{${n2}}{${denom}} = ?$$`,
        condition_latex_en: `Calculate the sum of fractions with common denominator: $$\\frac{${n1}}{${denom}} + \\frac{${n2}}{${denom}} = ?$$`,
        answer_latex: `$\\frac{${sumN}}{${denom}}$`,
        solution_latex_ru: `При сложении дробей с одинаковыми знаменателями числители складываются, а знаменатель остаётся прежним:\n$$\\frac{${n1}}{${denom}} + \\frac{${n2}}{${denom}} = \\frac{${n1} + ${n2}}{${denom}} = \\frac{${sumN}}{${denom}}$$`,
        solution_latex_lv: `Saskaitot daļas ar vienādiem saucējiem, skaitītājus saskaita, bet saucēju atstāj nemainīgu:\n$$\\frac{${n1}}{${denom}} + \\frac{${n2}}{${denom}} = \\frac{${n1} + ${n2}}{${denom}} = \\frac{${sumN}}{${denom}}$$`,
        solution_latex_en: `When adding fractions with equal denominators, add the numerators and keep the denominator:\n$$\\frac{${n1}}{${denom}} + \\frac{${n2}}{${denom}} = \\frac{${n1} + ${n2}}{${denom}} = \\frac{${sumN}}{${denom}}$$`,
        grade: 4
      };
    },

    // 5 класс
    g5: (difficulty, topicTitle) => {
      const total = randInt(12, 60) * 10;
      const pct = pick([10, 15, 20, 25, 30, 40, 50]);
      const ans = (total * pct) / 100;
      return {
        title_ru: 'Вычисление процентов от числа',
        title_lv: 'Procentu aprēķināšana no skaitļa',
        title_en: 'Finding percentages of a quantity',
        condition_latex_ru: `Товар стоил $${total}\\text{ €}$. Во время распродажи его цена снизилась на $${pct}\\%$. Сколько евро составила скидка и какова новая цена?`,
        condition_latex_lv: `Prece maksāja $${total}\\text{ €}$. Izpārdošanas laikā tās cena samazinājās par $${pct}\\%$. Cik eiro bija atlaide un kāda ir jaunā cena?`,
        condition_latex_en: `An item cost $${total}\\text{ €}$. During a sale, its price dropped by $${pct}\\%$. How much was the discount and what is the new price?`,
        answer_latex: `Скидка: $${ans}\\text{ €}$, новая цена: $${total - ans}\\text{ €}$`,
        solution_latex_ru: `1) Найдём размер скидки ($${pct}\\%$ от $${total}$):\n$$${total} \\cdot \\frac{${pct}}{100} = ${ans}\\text{ €}$$\n2) Вычислим новую цену:\n$$${total} - ${ans} = ${total - ans}\\text{ €}$$`,
        solution_latex_lv: `1) Aprēķinām atlaides lielumu ($${pct}\\%$ no $${total}$):\n$$${total} \\cdot \\frac{${pct}}{100} = ${ans}\\text{ €}$$\n2) Aprēķinām jauno cenu:\n$$${total} - ${ans} = ${total - ans}\\text{ €}$$`,
        solution_latex_en: `1) Calculate discount ($${pct}\\%$ of $${total}$):\n$$${total} \\cdot \\frac{${pct}}{100} = ${ans}\\text{ €}$$\n2) Calculate new price:\n$$${total} - ${ans} = ${total - ans}\\text{ €}$$`,
        grade: 5
      };
    },

    // 6 класс
    g6: (difficulty, topicTitle) => {
      const a = randInt(-15, -2);
      const b = randInt(3, 20);
      const res = a + b;
      return {
        title_ru: 'Сложение чисел с разными знаками',
        title_lv: 'Darbības ar pretēju zīmju skaitļiem',
        title_en: 'Adding integers with different signs',
        condition_latex_ru: `Вычислите значение выражения с отрицательными числами: $$${a} + (${b}) = ?$$`,
        condition_latex_lv: `Aprēķiniet izteiksmes vērtību ar negatīviem skaitļiem: $$${a} + (${b}) = ?$$`,
        condition_latex_en: `Calculate the value with negative numbers: $$${a} + (${b}) = ?$$`,
        answer_latex: `$${res}$`,
        solution_latex_ru: `Чтобы сложить числа с разными знаками, из большего модуля вычитаем меньший и ставим знак числа с большим модулем:\n$$|${b}| > |${a}| \\implies ${b} - ${Math.abs(a)} = ${res}$$`,
        solution_latex_lv: `Lai saskaitītu skaitļus ar dažādām zīmēm, no lielākā moduļa atņem mazāko un saglabā lielākā moduļa zīmi:\n$$|${b}| > |${a}| \\implies ${b} - ${Math.abs(a)} = ${res}$$`,
        solution_latex_en: `To add numbers with different signs, subtract the smaller absolute value from the larger:\n$$${b} - ${Math.abs(a)} = ${res}$$`,
        grade: 6
      };
    },

    // 7 класс: Линейные уравнения
    g7: (difficulty, topicTitle) => {
      const x = randInt(2, 7);
      const a = randInt(2, 5);
      const b = randInt(1, 6);
      const c = randInt(1, 4);
      // a(x + b) - c = d  => d = a*(x+b) - c
      const d = a * (x + b) - c;
      return {
        title_ru: 'Линейное уравнение с раскрытием скобок',
        title_lv: 'Lineārs vienādojums ar iekavu atvēršanu',
        title_en: 'Linear equation with expanding brackets',
        condition_latex_ru: `Решите уравнение: $$${a}(x + ${b}) - ${c} = ${d}$$`,
        condition_latex_lv: `Atrisiniet vienādojumu: $$${a}(x + ${b}) - ${c} = ${d}$$`,
        condition_latex_en: `Solve the equation: $$${a}(x + ${b}) - ${c} = ${d}$$`,
        answer_latex: `$x = ${x}$`,
        solution_latex_ru: `Раскроем скобки в левой части:\n$$${a}x + ${a*b} - ${c} = ${d}$$\n$$${a}x + ${a*b - c} = ${d}$$\nПеренесём свободный член вправо:\n$$${a}x = ${d} - ${a*b - c}$$\n$$${a}x = ${a*x}$$\nРазделим на $${a}$:\n$$x = ${x}$$`,
        solution_latex_lv: `Atveriet iekavas kreisajā pusē:\n$$${a}x + ${a*b} - ${c} = ${d}$$\n$$${a}x + ${a*b - c} = ${d}$$\nPārnesiet brīvo locekli pa labi:\n$$${a}x = ${d} - ${a*b - c}$$\n$$${a}x = ${a*x}$$\nIzdaliet ar $${a}$:\n$$x = ${x}$$`,
        solution_latex_en: `Expand the brackets on the left side:\n$$${a}x + ${a*b} - ${c} = ${d}$$\n$$${a}x = ${a*x}$$\nDivide by $${a}$:\n$$x = ${x}$$`,
        grade: 7
      };
    },

    // 8 класс: Теорема Пифагора
    g8: (difficulty, topicTitle) => {
      // Pythagorean triples (a, b, c)
      const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20]];
      const [a, b, c] = pick(triples);
      return {
        title_ru: 'Теорема Пифагора в прямоугольном треугольнике',
        title_lv: 'Pitagora teorēma taisnleņķa trijstūrī',
        title_en: 'Pythagorean theorem in a right triangle',
        condition_latex_ru: `В прямоугольном треугольнике катеты равны $a = ${a}\\text{ см}$ и $b = ${b}\\text{ см}$. Найдите длину гипотенузы $c$.`,
        condition_latex_lv: `Taisnleņķa trijstūrī katetes ir $a = ${a}\\text{ cm}$ un $b = ${b}\\text{ cm}$. Aprēķiniet hipotenūzas garumu $c$.`,
        condition_latex_en: `In a right triangle, the legs are $a = ${a}\\text{ cm}$ and $b = ${b}\\text{ cm}$. Find the length of the hypotenuse $c$.`,
        answer_latex: `$c = ${c}\\text{ см}$`,
        solution_latex_ru: `По теореме Пифагора для прямоугольного треугольника:\n$$c^2 = a^2 + b^2$$\nПодставим известные катеты:\n$$c^2 = ${a}^2 + ${b}^2 = ${a*a} + ${b*b} = ${c*c}$$\n$$c = \\sqrt{${c*c}} = ${c}\\text{ см}$$\nОтвет: $${c}\\text{ см}$.`,
        solution_latex_lv: `Pēc Pitagora teorēmas taisnleņķa trijstūrim:\n$$c^2 = a^2 + b^2$$\nIevietojam zināmās katetes:\n$$c^2 = ${a}^2 + ${b}^2 = ${a*a} + ${b*b} = ${c*c}$$\n$$c = \\sqrt{${c*c}} = ${c}\\text{ cm}$$\nAtbilde: $${c}\\text{ cm}$.`,
        solution_latex_en: `By the Pythagorean theorem:\n$$c^2 = a^2 + b^2 = ${a*a} + ${b*b} = ${c*c}$$\n$$c = \\sqrt{${c*c}} = ${c}\\text{ cm}$$\nAnswer: $${c}\\text{ cm}$.`,
        grade: 8
      };
    },

    // 9 класс: Квадратные уравнения
    g9: (difficulty, topicTitle) => {
      const x1 = randInt(-5, 4);
      let x2 = randInt(x1 + 1, 6);
      if (x1 === 0 && x2 === 0) x2 = 2;
      const bCoeff = -(x1 + x2);
      const cCoeff = x1 * x2;
      const bSign = bCoeff >= 0 ? `+ ${bCoeff}` : `- ${Math.abs(bCoeff)}`;
      const cSign = cCoeff >= 0 ? `+ ${cCoeff}` : `- ${Math.abs(cCoeff)}`;
      const D = bCoeff * bCoeff - 4 * cCoeff;
      const sqrtD = Math.round(Math.sqrt(D));

      return {
        title_ru: 'Квадратное уравнение через дискриминант',
        title_lv: 'Kvadrātvienādojums ar diskriminantu',
        title_en: 'Quadratic equation using discriminant',
        condition_latex_ru: `Решите квадратное уравнение: $$x^2 ${bSign}x ${cSign} = 0$$`,
        condition_latex_lv: `Atrisiniet kvadrātvienādojumu: $$x^2 ${bSign}x ${cSign} = 0$$`,
        condition_latex_en: `Solve the quadratic equation: $$x^2 ${bSign}x ${cSign} = 0$$`,
        answer_latex: `$x_1 = ${x1},\\; x_2 = ${x2}$`,
        solution_latex_ru: `Коэффициенты уравнения: $a = 1, b = ${bCoeff}, c = ${cCoeff}$.\n1) Найдём дискриминант:\n$$D = b^2 - 4ac = (${bCoeff})^2 - 4 \\cdot 1 \\cdot (${cCoeff}) = ${bCoeff*bCoeff} - (${4*cCoeff}) = ${D}$$\nТак как $D > 0$, уравнение имеет 2 действительных корня:\n$$\\sqrt{D} = \\sqrt{${D}} = ${sqrtD}$$\n2) Найдём корни по формуле:\n$$x = \\frac{-b \\pm \\sqrt{D}}{2a} = \\frac{${-bCoeff} \\pm ${sqrtD}}{2}$$\n$$x_1 = \\frac{${-bCoeff} - ${sqrtD}}{2} = ${x1}, \\quad x_2 = \\frac{${-bCoeff} + ${sqrtD}}{2} = ${x2}$$\nОтвет: $x_1 = ${x1}, x_2 = ${x2}$.`,
        solution_latex_lv: `Vienādojuma koeficienti: $a = 1, b = ${bCoeff}, c = ${cCoeff}$.\n1) Aprēķinām diskriminantu:\n$$D = b^2 - 4ac = (${bCoeff})^2 - 4 \\cdot 1 \\cdot (${cCoeff}) = ${D}$$\nTā kā $D > 0$, vienādojumam ir divas dažādas saknes:\n$$\\sqrt{D} = \\sqrt{${D}} = ${sqrtD}$$\n2) Aprēķinām saknes:\n$$x = \\frac{-b \\pm \\sqrt{D}}{2a} = \\frac{${-bCoeff} \\pm ${sqrtD}}{2}$$\n$$x_1 = ${x1}, \\quad x_2 = ${x2}$$\nAtbilde: $x_1 = ${x1}, x_2 = ${x2}$.`,
        solution_latex_en: `Coefficients: $a = 1, b = ${bCoeff}, c = ${cCoeff}$.\n1) Discriminant:\n$$D = b^2 - 4ac = (${bCoeff})^2 - 4(${cCoeff}) = ${D}$$\n$$\\sqrt{D} = ${sqrtD}$$\n2) Roots:\n$$x = \\frac{${-bCoeff} \\pm ${sqrtD}}{2}$$\n$$x_1 = ${x1},\\quad x_2 = ${x2}$$\nAnswer: $x_1 = ${x1}, x_2 = ${x2}$.`,
        grade: 9
      };
    },

    // 10 класс / Vispārīgais
    g10: (difficulty, topicTitle) => {
      const x0 = randInt(-3, 3);
      const y0 = randInt(-4, 4);
      const a = pick([1, 2, -1]);
      // y = a(x - x0)^2 + y0 = a(x^2 - 2*x0*x + x0^2) + y0
      const bCoeff = -2 * a * x0;
      const cCoeff = a * x0 * x0 + y0;
      const bSign = bCoeff >= 0 ? `+ ${bCoeff}` : `- ${Math.abs(bCoeff)}`;
      const cSign = cCoeff >= 0 ? `+ ${cCoeff}` : `- ${Math.abs(cCoeff)}`;

      return {
        title_ru: 'Координаты вершины параболы',
        title_lv: 'Parabolas virsotnes koordinātas',
        title_en: 'Vertex coordinates of a parabola',
        condition_latex_ru: `Найдите координаты вершины параболы, заданной квадратичной функцией: $$y = ${a === 1 ? '' : (a === -1 ? '-' : a)}x^2 ${bSign}x ${cSign}$$`,
        condition_latex_lv: `Atrodiet parabolas virsotnes koordinātas kvadrātfunkcijai: $$y = ${a === 1 ? '' : (a === -1 ? '-' : a)}x^2 ${bSign}x ${cSign}$$`,
        condition_latex_en: `Find the vertex coordinates of the parabola: $$y = ${a === 1 ? '' : (a === -1 ? '-' : a)}x^2 ${bSign}x ${cSign}$$`,
        answer_latex: `$(x_0; y_0) = (${x0}; ${y0})$`,
        solution_latex_ru: `Коэффициенты: $a = ${a}, b = ${bCoeff}, c = ${cCoeff}$.\n1) Абсцисса вершины параболы:\n$$x_0 = -\\frac{b}{2a} = -\\frac{${bCoeff}}{2 \\cdot (${a})} = ${x0}$$\n2) Ордината вершины параболы:\n$$y_0 = y(${x0}) = ${a}(${x0})^2 + (${bCoeff})(${x0}) + (${cCoeff}) = ${y0}$$\nВершина параболы: $(${x0}; ${y0})$.`,
        solution_latex_lv: `Koeficienti: $a = ${a}, b = ${bCoeff}, c = ${cCoeff}$.\n1) Virsotnes abscisa:\n$$x_0 = -\\frac{b}{2a} = -\\frac{${bCoeff}}{2 \\cdot (${a})} = ${x0}$$\n2) Virsotnes ordināta:\n$$y_0 = y(${x0}) = ${y0}$$\nVirsotnes punkts: $(${x0}; ${y0})$.`,
        solution_latex_en: `Coefficients: $a = ${a}, b = ${bCoeff}, c = ${cCoeff}$.\n1) X-coordinate of the vertex:\n$$x_0 = -\\frac{b}{2a} = ${x0}$$\n2) Y-coordinate:\n$$y_0 = y(${x0}) = ${y0}$$\nVertex: $(${x0}; ${y0})$.`,
        grade: 10
      };
    },

    // 11 класс / Matemātika I (Оптимальный уровень)
    g11: (difficulty, topicTitle) => {
      const base = pick([2, 3, 5]);
      const p = randInt(2, 4);
      const val = Math.pow(base, p);
      const shift = randInt(1, 5);
      const x = val + shift;

      return {
        title_ru: 'Логарифмическое уравнение',
        title_lv: 'Logaritmisks vienādojums',
        title_en: 'Logarithmic equation',
        condition_latex_ru: `Решите уравнение: $$\\log_${base}(x - ${shift}) = ${p}$$`,
        condition_latex_lv: `Atrisiniet vienādojumu: $$\\log_${base}(x - ${shift}) = ${p}$$`,
        condition_latex_en: `Solve the equation: $$\\log_${base}(x - ${shift}) = ${p}$$`,
        answer_latex: `$x = ${x}$`,
        solution_latex_ru: `1) Область определения (ОДЗ):\n$$x - ${shift} > 0 \\implies x > ${shift}$$\n2) По определению логарифма $\\log_a b = c \\iff b = a^c$:\n$$x - ${shift} = ${base}^{${p}}$$\n$$x - ${shift} = ${val}$$\n$$x = ${val} + ${shift} = ${x}$$\nКорень удовлетворяет ОДЗ ($${x} > ${shift}$). Ответ: $x = ${x}$.`,
        solution_latex_lv: `1) Definīcijas apgabals:\n$$x - ${shift} > 0 \\implies x > ${shift}$$\n2) Pēc logaritma definīcijas:\n$$x - ${shift} = ${base}^{${p}} = ${val}$$\n$$x = ${val} + ${shift} = ${x}$$\nSakne pieder definīcijas apgabalam. Atbilde: $x = ${x}$.`,
        solution_latex_en: `1) Domain:\n$$x - ${shift} > 0 \\implies x > ${shift}$$\n2) By logarithm definition:\n$$x - ${shift} = ${base}^{${p}} = ${val}$$\n$$x = ${x}$$\nAnswer: $x = ${x}$.`,
        grade: 11
      };
    },

    // 12 класс / Matemātika II (Углубленный уровень)
    g12: (difficulty, topicTitle) => {
      const a = randInt(2, 5);
      const b = randInt(2, 8);
      const c = randInt(1, 10);
      const x0 = randInt(1, 4);
      // f(x) = a*x^2 - b*x + c, f'(x) = 2*a*x - b, f'(x0) = 2*a*x0 - b
      const derivVal = 2 * a * x0 - b;

      return {
        title_ru: 'Производная функции в точке',
        title_lv: 'Funkcijas atvasinājums punktā',
        title_en: 'Derivative of a function at a point',
        condition_latex_ru: `Найдите значение производной функции $f(x) = ${a}x^2 - ${b}x + ${c}$ в точке $x_0 = ${x0}$.`,
        condition_latex_lv: `Aprēķiniet funkcijas $f(x) = ${a}x^2 - ${b}x + ${c}$ atvasinājuma vērtību punktā $x_0 = ${x0}$.`,
        condition_latex_en: `Find the derivative of the function $f(x) = ${a}x^2 - ${b}x + ${c}$ at the point $x_0 = ${x0}$.`,
        answer_latex: `$f'(${x0}) = ${derivVal}$`,
        solution_latex_ru: `1) Найдём производную функции по правилам дифференцирования:\n$$f'(x) = (${a}x^2)' - (${b}x)' + (${c})' = 2 \\cdot ${a}x - ${b} = ${2*a}x - ${b}$$\n2) Вычислим значение производной в точке $x_0 = ${x0}$:\n$$f'(${x0}) = ${2*a} \\cdot ${x0} - ${b} = ${2*a*x0} - ${b} = ${derivVal}$$\nОтвет: $f'(${x0}) = ${derivVal}$.`,
        solution_latex_lv: `1) Atrodiet funkcijas atvasinājumu:\n$$f'(x) = (${a}x^2)' - (${b}x)' + (${c})' = ${2*a}x - ${b}$$\n2) Aprēķiniet atvasinājumu punktā $x_0 = ${x0}$:\n$$f'(${x0}) = ${2*a} \\cdot ${x0} - ${b} = ${derivVal}$$\nAtbilde: $f'(${x0}) = ${derivVal}$.`,
        solution_latex_en: `1) Find the derivative:\n$$f'(x) = ${2*a}x - ${b}$$\n2) Evaluate at $x_0 = ${x0}$:\n$$f'(${x0}) = ${2*a}(${x0}) - ${b} = ${derivVal}$$\nAnswer: $f'(${x0}) = ${derivVal}$.`,
        grade: 12
      };
    }
  };

  /**
   * Вызов Google Gemini API
   */
  async function callGeminiApi({ apiKey, grade, topicTitle, subtopic, difficulty, taskType, customPrompt }) {
    const prompt = `Ты — ведущий методист и преподаватель математики в Латвии, создающий учебные материалы строго по государственному стандарту Skola2030.
Создай качественную математическую задачу для ${grade} класса.
Тема Skola2030: "${topicTitle}".
${subtopic ? `Конкретный навык/подтема: "${subtopic}".` : ''}
Сложность: ${difficulty || 'Средний'} (Лёгкий = pamata līmenis, Средний = optimālais līmenis, Сложный = padziļinātais līmenis).
Тип задачи: ${taskType || 'Уравнение или текстовая задача'}.
${customPrompt ? `Дополнительные пожелания автора: "${customPrompt}".` : ''}

Требования:
1. Математическая точность: условие должно иметь ровно одно корректное решение, ответ должен быть строго выверен.
2. Формулы: оформляй все переменные, числа в вычислениях и формулы в KaTeX-разметке: внутри $...$ для инлайн и $$...$$ для выключных формул.
3. Локализация: создай полные версии на русском (RU), латышском (LV) и английском (EN) языках. Латышский текст должен соответствовать латвийской школьной терминологии Skola2030.
4. Ответ верни СТРОГО в формате валидного JSON-объекта (без обёрток \`\`\`json):
{
  "title_ru": "Краткое название задачи",
  "title_lv": "Nosaukums latviski",
  "title_en": "Title in English",
  "condition_latex_ru": "Условие задачи с формулами $...$",
  "condition_latex_lv": "Nosacījums ar formulām $...$",
  "condition_latex_en": "Condition with formulas $...$",
  "answer_latex": "Короткий математический ответ, например: $x = 4$ или $c = 10\\text{ см}$",
  "solution_latex_ru": "Пошаговое понятное решение с формулами",
  "solution_latex_lv": "Soli pa solim atrisinājums latviski",
  "solution_latex_en": "Step-by-step solution in English"
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) throw new Error('Пустой ответ от Gemini API');

    const cleanJson = candidateText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    return {
      ...parsed,
      grade: Number(grade) || 7,
      difficulty: difficulty || 'Средний'
    };
  }

  /**
   * Главная функция генерации задачи
   */
  async function generateTask(options = {}) {
    const {
      grade = 7,
      topicTitle = 'Линейные уравнения',
      subtopic = '',
      difficulty = 'Средний',
      taskType = 'Уравнение',
      customPrompt = '',
      apiKey = '',
      useGemini = false
    } = options;

    // 1. Попытка через Gemini API (если передан ключ или запрошен Gemini)
    if (useGemini && apiKey) {
      try {
        return await callGeminiApi({
          apiKey,
          grade,
          topicTitle,
          subtopic,
          difficulty,
          taskType,
          customPrompt
        });
      } catch (err) {
        console.warn('Ошибка вызова Gemini API, переключаемся на встроенный генератор Skola2030:', err);
      }
    }

    // 2. Встроенный автономный генератор Skola2030
    const gradeKey = `g${grade}`;
    const gen = GENERATORS[gradeKey] || GENERATORS.g7;
    const task = gen(difficulty, topicTitle);

    // Дополняем метаданными
    return {
      ...task,
      grade: Number(grade) || 7,
      difficulty: difficulty || 'Средний'
    };
  }

  const api = {
    generateTask,
    callGeminiApi,
    translateMathText,
    GENERATORS
  };

  if (isNode) {
    module.exports = api;
  } else {
    window.MathTasks = window.MathTasks || {};
    window.MathTasks.aiGenerator = api;
  }
})();
