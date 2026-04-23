// src/app/api/chat/route.js
import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rateLimit"

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

    // Get transcript
    let transcript = ""
    let videoTitle = ""

    if (contentId) {
      const content = await prisma.content.findUnique({
        where: { id: Number(contentId) },
        select: { transcript: true, title: true },
      })

      if (content?.transcript) {
        transcript = content.transcript.slice(0, 6000)
        videoTitle = content.title
        console.log("📄 Transcript found, length:", transcript.length)
      } else {
        console.log("⚠️ No transcript found for content:", contentId)
      }
    }

    const systemPrompt = transcript
      ? `You are an AI learning assistant for the video "${videoTitle}".
You have access to the full transcript. Use it to answer questions accurately.

TRANSCRIPT:
${transcript}

Rules:
- Keep answers concise (2-4 paragraphs).
- If the user says they're confused or don't understand without specifying what, assume they mean the most recent or complex concept in the transcript and explain that — never ask "which part?".
- If something isn't in the transcript, say so.`
      : `You are a helpful AI assistant for a video learning platform. Be concise and helpful. If the user says they're confused, explain the most relevant concept you can from context — never ask them to clarify which part.`

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