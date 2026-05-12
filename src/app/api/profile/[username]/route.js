import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request, { params }) {
  const profile = await prisma.profile.findFirst({
    where: {
      username: params.username,
      isPublic: true,
    },
    include: {
      user: {
        select: {
          badgeIssuances: {
            where: { isPublic: true },
            include: { badge: true },
          },
        },
      },
    },
  })

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const progressData = await prisma.watchProgress.findMany({
    where: { userId: profile.userId },
  })

  const currentVideos = await prisma.watchProgress.findMany({
    where: {
      userId: profile.userId,
      completed: false,
    },
    include: { content: { select: { id: true, title: true, thumbnailUrl: true, duration: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  })

  const heatmapData = {}
  progressData.forEach(p => {
    const date = p.updatedAt.toISOString().split('T')[0]
    heatmapData[date] = (heatmapData[date] || 0) + 1
  })

  return NextResponse.json({
    username: profile.username,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    badges: profile.user.badgeIssuances.map(bi => ({
      id: bi.badgeId,
      name: bi.badge.name,
      icon: bi.badge.icon,
      earnedAt: bi.earnedAt,
    })),
    currentVideos: currentVideos.map(wp => ({
      contentId: wp.contentId,
      title: wp.content?.title,
      thumbnailUrl: wp.content?.thumbnailUrl,
      timestamp: wp.timestamp,
      duration: wp.duration,
    })),
    heatmap: heatmapData,
    totalActiveDays: Object.keys(heatmapData).length,
  })
}
