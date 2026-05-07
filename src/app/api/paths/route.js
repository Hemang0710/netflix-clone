import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import prisma from "@/lib/prisma"

export async function GET(request) {
  const { success } = await checkRateLimit(request, "api")
  if (!success) return NextResponse.json({ success: false }, { status: 429 })

  const { searchParams } = new URL(request.url)
  const mine = searchParams.get("mine") === "true"
  const user = await getCurrentUser()

  const paths = await prisma.learningPath.findMany({
    where: mine && user ? { creatorId: Number(user.userId) } : { isPublished: true },
    include: {
      creator: { select: { email: true, profile: { select: { name: true } } } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ success: true, data: paths })
}

export async function POST(request) {
  const { success } = await checkRateLimit(request, "api")
  if (!success) return NextResponse.json({ success: false }, { status: 429 })

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

  try {
    const { title, description, videoIds, coverUrl, isPublished, dripEnabled, dripSchedule } = await request.json()
    if (!title?.trim()) return NextResponse.json({ success: false, message: "title required" }, { status: 400 })

    const path = await prisma.learningPath.create({
      data: {
        title: title.trim(), description: description || null,
        videoIds: JSON.stringify(videoIds || []), coverUrl: coverUrl || null,
        isPublished: Boolean(isPublished), creatorId: Number(user.userId),
        dripEnabled: Boolean(dripEnabled),
        dripSchedule: JSON.stringify(dripSchedule || []),
      },
    })
    return NextResponse.json({ success: true, data: path }, { status: 201 })
  } catch (error) {
    console.error("[paths] error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
