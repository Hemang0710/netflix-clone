import { render, screen, waitFor } from '@testing-library/react'
import ConceptRelationshipGraph from '@/components/knowledge/ConceptRelationshipGraph'

describe('ConceptRelationshipGraph Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render loading state initially', () => {
    global.fetch.mockImplementation(() => new Promise(() => {}))

    render(<ConceptRelationshipGraph />)

    expect(screen.getByText(/building relationship graph/i)).toBeInTheDocument()
  })

  it('should render empty state when no relationships', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        nodes: [],
        edges: [],
      }),
    })

    render(<ConceptRelationshipGraph />)

    await waitFor(() => {
      expect(screen.getByText(/learn more concepts to see their connections/i)).toBeInTheDocument()
    })
  })

  it('should render graph with nodes and edges', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        nodes: [
          { id: '1', concept: 'React', masteryScore: 85, reviewCount: 10 },
          { id: '2', concept: 'JavaScript', masteryScore: 75, reviewCount: 8 },
          { id: '3', concept: 'Node.js', masteryScore: 65, reviewCount: 6 },
        ],
        edges: [
          { from: '1', to: '2', weight: 1 },
          { from: '2', to: '3', weight: 1 },
        ],
      }),
    })

    render(<ConceptRelationshipGraph />)

    await waitFor(() => {
      expect(screen.getByText('Concept Relationship Graph')).toBeInTheDocument()
      expect(screen.getByText('Total Concepts')).toBeInTheDocument()
    })
  })

  it('should display correct node count', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        nodes: [
          { id: '1', concept: 'React', masteryScore: 85, reviewCount: 10 },
          { id: '2', concept: 'JavaScript', masteryScore: 75, reviewCount: 8 },
        ],
        edges: [],
      }),
    })

    render(<ConceptRelationshipGraph />)

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument() // Total concepts
    })
  })

  it('should display edge count', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        nodes: [
          { id: '1', concept: 'React', masteryScore: 85, reviewCount: 10 },
          { id: '2', concept: 'JavaScript', masteryScore: 75, reviewCount: 8 },
        ],
        edges: [
          { from: '1', to: '2', weight: 1 },
        ],
      }),
    })

    render(<ConceptRelationshipGraph />)

    await waitFor(() => {
      const elements = screen.getAllByText('1')
      // Should have at least one element showing '1' (relationship count)
      expect(elements.length).toBeGreaterThan(0)
    })
  })

  it('should render SVG graph container', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        nodes: [
          { id: '1', concept: 'React', masteryScore: 85, reviewCount: 10 },
        ],
        edges: [],
      }),
    })

    const { container } = render(<ConceptRelationshipGraph />)

    await waitFor(() => {
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  it('should handle fetch error gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'))

    render(<ConceptRelationshipGraph />)

    await waitFor(() => {
      expect(screen.getByText(/learn more concepts to see their connections/i)).toBeInTheDocument()
    })
  })
})
