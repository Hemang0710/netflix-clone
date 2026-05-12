import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"

export async function POST(request) {
  try {
    const { success } = await checkRateLimit(request, "api")
    if (!success) {
      return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false }, { status: 401 })
    }

    const { query, limit = 10 } = await request.json()

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ success: false, message: "Query is required" }, { status: 400 })
    }

    const userId = Number(user.userId)

    // Fetch all external videos with transcripts for this user
    const videos = await prisma.externalContent.findMany({
      where: {
        userId,
        status: "ready",
        transcript: { not: null }
      },
      select: {
        id: true,
        title: true,
        transcript: true,
        duration: true
      }
    })

    if (videos.length === 0) {
      return NextResponse.json({ success: true, results: [] })
    }

    // Search through transcripts
    const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0)
    const results = []

    for (const video of videos) {
      if (!video.transcript) continue

      // Split transcript into sentences/chunks for context
      const transcript = video.transcript || ""
      const sentences = transcript.split(/[.!?\n]+/).filter(s => s.trim().length > 0)

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim()
        const lowerSentence = sentence.toLowerCase()

        // Check if all search terms are in this sentence
        const matchingTerms = searchTerms.filter(term => lowerSentence.includes(term))
        const allTermsFound = matchingTerms.length === searchTerms.length

        if (allTermsFound) {
          // Estimate timestamp based on sentence position
          const estimatedProgress = i / Math.max(sentences.length, 1)
          const timestamp = Math.floor(estimatedProgress * (video.duration || 0))

          // Get context around the match
          const contextStart = Math.max(0, i - 1)
          const contextSentences = sentences.slice(contextStart, i + 2).join(' ')
          const context = contextSentences.substring(0, 250)

          results.push({
            contentId: video.id,
            videoTitle: video.title,
            context,
            timestamp,
            relevance: matchingTerms.length / searchTerms.length
          })
        }
      }
    }

    // Sort by relevance and limit
    results.sort((a, b) => b.relevance - a.relevance || b.timestamp - a.timestamp)
    const topResults = results.slice(0, limit)

    return NextResponse.json({
      success: true,
      results: topResults,
      totalResults: results.length
    })

  } catch (error) {
    console.error("[CONCEPT_SEARCH] error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
