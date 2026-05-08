import { renderHook, act, waitFor } from '@testing-library/react'
import { useChapterCheckpoints } from '@/hooks/useChapterCheckpoints'

global.fetch = jest.fn()

describe('useChapterCheckpoints Hook', () => {
  const mockChapters = [
    { time: 0, title: 'Introduction' },
    { time: 60, title: 'Basics' },
    { time: 120, title: 'Advanced' },
    { time: 180, title: 'Conclusion' },
  ]

  const mockVideoRef = {
    current: {
      currentTime: 0,
      duration: 240,
      play: jest.fn(),
      pause: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should fetch existing checkpoints on mount', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ checkpoints: {} }),
      })

      const { result } = renderHook(() =>
        useChapterCheckpoints(1, mockChapters, mockVideoRef, 1)
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/checkpoints/1')
      })
    })

    it('should initialize with empty checkpoint state', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ checkpoints: {} }),
      })

      const { result } = renderHook(() =>
        useChapterCheckpoints(1, mockChapters, mockVideoRef, 1)
      )

      expect(result.current.checkpointState).toEqual({})
    })

    it('should not trigger if contentId is missing', () => {
      const { result } = renderHook(() =>
        useChapterCheckpoints(null, mockChapters, mockVideoRef, 1)
      )

      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('Checkpoint Detection', () => {
    it('should trigger checkpoint when chapter boundary is crossed', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ checkpoints: {} }),
      })

      const { result } = renderHook(() =>
        useChapterCheckpoints(1, mockChapters, mockVideoRef, 1)
      )

      // Simulate crossing from chapter 0 to chapter 1 (from 0s to 60s)
      await act(() => {
        mockVideoRef.current.currentTime = 65
        // Trigger the timeupdate event listener
        mockVideoRef.current.addEventListener.mock.calls[0][1]()
      })

      await waitFor(() => {
        expect(result.current.checkpointTrigger).not.toBeNull()
        expect(result.current.checkpointTrigger.chapterIndex).toBe(0)
        expect(result.current.checkpointTrigger.chapterTitle).toBe('Introduction')
      })
    })

    it('should pause video when checkpoint is triggered', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ checkpoints: {} }),
      })

      const { result } = renderHook(() =>
        useChapterCheckpoints(1, mockChapters, mockVideoRef, 1)
      )

      await act(() => {
        mockVideoRef.current.currentTime = 65
        mockVideoRef.current.addEventListener.mock.calls[0][1]()
      })

      await waitFor(() => {
        expect(mockVideoRef.current.pause).toHaveBeenCalled()
      })
    })

    it('should not trigger checkpoint twice for same chapter', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ checkpoints: {} }),
      })

      const { result } = renderHook(() =>
        useChapterCheckpoints(1, mockChapters, mockVideoRef, 1)
      )

      // First crossing
      await act(() => {
        mockVideoRef.current.currentTime = 65
        mockVideoRef.current.addEventListener.mock.calls[0][1]()
      })

      const firstTrigger = result.current.checkpointTrigger

      // Try again at same chapter
      await act(() => {
        mockVideoRef.current.currentTime = 100
        mockVideoRef.current.addEventListener.mock.calls[0][1]()
      })

      // Should still be same trigger (not re-triggered)
      expect(result.current.checkpointTrigger).toEqual(firstTrigger)
    })

    it('should recognize first watch vs rewatch', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ checkpoints: {} }),
      })

      const { result } = renderHook(() =>
        useChapterCheckpoints(1, mockChapters, mockVideoRef, 1)
      )

      await act(() => {
        mockVideoRef.current.currentTime = 65
        mockVideoRef.current.addEventListener.mock.calls[0][1]()
      })

      await waitFor(() => {
        expect(result.current.checkpointTrigger.isFirstWatch).toBe(true)
      })
    })

    it('should mark checkpoint as rewatch when already passed', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          checkpoints: { 0: { passed: true, score: 85, attempts: 1 } },
        }),
      })

      const { result } = renderHook(() =>
        useChapterCheckpoints(1, mockChapters, mockVideoRef, 1)
      )

      await waitFor(() => {
        expect(result.current.checkpointState[0]?.passed).toBe(true)
      })
    })
  })

  describe('clearCheckpoint', () => {
    it('should clear checkpoint trigger', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ checkpoints: {} }),
      })

      const { result } = renderHook(() =>
        useChapterCheckpoints(1, mockChapters, mockVideoRef, 1)
      )

      await act(() => {
        mockVideoRef.current.currentTime = 65
        mockVideoRef.current.addEventListener.mock.calls[0][1]()
      })

      expect(result.current.checkpointTrigger).not.toBeNull()

      act(() => {
        result.current.clearCheckpoint()
      })

      expect(result.current.checkpointTrigger).toBeNull()
    })

    it('should resume video when clearing checkpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ checkpoints: {} }),
      })

      const { result } = renderHook(() =>
        useChapterCheckpoints(1, mockChapters, mockVideoRef, 1)
      )

      await act(() => {
        mockVideoRef.current.currentTime = 65
        mockVideoRef.current.addEventListener.mock.calls[0][1]()
      })

      mockVideoRef.current.play.mockClear()

      act(() => {
        result.current.clearCheckpoint()
      })

      expect(mockVideoRef.current.play).toHaveBeenCalled()
    })
  })

  describe('markPassed', () => {
    it('should mark checkpoint as passed', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ checkpoints: {} }),
      })

      const { result } = renderHook(() =>
        useChapterCheckpoints(1, mockChapters, mockVideoRef, 1)
      )

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          checkpoint: { id: 1, passed: true, score: 80 },
        }),
      })

      await act(async () => {
        await result.current.markPassed(0, 80)
      })

      await waitFor(() => {
        expect(result.current.checkpointState[0]?.passed).toBe(true)
      })
    })

    it('should send POST to checkpoint endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ checkpoints: {} }),
      })

      const { result } = renderHook(() =>
        useChapterCheckpoints(1, mockChapters, mockVideoRef, 1)
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ checkpoint: { passed: true } }),
      })

      await act(async () => {
        await result.current.markPassed(0, 85)
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/checkpoints/1',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('85'),
          })
        )
      })
    })

    it('should clear checkpoint after marking passed', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ checkpoints: {} }),
      })

      const { result } = renderHook(() =>
        useChapterCheckpoints(1, mockChapters, mockVideoRef, 1)
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      await act(() => {
        mockVideoRef.current.currentTime = 65
        mockVideoRef.current.addEventListener.mock.calls[0][1]()
      })

      expect(result.current.checkpointTrigger).not.toBeNull()

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ checkpoint: { passed: true } }),
      })

      await act(async () => {
        await result.current.markPassed(0, 85)
      })

      expect(result.current.checkpointTrigger).toBeNull()
    })

    it('should increment attempts when marking', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          checkpoints: { 0: { passed: false, attempts: 1 } },
        }),
      })

      const { result } = renderHook(() =>
        useChapterCheckpoints(1, mockChapters, mockVideoRef, 1)
      )

      await waitFor(() => {
        expect(result.current.checkpointState[0]?.attempts).toBe(1)
      })

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          checkpoint: { passed: true, attempts: 2 },
        }),
      })

      await act(async () => {
        await result.current.markPassed(0, 75)
      })

      await waitFor(() => {
        expect(result.current.checkpointState[0]?.attempts).toBe(2)
      })
    })
  })

  describe('Event Listener Management', () => {
    it('should attach timeupdate listener', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ checkpoints: {} }),
      })

      renderHook(() =>
        useChapterCheckpoints(1, mockChapters, mockVideoRef, 1)
      )

      expect(mockVideoRef.current.addEventListener).toHaveBeenCalledWith(
        'timeupdate',
        expect.any(Function)
      )
    })

    it('should remove listener on cleanup', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ checkpoints: {} }),
      })

      const { unmount } = renderHook(() =>
        useChapterCheckpoints(1, mockChapters, mockVideoRef, 1)
      )

      unmount()

      expect(mockVideoRef.current.removeEventListener).toHaveBeenCalledWith(
        'timeupdate',
        expect.any(Function)
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch error when loading checkpoints', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() =>
        useChapterCheckpoints(1, mockChapters, mockVideoRef, 1)
      )

      // Should not crash and still be usable
      expect(result.current.checkpointState).toEqual({})
    })
  })
})
