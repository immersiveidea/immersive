const VERSION = '0';
const CACHE = "pwabuilder-offline";
const PRECACHE_ASSETS = [
    '/grass1.jpeg',
    '/loading-loading-forever.gif',
    '/outdoor_field2.jpeg'
]
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});


workbox.routing.registerRoute(
    new RegExp('/.*\\.png'),
    new workbox.strategies.StaleWhileRevalidate({
        cacheName: CACHE
    })
);
workbox.routing.registerRoute(
    new RegExp('/.*\\.jpeg'),
    new workbox.strategies.StaleWhileRevalidate({
        cacheName: CACHE
    })
);
workbox.routing.registerRoute(
    new RegExp('/.*\\.jpg'),
    new workbox.strategies.StaleWhileRevalidate({
        cacheName: CACHE
    })
);
workbox.routing.registerRoute(
    new RegExp('/.*\\.glb'),
    new workbox.strategies.StaleWhileRevalidate({
        cacheName: CACHE
    })
);


workbox.routing.registerRoute(
    new RegExp('/login'),
    new workbox.strategies.NetworkFirst()
)