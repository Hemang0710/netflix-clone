import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all user's interactions with content by subject/genre
    const subjectData = await prisma.$queryRaw`
      SELECT
        c."genre" as subject,
        COUNT(DISTINCT qa."contentId") as videos_watched,
        COUNT(qa.id) as quizzes_taken,
        AVG(qa.score) as avg_quiz_score,
        COUNT(DISTINCT wp."contentId") as lessons_started,
        SUM(EXTRACT(EPOCH FROM (wp."updatedAt" - wp."updatedAt")) / 60)::integer as minutes_spent,
        COUNT(DISTINCT CASE WHEN wp.completed THEN wp."contentId" END) as lessons_completed,
        MAX(qa."createdAt") as last_activity
      FROM "QuizAttempt" qa
      JOIN "Content" c ON qa."contentId" = c.id
      LEFT JOIN "WatchProgress" wp ON wp."userId" = qa."userId" AND wp."contentId" = qa."contentId"
      WHERE qa."userId" = ${Number(user.userId)}
      GROUP BY c."genre"
      ORDER BY last_activity DESC NULLS LAST
    `;

    // Get concept mastery by subject/genre
    const conceptsBySubject = await prisma.$queryRaw`
      SELECT
        COALESCE(c."genre", 'General') as subject,
        AVG(cm."masteryScore") as avg_mastery,
        COUNT(DISTINCT cm.concept) as concepts_learned,
        COUNT(DISTINCT CASE WHEN cm."masteryScore" >= 80 THEN cm.concept END) as concepts_mastered
      FROM "ConceptMastery" cm
      LEFT JOIN "Content" c ON cm."contentId" = c.id
      WHERE cm."userId" = ${Number(user.userId)}
      GROUP BY c."genre"
    `;

    // Topic completion rates
    const topicCompletions = await prisma.$queryRaw`
      SELECT
        c."genre" as subject,
        ROUND(
          COUNT(DISTINCT CASE WHEN wp.completed THEN wp."contentId" END)::float
          / COUNT(DISTINCT wp."contentId")::float * 100
        ) as completion_rate
      FROM "WatchProgress" wp
      JOIN "Content" c ON wp."contentId" = c.id
      WHERE wp."userId" = ${Number(user.userId)}
      GROUP BY c."genre"
    `;

    // Combine data
    const subjects = subjectData.map((sd) => {
      const concept = conceptsBySubject.find((cs) => cs.subject === sd.subject);
      const completion = topicCompletions.find((tc) => tc.subject === sd.subject);

      return {
        subject: sd.subject,
        videosWatched: sd.videos_watched || 0,
        quizzesTaken: sd.quizzes_taken || 0,
        avgQuizScore: sd.avg_quiz_score ? Math.round(sd.avg_quiz_score) : 0,
        lessonsStarted: sd.lessons_started || 0,
        lessonsCompleted: sd.lessons_completed || 0,
        completionRate: completion?.completion_rate || 0,
        minutesSpent: sd.minutes_spent || 0,
        avgMastery: concept?.avg_mastery ? Math.round(concept.avg_mastery) : 0,
        conceptsLearned: concept?.concepts_learned || 0,
        conceptsMastered: concept?.concepts_mastered || 0,
        lastActivity: sd.last_activity,
        strengthLevel:
          concept?.avg_mastery >= 80
            ? "Expert"
            : concept?.avg_mastery >= 60
              ? "Intermediate"
              : "Beginner",
      };
    });

    // Rankings
    const byCompletion = [...subjects].sort(
      (a, b) => b.completionRate - a.completionRate
    );
    const byMastery = [...subjects].sort((a, b) => b.avgMastery - a.avgMastery);
    const byTime = [...subjects].sort((a, b) => b.minutesSpent - a.minutesSpent);

    return NextResponse.json({
      subjects,
      rankings: {
        byCompletion: byCompletion.map((s) => s.subject),
        byMastery: byMastery.map((s) => s.subject),
        byTimeInvested: byTime.map((s) => s.subject),
      },
      summary: {
        totalSubjects: subjects.length,
        averageCompletionRate:
          subjects.length > 0
            ? Math.round(
                subjects.reduce((sum, s) => sum + s.completionRate, 0) /
                  subjects.length
              )
            : 0,
        strongestSubject: byMastery[0]?.subject,
        needsMostWork: subjects.filter((s) => s.avgQuizScore < 60)[0]?.subject,
      },
    });
  } catch (error) {
    console.error("[SUBJECTS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch subject analytics" },
      { status: 500 }
    );
  }
}
