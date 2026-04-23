// src/components/ExternalWatchClient.jsx
"use client"

import { useRef, useState, useEffect } from "react"
import VideoChapters from "./VideoChapters"
import QuizSection from "./QuizSection"

export default function ExternalWatchClient({ content, chapters }) {
  const playerRef = useRef(null)
  const [isReady, setIsReady] = useState(false)

  // YouTube IFrame API integration
  useEffect(() => {
    // Load YouTube IFrame API script
    if (!window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      document.head.appendChild(tag)
    }

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player("youtube-player", {
        videoId: content.externalId,
        playerVars: {
          modestbranding: 1,
          rel: 0,          // no related videos at end
          origin: window.location.origin,
        },
        events: {
          onReady: () => setIsReady(true),
        },
      })
    }

    // If YT already loaded
    if (window.YT?.Player) {
      window.onYouTubeIframeAPIReady()
    }

    return () => {
      if (playerRef.current?.destroy) playerRef.current.destroy()
    }
  }, [content.externalId])

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

      {/* Video Player */}
      <div className="w-full aspect-video bg-black rounded-xl overflow-hidden mb-6">
        <div id="youtube-player" className="w-full h-full" />
      </div>

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
            <h1 className="text-2xl font-bold mb-1">{content.title}</h1>
            {content.channelName && (
              <p className="text-zinc-400 text-sm">
                📺 {content.channelName} • via YouTube
              </p>
            )}
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