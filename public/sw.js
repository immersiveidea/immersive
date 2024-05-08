importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js');
const VERSION = '8';
const CACHE = "deepdiagram";
const IMAGEDELIVERY_CACHE = "deepdiagram-images";

// TODO: replace the following with the correct offline fallback page i.e.: const offlineFallbackPage = "offline.html";
const offlineFallbackPage = "/";
/*self.addEventListener('install', async (event) => {
   self.skipWaiting();
});
self.addEventListener('activate', async (event) => {
    self.skipWaiting();
    self.clients.matchAll({
        type: 'window'
    }).then(windowClients => {
        windowClients.forEach((windowClient) => {
            windowClient.navigate(windowClient.url);
        });
    });
});
*/
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});


/*self.addEventListener('install', async (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then((cache) => cache.add(offlineFallbackPage))
    );
});
*/
/*if (workbox.navigationPreload.isSupported()) {
    workbox.navigationPreload.enable();
}*/

workbox.routing.registerRoute(
    new RegExp('/.*\\.wasm'),
    new workbox.strategies.CacheFirst({
        cacheName: CACHE
    })
);
console.warn('workbox');

workbox.routing.registerRoute(
    new RegExp('/assets/.*'),
    new workbox.strategies.CacheFirst({
        cacheName: CACHE
    })
);

workbox.routing.registerRoute(
    new RegExp('.*imagedelivery.net.*'),
    new workbox.strategies.CacheFirst({
        cacheName: IMAGEDELIVERY_CACHE
    })
);
workbox.routing.registerRoute(
    new RegExp('/db/.*'),
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


