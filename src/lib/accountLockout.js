import prisma from '@/lib/prisma'

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 15

export async function checkAccountLockout(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, lockedUntil: true },
  })

  if (!user) return { locked: false }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesRemaining = Math.ceil(
      (user.lockedUntil - new Date()) / 1000 / 60
    )
    return {
      locked: true,
      minutesRemaining,
      message: `Account locked. Try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
    }
  }

  if (user.lockedUntil && user.lockedUntil <= new Date()) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    })
    return { locked: false }
  }

  return { locked: false }
}

export async function recordFailedLogin(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, failedLoginAttempts: true },
  })

  if (!user) return

  const newAttempts = user.failedLoginAttempts + 1

  let lockoutData = { failedLoginAttempts: newAttempts }

  if (newAttempts >= MAX_ATTEMPTS) {
    lockoutData.lockedUntil = new Date(
      Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000
    )
  }

  await prisma.user.update({
    where: { id: user.id },
    data: lockoutData,
  })

  return newAttempts >= MAX_ATTEMPTS
}

export async function clearFailedLogins(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  })
}
