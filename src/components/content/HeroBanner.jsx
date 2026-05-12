import Link from "next/link"

export default function HeroBanner({ movie }) {
  if (!movie) return null

  const backdropUrl = movie.backdrop_path
    ? `${process.env.NEXT_PUBLIC_TMDB_IMAGE}${movie.backdrop_path}`
    : null

  return (
    <div className="relative h-[80vh] flex items-end pb-24 px-6 md:px-12 overflow-hidden">
      {/* Backdrop image */}
      {backdropUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-linear-to-r from-[#050508] via-[#050508]/60 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-t from-[#050508] via-transparent to-[#050508]/40" />

      {/* Top badge */}
      <div className="absolute top-24 left-6 md:left-12 z-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Featured Course
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl">
        {/* Genre pill */}
        <span className="inline-block px-3 py-1 rounded-full bg-white/8 border border-white/10 text-slate-300 text-xs font-medium mb-4">
          {movie.genre_ids?.[0] ? "Development" : "Learning Path"}
        </span>

        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
          {movie.title}
        </h1>

        <div className="flex items-center gap-4 text-slate-400 text-sm mb-4">
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400">★</span>
            {movie.vote_average?.toFixed(1)} rating
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span>{movie.release_date?.split("-")[0]}</span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span className="text-emerald-400 font-medium">Free</span>
        </div>

        <p className="text-slate-400 text-sm leading-relaxed mb-8 line-clamp-2 max-w-lg">
          {movie.overview}
        </p>

        <div className="flex gap-3">
          <Link
            href="/browse"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-7 py-3 rounded-xl transition-all glow-indigo-sm text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            Start Learning
          </Link>
          <Link
            href="/browse"
            className="flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-white font-semibold px-7 py-3 rounded-xl transition-all text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Course Details
          </Link>
        </div>
      </div>
    </div>
  )
}
