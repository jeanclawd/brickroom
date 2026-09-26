// Offline cache for the Brickroom PWA. Bump VERSION whenever docs/ changes.
const VERSION = 'brickroom-muiltjjs';
const CORE = ['./', './index.html', './vendor/three.min.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './research/'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

// Same-origin files: cache first. Google Fonts: serve from cache, refresh in the background.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !fonts) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const hit = await cache.match(e.request, { ignoreSearch: !fonts });
      const fresh = fetch(e.request)
        .then((res) => {
          if (res.ok || res.type === 'opaque') cache.put(e.request, res.clone());
          return res;
        })
        .catch(() => hit);
      return hit || fresh;
    }),
  );
});
