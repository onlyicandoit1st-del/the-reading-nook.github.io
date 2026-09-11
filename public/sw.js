// Lumen Reader Service Worker
const CACHE_NAME = "lumen-reader-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icon.svg",
  "/apple-touch-icon.png",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/pwa-maskable-512x512.png",
];

// Install event: Precache core shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()),
  );
});

// Activate event: Clean up previous cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch event: Network-first for dynamic navigation, cache-first for static fonts and assets
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Ignore non-GET requests or chrome-extension URLs
  if (request.method !== "GET" || !request.url.startsWith("http")) {
    return;
  }

  // Handle Google Fonts and static assets with CacheFirst
  if (
    request.url.includes("fonts.googleapis.com") ||
    request.url.includes("fonts.gstatic.com") ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        });
      }),
    );
    return;
  }

  // Stale-while-revalidate or Network-first with fallback for HTML/scripts
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Fallback to home page if navigation fails offline
        if (request.mode === "navigate") {
          return caches.match("/");
        }
        return new Response("Offline", { status: 503, statusText: "Offline" });
      }),
  );
});
