// Delivers via Resend when RESEND_API_KEY is set; otherwise logs to the
// server console so the flow is still testable in local dev.
async function deliverEmail({ to, subject, html }) {
  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'LearnAI <onboarding@resend.dev>',
        to,
        subject,
        html,
      }),
    })
    if (!res.ok) {
      console.error('Email delivery failed:', res.status, await res.text())
      return false
    }
    return true
  }

  console.log(`📧 [dev — no RESEND_API_KEY set] Email to ${to}: ${subject}`)
  return true
}

export async function sendVerificationEmail(email, token) {
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify?token=${token}`

  const emailContent = {
    to: email,
    subject: 'Verify Your Email - LearnAI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">Verify Your Email</h1>
        <p>Thanks for signing up! Please verify your email address to activate your account.</p>
        <a href="${verificationLink}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Verify Email
        </a>
        <p style="color: #666;">Or copy this link: <code>${verificationLink}</code></p>
        <p style="color: #999; font-size: 12px;">This link expires in 24 hours.</p>
      </div>
    `,
  }

  console.log('📧 Verification link for', email + ':', verificationLink)
  return deliverEmail(emailContent)
}

export async function sendForgettingDigestEmail(email, digest) {
  const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/learn#daily-review`

  const emailContent = {
    to: email,
    subject: digest.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">Your memory is about to slip 🧠</h1>
        <p>${digest.body}</p>
        <p style="color: #666;">Fading concepts: <strong>${digest.conceptNames.join(', ')}</strong></p>
        <a href="${reviewLink}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Start ${digest.minutes}-minute review
        </a>
        <p style="color: #999; font-size: 12px;">Reviewing right before you forget is when spaced repetition works best.</p>
      </div>
    `,
  }

  return deliverEmail(emailContent)
}

export async function sendPasswordResetEmail(email, token) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`

  const emailContent = {
    to: email,
    subject: 'Reset Your Password - LearnAI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">Reset Your Password</h1>
        <p>We received a request to reset your password. Click the link below to create a new one.</p>
        <a href="${resetLink}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Reset Password
        </a>
        <p style="color: #666;">Or copy this link: <code>${resetLink}</code></p>
        <p style="color: #999; font-size: 12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  }

  console.log('📧 Password reset link for', email + ':', resetLink)
  return deliverEmail(emailContent)
}
