// src/components/MovieCard.jsx
"use client"

import Image from "next/image"
import { useState } from "react"
import { useWatchlist } from "@/context/WatchlistContext"

export default function MovieCard({ movie }) {
  const [hovered, setHovered] = useState(false)
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist()

  const inWatchlist = isInWatchlist(movie.id)
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
    : null

  function handleWatchlist(e) {
    e.stopPropagation()  // don't trigger card click
    if (inWatchlist) {
      removeFromWatchlist(movie.id)
    } else {
      addToWatchlist(movie)
    }
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative shrink-0 w-36 h-52 rounded-md overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-110 hover:z-10"
    >
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={movie.title}
          fill
          className="object-cover"
          sizes="144px"
        />
      ) : (
        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
          <span className="text-white text-xs text-center px-2">{movie.title}</span>
        </div>
      )}

      {hovered && (
        <div className="absolute inset-0 bg-black/70 flex flex-col justify-between p-3">
          <button
            onClick={handleWatchlist}
            className={`self-end text-xs font-bold px-2 py-1 rounded transition-colors ${
              inWatchlist
                ? "bg-white text-black hover:bg-zinc-200"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {inWatchlist ? "✓ Added" : "+ List"}
          </button>

          <div>
            <p className="text-white text-xs font-bold leading-tight">{movie.title}</p>
            <p className="text-zinc-400 text-xs mt-1">
              {movie.release_date?.split("-")[0]} • ⭐{movie.vote_average?.toFixed(1)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}