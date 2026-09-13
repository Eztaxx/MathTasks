/**
 * MathTasks — Тренажёр быстрого устного счёта
 * 
 * Категории:
 * 1. addsub2: Сложение и вычитание (двузначные)
 * 2. addsub3: Сложение и вычитание (трёхзначные)
 * 3. multdiv: Умножение и деление
 * 4. fractions: Обыкновенные дроби (+, -, *, /)
 * 5. decimals: Десятичные дроби (+, -, *, /)
 * 6. mix: Смешанный режим
 */

(() => {
  // Утилиты математики
  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Сокращение дроби
  function reduceFraction(n, d) {
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d);
    return { num: n / g, den: d / g };
  }

  // Форматирование алгебраического одночлена вида c*x^p
  function formatAlgebraAnswer(coeff, exp, variable = 'x') {
    if (exp === 0) return String(coeff);
    if (coeff === 0) return '0';
    let cStr = '';
    if (coeff === 1) cStr = '';
    else if (coeff === -1) cStr = '-';
    else cStr = String(coeff);

    let vStr = '';
    if (exp === 1) vStr = variable;
    else vStr = `${variable}^${exp}`;

    return `${cStr}${vStr}`;
  }

  const SUPERSCRIPT_MAP = {
    '\u2070': '0',
    '\u00B9': '1',
    '\u00B2': '2',
    '\u00B3': '3',
    '\u2074': '4',
    '\u2075': '5',
    '\u2076': '6',
    '\u2077': '7',
    '\u2078': '8',
    '\u2079': '9',
    '\u207B': '-'
  };

  // Парсинг алгебраического одночлена (поддерживает x^5, x⁵, 6x^7, -2x, 5, 1/x^2, x^-2, x**3)
  function parseAlgebraicTerm(str) {
    if (!str || typeof str !== 'string') return null;
    let s = str.trim().toLowerCase().replace(/\s+/g, '');
    s = s.replace(/[\u2070\u00B9\u00B2\u00B3\u2074-\u2079\u207B]+/g, match => '^' + [...match].map(ch => SUPERSCRIPT_MAP[ch] || '').join(''));
    s = s.replace(/\*\*/g, '^');
    s = s.replace(/([0-9])\*([a-z])/g, '$1$2');

    // Проверка дробей вида 1/x^2 или 3/x^4 или 1/x
    const fracMatch = s.match(/^([+-]?\d+(?:\.\d+)?)\/([a-z])(?:\^([+-]?\d+))?$/);
    if (fracMatch) {
      const c = Number(fracMatch[1]);
      const v = fracMatch[2];
      const p = fracMatch[3] !== undefined ? Number(fracMatch[3]) : 1;
      return { coeff: c, variable: v, exp: -p };
    }

    // Случай чистого числа (степень 0)
    if (/^[+-]?\d+(?:\.\d+)?$/.test(s)) {
      return { coeff: Number(s), variable: null, exp: 0 };
    }

    // Случай с переменной: [+-]? [число]? переменная [^ [+-]?число]?
    const match = s.match(/^([+-]?(?:\d+(?:\.\d+)?)?)?([a-z])(?:\^?([+-]?\d+))?$/);
    if (!match) return null;

    let coeffStr = match[1];
    let coeff = 1;
    if (coeffStr === '-' || coeffStr === '−' || coeffStr === '\u2212') coeff = -1;
    else if (coeffStr === '+' || !coeffStr) coeff = 1;
    else coeff = Number(coeffStr);

    const variable = match[2];
    const exp = match[3] !== undefined ? Number(match[3]) : 1;

    return { coeff, variable, exp };
  }

  // Генераторы примеров
  const GENERATORS = {
    // 1. Двузначные числа: сложение и вычитание
    addsub2: (diff = 'normal') => {
      if (diff === 'expert') {
        const isTri = Math.random() < 0.65;
        if (isTri) {
          const a = randInt(25, 68);
          const b = randInt(18, 55);
          const c = randInt(12, a + b - 15);
          const ans = a + b - c;
          return {
            latex: `${a} + ${b} - ${c}`,
            answer: String(ans),
            type: 'integer',
            hint: `${a} + ${b} = ${a + b}, затем ${a + b} - ${c} = ${ans}`,
            category: 'addsub2'
          };
        } else {
          // Большие двузначные числа с переходом
          const a = randInt(65, 99);
          const b = randInt(45, 98);
          const ans = a + b;
          return {
            latex: `${a} + ${b}`,
            answer: String(ans),
            type: 'integer',
            hint: `${a} + ${b} = ${ans}`,
            category: 'addsub2'
          };
        }
      } else if (diff === 'hard') {
        // Продвинутый: обязательный переход через десяток в каждом примере (единицы 6..9)
        const isAdd = Math.random() < 0.5;
        if (isAdd) {
          const u1 = randInt(6, 9);
          const u2 = randInt(6, 9);
          const a = randInt(2, 7) * 10 + u1;
          const b = randInt(2, 6) * 10 + u2;
          const ans = a + b;
          return {
            latex: `${a} + ${b}`,
            answer: String(ans),
            type: 'integer',
            hint: `${a} + ${b} = ${ans}`,
            category: 'addsub2'
          };
        } else {
          const u1 = randInt(1, 4);
          const u2 = randInt(6, 9);
          const a = randInt(5, 9) * 10 + u1;
          const b = randInt(2, 4) * 10 + u2;
          const ans = a - b;
          return {
            latex: `${a} - ${b}`,
            answer: String(ans),
            type: 'integer',
            hint: `${a} - ${b} = ${ans}`,
            category: 'addsub2'
          };
        }
      } else {
        // Базовый: простые числа до 50 без сложного перехода
        const isAdd = Math.random() < 0.55;
        if (isAdd) {
          const a = randInt(12, 45);
          const b = randInt(11, 35);
          const ans = a + b;
          return {
            latex: `${a} + ${b}`,
            answer: String(ans),
            type: 'integer',
            hint: `${a} + ${b} = ${ans}`,
            category: 'addsub2'
          };
        } else {
          const a = randInt(25, 68);
          const b = randInt(11, a - 10);
          const ans = a - b;
          return {
            latex: `${a} - ${b}`,
            answer: String(ans),
            type: 'integer',
            hint: `${a} - ${b} = ${ans}`,
            category: 'addsub2'
          };
        }
      }
    },

    // 2. Трёхзначные числа: сложение и вычитание
    addsub3: (diff = 'normal') => {
      if (diff === 'expert') {
        const isTri = Math.random() < 0.6;
        if (isTri) {
          const a = randInt(15, 60) * 10;
          const b = randInt(12, 45) * 10;
          const c = randInt(10, Math.floor((a + b - 50) / 10)) * 10;
          const ans = a + b - c;
          return {
            latex: `${a} + ${b} - ${c}`,
            answer: String(ans),
            type: 'integer',
            hint: `${a} + ${b} = ${a + b}, затем ${a + b} - ${c} = ${ans}`,
            category: 'addsub3'
          };
        } else {
          // Переход через 1000
          const a = randInt(115, 185) * 10;
          const b = randInt(45, 95) * 10;
          const ans = a - b;
          return {
            latex: `${a} - ${b}`,
            answer: String(ans),
            type: 'integer',
            hint: `${a} - ${b} = ${ans}`,
            category: 'addsub3'
          };
        }
      } else if (diff === 'hard') {
        // Продвинутый: полные трёхзначные числа с переносами
        const isAdd = Math.random() < 0.5;
        if (isAdd) {
          const a = randInt(245, 689);
          const b = randInt(145, 489);
          const ans = a + b;
          return {
            latex: `${a} + ${b}`,
            answer: String(ans),
            type: 'integer',
            hint: `${a} + ${b} = ${ans}`,
            category: 'addsub3'
          };
        } else {
          const a = randInt(520, 985);
          const b = randInt(145, a - 120);
          const ans = a - b;
          return {
            latex: `${a} - ${b}`,
            answer: String(ans),
            type: 'integer',
            hint: `${a} - ${b} = ${ans}`,
            category: 'addsub3'
          };
        }
      } else {
        // Базовый: круглые десятки, комфортный счёт
        const isAdd = Math.random() < 0.5;
        if (isAdd) {
          const a = randInt(12, 45) * 10;
          const b = randInt(11, 35) * 10;
          const ans = a + b;
          return {
            latex: `${a} + ${b}`,
            answer: String(ans),
            type: 'integer',
            hint: `${a} + ${b} = ${ans}`,
            category: 'addsub3'
          };
        } else {
          const a = randInt(35, 80) * 10;
          const b = randInt(12, Math.floor((a - 50) / 10)) * 10;
          const ans = a - b;
          return {
            latex: `${a} - ${b}`,
            answer: String(ans),
            type: 'integer',
            hint: `${a} - ${b} = ${ans}`,
            category: 'addsub3'
          };
        }
      }
    },

    // 3. Умножение и деление
    multdiv: (diff = 'normal') => {
      if (diff === 'expert') {
        // Эксперт: двузначное x двузначное или деление 3-значного на 2-значное
        const isMult = Math.random() < 0.6;
        if (isMult) {
          const a = randInt(12, 28);
          const b = randInt(11, 25);
          const ans = a * b;
          return {
            latex: `${a} \\times ${b}`,
            answer: String(ans),
            type: 'integer',
            hint: `${a} \\times ${b} = ${ans}`,
            category: 'multdiv'
          };
        } else {
          const b = randInt(12, 22);
          const q = randInt(12, 35);
          const a = b * q;
          return {
            latex: `${a} \\div ${b}`,
            answer: String(q),
            type: 'integer',
            hint: `${a} \\div ${b} = ${q}`,
            category: 'multdiv'
          };
        }
      } else if (diff === 'hard') {
        // Продвинутый: двузначное x однозначное или спецмножители 5, 11, 25
        const op = pick(['mult_2x1', 'mult_special', 'div_exact']);
        if (op === 'mult_special') {
          const factor = pick([5, 11, 15, 25]);
          let a;
          if (factor === 5) a = randInt(14, 78) * 2;
          else if (factor === 11) a = randInt(12, 65);
          else if (factor === 25) a = randInt(4, 28) * 4;
          else a = randInt(12, 36);
          return {
            latex: `${a} \\times ${factor}`,
            answer: String(a * factor),
            type: 'integer',
            hint: `${a} \\times ${factor} = ${a * factor}`,
            category: 'multdiv'
          };
        } else if (op === 'div_exact') {
          const b = randInt(4, 9);
          const q = randInt(14, 45);
          const a = b * q;
          return {
            latex: `${a} \\div ${b}`,
            answer: String(q),
            type: 'integer',
            hint: `${a} \\div ${b} = ${q}`,
            category: 'multdiv'
          };
        } else {
          const a = randInt(14, 38);
          const b = randInt(3, 9);
          const ans = a * b;
          return {
            latex: `${a} \\times ${b}`,
            answer: String(ans),
            type: 'integer',
            hint: `${a} \\times ${b} = ${ans}`,
            category: 'multdiv'
          };
        }
      } else {
        // Базовый: таблица умножения и деления (1..10)
        const isMult = Math.random() < 0.6;
        if (isMult) {
          const a = randInt(3, 9);
          const b = randInt(3, 9);
          return {
            latex: `${a} \\times ${b}`,
            answer: String(a * b),
            type: 'integer',
            hint: `${a} \\times ${b} = ${a * b}`,
            category: 'multdiv'
          };
        } else {
          const b = randInt(2, 9);
          const q = randInt(2, 9);
          const a = b * q;
          return {
            latex: `${a} \\div ${b}`,
            answer: String(q),
            type: 'integer',
            hint: `${a} \\div ${b} = ${q}`,
            category: 'multdiv'
          };
        }
      }
    },

    // 4. Обыкновенные дроби (+, -, *, /)
    fractions: (diff = 'normal') => {
      if (diff === 'normal') {
        // Базовый: одинаковые знаменатели или простые половины/четверти
        const isSame = Math.random() < 0.75;
        if (isSame) {
          const d = pick([3, 4, 5, 6, 7, 8, 9, 10]);
          const isAdd = Math.random() < 0.55;
          if (isAdd) {
            const n1 = randInt(1, Math.max(1, d - 2));
            const n2 = randInt(1, Math.max(1, d - n1));
            const res = reduceFraction(n1 + n2, d);
            const ansStr = res.den === 1 ? String(res.num) : `${res.num}/${res.den}`;
            return {
              latex: `\\frac{${n1}}{${d}} + \\frac{${n2}}{${d}}`,
              answer: ansStr,
              rawNum: n1 + n2,
              rawDen: d,
              resNum: res.num,
              resDen: res.den,
              type: 'fraction',
              hint: `\\frac{${n1} + ${n2}}{${d}} = \\frac{${n1 + n2}}{${d}}`,
              category: 'fractions'
            };
          } else {
            const n1 = randInt(2, d);
            const n2 = randInt(1, n1 - 1);
            const res = reduceFraction(n1 - n2, d);
            const ansStr = res.den === 1 ? String(res.num) : `${res.num}/${res.den}`;
            return {
              latex: `\\frac{${n1}}{${d}} - \\frac{${n2}}{${d}}`,
              answer: ansStr,
              rawNum: n1 - n2,
              rawDen: d,
              resNum: res.num,
              resDen: res.den,
              type: 'fraction',
              hint: `\\frac{${n1} - ${n2}}{${d}} = \\frac{${n1 - n2}}{${d}}`,
              category: 'fractions'
            };
          }
        } else {
          // Базовые половины и четверти
          const pair = pick([
            { l: '\\frac{1}{2} + \\frac{1}{4}', a: '3/4', n: 3, d: 4 },
            { l: '\\frac{3}{4} - \\frac{1}{2}', a: '1/4', n: 1, d: 4 },
            { l: '\\frac{1}{2} + \\frac{1}{2}', a: '1', n: 1, d: 1 },
            { l: '\\frac{1}{3} + \\frac{1}{6}', a: '1/2', n: 1, d: 2 },
            { l: '\\frac{1}{2} - \\frac{1}{4}', a: '1/4', n: 1, d: 4 }
          ]);
          return {
            latex: pair.l,
            answer: pair.a,
            resNum: pair.n,
            resDen: pair.d,
            type: 'fraction',
            hint: `${pair.l} = ${pair.a}`,
            category: 'fractions'
          };
        }
      }

      // Продвинутый и Эксперт
      const mode = pick(['add_diff', 'sub_diff', 'mult', 'div']);
      if (mode === 'add_diff') {
        const pool = (diff === 'expert') ? [4, 6, 8, 9, 12, 14, 15, 18] : [2, 3, 4, 5, 6, 8, 10];
        const d1 = pick(pool);
        const d2 = pick(pool.filter(x => x !== d1));
        const n1 = randInt(1, d1 - 1);
        const n2 = randInt(1, d2 - 1);
        const lcm = (d1 * d2) / gcd(d1, d2);
        const m1 = lcm / d1;
        const m2 = lcm / d2;
        const numSum = n1 * m1 + n2 * m2;
        const res = reduceFraction(numSum, lcm);
        const ansStr = res.den === 1 ? String(res.num) : `${res.num}/${res.den}`;
        return {
          latex: `\\frac{${n1}}{${d1}} + \\frac{${n2}}{${d2}}`,
          answer: ansStr,
          rawNum: numSum,
          rawDen: lcm,
          resNum: res.num,
          resDen: res.den,
          type: 'fraction',
          hint: `Общий знаменатель: ${lcm}.\n\\frac{${n1 * m1} + ${n2 * m2}}{${lcm}} = \\frac{${numSum}}{${lcm}} = ${ansStr}`,
          category: 'fractions'
        };
      } else if (mode === 'sub_diff') {
        const pool = (diff === 'expert') ? [4, 6, 8, 9, 12, 14, 15, 18] : [2, 3, 4, 5, 6, 8, 10];
        const d1 = pick(pool);
        const d2 = pick(pool.filter(x => x !== d1));
        const lcm = (d1 * d2) / gcd(d1, d2);
        const m1 = lcm / d1;
        const m2 = lcm / d2;
        let n1 = randInt(1, d1);
        let n2 = randInt(1, d2 - 1);
        if (n1 * m1 <= n2 * m2) {
          n1 = d1;
          n2 = 1;
        }
        const numDiff = n1 * m1 - n2 * m2;
        const res = reduceFraction(numDiff, lcm);
        const ansStr = res.den === 1 ? String(res.num) : `${res.num}/${res.den}`;
        return {
          latex: `\\frac{${n1}}{${d1}} - \\frac{${n2}}{${d2}}`,
          answer: ansStr,
          rawNum: numDiff,
          rawDen: lcm,
          resNum: res.num,
          resDen: res.den,
          type: 'fraction',
          hint: `Общий знаменатель: ${lcm}.\n\\frac{${n1 * m1} - ${n2 * m2}}{${lcm}} = ${ansStr}`,
          category: 'fractions'
        };
      } else if (mode === 'mult') {
        const pool = (diff === 'expert') ? [3, 4, 5, 6, 7, 8, 9, 12] : [2, 3, 4, 5, 7];
        const d1 = pick(pool);
        const d2 = pick(pool);
        const n1 = randInt(1, d1 + 1);
        const n2 = randInt(1, d2 + 1);
        const numP = n1 * n2;
        const denP = d1 * d2;
        const res = reduceFraction(numP, denP);
        const ansStr = res.den === 1 ? String(res.num) : `${res.num}/${res.den}`;
        return {
          latex: `\\frac{${n1}}{${d1}} \\times \\frac{${n2}}{${d2}}`,
          answer: ansStr,
          rawNum: numP,
          rawDen: denP,
          resNum: res.num,
          resDen: res.den,
          type: 'fraction',
          hint: `\\frac{${n1} \\times ${n2}}{${d1} \\times ${d2}} = ${ansStr}`,
          category: 'fractions'
        };
      } else {
        const pool = (diff === 'expert') ? [3, 4, 5, 6, 7, 8, 9] : [2, 3, 4, 5];
        const d1 = pick(pool);
        const d2 = pick(pool);
        const n1 = randInt(1, d1);
        const n2 = randInt(1, d2);
        const numP = n1 * d2;
        const denP = d1 * n2;
        const res = reduceFraction(numP, denP);
        const ansStr = res.den === 1 ? String(res.num) : `${res.num}/${res.den}`;
        return {
          latex: `\\frac{${n1}}{${d1}} \\div \\frac{${n2}}{${d2}}`,
          answer: ansStr,
          rawNum: numP,
          rawDen: denP,
          resNum: res.num,
          resDen: res.den,
          type: 'fraction',
          hint: `\\frac{${n1}}{${d1}} \\times \\frac{${d2}}{${n2}} = ${ansStr}`,
          category: 'fractions'
        };
      }
    },

    // 5. Десятичные дроби
    decimals: (diff = 'normal') => {
      const mode = pick(['add', 'sub', 'mult', 'div']);
      if (mode === 'add') {
        if (diff === 'expert') {
          // Эксперт: сотые доли
          const aInt = randInt(115, 485);
          const bInt = randInt(115, 485);
          const a = aInt / 100;
          const b = bInt / 100;
          const sum = Math.round((a + b) * 100) / 100;
          return {
            latex: `${String(a).replace('.', '{,}')} + ${String(b).replace('.', '{,}')}`,
            answer: String(sum),
            type: 'decimal',
            hint: `${a} + ${b} = ${sum}`,
            category: 'decimals'
          };
        } else if (diff === 'hard') {
          // Продвинутый: десятые с переходом через целое
          const a = randInt(25, 88) / 10;
          const b = randInt(16, 78) / 10;
          const sum = Math.round((a + b) * 10) / 10;
          return {
            latex: `${String(a).replace('.', '{,}')} + ${String(b).replace('.', '{,}')}`,
            answer: String(sum),
            type: 'decimal',
            hint: `${a} + ${b} = ${sum}`,
            category: 'decimals'
          };
        } else {
          // Базовый: простые десятые без сложного перехода
          const a = randInt(11, 45) / 10;
          const b = randInt(11, 35) / 10;
          const sum = Math.round((a + b) * 10) / 10;
          return {
            latex: `${String(a).replace('.', '{,}')} + ${String(b).replace('.', '{,}')}`,
            answer: String(sum),
            type: 'decimal',
            hint: `${a} + ${b} = ${sum}`,
            category: 'decimals'
          };
        }
      } else if (mode === 'sub') {
        if (diff === 'expert') {
          const aInt = randInt(355, 895);
          const bInt = randInt(115, aInt - 50);
          const a = aInt / 100;
          const b = bInt / 100;
          const diffVal = Math.round((a - b) * 100) / 100;
          return {
            latex: `${String(a).replace('.', '{,}')} - ${String(b).replace('.', '{,}')}`,
            answer: String(diffVal),
            type: 'decimal',
            hint: `${a} - ${b} = ${diffVal}`,
            category: 'decimals'
          };
        } else if (diff === 'hard') {
          const a = randInt(45, 98) / 10;
          const b = randInt(16, a * 10 - 12) / 10;
          const diffVal = Math.round((a - b) * 10) / 10;
          return {
            latex: `${String(a).replace('.', '{,}')} - ${String(b).replace('.', '{,}')}`,
            answer: String(diffVal),
            type: 'decimal',
            hint: `${a} - ${b} = ${diffVal}`,
            category: 'decimals'
          };
        } else {
          const a = randInt(25, 75) / 10;
          const b = randInt(11, a * 10 - 10) / 10;
          const diffVal = Math.round((a - b) * 10) / 10;
          return {
            latex: `${String(a).replace('.', '{,}')} - ${String(b).replace('.', '{,}')}`,
            answer: String(diffVal),
            type: 'decimal',
            hint: `${a} - ${b} = ${diffVal}`,
            category: 'decimals'
          };
        }
      } else if (mode === 'mult') {
        if (diff === 'expert') {
          const a = randInt(12, 45) / 100;
          const b = randInt(2, 8) / 10;
          const prod = Math.round(a * b * 1000) / 1000;
          return {
            latex: `${String(a).replace('.', '{,}')} \\times ${String(b).replace('.', '{,}')}`,
            answer: String(prod),
            type: 'decimal',
            hint: `${a} \\times ${b} = ${prod}`,
            category: 'decimals'
          };
        } else if (diff === 'hard') {
          const a = randInt(12, 35) / 10;
          const b = randInt(3, 8) / 10;
          const prod = Math.round(a * b * 100) / 100;
          return {
            latex: `${String(a).replace('.', '{,}')} \\times ${String(b).replace('.', '{,}')}`,
            answer: String(prod),
            type: 'decimal',
            hint: `${a} \\times ${b} = ${prod}`,
            category: 'decimals'
          };
        } else {
          const a = randInt(2, 9) / 10;
          const b = randInt(2, 6);
          const prod = Math.round(a * b * 10) / 10;
          return {
            latex: `${String(a).replace('.', '{,}')} \\times ${b}`,
            answer: String(prod),
            type: 'decimal',
            hint: `${a} \\times ${b} = ${prod}`,
            category: 'decimals'
          };
        }
      } else {
        if (diff === 'expert') {
          const q = randInt(4, 35);
          const b = randInt(3, 16) / 100;
          const a = Math.round(q * b * 100) / 100;
          return {
            latex: `${String(a).replace('.', '{,}')} \\div ${String(b).replace('.', '{,}')}`,
            answer: String(q),
            type: 'decimal',
            hint: `${a} \\div ${b} = ${q}`,
            category: 'decimals'
          };
        } else if (diff === 'hard') {
          const q = randInt(3, 15);
          const b = randInt(3, 8) / 10;
          const a = Math.round(q * b * 10) / 10;
          return {
            latex: `${String(a).replace('.', '{,}')} \\div ${String(b).replace('.', '{,}')}`,
            answer: String(q),
            type: 'decimal',
            hint: `${a} \\div ${b} = ${q}`,
            category: 'decimals'
          };
        } else {
          const q = randInt(2, 8);
          const b = randInt(2, 5);
          const a = Math.round(q * b * 10) / 10;
          return {
            latex: `${String(a).replace('.', '{,}')} \\div ${b}`,
            answer: String(q / 10),
            type: 'decimal',
            hint: `${a} \\div ${b} = ${q / 10}`,
            category: 'decimals'
          };
        }
      }
    },

    // 6. Степень и корни (числовые: разные степени и корни)
    powers: (diff = 'normal') => {
      if (diff === 'expert') {
        const mode = pick(['fractional_powers', 'negative_powers', 'combined_powers', 'square_big', 'root_big']);
        if (mode === 'fractional_powers') {
          const item = pick([
            { latex: '4^{\\frac{1}{2}}', ans: 2, hint: '4^{1/2} = \\sqrt{4} = 2' },
            { latex: '9^{\\frac{1}{2}}', ans: 3, hint: '9^{1/2} = \\sqrt{9} = 3' },
            { latex: '16^{\\frac{1}{2}}', ans: 4, hint: '16^{1/2} = \\sqrt{16} = 4' },
            { latex: '25^{\\frac{1}{2}}', ans: 5, hint: '25^{1/2} = \\sqrt{25} = 5' },
            { latex: '36^{\\frac{1}{2}}', ans: 6, hint: '36^{1/2} = \\sqrt{36} = 6' },
            { latex: '49^{\\frac{1}{2}}', ans: 7, hint: '49^{1/2} = \\sqrt{49} = 7' },
            { latex: '64^{\\frac{1}{2}}', ans: 8, hint: '64^{1/2} = \\sqrt{64} = 8' },
            { latex: '81^{\\frac{1}{2}}', ans: 9, hint: '81^{1/2} = \\sqrt{81} = 9' },
            { latex: '100^{\\frac{1}{2}}', ans: 10, hint: '100^{1/2} = \\sqrt{100} = 10' },
            { latex: '8^{\\frac{1}{3}}', ans: 2, hint: '8^{1/3} = \\sqrt[3]{8} = 2' },
            { latex: '27^{\\frac{1}{3}}', ans: 3, hint: '27^{1/3} = \\sqrt[3]{27} = 3' },
            { latex: '64^{\\frac{1}{3}}', ans: 4, hint: '64^{1/3} = \\sqrt[3]{64} = 4' },
            { latex: '125^{\\frac{1}{3}}', ans: 5, hint: '125^{1/3} = \\sqrt[3]{125} = 5' },
            { latex: '16^{\\frac{1}{4}}', ans: 2, hint: '16^{1/4} = \\sqrt[4]{16} = 2' },
            { latex: '81^{\\frac{1}{4}}', ans: 3, hint: '81^{1/4} = \\sqrt[4]{81} = 3' },
            { latex: '32^{\\frac{1}{5}}', ans: 2, hint: '32^{1/5} = \\sqrt[5]{32} = 2' },
            { latex: '4^{\\frac{3}{2}}', ans: 8, hint: '4^{3/2} = (\\sqrt{4})^3 = 2^3 = 8' },
            { latex: '9^{\\frac{3}{2}}', ans: 27, hint: '9^{3/2} = (\\sqrt{9})^3 = 3^3 = 27' },
            { latex: '8^{\\frac{2}{3}}', ans: 4, hint: '8^{2/3} = (\\sqrt[3]{8})^2 = 2^2 = 4' },
            { latex: '27^{\\frac{2}{3}}', ans: 9, hint: '27^{2/3} = (\\sqrt[3]{27})^2 = 3^2 = 9' },
            { latex: '64^{\\frac{2}{3}}', ans: 16, hint: '64^{2/3} = (\\sqrt[3]{64})^2 = 4^2 = 16' },
            { latex: '125^{\\frac{2}{3}}', ans: 25, hint: '125^{2/3} = (\\sqrt[3]{125})^2 = 5^2 = 25' },
            { latex: '16^{\\frac{3}{4}}', ans: 8, hint: '16^{3/4} = (\\sqrt[4]{16})^3 = 2^3 = 8' },
            { latex: '32^{\\frac{2}{5}}', ans: 4, hint: '32^{2/5} = (\\sqrt[5]{32})^2 = 2^2 = 4' }
          ]);
          return {
            latex: item.latex,
            answer: String(item.ans),
            type: 'integer',
            hint: item.hint,
            category: 'powers'
          };
        } else if (mode === 'negative_powers') {
          const item = pick([
            { latex: '2^{-1}', ans: '0.5', resNum: 1, resDen: 2, hint: '2^{-1} = \\frac{1}{2} = 0{,}5' },
            { latex: '4^{-1}', ans: '0.25', resNum: 1, resDen: 4, hint: '4^{-1} = \\frac{1}{4} = 0{,}25' },
            { latex: '5^{-1}', ans: '0.2', resNum: 1, resDen: 5, hint: '5^{-1} = \\frac{1}{5} = 0{,}2' },
            { latex: '10^{-1}', ans: '0.1', hint: '10^{-1} = 0{,}1' },
            { latex: '10^{-2}', ans: '0.01', hint: '10^{-2} = 0{,}01' },
            { latex: '10^{-3}', ans: '0.001', hint: '10^{-3} = 0{,}001' },
            { latex: '2^{-2}', ans: '0.25', resNum: 1, resDen: 4, hint: '2^{-2} = \\frac{1}{4} = 0{,}25' },
            { latex: '2^{-3}', ans: '0.125', resNum: 1, resDen: 8, hint: '2^{-3} = \\frac{1}{8} = 0{,}125' },
            { latex: '4^{-\\frac{1}{2}}', ans: '0.5', resNum: 1, resDen: 2, hint: '4^{-1/2} = \\frac{1}{\\sqrt{4}} = 0{,}5' },
            { latex: '8^{-\\frac{1}{3}}', ans: '0.5', resNum: 1, resDen: 2, hint: '8^{-1/3} = \\frac{1}{\\sqrt[3]{8}} = 0{,}5' },
            { latex: '(-2)^4', ans: '16', hint: '(-2)^4 = 16' },
            { latex: '(-2)^5', ans: '-32', hint: '(-2)^5 = -32' },
            { latex: '(-3)^3', ans: '-27', hint: '(-3)^3 = -27' },
            { latex: '(-3)^4', ans: '81', hint: '(-3)^4 = 81' },
            { latex: '(-5)^3', ans: '-125', hint: '(-5)^3 = -125' }
          ]);
          return {
            latex: item.latex,
            answer: item.ans,
            resNum: item.resNum,
            resDen: item.resDen,
            type: item.resNum ? 'fraction' : 'decimal',
            hint: item.hint,
            category: 'powers'
          };
        } else if (mode === 'combined_powers') {
          const item = pick([
            { latex: '\\frac{2^5 \\cdot 2^4}{2^6}', ans: 8, hint: '2^{5+4-6} = 2^3 = 8' },
            { latex: '\\frac{3^7 \\cdot 3^2}{3^6}', ans: 27, hint: '3^{7+2-6} = 3^3 = 27' },
            { latex: '\\frac{(2^3)^2}{2^2}', ans: 16, hint: '2^{6-2} = 2^4 = 16' },
            { latex: '\\frac{(3^2)^3}{3^4}', ans: 9, hint: '3^{6-4} = 3^2 = 9' },
            { latex: '\\sqrt{2^8}', ans: 16, hint: '\\sqrt{2^8} = 2^4 = 16' },
            { latex: '\\sqrt{3^4}', ans: 9, hint: '\\sqrt{3^4} = 3^2 = 9' },
            { latex: '\\sqrt[3]{2^6}', ans: 4, hint: '\\sqrt[3]{2^6} = 2^2 = 4' },
            { latex: '\\sqrt[4]{2^8}', ans: 4, hint: '\\sqrt[4]{2^8} = 2^2 = 4' }
          ]);
          return {
            latex: item.latex,
            answer: String(item.ans),
            type: 'integer',
            hint: item.hint,
            category: 'powers'
          };
        } else if (mode === 'square_big') {
          const n = randInt(21, 32);
          return {
            latex: `${n}^2`,
            answer: String(n * n),
            type: 'integer',
            hint: `${n}^2 = ${n * n}`,
            category: 'powers'
          };
        } else {
          const n = pick([21, 22, 24, 25, 26, 30]);
          return {
            latex: `\\sqrt{${n * n}}`,
            answer: String(n),
            type: 'integer',
            hint: `\\sqrt{${n * n}} = ${n}`,
            category: 'powers'
          };
        }
      } else if (diff === 'hard') {
        const mode = pick(['power_high', 'root_degrees', 'root_mult_div', 'power_rules', 'square_teen']);
        if (mode === 'power_high') {
          const item = pick([
            { latex: '2^6', ans: 64, hint: '2^6 = 64' },
            { latex: '2^7', ans: 128, hint: '2^7 = 128' },
            { latex: '2^8', ans: 256, hint: '2^8 = 256' },
            { latex: '2^9', ans: 512, hint: '2^9 = 512' },
            { latex: '2^{10}', ans: 1024, hint: '2^{10} = 1024' },
            { latex: '3^4', ans: 81, hint: '3^4 = 81' },
            { latex: '3^5', ans: 243, hint: '3^5 = 243' },
            { latex: '4^3', ans: 64, hint: '4^3 = 64' },
            { latex: '4^4', ans: 256, hint: '4^4 = 256' },
            { latex: '5^3', ans: 125, hint: '5^3 = 125' },
            { latex: '5^4', ans: 625, hint: '5^4 = 625' },
            { latex: '6^3', ans: 216, hint: '6^3 = 216' },
            { latex: '10^4', ans: 10000, hint: '10^4 = 10000' },
            { latex: '10^5', ans: 100000, hint: '10^5 = 100000' }
          ]);
          return {
            latex: item.latex,
            answer: String(item.ans),
            type: 'integer',
            hint: item.hint,
            category: 'powers'
          };
        } else if (mode === 'root_degrees') {
          const item = pick([
            { latex: '\\sqrt[3]{216}', ans: 6, hint: '\\sqrt[3]{216} = 6' },
            { latex: '\\sqrt[3]{343}', ans: 7, hint: '\\sqrt[3]{343} = 7' },
            { latex: '\\sqrt[3]{512}', ans: 8, hint: '\\sqrt[3]{512} = 8' },
            { latex: '\\sqrt[3]{729}', ans: 9, hint: '\\sqrt[3]{729} = 9' },
            { latex: '\\sqrt[3]{-8}', ans: -2, hint: '\\sqrt[3]{-8} = -2' },
            { latex: '\\sqrt[3]{-27}', ans: -3, hint: '\\sqrt[3]{-27} = -3' },
            { latex: '\\sqrt[3]{-64}', ans: -4, hint: '\\sqrt[3]{-64} = -4' },
            { latex: '\\sqrt[3]{-125}', ans: -5, hint: '\\sqrt[3]{-125} = -5' },
            { latex: '\\sqrt[4]{256}', ans: 4, hint: '\\sqrt[4]{256} = 4' },
            { latex: '\\sqrt[4]{625}', ans: 5, hint: '\\sqrt[4]{625} = 5' },
            { latex: '\\sqrt[4]{10000}', ans: 10, hint: '\\sqrt[4]{10000} = 10' },
            { latex: '\\sqrt[5]{32}', ans: 2, hint: '\\sqrt[5]{32} = 2' },
            { latex: '\\sqrt[5]{243}', ans: 3, hint: '\\sqrt[5]{243} = 3' },
            { latex: '\\sqrt[5]{-32}', ans: -2, hint: '\\sqrt[5]{-32} = -2' },
            { latex: '\\sqrt[5]{100000}', ans: 10, hint: '\\sqrt[5]{100000} = 10' },
            { latex: '\\sqrt[6]{64}', ans: 2, hint: '\\sqrt[6]{64} = 2' }
          ]);
          return {
            latex: item.latex,
            answer: String(item.ans),
            type: 'integer',
            hint: item.hint,
            category: 'powers'
          };
        } else if (mode === 'root_mult_div') {
          const item = pick([
            { latex: '\\sqrt{2} \\cdot \\sqrt{8}', ans: 4, hint: '\\sqrt{2 \\cdot 8} = \\sqrt{16} = 4' },
            { latex: '\\sqrt{3} \\cdot \\sqrt{12}', ans: 6, hint: '\\sqrt{3 \\cdot 12} = \\sqrt{36} = 6' },
            { latex: '\\sqrt{5} \\cdot \\sqrt{20}', ans: 10, hint: '\\sqrt{5 \\cdot 20} = \\sqrt{100} = 10' },
            { latex: '\\sqrt{2} \\cdot \\sqrt{18}', ans: 6, hint: '\\sqrt{2 \\cdot 18} = \\sqrt{36} = 6' },
            { latex: '\\sqrt{2} \\cdot \\sqrt{32}', ans: 8, hint: '\\sqrt{2 \\cdot 32} = \\sqrt{64} = 8' },
            { latex: '\\sqrt{3} \\cdot \\sqrt{27}', ans: 9, hint: '\\sqrt{3 \\cdot 27} = \\sqrt{81} = 9' },
            { latex: '\\frac{\\sqrt{50}}{\\sqrt{2}}', ans: 5, hint: '\\sqrt{50/2} = \\sqrt{25} = 5' },
            { latex: '\\frac{\\sqrt{75}}{\\sqrt{3}}', ans: 5, hint: '\\sqrt{75/3} = \\sqrt{25} = 5' },
            { latex: '\\frac{\\sqrt{48}}{\\sqrt{3}}', ans: 4, hint: '\\sqrt{48/3} = \\sqrt{16} = 4' },
            { latex: '\\frac{\\sqrt{72}}{\\sqrt{2}}', ans: 6, hint: '\\sqrt{72/2} = \\sqrt{36} = 6' },
            { latex: '\\sqrt[3]{2} \\cdot \\sqrt[3]{4}', ans: 2, hint: '\\sqrt[3]{2 \\cdot 4} = \\sqrt[3]{8} = 2' },
            { latex: '\\sqrt[3]{9} \\cdot \\sqrt[3]{3}', ans: 3, hint: '\\sqrt[3]{9 \\cdot 3} = \\sqrt[3]{27} = 3' },
            { latex: '\\sqrt[3]{25} \\cdot \\sqrt[3]{5}', ans: 5, hint: '\\sqrt[3]{25 \\cdot 5} = \\sqrt[3]{125} = 5' }
          ]);
          return {
            latex: item.latex,
            answer: String(item.ans),
            type: 'integer',
            hint: item.hint,
            category: 'powers'
          };
        } else if (mode === 'power_rules') {
          const item = pick([
            { latex: '2^3 \\cdot 2^2', ans: 32, hint: '2^{3+2} = 2^5 = 32' },
            { latex: '2^4 \\cdot 2^2', ans: 64, hint: '2^{4+2} = 2^6 = 64' },
            { latex: '\\frac{2^7}{2^4}', ans: 8, hint: '2^{7-4} = 2^3 = 8' },
            { latex: '\\frac{3^5}{3^2}', ans: 27, hint: '3^{5-2} = 3^3 = 27' },
            { latex: '(2^2)^3', ans: 64, hint: '2^{2 \\cdot 3} = 2^6 = 64' },
            { latex: '(3^2)^2', ans: 81, hint: '3^{2 \\cdot 2} = 3^4 = 81' }
          ]);
          return {
            latex: item.latex,
            answer: String(item.ans),
            type: 'integer',
            hint: item.hint,
            category: 'powers'
          };
        } else {
          const n = randInt(11, 20);
          return {
            latex: `${n}^2`,
            answer: String(n * n),
            type: 'integer',
            hint: `${n}^2 = ${n * n}`,
            category: 'powers'
          };
        }
      } else {
        // Базовый (normal): квадраты, корни, кубы, степени 2, 3, 10, корень 4 степени, степени 0 и 1
        const mode = pick(['square_table', 'root_table', 'cube_table', 'cbrt_table', 'power_of_2', 'power_of_3', 'power_of_10', 'root_4_basic', 'zero_one_power']);
        if (mode === 'square_table') {
          const n = randInt(2, 15);
          return {
            latex: `${n}^2`,
            answer: String(n * n),
            type: 'integer',
            hint: `${n}^2 = ${n * n}`,
            category: 'powers'
          };
        } else if (mode === 'root_table') {
          const n = randInt(2, 15);
          return {
            latex: `\\sqrt{${n * n}}`,
            answer: String(n),
            type: 'integer',
            hint: `\\sqrt{${n * n}} = ${n}`,
            category: 'powers'
          };
        } else if (mode === 'cube_table') {
          const n = randInt(2, 5);
          return {
            latex: `${n}^3`,
            answer: String(n * n * n),
            type: 'integer',
            hint: `${n}^3 = ${n * n * n}`,
            category: 'powers'
          };
        } else if (mode === 'cbrt_table') {
          const n = pick([2, 3, 4, 5, 10]);
          return {
            latex: `\\sqrt[3]{${n * n * n}}`,
            answer: String(n),
            type: 'integer',
            hint: `\\sqrt[3]{${n * n * n}} = ${n}`,
            category: 'powers'
          };
        } else if (mode === 'power_of_2') {
          const p = randInt(3, 5);
          const ans = Math.pow(2, p);
          return {
            latex: `2^${p}`,
            answer: String(ans),
            type: 'integer',
            hint: `2^${p} = ${ans}`,
            category: 'powers'
          };
        } else if (mode === 'power_of_3') {
          const p = randInt(2, 3);
          const ans = Math.pow(3, p);
          return {
            latex: `3^${p}`,
            answer: String(ans),
            type: 'integer',
            hint: `3^${p} = ${ans}`,
            category: 'powers'
          };
        } else if (mode === 'power_of_10') {
          const p = randInt(2, 3);
          const ans = Math.pow(10, p);
          return {
            latex: `10^${p}`,
            answer: String(ans),
            type: 'integer',
            hint: `10^${p} = ${ans}`,
            category: 'powers'
          };
        } else if (mode === 'root_4_basic') {
          const item = pick([
            { latex: '\\sqrt[4]{16}', ans: 2, hint: '\\sqrt[4]{16} = 2' },
            { latex: '\\sqrt[4]{81}', ans: 3, hint: '\\sqrt[4]{81} = 3' }
          ]);
          return {
            latex: item.latex,
            answer: String(item.ans),
            type: 'integer',
            hint: item.hint,
            category: 'powers'
          };
        } else {
          const isZero = Math.random() < 0.5;
          const a = randInt(2, 50);
          if (isZero) {
            return {
              latex: `${a}^0`,
              answer: '1',
              type: 'integer',
              hint: `Любое число в нулевой степени равно 1: ${a}^0 = 1`,
              category: 'powers'
            };
          } else {
            return {
              latex: `${a}^1`,
              answer: String(a),
              type: 'integer',
              hint: `${a}^1 = ${a}`,
              category: 'powers'
            };
          }
        }
      }
    },

    // 6b. Степени и корни с переменными (неизвестными)
    algebra_powers: (diff = 'normal') => {
      const v = 'x';
      if (diff === 'expert') {
        const mode = pick(['negative_exp', 'fractional_exp', 'coeff_roots', 'complex_fractions']);
        if (mode === 'negative_exp') {
          const submode = pick(['mult_neg', 'div_neg', 'pow_neg', 'zero_exp']);
          if (submode === 'mult_neg') {
            const a = randInt(2, 5);
            const b = randInt(a + 1, a + 4);
            const exp = a - b;
            const ans = formatAlgebraAnswer(1, exp, v);
            return {
              latex: `${v}^{${a}} \\cdot ${v}^{-${b}}`,
              answer: ans,
              type: 'algebra',
              variable: v,
              resCoeff: 1,
              resExp: exp,
              hint: `${v}^{${a}} \\cdot ${v}^{-${b}} = ${v}^{${a} + (-${b})} = ${ans}`,
              category: 'algebra_powers'
            };
          } else if (submode === 'div_neg') {
            const a = randInt(2, 4);
            const b = randInt(a + 2, a + 5);
            const exp = a - b;
            const ans = formatAlgebraAnswer(1, exp, v);
            return {
              latex: `\\frac{${v}^{${a}}}{${v}^{${b}}}`,
              answer: ans,
              type: 'algebra',
              variable: v,
              resCoeff: 1,
              resExp: exp,
              hint: `\\frac{${v}^{${a}}}{${v}^{${b}}} = ${v}^{${a}-${b}} = ${ans}`,
              category: 'algebra_powers'
            };
          } else if (submode === 'pow_neg') {
            const a = randInt(2, 3);
            const b = randInt(2, 3);
            const exp = -a * b;
            const ans = formatAlgebraAnswer(1, exp, v);
            return {
              latex: `(${v}^{-${a}})^{${b}}`,
              answer: ans,
              type: 'algebra',
              variable: v,
              resCoeff: 1,
              resExp: exp,
              hint: `(${v}^{-${a}})^{${b}} = ${v}^{-${a} \\cdot ${b}} = ${ans}`,
              category: 'algebra_powers'
            };
          } else {
            const a = randInt(2, 7);
            return {
              latex: `\\frac{${v}^{${a}}}{${v}^{${a}}}`,
              answer: '1',
              type: 'algebra',
              variable: v,
              resCoeff: 1,
              resExp: 0,
              hint: `\\frac{${v}^{${a}}}{${v}^{${a}}} = ${v}^{${a}-${a}} = ${v}^0 = 1`,
              category: 'algebra_powers'
            };
          }
        } else if (mode === 'fractional_exp') {
          const item = pick([
            { latex: `${v}^{\\frac{1}{2}} \\cdot ${v}^{\\frac{1}{2}}`, coeff: 1, exp: 1, hint: `${v}^{1/2 + 1/2} = ${v}^1 = ${v}` },
            { latex: `${v}^{\\frac{1}{3}} \\cdot ${v}^{\\frac{2}{3}}`, coeff: 1, exp: 1, hint: `${v}^{1/3 + 2/3} = ${v}^1 = ${v}` },
            { latex: `${v}^{\\frac{3}{2}} \\cdot ${v}^{\\frac{1}{2}}`, coeff: 1, exp: 2, hint: `${v}^{3/2 + 1/2} = ${v}^2` },
            { latex: `\\frac{${v}^{\\frac{5}{2}}}{${v}^{\\frac{1}{2}}}`, coeff: 1, exp: 2, hint: `${v}^{5/2 - 1/2} = ${v}^2` },
            { latex: `(${v}^{\\frac{1}{2}})^4`, coeff: 1, exp: 2, hint: `${v}^{1/2 \\cdot 4} = ${v}^2` },
            { latex: `(${v}^{\\frac{2}{3}})^3`, coeff: 1, exp: 2, hint: `${v}^{2/3 \\cdot 3} = ${v}^2` },
            { latex: `(${v}^6)^{\\frac{1}{2}}`, coeff: 1, exp: 3, hint: `${v}^{6 \\cdot 1/2} = ${v}^3` },
            { latex: `(${v}^8)^{\\frac{3}{4}}`, coeff: 1, exp: 6, hint: `${v}^{8 \\cdot 3/4} = ${v}^6` }
          ]);
          const ans = formatAlgebraAnswer(item.coeff, item.exp, v);
          return {
            latex: item.latex,
            answer: ans,
            type: 'algebra',
            variable: v,
            resCoeff: item.coeff,
            resExp: item.exp,
            hint: item.hint,
            category: 'algebra_powers'
          };
        } else if (mode === 'coeff_roots') {
          const item = pick([
            { latex: `\\sqrt{4${v}^6}`, coeff: 2, exp: 3, hint: '\\sqrt{4} \\cdot \\sqrt{x^6} = 2x^3' },
            { latex: `\\sqrt{9${v}^8}`, coeff: 3, exp: 4, hint: '\\sqrt{9} \\cdot \\sqrt{x^8} = 3x^4' },
            { latex: `\\sqrt{16${v}^4}`, coeff: 4, exp: 2, hint: '\\sqrt{16} \\cdot \\sqrt{x^4} = 4x^2' },
            { latex: `\\sqrt{25${v}^6}`, coeff: 5, exp: 3, hint: '\\sqrt{25} \\cdot \\sqrt{x^6} = 5x^3' },
            { latex: `\\sqrt[3]{8${v}^6}`, coeff: 2, exp: 2, hint: '\\sqrt[3]{8} \\cdot \\sqrt[3]{x^6} = 2x^2' },
            { latex: `\\sqrt[3]{27${v}^9}`, coeff: 3, exp: 3, hint: '\\sqrt[3]{27} \\cdot \\sqrt[3]{x^9} = 3x^3' },
            { latex: `\\sqrt[4]{16${v}^8}`, coeff: 2, exp: 2, hint: '\\sqrt[4]{16} \\cdot \\sqrt[4]{x^8} = 2x^2' }
          ]);
          const ans = formatAlgebraAnswer(item.coeff, item.exp, v);
          return {
            latex: item.latex,
            answer: ans,
            type: 'algebra',
            variable: v,
            resCoeff: item.coeff,
            resExp: item.exp,
            hint: item.hint,
            category: 'algebra_powers'
          };
        } else {
          const item = pick([
            { latex: `\\frac{(2${v}^2)^3}{4${v}^4}`, coeff: 2, exp: 2, hint: '\\frac{8x^6}{4x^4} = 2x^2' },
            { latex: `\\frac{\\sqrt{16${v}^8}}{2${v}^2}`, coeff: 2, exp: 2, hint: '\\frac{4x^4}{2x^2} = 2x^2' },
            { latex: `\\frac{6${v}^7}{2${v}^3 \\cdot ${v}^2}`, coeff: 3, exp: 2, hint: '\\frac{6x^7}{2x^5} = 3x^2' },
            { latex: `\\frac{(3${v}^3)^2}{3${v}^4}`, coeff: 3, exp: 2, hint: '\\frac{9x^6}{3x^4} = 3x^2' }
          ]);
          const ans = formatAlgebraAnswer(item.coeff, item.exp, v);
          return {
            latex: item.latex,
            answer: ans,
            type: 'algebra',
            variable: v,
            resCoeff: item.coeff,
            resExp: item.exp,
            hint: item.hint,
            category: 'algebra_powers'
          };
        }
      } else if (diff === 'hard') {
        const mode = pick(['coeff_mult', 'coeff_div', 'coeff_pow', 'higher_roots', 'combined_ops']);
        if (mode === 'coeff_mult') {
          const c1 = randInt(2, 5);
          const c2 = randInt(2, 4);
          const a = randInt(1, 4);
          const b = randInt(1, 4);
          const coeff = c1 * c2;
          const exp = a + b;
          const aStr = a === 1 ? v : `${v}^{${a}}`;
          const bStr = b === 1 ? v : `${v}^{${b}}`;
          const ans = formatAlgebraAnswer(coeff, exp, v);
          return {
            latex: `${c1}${aStr} \\cdot ${c2}${bStr}`,
            answer: ans,
            type: 'algebra',
            variable: v,
            resCoeff: coeff,
            resExp: exp,
            hint: `(${c1} \\cdot ${c2})(${aStr} \\cdot ${bStr}) = ${ans}`,
            category: 'algebra_powers'
          };
        } else if (mode === 'coeff_div') {
          const q = randInt(2, 5);
          const c2 = randInt(2, 4);
          const c1 = q * c2;
          const a = randInt(3, 7);
          const b = randInt(1, a - 1);
          const exp = a - b;
          const bStr = b === 1 ? `${c2}${v}` : `${c2}${v}^{${b}}`;
          const ans = formatAlgebraAnswer(q, exp, v);
          return {
            latex: `\\frac{${c1}${v}^{${a}}}{${bStr}}`,
            answer: ans,
            type: 'algebra',
            variable: v,
            resCoeff: q,
            resExp: exp,
            hint: `\\frac{${c1}}{${c2}} \\cdot \\frac{${v}^{${a}}}{${v}^{${b}}} = ${ans}`,
            category: 'algebra_powers'
          };
        } else if (mode === 'coeff_pow') {
          const isCube = Math.random() < 0.35;
          const c = isCube ? 2 : randInt(2, 3);
          const b = isCube ? 3 : 2;
          const a = randInt(2, 4);
          const coeff = Math.pow(c, b);
          const exp = a * b;
          const ans = formatAlgebraAnswer(coeff, exp, v);
          return {
            latex: `(${c}${v}^{${a}})^{${b}}`,
            answer: ans,
            type: 'algebra',
            variable: v,
            resCoeff: coeff,
            resExp: exp,
            hint: `${c}^${b} \\cdot (${v}^{${a}})^{${b}} = ${coeff}${v}^{${exp}} = ${ans}`,
            category: 'algebra_powers'
          };
        } else if (mode === 'higher_roots') {
          const deg = pick([4, 5, 6]);
          if (deg === 4) {
            const k = randInt(1, 4);
            const ans = formatAlgebraAnswer(1, k, v);
            return {
              latex: `\\sqrt[4]{${v}^{${4 * k}}}`,
              answer: ans,
              type: 'algebra',
              variable: v,
              resCoeff: 1,
              resExp: k,
              hint: `\\sqrt[4]{${v}^{${4 * k}}} = ${v}^{${4 * k} / 4} = ${ans}`,
              category: 'algebra_powers'
            };
          } else if (deg === 5) {
            const k = randInt(1, 3);
            const ans = formatAlgebraAnswer(1, k, v);
            return {
              latex: `\\sqrt[5]{${v}^{${5 * k}}}`,
              answer: ans,
              type: 'algebra',
              variable: v,
              resCoeff: 1,
              resExp: k,
              hint: `\\sqrt[5]{${v}^{${5 * k}}} = ${v}^{${5 * k} / 5} = ${ans}`,
              category: 'algebra_powers'
            };
          } else {
            const ans = formatAlgebraAnswer(1, 2, v);
            return {
              latex: `\\sqrt[6]{${v}^{12}}`,
              answer: ans,
              type: 'algebra',
              variable: v,
              resCoeff: 1,
              resExp: 2,
              hint: `\\sqrt[6]{${v}^{12}} = ${v}^{12 / 6} = ${ans}`,
              category: 'algebra_powers'
            };
          }
        } else {
          const a = randInt(2, 4);
          const b = randInt(2, 4);
          const c = randInt(1, a + b - 1);
          const exp = a + b - c;
          const ans = formatAlgebraAnswer(1, exp, v);
          return {
            latex: `\\frac{${v}^{${a}} \\cdot ${v}^{${b}}}{${v}^{${c}}}`,
            answer: ans,
            type: 'algebra',
            variable: v,
            resCoeff: 1,
            resExp: exp,
            hint: `\\frac{${v}^{${a}+${b}}}{${v}^{${c}}} = ${v}^{${a + b - c}} = ${ans}`,
            category: 'algebra_powers'
          };
        }
      } else {
        // Базовый (normal): умножение x^a * x^b, деление x^a / x^b, степень (x^a)^b, корни sqrt(x^2k), cbrt(x^3k)
        const mode = pick(['mult', 'div', 'pow_pow', 'sqrt', 'cbrt']);
        if (mode === 'mult') {
          const a = randInt(1, 4);
          const b = randInt(2, 5);
          const exp = a + b;
          const aStr = a === 1 ? v : `${v}^{${a}}`;
          const ans = formatAlgebraAnswer(1, exp, v);
          return {
            latex: `${aStr} \\cdot ${v}^{${b}}`,
            answer: ans,
            type: 'algebra',
            variable: v,
            resCoeff: 1,
            resExp: exp,
            hint: `${aStr} \\cdot ${v}^{${b}} = ${v}^{${a}+${b}} = ${ans}`,
            category: 'algebra_powers'
          };
        } else if (mode === 'div') {
          const a = randInt(3, 7);
          const b = randInt(1, a - 1);
          const exp = a - b;
          const bStr = b === 1 ? v : `${v}^{${b}}`;
          const ans = formatAlgebraAnswer(1, exp, v);
          return {
            latex: `\\frac{${v}^{${a}}}{${bStr}}`,
            answer: ans,
            type: 'algebra',
            variable: v,
            resCoeff: 1,
            resExp: exp,
            hint: `\\frac{${v}^{${a}}}{${bStr}} = ${v}^{${a}-${b}} = ${ans}`,
            category: 'algebra_powers'
          };
        } else if (mode === 'pow_pow') {
          const a = randInt(2, 4);
          const b = randInt(2, 3);
          const exp = a * b;
          const ans = formatAlgebraAnswer(1, exp, v);
          return {
            latex: `(${v}^{${a}})^{${b}}`,
            answer: ans,
            type: 'algebra',
            variable: v,
            resCoeff: 1,
            resExp: exp,
            hint: `(${v}^{${a}})^{${b}} = ${v}^{${a} \\cdot ${b}} = ${ans}`,
            category: 'algebra_powers'
          };
        } else if (mode === 'sqrt') {
          const k = randInt(1, 5);
          const p = 2 * k;
          const ans = formatAlgebraAnswer(1, k, v);
          return {
            latex: `\\sqrt{${v}^{${p}}}`,
            answer: ans,
            type: 'algebra',
            variable: v,
            resCoeff: 1,
            resExp: k,
            hint: `\\sqrt{${v}^{${p}}} = ${v}^{${p} / 2} = ${ans}`,
            category: 'algebra_powers'
          };
        } else {
          const k = randInt(1, 4);
          const p = 3 * k;
          const ans = formatAlgebraAnswer(1, k, v);
          return {
            latex: `\\sqrt[3]{${v}^{${p}}}`,
            answer: ans,
            type: 'algebra',
            variable: v,
            resCoeff: 1,
            resExp: k,
            hint: `\\sqrt[3]{${v}^{${p}}} = ${v}^{${p} / 3} = ${ans}`,
            category: 'algebra_powers'
          };
        }
      }
    },

    // 7. Отрицательные числа
    negatives: (diff = 'normal') => {
      if (diff === 'expert') {
        const mode = pick(['tri_neg', 'mult_neg_2d', 'div_neg_2d']);
        if (mode === 'tri_neg') {
          const a = randInt(15, 55);
          const b = randInt(15, 65);
          const c = randInt(12, 45);
          const ans = -a + b - c;
          return {
            latex: `-${a} + ${b} - ${c}`,
            answer: String(ans),
            type: 'integer',
            hint: `-${a} + ${b} = ${-a + b}, затем ${-a + b} - ${c} = ${ans}`,
            category: 'negatives'
          };
        } else if (mode === 'mult_neg_2d') {
          const a = randInt(11, 16);
          const b = randInt(4, 9);
          return {
            latex: `(-${a}) \\times (-${b})`,
            answer: String(a * b),
            type: 'integer',
            hint: `(-${a}) \\times (-${b}) = ${a * b}`,
            category: 'negatives'
          };
        } else {
          const b = randInt(6, 12);
          const q = randInt(7, 18);
          const a = b * q;
          return {
            latex: `-${a} \\div (-${b})`,
            answer: String(q),
            type: 'integer',
            hint: `-${a} \\div (-${b}) = ${q}`,
            category: 'negatives'
          };
        }
      } else if (diff === 'hard') {
        // Продвинутый: двузначные числа, скобки и двойные минусы
        const mode = pick(['add_neg', 'sub_neg', 'mult_neg', 'div_neg']);
        if (mode === 'add_neg') {
          const a = randInt(18, 75);
          const b = randInt(15, 65);
          return {
            latex: `-${a} + ${b}`,
            answer: String(-a + b),
            type: 'integer',
            hint: `-${a} + ${b} = ${-a + b}`,
            category: 'negatives'
          };
        } else if (mode === 'sub_neg') {
          const a = randInt(15, 65);
          const b = randInt(12, 55);
          return {
            latex: `${a} - (-${b})`,
            answer: String(a + b),
            type: 'integer',
            hint: `${a} - (-${b}) = ${a} + ${b} = ${a + b}`,
            category: 'negatives'
          };
        } else if (mode === 'mult_neg') {
          const a = randInt(4, 12);
          const b = randInt(4, 9);
          return {
            latex: `(-${a}) \\times (-${b})`,
            answer: String(a * b),
            type: 'integer',
            hint: `(-${a}) \\times (-${b}) = ${a * b}`,
            category: 'negatives'
          };
        } else {
          const b = randInt(4, 9);
          const q = randInt(6, 15);
          const a = b * q;
          return {
            latex: `-${a} \\div ${b}`,
            answer: String(-q),
            type: 'integer',
            hint: `-${a} \\div ${b} = ${-q}`,
            category: 'negatives'
          };
        }
      } else {
        // Базовый: однозначные числа
        const mode = pick(['add_basic', 'sub_basic', 'mult_basic', 'div_basic']);
        if (mode === 'add_basic') {
          const a = randInt(3, 9);
          const b = randInt(2, 9);
          return {
            latex: `-${a} + ${b}`,
            answer: String(-a + b),
            type: 'integer',
            hint: `-${a} + ${b} = ${-a + b}`,
            category: 'negatives'
          };
        } else if (mode === 'sub_basic') {
          const a = randInt(2, 9);
          const b = randInt(4, 9);
          return {
            latex: `${a} - ${b}`,
            answer: String(a - b),
            type: 'integer',
            hint: `${a} - ${b} = ${a - b}`,
            category: 'negatives'
          };
        } else if (mode === 'mult_basic') {
          const a = randInt(2, 7);
          const b = randInt(2, 7);
          return {
            latex: `-${a} \\times ${b}`,
            answer: String(-a * b),
            type: 'integer',
            hint: `-${a} \\times ${b} = ${-a * b}`,
            category: 'negatives'
          };
        } else {
          const b = randInt(2, 6);
          const q = randInt(2, 6);
          const a = b * q;
          return {
            latex: `-${a} \\div ${b}`,
            answer: String(-q),
            type: 'integer',
            hint: `-${a} \\div ${b} = ${-q}`,
            category: 'negatives'
          };
        }
      }
    },

    // 8. Микс (все типы)
    mix: (diff = 'normal') => {
      const cat = pick(['addsub2', 'addsub3', 'multdiv', 'fractions', 'decimals', 'powers', 'algebra_powers', 'negatives']);
      const gen = GENERATORS[cat];
      return gen ? gen(diff) : GENERATORS.addsub2(diff);
    }
  };

  /**
   * Проверка ответа пользователя
   * Возвращает { isCorrect: boolean, expectedDisplay: string, userNormalized: string }
   */
  function checkAnswer(question, userInput) {
    if (!userInput || !userInput.trim()) {
      return { isCorrect: false, expectedDisplay: question.answer, userNormalized: '' };
    }
    const clean = userInput.trim().replace(/\s+/g, '').replace(',', '.');

    // Проверка алгебраических выражений (степени и корни с переменными)
    if (question.type === 'algebra' || /[a-z]/i.test(question.answer) || /[a-z]/i.test(clean)) {
      const expVar = question.variable || 'x';
      const expCoeff = question.resCoeff !== undefined ? question.resCoeff : (parseAlgebraicTerm(question.answer)?.coeff ?? 1);
      const expPower = question.resExp !== undefined ? question.resExp : (parseAlgebraicTerm(question.answer)?.exp ?? 1);

      const uParsed = parseAlgebraicTerm(clean);
      if (!uParsed) {
        return { isCorrect: false, expectedDisplay: question.answer, userNormalized: clean };
      }

      // Если степень 0, ответ — просто число
      if (expPower === 0) {
        const isCorrect = uParsed.exp === 0 && Math.abs(uParsed.coeff - expCoeff) < 1e-5;
        return {
          isCorrect,
          expectedDisplay: String(expCoeff),
          userNormalized: clean
        };
      }

      const varMatch = !uParsed.variable || uParsed.variable === expVar;
      const isCorrect = varMatch &&
        Math.abs(uParsed.coeff - expCoeff) < 1e-5 &&
        uParsed.exp === expPower;

      return {
        isCorrect,
        expectedDisplay: question.answer,
        userNormalized: clean
      };
    }

    // Проверка обыкновенной дроби
    if (question.type === 'fraction') {
      const expectedNum = question.resNum;
      const expectedDen = question.resDen;

      // Если введено n/d
      if (clean.includes('/')) {
        const parts = clean.split('/');
        const uNum = Number(parts[0]);
        const uDen = Number(parts[1]);
        if (!Number.isFinite(uNum) || !Number.isFinite(uDen) || uDen === 0) {
          return { isCorrect: false, expectedDisplay: question.answer, userNormalized: clean };
        }
        const uReduced = reduceFraction(uNum, uDen);
        const isCorrect = uReduced.num === expectedNum && uReduced.den === expectedDen;
        return {
          isCorrect,
          expectedDisplay: expectedDen === 1 ? String(expectedNum) : `${expectedNum}/${expectedDen}`,
          userNormalized: `${uReduced.num}/${uReduced.den}`
        };
      }

      // Если введено целое число (например, результат 1 или 2)
      if (expectedDen === 1) {
        const uVal = Number(clean);
        return {
          isCorrect: uVal === expectedNum,
          expectedDisplay: String(expectedNum),
          userNormalized: clean
        };
      }

      // Если ученик ввёл десятичную дробь вместо обыкновенной (например, 0.5 вместо 1/2)
      const uVal = Number(clean);
      if (Number.isFinite(uVal)) {
        const expectedVal = expectedNum / expectedDen;
        const isClose = Math.abs(uVal - expectedVal) < 1e-4;
        return {
          isCorrect: isClose,
          expectedDisplay: `${expectedNum}/${expectedDen}`,
          userNormalized: clean
        };
      }

      return { isCorrect: false, expectedDisplay: question.answer, userNormalized: clean };
    }

    // Если введено n/d для десятичной дроби (например, 1/2 для 0.5 или 1/4 для 0.25)
    if (clean.includes('/')) {
      const parts = clean.split('/');
      const uNum = Number(parts[0]);
      const uDen = Number(parts[1]);
      if (Number.isFinite(uNum) && Number.isFinite(uDen) && uDen !== 0) {
        const uVal = uNum / uDen;
        const expVal = Number(question.answer.replace(',', '.'));
        if (Number.isFinite(expVal) && Math.abs(uVal - expVal) < 1e-4) {
          return { isCorrect: true, expectedDisplay: question.answer, userNormalized: clean };
        }
      }
    }

    // Проверка десятичных дробей и целых чисел
    const uNum = Number(clean);
    const expNum = Number(question.answer.replace(',', '.'));

    if (Number.isFinite(uNum) && Number.isFinite(expNum)) {
      const isCorrect = Math.abs(uNum - expNum) < 1e-5;
      return {
        isCorrect,
        expectedDisplay: question.answer,
        userNormalized: clean
      };
    }

    return { isCorrect: false, expectedDisplay: question.answer, userNormalized: clean };
  }

  // Звуковой движок через Web Audio API (без внешних файлов)
  let audioCtx = null;
  function playSound(type) {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'wrong') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(146.83, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      }
    } catch (e) {}
  }

  function generateBatch(cat = 'addsub2', count = 20, diff = 'normal') {
    const list = [];
    const seen = new Set();
    const maxAttempts = count * 6;
    let attempts = 0;
    while (list.length < count && attempts < maxAttempts) {
      attempts++;
      const q = api.generateQuestion(cat, diff);
      if (!seen.has(q.latex)) {
        seen.add(q.latex);
        q.id = list.length + 1;
        q.index = list.length;
        list.push(q);
      }
    }
    while (list.length < count) {
      const q = api.generateQuestion(cat, diff);
      q.id = list.length + 1;
      q.index = list.length;
      list.push(q);
    }
    return list;
  }

  const api = {
    GENERATORS,
    generateQuestion: (cat = 'addsub2', diff = 'normal') => {
      const gen = GENERATORS[cat] || GENERATORS.addsub2;
      return gen(diff);
    },
    generateBatch,
    checkAnswer,
    playSound,
    reduceFraction,
    gcd
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.MathTasksTrainer = api;
  }
})();
