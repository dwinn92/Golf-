/*
 * Fairway service worker.
 *
 * Golf courses have poor signal, so the app itself is cached and served from
 * the device. Only the shell is cached — never Supabase traffic, which must
 * always be live so nobody is shown a stale scoring record.
 */
const CACHE = 'fairway-v1';
const SHELL = ['/', '/index.html', '/config.js', '/vendor/supabase.js', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Anything that is not this site — Supabase above all — goes straight to the
  // network. A cached API response would mean showing someone stale handicaps.
  if (url.origin !== self.location.origin) return;

  // Navigations: serve the app immediately, refresh the copy in the background.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html').then((r) => r || Response.error()))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
