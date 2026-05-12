import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import ConceptMasteryPassport from '@/components/knowledge/ConceptMasteryPassport'

jest.mock('qrcode.react', () => {
  return function MockQRCode() {
    return <div data-testid="qr-code">QR Code</div>
  }
})

describe('ConceptMasteryPassport Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
    global.navigator.clipboard = {
      writeText: jest.fn().mockResolvedValue(undefined),
    }
    window.open = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render loading state initially', () => {
    global.fetch.mockImplementation(() => new Promise(() => {}))

    render(<ConceptMasteryPassport />)

    expect(screen.getByText(/loading your passport/i)).toBeInTheDocument()
  })

  it('should render passport data when fetched', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        userId: 1,
        email: 'user@example.com',
        totalConcepts: 10,
        totalMastered: 5,
        topConcepts: ['React', 'JavaScript', 'Node.js'],
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
      expect(screen.getByText('20')).toBeInTheDocument() // totalReviews
    })
  })

  it('should display top concepts', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        userId: 1,
        email: 'user@example.com',
        totalConcepts: 10,
        totalMastered: 3,
        topConcepts: ['React', 'JavaScript', 'Node.js'],
        tierBreakdown: {},
        totalReviews: 20,
        passportUrl: 'http://localhost:3000/passport/1',
      }),
    })

    render(<ConceptMasteryPassport />)

    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument()
      expect(screen.getByText('JavaScript')).toBeInTheDocument()
    })
  })

  it('should render QR code', async () => {
    global.fetch.mockResolvedValueOnce({
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

    render(<ConceptMasteryPassport />)

    await waitFor(() => {
      expect(screen.getByTestId('qr-code')).toBeInTheDocument()
    })
  })

  it('should handle copy link button', async () => {
    global.fetch.mockResolvedValueOnce({
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

    render(<ConceptMasteryPassport />)

    await waitFor(() => {
      const copyButton = screen.getByText('Copy Link')
      fireEvent.click(copyButton)
    })

    expect(global.navigator.clipboard.writeText).toHaveBeenCalledWith(
      'http://localhost:3000/passport/1'
    )
  })

  it('should handle Twitter share', async () => {
    global.fetch.mockResolvedValueOnce({
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

    render(<ConceptMasteryPassport />)

    await waitFor(() => {
      const twitterButton = screen.getAllByText('Twitter')[0]
      fireEvent.click(twitterButton)
    })

    expect(window.open).toHaveBeenCalled()
  })

  it('should render empty state when no data', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
    })

    render(<ConceptMasteryPassport />)

    await waitFor(() => {
      expect(screen.getByText(/start learning to create your mastery passport/i)).toBeInTheDocument()
    })
  })
})
