import prisma from "@/lib/prisma";
import { verifyHederaTx } from "@/lib/hedera";

/**
 * GET /api/badges/verify/[verificationCode] - Public badge verification
 * Anyone can verify a badge using the verification code
 */
export async function GET(request, { params }) {
  try {
    const { verificationCode } = await params;

    const issuance = await prisma.badgeIssuance.findUnique({
      where: { verificationCode },
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
        user: {
          select: {
            email: true,
            profile: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!issuance) {
      return Response.json(
        { success: false, error: "Badge not found" },
        { status: 404 }
      );
    }

    // Verify on Hedera
    const hederaVerified = await verifyHederaTx(issuance.hederaTxHash);

    // Update verification record
    if (hederaVerified) {
      await prisma.badgeVerification.update({
        where: { verificationCode },
        data: {
          verificationStatus: "verified",
          verificationDate: new Date(),
        },
      });
    }

    return Response.json({
      success: true,
      data: {
        badge: {
          id: issuance.badge.id,
          name: issuance.badge.name,
          description: issuance.badge.description,
          icon: issuance.badge.icon,
          criteria: JSON.parse(issuance.badge.criteria),
        },
        learner: {
          name: issuance.user.profile?.name || "Anonymous",
          email: issuance.user.email,
        },
        earnedAt: issuance.earnedAt,
        verificationCode: issuance.verificationCode,
        hederaTxHash: issuance.hederaTxHash,
        verified: hederaVerified,
        credentialUrl: issuance.credentialUrl,
      },
    });
  } catch (error) {
    console.error("Error verifying badge:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
