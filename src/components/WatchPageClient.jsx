// src/components/WatchPageClient.jsx
"use client"

import { useRef } from "react"
import VideoChapters from "./VideoChapters"

export default function WatchPageClient({ content, chapters, creatorName }) {
  const videoRef = useRef(null)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">

      {/* Video Player */}
      <div className="w-full aspect-video bg-black rounded-xl overflow-hidden mb-6">
        <video
          ref={videoRef}
          src={content.videoUrl}
          controls
          className="w-full h-full"
          poster={content.thumbnailUrl || undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left — Video Info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{content.title}</h1>
            <div className="flex items-center gap-4 text-zinc-400 text-sm">
              <span>{content.views} views</span>
              <span>{content.genre}</span>
              <span>{new Date(content.createdAt).toLocaleDateString("en-US")}</span>
            </div>
          </div>

          {/* Creator */}
          <div className="flex items-center gap-3 pb-6 border-b border-zinc-800">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold">
              {creatorName[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{creatorName}</p>
              <p className="text-zinc-400 text-sm">Creator</p>
            </div>
          </div>

          {/* Description */}
          {content.description && (
            <p className="text-zinc-300 leading-relaxed">
              {content.description}
            </p>
          )}

          {/* Chapters */}
          {chapters.length > 0 && (
            <VideoChapters chapters={chapters} videoRef={videoRef} />
          )}

          {/* AI Summary */}
          {content.aiSummary && (
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-white font-bold mb-3">✨ AI Summary</h3>
              <p className="text-zinc-300 text-sm leading-relaxed">
                {content.aiSummary}
              </p>
            </div>
          )}

          {/* Transcript */}
          {content.transcript && (
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-white font-bold mb-3">📝 Transcript</h3>
              <div className="text-zinc-400 text-sm leading-relaxed max-h-64 overflow-y-auto">
                {content.transcript}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          <h3 className="text-white font-bold">Video Details</h3>
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3 text-sm">
            {[
              { label: "Genre", value: content.genre },
              { label: "Price", value: content.isFree ? "Free" : `$${content.price}` },
              { label: "Views", value: content.views },
              { label: "Chapters", value: chapters.length > 0 ? `${chapters.length} chapters` : "None" },
              { label: "AI Processed", value: content.transcript ? "✅ Yes" : "❌ No" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-zinc-400">{label}</span>
                <span className="text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}