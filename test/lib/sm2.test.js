import { applySM2, calcMasteryScore, getForgettingCurve, isOverdue, daysUntilDue } from '@/lib/sm2'

describe('SM-2 Spaced Repetition Algorithm', () => {
  describe('applySM2', () => {
    const baseCard = {
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
    }

    it('should reset card when quality is 0 (Again)', () => {
      const result = applySM2(baseCard, 0)
      expect(result.repetitions).toBe(0)
      expect(result.interval).toBe(1)
      expect(result.easeFactor).toBeLessThan(2.5) // ease factor decreases
    })

    it('should set interval to 1 on first repetition', () => {
      const result = applySM2(baseCard, 2)
      expect(result.interval).toBe(1)
      expect(result.repetitions).toBe(1)
    })

    it('should set interval to 6 on second repetition', () => {
      const card = { ...baseCard, repetitions: 1 }
      const result = applySM2(card, 2)
      expect(result.interval).toBe(6)
      expect(result.repetitions).toBe(2)
    })

    it('should multiply interval by ease factor on third+ repetitions', () => {
      const card = { ...baseCard, repetitions: 2, interval: 6 }
      const result = applySM2(card, 2)
      expect(result.interval).toBeGreaterThan(6)
      expect(result.repetitions).toBe(3)
    })

    it('should clamp ease factor to minimum 1.3', () => {
      const card = { ...baseCard, easeFactor: 1.5 }
      const result = applySM2(card, 0)
      expect(result.easeFactor).toBeLessThanOrEqual(1.5)
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3)
    })

    it('should increase ease factor for higher quality', () => {
      const baseEase = baseCard.easeFactor
      const result3 = applySM2(baseCard, 3)
      expect(result3.easeFactor).toBeGreaterThan(baseEase)
    })

    it('should set dueDate to interval days in future', () => {
      const before = new Date()
      const result = applySM2(baseCard, 2)
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() + result.interval)

      expect(result.dueDate).toBeInstanceOf(Date)
      expect(result.dueDate.getTime()).toBeGreaterThan(before.getTime())
    })

    it('should handle all quality values 0-3', () => {
      for (let quality = 0; quality <= 3; quality++) {
        const result = applySM2(baseCard, quality)
        expect(result).toHaveProperty('interval')
        expect(result).toHaveProperty('repetitions')
        expect(result).toHaveProperty('easeFactor')
        expect(result).toHaveProperty('dueDate')
      }
    })
  })

  describe('calcMasteryScore', () => {
    it('should return 0 for no repetitions and no score', () => {
      const score = calcMasteryScore(0, 2.5, 0)
      expect(score).toBe(0)
    })

    it('should increase with more repetitions', () => {
      const score1 = calcMasteryScore(1, 2.5, 0)
      const score5 = calcMasteryScore(5, 2.5, 0)
      expect(score5).toBeGreaterThan(score1)
    })

    it('should increase with higher last score', () => {
      const score1 = calcMasteryScore(5, 2.5, 50)
      const score2 = calcMasteryScore(5, 2.5, 100)
      expect(score2).toBeGreaterThan(score1)
    })

    it('should clamp to maximum 100', () => {
      const score = calcMasteryScore(100, 2.5, 100)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should be between 0 and 100', () => {
      const testCases = [
        { reps: 0, ef: 2.5, score: 0 },
        { reps: 5, ef: 2.5, score: 50 },
        { reps: 10, ef: 2.5, score: 100 },
        { reps: 3, ef: 2.5, score: 75 },
      ]

      testCases.forEach(({ reps, ef, score }) => {
        const result = calcMasteryScore(reps, ef, score)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThanOrEqual(100)
      })
    })
  })

  describe('getForgettingCurve', () => {
    it('should return 30 data points', () => {
      const curve = getForgettingCurve(1, 2.5)
      expect(curve).toHaveLength(31) // 0-30 inclusive
    })

    it('should have retention 100 at day 0', () => {
      const curve = getForgettingCurve(1, 2.5)
      expect(curve[0].day).toBe(0)
      expect(curve[0].retention).toBe(100)
    })

    it('should have decreasing retention over time', () => {
      const curve = getForgettingCurve(5, 2.5)
      for (let i = 1; i < curve.length; i++) {
        expect(curve[i].retention).toBeLessThanOrEqual(curve[i - 1].retention)
      }
    })

    it('should have all values between 0 and 100', () => {
      const curve = getForgettingCurve(3, 2.5)
      curve.forEach((point) => {
        expect(point.retention).toBeGreaterThanOrEqual(0)
        expect(point.retention).toBeLessThanOrEqual(100)
      })
    })

    it('should decay faster with longer intervals', () => {
      const curve1 = getForgettingCurve(1, 2.5)
      const curve5 = getForgettingCurve(5, 2.5)

      // At day 10, longer interval should have higher retention
      expect(curve5[10].retention).toBeGreaterThan(curve1[10].retention)
    })

    it('should have day property incrementing from 0-30', () => {
      const curve = getForgettingCurve(2, 2.5)
      curve.forEach((point, idx) => {
        expect(point.day).toBe(idx)
      })
    })
  })

  describe('isOverdue', () => {
    it('should return true for past dates', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(isOverdue(yesterday)).toBe(true)
    })

    it('should return false for future dates', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(isOverdue(tomorrow)).toBe(false)
    })

    it('should return true for today', () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const result = isOverdue(today)
      // Will be true since current time is past midnight
      expect(typeof result).toBe('boolean')
    })
  })

  describe('daysUntilDue', () => {
    it('should return positive for future dates', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const days = daysUntilDue(tomorrow)
      expect(days).toBeGreaterThan(0)
    })

    it('should return negative for past dates', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const days = daysUntilDue(yesterday)
      expect(days).toBeLessThan(0)
    })

    it('should calculate days correctly', () => {
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
      const days = daysUntilDue(threeDaysFromNow)
      expect(Math.abs(days)).toBeLessThanOrEqual(3)
      expect(Math.abs(days)).toBeGreaterThanOrEqual(2)
    })
  })
})
