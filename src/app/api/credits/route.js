import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"

export async function GET(request) {
  const { success: rateLimitOk } = await checkRateLimit(request, "api")
  if (!rateLimitOk) {
    return NextResponse.json(
      { success: false, message: "Too many requests. Try again later." },
      { status: 429 }
    )
  }

  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    try {
      // Verify user exists in database
      const userInDb = await prisma.user.findUnique({
        where: { id: Number(user.userId) },
        select: { id: true },
      })

      if (!userInDb) {
        // User doesn't exist yet, return 0 credits
        return NextResponse.json({ success: true, credits: 0 })
      }

      const userCredits = await prisma.userCredits.findUnique({
        where: { userId: Number(user.userId) },
        select: { credits: true },
      })

      if (!userCredits) {
        const created = await prisma.userCredits.create({
          data: { userId: Number(user.userId), credits: 0 },
        })
        return NextResponse.json({ success: true, credits: created.credits })
      }

      return NextResponse.json({ success: true, credits: userCredits.credits })
    } catch (dbError) {
      // Table may not exist yet — return 0 so UI still renders
      console.error("[CREDITS_GET] db error (migration pending?):", dbError.message)
      return NextResponse.json({ success: true, credits: 0 })
    }
  } catch (error) {
    console.error("[CREDITS_GET] error:", error)
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 })
  }
}
