// service-worker.js — FC PREMIUM
// Cachea el "app shell" (HTML/CSS/JS/íconos) para que la app abra rápido y
// funcione offline. NUNCA cachea películas, videos ni llamadas a Supabase:
// esos siempre deben ir a la red para no servir datos viejos ni llenar el
// almacenamiento del dispositivo con archivos pesados.

const CACHE_VERSION = 'fc-premium-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './css/base.css',
  './css/variables.css',
  './css/navbar.css',
  './css/splash.css',
  './css/banner.css',
  './css/cards.css',
  './css/modal.css',
  './css/cart.css',
  './css/plans.css',
  './css/auth.css',
  './css/admin.css',
  './css/notifications.css',
  './css/responsive.css',
  './js/config.js',
  './js/movies.js',
  './js/favorites.js',
  './js/cart.js',
  './js/player.js',
  './js/plans.js',
  './js/payments.js',
  './js/auth.js',
  './js/admin.js',
  './js/ui.js',
  './js/app.js',
  './js/mobile-menu.js',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

// Nunca cachear estos orígenes/rutas, aunque coincidan con otras reglas.
function esNoCacheable(url) {
  return (
    url.hostname.includes('supabase.co') ||   // API/DB/auth de Supabase
    url.hostname.includes('supabase.in') ||
    url.pathname.endsWith('.mp4') ||
    url.pathname.endsWith('.webm') ||
    url.pathname.endsWith('.m3u8') ||
    url.pathname.includes('/video') ||
    url.pathname === '/movies.json'           // catálogo: siempre fresco
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('fc-premium-') && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1) Nunca tocar Supabase, video ni el catálogo: siempre red directa.
  if (esNoCacheable(url)) {
    return; // deja que el navegador maneje la petición normalmente
  }

  // 2) Imágenes de pósters/portadas externas: network-first con fallback a caché,
  //    sin agregarlas al precache (para no inflar la instalación inicial).
  if (req.destination === 'image') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 3) App shell (HTML/CSS/JS/íconos propios): cache-first, con actualización
  //    en segundo plano (stale-while-revalidate) para no quedar desactualizado.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((res) => {
            const resClone = res.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(req, resClone));
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 4) Todo lo demás (CDNs de supabase-js, chart.js, etc.): red normal.
});
