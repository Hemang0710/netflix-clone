import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { issueHederaBadge } from "@/lib/hedera";
import { uploadToIPFS } from "@/lib/ipfs";
import { generateVerificationCode } from "@/lib/badgeEligibility";

/**
 * POST /api/badges/[badgeId]/issue - Issue a badge to the authenticated user
 * Evidence (quiz score, flashcard reps, time spent) is computed server-side
 * from the user's actual activity so it cannot be forged.
 */
export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const userId = Number(user.userId);
    const { badgeId } = await params;

    // Get badge with criteria
    const badge = await prisma.badge.findUnique({
      where: { id: Number(badgeId) },
      include: { content: true },
    });

    if (!badge) {
      return Response.json(
        { success: false, error: "Badge not found" },
        { status: 404 }
      );
    }

    if (!badge.isPublished) {
      return Response.json(
        { success: false, error: "Badge is not available" },
        { status: 403 }
      );
    }

    const criteria = JSON.parse(badge.criteria);

    // Compute evidence server-side from the user's real activity
    const [bestAttempt, flashcardAgg, watchProgress] = await Promise.all([
      prisma.quizAttempt.findFirst({
        where: { userId, contentId: badge.contentId },
        orderBy: { score: "desc" },
      }),
      prisma.flashcard.aggregate({
        where: { userId, contentId: badge.contentId },
        _sum: { repetitions: true },
      }),
      prisma.watchProgress.findUnique({
        where: { userId_contentId: { userId, contentId: badge.contentId } },
      }),
    ]);

    const quizScore = bestAttempt?.score ?? 0;
    const flashcardReps = flashcardAgg._sum.repetitions ?? 0;
    const timeSpent = Math.round(watchProgress?.timestamp ?? 0);

    // Check if user meets criteria
    if (
      quizScore < (criteria.minQuizScore ?? 0) ||
      flashcardReps < (criteria.minFlashcardReps ?? 0) ||
      timeSpent < (criteria.minTimeSpent ?? 0)
    ) {
      return Response.json(
        {
          success: false,
          error: "Criteria not met",
          required: {
            quiz: criteria.minQuizScore,
            flashcards: criteria.minFlashcardReps,
            time: criteria.minTimeSpent,
          },
          current: {
            quiz: quizScore,
            flashcards: flashcardReps,
            time: timeSpent,
          },
        },
        { status: 400 }
      );
    }

    // Check if already issued
    const existing = await prisma.badgeIssuance.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId: Number(badgeId),
        },
      },
    });

    if (existing) {
      return Response.json(
        { success: false, error: "Badge already earned" },
        { status: 400 }
      );
    }

    // Get user for credential
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    // Create W3C Verifiable Credential
    const credential = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://openbadges.org/schemas/v3/",
      ],
      type: ["VerifiableCredential", "OpenBadgeCredential"],
      issuer: {
        id: "https://learnai.io",
        name: "LearnAI",
        image: "https://learnai.io/logo.png",
      },
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: `did:learnai:${userId}`,
        name: dbUser?.profile?.name || "Learner",
        email: dbUser?.email,
      },
      badge: {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        image: badge.icon,
        criteria,
      },
      evidence: {
        quizScore,
        flashcardReps,
        timeSpent,
      },
    };

    // Upload to IPFS
    const credentialUrl = await uploadToIPFS(JSON.stringify(credential));

    // Anchor on Hedera
    const { txHash, tokenId } = await issueHederaBadge({
      userId,
      badgeId,
      credentialUrl,
      metadata: credential,
    });

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Save issuance record
    const issuance = await prisma.badgeIssuance.create({
      data: {
        userId,
        badgeId: Number(badgeId),
        hederaTxHash: txHash,
        hederaTokenId: tokenId,
        credentialUrl,
        verificationCode,
        earnedAt: new Date(),
        isPublic: true,
      },
      include: { badge: true },
    });

    // Create verification record
    await prisma.badgeVerification.create({
      data: {
        verificationCode,
        badgeIssuanceId: issuance.id,
        verificationStatus: "pending",
      },
    });

    return Response.json({
      success: true,
      data: {
        ...issuance,
        badge: { ...issuance.badge, criteria },
      },
    });
  } catch (error) {
    console.error("Error issuing badge:", error);
    return Response.json(
      { success: false, error: "Failed to issue badge" },
      { status: 500 }
    );
  }
}
