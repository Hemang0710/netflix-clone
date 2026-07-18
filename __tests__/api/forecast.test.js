import { GET } from '@/app/api/forecast/route'

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

import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000)

describe('GET /api/forecast', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    getCurrentUser.mockResolvedValueOnce(null)
    const response = await GET(new Request('http://localhost:3000/api/forecast'))
    expect(response.status).toBe(401)
  })

  it('builds a forecast from the user concepts', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1 })
    prisma.conceptMastery.findMany.mockResolvedValueOnce([
      {
        id: 1,
        concept: 'Recursion',
        interval: 1,
        repetitions: 2,
        reviewCount: 2,
        lastScore: 80,
        masteryScore: 45,
        lastReviewAt: daysAgo(5), // long past the threshold → at risk
        createdAt: daysAgo(20),
        source: 'inbox',
        contentId: null,
        content: null,
      },
      {
        id: 2,
        concept: 'Fresh Concept',
        interval: 40,
        repetitions: 5,
        reviewCount: 5,
        lastScore: 95,
        masteryScore: 80,
        lastReviewAt: daysAgo(0), // reviewed today, safe for weeks
        createdAt: daysAgo(60),
        source: 'chapter',
        contentId: 3,
        content: { title: 'Algorithms 101' },
      },
    ])

    const response = await GET(new Request('http://localhost:3000/api/forecast?days=7'))
    expect(response.status).toBe(200)

    const { forecast } = await response.json()
    expect(forecast.totalTracked).toBe(2)
    expect(forecast.atRiskNow.map((c) => c.concept)).toContain('Recursion')
    expect(forecast.atRiskNow.map((c) => c.concept)).not.toContain('Fresh Concept')
    expect(forecast.headline.concept).toBe('Recursion')
    expect(forecast.reviewEstimate.minutes).toBeGreaterThanOrEqual(1)
  })

  it('clamps out-of-range query params', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1 })
    prisma.conceptMastery.findMany.mockResolvedValueOnce([])

    const response = await GET(new Request('http://localhost:3000/api/forecast?days=999&threshold=1'))
    expect(response.status).toBe(200)
    const { forecast } = await response.json()
    expect(forecast.horizonDays).toBeLessThanOrEqual(30)
    expect(forecast.threshold).toBeGreaterThanOrEqual(50)
  })
})
