import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

/**
 * GET /api/inbox/[id] — one inbox item (used for status polling).
 */
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const item = await prisma.inboxItem.findFirst({
      where: { id: Number(id), userId: Number(user.userId) },
    })
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({ item })
  } catch (error) {
    console.error("GET /api/inbox/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/inbox/[id] — remove a capture. Concepts already added to the
 * review queue survive (inboxItemId is nulled via ON DELETE SET NULL) so
 * deleting a source article doesn't wipe learning progress.
 */
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const item = await prisma.inboxItem.findFirst({
      where: { id: Number(id), userId: Number(user.userId) },
      select: { id: true },
    })
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.inboxItem.delete({ where: { id: item.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/inbox/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
