import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import { EXPORT_FORMATS, buildExportFiles } from "@/lib/exporter"
import { buildZip } from "@/lib/zip"

export const dynamic = "force-dynamic"

/**
 * GET /api/export?format=obsidian|notion|json — download the user's whole
 * learning graph.
 *
 * - obsidian: zip of Markdown notes with wikilinks — open as a vault
 * - notion:   zip of plain Markdown + concepts.csv — Notion's MD/CSV importer
 * - json:     machine-readable dump (backups, custom scripts)
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Whole-account reads are heavy — reuse the ingest budget (30/h)
    const rate = await checkRateLimit(request, "ingest")
    if (!rate.success) {
      return NextResponse.json({ error: "Too many exports — try again in a bit" }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "obsidian"
    if (!EXPORT_FORMATS.includes(format)) {
      return NextResponse.json(
        { error: `Unknown format — use one of: ${EXPORT_FORMATS.join(", ")}` },
        { status: 400 }
      )
    }

    const userId = Number(user.userId)
    const contentRef = { select: { id: true, title: true } }
    const [concepts, notes, highlights, inboxItems, teachBackSessions, projectBriefs] =
      await Promise.all([
        prisma.conceptMastery.findMany({
          where: { userId },
          include: { content: contentRef, inboxItem: { select: { id: true, title: true } } },
          orderBy: { concept: "asc" },
        }),
        prisma.note.findMany({
          where: { userId },
          include: { content: contentRef },
          orderBy: { createdAt: "asc" },
        }),
        prisma.highlight.findMany({
          where: { userId },
          include: { content: contentRef },
          orderBy: { createdAt: "asc" },
        }),
        prisma.inboxItem.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
        prisma.teachBackSession.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
        prisma.projectBrief.findMany({
          where: { userId },
          include: { checkpoints: true },
          orderBy: { createdAt: "asc" },
        }),
      ])

    const now = new Date()
    const stamp = now.toISOString().slice(0, 10)

    if (format === "json") {
      return NextResponse.json(
        {
          exportedAt: now.toISOString(),
          concepts,
          notes,
          highlights,
          inboxItems,
          teachBackSessions,
          projectBriefs,
        },
        {
          headers: {
            "Content-Disposition": `attachment; filename="learnai-export-${stamp}.json"`,
          },
        }
      )
    }

    const files = buildExportFiles(
      { concepts, notes, highlights, inboxItems, teachBackSessions, projectBriefs },
      { flavor: format, now, appUrl: process.env.NEXT_PUBLIC_APP_URL || "" }
    )
    const zip = buildZip(files, { now })

    return new NextResponse(zip, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="learnai-${format}-export-${stamp}.zip"`,
        "Content-Length": String(zip.length),
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("GET /api/export error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
