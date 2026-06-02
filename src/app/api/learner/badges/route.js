import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function GET(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all"; // all | earned | available

    // Get earned badges
    const earnedBadges = await prisma.badgeIssuance.findMany({
      where: { userId: Number(user.userId) },
      include: {
        badge: true,
        verification: true,
      },
      orderBy: { earnedAt: "desc" },
    });

    // Check eligibility for new badges
    const userMetrics = await prisma.$queryRaw`
      SELECT
        COUNT(DISTINCT qa.id) as total_quizzes,
        AVG(qa.score) as avg_quiz_score,
        COUNT(DISTINCT qa."contentId") as videos_completed,
        COUNT(DISTINCT cm.concept) as concepts_mastered,
        COUNT(DISTINCT f.id) as flashcard_reps,
        EXTRACT(EPOCH FROM (MAX(wp."updatedAt") - MIN(wp."updatedAt"))) / 3600 as total_hours_learning
      FROM "QuizAttempt" qa
      LEFT JOIN "ConceptMastery" cm ON qa."userId" = cm."userId" AND cm."masteryScore" >= 80
      LEFT JOIN "Flashcard" f ON qa."userId" = f."userId"
      LEFT JOIN "WatchProgress" wp ON qa."userId" = wp."userId"
      WHERE qa."userId" = ${Number(user.userId)}
    `;

    const metrics = userMetrics[0] || {};

    // Define achievable badges
    const availableBadges = [
      {
        id: "quiz_master",
        name: "Quiz Master",
        description: "Score 90+ on 10 quizzes",
        icon: "🎯",
        earned:
          metrics.total_quizzes >= 10 && metrics.avg_quiz_score >= 90,
        criteria: {
          minQuizzes: 10,
          minAvgScore: 90,
        },
      },
      {
        id: "concept_expert",
        name: "Concept Expert",
        description: "Master 20 different concepts",
        icon: "🧠",
        earned: metrics.concepts_mastered >= 20,
        criteria: {
          minConcepts: 20,
        },
      },
      {
        id: "learning_streak",
        name: "Learning Streak",
        description: "Study for 7 consecutive days",
        icon: "🔥",
        earned: false, // Tracked separately via StudyStreak model
        criteria: {
          minDays: 7,
        },
      },
      {
        id: "video_marathoner",
        name: "Video Marathoner",
        description: "Complete 50+ hours of learning",
        icon: "🎬",
        earned: metrics.total_hours_learning >= 50,
        criteria: {
          minHours: 50,
        },
      },
      {
        id: "quick_learner",
        name: "Quick Learner",
        description: "Complete 5 videos in one day",
        icon: "⚡",
        earned: false, // Requires daily tracking
        criteria: {
          videosPerDay: 5,
        },
      },
      {
        id: "perfect_score",
        name: "Perfect Score",
        description: "Score 100% on 5 quizzes",
        icon: "💯",
        earned: false, // Needs specific query
        criteria: {
          perfectScores: 5,
        },
      },
      {
        id: "flashcard_champion",
        name: "Flashcard Champion",
        description: "Complete 100+ flashcard reviews",
        icon: "📚",
        earned: metrics.flashcard_reps >= 100,
        criteria: {
          minReviews: 100,
        },
      },
      {
        id: "course_completer",
        name: "Course Completer",
        description: "Complete 3 full courses",
        icon: "🏆",
        earned: metrics.videos_completed >= 3,
        criteria: {
          minCourses: 3,
        },
      },
    ];

    // Filter by status
    let results = availableBadges;
    if (status === "earned") {
      results = availableBadges.filter((b) => b.earned);
    } else if (status === "available") {
      results = availableBadges.filter((b) => !b.earned);
    }

    // Count summary
    const summary = {
      totalEarned: earnedBadges.length,
      totalAvailable: availableBadges.length,
      progress: Math.round(
        (earnedBadges.length / availableBadges.length) * 100
      ),
    };

    return NextResponse.json({
      earned: earnedBadges,
      available: results,
      summary,
      userMetrics: {
        totalQuizzes: metrics.total_quizzes || 0,
        avgQuizScore: metrics.avg_quiz_score
          ? Math.round(metrics.avg_quiz_score)
          : 0,
        videosCompleted: metrics.videos_completed || 0,
        conceptsMastered: metrics.concepts_mastered || 0,
        flashcardReps: metrics.flashcard_reps || 0,
        totalHoursLearning: metrics.total_hours_learning
          ? Math.round(metrics.total_hours_learning)
          : 0,
      },
    });
  } catch (error) {
    console.error("[BADGES_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch badges" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { badgeId } = body;

    if (!badgeId) {
      return NextResponse.json(
        { error: "Badge ID required" },
        { status: 400 }
      );
    }

    // Verify badge exists
    const badge = await prisma.badge.findUnique({
      where: { id: parseInt(badgeId) },
    });

    if (!badge) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 });
    }

    // Check if already earned
    const existing = await prisma.badgeIssuance.findUnique({
      where: {
        userId_badgeId: {
          userId: Number(user.userId),
          badgeId: parseInt(badgeId),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Badge already earned" },
        { status: 400 }
      );
    }

    // Issue badge
    const verificationCode = crypto.randomBytes(16).toString("hex");

    const issuance = await prisma.badgeIssuance.create({
      data: {
        userId: Number(user.userId),
        badgeId: parseInt(badgeId),
        verificationCode,
        earnedAt: new Date(),
      },
      include: { badge: true },
    });

    return NextResponse.json(issuance, { status: 201 });
  } catch (error) {
    console.error("[BADGES_POST]", error);
    return NextResponse.json(
      { error: "Failed to issue badge" },
      { status: 500 }
    );
  }
}
