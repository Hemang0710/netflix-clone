import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request, { params }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { groupId } = await params

  const group = await prisma.studyGroup.findUnique({
    where: { id: Number(groupId) },
    include: {
      members: {
        include: {
          user: { select: { email: true, profile: { select: { name: true } } } }
        }
      }
    }
  })

  if (!group) {
    return NextResponse.json({ success: false, error: "Group not found" }, { status: 404 })
  }

  const messages = await prisma.studyGroupMessage.findMany({
    where: { groupId: Number(groupId) },
    include: {
      user: { select: { email: true, profile: { select: { name: true } } } }
    },
    orderBy: { createdAt: "asc" },
    take: 100
  })

  return NextResponse.json({
    success: true,
    data: {
      group: {
        id: group.id,
        topicName: group.topicName,
        description: group.description,
        maxMembers: group.maxMembers,
        isActive: group.isActive,
        members: group.members.map(m => ({
          userId: m.userId,
          name: m.user.profile?.name || m.user.email.split("@")[0],
          skillLevel: m.skillLevel,
          quizScore: m.quizScore,
          joinedAt: m.joinedAt
        }))
      },
      messages: messages.map(m => ({
        id: m.id,
        userId: m.userId,
        userName: m.user?.profile?.name || m.user?.email.split("@")[0] || "Anonymous",
        message: m.message,
        isAI: m.isAI,
        isFlagged: m.isFlagged,
        helpfulCount: m.helpfulCount,
        createdAt: m.createdAt
      }))
    }
  })
}
