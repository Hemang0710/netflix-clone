import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getGroqClient } from '@/lib/groq'

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { chapterTitle, chapterTranscript } = await request.json()

    if (!chapterTitle || !chapterTranscript) {
      return NextResponse.json(
        { error: 'Missing chapterTitle or chapterTranscript' },
        { status: 400 }
      )
    }

    // Generate an open-ended comprehension question using Groq
    const systemPrompt = `You are an expert educator creating comprehension questions.
Generate a single open-ended recall question that tests deep understanding of the material.
The question should not have a simple yes/no answer.
Be specific and reference the actual content when appropriate.
Return only the question text, nothing else.`

    const userPrompt = `Chapter: ${chapterTitle}

Transcript excerpt:
${chapterTranscript.substring(0, 1000)}

Generate one open-ended question to verify the student understood this content.`

    const completion = await getGroqClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 200,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })

    const question = completion.choices[0]?.message?.content?.trim() || ''

    if (!question) {
      return NextResponse.json(
        { error: 'Failed to generate question' },
        { status: 500 }
      )
    }

    return NextResponse.json({ question })
  } catch (error) {
    console.error('POST /api/checkpoints/[contentId]/generate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
