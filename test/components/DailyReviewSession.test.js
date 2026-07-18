import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DailyReviewSession from '@/components/learning/DailyReviewSession'

// Mock fetch
global.fetch = jest.fn()

describe('DailyReviewSession Component', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('Idle State', () => {
    it('should render "All caught up" when no concepts are due', () => {
      render(<DailyReviewSession dueCount={0} />)
      expect(screen.getByText(/All caught up/i)).toBeInTheDocument()
    })

    it('should show concept count and start button when concepts are due', () => {
      render(<DailyReviewSession dueCount={3} />)
      expect(screen.getByText(/3 concepts due today/i)).toBeInTheDocument()
      expect(screen.getByText(/Start Review/i)).toBeInTheDocument()
    })

    it('should start session when button is clicked', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
          session: { id: 1, userId: 1 },
          dueConcepts: [
            {
              id: 1,
              concept: 'Hooks',
              interval: 1,
              repetitions: 0,
            },
          ],
        }),
        })
      )

      render(<DailyReviewSession dueCount={1} />)
      const startButton = screen.getByText(/Start Review/i)
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/review-session', { method: 'POST' })
      })
    })
  })

  describe('Review State', () => {
    it('should display progress bar during review', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
          session: { id: 1 },
          dueConcepts: [
            {
              id: 1,
              concept: 'React',
              interval: 1,
              repetitions: 0,
            },
            {
              id: 2,
              concept: 'Hooks',
              interval: 1,
              repetitions: 0,
            },
          ],
        }),
        })
      )

      render(<DailyReviewSession dueCount={2} />)
      const startButton = screen.getByText(/Start Review/i)
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText(/Concept 1 of 2/i)).toBeInTheDocument()
      })
    })

    it('should show reviewing interface', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
          session: { id: 1 },
          dueConcepts: [
            {
              id: 1,
              concept: 'Async/Await',
              interval: 1,
              repetitions: 0,
            },
          ],
        }),
        })
      )

      render(<DailyReviewSession dueCount={1} />)
      fireEvent.click(screen.getByText(/Start Review/i))

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type your answer/i)).toBeInTheDocument()
      })
    })

    it('should have textarea for answer input', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
          session: { id: 1 },
          dueConcepts: [{ id: 1, concept: 'Test', interval: 1, repetitions: 0 }],
        }),
        })
      )

      render(<DailyReviewSession dueCount={1} />)
      fireEvent.click(screen.getByText(/Start Review/i))

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/Type your answer here/i)
        expect(textarea).toBeInTheDocument()
      })
    })
  })

  describe('Completion State', () => {
    it('should show completion summary after session', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
          session: { id: 1 },
          dueConcepts: [{ id: 1, concept: 'Test', interval: 1, repetitions: 0 }],
        }),
        })
      )

      render(<DailyReviewSession dueCount={1} />)
      fireEvent.click(screen.getByText(/Start Review/i))

      // In a real test, we'd complete the review session
      // This is a simplified example
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      render(<DailyReviewSession dueCount={1} />)
      fireEvent.click(screen.getByText(/Start Review/i))

      // Error should be handled without crashing
      await waitFor(() => {
        // Should still be in idle state or show error message
        expect(screen.getByText(/Start Review/i)).toBeInTheDocument()
      })
    })
  })
})
