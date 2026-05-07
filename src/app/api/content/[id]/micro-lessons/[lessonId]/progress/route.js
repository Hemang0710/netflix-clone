import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: contentId, lessonId } = await params;
    const { watched, quizScore, notesAdded } = await request.json();

    // Verify content exists
    const content = await prisma.content.findUnique({
      where: { id: Number(contentId) },
    });

    if (!content) {
      return Response.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // Find or create progress record
    const progress = await prisma.microLessonProgress.upsert({
      where: {
        userId_microLessonId: {
          userId: user.userId,
          microLessonId: Number(lessonId),
        },
      },
      update: {
        watched: watched || undefined,
        quizScore: quizScore || undefined,
        notesAdded: notesAdded || undefined,
        watchedAt: watched ? new Date() : undefined,
      },
      create: {
        userId: user.userId,
        microLessonId: Number(lessonId),
        watched: watched || false,
        quizScore: quizScore || null,
        notesAdded: notesAdded || null,
        watchedAt: watched ? new Date() : null,
      },
    });

    return Response.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error("Error updating micro-lesson progress:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: contentId, lessonId } = await params;

    const progress = await prisma.microLessonProgress.findUnique({
      where: {
        userId_microLessonId: {
          userId: user.userId,
          microLessonId: Number(lessonId),
        },
      },
    });

    if (!progress) {
      return Response.json({
        success: true,
        data: null,
      });
    }

    return Response.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error("Error fetching micro-lesson progress:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
