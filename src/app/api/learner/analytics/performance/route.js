import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period"); // week | month | all

    // Calculate date range
    const now = new Date();
    let startDate = new Date(0);

    if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "month") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Quiz performance
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId: Number(user.userId),
        createdAt: { gte: startDate },
      },
      include: { content: { select: { title: true, genre: true } } },
      orderBy: { createdAt: "desc" },
    });

    const avgQuizScore =
      quizAttempts.length > 0
        ? quizAttempts.reduce((sum, q) => sum + q.score, 0) / quizAttempts.length
        : 0;

    // Concept mastery
    const conceptMasteries = await prisma.conceptMastery.findMany({
      where: {
        userId: Number(user.userId),
        lastReviewAt: { gte: startDate },
      },
    });

    const avgMasteryScore =
      conceptMasteries.length > 0
        ? conceptMasteries.reduce((sum, c) => sum + c.masteryScore, 0) /
          conceptMasteries.length
        : 0;

    // Study streak
    const streak = await prisma.studyStreak.findUnique({
      where: { userId: Number(user.userId) },
    });

    // Watch progress (learning time)
    const watchProgress = await prisma.watchProgress.findMany({
      where: {
        userId: Number(user.userId),
        updatedAt: { gte: startDate },
      },
      include: { content: { select: { title: true, duration: true } } },
    });

    const totalMinutesWatched = watchProgress.reduce((sum, wp) => {
      return sum + (wp.duration / 60 || 0);
    }, 0);

    // Performance trends by genre
    const genreTrends = await prisma.$queryRaw`
      SELECT
        c.genre,
        AVG(qa.score) as avg_score,
        COUNT(qa.id) as attempts
      FROM "QuizAttempt" qa
      JOIN "Content" c ON qa."contentId" = c.id
      WHERE qa."userId" = ${Number(user.userId)}
        AND qa."createdAt" >= ${startDate}
      GROUP BY c.genre
      ORDER BY avg_score DESC
    `;

    return NextResponse.json({
      summary: {
        avgQuizScore: Math.round(avgQuizScore),
        conceptMasteryScore: Math.round(avgMasteryScore),
        totalMinutesWatched: Math.round(totalMinutesWatched),
        currentStreak: streak?.currentStreak || 0,
        longestStreak: streak?.longestStreak || 0,
      },
      quizAttempts,
      conceptMasteries,
      genreTrends,
      period,
    });
  } catch (error) {
    console.error("[PERFORMANCE_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch performance data" },
      { status: 500 }
    );
  }
}
