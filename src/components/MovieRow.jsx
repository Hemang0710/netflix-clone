import MovieCard from "./MovieCard"

export default function MovieRow({ title, movies }) {
  if (!movies?.length) return null

  return (
    <div className="mb-10 px-6 md:px-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-lg font-bold">{title}</h2>
        <button className="text-indigo-400 text-xs font-medium hover:text-indigo-300 transition-colors">
          See all →
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  )
}
