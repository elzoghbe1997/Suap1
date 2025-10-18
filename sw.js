const CACHE_VERSION = 'v4';
const CACHE_NAME = `greenhouse-accountant-${CACHE_VERSION}`;
const APP_SHELL_URLS = [
    '/',
    'index.html',
    'manifest.json',
    'icon.svg',
    'https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap',
    'https://unpkg.com/@babel/standalone/babel.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching App Shell');
                // Use { cache: 'reload' } to bypass browser cache and fetch from network
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

    // App Shell model for navigation (Network-first, then cache)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(networkResponse => {
                    // If response is not OK, throw error to go to catch block
                    if (!networkResponse.ok) {
                        throw new Error('Network response was not ok for navigate request.');
                    }
                    // Clone and cache the valid response for future offline use
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache);
                    });
                    return networkResponse;
                })
                .catch(() => {
                    // Network failed, serve the main index.html from cache
                    // This is crucial for SPA routing and offline launch
                    return caches.match('index.html');
                })
        );
        return;
    }

    // Cache-first strategy for all other assets (CSS, JS, fonts, etc.)
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            // Return from cache if found
            if (cachedResponse) {
                return cachedResponse;
            }

            // Otherwise, fetch from network, then cache and return
            return fetch(request).then(networkResponse => {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    // Don't cache chrome-extension requests
                    if (!request.url.startsWith('chrome-extension://')) {
                        cache.put(request, responseToCache);
                    }
                });
                return networkResponse;
            }).catch(error => {
                // If fetching fails (e.g., offline), do nothing. The request will fail.
                console.warn(`Service Worker: Fetch failed for ${request.url}`, error);
            });
        })
    );
});