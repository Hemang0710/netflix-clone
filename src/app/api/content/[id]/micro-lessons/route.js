import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id: contentId } = await params;

    const microLessons = await prisma.microLesson.findMany({
      where: { contentId: Number(contentId) },
      orderBy: { order: "asc" },
    });

    return Response.json({
      success: true,
      data: microLessons,
    });
  } catch (error) {
    console.error("Error fetching micro-lessons:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
