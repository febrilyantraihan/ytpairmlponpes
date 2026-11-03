/**
 * YTPAI RAUDLATUL MUTA'ALLIMIN LAMONGAN - SERVICE WORKER (PWA)
 * Version: 1.0.0
 * Strategy: Network-First for HTML/Data, Stale-While-Revalidate for Static Assets
 */

const CACHE_NAME = 'ytpai-portal-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/psb.html',
  '/berita.html',
  '/fasilitas.html',
  '/prestasi.html',
  '/sejarah.html',
  '/kbihu.html',
  '/lbb.html',
  '/css/main.css',
  '/css/components.css',
  '/css/animations.css',
  '/js/data.js',
  '/js/main.js',
  '/assets/logo.png',
  '/assets/favicon-32x32.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/site.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA Pre-cache partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ignore non-GET or cross-origin analytics/APIs
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Bypass Google Sheets Webhook, Groq/Gemini AI APIs
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network-First for HTML navigation requests
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Stale-While-Revalidate for CSS, JS, and Assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

