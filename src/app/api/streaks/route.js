import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

function calculateStreak(sessions) {
  if (!sessions || sessions.length === 0) {
    return { current: 0, best: 0 }
  }

  // Sort sessions by date (newest first)
  const sorted = [...sessions].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))

  let currentStreak = 0
  let bestStreak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get unique days
  const daysWithSessions = new Set()
  sorted.forEach((session) => {
    const day = new Date(session.startedAt)
    day.setHours(0, 0, 0, 0)
    daysWithSessions.add(day.getTime())
  })

  // Convert to sorted array
  const uniqueDays = Array.from(daysWithSessions)
    .map((time) => new Date(time))
    .sort((a, b) => b - a)

  if (uniqueDays.length === 0) {
    return { current: 0, best: 0 }
  }

  // Calculate current streak
  let currentDate = new Date(today)
  for (let day of uniqueDays) {
    if (day.getTime() === currentDate.getTime() || day.getTime() === currentDate.getTime() - 86400000) {
      currentStreak++
      currentDate.setTime(currentDate.getTime() - 86400000)
    } else {
      break
    }
  }

  // Calculate best streak
  let tempStreak = 1
  for (let i = 0; i < uniqueDays.length - 1; i++) {
    const diff = (uniqueDays[i].getTime() - uniqueDays[i + 1].getTime()) / (1000 * 60 * 60 * 24)
    if (diff === 1) {
      tempStreak++
    } else {
      bestStreak = Math.max(bestStreak, tempStreak)
      tempStreak = 1
    }
  }
  bestStreak = Math.max(bestStreak, tempStreak)

  return { current: currentStreak, best: bestStreak }
}

export async function GET(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get review sessions
    const reviewSessions = await prisma.reviewSession.findMany({
      where: { userId: user.userId },
      orderBy: { startedAt: 'desc' },
    })

    // Calculate review streak
    const reviewStreak = calculateStreak(reviewSessions)

    // Get watch progress for watch streak
    const watchProgress = await prisma.watchProgress.findMany({
      where: { userId: user.userId },
      orderBy: { updatedAt: 'desc' },
    })

    const watchStreak = calculateStreak(
      watchProgress.map((w) => ({ startedAt: w.updatedAt }))
    )

    return NextResponse.json({
      reviewStreak,
      watchStreak,
      totalReviewSessions: reviewSessions.length,
      totalWatchedVideos: watchProgress.length,
    })
  } catch (error) {
    console.error('GET /api/streaks error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
