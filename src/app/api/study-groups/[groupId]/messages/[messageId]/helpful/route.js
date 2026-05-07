import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request, { params }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { groupId, messageId } = await params

  // Verify user is a member of the group
  const member = await prisma.studyGroupMember.findUnique({
    where: {
      groupId_userId: { groupId: Number(groupId), userId: user.userId }
    }
  })

  if (!member) {
    return NextResponse.json({ success: false, error: "Not in group" }, { status: 403 })
  }

  const message = await prisma.studyGroupMessage.update({
    where: { id: Number(messageId) },
    data: { helpfulCount: { increment: 1 } }
  })

  return NextResponse.json({
    success: true,
    data: message
  })
}
