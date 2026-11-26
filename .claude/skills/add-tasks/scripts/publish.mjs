/*
 * Шаг 4. Публикация вставленных черновиков пачки.
 *
 *   node .claude/skills/add-tasks/scripts/publish.mjs <пачка>
 *
 * Перед публикацией строки перечитываются из базы: текст должен совпасть с
 * tasks.mjs пачки, робот и KaTeX — чистые. Публикуются только такие строки,
 * остальные остаются черновиками и попадают в журнал. Затем тема
 * перенумеровывается (как scripts/renumber-tasks.mjs, но только эта тема),
 * а страницы задач проверяются на живом сайте. Замок снимается.
 */
import { join } from 'node:path';
import {
  SITE, fetchAll, rest, katexProblems, readJson, writeJson, batchDir, loadItems, itemToRow,
  log, releaseLock, sleep, FIELD_MAP, metaSubs, autoCheckable, robotIssues
} from './common.mjs';

const batch = process.argv[2];
if (!batch) {
  console.log('использование: publish.mjs <пачка>');
  process.exitCode = 1;
} else {
  await main();
}

async function main() {
  const dir = batchDir(batch);
  const meta = readJson(join(dir, 'meta.json'));
  const inserted = readJson(join(dir, 'inserted.json'));
  if (!meta || !inserted) { console.log(`пачка ${batch} не вставлена (нет inserted.json)`); process.exitCode = 1; return; }
  if (readJson(join(dir, 'published.json'))) { console.log(`пачка ${batch} уже опубликована`); releaseLock(batch); return; }

  const items = await loadItems(join(dir, 'tasks.mjs'));
  const ids = inserted.map(x => x.id);
  const rows = await rest(`tasks?select=*&id=in.(${ids.join(',')})&order=id`);
  const byId = new Map(rows.map(r => [r.id, r]));

  const ok = [], held = [];
  for (const { i, id } of inserted) {
    const row = byId.get(id);
    const why = [];
    if (!row) why.push('строки нет в базе');
    else {
      if (row.is_published) { ok.push(id); continue; }
      const expected = itemToRow(items[i], meta);
      for (const col of [...Object.values(FIELD_MAP), 'difficulty', 'subtopic_id', 'topic_id', 'grade']) {
        if (String(row[col] ?? '') !== String(expected[col] ?? '')) why.push(`в базе ${col} не совпадает с tasks.mjs`);
      }
      // Самопроверка — по пометке в tasks.mjs, и сайт действительно не должен сверять ответ ни на одном языке.
      const isSelf = items[i].self === true;
      const auto = autoCheckable(row);
      if (isSelf && (auto.ru || auto.lv)) why.push('помечена self, но сайт сверяет ответ');
      if (!isSelf && (!auto.ru || !auto.lv)) why.push('ответ не сверяется автоматически, а задача не помечена self');
      for (const x of robotIssues(row, { grade: meta.grade, topicTitle: meta.topicTitle }, isSelf)) why.push(`робот [${x.code}] ${x.text}`);
      for (const col of Object.values(FIELD_MAP)) for (const p of katexProblems(row[col])) why.push(`${col}: ${p}`);
    }
    if (why.length) held.push({ id, why });
    else ok.push(id);
  }

  const fresh = ok.filter(id => !byId.get(id)?.is_published);
  if (fresh.length) {
    const done = await rest(`tasks?id=in.(${fresh.join(',')})&is_published=eq.false`, {
      method: 'PATCH', body: { is_published: true }, prefer: 'return=representation'
    });
    console.log(`опубликовано: ${done.length} из ${inserted.length}`);
  }
  for (const h of held) console.log(`  #${h.id} оставлен черновиком: ${h.why.join('; ')}`);

  // Нумерация темы 1..N: порядок подтем → позиция → дата создания → id (как renumber-tasks.mjs).
  // Задания контрольных (черновики из exam_paper_items) в нумерацию не входят, их позиции не трогаем.
  const subs = await fetchAll(`subtopics?select=id,position&topic_id=eq.${meta.topic_id}&order=id`);
  const subPos = new Map(subs.map(s => [s.id, s.position ?? 999]));
  const topicTasks = await fetchAll(`tasks?select=id,subtopic_id,position,created_at,is_published&topic_id=eq.${meta.topic_id}&order=id`);
  const inPapers = new Set((await fetchAll('exam_paper_items?select=task_id&order=id')).map(i => Number(i.task_id)));
  const list = topicTasks.filter(t => !(inPapers.has(Number(t.id)) && t.is_published === false && !t.subtopic_id));
  list.sort((a, b) => (subPos.get(a.subtopic_id) ?? 999) - (subPos.get(b.subtopic_id) ?? 999)
    || (a.position ?? 9999) - (b.position ?? 9999)
    || String(a.created_at || '').localeCompare(String(b.created_at || '')) || a.id - b.id);
  let moved = 0;
  for (const [index, t] of list.entries()) {
    if (t.position === index + 1) continue;
    await rest(`tasks?id=eq.${t.id}`, { method: 'PATCH', body: { position: index + 1 } });
    moved++;
  }
  console.log(`нумерация темы ${meta.topic_id}: задач ${list.length}, сдвинуто ${moved}`);

  // Живой сайт: страницы задач на обоих языках отвечают 200.
  const live = [];
  for (const id of ok) {
    for (const path of [`/ru/task/${id}`, `/task/${id}`]) {
      let status = 0;
      for (let attempt = 0; attempt < 3 && status !== 200; attempt++) {
        if (attempt) await sleep(5000);
        try { status = (await fetch(SITE + path, { redirect: 'follow' })).status; } catch { status = -1; }
      }
      if (status !== 200) live.push(`${path} → ${status}`);
    }
  }
  console.log(live.length ? `живой сайт: не открываются ${live.join(', ')}` : `живой сайт: все ${ok.length * 2} страниц отвечают 200`);

  // Подтемы, где что-то опубликовано, и задачи с самопроверкой (по ним audit.mjs снимает замечание «самопроверка»).
  const entry = id => inserted.find(x => x.id === id);
  const subOf = id => { const x = entry(id); return x.sub ?? items[x.i].sub ?? meta.sub; };
  const selfIds = ok.filter(id => items[entry(id).i].self === true);
  const pubSubs = [...new Set(ok.map(subOf))];
  const codes = metaSubs(meta).filter(p => pubSubs.includes(p.id)).map(p => p.code);
  writeJson(join(dir, 'published.json'), { ids: ok, selfIds, drafts: held, live });
  log({
    type: 'published', stream: meta.stream ?? 'all', batch, sub: meta.sub, code: meta.code, subs: pubSubs, codes, grade: meta.grade,
    ids: ok, selfIds, drafts: held.map(h => h.id), live
  });
  releaseLock(batch);
  console.log(`готово: подтемы ${codes.join(', ') || meta.code}, опубликованы id ${ok.join(', ') || '—'}${selfIds.length ? `, из них с самопроверкой ${selfIds.join(', ')}` : ''}`);
  if (held.length) process.exitCode = 2;
}
