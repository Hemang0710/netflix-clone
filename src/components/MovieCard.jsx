"use client"

import Image from "next/image"
import Link from "next/link"
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
    e.stopPropagation()
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
      className="relative shrink-0 w-40 h-56 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 hover:z-10 border border-white/5 hover:border-indigo-500/30 hover:glow-indigo-sm"
    >
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={movie.title}
          fill
          className="object-cover"
          sizes="160px"
        />
      ) : (
        <div className="w-full h-full bg-[#0d0d1a] flex flex-col items-center justify-center gap-2 p-3">
          <span className="text-3xl">🎓</span>
          <span className="text-slate-400 text-xs text-center leading-tight">{movie.title}</span>
        </div>
      )}

      {/* Always-visible bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/90 to-transparent" />

      {/* Difficulty badge */}
      <div className="absolute top-2 left-2">
        <span className="px-2 py-0.5 rounded-full bg-indigo-500/80 text-white text-[10px] font-bold">
          Free
        </span>
      </div>

      {hovered && (
        <div className="absolute inset-0 bg-[#050508]/85 flex flex-col justify-between p-3">
          <div className="flex justify-end">
            <button
              onClick={handleWatchlist}
              className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all ${
                inWatchlist
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30"
              }`}
            >
              {inWatchlist ? "✓ Saved" : "+ Save"}
            </button>
          </div>

          <div>
            <p className="text-white text-xs font-bold leading-tight mb-1">{movie.title}</p>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="text-amber-400">★ {movie.vote_average?.toFixed(1)}</span>
              <span>·</span>
              <span>{movie.release_date?.split("-")[0]}</span>
            </div>
            <p className="text-indigo-400 text-[10px] mt-1.5 font-medium">Tap to enroll →</p>
          </div>
        </div>
      )}
    </div>
  )
}
