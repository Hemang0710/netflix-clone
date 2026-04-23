import { WatchlistProvider } from "@/context/WatchlistContext";
import "./globals.css"

export const metadata = {
  title: "StreamAI — Learn with AI",
  description: "AI-powered learning platform. Generate scripts, thumbnails, and course outlines with AI.",
}

export default function RootLayout ({ children }){
  return (
    <html lang="en">
      <body>
        <WatchlistProvider>
          {children}
        </WatchlistProvider>
      </body>
    </html>
  )
}