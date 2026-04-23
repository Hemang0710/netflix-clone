import { useEffect, useRef, useState } from "react"

export function useVideoConfusion(videoRef, chapters = []) {
  const [confusionSignal, setConfusionSignal] = useState(null)
  const rewindCountRef = useRef({})  // { segmentKey: count }
  const lastTimeRef = useRef(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    function segmentKey(time) {
      if (chapters.length > 0) {
        for (let i = chapters.length - 1; i >= 0; i--) {
          if (time >= chapters[i].time) return `ch-${i}`
        }
      }
      return `s-${Math.floor(time / 30)}`
    }

    function segmentLabel(time) {
      if (chapters.length > 0) {
        for (let i = chapters.length - 1; i >= 0; i--) {
          if (time >= chapters[i].time) return chapters[i].title
        }
      }
      const m = Math.floor(time / 60)
      const s = String(Math.floor(time % 60)).padStart(2, "0")
      return `${m}:${s}`
    }

    function handleTimeUpdate() {
      if (!video.seeking) lastTimeRef.current = video.currentTime
    }

    function handleSeeked() {
      const prev = lastTimeRef.current
      const curr = video.currentTime
      // Only count intentional backward seeks > 5 seconds
      if (prev - curr > 5) {
        const key = segmentKey(curr)
        rewindCountRef.current[key] = (rewindCountRef.current[key] || 0) + 1
        if (rewindCountRef.current[key] >= 2) {
          setConfusionSignal({
            type: "rewind",
            chapter: segmentLabel(curr),
            prefill: `I'm confused about "${segmentLabel(curr)}"`,
          })
        }
      }
    }

    function handleRateChange() {
      if (video.playbackRate <= 0.75 && !video.paused) {
        setConfusionSignal({
          type: "slowdown",
          chapter: segmentLabel(video.currentTime),
          prefill: `Can you explain "${segmentLabel(video.currentTime)}" more slowly?`,
        })
      }
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("seeked", handleSeeked)
    video.addEventListener("ratechange", handleRateChange)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("seeked", handleSeeked)
      video.removeEventListener("ratechange", handleRateChange)
    }
  }, [videoRef, chapters])

  function clearSignal() {
    setConfusionSignal(null)
  }

  return { confusionSignal, clearSignal }
}
