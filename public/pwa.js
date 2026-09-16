/* Сайт как приложение: service worker (/sw.js) даёт работу без сети, а
   manifest.webmanifest — установку на главный экран телефона.

   На сервере разработки Vite (он вставляет в страницу /@vite/client) воркер
   не регистрируем: Chrome не принимает оттуда его скрипт («An unknown error
   occurred when fetching the script»), а делать там воркеру нечего — без
   номера сборки он ничего не перехватывает. vite preview и wrangler dev
   отдают собранный сайт, там он регистрируется, как на боевом. */
if ('serviceWorker' in navigator && !document.querySelector('script[src="/@vite/client"]')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => console.warn('sw:', error));
  });
}
