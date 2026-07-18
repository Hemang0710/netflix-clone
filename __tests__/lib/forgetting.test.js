import {
  buildDigest,
  buildForecast,
  dayLabel,
  estimateRetention,
  isTrackable,
  projectForgetDate,
} from '@/lib/forgetting'

const NOW = new Date('2026-07-15T12:00:00Z')
const daysAgo = (n) => new Date(NOW.getTime() - n * 86_400_000)

function concept(overrides = {}) {
  return {
    id: 1,
    concept: 'Recursion',
    interval: 1,
    repetitions: 1,
    easeFactor: 2.5,
    reviewCount: 1,
    lastScore: 80,
    masteryScore: 40,
    lastReviewAt: daysAgo(0),
    createdAt: daysAgo(10),
    source: 'inbox',
    contentId: null,
    ...overrides,
  }
}

describe('estimateRetention', () => {
  it('is 100% immediately after review and decays with time', () => {
    expect(estimateRetention(concept({ lastReviewAt: NOW }), NOW)).toBeCloseTo(100, 0)
    const r2 = estimateRetention(concept({ lastReviewAt: daysAgo(2) }), NOW)
    expect(r2).toBeLessThan(60)
    expect(r2).toBeGreaterThan(40)
  })

  it('decays slower for well-spaced (high interval) concepts', () => {
    const weak = estimateRetention(concept({ interval: 1, lastReviewAt: daysAgo(3) }), NOW)
    const strong = estimateRetention(concept({ interval: 20, lastReviewAt: daysAgo(3) }), NOW)
    expect(strong).toBeGreaterThan(weak)
  })

  it('anchors on createdAt when never reviewed', () => {
    const c = concept({ lastReviewAt: null, createdAt: daysAgo(5) })
    expect(estimateRetention(c, NOW)).toBeLessThan(100)
  })
})

describe('projectForgetDate', () => {
  it('projects further out for larger intervals', () => {
    const soon = projectForgetDate(concept({ interval: 1 }))
    const later = projectForgetDate(concept({ interval: 10 }))
    expect(later.getTime()).toBeGreaterThan(soon.getTime())
  })
})

describe('isTrackable', () => {
  it('requires some learning signal', () => {
    expect(isTrackable(concept())).toBe(true)
    expect(isTrackable(concept({ repetitions: 0, reviewCount: 0, lastScore: 0 }))).toBe(false)
    expect(isTrackable(concept({ repetitions: 0, reviewCount: 0, lastScore: null }))).toBe(false)
  })
})

describe('dayLabel', () => {
  it('names days relative to now', () => {
    expect(dayLabel(NOW, NOW)).toBe('Today')
    expect(dayLabel(new Date(NOW.getTime() + 86_400_000), NOW)).toBe('Tomorrow')
    const in3 = dayLabel(new Date(NOW.getTime() + 3 * 86_400_000), NOW)
    expect(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).toContain(in3)
  })
})

describe('buildForecast', () => {
  it('separates already-fading from upcoming decay and skips unlearned concepts', () => {
    const concepts = [
      concept({ id: 1, concept: 'Fading', interval: 1, lastReviewAt: daysAgo(4) }), // long past threshold
      concept({ id: 2, concept: 'Due Soon', interval: 3, lastReviewAt: daysAgo(1) }), // decays within window
      concept({ id: 3, concept: 'Solid', interval: 30, lastReviewAt: daysAgo(1) }), // safe for weeks
      concept({ id: 4, concept: 'Never Learned', repetitions: 0, reviewCount: 0, lastScore: 0 }),
    ]
    const f = buildForecast(concepts, { now: NOW, days: 7 })

    expect(f.totalTracked).toBe(3)
    expect(f.atRiskNow.map((c) => c.id)).toContain(1)
    expect(f.upcoming.flatMap((d) => d.concepts).map((c) => c.id)).toContain(2)
    const allIds = [...f.atRiskNow, ...f.upcoming.flatMap((d) => d.concepts)].map((c) => c.id)
    expect(allIds).not.toContain(3)
    expect(allIds).not.toContain(4)
  })

  it('headline picks the highest-invested concept decaying soonest', () => {
    const concepts = [
      concept({ id: 1, concept: 'Minor', masteryScore: 10, interval: 1, lastReviewAt: daysAgo(3) }),
      concept({ id: 2, concept: 'Major', masteryScore: 90, interval: 1, lastReviewAt: daysAgo(3) }),
    ]
    const f = buildForecast(concepts, { now: NOW })
    expect(f.headline.concept).toBe('Major')
    expect(f.reviewEstimate.concepts).toBeGreaterThan(0)
    expect(f.reviewEstimate.minutes).toBeGreaterThanOrEqual(1)
  })

  it('returns a calm payload when nothing decays', () => {
    const f = buildForecast([concept({ interval: 60, lastReviewAt: daysAgo(0) })], { now: NOW })
    expect(f.atRiskNow).toHaveLength(0)
    expect(f.upcoming).toHaveLength(0)
    expect(f.headline).toBeNull()
    expect(f.reviewEstimate.concepts).toBe(0)
  })
})

describe('buildDigest', () => {
  it('returns null when there is nothing to nag about', () => {
    const f = buildForecast([concept({ interval: 60, lastReviewAt: daysAgo(0) })], { now: NOW })
    expect(buildDigest(f)).toBeNull()
  })

  it('produces a subject and body naming the fading concepts', () => {
    const f = buildForecast(
      [concept({ id: 1, concept: 'Recursion', interval: 1, lastReviewAt: daysAgo(3) })],
      { now: NOW }
    )
    const digest = buildDigest(f)
    expect(digest.subject).toContain('Recursion')
    expect(digest.body).toContain('Recursion')
    expect(digest.conceptCount).toBe(1)
    expect(digest.minutes).toBeGreaterThanOrEqual(1)
  })
})
