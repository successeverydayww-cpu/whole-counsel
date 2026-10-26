const VER = 'whole-counsel-v6.11';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './bible.json'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // app pages: network-first so every user gets updates immediately; cache is the offline fallback
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === location.pathname + './' || url.pathname === location.pathname) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) caches.open(VER).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }
  // assets & data: cache-first for instant offline performance
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit ||
      fetch(e.request).then(res => {
        if (res.ok) caches.open(VER).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match('./index.html'))
    )
  );
});
