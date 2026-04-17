import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { transcribesAudio, generateSummary, generateChapters } from "@/lib/openai";

export async function POST(request, {params}) {
    try {
        const user = await getCurrentUser()
        if(!user) {
            return NextResponse.json(
                {success: false, message: "Not authenticated"},
                {status: 401}
            )
        }

        const {id} = await params
        const contentId = Number(id)

        //Get the content

        const content = await prisma.content.findUnique ({
            where: {id: contentId},
        })
        
        if(!content){
            return NextResponse.json(
                {success: false, message: "Unauthorized"},
                {status: 403}
            )
        }

        // Mark as processing
        
        await prisma.content.update ({
            where: {id:contentId},
            data: {status: "processing"},
        })

        //Run transcription

        let transcript = null
        let aiSummary = null
        let chapters = null

        try{
            transcript = await transcribesAudio(content.videoUrl)

            //Run summary + chapters in parallel (faster)
            const [summary, chapterData] = await Promise.all([
                generateSummary(transcript, content.title),
                generateChapters(transcript,content.duration),
            ])

            aiSummary =  summary
            chapters = chapterData ? JSON.stringify(chapterData) : null
        } catch (aiError) {
            console.error("AI processing error:", aiError)
        }

        //Update content with AI results
        const updated = await prisma.content.update({
            where: {id: contentId},
            data: {
                transcript: transcript || null,
                aiSummary: aiSummary || null,
                chapters: chapters || null,
                status: "ready",
            },
        })

        return NextResponse.json({
            success: true,
            data: {
                transcript: !!updated.transcript,
                aiSummary: !!updated.aiSummary,
                chapters: updated.chapters ? JSON.parse(updated.chapters) : null,
            },
        })
    } catch (error) {
        console.error("Process route error:", error)
        return NextResponse.json (
            {success: false, message:"Processing failed"},
            {status: 500}
        )
    }
    
}