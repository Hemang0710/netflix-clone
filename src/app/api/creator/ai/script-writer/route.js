import { generateScript } from '@/lib/creator/aiService';
import { verifyAuth } from '@/lib/auth';

export async function POST(req) {
  try {
    const user = await verifyAuth(req);
    const { topic, duration, style, targetAudience, keyPoints } = await req.json();

    if (!topic || !duration || !style) {
      return Response.json({
        error: 'topic, duration, and style are required',
      }, { status: 400 });
    }

    const script = await generateScript(topic, duration, style, {
      targetAudience,
      keyPoints,
    });

    return Response.json({
      success: true,
      data: script,
    });
  } catch (error) {
    console.error('Script generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
