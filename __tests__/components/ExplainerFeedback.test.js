import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import DiagramExplainer from "@/components/ai/visual/DiagramExplainer"
import AnalogyExplainer from "@/components/ai/visual/AnalogyExplainer"
import WalkthroughExplainer from "@/components/ai/visual/WalkthroughExplainer"
import VisualExplainer from "@/components/ai/visual/VisualExplainer"

// Mock the useExplanationFeedback hook
jest.mock("@/hooks/useExplanationFeedback", () => ({
  useExplanationFeedback: () => ({
    submitFeedback: jest.fn().mockResolvedValue({ id: 1 }),
    startTracking: jest.fn(),
    getUserPreferredStyle: jest.fn(),
    isSubmitting: false,
  }),
}))

describe("Explainer Feedback Components", () => {
  describe("DiagramExplainer Feedback", () => {
    it("should render feedback buttons", () => {
      render(
        <DiagramExplainer
          title="Test Diagram"
          description="Test description"
          svgCode="<svg></svg>"
          keyPoints={["Point 1", "Point 2"]}
          followUpPrompts={[]}
          contentId={1}
          chapterTitle="Chapter 1"
        />
      )

      // Check for "Did this help?" text
      expect(screen.getByText("Did this help?")).toBeInTheDocument()

      // Check for rating buttons (5 buttons total)
      const buttons = screen.getAllByTitle(/Rate \d\/5/)
      expect(buttons).toHaveLength(5)
    })

    it("should show success message after feedback", async () => {
      const { useExplanationFeedback } = require("@/hooks/useExplanationFeedback")
      const mockSubmit = jest.fn().mockResolvedValue({ id: 1 })
      useExplanationFeedback.mockReturnValue({
        submitFeedback: mockSubmit,
        startTracking: jest.fn(),
        isSubmitting: false,
      })

      render(
        <DiagramExplainer
          title="Test Diagram"
          description="Test description"
          svgCode="<svg></svg>"
          keyPoints={[]}
          followUpPrompts={[]}
          contentId={1}
          chapterTitle="Chapter 1"
        />
      )

      const ratingButtons = screen.getAllByTitle(/Rate \d\/5/)
      fireEvent.click(ratingButtons[4]) // Click 5-star rating

      await waitFor(() => {
        expect(screen.getByText("✓ Thanks for the feedback!")).toBeInTheDocument()
      })

      expect(mockSubmit).toHaveBeenCalledWith(
        "diagram",
        5,
        1,
        "Chapter 1"
      )
    })

    it("should hide feedback buttons after submission", async () => {
      render(
        <DiagramExplainer
          title="Test Diagram"
          description="Test description"
          svgCode="<svg></svg>"
          keyPoints={[]}
          followUpPrompts={[]}
          contentId={1}
          chapterTitle="Chapter 1"
        />
      )

      const ratingButtons = screen.getAllByTitle(/Rate \d\/5/)
      fireEvent.click(ratingButtons[0])

      await waitFor(() => {
        // The feedback buttons should be hidden after submission
        expect(screen.queryByText("Did this help?")).not.toBeInTheDocument()
      })
    })
  })

  describe("AnalogyExplainer Feedback", () => {
    it("should render feedback buttons", () => {
      render(
        <AnalogyExplainer
          title="Test Analogy"
          realWorldSetup="Real world setup"
          story="The story"
          mapping={[]}
          followUpPrompts={[]}
          contentId={1}
          chapterTitle="Chapter 1"
        />
      )

      expect(screen.getByText("Did this help?")).toBeInTheDocument()
      const buttons = screen.getAllByTitle(/Rate \d\/5/)
      expect(buttons).toHaveLength(5)
    })

    it("should submit correct explainer type", async () => {
      const { useExplanationFeedback } = require("@/hooks/useExplanationFeedback")
      const mockSubmit = jest.fn().mockResolvedValue({ id: 1 })
      useExplanationFeedback.mockReturnValue({
        submitFeedback: mockSubmit,
        startTracking: jest.fn(),
        isSubmitting: false,
      })

      render(
        <AnalogyExplainer
          title="Test Analogy"
          realWorldSetup="Setup"
          story="Story"
          mapping={[]}
          followUpPrompts={[]}
          contentId={2}
          chapterTitle="Chapter 2"
        />
      )

      const ratingButtons = screen.getAllByTitle(/Rate \d\/5/)
      fireEvent.click(ratingButtons[3]) // Click 4-star rating

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith("analogy", 4, 2, "Chapter 2")
      })
    })
  })

  describe("WalkthroughExplainer Feedback", () => {
    const testSteps = [
      {
        stepNumber: 1,
        title: "Step 1",
        explanation: "First step",
        keyPoint: "Important",
      },
      {
        stepNumber: 2,
        title: "Step 2",
        explanation: "Second step",
        keyPoint: "Also important",
      },
    ]

    it("should show feedback buttons only on last step", () => {
      const { rerender } = render(
        <WalkthroughExplainer
          title="Walkthrough"
          steps={testSteps}
          onGotIt={jest.fn()}
          onTryDifferent={jest.fn()}
          contentId={1}
          chapterTitle="Chapter 1"
        />
      )

      // On first step, no feedback buttons should be visible
      expect(screen.queryByText("Did this help?")).not.toBeInTheDocument()

      // Navigate to last step
      const nextButton = screen.getByText("Next →")
      fireEvent.click(nextButton)

      // Now feedback buttons should be visible
      expect(screen.getByText("Did this help?")).toBeInTheDocument()
    })

    it("should submit correct explainer type for walkthrough", async () => {
      const { useExplanationFeedback } = require("@/hooks/useExplanationFeedback")
      const mockSubmit = jest.fn().mockResolvedValue({ id: 1 })
      useExplanationFeedback.mockReturnValue({
        submitFeedback: mockSubmit,
        startTracking: jest.fn(),
        isSubmitting: false,
      })

      render(
        <WalkthroughExplainer
          title="Walkthrough"
          steps={testSteps}
          onGotIt={jest.fn()}
          onTryDifferent={jest.fn()}
          contentId={3}
          chapterTitle="Chapter 3"
        />
      )

      // Navigate to last step
      const nextButton = screen.getByText("Next →")
      fireEvent.click(nextButton)

      const ratingButtons = screen.getAllByTitle(/Rate \d\/5/)
      fireEvent.click(ratingButtons[4]) // Click 5-star

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          "walkthrough",
          5,
          3,
          "Chapter 3"
        )
      })
    })
  })

  describe("VisualExplainer Proactive Suggestion", () => {
    it("should show proactive hint when user has preferred style", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bestExplainerType: "diagram",
          scores: { diagram: { avgScore: 4.5 } },
        }),
      })

      render(
        <VisualExplainer
          data={{
            type: "diagram",
            title: "Test",
            description: "Test",
            svgCode: "<svg></svg>",
            keyPoints: [],
            followUpPrompts: [],
          }}
          onTryDifferent={jest.fn()}
          onFollowUp={jest.fn()}
          onGotIt={jest.fn()}
          contentId={1}
          chapterTitle="Chapter 1"
        />
      )

      await waitFor(() => {
        expect(
          screen.getByText(
            /Based on your learning style.*diagram.*work best/i
          )
        ).toBeInTheDocument()
      })
    })

    it("should not show hint when preferred style doesn't match current type", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bestExplainerType: "analogy",
          scores: { analogy: { avgScore: 4.5 } },
        }),
      })

      render(
        <VisualExplainer
          data={{
            type: "diagram",
            title: "Test",
            description: "Test",
            svgCode: "<svg></svg>",
            keyPoints: [],
            followUpPrompts: [],
          }}
          onTryDifferent={jest.fn()}
          onFollowUp={jest.fn()}
          onGotIt={jest.fn()}
          contentId={1}
          chapterTitle="Chapter 1"
        />
      )

      // Wait a bit to ensure fetch completes
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(
        screen.queryByText(/Based on your learning style/i)
      ).not.toBeInTheDocument()
    })
  })
})
