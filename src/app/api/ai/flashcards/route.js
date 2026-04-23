import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import prisma from "@/lib/prisma"
import OpenAI from "openai"

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
})

// GET — fetch existing flashcards for this user + content
export async function GET(request) {
  const { success: rateLimitOk } = await checkRateLimit(request, "api")
  if (!rateLimitOk) {
    return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 })
  }

  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get("contentId")

    if (!contentId) {
      return NextResponse.json({ success: false, message: "contentId required" }, { status: 400 })
    }

    const flashcards = await prisma.flashcard.findMany({
      where: { userId: user.userId, contentId: Number(contentId) },
      orderBy: { dueDate: "asc" },
    })

    return NextResponse.json({ success: true, flashcards, count: flashcards.length })
  } catch (error) {
    console.error("[FLASHCARDS_GET] error:", error)
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 })
  }
}

// POST — generate flashcards from transcript using AI
export async function POST(request) {
  const { success: rateLimitOk } = await checkRateLimit(request, "api")
  if (!rateLimitOk) {
    return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 })
  }

  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { contentId } = await request.json()
    if (!contentId) {
      return NextResponse.json({ success: false, message: "contentId required" }, { status: 400 })
    }

    const content = await prisma.content.findUnique({
      where: { id: Number(contentId) },
      select: { title: true, transcript: true, aiSummary: true },
    })

    if (!content?.transcript) {
      return NextResponse.json({ success: false, message: "No transcript available for this content" }, { status: 400 })
    }

    // Check if flashcards already exist for this user + content
    const existing = await prisma.flashcard.count({
      where: { userId: user.userId, contentId: Number(contentId) },
    })
    if (existing > 0) {
      return NextResponse.json({ success: false, message: "Flashcards already generated" }, { status: 409 })
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You generate spaced-repetition flashcards from video transcripts.
Always respond with valid JSON only — no other text, no markdown.`,
        },
        {
          role: "user",
          content: `Create 12 high-quality flashcards for the video "${content.title}".

Transcript:
${content.transcript.slice(0, 4000)}

Return ONLY this JSON format:
[
  {
    "front": "Clear, specific question testing one concept",
    "back": "Concise, accurate answer (1-2 sentences max)"
  }
]

Rules:
- Mix conceptual questions (Why/How) with factual ones (What/When)
- Each card tests exactly ONE idea
- Answers must be self-contained (no "it" or "this" references)
- Avoid trivially easy cards
- Vary difficulty across the 12 cards`,
        },
      ],
      max_tokens: 1200,
      temperature: 0.4,
    })

    const raw = completion.choices[0].message.content
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim()
    const cards = JSON.parse(cleaned)

    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ success: false, message: "Failed to parse flashcards" }, { status: 500 })
    }

    // Bulk insert with default SM-2 values
    const now = new Date()
    const flashcards = await prisma.flashcard.createMany({
      data: cards.map((card) => ({
        userId: user.userId,
        contentId: Number(contentId),
        front: card.front,
        back: card.back,
        interval: 1,
        repetitions: 0,
        easeFactor: 2.5,
        dueDate: now,
      })),
    })

    const created = await prisma.flashcard.findMany({
      where: { userId: user.userId, contentId: Number(contentId) },
    })

    return NextResponse.json({ success: true, flashcards: created, count: created.length })
  } catch (error) {
    console.error("[FLASHCARDS_POST] error:", error)
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 })
  }
}
