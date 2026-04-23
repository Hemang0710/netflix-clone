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
      const userCredits = await prisma.userCredits.findUnique({
        where: { userId: user.userId },
        select: { credits: true },
      })

      if (!userCredits) {
        const created = await prisma.userCredits.create({
          data: { userId: user.userId, credits: 0 },
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
