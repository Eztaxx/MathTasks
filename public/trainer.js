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

    // 6. Степень и корни (Квадраты, корни, кубы)
    powers: (diff = 'normal') => {
      if (diff === 'expert') {
        const mode = pick(['square_big', 'root_big', 'cube', 'diff_sq']);
        if (mode === 'square_big') {
          const n = randInt(21, 35);
          return {
            latex: `${n}^2`,
            answer: String(n * n),
            type: 'integer',
            hint: `${n}^2 = ${n * n}`,
            category: 'powers'
          };
        } else if (mode === 'root_big') {
          const n = pick([21, 22, 24, 25, 26, 30, 32, 35, 40, 50]);
          return {
            latex: `\\sqrt{${n * n}}`,
            answer: String(n),
            type: 'integer',
            hint: `\\sqrt{${n * n}} = ${n}`,
            category: 'powers'
          };
        } else if (mode === 'cube') {
          const n = randInt(6, 10);
          return {
            latex: `${n}^3`,
            answer: String(n * n * n),
            type: 'integer',
            hint: `${n}^3 = ${n * n * n}`,
            category: 'powers'
          };
        } else {
          const a = randInt(18, 32);
          const b = a - 1;
          const ans = a * a - b * b;
          return {
            latex: `${a}^2 - ${b}^2`,
            answer: String(ans),
            type: 'integer',
            hint: `(${a} - ${b})(${a} + ${b}) = ${ans}`,
            category: 'powers'
          };
        }
      } else if (diff === 'hard') {
        const mode = pick(['square_teen', 'root_teen', 'cube_small']);
        if (mode === 'square_teen') {
          const n = randInt(11, 20);
          return {
            latex: `${n}^2`,
            answer: String(n * n),
            type: 'integer',
            hint: `${n}^2 = ${n * n}`,
            category: 'powers'
          };
        } else if (mode === 'root_teen') {
          const n = randInt(11, 20);
          return {
            latex: `\\sqrt{${n * n}}`,
            answer: String(n),
            type: 'integer',
            hint: `\\sqrt{${n * n}} = ${n}`,
            category: 'powers'
          };
        } else {
          const n = randInt(3, 5);
          return {
            latex: `${n}^3`,
            answer: String(n * n * n),
            type: 'integer',
            hint: `${n}^3 = ${n * n * n}`,
            category: 'powers'
          };
        }
      } else {
        // Базовый: табличные квадраты и корни от 2 до 10
        const mode = pick(['square_table', 'root_table', 'cube_table']);
        if (mode === 'square_table') {
          const n = randInt(3, 10);
          return {
            latex: `${n}^2`,
            answer: String(n * n),
            type: 'integer',
            hint: `${n}^2 = ${n * n}`,
            category: 'powers'
          };
        } else if (mode === 'root_table') {
          const n = randInt(3, 10);
          return {
            latex: `\\sqrt{${n * n}}`,
            answer: String(n),
            type: 'integer',
            hint: `\\sqrt{${n * n}} = ${n}`,
            category: 'powers'
          };
        } else {
          const n = randInt(2, 3);
          return {
            latex: `${n}^3`,
            answer: String(n * n * n),
            type: 'integer',
            hint: `${n}^3 = ${n * n * n}`,
            category: 'powers'
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
      const cat = pick(['addsub2', 'addsub3', 'multdiv', 'fractions', 'decimals', 'powers', 'negatives']);
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
