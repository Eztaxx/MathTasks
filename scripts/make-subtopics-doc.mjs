/* Справочник подтем для промпта: его вставляют в чат целиком, поэтому
   формат плоский — номер, название по-русски, название по-латышски. */
import { readFileSync, writeFileSync } from 'node:fs';

const R = 'C:/Users/goga8/Downloads/MathTasks/';
const cat = JSON.parse(readFileSync(R + 'public/data/skola2030_topics.json', 'utf8'));

const строки = ['# Подтемы Skola2030 — номера для поля `subtopic_code`', '',
  'Справочник к [промпту генератора](ai-generator-prompt.md). Номер — класс, тема, подтема.',
  'Файл собирается из `public/data/skola2030_topics.json`; править нужно там, а не здесь.', ''];

let классы = 0, тем = 0, подтем = 0, прошлыйКласс = null;
for (const c of cat) {
  if (c.grade !== прошлыйКласс) {
    прошлыйКласс = c.grade;
    классы++;
    строки.push('', `## ${c.grade} класс`, '');
  }
  тем++;
  строки.push(`### ${c.grade}.${c.position}. ${c.title_ru.replace(/^\s*\d+(\.\d+)*\.?\s*/, '')}`, '');
  строки.push('| Номер | Подтема | Apakštēma |', '| :--- | :--- | :--- |');
  for (const s of c.subtopics) {
    подтем++;
    строки.push(`| \`${s.num}\` | ${s.ru} | ${s.lv} |`);
  }
  строки.push('');
}

writeFileSync(R + 'docs/skola2030-subtopics.md', строки.join('\n') + '\n', 'utf8');
console.log(`классов ${классы}, тем ${тем}, подтем ${подтем}`);
