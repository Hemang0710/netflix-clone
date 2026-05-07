import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { aiClient } from "@/lib/openai"

export async function POST(request, { params }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { groupId } = await params
  const { message } = await request.json()

  if (!message?.trim()) {
    return NextResponse.json({ success: false, error: "Message required" }, { status: 400 })
  }

  // Verify user is a member
  const member = await prisma.studyGroupMember.findUnique({
    where: {
      groupId_userId: { groupId: Number(groupId), userId: user.userId }
    }
  })

  if (!member) {
    return NextResponse.json({ success: false, error: "Not in group" }, { status: 403 })
  }

  // Check toxicity (simple AI-based moderation)
  let isFlagged = false
  let moderationScore = 0

  try {
    const modResponse = await aiClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Rate this message for toxicity (0-1 scale, where 1 is most toxic): "${message}"\n\nRespond with ONLY a number between 0 and 1.`
        }
      ],
      max_tokens: 10,
      temperature: 0.1
    })

    moderationScore = parseFloat(modResponse.choices[0].message.content.trim())
    isFlagged = moderationScore > 0.7
  } catch (error) {
    console.error("Moderation error:", error)
    moderationScore = 0.3
  }

  // Save user message
  const savedMessage = await prisma.studyGroupMessage.create({
    data: {
      groupId: Number(groupId),
      userId: user.userId,
      message,
      isFlagged,
      moderationScore
    }
  })

  // Update member last activity
  await prisma.studyGroupMember.update({
    where: {
      groupId_userId: { groupId: Number(groupId), userId: user.userId }
    },
    data: { lastActivity: new Date() }
  })

  // Fetch group for context
  const group = await prisma.studyGroup.findUnique({
    where: { id: Number(groupId) },
    select: { topicName: true }
  })

  // Check if AI should respond
  const needsAIHelp =
    message.toLowerCase().includes("help") ||
    message.toLowerCase().includes("stuck") ||
    message.toLowerCase().includes("confused") ||
    message.toLowerCase().includes("how to") ||
    message.includes("?")

  let aiResponse = null

  if (needsAIHelp && !isFlagged) {
    try {
      const aiResponseObj = await aiClient.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a helpful study group facilitator for a topic: "${group?.topicName || 'Learning'}".
A learner in the group said: "${message}"

Provide a brief, encouraging response that helps them learn better. Keep it under 100 words. Be supportive and guide them to think deeper.`
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })

      aiResponse = aiResponseObj.choices[0].message.content.trim()

      // Save AI response
      await prisma.studyGroupMessage.create({
        data: {
          groupId: Number(groupId),
          message: aiResponse,
          isAI: true
        }
      })
    } catch (error) {
      console.error("AI response generation error:", error)
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      message: savedMessage,
      aiResponse
    }
  })
}
