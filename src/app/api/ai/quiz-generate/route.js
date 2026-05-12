import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
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

    const { contentId, transcript = "", videoTitle = "", numQuestions = 5 } = await request.json()

    if (!transcript && !videoTitle) {
      return Response.json({ error: "Need transcript or title" }, { status: 400 })
    }

    console.log("📝 Generating quiz with", numQuestions, "questions")

    const { text: quizText } = await generateText({
      model: groq.chat("llama-3.3-70b-versatile"),
      system: `You are an educational quiz creator. Generate ${numQuestions} multiple-choice questions.
Return ONLY valid JSON array with this format:
[
  {
    "question": "string",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "correct": "A",
    "explanation": "Why this is correct..."
  }
]`,
      prompt: `Create ${numQuestions} educational multiple-choice questions about:
Video: "${videoTitle}"
${transcript ? `Transcript: ${transcript.slice(0, 3000)}` : ""}

Make questions test understanding, not just memorization.
Vary difficulty: easy, medium, hard mix.`,
      temperature: 0.7,
      maxTokens: 2000,
    })

    let questions
    try {
      questions = JSON.parse(quizText)
    } catch {
      // Fallback structure
      questions = [
        {
          question: "What was the main topic of this content?",
          options: ["A) " + videoTitle, "B) Something else", "C) Unknown", "D) Not clear"],
          correct: "A",
          explanation: "As shown in the video content.",
        },
      ]
    }

    console.log("✅ Generated", questions.length, "quiz questions")

    return Response.json({
      success: true,
      questions,
      contentId,
      generatedAt: new Date(),
    })

  } catch (error) {
    console.error("❌ Quiz generation error:", error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
