import { generateDropoffAnalytics } from '@/lib/creator/analyticsService';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const user = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return Response.json({ error: 'contentId required' }, { status: 400 });
    }

    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { creatorId: true },
    });

    if (!content || content.creatorId !== user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const analytics = await generateDropoffAnalytics(contentId);

    return Response.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Dropoff analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
