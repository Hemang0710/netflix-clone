import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contentId = parseInt(request.nextUrl.searchParams.get('contentId'))
  if (!contentId) return NextResponse.json({ error: 'Missing contentId' }, { status: 400 })

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

  await prisma.activeLearner.upsert({
    where: { userId_contentId: { userId: user.userId, contentId } },
    update: { lastSeen: new Date() },
    create: { userId: user.userId, contentId },
  })

  const activeCount = await prisma.activeLearner.count({
    where: {
      contentId,
      lastSeen: { gt: fiveMinutesAgo },
    },
  })

  const peers = await prisma.activeLearner.findMany({
    where: {
      contentId,
      lastSeen: { gt: fiveMinutesAgo },
      userId: { not: user.userId },
    },
    include: {
      user: { select: { id: true, profile: { select: { name: true, avatarUrl: true } } } },
    },
    take: 10,
  })

  return NextResponse.json({
    activeCount,
    peers: peers.map(al => ({
      userId: al.userId,
      name: al.user.profile?.name || 'Anonymous',
      avatarUrl: al.user.profile?.avatarUrl,
    })),
  })
}
