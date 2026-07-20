const CACHE_NAME = 'builderp-v1';

// Static resources to cache for offline availability of the app shell
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/maskable-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching initial PWA assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Network First strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;
  
  // Skip caching for non-GET requests and API calls
  if (req.method !== 'GET' || req.url.includes('/api/') || req.url.includes('chrome-extension:')) {
    event.respondWith(fetch(req));
    return;
  }

  // Network First, fallback to cache
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        // If successful response, cache it for offline fallback
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if network is unavailable
        return caches.match(req).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If a page navigation fails, return the index.html/root shell
          if (req.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});

// Listen to update messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
