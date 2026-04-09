const CACHE = 'kalorie-v2';

// Zjistíme base path dynamicky (funguje na / i na /kalorie/)
const BASE = self.registration.scope;

const FILES = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icon-192.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(FILES.map(url =>
        fetch(url).then(r => c.put(url, r)).catch(() => {})
      ))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Jen GET requesty
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(r => {
        // Cachuj úspěšné responses
        if (r && r.status === 200) {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return r;
      }).catch(() => {
        // Offline fallback — vrať index.html pro navigační requesty
        if (e.request.mode === 'navigate') {
          return caches.match(BASE + 'index.html') || caches.match(BASE);
        }
      });
    })
  );
});
