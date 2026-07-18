import {
  buildICalFeed,
  buildSchedule,
  icalEscape,
  isValidTimezone,
  newCalendarToken,
  parseStudyDays,
  wallTimeToUtc,
} from '@/lib/autopilot'

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]
const MS_PER_DAY = 86_400_000

const baseSettings = {
  enabled: true,
  studyDays: ALL_DAYS,
  startHour: 18,
  endHour: 21,
  slotMinutes: 25,
  maxSlotsPerDay: 2,
  timezone: 'UTC',
}

// A fixed morning instant so "today's window" (18:00) is still ahead
const NOW = new Date('2026-07-17T08:00:00Z')

const concept = (id, dueInDays, extra = {}) => ({
  id,
  concept: `Concept ${id}`,
  dueDate: new Date(NOW.getTime() + dueInDays * MS_PER_DAY),
  masteryScore: 50,
  ...extra,
})

describe('parseStudyDays / isValidTimezone / newCalendarToken', () => {
  it('parses valid JSON and falls back to Mon-Fri on garbage', () => {
    expect(parseStudyDays('[0,6]')).toEqual([0, 6])
    expect(parseStudyDays('not json')).toEqual([1, 2, 3, 4, 5])
    expect(parseStudyDays('[9,-1]')).toEqual([1, 2, 3, 4, 5])
  })

  it('validates IANA timezones', () => {
    expect(isValidTimezone('Asia/Kolkata')).toBe(true)
    expect(isValidTimezone('UTC')).toBe(true)
    expect(isValidTimezone('Mars/Olympus')).toBe(false)
    expect(isValidTimezone('')).toBe(false)
  })

  it('generates long unique url-safe tokens', () => {
    const t1 = newCalendarToken()
    const t2 = newCalendarToken()
    expect(t1).not.toBe(t2)
    expect(t1.length).toBeGreaterThanOrEqual(24)
    expect(t1).toMatch(/^[\w-]+$/)
  })
})

describe('wallTimeToUtc', () => {
  it('is identity for UTC', () => {
    const d = wallTimeToUtc({ year: 2026, month: 7, day: 17, hour: 18 }, 'UTC')
    expect(d.toISOString()).toBe('2026-07-17T18:00:00.000Z')
  })

  it('applies the timezone offset', () => {
    // 18:00 IST is 12:30 UTC (IST = UTC+5:30, no DST)
    const d = wallTimeToUtc({ year: 2026, month: 7, day: 17, hour: 18 }, 'Asia/Kolkata')
    expect(d.toISOString()).toBe('2026-07-17T12:30:00.000Z')
  })
})

describe('buildSchedule', () => {
  it('schedules overdue concepts into the first available window', () => {
    const { slots, scheduled, unscheduled } = buildSchedule(
      [concept(1, -3), concept(2, -1), concept(3, 0)],
      baseSettings,
      { now: NOW }
    )
    expect(scheduled).toBe(3)
    expect(unscheduled).toBe(0)
    expect(slots).toHaveLength(1)
    expect(slots[0].start).toBe('2026-07-17T18:00:00.000Z')
    expect(slots[0].conceptCount).toBe(3)
    expect(slots[0].concepts).toContain('Concept 1')
  })

  it('skips today when the study window has already closed', () => {
    const evening = new Date('2026-07-17T22:00:00Z') // past the 18-21 window
    const { slots } = buildSchedule([concept(1, -1)], baseSettings, { now: evening })
    expect(slots.length).toBeGreaterThan(0)
    expect(slots[0].date).toBe('2026-07-18')
  })

  it('only uses configured study days', () => {
    const targetDay = (NOW.getUTCDay() + 3) % 7
    const { slots } = buildSchedule(
      [concept(1, -1), concept(2, 1)],
      { ...baseSettings, studyDays: [targetDay] },
      { now: NOW }
    )
    expect(slots.length).toBeGreaterThan(0)
    for (const slot of slots) {
      expect(new Date(slot.start).getUTCDay()).toBe(targetDay)
    }
  })

  it('caps slots per day and rolls overflow forward', () => {
    // 25-min slots fit 33 concepts (45s each); 2 slots/day = 66. 70 due now.
    const many = Array.from({ length: 70 }, (_, i) => concept(i + 1, -1))
    const { slots, scheduled } = buildSchedule(many, baseSettings, { now: NOW })
    expect(scheduled).toBe(70)
    const byDate = slots.reduce((m, s) => ({ ...m, [s.date]: (m[s.date] || 0) + 1 }), {})
    expect(byDate['2026-07-17']).toBe(2)
    expect(slots.filter((s) => s.date === '2026-07-17').reduce((n, s) => n + s.conceptCount, 0)).toBe(66)
    expect(slots.some((s) => s.date === '2026-07-18')).toBe(true)
  })

  it('ignores concepts due beyond the horizon', () => {
    const { totalConcepts, slots } = buildSchedule(
      [concept(1, 60)],
      baseSettings,
      { now: NOW, horizonDays: 14 }
    )
    expect(totalConcepts).toBe(0)
    expect(slots).toHaveLength(0)
  })

  it('second slot starts after the first', () => {
    const many = Array.from({ length: 40 }, (_, i) => concept(i + 1, -1))
    const { slots } = buildSchedule(many, baseSettings, { now: NOW })
    expect(slots).toHaveLength(2)
    expect(slots[1].start).toBe('2026-07-17T18:25:00.000Z')
  })

  it('handles invalid settings by clamping to sane defaults', () => {
    const { slots } = buildSchedule([concept(1, -1)], {
      ...baseSettings,
      studyDays: '[1,2,3,4,5,6,0]',
      slotMinutes: 9999,
      maxSlotsPerDay: -5,
      timezone: 'Not/AZone',
    }, { now: NOW })
    expect(slots).toHaveLength(1)
  })
})

describe('buildICalFeed', () => {
  const slots = [
    {
      date: '2026-07-17',
      start: '2026-07-17T18:00:00.000Z',
      end: '2026-07-17T18:25:00.000Z',
      minutes: 25,
      conceptCount: 2,
      concepts: ['Recursion, deeply', 'Closures'],
    },
  ]

  it('produces a valid VCALENDAR with one VEVENT per slot', () => {
    const ics = buildICalFeed(slots, { now: NOW, appUrl: 'https://learnai.example' })
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true)
    expect(ics.trim().endsWith('END:VCALENDAR')).toBe(true)
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1)
    expect(ics).toContain('DTSTART:20260717T180000Z')
    expect(ics).toContain('DTEND:20260717T182500Z')
    expect(ics).toContain('UID:learnai-autopilot-2026-07-17-0@learnai')
    // CRLF line endings (required by RFC 5545)
    expect(ics).toContain('\r\n')
  })

  it('escapes commas in text fields', () => {
    const ics = buildICalFeed(slots, { now: NOW })
    expect(ics).toContain('Recursion\\, deeply')
  })

  it('icalEscape covers backslash, semicolon, comma, newline', () => {
    expect(icalEscape('a;b,c\\d\ne')).toBe('a\\;b\\,c\\\\d\\ne')
  })

  it('folds long lines to 75 octets', () => {
    const longSlot = [{
      ...slots[0],
      concepts: Array.from({ length: 20 }, (_, i) => `A pretty long concept name number ${i}`),
      conceptCount: 20,
    }]
    const ics = buildICalFeed(longSlot, { now: NOW })
    for (const line of ics.split('\r\n')) {
      expect(line.length).toBeLessThanOrEqual(75)
    }
  })
})
