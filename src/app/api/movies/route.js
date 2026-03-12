// src/app/api/movies/route.js

import { NextResponse } from "next/server";
import {movies} from "@/lib/data";


//Temporary data - later this comes from PostgreSQL


//This function handles GET / api/movies
 export async function GET(request) {
    return NextResponse.json ({
        success: true,
        data: movies,
        count: movies.length
    })
 }