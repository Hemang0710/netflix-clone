// src/app/api/chat/route.js
import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"
import { createHash } from "crypto"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rateLimit"
import { getOrGenerateTranscript } from "@/lib/transcriptService"

const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  compatibility: "compatible", // forces /v1/chat/completions, not /v1/responses
})

export async function POST(request) {
  try {
    // Rate limit
    const { success } = await checkRateLimit(request, "api")
    if (!success) {
      return new Response("Too many requests", { status: 429 })
    }

    // Auth check
    const user = await getCurrentUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    let { messages, contentId } = body

    // Convert v5/v6 message format (with parts) to streamText format (with content)
    messages = messages.map(msg => {
      let content = msg.content
      
      // Convert parts array to content string if needed
      if (!content && msg.parts && Array.isArray(msg.parts)) {
        content = msg.parts
          .filter(p => p.type === "text")
          .map(p => p.text)
          .join("")
      }
      
      // Return only role and content - remove id, parts, and other fields
      return {
        role: msg.role,
        content: content || ""
      }
    })

    console.log("💬 Chat request:", { contentId, messageCount: messages.length })

    // Get transcript with fallback strategies
    let transcript = ""
    let videoTitle = ""
    let transcriptSource = "none"

    if (contentId) {
      const transcriptResult = await getOrGenerateTranscript(Number(contentId))
      
      if (transcriptResult.success) {
        transcript = transcriptResult.transcript.slice(0, 6000)
        transcriptSource = transcriptResult.source
        console.log(`📄 Transcript retrieved via ${transcriptResult.source}`, {
          length: transcript.length,
          isMinimalContext: transcriptResult.isMinimalContext
        })
      } else {
        console.warn(`⚠️ Failed to get transcript, using minimal context:`, transcriptResult.error)
        transcript = transcriptResult.transcript
      }

      // Get video title for context
      const content = await prisma.content.findUnique({
        where: { id: Number(contentId) },
        select: { title: true },
      })
      videoTitle = content?.title || "Unknown Video"
    }

    const systemPrompt = transcript
      ? `You are an AI learning assistant for the video "${videoTitle}".
You have access to content information about this video. Use it to answer questions accurately.

CONTENT CONTEXT:
${transcript}

Rules:
- Keep answers concise (2-4 paragraphs).
- If the user says they're confused or don't understand without specifying what, assume they mean the most recent or complex concept and explain that — never ask "which part?".
- If something isn't in the provided context, supplement with your general knowledge.
- Be helpful even if full transcript is unavailable.`
      : `You are a helpful AI assistant for a video learning platform. Be concise and helpful. If the user says they're confused, explain the most relevant concept you can from context — never ask them to clarify which part.`

    // Log question asynchronously (fire-and-forget)
    if (contentId && messages.length > 0) {
      const userMessage = messages[messages.length - 1]
      if (userMessage.role === 'user' && userMessage.content) {
        Promise.resolve().then(async () => {
          try {
            const questionHash = createHash('sha256')
              .update(userMessage.content.toLowerCase().trim())
              .digest('hex')

            await prisma.sharedQuestion.upsert({
              where: { contentId_questionHash: { contentId: Number(contentId), questionHash } },
              update: { count: { increment: 1 } },
              create: {
                contentId: Number(contentId),
                questionHash,
                sampleText: userMessage.content.substring(0, 500),
                count: 1,
              },
            })
          } catch (err) {
            console.error('Failed to log question:', err)
          }
        })
      }
    }

    console.log("🤖 Calling Groq API...")

    const result = streamText({
      model: groq.chat("llama-3.3-70b-versatile"),
      system: systemPrompt,
      messages,
      maxTokens: 500,
      temperature: 0.7,
    })

    console.log("✅ Stream started")

    return result.toUIMessageStreamResponse()

  } catch (error) {
    console.error("❌ Chat API error:", error.message)
    console.error("Stack:", error.stack)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}