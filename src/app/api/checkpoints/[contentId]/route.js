import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const contentId = parseInt(params.contentId)

    const checkpoints = await prisma.comprehensionCheckpoint.findMany({
      where: {
        userId: user.userId,
        contentId,
      },
    })

    // Return as an object indexed by chapterIndex for easy lookup
    const checkpointMap = {}
    checkpoints.forEach((cp) => {
      checkpointMap[cp.chapterIndex] = {
        passed: cp.passed,
        score: cp.score,
        attempts: cp.attempts,
      }
    })

    return NextResponse.json({ checkpoints: checkpointMap })
  } catch (error) {
    console.error('GET /api/checkpoints/[contentId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const contentId = parseInt(params.contentId)
    const { chapterIndex, chapterTitle, passed, score } = await request.json()

    const checkpoint = await prisma.comprehensionCheckpoint.upsert({
      where: {
        userId_contentId_chapterIndex: {
          userId: user.userId,
          contentId,
          chapterIndex,
        },
      },
      update: {
        passed: passed || false,
        score: score || 0,
        attempts: { increment: 1 },
        unlockedAt: passed ? new Date() : undefined,
      },
      create: {
        userId: user.userId,
        contentId,
        chapterIndex,
        chapterTitle: chapterTitle || null,
        passed: passed || false,
        score: score || 0,
        attempts: 1,
        unlockedAt: passed ? new Date() : undefined,
      },
    })

    return NextResponse.json({ checkpoint })
  } catch (error) {
    console.error('POST /api/checkpoints/[contentId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
