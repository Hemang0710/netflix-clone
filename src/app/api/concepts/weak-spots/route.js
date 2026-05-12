import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { daysUntilDue } from '@/lib/sm2'

export async function GET(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get all concepts for user
    const concepts = await prisma.conceptMastery.findMany({
      where: { userId: user.userId },
      orderBy: { masteryScore: 'asc' },
    })

    // Filter to only weak spots (masteryScore < 60)
    const weakConcepts = concepts.filter((c) => c.masteryScore < 60)

    // Determine weakness reason
    const enrichedWeakSpots = weakConcepts.slice(0, 10).map((concept) => {
      let weaknessReason = 'insufficient_practice'

      if (concept.reviewCount === 0) {
        weaknessReason = 'never_reviewed'
      } else if (concept.reviewCount > 2 && concept.masteryScore < concept.lastScore) {
        weaknessReason = 'rapid_forgetting'
      } else if (concept.reviewCount < 3) {
        weaknessReason = 'insufficient_practice'
      }

      return {
        ...concept,
        weaknessReason,
        daysUntilDue: daysUntilDue(new Date(concept.dueDate)),
      }
    })

    return NextResponse.json({
      weakSpots: enrichedWeakSpots,
      totalWeakSpots: weakConcepts.length,
    })
  } catch (error) {
    console.error('GET /api/concepts/weak-spots error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
