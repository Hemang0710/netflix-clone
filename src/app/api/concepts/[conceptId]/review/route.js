import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { applySM2, calcMasteryScore } from '@/lib/sm2'

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const conceptId = parseInt(params.conceptId)
    const { quality, score } = await request.json()

    // Validate quality is 0-3
    if (![0, 1, 2, 3].includes(quality)) {
      return NextResponse.json({ error: 'Invalid quality (must be 0-3)' }, { status: 400 })
    }

    // Fetch the concept
    const concept = await prisma.conceptMastery.findUnique({
      where: { id: conceptId },
    })

    if (!concept) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 })
    }

    if (concept.userId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Apply SM-2 algorithm
    const { interval, repetitions, easeFactor, dueDate } = applySM2(
      {
        interval: concept.interval,
        repetitions: concept.repetitions,
        easeFactor: concept.easeFactor,
      },
      quality
    )

    // Calculate mastery score
    const masteryScore = calcMasteryScore(repetitions, easeFactor, score)

    // Update concept
    const updated = await prisma.conceptMastery.update({
      where: { id: conceptId },
      data: {
        interval,
        repetitions,
        easeFactor,
        dueDate,
        masteryScore,
        lastScore: score,
        lastReviewAt: new Date(),
        reviewCount: concept.reviewCount + 1,
      },
    })

    return NextResponse.json({ concept: updated })
  } catch (error) {
    console.error('POST /api/concepts/[id]/review error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
