import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studyPlans = await prisma.studyPlan.findMany({
      where: { userId: Number(user.userId) },
      include: {
        tasks: {
          include: { content: { select: { id: true, title: true } } },
          orderBy: { scheduledFor: "asc" },
        },
        adjustments: { orderBy: { appliedAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = studyPlans.map((plan) => {
      const now = new Date();
      const totalTasks = plan.tasks.length;
      const completedTasks = plan.tasks.filter((t) => t.completed).length;
      const upcomingTasks = plan.tasks.filter(
        (t) => !t.completed && new Date(t.scheduledFor) > now
      );

      return {
        ...plan,
        progressPercent:
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        completedTasks,
        upcomingCount: upcomingTasks.length,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("[STUDY_PLANS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch study plans" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { hoursPerWeek, goal, targetCareer, schedule, preferences } = body;

    if (!hoursPerWeek || !goal) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const studyPlan = await prisma.studyPlan.create({
      data: {
        userId: Number(user.userId),
        hoursPerWeek: parseInt(hoursPerWeek),
        goal,
        targetCareer,
        schedule: JSON.stringify(schedule || []),
        preferences: JSON.stringify(preferences || {}),
        isActive: true,
      },
    });

    return NextResponse.json(studyPlan, { status: 201 });
  } catch (error) {
    console.error("[STUDY_PLANS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create study plan" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Study plan ID required" },
        { status: 400 }
      );
    }

    const plan = await prisma.studyPlan.findUnique({
      where: { id: parseInt(id) },
    });

    if (!plan || plan.userId !== Number(user.userId)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.studyPlan.update({
      where: { id: parseInt(id) },
      data: { isActive },
      include: { tasks: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[STUDY_PLANS_PUT]", error);
    return NextResponse.json(
      { error: "Failed to update study plan" },
      { status: 500 }
    );
  }
}
