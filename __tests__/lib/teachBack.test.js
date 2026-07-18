jest.mock('@/lib/openai', () => ({
  aiClient: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}))

import { aiClient } from '@/lib/openai'
import { gradeExplanation, scoreToQuality } from '@/lib/teachBack'

const mockAIResponse = (content) => {
  aiClient.chat.completions.create.mockResolvedValueOnce({
    choices: [{ message: { content } }],
  })
}

describe('scoreToQuality', () => {
  it('maps score bands onto SM-2 quality 0-3', () => {
    expect(scoreToQuality(100)).toBe(3)
    expect(scoreToQuality(85)).toBe(3)
    expect(scoreToQuality(84)).toBe(2)
    expect(scoreToQuality(65)).toBe(2)
    expect(scoreToQuality(64)).toBe(1)
    expect(scoreToQuality(40)).toBe(1)
    expect(scoreToQuality(39)).toBe(0)
    expect(scoreToQuality(0)).toBe(0)
  })
})

describe('gradeExplanation', () => {
  beforeEach(() => jest.clearAllMocks())

  it('normalizes a well-formed AI response', async () => {
    mockAIResponse(
      JSON.stringify({
        accuracy: 90,
        completeness: 70,
        simplicity: 80,
        score: 82,
        feedback: 'You explained the base case well.',
        gaps: ['Missing the call stack', '', 42],
        jargon: ['memoization'],
        followUp: 'What happens without a base case?',
      })
    )

    const result = await gradeExplanation({
      concept: 'Recursion',
      audience: 'child',
      explanation: 'A function that calls itself until it hits a stopping point.',
    })

    expect(result.score).toBe(82)
    expect(result.accuracy).toBe(90)
    expect(result.gaps).toEqual(['Missing the call stack']) // non-strings filtered
    expect(result.jargon).toEqual(['memoization'])
    expect(result.followUp).toBe('What happens without a base case?')
  })

  it('clamps out-of-range scores and computes a missing overall score', async () => {
    mockAIResponse(
      JSON.stringify({
        accuracy: 150,
        completeness: -20,
        simplicity: 50,
        feedback: 'ok',
        gaps: [],
        jargon: [],
      })
    )

    const result = await gradeExplanation({
      concept: 'Recursion',
      explanation: 'x'.repeat(50),
    })

    expect(result.accuracy).toBe(100)
    expect(result.completeness).toBe(0)
    // 100*0.4 + 0*0.3 + 50*0.3 = 55
    expect(result.score).toBe(55)
  })

  it('parses JSON wrapped in markdown fences', async () => {
    mockAIResponse('```json\n{"score": 60, "accuracy": 60, "completeness": 60, "simplicity": 60, "gaps": [], "jargon": []}\n```')

    const result = await gradeExplanation({ concept: 'X', explanation: 'y'.repeat(50) })
    expect(result.score).toBe(60)
  })

  it('throws when the model returns nothing parseable', async () => {
    mockAIResponse('I cannot grade this right now, sorry!')

    await expect(
      gradeExplanation({ concept: 'X', explanation: 'y'.repeat(50) })
    ).rejects.toThrow(/grading failed/i)
  })
})
