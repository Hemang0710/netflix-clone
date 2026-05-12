import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request, { params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const groupId = parseInt(params.groupId)

  const member = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.userId } },
  })

  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const group = await prisma.studyGroup.findUnique({
    where: { id: groupId },
    select: { roomState: true, roomTimestamp: true, roomStateAt: true, hostUserId: true },
  })

  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

  return NextResponse.json({
    roomState: group.roomState,
    roomTimestamp: group.roomTimestamp,
    roomStateAt: group.roomStateAt.toISOString(),
    hostUserId: group.hostUserId,
  })
}

export async function PATCH(request, { params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const groupId = parseInt(params.groupId)

  const group = await prisma.studyGroup.findUnique({
    where: { id: groupId },
    select: { hostUserId: true },
  })

  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  if (group.hostUserId !== user.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { roomState, roomTimestamp } = await request.json()

  const updated = await prisma.studyGroup.update({
    where: { id: groupId },
    data: {
      roomState,
      roomTimestamp,
      roomStateAt: new Date(),
    },
    select: { roomState: true, roomTimestamp: true, roomStateAt: true },
  })

  return NextResponse.json(updated)
}
