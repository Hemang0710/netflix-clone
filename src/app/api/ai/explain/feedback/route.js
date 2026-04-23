import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import prisma from "@/lib/prisma"

export async function POST(request) {
  const { success: rateLimitOk } = await checkRateLimit(request, "api")
  if (!rateLimitOk) {
    return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { contentId, concept, type, helpful } = await request.json()

    if (!concept || !type || helpful === undefined) {
      return NextResponse.json(
        { success: false, message: "concept, type, and helpful are required" },
        { status: 400 }
      )
    }

    await prisma.learningInsight.create({
      data: {
        userId: user.userId,
        contentId: contentId ? Number(contentId) : 0,
        concept: concept.slice(0, 500),
        explainType: type,
        helpful: Boolean(helpful),
      },
    })

    console.log(`[explain/feedback] user=${user.userId} type=${type} helpful=${helpful}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[explain/feedback] error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    )
  }
}
