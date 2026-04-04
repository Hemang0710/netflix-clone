import { WatchlistProvider } from "@/context/WatchlistContext";
import "./globals.css"

export const metadata = {
  title : "Netflix Clone",
  description: "Built for learning",
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