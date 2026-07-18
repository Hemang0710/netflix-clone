jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    autopilotSettings: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    conceptMastery: {
      findMany: jest.fn(),
    },
  },
}))

import { GET, PUT } from '@/app/api/autopilot/route'
import { GET as GET_CALENDAR } from '@/app/api/autopilot/calendar/[token]/route'
import { POST as ROTATE } from '@/app/api/autopilot/token/route'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rateLimit'

beforeEach(() => {
  checkRateLimit.mockResolvedValue({ success: true })
})

const settingsRow = (over = {}) => ({
  id: 1,
  userId: 1,
  enabled: true,
  studyDays: '[1,2,3,4,5]',
  startHour: 18,
  endHour: 21,
  slotMinutes: 25,
  maxSlotsPerDay: 2,
  timezone: 'UTC',
  calendarToken: 'a-very-secret-token-abc123',
  ...over,
})

describe('GET /api/autopilot', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    getCurrentUser.mockResolvedValueOnce(null)
    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('lazily creates settings with a calendar token on first call', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1 })
    prisma.autopilotSettings.findUnique.mockResolvedValueOnce(null)
    prisma.autopilotSettings.create.mockResolvedValueOnce(settingsRow())
    prisma.conceptMastery.findMany.mockResolvedValueOnce([])

    const response = await GET()
    expect(response.status).toBe(200)
    const json = await response.json()

    expect(prisma.autopilotSettings.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 1, calendarToken: expect.any(String) }),
      })
    )
    expect(json.settings.calendarToken).toBeTruthy()
    expect(json.feedPath).toContain('/api/autopilot/calendar/')
    expect(json.schedule).toHaveProperty('slots')
  })
})

describe('PUT /api/autopilot', () => {
  beforeEach(() => jest.clearAllMocks())

  it('validates the study window ordering', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1 })
    prisma.autopilotSettings.findUnique.mockResolvedValueOnce(settingsRow())

    const response = await PUT(
      new Request('http://localhost/api/autopilot', {
        method: 'PUT',
        body: JSON.stringify({ startHour: 20, endHour: 19 }),
      })
    )
    expect(response.status).toBe(400)
  })

  it('rejects bad study days and timezones', async () => {
    getCurrentUser.mockResolvedValue({ userId: 1 })

    let response = await PUT(
      new Request('http://localhost/api/autopilot', {
        method: 'PUT',
        body: JSON.stringify({ studyDays: [] }),
      })
    )
    expect(response.status).toBe(400)

    response = await PUT(
      new Request('http://localhost/api/autopilot', {
        method: 'PUT',
        body: JSON.stringify({ timezone: 'Mars/Olympus' }),
      })
    )
    expect(response.status).toBe(400)
  })

  it('persists valid updates', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1 })
    prisma.autopilotSettings.findUnique.mockResolvedValueOnce(settingsRow())
    prisma.autopilotSettings.update.mockResolvedValueOnce(
      settingsRow({ slotMinutes: 40, timezone: 'Asia/Kolkata' })
    )
    prisma.conceptMastery.findMany.mockResolvedValueOnce([])

    const response = await PUT(
      new Request('http://localhost/api/autopilot', {
        method: 'PUT',
        body: JSON.stringify({ slotMinutes: 40, timezone: 'Asia/Kolkata' }),
      })
    )
    expect(response.status).toBe(200)
    expect(prisma.autopilotSettings.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { slotMinutes: 40, timezone: 'Asia/Kolkata' },
      })
    )
  })
})

describe('POST /api/autopilot/token', () => {
  beforeEach(() => jest.clearAllMocks())

  it('rotates the calendar token', async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: 1 })
    prisma.autopilotSettings.upsert.mockResolvedValueOnce(settingsRow())

    const response = await ROTATE()
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.calendarToken).toBeTruthy()
    expect(prisma.autopilotSettings.upsert).toHaveBeenCalled()
  })
})

describe('GET /api/autopilot/calendar/[token]', () => {
  beforeEach(() => jest.clearAllMocks())

  const request = new Request('http://localhost/api/autopilot/calendar/x')

  it('404s on short or unknown tokens', async () => {
    let response = await GET_CALENDAR(request, { params: { token: 'short' } })
    expect(response.status).toBe(404)

    prisma.autopilotSettings.findUnique.mockResolvedValueOnce(null)
    response = await GET_CALENDAR(request, { params: { token: 'unknown-but-long-enough-token' } })
    expect(response.status).toBe(404)
  })

  it('404s when autopilot is disabled', async () => {
    prisma.autopilotSettings.findUnique.mockResolvedValueOnce(settingsRow({ enabled: false }))
    const response = await GET_CALENDAR(request, {
      params: { token: 'a-very-secret-token-abc123' },
    })
    expect(response.status).toBe(404)
  })

  it('serves an iCal feed for a valid token without cookie auth', async () => {
    prisma.autopilotSettings.findUnique.mockResolvedValueOnce(settingsRow())
    prisma.conceptMastery.findMany.mockResolvedValueOnce([
      { id: 1, concept: 'Recursion', dueDate: new Date(), masteryScore: 50 },
    ])

    const response = await GET_CALENDAR(request, {
      params: { token: 'a-very-secret-token-abc123' },
    })
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('text/calendar')
    const body = await response.text()
    expect(body).toContain('BEGIN:VCALENDAR')
  })
})
