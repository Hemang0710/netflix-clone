import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET — fetch progress for a specific video
export async function GET(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get("contentId")

    if (!contentId) {
      return NextResponse.json({ success: false }, { status: 400 })
    }

    const progress = await prisma.watchProgress.findUnique({
      where: {
        userId_contentId: {
          userId: Number(user.userId),
          contentId: Number(contentId),
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: progress || { timestamp: 0, duration: 0, completed: false },
    })

  } catch (error) {
    console.error("Progress GET error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

// POST — save progress
export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false }, { status: 401 })

    const { contentId, timestamp, duration } = await request.json()

    // Mark as completed if watched 90%+
    const completed = duration > 0 && (timestamp / duration) >= 0.9

    await prisma.watchProgress.upsert({
      where: {
        userId_contentId: {
          userId: Number(user.userId),
          contentId: Number(contentId),
        },
      },
      update: { timestamp, duration, completed },
      create: {
        userId: Number(user.userId),
        contentId: Number(contentId),
        timestamp,
        duration,
        completed,
      },
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Progress POST error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}