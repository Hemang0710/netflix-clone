import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import { z } from "zod"
import { validateBody } from "@/lib/schemas"

const importSchema = z.object({
  url: z.string().url("Must be a valid URL"),
})

// Extract YouTube video ID from any YouTube URL format
function extractYouTubeId(url) {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export async function POST(request) {
  try {
    const { success } = await checkRateLimit(request, "api")
    if (!success) {
      return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const validation = validateBody(importSchema, body)
    if (!validation.success) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 })
    }

    const { url } = validation.data
    const videoId = extractYouTubeId(url)

    if (!videoId) {
      return NextResponse.json(
        { success: false, message: "Not a valid YouTube URL. Supported: youtube.com/watch, youtu.be, youtube.com/shorts" },
        { status: 400 }
      )
    }

    const userId = Number(user.userId)

    // Check if already imported
    const existing = await prisma.externalContent.findUnique({
      where: { userId_externalId: { userId, externalId: videoId } },
    })

    if (existing) {
      return NextResponse.json({
        success: true,
        data: existing,
        message: "Already in your library",
        alreadyExists: true,
      })
    }

    // Fetch metadata from YouTube Data API
    const ytResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${process.env.YOUTUBE_API_KEY}`
    )
    const ytData = await ytResponse.json()

    if (!ytData.items?.length) {
      return NextResponse.json(
        { success: false, message: "Video not found or is private" },
        { status: 404 }
      )
    }

    const video = ytData.items[0]
    const snippet = video.snippet

    // Parse ISO 8601 duration to seconds (e.g. PT1H2M3S)
    function parseDuration(iso) {
      const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
      if (!match) return 0
      return (Number(match[1] || 0) * 3600) +
             (Number(match[2] || 0) * 60) +
             Number(match[3] || 0)
    }

    const content = await prisma.externalContent.create({
      data: {
        userId,
        platform: "youtube",
        externalId: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title: snippet.title,
        description: snippet.description?.slice(0, 1000) || "",
        thumbnailUrl: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url,
        duration: parseDuration(video.contentDetails.duration),
        channelName: snippet.channelTitle,
        status: "pending",
      },
    })

    // Trigger AI processing in background (don't await)
    processExternalContent(content.id, videoId).catch(
      err => console.error("[EXTERNAL_PROCESS] error:", err)
    )

    return NextResponse.json({
      success: true,
      data: content,
      message: "Video imported! AI is processing it now.",
    }, { status: 201 })

  } catch (error) {
    console.error("[EXTERNAL_IMPORT] error:", error)
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 })
  }
}

// Background processing
async function processExternalContent(contentId, videoId) {
  try {
    // Fetch transcript using Supadata API
    const transcriptRes = await fetch(
      `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}`,
      { headers: { "x-api-key": process.env.SUPADATA_API_KEY } }
    )

    let transcript = null
    if (transcriptRes.ok) {
      const data = await transcriptRes.json()
      // Supadata returns array of {text, offset, duration}
      transcript = data.content
        ?.map(s => s.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    }

    // Generate AI content if transcript exists
    let aiSummary = null
    let chapters = null

    if (transcript) {
      const { generateSummary, generateChapters } = await import("@/lib/openai")

      // Fetch title for context
      const content = await prisma.externalContent.findUnique({
        where: { id: contentId },
        select: { title: true, duration: true }
      })

      const [summary, chapterData] = await Promise.all([
        generateSummary(transcript, content.title),
        generateChapters(transcript, content.duration),
      ])

      aiSummary = summary
      chapters = chapterData ? JSON.stringify(chapterData) : null
    }

    await prisma.externalContent.update({
      where: { id: contentId },
      data: {
        transcript,
        aiSummary,
        chapters,
        status: "ready",
      },
    })

  } catch (error) {
    console.error("[EXTERNAL_PROCESS] failed:", error)
    await prisma.externalContent.update({
      where: { id: contentId },
      data: { status: "failed" },
    })
  }
}