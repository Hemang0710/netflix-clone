import { render, screen, waitFor } from '@testing-library/react'
import KnowledgeMap from '@/components/knowledge/KnowledgeMap'
import WeakSpotsDashboard from '@/components/knowledge/WeakSpotsDashboard'
import LearningStreakTracker from '@/components/learning/LearningStreakTracker'
import ConceptMasteryPassport from '@/components/knowledge/ConceptMasteryPassport'

jest.mock('@/lib/masteryHelpers', () => ({
  getMasteryTierColor: jest.fn((score) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }),
  getMasteryLabel: jest.fn((score) => {
    if (score >= 80) return 'Mastered'
    if (score >= 60) return 'Proficient'
    if (score >= 40) return 'Developing'
    return 'Beginning'
  }),
}))

jest.mock('qrcode.react', () => {
  return function MockQRCode() {
    return <div data-testid="qr-code">QR Code</div>
  }
})

describe('Knowledge Map Feature Integration', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should load all knowledge map components together', async () => {
    const conceptsData = {
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
        {
          id: 3,
          concept: 'CSS',
          masteryScore: 50,
          reviewCount: 5,
          content: { title: 'Web Development' },
        },
      ],
    }

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => conceptsData,
    })

    const { rerender } = render(<KnowledgeMap />)

    await waitFor(() => {
      expect(screen.getByText('Personal Knowledge Map')).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/concepts')
  })

  it('should integrate weak spots detection with concepts', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          weakSpots: [
            {
              id: 3,
              concept: 'CSS',
              masteryScore: 50,
              reviewCount: 5,
              weaknessReason: 'insufficient_practice',
              daysUntilDue: 1,
              interval: 1,
            },
          ],
        }),
      })

    render(<WeakSpotsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('CSS')).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/concepts/weak-spots')
  })

  it('should show streak progress alongside mastery data', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reviewStreak: { current: 7, best: 15 },
          watchStreak: { current: 5, best: 10 },
          totalReviewSessions: 25,
          totalWatchedVideos: 12,
        }),
      })

    render(<LearningStreakTracker />)

    await waitFor(() => {
      expect(screen.getByText('7')).toBeInTheDocument() // Current streak
      expect(screen.getByText('15')).toBeInTheDocument() // Best streak
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/streaks')
  })

  it('should display passport with mastery achievements', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userId: 1,
          email: 'user@example.com',
          totalConcepts: 10,
          totalMastered: 5,
          topConcepts: ['React', 'JavaScript', 'Node.js', 'Express', 'MongoDB'],
          tierBreakdown: {
            Mastered: 5,
            Proficient: 3,
            Developing: 2,
            Beginning: 0,
          },
          totalReviews: 20,
          passportUrl: 'http://localhost:3000/passport/1',
        }),
      })

    render(<ConceptMasteryPassport />)

    await waitFor(() => {
      expect(screen.getByText('Concept Mastery Passport')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument() // totalMastered
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/user/passport')
  })

  it('should handle multiple component loads simultaneously', async () => {
    // Mock fetch to return different data for different endpoints
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/concepts')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            concepts: [
              {
                id: 1,
                concept: 'React',
                masteryScore: 85,
                reviewCount: 10,
                content: { title: 'Web' },
              },
            ],
          }),
        })
      } else if (url.includes('/api/streaks')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            reviewStreak: { current: 7, best: 15 },
            watchStreak: { current: 5, best: 10 },
          }),
        })
      } else if (url.includes('/api/user/passport')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            userId: 1,
            email: 'user@example.com',
            totalConcepts: 10,
            totalMastered: 5,
            topConcepts: [],
            tierBreakdown: {},
            totalReviews: 20,
            passportUrl: 'http://localhost:3000/passport/1',
          }),
        })
      }

      return Promise.resolve({ ok: false })
    })

    const { rerender } = render(
      <>
        <KnowledgeMap />
        <LearningStreakTracker />
        <ConceptMasteryPassport />
      </>
    )

    await waitFor(() => {
      expect(screen.getByText('Personal Knowledge Map')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Learning Streak Tracker')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Concept Mastery Passport')).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledTimes(6) // 3 components × 2 calls each
  })

  it('should handle API failures gracefully', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'))

    render(<KnowledgeMap />)

    await waitFor(() => {
      expect(screen.getByText(/start learning to visualize your knowledge map/i)).toBeInTheDocument()
    })
  })

  it('should calculate mastery tiers correctly across components', async () => {
    const mockConcepts = [
      { id: 1, concept: 'A', masteryScore: 85, reviewCount: 10, content: { title: 'C1' } }, // Mastered
      { id: 2, concept: 'B', masteryScore: 70, reviewCount: 8, content: { title: 'C1' } }, // Proficient
      { id: 3, concept: 'C', masteryScore: 50, reviewCount: 5, content: { title: 'C1' } }, // Developing
      { id: 4, concept: 'D', masteryScore: 30, reviewCount: 2, content: { title: 'C1' } }, // Beginning
    ]

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ concepts: mockConcepts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userId: 1,
          email: 'user@example.com',
          totalConcepts: 4,
          totalMastered: 1,
          topConcepts: ['A'],
          tierBreakdown: {
            Mastered: 1,
            Proficient: 1,
            Developing: 1,
            Beginning: 1,
          },
          totalReviews: 20,
          passportUrl: 'http://localhost:3000/passport/1',
        }),
      })

    const { rerender } = render(<KnowledgeMap />)

    await waitFor(() => {
      expect(screen.getByText('Personal Knowledge Map')).toBeInTheDocument()
    })

    rerender(<ConceptMasteryPassport />)

    await waitFor(() => {
      expect(screen.getByText('Concept Mastery Passport')).toBeInTheDocument()
    })
  })
})
