import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const contentId = searchParams.get("contentId")

  if (!contentId) {
    return NextResponse.json({ success: false, error: "contentId required" }, { status: 400 })
  }

  const groups = await prisma.studyGroup.findMany({
    where: {
      contentId: Number(contentId),
      isActive: true
    },
    include: {
      members: {
        include: {
          user: { select: { email: true, profile: { select: { name: true } } } }
        }
      },
      _count: { select: { members: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json({
    success: true,
    data: groups.map(g => ({
      id: g.id,
      topicName: g.topicName,
      description: g.description,
      maxMembers: g.maxMembers,
      memberCount: g._count.members,
      members: g.members.map(m => ({
        userId: m.userId,
        name: m.user.profile?.name || m.user.email.split("@")[0],
        skillLevel: m.skillLevel,
        quizScore: m.quizScore
      })),
      createdAt: g.createdAt
    }))
  })
}
