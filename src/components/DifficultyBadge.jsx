"use client"

import { useState } from "react"

const CONFIG = {
  beginner:     { label: "Beginner",     color: "emerald", icon: "🟢" },
  intermediate: { label: "Intermediate", color: "amber",   icon: "🟡" },
  advanced:     { label: "Advanced",     color: "red",     icon: "🔴" },
}

export default function DifficultyBadge({ contentId, difficulty: initial, isCreator = false }) {
  const [difficulty, setDifficulty] = useState(initial || "intermediate")
  const [loading, setLoading] = useState(false)
  const cfg = CONFIG[difficulty] || CONFIG.intermediate

  async function autoDetect() {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/difficulty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      })
      const data = await res.json()
      if (data.success) setDifficulty(data.data.difficulty)
    } finally { setLoading(false) }
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold bg-${cfg.color}-500/15 text-${cfg.color}-400 border border-${cfg.color}-500/25`}>
        {cfg.icon} {cfg.label}
      </span>
      {isCreator && (
        <button onClick={autoDetect} disabled={loading}
          className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors disabled:opacity-50">
          {loading ? "detecting…" : "AI detect"}
        </button>
      )}
    </div>
  )
}
