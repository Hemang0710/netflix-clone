import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * POST /api/badges - Create a new badge template (admin only)
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { contentId, name, description, icon, criteria } =
      await request.json();

    // Validate required fields
    if (!contentId || !name || !description || !icon || !criteria) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate content exists
    const content = await prisma.content.findUnique({
      where: { id: Number(contentId) },
    });

    if (!content) {
      return Response.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // Create badge
    const badge = await prisma.badge.create({
      data: {
        contentId: Number(contentId),
        name,
        description,
        icon,
        criteria: JSON.stringify(criteria),
        isPublished: false,
      },
    });

    return Response.json({
      success: true,
      data: {
        ...badge,
        criteria: JSON.parse(badge.criteria),
      },
    });
  } catch (error) {
    console.error("Error creating badge:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/badges - Get all published badges
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("contentId");

    const where = contentId ? { contentId: Number(contentId), isPublished: true } : { isPublished: true };

    const badges = await prisma.badge.findMany({
      where,
      include: {
        _count: {
          select: { issuances: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({
      success: true,
      data: badges.map((badge) => ({
        ...badge,
        criteria: JSON.parse(badge.criteria),
      })),
    });
  } catch (error) {
    console.error("Error fetching badges:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
