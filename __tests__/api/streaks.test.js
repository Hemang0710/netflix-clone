import { GET } from '@/app/api/streaks/route'

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    reviewSession: {
      findMany: jest.fn(),
    },
    watchProgress: {
      findMany: jest.fn(),
    },
  },
}))

import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

describe('GET /api/streaks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    getCurrentUser.mockResolvedValueOnce(null)

    const request = new Request('http://localhost:3000/api/streaks')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('should return streaks for authenticated user', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    prisma.reviewSession.findMany.mockResolvedValueOnce([
      { id: 1, userId: 1, startedAt: new Date(today.getTime() - 0 * 86400000) }, // Today
      { id: 2, userId: 1, startedAt: new Date(today.getTime() - 1 * 86400000) }, // Yesterday
      { id: 3, userId: 1, startedAt: new Date(today.getTime() - 2 * 86400000) }, // 2 days ago
    ])

    prisma.watchProgress.findMany.mockResolvedValueOnce([])

    const request = new Request('http://localhost:3000/api/streaks')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.reviewStreak).toBeDefined()
    expect(data.reviewStreak.current).toBe(3) // 3-day streak
    expect(data.reviewStreak.best).toBe(3)
    expect(data.totalReviewSessions).toBe(3)
  })

  it('should calculate correct current streak with gap', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    prisma.reviewSession.findMany.mockResolvedValueOnce([
      { id: 1, userId: 1, startedAt: new Date(today.getTime() - 0 * 86400000) }, // Today
      { id: 2, userId: 1, startedAt: new Date(today.getTime() - 1 * 86400000) }, // Yesterday
      { id: 3, userId: 1, startedAt: new Date(today.getTime() - 3 * 86400000) }, // 3 days ago (gap!)
    ])

    prisma.watchProgress.findMany.mockResolvedValueOnce([])

    const request = new Request('http://localhost:3000/api/streaks')
    const response = await GET(request)

    const data = await response.json()

    expect(data.reviewStreak.current).toBe(2) // Current streak: 2 days
    expect(data.reviewStreak.best).toBe(2) // Best streak: 2 days (before the gap)
  })

  it('should handle empty sessions', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    prisma.reviewSession.findMany.mockResolvedValueOnce([])
    prisma.watchProgress.findMany.mockResolvedValueOnce([])

    const request = new Request('http://localhost:3000/api/streaks')
    const response = await GET(request)

    const data = await response.json()

    expect(data.reviewStreak.current).toBe(0)
    expect(data.reviewStreak.best).toBe(0)
    expect(data.totalReviewSessions).toBe(0)
  })

  it('should calculate best streak across multiple streaks', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    prisma.reviewSession.findMany.mockResolvedValueOnce([
      { id: 1, userId: 1, startedAt: new Date(today.getTime() - 0 * 86400000) }, // Today
      { id: 2, userId: 1, startedAt: new Date(today.getTime() - 1 * 86400000) }, // Yesterday
      { id: 3, userId: 1, startedAt: new Date(today.getTime() - 5 * 86400000) }, // 5 days ago (5-day streak before gap)
      { id: 4, userId: 1, startedAt: new Date(today.getTime() - 6 * 86400000) },
      { id: 5, userId: 1, startedAt: new Date(today.getTime() - 7 * 86400000) },
      { id: 6, userId: 1, startedAt: new Date(today.getTime() - 8 * 86400000) },
    ])

    prisma.watchProgress.findMany.mockResolvedValueOnce([])

    const request = new Request('http://localhost:3000/api/streaks')
    const response = await GET(request)

    const data = await response.json()

    expect(data.reviewStreak.current).toBe(2) // Current streak: 2 days
    expect(data.reviewStreak.best).toBe(4) // Best streak: 4 days
  })

  it('should return 500 on database error', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    prisma.reviewSession.findMany.mockRejectedValueOnce(new Error('Database error'))

    const request = new Request('http://localhost:3000/api/streaks')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Internal server error')
  })
})
