import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

// SM-2 algorithm — quality: 0=Again, 1=Hard, 2=Good, 3=Easy
function sm2(card, quality) {
  let { interval, repetitions, easeFactor } = card

  if (quality === 0) {
    repetitions = 0
    interval = 1
  } else {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)

    repetitions += 1
  }

  // Update ease factor (clamp at 1.3 minimum)
  easeFactor = easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02))
  if (easeFactor < 1.3) easeFactor = 1.3

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + interval)

  return { interval, repetitions, easeFactor, dueDate }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { flashcardId, quality } = await request.json()

    if (flashcardId === undefined || quality === undefined) {
      return NextResponse.json({ success: false, message: "flashcardId and quality required" }, { status: 400 })
    }

    if (![0, 1, 2, 3].includes(Number(quality))) {
      return NextResponse.json({ success: false, message: "quality must be 0-3" }, { status: 400 })
    }

    const card = await prisma.flashcard.findUnique({
      where: { id: Number(flashcardId) },
    })

    if (!card || card.userId !== user.userId) {
      return NextResponse.json({ success: false, message: "Flashcard not found" }, { status: 404 })
    }

    const updated = sm2(card, Number(quality))

    const result = await prisma.flashcard.update({
      where: { id: card.id },
      data: updated,
    })

    return NextResponse.json({
      success: true,
      nextReview: result.dueDate,
      interval: result.interval,
      message: quality === 0 ? "Card reset — review again soon" : `Next review in ${result.interval} day${result.interval > 1 ? "s" : ""}`,
    })
  } catch (error) {
    console.error("[FLASHCARD_REVIEW] error:", error)
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 })
  }
}
