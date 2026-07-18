import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import { deliverWebhook } from "@/lib/webhooks"

/**
 * POST /api/webhooks/[id]/test — send a signed "ping" delivery so the user
 * can verify their endpoint and signature check before relying on it.
 */
export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rate = await checkRateLimit(request, "api")
    if (!rate.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const { id } = await params
    const idNum = Number(id)
    if (!Number.isInteger(idNum)) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    const hook = await prisma.webhook.findFirst({
      where: { id: idNum, userId: Number(user.userId) },
    })
    if (!hook) return NextResponse.json({ error: "Webhook not found" }, { status: 404 })

    const result = await deliverWebhook(hook, "ping", {
      message: "LearnAI webhook test delivery",
    })

    await prisma.webhook.update({
      where: { id: hook.id },
      data: {
        lastStatus: result.status,
        lastError: result.error,
        lastTriggeredAt: new Date(),
        ...(result.ok && { failCount: 0 }),
      },
    })

    return NextResponse.json({ ok: result.ok, status: result.status, error: result.error })
  } catch (error) {
    console.error("POST /api/webhooks/[id]/test error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
