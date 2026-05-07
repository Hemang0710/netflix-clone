import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import prisma from "@/lib/prisma"

export async function GET(request) {
  const { success } = await checkRateLimit(request, "api")
  if (!success) return NextResponse.json({ success: false }, { status: 429 })

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const contentId = Number(searchParams.get("contentId"))
  if (!contentId) return NextResponse.json({ success: false, message: "contentId required" }, { status: 400 })

  const notes = await prisma.note.findMany({
    where: { contentId, userId: Number(user.userId) },
    orderBy: [{ timestamp: "asc" }, { createdAt: "asc" }],
  })
  return NextResponse.json({ success: true, data: notes })
}

export async function POST(request) {
  const { success } = await checkRateLimit(request, "api")
  if (!success) return NextResponse.json({ success: false }, { status: 429 })

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

  try {
    const { contentId, timestamp, body } = await request.json()
    if (!contentId || !body?.trim()) return NextResponse.json({ success: false, message: "contentId and body required" }, { status: 400 })

    const note = await prisma.note.create({
      data: { userId: Number(user.userId), contentId: Number(contentId), timestamp: timestamp ?? null, body: body.trim(), isAI: false },
    })
    return NextResponse.json({ success: true, data: note }, { status: 201 })
  } catch (error) {
    console.error("[notes] error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
