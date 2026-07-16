import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Anthropic } from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const contentId = url.searchParams.get("contentId");

    if (!contentId) {
      return Response.json({ error: "Content ID required" }, { status: 400 });
    }

    // Check if user has already taken this quiz for onboarding
    const existing = await prisma.quizAttempt.findFirst({
      where: {
        userId: Number(user.userId),
        contentId: Number(contentId),
      },
    });

    if (existing) {
      return Response.json({
        alreadyTaken: true,
        score: existing.score,
        message: "You've already taken this quiz!",
      });
    }

    // Get content to base quiz on
    const content = await prisma.content.findUnique({
      where: { id: Number(contentId) },
      select: { title: true, description: true, transcript: true },
    });

    if (!content) {
      return Response.json({ error: "Content not found" }, { status: 404 });
    }

    // Generate 5-question quiz with Claude
    const quizPrompt = `Generate a 5-question quick assessment quiz for this content. Make it simple and engaging for a first-time learner.

Content: ${content.title}
Description: ${content.description}
Transcript preview: ${content.transcript?.slice(0, 500) || "N/A"}

Return a JSON array of 5 questions, each with 4 options (A, B, C, D) and the correct answer.
Format:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": "A",
    "explanation": "Why this is correct"
  }
]`;

    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1500,
      messages: [{ role: "user", content: quizPrompt }],
    });

    const quizText = response.content[0].type === "text" ? response.content[0].text : "[]";
    const quiz = JSON.parse(quizText);

    return Response.json({
      quiz,
      contentId,
      estimatedTime: "5 minutes",
      message: "Quick assessment to show you what we'll cover!",
    });
  } catch (error) {
    console.error("Quick quiz generation error:", error);
    return Response.json({ error: "Failed to generate quiz" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { contentId, answers } = await req.json();
    const userId = Number(user.userId);

    // Get the quiz questions
    const content = await prisma.content.findUnique({
      where: { id: Number(contentId) },
      include: { quiz: true },
    });

    if (!content?.quiz) {
      return Response.json({ error: "Quiz not found" }, { status: 404 });
    }

    const questions = JSON.parse(content.quiz.questions);

    // Calculate score
    let correctCount = 0;
    const detailedResults = questions.map((q, i) => {
      const userAnswer = answers[i];
      const isCorrect = userAnswer === q.correct;
      if (isCorrect) correctCount++;
      return {
        question: q.question,
        userAnswer,
        correct: q.correct,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);

    // Save attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        contentId: Number(contentId),
        score,
        answers: JSON.stringify(answers),
      },
    });

    // Generate AI explanation based on performance
    const explanation = await generateExplanation(content.title, score, detailedResults);

    return Response.json({
      score,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      passed: score >= 70,
      detailedResults,
      aiExplanation: explanation,
      nextAction: score < 70
        ? "Let's watch the lesson and try again!"
        : "Great job! Ready to dive deeper?",
    });
  } catch (error) {
    console.error("Quiz submit error:", error);
    return Response.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}

async function generateExplanation(contentTitle, score, results) {
  const wrongAnswers = results.filter((r) => !r.isCorrect);

  const prompt = `The user just took a quiz on "${contentTitle}" and scored ${score}/100.

Wrong answers:
${wrongAnswers.map((w) => `- Q: ${w.question}\n  They chose: ${w.userAnswer}, Correct: ${w.correct}\n  Why: ${w.explanation}`).join("\n")}

Write a 2-3 sentence personalized AI explanation to help them understand their mistakes and encourage them to learn.`;

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}
