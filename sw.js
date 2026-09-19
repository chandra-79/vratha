const CACHE_NAME = 'vratha-cache-v4';
const APP_ASSETS = ['./', './index.html', './companion.css', './companion.js', './practices.js', './audio/rama.m4a', './audio/hanuman.m4a', './audio/shiva.m4a', './audio/gayatri.m4a', './audio/durga.m4a', './icon.svg', './icon-192.png', './Manthram.png', './Manthram_English.png', './Manthram.mpeg', './Manthram_Variation.mp3'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_ASSETS)).then(() => self.skipWaiting()));
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
    const isShell = request.mode === 'navigate' || ['script','style'].includes(request.destination);
    if (!isShell) { const cached = await cache.match(request); if (cached) return cached; }
    try {
      const response = await fetch(request);
      if (response.ok && response.status === 200) await cache.put(request,response.clone());
      return response;
    } catch (_) {
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
      return Response.error();
    }
  })());
});
