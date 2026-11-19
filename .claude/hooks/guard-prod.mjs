// Страховка проекта MathTasks: Claude Code не выкладывает сайт мимо git, не перезаписывает базу
// и не пишет в неё «руками» без согласия владельца.
// Срабатывает перед каждой командой (Bash, PowerShell) и записью файла (Edit, MultiEdit, Write).
// Выход 2 — команда не запускается, Claude видит причину. JSON с "ask" — спросить владельца.
// Это сетка, а не замок: обойти можно, но случайно — нет. Главное правило — в CLAUDE.md.
//
// Особенность проекта: тестовой базы нет, рабочая одна (её адрес знают и сайт, и скрипты), а выкладку делает
// Cloudflare после push в master. Поэтому страж не «не пускает к основной базе», а останавливает необратимое:
// ручную выкладку, восстановление из копии, миграции и ручные записи в базу, push. Запуски скилла add-tasks
// (node .claude/skills/add-tasks/scripts/*) он не трогает: они пишут в базу по расписанию, без людей.
import { readFileSync } from 'node:fs'

const PROD_REF = 'rjtirahpwxlsrzoblesi' // рабочая база Supabase (mathtasks.lv)

// Части команды, которые только читают или работают с git, — их текст ничего не запускает:
// `git add wrangler.jsonc`, `cat scripts/restore.mjs`, `git commit -m "… wrangler deploy …"` пропускаются.
// `echo` сюда сознательно не входит: проверка, что страж подключён, — `echo` с запретной командой.
const HARMLESS = /^(git|cat|type|get-content|gc|grep|egrep|rg|select-string|sls|head|tail|less|more|wc|diff|ls|dir|get-childitem|gci|code|notepad)$/

let input = {}
try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}')
} catch {
  process.exit(0)
}

const tool = String(input.tool_name ?? '')
const ti = input.tool_input ?? {}

function block(why) {
  process.stderr.write(
    `Остановлено правилом проекта (.claude/hooks/guard-prod.mjs): ${why}.\n` +
      'Выкладку, восстановление базы и ручные записи в неё делает владелец, своими командами. ' +
      'Не обходи — подготовь шаги и скажи владельцу, что запустить.\n',
  )
  process.exit(2)
}

function ask(why) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: why },
    }),
  )
  process.exit(0)
}

// --- запись файлов ---
if (tool === 'Edit' || tool === 'MultiEdit' || tool === 'Write' || tool === 'NotebookEdit') {
  const p = String(ti.file_path ?? ti.notebook_path ?? '').replace(/\\/g, '/').toLowerCase()
  const root = String(process.env.CLAUDE_PROJECT_DIR || input.cwd || '').replace(/\\/g, '/').toLowerCase().replace(/\/+$/, '')
  const name = p.split('/').pop() ?? ''
  const inRoot = root && p.startsWith(`${root}/`) && !p.slice(root.length + 1).includes('/')
  if (inRoot && (name === '.env' || name.startsWith('.env.'))) block('файл .env в корне: в нём ключ service_role рабочей базы')
  if (p.endsWith('/supabase/.temp/project-ref')) block('перепривязка Supabase CLI')
  if (inRoot && name === 'wrangler.jsonc') ask('Правка настроек выкладки и расписания воркера (wrangler.jsonc). Разрешить?')
  if (p.endsWith('/.claude/hooks/guard-prod.mjs') || p.endsWith('/.claude/settings.json'))
    ask('Правка стража или подключения хуков (.claude/). Разрешить?')
  process.exit(0)
}

// --- команды ---
const cmd = String(ti.command ?? '')
if (!cmd) process.exit(0)

// Делим на части по && || ; | и переводам строк; проверяем каждую, кроме безвредных.
const parts = cmd
  .split(/&&|\|\||;|\||\r?\n/)
  .map((s) => s.trim())
  .filter(Boolean)
  .filter((s) => {
    const first = (s.match(/^["']?([^\s"']+)/)?.[1] ?? '').toLowerCase().replace(/^.*[\\/]/, '').replace(/\.exe$/, '')
    return !HARMLESS.test(first)
  })

for (const raw of parts) {
  const c = raw.toLowerCase()

  // Выкладка — только через push в master: Cloudflare собирает и выкладывает сам.
  if (/npm\s+(run\s+)?deploy\b/.test(c)) block('ручная выкладка (npm run deploy): сайт выкладывает Cloudflare после push в master')
  if (/wrangler(@[\w.-]+)?\s+(deploy|publish|delete|rollback|secret|versions|triggers|kv|d1|r2)\b/.test(c))
    block('wrangler меняет рабочий воркер или его секреты: сайт выкладывает Cloudflare после push в master')

  // Восстановление базы из копии перезаписывает рабочие данные.
  if (/npm\s+(run\s+)?restore\b/.test(c) || /scripts[\\/]+restore\.mjs/.test(c)) block('restore перезаписывает рабочую базу из копии')

  // Supabase CLI: миграции и привязка проекта.
  if (/\bsupabase(@[\w.-]+)?\s+(db\s+(push|reset|remote)|link|migration\s+(repair|up|squash)|functions\s+deploy|secrets|branches|projects)\b/.test(c))
    block('Supabase CLI меняет рабочую базу, функции или привязку проекта')

  // Скрипты, которые сначала показывают, что сделают, а с --apply пишут в рабочую базу.
  if (/--apply\b/.test(c) || /renumber(:topics)?:apply/.test(c))
    ask('Скрипт с --apply пишет в рабочую базу (перенумерация и т. п.). Сначала сухой запуск без --apply. Разрешить запись?')

  // Ручные записи в базу по HTTP.
  if (c.includes(PROD_REF) || /\.supabase\.co/.test(c)) {
    const writes = /(-x|--request)\s*["']?(post|put|patch|delete)\b|--data\b|\s-d\s|-method\s+(post|put|patch|delete)\b|invoke-restmethod|invoke-webrequest/.test(c)
    if (writes) ask('Запись в рабочую базу по HTTP, мимо скриптов проекта. Разрешить?')
  }
}

// Отправка на GitHub = выкладка на mathtasks.lv. Смотрим на каждую часть команды целиком, git здесь не безвреден;
// `push` должен стоять подкомандой git (после его опций), а не словом в тексте коммита.
const PUSH = /^(?:\S*[\\/])?git(?:\.exe)?\s+(?:(?:-c|-C|--git-dir|--work-tree)\s+\S+\s+|-\S+\s+)*push\b(.*)$/i
for (const raw of cmd.split(/&&|\|\||;|\||\r?\n/).map((s) => s.trim())) {
  const m = raw.match(PUSH)
  if (!m) continue
  if (/(--force\b|--force-with-lease|\s-f\b|\s\+[\w/.-]+)/i.test(m[1]))
    block('принудительный push: он перепишет историю master, из которого выкладывается сайт')
  ask('Push на GitHub: Cloudflare сразу выложит это на mathtasks.lv. Отправить?')
}

process.exit(0)
