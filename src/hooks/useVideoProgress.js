import { useEffect, useRef, useCallback } from "react"

export function useVideoProgress(videoRef, contentId) {
  const saveIntervalRef = useRef(null)
  const lastSavedRef = useRef(0)

  // Load saved progress when video is ready
  const loadProgress = useCallback(async () => {
    if (!contentId || !videoRef.current) return

    try {
      const res = await fetch(`/api/progress?contentId=${contentId}`)
      const data = await res.json()

      if (data.success && data.data.timestamp > 10) {
        // Only resume if more than 10 seconds in
        videoRef.current.currentTime = data.data.timestamp
      }
    } catch (error) {
      console.error("Failed to load progress:", error)
    }
  }, [contentId, videoRef])

  // Save progress every 10 seconds while watching
  const saveProgress = useCallback(async () => {
    if (!videoRef.current || !contentId) return

    const { currentTime, duration, paused } = videoRef.current

    // Only save if playing and position changed significantly
    if (paused || Math.abs(currentTime - lastSavedRef.current) < 5) return

    lastSavedRef.current = currentTime

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          timestamp: Math.floor(currentTime),
          duration: Math.floor(duration) || 0,
        }),
      })
    } catch (error) {
      console.error("Failed to save progress:", error)
    }
  }, [contentId, videoRef])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Load saved position when video metadata loads
    video.addEventListener("loadedmetadata", loadProgress)

    // Save progress every 10 seconds
    saveIntervalRef.current = setInterval(saveProgress, 10000)

    // Save when user pauses
    video.addEventListener("pause", saveProgress)

    // Save when user leaves the page
    window.addEventListener("beforeunload", saveProgress)

    return () => {
      video.removeEventListener("loadedmetadata", loadProgress)
      video.removeEventListener("pause", saveProgress)
      window.removeEventListener("beforeunload", saveProgress)
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current)
      }
    }
  }, [loadProgress, saveProgress, videoRef])
}