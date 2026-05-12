import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req) {
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

    // Get all feedback for this user from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const feedbacks = await prisma.explanationFeedback.findMany({
      where: {
        userId: dbUser.id,
        createdAt: { gte: thirtyDaysAgo },
      },
    })

    // Group by explainerType and calculate average helpfulness score
    const typeScores = {
      diagram: { scores: [], avgScore: 0, count: 0 },
      analogy: { scores: [], avgScore: 0, count: 0 },
      walkthrough: { scores: [], avgScore: 0, count: 0 },
    }

    feedbacks.forEach((feedback) => {
      if (typeScores[feedback.explainerType]) {
        typeScores[feedback.explainerType].scores.push(feedback.helpfulnessScore)
      }
    })

    // Calculate averages
    Object.keys(typeScores).forEach((type) => {
      const scores = typeScores[type].scores
      if (scores.length > 0) {
        typeScores[type].count = scores.length
        typeScores[type].avgScore =
          scores.reduce((a, b) => a + b, 0) / scores.length
      }
    })

    // Find the best type (highest average score)
    let bestType = null
    let bestScore = -1

    Object.entries(typeScores).forEach(([type, data]) => {
      if (data.avgScore > bestScore) {
        bestScore = data.avgScore
        bestType = type
      }
    })

    // If no feedback yet, return null (will use default/random selection)
    if (!bestType) {
      return Response.json({
        bestExplainerType: null,
        scores: typeScores,
        feedbackCount: feedbacks.length,
      })
    }

    return Response.json({
      bestExplainerType: bestType,
      scores: typeScores,
      feedbackCount: feedbacks.length,
    })
  } catch (error) {
    console.error("Error fetching explanation preferences:", error)
    return Response.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    )
  }
}
