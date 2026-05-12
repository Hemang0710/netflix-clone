import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const partnerships = await prisma.accountabilityPartner.findMany({
    where: {
      OR: [{ requesterId: user.userId }, { receiverId: user.userId }],
      status: 'active',
    },
    include: {
      requester: { select: { id: true, profile: { select: { name: true } } } },
      receiver: { select: { id: true, profile: { select: { name: true } } } },
      checkIns: {
        orderBy: { checkedInAt: 'desc' },
        take: 1,
      },
    },
  })

  const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000)

  for (const p of partnerships) {
    const partnerId = p.requesterId === user.userId ? p.receiverId : p.requesterId
    const lastCheckIn = p.checkIns[0]

    if (!lastCheckIn || new Date(lastCheckIn.checkedInAt) < twentyFiveHoursAgo) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: user.userId,
          type: 'partner_missed',
          createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      })

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            userId: user.userId,
            type: 'partner_missed',
            payload: JSON.stringify({ partnerId: p.id, partnerName: p.requesterId === user.userId ? p.receiver.profile?.name : p.requester.profile?.name }),
          },
        })
      }
    }
  }

  return NextResponse.json({
    partnerships: partnerships.map(p => ({
      id: p.id,
      partnerId: p.requesterId === user.userId ? p.receiverId : p.requesterId,
      partnerName: p.requesterId === user.userId ? p.receiver.profile?.name : p.requester.profile?.name,
      status: p.status,
      acceptedAt: p.acceptedAt,
      lastCheckIn: p.checkIns[0]?.checkedInAt,
    })),
  })
}
