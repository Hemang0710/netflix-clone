"use client"

import Image from "next/image"
import { useWatchlist } from "@/context/WatchlistContext"

function WatchlistCard({ movie }) {
  const { removeFromWatchlist } = useWatchlist()

  const posterUrl = movie.posterPath
    ? `https://image.tmdb.org/t/p/w300${movie.posterPath}`
    : null

  return (
    <div className="relative shrink-0 w-36 h-52 rounded-md overflow-hidden cursor-pointer group">
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={movie.title}
          fill
          className="object-cover transition-transform duration-200 group-hover:scale-105"
          sizes="144px"
        />
      ) : (
        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
          <span className="text-white text-xs text-center px-2">
            {movie.title}
          </span>
        </div>
      )}

      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
        <button
          onClick={() => removeFromWatchlist(Number(movie.tmdbId))}
          className="self-end bg-white text-black text-xs font-bold px-2 py-1 rounded hover:bg-zinc-200 transition-colors"
        >
          ✕ Remove
        </button>
        <p className="text-white text-xs font-bold leading-tight">
          {movie.title}
        </p>
      </div>
    </div>
  )
}

export default function WatchlistRow({ title, movies }) {
  if (!movies?.length) return null

  return (
    <div className="mb-8 px-12">
      <h2 className="text-white text-xl font-bold mb-4">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {movies.map(movie => (
          <WatchlistCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  )
}