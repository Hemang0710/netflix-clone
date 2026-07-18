import { GET, POST } from '@/app/api/inbox/route'

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    inboxItem: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    conceptMastery: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: jest.fn(),
}))

// inbox.js instantiates the AI client at import time — keep it inert
jest.mock('@/lib/openai', () => ({
  aiClient: { chat: { completions: { create: jest.fn() } } },
}))

import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rateLimit'

function jsonRequest(body) {
  return new Request('http://localhost:3000/api/inbox', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('/api/inbox', () => {
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

    it('lists the user inbox', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      prisma.inboxItem.findMany.mockResolvedValueOnce([
        { id: 1, sourceType: 'article', title: 'A', status: 'ready' },
      ])

      const response = await GET()
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.items).toHaveLength(1)
      expect(prisma.inboxItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 1 } })
      )
    })
  })

  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      getCurrentUser.mockResolvedValueOnce(null)
      const response = await POST(jsonRequest({ url: 'https://example.com' }))
      expect(response.status).toBe(401)
    })

    it('returns 429 when rate limited', async () => {
      checkRateLimit.mockResolvedValueOnce({ success: false })
      const response = await POST(jsonRequest({ url: 'https://example.com' }))
      expect(response.status).toBe(429)
    })

    it('detects YouTube URLs and creates a youtube capture', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      prisma.inboxItem.create.mockResolvedValueOnce({ id: 9, sourceType: 'youtube', status: 'pending' })

      const response = await POST(
        jsonRequest({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', processNow: false })
      )

      expect(response.status).toBe(201)
      expect(prisma.inboxItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: 1, sourceType: 'youtube' }),
      })
    })

    it('creates a text capture from a pasted note', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      prisma.inboxItem.create.mockResolvedValueOnce({ id: 10, sourceType: 'text', status: 'pending' })

      const note = 'Spaced repetition schedules reviews at increasing intervals right before you forget. '.repeat(2)
      const response = await POST(jsonRequest({ text: note, processNow: false }))

      expect(response.status).toBe(201)
      expect(prisma.inboxItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ sourceType: 'text', rawText: expect.stringContaining('Spaced repetition') }),
      })
    })

    it('rejects notes too short to mine', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      const response = await POST(jsonRequest({ text: 'too short' }))
      expect(response.status).toBe(400)
      expect(prisma.inboxItem.create).not.toHaveBeenCalled()
    })

    it('rejects private/local URLs (SSRF guard)', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      const response = await POST(jsonRequest({ url: 'http://169.254.169.254/latest' }))
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toMatch(/private/i)
      expect(prisma.inboxItem.create).not.toHaveBeenCalled()
    })
  })
})
