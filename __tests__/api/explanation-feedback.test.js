import { POST as saveHandler } from "@/app/api/explanation-feedback/save/route"
import { GET as preferencesHandler } from "@/app/api/explanation-feedback/preferences/route"
import prisma from "@/lib/prisma"
import * as auth from "@/lib/auth"

// Mock dependencies (explicit factories — bare automock doesn't substitute
// aliased modules under next/jest's SWC transform)
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    explanationFeedback: {
      create: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))
jest.mock("@/lib/auth", () => ({
  getCurrentUser: jest.fn(),
  verifyAuth: jest.fn(),
}))

describe("Explanation Feedback API", () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe("POST /api/explanation-feedback/save", () => {
    it("should reject unauthorized requests", async () => {
      auth.getCurrentUser.mockResolvedValueOnce(null)

      const req = {
        json: async () => ({
          explainerType: "diagram",
          helpfulnessScore: 5,
        }),
      }

      const response = await saveHandler(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })

    it("should save feedback with valid data", async () => {
      auth.getCurrentUser.mockResolvedValueOnce({
        userId: 1,
        email: "test@example.com",
      })

      prisma.user.findUnique.mockResolvedValueOnce({ id: 1 })
      prisma.explanationFeedback.create.mockResolvedValueOnce({
        id: 1,
        userId: 1,
        explainerType: "diagram",
        helpfulnessScore: 5,
        timeSpentSeconds: 45,
      })

      const req = {
        json: async () => ({
          contentId: 123,
          chapterTitle: "Chapter 1",
          explainerType: "diagram",
          helpfulnessScore: 5,
          timeSpentSeconds: 45,
        }),
      }

      const response = await saveHandler(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.explainerType).toBe("diagram")
      expect(data.helpfulnessScore).toBe(5)
    })

    it("should validate explainerType", async () => {
      auth.getCurrentUser.mockResolvedValueOnce({
        userId: 1,
        email: "test@example.com",
      })

      prisma.user.findUnique.mockResolvedValueOnce({ id: 1 })

      const req = {
        json: async () => ({
          explainerType: "invalid_type",
          helpfulnessScore: 5,
        }),
      }

      const response = await saveHandler(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain("Invalid explainerType")
    })

    it("should validate helpfulnessScore range", async () => {
      auth.getCurrentUser.mockResolvedValueOnce({
        userId: 1,
        email: "test@example.com",
      })

      prisma.user.findUnique.mockResolvedValueOnce({ id: 1 })

      const req = {
        json: async () => ({
          explainerType: "diagram",
          helpfulnessScore: 10,
        }),
      }

      const response = await saveHandler(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain("between 0 and 5")
    })
  })

  describe("GET /api/explanation-feedback/preferences", () => {
    it("should reject unauthorized requests", async () => {
      auth.getCurrentUser.mockResolvedValueOnce(null)

      const req = {}
      const response = await preferencesHandler(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })

    it("should return best explainer type based on feedback", async () => {
      auth.getCurrentUser.mockResolvedValueOnce({
        userId: 1,
        email: "test@example.com",
      })

      prisma.user.findUnique.mockResolvedValueOnce({ id: 1 })

      // Mock feedback: analogy has highest average score
      prisma.explanationFeedback.findMany.mockResolvedValueOnce([
        { explainerType: "diagram", helpfulnessScore: 3 },
        { explainerType: "diagram", helpfulnessScore: 4 },
        { explainerType: "analogy", helpfulnessScore: 5 },
        { explainerType: "analogy", helpfulnessScore: 5 },
        { explainerType: "analogy", helpfulnessScore: 4 },
        { explainerType: "walkthrough", helpfulnessScore: 2 },
      ])

      const req = {}
      const response = await preferencesHandler(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bestExplainerType).toBe("analogy")
      expect(data.scores.analogy.avgScore).toBeCloseTo(4.67, 1)
      expect(data.scores.diagram.avgScore).toBe(3.5)
      expect(data.scores.walkthrough.avgScore).toBe(2)
    })

    it("should return null when no feedback exists", async () => {
      auth.getCurrentUser.mockResolvedValueOnce({
        userId: 1,
        email: "test@example.com",
      })

      prisma.user.findUnique.mockResolvedValueOnce({ id: 1 })
      prisma.explanationFeedback.findMany.mockResolvedValueOnce([])

      const req = {}
      const response = await preferencesHandler(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bestExplainerType).toBeNull()
      expect(data.feedbackCount).toBe(0)
    })

    it("should only consider feedback from last 30 days", async () => {
      auth.getCurrentUser.mockResolvedValueOnce({
        userId: 1,
        email: "test@example.com",
      })

      prisma.user.findUnique.mockResolvedValueOnce({ id: 1 })
      prisma.explanationFeedback.findMany.mockResolvedValueOnce([
        { explainerType: "analogy", helpfulnessScore: 5 },
      ])

      const req = {}
      const response = await preferencesHandler(req)

      // Check that the query date filter was applied correctly
      const findManyCall = prisma.explanationFeedback.findMany.mock.calls[0]
      const whereClause = findManyCall[0].where

      expect(whereClause.userId).toBe(1)
      expect(whereClause.createdAt.gte).toBeInstanceOf(Date)

      // Verify the date is roughly 30 days ago (allowing 1 day tolerance)
      const daysDifference =
        (Date.now() - whereClause.createdAt.gte.getTime()) / (1000 * 60 * 60 * 24)
      expect(daysDifference).toBeGreaterThan(29)
      expect(daysDifference).toBeLessThan(31)
    })
  })
})
