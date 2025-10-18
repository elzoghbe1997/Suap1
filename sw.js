const CACHE_VERSION = 'v9'; // Bump version
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
        caches.open(CACHE_NAME).then(cache => {
            console.log('Service Worker: Caching App Shell for offline use.');
            // We are not caching external resources during install anymore
            // to make installation more reliable. The fetch handler will
            // cache them on first use.
            return cache.addAll(APP_SHELL_URLS);
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
