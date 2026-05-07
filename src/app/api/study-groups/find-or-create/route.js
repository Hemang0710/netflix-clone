import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { calculateLearnerEmbedding, cosineDistance } from "@/lib/badgeEligibility"
import { aiClient } from "@/lib/openai"

export async function POST(request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { contentId, skillLevel = "intermediate", quizScore = 0 } = await request.json()

  if (!contentId) {
    return NextResponse.json({ success: false, error: "contentId required" }, { status: 400 })
  }

  // Check if user already in a group for this content
  const existingMember = await prisma.studyGroupMember.findFirst({
    where: {
      userId: user.userId,
      group: { contentId: Number(contentId) }
    },
    include: { group: true }
  })

  if (existingMember) {
    const memberCount = await prisma.studyGroupMember.count({
      where: { groupId: existingMember.groupId }
    })

    return NextResponse.json({
      success: true,
      data: {
        groupId: existingMember.groupId,
        topicName: existingMember.group.topicName,
        isNewGroup: false,
        memberCount
      }
    })
  }

  // Generate learner embedding
  const userEmbedding = calculateLearnerEmbedding(skillLevel, quizScore)

  // Fetch all active, non-full groups for this content
  const availableGroups = await prisma.studyGroup.findMany({
    where: {
      contentId: Number(contentId),
      isActive: true,
      members: { some: {} } // Has at least one member
    },
    include: { members: true }
  })

  const nonFullGroups = availableGroups.filter(g => g.members.length < g.maxMembers)

  // Find best matching group by average embedding distance
  let bestGroup = null
  let bestDistance = Infinity

  for (const group of nonFullGroups) {
    const memberEmbeddings = group.members
      .map(m => m.embedding)
      .filter(e => e && Array.isArray(e) && e.length > 0)

    if (memberEmbeddings.length === 0) continue

    // Calculate average embedding of group
    const avgEmbedding = []
    for (let i = 0; i < userEmbedding.length; i++) {
      avgEmbedding[i] = memberEmbeddings.reduce((sum, e) => sum + (e[i] || 0), 0) / memberEmbeddings.length
    }

    // Distance to group's average
    const distance = cosineDistance(userEmbedding, avgEmbedding)

    if (distance < bestDistance) {
      bestDistance = distance
      bestGroup = group
    }
  }

  let group
  let isNewGroup = false

  if (bestGroup) {
    group = bestGroup
  } else {
    // Create new group if no match or all full
    const content = await prisma.content.findUnique({
      where: { id: Number(contentId) },
      select: { title: true }
    })

    group = await prisma.studyGroup.create({
      data: {
        contentId: Number(contentId),
        topicName: content?.title || "Study Group"
      }
    })
    isNewGroup = true
  }

  // Add user as member
  await prisma.studyGroupMember.create({
    data: {
      groupId: group.id,
      userId: user.userId,
      skillLevel,
      quizScore,
      embedding: userEmbedding
    }
  })

  // If new group, post AI welcome message
  if (isNewGroup) {
    const welcomePrompt = `You are a friendly AI tutor facilitating a study group about "${group.topicName}".

Write a brief, warm welcome message (1-2 sentences) that encourages peer learning and asks everyone to introduce their skill level and learning goal.`

    try {
      const aiResponse = await aiClient.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: welcomePrompt }],
        max_tokens: 100,
        temperature: 0.7
      })

      const welcomeMessage = aiResponse.choices[0].message.content.trim()

      await prisma.studyGroupMessage.create({
        data: {
          groupId: group.id,
          message: welcomeMessage,
          isAI: true
        }
      })
    } catch (error) {
      console.error("Failed to generate AI welcome message:", error)
    }
  }

  const memberCount = await prisma.studyGroupMember.count({
    where: { groupId: group.id }
  })

  return NextResponse.json({
    success: true,
    data: {
      groupId: group.id,
      topicName: group.topicName,
      isNewGroup,
      memberCount
    }
  })
}
