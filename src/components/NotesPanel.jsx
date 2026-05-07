"use client"

import { useState, useEffect, useRef } from "react"

function formatTime(secs) {
  if (!secs && secs !== 0) return null
  const m = Math.floor(secs / 60)
  const s = String(Math.floor(secs % 60)).padStart(2, "0")
  return `${m}:${s}`
}

export default function NotesPanel({ contentId, hasTranscript, videoRef }) {
  const [notes, setNotes] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => { fetchNotes() }, [contentId])

  async function fetchNotes() {
    setLoading(true)
    try {
      const res = await fetch(`/api/notes?contentId=${contentId}`)
      const data = await res.json()
      if (data.success) setNotes(data.data)
    } finally { setLoading(false) }
  }

  async function addNote(e) {
    e.preventDefault()
    if (!input.trim()) return
    const timestamp = videoRef?.current?.currentTime ?? null
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId, timestamp, body: input.trim() }),
    })
    const data = await res.json()
    if (data.success) { setNotes(prev => [...prev, data.data].sort((a, b) => (a.timestamp ?? Infinity) - (b.timestamp ?? Infinity))); setInput("") }
  }

  async function deleteNote(id) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" })
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  async function generateAINotes() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch("/api/ai/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      await fetchNotes()
    } catch (err) { setError(err.message) }
    finally { setGenerating(false) }
  }

  function seekTo(secs) {
    if (videoRef?.current && secs != null) videoRef.current.currentTime = secs
  }

  const aiNotes = notes.filter(n => n.isAI)
  const myNotes = notes.filter(n => !n.isAI)

  return (
    <div className="space-y-5">
      {/* AI Notes section */}
      {hasTranscript && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm flex items-center gap-2">🤖 AI-Generated Notes</h3>
            <button
              onClick={generateAINotes}
              disabled={generating}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
            >
              {generating ? "Generating…" : aiNotes.length ? "Regenerate" : "Generate Notes"}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
          {generating && (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-white/3 rounded-lg animate-pulse" />)}
            </div>
          )}
          {!generating && aiNotes.length === 0 && (
            <p className="text-slate-500 text-sm">Click "Generate Notes" to get AI-extracted key points from this video.</p>
          )}
          {!generating && aiNotes.map(note => (
            <div key={note.id} className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0 group">
              {note.timestamp != null && (
                <button
                  onClick={() => seekTo(note.timestamp)}
                  className="shrink-0 text-[10px] font-mono text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-md transition-colors mt-0.5"
                >
                  {formatTime(note.timestamp)}
                </button>
              )}
              <p className="text-slate-300 text-sm leading-relaxed flex-1">{note.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* My Notes section */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">📝 My Notes</h3>

        <form onSubmit={addNote} className="flex gap-2 mb-4">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Add a note at current timestamp…"
            className="flex-1 bg-white/5 border border-white/8 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-600 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-colors"
          >
            Add
          </button>
        </form>

        {loading && <p className="text-slate-500 text-sm">Loading…</p>}
        {!loading && myNotes.length === 0 && (
          <p className="text-slate-500 text-sm">No notes yet. Pause the video and jot something down.</p>
        )}
        {myNotes.map(note => (
          <div key={note.id} className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0 group">
            {note.timestamp != null && (
              <button
                onClick={() => seekTo(note.timestamp)}
                className="shrink-0 text-[10px] font-mono text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-md transition-colors mt-0.5"
              >
                {formatTime(note.timestamp)}
              </button>
            )}
            <p className="text-slate-300 text-sm leading-relaxed flex-1">{note.body}</p>
            <button
              onClick={() => deleteNote(note.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 text-xs transition-all shrink-0 mt-0.5"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
