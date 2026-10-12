/*
 * Завершить запуск без публикации.
 *
 *   node .claude/skills/add-tasks/scripts/finish.mjs <пачка> --failed "причина"
 *       пачка не получилась: запись в журнал, замок снят. Две неудачи подряд
 *       по одной подтеме — pick.mjs перестаёт её выбирать.
 *   node .claude/skills/add-tasks/scripts/finish.mjs <пачка> --skip-sub "причина"
 *       подтема не годится для задач с автопроверкой (только чертежи, проект,
 *       доказательства) — больше её не выбирать (state/skip.json).
 *   node .claude/skills/add-tasks/scripts/finish.mjs --unlock
 *       снять замок вручную.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { STATE, readJson, writeJson, batchDir, log, releaseLock } from './common.mjs';

const argv = process.argv.slice(2);
const flagValue = name => { const i = argv.indexOf(name); return i >= 0 ? String(argv[i + 1] ?? '').trim() : null; };

if (argv.includes('--unlock')) {
  releaseLock();
  console.log('замок снят');
} else {
  const batch = argv[0];
  const failed = flagValue('--failed');
  const skipSub = flagValue('--skip-sub');
  const meta = batch ? readJson(join(batchDir(batch), 'meta.json')) : null;
  if (!meta || (!failed && !skipSub)) {
    console.log('использование: finish.mjs <пачка> --failed "причина" | --skip-sub "причина" | --unlock');
    process.exitCode = 1;
  } else if (existsSync(join(batchDir(batch), 'inserted.json')) && !existsSync(join(batchDir(batch), 'published.json'))) {
    console.log(`в пачке ${batch} уже есть черновики в базе — сначала publish.mjs ${batch}`);
    process.exitCode = 1;
  } else {
    const reason = failed || skipSub;
    if (skipSub) {
      const skip = readJson(join(STATE, 'skip.json'), {});
      skip[meta.sub] = `${meta.code}: ${skipSub} (${batch})`;
      writeJson(join(STATE, 'skip.json'), skip);
    }
    writeJson(join(batchDir(batch), 'finished.json'), { failed: Boolean(failed), skipSub: Boolean(skipSub), reason });
    log({ type: skipSub ? 'skip-sub' : 'failed', batch, sub: meta.sub, code: meta.code, grade: meta.grade, reason });
    releaseLock(batch);
    console.log(`пачка ${batch} закрыта: ${reason}`);
  }
}
