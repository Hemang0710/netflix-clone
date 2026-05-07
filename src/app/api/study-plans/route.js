import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateStudyPlan } from '@/lib/planGenerator';

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { hoursPerWeek, goal, targetCareer, preferences } = await request.json();

    // Validate input
    if (!hoursPerWeek || !goal) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate schedule via AI
    const { schedule, tasks, reasoning } = await generateStudyPlan({
      userId: session.user.id,
      hoursPerWeek,
      goal,
      targetCareer,
      preferences
    });

    // Save plan
    const plan = await prisma.studyPlan.create({
      data: {
        userId: session.user.id,
        hoursPerWeek,
        goal,
        targetCareer,
        schedule: JSON.stringify(schedule),
        preferences: JSON.stringify(preferences)
      }
    });

    // Save tasks
    if (tasks && tasks.length > 0) {
      await prisma.studyTask.createMany({
        data: tasks.map(t => ({
          planId: plan.id,
          ...t
        }))
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        planId: plan.id,
        schedule,
        reasoning,
        taskCount: tasks.length
      }
    });
  } catch (error) {
    console.error('Study plan creation error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get all active plans for user
    const plans = await prisma.studyPlan.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      orderBy: { createdAt: 'desc' },
      include: {
        tasks: {
          orderBy: { scheduledFor: 'asc' }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
