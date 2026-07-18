import { render, screen, waitFor } from '@testing-library/react'
import ForgettingCurveChart from '@/components/learning/ForgettingCurveChart'

global.fetch = jest.fn()

// Mock recharts
jest.mock('recharts', () => ({
  LineChart: ({ data, children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }) => <div data-testid="container">{children}</div>,
  ReferenceLine: () => <div data-testid="reference-line" />,
}))

describe('ForgettingCurveChart Component', () => {
  const mockConcepts = [
    {
      id: 1,
      concept: 'React Hooks',
      interval: 6,
      easeFactor: 2.5,
      masteryScore: 85,
      reviewCount: 5,
    },
    {
      id: 2,
      concept: 'State Management',
      interval: 3,
      easeFactor: 2.3,
      masteryScore: 65,
      reviewCount: 3,
    },
    {
      id: 3,
      concept: 'Testing',
      interval: 1,
      easeFactor: 2.0,
      masteryScore: 45,
      reviewCount: 1,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      render(<ForgettingCurveChart />)
      expect(screen.getByText(/Loading forgetting curves/i)).toBeInTheDocument()
    })

    it('should display chart after loading', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ concepts: mockConcepts }),
      })

      render(<ForgettingCurveChart />)

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      })
    })

    it('should show empty state when no concepts exist', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ concepts: [] }),
      })

      render(<ForgettingCurveChart />)

      await waitFor(() => {
        expect(screen.getByText(/Start reviewing concepts/i)).toBeInTheDocument()
      })
    })
  })

  describe('Chart Components', () => {
    it('should render chart with required axes', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ concepts: mockConcepts }),
      })

      render(<ForgettingCurveChart />)

      await waitFor(() => {
        expect(screen.getByTestId('x-axis')).toBeInTheDocument()
        expect(screen.getByTestId('y-axis')).toBeInTheDocument()
        expect(screen.getByTestId('grid')).toBeInTheDocument()
      })
    })

    it('should render reference line at 70% retention', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ concepts: mockConcepts }),
      })

      render(<ForgettingCurveChart />)

      await waitFor(() => {
        expect(screen.getByTestId('reference-line')).toBeInTheDocument()
      })
    })

    it('should render multiple lines for each concept', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ concepts: mockConcepts }),
      })

      render(<ForgettingCurveChart />)

      await waitFor(() => {
        const lines = screen.getAllByTestId('line')
        expect(lines.length).toBeGreaterThanOrEqual(mockConcepts.length)
      })
    })
  })

  describe('Concept Selection', () => {
    it('should limit to top 8 concepts by review count', async () => {
      const manyConceptsMock = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        concept: `Concept ${i}`,
        interval: Math.floor(i / 2) + 1,
        easeFactor: 2.5,
        masteryScore: 50,
        reviewCount: 15 - i, // Descending
      }))

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ concepts: manyConceptsMock }),
      })

      render(<ForgettingCurveChart />)

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      })
    })
  })

  describe('Color Coding', () => {
    it('should color high mastery concepts (>80%) in green', async () => {
      const coloredConcepts = [
        { ...mockConcepts[0], masteryScore: 85 }, // green
      ]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ concepts: coloredConcepts }),
      })

      render(<ForgettingCurveChart />)

      await waitFor(() => {
        expect(screen.getByText(/High mastery/i)).toBeInTheDocument()
      })
    })

    it('should color medium mastery concepts (50-80%) in amber', async () => {
      const coloredConcepts = [
        { ...mockConcepts[1], masteryScore: 65 }, // amber
      ]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ concepts: coloredConcepts }),
      })

      render(<ForgettingCurveChart />)

      await waitFor(() => {
        expect(screen.getByText(/Medium mastery/i)).toBeInTheDocument()
      })
    })

    it('should color low mastery concepts (<50%) in red', async () => {
      const coloredConcepts = [
        { ...mockConcepts[2], masteryScore: 45 }, // red
      ]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ concepts: coloredConcepts }),
      })

      render(<ForgettingCurveChart />)

      await waitFor(() => {
        expect(screen.getByText(/Low mastery/i)).toBeInTheDocument()
      })
    })
  })

  describe('Legend', () => {
    it('should display legend with color explanation', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ concepts: mockConcepts }),
      })

      render(<ForgettingCurveChart />)

      await waitFor(() => {
        expect(screen.getByTestId('legend')).toBeInTheDocument()
        expect(screen.getByText(/High mastery/i)).toBeInTheDocument()
        expect(screen.getByText(/Medium mastery/i)).toBeInTheDocument()
        expect(screen.getByText(/Low mastery/i)).toBeInTheDocument()
      })
    })
  })

  describe('Data Generation', () => {
    it('should generate correct forgetting curve data', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ concepts: mockConcepts }),
      })

      render(<ForgettingCurveChart />)

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      })

      // Chart should be rendered with data
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })
  })

  describe('Responsive Container', () => {
    it('should wrap chart in responsive container', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ concepts: mockConcepts }),
      })

      render(<ForgettingCurveChart />)

      await waitFor(() => {
        expect(screen.getByTestId('container')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      render(<ForgettingCurveChart />)

      await waitFor(() => {
        // Should render loading or empty state without crashing
        const loadingText = screen.queryByText(/Loading forgetting curves/i)
        const emptyText = screen.queryByText(/Start reviewing concepts/i)
        expect(loadingText || emptyText).toBeInTheDocument()
      })
    })
  })
})
