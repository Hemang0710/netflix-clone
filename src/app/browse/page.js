// src/app/browse/page.js
import Navbar from "@/components/Navbar"
import HeroBanner from "@/components/HeroBanner"
import MovieRow from "@/components/MovieRow"
import WatchlistRow from "@/components/WatchlistRow"
import { getTrending, getMoviesByGenre, GENRES } from "@/lib/tmdb"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

async function getWatchlistMovies(userId) {
  const profile = await prisma.profile.findFirst({
    where: { userId: Number(userId) },
    include: { watchlist: true },
  })

  if (!profile) return []
  return profile.watchlist
}

export default async function BrowsePage() {
  const user = await getCurrentUser()

  const [trending, action, sciFi, drama, watchlistMovies] = await Promise.all([
    getTrending(),
    getMoviesByGenre(GENRES.ACTION),
    getMoviesByGenre(GENRES.SCIFI),
    getMoviesByGenre(GENRES.DRAMA),
    user ? getWatchlistMovies(user.userId) : [],
  ])

  return (
    <main className="min-h-screen bg-zinc-950">
      <Navbar />
      <HeroBanner movie={trending[0]} />
      <div className="pb-20 space-y-2 -mt-80px relative z-10">
        {/* My List row — only shows if user has saved movies */}
        {watchlistMovies.length > 0 && (
          <WatchlistRow title="❤️ My List" movies={watchlistMovies} />
        )}
        <MovieRow title="🔥 Trending Now" movies={trending} />
        <MovieRow title="💥 Action" movies={action} />
        <MovieRow title="🚀 Sci-Fi" movies={sciFi} />
        <MovieRow title="🎭 Drama" movies={drama} />
      </div>
    </main>
  )
}
