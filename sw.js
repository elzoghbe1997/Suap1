const CACHE_VERSION = 'v6';
const CACHE_NAME = `greenhouse-accountant-${CACHE_VERSION}`;
const APP_SHELL_URLS = [
    '/',
    'index.html',
    'manifest.json',
    'icon.svg',
    'icon-192.png',
    'icon-512.png',
    'icon-maskable-512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap',
    'https://unpkg.com/@babel/standalone/babel.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching App Shell for offline use.');
                const requests = APP_SHELL_URLS.map(url => new Request(url, { cache: 'reload' }));
                return cache.addAll(requests);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;

    // Strategy: Network-first for navigation, then cache. This ensures users get the latest HTML.
    // A robust offline fallback is critical for PWA installation criteria.
    if (request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    const networkResponse = await fetch(request);
                    // Check if the response is valid before caching
                    if (networkResponse && networkResponse.ok) {
                        const cache = await caches.open(CACHE_NAME);
                        cache.put(request, networkResponse.clone());
                    }
                    return networkResponse;
                } catch (error) {
                    console.log('Service Worker: Fetch failed for navigation, returning offline fallback.', error);
                    // When offline, the browser's installability check needs a valid response for the start_url.
                    const cache = await caches.open(CACHE_NAME);
                    // Try to match the exact request first.
                    const cachedResponse = await cache.match(request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // If the exact request isn't cached (e.g. for '/'), serve 'index.html' as the SPA shell.
                    const fallbackResponse = await cache.match('index.html');
                    return fallbackResponse;
                }
            })()
        );
        return;
    }

    // Strategy: Cache-first for all other assets (JS, CSS, images, fonts).
    // This is fast and reliable for offline use.
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request).then(networkResponse => {
                // Check for valid, cacheable responses
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic' && !request.url.startsWith('chrome-extension://')) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(error => {
                console.warn(`Service Worker: Fetch failed for asset ${request.url}`, error);
                // For non-navigation requests, if it's not in cache and network fails, it will result in a browser error.
                // This is usually acceptable for non-critical assets.
            });
        })
    );
});
