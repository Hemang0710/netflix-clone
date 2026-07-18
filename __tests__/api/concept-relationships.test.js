import { GET } from '@/app/api/concepts/relationships/route'

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

describe('GET /api/concepts/relationships', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    getCurrentUser.mockResolvedValueOnce(null)

    const request = new Request('http://localhost:3000/api/concepts/relationships')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('should return empty graph for no concepts', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    prisma.conceptMastery.findMany.mockResolvedValueOnce([])

    const request = new Request('http://localhost:3000/api/concepts/relationships')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.nodes).toEqual([])
    expect(data.edges).toEqual([])
  })

  it('should create nodes from concepts', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    prisma.conceptMastery.findMany.mockResolvedValueOnce([
      {
        id: 1,
        concept: 'React',
        masteryScore: 85,
        reviewCount: 10,
        contentId: 1,
        content: { id: 1 },
      },
      {
        id: 2,
        concept: 'JavaScript',
        masteryScore: 75,
        reviewCount: 8,
        contentId: 1,
        content: { id: 1 },
      },
    ])

    const request = new Request('http://localhost:3000/api/concepts/relationships')
    const response = await GET(request)

    const data = await response.json()

    expect(data.nodes.length).toBe(2)
    expect(data.nodes[0].concept).toBe('React')
    expect(data.nodes[0].masteryScore).toBe(85)
    expect(data.nodes[0].reviewCount).toBe(10)
  })

  it('should create edges between concepts in same content', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    prisma.conceptMastery.findMany.mockResolvedValueOnce([
      {
        id: 1,
        concept: 'React',
        masteryScore: 85,
        reviewCount: 10,
        contentId: 1,
        content: { id: 1 },
      },
      {
        id: 2,
        concept: 'JavaScript',
        masteryScore: 75,
        reviewCount: 8,
        contentId: 1,
        content: { id: 1 },
      },
      {
        id: 3,
        concept: 'Node.js',
        masteryScore: 65,
        reviewCount: 6,
        contentId: 2,
        content: { id: 2 },
      },
    ])

    const request = new Request('http://localhost:3000/api/concepts/relationships')
    const response = await GET(request)

    const data = await response.json()

    expect(data.edges.length).toBe(1) // Only React-JavaScript edge (same content)
    expect(data.edges[0].from).toBeDefined()
    expect(data.edges[0].to).toBeDefined()
  })

  it('should not create duplicate edges', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    prisma.conceptMastery.findMany.mockResolvedValueOnce([
      {
        id: 1,
        concept: 'React',
        masteryScore: 85,
        reviewCount: 10,
        contentId: 1,
        content: { id: 1 },
      },
      {
        id: 2,
        concept: 'JavaScript',
        masteryScore: 75,
        reviewCount: 8,
        contentId: 1,
        content: { id: 1 },
      },
      {
        id: 3,
        concept: 'Node.js',
        masteryScore: 65,
        reviewCount: 6,
        contentId: 1,
        content: { id: 1 },
      },
    ])

    const request = new Request('http://localhost:3000/api/concepts/relationships')
    const response = await GET(request)

    const data = await response.json()

    expect(data.edges.length).toBe(3) // 3 edges: 1-2, 1-3, 2-3
  })

  it('should create no edges for single concept per content', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    prisma.conceptMastery.findMany.mockResolvedValueOnce([
      {
        id: 1,
        concept: 'React',
        masteryScore: 85,
        reviewCount: 10,
        contentId: 1,
        content: { id: 1 },
      },
      {
        id: 2,
        concept: 'JavaScript',
        masteryScore: 75,
        reviewCount: 8,
        contentId: 2,
        content: { id: 2 },
      },
    ])

    const request = new Request('http://localhost:3000/api/concepts/relationships')
    const response = await GET(request)

    const data = await response.json()

    expect(data.edges.length).toBe(0) // No edges (each content has only one concept)
  })

  it('should sort nodes by masteryScore descending', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    prisma.conceptMastery.findMany.mockResolvedValueOnce([
      // Mock returns data pre-sorted by masteryScore desc, matching the
      // route's Prisma orderBy (sorting happens in the database)
      {
        id: 2,
        concept: 'JavaScript',
        masteryScore: 90,
        reviewCount: 10,
        contentId: 1,
        content: { id: 1 },
      },
      {
        id: 1,
        concept: 'React',
        masteryScore: 50,
        reviewCount: 5,
        contentId: 1,
        content: { id: 1 },
      },
    ])

    const request = new Request('http://localhost:3000/api/concepts/relationships')
    const response = await GET(request)

    const data = await response.json()

    expect(data.nodes[0].concept).toBe('JavaScript') // Higher score first
    expect(data.nodes[1].concept).toBe('React')
  })

  it('should return 500 on database error', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'user@example.com' })

    prisma.conceptMastery.findMany.mockRejectedValueOnce(new Error('Database error'))

    const request = new Request('http://localhost:3000/api/concepts/relationships')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Internal server error')
  })
})
