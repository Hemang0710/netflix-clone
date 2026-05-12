import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request, { params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const partnerId = parseInt(params.partnerId)

  const partnership = await prisma.accountabilityPartner.findUnique({
    where: { id: partnerId },
  })

  if (!partnership) return NextResponse.json({ error: 'Partnership not found' }, { status: 404 })
  if (partnership.requesterId !== user.userId && partnership.receiverId !== user.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const checkIns = await prisma.partnerCheckIn.findMany({
    where: { partnerId },
    orderBy: { checkedInAt: 'desc' },
    take: 30,
    include: {
      user: { select: { id: true, profile: { select: { name: true } } } },
    },
  })

  return NextResponse.json({
    checkIns: checkIns.map(ci => ({
      id: ci.id,
      userId: ci.userId,
      userName: ci.user?.profile?.name || 'User',
      checkedInAt: ci.checkedInAt,
      note: ci.note,
    })),
  })
}
