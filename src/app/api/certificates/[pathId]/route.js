import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request, { params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

  const { pathId } = await params
  const cert = await prisma.certificate.findUnique({
    where: { userId_pathId: { userId: Number(user.userId), pathId: Number(pathId) } },
    include: {
      path: { select: { title: true, description: true } },
      user: { select: { email: true, profile: { select: { name: true } } } },
    },
  })
  if (!cert) return NextResponse.json({ success: false, message: "No certificate" }, { status: 404 })
  return NextResponse.json({ success: true, data: cert })
}
