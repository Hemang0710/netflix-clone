import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { adjustSchedule } from '@/lib/planGenerator';

export async function POST(request, { params }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { planId, taskId } = await params;

    // Verify plan ownership
    const plan = await prisma.studyPlan.findUnique({
      where: { id: Number(planId) }
    });

    if (!plan || plan.userId !== session.user.id) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Mark task as complete
    const task = await prisma.studyTask.update({
      where: { id: Number(taskId) },
      data: {
        completed: true,
        completedAt: new Date()
      },
      include: {
        content: true
      }
    });

    // Check if we should adjust schedule
    const allTasks = await prisma.studyTask.findMany({
      where: { planId: Number(planId) }
    });

    const completedCount = allTasks.filter(t => t.completed).length;
    const expectedCount = allTasks.filter(
      t => new Date(t.scheduledFor) <= new Date()
    ).length;

    // If significantly behind (less than 50% completion of due tasks), suggest adjustment
    if (expectedCount > 0 && completedCount < expectedCount * 0.5) {
      await adjustSchedule(Number(planId), 'fell_behind');
    }

    return NextResponse.json({
      success: true,
      data: task,
      stats: {
        completedCount,
        expectedCount,
        behindSchedule: completedCount < expectedCount * 0.5
      }
    });
  } catch (error) {
    console.error('Complete task error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
