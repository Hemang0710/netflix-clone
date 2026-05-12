import { renderHook, act, waitFor } from "@testing-library/react"
import { useExplanationFeedback } from "@/hooks/useExplanationFeedback"

// Mock fetch
global.fetch = jest.fn()

describe("useExplanationFeedback", () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  it("should initialize with correct default values", () => {
    const { result } = renderHook(() => useExplanationFeedback())

    expect(result.current.isSubmitting).toBe(false)
    expect(typeof result.current.submitFeedback).toBe("function")
    expect(typeof result.current.getUserPreferredStyle).toBe("function")
    expect(typeof result.current.startTracking).toBe("function")
  })

  it("should start tracking when startTracking is called", () => {
    const { result } = renderHook(() => useExplanationFeedback())

    act(() => {
      result.current.startTracking()
    })

    // Should not throw and should be ready to submit
    expect(result.current.isSubmitting).toBe(false)
  })

  it("should submit feedback with correct data", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, helpfulnessScore: 5 }),
    })

    const { result } = renderHook(() => useExplanationFeedback())

    act(() => {
      result.current.startTracking()
    })

    let response
    await act(async () => {
      response = await result.current.submitFeedback(
        "diagram",
        5,
        123,
        "Chapter 1"
      )
    })

    expect(fetch).toHaveBeenCalledWith("/api/explanation-feedback/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: expect.stringContaining('"explainerType":"diagram"'),
    })
    expect(response).toEqual({ id: 1, helpfulnessScore: 5 })
  })

  it("should handle feedback submission errors gracefully", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Failed" }),
    })

    const { result } = renderHook(() => useExplanationFeedback())

    act(() => {
      result.current.startTracking()
    })

    const consoleSpy = jest.spyOn(console, "error").mockImplementation()

    await act(async () => {
      await result.current.submitFeedback("diagram", 5, 123, "Chapter 1")
    })

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error submitting feedback:",
      expect.any(Error)
    )

    consoleSpy.mockRestore()
  })

  it("should fetch user's preferred style", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        bestExplainerType: "analogy",
        scores: {
          diagram: { avgScore: 3, count: 2 },
          analogy: { avgScore: 4.5, count: 3 },
          walkthrough: { avgScore: 2, count: 1 },
        },
      }),
    })

    const { result } = renderHook(() => useExplanationFeedback())

    let preferredStyle
    await act(async () => {
      preferredStyle = await result.current.getUserPreferredStyle()
    })

    expect(preferredStyle).toBe("analogy")
    expect(fetch).toHaveBeenCalledWith("/api/explanation-feedback/preferences")
  })

  it("should return null when no preferred style found", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        bestExplainerType: null,
        scores: {
          diagram: { avgScore: 0, count: 0 },
          analogy: { avgScore: 0, count: 0 },
          walkthrough: { avgScore: 0, count: 0 },
        },
      }),
    })

    const { result } = renderHook(() => useExplanationFeedback())

    let preferredStyle
    await act(async () => {
      preferredStyle = await result.current.getUserPreferredStyle()
    })

    expect(preferredStyle).toBeNull()
  })

  it("should calculate time spent in seconds", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1 }),
    })

    const { result } = renderHook(() => useExplanationFeedback())

    act(() => {
      result.current.startTracking()
    })

    // Wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000))

    await act(async () => {
      await result.current.submitFeedback("diagram", 5, 123, "Chapter 1")
    })

    const callBody = JSON.parse(fetch.mock.calls[0][1].body)
    expect(callBody.timeSpentSeconds).toBeGreaterThanOrEqual(1)
    expect(callBody.timeSpentSeconds).toBeLessThan(3) // Should be ~1-2 seconds
  })
})
