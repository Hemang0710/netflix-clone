import { GET, POST } from '@/app/api/projects/bridges/route'
import { PATCH } from '@/app/api/projects/bridges/[briefId]/route'
import { POST as SUBMIT } from '@/app/api/projects/bridges/[briefId]/checkpoints/[checkpointId]/route'

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    conceptMastery: {
      findMany: jest.fn(),
    },
    projectBrief: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    projectCheckpoint: {
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: jest.fn(),
}))

jest.mock('@/lib/openai', () => ({
  aiClient: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}))

import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rateLimit'
import { aiClient } from '@/lib/openai'

const MASTERED_CONCEPTS = [
  { id: 1, concept: 'Closures', masteryScore: 80, contentId: 12, content: { title: 'JS Deep Dive' } },
  { id: 2, concept: 'Promises', masteryScore: 75, contentId: 12, content: { title: 'JS Deep Dive' } },
  { id: 3, concept: 'Event loop', masteryScore: 70, contentId: 12, content: { title: 'JS Deep Dive' } },
]

const GENERATED_BRIEF = {
  title: 'Build a Rate-Limited Fetch Queue',
  pitch: 'APIs throttle you in the real world.',
  deliverable: 'A tiny npm-style module',
  difficulty: 'starter',
  estimatedHours: 4,
  checkpoints: [
    { title: 'Queue skeleton', task: 'Build the queue using closures', acceptance: 'Queue holds tasks', hint: 'Start small' },
    { title: 'Promise chaining', task: 'Process with promises', acceptance: 'Tasks resolve in order', hint: null },
    { title: 'Throttle', task: 'Respect the event loop', acceptance: 'Max N per second', hint: 'setTimeout' },
  ],
}

const GOOD_SUBMISSION =
  'I built the queue as a factory function returning enqueue/flush. The closure holds the pending array and the in-flight counter, and flush drains it recursively.'

const mockAIResponse = (payload) => {
  aiClient.chat.completions.create.mockResolvedValueOnce({
    choices: [{ message: { content: JSON.stringify(payload) } }],
  })
}

const jsonRequest = (url, method, body) =>
  new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const briefRow = (overrides = {}) => ({
  id: 30,
  userId: 1,
  clusterKey: 'content:12',
  clusterLabel: 'JS Deep Dive',
  title: 'Build a Rate-Limited Fetch Queue',
  pitch: 'APIs throttle you.',
  deliverable: 'A module',
  difficulty: 'starter',
  estimatedHours: 4,
  concepts: '[{"id":1,"concept":"Closures"}]',
  status: 'active',
  createdAt: new Date(),
  completedAt: null,
  checkpoints: [
    { id: 100, order: 1, title: 'Queue skeleton', task: 't', acceptance: 'a', hint: null, status: 'pending', submission: null, feedback: null, score: null, attempts: 0, passedAt: null },
    { id: 101, order: 2, title: 'Promise chaining', task: 't', acceptance: 'a', hint: null, status: 'pending', submission: null, feedback: null, score: null, attempts: 0, passedAt: null },
  ],
  ...overrides,
})

describe('/api/projects/bridges', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    checkRateLimit.mockResolvedValue({ success: true })
    // findMany on projectBrief serves two shapes: the active-brief clusterKey
    // lookup inside findMasteredClusters, and the full brief listing in GET
    prisma.projectBrief.findMany.mockImplementation(async (args) =>
      args?.select?.clusterKey ? [] : []
    )
  })

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      getCurrentUser.mockResolvedValueOnce(null)
      const response = await GET()
      expect(response.status).toBe(401)
    })

    it('groups mastered concepts into clusters and serializes briefs', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      prisma.conceptMastery.findMany.mockResolvedValueOnce([
        ...MASTERED_CONCEPTS,
        // too-small cluster (2 standalone concepts) must not appear
        { id: 4, concept: 'Bayes', masteryScore: 90, contentId: null, content: null },
        { id: 5, concept: 'Priors', masteryScore: 70, contentId: null, content: null },
      ])
      prisma.projectBrief.findMany.mockImplementation(async (args) =>
        args?.select?.clusterKey ? [] : [briefRow()]
      )

      const response = await GET()
      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.clusters).toHaveLength(1)
      expect(data.clusters[0].key).toBe('content:12')
      expect(data.clusters[0].label).toBe('JS Deep Dive')
      expect(data.clusters[0].concepts).toHaveLength(3)
      expect(data.briefs[0].concepts).toEqual([{ id: 1, concept: 'Closures' }])
      expect(data.briefs[0].checkpoints).toHaveLength(2)
    })

    it('hides clusters that already have an active brief', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      prisma.conceptMastery.findMany.mockResolvedValueOnce(MASTERED_CONCEPTS)
      prisma.projectBrief.findMany.mockImplementation(async (args) =>
        args?.select?.clusterKey ? [{ clusterKey: 'content:12' }] : [briefRow()]
      )

      const response = await GET()
      const data = await response.json()
      expect(data.clusters).toHaveLength(0)
    })
  })

  describe('POST (generate brief)', () => {
    const post = (body) => POST(jsonRequest('http://localhost:3000/api/projects/bridges', 'POST', body))

    it('returns 401 when not authenticated', async () => {
      getCurrentUser.mockResolvedValueOnce(null)
      const response = await post({ clusterKey: 'content:12' })
      expect(response.status).toBe(401)
    })

    it('returns 429 when rate limited', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      checkRateLimit.mockResolvedValueOnce({ success: false })
      const response = await post({ clusterKey: 'content:12' })
      expect(response.status).toBe(429)
    })

    it('rejects a missing clusterKey', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      const response = await post({})
      expect(response.status).toBe(400)
    })

    it('returns 404 for a cluster that is not eligible', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      prisma.conceptMastery.findMany.mockResolvedValueOnce([]) // nothing mastered
      const response = await post({ clusterKey: 'content:12' })
      expect(response.status).toBe(404)
    })

    it('generates and persists a brief with ordered checkpoints', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      prisma.conceptMastery.findMany.mockResolvedValueOnce(MASTERED_CONCEPTS)
      mockAIResponse(GENERATED_BRIEF)
      prisma.projectBrief.create.mockImplementationOnce(async ({ data }) => ({
        ...briefRow(),
        ...data,
        checkpoints: data.checkpoints.create.map((cp, i) => ({
          id: 100 + i, status: 'pending', submission: null, feedback: null,
          score: null, attempts: 0, passedAt: null, ...cp,
        })),
      }))

      const response = await post({ clusterKey: 'content:12' })
      expect(response.status).toBe(201)
      const data = await response.json()

      expect(data.brief.title).toBe('Build a Rate-Limited Fetch Queue')
      expect(data.brief.checkpoints.map((cp) => cp.order)).toEqual([1, 2, 3])
      expect(prisma.projectBrief.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 1,
            clusterKey: 'content:12',
            clusterLabel: 'JS Deep Dive',
          }),
        })
      )
    })

    it('fails cleanly when the model returns too few checkpoints', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      prisma.conceptMastery.findMany.mockResolvedValueOnce(MASTERED_CONCEPTS)
      mockAIResponse({ ...GENERATED_BRIEF, checkpoints: GENERATED_BRIEF.checkpoints.slice(0, 1) })

      const response = await post({ clusterKey: 'content:12' })
      expect(response.status).toBe(500)
      expect(prisma.projectBrief.create).not.toHaveBeenCalled()
    })
  })

  describe('PATCH /[briefId]', () => {
    const patch = (briefId, body) =>
      PATCH(jsonRequest(`http://localhost:3000/api/projects/bridges/${briefId}`, 'PATCH', body), {
        params: Promise.resolve({ briefId: String(briefId) }),
      })

    it('returns 404 for a brief the user does not own', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      prisma.projectBrief.findFirst.mockResolvedValueOnce(null)
      const response = await patch(30, { status: 'abandoned' })
      expect(response.status).toBe(404)
    })

    it('rejects status changes on completed projects', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      prisma.projectBrief.findFirst.mockResolvedValueOnce({ id: 30, status: 'completed' })
      const response = await patch(30, { status: 'abandoned' })
      expect(response.status).toBe(400)
    })

    it('abandons an active project', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      prisma.projectBrief.findFirst.mockResolvedValueOnce({ id: 30, status: 'active' })
      prisma.projectBrief.update.mockResolvedValueOnce(briefRow({ status: 'abandoned' }))

      const response = await patch(30, { status: 'abandoned' })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.brief.status).toBe('abandoned')
    })
  })

  describe('POST /[briefId]/checkpoints/[checkpointId]', () => {
    const submit = (briefId, checkpointId, body) =>
      SUBMIT(
        jsonRequest(
          `http://localhost:3000/api/projects/bridges/${briefId}/checkpoints/${checkpointId}`,
          'POST',
          body
        ),
        { params: Promise.resolve({ briefId: String(briefId), checkpointId: String(checkpointId) }) }
      )

    it('rejects submissions that are too short', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      const response = await submit(30, 100, { submission: 'done, it works' })
      expect(response.status).toBe(400)
    })

    it('returns 404 for a project the user does not own', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      prisma.projectBrief.findFirst.mockResolvedValueOnce(null)
      const response = await submit(30, 100, { submission: GOOD_SUBMISSION })
      expect(response.status).toBe(404)
    })

    it('rejects re-submitting an already-passed checkpoint', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      const brief = briefRow()
      brief.checkpoints[0].status = 'passed'
      prisma.projectBrief.findFirst.mockResolvedValueOnce(brief)
      const response = await submit(30, 100, { submission: GOOD_SUBMISSION })
      expect(response.status).toBe(400)
    })

    it('records a failed review without passing the checkpoint', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      prisma.projectBrief.findFirst.mockResolvedValueOnce(briefRow())
      mockAIResponse({ score: 40, passed: false, feedback: 'No specifics on the closure.', nudge: 'Show the state' })
      prisma.projectCheckpoint.update.mockImplementationOnce(async ({ data }) => ({
        ...briefRow().checkpoints[0],
        ...data,
        attempts: 1,
      }))

      const response = await submit(30, 100, { submission: GOOD_SUBMISSION })
      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.review.passed).toBe(false)
      expect(data.projectCompleted).toBe(false)
      expect(prisma.projectCheckpoint.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ status: 'passed' }),
        })
      )
      expect(prisma.projectBrief.update).not.toHaveBeenCalled()
    })

    it('does not pass when the score is high but the model says failed', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      prisma.projectBrief.findFirst.mockResolvedValueOnce(briefRow())
      mockAIResponse({ score: 85, passed: false, feedback: 'Numbers look good but nothing was demonstrated.', nudge: 'Show it' })
      prisma.projectCheckpoint.update.mockImplementationOnce(async ({ data }) => ({
        ...briefRow().checkpoints[0],
        ...data,
        attempts: 1,
      }))

      const response = await submit(30, 100, { submission: GOOD_SUBMISSION })
      const data = await response.json()
      expect(data.review.passed).toBe(false)
    })

    it('passes a checkpoint and completes the project when it is the last one', async () => {
      getCurrentUser.mockResolvedValueOnce({ userId: 1 })
      const brief = briefRow()
      brief.checkpoints[1].status = 'passed' // only checkpoint 100 remains
      prisma.projectBrief.findFirst.mockResolvedValueOnce(brief)
      mockAIResponse({ score: 90, passed: true, feedback: 'Solid closure design.', nudge: 'Add retries' })
      prisma.projectCheckpoint.update.mockImplementationOnce(async ({ data }) => ({
        ...brief.checkpoints[0],
        ...data,
        attempts: 1,
      }))
      prisma.projectBrief.update.mockResolvedValueOnce(briefRow({ status: 'completed' }))

      const response = await submit(30, 100, { submission: GOOD_SUBMISSION })
      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.review.passed).toBe(true)
      expect(data.checkpoint.status).toBe('passed')
      expect(data.projectCompleted).toBe(true)
      expect(prisma.projectBrief.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'completed' }),
        })
      )
    })
  })
})
