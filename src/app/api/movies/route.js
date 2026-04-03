// src/app/api/movies/route.js

import { NextResponse } from "next/server";
import  prisma  from "@/lib/prisma";

export async function GET() {
  const movies = await prisma.movie.findMany();

  return NextResponse.json({
    success: true,
    data: movies,
    count: movies.length,
  });
}