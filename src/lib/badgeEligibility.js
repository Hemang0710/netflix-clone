import prisma from "@/lib/prisma";
import { issueHederaBadge } from "@/lib/hedera";
import { uploadToIPFS } from "@/lib/ipfs";
import crypto from "crypto";

/**
 * Check if user meets badge criteria and issue badge if eligible
 * Called after quiz submission or flashcard review
 */
export async function checkAndIssueBadges(userId, contentId) {
  try {
    // Get user's latest quiz score for this content
    const quizAttempt = await prisma.quizAttempt.findFirst({
      where: { userId, contentId },
      orderBy: { createdAt: "desc" },
    });

    // Get flashcard stats
    const flashcards = await prisma.flashcard.findMany({
      where: { userId, contentId },
    });
    const totalReps = flashcards.reduce((sum, fc) => sum + fc.repetitions, 0);

    // Get watch time
    const watchProgress = await prisma.watchProgress.findUnique({
      where: { userId_contentId: { userId, contentId } },
    });
    const timeSpent = watchProgress?.timestamp || 0;

    // Get user profile for credential
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    // Get all published badges for this content
    const badges = await prisma.badge.findMany({
      where: { contentId, isPublished: true },
    });

    const issuedBadges = [];

    // Check each badge criteria
    for (const badge of badges) {
      const criteria = JSON.parse(badge.criteria);

      // Check if user already has this badge
      const existing = await prisma.badgeIssuance.findUnique({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
      });

      if (existing) continue; // Already issued

      // Check if criteria met
      const meetsQuizScore = (quizAttempt?.score || 0) >= criteria.minQuizScore;
      const meetsFlashcards = totalReps >= criteria.minFlashcardReps;
      const meetsTime = timeSpent >= criteria.minTimeSpent;

      if (meetsQuizScore && meetsFlashcards && meetsTime) {
        // Issue the badge
        const result = await issueBadgeToUser(userId, badge.id, {
          quizScore: quizAttempt?.score || 0,
          flashcardReps: totalReps,
          timeSpent,
          badge,
          user,
        });

        if (result.success) {
          issuedBadges.push(result.data);
        }
      }
    }

    return { success: true, issuedBadges };
  } catch (error) {
    console.error("Error checking badge eligibility:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Issue a badge to a user with blockchain anchoring
 */
async function issueBadgeToUser(userId, badgeId, metrics) {
  try {
    const { badge, user } = metrics;

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
        criteria: JSON.parse(badge.criteria),
      },
      evidence: {
        quizScore: metrics.quizScore,
        flashcardReps: metrics.flashcardReps,
        timeSpent: metrics.timeSpent,
      },
    };

    // Upload credential to IPFS (mock for MVP)
    const credentialUrl = `ipfs://mock-${Date.now()}`;

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
        badgeId,
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

    return { success: true, data: issuance };
  } catch (error) {
    console.error("Error issuing badge:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate a unique verification code for QR sharing
 */
function generateVerificationCode() {
  const prefix = "BADGE";
  const code = crypto.randomBytes(6).toString("hex").toUpperCase();
  return `${prefix}-${code}`;
}

/**
 * Calculate learner embedding for study group matching
 * Based on quiz score and skill level
 */
export function calculateLearnerEmbedding(skillLevel, quizScore) {
  // Simple embedding: [skillLevelScore, quizNormalized]
  const skillLevelMap = { beginner: 0.33, intermediate: 0.66, advanced: 1 };
  const skillScore = skillLevelMap[skillLevel] || 0.5;
  const quizNormalized = Math.min(quizScore || 0, 100) / 100;

  return [skillScore, quizNormalized];
}

/**
 * Calculate cosine distance between two learners
 * Lower distance = better match
 */
export function cosineDistance(embedding1, embedding2) {
  if (!embedding1 || !embedding2 || embedding1.length === 0) return 1;

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    mag1 += embedding1[i] * embedding1[i];
    mag2 += embedding2[i] * embedding2[i];
  }

  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);

  if (mag1 === 0 || mag2 === 0) return 1;

  const similarity = dotProduct / (mag1 * mag2);
  return 1 - similarity; // Convert to distance
}

export { generateVerificationCode };
