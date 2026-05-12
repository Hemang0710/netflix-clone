import { WatchlistProvider } from "@/context/WatchlistContext";
import PWAInstall from "@/components/pwa/PWAInstall";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import ToastProvider from "@/components/Toast/ToastProvider";
import SentryWrapper from "@/components/Sentry/SentryWrapper";
import "./globals.css"

export const metadata = {
  title: "LearnAI — Learn with AI",
  description: "AI-powered learning platform. Generate scripts, thumbnails, and course outlines with AI.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LearnAI"
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png"
  }
}

export default function RootLayout ({ children }){
  return (
    <html lang="en">
      <body>
        <WatchlistProvider>
          <SentryWrapper />
          <ToastProvider />
          <ServiceWorkerRegister />
          <PWAInstall />
          {children}
        </WatchlistProvider>
      </body>
    </html>
  )
}