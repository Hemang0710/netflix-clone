import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { briefToJson } from "@/lib/projectBridge"

/**
 * PATCH /api/projects/bridges/[briefId] — update a brief's status.
 * Body: { status: "abandoned" | "active" }. Completion is never set here —
 * it happens automatically when the last checkpoint passes.
 */
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { briefId } = await params
    const id = Number(briefId)
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid brief id" }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    if (!["abandoned", "active"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const existing = await prisma.projectBrief.findFirst({
      where: { id, userId: Number(user.userId) },
      select: { id: true, status: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    if (existing.status === "completed") {
      return NextResponse.json({ error: "Completed projects can't change status" }, { status: 400 })
    }

    const brief = await prisma.projectBrief.update({
      where: { id },
      data: { status: body.status },
      include: { checkpoints: { orderBy: { order: "asc" } } },
    })

    return NextResponse.json({ brief: briefToJson(brief) })
  } catch (error) {
    console.error("PATCH /api/projects/bridges/[briefId] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
