jest.mock('@/lib/auth')
jest.mock('@/lib/prisma')

import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { POST as roomsPost, GET as roomsGet } from '@/app/api/study-groups/rooms/route'
import { GET as stateGet, PATCH as statePatch } from '@/app/api/study-groups/rooms/[groupId]/state/route'

describe('/api/study-groups/rooms', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('POST /api/study-groups/rooms', () => {
    it('returns 401 when unauthenticated', async () => {
      getCurrentUser.mockResolvedValueOnce(null)
      const req = new Request('http://localhost:3000/api/study-groups/rooms', {
        method: 'POST',
        body: JSON.stringify({ contentId: 1 }),
      })
      const res = await roomsPost(req)
      expect(res.status).toBe(401)
    })

    it('creates new room with host', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      prisma.studyGroup.create.mockResolvedValueOnce({ id: 1, isRoom: true, hostUserId: 1 })
      prisma.studyGroupMember.create.mockResolvedValueOnce({})

      const req = new Request('http://localhost:3000/api/study-groups/rooms', {
        method: 'POST',
        body: JSON.stringify({ contentId: 1 }),
      })
      const res = await roomsPost(req)
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.groupId).toBe(1)
      expect(prisma.studyGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isRoom: true, hostUserId: 1 }),
        })
      )
    })
  })

  describe('GET /api/study-groups/rooms', () => {
    it('returns 401 when unauthenticated', async () => {
      getCurrentUser.mockResolvedValueOnce(null)
      const req = new Request('http://localhost:3000/api/study-groups/rooms?contentId=1')
      const res = await roomsGet(req)
      expect(res.status).toBe(401)
    })

    it('lists active rooms for content', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      prisma.studyGroup.findMany.mockResolvedValueOnce([
        {
          id: 1,
          isRoom: true,
          host: { profile: { name: 'John' } },
          members: [{ userId: 1 }, { userId: 2 }],
          maxMembers: 20,
        },
      ])

      const req = new Request('http://localhost:3000/api/study-groups/rooms?contentId=1')
      const res = await roomsGet(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.rooms.length).toBe(1)
      expect(data.rooms[0].memberCount).toBe(2)
    })
  })

  describe('GET /api/study-groups/rooms/[groupId]/state', () => {
    it('returns 403 for non-member', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      prisma.studyGroupMember.findUnique.mockResolvedValueOnce(null)

      const req = new Request('http://localhost:3000/api/study-groups/rooms/1/state')
      const res = await stateGet(req, { params: { groupId: '1' } })
      expect(res.status).toBe(403)
    })

    it('returns room state for member', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      prisma.studyGroupMember.findUnique.mockResolvedValueOnce({ userId: 1 })
      prisma.studyGroup.findUnique.mockResolvedValueOnce({
        roomState: 'playing',
        roomTimestamp: 100,
        roomStateAt: new Date(),
        hostUserId: 1,
      })

      const req = new Request('http://localhost:3000/api/study-groups/rooms/1/state')
      const res = await stateGet(req, { params: { groupId: '1' } })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.roomState).toBe('playing')
      expect(data.roomTimestamp).toBe(100)
    })
  })

  describe('PATCH /api/study-groups/rooms/[groupId]/state', () => {
    it('returns 403 for non-host', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 2, email: 'test@example.com' })
      prisma.studyGroup.findUnique.mockResolvedValueOnce({ hostUserId: 1 })

      const req = new Request('http://localhost:3000/api/study-groups/rooms/1/state', {
        method: 'PATCH',
        body: JSON.stringify({ roomState: 'playing', roomTimestamp: 100 }),
      })
      const res = await statePatch(req, { params: { groupId: '1' } })
      expect(res.status).toBe(403)
    })

    it('updates room state for host', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1, email: 'test@example.com' })
      prisma.studyGroup.findUnique.mockResolvedValueOnce({ hostUserId: 1 })
      prisma.studyGroup.update.mockResolvedValueOnce({
        roomState: 'playing',
        roomTimestamp: 100,
        roomStateAt: new Date(),
      })

      const req = new Request('http://localhost:3000/api/study-groups/rooms/1/state', {
        method: 'PATCH',
        body: JSON.stringify({ roomState: 'playing', roomTimestamp: 100 }),
      })
      const res = await statePatch(req, { params: { groupId: '1' } })
      expect(res.status).toBe(200)
      expect(prisma.studyGroup.update).toHaveBeenCalled()
    })
  })
})
