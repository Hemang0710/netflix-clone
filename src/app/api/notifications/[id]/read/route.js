import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(request, { params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notificationId = parseInt(params.id)

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  })

  if (!notification) return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
  if (notification.userId !== user.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  })

  return NextResponse.json({ success: true })
}
