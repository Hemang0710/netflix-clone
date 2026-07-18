// Study autopilot: instead of making the user plan, turn their SM-2 due
// queue into concrete review slots inside their preferred study window
// ("Mon–Fri, 6–9pm, two 25-minute slots max") and serve the result as an
// iCal feed any calendar app can subscribe to.
//
// Pure functions only — no prisma/network — so the packing logic and iCal
// serialization stay cheap to unit test.

import crypto from "crypto"

const MS_PER_DAY = 86_400_000
export const SECONDS_PER_CONCEPT = 45 // matches the forgetting-forecast estimate
export const DEFAULT_HORIZON_DAYS = 14
export const MAX_HORIZON_DAYS = 30

export const AUTOPILOT_DEFAULTS = {
  enabled: true,
  studyDays: [1, 2, 3, 4, 5], // Mon–Fri
  startHour: 18,
  endHour: 21,
  slotMinutes: 25,
  maxSlotsPerDay: 2,
  timezone: "UTC",
}

/** Secret path segment for the personal iCal feed URL. */
export function newCalendarToken() {
  return crypto.randomBytes(24).toString("base64url")
}

/** JSON column → array of unique weekday ints 0-6 (falls back to Mon–Fri). */
export function parseStudyDays(json) {
  try {
    const arr = JSON.parse(json)
    const days = [...new Set(arr.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))]
    return days.length ? days.sort((a, b) => a - b) : [...AUTOPILOT_DEFAULTS.studyDays]
  } catch {
    return [...AUTOPILOT_DEFAULTS.studyDays]
  }
}

export function isValidTimezone(tz) {
  if (typeof tz !== "string" || !tz) return false
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** Offset (ms) of `tz` from UTC at the given instant. */
function tzOffsetMs(tz, utcDate) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  const parts = Object.fromEntries(dtf.formatToParts(utcDate).map((p) => [p.type, p.value]))
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  )
  return asUtc - utcDate.getTime()
}

/**
 * The UTC instant of a wall-clock time in `tz`. Accurate to within one DST
 * transition (good enough for study-slot scheduling).
 */
export function wallTimeToUtc({ year, month, day, hour = 0, minute = 0 }, tz) {
  const guess = Date.UTC(year, month - 1, day, hour, minute)
  const offset = tzOffsetMs(tz, new Date(guess))
  return new Date(guess - offset)
}

/** Calendar date + weekday of an instant as seen from `tz`. */
function localDateParts(utcDate, tz) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  })
  const parts = Object.fromEntries(dtf.formatToParts(utcDate).map((p) => [p.type, p.value]))
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday)
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), weekday }
}

const pad = (n) => String(n).padStart(2, "0")
const dateKey = ({ year, month, day }) => `${year}-${pad(month)}-${pad(day)}`

/**
 * Pack due concepts into study slots for the coming days.
 *
 * Rules: a concept lands on the first study day on/after its due date (backlog
 * lands today); each day holds at most `maxSlotsPerDay` slots of `slotMinutes`
 * inside the [startHour, endHour) window; overflow rolls to the next study day.
 *
 * @param {Array} concepts ConceptMastery rows ({ id, concept, dueDate, masteryScore })
 * @param {object} settings AutopilotSettings row (studyDays as JSON string or array)
 * @param {{ now?: Date, horizonDays?: number }} opts
 * @returns {{ slots: Array, totalConcepts: number, unscheduled: number, horizonDays: number }}
 */
export function buildSchedule(concepts, settings, { now = new Date(), horizonDays = DEFAULT_HORIZON_DAYS } = {}) {
  const tz = isValidTimezone(settings.timezone) ? settings.timezone : "UTC"
  const studyDays = Array.isArray(settings.studyDays)
    ? settings.studyDays
    : parseStudyDays(settings.studyDays)
  const startHour = clamp(settings.startHour, 0, 23, AUTOPILOT_DEFAULTS.startHour)
  const endHour = clamp(settings.endHour, startHour + 1, 24, Math.min(startHour + 3, 24))
  const slotMinutes = clamp(settings.slotMinutes, 10, 120, AUTOPILOT_DEFAULTS.slotMinutes)
  const windowMinutes = (endHour - startHour) * 60
  const maxSlotsPerDay = Math.min(
    clamp(settings.maxSlotsPerDay, 1, 6, AUTOPILOT_DEFAULTS.maxSlotsPerDay),
    Math.max(1, Math.floor(windowMinutes / slotMinutes))
  )
  const perSlot = Math.max(1, Math.floor((slotMinutes * 60) / SECONDS_PER_CONCEPT))
  horizonDays = clamp(horizonDays, 1, MAX_HORIZON_DAYS, DEFAULT_HORIZON_DAYS)

  // Queue of concepts that need a review inside the horizon, soonest first
  const horizonEnd = new Date(now.getTime() + horizonDays * MS_PER_DAY)
  const queue = (concepts || [])
    .filter((c) => c.dueDate && new Date(c.dueDate) <= horizonEnd)
    .map((c) => ({
      id: c.id,
      concept: c.concept,
      due: new Date(c.dueDate),
      masteryScore: c.masteryScore || 0,
    }))
    .sort((a, b) => a.due - b.due || b.masteryScore - a.masteryScore)

  const slots = []
  let scheduled = 0
  let queueIdx = 0

  for (let d = 0; d < horizonDays && queueIdx < queue.length; d++) {
    const dayInstant = new Date(now.getTime() + d * MS_PER_DAY)
    const local = localDateParts(dayInstant, tz)
    if (!studyDays.includes(local.weekday)) continue

    // Everything due before this day's window closes is eligible (backlog included)
    const windowEnd = wallTimeToUtc({ ...local, hour: endHour === 24 ? 23 : endHour, minute: endHour === 24 ? 59 : 0 }, tz)
    if (d === 0 && windowEnd <= now) continue // today's window already over

    const eligible = []
    while (
      queueIdx < queue.length &&
      eligible.length < perSlot * maxSlotsPerDay &&
      queue[queueIdx].due <= windowEnd
    ) {
      eligible.push(queue[queueIdx++])
    }
    if (!eligible.length) continue

    const slotCount = Math.min(maxSlotsPerDay, Math.ceil(eligible.length / perSlot))
    for (let i = 0; i < slotCount; i++) {
      const chunk = eligible.slice(i * perSlot, (i + 1) * perSlot)
      if (!chunk.length) break
      const startMinute = startHour * 60 + i * slotMinutes
      const start = wallTimeToUtc(
        { ...local, hour: Math.floor(startMinute / 60), minute: startMinute % 60 },
        tz
      )
      const end = new Date(start.getTime() + slotMinutes * 60_000)
      slots.push({
        date: dateKey(local),
        start: start.toISOString(),
        end: end.toISOString(),
        minutes: slotMinutes,
        conceptCount: chunk.length,
        concepts: chunk.map((c) => c.concept),
        estimatedMinutes: Math.max(1, Math.ceil((chunk.length * SECONDS_PER_CONCEPT) / 60)),
      })
      scheduled += chunk.length
    }
  }

  return {
    slots,
    totalConcepts: queue.length,
    scheduled,
    unscheduled: queue.length - scheduled,
    horizonDays,
  }
}

function clamp(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(Math.round(n), min), max)
}

// ---------------------------------------------------------------------------
// iCal serialization (RFC 5545)
// ---------------------------------------------------------------------------

const icalDate = (date) =>
  new Date(date)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z")

/** Escape TEXT values: backslash, semicolon, comma, newline. */
export function icalEscape(text) {
  return String(text ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n")
}

/** Fold content lines longer than 75 octets (RFC 5545 §3.1). */
function foldLine(line) {
  if (line.length <= 75) return line
  const out = []
  let rest = line
  while (rest.length > 75) {
    out.push(rest.slice(0, 75))
    rest = " " + rest.slice(75)
  }
  out.push(rest)
  return out.join("\r\n")
}

/**
 * Serialize study slots into an iCal feed.
 * UIDs are stable per (date, index) so calendar apps update events in place
 * instead of duplicating them on every refresh.
 */
export function buildICalFeed(slots, { name = "LearnAI Study Autopilot", appUrl = "", now = new Date() } = {}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LearnAI//Study Autopilot//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icalEscape(name)}`,
    "X-WR-CALDESC:Spaced-repetition review slots scheduled by LearnAI",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ]

  const stamp = icalDate(now)
  const perDayIndex = new Map()
  for (const slot of slots || []) {
    const idx = perDayIndex.get(slot.date) || 0
    perDayIndex.set(slot.date, idx + 1)

    const preview = slot.concepts.slice(0, 6).join(", ")
    const extra = slot.conceptCount - Math.min(slot.concepts.length, 6)
    const description =
      `Review ${slot.conceptCount} concept${slot.conceptCount === 1 ? "" : "s"}: ${preview}` +
      (extra > 0 ? ` and ${extra} more` : "") +
      (appUrl ? `\nStart your session: ${appUrl}/learn#daily-review` : "")

    lines.push(
      "BEGIN:VEVENT",
      `UID:learnai-autopilot-${slot.date}-${idx}@learnai`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icalDate(slot.start)}`,
      `DTEND:${icalDate(slot.end)}`,
      `SUMMARY:${icalEscape(`📚 LearnAI review — ${slot.conceptCount} concept${slot.conceptCount === 1 ? "" : "s"}`)}`,
      `DESCRIPTION:${icalEscape(description)}`,
      ...(appUrl ? [`URL:${icalEscape(`${appUrl}/learn#daily-review`)}`] : []),
      "TRANSP:OPAQUE",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Time to review before you forget",
      "TRIGGER:-PT10M",
      "END:VALARM",
      "END:VEVENT"
    )
  }

  lines.push("END:VCALENDAR")
  return lines.map(foldLine).join("\r\n") + "\r\n"
}
