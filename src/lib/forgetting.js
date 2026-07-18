// Forgetting forecast: project each concept's memory retention forward using
// its SM-2 state and surface what's about to decay — "you'll forget Recursion
// by Friday — a 3-minute review now saves re-learning it."
//
// Retention model matches getForgettingCurve() in sm2.js:
//   R(t) = 100 * e^(-DECAY * t / stability), stability ≈ SM-2 interval (days)

const DECAY = 0.35
const MS_PER_DAY = 86_400_000
export const DEFAULT_THRESHOLD = 70 // % retention where we call it "forgotten"
const SECONDS_PER_REVIEW = 45 // rough time to review one concept

function startOfDay(d) {
  const day = new Date(d)
  day.setHours(0, 0, 0, 0)
  return day
}

function stabilityOf(concept) {
  return Math.max(Number(concept.interval) || 1, 1)
}

function anchorOf(concept) {
  return new Date(concept.lastReviewAt || concept.createdAt || Date.now())
}

/** A concept only decays if the user actually learned it at some point. */
export function isTrackable(concept) {
  return (
    (concept.repetitions || 0) > 0 ||
    (concept.reviewCount || 0) > 0 ||
    (concept.lastScore || 0) > 0
  )
}

/** Current estimated retention 0-100. */
export function estimateRetention(concept, now = new Date()) {
  const days = Math.max(0, (now - anchorOf(concept)) / MS_PER_DAY)
  const retention = 100 * Math.exp((-DECAY * days) / stabilityOf(concept))
  return Math.max(0, Math.min(100, retention))
}

/** The date retention is projected to cross `threshold`. */
export function projectForgetDate(concept, threshold = DEFAULT_THRESHOLD) {
  const daysToThreshold = (stabilityOf(concept) * Math.log(100 / threshold)) / DECAY
  return new Date(anchorOf(concept).getTime() + daysToThreshold * MS_PER_DAY)
}

/** "Today" / "Tomorrow" / "Friday" / "Jan 5" relative to now. */
export function dayLabel(date, now = new Date()) {
  const diff = Math.round((startOfDay(date) - startOfDay(now)) / MS_PER_DAY)
  if (diff <= 0) return "Today"
  if (diff === 1) return "Tomorrow"
  if (diff < 7) return date.toLocaleDateString("en-US", { weekday: "long" })
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function toEntry(concept, now, threshold) {
  const forgetDate = projectForgetDate(concept, threshold)
  return {
    id: concept.id,
    concept: concept.concept,
    retentionNow: Math.round(estimateRetention(concept, now)),
    forgetDate: forgetDate.toISOString(),
    forgetLabel: dayLabel(forgetDate, now),
    daysLeft: Math.round((startOfDay(forgetDate) - startOfDay(now)) / MS_PER_DAY),
    masteryScore: Math.round(concept.masteryScore || 0),
    source: concept.source,
    contentId: concept.contentId ?? null,
    contentTitle: concept.content?.title ?? null,
  }
}

/**
 * Build the full forecast payload from a user's ConceptMastery rows.
 * @param {Array} concepts raw rows (optionally with content: { title })
 * @param {{ now?: Date, days?: number, threshold?: number }} opts
 */
export function buildForecast(concepts, { now = new Date(), days = 7, threshold = DEFAULT_THRESHOLD } = {}) {
  const tracked = (concepts || []).filter(isTrackable)
  const entries = tracked.map((c) => toEntry(c, now, threshold))

  const atRiskNow = entries
    .filter((e) => e.daysLeft <= 0 || e.retentionNow < threshold)
    .sort((a, b) => a.retentionNow - b.retentionNow)

  const atRiskIds = new Set(atRiskNow.map((e) => e.id))
  const horizon = entries
    .filter((e) => !atRiskIds.has(e.id) && e.daysLeft > 0 && e.daysLeft <= days)
    .sort((a, b) => a.daysLeft - b.daysLeft || b.masteryScore - a.masteryScore)

  // Group the upcoming decay by calendar day
  const byDay = new Map()
  for (const entry of horizon) {
    const key = entry.forgetDate.slice(0, 10)
    if (!byDay.has(key)) {
      byDay.set(key, { date: key, label: entry.forgetLabel, concepts: [] })
    }
    byDay.get(key).concepts.push(entry)
  }

  // Headline: the concept you've invested the most in that decays soonest
  const headlinePool = [...atRiskNow, ...horizon.filter((e) => e.daysLeft <= 3)]
  const headlineEntry = headlinePool.sort(
    (a, b) => b.masteryScore - a.masteryScore || a.daysLeft - b.daysLeft
  )[0] || null

  const saveCount = atRiskNow.length + horizon.filter((e) => e.daysLeft <= 2).length
  const minutes = saveCount > 0 ? Math.max(1, Math.ceil((saveCount * SECONDS_PER_REVIEW) / 60)) : 0

  return {
    generatedAt: now.toISOString(),
    threshold,
    horizonDays: days,
    totalTracked: tracked.length,
    atRiskNow,
    upcoming: [...byDay.values()],
    headline: headlineEntry
      ? {
          concept: headlineEntry.concept,
          when: headlineEntry.daysLeft <= 0 ? "already fading" : `by ${headlineEntry.forgetLabel}`,
          daysLeft: headlineEntry.daysLeft,
          retentionNow: headlineEntry.retentionNow,
        }
      : null,
    reviewEstimate: { concepts: saveCount, minutes },
  }
}

/**
 * Compact digest for notifications/email — the "5-minute save".
 * @returns null when there's nothing worth nagging about
 */
export function buildDigest(forecast) {
  const { atRiskNow, upcoming, reviewEstimate, headline } = forecast
  const soon = upcoming.flatMap((d) => d.concepts).filter((c) => c.daysLeft <= 2)
  if (!atRiskNow.length && !soon.length) return null

  const names = [...atRiskNow, ...soon].slice(0, 3).map((c) => c.concept)
  const extra = atRiskNow.length + soon.length - names.length

  const minutes = Math.max(reviewEstimate.minutes, 1)
  return {
    subject: headline
      ? headline.daysLeft <= 0
        ? `${headline.concept} is already fading — save it in ${minutes} min`
        : `You'll forget ${headline.concept} ${headline.when} — save it in ${minutes} min`
      : `${atRiskNow.length + soon.length} concepts are fading — quick review?`,
    headline,
    conceptNames: names,
    conceptCount: atRiskNow.length + soon.length,
    minutes,
    body:
      `${names.join(", ")}${extra > 0 ? ` and ${extra} more` : ""} ` +
      `${atRiskNow.length + soon.length === 1 ? "is" : "are"} about to slip away. ` +
      `A ${minutes}-minute review now beats re-learning later.`,
  }
}
