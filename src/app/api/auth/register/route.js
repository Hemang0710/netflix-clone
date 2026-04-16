// src/app/api/auth/register/route.js
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rateLimit"
import { registerSchema, validateBody } from "@/lib/schemas"

export async function POST(request) {
  // 1. Rate limit
  const { success: rateLimitOk } = await checkRateLimit(request, "auth")
  if (!rateLimitOk) {
    return NextResponse.json(
      { success: false, message: "Too many requests. Try again later." },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()

    // 2. Validate with Zod
    const validation = validateBody(registerSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: validation.errors },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // 3. Check duplicate
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 409 }
      )
    }

    // 4. Hash and create
    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    })

    return NextResponse.json(
      { success: true, message: "Account created", userId: user.id },
      { status: 201 }
    )

  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    )
  }
}