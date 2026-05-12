import { generateCourseOutline } from '@/lib/creator/aiService';
import { verifyAuth } from '@/lib/auth';

export async function POST(req) {
  try {
    const user = await verifyAuth(req);
    const {
      subject,
      level,
      numModules,
      targetAudience,
      objectives,
    } = await req.json();

    if (!subject || !level || !numModules) {
      return Response.json({
        error: 'subject, level, and numModules are required',
      }, { status: 400 });
    }

    if (numModules < 1 || numModules > 20) {
      return Response.json({
        error: 'numModules must be between 1 and 20',
      }, { status: 400 });
    }

    const outline = await generateCourseOutline(subject, level, numModules, {
      targetAudience,
      objectives,
    });

    return Response.json({
      success: true,
      data: outline,
    });
  } catch (error) {
    console.error('Course outline generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
