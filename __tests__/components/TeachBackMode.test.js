import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import TeachBackMode from "@/components/learning/TeachBackMode"

const jsonResponse = (data, ok = true) =>
  Promise.resolve({ ok, json: () => Promise.resolve(data) })

const GRADED_SESSION = {
  session: {
    id: 1,
    conceptMasteryId: 5,
    concept: "Recursion",
    audience: "beginner",
    explanation: "x",
    score: 84,
    accuracy: 90,
    completeness: 75,
    simplicity: 85,
    feedback: "Nice base-case framing.",
    gaps: ["Call stack behavior"],
    jargon: ["memoization"],
    followUp: "What if there is no base case?",
    createdAt: new Date().toISOString(),
  },
  quality: 2,
}

describe("TeachBackMode", () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it("renders the idle pitch card", () => {
    render(<TeachBackMode />)
    expect(screen.getByText(/Teach-Back Mode/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /start teaching/i })).toBeInTheDocument()
  })

  it("loads suggestions when starting and lets the user pick one", async () => {
    global.fetch.mockReturnValueOnce(
      jsonResponse({
        suggestions: [{ id: 5, concept: "Recursion", masteryScore: 20 }],
        sessions: [],
      })
    )

    render(<TeachBackMode />)
    fireEvent.click(screen.getByRole("button", { name: /start teaching/i }))

    const suggestion = await screen.findByText("Recursion")
    fireEvent.click(suggestion)

    expect(await screen.findByPlaceholderText(/explain recursion/i)).toBeInTheDocument()
  })

  it("submits an explanation and shows the Feynman grade", async () => {
    global.fetch
      .mockReturnValueOnce(jsonResponse({ suggestions: [], sessions: [] })) // GET on start
      .mockReturnValueOnce(jsonResponse(GRADED_SESSION)) // POST grade

    render(<TeachBackMode />)
    fireEvent.click(screen.getByRole("button", { name: /start teaching/i }))

    // free-text topic path
    const input = await screen.findByPlaceholderText(/type any topic/i)
    fireEvent.change(input, { target: { value: "Recursion" } })
    fireEvent.click(screen.getByRole("button", { name: /teach it/i }))

    const textarea = await screen.findByPlaceholderText(/explain recursion/i)
    fireEvent.change(textarea, {
      target: { value: "A function that calls itself on smaller inputs until a base case stops it." },
    })
    fireEvent.click(screen.getByRole("button", { name: /submit lesson/i }))

    expect(await screen.findByText("84")).toBeInTheDocument()
    expect(screen.getByText(/knowledge gaps/i)).toBeInTheDocument()
    expect(screen.getByText("Call stack behavior")).toBeInTheDocument()
    expect(screen.getByText(/what if there is no base case/i)).toBeInTheDocument()
  })

  it("commits the score to the review queue on lock-in", async () => {
    global.fetch
      .mockReturnValueOnce(jsonResponse({ suggestions: [], sessions: [] }))
      .mockReturnValueOnce(jsonResponse(GRADED_SESSION))
      .mockReturnValueOnce(jsonResponse({ concept: { id: 5 } })) // review commit

    render(<TeachBackMode />)
    fireEvent.click(screen.getByRole("button", { name: /start teaching/i }))

    const input = await screen.findByPlaceholderText(/type any topic/i)
    fireEvent.change(input, { target: { value: "Recursion" } })
    fireEvent.click(screen.getByRole("button", { name: /teach it/i }))

    const textarea = await screen.findByPlaceholderText(/explain recursion/i)
    fireEvent.change(textarea, {
      target: { value: "A function that calls itself on smaller inputs until a base case stops it." },
    })
    fireEvent.click(screen.getByRole("button", { name: /submit lesson/i }))

    fireEvent.click(await screen.findByRole("button", { name: /lock it in/i }))

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/concepts/5/review",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ quality: 2, score: 84 }),
        })
      )
    )
    expect(await screen.findByText(/lesson delivered/i)).toBeInTheDocument()
  })

  it("shows the server error and returns to writing on grading failure", async () => {
    global.fetch
      .mockReturnValueOnce(jsonResponse({ suggestions: [], sessions: [] }))
      .mockReturnValueOnce(jsonResponse({ error: "Too many teach-back attempts" }, false))

    render(<TeachBackMode />)
    fireEvent.click(screen.getByRole("button", { name: /start teaching/i }))

    const input = await screen.findByPlaceholderText(/type any topic/i)
    fireEvent.change(input, { target: { value: "Recursion" } })
    fireEvent.click(screen.getByRole("button", { name: /teach it/i }))

    const textarea = await screen.findByPlaceholderText(/explain recursion/i)
    fireEvent.change(textarea, {
      target: { value: "A function that calls itself on smaller inputs until a base case stops it." },
    })
    fireEvent.click(screen.getByRole("button", { name: /submit lesson/i }))

    expect(await screen.findByText(/too many teach-back attempts/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /submit lesson/i })).toBeInTheDocument()
  })
})
