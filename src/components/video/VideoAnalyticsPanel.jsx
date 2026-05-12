"use client"

import { useState } from "react"

const BUCKET_LABELS = ["0-10%", "10-20%", "20-30%", "30-40%", "40-50%", "50-60%", "60-70%", "70-80%", "80-90%", "90-100%"]

export default function VideoAnalyticsPanel({ videoId, videoTitle }) {
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function load() {
    if (open) { setOpen(false); return }
    setOpen(true)
    if (data) return
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics/content/${videoId}`)
      const json = await res.json()
      if (json.success) setData(json.data)
    } finally { setLoading(false) }
  }

  const maxBucket = data ? Math.max(...data.dropOffBuckets, 1) : 1

  return (
    <div className="mt-2">
      <button
        onClick={load}
        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
      >
        📊 {open ? "Hide" : "View"} Analytics
      </button>

      {open && (
        <div className="mt-3 bg-[#0d0d1a] border border-white/6 rounded-xl p-4 space-y-4">
          {loading && <p className="text-slate-500 text-xs">Loading…</p>}

          {data && (
            <>
              {/* Top stats */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Total Views",    value: data.views,          icon: "👁" },
                  { label: "Unique Viewers", value: data.uniqueViewers,  icon: "👤" },
                  { label: "Completions",    value: `${data.completionRate}%`, icon: "✅" },
                  { label: "Avg Watch",      value: `${data.avgCompletion}%`,  icon: "⏱" },
                ].map(s => (
                  <div key={s.label} className="bg-white/3 rounded-lg p-3 text-center">
                    <p className="text-lg">{s.icon}</p>
                    <p className="text-white font-bold text-sm mt-0.5">{s.value}</p>
                    <p className="text-slate-600 text-[10px]">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Drop-off chart */}
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2">Watch-through drop-off</p>
                <div className="flex items-end gap-1 h-16">
                  {data.dropOffBuckets.map((count, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <div
                        className="w-full bg-indigo-500/60 rounded-t-sm transition-all group-hover:bg-indigo-400"
                        style={{ height: `${Math.round((count / maxBucket) * 52)}px`, minHeight: count > 0 ? "2px" : "0" }}
                        title={`${BUCKET_LABELS[i]}: ${count} viewers`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-slate-700 mt-1">
                  <span>Start</span><span>50%</span><span>End</span>
                </div>
              </div>

              {/* Quiz + engagement */}
              <div className="grid grid-cols-3 gap-2 text-center border-t border-white/5 pt-3">
                <div>
                  <p className="text-white font-bold text-sm">{data.quizAttempts}</p>
                  <p className="text-slate-600 text-[10px]">Quiz attempts</p>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{data.avgQuizScore != null ? `${data.avgQuizScore}%` : "—"}</p>
                  <p className="text-slate-600 text-[10px]">Avg quiz score</p>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{data.noteCount + data.commentCount}</p>
                  <p className="text-slate-600 text-[10px]">Notes + comments</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
