import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { v4 as uuid } from "uuid";

// challengedUserIds is stored as a JSON string (e.g. "[1,2,3]") in the DB
function parseChallengedIds(raw) {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.map(Number) : [];
  } catch {
    return [];
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { contentId, challengedUserIds, leaderboardMode } = await req.json();
    const challengerId = Number(user.userId);

    if (!contentId) {
      return Response.json({ error: "Content ID required" }, { status: 400 });
    }

    const invitedIds = Array.isArray(challengedUserIds)
      ? challengedUserIds.map(Number).filter((id) => Number.isInteger(id) && id !== challengerId)
      : [];

    // Create challenge
    const challenge = await prisma.$transaction(async (tx) => {
      const newChallenge = await tx.quizChallenge.create({
        data: {
          id: uuid(),
          contentId: Number(contentId),
          challengerId,
          challengedUserIds: JSON.stringify(invitedIds),
          leaderboardMode: !!leaderboardMode,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          status: "active",
        },
      });

      // Send notifications to challenged users
      if (invitedIds.length > 0) {
        await tx.notification.createMany({
          data: invitedIds.map((userId) => ({
            userId,
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
      challenge: { ...challenge, challengedUserIds: invitedIds },
      shareLink: `/quiz/${contentId}?challenge=${challenge.id}`,
      inviteLink: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/join-challenge/${challenge.id}`,
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
            },
            orderBy: [{ score: "desc" }, { timeSeconds: "asc" }],
          },
        },
      });

      if (!challenge) {
        return Response.json({ error: "Challenge not found" }, { status: 404 });
      }

      const invitedIds = parseChallengedIds(challenge.challengedUserIds);

      // Check if user is allowed to see it
      const canView =
        challenge.challengerId === userId ||
        invitedIds.includes(userId) ||
        challenge.leaderboardMode;

      if (!canView) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }

      // Get current user's result if exists
      const userResult = challenge.participants.find((p) => p.userId === userId);

      return Response.json({
        challenge: { ...challenge, challengedUserIds: invitedIds },
        userResult,
        leaderboard: challenge.participants.map((p, idx) => ({
          rank: idx + 1,
          name: p.user.profile?.name || "Anonymous",
          score: p.score,
          timeSeconds: p.timeSeconds,
        })),
      });
    }

    // Get all active challenges for user:
    // ones they created, public leaderboard ones, or ones they were invited to.
    // challengedUserIds is a JSON string, so `contains` is a coarse pre-filter
    // and the exact membership check happens after parsing.
    const candidates = await prisma.quizChallenge.findMany({
      where: {
        OR: [
          { challengerId: userId },
          { leaderboardMode: true },
          { challengedUserIds: { contains: String(userId) } },
        ],
        status: "active",
        expiresAt: { gt: new Date() },
      },
      include: {
        content: { select: { title: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const challenges = candidates
      .filter(
        (c) =>
          c.challengerId === userId ||
          c.leaderboardMode ||
          parseChallengedIds(c.challengedUserIds).includes(userId)
      )
      .slice(0, 10)
      .map((c) => ({ ...c, challengedUserIds: parseChallengedIds(c.challengedUserIds) }));

    return Response.json({ challenges });
  } catch (error) {
    console.error("Get challenges error:", error);
    return Response.json({ error: "Failed to fetch challenges" }, { status: 500 });
  }
}
