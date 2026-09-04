#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CLI-генератор математических задач по стандарту Skola2030 (1–12 классы)
Поддерживает генерацию через Google Gemini API или встроенный параметризованный движок.
Результат можно экспортировать в JSON для админ-панели (кнопка «Импорт JSON») или в SQL.
"""

import os
import sys
import json
import random
import argparse
import urllib.request
import urllib.error

# Настройка UTF-8 для Windows консоли
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')


# Подключение глоссария терминов для Skola2030
GLOSSARY_LV = [
    ("Решите уравнение", "Atrisiniet vienādojumu"),
    ("Решить уравнение", "Atrisināt vienādojumu"),
    ("Решите квадратное уравнение", "Atrisiniet kvadrātvienādojumu"),
    ("Решите систему уравнений", "Atrisiniet vienādojumu sistēmu"),
    ("Решите неравенство", "Atrisiniet nevienādību"),
    ("Вычислите значение суммы", "Aprēķiniet summas vērtību"),
    ("Вычислите значение разности", "Aprēķiniet starpības vērtību"),
    ("Вычислите значение выражения", "Aprēķiniet izteiksmes vērtību"),
    ("Вычислите значение", "Aprēķiniet vērtību"),
    ("Вычислите", "Aprēķiniet"),
    ("Упростите выражение", "Vienkāršojiet izteiksmi"),
    ("Найдите корни уравнения", "Atrodiet vienādojuma saknes"),
    ("Найдите корень уравнения", "Atrodiet vienādojuma sakni"),
    ("В прямоугольном треугольнике катеты равны", "Taisnleņķa trijstūrī katetes ir"),
    ("Найдите гипотенузу", "Aprēķiniet hipotenūzu"),
    ("Найдите площадь", "Aprēķiniet laukumu"),
    ("Найдите периметр", "Aprēķiniet perimetru"),
    ("По теореме Пифагора", "Pēc Pitagora teorēmas"),
    ("По формуле корней", "Pēc kvadrātvienādojuma sakņu formulas"),
    ("Дискриминант", "Diskriminants"),
    ("Ответ:", "Atbilde:")
]

def translate_to_lv(text):
    if not text:
        return ""
    res = text
    for ru, lv in GLOSSARY_LV:
        res = res.replace(ru, lv)
    return res

def generate_builtin_task(grade=7, topic="Квадратные уравнения", difficulty="Средний"):
    """Автономная параметризованная генерация математических задач"""
    grade = int(grade)

    if grade <= 4:
        # Начальная школа: арифметика и текстовые задачи
        if grade == 1:
            a, b = random.randint(1, 6), random.randint(1, 4)
            ans = a + b
            cond_ru = f"Вычислите значение суммы: $${a} + {b} = ?$$"
            cond_lv = f"Aprēķiniet summas vērtību: $${a} + {b} = ?$$"
            sol_ru = f"Складываем числа: ${a} + {b} = {ans}$. Ответ: ${ans}$."
            sol_lv = f"Saskaitām skaitļus: ${a} + {b} = {ans}$. Atbilde: ${ans}$."
            title_ru = f"Сложение в пределах 10 ({a} + {b})"
            title_lv = f"Saskaitīšana 10 apjomā ({a} + {b})"
        elif grade == 2:
            a, b = random.randint(11, 45), random.randint(11, 45)
            ans = a + b
            cond_ru = f"Вычислите значение суммы двузначных чисел: $${a} + {b} = ?$$"
            cond_lv = f"Aprēķiniet divciparu skaitļu summu: $${a} + {b} = ?$$"
            sol_ru = f"Сложим по разрядам: десятки $({a//10*10} + {b//10*10} = {(a//10 + b//10)*10})$ и единицы $({a%10} + {b%10} = {a%10 + b%10})$. Итого: ${ans}$."
            sol_lv = f"Saskaitām desmitus un vienus: rezultāts ir ${ans}$."
            title_ru = f"Сложение двузначных чисел ({a} + {b})"
            title_lv = f"Divciparu skaitļu saskaitīšana ({a} + {b})"
        elif grade == 3:
            a, b = random.randint(3, 9), random.randint(3, 9)
            ans = a * b
            cond_ru = f"Длина прямоугольника равна ${a}\\text{{ см}}$, а ширина — ${b}\\text{{ см}}$. Вычислите площадь прямоугольника."
            cond_lv = f"Taisnstūra garums ir ${a}\\text{{ cm}}$, bet platums — ${b}\\text{{ cm}}$. Aprēķiniet taisnstūra laukumu."
            sol_ru = f"Площадь прямоугольника вычисляется по формуле $S = a \\cdot b$. $S = {a} \\cdot {b} = {ans}\\text{{ см}}^2$."
            sol_lv = f"Taisnstūra laukuma formula ir $S = a \\cdot b$. $S = {a} \\cdot {b} = {ans}\\text{{ cm}}^2$."
            title_ru = f"Площадь прямоугольника ({a} × {b})"
            title_lv = f"Taisnstūra laukums ({a} × {b})"
            ans = f"$S = {ans}\\text{{ см}}^2$"
        else:
            # 4 класс: дроби с одинаковыми знаменателями
            denom = random.choice([7, 8, 9, 11, 12])
            n1 = random.randint(1, denom // 2)
            n2 = random.randint(1, denom - n1 - 1)
            ans_n = n1 + n2
            cond_ru = f"Вычислите значение суммы обыкновенных дробей: $$\\frac{{{n1}}}{{{denom}}} + \\frac{{{n2}}}{{{denom}}} = ?$$"
            cond_lv = f"Aprēķiniet parasto daļu summu: $$\\frac{{{n1}}}{{{denom}}} + \\frac{{{n2}}}{{{denom}}} = ?$$"
            sol_ru = f"При сложении дробей с одинаковыми знаменателями складываются их числители: $\\frac{{{n1} + {n2}}}{{{denom}}} = \\frac{{{ans_n}}}{{{denom}}}$."
            sol_lv = f"Saskaitot daļas ar vienādiem saucējiem, saskaita to skaitītājus: $\\frac{{{n1} + {n2}}}{{{denom}}} = \\frac{{{ans_n}}}{{{denom}}}$."
            title_ru = f"Сложение обыкновенных дробей со знаменателем {denom}"
            title_lv = f"Parasto daļu saskaitīšana ar saucēju {denom}"
            ans = f"$\\frac{{{ans_n}}}{{{denom}}}$"

    elif grade in [5, 6]:
        # Дроби, проценты, отрицательные числа
        if grade == 5:
            pct = random.choice([10, 20, 25, 50])
            total = random.choice([80, 120, 160, 200, 300])
            ans_val = (total * pct) // 100
            cond_ru = f"В магазине скидка ${pct}\\%$ на товар стоимостью ${total}\\text{{ евро}}$. Сколько евро составляет скидка?"
            cond_lv = f"Veikalā ir ${pct}\\%$ atlaide precei ar cenu ${total}\\text{{ eiro}}$. Cik eiro ir atlaide?"
            sol_ru = f"Найдем ${pct}\\%$ от ${total}$: $\\frac{{{pct}}}{{100}} \\cdot {total} = {ans_val}\\text{{ евро}}$."
            sol_lv = f"Aprēķinām ${pct}\\%$ no ${total}$: $\\frac{{{pct}}}{{100}} \\cdot {total} = {ans_val}\\text{{ eiro}}$."
            title_ru = f"Нахождение {pct}% от величины"
            title_lv = f"{pct}% aprēķināšana no lieluma"
            ans = f"${ans_val}\\text{{ евро}}$"
        else:
            # 6 класс: действия с отрицательными числами
            a = random.randint(-25, -5)
            b = random.randint(10, 35)
            res = a + b
            cond_ru = f"Вычислите значение суммы чисел с разными знаками: $${a} + ({b}) = ?$$"
            cond_lv = f"Aprēķiniet skaitļu ar dažādām zīmēm summu: $${a} + ({b}) = ?$$"
            sol_ru = f"Так как числа имеют разные знаки, из большего модуля вычитаем меньший и ставим знак большего: ${b} - {abs(a)} = {res}$."
            sol_lv = f"Tā kā skaitļiem ir dažādas zīmes, no lielākā moduļa atņem mazāko: ${b} - {abs(a)} = {res}$."
            title_ru = f"Сложение чисел с разными знаками ({a} + {b})"
            title_lv = f"Darbības ar negatīviem skaitļiem ({a} + {b})"
            ans = f"${res}$"

    elif grade in [7, 8]:
        # Линейные уравнения, степени, теорема Пифагора
        if grade == 7:
            x_ans = random.randint(2, 9)
            k = random.randint(2, 5)
            b = random.randint(3, 15)
            right = k * x_ans + b
            cond_ru = f"Решите линейное уравнение: $${k}x + {b} = {right}$$"
            cond_lv = f"Atrisiniet lineāru vienādojumu: $${k}x + {b} = {right}$$"
            sol_ru = f"Перенесём слагаемое ${b}$ в правую часть с противоположным знаком:\n$${k}x = {right} - {b}$$\n$${k}x = {right - b}$$\nРазделим обе части на ${k}$:\n$$x = \\frac{{{right - b}}}{{{k}}} = {x_ans}$$\nОтвет: $x = {x_ans}$."
            sol_lv = f"Pārnesam ${b}$ uz labo pusi:\n$${k}x = {right - b}$$\nIzdalām ar ${k}$:\n$$x = {x_ans}$$\nAtbilde: $x = {x_ans}$."
            title_ru = f"Линейное уравнение ({k}x + {b} = {right})"
            title_lv = f"Lineārs vienādojums ({k}x + {b} = {right})"
            ans = f"$x = {x_ans}$"
        else:
            # 8 класс: теорема Пифагора
            triplets = [(3, 4, 5), (6, 8, 10), (5, 12, 13), (8, 15, 17), (9, 12, 15)]
            a, b, c = random.choice(triplets)
            cond_ru = f"В прямоугольном треугольнике катеты равны $a = {a}\\text{{ см}}$ и $b = {b}\\text{{ см}}$. Найдите длину гипотенузы $c$."
            cond_lv = f"Taisnleņķa trijstūrī katetes ir $a = {a}\\text{{ cm}}$ un $b = {b}\\text{{ cm}}$. Aprēķiniet hipotenūzas $c$ garumu."
            sol_ru = f"По теореме Пифагора $c^2 = a^2 + b^2$:\n$$c^2 = {a}^2 + {b}^2 = {a**2} + {b**2} = {c**2}$$\n$$c = \\sqrt{{{c**2}}} = {c}\\text{{ см}}$$.\nОтвет: $c = {c}\\text{{ см}}$."
            sol_lv = f"Pēc Pitagora teorēmas $c^2 = a^2 + b^2$:\n$$c^2 = {a}^2 + {b}^2 = {c**2}$$\n$$c = {c}\\text{{ cm}}$$.\nAtbilde: $c = {c}\\text{{ cm}}$."
            title_ru = f"Теорема Пифагора: поиск гипотенузы ({a}, {b})"
            title_lv = f"Pitagora teorēma: hipotenūzas aprēķināšana ({a}, {b})"
            ans = f"$c = {c}\\text{{ см}}$"

    elif grade == 9:
        # Квадратные уравнения
        x1 = random.randint(-6, 6)
        x2 = random.randint(-6, 6)
        while x1 == x2:
            x2 = random.randint(-6, 6)
        b_coeff = -(x1 + x2)
        c_coeff = x1 * x2
        sign_b = f"+ {b_coeff}" if b_coeff > 0 else (f"- {abs(b_coeff)}" if b_coeff < 0 else "")
        b_term = f"{sign_b}x " if b_coeff != 0 else ""
        sign_c = f"+ {c_coeff}" if c_coeff >= 0 else f"- {abs(c_coeff)}"
        disc = b_coeff**2 - 4 * c_coeff

        cond_ru = f"Решите квадратное уравнение: $$x^2 {b_term}{sign_c} = 0$$"
        cond_lv = f"Atrisiniet kvadrātvienādojumu: $$x^2 {b_term}{sign_c} = 0$$"
        sol_ru = f"Коэффициенты: $a = 1$, $b = {b_coeff}$, $c = {c_coeff}$.\nВычислим дискриминант: $$D = b^2 - 4ac = ({b_coeff})^2 - 4 \\cdot 1 \\cdot ({c_coeff}) = {disc}$$\nКорни по формуле: $$x = \\frac{{-b \\pm \\sqrt{{D}}}}{{2a}} = \\frac{{{ -b_coeff } \\pm {int(disc**0.5)}}}{{2}}$$\n$$x_1 = {min(x1, x2)}, \\quad x_2 = {max(x1, x2)}$$."
        sol_lv = f"Diskriminants: $$D = b^2 - 4ac = {disc}$$\nVienādojuma saknes: $$x_1 = {min(x1, x2)}, \\quad x_2 = {max(x1, x2)}$$."
        title_ru = f"Квадратное уравнение x² {sign_b}x {sign_c} = 0"
        title_lv = f"Kvadrātvienādojums x² {sign_b}x {sign_c} = 0"
        ans = f"$x_1 = {min(x1, x2)}, \\; x_2 = {max(x1, x2)}$"

    elif grade == 11:
        # Matemātika I: Показательные или логарифмические уравнения
        base = random.choice([2, 3, 5])
        power = random.randint(2, 4)
        val = base ** power
        cond_ru = f"Решите логарифмическое уравнение: $$\\log_{{{base}}}(x) = {power}$$"
        cond_lv = f"Atrisiniet logaritmisko vienādojumu: $$\\log_{{{base}}}(x) = {power}$$"
        sol_ru = f"По определению логарифма $\\log_a(x) = b \\iff x = a^b$ при $x > 0$:\n$$x = {base}^{{{power}}} = {val}$$.\nПроверка: $\\log_{{{base}}}({val}) = {power}$ (верно).\nОтвет: $x = {val}$."
        sol_lv = f"Pēc logaritma definīcijas $x = {base}^{{{power}}} = {val}$.\nAtbilde: $x = {val}$."
        title_ru = f"Простейшее логарифмическое уравнение log_{base}(x) = {power}"
        title_lv = f"Vienkāršs logaritmisks vienādojums log_{base}(x) = {power}"
        ans = f"$x = {val}$"

    else:
        # 12 класс: Matemātika II (производная функции)
        a_coef = random.randint(2, 5)
        p = random.choice([2, 3])
        x0 = random.randint(1, 3)
        ans_val = a_coef * p * (x0 ** (p - 1))
        cond_ru = f"Дана функция $f(x) = {a_coef}x^{{{p}}} - 7$. Найдите значение производной $f'({x0})$."
        cond_lv = f"Dota funkcija $f(x) = {a_coef}x^{{{p}}} - 7$. Aprēķiniet atvasinājuma vērtību $f'({x0})$."
        sol_ru = f"Найдём производную функции по правилу дифференцирования $(x^n)' = n x^{{n-1}}$:\n$$f'(x) = ({a_coef}x^{{{p}}} - 7)' = {a_coef} \\cdot {p}x^{{{p-1}}} = {a_coef * p}x^{{{p-1}}}$$\nПодставим точку $x = {x0}$:\n$$f'({x0}) = {a_coef * p} \\cdot ({x0})^{{{p-1}}} = {ans_val}$$.\nОтвет: $f'({x0}) = {ans_val}$."
        sol_lv = f"Funkcijas atvasinājums ir $f'(x) = {a_coef * p}x^{{{p-1}}}$.\nPunktā $x = {x0}$: $f'({x0}) = {ans_val}$.\nAtbilde: $f'({x0}) = {ans_val}$."
        title_ru = f"Производная степенной функции в точке x = {x0}"
        title_lv = f"Pakāpes funkcijas atvasinājums punktā x = {x0}"
        ans = f"$f'({x0}) = {ans_val}$"

    return {
        "title": title_ru,
        "title_lv": title_lv,
        "condition_latex": cond_ru,
        "condition_latex_lv": cond_lv,
        "answer_latex": str(ans),
        "solution_latex": sol_ru,
        "solution_latex_lv": sol_lv,
        "difficulty": difficulty,
        "grade": grade,
        "is_published": True
    }

def generate_gemini_task(grade=7, topic="Квадратные уравнения", difficulty="Средний", context="", api_key=""):
    """Генерация через официальный Google Gemini REST API"""
    context_str = f'\nСюжетный контекст задачи (ОБЯЗАТЕЛЬНО сформулируй условие задачи про этот жизненный сюжет или ситуацию): "{context}".' if context else ""
    prompt = f"""Ты — ведущий методист математики в Латвии, разрабатывающий задачи строго по программе Skola2030.
Создай качественную математическую задачу для {grade} класса.
Тема Skola2030: "{topic}".
Уровень сложности: {difficulty} (Лёгкий = pamata līmenis, Средний = optimālais līmenis, Сложный = padziļinātais līmenis).{context_str}

Требования:
1. Математическая строгость: ровно один верный ответ, корректные числа.
2. KaTeX-разметка: формулы внутри $...$ (инлайн) и $$...$$ (выключные).
3. Полная локализация на русский язык (RU) и латышский язык (LV, стандарт Skola2030).
4. Ответ верни строго в виде JSON-объекта (без markdown-обёрток):
{{
  "title": "Краткое название задачи (RU)",
  "title_lv": "Nosaukums latviski (LV)",
  "condition_latex": "Условие задачи с формулами $...$",
  "condition_latex_lv": "Nosacījums latviski ar formulām $...$",
  "answer_latex": "Короткий математический ответ, например: $x = 4$",
  "solution_latex": "Пошаговое понятное решение на русском",
  "solution_latex_lv": "Soli pa solim atrisinājums latviski"
}}"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.3
        }
    }).encode("utf-8")

    req = urllib.request.Request(url, data=body, headers=headers)
    with urllib.request.urlopen(req, timeout=25) as res:
        data = json.loads(res.read().decode("utf-8"))
        raw = data["candidates"][0]["content"]["parts"][0]["text"]
        clean = raw.strip().removeprefix("```json").removesuffix("```").strip()
        parsed = json.loads(clean)
        return {
            "title": parsed.get("title", f"Задача по теме {topic}"),
            "title_lv": parsed.get("title_lv", translate_to_lv(parsed.get("title", ""))),
            "condition_latex": parsed.get("condition_latex", ""),
            "condition_latex_lv": parsed.get("condition_latex_lv", translate_to_lv(parsed.get("condition_latex", ""))),
            "answer_latex": parsed.get("answer_latex", ""),
            "solution_latex": parsed.get("solution_latex", ""),
            "solution_latex_lv": parsed.get("solution_latex_lv", translate_to_lv(parsed.get("solution_latex", ""))),
            "difficulty": difficulty,
            "grade": int(grade),
            "is_published": True
        }

def main():
    parser = argparse.ArgumentParser(description="AI Генератор задач Skola2030")
    parser.add_argument("--grade", type=int, default=7, help="Класс (1–12)")
    parser.add_argument("--topic", type=str, default="Линейные уравнения", help="Тема стандарта Skola2030")
    parser.add_argument("--count", type=int, default=5, help="Количество генерируемых задач")
    parser.add_argument("--difficulty", type=str, default="Средний", choices=["Лёгкий", "Средний", "Сложный"], help="Сложность")
    parser.add_argument("--context", type=str, default="", help="Сюжетный контекст задачи (о чем жизненная ситуация)")
    parser.add_argument("--api-key", type=str, default="", help="API-ключ Google Gemini (или через переменную окружения GEMINI_API_KEY)")
    parser.add_argument("--output", type=str, default="generated_tasks.json", help="Имя выходного файла (.json или .sql)")
    args = parser.parse_args()

    api_key = args.api_key or os.environ.get("GEMINI_API_KEY", "").strip()

    print(f"Генерация {args.count} задач для {args.grade} класса по теме «{args.topic}» (сложность: {args.difficulty})...")
    if args.context:
        print(f"Задан сюжетный контекст: «{args.context}»")
    if api_key:
        print("Используется нейросеть Google Gemini 2.5 Flash.")
    else:
        print("Используется встроенный автономный математический генератор Skola2030 (без API-ключа).")

    tasks = []
    for i in range(args.count):
        print(f"  [{i+1}/{args.count}] Генерация...", end=" ", flush=True)
        try:
            if api_key:
                task = generate_gemini_task(args.grade, args.topic, args.difficulty, args.context, api_key)
            else:
                task = generate_builtin_task(args.grade, args.topic, args.difficulty)
            tasks.append(task)
            print("✓")
        except Exception as e:
            print(f"Ошибка Gemini ({e}), переключаемся на автономный движок...", end=" ", flush=True)
            task = generate_builtin_task(args.grade, args.topic, args.difficulty)
            tasks.append(task)
            print("✓")

    # Сохранение результата
    if args.output.endswith(".sql"):
        # Генерация SQL-вставки
        lines = [
            "-- Сгенерированные задачи Skola2030",
            "insert into public.tasks (title, title_lv, grade, condition_latex, condition_latex_lv, answer_latex, solution_latex, solution_latex_lv, difficulty, is_published)",
            "values"
        ]
        val_rows = []
        for t in tasks:
            def esc(s):
                if s is None: return "null"
                return "'" + str(s).replace("'", "''") + "'"
            val_rows.append(
                f"  ({esc(t['title'])}, {esc(t['title_lv'])}, {t['grade']}, {esc(t['condition_latex'])}, {esc(t['condition_latex_lv'])}, {esc(t['answer_latex'])}, {esc(t['solution_latex'])}, {esc(t['solution_latex_lv'])}, {esc(t['difficulty'])}, true)"
            )
        lines.append(",\n".join(val_rows) + ";\n")
        with open(args.output, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        print(f"\nУспешно сохранено {len(tasks)} задач в SQL-файл: {args.output}")
    else:
        # Сохранение в JSON
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(tasks, f, ensure_ascii=False, indent=2)
        print(f"\nУспешно сохранено {len(tasks)} задач в JSON-файл: {args.output}")
        print("💡 Вы можете открыть админ-панель (admin.html), нажать «Импорт JSON» и загрузить этот файл в базу!")

if __name__ == "__main__":
    main()
