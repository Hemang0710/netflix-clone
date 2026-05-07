import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkAndIssueBadges } from "@/lib/badgeEligibility";

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false }, { status: 401 });

    const { id } = await params;
    const { answers, questions } = await request.json();

    // Calculate score
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct++;
    });

    const score = Math.round((correct / questions.length) * 100);

    await prisma.quizAttempt.create({
      data: {
        userId: Number(user.userId),
        contentId: Number(id),
        score,
        answers: JSON.stringify(answers),
      },
    });

    // Check if user meets badge criteria and issue badges
    const badgeResult = await checkAndIssueBadges(
      Number(user.userId),
      Number(id)
    );

    return NextResponse.json({
      success: true,
      score,
      correct,
      total: questions.length,
      badgesEarned: badgeResult.issuedBadges || [],
    });
  } catch (error) {
    console.error("Quiz attempt error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}