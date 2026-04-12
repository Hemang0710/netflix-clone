// src/app/api/watchlist/route.js
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET — fetch user's watchlist
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      )
    }

    const watchlist = await prisma.watchlist.findMany({
      where: { userId: Number(user.userId) },
    })

    // Extract just the tmdbIds
    const tmdbIds = watchlist.map(item => item.tmdbId)

    return NextResponse.json({ success: true, data: watchlist.map(item => item.tmdbId).filter(Boolean) })

  } catch (error) {
    console.error("Watchlist GET error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch watchlist" },
      { status: 500 }
    )
  }
}

// POST — add movie to watchlist
export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      )
    }

    const { tmdbId, title, posterPath } = await request.json()

    // Add to watchlist (ignore if already exists)
    await prisma.watchlist.create({
      data: {
        userId: Number(user.userId),
        tmdbId: Number(tmdbId),
        title,
        posterPath: posterPath || "",
      },
    })

    return NextResponse.json(
      { success: true, message: "Added to watchlist" },
      { status: 201 }
    )

  } catch (error) {
    // P2002 = Prisma unique constraint error (already in watchlist)
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "Already in watchlist" },
        { status: 409 }
      )
    }
    console.error("Watchlist POST error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to add to watchlist" },
      { status: 500 }
    )
  }
}

// DELETE — remove movie from watchlist
export async function DELETE(request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      )
    }

    const { tmdbId } = await request.json()

    // Find and delete the watchlist entry
    const watchlistEntry = await prisma.watchlist.findFirst({
      where: {
        userId: Number(user.userId),
        tmdbId: Number(tmdbId),
      },
    })

    if (!watchlistEntry) {
      return NextResponse.json(
        { success: false, message: "Not found in watchlist" },
        { status: 404 }
      )
    }

    await prisma.watchlist.delete({
      where: { id: watchlistEntry.id },
    })

    return NextResponse.json({ success: true, message: "Removed from watchlist" })

  } catch (error) {
    console.error("Watchlist DELETE error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to remove" },
      { status: 500 }
    )
  }
}