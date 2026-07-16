import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Anthropic } from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const userId = Number(user.userId);

    // Get user's learning profile
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        conceptMasteries: {
          orderBy: { masteryScore: "desc" },
          take: 10,
        },
        watchProgress: {
          include: { content: true },
          orderBy: { updatedAt: "desc" },
          take: 5,
        },
        studyGroupMembers: { include: { group: true } },
      },
    });

    if (!userProfile) return Response.json({ error: "User not found" }, { status: 404 });

    // Get weak spots
    const weakSpots = await prisma.conceptMastery.findMany({
      where: { userId },
      orderBy: { masteryScore: "asc" },
      take: 5,
    });

    const weakTopics = weakSpots.map((w) => w.concept).join(", ");

    // Find potential study partners with complementary skills
    const potentialPartners = await prisma.user.findMany({
      where: {
        NOT: { id: userId },
        studyGroupMembers: {
          some: {
            group: {
              contentId: {
                in: userProfile.watchProgress.map((w) => w.contentId),
              },
            },
          },
        },
      },
      include: {
        profile: { select: { name: true, avatarUrl: true } },
        conceptMasteries: {
          orderBy: { masteryScore: "desc" },
          take: 5,
        },
      },
      take: 5,
    });

    // Use Claude to generate personalized recommendations
    const recommendationPrompt = `
Based on this learner's profile, suggest 3 study partners and explain why they'd be a good match:

User: ${userProfile.profile?.name || "Learner"}
Weak Topics: ${weakTopics || "General concepts"}
Strong Areas: ${userProfile.conceptMasteries.slice(0, 5).map((c) => c.concept).join(", ")}

Potential Partners:
${potentialPartners
  .map(
    (p) =>
      `- ${p.profile?.name} (Strong in: ${p.conceptMasteries.map((c) => c.concept).join(", ")})`
  )
  .join("\n")}

For each match, explain:
1. Why they're a good pair
2. What they can teach each other
3. Suggested first activity (debate, flashcard quiz, concept mapping)

Format as JSON array with fields: name, reason, suggestedActivity, complementaryStrength
`;

    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      messages: [{ role: "user", content: recommendationPrompt }],
    });

    const recommendations = JSON.parse(
      response.content[0].type === "text" ? response.content[0].text : "[]"
    );

    return Response.json({
      recommendations,
      userWeakSpots: weakTopics,
      message: weakTopics
        ? `You're struggling with ${weakTopics} — want a debate partner?`
        : "Ready to connect with study partners!",
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    return Response.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
