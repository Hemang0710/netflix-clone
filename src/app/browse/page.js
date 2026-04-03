//src/app/browse/page.js

import Navbar from "@/components/Navbar"
import HeroBanner  from "@/components/HeroBanner"
import MovieRow from "@/components/MovieRow"
import { getTrending, getMovieByGenre, GENRES } from "@/lib/tmdb"

export default async function BrowsePage(){
    // Fetch mutiple categories in parallel - faster than one by one 
    const [trending, action, sciFi, drama] = await Promise.all([
        getTrending(),
        getMovieByGenre(GENRES.ACTION),
        getMovieByGenre(GENRES.SCIFI),
        getMovieByGenre(GENRES.DRAMA),
    ])
    
    return (
        <main className="min-h-screen bg-zinc-950">
            <Navbar />
            <HeroBanner movie = {trending[0]} />
            <div className="pb-20 space-y-2 -mt-80px relative z-10">
                <MovieRow title = "🔥 Trending Now" movies={trending} />
                <MovieRow title = "💥 Action" movies={action} />
                <MovieRow title = "🚀 Sci-Fi" movies = {sciFi} />
                <MovieRow title = "🎭 Drama" movies = {drama} />
            </div>
        </main>
    )
}