const CACHE_VERSION = 'v3';
const CACHE_NAME = `greenhouse-accountant-${CACHE_VERSION}`;
const APP_SHELL_URLS = [
    '/',
    'index.html',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(APP_SHELL_URLS);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;

    // App Shell model for navigation
    if (request.mode === 'navigate') {
        event.respondWith(
            // Try network first to get the latest version
            fetch(request)
                .then(networkResponse => {
                    // If network returns an error (like 404), don't use it.
                    // Throw to fall into the catch block.
                    if (!networkResponse.ok) {
                        throw new Error('Network response was not ok.');
                    }
                    // Clone and cache the valid response
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache);
                    });
                    return networkResponse;
                })
                .catch(() => {
                    // If network fails or returns an error, serve the cached index.html as a fallback.
                    // This is the core fix for SPA routing and offline launch.
                    return caches.match('index.html');
                })
        );
        return;
    }

    // Cache-first for other assets
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request).then(networkResponse => {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    if (!request.url.startsWith('chrome-extension://')) {
                        cache.put(request, responseToCache);
                    }
                });
                return networkResponse;
            }).catch(error => {
                // Fetching failed, do nothing.
            });
        })
    );
});