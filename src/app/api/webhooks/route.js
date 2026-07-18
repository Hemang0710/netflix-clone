import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import {
  MAX_WEBHOOKS_PER_USER,
  WEBHOOK_EVENTS,
  hookToJson,
  newWebhookSecret,
  validateWebhookUrl,
} from "@/lib/webhooks"

function validateEvents(raw) {
  if (raw === undefined) return { events: "[]" }
  if (!Array.isArray(raw)) return { error: "events must be an array" }
  const invalid = raw.filter((e) => !WEBHOOK_EVENTS.includes(e))
  if (invalid.length) {
    return { error: `Unknown events: ${invalid.join(", ")}. Valid: ${WEBHOOK_EVENTS.join(", ")}` }
  }
  return { events: JSON.stringify([...new Set(raw)]) }
}

/** GET /api/webhooks — the user's webhooks (secrets never re-shown). */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const hooks = await prisma.webhook.findMany({
      where: { userId: Number(user.userId) },
      orderBy: { createdAt: "asc" },
    })
    return NextResponse.json({
      webhooks: hooks.map((h) => hookToJson(h)),
      availableEvents: WEBHOOK_EVENTS,
    })
  } catch (error) {
    console.error("GET /api/webhooks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/webhooks — register an endpoint.
 * Body: { url, events?, label? }. The signing secret is returned once —
 * store it; it cannot be retrieved again.
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rate = await checkRateLimit(request, "api")
    if (!rate.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json().catch(() => ({}))

    let url
    try {
      url = validateWebhookUrl(body.url)
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }

    const { events, error: eventsError } = validateEvents(body.events)
    if (eventsError) return NextResponse.json({ error: eventsError }, { status: 400 })

    const label = typeof body.label === "string" ? body.label.trim().slice(0, 80) || null : null

    const userId = Number(user.userId)
    const count = await prisma.webhook.count({ where: { userId } })
    if (count >= MAX_WEBHOOKS_PER_USER) {
      return NextResponse.json(
        { error: `Webhook limit reached (${MAX_WEBHOOKS_PER_USER}) — delete one first` },
        { status: 400 }
      )
    }

    const hook = await prisma.webhook.create({
      data: { userId, url, events, label, secret: newWebhookSecret() },
    })

    return NextResponse.json(
      { webhook: hookToJson(hook, { includeSecret: true }) },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/webhooks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
