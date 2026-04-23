import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import prisma from "@/lib/prisma"
import OpenAI from "openai"
import { z } from "zod"

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
})

const CREDIT_COST = 2

const scriptSchema = z.object({
  topic: z.string().min(1, "Topic required").max(200, "Topic too long"),
  duration: z.enum(["short", "medium", "long"]),
  style: z.enum(["educational", "tutorial", "storytelling", "interview"]),
  targetAudience: z.string().max(100).optional(),
})

const DURATION_LABELS = { short: "5 minutes", medium: "15 minutes", long: "30 minutes" }

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
    const parsed = scriptSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
      return NextResponse.json({ success: false, message: firstError || "Invalid input" }, { status: 400 })
    }

    const { topic, duration, style, targetAudience } = parsed.data
    const audienceNote = targetAudience ? ` for ${targetAudience}` : ""

    // Check + deduct credits atomically
    let generationId = null
    try {
      await prisma.$transaction(async (tx) => {
        const credits = await tx.userCredits.findUnique({ where: { userId: user.userId } })
        if (!credits || credits.credits < CREDIT_COST) {
          throw new Error("Insufficient credits")
        }
        await tx.userCredits.update({
          where: { userId: user.userId },
          data: { credits: { decrement: CREDIT_COST } },
        })
        const gen = await tx.aIGeneration.create({
          data: {
            userId: user.userId,
            type: "script",
            prompt: `${topic} (${duration}, ${style}${audienceNote})`,
            status: "generating",
            creditsUsed: CREDIT_COST,
          },
        })
        generationId = gen.id
      })
    } catch (err) {
      if (err.message === "Insufficient credits") {
        return NextResponse.json({ success: false, message: "Not enough credits. Visit AI Studio to buy more." }, { status: 402 })
      }
      throw err
    }

    // Stream the script
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      stream: true,
      messages: [
        {
          role: "system",
          content: `You are an expert video script writer for online learning platforms.
Write clear, engaging, well-structured scripts that educators can read directly on camera.
Always use the exact structure requested. Be specific, practical, and use concrete examples.`,
        },
        {
          role: "user",
          content: `Write a ${DURATION_LABELS[duration]} ${style} video script about: "${topic}"${audienceNote}.

Use this EXACT structure:

## 🎬 HOOK (30 seconds)
[Attention-grabbing opening that immediately demonstrates value]

## 📖 INTRODUCTION
[Brief overview of what will be covered and why it matters]

## 📚 SECTION 1: [Title]
**Key points:**
- Point 1
- Point 2
**Example:** [Concrete real-world example]

## 📚 SECTION 2: [Title]
**Key points:**
- Point 1
- Point 2
**Example:** [Concrete real-world example]

## 📚 SECTION 3: [Title]
**Key points:**
- Point 1
- Point 2
**Example:** [Concrete real-world example]

## ✅ CONCLUSION
[Summarize the 3 key takeaways in bullet points]

## 🚀 CALL TO ACTION
[Tell the viewer exactly what to do next]

---
**Estimated read time:** [X minutes at conversational pace]`,
        },
      ],
      max_tokens: duration === "long" ? 2000 : duration === "medium" ? 1200 : 700,
      temperature: 0.7,
    })

    // Stream response and save result when complete
    let fullText = ""
    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ""
            if (text) {
              fullText += text
              controller.enqueue(encoder.encode(text))
            }
          }
          // Save completed result
          if (generationId) {
            await prisma.aIGeneration.update({
              where: { id: generationId },
              data: { result: fullText, status: "completed" },
            }).catch(() => {}) // non-critical
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
        "X-Generation-Id": generationId?.toString() || "",
      },
    })
  } catch (error) {
    console.error("[AI_SCRIPT] error:", error)
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 })
  }
}
