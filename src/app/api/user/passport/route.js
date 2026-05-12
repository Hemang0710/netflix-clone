import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get all mastery records for user
    const masteryRecords = await prisma.conceptMastery.findMany({
      where: { userId: user.userId },
      orderBy: { masteryScore: 'desc' },
    })

    // Get all review sessions
    const reviewSessions = await prisma.reviewSession.findMany({
      where: { userId: user.userId },
    })

    // Calculate statistics
    const totalConcepts = masteryRecords.length
    const totalMastered = masteryRecords.filter((m) => m.masteryScore >= 80).length
    const topConcepts = masteryRecords
      .filter((m) => m.masteryScore >= 80)
      .slice(0, 5)
      .map((m) => m.concept)

    // Tier breakdown
    const tierBreakdown = {
      Mastered: masteryRecords.filter((m) => m.masteryScore >= 80).length,
      Proficient: masteryRecords.filter((m) => m.masteryScore >= 60 && m.masteryScore < 80).length,
      Developing: masteryRecords.filter((m) => m.masteryScore >= 40 && m.masteryScore < 60).length,
      Beginning: masteryRecords.filter((m) => m.masteryScore < 40).length,
    }

    // Build passport URL
    const passportUrl = `${new URL(request.url).origin}/passport/${user.userId}`

    return NextResponse.json({
      userId: user.userId,
      email: user.email,
      totalConcepts,
      totalMastered,
      topConcepts,
      tierBreakdown,
      totalReviews: reviewSessions.length,
      passportUrl,
    })
  } catch (error) {
    console.error('GET /api/user/passport error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
