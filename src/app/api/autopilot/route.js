import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import {
  buildSchedule,
  isValidTimezone,
  newCalendarToken,
  parseStudyDays,
} from "@/lib/autopilot"

const MAX_CONCEPTS = 500

function settingsToJson(s) {
  return {
    enabled: s.enabled,
    studyDays: parseStudyDays(s.studyDays),
    startHour: s.startHour,
    endHour: s.endHour,
    slotMinutes: s.slotMinutes,
    maxSlotsPerDay: s.maxSlotsPerDay,
    timezone: s.timezone,
    calendarToken: s.calendarToken,
  }
}

async function getOrCreateSettings(userId) {
  const existing = await prisma.autopilotSettings.findUnique({ where: { userId } })
  if (existing) return existing
  return prisma.autopilotSettings.create({
    data: { userId, calendarToken: newCalendarToken() },
  })
}

async function scheduleFor(userId, settings) {
  const horizonEnd = new Date(Date.now() + 30 * 86_400_000)
  const concepts = await prisma.conceptMastery.findMany({
    where: { userId, dueDate: { lte: horizonEnd } },
    select: { id: true, concept: true, dueDate: true, masteryScore: true },
    orderBy: { dueDate: "asc" },
    take: MAX_CONCEPTS,
  })
  return buildSchedule(concepts, settings)
}

/**
 * GET /api/autopilot — the user's autopilot settings plus the upcoming
 * auto-scheduled review slots. Creates default settings (and the secret
 * calendar-feed token) on first call.
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = Number(user.userId)
    const settings = await getOrCreateSettings(userId)
    const schedule = settings.enabled ? await scheduleFor(userId, settings) : null

    return NextResponse.json({
      settings: settingsToJson(settings),
      schedule,
      feedPath: `/api/autopilot/calendar/${settings.calendarToken}`,
    })
  } catch (error) {
    console.error("GET /api/autopilot error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PUT /api/autopilot — update autopilot preferences.
 * Body: { enabled?, studyDays?, startHour?, endHour?, slotMinutes?,
 *         maxSlotsPerDay?, timezone? }
 */
export async function PUT(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const data = {}

    if (typeof body.enabled === "boolean") data.enabled = body.enabled

    if (body.studyDays !== undefined) {
      if (!Array.isArray(body.studyDays)) {
        return NextResponse.json({ error: "studyDays must be an array of weekdays (0-6)" }, { status: 400 })
      }
      const days = [...new Set(body.studyDays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))]
      if (!days.length) {
        return NextResponse.json({ error: "Pick at least one study day" }, { status: 400 })
      }
      data.studyDays = JSON.stringify(days.sort((a, b) => a - b))
    }

    for (const [key, min, max] of [
      ["startHour", 0, 23],
      ["endHour", 1, 24],
      ["slotMinutes", 10, 120],
      ["maxSlotsPerDay", 1, 6],
    ]) {
      if (body[key] !== undefined) {
        const n = Number(body[key])
        if (!Number.isInteger(n) || n < min || n > max) {
          return NextResponse.json({ error: `${key} must be an integer between ${min} and ${max}` }, { status: 400 })
        }
        data[key] = n
      }
    }

    if (body.timezone !== undefined) {
      if (!isValidTimezone(body.timezone)) {
        return NextResponse.json({ error: "Invalid timezone (use an IANA name like Asia/Kolkata)" }, { status: 400 })
      }
      data.timezone = body.timezone
    }

    const userId = Number(user.userId)
    const current = await getOrCreateSettings(userId)
    const startHour = data.startHour ?? current.startHour
    const endHour = data.endHour ?? current.endHour
    if (endHour <= startHour) {
      return NextResponse.json({ error: "The study window must end after it starts" }, { status: 400 })
    }

    const settings = await prisma.autopilotSettings.update({
      where: { userId },
      data,
    })
    const schedule = settings.enabled ? await scheduleFor(userId, settings) : null

    return NextResponse.json({
      settings: settingsToJson(settings),
      schedule,
      feedPath: `/api/autopilot/calendar/${settings.calendarToken}`,
    })
  } catch (error) {
    console.error("PUT /api/autopilot error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
