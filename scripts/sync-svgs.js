import fs from 'fs';
import path from 'path';

/* Ключи читаем из .env, а не держим в тексте скрипта: сервисный ключ
   даёт полный доступ к базе в обход политик, и один коммит в публичный
   репозиторий отдаёт базу кому угодно. Файл .env в .gitignore. */
const env = Object.fromEntries(
  fs.readFileSync(path.resolve('.env'), 'utf-8')
    .split(/\r?\n/)
    .filter(line => line && !line.startsWith('#'))
    .map(line => { const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)]; })
);

const SUPABASE_URL = process.env.SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Нет SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY — проверьте .env');
  process.exit(1);
}

async function sync() {
  const dir = path.resolve('task-svgs/condition');
  if (!fs.existsSync(dir)) {
    console.error('Папка task-svgs/condition не найдена!');
    process.exit(1);
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));
  console.log('Синхронизация ' + files.length + ' SVG файлов с Supabase Storage...');

  let ok = 0;
  for (const file of files) {
    const filePath = path.join(dir, file);
    const svg = fs.readFileSync(filePath, 'utf-8');
    const storagePath = 'condition/' + file;

    const res = await fetch(SUPABASE_URL + '/storage/v1/object/task-images/' + storagePath, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'image/svg+xml',
        'x-upsert': 'true'
      },
      body: svg
    });

    if (!res.ok) {
      console.error('❌ Ошибка загрузки ' + file + ': ' + res.status);
      continue;
    }

    console.log('✓ ' + file + ' обновлён');
    ok++;
  }

  console.log('\nУспешно синхронизировано: ' + ok + ' из ' + files.length);
}

sync().catch(console.error);
