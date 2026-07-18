import crypto from 'crypto'

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    webhook: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import prisma from '@/lib/prisma'
import {
  DISABLE_AFTER_FAILURES,
  deliverWebhook,
  dispatchWebhooks,
  hookSubscribesTo,
  newWebhookSecret,
  signWebhook,
  validateWebhookUrl,
} from '@/lib/webhooks'

const hook = (over = {}) => ({
  id: 1,
  userId: 7,
  url: 'https://example.com/hook',
  secret: 'whsec_test',
  events: '[]',
  active: true,
  failCount: 0,
  ...over,
})

describe('signWebhook / newWebhookSecret', () => {
  it('signs "<timestamp>.<body>" with HMAC-SHA256', () => {
    const expected = crypto
      .createHmac('sha256', 'whsec_test')
      .update('1750000000.{"a":1}')
      .digest('hex')
    expect(signWebhook('whsec_test', 1750000000, '{"a":1}')).toBe(expected)
  })

  it('secrets are prefixed and unique', () => {
    const s = newWebhookSecret()
    expect(s.startsWith('whsec_')).toBe(true)
    expect(newWebhookSecret()).not.toBe(s)
  })
})

describe('validateWebhookUrl', () => {
  it('accepts public https URLs', () => {
    expect(validateWebhookUrl('https://example.com/hook')).toBe('https://example.com/hook')
  })

  it('rejects private and non-http targets', () => {
    expect(() => validateWebhookUrl('https://localhost/hook')).toThrow()
    expect(() => validateWebhookUrl('https://192.168.1.5/hook')).toThrow()
    expect(() => validateWebhookUrl('ftp://example.com')).toThrow()
    expect(() => validateWebhookUrl('not a url')).toThrow()
  })
})

describe('hookSubscribesTo', () => {
  it('empty events list means all events', () => {
    expect(hookSubscribesTo(hook({ events: '[]' }), 'review.completed')).toBe(true)
  })
  it('filters when events are set', () => {
    const h = hook({ events: '["concept.mastered"]' })
    expect(hookSubscribesTo(h, 'concept.mastered')).toBe(true)
    expect(hookSubscribesTo(h, 'review.completed')).toBe(false)
  })
})

describe('deliverWebhook', () => {
  it('POSTs a signed payload and reports success', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, status: 200 })
    const result = await deliverWebhook(hook(), 'review.completed', { x: 1 }, { fetchImpl })

    expect(result).toEqual({ ok: true, status: 200, error: null })
    const [url, options] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://example.com/hook')
    expect(options.method).toBe('POST')
    expect(options.redirect).toBe('error')
    expect(options.headers['X-LearnAI-Event']).toBe('review.completed')

    // Signature verifies against the sent body
    const sig = options.headers['X-LearnAI-Signature']
    const [, t, v1] = sig.match(/^t=(\d+),v1=([0-9a-f]+)$/)
    expect(v1).toBe(signWebhook('whsec_test', Number(t), options.body))

    const payload = JSON.parse(options.body)
    expect(payload.event).toBe('review.completed')
    expect(payload.data).toEqual({ x: 1 })
  })

  it('reports non-2xx and thrown errors without throwing', async () => {
    const bad = await deliverWebhook(hook(), 'ping', {}, {
      fetchImpl: jest.fn().mockResolvedValue({ ok: false, status: 500 }),
    })
    expect(bad.ok).toBe(false)
    expect(bad.status).toBe(500)

    const down = await deliverWebhook(hook(), 'ping', {}, {
      fetchImpl: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    })
    expect(down.ok).toBe(false)
    expect(down.error).toContain('ECONNREFUSED')
  })
})

describe('dispatchWebhooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  it('delivers to matching hooks and resets failCount on success', async () => {
    prisma.webhook.findMany.mockResolvedValueOnce([
      hook({ id: 1, events: '[]', failCount: 3 }),
      hook({ id: 2, events: '["concept.mastered"]' }),
    ])
    global.fetch.mockResolvedValue({ ok: true, status: 200 })

    const { delivered } = await dispatchWebhooks(7, 'review.completed', { a: 1 })

    expect(delivered).toBe(1) // hook 2 not subscribed
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(prisma.webhook.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({ failCount: 0, lastStatus: 200 }),
      })
    )
  })

  it('auto-disables a hook after too many consecutive failures', async () => {
    prisma.webhook.findMany.mockResolvedValueOnce([
      hook({ id: 5, failCount: DISABLE_AFTER_FAILURES - 1 }),
    ])
    global.fetch.mockResolvedValue({ ok: false, status: 503 })

    await dispatchWebhooks(7, 'review.completed', {})

    expect(prisma.webhook.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 5 },
        data: expect.objectContaining({
          failCount: DISABLE_AFTER_FAILURES,
          active: false,
        }),
      })
    )
  })

  it('never throws, even when the DB query fails', async () => {
    prisma.webhook.findMany.mockRejectedValueOnce(new Error('db down'))
    await expect(dispatchWebhooks(7, 'review.completed', {})).resolves.toEqual({ delivered: 0 })
  })
})
