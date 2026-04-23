import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET — count of cards due for review today (used by Navbar badge)
export async function GET(request) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ due: 0 })
    }

    const due = await prisma.flashcard.count({
      where: { userId: user.userId, dueDate: { lte: new Date() } },
    }).catch(() => 0)  // table may not exist yet

    return NextResponse.json({ success: true, due })
  } catch (error) {
    console.error("[FLASHCARDS_DUE] error:", error)
    return NextResponse.json({ due: 0 })
  }
}
