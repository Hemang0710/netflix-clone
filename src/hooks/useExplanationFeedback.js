import { useEffect, useRef, useState } from "react"

export function useExplanationFeedback() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  // Start timer when explanation is shown
  function startTracking() {
    startTimeRef.current = Date.now()
  }

  // Stop timer and submit feedback
  async function submitFeedback(explainerType, helpfulnessScore, contentId, chapterTitle) {
    if (!startTimeRef.current) {
      console.warn("Feedback tracking not started")
      return
    }

    setIsSubmitting(true)
    try {
      const timeSpentSeconds = Math.round((Date.now() - startTimeRef.current) / 1000)

      const response = await fetch("/api/explanation-feedback/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          explainerType,
          helpfulnessScore,
          contentId,
          chapterTitle,
          timeSpentSeconds,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit feedback")
      }

      // Reset timer
      startTimeRef.current = null
      return await response.json()
    } catch (error) {
      console.error("Error submitting feedback:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get user's best explainer type from history
  async function getUserPreferredStyle() {
    try {
      const response = await fetch("/api/explanation-feedback/preferences")
      if (!response.ok) {
        throw new Error("Failed to fetch preferences")
      }
      const data = await response.json()
      return data.bestExplainerType || null
    } catch (error) {
      console.error("Error fetching user preferences:", error)
      return null
    }
  }

  return {
    submitFeedback,
    getUserPreferredStyle,
    startTracking,
    isSubmitting,
  }
}
