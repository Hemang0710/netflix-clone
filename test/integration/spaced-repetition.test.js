/**
 * Integration Tests for Spaced Repetition System
 * These tests verify the complete flow of the SM-2 spaced repetition system
 */

import { applySM2, calcMasteryScore, getForgettingCurve } from '@/lib/sm2'

describe('Spaced Repetition System - Integration Tests', () => {
  describe('Complete Review Cycle', () => {
    it('should complete a full SM-2 review cycle', () => {
      // Start with a new concept
      const concept = {
        interval: 1,
        repetitions: 0,
        easeFactor: 2.5,
      }

      // First review - score: Good (quality: 2)
      const review1 = applySM2(concept, 2)
      expect(review1.interval).toBe(1)
      expect(review1.repetitions).toBe(1)

      // Second review - score: Good (quality: 2)
      const review2 = applySM2(review1, 2)
      expect(review2.interval).toBe(6)
      expect(review2.repetitions).toBe(2)

      // Third review - score: Easy (quality: 3)
      const review3 = applySM2(review2, 3)
      expect(review3.interval).toBeGreaterThan(6)
      expect(review3.repetitions).toBe(3)
      expect(review3.easeFactor).toBeGreaterThan(review2.easeFactor)
    })

    it('should handle failed reviews correctly', () => {
      const concept = {
        interval: 10,
        repetitions: 3,
        easeFactor: 2.8,
      }

      // Fail the review
      const failed = applySM2(concept, 0)
      expect(failed.repetitions).toBe(0)
      expect(failed.interval).toBe(1)
      expect(failed.easeFactor).toBeLessThan(2.8)

      // Next successful review should start from 1
      const recovery = applySM2(failed, 2)
      expect(recovery.interval).toBe(1)
      expect(recovery.repetitions).toBe(1)
    })

    it('should reflect progression in mastery score', () => {
      let mastery = calcMasteryScore(0, 2.5, 0)
      expect(mastery).toBe(0)

      // After first review
      mastery = calcMasteryScore(1, 2.5, 70)
      expect(mastery).toBeGreaterThan(0)

      // After multiple reviews
      mastery = calcMasteryScore(5, 2.5, 85)
      expect(mastery).toBeGreaterThan(calcMasteryScore(1, 2.5, 70))

      // After many reviews
      mastery = calcMasteryScore(10, 2.6, 95)
      expect(mastery).toBeGreaterThan(70)
    })
  })

  describe('Concept Lifecycle', () => {
    it('should show correct retention at key milestones', () => {
      const curve = getForgettingCurve(6, 2.5)

      // At day 0: 100% retention
      expect(curve[0].retention).toBe(100)

      // At day 6 (interval): Ebbinghaus decay - retention should be ~70% (time = interval)
      const day6 = curve[6]
      expect(day6.retention).toBeGreaterThan(65)
      expect(day6.retention).toBeLessThan(75)

      // At day 30: very low retention without review
      const day30 = curve[30]
      expect(day30.retention).toBeLessThan(day6.retention)
    })

    it('should demonstrate longer interval = slower decay', () => {
      const shortInterval = getForgettingCurve(1, 2.5)
      const longInterval = getForgettingCurve(10, 2.5)

      // At day 10, longer interval should have better retention
      expect(longInterval[10].retention).toBeGreaterThan(shortInterval[10].retention)
    })
  })

  describe('Quality Impact on Scheduling', () => {
    it('should schedule appropriate reviews based on quality ratings', () => {
      const baseCard = {
        interval: 1,
        repetitions: 0,
        easeFactor: 2.5,
      }

      // Review with different qualities
      const poor = applySM2(baseCard, 0)    // Again
      const hard = applySM2(baseCard, 1)    // Hard
      const good = applySM2(baseCard, 2)    // Good
      const easy = applySM2(baseCard, 3)    // Easy

      // All should reset to interval 1 on first review
      expect(poor.interval).toBe(1)
      expect(hard.interval).toBe(1)
      expect(good.interval).toBe(1)
      expect(easy.interval).toBe(1)

      // But ease factors should differ
      expect(poor.easeFactor).toBeLessThan(hard.easeFactor)
      expect(hard.easeFactor).toBeLessThan(good.easeFactor)
      expect(good.easeFactor).toBeLessThan(easy.easeFactor)

      // Second review will show interval differences
      const poorSecond = applySM2(poor, 2)
      const easySecond = applySM2(easy, 2)

      expect(easySecond.interval).toBeGreaterThan(poorSecond.interval)
    })
  })

  describe('Mastery Score Progression', () => {
    it('should show realistic mastery progression', () => {
      const progressionData = []

      let card = {
        interval: 1,
        repetitions: 0,
        easeFactor: 2.5,
      }

      // Simulate 10 successful reviews
      for (let i = 0; i < 10; i++) {
        card = applySM2(card, 2)
        const score = 75 + Math.random() * 25 // Realistic score 75-100
        const mastery = calcMasteryScore(card.repetitions, card.easeFactor, score)
        progressionData.push({
          review: i + 1,
          mastery,
          interval: card.interval,
          repetitions: card.repetitions,
        })
      }

      // Mastery should generally increase
      expect(progressionData[9].mastery).toBeGreaterThan(progressionData[0].mastery)

      // Intervals should increase
      expect(progressionData[9].interval).toBeGreaterThan(progressionData[0].interval)

      // Intervals should follow SM-2 pattern roughly
      progressionData.forEach(({ interval }, idx) => {
        if (idx > 0) {
          // Interval shouldn't decrease (barring quality 0)
          expect(interval).toBeGreaterThanOrEqual(progressionData[idx - 1].interval)
        }
      })
    })
  })

  describe('Multiple Concepts', () => {
    it('should manage multiple concepts with different mastery levels', () => {
      const concepts = [
        {
          name: 'Easy Topic',
          state: { interval: 10, repetitions: 5, easeFactor: 2.9 },
          score: 95,
        },
        {
          name: 'Medium Topic',
          state: { interval: 3, repetitions: 2, easeFactor: 2.5 },
          score: 70,
        },
        {
          name: 'Hard Topic',
          state: { interval: 1, repetitions: 0, easeFactor: 2.0 },
          score: 50,
        },
      ]

      const masteryScores = concepts.map(
        ({ name, state, score }) => ({
          name,
          mastery: calcMasteryScore(state.repetitions, state.easeFactor, score),
        })
      )

      // Easy topic should have highest mastery
      expect(masteryScores[0].mastery).toBeGreaterThan(masteryScores[1].mastery)
      expect(masteryScores[1].mastery).toBeGreaterThan(masteryScores[2].mastery)
    })
  })

  describe('Edge Cases', () => {
    it('should handle minimum ease factor constraint', () => {
      let card = {
        interval: 1,
        repetitions: 1,
        easeFactor: 1.5, // Already low
      }

      // Multiple poor reviews should not go below 1.3
      for (let i = 0; i < 3; i++) {
        card = applySM2(card, 0)
      }

      expect(card.easeFactor).toBeGreaterThanOrEqual(1.3)
    })

    it('should handle zero interval gracefully', () => {
      const card = {
        interval: 0, // Edge case
        repetitions: 0,
        easeFactor: 2.5,
      }

      const result = applySM2(card, 2)
      expect(result.interval).toBeGreaterThan(0) // Should be 1
    })

    it('should handle very high repetition counts', () => {
      const card = {
        interval: 365,
        repetitions: 100,
        easeFactor: 3.0,
      }

      const result = applySM2(card, 3) // Easy
      expect(result.interval).toBeGreaterThan(300)
      expect(result.easeFactor).toBeGreaterThan(3.0)
    })
  })
})
