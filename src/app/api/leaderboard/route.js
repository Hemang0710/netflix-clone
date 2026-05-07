import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rateLimit"
import prisma from "@/lib/prisma"

export async function GET(request) {
  const { success } = await checkRateLimit(request, "api")
  if (!success) return NextResponse.json({ success: false }, { status: 429 })

  try {
    const [quizScores, watchData, flashcardData] = await Promise.all([
      // Top quiz scorers
      prisma.quizAttempt.groupBy({
        by: ["userId"],
        _avg: { score: true },
        _count: { id: true },
        orderBy: { _avg: { score: "desc" } },
      }),
      // Most watch time (sum of timestamps)
      prisma.watchProgress.groupBy({
        by: ["userId"],
        _sum: { timestamp: true },
        _count: { id: true },
      }),
      // Most flashcard repetitions
      prisma.flashcard.groupBy({
        by: ["userId"],
        _sum: { repetitions: true },
      }),
    ])

    // Build unified score map
    const scoreMap = {}

    for (const q of quizScores) {
      scoreMap[q.userId] = scoreMap[q.userId] || { userId: q.userId, quizScore: 0, watchMinutes: 0, flashcardReps: 0 }
      scoreMap[q.userId].quizScore = Math.round(q._avg.score ?? 0)
      scoreMap[q.userId].quizCount = q._count.id
    }
    for (const w of watchData) {
      scoreMap[w.userId] = scoreMap[w.userId] || { userId: w.userId, quizScore: 0, watchMinutes: 0, flashcardReps: 0 }
      scoreMap[w.userId].watchMinutes = Math.round((w._sum.timestamp ?? 0) / 60)
    }
    for (const f of flashcardData) {
      scoreMap[f.userId] = scoreMap[f.userId] || { userId: f.userId, quizScore: 0, watchMinutes: 0, flashcardReps: 0 }
      scoreMap[f.userId].flashcardReps = f._sum.repetitions ?? 0
    }

    const userIds = Object.keys(scoreMap).map(Number)
    const profiles = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, profile: { select: { name: true, avatarUrl: true } } },
    })
    const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))

    const leaderboard = Object.values(scoreMap)
      .map(entry => ({
        ...entry,
        name: profileMap[entry.userId]?.profile?.name || profileMap[entry.userId]?.email?.split("@")[0] || "Learner",
        // Composite score: quiz 50% + watch 30% + flashcards 20%
        totalScore: Math.round(entry.quizScore * 0.5 + Math.min(entry.watchMinutes, 200) * 0.15 + Math.min(entry.flashcardReps, 100) * 0.2),
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 20)

    return NextResponse.json({ success: true, data: leaderboard })
  } catch (error) {
    console.error("[leaderboard] error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
