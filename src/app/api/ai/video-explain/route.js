import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"

const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  compatibility: "compatible",
})

/**
 * Generate an animated video explanation for a confusing concept
 * Returns a structured animation script that can be rendered
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { concept, videoTitle, contentId, context = "" } = await request.json()

    if (!concept) {
      return Response.json(
        { error: "Concept is required" },
        { status: 400 }
      )
    }

    console.log("🎬 Generating video explanation for:", concept)

    // Generate animation script and key frames using LLM
    const { text: animationScript } = await generateText({
      model: groq.chat("llama-3.3-70b-versatile"),
      system: `You are an expert at creating educational animated video scripts.
Create a clear, step-by-step animation script for explaining a concept.
Return ONLY valid JSON with this structure:
{
  "title": "string",
  "duration": number (in seconds),
  "scenes": [
    {
      "id": number,
      "title": "string",
      "duration": number,
      "narration": "string (what to say)",
      "animation": "string (describe what animates on screen)",
      "keyElements": ["string"] (visual elements to show)
    }
  ],
  "keyTakeaways": ["string"]
}`,
      prompt: `Create an animated video explanation for: "${concept}"
Context: ${videoTitle ? `From video: ${videoTitle}` : "General explanation"}
${context ? `Additional context: ${context}` : ""}

Make it easy to understand for someone confused about this topic.
Each scene should be 3-5 seconds.
Total duration should be 30-45 seconds.
Use simple, clear language in narration.`,
      temperature: 0.7,
      maxTokens: 1500,
    })

    // Parse the animation script
    let parsed
    try {
      parsed = JSON.parse(animationScript)
    } catch {
      // Fallback structure if parsing fails
      parsed = {
        title: `Understanding: ${concept}`,
        duration: 30,
        scenes: [
          {
            id: 1,
            title: "Concept Intro",
            duration: 10,
            narration: `Let me explain "${concept}" in a simple way.`,
            animation: "Fade in title with visual representation",
            keyElements: [concept, "Definition"],
          },
          {
            id: 2,
            title: "Deep Dive",
            duration: 15,
            narration: "Here are the key points you need to understand.",
            animation: "Build diagram showing relationships",
            keyElements: ["Key points", "Examples"],
          },
          {
            id: 3,
            title: "Summary",
            duration: 5,
            narration: "Remember these key takeaways.",
            animation: "Summary of all key points",
            keyElements: ["Recap", "Key takeaways"],
          },
        ],
        keyTakeaways: [
          `"${concept}" is an important concept`,
          "Break it down into smaller parts to understand better",
          "Practice with real examples",
        ],
      }
    }

    // Log the explanation
    console.log("✅ Animation script generated:", parsed.title)

    return Response.json({
      success: true,
      concept,
      animation: parsed,
      type: "animated_explanation",
    })

  } catch (error) {
    console.error("❌ Video explanation error:", error.message)
    return Response.json(
      { error: error.message || "Failed to generate video explanation" },
      { status: 500 }
    )
  }
}
