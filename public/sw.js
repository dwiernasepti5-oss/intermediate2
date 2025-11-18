const CACHE_NAME = 'mstory-cache-v1';
const API_CACHE = 'mstory-api-cache-v1';

const APP_SHELL = [
  './',
  './index.html',
  './styles/styles.css',
  './images/logo.png',
  './images/icon-192.png',
  './images/icon-152.png',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.pathname.includes('/stories')) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        try {
          const resp = await fetch(req);
          if (req.method === 'GET' && resp && resp.ok) {
            try {
              await cache.put(req, resp.clone());
            } catch (e) {
              console.warn('Cache put failed for', req.url, e);
            }
          }
          return resp;
        } catch {
          const cached = await cache.match(req);
          return (
            cached ||
            new Response(
              JSON.stringify({ error: true, message: 'Offline' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((resp) => resp)
        .catch(() => {
          if (req.mode === 'navigate') return caches.match('./index.html');
          return new Response(null, { status: 504 });
        });
    })
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'MStory', message: 'Cerita baru diposting!', url: './' };
  }

  const title = data.title || 'MStory';
  const options = {
    body: data.message,
    icon: './images/icon-192.png',
    badge: './images/icon-192.png',
    data: { url: data.url || './' },
    actions: [
      { action: 'open', title: 'Lihat Detail' },
      { action: 'close', title: 'Tutup' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientsArr) => {
        for (const client of clientsArr) {
          client.focus();
          client.postMessage({ type: 'NAVIGATE', url });
          return;
        }
        return clients.openWindow(url);
      })
  );
});
