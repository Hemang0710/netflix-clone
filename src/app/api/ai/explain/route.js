import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import OpenAI from "openai"

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
})

const MODEL = "llama-3.3-70b-versatile"

// System prompts per explanation type
const SYSTEM_PROMPTS = {
  diagram: `You are a visual explanation AI. When given a concept, you create an animated SVG diagram that teaches it.
Return ONLY valid JSON — no markdown fences, no explanation text outside the JSON.
JSON shape:
{
  "type": "diagram",
  "title": "short title",
  "description": "1-2 sentence description of what the diagram shows",
  "svgCode": "<svg>...</svg>",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "followUpPrompts": ["question 1", "question 2"]
}

SVG rules:
- viewBox="0 0 600 400", width="100%", height="auto"
- Dark background: <rect width="600" height="400" fill="#09090b"/>
- Text: fill="white" or fill="#a1a1aa" for secondary
- Use labeled shapes (rect, circle, path), arrows via <marker>, connecting lines
- Include <style> block with CSS animations:
  .appear { animation: fadeIn 0.5s ease forwards; opacity: 0; }
  .appear-1 { animation-delay: 0.3s; }
  .appear-2 { animation-delay: 0.8s; }
  .appear-3 { animation-delay: 1.3s; }
  .appear-4 { animation-delay: 1.8s; }
  .draw { animation: draw 1s ease forwards; stroke-dashoffset: 1000; stroke-dasharray: 1000; }
  @keyframes fadeIn { to { opacity: 1; } }
  @keyframes draw { to { stroke-dashoffset: 0; } }
- Make it self-contained — no external resources
- Keep SVG under 3000 chars`,

  analogy: `You are an analogy-based explanation AI. When given a concept, you create a real-world analogy story.
Return ONLY valid JSON — no markdown fences, no explanation text outside the JSON.
JSON shape:
{
  "type": "analogy",
  "title": "short title",
  "realWorldSetup": "Imagine you're at... (1 sentence scene setter)",
  "story": "Full flowing analogy paragraph (3-5 sentences). Make it vivid and memorable.",
  "mapping": [
    { "analogy": "real-world thing", "concept": "technical concept", "explanation": "why they're similar" }
  ],
  "followUpPrompts": ["question 1", "question 2"]
}
Keep mapping to 3-4 items. Make the story genuinely memorable — use humor if appropriate.`,

  walkthrough: `You are a step-by-step explanation AI. When given a concept, you break it into numbered steps.
Return ONLY valid JSON — no markdown fences, no explanation text outside the JSON.
JSON shape:
{
  "type": "walkthrough",
  "title": "short title",
  "totalSteps": 4,
  "steps": [
    {
      "stepNumber": 1,
      "title": "step title",
      "explanation": "2-3 sentence explanation of this step",
      "keyPoint": "one-line takeaway"
    }
  ]
}
Use 3-5 steps. Each step should build on the previous one. Last step should be the "aha moment".`,
}

export async function POST(request) {
  // Rate limit
  const { success: rateLimitOk } = await checkRateLimit(request, "api")
  if (!rateLimitOk) {
    return NextResponse.json(
      { success: false, message: "Too many requests" },
      { status: 429 }
    )
  }

  // Auth
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { concept, videoTranscript = "", videoTitle = "", explanationType = "diagram" } = body

    if (!concept || concept.trim().length < 5) {
      return NextResponse.json(
        { success: false, message: "concept is required" },
        { status: 400 }
      )
    }

    const type = ["diagram", "analogy", "walkthrough"].includes(explanationType)
      ? explanationType
      : "diagram"

    const userPrompt = `Concept to explain: "${concept.slice(0, 500)}"
${videoTitle ? `Video title: "${videoTitle}"` : ""}
${videoTranscript ? `Video context (first 3000 chars):\n${videoTranscript.slice(0, 3000)}` : ""}

Generate a ${type} explanation for this concept. Return only the JSON.`

    console.log(`[explain] type=${type} user=${user.userId}`)

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPTS[type] },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: type === "diagram" ? 2000 : 1200,
    })

    const raw = completion.choices[0].message.content.trim()

    // Strip any accidental markdown fences before parsing
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim()

    let data
    try {
      data = JSON.parse(cleaned)
    } catch {
      console.error("[explain] JSON parse failed:", cleaned.slice(0, 200))
      return NextResponse.json(
        { success: false, message: "AI returned malformed JSON — try again" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[explain] error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    )
  }
}
