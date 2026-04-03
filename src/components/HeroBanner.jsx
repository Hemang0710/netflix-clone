export default function HeroBanner({movie}) {
    if(!movie) return null

    const backdropUrl = movie.backdrop_path
    ? `${process.env.NEXT_PUBLIC_TMDB_IMAGE}${movie.backdrop_path}`
    : null

    return (
        <div className="relative h-[85vh] flex items-end pb-32 px-12">
            {/* Real movie backdrop image */}
            {backdropUrl && (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{backgroundImage: 'url(${backdropUrl}) '}}
                  />
            )}

            {/*Gradient overlay bottom */}
            <div className="absolute inset-0 bg-linear-to-r from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-transparent to-transparent" />

        
            {/* Content */}
            <div className="relative z-10 max-w-xl">
                <h1 className="text-while text-5xl font-black mb-4 leading-tight">
                    {movie.title}
                </h1>
                <p className="text-zinc-300 text-sm mb-3">
                    {movie.release_date?.split("-")[0] } • ⭐ {movie.vote_average?.toFixed(1)}
                </p>
                <p className="text-zinc-400 text-sm mb-8 leading-relaxed line-clamp-3">
                    {movie.overview}
                </p>

                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-while text-black font-bold px-8 py-3 rounded hover:bg-zinc-200 transition-colors">
                        ▶ Play
                    </button>
                    <button className="flex items-center gap-2 bg-zinc-600/70 text-white font-semibold px-8 py-3 rounded hover:bg-zinc-600 transition-colors">
                        ⓘ More Info
                    </button>
                </div>
            </div>
        </div>
    )
}