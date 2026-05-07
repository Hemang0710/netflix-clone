import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import prisma from "@/lib/prisma"
import OpenAI from "openai"

const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" })

export async function POST(request) {
  const { success } = await checkRateLimit(request, "api")
  if (!success) return NextResponse.json({ success: false }, { status: 429 })

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

  try {
    const { contentId } = await request.json()
    if (!contentId) return NextResponse.json({ success: false, message: "contentId required" }, { status: 400 })

    const content = await prisma.content.findUnique({
      where: { id: Number(contentId) },
      select: { transcript: true, title: true, duration: true },
    })
    if (!content?.transcript) return NextResponse.json({ success: false, message: "No transcript available" }, { status: 400 })

    // Delete existing AI notes before regenerating
    await prisma.note.deleteMany({ where: { contentId: Number(contentId), userId: Number(user.userId), isAI: true } })

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a study notes AI. Extract the most important points from video transcripts as timestamped notes.
Return ONLY valid JSON — no markdown, no extra text.
Format: [{ "timestamp": 0, "body": "note text" }]
Rules:
- 6-10 notes total
- timestamp is seconds into the video (estimate from transcript position — divide evenly across duration)
- body is 1-2 sentences, captures a key insight or fact
- Start with the most important concept first`,
        },
        {
          role: "user",
          content: `Video: "${content.title}" (${content.duration || 300}s)\n\nTranscript:\n${content.transcript.slice(0, 5000)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const raw = completion.choices[0].message.content.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    const notes = JSON.parse(raw)

    const created = await prisma.$transaction(
      notes.map(n =>
        prisma.note.create({
          data: { userId: Number(user.userId), contentId: Number(contentId), timestamp: n.timestamp ?? null, body: n.body, isAI: true },
        })
      )
    )

    return NextResponse.json({ success: true, data: created })
  } catch (error) {
    console.error("[ai/notes] error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
