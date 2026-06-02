import { generateContentGaps } from '@/lib/creator/analyticsService';
import { analyzeContentGapsWithAI } from '@/lib/creator/aiService';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const user = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const contentIdStr = searchParams.get('contentId');
    const withAIAnalysis = searchParams.get('analyze') === 'true';

    if (!contentIdStr) {
      return Response.json({ error: 'contentId required' }, { status: 400 });
    }

    const contentId = parseInt(contentIdStr);
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { creatorId: true },
    });

    if (!content || content.creatorId !== user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const gaps = await generateContentGaps(contentId);

    let aiAnalysis = null;
    if (withAIAnalysis && gaps && gaps.topGaps.length > 0) {
      const confusionTopics = gaps.topGaps.map(g => g.concept);
      aiAnalysis = await analyzeContentGapsWithAI(contentId, confusionTopics);
    }

    return Response.json({
      success: true,
      data: gaps,
      analysis: aiAnalysis,
    });
  } catch (error) {
    console.error('Content gaps error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
