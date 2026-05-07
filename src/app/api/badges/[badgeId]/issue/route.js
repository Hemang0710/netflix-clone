import prisma from "@/lib/prisma";
import { issueHederaBadge } from "@/lib/hedera";
import { uploadToIPFS } from "@/lib/ipfs";
import { generateVerificationCode } from "@/lib/badgeEligibility";

/**
 * POST /api/badges/[badgeId]/issue - Issue a badge to a user
 * Called when user meets criteria (quiz score, flashcards, time spent)
 */
export async function POST(request, { params }) {
  try {
    const { badgeId } = await params;
    const { userId, quizScore, flashcardReps, timeSpent } =
      await request.json();

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

    const criteria = JSON.parse(badge.criteria);

    // Check if user meets criteria
    if (
      quizScore < criteria.minQuizScore ||
      flashcardReps < criteria.minFlashcardReps ||
      timeSpent < criteria.minTimeSpent
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
          userId: Number(userId),
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
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      include: { profile: true },
    });

    if (!user) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

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
        name: user?.profile?.name || "Learner",
        email: user?.email,
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
        userId: Number(userId),
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
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
