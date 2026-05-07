"use client"

import { useState } from "react"

export default function ConceptMapPanel({ contentId, transcript, videoTitle }) {
  const [mapData, setMapData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [replayKey, setReplayKey] = useState(0)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/ai/concept-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, videoTitle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setMapData(data.data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm">🗺 Concept Map</h3>
            <p className="text-slate-500 text-xs mt-0.5">AI-generated visual overview of all topics</p>
          </div>
          <div className="flex gap-2">
            {mapData && (
              <button
                onClick={() => setReplayKey(k => k + 1)}
                className="text-xs text-slate-400 hover:text-white border border-white/8 px-3 py-1.5 rounded-lg transition-colors"
              >
                ↺ Replay
              </button>
            )}
            <button
              onClick={generate}
              disabled={loading}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
            >
              {loading ? "Generating…" : mapData ? "Regenerate" : "Generate Map"}
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        {loading && (
          <div className="aspect-video bg-white/3 rounded-xl animate-pulse flex items-center justify-center">
            <p className="text-slate-600 text-sm">Building concept map…</p>
          </div>
        )}

        {!loading && !mapData && (
          <div className="aspect-video bg-white/3 rounded-xl flex flex-col items-center justify-center gap-3">
            <span className="text-4xl">🗺</span>
            <p className="text-slate-500 text-sm">Generate a visual map of all concepts in this video</p>
          </div>
        )}

        {!loading && mapData && (
          <>
            <div
              key={replayKey}
              className="rounded-xl overflow-hidden border border-white/8"
              dangerouslySetInnerHTML={{ __html: mapData.svgCode }}
            />
            {mapData.branches?.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {mapData.branches.map((branch, i) => (
                  <div key={i} className="bg-white/3 rounded-xl p-3">
                    <p className="text-indigo-400 text-xs font-semibold mb-1.5">{branch.label}</p>
                    <ul className="space-y-1">
                      {branch.concepts.map((c, j) => (
                        <li key={j} className="text-slate-400 text-xs flex items-start gap-1.5">
                          <span className="text-slate-600 mt-0.5">•</span>{c}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
