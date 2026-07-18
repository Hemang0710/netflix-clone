jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    inboxItem: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    conceptMastery: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/openai', () => ({
  aiClient: { chat: { completions: { create: jest.fn() } } },
}))

import prisma from '@/lib/prisma'
import { aiClient } from '@/lib/openai'
import { processInboxItem } from '@/lib/inbox'

const TEXT_ITEM = {
  id: 1,
  userId: 1,
  sourceType: 'text',
  url: null,
  title: null,
  siteName: null,
  status: 'pending',
  rawText:
    'Recursion is a technique where a function calls itself. Every recursive function needs a base case to stop, and a recursive case that shrinks the problem toward the base case.',
}

function mockAIConcepts(payload) {
  aiClient.chat.completions.create.mockResolvedValueOnce({
    choices: [{ message: { content: '```json\n' + JSON.stringify(payload) + '\n```' } }],
  })
}

describe('processInboxItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // update echoes back the written data so assertions can read the result
    prisma.inboxItem.update.mockImplementation(async ({ where, data }) => ({ id: where.id, ...data }))
  })

  it('extracts concepts from a text capture and files them into the SM-2 queue', async () => {
    prisma.inboxItem.findFirst.mockResolvedValueOnce({ ...TEXT_ITEM })
    prisma.conceptMastery.findFirst.mockResolvedValue(null) // nothing learned yet
    prisma.conceptMastery.create
      .mockResolvedValueOnce({ id: 42 })
      .mockResolvedValueOnce({ id: 43 })
    mockAIConcepts({
      title: 'Recursion Basics',
      summary: 'How recursive functions work.',
      concepts: [
        { name: 'Recursion', definition: 'A function that calls itself to solve smaller subproblems.' },
        { name: 'Base Case', definition: 'The condition that stops a recursive function.' },
      ],
    })

    const result = await processInboxItem(1, 1)

    // first update marks it processing, final one stores the results
    expect(prisma.inboxItem.update).toHaveBeenCalledTimes(2)
    expect(prisma.inboxItem.update.mock.calls[0][0].data.status).toBe('processing')

    expect(result.status).toBe('ready')
    expect(result.title).toBe('Recursion Basics')
    const concepts = JSON.parse(result.concepts)
    expect(concepts).toHaveLength(2)
    expect(concepts[0]).toMatchObject({ name: 'Recursion', conceptMasteryId: 42, isNew: true })

    expect(prisma.conceptMastery.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 1, inboxItemId: 1, source: 'inbox', concept: 'Recursion' }),
      })
    )
  })

  it('reinforces an existing concept instead of duplicating it', async () => {
    prisma.inboxItem.findFirst.mockResolvedValueOnce({ ...TEXT_ITEM })
    prisma.conceptMastery.findFirst.mockResolvedValueOnce({ id: 7, concept: 'Recursion' })
    mockAIConcepts({
      title: 'T',
      summary: 'S',
      concepts: [{ name: 'recursion', definition: 'Same idea, new source.' }],
    })

    const result = await processInboxItem(1, 1)

    expect(prisma.conceptMastery.create).not.toHaveBeenCalled()
    const concepts = JSON.parse(result.concepts)
    expect(concepts[0]).toMatchObject({ name: 'Recursion', conceptMasteryId: 7, isNew: false })
  })

  it('marks the item failed when AI returns nothing usable', async () => {
    prisma.inboxItem.findFirst.mockResolvedValueOnce({ ...TEXT_ITEM })
    aiClient.chat.completions.create.mockResolvedValueOnce({
      choices: [{ message: { content: 'sorry, no JSON for you' } }],
    })

    const result = await processInboxItem(1, 1)

    expect(result.status).toBe('failed')
    expect(result.error).toMatch(/concepts/i)
    expect(prisma.conceptMastery.create).not.toHaveBeenCalled()
  })

  it('does not reprocess ready items', async () => {
    prisma.inboxItem.findFirst.mockResolvedValueOnce({ ...TEXT_ITEM, status: 'ready' })
    const result = await processInboxItem(1, 1)
    expect(result.status).toBe('ready')
    expect(prisma.inboxItem.update).not.toHaveBeenCalled()
  })

  it('throws for items the user does not own', async () => {
    prisma.inboxItem.findFirst.mockResolvedValueOnce(null)
    await expect(processInboxItem(999, 1)).rejects.toThrow(/not found/i)
  })
})
