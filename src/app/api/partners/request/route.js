import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { receiverId } = await request.json()
  if (!receiverId) return NextResponse.json({ error: 'Missing receiverId' }, { status: 400 })

  try {
    const partnership = await prisma.accountabilityPartner.create({
      data: {
        requesterId: user.userId,
        receiverId,
        status: 'pending',
      },
    })

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'partner_request',
        payload: JSON.stringify({ partnerId: partnership.id, requesterName: user.email }),
      },
    })

    return NextResponse.json({ partnerId: partnership.id }, { status: 201 })
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Partnership already exists' }, { status: 409 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to create partnership' }, { status: 500 })
  }
}
