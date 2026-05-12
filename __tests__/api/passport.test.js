import { GET } from '@/app/api/user/passport/route'
import { NextResponse } from 'next/server'

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    conceptMastery: {
      findMany: jest.fn(),
    },
    reviewSession: {
      findMany: jest.fn(),
    },
  },
}))

import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

describe('GET /api/user/passport', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    getCurrentUser.mockResolvedValueOnce(null)

    const request = new Request('http://localhost:3000/api/user/passport')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('should return passport data for authenticated user', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    prisma.conceptMastery.findMany.mockResolvedValueOnce([
      { id: 1, concept: 'React', masteryScore: 85, reviewCount: 10 },
      { id: 2, concept: 'JavaScript', masteryScore: 75, reviewCount: 8 },
      { id: 3, concept: 'Node.js', masteryScore: 65, reviewCount: 6 },
      { id: 4, concept: 'CSS', masteryScore: 55, reviewCount: 4 },
    ])

    prisma.reviewSession.findMany.mockResolvedValueOnce([
      { id: 1, userId: 1, startedAt: new Date() },
      { id: 2, userId: 1, startedAt: new Date() },
    ])

    const request = new Request('http://localhost:3000/api/user/passport')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.userId).toBe(1)
    expect(data.email).toBe('user@example.com')
    expect(data.totalConcepts).toBe(4)
    expect(data.totalMastered).toBe(1) // Only React >= 80
    expect(data.totalReviews).toBe(2)
    expect(data.topConcepts).toContain('React')
    expect(data.tierBreakdown).toEqual({
      Mastered: 1,
      Proficient: 1,
      Developing: 1,
      Beginning: 1,
    })
  })

  it('should include correct passport URL', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    prisma.conceptMastery.findMany.mockResolvedValueOnce([])
    prisma.reviewSession.findMany.mockResolvedValueOnce([])

    const request = new Request('http://localhost:3000/api/user/passport')
    const response = await GET(request)

    const data = await response.json()

    expect(data.passportUrl).toBe('http://localhost:3000/passport/1')
  })

  it('should handle empty mastery records', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    prisma.conceptMastery.findMany.mockResolvedValueOnce([])
    prisma.reviewSession.findMany.mockResolvedValueOnce([])

    const request = new Request('http://localhost:3000/api/user/passport')
    const response = await GET(request)

    const data = await response.json()

    expect(data.totalConcepts).toBe(0)
    expect(data.totalMastered).toBe(0)
    expect(data.topConcepts).toEqual([])
    expect(data.totalReviews).toBe(0)
  })

  it('should return 500 on database error', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    prisma.conceptMastery.findMany.mockRejectedValueOnce(new Error('Database error'))

    const request = new Request('http://localhost:3000/api/user/passport')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Internal server error')
  })

  it('should correctly calculate tier breakdown', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    prisma.conceptMastery.findMany.mockResolvedValueOnce([
      { id: 1, concept: 'React', masteryScore: 85, reviewCount: 10 }, // Mastered
      { id: 2, concept: 'JavaScript', masteryScore: 70, reviewCount: 8 }, // Proficient
      { id: 3, concept: 'Node.js', masteryScore: 50, reviewCount: 6 }, // Developing
      { id: 4, concept: 'CSS', masteryScore: 35, reviewCount: 4 }, // Beginning
    ])

    prisma.reviewSession.findMany.mockResolvedValueOnce([])

    const request = new Request('http://localhost:3000/api/user/passport')
    const response = await GET(request)

    const data = await response.json()

    expect(data.tierBreakdown).toEqual({
      Mastered: 1,
      Proficient: 1,
      Developing: 1,
      Beginning: 1,
    })
  })
})
