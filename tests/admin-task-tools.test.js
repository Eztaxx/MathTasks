import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import lib from '../public/lib.js';

/* Кнопки администратора на карточке задачи (app.js, adminToolsHtml):
   «Изменить» ведёт в редактор админки, «Снять с сайта» снимает публикацию.
   Удаления с сайта нет — оно необратимо и остаётся в админке. */

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const app = read('../public/app.js');
const admin = read('../public/admin.js');
const index = read('../index.html');

describe('кнопки администратора на карточке задачи', () => {
  it('тексты есть на латышском и русском', () => {
    const src = read('../public/i18n.js');
    const ruStart = src.indexOf('\n    ru: {');
    expect(ruStart).toBeGreaterThan(0);
    const keys = ['admin_task_edit', 'admin_task_unpublish', 'admin_task_unpublish_confirm', 'admin_task_unpublished', 'admin_task_failed', 'admin_task_error'];
    for (const key of keys) {
      const re = new RegExp(`^\\s+${key}: '`, 'gm');
      const at = [...src.matchAll(re)].map(m => m.index);
      expect(at.length, key).toBe(2);
      expect(at[0] < ruStart && at[1] > ruStart, key + ': по одному в lv и ru').toBe(true);
    }
  });

  it('разметка кнопок создаётся только для подтверждённого администратора', () => {
    expect(app).toMatch(/function adminToolsHtml\(taskId\) \{\s*if \(!isCurrentUserAdmin\) return '';/);
    expect(app).toMatch(/function syncAdminTools[\s\S]*?if \(!isCurrentUserAdmin\) \{ existing\?\.remove\(\); return; \}/);
    expect(index).not.toContain('data-admin-unpublish');
    expect(index).not.toContain('task-admin-tools');
  });

  it('снятие проверяет, что изменилась ровно одна строка, и не удаляет задачу', () => {
    expect(app).toContain("const { data, error, status } = await db.from('tasks').update({ is_published: false }).eq('id', taskId).select('id');");
    expect(app).toMatch(/data\.length !== 1/);
    expect(app).not.toMatch(/from\('tasks'\)\.delete\(/);
  });

  it('в задаче дня кнопок нет', () => {
    expect(app).toMatch(/taskCard\(task, \{ linkTitle: false, inlineFigure: false, adminTools: false \}\)/);
    expect(app).toContain("data-no-admin-tools");
  });

  it('«Изменить» открывает задачу в редакторе админки, адрес не переводится на /ru', () => {
    expect(app).toContain('href="/admin.html#task-${id}"');
    expect(admin).toContain('/^task-(\\d+)$/');
    expect(lib.localizeHref('/admin.html#task-5', 'ru')).toBe('/admin.html#task-5');
  });

  it('версия i18n.js одинакова на всех страницах сайта', () => {
    const versions = ['index.html', 'duel.html', 'exams.html', 'mock-exams.html', 'trainer.html', 'plotter.html']
      .map(file => /\/i18n\.js\?v=([\w-]+)/.exec(read('../' + file))?.[1]);
    expect(new Set(versions).size).toBe(1);
  });
});

describe('админка: задания контрольных и перенумерация', () => {
  it('перенумерация не идёт, пока не загружен список контрольных', () => {
    expect(admin).toMatch(/async function handleRenumberTasks[\s\S]*?if \(!paperTaskIdsReady\) \{[\s\S]*?return;\s*\}[\s\S]*?computeFn\(topicTasks/);
    expect(admin).toMatch(/tasks\.filter\(t => t\.topic_id === tId && !isPaperTask\(t\)\)/);
  });

  it('перенумерация перечитывает список контрольных и считает только реально сохранённые номера', () => {
    expect(admin).toMatch(/async function handleRenumberTasks[\s\S]*?await loadTaskIndex\(\);\s*fresh = await loadTasks\(\);[\s\S]*?if \(!fresh\)[\s\S]*?if \(!paperTaskIdsReady\)/);
    expect(admin).toContain(".update({ position: item.newPosition }).eq('id', item.id).select('id')");
    expect(admin).toMatch(/if \(error\) \{ paperTaskIdsReady = false; return; \}/);
  });

  it('в меню админки есть ссылка на главную', () => {
    expect(read('../admin.html')).toMatch(/<div class="adm-side-links"><a class="adm-link-btn" href="\/">На главную<\/a>/);
  });
});
