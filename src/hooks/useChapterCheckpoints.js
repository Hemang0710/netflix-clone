'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Hook for managing comprehension checkpoints during video playback
 * Detects when a chapter ends and triggers a checkpoint
 */
export function useChapterCheckpoints(contentId, chapters, videoRef, userId) {
  const [checkpointTrigger, setCheckpointTrigger] = useState(null)
  const [checkpointState, setCheckpointState] = useState({})
  const [lastCheckpointChapter, setLastCheckpointChapter] = useState(null)

  // Fetch existing checkpoints on mount
  useEffect(() => {
    if (!contentId || !userId) return

    const fetchCheckpoints = async () => {
      try {
        const res = await fetch(`/api/checkpoints/${contentId}`)
        if (res.ok) {
          const { checkpoints } = await res.json()
          setCheckpointState(checkpoints)
        }
      } catch (error) {
        console.error('Error fetching checkpoints:', error)
      }
    }

    fetchCheckpoints()
  }, [contentId, userId])

  // Monitor video time to detect chapter boundaries
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef?.current || !chapters || chapters.length === 0) return

    const currentTime = videoRef.current.currentTime

    // Find which chapter we're currently in
    for (let i = 0; i < chapters.length - 1; i++) {
      const chapterStart = chapters[i].time
      const chapterEnd = chapters[i + 1].time

      // Check if we just passed the end of chapter i
      // (we've crossed the boundary into chapter i+1)
      if (
        currentTime >= chapterEnd &&
        lastCheckpointChapter !== i &&
        !checkpointState[i]?.passed
      ) {
        setLastCheckpointChapter(i)

        // Get the chapter we just completed
        const completedChapter = chapters[i]
        const isFirstWatch = !checkpointState[i]

        setCheckpointTrigger({
          chapterIndex: i,
          chapterTitle: completedChapter.title || `Chapter ${i + 1}`,
          isFirstWatch,
        })

        // Pause the video
        videoRef.current.pause()
        return
      }
    }

    // Handle last chapter completion (at end of video)
    const lastIdx = chapters.length - 1
    const lastChapterStart = chapters[lastIdx].time
    const videoDuration = videoRef.current.duration
    if (
      currentTime >= videoDuration * 0.95 &&
      lastCheckpointChapter !== lastIdx &&
      !checkpointState[lastIdx]?.passed
    ) {
      setLastCheckpointChapter(lastIdx)
      const lastChapter = chapters[lastIdx]
      const isFirstWatch = !checkpointState[lastIdx]

      setCheckpointTrigger({
        chapterIndex: lastIdx,
        chapterTitle: lastChapter.title || `Chapter ${lastIdx + 1}`,
        isFirstWatch,
      })

      videoRef.current.pause()
    }
  }, [videoRef, chapters, lastCheckpointChapter, checkpointState])

  // Attach time update listener
  useEffect(() => {
    const video = videoRef?.current
    if (!video) return

    video.addEventListener('timeupdate', handleTimeUpdate)
    return () => video.removeEventListener('timeupdate', handleTimeUpdate)
  }, [handleTimeUpdate])

  // Mark checkpoint as passed and resume video
  const markPassed = useCallback(
    async (chapterIndex, score) => {
      try {
        const chapter = chapters[chapterIndex]
        const res = await fetch(`/api/checkpoints/${contentId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chapterIndex,
            chapterTitle: chapter?.title,
            passed: true,
            score,
          }),
        })

        if (res.ok) {
          setCheckpointState((prev) => ({
            ...prev,
            [chapterIndex]: { passed: true, score, attempts: (prev[chapterIndex]?.attempts || 0) + 1 },
          }))
        }
      } catch (error) {
        console.error('Error marking checkpoint passed:', error)
      }

      clearCheckpoint()
    },
    [contentId, chapters]
  )

  // Clear checkpoint and resume video
  const clearCheckpoint = useCallback(() => {
    setCheckpointTrigger(null)
    if (videoRef?.current) {
      videoRef.current.play()
    }
  }, [videoRef])

  return {
    checkpointTrigger,
    checkpointState,
    clearCheckpoint,
    markPassed,
  }
}
