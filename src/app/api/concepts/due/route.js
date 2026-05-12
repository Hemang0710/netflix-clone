import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()

    const concepts = await prisma.conceptMastery.findMany({
      where: {
        userId: user.userId,
        dueDate: {
          lte: now,
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json({
      count: concepts.length,
      concepts,
    })
  } catch (error) {
    console.error('GET /api/concepts/due error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
