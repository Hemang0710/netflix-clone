jest.mock('@/lib/auth')
jest.mock('@/lib/prisma')

import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { POST as requestPost } from '@/app/api/partners/request/route'
import { PATCH as partnerPatch } from '@/app/api/partners/[partnerId]/route'
import { GET as partnersGet } from '@/app/api/partners/route'
import { POST as checkinPost } from '@/app/api/partners/[partnerId]/checkin/route'
import { GET as notificationsGet } from '@/app/api/notifications/route'
import { PATCH as notificationPatch } from '@/app/api/notifications/[id]/read/route'

describe('/api/partners', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('POST /api/partners/request', () => {
    it('returns 401 when unauthenticated', async () => {
      getCurrentUser.mockResolvedValueOnce(null)
      const req = new Request('http://localhost:3000/api/partners/request', {
        method: 'POST',
        body: JSON.stringify({ receiverId: 2 }),
      })
      const res = await requestPost(req)
      expect(res.status).toBe(401)
    })

    it('creates partnership request and notification', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      prisma.accountabilityPartner.create.mockResolvedValueOnce({ id: 1, requesterId: 1, receiverId: 2 })
      prisma.notification.create.mockResolvedValueOnce({})

      const req = new Request('http://localhost:3000/api/partners/request', {
        method: 'POST',
        body: JSON.stringify({ receiverId: 2 }),
      })
      const res = await requestPost(req)
      expect(res.status).toBe(201)
      expect(prisma.accountabilityPartner.create).toHaveBeenCalled()
    })

    it('returns 409 on duplicate partnership', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      prisma.accountabilityPartner.create.mockRejectedValueOnce({ code: 'P2002' })

      const req = new Request('http://localhost:3000/api/partners/request', {
        method: 'POST',
        body: JSON.stringify({ receiverId: 2 }),
      })
      const res = await requestPost(req)
      expect(res.status).toBe(409)
    })
  })

  describe('PATCH /api/partners/[partnerId]', () => {
    it('returns 403 for non-receiver', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 3, email: 'other@example.com' })
      prisma.accountabilityPartner.findUnique.mockResolvedValueOnce({
        id: 1,
        receiverId: 2,
        requesterId: 1,
      })

      const req = new Request('http://localhost:3000/api/partners/1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'accept' }),
      })
      const res = await partnerPatch(req, { params: { partnerId: '1' } })
      expect(res.status).toBe(403)
    })

    it('accepts partnership', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 2, email: 'test@example.com' })
      prisma.accountabilityPartner.findUnique.mockResolvedValueOnce({
        id: 1,
        receiverId: 2,
        requesterId: 1,
      })
      prisma.accountabilityPartner.update.mockResolvedValueOnce({ id: 1, status: 'active' })
      prisma.notification.create.mockResolvedValueOnce({})

      const req = new Request('http://localhost:3000/api/partners/1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'accept' }),
      })
      const res = await partnerPatch(req, { params: { partnerId: '1' } })
      expect(res.status).toBe(200)
    })

    it('declines partnership', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 2, email: 'test@example.com' })
      prisma.accountabilityPartner.findUnique.mockResolvedValueOnce({
        id: 1,
        receiverId: 2,
        requesterId: 1,
      })
      prisma.accountabilityPartner.update.mockResolvedValueOnce({ id: 1, status: 'ended' })

      const req = new Request('http://localhost:3000/api/partners/1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'decline' }),
      })
      const res = await partnerPatch(req, { params: { partnerId: '1' } })
      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/partners', () => {
    it('returns 401 when unauthenticated', async () => {
      getCurrentUser.mockResolvedValueOnce(null)
      const req = new Request('http://localhost:3000/api/partners')
      const res = await partnersGet(req)
      expect(res.status).toBe(401)
    })

    it('returns active partnerships', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      prisma.accountabilityPartner.findMany.mockResolvedValueOnce([
        {
          id: 1,
          requesterId: 1,
          receiverId: 2,
          receiver: { profile: { name: 'Partner' } },
          requester: { profile: { name: 'Me' } },
          checkIns: [{ checkedInAt: new Date() }],
        },
      ])
      prisma.notification.findFirst.mockResolvedValueOnce(null)

      const req = new Request('http://localhost:3000/api/partners')
      const res = await partnersGet(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.partnerships.length).toBe(1)
    })

    it('creates missed notification when partner hasnt checked in', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      const oldDate = new Date(Date.now() - 30 * 60 * 60 * 1000)
      prisma.accountabilityPartner.findMany.mockResolvedValueOnce([
        {
          id: 1,
          requesterId: 1,
          receiverId: 2,
          receiver: { profile: { name: 'Partner' } },
          requester: { profile: { name: 'Me' } },
          checkIns: [{ checkedInAt: oldDate }],
        },
      ])
      prisma.notification.findFirst.mockResolvedValueOnce(null)
      prisma.notification.create.mockResolvedValueOnce({})

      const req = new Request('http://localhost:3000/api/partners')
      const res = await partnersGet(req)
      expect(res.status).toBe(200)
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'partner_missed' }),
        })
      )
    })
  })

  describe('POST /api/partners/[partnerId]/checkin', () => {
    it('returns 403 for non-member', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 3, email: 'other@example.com' })
      prisma.accountabilityPartner.findUnique.mockResolvedValueOnce({
        id: 1,
        requesterId: 1,
        receiverId: 2,
      })

      const req = new Request('http://localhost:3000/api/partners/1/checkin', {
        method: 'POST',
        body: JSON.stringify({ note: 'Great session!' }),
      })
      const res = await checkinPost(req, { params: { partnerId: '1' } })
      expect(res.status).toBe(403)
    })

    it('creates check-in record', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      prisma.accountabilityPartner.findUnique.mockResolvedValueOnce({
        id: 1,
        requesterId: 1,
        receiverId: 2,
        status: 'active',
      })
      prisma.partnerCheckIn.create.mockResolvedValueOnce({
        id: 1,
        partnerId: 1,
        userId: 1,
        checkedInAt: new Date(),
      })

      const req = new Request('http://localhost:3000/api/partners/1/checkin', {
        method: 'POST',
        body: JSON.stringify({ note: 'Great session!' }),
      })
      const res = await checkinPost(req, { params: { partnerId: '1' } })
      expect(res.status).toBe(201)
      expect(prisma.partnerCheckIn.create).toHaveBeenCalled()
    })
  })

  describe('GET /api/notifications', () => {
    it('returns 401 when unauthenticated', async () => {
      getCurrentUser.mockResolvedValueOnce(null)
      const req = new Request('http://localhost:3000/api/notifications')
      const res = await notificationsGet(req)
      expect(res.status).toBe(401)
    })

    it('returns unread notifications', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      prisma.notification.findMany.mockResolvedValueOnce([
        { id: 1, type: 'buddy_invite', payload: '{}', read: false, createdAt: new Date() },
      ])

      const req = new Request('http://localhost:3000/api/notifications')
      const res = await notificationsGet(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.notifications.length).toBe(1)
    })
  })

  describe('PATCH /api/notifications/[id]/read', () => {
    it('returns 401 when unauthenticated', async () => {
      getCurrentUser.mockResolvedValueOnce(null)
      const req = new Request('http://localhost:3000/api/notifications/1/read', { method: 'PATCH' })
      const res = await notificationPatch(req, { params: { id: '1' } })
      expect(res.status).toBe(401)
    })

    it('marks notification as read', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      prisma.notification.findUnique.mockResolvedValueOnce({ id: 1, userId: 1, read: false })
      prisma.notification.update.mockResolvedValueOnce({ id: 1, read: true })

      const req = new Request('http://localhost:3000/api/notifications/1/read', { method: 'PATCH' })
      const res = await notificationPatch(req, { params: { id: '1' } })
      expect(res.status).toBe(200)
    })

    it('returns 403 for notification not owned by user', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      prisma.notification.findUnique.mockResolvedValueOnce({ id: 1, userId: 2, read: false })

      const req = new Request('http://localhost:3000/api/notifications/1/read', { method: 'PATCH' })
      const res = await notificationPatch(req, { params: { id: '1' } })
      expect(res.status).toBe(403)
    })
  })
})
