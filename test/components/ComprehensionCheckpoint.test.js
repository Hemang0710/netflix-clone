import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ComprehensionCheckpoint from '@/components/learning/ComprehensionCheckpoint'

global.fetch = jest.fn()

describe('ComprehensionCheckpoint Component', () => {
  const mockProps = {
    contentId: 1,
    chapterIndex: 0,
    chapterTitle: 'Introduction to React',
    isFirstWatch: true,
    onPass: jest.fn(),
    onSkip: jest.fn(),
    transcript: 'React is a JavaScript library for building user interfaces...',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render checkpoint overlay', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ question: 'What is React?' }),
      })

      render(<ComprehensionCheckpoint {...mockProps} />)
      expect(screen.getByText(/Chapter Check-in/i)).toBeInTheDocument()
      expect(screen.getByText(/Introduction to React/i)).toBeInTheDocument()
    })

    it('should show loading state initially', () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {})) // Never resolves

      render(<ComprehensionCheckpoint {...mockProps} />)
      expect(screen.getByText(/Generating question/i)).toBeInTheDocument()
    })

    it('should generate and display a question', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ question: 'What is JSX?' }),
      })

      render(<ComprehensionCheckpoint {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText(/What is JSX\?/i)).toBeInTheDocument()
      })
    })
  })

  describe('First Watch Behavior', () => {
    it('should not show skip button immediately on first watch', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ question: 'Test question?' }),
      })

      render(<ComprehensionCheckpoint {...mockProps} isFirstWatch={true} />)

      await waitFor(() => {
        const skipButton = screen.queryByText(/Skip/i)
        expect(skipButton).not.toBeInTheDocument()
      })
    })

    it('should show skip button after 5 seconds on first watch', async () => {
      jest.useFakeTimers()
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ question: 'Test?' }),
      })

      render(<ComprehensionCheckpoint {...mockProps} isFirstWatch={true} />)

      await waitFor(() => {
        expect(screen.getByText(/Your Answer/i)).toBeInTheDocument()
      })

      jest.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(screen.getByText(/Skip/i)).toBeInTheDocument()
      })

      jest.useRealTimers()
    })
  })

  describe('Rewatch Behavior', () => {
    it('should show skip button immediately on rewatch', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ question: 'Test?' }),
      })

      render(<ComprehensionCheckpoint {...mockProps} isFirstWatch={false} />)

      await waitFor(() => {
        expect(screen.getByText(/Skip/i)).toBeInTheDocument()
      })
    })
  })

  describe('Answer Submission', () => {
    it('should submit answer when submit button is clicked', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ question: 'What is a component?' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            score: 85,
            feedback: 'Good explanation',
            correct: true,
          }),
        })

      const { rerender } = render(<ComprehensionCheckpoint {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Your Answer/i)).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText(/Type your answer/i)
      fireEvent.change(textarea, {
        target: { value: 'A component is a reusable piece of UI' },
      })

      const submitButton = screen.getByText(/Submit Answer/i)
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/concepts/evaluate',
          expect.objectContaining({
            method: 'POST',
          })
        )
      })
    })

    it('should prevent submission with empty answer', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ question: 'Test?' }),
      })

      render(<ComprehensionCheckpoint {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Your Answer/i)).toBeInTheDocument()
      })

      const submitButton = screen.getByText(/Submit Answer/i)
      fireEvent.click(submitButton)

      // Should show error about empty answer
      await waitFor(() => {
        expect(screen.getByText(/Please provide an answer/i)).toBeInTheDocument()
      })
    })
  })

  describe('Score Display', () => {
    it('should display score after evaluation', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ question: 'Test?' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            score: 75,
            feedback: 'Good job!',
            correct: true,
          }),
        })

      render(<ComprehensionCheckpoint {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Your Answer/i)).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText(/Type your answer/i)
      fireEvent.change(textarea, { target: { value: 'Test answer' } })
      fireEvent.click(screen.getByText(/Submit Answer/i))

      await waitFor(() => {
        expect(screen.getByText(/75/)).toBeInTheDocument()
      })
    })

    it('should show success message for passing score', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ question: 'Test?' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            score: 80,
            feedback: 'Excellent!',
            correct: true,
          }),
        })

      render(<ComprehensionCheckpoint {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Your Answer/i)).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText(/Type your answer/i)
      fireEvent.change(textarea, { target: { value: 'Test answer' } })
      fireEvent.click(screen.getByText(/Submit Answer/i))

      await waitFor(() => {
        expect(screen.getByText(/Great job/i)).toBeInTheDocument()
      })
    })

    it('should show encourage message for low score', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ question: 'Test?' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            score: 40,
            feedback: 'Try again',
            correct: false,
          }),
        })

      render(<ComprehensionCheckpoint {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Your Answer/i)).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText(/Type your answer/i)
      fireEvent.change(textarea, { target: { value: 'Wrong answer' } })
      fireEvent.click(screen.getByText(/Submit Answer/i))

      await waitFor(() => {
        expect(screen.getByText(/Good effort/i)).toBeInTheDocument()
      })
    })
  })

  describe('Callbacks', () => {
    it('should call onPass when continuing after passing score', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ question: 'Test?' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            score: 85,
            feedback: 'Great!',
            correct: true,
          }),
        })

      render(<ComprehensionCheckpoint {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Your Answer/i)).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText(/Type your answer/i)
      fireEvent.change(textarea, { target: { value: 'Test answer' } })
      fireEvent.click(screen.getByText(/Submit Answer/i))

      await waitFor(() => {
        expect(screen.getByText(/Continue Watching/i)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Continue Watching/i))

      await waitFor(() => {
        expect(mockProps.onPass).toHaveBeenCalledWith(0, 85)
      })
    })

    it('should call onSkip when skip button is clicked', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ question: 'Test?' }),
      })

      render(<ComprehensionCheckpoint {...mockProps} isFirstWatch={false} />)

      await waitFor(() => {
        expect(screen.getByText(/Skip/i)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Skip/i))

      expect(mockProps.onSkip).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle question generation error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed to generate'))

      render(<ComprehensionCheckpoint {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to load question/i)).toBeInTheDocument()
      })
    })

    it('should handle evaluation error', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ question: 'Test?' }),
        })
        .mockRejectedValueOnce(new Error('Evaluation failed'))

      render(<ComprehensionCheckpoint {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Your Answer/i)).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText(/Type your answer/i)
      fireEvent.change(textarea, { target: { value: 'Test' } })
      fireEvent.click(screen.getByText(/Submit Answer/i))

      await waitFor(() => {
        expect(screen.getByText(/Failed to evaluate answer/i)).toBeInTheDocument()
      })
    })
  })
})
