import { generateThumbnail, generateThumbnailImage } from '@/lib/creator/aiService';
import { verifyAuth } from '@/lib/auth';

export async function POST(req) {
  try {
    const user = await verifyAuth(req);
    const { title, mood, style, colors, elements, generateImage } = await req.json();

    if (!title || !mood || !style) {
      return Response.json({
        error: 'title, mood, and style are required',
      }, { status: 400 });
    }

    const thumbnail = await generateThumbnail(title, mood, style, {
      colors,
      elements,
    });

    let imageData = null;
    if (generateImage === true) {
      imageData = await generateThumbnailImage(thumbnail.dallePrompt);
    }

    return Response.json({
      success: true,
      data: {
        ...thumbnail,
        image: imageData,
      },
    });
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
