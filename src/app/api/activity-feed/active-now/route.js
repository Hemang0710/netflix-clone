import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const contentId = url.searchParams.get("contentId");

    // Active learners in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const activeCount = await prisma.activeLearner.count({
      where: {
        lastSeen: { gte: fiveMinutesAgo },
        ...(contentId && { contentId: parseInt(contentId) }),
      },
    });

    // Active study groups
    const activeGroups = await prisma.studyGroupMessage.groupBy({
      by: ["groupId"],
      where: { createdAt: { gte: fiveMinutesAgo } },
    });

    // Get details of active groups
    const groupDetails = await prisma.studyGroup.findMany({
      where: { id: { in: activeGroups.map((g) => g.groupId) } },
      select: {
        id: true,
        name: true,
        contentId: true,
        _count: { select: { members: true } },
      },
    });

    return Response.json({
      activeNow: activeCount,
      activeGroups: groupDetails.map((g) => ({
        id: g.id,
        name: g.name,
        contentId: g.contentId,
        memberCount: g._count.members,
      })),
    });
  } catch (error) {
    console.error("Active now error:", error);
    return Response.json({ error: "Failed to fetch active users" }, { status: 500 });
  }
}
