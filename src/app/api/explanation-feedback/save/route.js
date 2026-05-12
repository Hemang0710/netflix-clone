import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req) {
  try {
    const user = await getCurrentUser()
    if (!user?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    })

    if (!dbUser) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    const {
      contentId,
      chapterTitle,
      explainerType,
      helpfulnessScore,
      timeSpentSeconds,
    } = await req.json()

    // Validate inputs
    if (!explainerType || !["diagram", "analogy", "walkthrough"].includes(explainerType)) {
      return Response.json(
        { error: "Invalid explainerType. Must be: diagram, analogy, or walkthrough" },
        { status: 400 }
      )
    }

    if (helpfulnessScore < 0 || helpfulnessScore > 5) {
      return Response.json(
        { error: "helpfulnessScore must be between 0 and 5" },
        { status: 400 }
      )
    }

    const feedback = await prisma.explanationFeedback.create({
      data: {
        userId: dbUser.id,
        contentId: contentId || null,
        chapterTitle: chapterTitle || null,
        explainerType,
        helpfulnessScore,
        timeSpentSeconds,
      },
    })

    return Response.json(feedback, { status: 201 })
  } catch (error) {
    console.error("Error saving explanation feedback:", error)
    return Response.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    )
  }
}
