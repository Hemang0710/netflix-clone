import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request) {
  const contentId = parseInt(new URL(request.url).searchParams.get('contentId'))
  if (!contentId) return NextResponse.json({ error: 'Missing contentId' }, { status: 400 })

  const questions = await prisma.sharedQuestion.findMany({
    where: { contentId },
    orderBy: { count: 'desc' },
    take: 10,
    select: { sampleText: true, count: true, concept: true },
  })

  return NextResponse.json({ questions })
}
