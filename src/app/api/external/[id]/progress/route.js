import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false }, { status: 401 })
    }

    const { id } = await params
    const { timestamp, completed } = await request.json()

    const contentId = Number(id)
    const userId = Number(user.userId)

    // Verify user owns this content
    const content = await prisma.externalContent.findUnique({
      where: { id: contentId },
      select: { userId: true }
    })

    if (!content || content.userId !== userId) {
      return NextResponse.json({ success: false }, { status: 403 })
    }

    // Update or create progress
    const progress = await prisma.externalProgress.upsert({
      where: {
        userId_contentId: {
          userId,
          contentId
        }
      },
      update: {
        timestamp,
        completed: completed || undefined
      },
      create: {
        userId,
        contentId,
        timestamp,
        completed
      }
    })

    return NextResponse.json({ success: true, data: progress })

  } catch (error) {
    console.error("[EXTERNAL_PROGRESS] error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false }, { status: 401 })
    }

    const { id } = await params
    const contentId = Number(id)
    const userId = Number(user.userId)

    const progress = await prisma.externalProgress.findUnique({
      where: {
        userId_contentId: {
          userId,
          contentId
        }
      }
    })

    return NextResponse.json({ success: true, data: progress })

  } catch (error) {
    console.error("[EXTERNAL_PROGRESS_GET] error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
