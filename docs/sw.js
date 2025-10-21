// BytePlus Video AI Bootcamp 2025 - Service Worker
// Version: 1.0.0
// Purpose: Offline support and performance optimization

const CACHE_VERSION = 'byteplus-bootcamp-v1.0.0';
const CACHE_ASSETS = [
  '/byteplus-bootcamp-landing.html',
  '/manifest.json',
  '/assets/byteplus-bootcamp-hero-bg.webp',
  '/assets/byteplus-bootcamp-hero-bg.jpg',
  '/assets/byteplus-bootcamp-og.png',
  '/assets/favicon-16x16.svg',
  '/assets/favicon-32x32.svg',
  '/assets/favicon-180x180.svg',
  '/assets/favicon-192x192.svg',
  '/assets/favicon-master.svg',
  '/assets/icons/icon-market-understanding.svg',
  '/assets/icons/icon-technical-understanding.svg',
  '/assets/icons/icon-implementation-skills.svg',
  '/assets/icons/icon-hands-on-experience.svg',
  '/assets/icons/icon-monetization-knowledge.svg',
  '/assets/icons/icon-immediate-readiness.svg'
];

// Install Event - Cache assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => {
        console.log('[Service Worker] Caching assets');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Install complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[Service Worker] Install failed:', error);
      })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old cache versions
              return cacheName !== CACHE_VERSION;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch Event - Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (analytics, etc.)
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', request.url);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        console.log('[Service Worker] Fetching from network:', request.url);
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response (can only be consumed once)
            const responseToCache = response.clone();

            // Cache the fetched response for future use
            caches.open(CACHE_VERSION)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);

            // Return offline page if available
            return caches.match('/offline.html')
              .then((offlineResponse) => {
                return offlineResponse || new Response(
                  '<h1>Offline</h1><p>インターネット接続がありません。</p>',
                  {
                    headers: { 'Content-Type': 'text/html; charset=utf-8' }
                  }
                );
              });
          });
      })
  );
});

// Background Sync (optional - for future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-analytics') {
    console.log('[Service Worker] Background sync: analytics');
    // Sync analytics data when online
  }
});

// Push Notification (optional - for future enhancement)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'BytePlus Bootcamp 通知',
    icon: '/assets/favicon-192x192.svg',
    badge: '/assets/favicon-180x180.svg',
    vibrate: [200, 100, 200],
    tag: 'byteplus-bootcamp',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('BytePlus Video AI Bootcamp', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/byteplus-bootcamp-landing.html')
  );
});

// Message Handler (for communication with main thread)
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[Service Worker] Loaded successfully');
