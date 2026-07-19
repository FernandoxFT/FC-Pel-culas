// service-worker.js — FC MOVIES+ v3 | Optimizado
// Estrategias: Cache First (estáticos), Network First (datos), SWR (imágenes)

const APP_VERSION   = 'v3.0.2';
const STATIC_CACHE  = `fc-movies-static-${APP_VERSION}`;
const DYNAMIC_CACHE = `fc-movies-dynamic-${APP_VERSION}`;
const IMAGE_CACHE   = `fc-movies-images-${APP_VERSION}`;

// Límites de caché dinámica
const DYNAMIC_CACHE_LIMIT = 60;
const IMAGE_CACHE_LIMIT   = 80;

// App Shell — recursos críticos precacheados
const APP_SHELL = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './css/variables.css',
    './css/base.css',
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
    './js/menu-extra.js',
    './js/mobile-menu.js',
    './js/pwa.js',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-192.png',
    './icons/icon-maskable-512.png',
    './icons/apple-touch-icon.png'
];

// Recursos que NUNCA se cachean
function esNoCacheable(url) {
    return (
        url.hostname.includes('supabase.co') ||
        url.hostname.includes('supabase.in') ||
        url.pathname.endsWith('.mp4')  ||
        url.pathname.endsWith('.webm') ||
        url.pathname.endsWith('.m3u8') ||
        url.pathname.includes('/video') ||
        url.search.includes('no-cache')
    );
}

// Recursos de datos dinámicos (Network First)
function esDatosDinamicos(url) {
    return (
        url.pathname.endsWith('movies.json') ||
        url.pathname.includes('/api/') ||
        url.hostname.includes('supabase')
    );
}

// Recursos estáticos de CDN (Cache First con TTL largo)
function esCDN(url) {
    return (
        url.hostname.includes('cdn.jsdelivr.net') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com')
    );
}

/* ─── INSTALL: Precachear App Shell ─── */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                // addAll con manejo de errores individual
                return Promise.allSettled(
                    APP_SHELL.map(url =>
                        cache.add(url).catch(err =>
                            console.warn(`[SW] No se pudo cachear ${url}:`, err)
                        )
                    )
                );
            })
            .then(() => {
                console.log(`[SW] App Shell cacheado (${APP_VERSION})`);
                // Activar inmediatamente sin esperar a que se cierre la pestaña
                return self.skipWaiting();
            })
    );
});

/* ─── ACTIVATE: Limpiar cachés antiguas y tomar control ─── */
self.addEventListener('activate', (event) => {
    const VALID_CACHES = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];

    event.waitUntil(
        caches.keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => !VALID_CACHES.includes(key))
                        .map((key) => {
                            console.log(`[SW] Eliminando caché antigua: ${key}`);
                            return caches.delete(key);
                        })
                )
            )
            .then(() => {
                console.log(`[SW] Service Worker activado (${APP_VERSION})`);
                // Tomar control de todas las pestañas abiertas
                return self.clients.claim();
            })
            .then(() => {
                // Notificar a los clientes que hay una nueva versión
                return self.clients.matchAll({ type: 'window' });
            })
            .then((clients) => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'SW_UPDATED',
                        version: APP_VERSION
                    });
                });
            })
    );
});

/* ─── FETCH: Estrategias de caché ─── */
self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    // Nunca cachear estos recursos
    if (esNoCacheable(url)) return;

    // ── Estrategia 1: NETWORK FIRST para datos dinámicos ──
    // Intenta red primero; si falla, usa caché
    if (esDatosDinamicos(url)) {
        event.respondWith(networkFirst(req, DYNAMIC_CACHE));
        return;
    }

    // ── Estrategia 2: CACHE FIRST para CDN (fuentes, librerías) ──
    // Recursos externos que no cambian frecuentemente
    if (esCDN(url)) {
        event.respondWith(cacheFirst(req, DYNAMIC_CACHE));
        return;
    }

    // ── Estrategia 3: STALE-WHILE-REVALIDATE para imágenes ──
    // Sirve desde caché inmediatamente, actualiza en background
    if (req.destination === 'image') {
        event.respondWith(staleWhileRevalidate(req, IMAGE_CACHE, IMAGE_CACHE_LIMIT));
        return;
    }

    // ── Estrategia 4: CACHE FIRST para recursos del mismo origen ──
    // App Shell y recursos estáticos
    if (url.origin === self.location.origin) {
        event.respondWith(cacheFirst(req, STATIC_CACHE));
        return;
    }
});

/* ─── Implementaciones de estrategias ─── */

/**
 * Cache First: sirve desde caché; si no está, va a la red y cachea.
 * Ideal para: App Shell, CSS, JS, fuentes.
 */
async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        // Fallback offline para páginas HTML
        if (request.destination === 'document') {
            return caches.match('./index.html');
        }
        return new Response('', { status: 503, statusText: 'Service Unavailable' });
    }
}

/**
 * Network First: va a la red primero; si falla, usa caché.
 * Ideal para: datos dinámicos (movies.json, APIs).
 */
async function networkFirst(request, cacheName) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
            await trimCache(cacheName, DYNAMIC_CACHE_LIMIT);
        }
        return response;
    } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(JSON.stringify({ error: 'Sin conexión', offline: true }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Stale-While-Revalidate: sirve caché inmediatamente y actualiza en background.
 * Ideal para: imágenes de portadas.
 */
async function staleWhileRevalidate(request, cacheName, limit) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    // Actualizar en background (no bloquea la respuesta)
    const fetchPromise = fetch(request)
        .then(async (response) => {
            if (response.ok) {
                await cache.put(request, response.clone());
                await trimCache(cacheName, limit);
            }
            return response;
        })
        .catch(() => null);

    // Servir caché inmediatamente si existe, sino esperar la red
    return cached || fetchPromise || new Response('', { status: 404 });
}

/**
 * Limitar el tamaño de una caché eliminando las entradas más antiguas.
 */
async function trimCache(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
        const toDelete = keys.slice(0, keys.length - maxItems);
        await Promise.all(toDelete.map(key => cache.delete(key)));
    }
}

/* ─── Mensajes desde la app ─── */
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data?.type === 'GET_VERSION') {
        event.source?.postMessage({
            type: 'SW_VERSION',
            version: APP_VERSION
        });
    }
    if (event.data?.type === 'CLEAR_CACHE') {
        caches.keys().then(keys =>
            Promise.all(keys.map(key => caches.delete(key)))
        ).then(() => {
            event.source?.postMessage({ type: 'CACHE_CLEARED' });
        });
    }
});
