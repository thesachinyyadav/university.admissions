// Christ University Gated Access - Service Worker
// Version 2.0.0 - Enhanced Caching & Performance

const CACHE_VERSION = 'cu-access-v2.0.0';
const CACHE_NAME = `${CACHE_VERSION}-static`;
const DATA_CACHE_NAME = `${CACHE_VERSION}-data`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/visitor-register',
  '/retrieve-qr',
  '/login',
  '/guard',
  '/verify',
  '/404',
  '/christunilogo.png',
  '/christunifavcion.png',
  '/socio.png',
  '/securityimage.jpg',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-384x384.png',
  '/manifest.json'
];

// API endpoints to cache for offline support
const CACHEABLE_API_ROUTES = [
  '/api/approved-events',
  '/api/lobby/status',
];

// Cache duration settings (in milliseconds)
const CACHE_DURATIONS = {
  api: 5 * 60 * 1000,      // 5 minutes for API data
  static: 24 * 60 * 60 * 1000, // 24 hours for static assets
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing v2.0.0...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('cu-access-') && 
                     !cacheName.startsWith(CACHE_VERSION);
            })
            .map((cacheName) => {
              console.log('[ServiceWorker] Removing old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Helper: Check if cache is expired
function isCacheExpired(response, duration) {
  if (!response) return true;
  
  const cachedDate = response.headers.get('sw-cached-date');
  if (!cachedDate) return true;
  
  const age = Date.now() - parseInt(cachedDate);
  return age > duration;
}

// Helper: Add timestamp to cached response
async function cacheWithTimestamp(cache, request, response) {
  const headers = new Headers(response.headers);
  headers.append('sw-cached-date', Date.now().toString());
  
  const body = await response.clone().blob();
  const timestampedResponse = new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
  
  await cache.put(request, timestampedResponse);
}

// Fetch event - optimized caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip POST, PUT, DELETE requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests - stale-while-revalidate strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request, url));
    return;
  }

  // Next.js static files - cache first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Static assets & pages - cache first with network fallback
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with stale-while-revalidate
async function handleApiRequest(request, url) {
  const cache = await caches.open(DATA_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Check if this is a cacheable API route
  const isCacheable = CACHEABLE_API_ROUTES.some(route => url.pathname.startsWith(route));
  
  // For non-cacheable routes, always go to network
  if (!isCacheable) {
    try {
      return await fetch(request);
    } catch (error) {
      // Return cached version if available during network failure
      if (cachedResponse) {
        console.log('[ServiceWorker] Network failed, using cache for:', url.pathname);
        return cachedResponse;
      }
      throw error;
    }
  }
  
  // Stale-while-revalidate: return cached immediately, update in background
  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response.status === 200) {
        await cacheWithTimestamp(cache, request, response.clone());
      }
      return response;
    })
    .catch((error) => {
      console.log('[ServiceWorker] Network failed for:', url.pathname);
      return null;
    });
  
  // Return cached response immediately if available and not too old
  if (cachedResponse && !isCacheExpired(cachedResponse, CACHE_DURATIONS.api)) {
    // Revalidate in background
    fetchPromise.catch(() => {});
    return cachedResponse;
  }
  
  // Wait for network response
  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }
  
  // Fallback to cached response (even if expired)
  if (cachedResponse) {
    console.log('[ServiceWorker] Using stale cache for:', url.pathname);
    return cachedResponse;
  }
  
  // No cache available
  return new Response(JSON.stringify({ error: 'Offline', cached: false }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle static requests
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/');
      if (offlinePage) return offlinePage;
    }
    
    throw error;
  }
}

// Periodic cache cleanup
self.addEventListener('message', (event) => {
  if (event.data === 'CLEANUP_CACHE') {
    console.log('[ServiceWorker] Cleaning up old cache entries...');
    
    caches.open(DATA_CACHE_NAME).then(async (cache) => {
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (isCacheExpired(response, CACHE_DURATIONS.api * 2)) {
          console.log('[ServiceWorker] Removing expired:', request.url);
          await cache.delete(request);
        }
      }
    });
  }
  
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Sync event:', event.tag);
  
  if (event.tag === 'sync-registrations') {
    event.waitUntil(syncOfflineRegistrations());
  }
});

async function syncOfflineRegistrations() {
  // Future: Implement offline registration queue sync
  console.log('[ServiceWorker] Syncing offline registrations...');
  return Promise.resolve();
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'close', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Christ University Access', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked');
  
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(clients.openWindow('/'));
  }
});

console.log('[ServiceWorker] v2.0.0 Loaded');
