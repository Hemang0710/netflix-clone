import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getGroqClient } from '@/lib/groq'

export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { concept, question, answer } = await request.json()

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Missing question or answer' },
        { status: 400 }
      )
    }

    // Call Groq to evaluate the answer
    const systemPrompt = `You are a learning assessor. Evaluate the student's answer to a learning question.
Score the answer from 0-100 based on correctness and completeness.
Provide brief feedback explaining what they got right and what could be improved.
Return a JSON response with exactly this format:
{"score": 85, "feedback": "Good explanation...", "correct": true}`

    const userPrompt = `Concept: ${concept}
Question: ${question}
Student's Answer: ${answer}

Evaluate this answer and respond with JSON only (no markdown).`

    const completion = await getGroqClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })

    // Extract the response text
    const responseText = completion.choices[0]?.message?.content || ''

    // Try to parse JSON from response
    let result = { score: 50, feedback: responseText, correct: false }
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        result = {
          score: Math.min(Math.max(parsed.score || 50, 0), 100),
          feedback: parsed.feedback || responseText,
          correct: parsed.correct || (parsed.score || 50) >= 60,
        }
      }
    } catch (e) {
      console.warn('Failed to parse evaluation JSON:', e)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('POST /api/concepts/evaluate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
