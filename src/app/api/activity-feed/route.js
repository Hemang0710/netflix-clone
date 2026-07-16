import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const contentId = url.searchParams.get("contentId");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);

    // Get recent learning activity (past hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const activities = await prisma.activeLearner.findMany({
      where: {
        updatedAt: { gte: oneHourAgo },
        ...(contentId && { contentId: parseInt(contentId) }),
      },
      include: {
        user: {
          select: { id: true, profile: { select: { name: true, avatarUrl: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    // Get study group activity
    const groupActivity = await prisma.studyGroupMessage.findMany({
      where: { createdAt: { gte: oneHourAgo } },
      include: {
        author: {
          select: { id: true, profile: { select: { name: true, avatarUrl: true } } },
        },
        group: { select: { id: true, name: true, contentId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Get quiz attempts activity
    const quizActivity = await prisma.quizAttempt.findMany({
      where: { createdAt: { gte: oneHourAgo } },
      include: {
        user: {
          select: { id: true, profile: { select: { name: true, avatarUrl: true } } },
        },
        content: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Combine and sort by timestamp
    const combined = [
      ...activities.map((a) => ({
        type: "learning",
        timestamp: a.updatedAt,
        user: a.user,
        contentId: a.contentId,
        action: `Studying content`,
      })),
      ...groupActivity.map((m) => ({
        type: "group_message",
        timestamp: m.createdAt,
        user: m.author,
        groupId: m.groupId,
        groupName: m.group.name,
        action: `Posted in ${m.group.name}`,
      })),
      ...quizActivity.map((q) => ({
        type: "quiz",
        timestamp: q.createdAt,
        user: q.user,
        contentId: q.contentId,
        contentTitle: q.content.title,
        score: q.score,
        action: `Completed quiz: ${q.score}/100`,
      })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return Response.json({ activities: combined.slice(0, limit) });
  } catch (error) {
    console.error("Activity feed error:", error);
    return Response.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
