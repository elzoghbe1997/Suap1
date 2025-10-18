const CACHE_VERSION = 'v10';
const CACHE_NAME = `greenhouse-accountant-${CACHE_VERSION}`;
const APP_SHELL_URLS = [
    '/',
    'index.html',
    'manifest.json',
    'icon.svg',
    'icon-192.png',
    'icon-512.png',
    'icon-maskable-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('SW: Caching App Shell on install.');
                return cache.addAll(APP_SHELL_URLS);
            })
            .then(() => self.skipWaiting()) // Force activation of new SW
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName.startsWith('greenhouse-accountant-') && cacheName !== CACHE_NAME) {
                        console.log('SW: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // For navigation requests, use Network-first to ensure users get the latest HTML.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // If the fetch is successful, cache it.
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                })
                .catch(() => {
                    // If network fails, serve from cache.
                    return caches.match(event.request)
                        .then(response => response || caches.match('/')); // Fallback to root
                })
        );
        return;
    }

    // For all other requests (assets, API calls etc.), use Cache-first strategy.
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // If we find a match in the cache, return it.
                if (response) {
                    return response;
                }
                
                // If not, fetch from network, cache it, and return the response.
                return fetch(event.request).then(networkResponse => {
                    // Check if we received a valid response.
                    // We don't want to cache error responses.
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
                        return networkResponse;
                    }

                    const responseToCache = networkResponse.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return networkResponse;
                });
            })
    );
});
