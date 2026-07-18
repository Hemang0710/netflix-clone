import { GET, POST } from '@/app/api/teach-back/route'

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    conceptMastery: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    teachBackSession: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: jest.fn(),
}))

jest.mock('@/lib/openai', () => ({
  aiClient: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}))

import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rateLimit'
import { aiClient } from '@/lib/openai'

const GOOD_EXPLANATION =
  'Recursion is when a function calls itself with a smaller version of the problem until it reaches a case simple enough to answer directly.'

const mockGrading = (overrides = {}) => {
  aiClient.chat.completions.create.mockResolvedValueOnce({
    choices: [
      {
        message: {
          content: JSON.stringify({
            accuracy: 90,
            completeness: 75,
            simplicity: 85,
            score: 84,
            feedback: 'Nice base-case framing.',
            gaps: ['Call stack behavior'],
            jargon: [],
            followUp: 'What if there is no base case?',
            ...overrides,
          }),
        },
      },
    ],
  })
}

const postRequest = (body) =>
  new Request('http://localhost:3000/api/teach-back', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('/api/teach-back', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    checkRateLimit.mockResolvedValue({ success: true })
  })

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      getCurrentUser.mockResolvedValueOnce(null)
      const response = await GET()
      expect(response.status).toBe(401)
    })

    it('returns weakest-first suggestions and parsed session history', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      prisma.conceptMastery.findMany.mockResolvedValueOnce([
        { id: 5, concept: 'Recursion', masteryScore: 20, lastScore: 40, dueDate: new Date(), source: 'inbox' },
      ])
      prisma.teachBackSession.findMany.mockResolvedValueOnce([
        {
          id: 9,
          conceptMasteryId: 5,
          concept: 'Recursion',
          audience: 'child',
          explanation: 'stuff',
          score: 70,
          accuracy: 70,
          completeness: 70,
          simplicity: 70,
          feedback: 'ok',
          gaps: '["Call stack"]',
          jargon: 'not-json',
          followUp: null,
          createdAt: new Date(),
        },
      ])

      const response = await GET()
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.suggestions[0].concept).toBe('Recursion')
      expect(data.sessions[0].gaps).toEqual(['Call stack'])
      expect(data.sessions[0].jargon).toEqual([]) // malformed JSON degrades to empty list
    })
  })

  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      getCurrentUser.mockResolvedValueOnce(null)
      const response = await POST(postRequest({ explanation: GOOD_EXPLANATION }))
      expect(response.status).toBe(401)
    })

    it('returns 429 when rate limited', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      checkRateLimit.mockResolvedValueOnce({ success: false })
      const response = await POST(postRequest({ concept: 'Recursion', explanation: GOOD_EXPLANATION }))
      expect(response.status).toBe(429)
    })

    it('rejects explanations that are too short', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      const response = await POST(postRequest({ concept: 'Recursion', explanation: 'it calls itself' }))
      expect(response.status).toBe(400)
    })

    it('returns 404 for a concept card the user does not own', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      prisma.conceptMastery.findFirst.mockResolvedValueOnce(null)
      const response = await POST(postRequest({ conceptMasteryId: 99, explanation: GOOD_EXPLANATION }))
      expect(response.status).toBe(404)
    })

    it('grades against an existing card and returns the SM-2 quality', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      prisma.conceptMastery.findFirst.mockResolvedValueOnce({ id: 5, concept: 'Recursion' })
      mockGrading()
      prisma.teachBackSession.create.mockImplementationOnce(async ({ data }) => ({
        id: 42,
        createdAt: new Date(),
        ...data,
      }))

      const response = await POST(
        postRequest({ conceptMasteryId: 5, audience: 'child', explanation: GOOD_EXPLANATION })
      )
      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.session.concept).toBe('Recursion')
      expect(data.session.score).toBe(84)
      expect(data.session.gaps).toEqual(['Call stack behavior'])
      expect(data.quality).toBe(2) // 84 → Good
      expect(prisma.teachBackSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 1, conceptMasteryId: 5, audience: 'child' }),
        })
      )
    })

    it('creates a new card with source "teachback" for a free-text topic', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      prisma.conceptMastery.findFirst.mockResolvedValueOnce(null) // no existing card
      prisma.conceptMastery.create.mockResolvedValueOnce({ id: 7, concept: 'Bayes Theorem' })
      mockGrading({ score: 90 })
      prisma.teachBackSession.create.mockImplementationOnce(async ({ data }) => ({
        id: 43,
        createdAt: new Date(),
        ...data,
      }))

      const response = await POST(
        postRequest({ concept: 'Bayes Theorem', explanation: GOOD_EXPLANATION })
      )
      expect(response.status).toBe(200)
      const data = await response.json()

      expect(prisma.conceptMastery.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 1, concept: 'Bayes Theorem', source: 'teachback' }),
        })
      )
      expect(data.session.conceptMasteryId).toBe(7)
      expect(data.quality).toBe(3) // 90 → Easy
    })

    it('requires a concept when no card id is given', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      const response = await POST(postRequest({ explanation: GOOD_EXPLANATION }))
      expect(response.status).toBe(400)
    })
  })
})
