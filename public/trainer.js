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
    addsub2: () => {
      const isAdd = Math.random() < 0.55;
      if (isAdd) {
        const a = randInt(15, 89);
        const b = randInt(14, 99 - a + 15);
        const ans = a + b;
        const roundB = Math.round(b / 10) * 10;
        const diffB = roundB - b;
        const hint = diffB !== 0
          ? `${a} + ${b} = (${a} + ${roundB}) ${diffB > 0 ? '-' : '+'} ${Math.abs(diffB)} = ${a + roundB} ${diffB > 0 ? '-' : '+'} ${Math.abs(diffB)} = ${ans}`
          : `${a} + ${b} = ${ans}`;
        return {
          latex: `${a} + ${b}`,
          answer: String(ans),
          type: 'integer',
          hint: hint,
          category: 'addsub2'
        };
      } else {
        const a = randInt(35, 99);
        const b = randInt(12, a - 5);
        const ans = a - b;
        const roundB = Math.round(b / 10) * 10;
        const diffB = roundB - b;
        const hint = diffB !== 0
          ? `${a} - ${b} = (${a} - ${roundB}) ${diffB > 0 ? '+' : '-'} ${Math.abs(diffB)} = ${a - roundB} ${diffB > 0 ? '+' : '-'} ${Math.abs(diffB)} = ${ans}`
          : `${a} - ${b} = ${ans}`;
        return {
          latex: `${a} - ${b}`,
          answer: String(ans),
          type: 'integer',
          hint: hint,
          category: 'addsub2'
        };
      }
    },

    // 2. Трёхзначные числа: сложение и вычитание
    addsub3: () => {
      const isAdd = Math.random() < 0.5;
      if (isAdd) {
        const a = randInt(120, 680);
        const b = randInt(110, 480);
        const ans = a + b;
        const roundB = Math.round(b / 100) * 100;
        const diffB = roundB - b;
        const hint = diffB !== 0
          ? `${a} + ${b} = (${a} + ${roundB}) ${diffB > 0 ? '-' : '+'} ${Math.abs(diffB)} = ${a + roundB} ${diffB > 0 ? '-' : '+'} ${Math.abs(diffB)} = ${ans}`
          : `${a} + ${b} = ${ans}`;
        return {
          latex: `${a} + ${b}`,
          answer: String(ans),
          type: 'integer',
          hint: hint,
          category: 'addsub3'
        };
      } else {
        const a = randInt(320, 995);
        const b = randInt(115, a - 45);
        const ans = a - b;
        const roundB = Math.round(b / 100) * 100;
        const diffB = roundB - b;
        const hint = diffB !== 0
          ? `${a} - ${b} = (${a} - ${roundB}) ${diffB > 0 ? '+' : '-'} ${Math.abs(diffB)} = ${a - roundB} ${diffB > 0 ? '+' : '-'} ${Math.abs(diffB)} = ${ans}`
          : `${a} - ${b} = ${ans}`;
        return {
          latex: `${a} - ${b}`,
          answer: String(ans),
          type: 'integer',
          hint: hint,
          category: 'addsub3'
        };
      }
    },

    // 3. Умножение и деление
    multdiv: () => {
      const op = pick(['mult_small', 'mult_special', 'div_exact']);
      if (op === 'mult_special') {
        const factor = pick([5, 11, 15, 25]);
        let a;
        let hint = '';
        if (factor === 5) {
          a = randInt(12, 88) * 2;
          hint = `${a} \\times 5 = (${a} \\times 10) / 2 = ${a * 10} / 2 = ${a * 5}`;
        } else if (factor === 11) {
          a = randInt(12, 85);
          hint = `${a} \\times 11 = (${a} \\times 10) + ${a} = ${a * 10} + ${a} = ${a * 11}`;
        } else if (factor === 25) {
          a = randInt(4, 36) * 4;
          hint = `${a} \\times 25 = (${a} \\times 100) / 4 = ${a * 100} / 4 = ${a * 25}`;
        } else {
          a = randInt(12, 48);
          hint = `${a} \\times 15 = (${a} \\times 10) + (${a} \\times 5) = ${a * 10} + ${a * 5} = ${a * 15}`;
        }
        return {
          latex: `${a} \\times ${factor}`,
          answer: String(a * factor),
          type: 'integer',
          hint: hint,
          category: 'multdiv'
        };
      } else if (op === 'div_exact') {
        const b = randInt(3, 9);
        const q = randInt(12, 65);
        const a = b * q;
        const tens = Math.floor(q / 10) * 10 * b;
        const ones = a - tens;
        const hint = `${a} \\div ${b} = (${tens} + ${ones}) \\div ${b} = ${tens / b} + ${ones / b} = ${q}`;
        return {
          latex: `${a} \\div ${b}`,
          answer: String(q),
          type: 'integer',
          hint: hint,
          category: 'multdiv'
        };
      } else {
        const a = randInt(12, 35);
        const b = randInt(3, 9);
        const ans = a * b;
        const tens = Math.floor(a / 10) * 10;
        const ones = a % 10;
        const hint = `${a} \\times ${b} = (${tens} \\times ${b}) + (${ones} \\times ${b}) = ${tens * b} + ${ones * b} = ${ans}`;
        return {
          latex: `${a} \\times ${b}`,
          answer: String(ans),
          type: 'integer',
          hint: hint,
          category: 'multdiv'
        };
      }
    },

    // 4. Обыкновенные дроби (+, -, *, /)
    fractions: () => {
      const mode = pick(['add_same', 'add_diff', 'sub_diff', 'mult', 'div']);

      if (mode === 'add_same') {
        const d = pick([3, 4, 5, 6, 7, 8, 9, 10]);
        const n1 = randInt(1, d - 2);
        const n2 = randInt(1, d - n1);
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
          hint: `При одинаковых знаменателях складываем числители: \\frac{${n1} + ${n2}}{${d}} = \\frac{${n1 + n2}}{${d}}${res.den !== d ? ` = \\frac{${res.num}}{${res.den}}` : ''}`,
          category: 'fractions'
        };
      } else if (mode === 'add_diff') {
        const d1 = pick([2, 3, 4, 5, 6]);
        const d2 = pick([2, 3, 4, 5, 6].filter(x => x !== d1));
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
          hint: `Общий знаменатель: ${lcm}. Доп. множители: ${m1} и ${m2}.\n\\frac{${n1 * m1} + ${n2 * m2}}{${lcm}} = \\frac{${numSum}}{${lcm}}${res.den !== lcm ? ` = \\frac{${res.num}}{${res.den}}` : ''}`,
          category: 'fractions'
        };
      } else if (mode === 'sub_diff') {
        const d1 = pick([2, 3, 4, 5, 6]);
        const d2 = pick([2, 3, 4, 5, 6].filter(x => x !== d1));
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
          hint: `Общий знаменатель: ${lcm}.\n\\frac{${n1 * m1} - ${n2 * m2}}{${lcm}} = \\frac{${numDiff}}{${lcm}}${res.den !== lcm ? ` = \\frac{${res.num}}{${res.den}}` : ''}`,
          category: 'fractions'
        };
      } else if (mode === 'mult') {
        const d1 = pick([2, 3, 4, 5, 7]);
        const d2 = pick([2, 3, 4, 5, 7]);
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
          hint: `Перемножаем числители и знаменатели:\n\\frac{${n1} \\times ${n2}}{${d1} \\times ${d2}} = \\frac{${numP}}{${denP}}${res.den !== denP ? ` = \\frac{${res.num}}{${res.den}}` : ''}`,
          category: 'fractions'
        };
      } else {
        const d1 = pick([2, 3, 4, 5]);
        const d2 = pick([2, 3, 4, 5]);
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
          hint: `Умножаем на перевёрнутую дробь:\n\\frac{${n1}}{${d1}} \\times \\frac{${d2}}{${n2}} = \\frac{${numP}}{${denP}}${res.den !== denP ? ` = \\frac{${res.num}}{${res.den}}` : ''}`,
          category: 'fractions'
        };
      }
    },

    // 5. Десятичные дроби
    decimals: () => {
      const mode = pick(['add', 'sub', 'mult', 'div']);
      if (mode === 'add') {
        const aInt = randInt(12, 95);
        const bInt = randInt(11, 88);
        const a = aInt / 10;
        const b = bInt / 10;
        const sum = Math.round((a + b) * 10) / 10;
        return {
          latex: `${String(a).replace('.', '{,}')} + ${String(b).replace('.', '{,}')}`,
          answer: String(sum),
          type: 'decimal',
          hint: `${a} + ${b} = ${(aInt + bInt) / 10}`,
          category: 'decimals'
        };
      } else if (mode === 'sub') {
        const aInt = randInt(35, 99);
        const bInt = randInt(12, aInt - 5);
        const a = aInt / 10;
        const b = bInt / 10;
        const diff = Math.round((a - b) * 10) / 10;
        return {
          latex: `${String(a).replace('.', '{,}')} - ${String(b).replace('.', '{,}')}`,
          answer: String(diff),
          type: 'decimal',
          hint: `${a} - ${b} = ${(aInt - bInt) / 10}`,
          category: 'decimals'
        };
      } else if (mode === 'mult') {
        const isFloatFloat = Math.random() < 0.6;
        if (isFloatFloat) {
          const a = randInt(2, 9) / 10;
          const b = randInt(3, 9) / 10;
          const prod = Math.round(a * b * 100) / 100;
          return {
            latex: `${String(a).replace('.', '{,}')} \\times ${String(b).replace('.', '{,}')}`,
            answer: String(prod),
            type: 'decimal',
            hint: `${Math.round(a*10)} \\times ${Math.round(b*10)} = ${Math.round(a*10)*Math.round(b*10)}, сдвигаем запятую на 2 знака: ${prod}`,
            category: 'decimals'
          };
        } else {
          const a = randInt(12, 35) / 10;
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
        const q = randInt(2, 9);
        const b = randInt(3, 9) / 10;
        const a = Math.round(q * b * 10) / 10;
        return {
          latex: `${String(a).replace('.', '{,}')} \\div ${String(b).replace('.', '{,}')}`,
          answer: String(q),
          type: 'decimal',
          hint: `Умножим делимое и делитель на 10: ${Math.round(a * 10)} \\div ${Math.round(b * 10)} = ${q}`,
          category: 'decimals'
        };
      }
    },

    // 6. Микс
    mix: () => {
      const cat = pick(['addsub2', 'addsub3', 'multdiv', 'fractions', 'decimals']);
      return GENERATORS[cat]();
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

  function generateBatch(cat = 'addsub2', count = 20) {
    const list = [];
    const seen = new Set();
    const maxAttempts = count * 4;
    let attempts = 0;
    while (list.length < count && attempts < maxAttempts) {
      attempts++;
      const q = api.generateQuestion(cat);
      if (!seen.has(q.latex)) {
        seen.add(q.latex);
        q.id = list.length + 1;
        q.index = list.length;
        list.push(q);
      }
    }
    while (list.length < count) {
      const q = api.generateQuestion(cat);
      q.id = list.length + 1;
      q.index = list.length;
      list.push(q);
    }
    return list;
  }

  const api = {
    GENERATORS,
    generateQuestion: (cat = 'addsub2') => {
      const gen = GENERATORS[cat] || GENERATORS.addsub2;
      return gen();
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
