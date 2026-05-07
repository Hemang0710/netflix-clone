import { useEffect, useState } from "react";

export function useOfflineStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [isLoading, setIsLoading] = useState(true);

  // Check online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    setIsLoading(false);

    const handleOnline = () => {
      console.log("[OfflineStorage] Online");
      setIsOnline(true);
      // Trigger background sync if available
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.sync.register("sync-progress");
        });
      }
    };

    const handleOffline = () => {
      console.log("[OfflineStorage] Offline");
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load from IndexedDB
  useEffect(() => {
    const loadData = async () => {
      try {
        if (typeof window !== "undefined") {
          const db = await openDatabase();
          const data = await db.get("storage", key);
          if (data) {
            setStoredValue(data.value);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error("[OfflineStorage] Load error:", error);
        setIsLoading(false);
      }
    };
    loadData();
  }, [key]);

  // Save to IndexedDB and sync API
  const setValue = async (value) => {
    try {
      setStoredValue(value);

      if (typeof window !== "undefined") {
        const db = await openDatabase();
        await db.put("storage", { key, value, timestamp: Date.now() });

        // If online, try to sync immediately
        if (isOnline) {
          await syncValue(key, value, db);
        } else {
          // If offline, queue for background sync
          await db.add("pending_updates", {
            key,
            url: `/api/sync/${key}`,
            data: { value },
            timestamp: Date.now()
          });
          console.log("[OfflineStorage] Queued update for sync:", key);
        }
      }
    } catch (error) {
      console.error("[OfflineStorage] Set error:", error);
    }
  };

  return [storedValue, setValue, isOnline, isLoading];
}

async function syncValue(key, value, db) {
  try {
    const response = await fetch(`/api/sync/${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value })
    });

    if (response.ok) {
      console.log("[OfflineStorage] Synced:", key);
      // Remove from pending if exists
      if (db) {
        const pending = await db.getAll("pending_updates");
        const match = pending.find((p) => p.key === key);
        if (match) {
          await db.delete("pending_updates", match.id);
        }
      }
    }
  } catch (error) {
    console.error("[OfflineStorage] Sync error:", error);
  }
}

function openDatabase() {
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

  add(store, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([store], "readwrite");
      const request = transaction.objectStore(store).add(value);
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
