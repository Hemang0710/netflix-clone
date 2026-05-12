import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request, { params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const partnerId = parseInt(params.partnerId)
  const { note } = await request.json()

  const partnership = await prisma.accountabilityPartner.findUnique({
    where: { id: partnerId },
  })

  if (!partnership) return NextResponse.json({ error: 'Partnership not found' }, { status: 404 })
  if (partnership.requesterId !== user.userId && partnership.receiverId !== user.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (partnership.status !== 'active') {
    return NextResponse.json({ error: 'Partnership is not active' }, { status: 400 })
  }

  const checkIn = await prisma.partnerCheckIn.create({
    data: {
      partnerId,
      userId: user.userId,
      note,
    },
  })

  return NextResponse.json(checkIn, { status: 201 })
}
