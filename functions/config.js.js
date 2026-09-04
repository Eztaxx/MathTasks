// functions/config.js.js
// Динамическая отдача /config.js для Cloudflare Pages Functions
// Позволяет отдавать window.SUPABASE_CONFIG из переменных окружения Cloudflare Pages

export async function onRequest({ env }) {
  const supabaseUrl = env.SUPABASE_URL || '';
  const supabaseKey = env.SUPABASE_KEY || env.SUPABASE_ANON_KEY || '';

  const js = `window.SUPABASE_CONFIG = {
  url: ${JSON.stringify(supabaseUrl)},
  publishableKey: ${JSON.stringify(supabaseKey)}
};
`;

  return new Response(js, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
