/* =========================================================
   R-compense — Service Worker v4
   Stratégie :
   - Network-First pour la navigation HTML
   - Cache-First pour les assets statiques
   ========================================================= */

const CACHE_NAME = "rcompense-v4";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./sw.js",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-192.png",
  "./icon-maskable-512.png"
];

/* ---- Install : pré-cache des assets ---- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* ---- Activate : purge anciens caches ---- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ---- Fetch ---- */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  /* Navigation HTML : Network-First */
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put("./index.html", clone);
            });
          }
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  /* Assets statiques : Cache-First */
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          return undefined;
        });
    })
  );
});

/* ---- Message : forcer mise à jour ---- */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
