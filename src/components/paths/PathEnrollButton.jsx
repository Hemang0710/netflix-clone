"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function PathEnrollButton({ pathId, isLoggedIn, videoCount }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function enroll() {
    if (!isLoggedIn) { router.push("/login"); return }
    setLoading(true)
    await fetch(`/api/paths/${pathId}/enroll`, { method: "POST" })
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="text-center">
        <p className="text-2xl font-black text-white mb-1">Free</p>
        <p className="text-slate-500 text-sm">{videoCount} lessons included</p>
      </div>
      <button onClick={enroll} disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold px-4 py-3 rounded-xl transition-colors text-sm">
        {loading ? "Enrolling…" : "Enroll Now — Free"}
      </button>
      <p className="text-slate-600 text-xs text-center">Track your progress across all lessons</p>
    </div>
  )
}
