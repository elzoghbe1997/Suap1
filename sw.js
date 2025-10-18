// Import Workbox from Google's CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Set a specific cache name for our app's assets.
workbox.core.setCacheNameDetails({ prefix: 'greenhouse-accountant' });

// This line immediately triggers the self.skipWaiting() and self.clients.claim()
// lifecycle events, which is a best practice for PWAs.
workbox.core.clientsClaim();
workbox.core.skipWaiting();


/**
 * Precaching App Shell
 * This tells Workbox to cache a list of files during the service worker's install phase.
 * These files make up the "app shell" and are essential for the app to run offline.
 */
const APP_SHELL_URLS = [
    { url: '/index.html', revision: null },
    { url: '/', revision: null },
    { url: '/manifest.json', revision: null },
    { url: '/icon.svg', revision: null },
    { url: '/icon-192.png', revision: null },
    { url: '/icon-512.png', revision: null },
    { url: '/icon-maskable-512.png', revision: null }
];
workbox.precaching.precacheAndRoute(APP_SHELL_URLS);

/**
 * Caching Strategies for Runtime Requests
 * Here we define how different types of requests should be handled.
 */

// 1. Google Fonts (stylesheets and font files)
// StaleWhileRevalidate for the CSS file, as it might change, but not critically.
workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com',
    new workbox.strategies.StaleWhileRevalidate({
        cacheName: 'google-fonts-stylesheets',
    })
);

// CacheFirst for the font files themselves, as they are versioned and immutable.
workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.CacheFirst({
        cacheName: 'google-fonts-webfonts',
        plugins: [
            new workbox.cacheableResponse.CacheableResponsePlugin({
                statuses: [0, 200], // Cache opaque responses for cross-origin font requests
            }),
            new workbox.expiration.ExpirationPlugin({
                maxAgeSeconds: 60 * 60 * 24 * 365, // Cache fonts for a year
                maxEntries: 30,
            }),
        ],
    })
);

// 2. Third-party CSS and JS libraries from CDNs.
// Use CacheFirst for these critical dependencies. Once they are cached,
// the app will load instantly and work offline reliably. This is crucial for PWA installability.
workbox.routing.registerRoute(
    ({ url }) =>
        url.origin === 'https://cdnjs.cloudflare.com' ||
        url.origin === 'https://cdn.tailwindcss.com' ||
        url.origin === 'https://unpkg.com' || // Babel compiler
        url.origin === 'https://aistudiocdn.com' || // React and other dependencies
        url.origin === 'https://cdn.jsdelivr.net', // Supabase
    new workbox.strategies.CacheFirst({
        cacheName: 'cdn-libraries',
        plugins: [
            new workbox.cacheableResponse.CacheableResponsePlugin({
                statuses: [0, 200], // Cache opaque responses for cross-origin requests
            }),
             new workbox.expiration.ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 365 * 24 * 60 * 60, // Cache for a year
            }),
        ],
    })
);

// 3. Navigation requests (HTML pages)
// Use NetworkFirst to ensure users see the latest version of the page if they are online.
// Fall back to the cached version if they are offline.
workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
        cacheName: 'pages',
        plugins: [
            new workbox.cacheableResponse.CacheableResponsePlugin({
                statuses: [200],
            }),
        ],
    })
);

// 4. Local App Source Code (TSX/TS files)
// StaleWhileRevalidate is a good strategy for the app's own code.
// It ensures the user gets updates in the background without blocking them.
workbox.routing.registerRoute(
    ({ request }) => 
        (request.destination === 'script' || request.destination === '') &&
        new URL(request.url).origin === self.location.origin &&
        /\.(tsx|ts)$/.test(new URL(request.url).pathname),
    new workbox.strategies.StaleWhileRevalidate({
        cacheName: 'app-source-code',
    })
);


// Default handler for any other requests (like images, if any are added later)
workbox.routing.setDefaultHandler(new workbox.strategies.StaleWhileRevalidate());
