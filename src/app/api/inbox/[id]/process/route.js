import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import { processInboxItem } from "@/lib/inbox"
import { dispatchWebhooks } from "@/lib/webhooks"

/**
 * POST /api/inbox/[id]/process — run (or retry) extraction for a capture.
 * Idempotent for ready/in-flight items; used by the inbox page to process
 * items created by the PWA share-target redirect.
 */
export async function POST(request, { params }) {
  try {
    const { success } = await checkRateLimit(request, "ingest")
    if (!success) {
      return NextResponse.json({ error: "Too many captures — try again in a bit" }, { status: 429 })
    }

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    let item
    try {
      item = await processInboxItem(Number(id), Number(user.userId))
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 404 })
    }

    if (item?.status === "ready") {
      await dispatchWebhooks(Number(user.userId), "inbox.processed", {
        itemId: item.id,
        title: item.title,
        sourceType: item.sourceType,
        url: item.url,
        conceptCount: Array.isArray(item.concepts) ? item.concepts.length : 0,
      })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error("POST /api/inbox/[id]/process error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
