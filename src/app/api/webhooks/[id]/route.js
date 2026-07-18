import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { WEBHOOK_EVENTS, hookToJson, validateWebhookUrl } from "@/lib/webhooks"

async function findOwnedHook(params, user) {
  const { id } = await params
  const idNum = Number(id)
  if (!Number.isInteger(idNum)) return null
  return prisma.webhook.findFirst({
    where: { id: idNum, userId: Number(user.userId) },
  })
}

/**
 * PATCH /api/webhooks/[id] — update url, events, label, or active.
 * Re-enabling a hook resets its failure counter.
 */
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const hook = await findOwnedHook(params, user)
    if (!hook) return NextResponse.json({ error: "Webhook not found" }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const data = {}

    if (body.url !== undefined) {
      try {
        data.url = validateWebhookUrl(body.url)
      } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 400 })
      }
    }

    if (body.events !== undefined) {
      if (!Array.isArray(body.events)) {
        return NextResponse.json({ error: "events must be an array" }, { status: 400 })
      }
      const invalid = body.events.filter((e) => !WEBHOOK_EVENTS.includes(e))
      if (invalid.length) {
        return NextResponse.json({ error: `Unknown events: ${invalid.join(", ")}` }, { status: 400 })
      }
      data.events = JSON.stringify([...new Set(body.events)])
    }

    if (body.label !== undefined) {
      data.label = typeof body.label === "string" ? body.label.trim().slice(0, 80) || null : null
    }

    if (typeof body.active === "boolean") {
      data.active = body.active
      if (body.active) data.failCount = 0
    }

    const updated = await prisma.webhook.update({ where: { id: hook.id }, data })
    return NextResponse.json({ webhook: hookToJson(updated) })
  } catch (error) {
    console.error("PATCH /api/webhooks/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/** DELETE /api/webhooks/[id] — remove the endpoint. */
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const hook = await findOwnedHook(params, user)
    if (!hook) return NextResponse.json({ error: "Webhook not found" }, { status: 404 })

    await prisma.webhook.delete({ where: { id: hook.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/webhooks/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
