import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import prisma from "@/lib/prisma"

export async function GET(request, { params }) {
  const { id } = await params
  const path = await prisma.learningPath.findUnique({
    where: { id: Number(id) },
    include: {
      creator: { select: { email: true, profile: { select: { name: true } } } },
      _count: { select: { enrollments: true } },
    },
  })
  if (!path) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })

  const videoIds = JSON.parse(path.videoIds || "[]")
  const videos = videoIds.length
    ? await prisma.content.findMany({ where: { id: { in: videoIds } }, select: { id: true, title: true, thumbnailUrl: true, duration: true, difficulty: true, genre: true } })
    : []

  const ordered = videoIds.map(vid => videos.find(v => v.id === vid)).filter(Boolean)
  return NextResponse.json({ success: true, data: { ...path, videos: ordered } })
}

export async function PUT(request, { params }) {
  const { success } = await checkRateLimit(request, "api")
  if (!success) return NextResponse.json({ success: false }, { status: 429 })
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const path = await prisma.learningPath.findUnique({ where: { id: Number(id) } })
  if (!path || path.creatorId !== Number(user.userId)) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })

  const { title, description, videoIds, isPublished, dripEnabled, dripSchedule } = await request.json()
  const updated = await prisma.learningPath.update({
    where: { id: Number(id) },
    data: {
      title, description, videoIds: JSON.stringify(videoIds || []), isPublished: Boolean(isPublished),
      dripEnabled: Boolean(dripEnabled), dripSchedule: JSON.stringify(dripSchedule || []),
    },
  })
  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(request, { params }) {
  const { success } = await checkRateLimit(request, "api")
  if (!success) return NextResponse.json({ success: false }, { status: 429 })
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const path = await prisma.learningPath.findUnique({ where: { id: Number(id) } })
  if (!path || path.creatorId !== Number(user.userId)) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })

  await prisma.$transaction([
    prisma.certificate.deleteMany({ where: { pathId: Number(id) } }),
    prisma.pathEnrollment.deleteMany({ where: { pathId: Number(id) } }),
    prisma.learningPath.delete({ where: { id: Number(id) } }),
  ])
  return NextResponse.json({ success: true })
}
