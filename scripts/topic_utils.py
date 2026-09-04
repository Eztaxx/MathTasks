import re
import json
import sys
import io

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
    if 'Matemātika I' in grade_name or 'Математика I' in grade_name: return 11
    if 'Matemātika II' in grade_name or 'Математика II' in grade_name: return 12
    m = re.search(r'\d+', grade_name)
    return int(m.group(0)) if m else 10

def classify_subject(title_ru, subtopics_ru):
    text = (title_ru + ' ' + ' '.join(subtopics_ru)).lower()
    # Statistics & probability
    if any(k in text for k in ['статистик', 'вероятност', 'комбинаторик', 'выборк', 'данны', 'диаграмм', 'множеств', 'бернулли']):
        return 'statistics'
    # Geometry & measurements
    if any(k in text for k in ['фигур', 'треугольник', 'четырехугольник', 'окружност', 'геометр', 'вектор', 'пространственн', 'призм', 'цилиндр', 'конус', 'пирамид', 'шар', 'стереометр', 'планиметр', 'угол', 'трапеци', 'параллелограмм', 'ромб', 'пифагор', 'симметри', 'тела вращения', 'многогранник']):
        # Exceptions: geometric progression is algebra
        if 'геометрическая прогрессия' in text and not any(k in text for k in ['треугольник', 'стереометр', 'тела вращения']):
            return 'algebra'
        return 'geometry'
    # Algebra & numbers
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
    parts = raw.split('-')[:5]
    short = '-'.join(parts)
    return f"skola2030-g{grade}-{idx+1}-{short}"

print("Parser module ready.")
