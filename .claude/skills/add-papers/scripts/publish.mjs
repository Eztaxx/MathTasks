/*
 * Шаг 3. Публикация работы запуска и снятие замка.
 *
 *   node .claude/skills/add-papers/scripts/publish.mjs <запуск>
 *
 * Сверяет базу с paper.json запуска, публикует работу (задания остаются черновиками), проверяет ключом
 * посетителя, что видны все задания (иначе снимает публикацию этой работы), затем запрашивает страницы
 * /control-work/<slug> и /ru/… — неудача там только замечание в журнале (сайт работу всё равно показывает).
 * Коды выхода: 0 — опубликовано, 2 — не опубликовано (причина в выводе), 1 — ошибка.
 */
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { core, log, readJson, runDir, releaseLock, SITE } from './common.mjs';

const runId = process.argv[2];
if (!runId) { console.log('использование: publish.mjs <запуск>'); process.exit(1); }
const dir = runDir(runId);
const meta = readJson(join(dir, 'meta.json'));
if (!meta) { console.log(`нет запуска ${runId}`); process.exit(1); }
const data = JSON.parse(readFileSync(join(dir, 'paper.json'), 'utf8'));

const db = await core.dbContext();
const { code, reason } = await core.publishPaper(dir, data, db);
if (code && reason === 'unconfirmed') {
  // Работа уже на сайте, не прошёл только запрос видимости: это публикация, её перепроверит audit.mjs.
  log({ type: 'published', run: runId, stream: meta.stream, slug: meta.slug, topicId: meta.topic.id, note: 'видимость ключом посетителя не подтверждена' });
  releaseLock(meta.stream, runId);
  console.log(`опубликовано, но видимость не подтверждена: ${SITE}/control-work/${meta.slug}`);
} else if (code) {
  // Замок снимаем: повтор публикации по кругу ничего не даст. Черновики посетителю не видны — их покажет audit.mjs.
  log({ type: 'publish-failed', run: runId, stream: meta.stream, slug: meta.slug, topicId: meta.topic.id });
  log({ type: 'failed', run: runId, stream: meta.stream, slug: meta.slug, topicId: meta.topic.id, note: 'публикация не прошла' });
  releaseLock(meta.stream, runId);
  process.exitCode = code;
} else {
  const pages = [];
  for (const path of [`/control-work/${meta.slug}`, `/ru/control-work/${meta.slug}`]) {
    let status = 0;
    for (let i = 0; i < 3 && status !== 200; i++) {
      try { status = (await fetch(`${SITE}${path}?check=${Date.now()}`)).status; } catch { status = 0; }
      if (status !== 200) await new Promise(r => setTimeout(r, 5000));
    }
    pages.push(`${path} ${status}`);
  }
  const note = pages.filter(p => !p.endsWith(' 200')).join('; ');
  log({ type: 'published', run: runId, stream: meta.stream, slug: meta.slug, topicId: meta.topic.id, ...(note ? { note: `страница: ${note}` } : {}) });
  releaseLock(meta.stream, runId);
  console.log(`опубликовано: ${SITE}/control-work/${meta.slug}${note ? `\nзамечание: ${note}` : ''}`);
}
