import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { captureFromFormData } from "@/lib/inbox"

/**
 * PWA Web Share Target endpoint (see public/manifest.json).
 * The OS share sheet POSTs multipart form-data here; we stash the capture as
 * a pending InboxItem and bounce to /inbox, which triggers processing —
 * keeping this response instant so the share sheet never feels hung.
 */
export async function POST(request) {
  const to = (path) => NextResponse.redirect(new URL(path, request.url), 303)

  try {
    const user = await getCurrentUser()
    if (!user) return to("/login?next=/inbox")

    let capture = null
    let captureError = null
    try {
      capture = await captureFromFormData(await request.formData())
    } catch (e) {
      captureError = e.message || "Couldn't read the shared content"
    }

    if (!capture && !captureError) {
      return to("/inbox?shared=empty")
    }

    await prisma.inboxItem.create({
      data: capture
        ? {
            userId: Number(user.userId),
            sourceType: capture.sourceType,
            url: capture.url || null,
            title: capture.title || null,
            rawText: capture.rawText || null,
            status: "pending",
          }
        : {
            // Surface unreadable shares in the inbox instead of dropping them
            userId: Number(user.userId),
            sourceType: "text",
            title: "Shared content",
            status: "failed",
            error: captureError,
          },
    })

    return to("/inbox?shared=1")
  } catch (error) {
    console.error("POST /share error:", error)
    return to("/inbox?shared=error")
  }
}

/** Direct navigation to /share (no POST body) just opens the inbox. */
export async function GET(request) {
  return NextResponse.redirect(new URL("/inbox", request.url), 303)
}
