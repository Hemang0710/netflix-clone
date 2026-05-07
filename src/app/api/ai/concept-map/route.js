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
    const { transcript, videoTitle } = await request.json()
    if (!transcript) return NextResponse.json({ success: false, message: "transcript required" }, { status: 400 })

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You create concept maps as animated SVGs for video content.
Return ONLY valid JSON, no markdown:
{
  "centralTopic": "main topic",
  "branches": [
    { "label": "branch name", "concepts": ["concept1", "concept2"] }
  ],
  "svgCode": "<svg>...</svg>"
}

SVG rules:
- viewBox="0 0 700 500", width="100%", height="auto"
- Dark bg: <rect width="700" height="500" fill="#09090b"/>
- Central node: large circle at center (350,250), fill="#6366f1", white text
- Branch nodes: medium circles around center, fill="#1e1b4b", border "#6366f1"
- Leaf nodes: small rounded rects, fill="#18181b", border "#3f3f46", text fill="#a1a1aa"
- Lines connecting nodes: stroke="#3f3f46", stroke-width="1.5"
- Add <style> with appear animations staggered per branch
- Animate: center appears first, then branches, then leaves
- Keep under 4000 chars`,
        },
        { role: "user", content: `Create a concept map for: "${videoTitle}"\n\nTranscript:\n${transcript.slice(0, 4000)}` },
      ],
      temperature: 0.3,
      max_tokens: 2500,
    })

    const raw = completion.choices[0].message.content.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    const data = JSON.parse(raw)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[ai/concept-map] error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
