// src/components/ExternalWatchClient.jsx
"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, Share2, BookmarkPlus } from "lucide-react"
import VideoChapters from "@/components/video/VideoChapters"
import QuizSection from "@/components/learning/QuizSection"

export default function ExternalWatchClient({ content, chapters, userProgress, userId }) {
  const playerRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [playerError, setPlayerError] = useState(null)
  const progressIntervalRef = useRef(null)

  // YouTube IFrame API integration
  useEffect(() => {
    // Guard: ensure we have a video ID
    if (!content?.externalId) {
      console.warn('[YOUTUBE_PLAYER] Missing externalId:', content)
      return
    }

    // Load YouTube IFrame API script
    if (!window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      tag.async = true
      document.head.appendChild(tag)
    }

    const initializePlayer = () => {
      try {
        if (playerRef.current) {
          playerRef.current.destroy()
        }

        playerRef.current = new window.YT.Player("youtube-player", {
          videoId: content.externalId,
          playerVars: {
            modestbranding: 1,
            rel: 0,
            origin: window.location.origin,
            start: userProgress?.timestamp ? Math.floor(userProgress.timestamp) : 0,
          },
          events: {
            onReady: () => {
              console.log('[YOUTUBE_PLAYER] Ready with video:', content.externalId)
              setIsReady(true)
              setPlayerError(null)
            },
            onError: (event) => {
              const errorMsg = `YouTube player error code: ${event.data}`
              console.error('[YOUTUBE_PLAYER]', errorMsg)
              setPlayerError(errorMsg)
              setIsReady(false)
            },
          },
        })
      } catch (error) {
        const errorMsg = `Failed to initialize player: ${error.message}`
        console.error('[YOUTUBE_PLAYER] Initialization error:', errorMsg)
        setPlayerError(errorMsg)
      }
    }

    window.onYouTubeIframeAPIReady = initializePlayer

    // If YT already loaded, initialize immediately
    if (window.YT?.Player) {
      initializePlayer()
    }

    return () => {
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy()
        } catch (e) {
          console.warn('[YOUTUBE_PLAYER] Error destroying player:', e)
        }
      }
    }
  }, [content?.externalId, userProgress?.timestamp])

  // Track watch progress
  useEffect(() => {
    if (!userId || !isReady || !playerRef.current) return

    const saveProgress = async () => {
      const currentTime = playerRef.current?.getCurrentTime?.() || 0
      const duration = playerRef.current?.getDuration?.() || 0
      const completed = duration > 0 && currentTime / duration > 0.9

      try {
        await fetch(`/api/external/${content.id}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timestamp: currentTime, completed }),
        })
      } catch (err) {
        console.error('[PROGRESS_SAVE] error:', err)
      }
    }

    progressIntervalRef.current = setInterval(saveProgress, 10000)
    return () => clearInterval(progressIntervalRef.current)
  }, [userId, isReady, content.id])

  // Jump to chapter timestamp
  function jumpToTime(seconds) {
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(seconds, true)
      playerRef.current.playVideo()
    }
  }

  // Ref-like object VideoChapters expects
  const videoRef = {
    current: {
      currentTime: 0,
      play: () => playerRef.current?.playVideo(),
      get currentTime() {
        return playerRef.current?.getCurrentTime?.() || 0
      },
      set currentTime(val) {
        playerRef.current?.seekTo(val, true)
      },
    },
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">

      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/library" className="p-2 hover:bg-zinc-800 rounded transition-colors">
          <ChevronLeft size={24} className="text-zinc-400" />
        </Link>
        <h1 className="text-xl font-semibold text-zinc-300">Back to Library</h1>
      </div>

      {/* Video Player */}
      <div className="w-full aspect-video bg-black rounded-xl overflow-hidden mb-6">
        {!content?.externalId ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-zinc-400">
              <p className="text-lg mb-2">❌ Video not available</p>
              <p className="text-sm">The video ID is missing or invalid.</p>
            </div>
          </div>
        ) : playerError ? (
          <div className="w-full h-full flex items-center justify-center bg-zinc-950 p-6">
            <div className="text-center max-w-md">
              <p className="text-lg font-semibold text-red-400 mb-2">⚠️ Player Failed to Load</p>
              <p className="text-sm text-zinc-400 mb-4">{playerError}</p>
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                Watch on YouTube →
              </a>
            </div>
          </div>
        ) : (
          <div id="youtube-player" style={{ width: '100%', height: '100%' }} />
        )}
      </div>

      {/* Player Load Status */}
      {content?.externalId && !isReady && !playerError && content.status !== "pending" && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 mb-6 text-sm text-zinc-400">
          ⏳ Loading YouTube player... If this takes too long, try refreshing the page.
        </div>
      )}

      {/* Processing banner */}
      {content.status === "pending" && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="animate-spin text-xl">⚙️</span>
          <div>
            <p className="text-white font-semibold">AI is processing this video</p>
            <p className="text-zinc-400 text-sm">Transcript, chapters and quiz will appear shortly</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left — Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
            <div className="flex items-center gap-4 flex-wrap">
              {content.channelName && (
                <p className="text-zinc-400 text-sm">
                  📺 {content.channelName}
                </p>
              )}
              {content.duration && (
                <p className="text-zinc-400 text-sm">
                  ⏱️ {Math.floor(content.duration / 60)}:{String(content.duration % 60).padStart(2, '0')}
                </p>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => {
                    const text = `Check out "${content.title}" on stream-ai\n${window.location.href}`
                    navigator.clipboard.writeText(text)
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded transition-colors text-zinc-300"
                >
                  <Share2 size={16} />
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* Chapters */}
          {chapters.length > 0 && (
            <VideoChapters chapters={chapters} videoRef={videoRef} />
          )}

          {/* AI Summary */}
          {content.aiSummary && (
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-white font-bold mb-3">✨ AI Summary</h3>
              <p className="text-zinc-300 text-sm leading-relaxed">{content.aiSummary}</p>
            </div>
          )}

          {/* Quiz */}
          {content.transcript && (
            <QuizSection
              contentId={content.id}
              hasTranscript={true}
              contentType="external"
            />
          )}

          {/* Description */}
          {content.description && (
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-white font-bold mb-3">Description</h3>
              <p className="text-zinc-400 text-sm leading-relaxed line-clamp-6">
                {content.description}
              </p>
            </div>
          )}
        </div>

        {/* Right — Details */}
        <div className="space-y-4">
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3 text-sm">
            {[
              { label: "Source", value: "YouTube" },
              { label: "Channel", value: content.channelName || "Unknown" },
              { label: "Chapters", value: chapters.length > 0 ? `${chapters.length} chapters` : "Processing..." },
              { label: "AI Processed", value: content.transcript ? "✅ Yes" : "⏳ Pending" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-zinc-400">{label}</span>
                <span className="text-white">{value}</span>
              </div>
            ))}
          </div>

          <a
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm transition-colors border border-zinc-700"
          >
            Watch on YouTube ↗
          </a>
        </div>
      </div>
    </div>
  )
}