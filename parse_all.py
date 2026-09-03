import re

def parse_topics():
    with open('all_topics.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    data = {}
    
    pattern = re.compile(r'\[(.*?)\]\((.*?)\)')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        match = pattern.search(line)
        if match:
            topic_name = match.group(1).strip()
            url = match.group(2).strip()
            
            parts = url.split('/')
            try:
                base_idx = parts.index('matematika-pec-skola2030-paraugprogrammas')
                grade_slug = parts[base_idx + 1]
                
                # Determine grade formatting
                if grade_slug.endswith('-klase'):
                    grade = grade_slug.replace('-klase', ' klase').capitalize()
                elif grade_slug == 'matematika-i':
                    grade = 'Matemātika I'
                elif grade_slug == 'matematika-ii':
                    grade = 'Matemātika II'
                else:
                    continue
                
                theme_slug = parts[base_idx + 2]
                theme_name = theme_slug.replace('-', ' ').capitalize()
                theme_name = re.sub(r'\s\d+$', '', theme_name)
                
                if grade not in data:
                    data[grade] = {}
                
                if theme_name not in data[grade]:
                    data[grade][theme_name] = set()
                    
                data[grade][theme_name].add(topic_name)
            except ValueError:
                pass
            except IndexError:
                pass

    with open('Skola2030_Matematika_LV.md', 'w', encoding='utf-8') as f:
        f.write("# Skola2030 Matemātikas Tēmas (LV)\n\n")
        
        def grade_sort_key(g):
            if 'I' in g:
                if 'II' in g: return 11
                return 10
            num = re.search(r'\d+', g)
            return int(num.group(0)) if num else 99
            
        sorted_grades = sorted(data.keys(), key=grade_sort_key)
        
        for grade in sorted_grades:
            f.write(f"## {grade}\n\n")
            for theme, topics in data[grade].items():
                f.write(f"### {theme}\n")
                for topic in sorted(topics):
                    f.write(f"- {topic}\n")
                f.write("\n")

if __name__ == '__main__':
    parse_topics()
