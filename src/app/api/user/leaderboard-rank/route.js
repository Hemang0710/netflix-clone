import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ rank: null }, { status: 200 })

    // Get leaderboard data
    const [quizScores, watchData, flashcardData] = await Promise.all([
      prisma.quizAttempt.groupBy({
        by: ["userId"],
        _avg: { score: true },
        _count: { id: true },
        orderBy: { _avg: { score: "desc" } },
      }),
      prisma.watchProgress.groupBy({
        by: ["userId"],
        _sum: { timestamp: true },
        _count: { id: true },
      }),
      prisma.flashcard.groupBy({
        by: ["userId"],
        _sum: { repetitions: true },
      }),
    ])

    // Build score map
    const scoreMap = {}
    for (const q of quizScores) {
      scoreMap[q.userId] = scoreMap[q.userId] || { userId: q.userId, quizScore: 0, watchMinutes: 0, flashcardReps: 0 }
      scoreMap[q.userId].quizScore = Math.round(q._avg.score ?? 0)
      scoreMap[q.userId].quizCount = q._count.id
    }
    for (const w of watchData) {
      scoreMap[w.userId] = scoreMap[w.userId] || { userId: w.userId, quizScore: 0, watchMinutes: 0, flashcardReps: 0 }
      scoreMap[w.userId].watchMinutes = Math.round((w._sum.timestamp ?? 0) / 60)
      scoreMap[w.userId].watchCount = w._count.id
    }
    for (const f of flashcardData) {
      scoreMap[f.userId] = scoreMap[f.userId] || { userId: f.userId, quizScore: 0, watchMinutes: 0, flashcardReps: 0 }
      scoreMap[f.userId].flashcardReps = f._sum.repetitions ?? 0
    }

    // Calculate scores and rank
    const leaderboard = Object.values(scoreMap)
      .map((entry) => ({
        ...entry,
        totalScore: Math.round(entry.quizScore * 0.5 + Math.min(entry.watchMinutes, 200) * 0.15 + Math.min(entry.flashcardReps, 100) * 0.2),
      }))
      .sort((a, b) => b.totalScore - a.totalScore)

    const userIndex = leaderboard.findIndex((u) => u.userId === user.userId)
    const userEntry = leaderboard[userIndex]
    const rank = userIndex + 1

    return NextResponse.json({
      rank,
      totalUsers: leaderboard.length,
      userScore: userEntry?.totalScore || 0,
      quizScore: userEntry?.quizScore || 0,
      watchMinutes: userEntry?.watchMinutes || 0,
      flashcardReps: userEntry?.flashcardReps || 0,
      success: true,
    })
  } catch (error) {
    console.error("[USER_LEADERBOARD_RANK] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
