import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import prisma from "@/lib/prisma"
import OpenAI from "openai"

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
})

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

    const body = await request.json()
    const { contentId, userArgument, round = 1, history = [] } = body

    if (!contentId || !userArgument?.trim()) {
      return NextResponse.json({ success: false, message: "contentId and userArgument are required" }, { status: 400 })
    }

    if (userArgument.length > 1000) {
      return NextResponse.json({ success: false, message: "Argument too long (max 1000 chars)" }, { status: 400 })
    }

    const content = await prisma.content.findUnique({
      where: { id: Number(contentId) },
      select: { title: true, transcript: true, aiSummary: true, description: true },
    })

    if (!content) {
      return NextResponse.json({ success: false, message: "Content not found" }, { status: 404 })
    }

    const context = content.transcript?.slice(0, 3000) || content.aiSummary || content.description || content.title

    const historyMessages = history.map((h) => ({
      role: h.role,
      content: h.content,
    }))

    // Stream the debate response
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      stream: true,
      messages: [
        {
          role: "system",
          content: `You are a sharp Socratic debate opponent in a learning exercise about: "${content.title}".

Your job is to CHALLENGE the learner by arguing the OPPOSITE or most critical perspective of what the course teaches. This is an educational exercise — being challenged forces deeper understanding.

Rules:
1. Start with [SCORE: X/10] where X rates the learner's argument quality (logic, specificity, use of evidence). Be honest — don't inflate scores.
2. Then write "---"
3. Then give a concise, sharp counter-argument (2-4 sentences) that challenges their point directly.
4. End with one pointed follow-up question that pushes them to think deeper.
5. Keep your tone intellectually challenging but not hostile.
6. Use the course context below to make your counter-arguments specific and grounded.

Course context:
${context}

This is round ${round} of the debate. Push harder each round.`,
        },
        ...historyMessages,
        {
          role: "user",
          content: userArgument,
        },
      ],
      max_tokens: 400,
      temperature: 0.8,
    })

    // Convert to streaming response
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ""
            if (text) {
              controller.enqueue(encoder.encode(text))
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("[AI_DEBATE] error:", error)
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 })
  }
}
