import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { newCalendarToken } from "@/lib/autopilot"

/**
 * POST /api/autopilot/token — rotate the secret calendar-feed token.
 * The old feed URL stops working immediately (use if the link ever leaks).
 */
export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = Number(user.userId)
    const token = newCalendarToken()
    await prisma.autopilotSettings.upsert({
      where: { userId },
      update: { calendarToken: token },
      create: { userId, calendarToken: token },
    })

    return NextResponse.json({
      calendarToken: token,
      feedPath: `/api/autopilot/calendar/${token}`,
    })
  } catch (error) {
    console.error("POST /api/autopilot/token error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
