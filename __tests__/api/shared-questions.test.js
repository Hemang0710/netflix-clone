jest.mock('@/lib/auth')
jest.mock('@/lib/prisma')

import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { POST as logPost } from '@/app/api/questions/log/route'
import { GET as questionsGet } from '@/app/api/questions/route'

describe('/api/questions', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('POST /api/questions/log', () => {
    it('returns 401 when unauthenticated', async () => {
      getCurrentUser.mockResolvedValueOnce(null)
      const req = new Request('http://localhost:3000/api/questions/log', {
        method: 'POST',
        body: JSON.stringify({ contentId: 1, question: 'What is X?' }),
      })
      const res = await logPost(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when missing contentId', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      const req = new Request('http://localhost:3000/api/questions/log', {
        method: 'POST',
        body: JSON.stringify({ question: 'What is X?' }),
      })
      const res = await logPost(req)
      expect(res.status).toBe(400)
    })

    it('creates new shared question with count 1', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      prisma.sharedQuestion.upsert.mockResolvedValueOnce({
        contentId: 1,
        questionHash: 'abc123',
        sampleText: 'What is X?',
        count: 1,
      })

      const req = new Request('http://localhost:3000/api/questions/log', {
        method: 'POST',
        body: JSON.stringify({ contentId: 1, question: 'What is X?', concept: 'basics' }),
      })
      const res = await logPost(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.count).toBe(1)
    })

    it('increments count on duplicate question', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      prisma.sharedQuestion.upsert.mockResolvedValueOnce({
        contentId: 1,
        questionHash: 'abc123',
        sampleText: 'What is X?',
        count: 5,
      })

      const req = new Request('http://localhost:3000/api/questions/log', {
        method: 'POST',
        body: JSON.stringify({ contentId: 1, question: 'What is X?' }),
      })
      const res = await logPost(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.count).toBe(5)
    })
  })

  describe('GET /api/questions', () => {
    it('returns 400 when missing contentId', async () => {
      const req = new Request('http://localhost:3000/api/questions')
      const res = await questionsGet(req)
      expect(res.status).toBe(400)
    })

    it('returns top questions ordered by count', async () => {
      prisma.sharedQuestion.findMany.mockResolvedValueOnce([
        { sampleText: 'Most common', count: 10, concept: 'basics' },
        { sampleText: 'Second common', count: 5, concept: 'intermediate' },
      ])

      const req = new Request('http://localhost:3000/api/questions?contentId=1')
      const res = await questionsGet(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.questions.length).toBe(2)
      expect(data.questions[0].count).toBe(10)
    })

    it('returns empty array when no questions exist', async () => {
      prisma.sharedQuestion.findMany.mockResolvedValueOnce([])

      const req = new Request('http://localhost:3000/api/questions?contentId=1')
      const res = await questionsGet(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.questions).toEqual([])
    })
  })
})
