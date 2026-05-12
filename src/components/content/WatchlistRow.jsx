"use client"

import Link from "next/link"
import Image from "next/image"
import { useWatchlist } from "@/context/WatchlistContext"

function WatchlistCard({ movie }) {
  const { removeFromWatchlist } = useWatchlist()

  const posterUrl = movie.posterPath
    ? `https://image.tmdb.org/t/p/w300${movie.posterPath}`
    : null

  return (
    <div className="relative shrink-0 w-40 rounded-2xl overflow-hidden border border-white/6 hover:border-indigo-500/25 transition-all bg-[#0d0d1a] group cursor-pointer hover:-translate-y-0.5">
      {/* Poster */}
      <div className="relative w-full aspect-2/3 bg-[#0a0a14]">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={movie.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="160px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-indigo-500/10 to-violet-500/10">
            <span className="text-3xl">🎓</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-[#050508]/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
          <button
            onClick={(e) => { e.stopPropagation(); removeFromWatchlist(Number(movie.tmdbId)) }}
            className="self-end text-[10px] font-bold px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all"
          >
            ✕ Remove
          </button>
          <p className="text-white text-xs font-semibold leading-tight">{movie.title}</p>
        </div>
      </div>
    </div>
  )
}

export default function WatchlistRow({ title, movies }) {
  if (!movies?.length) return null

  return (
    <div className="mb-10 px-6 md:px-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-lg font-bold">{title}</h2>
        <Link href="/learn" className="text-indigo-400 text-xs font-medium hover:text-indigo-300 transition-colors">
          See all →
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
        {movies.map((movie) => (
          <WatchlistCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  )
}
