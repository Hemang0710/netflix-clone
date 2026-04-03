
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request,{params}) {
    try{
        const {id} = await params
        const movieId = Number(id)

        if(isNaN(movieId)){
            return NextResponse.json(
                {success: flase, message: "Invalid movie Id"},
                {status :400}
            )
        }
        const movie = await prisma.movie.findUnique({
            where: {id:movieId},
        })

        if(!movie){
            return NextResponse.json (
                {success :flase,message:"Movie not found"},
                {status: 404}
            )
        }

        return NextResponse.json({success:true, data:movie})
    } catch (error){
        console.error ("Movie fetch error:", error)
        return NextResponse.json(
            {success :false, message:"Failed to fetch movie"},
            {status:500}
        )
    }
    
}