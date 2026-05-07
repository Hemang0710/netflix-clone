"use client"

import { useState } from "react"

// Split transcript into readable paragraphs
function splitToParagraphs(text) {
  const paras = text.split(/\n\n+/).filter(p => p.trim().length > 20)
  if (paras.length >= 3) return paras
  // Fallback: split by sentences into ~150-char chunks
  const chunks = []
  let current = ""
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    current += (current ? " " : "") + sentence
    if (current.length > 150) { chunks.push(current.trim()); current = "" }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks.length ? chunks : [text]
}

export default function TranscriptExplainer({ transcript, videoTitle }) {
  const [activeIdx, setActiveIdx] = useState(null)
  const [explanations, setExplanations] = useState({}) // { idx: data }
  const [loading, setLoading] = useState(null)

  const paragraphs = splitToParagraphs(transcript)

  async function explain(idx) {
    if (activeIdx === idx) { setActiveIdx(null); return }
    setActiveIdx(idx)
    if (explanations[idx]) return

    setLoading(idx)
    try {
      const surrounding = paragraphs.slice(Math.max(0, idx - 1), idx).join(" ")
      const res = await fetch("/api/ai/explain-moment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segment: paragraphs[idx], videoTitle, surroundingContext: surrounding }),
      })
      const data = await res.json()
      if (data.success) setExplanations(prev => ({ ...prev, [idx]: data.data }))
    } catch { /* silently fail */ }
    finally { setLoading(null) }
  }

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm">📝 Transcript</h3>
        <p className="text-slate-600 text-xs">Click any paragraph to get an AI explanation</p>
      </div>

      <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-hide pr-1">
        {paragraphs.map((para, idx) => {
          const isActive = activeIdx === idx
          const exp = explanations[idx]
          const isLoading = loading === idx

          return (
            <div key={idx}>
              <button
                onClick={() => explain(idx)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm leading-relaxed transition-all group ${
                  isActive
                    ? "bg-indigo-500/15 border border-indigo-500/30 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/4 border border-transparent"
                }`}
              >
                <span className="flex items-start gap-2">
                  <span className={`mt-1 shrink-0 text-[10px] transition-colors ${isActive ? "text-indigo-400" : "text-slate-700 group-hover:text-slate-500"}`}>
                    {isActive ? "▼" : "▶"}
                  </span>
                  {para}
                </span>
              </button>

              {/* Explanation panel */}
              {isActive && (
                <div className="mx-3 mb-2 rounded-xl bg-indigo-950/40 border border-indigo-500/20 p-3 space-y-2">
                  {isLoading && (
                    <div className="flex items-center gap-2 text-indigo-400 text-xs">
                      <span className="animate-spin inline-block">⟳</span> Explaining…
                    </div>
                  )}

                  {!isLoading && exp && (
                    <>
                      <p className="text-slate-200 text-xs leading-relaxed">{exp.explanation}</p>

                      {exp.whyItMatters && (
                        <div className="flex items-start gap-2 bg-indigo-500/10 rounded-lg px-2.5 py-2">
                          <span className="text-indigo-400 text-xs shrink-0">💡</span>
                          <p className="text-indigo-300 text-xs leading-snug">{exp.whyItMatters}</p>
                        </div>
                      )}

                      {exp.keyTerms?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {exp.keyTerms.map((t, i) => (
                            <span key={i} className="text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 px-2 py-0.5 rounded-full">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
