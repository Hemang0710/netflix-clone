import { render, screen, waitFor } from '@testing-library/react'
import LearningStreakTracker from '@/components/learning/LearningStreakTracker'

describe('LearningStreakTracker Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render loading state initially', () => {
    global.fetch.mockImplementation(() => new Promise(() => {}))

    render(<LearningStreakTracker />)

    expect(screen.getByText(/loading your streak/i)).toBeInTheDocument()
  })

  it('should render empty state when no streaks', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reviewStreak: { current: 0, best: 0 },
        watchStreak: { current: 0, best: 0 },
      }),
    })

    render(<LearningStreakTracker />)

    await waitFor(() => {
      expect(screen.getByText(/start reviewing concepts to build your streak/i)).toBeInTheDocument()
    })
  })

  it('should display current and best streaks', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reviewStreak: { current: 5, best: 15 },
        watchStreak: { current: 3, best: 10 },
        totalReviewSessions: 25,
        totalWatchedVideos: 12,
      }),
    })

    render(<LearningStreakTracker />)

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument() // Current streak
      expect(screen.getByText('15')).toBeInTheDocument() // Best streak
    })
  })

  it('should show next milestone when streak is below max', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reviewStreak: { current: 5, best: 15 },
        watchStreak: { current: 3, best: 10 },
        totalReviewSessions: 25,
        totalWatchedVideos: 12,
      }),
    })

    render(<LearningStreakTracker />)

    await waitFor(() => {
      expect(screen.getByText(/next milestone/i)).toBeInTheDocument()
      expect(screen.getByText(/2 weeks/i)).toBeInTheDocument() // Next milestone at 14 days
    })
  })

  it('should show unlocked milestones', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reviewStreak: { current: 30, best: 30 },
        watchStreak: { current: 25, best: 30 },
        totalReviewSessions: 100,
        totalWatchedVideos: 80,
      }),
    })

    render(<LearningStreakTracker />)

    await waitFor(() => {
      expect(screen.getByText(/achievements unlocked/i)).toBeInTheDocument()
    })
  })

  it('should handle fetch error gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'))

    render(<LearningStreakTracker />)

    await waitFor(() => {
      expect(screen.getByText(/start reviewing concepts to build your streak/i)).toBeInTheDocument()
    })
  })

  it('should calculate correct days to milestone', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reviewStreak: { current: 3, best: 10 },
        watchStreak: { current: 2, best: 8 },
        totalReviewSessions: 15,
        totalWatchedVideos: 8,
      }),
    })

    render(<LearningStreakTracker />)

    await waitFor(() => {
      expect(screen.getByText(/4 days to unlock/i)).toBeInTheDocument() // 7 - 3 = 4
    })
  })
})
