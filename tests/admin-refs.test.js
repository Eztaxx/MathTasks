import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/* admin.js — один большой скрипт без сборки, и node --check не видит
   обращений к необъявленным переменным. Однажды при правке пропали семь
   объявлений элементов, а их обработчики остались: ReferenceError на
   загрузке ронял весь скрипт, и админка навсегда застревала на экране
   «Проверяем доступ…» — без формы входа. Этот тест ловит ровно такой
   случай: у каждого элемента, на который вешается обработчик, должно
   быть объявление. */
const source = readFileSync(new URL('../public/admin.js', import.meta.url), 'utf8');

const declared = new Set();
for (const m of source.matchAll(/\b(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
for (const m of source.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}\s*=/g)) {
  for (const part of m[1].split(',')) {
    const name = part.split(':').pop().split('=')[0].trim();
    if (name) declared.add(name);
  }
}
for (const m of source.matchAll(/\b(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=[^,;\n]*,\s*([A-Za-z_$][\w$]*)\s*=/g)) declared.add(m[1]);
for (const m of source.matchAll(/\(\s*([A-Za-z_$][\w$]*)\s*(?:,[^)]*)?\)\s*=>|([A-Za-z_$][\w$]*)\s*=>/g)) declared.add(m[1] || m[2]);

const listenerTargets = [...new Set(
  [...source.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\??\.addEventListener\(/g)].map(m => m[1])
)];

describe('admin.js: у каждого обработчика есть объявленный элемент', () => {
  it('нет обработчиков на необъявленных переменных', () => {
    const allowed = new Set(['document', 'window']);
    const missing = listenerTargets.filter(name => !declared.has(name) && !allowed.has(name));
    expect(missing).toEqual([]);
  });

  it('проверка вообще что-то находит', () => {
    // Защита от регулярки, которая молча перестала совпадать.
    expect(listenerTargets.length).toBeGreaterThan(30);
    expect(listenerTargets).toContain('bulkDialogCancel');
  });
});
