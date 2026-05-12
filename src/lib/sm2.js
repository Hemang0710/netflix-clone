/**
 * SM-2 Spaced Repetition Algorithm
 * Extracted from /api/flashcards/review and adapted for concept mastery
 */

/**
 * Apply SM-2 algorithm to a card/concept
 * @param {Object} card - { interval, repetitions, easeFactor }
 * @param {number} quality - 0=Again, 1=Hard, 2=Good, 3=Easy
 * @returns {Object} - { interval, repetitions, easeFactor, dueDate }
 */
export function applySM2(card, quality) {
  let { interval, repetitions, easeFactor } = card

  if (quality === 0) {
    repetitions = 0
    interval = 1
  } else {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)

    repetitions += 1
  }

  // Update ease factor — clamp at 1.3 minimum
  easeFactor = easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02))
  if (easeFactor < 1.3) easeFactor = 1.3

  // Calculate next due date
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + interval)

  return { interval, repetitions, easeFactor, dueDate }
}

/**
 * Calculate mastery score (0-100) from SM-2 state
 * Blend of: repetition progress (0-50 points) + last review score (0-50 points)
 * @param {number} repetitions - SM-2 repetitions count
 * @param {number} easeFactor - SM-2 ease factor
 * @param {number} lastScore - 0-100 score from last review
 * @returns {number} - 0-100 mastery score
 */
export function calcMasteryScore(repetitions, easeFactor, lastScore = 0) {
  // Repetitions contribute up to 50 points (cap at 10 reps for 50 points)
  const repPoints = Math.min(repetitions * 5, 50)

  // Last score contributes up to 50 points
  const scorePoints = (lastScore || 0) * 0.5

  return Math.min(repPoints + scorePoints, 100)
}

/**
 * Generate forgetting curve data for visualization
 * Uses Ebbinghaus formula: R(t) = 100 * e^(-0.35 * t / interval)
 * @param {number} interval - SM-2 interval (days)
 * @param {number} easeFactor - SM-2 ease factor
 * @returns {Array} - [{ day: 0, retention: 100 }, { day: 1, retention: 95.8 }, ...]
 */
export function getForgettingCurve(interval, easeFactor) {
  const data = []
  const decayConstant = 0.35

  for (let t = 0; t <= 30; t++) {
    const retention = Math.max(0, 100 * Math.exp((-decayConstant * t) / interval))
    data.push({
      day: t,
      retention: Math.round(retention * 10) / 10, // round to 1 decimal
    })
  }

  return data
}

/**
 * Determine if a concept is overdue for review
 * @param {Date} dueDate - the due date
 * @returns {boolean}
 */
export function isOverdue(dueDate) {
  return new Date() >= dueDate
}

/**
 * Days until review is due (can be negative if overdue)
 * @param {Date} dueDate
 * @returns {number} - days until due (negative = overdue)
 */
export function daysUntilDue(dueDate) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24))
}
