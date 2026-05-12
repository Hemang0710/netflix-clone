import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { checkRateLimit } from '@/lib/rateLimit'
import crypto from 'crypto'

export async function POST(request) {
  const { success: rateLimitOk } = await checkRateLimit(request, 'auth')
  if (!rateLimitOk) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists, password reset email has been sent.',
        },
        { status: 200 }
      )
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      },
    })

    await sendPasswordResetEmail(user.email, token)

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent. Check your inbox.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process password reset' },
      { status: 500 }
    )
  }
}
