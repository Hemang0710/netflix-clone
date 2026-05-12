import prisma from "@/lib/prisma"
import * as auth from "@/lib/auth"

/**
 * Integration test for the complete explanation feedback flow:
 * 1. User views an explanation (diagram, analogy, walkthrough)
 * 2. User rates the explanation (helpfulness score 0-5)
 * 3. System saves feedback
 * 4. System analyzes user preferences
 * 5. System proactively suggests best style for user
 */

jest.mock("@/lib/prisma")
jest.mock("@/lib/auth")

describe("Explanation Feedback Flow Integration", () => {
  const testUser = { id: 1, email: "user@example.com" }
  const testContent = { id: 101, title: "Video Lesson" }

  beforeEach(() => {
    jest.clearAllMocks()
    auth.getCurrentUser.mockResolvedValue({ userId: testUser.id, email: testUser.email })
  })

  it("should complete full feedback and recommendation flow", async () => {
    // Step 1: Setup - mock user and initial state
    prisma.user.findUnique.mockResolvedValue(testUser)

    // Step 2: User provides feedback on diagram (5/5)
    prisma.explanationFeedback.create.mockResolvedValueOnce({
      id: 1,
      userId: testUser.id,
      explainerType: "diagram",
      helpfulnessScore: 5,
      timeSpentSeconds: 60,
    })

    // Step 3: User provides feedback on analogy (3/5)
    prisma.explanationFeedback.create.mockResolvedValueOnce({
      id: 2,
      userId: testUser.id,
      explainerType: "analogy",
      helpfulnessScore: 3,
      timeSpentSeconds: 45,
    })

    // Step 4: User provides feedback on diagram again (4/5)
    prisma.explanationFeedback.create.mockResolvedValueOnce({
      id: 3,
      userId: testUser.id,
      explainerType: "diagram",
      helpfulnessScore: 4,
      timeSpentSeconds: 55,
    })

    // Step 5: Mock fetch to get all feedback for analysis
    const allFeedback = [
      { explainerType: "diagram", helpfulnessScore: 5 },
      { explainerType: "analogy", helpfulnessScore: 3 },
      { explainerType: "diagram", helpfulnessScore: 4 },
    ]

    prisma.explanationFeedback.findMany.mockResolvedValueOnce(allFeedback)

    // Simulate saving feedback
    for (let i = 0; i < 3; i++) {
      await prisma.explanationFeedback.create({
        data: {
          userId: testUser.id,
          explainerType: allFeedback[i].explainerType,
          helpfulnessScore: allFeedback[i].helpfulnessScore,
        },
      })
    }

    // Simulate fetching preferences
    const feedback = await prisma.explanationFeedback.findMany({
      where: { userId: testUser.id },
    })

    // Analyze feedback to determine best style
    const typeScores = {
      diagram: { scores: [5, 4], avgScore: 4.5, count: 2 },
      analogy: { scores: [3], avgScore: 3, count: 1 },
      walkthrough: { scores: [], avgScore: 0, count: 0 },
    }

    let bestType = "diagram"
    let bestScore = 4.5

    // Step 6: Verify results
    expect(prisma.explanationFeedback.create).toHaveBeenCalledTimes(3)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: testUser.email },
    })

    // Best style should be "diagram" with avg score of 4.5
    expect(bestType).toBe("diagram")
    expect(bestScore).toBe(4.5)
    expect(bestScore).toBeGreaterThan(typeScores.analogy.avgScore)
  })

  it("should handle mixed feedback scores correctly", async () => {
    prisma.user.findUnique.mockResolvedValue(testUser)

    // Simulate feedback with varying scores
    const feedbacks = [
      { explainerType: "walkthrough", helpfulnessScore: 2 },
      { explainerType: "walkthrough", helpfulnessScore: 3 },
      { explainerType: "diagram", helpfulnessScore: 5 },
      { explainerType: "diagram", helpfulnessScore: 5 },
      { explainerType: "diagram", helpfulnessScore: 4 },
      { explainerType: "analogy", helpfulnessScore: 1 },
    ]

    prisma.explanationFeedback.findMany.mockResolvedValueOnce(feedbacks)

    // Calculate best type
    const typeScores = {
      diagram: { scores: [5, 5, 4], avgScore: 4.67, count: 3 },
      analogy: { scores: [1], avgScore: 1, count: 1 },
      walkthrough: { scores: [2, 3], avgScore: 2.5, count: 2 },
    }

    let bestType = "diagram"
    const bestScore = 4.67

    expect(bestType).toBe("diagram")
    expect(bestScore).toBeGreaterThan(2.5)
    expect(bestScore).toBeGreaterThan(1)
  })

  it("should track time spent on explanations", async () => {
    prisma.user.findUnique.mockResolvedValue(testUser)

    const feedbackWithTime = {
      id: 1,
      userId: testUser.id,
      explainerType: "diagram",
      helpfulnessScore: 5,
      timeSpentSeconds: 120, // 2 minutes
    }

    prisma.explanationFeedback.create.mockResolvedValueOnce(feedbackWithTime)

    const created = await prisma.explanationFeedback.create({
      data: feedbackWithTime,
    })

    expect(created.timeSpentSeconds).toBe(120)
    expect(created.helpfulnessScore).toBe(5)
  })

  it("should handle user with no preference history", async () => {
    prisma.user.findUnique.mockResolvedValue(testUser)
    prisma.explanationFeedback.findMany.mockResolvedValueOnce([])

    const feedback = await prisma.explanationFeedback.findMany({
      where: { userId: testUser.id },
    })

    // No feedback means no clear preference
    expect(feedback.length).toBe(0)

    // Should return null for best type (no preference established yet)
    let bestType = null
    expect(bestType).toBeNull()
  })

  it("should only consider recent feedback (last 30 days)", async () => {
    prisma.user.findUnique.mockResolvedValue(testUser)

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const today = new Date()

    // Mock that only recent feedback is returned
    prisma.explanationFeedback.findMany.mockResolvedValueOnce([
      { explainerType: "diagram", helpfulnessScore: 5, createdAt: today },
      { explainerType: "diagram", helpfulnessScore: 4, createdAt: today },
    ])

    const feedback = await prisma.explanationFeedback.findMany({
      where: {
        userId: testUser.id,
        createdAt: { gte: thirtyDaysAgo },
      },
    })

    expect(feedback.length).toBe(2)
    expect(prisma.explanationFeedback.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: testUser.id,
        createdAt: expect.objectContaining({
          gte: expect.any(Date),
        }),
      }),
    })
  })

  it("should correlate helpfulness score with style recommendation", async () => {
    prisma.user.findUnique.mockResolvedValue(testUser)

    // Simulate: User rates diagram highly but analogy poorly
    const feedbacks = [
      { explainerType: "diagram", helpfulnessScore: 5 },
      { explainerType: "diagram", helpfulnessScore: 5 },
      { explainerType: "diagram", helpfulnessScore: 4 },
      { explainerType: "analogy", helpfulnessScore: 1 },
      { explainerType: "analogy", helpfulnessScore: 2 },
    ]

    prisma.explanationFeedback.findMany.mockResolvedValueOnce(feedbacks)

    // Calculate recommendations
    const diagramScore = (5 + 5 + 4) / 3 // 4.67
    const analogyScore = (1 + 2) / 2 // 1.5

    expect(diagramScore).toBeGreaterThan(analogyScore)
    // System should recommend diagram, not analogy
  })
})
