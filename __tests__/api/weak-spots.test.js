import { GET } from '@/app/api/concepts/weak-spots/route'

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    conceptMastery: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/sm2', () => ({
  daysUntilDue: jest.fn((date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }),
}))

import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

describe('GET /api/concepts/weak-spots', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    getCurrentUser.mockResolvedValueOnce(null)

    const request = new Request('http://localhost:3000/api/concepts/weak-spots')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('should return weak spots for authenticated user', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    prisma.conceptMastery.findMany.mockResolvedValueOnce([
      {
        id: 1,
        concept: 'Closures',
        masteryScore: 35,
        reviewCount: 2,
        lastScore: 40,
        dueDate: tomorrow,
      },
      {
        id: 2,
        concept: 'Async Await',
        masteryScore: 50,
        reviewCount: 5,
        lastScore: 55,
        dueDate: tomorrow,
      },
    ])

    const request = new Request('http://localhost:3000/api/concepts/weak-spots')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.weakSpots).toBeDefined()
    expect(data.weakSpots.length).toBeGreaterThan(0)
  })

  it('should identify insufficient_practice weakness reason', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    prisma.conceptMastery.findMany.mockResolvedValueOnce([
      {
        id: 1,
        concept: 'Closures',
        masteryScore: 35,
        reviewCount: 2,
        lastScore: null,
        dueDate: tomorrow,
      },
    ])

    const request = new Request('http://localhost:3000/api/concepts/weak-spots')
    const response = await GET(request)

    const data = await response.json()

    expect(data.weakSpots[0].weaknessReason).toBe('insufficient_practice')
  })

  it('should identify never_reviewed weakness reason', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    prisma.conceptMastery.findMany.mockResolvedValueOnce([
      {
        id: 1,
        concept: 'Closures',
        masteryScore: 35,
        reviewCount: 0,
        lastScore: null,
        dueDate: tomorrow,
      },
    ])

    const request = new Request('http://localhost:3000/api/concepts/weak-spots')
    const response = await GET(request)

    const data = await response.json()

    expect(data.weakSpots[0].weaknessReason).toBe('never_reviewed')
  })

  it('should identify rapid_forgetting weakness reason', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    prisma.conceptMastery.findMany.mockResolvedValueOnce([
      {
        id: 1,
        concept: 'Closures',
        masteryScore: 35,
        reviewCount: 5,
        lastScore: 60,
        dueDate: tomorrow,
      },
    ])

    const request = new Request('http://localhost:3000/api/concepts/weak-spots')
    const response = await GET(request)

    const data = await response.json()

    expect(data.weakSpots[0].weaknessReason).toBe('rapid_forgetting')
  })

  it('should only return concepts with score < 60', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    prisma.conceptMastery.findMany.mockResolvedValueOnce([
      {
        id: 1,
        concept: 'Weak Concept',
        masteryScore: 35,
        reviewCount: 2,
        lastScore: 40,
        dueDate: tomorrow,
      },
      {
        id: 2,
        concept: 'Strong Concept',
        masteryScore: 80,
        reviewCount: 10,
        lastScore: 75,
        dueDate: tomorrow,
      },
    ])

    const request = new Request('http://localhost:3000/api/concepts/weak-spots')
    const response = await GET(request)

    const data = await response.json()

    expect(data.weakSpots.length).toBe(1)
    expect(data.weakSpots[0].concept).toBe('Weak Concept')
  })

  it('should return max 10 weak spots', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const concepts = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      concept: `Concept ${i + 1}`,
      masteryScore: 30 + i,
      reviewCount: 2,
      lastScore: 40 + i,
      dueDate: tomorrow,
    }))

    prisma.conceptMastery.findMany.mockResolvedValueOnce(concepts)

    const request = new Request('http://localhost:3000/api/concepts/weak-spots')
    const response = await GET(request)

    const data = await response.json()

    expect(data.weakSpots.length).toBe(10) // Should return max 10
  })

  it('should return 500 on database error', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    prisma.conceptMastery.findMany.mockRejectedValueOnce(new Error('Database error'))

    const request = new Request('http://localhost:3000/api/concepts/weak-spots')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Internal server error')
  })
})
