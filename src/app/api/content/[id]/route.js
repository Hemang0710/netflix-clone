import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import prisma from "@/lib/prisma"

export async function DELETE(request, { params }) {
  const { success: rateLimitOk } = await checkRateLimit(request, "api")
  if (!rateLimitOk) {
    return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const contentId = Number(id)

  try {
    // Verify ownership before deleting
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { creatorId: true, title: true },
    })

    if (!content) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })
    }

    if (content.creatorId !== Number(user.userId)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Delete all related records first, then the content
    await prisma.$transaction([
      prisma.watchProgress.deleteMany({ where: { contentId } }),
      prisma.quizAttempt.deleteMany({ where: { contentId } }),
      prisma.quiz.deleteMany({ where: { contentId } }),
      prisma.flashcard.deleteMany({ where: { contentId } }),
      prisma.learningInsight.deleteMany({ where: { contentId } }),
      prisma.purchase.deleteMany({ where: { contentId } }),
      prisma.content.delete({ where: { id: contentId } }),
    ])

    console.log(`[content/delete] id=${contentId} by user=${user.userId}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[content/delete] error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete" },
      { status: 500 }
    )
  }
}
