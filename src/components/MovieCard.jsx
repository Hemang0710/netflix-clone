"use client"

import Image from "next/image"
import { useState } from "react"

export default function MovieCard({ movie }) {
  const [hovered, setHovered] = useState(false)

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
    : null

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
        <div className="absolute inset-0 bg-black/70 flex flex-col justify-end p-3">
          <p className="text-white text-xs font-bold leading-tight">{movie.title}</p>
          <p className="text-zinc-400 text-xs mt-1">
            {movie.release_date?.split("-")[0]} • ⭐{movie.vote_average?.toFixed(1)}
          </p>
        </div>
      )}
    </div>
  )
}