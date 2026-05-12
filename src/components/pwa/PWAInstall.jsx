"use client";

import { useEffect, useState } from "react";

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      console.log("[PWAInstall] beforeinstallprompt fired");
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if app is already installed
    window.addEventListener("appinstalled", () => {
      console.log("[PWAInstall] App installed");
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setInstalling(true);
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log("[PWAInstall] User choice:", outcome);

    if (outcome === "accepted") {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
    setInstalling(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Optionally save to localStorage to not show again for a while
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-sm">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-lg shadow-2xl border border-indigo-400/20 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold mb-1">Install LearnAI App</p>
            <p className="text-xs text-indigo-100">
              Learn offline and get faster access to your courses
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleInstall}
            disabled={installing}
            className="flex-1 bg-white text-indigo-600 py-2 px-4 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {installing ? "Installing..." : "Install"}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
