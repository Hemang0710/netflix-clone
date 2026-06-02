import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Anthropic } from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function GET(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's learning history
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { userId: Number(user.userId) },
      include: { content: true },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    const weakAreas = await prisma.$queryRaw`
      SELECT
        c."genre" as subject,
        AVG(qa.score) as avg_score,
        COUNT(qa.id) as attempts,
        COUNT(DISTINCT qa."contentId") as unique_contents
      FROM "QuizAttempt" qa
      JOIN "Content" c ON qa."contentId" = c.id
      WHERE qa."userId" = ${Number(user.userId)}
      GROUP BY c."genre"
      HAVING AVG(qa.score) < 75
      ORDER BY avg_score ASC
    `;

    const conceptMasteries = await prisma.conceptMastery.findMany({
      where: { userId: Number(user.userId) },
      orderBy: { masteryScore: "asc" },
      take: 10,
    });

    // Generate AI recommendations
    const weakConceptList = conceptMasteries
      .slice(0, 5)
      .map((c) => `${c.concept} (${c.masteryScore}%)`)
      .join(", ");

    const weakSubjectList = weakAreas
      .slice(0, 3)
      .map((a) => `${a.subject} (${Math.round(a.avg_score)}%)`)
      .join(", ");

    const prompt = `You are a learning coach. Based on a learner's weak areas and mastery scores, provide 3-4 specific, actionable recommendations.

Weak Concepts: ${weakConceptList}
Weak Subjects: ${weakSubjectList}
Total Quizzes Taken: ${quizAttempts.length}

Provide recommendations in this JSON format:
[
  {
    "type": "review" | "practice" | "new_topic",
    "title": "Clear recommendation title",
    "description": "Why this matters and what to do",
    "priority": "high" | "medium" | "low",
    "estimatedTime": 30
  }
]

Only respond with valid JSON, no markdown.`;

    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    let recommendations = [];
    try {
      const content = message.content[0];
      if (content.type === "text") {
        recommendations = JSON.parse(content.text);
      }
    } catch (e) {
      recommendations = [
        {
          type: "review",
          title: "Review weak concepts",
          description:
            "Focus on concepts with lower mastery scores for improvement",
          priority: "high",
          estimatedTime: 45,
        },
      ];
    }

    // Get available courses to learn from
    const availableCourses = await prisma.content.findMany({
      where: {
        genre: {
          in: weakAreas.map((a) => a.subject),
        },
        creatorId: { not: Number(user.userId) },
      },
      select: { id: true, title: true, genre: true, duration: true },
      take: 5,
    });

    return NextResponse.json({
      recommendations,
      weakAreas,
      availableCourses,
      masteryScores: conceptMasteries.slice(0, 10),
    });
  } catch (error) {
    console.error("[RECOMMENDATIONS_GET]", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
