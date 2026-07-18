import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { buildForecast, DEFAULT_THRESHOLD } from "@/lib/forgetting"

/**
 * GET /api/forecast — the user's forgetting forecast: which concepts are
 * projected to decay below the retention threshold, and when.
 * Query: days (1-30, default 7), threshold (50-95, default 70).
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const days = Math.min(Math.max(parseInt(searchParams.get("days") || "7", 10) || 7, 1), 30)
    const threshold = Math.min(
      Math.max(parseInt(searchParams.get("threshold") || `${DEFAULT_THRESHOLD}`, 10) || DEFAULT_THRESHOLD, 50),
      95
    )

    const concepts = await prisma.conceptMastery.findMany({
      where: { userId: Number(user.userId) },
      include: { content: { select: { title: true } } },
    })

    return NextResponse.json({ forecast: buildForecast(concepts, { days, threshold }) })
  } catch (error) {
    console.error("GET /api/forecast error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
