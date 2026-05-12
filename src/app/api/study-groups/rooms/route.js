import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contentId } = await request.json()
  if (!contentId) return NextResponse.json({ error: 'Missing contentId' }, { status: 400 })

  try {
    const group = await prisma.studyGroup.create({
      data: {
        contentId,
        topicName: `Watch Room - ${Date.now()}`,
        isRoom: true,
        hostUserId: user.userId,
        maxMembers: 20,
      },
    })

    await prisma.studyGroupMember.create({
      data: {
        groupId: group.id,
        userId: user.userId,
      },
    })

    return NextResponse.json({ groupId: group.id }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}

export async function GET(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contentId = parseInt(request.nextUrl.searchParams.get('contentId'))
  if (!contentId) return NextResponse.json({ error: 'Missing contentId' }, { status: 400 })

  const rooms = await prisma.studyGroup.findMany({
    where: {
      contentId,
      isRoom: true,
      isActive: true,
    },
    include: {
      host: { select: { profile: { select: { name: true, avatarUrl: true } } } },
      members: {
        select: {
          userId: true,
          user: { select: { profile: { select: { name: true, avatarUrl: true } } } },
        },
      },
    },
  })

  return NextResponse.json({
    rooms: rooms.map(r => ({
      id: r.id,
      topicName: r.topicName,
      hostName: r.host?.profile?.name || 'Host',
      memberCount: r.members.length,
      maxMembers: r.maxMembers,
      members: r.members.map(m => ({
        userId: m.userId,
        name: m.user?.profile?.name || 'User',
        avatarUrl: m.user?.profile?.avatarUrl,
      })),
    })),
  })
}
