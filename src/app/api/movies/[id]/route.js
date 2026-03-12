import { NextResponse } from "next/server";
import {movies} from "@/lib/data";

export async function GET (request,{params}){
    const{id} = await params 
    const movieId= Number(id)   //<- this captures /api/movies/42 -> id = "42"

    // Find the movie
    const movie =  movies.find((m)=>m.id === movieId);

    if(!movie){
        return NextResponse.json(
            {success:false, message:"Movie not found"},
            {status:404}
        );
    }
    return NextResponse.json({
        success: true,
        data:movie,
    });
}


