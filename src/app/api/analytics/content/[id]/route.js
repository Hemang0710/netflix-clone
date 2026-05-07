import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import prisma from "@/lib/prisma"

export async function GET(request, { params }) {
  const { success } = await checkRateLimit(request, "api")
  if (!success) return NextResponse.json({ success: false }, { status: 429 })

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const contentId = Number(id)

  // Verify creator owns this content
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: { creatorId: true, views: true, duration: true, title: true },
  })
  if (!content) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })
  if (content.creatorId !== Number(user.userId)) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })

  const [watchRows, quizRows, noteCount, commentCount] = await Promise.all([
    prisma.watchProgress.findMany({
      where: { contentId },
      select: { timestamp: true, duration: true, completed: true },
    }),
    prisma.quizAttempt.findMany({
      where: { contentId },
      select: { score: true },
    }),
    prisma.note.count({ where: { contentId } }),
    prisma.comment.count({ where: { contentId } }),
  ])

  const totalViewers = watchRows.length
  const completions = watchRows.filter(w => w.completed).length
  const completionRate = totalViewers ? Math.round((completions / totalViewers) * 100) : 0

  const avgCompletion = totalViewers
    ? Math.round(watchRows.reduce((sum, w) => {
        const dur = w.duration || content.duration || 1
        return sum + Math.min((w.timestamp / dur) * 100, 100)
      }, 0) / totalViewers)
    : 0

  // Drop-off buckets: 0-10%, 10-20%, ... 90-100%
  const buckets = Array(10).fill(0)
  for (const w of watchRows) {
    const dur = w.duration || content.duration || 1
    const pct = Math.min((w.timestamp / dur) * 100, 99)
    const bucket = Math.floor(pct / 10)
    buckets[bucket]++
  }

  const avgQuizScore = quizRows.length
    ? Math.round(quizRows.reduce((s, q) => s + q.score, 0) / quizRows.length)
    : null

  return NextResponse.json({
    success: true,
    data: {
      views: content.views,
      uniqueViewers: totalViewers,
      completions,
      completionRate,
      avgCompletion,
      dropOffBuckets: buckets,
      quizAttempts: quizRows.length,
      avgQuizScore,
      noteCount,
      commentCount,
    },
  })
}
