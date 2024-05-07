importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js');
const VERSION = '2';
const CACHE = "deepdiagram";

// TODO: replace the following with the correct offline fallback page i.e.: const offlineFallbackPage = "offline.html";
const offlineFallbackPage = "/";

self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

self.addEventListener('install', async (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then((cache) => cache.add(offlineFallbackPage))
    );
});

if (workbox.navigationPreload.isSupported()) {
    workbox.navigationPreload.enable();
}
workbox.routing.registerRoute(
    new RegExp('/.*\\.png'),
    new workbox.strategies.CacheFirst({
        cacheName: CACHE
    })
);
workbox.routing.registerRoute(
    new RegExp('/db/.*'),
    new workbox.strategies.CacheFirst({
        cacheName: CACHE
    })
);
workbox.routing.registerRoute(
    new RegExp('/.*\\.svg'),
    new workbox.strategies.CacheFirst({
        cacheName: CACHE
    })
);
workbox.routing.registerRoute(
    new RegExp('/.*\\.jpeg'),
    new workbox.strategies.CacheFirst({
        cacheName: CACHE
    })
);
workbox.routing.registerRoute(
    new RegExp('/.*\\.jpg'),
    new workbox.strategies.CacheFirst({
        cacheName: CACHE
    })
);
workbox.routing.registerRoute(
    new RegExp('/.*\\.glb'),
    new workbox.strategies.CacheFirst({
        cacheName: CACHE
    })
);
workbox.routing.registerRoute(
    new RegExp('/.*\\.css'),
    new workbox.strategies.CacheFirst({
        cacheName: CACHE
    })
);
workbox.routing.registerRoute(
    new RegExp('/.*\\.js'),
    new workbox.strategies.CacheFirst({
        cacheName: CACHE
    })
);
workbox.routing.registerRoute(
    new RegExp('/.*\\.wasm'),
    new workbox.strategies.CacheFirst({
        cacheName: CACHE
    })
);
self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const preloadResp = await event.preloadResponse;
                if (preloadResp) {
                    return preloadResp;
                }
                const networkResp = await fetch(event.request);
                return networkResp;
            } catch (error) {

                const cache = await caches.open(CACHE);
                const cachedResp = await cache.match(offlineFallbackPage);
                return cachedResp;
            }
        })());
    }
});