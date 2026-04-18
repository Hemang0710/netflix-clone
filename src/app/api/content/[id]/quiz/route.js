// src/app/api/content/[id]/quiz/route.js
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { generateQuiz } from "@/lib/openai"

// GET — fetch quiz for this content
export async function GET(request, { params }) {
  try {
    const { id } = await params

    const quiz = await prisma.quiz.findUnique({
      where: { contentId: Number(id) },
    })

    if (!quiz) {
      return NextResponse.json({ success: false, message: "No quiz yet" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      questions: JSON.parse(quiz.questions),
    })

  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

// POST — generate quiz
export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false }, { status: 401 })

    const { id } = await params
    const contentId = Number(id)

    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { transcript: true, title: true, creatorId: true },
    })

    if (!content?.transcript) {
      return NextResponse.json(
        { success: false, message: "No transcript — process video first" },
        { status: 400 }
      )
    }

    const questions = await generateQuiz(content.transcript, content.title)

    if (!questions) {
      return NextResponse.json({ success: false, message: "Quiz generation failed" }, { status: 500 })
    }

    // Upsert — create or replace existing quiz
    const quiz = await prisma.quiz.upsert({
      where: { contentId },
      update: { questions: JSON.stringify(questions) },
      create: { contentId, questions: JSON.stringify(questions) },
    })

    return NextResponse.json({ success: true, questions })

  } catch (error) {
    console.error("Quiz generation error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}