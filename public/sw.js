/// Service Worker — LÉONA BLOM
/// Cache-first for images & static assets, network-first for API calls,
/// offline fallback for navigation requests.

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

const IMAGE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const IMAGE_MAX_ENTRIES = 200;

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/favicon.png',
];

/* ------------------------------------------------------------------ */
/*  Install – pre-cache shell                                         */
/* ------------------------------------------------------------------ */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

/* ------------------------------------------------------------------ */
/*  Activate – clean old caches                                       */
/* ------------------------------------------------------------------ */
self.addEventListener('activate', (event) => {
  const keep = new Set([STATIC_CACHE, IMAGE_CACHE, RUNTIME_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function isImageRequest(url) {
  return (
    /\.(jpe?g|png|gif|webp|avif|svg|ico)(\?.*)?$/i.test(url.pathname) ||
    url.pathname.includes('/storage/v1/object/public/')
  );
}

function isApiRequest(url) {
  return (
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.includes('/functions/') ||
    url.hostname.includes('supabase')
  );
}

function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|otf)(\?.*)?$/i.test(url.pathname);
}

/* ------------------------------------------------------------------ */
/*  Evict oldest entries when cache exceeds max                       */
/* ------------------------------------------------------------------ */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  // Delete oldest first (FIFO)
  const toDelete = keys.slice(0, keys.length - maxEntries);
  await Promise.all(toDelete.map((k) => cache.delete(k)));
}

/* ------------------------------------------------------------------ */
/*  Strategies                                                        */
/* ------------------------------------------------------------------ */

// Cache-first: try cache, fallback to network, then cache the response
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      if (cacheName === IMAGE_CACHE) trimCache(IMAGE_CACHE, IMAGE_MAX_ENTRIES);
    }
    return response;
  } catch {
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

// Network-first: try network, fallback to cache
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

// Stale-while-revalidate: return cache immediately, update in background
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

/* ------------------------------------------------------------------ */
/*  Fetch handler                                                     */
/* ------------------------------------------------------------------ */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and chrome-extension requests
  if (event.request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // API calls — network-first (data must be fresh)
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(event.request, RUNTIME_CACHE));
    return;
  }

  // Images — cache-first (bandwidth saver)
  if (isImageRequest(url)) {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE));
    return;
  }

  // JS/CSS/fonts — stale-while-revalidate
  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(event.request, STATIC_CACHE));
    return;
  }

  // Navigation (HTML pages) — network-first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      networkFirst(event.request, STATIC_CACHE).then((response) => {
        if (response.ok || response.status === 0) return response;
        // Return cached index for SPA routing
        return caches.match('/') || response;
      })
    );
    return;
  }

  // Everything else — network-first
  event.respondWith(networkFirst(event.request, RUNTIME_CACHE));
});
