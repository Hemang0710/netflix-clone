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
    const content = await prisma.content.findUnique({
      where: { id: Number(contentId) },
      select: { transcript: true, title: true, genre: true, creatorId: true },
    })

    if (!content) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })
    if (!content.transcript) return NextResponse.json({ success: false, message: "No transcript" }, { status: 400 })

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: `Rate video content difficulty. Return ONLY JSON: {"difficulty":"beginner"|"intermediate"|"advanced","reason":"one sentence"}` },
        { role: "user", content: `Title: "${content.title}"\nGenre: ${content.genre}\nTranscript excerpt:\n${content.transcript.slice(0, 2000)}` },
      ],
      temperature: 0.1,
      max_tokens: 100,
    })

    const raw = completion.choices[0].message.content.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    const { difficulty } = JSON.parse(raw)

    const valid = ["beginner", "intermediate", "advanced"]
    const level = valid.includes(difficulty) ? difficulty : "intermediate"

    await prisma.content.update({ where: { id: Number(contentId) }, data: { difficulty: level } })

    return NextResponse.json({ success: true, data: { difficulty: level } })
  } catch (error) {
    console.error("[ai/difficulty] error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
