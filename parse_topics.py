import re
import sys

def parse_topics():
    with open('topics_full_utf8.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    data = {}
    
    # Regex to capture [Topic Name](URL)
    pattern = re.compile(r'\[(.*?)\]\((.*?)\)')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        match = pattern.search(line)
        if match:
            topic_name = match.group(1).strip()
            url = match.group(2).strip()
            
            # URL format: https://www.uzdevumi.lv/p/matematika-pec-skola2030-paraugprogrammas/1-klase/theme-slug/topic-slug
            parts = url.split('/')
            try:
                # Find the index of 'matematika-pec-skola2030-paraugprogrammas'
                base_idx = parts.index('matematika-pec-skola2030-paraugprogrammas')
                grade = parts[base_idx + 1].replace('-', ' ').capitalize()
                
                # We only want 1 to 9 klase
                if not re.match(r'^[1-9] klase$', grade.lower()):
                    if grade.lower().startswith(('1 ', '2 ', '3 ', '4 ', '5 ', '6 ', '7 ', '8 ', '9 ')):
                        pass # keep if it matches, e.g. "1 klase"
                    else:
                        continue
                
                theme_slug = parts[base_idx + 2]
                theme_name = theme_slug.replace('-', ' ').capitalize()
                # Remove trailing numbers like -31493 from theme
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

    with open('Skola2030_Matematika_1_9.md', 'w', encoding='utf-8') as f:
        f.write("# Skola2030 Matemātikas Tēmas (1.-9. klase)\n\n")
        
        # Sort grades
        def grade_sort_key(g):
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
