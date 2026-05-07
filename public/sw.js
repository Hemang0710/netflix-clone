const CACHE_NAME = "learnai-v1";
const RUNTIME_CACHE = "learnai-runtime-v1";

const urlsToCache = [
  "/",
  "/offline.html",
  "/app.css",
  "/icon-192.png",
  "/icon-512.png"
];

// Install event - cache essential files
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Caching app shell");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log("[ServiceWorker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip external URLs
  if (url.origin !== location.origin) return;

  // Network first strategy with offline fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === "error") {
          return response;
        }

        // Clone and cache successful responses
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Network request failed, try cache
        return caches
          .match(request)
          .then((cached) => {
            if (cached) {
              return cached;
            }

            // Return offline page for navigation requests
            if (request.mode === "navigate") {
              return caches.match("/offline.html");
            }

            return new Response(
              JSON.stringify({ error: "Offline - content not available" }),
              { status: 503, headers: { "Content-Type": "application/json" } }
            );
          });
      })
  );
});

// Background sync for offline progress
self.addEventListener("sync", (event) => {
  console.log("[ServiceWorker] Background sync triggered:", event.tag);

  if (event.tag === "sync-progress") {
    event.waitUntil(syncProgressData());
  }
});

async function syncProgressData() {
  try {
    const db = await openDB();
    const pendingUpdates = await db.getAll("pending_updates");

    console.log(`[ServiceWorker] Syncing ${pendingUpdates.length} pending updates`);

    for (const update of pendingUpdates) {
      try {
        const response = await fetch(update.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(update.data)
        });

        if (response.ok) {
          await db.delete("pending_updates", update.id);
          console.log(`[ServiceWorker] Synced update:`, update.url);
        }
      } catch (error) {
        console.error(`[ServiceWorker] Sync failed for ${update.url}:`, error);
      }
    }
  } catch (error) {
    console.error("[ServiceWorker] Sync error:", error);
  }
}

// Helper: Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("LearnAI", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(new IDBWrapper(request.result));

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("storage")) {
        db.createObjectStore("storage", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("pending_updates")) {
        db.createObjectStore("pending_updates", { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

class IDBWrapper {
  constructor(db) {
    this.db = db;
  }

  get(store, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([store], "readonly");
      const request = transaction.objectStore(store).get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  put(store, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([store], "readwrite");
      const request = transaction.objectStore(store).put(value);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  delete(store, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([store], "readwrite");
      const request = transaction.objectStore(store).delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  getAll(store) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([store], "readonly");
      const request = transaction.objectStore(store).getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}
