// src/components/LearnPageClient.jsx
"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

function formatDuration(seconds) {
  if (!seconds) return ""
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function LearnPageClient({ initialVideos }) {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [videos, setVideos] = useState(initialVideos)

  async function handleImport(e) {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/external/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Failed to import video")
        return
      }

      if (data.alreadyExists) {
        setSuccess("Already in your library!")
      } else {
        setSuccess("Video imported! AI is processing it now...")
        setVideos(prev => [data.data, ...prev])
        setUrl("")
        // Refresh after 10s to show processed status
        setTimeout(() => router.refresh(), 10000)
      }

    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(id) {
    await fetch(`/api/external/${id}`, { method: "DELETE" })
    setVideos(prev => prev.filter(v => v.id !== id))
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">

      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-black mb-1">
            <span className="text-red-600">My</span> Learning Library
          </h1>
          <p className="text-zinc-400 mb-6">
            Paste any YouTube URL to learn with AI-powered features
          </p>

          {/* Import Form */}
          <form onSubmit={handleImport} className="flex gap-3">
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              className="flex-1 bg-zinc-800 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 border border-zinc-700"
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
            >
              {loading ? "Importing..." : "Add Video"}
            </button>
          </form>

          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          {success && <p className="text-green-400 text-sm mt-3">✅ {success}</p>}

          <p className="text-zinc-600 text-xs mt-3">
            Supports: youtube.com/watch, youtu.be, youtube.com/shorts
          </p>
        </div>
      </div>

      {/* Library Grid */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {videos.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-5xl mb-4">📚</p>
            <p className="text-xl">Your library is empty</p>
            <p className="text-sm mt-2">
              Paste a YouTube URL above to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-zinc-400 text-sm">{videos.length} video{videos.length !== 1 ? "s" : ""} in your library</p>
            {videos.map(video => (
              <div
                key={video.id}
                className="flex gap-4 bg-zinc-900 rounded-xl p-4 border border-zinc-800 hover:border-zinc-600 transition-colors group"
              >
                {/* Thumbnail */}
                <div className="shrink-0 w-40 h-24 rounded-lg overflow-hidden bg-zinc-800 relative">
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🎬</div>
                  )}
                  {/* Duration badge */}
                  {video.duration && (
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                      {formatDuration(video.duration)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/learn/${video.id}`}>
                    <h3 className="text-white font-semibold group-hover:text-red-400 transition-colors line-clamp-2 text-sm">
                      {video.title}
                    </h3>
                  </Link>
                  <p className="text-zinc-500 text-xs mt-1">{video.channelName}</p>

                  {/* Status badges */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {video.status === "pending" && (
                      <span className="text-xs bg-yellow-900/40 text-yellow-400 px-2 py-0.5 rounded-full">
                        ⏳ Processing
                      </span>
                    )}
                    {video.status === "ready" && (
                      <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">
                        ✅ AI Ready
                      </span>
                    )}
                    {video.status === "failed" && (
                      <span className="text-xs bg-red-900/40 text-red-400 px-2 py-0.5 rounded-full">
                        ❌ Processing failed
                      </span>
                    )}
                    {video.chapters && (
                      <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                        📑 Chapters
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  <Link
                    href={`/learn/${video.id}`}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors text-center"
                  >
                    Learn
                  </Link>
                  <button
                    onClick={() => handleRemove(video.id)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}