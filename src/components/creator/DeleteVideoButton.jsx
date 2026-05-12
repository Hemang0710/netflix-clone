"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DeleteVideoButton({ videoId, videoTitle }) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/content/${videoId}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Delete failed")
      router.refresh()
    } catch (err) {
      setError(err.message)
      setLoading(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        {error && <span className="text-red-400 text-xs">{error}</span>}
        <span className="text-xs text-slate-400 hidden sm:inline">Delete "{videoTitle}"?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs bg-red-600 hover:bg-red-700 disabled:bg-red-900 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
        >
          {loading ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="text-xs bg-white/5 hover:bg-white/10 border border-white/8 px-3 py-1.5 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-xs bg-white/5 hover:bg-red-600/20 hover:border-red-600/40 border border-white/8 text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg transition-all"
    >
      Delete
    </button>
  )
}
