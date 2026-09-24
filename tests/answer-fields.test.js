import { describe, expect, it } from 'vitest';
import { answerFields, buildTaskPrompt, checkAnswerFields, checkTaskAnswer, conditionPrompt } from '../public/lib.js';

/* Строки ответов взяты из базы как есть: разбор должен держать именно их,
   а не причёсанные примеры. */
const TASK_710 = '$AD = 4\\sqrt{3}\\text{ см}$, $BC = 6\\sqrt{3}\\text{ см}$';
const VOLUME = '$V = 48\\text{ см}^3$, $S_{\\text{бок}} = 60\\text{ см}^2$';
const ROOTS_AND = '$x = -12\\text{ и }x = 12$';

describe('поля ответа по величинам', () => {
  it('две величины — два поля с подписями и единицами', () => {
    expect(answerFields(TASK_710)).toEqual([
      { label: '$AD =$', unit: 'см', value: '4\\sqrt{3}\\text{ см}' },
      { label: '$BC =$', unit: 'см', value: '6\\sqrt{3}\\text{ см}' }
    ]);
  });

  it('степень в единице читается: см² и см³', () => {
    expect(answerFields(VOLUME).map(field => field.unit)).toEqual(['см³', 'см²']);
    expect(answerFields(VOLUME)[1].label).toBe('$S_{\\text{бок}} =$');
  });

  it('части, разделённые словом «и», тоже дают поля', () => {
    expect(answerFields(ROOTS_AND)).toHaveLength(2);
  });

  it('одна величина — полей нет, поле остаётся одно', () => {
    expect(answerFields('$x = 10$')).toEqual([]);
    expect(answerFields('$15\\text{ €}$')).toEqual([]);
  });

  /* Значения без имён — тоже поля: ученик видит, сколько чисел ждут от него,
     и пишет их от меньшего к большему. Проверка при этом любой порядок
     принимает — подсказка про порядок нужна, чтобы не гадать. */
  it('значения без подписей дают столько полей, сколько значений', () => {
    const fields = answerFields('$3; 5$');
    expect(fields).toHaveLength(2);
    expect(fields.every(field => field.ordered && field.label === '')).toBe(true);
  });

  it('пять корней — пять полей', () => {
    expect(answerFields('$-9; -2; 0; 4; 7$')).toHaveLength(5);
  });

  it('точка на плоскости — поля по координатам', () => {
    expect(answerFields('$(3; 8)$')).toEqual([
      { label: '$x =$', unit: '', value: '3' },
      { label: '$y =$', unit: '', value: '8' }
    ]);
  });

  it('у названной точки в подписи её имя', () => {
    expect(answerFields('$B(3; 4)$').map(field => field.label)).toEqual(['$x_{B} =$', '$y_{B} =$']);
  });

  it('промежуток — поля под границы, с именем переменной и знаком строгости', () => {
    expect(answerFields('$x \\in (-3; 5]$').map(field => field.label)).toEqual(['$x >$', '$x \\leq$']);
  });

  it('объединение промежутков полями не раскладывается', () => {
    expect(answerFields('$x \\in (-\\infty; -3] \\cup [4; +\\infty)$')).toEqual([]);
  });

  it('ответ с «или» — полей нет: какое значение в какое поле, неизвестно', () => {
    expect(answerFields('$x = 2$ или $x = 3$')).toEqual([]);
  });

  it('частей больше четырёх — полей нет: строка удобнее', () => {
    expect(answerFields('$a = 1$, $b = 2$, $c = 3$, $d = 4$, $e = 5$')).toEqual([]);
  });

  it('ответ, который не сверить автоматически, полей не получает', () => {
    expect(answerFields('$\\text{Доказано}$')).toEqual([]);
  });
});

describe('проверка по полям', () => {
  it('всё верно — задача засчитана', () => {
    const result = checkAnswerFields(['4\\sqrt{3}', '6\\sqrt{3}'], TASK_710);
    expect(result.correct).toEqual([true, true]);
    expect(result.allCorrect).toBe(true);
  });

  it('одно поле неверное — видно какое, задача не засчитана', () => {
    const result = checkAnswerFields(['4\\sqrt{3}', '6'], TASK_710);
    expect(result.correct).toEqual([true, false]);
    expect(result.allCorrect).toBe(false);
  });

  it('ученик дописал единицу — это тот же ответ', () => {
    expect(checkAnswerFields(['4\\sqrt{3} см', '6\\sqrt{3} см'], TASK_710).allCorrect).toBe(true);
  });

  it('значения переставлены местами — не засчитано: величины разные', () => {
    const result = checkAnswerFields(['6\\sqrt{3}', '4\\sqrt{3}'], TASK_710);
    expect(result.allCorrect).toBe(false);
  });

  it('пустое поле — не верно и не засчитано', () => {
    const result = checkAnswerFields(['4\\sqrt{3}', ''], TASK_710);
    expect(result.correct).toEqual([true, false]);
    expect(result.allCorrect).toBe(false);
    expect(result.filled).toBe(1);
  });

  it('склейка значений проходит и обычную проверку — подстраховка работает', () => {
    expect(checkTaskAnswer('4\\sqrt{3}; 6\\sqrt{3}', TASK_710)).toBe(true);
  });

  it('корни одной неизвестной можно писать в любом порядке', () => {
    const answer = '$x_1 = 3$, $x_2 = -1$';
    expect(checkAnswerFields(['-1', '3'], answer).allCorrect).toBe(true);
  });
});

/* Счётное слово в конце ответа — такая же единица, как «см»: ученик пишет
   число, а проверка его принимает. Латиницу так снимать нельзя — «3ab» это
   произведение переменных. */
describe('счётные слова в ответе', () => {
  it('число со счётным словом принимается без слова', () => {
    expect(checkTaskAnswer('19', '$19\\text{ дней}$')).toBe(true);
    expect(checkTaskAnswer('5', '$5\\text{ книг}$')).toBe(true);
    expect(checkTaskAnswer('12', '$12\\text{ рейсов}$')).toBe(true);
  });

  it('со словом тоже принимается', () => {
    expect(checkTaskAnswer('19 дней', '$19\\text{ дней}$')).toBe(true);
  });

  it('неверное число не проходит', () => {
    expect(checkTaskAnswer('20', '$19\\text{ дней}$')).toBe(false);
  });

  it('буквенный множитель не считается счётным словом', () => {
    expect(checkTaskAnswer('3', '$3ab$')).toBe(false);
    expect(checkTaskAnswer('2', '$2\\pi$')).toBe(false);
  });
});

/* Промпт для ИИ должен требовать тот же вид ответа, который сайт умеет
   разложить на поля: иначе новые задачи снова придут голыми числами. */
describe('промпт для ИИ про ответы', () => {
  it('называет правило про имя величины и разбор на поля', () => {
    const prompt = buildTaskPrompt({ grade: 8, count: 5 });
    expect(prompt).toContain('Называй величину, которую спрашивают');
    expect(prompt).toContain('Несколько величин — через запятую');
    expect(prompt).toContain('по возрастанию');
    expect(prompt).toContain('промежуток');
  });

  it('образец строки показывает ответ с именем величины', () => {
    expect(buildTaskPrompt({ grade: 8, count: 1 })).toContain('c = 10');
  });
});

/* Задача 848: в ответе две разные величины без имён — масштаб и время.
   Поля нужны, а подсказка про возрастание тут была бы неверной: порядок
   задаёт условие. */
describe('разные величины подряд', () => {
  const SCALE_TIME = '$1 : 2\\,000\\,000$; $1\\text{ ч } 30\\text{ мин}$';

  it('даёт поле на каждую величину', () => {
    expect(answerFields(SCALE_TIME)).toHaveLength(2);
  });

  it('порядок «по возрастанию» не обещает: величины разные', () => {
    expect(answerFields(SCALE_TIME).every(field => field.ordered === false)).toBe(true);
    expect(answerFields('$3; 5$').every(field => field.ordered === true)).toBe(true);
  });

  /* У составного времени подписываем поле минутами: ученик пишет одно
     число, а сверка принимает и «1 ч 30 мин», и «1,5 ч». */
  it('время подписано минутами, обычная величина — своей единицей', () => {
    expect(answerFields(SCALE_TIME)[1].unit).toBe('мин');
    expect(answerFields('$12\\text{ см}$, $7\\text{ кг}$')[0].unit).toBe('см');
  });

  it('одно число в поле времени принимается как минуты', () => {
    expect(checkAnswerFields(['1 : 2\\,000\\,000', '90'], SCALE_TIME).allCorrect).toBe(true);
  });

  it('значения принимаются по полям', () => {
    const result = checkAnswerFields(['1 : 2\\,000\\,000', '1\\text{ ч } 30\\text{ мин}'], SCALE_TIME);
    expect(result.allCorrect).toBe(true);
  });
});

/* Время ученик записывает как привык. Все записи ниже — одно и то же,
   и проверка обязана принимать любую: иначе верный ответ не засчитан
   из-за формы. */
describe('время в разных записях', () => {
  const COMPOUND = '$1\\text{ ч } 30\\text{ мин}$';
  const MINUTES = '$90\\text{ мин}$';

  it('«1 ч 30 мин», «90 мин» и «1,5 ч» — одно и то же', () => {
    expect(checkTaskAnswer('1 ч 30 мин', MINUTES)).toBe(true);
    expect(checkTaskAnswer('1,5 ч', MINUTES)).toBe(true);
    expect(checkTaskAnswer('90 мин', COMPOUND)).toBe(true);
    expect(checkTaskAnswer('1,5 часа', COMPOUND)).toBe(true);
  });

  it('по-латышски тоже: stundas и minūtes', () => {
    expect(checkTaskAnswer('1 st 30 min', MINUTES)).toBe(true);
    expect(checkTaskAnswer('90 min', COMPOUND)).toBe(true);
  });

  it('одно число — это минуты, как подписано у поля', () => {
    expect(checkTaskAnswer('90', COMPOUND)).toBe(true);
    expect(checkTaskAnswer('90', MINUTES)).toBe(true);
  });

  it('неверное время не проходит', () => {
    expect(checkTaskAnswer('1 ч 20 мин', MINUTES)).toBe(false);
    expect(checkTaskAnswer('80', COMPOUND)).toBe(false);
  });

  /* Единицы снимались подряд, и «1 ч 30 мин» склеивалось в «130»:
     неверные 130 минут засчитывались. */
  it('«130» и «1 30» — не полтора часа', () => {
    expect(checkTaskAnswer('130', COMPOUND)).toBe(false);
    expect(checkTaskAnswer('1 30', COMPOUND)).toBe(false);
  });

  it('«1 ч 30» без слова «мин» — это полтора часа', () => {
    expect(checkTaskAnswer('1 ч 30', COMPOUND)).toBe(true);
    expect(checkTaskAnswer('1 h 30', COMPOUND)).toBe(true);
    expect(checkTaskAnswer('1 ч 30', MINUTES)).toBe(true);
  });

  it('одно число — в самой мелкой единице составного времени', () => {
    expect(checkTaskAnswer('150', '$2\\text{ мин } 30\\text{ с}$')).toBe(true);
  });

  // Поле подписано часами — одно число в нём тоже часы, а не минуты.
  it('у времени в одной единице число читается в этой единице', () => {
    const HOURS = '$\\text{Время} = 3\\text{ ч}$';
    expect(checkTaskAnswer('3', HOURS)).toBe(true);
    expect(checkTaskAnswer('180 мин', HOURS)).toBe(true);
    expect(checkTaskAnswer('180', HOURS)).toBe(false);
  });

  it('не время трогать нельзя: «2 кг» и «120 мин» — разные ответы', () => {
    expect(checkTaskAnswer('2 кг', MINUTES)).toBe(false);
  });
});

/* Подпись словами — то, как автор называет величину в условии. Без неё
   ученик гадает, что вписывать: «Масштаб карты» или «Время». */
describe('подписи словами', () => {
  const NAMED = 'Масштаб карты = 1 : 2\\,000\\,000; Время = 90 мин';

  it('подпись из нескольких слов не ломает разбор', () => {
    const fields = answerFields(NAMED);
    expect(fields.map(field => field.label)).toEqual(['Масштаб карты =', 'Время =']);
  });

  it('значения при этом проверяются по полям', () => {
    expect(checkAnswerFields(['1 : 2\\,000\\,000', '90'], NAMED).allCorrect).toBe(true);
  });
});

/* Границы промежутка сверяем по отдельности: пересборка строки круглыми
   скобками не совпадала с «[1; 4)», и верный ответ отмечался ошибкой. */
describe('границы промежутка со скобками', () => {
  it('квадратная скобка не мешает засчитать ответ', () => {
    expect(checkAnswerFields(['1', '4'], '$k \\in [1; 4)$').allCorrect).toBe(true);
    expect(checkAnswerFields(['-2', '5'], '$x \\in [-2; 5]$').allCorrect).toBe(true);
  });

  it('неверная граница видна по своему полю', () => {
    const result = checkAnswerFields(['1', '5'], '$k \\in [1; 4)$');
    expect(result.correct).toEqual([true, false]);
    expect(result.allCorrect).toBe(false);
  });

  it('бесконечную границу полем не вводят — ответ остаётся строкой', () => {
    expect(answerFields('$x \\in [2; +\\infty)$')).toEqual([]);
  });
});

/* Единицу ученик обычно не пишет: поле ею подписано. Эти записи ломались —
   составную единицу список снимал по частям, процент приходил из LaTeX с
   обратным слэшем, а доллара в списке не было вовсе. */
describe('единицы, которые ученик не набирает', () => {
  it('составная единица: «10» к эталону «10 км/ч»', () => {
    expect(checkTaskAnswer('10', "$10\\text{ км/ч}$")).toBe(true);
    expect(checkTaskAnswer('10', "$10\\text{ km/h}$")).toBe(true);
    expect(checkTaskAnswer('12', "$12\\text{ м/с}$")).toBe(true);
  });

  it('процент: «75» к эталону «75 %»', () => {
    expect(checkTaskAnswer('75', "$75\\%$")).toBe(true);
    expect(checkTaskAnswer('75 %', "$75\\%$")).toBe(true);
  });

  it('доллары наравне с евро', () => {
    expect(checkTaskAnswer('132', "$132\\text{ USD}$")).toBe(true);
    expect(checkTaskAnswer('22', "$22\\text{ EUR}$")).toBe(true);
  });

  it('другая единица ответом не считается', () => {
    expect(checkTaskAnswer('10 кг', "$10\\text{ км/ч}$")).toBe(false);
  });
});

/* Подпись из условия для задач «вычислите» и «упростите»: имени величины в
   ответе нет, зато есть само выражение — оно и стоит перед полем. В ответ
   это не пишется: там выражение стало бы тождеством и сломало сверку. */
describe('подпись из условия', () => {
  it('одно выражение в условии становится подписью', () => {
    expect(conditionPrompt("Разложите на множители многочлен $x^3 - 3x^2 - 4x + 12$.")).toBe("$x^3 - 3x^2 - 4x + 12 =$");
    expect(conditionPrompt("Упростите выражение $(4x - 3y)^2$.")).toBe("$(4x - 3y)^2 =$");
  });

  it('две формулы — подписи нет: неясно, какую спрашивают', () => {
    expect(conditionPrompt("Упростите выражение $(2x - 3)^2$ и найдите его значение при $x = -1$.")).toBe('');
  });

  it('вопрос не про выражение — подписи нет', () => {
    expect(conditionPrompt("Найдите периметр треугольника со сторонами $3$ см.")).toBe('');
  });

  it('уравнение подписью не становится: в нём уже есть «=»', () => {
    expect(conditionPrompt("Вычислите значение $x^2 = 16$.")).toBe('');
  });

  it('латышское условие тоже понимается', () => {
    expect(conditionPrompt("Vienkāršojiet izteiksmi $(4x - 3y)^2$.")).toBe("$(4x - 3y)^2 =$");
  });
});

/* Условия с оговорками («при x > 0», «a ≠ 2») и вопросом «найдите значение
   выражения» тоже дают подпись, а «упростите и найдите значение при x = …»
   — нет: там ждут число, не выражение. */
describe('подпись из условия: оговорки и подстановка', () => {
  it('оговорка «при x ≥ 0» не мешает', () => {
    expect(conditionPrompt("Представьте иррациональное выражение $\\sqrt{x \\cdot \\sqrt{x}}$ при $x \\ge 0$ в виде степени с основанием $x$.")).toBe("$\\sqrt{x \\cdot \\sqrt{x}} =$");
  });

  it('«найдите значение выражения» с условием-равенством рядом', () => {
    expect(conditionPrompt("Известно, что $x + y = 5$. Найдите значение выражения $x^2 + 2xy + y^2$.")).toBe("$x^2 + 2xy + y^2 =$");
  });

  it('подстановка значения — подписи нет', () => {
    expect(conditionPrompt("Упростите выражение $(2x - 3)^2 - (2x + 1)(2x - 1)$ и найдите его значение при $x = -\\frac{1}{3}$.")).toBe('');
  });
});

/* Латышские ответы пишут метры и литры латиницей: «200 m²», «60000 l».
   В списке единиц были только «м» и «л», и число без единицы к таким
   эталонам не подходило. */
describe('латинские метры и литры', () => {
  it('«200» к эталону «200 m²»', () => {
    expect(checkTaskAnswer('200', "$S = 200\\text{ m}^2$")).toBe(true);
  });

  it('«60000» к эталону «60000 l»', () => {
    expect(checkTaskAnswer('60000', "$V = 60000\\text{ l}$")).toBe(true);
  });
});
