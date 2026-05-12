"use client"

import { useState, useEffect } from "react"

const RATINGS = [
  { quality: 0, label: "Again",  color: "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25", emoji: "🔁" },
  { quality: 1, label: "Hard",   color: "bg-orange-500/15 border-orange-500/30 text-orange-400 hover:bg-orange-500/25", emoji: "😰" },
  { quality: 2, label: "Good",   color: "bg-indigo-500/15 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25", emoji: "👍" },
  { quality: 3, label: "Easy",   color: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25", emoji: "⚡" },
]

export default function FlashcardDeck({ contentId, hasTranscript }) {
  const [state, setState] = useState("idle") // idle | loading | generating | reviewing | done
  const [cards, setCards] = useState([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [rating, setRating] = useState(null)
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 })
  const [error, setError] = useState("")
  const [nextInfo, setNextInfo] = useState("")

  if (!hasTranscript) return null

  async function loadCards() {
    setState("loading")
    setError("")
    try {
      const res = await fetch(`/api/ai/flashcards?contentId=${contentId}`)
      const data = await res.json()
      if (data.success && data.flashcards.length > 0) {
        setCards(data.flashcards)
        setIndex(0)
        setFlipped(false)
        setState("reviewing")
      } else {
        setState("generating")
        await generateCards()
      }
    } catch {
      setError("Failed to load flashcards")
      setState("idle")
    }
  }

  async function generateCards() {
    try {
      const res = await fetch("/api/ai/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.message || "Failed to generate flashcards")
        setState("idle")
        return
      }
      setCards(data.flashcards)
      setIndex(0)
      setFlipped(false)
      setState("reviewing")
    } catch {
      setError("Failed to generate flashcards")
      setState("idle")
    }
  }

  async function handleRate(quality) {
    if (rating !== null) return
    setRating(quality)

    const card = cards[index]
    const key = ["again", "hard", "good", "easy"][quality]
    setSessionStats((prev) => ({ ...prev, [key]: prev[key] + 1 }))

    try {
      const res = await fetch("/api/flashcards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardId: card.id, quality }),
      })
      const data = await res.json()
      if (data.success) setNextInfo(data.message)
    } catch {
      // non-critical, continue anyway
    }

    setTimeout(() => {
      if (index + 1 >= cards.length) {
        setState("done")
      } else {
        setIndex((i) => i + 1)
        setFlipped(false)
        setRating(null)
        setNextInfo("")
      }
    }, 900)
  }

  const card = cards[index]
  const progress = cards.length > 0 ? ((index) / cards.length) * 100 : 0

  return (
    <div className="glass-card rounded-2xl border border-indigo-500/15 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold flex items-center gap-2">
            🃏 Spaced Repetition Flashcards
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">SM-2 algorithm — reviews when you&apos;re about to forget</p>
        </div>
        {state === "idle" && (
          <button
            onClick={loadCards}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all glow-indigo-sm"
          >
            Start Deck
          </button>
        )}
        {state === "reviewing" && (
          <span className="text-slate-500 text-sm font-mono">
            {index + 1} / {cards.length}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {state === "reviewing" && (
        <div className="h-1 bg-white/5">
          <div
            className="h-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* States */}
      {(state === "loading" || state === "generating") && (
        <div className="p-12 text-center">
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">
            {state === "generating" ? "AI is generating your flashcards..." : "Loading your deck..."}
          </p>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm p-4 bg-red-500/5 border-b border-red-500/10">{error}</p>
      )}

      {/* Flashcard */}
      {state === "reviewing" && card && (
        <div className="p-6">
          {/* Card flip area */}
          <div
            onClick={() => !flipped && setFlipped(true)}
            className={`relative min-h-48 rounded-2xl border flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-300 ${
              flipped
                ? "bg-indigo-500/8 border-indigo-500/25"
                : "bg-white/3 border-white/8 hover:border-indigo-500/20 hover:bg-white/5"
            }`}
          >
            {!flipped ? (
              <div>
                <p className="text-slate-500 text-xs mb-4 uppercase tracking-widest">Question</p>
                <p className="text-white text-lg font-semibold leading-relaxed">{card.front}</p>
                <p className="text-slate-600 text-xs mt-6">Tap to reveal answer</p>
              </div>
            ) : (
              <div>
                <p className="text-indigo-400 text-xs mb-4 uppercase tracking-widest">Answer</p>
                <p className="text-white text-base leading-relaxed">{card.back}</p>
              </div>
            )}
          </div>

          {/* Rating buttons — only show after flip */}
          {flipped && (
            <div className="mt-5">
              <p className="text-slate-500 text-xs text-center mb-3">How well did you know this?</p>
              <div className="grid grid-cols-4 gap-2">
                {RATINGS.map((r) => (
                  <button
                    key={r.quality}
                    onClick={() => handleRate(r.quality)}
                    disabled={rating !== null}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-bold transition-all disabled:opacity-40 ${r.color}`}
                  >
                    <span className="text-lg">{r.emoji}</span>
                    {r.label}
                  </button>
                ))}
              </div>
              {nextInfo && (
                <p className="text-center text-slate-500 text-xs mt-3 animate-pulse">{nextInfo}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Done screen */}
      {state === "done" && (
        <div className="p-10 text-center">
          <p className="text-4xl mb-4">🎉</p>
          <h4 className="text-white font-bold text-xl mb-2">Deck Complete!</h4>
          <p className="text-slate-400 text-sm mb-6">Your reviews are scheduled based on how well you knew each card.</p>
          <div className="grid grid-cols-4 gap-3 mb-8 max-w-sm mx-auto">
            {[
              { label: "Again", val: sessionStats.again, color: "text-red-400" },
              { label: "Hard",  val: sessionStats.hard,  color: "text-orange-400" },
              { label: "Good",  val: sessionStats.good,  color: "text-indigo-400" },
              { label: "Easy",  val: sessionStats.easy,  color: "text-emerald-400" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                <p className="text-slate-600 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setState("idle"); setIndex(0); setSessionStats({ again:0, hard:0, good:0, easy:0 }) }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
          >
            Review Again
          </button>
        </div>
      )}
    </div>
  )
}
