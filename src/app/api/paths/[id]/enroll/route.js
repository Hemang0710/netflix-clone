import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import prisma from "@/lib/prisma"

export async function POST(request, { params }) {
  const { success } = await checkRateLimit(request, "api")
  if (!success) return NextResponse.json({ success: false }, { status: 429 })
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const enrollment = await prisma.pathEnrollment.upsert({
    where: { userId_pathId: { userId: Number(user.userId), pathId: Number(id) } },
    create: { userId: Number(user.userId), pathId: Number(id), completedIds: "[]" },
    update: {},
  })
  return NextResponse.json({ success: true, data: enrollment })
}

export async function PUT(request, { params }) {
  const { success } = await checkRateLimit(request, "api")
  if (!success) return NextResponse.json({ success: false }, { status: 429 })
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { completedVideoId } = await request.json()

  const enrollment = await prisma.pathEnrollment.findUnique({
    where: { userId_pathId: { userId: Number(user.userId), pathId: Number(id) } },
  })
  if (!enrollment) return NextResponse.json({ success: false, message: "Not enrolled" }, { status: 400 })

  const completed = JSON.parse(enrollment.completedIds || "[]")
  if (!completed.includes(completedVideoId)) completed.push(completedVideoId)

  const path = await prisma.learningPath.findUnique({ where: { id: Number(id) } })
  const total = JSON.parse(path.videoIds || "[]").length
  const isComplete = completed.length >= total

  const updated = await prisma.pathEnrollment.update({
    where: { userId_pathId: { userId: Number(user.userId), pathId: Number(id) } },
    data: { completedIds: JSON.stringify(completed) },
  })

  // Issue certificate on completion
  if (isComplete) {
    await prisma.certificate.upsert({
      where: { userId_pathId: { userId: Number(user.userId), pathId: Number(id) } },
      create: { userId: Number(user.userId), pathId: Number(id) },
      update: {},
    })
  }

  return NextResponse.json({ success: true, data: updated, completed: isComplete })
}
