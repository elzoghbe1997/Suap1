const CACHE_VERSION = 'v8'; // Bump version
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
        caches.open(CACHE_NAME).then(cache => {
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
                    if (cacheName.startsWith('greenhouse-accountant-') && cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Ensure the new SW takes control immediately.
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;

    // Strategy: Network falling back to cache for navigation requests.
    // This ensures users get the latest HTML if they are online.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => {
                // If the network fails, serve the main app shell from cache.
                console.log('Service Worker: Fetch failed for navigation. Serving index.html from cache.');
                return caches.match('index.html');
            })
        );
        return;
    }

    // Strategy: Stale-While-Revalidate for other assets (JS, CSS, fonts, etc.).
    // This serves assets from cache for speed, then updates the cache in the background.
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(request).then(cachedResponse => {
                const fetchPromise = fetch(request).then(networkResponse => {
                    // Check for valid responses before caching.
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(request, networkResponse.clone());
                    }
                    return networkResponse;
                });

                // Return cached response immediately if available, otherwise wait for network.
                return cachedResponse || fetchPromise;
            });
        })
    );
});
