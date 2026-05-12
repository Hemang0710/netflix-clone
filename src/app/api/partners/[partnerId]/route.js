import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(request, { params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const partnerId = parseInt(params.partnerId)
  const { action } = await request.json()

  const partnership = await prisma.accountabilityPartner.findUnique({
    where: { id: partnerId },
  })

  if (!partnership) return NextResponse.json({ error: 'Partnership not found' }, { status: 404 })
  if (partnership.receiverId !== user.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const newStatus = action === 'accept' ? 'active' : 'ended'
  const updated = await prisma.accountabilityPartner.update({
    where: { id: partnerId },
    data: {
      status: newStatus,
      acceptedAt: action === 'accept' ? new Date() : undefined,
    },
  })

  if (action === 'accept') {
    await prisma.notification.create({
      data: {
        userId: partnership.requesterId,
        type: 'partner_accepted',
        payload: JSON.stringify({ partnerId }),
      },
    })
  }

  return NextResponse.json(updated)
}
