jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    webhook: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { GET, POST } from '@/app/api/webhooks/route'
import { PATCH, DELETE } from '@/app/api/webhooks/[id]/route'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rateLimit'

beforeEach(() => {
  checkRateLimit.mockResolvedValue({ success: true })
})

const hookRow = (over = {}) => ({
  id: 1,
  userId: 1,
  url: 'https://example.com/hook',
  secret: 'whsec_hidden',
  events: '["review.completed"]',
  label: null,
  active: true,
  failCount: 0,
  lastStatus: null,
  lastError: null,
  lastTriggeredAt: null,
  createdAt: new Date('2026-07-01T00:00:00Z'),
  updatedAt: new Date('2026-07-01T00:00:00Z'),
  ...over,
})

const jsonRequest = (method, body) =>
  new Request('http://localhost/api/webhooks', {
    method,
    body: JSON.stringify(body),
  })

describe('GET /api/webhooks', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    getCurrentUser.mockResolvedValueOnce(null)
    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('lists webhooks without exposing secrets', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1 })
    prisma.webhook.findMany.mockResolvedValueOnce([hookRow()])

    const response = await GET()
    const json = await response.json()

    expect(json.webhooks).toHaveLength(1)
    expect(json.webhooks[0].secret).toBeUndefined()
    expect(json.webhooks[0].events).toEqual(['review.completed'])
    expect(json.availableEvents).toContain('concept.mastered')
  })
})

describe('POST /api/webhooks', () => {
  beforeEach(() => jest.clearAllMocks())

  it('rejects private/local endpoint URLs', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1 })
    const response = await POST(jsonRequest('POST', { url: 'http://localhost:9000/hook' }))
    expect(response.status).toBe(400)
    expect(prisma.webhook.create).not.toHaveBeenCalled()
  })

  it('rejects unknown event names', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1 })
    const response = await POST(
      jsonRequest('POST', { url: 'https://example.com/hook', events: ['nope.event'] })
    )
    expect(response.status).toBe(400)
  })

  it('enforces the per-user webhook cap', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1 })
    prisma.webhook.count.mockResolvedValueOnce(10)
    const response = await POST(jsonRequest('POST', { url: 'https://example.com/hook' }))
    expect(response.status).toBe(400)
  })

  it('creates a webhook and returns the secret exactly once', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1 })
    prisma.webhook.count.mockResolvedValueOnce(0)
    prisma.webhook.create.mockImplementationOnce(async ({ data }) => hookRow({ ...data, id: 9 }))

    const response = await POST(
      jsonRequest('POST', {
        url: 'https://example.com/hook',
        events: ['review.completed'],
        label: 'My endpoint',
      })
    )
    expect(response.status).toBe(201)
    const { webhook } = await response.json()
    expect(webhook.secret).toMatch(/^whsec_/)
    expect(webhook.url).toBe('https://example.com/hook')
  })
})

describe('PATCH & DELETE /api/webhooks/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('404s for hooks the user does not own', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1 })
    prisma.webhook.findFirst.mockResolvedValueOnce(null)
    const response = await PATCH(jsonRequest('PATCH', { active: false }), {
      params: { id: '42' },
    })
    expect(response.status).toBe(404)
  })

  it('re-enabling resets the failure counter', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1 })
    prisma.webhook.findFirst.mockResolvedValueOnce(hookRow({ active: false, failCount: 8 }))
    prisma.webhook.update.mockResolvedValueOnce(hookRow({ active: true, failCount: 0 }))

    const response = await PATCH(jsonRequest('PATCH', { active: true }), { params: { id: '1' } })
    expect(response.status).toBe(200)
    expect(prisma.webhook.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ active: true, failCount: 0 }) })
    )
  })

  it('deletes owned hooks', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1 })
    prisma.webhook.findFirst.mockResolvedValueOnce(hookRow())
    prisma.webhook.delete.mockResolvedValueOnce(hookRow())

    const response = await DELETE(new Request('http://localhost/api/webhooks/1', { method: 'DELETE' }), {
      params: { id: '1' },
    })
    expect(response.status).toBe(200)
    expect(prisma.webhook.delete).toHaveBeenCalledWith({ where: { id: 1 } })
  })
})
