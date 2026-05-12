import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request, { params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sessionId = parseInt(params.sessionId)
  const session = await prisma.studyBuddySession.findUnique({
    where: { id: sessionId },
    include: {
      requester: { select: { id: true, profile: { select: { name: true, avatarUrl: true } } } },
      receiver: { select: { id: true, profile: { select: { name: true, avatarUrl: true } } } },
    },
  })

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.requesterId !== user.userId && session.receiverId !== user.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const partnerId = session.requesterId === user.userId ? session.receiverId : session.requesterId
  const [myProgress, partnerProgress] = await Promise.all([
    prisma.watchProgress.findUnique({
      where: { userId_contentId: { userId: user.userId, contentId: session.contentId } },
    }),
    prisma.watchProgress.findUnique({
      where: { userId_contentId: { userId: partnerId, contentId: session.contentId } },
    }),
  ])

  return NextResponse.json({
    session: {
      ...session,
      requester: session.requester.profile?.name || 'User',
      receiver: session.receiver.profile?.name || 'User',
    },
    myTimestamp: myProgress?.timestamp || 0,
    partnerTimestamp: partnerProgress?.timestamp || 0,
  })
}

export async function PATCH(request, { params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sessionId = parseInt(params.sessionId)
  const { action } = await request.json()

  const session = await prisma.studyBuddySession.findUnique({
    where: { id: sessionId },
  })

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.receiverId !== user.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const newStatus = action === 'accept' ? 'active' : 'declined'
  const updated = await prisma.studyBuddySession.update({
    where: { id: sessionId },
    data: {
      status: newStatus,
      startedAt: action === 'accept' ? new Date() : undefined,
    },
  })

  if (action === 'accept') {
    await prisma.notification.create({
      data: {
        userId: session.requesterId,
        type: 'buddy_accepted',
        payload: JSON.stringify({ sessionId, contentId: session.contentId }),
      },
    })
  }

  return NextResponse.json(updated)
}
