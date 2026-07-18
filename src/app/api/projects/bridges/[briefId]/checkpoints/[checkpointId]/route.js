import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import {
  reviewCheckpointSubmission,
  MIN_SUBMISSION_CHARS,
  MAX_SUBMISSION_CHARS,
} from "@/lib/projectBridge"
import { dispatchWebhooks } from "@/lib/webhooks"

/**
 * POST /api/projects/bridges/[briefId]/checkpoints/[checkpointId] — submit
 * a write-up of the work for this checkpoint. AI reviews it against the
 * checkpoint's acceptance criteria; a pass marks the checkpoint done, and
 * passing the last pending checkpoint completes the whole project.
 * Body: { submission }
 */
export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // AI review costs tokens — reuse the ingest budget (30/h)
    const rate = await checkRateLimit(request, "ingest")
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many checkpoint submissions — take a breather and try again soon" },
        { status: 429 }
      )
    }

    const { briefId, checkpointId } = await params
    const briefIdNum = Number(briefId)
    const checkpointIdNum = Number(checkpointId)
    if (!Number.isInteger(briefIdNum) || !Number.isInteger(checkpointIdNum)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const submission = typeof body.submission === "string" ? body.submission.trim() : ""
    if (submission.length < MIN_SUBMISSION_CHARS) {
      return NextResponse.json(
        { error: `Describe what you built in at least ${MIN_SUBMISSION_CHARS} characters — specifics matter` },
        { status: 400 }
      )
    }
    if (submission.length > MAX_SUBMISSION_CHARS) {
      return NextResponse.json(
        { error: `Write-up too long (max ${MAX_SUBMISSION_CHARS} characters)` },
        { status: 400 }
      )
    }

    const brief = await prisma.projectBrief.findFirst({
      where: { id: briefIdNum, userId: Number(user.userId) },
      include: { checkpoints: { orderBy: { order: "asc" } } },
    })
    if (!brief) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    if (brief.status !== "active") {
      return NextResponse.json({ error: "This project isn't active" }, { status: 400 })
    }

    const checkpoint = brief.checkpoints.find((cp) => cp.id === checkpointIdNum)
    if (!checkpoint) {
      return NextResponse.json({ error: "Checkpoint not found" }, { status: 404 })
    }
    if (checkpoint.status === "passed") {
      return NextResponse.json({ error: "Checkpoint already passed" }, { status: 400 })
    }

    const review = await reviewCheckpointSubmission({ brief, checkpoint, submission })

    const updatedCheckpoint = await prisma.projectCheckpoint.update({
      where: { id: checkpoint.id },
      data: {
        submission,
        feedback: review.feedback,
        score: review.score,
        attempts: { increment: 1 },
        ...(review.passed && { status: "passed", passedAt: new Date() }),
      },
    })

    // Passing the final pending checkpoint completes the project
    let projectCompleted = false
    if (review.passed) {
      const stillPending = brief.checkpoints.some(
        (cp) => cp.id !== checkpoint.id && cp.status !== "passed"
      )
      if (!stillPending) {
        await prisma.projectBrief.update({
          where: { id: brief.id },
          data: { status: "completed", completedAt: new Date() },
        })
        projectCompleted = true
        await dispatchWebhooks(brief.userId, "project.completed", {
          briefId: brief.id,
          title: brief.title,
          deliverable: brief.deliverable,
          difficulty: brief.difficulty,
          checkpoints: brief.checkpoints.length,
        })
      }
    }

    return NextResponse.json({
      checkpoint: {
        id: updatedCheckpoint.id,
        order: updatedCheckpoint.order,
        title: updatedCheckpoint.title,
        status: updatedCheckpoint.status,
        submission: updatedCheckpoint.submission,
        feedback: updatedCheckpoint.feedback,
        score: updatedCheckpoint.score,
        attempts: updatedCheckpoint.attempts,
        passedAt: updatedCheckpoint.passedAt,
      },
      review: { passed: review.passed, score: review.score, nudge: review.nudge },
      projectCompleted,
    })
  } catch (error) {
    console.error("POST /api/projects/bridges/[briefId]/checkpoints/[checkpointId] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
