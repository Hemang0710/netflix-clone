import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false }, { status: 401 })

    const { id } = await params

    const content = await prisma.externalContent.findUnique({
      where: { id: Number(id) },
    })

    if (!content || content.userId !== Number(user.userId)) {
      return NextResponse.json({ success: false }, { status: 403 })
    }

    await prisma.externalContent.delete({ where: { id: Number(id) } })

    return NextResponse.json({ success: true })

  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}