import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from '../worker/index.js';
import {
  BACKUP_CRON,
  MAX_SUBREQUESTS,
  MIRROR_CRON,
  REPORTS_CRON,
  expiredBackups,
  joinPages,
  mirrorStep,
  notifyReports,
  reportMessage,
  reportWindow,
  runBackup,
  totalFromRange
} from '../worker/backup.js';
import { numberMismatch } from '../public/lib.js';
import { readFileSync } from 'node:fs';

afterEach(() => vi.unstubAllGlobals());

/* А1: правку делают в одном языке, а во втором остаются старые числа
   (#778, #850, #625, #798). Редактор предупреждает перед сохранением. */
describe('числа в русском и латышском тексте', () => {
  it('одинаковые числа — расхождения нет', () => {
    expect(numberMismatch('Катеты $6$ и $8\\text{ см}$', 'Katetes $6$ un $8\\text{ cm}$')).toBe(null);
    expect(numberMismatch('$1 : 2\\,000\\,000$, $4{,}5$', '$1 : 2\\,000\\,000$, $4,5$')).toBe(null);
  });

  it('разные числа — что есть только в каждом языке', () => {
    expect(numberMismatch('за $6\\text{ ч}$', 'laikā $4{,}5\\text{ h}$')).toEqual({ onlyRu: ['6'], onlyLv: ['4,5'] });
  });

  it('пустой перевод — не расхождение', () => {
    expect(numberMismatch('за $6\\text{ ч}$', '')).toBe(null);
  });
});

describe('ночная копия: вспомогательное', () => {
  it('страницы таблицы склеиваются в один массив без разбора', () => {
    expect(joinPages(['[{"id":1},{"id":2}]', '[{"id":3}]'])).toBe('[{"id":1},{"id":2},{"id":3}]');
    expect(joinPages(['[]'])).toBe('[]');
    expect(joinPages(['[{"id":1}]', '[]'])).toBe('[{"id":1}]');
  });

  it('число строк — из Content-Range', () => {
    expect(totalFromRange('0-999/1420')).toBe(1420);
    expect(totalFromRange('*/0')).toBe(0);
    expect(totalFromRange(null)).toBe(null);
  });

  it('хранятся последние 14 копий, остальные — на удаление', () => {
    const names = Array.from({ length: 16 }, (_, i) => `mathtasks-2026-09-${String(i + 1).padStart(2, '0')}T03-00-00.json`);
    expect(expiredBackups([...names].reverse())).toEqual(names.slice(0, 2));
    expect(expiredBackups(names.slice(0, 5))).toEqual([]);
    expect(expiredBackups(['manifest.json', ...names.slice(0, 3)])).toEqual([]);
  });
});

/* Копия пишется, только если выгрузились задачи и темы: пустая «копия»
   при сбое доступа вытеснила бы из хранилища хорошую. */
describe('ночная копия: запуск', () => {
  const env = { SUPABASE_URL: 'https://proj.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service' };

  const storageStub = (tables, uploads, { images = [{ name: 'a.svg', metadata: { size: 3, mimetype: 'image/svg+xml' }, updated_at: 't1' }], manifest = null } = {}) => vi.fn(async (url, init = {}) => {
    const path = String(url).replace(env.SUPABASE_URL, '');
    if (path.startsWith('/rest/v1/')) {
      const name = path.slice('/rest/v1/'.length).split('?')[0];
      const rows = tables[name];
      if (!rows) return new Response('{"message":"нет таблицы"}', { status: 404 });
      return new Response(JSON.stringify(rows), { headers: { 'content-range': `0-${rows.length - 1}/${rows.length}` } });
    }
    if (path === '/storage/v1/bucket/backups') return new Response('{}');
    if (path === '/storage/v1/bucket') return new Response(JSON.stringify([{ name: 'task-images', public: true }]));
    if (path === '/storage/v1/object/list/task-images') {
      const { offset } = JSON.parse(init.body);
      return new Response(JSON.stringify(images.slice(offset, offset + 100)));
    }
    if (path === '/storage/v1/object/list/backups') return new Response('[]');
    if (path === '/storage/v1/object/backups/files/manifest.json' && !init.method) {
      return manifest ? new Response(JSON.stringify(manifest)) : new Response('{}', { status: 404 });
    }
    if (path.startsWith('/storage/v1/object/task-images/')) return new Response('<s>');
    if (path.startsWith('/storage/v1/object/backups/') && init.method === 'POST') {
      uploads.push({ path: path.slice('/storage/v1/object/backups/'.length), body: init.body });
      return new Response('{}');
    }
    return new Response('?', { status: 500 });
  });

  it('таблицы и ссылки на файлы — в один JSON, сами файлы копия не трогает', async () => {
    const uploads = [];
    vi.stubGlobal('fetch', storageStub({ topics: [{ id: 1 }], tasks: [{ id: 7, title: 'x' }], subjects: [], subtopics: [], tags: [], task_tags: [],
      exam_papers: [], exam_paper_topics: [], exam_paper_items: [], task_reports: [] }, uploads));
    const result = await runBackup(env, new Date('2026-09-27T03:00:00Z'));
    expect(result.name).toBe('mathtasks-2026-09-27T03-00-00.json');
    expect(result.counts.tasks).toBe(1);
    const copy = uploads.find(u => u.path.startsWith('db/'));
    const dump = JSON.parse(copy.body);
    expect(dump.tables.tasks).toEqual([{ id: 7, title: 'x' }]);
    expect(dump.storage.files).toEqual([{ bucket: 'task-images', path: 'a.svg', type: 'image/svg+xml', size: 3, ref: 'files/task-images/a.svg' }]);
    expect(uploads.map(u => u.path)).toEqual([`db/${result.name}`]);
    expect(result.requests).toBeLessThan(MAX_SUBREQUESTS);
  });

  it('без задач копия не пишется', async () => {
    const uploads = [];
    vi.stubGlobal('fetch', storageStub({ topics: [{ id: 1 }], tasks: [], subjects: [], subtopics: [], tags: [], task_tags: [],
      exam_papers: [], exam_paper_topics: [], exam_paper_items: [], task_reports: [] }, uploads));
    await expect(runBackup(env)).rejects.toThrow(/не выгрузились/);
    expect(uploads.filter(u => u.path.startsWith('db/'))).toEqual([]);
  });

  /* Бесплатный тариф Cloudflare — 50 запросов наружу за вызов: первый
     запуск на боевом упал на 60 чертежах. Шаг копирует, сколько влезает. */
  const svg = i => ({ name: `f${String(i).padStart(3, '0')}.svg`, metadata: { size: 3, mimetype: 'image/svg+xml' }, updated_at: 't1' });

  it('шаг копирования берёт новые файлы и не выходит за лимит запросов', async () => {
    const uploads = [];
    const stub = storageStub({}, uploads, { images: Array.from({ length: 150 }, (_, i) => svg(i)) });
    vi.stubGlobal('fetch', stub);
    const result = await mirrorStep(env);
    expect(stub.mock.calls.length).toBeLessThanOrEqual(MAX_SUBREQUESTS);
    expect(result.copied).toBeGreaterThan(10);
    expect(result.pending).toBe(150 - result.copied);
    const manifest = JSON.parse(uploads.find(u => u.path === 'files/manifest.json').body);
    expect(Object.keys(manifest)).toHaveLength(result.copied);
    expect(uploads.map(u => u.path)).toContain('files/task-images/f000.svg');
  });

  it('скопированное и не менявшееся второй раз не копируется', async () => {
    const uploads = [];
    const manifest = { 'task-images/f000.svg': '3|t1', 'task-images/f001.svg': '3|t0' };
    vi.stubGlobal('fetch', storageStub({}, uploads, { images: [svg(0), svg(1)], manifest }));
    const result = await mirrorStep(env);
    expect(result).toMatchObject({ copied: 1, pending: 0 });
    expect(uploads.map(u => u.path)).toEqual(['files/task-images/f001.svg', 'files/manifest.json']);
  });

  it('всё уже скопировано — шаг ничего не пишет', async () => {
    const uploads = [];
    vi.stubGlobal('fetch', storageStub({}, uploads, { images: [svg(0)], manifest: { 'task-images/f000.svg': '3|t1' } }));
    expect(await mirrorStep(env)).toMatchObject({ copied: 0, pending: 0 });
    expect(uploads).toEqual([]);
  });
});

/* А3: каждое сообщение попадает ровно в одно десятиминутное окно —
   помнить, что уже отправлено, не нужно. */
describe('уведомления о сообщениях об ошибках', () => {
  it('окно — десять минут до запуска, конец не включён', () => {
    const { from, to } = reportWindow(Date.parse('2026-09-27T10:20:00.300Z'));
    expect(from.toISOString()).toBe('2026-09-27T10:10:00.000Z');
    expect(to.toISOString()).toBe('2026-09-27T10:20:00.000Z');
  });

  it('в тексте — вид ошибки, задача, что ввёл ученик и ссылка в редактор', () => {
    const text = reportMessage({ task_id: 620, kind: 'answer', lang: 'lv', message: 'не принимает\n[в поле ответа: 12 · неверных попыток: 2]' }, { title: 'Уравнение обратной пропорциональности', grade: 6 });
    expect(text).toContain('ответ · LV');
    expect(text).toContain('#620 «Уравнение обратной пропорциональности» · 6 кл.');
    expect(text).toContain('в поле ответа: 12');
    expect(text).toContain('https://mathtasks.lv/admin#task-620');
  });

  it('без секретов Telegram ничего не делает', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await notifyReports({ SUPABASE_URL: 'https://p.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 's' }, Date.now())).toEqual({ sent: 0, skipped: 'нет секретов Telegram' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('каждое сообщение окна — отдельным уведомлением', async () => {
    const sent = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
      if (String(url).includes('/rest/v1/task_reports')) {
        return new Response(JSON.stringify([
          { id: 1, task_id: 5, kind: 'condition', lang: 'ru', message: '' },
          { id: 2, task_id: 5, kind: 'other', lang: 'ru', message: 'опечатка' }
        ]));
      }
      if (String(url).includes('/rest/v1/tasks')) return new Response(JSON.stringify([{ id: 5, title: 'Задача', grade: 7 }]));
      if (String(url).startsWith('https://api.telegram.org/botT/sendMessage')) {
        sent.push(JSON.parse(init.body));
        return new Response('{"ok":true}');
      }
      return new Response('?', { status: 500 });
    }));
    const env = { SUPABASE_URL: 'https://p.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 's', TELEGRAM_BOT_TOKEN: 'T', TELEGRAM_CHAT_ID: '42' };
    expect(await notifyReports(env, Date.parse('2026-09-27T10:20:00Z'))).toEqual({ sent: 2 });
    expect(sent.map(m => m.chat_id)).toEqual(['42', '42']);
    expect(sent[0].text).toContain('(без текста)');
  });
});

describe('воркер: расписание и защищённые адреса', () => {
  it('в wrangler.jsonc есть все три расписания, и воркер их различает', () => {
    const config = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
    expect(config).toContain(`"${BACKUP_CRON}"`);
    expect(config).toContain(`"${REPORTS_CRON}"`);
    expect(config).toContain(`"${MIRROR_CRON}"`);
    expect(new Set([BACKUP_CRON, REPORTS_CRON, MIRROR_CRON]).size).toBe(3);
    expect(typeof worker.scheduled).toBe('function');
  });

  it('копию снять без входа нельзя', async () => {
    const res = await worker.fetch(new Request('https://mathtasks.lv/api/backup/run', { method: 'POST' }), {});
    expect(res.status).toBe(403);
  });

  it('со служебным ключом список копий открывается', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([
      { name: 'mathtasks-2026-09-27T03-00-00.json', metadata: { size: 2048 }, created_at: '2026-09-27T03:00:05Z' }
    ]))));
    const env = { SUPABASE_URL: 'https://p.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'secret-key' };
    const res = await worker.fetch(new Request('https://mathtasks.lv/api/backup/list', { headers: { Authorization: 'Bearer secret-key' } }), env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.backups[0].name).toBe('mathtasks-2026-09-27T03-00-00.json');
    expect(body.notify).toBe(false);
  });
});
