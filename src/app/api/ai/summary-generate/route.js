import { getCurrentUser } from "@/lib/auth"
import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"

const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  compatibility: "compatible",
})

export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return new Response("Unauthorized", { status: 401 })

    const { transcript = "", videoTitle = "", chatMessages = [] } = await request.json()

    if (!transcript && chatMessages.length === 0) {
      return Response.json({ error: "Need transcript or chat messages" }, { status: 400 })
    }

    console.log("📋 Generating summary")

    // Combine transcript and chat for context
    const context = transcript
      ? transcript.slice(0, 4000)
      : chatMessages
          .map(m => `${m.role === "user" ? "Q" : "A"}: ${m.content || ""}`)
          .join("\n")
          .slice(0, 3000)

    const { text: summaryText } = await generateText({
      model: groq.chat("llama-3.3-70b-versatile"),
      system: `You are a summary creator. Generate a concise bullet-point summary.
Return ONLY valid JSON:
{
  "title": "Summary Title",
  "keyPoints": ["point1", "point2", "point3", "point4", "point5"],
  "mainIdea": "One sentence explanation of the core concept",
  "actionItems": ["what to do", "what to remember", "what to practice"]
}`,
      prompt: `Summarize this educational content about "${videoTitle}":

${context}

Create 5 key bullet points that capture the essence.`,
      temperature: 0.6,
      maxTokens: 800,
    })

    let summary
    try {
      summary = JSON.parse(summaryText)
    } catch {
      summary = {
        title: `Summary: ${videoTitle}`,
        keyPoints: [
          "Main concept introduced",
          "Important details explained",
          "Practical applications discussed",
          "Common mistakes clarified",
          "Key takeaway reinforced",
        ],
        mainIdea: videoTitle || "Educational content provided",
        actionItems: ["Review key points", "Practice concepts", "Ask follow-up questions"],
      }
    }

    console.log("✅ Summary generated")

    return Response.json({
      success: true,
      summary,
      timestamp: new Date(),
    })

  } catch (error) {
    console.error("❌ Summary error:", error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
