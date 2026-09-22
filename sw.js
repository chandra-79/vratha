const CACHE_NAME = 'vratha-cache-v9';
const APP_ASSETS = ['./', './index.html', './companion.css', './companion.js', './practices.js', './custom-practices.js', './manifest.webmanifest', './assets/naam-jaap-logo.png', './assets/favicon.png', './assets/icon-192.png', './assets/icon-512.png', './assets/ganapati.svg', './assets/rama.svg', './assets/hanuman.svg', './assets/shiva.svg', './assets/gayatri.svg', './assets/durga.svg', './assets/krishna.svg', './assets/narayana.svg', './assets/mrityunjaya.svg', './assets/lakshmi.svg', './assets/saraswati.svg', './assets/subrahmanya.svg', './audio/rama.m4a', './audio/hanuman.m4a', './audio/shiva.m4a', './audio/gayatri.m4a', './audio/durga.m4a', './audio/krishna.m4a', './audio/mrityunjaya.m4a', './audio/narayana.m4a', './audio/lakshmi.m4a', './audio/saraswati.m4a', './audio/subrahmanya.m4a', './icon.svg', './icon-192.png', './Manthram.png', './Manthram_English.png', './Manthram.mpeg', './Manthram_Variation.mp3'];
self.addEventListener('install', event => {
  // Added one by one rather than with addAll: addAll is all-or-nothing, so a
  // single missing or failing asset in this long media list would abort the
  // whole install and leave the app with no offline support at all.
  event.waitUntil(caches.open(CACHE_NAME)
    .then(cache => Promise.all(APP_ASSETS.map(asset => cache.add(asset).catch(() => null))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('vratha-cache-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.headers.has('range')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const full = await cache.match(request.url);
      const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range'));
      if (!full || !match) return fetch(request);
      const bytes = await full.arrayBuffer();
      const start = match[1] ? Number(match[1]) : Math.max(0, bytes.byteLength - Number(match[2]));
      const end = match[1] && match[2] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1;
      if (start > end || start >= bytes.byteLength) return new Response(null, {status:416,headers:{'Content-Range':'bytes */'+bytes.byteLength}});
      return new Response(bytes.slice(start,end+1), {status:206,headers:{'Content-Type':full.headers.get('Content-Type') || 'audio/mpeg','Content-Range':'bytes '+start+'-'+end+'/'+bytes.byteLength,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'}});
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const isNavigate = request.mode === 'navigate';
    const isShell = isNavigate || ['script','style'].includes(request.destination);
    // Every navigation returns the same document; ?practice=<id> only selects a
    // view once the app is running. Store it under one key so the app is not
    // cached again per practice.
    const cacheKey = isNavigate ? './index.html' : request;
    if (!isShell) { const cached = await cache.match(request); if (cached) return cached; }
    try {
      const response = await fetch(request);
      if (response.ok && response.status === 200) await cache.put(cacheKey,response.clone());
      return response;
    } catch (_) {
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
      if (isNavigate) return (await cache.match('./index.html')) || Response.error();
      return Response.error();
    }
  })());
});
