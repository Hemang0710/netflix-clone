import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
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
    const recommendedContent = await prisma.content.findMany({
      where: {
        OR: [
          { title: { search: weakConcepts.join(" | ") } },
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
      gaps: weakConcepts,
      suggestedLearningPath: weakConcepts.length > 0,
    });
  } catch (error) {
    console.error("Course recommendation error:", error);
    return Response.json({ error: "Failed to recommend courses" }, { status: 500 });
  }
}
