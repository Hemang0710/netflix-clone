"use server"

import prisma from "@/lib/prisma"

export async function getUserSubscription(userId) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: Number(userId) }
    })
    return subscription
  } catch (error) {
    console.error("Error fetching subscription:", error)
    return null
  }
}

export async function isSubscribed(userId) {
  const subscription = await getUserSubscription(userId)
  if (!subscription) return false

  const now = new Date()
  return subscription.status === "active" && subscription.periodEnd > now
}

export async function getSubscriptionStatus(userId) {
  const subscription = await getUserSubscription(userId)
  if (!subscription) return "unsubscribed"

  const now = new Date()
  if (subscription.status === "active" && subscription.periodEnd > now) {
    return "active"
  }
  if (subscription.status === "cancelled") {
    return "cancelled"
  }
  if (subscription.status === "past_due") {
    return "past_due"
  }
  if (subscription.periodEnd <= now) {
    return "expired"
  }

  return subscription.status
}
