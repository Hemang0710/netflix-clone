import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { contentId, challengeId, score, timeSeconds } = await req.json();
    const userId = Number(user.userId);

    if (!contentId || score == null || Number.isNaN(Number(score))) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Clamp score to the valid 0-100 range
    const finalScore = Math.max(0, Math.min(100, Math.round(Number(score))));

    // Create quiz attempt (if not already done)
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        contentId: Number(contentId),
        score: finalScore,
        answers: JSON.stringify({}),
      },
    });

    // If part of challenge, record in challenge
    if (challengeId) {
      const challenge = await prisma.quizChallenge.findUnique({
        where: { id: challengeId },
        include: { participants: true },
      });

      if (!challenge) {
        return Response.json({ error: "Challenge not found" }, { status: 404 });
      }

      if (challenge.status !== "active" || challenge.expiresAt < new Date()) {
        return Response.json({ error: "Challenge has ended" }, { status: 400 });
      }

      // Only the challenger, invited users, or anyone on public challenges may submit
      let invitedIds = [];
      try {
        invitedIds = JSON.parse(challenge.challengedUserIds || "[]").map(Number);
      } catch {
        invitedIds = [];
      }
      const canParticipate =
        challenge.challengerId === userId ||
        invitedIds.includes(userId) ||
        challenge.leaderboardMode;
      if (!canParticipate) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }

      // Check if user is already in participants
      const existingParticipant = challenge.participants.find((p) => p.userId === userId);

      if (existingParticipant) {
        // Update their result if they did better
        if (finalScore > (existingParticipant.score ?? -1)) {
          await prisma.quizChallengeParticipant.update({
            where: { id: existingParticipant.id },
            data: {
              score: finalScore,
              timeSeconds: Number(timeSeconds) || 0,
              attemptedAt: new Date(),
            },
          });
        }
      } else {
        // Add as new participant
        await prisma.quizChallengeParticipant.create({
          data: {
            challengeId,
            userId,
            score: finalScore,
            timeSeconds: Number(timeSeconds) || 0,
            attemptedAt: new Date(),
          },
        });
      }

      // Get updated leaderboard
      const updatedChallenge = await prisma.quizChallenge.findUnique({
        where: { id: challengeId },
        include: {
          participants: {
            include: {
              user: { select: { profile: { select: { name: true } } } },
            },
            orderBy: [{ score: "desc" }, { timeSeconds: "asc" }],
          },
        },
      });

      // Calculate if user won/placement
      const userRank = updatedChallenge.participants.findIndex((p) => p.userId === userId) + 1;
      const totalParticipants = updatedChallenge.participants.length;

      return Response.json({
        success: true,
        score: finalScore,
        userRank,
        totalParticipants,
        leaderboard: updatedChallenge.participants.map((p, idx) => ({
          rank: idx + 1,
          userId: p.userId,
          name: p.user.profile?.name || "Anonymous",
          score: p.score,
          timeSeconds: p.timeSeconds,
        })),
        message:
          userRank === 1
            ? "🏆 You're leading the challenge!"
            : `You're in position ${userRank}/${totalParticipants}`,
      });
    }

    return Response.json({
      success: true,
      score: finalScore,
      message: "Quiz completed!",
    });
  } catch (error) {
    console.error("Challenge submit error:", error);
    return Response.json({ error: "Failed to submit challenge attempt" }, { status: 500 });
  }
}
