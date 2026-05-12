jest.mock('@/lib/auth')
jest.mock('@/lib/prisma')

import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { GET as profileGet } from '@/app/api/profile/[username]/route'
import { PATCH as settingsPatch } from '@/app/api/profile/settings/route'

describe('/api/profile', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('GET /api/profile/[username]', () => {
    it('returns 404 for unknown username', async () => {
      prisma.profile.findFirst.mockResolvedValueOnce(null)

      const req = new Request('http://localhost:3000/api/profile/unknown')
      const res = await profileGet(req, { params: { username: 'unknown' } })
      expect(res.status).toBe(404)
    })

    it('returns 404 when profile is not public', async () => {
      prisma.profile.findFirst.mockResolvedValueOnce(null)

      const req = new Request('http://localhost:3000/api/profile/private-user')
      const res = await profileGet(req, { params: { username: 'private-user' } })
      expect(res.status).toBe(404)
    })

    it('returns public profile data', async () => {
      prisma.profile.findFirst.mockResolvedValueOnce({
        userId: 1,
        username: 'john',
        name: 'John Doe',
        bio: 'Learning AI',
        isPublic: true,
        user: { badgeIssuances: [] },
      })
      prisma.watchProgress.findMany.mockResolvedValueOnce([])
      prisma.watchProgress.findMany.mockResolvedValueOnce([
        { contentId: 1, timestamp: 100, duration: 1000, content: { title: 'Video 1' } },
      ])

      const req = new Request('http://localhost:3000/api/profile/john')
      const res = await profileGet(req, { params: { username: 'john' } })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.username).toBe('john')
      expect(data.name).toBe('John Doe')
    })
  })

  describe('PATCH /api/profile/settings', () => {
    it('returns 401 when unauthenticated', async () => {
      getCurrentUser.mockResolvedValueOnce(null)
      const req = new Request('http://localhost:3000/api/profile/settings', {
        method: 'PATCH',
        body: JSON.stringify({ username: 'john' }),
      })
      const res = await settingsPatch(req)
      expect(res.status).toBe(401)
    })

    it('returns 422 for invalid username format', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      const req = new Request('http://localhost:3000/api/profile/settings', {
        method: 'PATCH',
        body: JSON.stringify({ username: 'INVALID_USERNAME!' }),
      })
      const res = await settingsPatch(req)
      expect(res.status).toBe(422)
    })

    it('returns 409 for duplicate username', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      prisma.profile.upsert.mockRejectedValueOnce({ code: 'P2002' })
      const req = new Request('http://localhost:3000/api/profile/settings', {
        method: 'PATCH',
        body: JSON.stringify({ username: 'taken' }),
      })
      const res = await settingsPatch(req)
      expect(res.status).toBe(409)
    })

    it('updates profile with valid username', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      prisma.profile.upsert.mockResolvedValueOnce({
        username: 'john-doe',
        isPublic: true,
        showHeatmap: true,
      })

      const req = new Request('http://localhost:3000/api/profile/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          username: 'john-doe',
          isPublic: true,
          showHeatmap: true,
        }),
      })
      const res = await settingsPatch(req)
      expect(res.status).toBe(200)
      expect(prisma.profile.upsert).toHaveBeenCalled()
    })
  })
})
