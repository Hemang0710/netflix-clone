import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rateLimit"
import { buildICalFeed, buildSchedule } from "@/lib/autopilot"

export const dynamic = "force-dynamic"

const MAX_CONCEPTS = 500

/**
 * GET /api/autopilot/calendar/[token] — the personal iCal feed.
 *
 * Authenticated by the secret token in the URL (calendar apps can't send
 * headers or cookies — a capability URL is the standard pattern for feed
 * subscriptions). Rotate it via POST /api/autopilot/token.
 */
export async function GET(request, { params }) {
  try {
    const rate = await checkRateLimit(request, "api")
    if (!rate.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const { token } = await params
    if (!token || typeof token !== "string" || token.length < 16) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const settings = await prisma.autopilotSettings.findUnique({
      where: { calendarToken: token },
    })
    if (!settings || !settings.enabled) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const horizonEnd = new Date(Date.now() + 30 * 86_400_000)
    const concepts = await prisma.conceptMastery.findMany({
      where: { userId: settings.userId, dueDate: { lte: horizonEnd } },
      select: { id: true, concept: true, dueDate: true, masteryScore: true },
      orderBy: { dueDate: "asc" },
      take: MAX_CONCEPTS,
    })

    const { slots } = buildSchedule(concepts, settings)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
    const ics = buildICalFeed(slots, { appUrl })

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="learnai-study-autopilot.ics"',
        "Cache-Control": "private, max-age=900",
      },
    })
  } catch (error) {
    console.error("GET /api/autopilot/calendar/[token] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
