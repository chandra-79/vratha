const CACHE_NAME = 'vratha-cache-v1';
const ASSETS = [
  '/', '/index.html', '/Manthram.mpeg', '/Manthram.png'
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  // network-first for HTML, cache-first for others
  if (req.method !== 'GET') return;
  if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
    ev.respondWith(fetch(req).then(res => {
      const cloned = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, cloned));
      return res;
    }).catch(() => caches.match('/index.html')));
    return;
  }
  ev.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => { caches.open(CACHE_NAME).then(c => c.put(req, res.clone())); return res; })).catch(() => {}));
});
