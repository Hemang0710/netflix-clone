import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')

    // Get all concepts for user (optionally filtered by contentId)
    let concepts = await prisma.conceptMastery.findMany({
      where: {
        userId: user.userId,
        ...(contentId && { contentId: parseInt(contentId) }),
      },
      include: {
        content: {
          select: { id: true, title: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    // Lazy-seed from chapters if no concepts exist for this content
    if (contentId && concepts.length === 0) {
      const content = await prisma.content.findUnique({
        where: { id: parseInt(contentId) },
        select: { chapters: true },
      })

      if (content?.chapters) {
        try {
          const chapters = JSON.parse(content.chapters)
          const seeded = await Promise.all(
            chapters.map((ch, idx) =>
              prisma.conceptMastery.upsert({
                where: {
                  userId_contentId_concept: {
                    userId: user.userId,
                    contentId: parseInt(contentId),
                    concept: ch.title || `Chapter ${idx + 1}`,
                  },
                },
                update: {},
                create: {
                  userId: user.userId,
                  contentId: parseInt(contentId),
                  concept: ch.title || `Chapter ${idx + 1}`,
                  source: 'chapter',
                },
              })
            )
          )
          concepts = seeded
        } catch (e) {
          console.error('Failed to parse chapters:', e)
        }
      }
    }

    return NextResponse.json({ concepts })
  } catch (error) {
    console.error('GET /api/concepts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { contentId, concept, source = 'chapter' } = await request.json()

    const mastery = await prisma.conceptMastery.upsert({
      where: {
        userId_contentId_concept: {
          userId: user.userId,
          contentId: contentId || null,
          concept,
        },
      },
      update: {},
      create: {
        userId: user.userId,
        contentId: contentId || null,
        concept,
        source,
      },
    })

    return NextResponse.json({ mastery }, { status: 201 })
  } catch (error) {
    console.error('POST /api/concepts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
