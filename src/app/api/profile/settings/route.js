import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

const USERNAME_REGEX = /^[a-z0-9-]{3,30}$/

export async function PATCH(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username, isPublic, showHeatmap, showBadges, showCurrentVideos } = await request.json()

  if (username && !USERNAME_REGEX.test(username)) {
    return NextResponse.json(
      { error: 'Invalid username. Must be 3-30 characters, lowercase letters, numbers, and hyphens only.' },
      { status: 422 }
    )
  }

  try {
    const updated = await prisma.profile.upsert({
      where: { userId: user.userId },
      update: {
        ...(username !== undefined && { username }),
        ...(isPublic !== undefined && { isPublic }),
        ...(showHeatmap !== undefined && { showHeatmap }),
        ...(showBadges !== undefined && { showBadges }),
        ...(showCurrentVideos !== undefined && { showCurrentVideos }),
      },
      create: {
        userId: user.userId,
        name: user.email,
        username,
        isPublic,
        showHeatmap,
        showBadges,
        showCurrentVideos,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
