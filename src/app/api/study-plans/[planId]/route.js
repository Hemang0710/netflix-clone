import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await params;

    const plan = await prisma.studyPlan.findUnique({
      where: { id: Number(planId) },
      include: {
        tasks: {
          orderBy: { scheduledFor: 'asc' },
          include: {
            content: {
              select: {
                id: true,
                title: true,
                duration: true
              }
            }
          }
        },
        adjustments: {
          orderBy: { appliedAt: 'desc' }
        }
      }
    });

    if (!plan) {
      return NextResponse.json({ success: false, message: 'Plan not found' }, { status: 404 });
    }

    // Verify ownership
    if (plan.userId !== session.user.id) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Get plan error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await params;
    const { isActive } = await request.json();

    // Verify ownership
    const plan = await prisma.studyPlan.findUnique({
      where: { id: Number(planId) }
    });

    if (!plan || plan.userId !== session.user.id) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.studyPlan.update({
      where: { id: Number(planId) },
      data: { isActive }
    });

    return NextResponse.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Update plan error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
