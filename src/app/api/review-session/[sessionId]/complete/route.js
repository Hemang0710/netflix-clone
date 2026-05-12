import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sessionId = parseInt(params.sessionId)
    const { avgScore, conceptsReviewed, durationSeconds } = await request.json()

    // Verify session ownership
    const session = await prisma.reviewSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.userId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update session
    const updated = await prisma.reviewSession.update({
      where: { id: sessionId },
      data: {
        completedAt: new Date(),
        conceptsReviewed,
        avgScore,
        durationSeconds,
      },
    })

    return NextResponse.json({ session: updated })
  } catch (error) {
    console.error('POST /api/review-session/[id]/complete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
