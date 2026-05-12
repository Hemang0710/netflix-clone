jest.mock('@/lib/auth')
jest.mock('@/lib/prisma')

import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { GET as activeGet, POST as activePost } from '@/app/api/buddy/active/route'
import { POST as invitePost } from '@/app/api/buddy/invite/route'
import { GET as sessionGet, PATCH as sessionPatch } from '@/app/api/buddy/[sessionId]/route'

describe('/api/buddy', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('GET /api/buddy/active', () => {
    it('returns 401 when unauthenticated', async () => {
      getCurrentUser.mockResolvedValueOnce(null)
      const req = new Request('http://localhost:3000/api/buddy/active?contentId=1')
      const res = await activeGet(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when missing contentId', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      const req = new Request('http://localhost:3000/api/buddy/active')
      const res = await activeGet(req)
      expect(res.status).toBe(400)
    })

    it('upserts activeLearner and returns count', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      prisma.activeLearner.upsert.mockResolvedValueOnce({ userId: 1, contentId: 1 })
      prisma.activeLearner.count.mockResolvedValueOnce(3)
      prisma.activeLearner.findMany.mockResolvedValueOnce([])

      const req = new Request('http://localhost:3000/api/buddy/active?contentId=1')
      const res = await activeGet(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.activeCount).toBe(3)
      expect(prisma.activeLearner.upsert).toHaveBeenCalled()
    })
  })

  describe('POST /api/buddy/invite', () => {
    it('returns 401 when unauthenticated', async () => {
      getCurrentUser.mockResolvedValueOnce(null)
      const req = new Request('http://localhost:3000/api/buddy/invite', {
        method: 'POST',
        body: JSON.stringify({ contentId: 1, receiverId: 2 }),
      })
      const res = await invitePost(req)
      expect(res.status).toBe(401)
    })

    it('creates buddy session and notification', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      prisma.studyBuddySession.create.mockResolvedValueOnce({
        id: 1,
        contentId: 1,
        requesterId: 1,
        receiverId: 2,
      })
      prisma.notification.create.mockResolvedValueOnce({})

      const req = new Request('http://localhost:3000/api/buddy/invite', {
        method: 'POST',
        body: JSON.stringify({ contentId: 1, receiverId: 2 }),
      })
      const res = await invitePost(req)
      expect(res.status).toBe(201)
      expect(prisma.studyBuddySession.create).toHaveBeenCalled()
      expect(prisma.notification.create).toHaveBeenCalled()
    })

    it('returns 409 on duplicate session', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      prisma.studyBuddySession.create.mockRejectedValueOnce({ code: 'P2002' })

      const req = new Request('http://localhost:3000/api/buddy/invite', {
        method: 'POST',
        body: JSON.stringify({ contentId: 1, receiverId: 2 }),
      })
      const res = await invitePost(req)
      expect(res.status).toBe(409)
    })
  })

  describe('PATCH /api/buddy/[sessionId]', () => {
    it('returns 403 for non-receiver', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 3, email: 'other@example.com' })
      prisma.studyBuddySession.findUnique.mockResolvedValueOnce({
        id: 1,
        receiverId: 2,
        requesterId: 1,
      })

      const req = new Request('http://localhost:3000/api/buddy/1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'accept' }),
      })
      const res = await sessionPatch(req, { params: { sessionId: '1' } })
      expect(res.status).toBe(403)
    })

    it('accepts partnership and creates notification', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 2, email: 'test@example.com' })
      prisma.studyBuddySession.findUnique.mockResolvedValueOnce({
        id: 1,
        receiverId: 2,
        requesterId: 1,
      })
      prisma.studyBuddySession.update.mockResolvedValueOnce({ id: 1, status: 'active' })
      prisma.notification.create.mockResolvedValueOnce({})

      const req = new Request('http://localhost:3000/api/buddy/1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'accept' }),
      })
      const res = await sessionPatch(req, { params: { sessionId: '1' } })
      expect(res.status).toBe(200)
      expect(prisma.notification.create).toHaveBeenCalled()
    })

    it('declines partnership', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 2, email: 'test@example.com' })
      prisma.studyBuddySession.findUnique.mockResolvedValueOnce({
        id: 1,
        receiverId: 2,
        requesterId: 1,
      })
      prisma.studyBuddySession.update.mockResolvedValueOnce({ id: 1, status: 'declined' })

      const req = new Request('http://localhost:3000/api/buddy/1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'decline' }),
      })
      const res = await sessionPatch(req, { params: { sessionId: '1' } })
      expect(res.status).toBe(200)
    })
  })
})
