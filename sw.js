/* Conecta V48: service worker do PWA.
   Estratégia "rede primeiro": com internet, o site sempre vem atualizado do servidor;
   a cópia guardada só é usada quando a pessoa está sem conexão. Assim uma nova
   publicação nunca fica presa no cache.
   Não passa pelo service worker: Firebase (login, banco), Google e outros sites,
   pedidos que não são GET e a página de confirmação de e-mail (os links levam
   códigos de uso único, que não devem ser guardados). */
const CACHE = 'conecta-v53';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n.startsWith('conecta-') && n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/confirmar.html')) return;
  event.respondWith(networkFirst(request, url));
});

async function networkFirst(request, url) {
  const cache = await caches.open(CACHE);
  // Páginas são guardadas sem os parâmetros do endereço.
  const key = request.mode === 'navigate' ? url.origin + url.pathname : request;
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') cache.put(key, response.clone()).catch(() => {});
    return response;
  } catch (error) {
    const saved = await cache.match(key);
    if (saved) return saved;
    if (request.mode === 'navigate') {
      const home = await cache.match(new URL('./', self.registration.scope).href);
      if (home) return home;
    }
    throw error;
  }
}
