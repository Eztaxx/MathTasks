/*
 * Завершить запуск без публикации.
 *
 *   node .claude/skills/add-tasks/scripts/finish.mjs <пачка> --failed "причина"
 *       пачка не получилась: запись в журнал, замок снят. Две неудачи подряд
 *       по главной подтеме пачки — pick.mjs перестаёт её выбирать.
 *   node .claude/skills/add-tasks/scripts/finish.mjs <пачка> --skip-sub "причина" [--sub <id>]
 *       подтема не годится ни для обычных задач, ни для задач с самопроверкой
 *       (только построения по чертежу, проект) — больше её не выбирать
 *       (state/skip.json). По умолчанию главная подтема пачки; --sub — другая
 *       подтема из этой же пачки.
 *   node .claude/skills/add-tasks/scripts/finish.mjs --unlock [--grades 10] [--force]
 *       снять брошенные замки вручную: всех потоков или только потока этих классов;
 *       с --force — и живые (тогда поток может пойти вторым запуском поверх идущего).
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { STATE, readJson, writeJson, batchDir, log, releaseLock, metaSubs, parseGrades, streamKey } from './common.mjs';

const argv = process.argv.slice(2);
const flagValue = name => { const i = argv.indexOf(name); return i >= 0 ? String(argv[i + 1] ?? '').trim() : null; };

if (argv.includes('--unlock')) {
  const key = argv.includes('--grades') ? streamKey(parseGrades(argv)) : null;
  const removed = releaseLock(null, key, { force: argv.includes('--force') });
  console.log(removed.length ? `сняты замки: ${removed.map(l => `${l.stream} (${l.batch})`).join(', ')}`
    : 'снимать нечего: брошенных замков нет (живой замок снимается только с --force)');
} else {
  const batch = argv[0];
  const failed = flagValue('--failed');
  const skipSub = flagValue('--skip-sub');
  const meta = batch ? readJson(join(batchDir(batch), 'meta.json')) : null;
  const subArg = flagValue('--sub');
  const target = meta ? metaSubs(meta).find(p => p.id === (subArg ? Number(subArg) : meta.sub)) : null;
  if (!meta || (!failed && !skipSub)) {
    console.log('использование: finish.mjs <пачка> --failed "причина" | --skip-sub "причина" [--sub <id>] | --unlock');
    process.exitCode = 1;
  } else if (skipSub && !target) {
    console.log(`подтемы ${subArg} нет в пачке ${batch} (${metaSubs(meta).map(p => p.id).join(', ')})`);
    process.exitCode = 1;
  } else if (existsSync(join(batchDir(batch), 'inserted.json')) && !existsSync(join(batchDir(batch), 'published.json'))) {
    console.log(`в пачке ${batch} уже есть черновики в базе — сначала publish.mjs ${batch}`);
    process.exitCode = 1;
  } else {
    const reason = failed || skipSub;
    if (skipSub) {
      const skip = readJson(join(STATE, 'skip.json'), {});
      skip[target.id] = `${target.code}: ${skipSub} (${batch})`;
      writeJson(join(STATE, 'skip.json'), skip);
    }
    // Неудача пишется на главную подтему: остальные подтемы пачки ни при чём.
    const sub = skipSub ? target.id : meta.sub;
    const code = skipSub ? target.code : meta.code;
    log({ type: skipSub ? 'skip-sub' : 'failed', stream: meta.stream ?? 'all', batch, sub, code, grade: meta.grade, reason });
    if (skipSub && !failed && target.id !== meta.sub) {
      // Отсеяна вторая подтема: пачка продолжается с главной, замок не снимается.
      console.log(`подтема ${code} больше не выбирается; пачка ${batch} продолжается — задачи только для ${meta.code}`);
    } else {
      writeJson(join(batchDir(batch), 'finished.json'), { failed: Boolean(failed), skipSub: Boolean(skipSub), sub, reason });
      releaseLock(batch);
      console.log(`пачка ${batch} закрыта: ${reason}`);
    }
  }
}
