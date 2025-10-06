const CACHE_VERSION = 'v2';
const CACHE_NAME = `greenhouse-accountant-${CACHE_VERSION}`;
const APP_SHELL_URLS = [
    '/',
    '/index.html',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
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
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    const { request } = event;

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then(response => {
                        return response || caches.match('/index.html');
                    });
                })
        );
        return;
    }

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
                console.error('Fetching failed:', error);
            });
        })
    );
});
