const { headers } = require("next/headers")

const BASE_URL = "https://api.themoviedb.org/3"

const options = {
    headers: {
        Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
        "Content-Type": "application/json",
    },
}

//Get trending movies
export async function getTrending(){
    const res = await fetch(`${BASE_URL}/trending/movie/week`, options)
    const data = await res.json()
    return data.results
}

//Get movies by genre
export async function getMovieByGenre(genreId) {
    const res = await fetch(
        `${BASE_URL}/discover/movie?with_genres=${genreId}&sort_by=popularity.desc`,
        options
    )
    const data = await res.json()
    return data.results
}

// TMDB Genre IDs (memorize thses - useful forever)
// 28 = Action, 35 = Comedy, 27 = Horror
// 878 = Sci-Fi, 10749 = Romance, 18 = Drama

export const GENRES = {
    ACTION: 28,
    SCIFI : 878,
    COMEDY: 35,
    HORROR: 27,
    DRAMA: 18,
}