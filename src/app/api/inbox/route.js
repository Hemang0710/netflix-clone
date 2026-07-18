import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import { validateBody } from "@/lib/schemas"
import { assertPublicHttpUrl } from "@/lib/inboxExtract"
import { captureFromFormData, normalizeCapture, processInboxItem } from "@/lib/inbox"

const captureSchema = z.object({
  url: z.string().max(2000).optional(),
  text: z.string().max(100_000).optional(),
  title: z.string().max(200).optional(),
  processNow: z.boolean().optional(),
})

/**
 * GET /api/inbox — the user's learning inbox, newest first.
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const items = await prisma.inboxItem.findMany({
      where: { userId: Number(user.userId) },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        sourceType: true,
        url: true,
        title: true,
        siteName: true,
        summary: true,
        concepts: true,
        status: true,
        error: true,
        createdAt: true,
        processedAt: true,
      },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error("GET /api/inbox error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/inbox — capture something into the learning inbox.
 * Accepts JSON { url?, text?, title?, processNow? } or multipart form-data
 * (fields: title/text/url, files: txt/md/pdf) from the PWA share sheet.
 */
export async function POST(request) {
  try {
    const { success } = await checkRateLimit(request, "ingest")
    if (!success) {
      return NextResponse.json({ error: "Too many captures — try again in a bit" }, { status: 429 })
    }

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = Number(user.userId)

    const contentType = request.headers.get("content-type") || ""
    let capture // { url, text, title, sourceType, rawText, siteName }
    let processNow = true

    if (contentType.includes("multipart/form-data")) {
      try {
        capture = await captureFromFormData(await request.formData())
      } catch (e) {
        return NextResponse.json({ error: e.message || "Couldn't read that file" }, { status: 400 })
      }
    } else {
      const validation = validateBody(captureSchema, await request.json())
      if (!validation.success) {
        return NextResponse.json({ error: "Invalid capture", errors: validation.errors }, { status: 400 })
      }
      const { url, text, title } = validation.data
      if (validation.data.processNow === false) processNow = false
      capture = normalizeCapture({ url, text, title })
    }

    if (!capture) {
      return NextResponse.json({ error: "Share a link, some text, or a file to capture it" }, { status: 400 })
    }

    // Fail fast on obviously bad/unsafe URLs instead of during processing
    if (capture.url && capture.sourceType !== "youtube") {
      try {
        assertPublicHttpUrl(capture.url)
      } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 400 })
      }
    }

    let item = await prisma.inboxItem.create({
      data: {
        userId,
        sourceType: capture.sourceType,
        url: capture.url || null,
        title: capture.title || null,
        siteName: capture.siteName || null,
        rawText: capture.rawText || null,
        status: "pending",
      },
    })

    if (processNow) {
      item = await processInboxItem(item.id, userId)
    }

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error("POST /api/inbox error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
