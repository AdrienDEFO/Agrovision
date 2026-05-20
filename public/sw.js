// AgroVision PWA Service Worker for high resilience offline operations in rural areas.
const CACHE_NAME = 'agrovision-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  '/App.tsx',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching Core Application Shell Assets');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[SW] Caching assets warning during install:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Cache First with Network Fallback strategy for static / external resources
// and Network First wrapper for critical items like weather forecasts or AI fallback endpoints
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip POST requests (ex: chat upload, server calls, remote analytics)
  if (req.method !== 'GET') {
    return;
  }

  // Handle weather API and internal web server endpoints separately
  if (url.hostname.includes('api.open-meteo.com') || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          // Cache successful fetch results dynamically
          const clonedRes = response.clone();
          caches.open('agrovision-dynamic-api').then((cache) => {
            cache.put(req, clonedRes);
          });
          return response;
        })
        .catch(() => {
          // Serve stale cache in case of severe network turbulence
          return caches.match(req).then((cached) => {
            if (cached) return cached;
            // Return dummy offline JSON fallback if available
            return new Response(JSON.stringify({ offline: true, error: "Connection turbulence active" }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Standard static files & media caching rule (Stale While Revalidate)
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Quietly eat fetch error if we have cached item already
          return cached;
        });

      // Prefer cached quickly, fell back or validate in background
      return cached || fetchPromise;
    })
  );
});
