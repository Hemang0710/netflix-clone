import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false }, { status: 401 })

    const videos = await prisma.externalContent.findMany({
      where: { userId: Number(user.userId) },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        externalId: true,
        title: true,
        thumbnailUrl: true,
        channelName: true,
        duration: true,
        status: true,
        aiSummary: true,
        chapters: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, data: videos })

  } catch (error) {
    console.error("[EXTERNAL_GET] error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}