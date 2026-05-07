import prisma from "@/lib/prisma";

/**
 * GET /api/badges/user/[userId] - Get all badges earned by a user
 */
export async function GET(request, { params }) {
  try {
    const { userId } = await params;

    const issuances = await prisma.badgeIssuance.findMany({
      where: { userId: Number(userId), isPublic: true },
      include: {
        badge: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            criteria: true,
          },
        },
      },
      orderBy: { earnedAt: "desc" },
    });

    return Response.json({
      success: true,
      data: issuances.map((issuance) => ({
        ...issuance,
        badge: {
          ...issuance.badge,
          criteria: JSON.parse(issuance.badge.criteria),
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching user badges:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
