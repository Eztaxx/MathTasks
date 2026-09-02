/* Карта сайта для Cloudflare Pages Functions.
   Статическим файлом её держать нельзя: темы и задачи заводятся через админку,
   и файл протух бы на следующий же день. Поэтому читаем базу на каждый запрос
   и кешируем ответ на час.

   Переменные окружения проекта Pages (Settings -> Environment variables):
     SUPABASE_URL  — адрес проекта Supabase
     SUPABASE_KEY  — тот же publishable-ключ, что лежит в public/config.js
*/

const slugify = value => {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
    й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
    у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ы: 'y', э: 'e',
    ю: 'yu', я: 'ya', ь: '', ъ: ''
  };
  return (value || '').toLowerCase().split('').map(c => map[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'topic';
};

const escapeXml = value => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function read(env, table, columns) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}?select=${columns}`;
  const response = await fetch(url, {
    headers: { apikey: env.SUPABASE_KEY, Authorization: `Bearer ${env.SUPABASE_KEY}` }
  });
  if (!response.ok) throw new Error(`${table}: ${response.status}`);
  return response.json();
}

export async function onRequest({ request, env }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
    return new Response('Не заданы SUPABASE_URL и SUPABASE_KEY', { status: 500 });
  }
  const origin = new URL(request.url).origin;

  let urls = ['/', '/tasks', '/about'];
  try {
    const [subjects, topics, tasks] = await Promise.all([
      read(env, 'subjects', 'slug'),
      read(env, 'topics', 'slug,grade'),
      // Черновики в карту сайта не попадают — их и на сайте не видно.
      read(env, 'tasks', 'id,title,is_published&is_published=eq.true')
    ]);
    const grades = [...new Set(topics.map(topic => topic.grade).filter(Boolean))];
    urls = urls
      .concat(grades.map(grade => `/grade/${grade}`))
      .concat(subjects.map(subject => `/subject/${subject.slug}`))
      .concat(topics.map(topic => `/topic/${topic.slug}`))
      .concat(tasks.map(task => `/task/${task.id}-${slugify(task.title)}`));
  } catch (error) {
    // Каталог не прочитался — отдаём хотя бы статические адреса, а не пустоту.
    console.error('sitemap:', error.message);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(path => `  <url><loc>${escapeXml(origin + path)}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600'
    }
  });
}
