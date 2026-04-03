import MovieCard from "./MovieCard"

export default function MovieRow({ title, movies}){
    if(!movies?.length) return null

    return(
        <div className="mb-8 px-12">
            <h2 className="text-white text-x1 font-bold mb-4">{title}</h2>
            <div className="flex gap-3 overflow-x-auto pb-4 scroll-hide">
                {movies.map(movie=> (
                    <MovieCard key={movie.id} movie={movie} />
                    
                ))}
            </div>
        </div>
    )
}