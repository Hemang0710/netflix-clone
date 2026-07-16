import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

const MILESTONES = [
  {
    id: "first_video",
    name: "First Steps",
    description: "Watch your first video lesson",
    icon: "🎬",
    reward: "Beginner Badge",
    condition: async (user) => {
      const count = await prisma.watchProgress.count({
        where: { userId: user.userId },
      })
      return { achieved: count >= 1, progress: Math.min(count * 100, 100), current: count, target: 1 }
    },
  },
  {
    id: "week_streak",
    name: "Week Warrior",
    description: "Maintain a 7-day study streak",
    icon: "🔥",
    reward: "Streak Master Badge",
    condition: async (user) => {
      const streak = await prisma.studyStreak.findUnique({
        where: { userId: user.userId },
      })
      const current = streak?.currentStreak || 0
      return { achieved: current >= 7, progress: Math.min((current / 7) * 100, 100), current, target: 7 }
    },
  },
  {
    id: "quiz_master",
    name: "Quiz Master",
    description: "Score 80% or higher on 5 quizzes",
    icon: "📝",
    reward: "Quiz Expert Badge",
    condition: async (user) => {
      const count = await prisma.quizAttempt.count({
        where: { userId: user.userId, score: { gte: 80 } },
      })
      return { achieved: count >= 5, progress: Math.min((count / 5) * 100, 100), current: count, target: 5 }
    },
  },
  {
    id: "flashcard_master",
    name: "Flashcard Master",
    description: "Review 100 flashcards",
    icon: "🎴",
    reward: "Memory Master Badge",
    condition: async (user) => {
      const count = await prisma.flashcard.count({
        where: { userId: user.userId, repetitions: { gt: 0 } },
      })
      return { achieved: count >= 100, progress: Math.min((count / 100) * 100, 100), current: count, target: 100 }
    },
  },
  {
    id: "concept_mastery",
    name: "Concept Master",
    description: "Master 10 different concepts",
    icon: "🧠",
    reward: "Knowledge Expert Badge",
    condition: async (user) => {
      const count = await prisma.conceptMastery.count({
        where: { userId: user.userId, masteryScore: { gte: 0.8 } },
      })
      return { achieved: count >= 10, progress: Math.min((count / 10) * 100, 100), current: count, target: 10 }
    },
  },
  {
    id: "marathon_learner",
    name: "Marathon Learner",
    description: "Watch 10 hours of content",
    icon: "⏱️",
    reward: "Dedicated Learner Badge",
    condition: async (user) => {
      const result = await prisma.watchProgress.aggregate({
        where: { userId: user.userId },
        _sum: { timestamp: true },
      })
      const hours = (result._sum.timestamp || 0) / 3600
      return { achieved: hours >= 10, progress: Math.min((hours / 10) * 100, 100), current: Math.round(hours * 10) / 10, target: 10 }
    },
  },
  {
    id: "leaderboard",
    name: "Top Performer",
    description: "Reach the top 10 on leaderboard",
    icon: "🏆",
    reward: "Elite Learner Badge",
    condition: async (user) => {
      // Get user's leaderboard rank
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
        }),
        prisma.flashcard.groupBy({
          by: ["userId"],
          _sum: { repetitions: true },
        }),
      ])

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

      const leaderboard = Object.values(scoreMap)
        .map((entry) => ({
          ...entry,
          totalScore: Math.round(entry.quizScore * 0.5 + Math.min(entry.watchMinutes, 200) * 0.15 + Math.min(entry.flashcardReps, 100) * 0.2),
        }))
        .sort((a, b) => b.totalScore - a.totalScore)

      const rank = leaderboard.findIndex((u) => u.userId === user.userId) + 1
      const userEntry = leaderboard.find((u) => u.userId === user.userId)
      const topScore = leaderboard[9]?.totalScore || 1

      return {
        achieved: rank <= 10,
        progress: userEntry ? Math.min((userEntry.totalScore / topScore) * 100, 100) : 0,
        current: rank,
        target: 10,
      }
    },
  },
]

export async function GET(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Evaluate all milestones
    const evaluatedMilestones = await Promise.all(
      MILESTONES.map(async (milestone) => {
        const condition = await milestone.condition(user)
        return {
          ...milestone,
          ...condition,
          remaining: Math.max(condition.target - condition.current, 0),
        }
      })
    )

    // Find next unachieved milestone
    const nextMilestone = evaluatedMilestones.find((m) => !m.achieved)
    const achievedCount = evaluatedMilestones.filter((m) => m.achieved).length

    return NextResponse.json({
      nextMilestone: nextMilestone
        ? {
            id: nextMilestone.id,
            name: nextMilestone.name,
            description: nextMilestone.description,
            icon: nextMilestone.icon,
            reward: nextMilestone.reward,
            progress: nextMilestone.progress,
            remaining: nextMilestone.remaining,
            current: nextMilestone.current,
            target: nextMilestone.target,
            actionUrl: nextMilestone.actionUrl,
            actionText: nextMilestone.actionText,
          }
        : null,
      allMilestones: evaluatedMilestones.map((m) => ({
        id: m.id,
        name: m.name,
        icon: m.icon,
        achieved: m.achieved,
        progress: m.progress,
      })),
      achievedCount,
      totalMilestones: MILESTONES.length,
    })
  } catch (error) {
    console.error("[MILESTONES] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
