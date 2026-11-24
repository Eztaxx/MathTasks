import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/* Страж (.claude/hooks/guard-prod.mjs) запускаем так же, как Claude Code:
   JSON с описанием вызова — на stdin, решение — по коду выхода и JSON на stdout. */
const GUARD = fileURLToPath(new URL('../.claude/hooks/guard-prod.mjs', import.meta.url));
const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/[\\/]+$/, '');

function run(tool_input, tool_name = 'Bash') {
  const result = spawnSync(process.execPath, [GUARD], {
    input: JSON.stringify({ tool_name, tool_input, cwd: ROOT }),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT }
  });
  let decision = null;
  try { decision = JSON.parse(result.stdout || 'null')?.hookSpecificOutput?.permissionDecision ?? null; } catch {}
  return { code: result.status, decision, err: result.stderr };
}
const bash = command => run({ command });
const file = (name, tool = 'Write') => run({ file_path: `${ROOT}/${name}` }, tool);

describe('страж проекта', () => {
  it.each([
    'npm run deploy',
    'echo wrangler deploy',
    'npx wrangler deploy',
    'wrangler deploy --dry-run',
    'wrangler secret put GEMINI_API_KEY',
    'npm run restore',
    'node scripts/restore.mjs --latest',
    'supabase db push',
    'supabase link --project-ref abc',
    'echo ok && wrangler delete mathtasks',
    'git push --force origin master',
    'git push -f origin master',
    'git push origin +master'
  ])('останавливает: %s', command => {
    const r = bash(command);
    expect(r.code).toBe(2);
    expect(r.err).toContain('Остановлено правилом проекта');
  });

  it.each([
    'git push origin master',
    'git push',
    'git -C . push origin master',
    'git add . && git commit -m x && git push origin master',
    'npm run renumber:apply',
    'node scripts/renumber-tasks.mjs --apply',
    'curl -X DELETE https://rjtirahpwxlsrzoblesi.supabase.co/rest/v1/tasks?id=eq.1',
    'curl --data @x.json https://rjtirahpwxlsrzoblesi.supabase.co/rest/v1/tasks',
    'node .claude/skills/add-papers/scripts/finish.mjs 20261125-0800-pall --rollback --apply',
    'node scripts/add-paper.mjs scripts/papers/kd-visp-kopas-statistika --apply'
  ])('спрашивает владельца: %s', command => {
    const r = bash(command);
    expect(r.code).toBe(0);
    expect(r.decision).toBe('ask');
  });

  it.each([
    'npm test',
    'npm run build',
    'npm run verify',
    'npm run backup',
    'npm run renumber',
    'npx wrangler dev',
    'wrangler tail',
    'node .claude/skills/add-tasks/scripts/pick.mjs --dry',
    'node .claude/skills/add-tasks/scripts/publish.mjs 20261119-1200',
    'node .claude/skills/add-papers/scripts/pick.mjs --dry',
    'node .claude/skills/add-papers/scripts/check.mjs 20261125-0800-pall C:/tmp/x --insert',
    'node .claude/skills/add-papers/scripts/publish.mjs 20261125-0800-pall',
    'curl -s https://mathtasks.lv/plotter',
    'curl -s "https://rjtirahpwxlsrzoblesi.supabase.co/rest/v1/tasks?select=id&limit=1"',
    'git add wrangler.jsonc scripts/restore.mjs',
    'git commit -m "docs: npm run deploy и wrangler deploy больше не нужны"',
    'git commit -m "fix push button and force push docs"',
    'git log --oneline -5',
    'cat scripts/restore.mjs',
    'grep -rn "supabase db push" docs'
  ])('пропускает: %s', command => {
    const r = bash(command);
    expect(r.code).toBe(0);
    expect(r.decision).toBeNull();
  });

  it('не пускает писать .env в корне, но не мешает файлам рядом', () => {
    expect(file('.env').code).toBe(2);
    expect(file('.env.local').code).toBe(2);
    expect(file('docs/.env.example').code).toBe(0);
    expect(file('style.css').code).toBe(0);
  });

  it('спрашивает про wrangler.jsonc, стража и подключение хуков', () => {
    expect(file('wrangler.jsonc', 'Edit').decision).toBe('ask');
    expect(file('.claude/hooks/guard-prod.mjs', 'Edit').decision).toBe('ask');
    expect(file('.claude/settings.json', 'Write').decision).toBe('ask');
    expect(file('.claude/skills/add-tasks/rules.md', 'Edit').decision).toBeNull();
  });

  it('молча пропускает мусор на входе', () => {
    const r = spawnSync(process.execPath, [GUARD], { input: 'не json', encoding: 'utf8' });
    expect(r.status).toBe(0);
  });
});
