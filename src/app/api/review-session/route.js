import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get today's session
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const session = await prisma.reviewSession.findFirst({
      where: {
        userId: user.userId,
        startedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    // Get due concepts for this user
    const dueConceptsResult = await prisma.conceptMastery.findMany({
      where: {
        userId: user.userId,
        dueDate: {
          lte: new Date(),
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json({
      session,
      dueConceptsCount: dueConceptsResult.length,
      dueConcepts: dueConceptsResult,
    })
  } catch (error) {
    console.error('GET /api/review-session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Create a new review session
    const session = await prisma.reviewSession.create({
      data: {
        userId: user.userId,
        startedAt: new Date(),
      },
    })

    // Get due concepts for this session
    const dueConcepts = await prisma.conceptMastery.findMany({
      where: {
        userId: user.userId,
        dueDate: {
          lte: new Date(),
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json(
      {
        session,
        dueConcepts,
        dueConceptsCount: dueConcepts.length,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/review-session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
