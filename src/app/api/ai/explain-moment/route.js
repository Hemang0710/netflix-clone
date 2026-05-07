import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import OpenAI from "openai"

const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" })

export async function POST(request) {
  const { success } = await checkRateLimit(request, "api")
  if (!success) return NextResponse.json({ success: false }, { status: 429 })

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

  try {
    const { segment, videoTitle, surroundingContext = "" } = await request.json()
    if (!segment?.trim()) return NextResponse.json({ success: false, message: "segment required" }, { status: 400 })

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You explain specific video transcript segments to learners who clicked on them.
Be concise, clear, and helpful. Return ONLY valid JSON, no markdown:
{
  "explanation": "2-3 sentence plain-English explanation of this segment",
  "keyTerms": ["term1", "term2"],
  "whyItMatters": "one sentence on why this point is important"
}`,
        },
        {
          role: "user",
          content: `Video: "${videoTitle}"
${surroundingContext ? `Context before this segment:\n"${surroundingContext.slice(0, 500)}"\n` : ""}
The learner clicked on this segment:
"${segment}"

Explain what this means.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    })

    const raw = completion.choices[0].message.content.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    const data = JSON.parse(raw)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[explain-moment] error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
