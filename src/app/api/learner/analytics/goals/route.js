import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period"); // weekly | monthly | all
    const status = searchParams.get("status"); // active | completed | all

    const where = { userId: Number(user.userId) };
    if (period) where.period = period;
    if (status) where.status = status;

    const goals = await prisma.learningGoal.findMany({
      where,
      include: {
        user: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate progress percentage
    const goalsWithProgress = goals.map((g) => ({
      ...g,
      progressPercent: g.target > 0 ? (g.currentProgress / g.target) * 100 : 0,
      isCompleted: g.currentProgress >= g.target,
    }));

    return NextResponse.json(goalsWithProgress);
  } catch (error) {
    console.error("[GOALS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      category,
      target,
      unit,
      startDate,
      endDate,
      period,
    } = body;

    if (!title || !category || !target || !unit || !period) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const goal = await prisma.learningGoal.create({
      data: {
        userId: session.user.id,
        title,
        description,
        category,
        target,
        unit,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        period,
        currentProgress: 0,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("[GOALS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, currentProgress, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Goal ID required" }, { status: 400 });
    }

    const goal = await prisma.learningGoal.findUnique({
      where: { id: parseInt(id) },
    });

    if (!goal || goal.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.learningGoal.update({
      where: { id: parseInt(id) },
      data: {
        ...(currentProgress !== undefined && { currentProgress }),
        ...(status && { status }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[GOALS_PUT]", error);
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 }
    );
  }
}
