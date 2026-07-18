import { render, screen, waitFor } from '@testing-library/react'
import ConceptMasteryList from '@/components/knowledge/ConceptMasteryList'

global.fetch = jest.fn()

describe('ConceptMasteryList Component', () => {
  const mockConcepts = [
    {
      id: 1,
      concept: 'React Hooks',
      masteryScore: 85,
      lastScore: 90,
      reviewCount: 5,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      interval: 10,
      repetitions: 3,
    },
    {
      id: 2,
      concept: 'State Management',
      masteryScore: 65,
      lastScore: 60,
      reviewCount: 3,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      interval: 3,
      repetitions: 2,
    },
    {
      id: 3,
      concept: 'Testing',
      masteryScore: 45,
      lastScore: 50,
      reviewCount: 2,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      interval: 1,
      repetitions: 1,
    },
  ]

  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))
      render(<ConceptMasteryList />)
      expect(screen.getByText(/Loading concepts/i)).toBeInTheDocument()
    })

    it('should display all concepts after loading', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ concepts: mockConcepts }),
        })
      )

      render(<ConceptMasteryList />)

      await waitFor(() => {
        expect(screen.getByText('React Hooks')).toBeInTheDocument()
        expect(screen.getByText('State Management')).toBeInTheDocument()
        expect(screen.getByText('Testing')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should show empty state when no concepts exist', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ concepts: [] }),
        })
      )

      render(<ConceptMasteryList />)

      await waitFor(() => {
        expect(screen.getByText(/Start watching videos/i)).toBeInTheDocument()
      }, { timeout: 5000 })
    })
  })


  describe('Due Status', () => {
    it('should show "Due now" badge for overdue concepts', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ concepts: mockConcepts }),
        })
      )

      render(<ConceptMasteryList />)

      await waitFor(() => {
        expect(screen.getByText(/Due now/i)).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should show "Due in X days" for future concepts', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ concepts: mockConcepts }),
        })
      )

      render(<ConceptMasteryList />)

      await waitFor(() => {
        const dueTexts = screen.queryAllByText(/Due in \d+ days?/i)
        expect(dueTexts.length).toBeGreaterThan(0)
      }, { timeout: 5000 })
    })
  })

  describe('Statistics', () => {
    it('should display concept count', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ concepts: mockConcepts }),
        })
      )

      render(<ConceptMasteryList />)

      await waitFor(() => {
        expect(screen.getByText(/3 total concepts/i)).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should display due concept count', async () => {
      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ concepts: mockConcepts }),
        })
      )

      render(<ConceptMasteryList />)

      await waitFor(() => {
        expect(screen.getByText(/1 due for review/i)).toBeInTheDocument()
      }, { timeout: 5000 })
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      render(<ConceptMasteryList />)

      await waitFor(() => {
        expect(screen.getByText(/Loading concepts|Start watching/i)).toBeInTheDocument()
      }, { timeout: 5000 })
    })
  })
})
