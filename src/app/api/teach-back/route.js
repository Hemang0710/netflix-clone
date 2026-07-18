import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import {
  gradeExplanation,
  scoreToQuality,
  AUDIENCES,
  MIN_EXPLANATION_CHARS,
  MAX_EXPLANATION_CHARS,
} from "@/lib/teachBack"
import { dispatchWebhooks } from "@/lib/webhooks"

const parseList = (json) => {
  try {
    const arr = JSON.parse(json)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

const sessionToJson = (s) => ({
  id: s.id,
  conceptMasteryId: s.conceptMasteryId,
  concept: s.concept,
  audience: s.audience,
  explanation: s.explanation,
  score: s.score,
  accuracy: s.accuracy,
  completeness: s.completeness,
  simplicity: s.simplicity,
  feedback: s.feedback,
  gaps: parseList(s.gaps),
  jargon: parseList(s.jargon),
  followUp: s.followUp,
  createdAt: s.createdAt,
})

/**
 * GET /api/teach-back — concepts worth teaching (weakest first) and the
 * user's recent teach-back attempts.
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [suggestions, sessions] = await Promise.all([
      prisma.conceptMastery.findMany({
        where: { userId: Number(user.userId) },
        orderBy: [{ masteryScore: "asc" }, { dueDate: "asc" }],
        take: 8,
        select: {
          id: true,
          concept: true,
          masteryScore: true,
          lastScore: true,
          dueDate: true,
          source: true,
        },
      }),
      prisma.teachBackSession.findMany({
        where: { userId: Number(user.userId) },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ])

    return NextResponse.json({
      suggestions,
      sessions: sessions.map(sessionToJson),
    })
  } catch (error) {
    console.error("GET /api/teach-back error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/teach-back — grade a Feynman-style explanation.
 * Body: { conceptMasteryId? , concept?, audience?, explanation }
 * Links the attempt to the user's ConceptMastery card (creating one with
 * source "teachback" for brand-new topics) and returns the graded session
 * plus the SM-2 quality the client should commit via
 * POST /api/concepts/[conceptId]/review.
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // AI grading costs tokens — reuse the ingest budget (30/h)
    const rate = await checkRateLimit(request, "ingest")
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many teach-back attempts — take a breather and try again soon" },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const explanation = typeof body.explanation === "string" ? body.explanation.trim() : ""
    const audience = AUDIENCES[body.audience] ? body.audience : "beginner"

    if (explanation.length < MIN_EXPLANATION_CHARS) {
      return NextResponse.json(
        { error: `Write at least ${MIN_EXPLANATION_CHARS} characters — really try to teach it` },
        { status: 400 }
      )
    }
    if (explanation.length > MAX_EXPLANATION_CHARS) {
      return NextResponse.json(
        { error: `Explanation too long (max ${MAX_EXPLANATION_CHARS} characters)` },
        { status: 400 }
      )
    }

    const userId = Number(user.userId)

    // Resolve the ConceptMastery card this attempt reinforces
    let card = null
    if (body.conceptMasteryId) {
      card = await prisma.conceptMastery.findFirst({
        where: { id: Number(body.conceptMasteryId), userId },
        select: { id: true, concept: true },
      })
      if (!card) {
        return NextResponse.json({ error: "Concept not found" }, { status: 404 })
      }
    } else {
      const name = typeof body.concept === "string" ? body.concept.trim().slice(0, 80) : ""
      if (!name) {
        return NextResponse.json(
          { error: "Missing concept — pick one or name the topic you're teaching" },
          { status: 400 }
        )
      }
      card =
        (await prisma.conceptMastery.findFirst({
          where: { userId, concept: { equals: name, mode: "insensitive" } },
          select: { id: true, concept: true },
        })) ||
        (await prisma.conceptMastery.create({
          data: { userId, contentId: null, concept: name, source: "teachback" },
          select: { id: true, concept: true },
        }))
    }

    const evaluation = await gradeExplanation({
      concept: card.concept,
      definition: typeof body.definition === "string" ? body.definition.slice(0, 500) : null,
      audience,
      explanation,
    })

    const session = await prisma.teachBackSession.create({
      data: {
        userId,
        conceptMasteryId: card.id,
        concept: card.concept,
        audience,
        explanation,
        score: evaluation.score,
        accuracy: evaluation.accuracy,
        completeness: evaluation.completeness,
        simplicity: evaluation.simplicity,
        feedback: evaluation.feedback,
        gaps: JSON.stringify(evaluation.gaps),
        jargon: JSON.stringify(evaluation.jargon),
        followUp: evaluation.followUp,
      },
    })

    await dispatchWebhooks(userId, "teachback.completed", {
      sessionId: session.id,
      concept: card.concept,
      audience,
      score: evaluation.score,
      accuracy: evaluation.accuracy,
      completeness: evaluation.completeness,
      simplicity: evaluation.simplicity,
    })

    return NextResponse.json({
      session: sessionToJson(session),
      quality: scoreToQuality(evaluation.score),
    })
  } catch (error) {
    console.error("POST /api/teach-back error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
