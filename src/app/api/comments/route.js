import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import prisma from "@/lib/prisma"

export async function GET(request) {
  const { success } = await checkRateLimit(request, "api")
  if (!success) return NextResponse.json({ success: false }, { status: 429 })

  const { searchParams } = new URL(request.url)
  const contentId = Number(searchParams.get("contentId"))
  if (!contentId) return NextResponse.json({ success: false, message: "contentId required" }, { status: 400 })

  const comments = await prisma.comment.findMany({
    where: { contentId, parentId: null },
    include: {
      user: { select: { email: true, profile: { select: { name: true, avatarUrl: true } } } },
      replies: {
        include: { user: { select: { email: true, profile: { select: { name: true, avatarUrl: true } } } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ success: true, data: comments })
}

export async function POST(request) {
  const { success } = await checkRateLimit(request, "api")
  if (!success) return NextResponse.json({ success: false }, { status: 429 })

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

  try {
    const { contentId, body, parentId } = await request.json()
    if (!contentId || !body?.trim()) return NextResponse.json({ success: false, message: "contentId and body required" }, { status: 400 })

    const comment = await prisma.comment.create({
      data: { userId: Number(user.userId), contentId: Number(contentId), body: body.trim(), parentId: parentId ? Number(parentId) : null },
      include: { user: { select: { email: true, profile: { select: { name: true, avatarUrl: true } } } } },
    })
    return NextResponse.json({ success: true, data: comment }, { status: 201 })
  } catch (error) {
    console.error("[comments] error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
