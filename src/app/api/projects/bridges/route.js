import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import { findMasteredClusters, generateProjectBrief, briefToJson } from "@/lib/projectBridge"

/**
 * GET /api/projects/bridges — concept clusters ready to bridge into a
 * project, plus the user's existing project briefs (newest first).
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = Number(user.userId)

    const [clusters, briefs] = await Promise.all([
      findMasteredClusters(userId),
      prisma.projectBrief.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { checkpoints: { orderBy: { order: "asc" } } },
      }),
    ])

    return NextResponse.json({ clusters, briefs: briefs.map(briefToJson) })
  } catch (error) {
    console.error("GET /api/projects/bridges error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/projects/bridges — generate a project brief for a mastered
 * cluster. Body: { clusterKey }. The cluster is re-derived server-side so
 * the client can't invent concepts or bridge an unmastered cluster.
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // AI generation costs tokens — reuse the ingest budget (30/h)
    const rate = await checkRateLimit(request, "ingest")
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many project generations — try again soon" },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const clusterKey = typeof body.clusterKey === "string" ? body.clusterKey.trim() : ""
    if (!clusterKey) {
      return NextResponse.json({ error: "Missing clusterKey" }, { status: 400 })
    }

    const userId = Number(user.userId)
    const clusters = await findMasteredClusters(userId)
    const cluster = clusters.find((c) => c.key === clusterKey)
    if (!cluster) {
      return NextResponse.json(
        { error: "That cluster isn't ready to bridge — master more of its concepts first" },
        { status: 404 }
      )
    }

    const generated = await generateProjectBrief({
      clusterLabel: cluster.label,
      concepts: cluster.concepts,
    })

    const brief = await prisma.projectBrief.create({
      data: {
        userId,
        clusterKey: cluster.key,
        clusterLabel: cluster.label,
        title: generated.title,
        pitch: generated.pitch,
        deliverable: generated.deliverable,
        difficulty: generated.difficulty,
        estimatedHours: generated.estimatedHours,
        concepts: JSON.stringify(cluster.concepts.map((c) => ({ id: c.id, concept: c.concept }))),
        checkpoints: {
          create: generated.checkpoints.map((cp, i) => ({
            order: i + 1,
            title: cp.title,
            task: cp.task,
            acceptance: cp.acceptance,
            hint: cp.hint,
          })),
        },
      },
      include: { checkpoints: { orderBy: { order: "asc" } } },
    })

    return NextResponse.json({ brief: briefToJson(brief) }, { status: 201 })
  } catch (error) {
    console.error("POST /api/projects/bridges error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
