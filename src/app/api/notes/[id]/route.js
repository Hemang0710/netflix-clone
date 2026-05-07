import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import prisma from "@/lib/prisma"

export async function DELETE(request, { params }) {
  const { success } = await checkRateLimit(request, "api")
  if (!success) return NextResponse.json({ success: false }, { status: 429 })

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const note = await prisma.note.findUnique({ where: { id: Number(id) } })
  if (!note) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })
  if (note.userId !== Number(user.userId)) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })

  await prisma.note.delete({ where: { id: Number(id) } })
  return NextResponse.json({ success: true })
}
