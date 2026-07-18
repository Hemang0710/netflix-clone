// Outbound webhooks: signed JSON POSTs to user-configured endpoints on
// learning events, so self-hosters can pipe LearnAI into Obsidian plugins,
// Notion automations, Zapier/n8n, or their own scripts.
//
// Delivery is best-effort from the request path (no queue): failures never
// break the triggering request, and an endpoint that keeps failing is
// auto-disabled instead of being retried forever.
import crypto from "crypto"
import prisma from "@/lib/prisma"
import { assertPublicHttpUrl } from "@/lib/inboxExtract"

export const WEBHOOK_EVENTS = [
  "review.completed", // a concept was reviewed (SM-2 committed)
  "concept.mastered", // a concept's mastery score crossed the mastered bar
  "teachback.completed", // a Feynman teach-back attempt was graded
  "project.completed", // all checkpoints of a project bridge passed
  "inbox.processed", // an inbox capture finished concept extraction
]

export const MAX_WEBHOOKS_PER_USER = 10
export const DISABLE_AFTER_FAILURES = 8
export const MASTERED_SCORE = 80
const DELIVERY_TIMEOUT_MS = 8_000
const MAX_ERROR_LEN = 300

/** New signing secret, shown to the user once at creation. */
export function newWebhookSecret() {
  return "whsec_" + crypto.randomBytes(24).toString("base64url")
}

/**
 * Signature for a delivery: HMAC-SHA256 over "<timestamp>.<body>".
 * Sent as "X-LearnAI-Signature: t=<unix seconds>,v1=<hex>"; receivers verify
 * with their secret and reject stale timestamps to stop replay.
 */
export function signWebhook(secret, timestamp, body) {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")
}

/**
 * Validate a user-supplied endpoint URL. Same SSRF rules as the inbox
 * importer, plus https-only in production (secrets travel in the payload
 * signature — don't let them leak over plaintext).
 */
export function validateWebhookUrl(rawUrl) {
  const parsed = assertPublicHttpUrl(rawUrl)
  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
    throw new Error("Webhook URLs must use https")
  }
  return parsed.toString()
}

/** Parse the events JSON column; empty array means "all events". */
export function parseEvents(json) {
  try {
    const arr = JSON.parse(json)
    return Array.isArray(arr) ? arr.filter((e) => typeof e === "string") : []
  } catch {
    return []
  }
}

/** API shape of a webhook row. Secrets are only included at creation time. */
export function hookToJson(hook, { includeSecret = false } = {}) {
  return {
    id: hook.id,
    url: hook.url,
    label: hook.label,
    events: parseEvents(hook.events),
    active: hook.active,
    failCount: hook.failCount,
    lastStatus: hook.lastStatus,
    lastError: hook.lastError,
    lastTriggeredAt: hook.lastTriggeredAt,
    createdAt: hook.createdAt,
    ...(includeSecret && { secret: hook.secret }),
  }
}

export function hookSubscribesTo(hook, event) {
  const events = parseEvents(hook.events)
  return events.length === 0 || events.includes(event)
}

/** POST one payload to one endpoint. Returns { ok, status, error }. */
export async function deliverWebhook(hook, event, data, { now = new Date(), fetchImpl = fetch } = {}) {
  const timestamp = Math.floor(now.getTime() / 1000)
  const body = JSON.stringify({
    id: `evt_${crypto.randomBytes(9).toString("base64url")}`,
    event,
    createdAt: now.toISOString(),
    data,
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS)
  try {
    const response = await fetchImpl(hook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "LearnAI-Webhooks/1.0",
        "X-LearnAI-Event": event,
        "X-LearnAI-Webhook-Id": String(hook.id),
        "X-LearnAI-Signature": `t=${timestamp},v1=${signWebhook(hook.secret, timestamp, body)}`,
      },
      body,
      redirect: "error", // a redirect could smuggle the delivery to a private host
      signal: controller.signal,
    })
    return {
      ok: response.ok,
      status: response.status,
      error: response.ok ? null : `Endpoint responded ${response.status}`,
    }
  } catch (error) {
    return {
      ok: false,
      status: null,
      error: (error?.name === "AbortError" ? "Delivery timed out" : error?.message || "Delivery failed").slice(0, MAX_ERROR_LEN),
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Fire an event to every matching active webhook of a user.
 * Never throws — call it inline from route handlers after the main work.
 */
export async function dispatchWebhooks(userId, event, data) {
  try {
    const hooks = await prisma.webhook.findMany({
      where: { userId: Number(userId), active: true },
    })
    const matching = hooks.filter((h) => hookSubscribesTo(h, event))
    if (!matching.length) return { delivered: 0 }

    let delivered = 0
    await Promise.all(
      matching.map(async (hook) => {
        const result = await deliverWebhook(hook, event, data)
        if (result.ok) delivered++
        const failCount = result.ok ? 0 : hook.failCount + 1
        try {
          await prisma.webhook.update({
            where: { id: hook.id },
            data: {
              failCount,
              lastStatus: result.status,
              lastError: result.error,
              lastTriggeredAt: new Date(),
              ...(failCount >= DISABLE_AFTER_FAILURES && { active: false }),
            },
          })
        } catch {
          // status bookkeeping must never break the triggering request
        }
      })
    )
    return { delivered }
  } catch (error) {
    console.error(`dispatchWebhooks(${event}) error:`, error)
    return { delivered: 0 }
  }
}
