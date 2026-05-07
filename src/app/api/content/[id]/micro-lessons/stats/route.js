import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: contentId } = await params;

    // Get all micro-lessons for this content
    const microLessons = await prisma.microLesson.findMany({
      where: { contentId: Number(contentId) },
      orderBy: { order: "asc" },
    });

    // Get user's progress for all lessons
    const progressRecords = await prisma.microLessonProgress.findMany({
      where: {
        userId: user.userId,
        microLesson: { contentId: Number(contentId) },
      },
    });

    // Calculate stats
    const totalLessons = microLessons.length;
    const watchedLessons = progressRecords.filter((p) => p.watched).length;
    const totalDuration = microLessons.reduce((sum, ml) => sum + ml.duration, 0);
    const averageQuizScore = progressRecords
      .filter((p) => p.quizScore !== null)
      .reduce((sum, p) => sum + p.quizScore, 0) / progressRecords.length || 0;

    return Response.json({
      success: true,
      data: {
        totalLessons,
        watchedLessons,
        completionPercentage:
          totalLessons > 0
            ? Math.round((watchedLessons / totalLessons) * 100)
            : 0,
        totalDuration,
        totalDurationMinutes: Math.round(totalDuration / 60),
        averageQuizScore: Math.round(averageQuizScore),
        progressByLesson: microLessons.map((ml) => {
          const progress = progressRecords.find(
            (p) => p.microLessonId === ml.id
          );
          return {
            id: ml.id,
            title: ml.title,
            watched: progress?.watched || false,
            quizScore: progress?.quizScore || null,
            watchedAt: progress?.watchedAt || null,
          };
        }),
      },
    });
  } catch (error) {
    console.error("Error fetching micro-lessons stats:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
