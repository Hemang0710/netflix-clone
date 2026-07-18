import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { buildDigest, buildForecast } from "@/lib/forgetting"
import { sendForgettingDigestEmail } from "@/lib/email"

const DIGEST_COOLDOWN_MS = 20 * 60 * 60 * 1000 // at most one digest per ~day
const MAX_USERS_PER_RUN = 200

/**
 * GET /api/cron/forgetting-digest — daily "5-minute save" digest.
 * For every user with concepts about to decay, drop an in-app notification
 * (type "forgetting_digest") and send the digest email.
 *
 * Secured for schedulers (Vercel Cron sends Authorization: Bearer CRON_SECRET).
 */
export async function GET(request) {
  try {
    const secret = process.env.CRON_SECRET
    if (!secret) {
      return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 })
    }
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Users whose learned concepts come due within the next 2 days — the
    // SM-2 due date is when retention hits the danger zone, so it's a cheap
    // DB-side prefilter before running the real retention math per user.
    const soon = new Date(Date.now() + 2 * 86_400_000)
    const dueRows = await prisma.conceptMastery.findMany({
      where: {
        dueDate: { lte: soon },
        OR: [{ repetitions: { gt: 0 } }, { reviewCount: { gt: 0 } }],
      },
      select: { userId: true },
      distinct: ["userId"],
      take: MAX_USERS_PER_RUN,
    })

    let usersNotified = 0
    for (const { userId } of dueRows) {
      // Don't stack digests: skip users nagged within the cooldown window
      const recent = await prisma.notification.findFirst({
        where: {
          userId,
          type: "forgetting_digest",
          createdAt: { gte: new Date(Date.now() - DIGEST_COOLDOWN_MS) },
        },
        select: { id: true },
      })
      if (recent) continue

      const concepts = await prisma.conceptMastery.findMany({ where: { userId } })
      const digest = buildDigest(buildForecast(concepts))
      if (!digest) continue

      await prisma.notification.create({
        data: {
          userId,
          type: "forgetting_digest",
          payload: JSON.stringify({
            subject: digest.subject,
            body: digest.body,
            conceptCount: digest.conceptCount,
            minutes: digest.minutes,
            link: "/learn#daily-review",
          }),
        },
      })

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })
      if (user?.email) {
        await sendForgettingDigestEmail(user.email, digest)
      }
      usersNotified++
    }

    return NextResponse.json({ success: true, usersNotified, candidates: dueRows.length })
  } catch (error) {
    console.error("GET /api/cron/forgetting-digest error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
