"use client"

import { createContext, useContext, useState, useEffect } from "react"

const WatchlistContext = createContext(null)

export function WatchlistProvider({ children }) {
  const [watchlist, setWatchlist] = useState([])

  useEffect(() => {
    async function loadWatchlist() {
      try {
        const res = await fetch("/api/watchlist")
        if (res.ok) {
          const data = await res.json()
          // Force all IDs to numbers for consistent comparison
          setWatchlist((data.data || []).map(Number))
        }
      } catch (error) {
        console.error("Failed to load watchlist:", error)
      }
    }
    loadWatchlist()
  }, [])

  async function addToWatchlist(movie) {
    const tmdbId = Number(movie.id)

    // Optimistic update
    setWatchlist(prev => [...prev, tmdbId])

    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId,
          title: movie.title,
          posterPath: movie.poster_path || "",
        }),
      })

      if (!res.ok) {
        // Revert
        setWatchlist(prev => prev.filter(id => id !== tmdbId))
      }
    } catch {
      setWatchlist(prev => prev.filter(id => id !== tmdbId))
    }
  }

  async function removeFromWatchlist(tmdbId) {
    const id = Number(tmdbId)

    // Optimistic update
    setWatchlist(prev => prev.filter(existingId => existingId !== id))

    try {
      const res = await fetch("/api/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId: id }),
      })

      if (!res.ok) {
        // Revert — reload from server
        const data = await fetch("/api/watchlist").then(r => r.json())
        setWatchlist((data.data || []).map(Number))
      }
    } catch {
      const data = await fetch("/api/watchlist").then(r => r.json())
      setWatchlist((data.data || []).map(Number))
    }
  }

  function isInWatchlist(tmdbId) {
    return watchlist.includes(Number(tmdbId))
  }

  return (
    <WatchlistContext.Provider value={{
      watchlist,
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist,
    }}>
      {children}
    </WatchlistContext.Provider>
  )
}

export function useWatchlist() {
  const context = useContext(WatchlistContext)
  if (!context) throw new Error("useWatchlist must be inside WatchlistProvider")
  return context
}