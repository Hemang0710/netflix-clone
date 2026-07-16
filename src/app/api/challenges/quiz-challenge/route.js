import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { v4 as uuid } from "uuid";

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { contentId, challengedUserIds, leaderboardMode } = await req.json();
    const challengerId = Number(user.userId);

    if (!contentId) {
      return Response.json({ error: "Content ID required" }, { status: 400 });
    }

    // Create challenge
    const challenge = await prisma.$transaction(async (tx) => {
      const newChallenge = await tx.quizChallenge.create({
        data: {
          id: uuid(),
          contentId: Number(contentId),
          challengerId,
          challengedUserIds: challengedUserIds || [],
          leaderboardMode: !!leaderboardMode,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          status: "active",
        },
      });

      // Send notifications to challenged users
      if (challengedUserIds && challengedUserIds.length > 0) {
        await tx.notification.createMany({
          data: challengedUserIds.map((userId) => ({
            userId: Number(userId),
            type: "quiz_challenge",
            title: "You've been challenged to a quiz!",
            message: `Complete the quiz faster and score higher than your friend!`,
            link: `/quiz/${contentId}?challenge=${newChallenge.id}`,
            read: false,
          })),
        });
      }

      return newChallenge;
    });

    return Response.json({
      challenge,
      shareLink: `/quiz/${contentId}?challenge=${challenge.id}`,
      inviteLink: `${process.env.NEXT_PUBLIC_BASE_URL}/join-challenge/${challenge.id}`,
    });
  } catch (error) {
    console.error("Challenge creation error:", error);
    return Response.json({ error: "Failed to create challenge" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const challengeId = url.searchParams.get("challengeId");
    const userId = Number(user.userId);

    if (challengeId) {
      // Get specific challenge details
      const challenge = await prisma.quizChallenge.findUnique({
        where: { id: challengeId },
        include: {
          content: { select: { id: true, title: true } },
          challenger: { select: { profile: { select: { name: true, avatarUrl: true } } } },
          participants: {
            include: {
              user: { select: { profile: { select: { name: true } } } },
              score: true,
              timeSeconds: true,
            },
            orderBy: { score: "desc" },
          },
        },
      });

      if (!challenge) {
        return Response.json({ error: "Challenge not found" }, { status: 404 });
      }

      // Check if user is allowed to see it
      const canView =
        challenge.challengerId === userId ||
        challenge.challengedUserIds.includes(userId) ||
        challenge.leaderboardMode;

      if (!canView) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }

      // Get current user's result if exists
      const userResult = challenge.participants.find((p) => p.userId === userId);

      return Response.json({
        challenge,
        userResult,
        leaderboard: challenge.participants.map((p, idx) => ({
          rank: idx + 1,
          name: p.user.profile?.name || "Anonymous",
          score: p.score,
          timeSeconds: p.timeSeconds,
        })),
      });
    }

    // Get all active challenges for user
    const challenges = await prisma.quizChallenge.findMany({
      where: {
        OR: [
          { challengerId: userId },
          { challengedUserIds: { has: userId } },
          { leaderboardMode: true },
        ],
        status: "active",
        expiresAt: { gt: new Date() },
      },
      include: {
        content: { select: { title: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return Response.json({ challenges });
  } catch (error) {
    console.error("Get challenges error:", error);
    return Response.json({ error: "Failed to fetch challenges" }, { status: 500 });
  }
}
