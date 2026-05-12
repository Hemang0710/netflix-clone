import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import WeakSpotsDashboard from '@/components/knowledge/WeakSpotsDashboard'

jest.mock('@/lib/masteryHelpers', () => ({
  getMasteryColor: jest.fn((score) => {
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

describe('WeakSpotsDashboard Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render loading state initially', () => {
    global.fetch.mockImplementation(() => new Promise(() => {}))

    render(<WeakSpotsDashboard />)

    expect(screen.getByText(/analyzing your weak spots/i)).toBeInTheDocument()
  })

  it('should render empty state when no weak spots', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        weakSpots: [],
      }),
    })

    render(<WeakSpotsDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/great job! no weak spots detected/i)).toBeInTheDocument()
    })
  })

  it('should display weak spots', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        weakSpots: [
          {
            id: 1,
            concept: 'Advanced Closures',
            masteryScore: 35,
            reviewCount: 2,
            weaknessReason: 'insufficient_practice',
            daysUntilDue: 1,
            interval: 1,
          },
          {
            id: 2,
            concept: 'Async/Await',
            masteryScore: 45,
            reviewCount: 5,
            weaknessReason: 'rapid_forgetting',
            daysUntilDue: 2,
            interval: 3,
          },
        ],
      }),
    })

    render(<WeakSpotsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Advanced Closures')).toBeInTheDocument()
      expect(screen.getByText('Async/Await')).toBeInTheDocument()
    })
  })

  it('should show weakness reason', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        weakSpots: [
          {
            id: 1,
            concept: 'Advanced Closures',
            masteryScore: 35,
            reviewCount: 2,
            weaknessReason: 'insufficient_practice',
            daysUntilDue: 1,
            interval: 1,
          },
        ],
      }),
    })

    render(<WeakSpotsDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/needs more review sessions/i)).toBeInTheDocument()
    })
  })

  it('should display mastery scores', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        weakSpots: [
          {
            id: 1,
            concept: 'Advanced Closures',
            masteryScore: 35,
            reviewCount: 2,
            weaknessReason: 'insufficient_practice',
            daysUntilDue: 1,
            interval: 1,
          },
        ],
      }),
    })

    render(<WeakSpotsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('35')).toBeInTheDocument() // Mastery score
    })
  })

  it('should expand concept details on click', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        weakSpots: [
          {
            id: 1,
            concept: 'Advanced Closures',
            masteryScore: 35,
            reviewCount: 2,
            weaknessReason: 'insufficient_practice',
            daysUntilDue: 1,
            interval: 1,
          },
        ],
      }),
    })

    render(<WeakSpotsDashboard />)

    await waitFor(() => {
      const conceptCard = screen.getByText('Advanced Closures').closest('div')
      fireEvent.click(conceptCard)
    })

    expect(screen.getByText(/why this is weak/i)).toBeInTheDocument()
  })

  it('should show review now button', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        weakSpots: [
          {
            id: 1,
            concept: 'Advanced Closures',
            masteryScore: 35,
            reviewCount: 2,
            weaknessReason: 'insufficient_practice',
            daysUntilDue: 1,
            interval: 1,
          },
        ],
      }),
    })

    render(<WeakSpotsDashboard />)

    await waitFor(() => {
      const conceptCard = screen.getByText('Advanced Closures').closest('div')
      fireEvent.click(conceptCard)
    })

    expect(screen.getByText(/review now/i)).toBeInTheDocument()
  })

  it('should show summary stats when multiple weak spots', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        weakSpots: [
          {
            id: 1,
            concept: 'Advanced Closures',
            masteryScore: 35,
            reviewCount: 2,
            weaknessReason: 'insufficient_practice',
            daysUntilDue: 1,
            interval: 1,
          },
          {
            id: 2,
            concept: 'Async/Await',
            masteryScore: 45,
            reviewCount: 5,
            weaknessReason: 'rapid_forgetting',
            daysUntilDue: 2,
            interval: 3,
          },
          {
            id: 3,
            concept: 'Promises',
            masteryScore: 30,
            reviewCount: 1,
            weaknessReason: 'never_reviewed',
            daysUntilDue: 0,
            interval: 1,
          },
          {
            id: 4,
            concept: 'Event Loop',
            masteryScore: 25,
            reviewCount: 0,
            weaknessReason: 'never_reviewed',
            daysUntilDue: 0,
            interval: 1,
          },
        ],
      }),
    })

    render(<WeakSpotsDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/total weak spots: 4/i)).toBeInTheDocument()
    })
  })

  it('should handle fetch error gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'))

    render(<WeakSpotsDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/start learning to visualize your knowledge map/i)).toBeInTheDocument()
    })
  })
})
