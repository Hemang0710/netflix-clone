"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
            updateViaCache: "none"
          });

          console.log("[ServiceWorker] Registered successfully:", registration);

          // Listen for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            console.log("[ServiceWorker] Update found, installing new version");

            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                console.log("[ServiceWorker] New version activated");
                // Optionally notify user about update
                if (window.confirm("A new version of LearnAI is available. Reload to update?")) {
                  window.location.reload();
                }
              }
            });
          });
        } catch (error) {
          console.error("[ServiceWorker] Registration failed:", error);
        }
      });

      // Listen for controller change (service worker update)
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        console.log("[ServiceWorker] Controller changed, reloading...");
        window.location.reload();
      });
    }
  }, []);

  return null;
}
