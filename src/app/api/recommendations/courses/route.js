import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseAIJson } from "@/lib/aiJson";
import { Anthropic } from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const userId = Number(user.userId);

    // Get user's learning progress
    const userLearning = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        watchProgress: {
          include: { content: { select: { id: true, title: true, genre: true } } },
          orderBy: { updatedAt: "desc" },
          take: 10,
        },
        conceptMasteries: {
          orderBy: { masteryScore: "asc" },
          take: 10,
        },
      },
    });

    // Get weak concepts
    const weakConcepts = userLearning.conceptMasteries.slice(0, 5).map((c) => c.concept);
    const completedGenres = [
      ...new Set(userLearning.watchProgress.map((w) => w.content.genre)),
    ];

    // Find content related to weak areas
    // (uses `contains` per concept — full-text `search` needs a Prisma preview
    // feature that is not enabled)
    const recommendedContent = await prisma.content.findMany({
      where: {
        status: "ready",
        OR: [
          ...weakConcepts.map((concept) => ({
            title: { contains: concept, mode: "insensitive" },
          })),
          { genre: { notIn: completedGenres } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        genre: true,
        difficulty: true,
        creator: { select: { profile: { select: { name: true } } } },
      },
      take: 10,
    });

    // Use Claude to create personalized recommendations
    const recommendationPrompt = `
Recommend 5 courses for this learner to fill their knowledge gaps:

Weak Areas: ${weakConcepts.join(", ")}
Completed Genres: ${completedGenres.join(", ")}

Available Courses:
${recommendedContent.map((c) => `- "${c.title}" (${c.genre}, ${c.difficulty})`).join("\n")}

For each recommendation, provide:
1. Why it fills a gap
2. Expected learning outcome
3. Time to complete estimate
4. Difficulty level

Format as JSON array with fields: courseId, title, reason, outcome, estimatedHours, difficulty
`;

    // AI ranking is best-effort: fall back to the DB matches if the model
    // is unavailable or returns something unparseable.
    let recommendations = recommendedContent.slice(0, 5).map((c) => ({
      courseId: c.id,
      title: c.title,
      reason: weakConcepts.length
        ? `Related to areas you're still working on`
        : `Explores a genre you haven't tried yet`,
      difficulty: c.difficulty,
    }));

    try {
      const response = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 1024,
        messages: [{ role: "user", content: recommendationPrompt }],
      });

      const aiRecommendations = parseAIJson(
        response.content[0].type === "text" ? response.content[0].text : "",
        null
      );
      if (Array.isArray(aiRecommendations) && aiRecommendations.length > 0) {
        recommendations = aiRecommendations;
      }
    } catch (aiError) {
      console.error("AI recommendation fallback:", aiError.message);
    }

    return Response.json({
      recommendations,
      gaps: weakConcepts,
      suggestedLearningPath: weakConcepts.length > 0,
    });
  } catch (error) {
    console.error("Course recommendation error:", error);
    return Response.json({ error: "Failed to recommend courses" }, { status: 500 });
  }
}
