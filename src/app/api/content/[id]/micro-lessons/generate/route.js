import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateMicroLessons } from "@/lib/microLearning";

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: contentId } = await params;

    // Get content
    const content = await prisma.content.findUnique({
      where: { id: Number(contentId) },
    });

    if (!content) {
      return Response.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // Verify creator
    if (content.creatorId !== user.userId && user.role !== "admin") {
      return Response.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Check if transcript exists
    if (!content.transcript) {
      return Response.json(
        { success: false, error: "Transcript not available" },
        { status: 400 }
      );
    }

    // Generate micro-lessons
    const { microLessons } = await generateMicroLessons({
      transcript: content.transcript,
      duration: content.duration || 3600,
      title: content.title,
      contentId: Number(contentId),
    });

    // Delete existing micro-lessons for this content
    await prisma.microLesson.deleteMany({
      where: { contentId: Number(contentId) },
    });

    // Save to DB
    await prisma.microLesson.createMany({
      data: microLessons,
    });

    return Response.json({
      success: true,
      data: {
        count: microLessons.length,
        lessons: microLessons,
      },
    });
  } catch (error) {
    console.error("Error generating micro-lessons:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
