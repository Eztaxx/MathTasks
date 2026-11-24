/*
 * Завершение запуска без публикации.
 *
 *   node .claude/skills/add-papers/scripts/finish.mjs <запуск> --failed "кратко, что не вышло"  — журнал + снять замок
 *   node .claude/skills/add-papers/scripts/finish.mjs <запуск> --unlock                         — только снять замок
 *   node .claude/skills/add-papers/scripts/finish.mjs <запуск> --rollback --apply              — удалить черновики запуска
 *                                                                                                (страж спросит владельца)
 *
 * Черновики неудачного запуска посетителю не видны; их удаляет человек через --rollback --apply.
 */
import { join } from 'node:path';
import { core, log, readJson, runDir, releaseLock } from './common.mjs';

const argv = process.argv.slice(2);
const runId = argv.find(a => !a.startsWith('--'));
const meta = runId ? readJson(join(runDir(runId), 'meta.json')) : null;
if (!meta) { console.log('использование: finish.mjs <запуск> --failed "…" | --unlock | --rollback --apply'); process.exit(1); }

if (argv.includes('--failed')) {
  const note = argv[argv.indexOf('--failed') + 1] || '';
  log({ type: 'failed', run: runId, stream: meta.stream, slug: meta.slug, topicId: meta.topic.id, note: note.slice(0, 300) });
  releaseLock(meta.stream, runId);
  console.log(`запуск ${runId} отмечен неудачным, замок снят`);
} else if (argv.includes('--unlock')) {
  releaseLock(meta.stream, runId);
  log({ type: 'unlock', run: runId, stream: meta.stream });
  console.log('замок снят');
} else if (argv.includes('--rollback') && argv.includes('--apply')) {
  const { code } = await core.rollbackPaper(runDir(runId), await core.dbContext());
  if (!code) {
    log({ type: 'rolled-back', run: runId, stream: meta.stream, slug: meta.slug, topicId: meta.topic.id });
    releaseLock(meta.stream, runId);
  }
  process.exitCode = code;
} else {
  console.log('нужен один из флагов: --failed "…", --unlock, --rollback --apply');
  process.exit(1);
}
