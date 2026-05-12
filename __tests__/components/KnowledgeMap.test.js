import { render, screen, waitFor } from '@testing-library/react'
import KnowledgeMap from '@/components/knowledge/KnowledgeMap'

jest.mock('@/lib/masteryHelpers', () => ({
  getMasteryTierColor: jest.fn((score) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }),
}))

describe('KnowledgeMap Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render loading state initially', () => {
    global.fetch.mockImplementation(() => new Promise(() => {}))

    render(<KnowledgeMap />)

    expect(screen.getByText(/generating your knowledge map/i)).toBeInTheDocument()
  })

  it('should render empty state when no concepts', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ concepts: [] }),
    })

    render(<KnowledgeMap />)

    await waitFor(() => {
      expect(screen.getByText(/start learning to visualize your knowledge map/i)).toBeInTheDocument()
    })
  })

  it('should render treemap with concepts', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        concepts: [
          {
            id: 1,
            concept: 'React',
            masteryScore: 85,
            reviewCount: 10,
            content: { title: 'Web Development' },
          },
          {
            id: 2,
            concept: 'JavaScript',
            masteryScore: 75,
            reviewCount: 8,
            content: { title: 'Web Development' },
          },
        ],
      }),
    })

    render(<KnowledgeMap />)

    await waitFor(() => {
      expect(screen.getByText('Personal Knowledge Map')).toBeInTheDocument()
      expect(screen.getByText('Total Concepts')).toBeInTheDocument()
    })
  })

  it('should display correct stats', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        concepts: [
          {
            id: 1,
            concept: 'React',
            masteryScore: 85,
            reviewCount: 10,
            content: { title: 'Web Development' },
          },
          {
            id: 2,
            concept: 'JavaScript',
            masteryScore: 50,
            reviewCount: 5,
            content: { title: 'Web Development' },
          },
        ],
      }),
    })

    render(<KnowledgeMap />)

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument() // Total Concepts
      expect(screen.getByText('1')).toBeInTheDocument() // Mastered
    })
  })

  it('should handle fetch error gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'))

    render(<KnowledgeMap />)

    await waitFor(() => {
      expect(screen.getByText(/start learning to visualize your knowledge map/i)).toBeInTheDocument()
    })
  })
})
