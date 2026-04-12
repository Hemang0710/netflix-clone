import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { transcribesAudio, generateSummary } from "@/lib/openai";
import { use } from "react";

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

        try{
            transcript = await transcribesAudio(content.videoUrl)
            aiSummary = await generateSummary(transcript, content.title)
        } catch (aiError) {
            console.error("AI processing error:", aiError)
            //Don't fail - just save what we have
        }

        //Update content with AI results
        const updated = await prisma.content.update({
            where: {id: contentId},
            data: {
                transcript: transcript || null,
                aiSummary: aiSummary || null,
                status: "ready",
            },
        })

        return NextResponse.json({
            success: true,
            data: {
                transcript: updated.transcript,
                aiSummary: updated.aiSummary,
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