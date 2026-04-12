// src/app/api/content/route.js
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET — fetch all content
export async function GET() {
  try {
    const content = await prisma.content.findMany({
      where: { status: "ready" },
      include: {
        creator: {
          select: { email: true, profile: true }
        }
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: content })
  } catch (error) {
    console.error("Content fetch error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch content" },
      { status: 500 }
    )
  }
}

// POST — create new content after upload
export async function POST(request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      )
    }

    const { title, description, videoUrl, thumbnailUrl, price, genre } =
      await request.json()

    if (!title || !videoUrl) {
      return NextResponse.json(
        { success: false, message: "Title and video are required" },
        { status: 400 }
      )
    }

    const content = await prisma.content.create({
      data: {
        title,
        description: description || "",
        videoUrl,
        thumbnailUrl: thumbnailUrl || null,
        price: parseFloat(price) || 0,
        isFree: !price || parseFloat(price) === 0,
        genre: genre || "General",
        status: "ready",
        creatorId: Number(user.userId),
      },
    })

    return NextResponse.json(
      { success: true, data: content },
      { status: 201 }
    )

  } catch (error) {
    console.error("Content creation error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to create content" },
      { status: 500 }
    )
  }
}