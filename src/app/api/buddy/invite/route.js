import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contentId, receiverId } = await request.json()
  if (!contentId || !receiverId) {
    return NextResponse.json({ error: 'Missing contentId or receiverId' }, { status: 400 })
  }

  try {
    const session = await prisma.studyBuddySession.create({
      data: {
        contentId,
        requesterId: user.userId,
        receiverId,
        status: 'pending',
      },
    })

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'buddy_invite',
        payload: JSON.stringify({ sessionId: session.id, contentId, requesterName: user.email }),
      },
    })

    return NextResponse.json({ sessionId: session.id }, { status: 201 })
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Session already exists' }, { status: 409 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
