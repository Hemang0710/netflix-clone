import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contentId, question, concept } = await request.json()
  if (!contentId || !question) {
    return NextResponse.json({ error: 'Missing contentId or question' }, { status: 400 })
  }

  const questionHash = createHash('sha256')
    .update(question.toLowerCase().trim())
    .digest('hex')

  try {
    const result = await prisma.sharedQuestion.upsert({
      where: { contentId_questionHash: { contentId, questionHash } },
      update: { count: { increment: 1 } },
      create: {
        contentId,
        questionHash,
        sampleText: question.substring(0, 500),
        concept,
        count: 1,
      },
    })

    return NextResponse.json({ count: result.count })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to log question' }, { status: 500 })
  }
}
