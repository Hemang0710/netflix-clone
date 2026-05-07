# Mobile PWA + Offline Implementation Guide

## ✅ What's Implemented

This implementation provides a complete **Progressive Web App (PWA)** with offline support for LearnAI. Users can:

- 📱 **Install app** on iOS, Android, and desktop
- 📡 **Work offline** with cached content
- 🔄 **Auto-sync** data when back online
- 💾 **Local storage** with IndexedDB
- 📲 **Install prompts** for seamless installation

---

## 📁 Files Created

### 1. **Manifest & App Icons**
- `public/manifest.json` — PWA manifest with app metadata
- `public/offline.html` — Offline fallback page
- `public/sw.js` — Service Worker for caching & offline

### 2. **Next.js Configuration**
- `next.config.mjs` — Updated with next-pwa config

### 3. **Frontend Components**
- `src/components/PWAInstall.jsx` — Install prompt
- `src/components/ServiceWorkerRegister.jsx` — SW registration
- `src/hooks/useOfflineStorage.js` — Offline storage hook

### 4. **API Endpoints**
- `src/app/api/sync/[key]/route.js` — Data sync when online

### 5. **Layout Updates**
- `src/app/layout.js` — Added PWA components & manifest

---

## 🚀 How to Use

### A. Using Offline Storage Hook

Store data that syncs when online:

```jsx
"use client";

import { useOfflineStorage } from "@/hooks/useOfflineStorage";

export default function MyComponent() {
  const [data, setData, isOnline, isLoading] = useOfflineStorage(
    "my_data_key",
    { count: 0 }
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>Status: {isOnline ? "🟢 Online" : "🔴 Offline"}</p>
      <p>Data: {JSON.stringify(data)}</p>

      <button onClick={() => setData({ count: data.count + 1 })}>
        Increment (auto-syncs)
      </button>
    </div>
  );
}
```

**Keys supported for auto-sync:**
- `watch_progress` — Video watch timestamps
- `quiz_attempt` — Quiz responses
- `notes` — User notes
- `flashcard_progress` — Flashcard learning

### B. Check Online Status

```jsx
const [data, setData, isOnline] = useOfflineStorage("key", {});

if (!isOnline) {
  return <div>Working offline - changes will sync when online</div>;
}
```

### C. PWA Install Prompt

The `PWAInstall` component automatically appears when:
- App is not installed
- Browser supports PWA installation

Users can dismiss it, and it won't show again for 24 hours.

---

## 🔧 Manual Service Worker Control

For advanced use cases, manage the service worker directly:

```javascript
// Register service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}

// Request background sync
navigator.serviceWorker.ready.then((registration) => {
  registration.sync.register("sync-progress");
});

// Get service worker
navigator.serviceWorker.controller
```

---

## 📱 App Icons (Required for Full PWA)

You need to create PWA icons and place them in `public/`:

```
public/
├── icon-192.png      (192x192 - most important)
├── icon-512.png      (512x512 - splash screen)
├── icon-96.png       (96x96 - shortcuts)
├── screenshot-540.png (540x720 - mobile screenshot)
└── screenshot-1280.png (1280x720 - tablet screenshot)
```

**Generate icons online:**
- [Favicon Generator](https://realfavicongenerator.net/)
- [PWA Assets Generator](https://www.pwabuilder.com/)
- Convert 512x512 PNG to required sizes

---

## 🎯 Caching Strategy

The service worker uses **Network First** strategy:

1. Try to fetch from network (fresh data)
2. If offline, return cached version
3. If no cache, return offline page

**Cached automatically:**
- HTML pages (app shell)
- CSS/JS bundles
- Google Fonts
- CDN assets (jsdelivr, Cloudflare)

**Not cached (API calls):**
- Real-time data queued for sync
- User-specific content

---

## 🔄 Data Sync Flow

### When User Goes Online:

1. Service Worker detects `online` event
2. Triggers background sync (tag: `sync-progress`)
3. Sends all pending updates to `/api/sync/[key]`
4. Clears pending queue if successful

### Adding Custom Sync:

In `useOfflineStorage`, pending updates are stored in IndexedDB:

```javascript
{
  key: "my_key",
  url: "/api/sync/my_key",
  data: { ... },
  timestamp: 1234567890
}
```

Then handle in `src/app/api/sync/[key]/route.js`:

```javascript
case "my_key":
  return await syncMyData(user.userId, value);
```

---

## 🧪 Testing PWA Locally

### 1. Build the app:
```bash
npm run build
```

### 2. Start production server:
```bash
npm start
```

### 3. Open DevTools (F12) → Application tab:
- Check "Service Workers" section
- Should show "Active and running"
- Click "Offline" checkbox to simulate offline

### 4. Test installation:
- On Android: "Install LearnAI" prompt appears
- On iOS: Share → Add to Home Screen
- On Desktop (Chrome): Install prompt in top-right

---

## 📊 Offline Capabilities

✅ **Works offline:**
- View cached videos
- Read notes & study plans
- Use flashcards (cached)
- View your badges

❌ **Requires online:**
- Upload new content
- Real-time study groups
- Stream new videos
- Fetch live leaderboards

---

## 🛠️ Troubleshooting

### Service Worker not registering?
1. Check browser console for errors
2. Ensure `/public/sw.js` exists
3. Verify manifest link in `<head>`
4. Try `npm run build && npm start`

### App not installable?
1. Must be HTTPS (or localhost for dev)
2. Manifest must be valid JSON
3. Icons must exist in `public/`
4. Service worker must be registered

### Data not syncing?
1. Check IndexedDB (DevTools → Application → IndexedDB)
2. Look for "pending_updates" store
3. Check `/api/sync/[key]` endpoint logs
4. Ensure user is authenticated

### Install prompt not showing?
1. Only shows once until dismissed
2. Dismissed prompts show after 24 hours
3. Check `localStorage.pwa-install-dismissed`
4. Clear cache to force re-prompt

---

## 🔐 Security Notes

- Service Worker can't access credentials (by design)
- Sensitive data should NOT be stored offline
- API calls are still authenticated normally
- Offline data is synced only when back online

---

## 📚 Resources

- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB Guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [next-pwa Docs](https://github.com/shadowwalker/next-pwa)

---

## 📝 Next Steps

1. ✅ Create app icons (PNG files)
2. ✅ Test on mobile device (iOS/Android)
3. ✅ Add custom sync handlers as needed
4. ✅ Monitor offline usage in analytics
5. ✅ Iterate based on user feedback

---

**Questions?** Check the implementation specs at `.agents/skills/grill-me/IMPLEMENTATION-SPECS.md` section 5.
