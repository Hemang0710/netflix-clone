import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Fetch all watch progress records for this user, last 365 days
    const since = new Date()
    since.setDate(since.getDate() - 364)

    const progress = await prisma.watchProgress.findMany({
      where: {
        userId: user.userId,
        updatedAt: { gte: since },
        timestamp: { gt: 30 }, // only count sessions > 30 seconds
      },
      select: {
        updatedAt: true,
        contentId: true,
        timestamp: true,
        duration: true,
      },
      orderBy: { updatedAt: "asc" },
    })

    // Group by date (YYYY-MM-DD)
    const byDate = {}
    for (const p of progress) {
      const date = p.updatedAt.toISOString().split("T")[0]
      if (!byDate[date]) byDate[date] = { sessions: new Set(), minutes: 0 }
      byDate[date].sessions.add(p.contentId)
      // Estimate minutes watched (capped at duration)
      const mins = Math.min(p.timestamp, p.duration || p.timestamp) / 60
      byDate[date].minutes += mins
    }

    // Build 52-week grid (364 days + today = 365)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weeks = []
    // Start from Sunday 52 weeks ago
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 364)
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay())

    let current = new Date(startDate)
    while (current <= today) {
      const week = []
      for (let d = 0; d < 7; d++) {
        const dateStr = current.toISOString().split("T")[0]
        const isFuture = current > today
        const data = byDate[dateStr]
        week.push({
          date: dateStr,
          count: isFuture ? 0 : (data?.sessions.size || 0),
          minutes: isFuture ? 0 : Math.round(data?.minutes || 0),
          isFuture,
        })
        current.setDate(current.getDate() + 1)
      }
      weeks.push(week)
    }

    // Compute streak
    let streak = 0
    const checkDate = new Date(today)
    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0]
      if (byDate[dateStr]?.sessions.size > 0) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    // Total stats
    const totalDays = Object.keys(byDate).length
    const totalMinutes = Math.round(Object.values(byDate).reduce((sum, d) => sum + d.minutes, 0))
    const totalSessions = Object.values(byDate).reduce((sum, d) => sum + d.sessions.size, 0)

    // Last 7 days for velocity bar
    const last7 = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split("T")[0]
      last7.push({
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        minutes: Math.round(byDate[dateStr]?.minutes || 0),
      })
    }

    return NextResponse.json({
      success: true,
      weeks,
      stats: { streak, totalDays, totalMinutes, totalSessions },
      last7,
    })
  } catch (error) {
    console.error("[HEATMAP_GET] error:", error)
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 })
  }
}
