"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

const AUDIENCE_OPTIONS = [
  { value: "child", label: "A 12-year-old", emoji: "🧒", hint: "No jargon allowed" },
  { value: "beginner", label: "A beginner", emoji: "🌱", hint: "First time hearing it" },
  { value: "expert", label: "A skeptical expert", emoji: "🧐", hint: "Will probe for gaps" },
]

const MIN_CHARS = 40

const scoreColor = (score) =>
  score >= 85 ? "text-emerald-400" : score >= 65 ? "text-indigo-400" : score >= 40 ? "text-amber-400" : "text-red-400"

const barColor = (score) =>
  score >= 85 ? "from-emerald-500 to-green-400" : score >= 65 ? "from-indigo-500 to-violet-500" : score >= 40 ? "from-amber-500 to-yellow-500" : "from-red-500 to-orange-500"

/**
 * Teach-back (Feynman) mode: pick a concept, explain it in your own words to
 * a chosen audience, and get AI-graded feedback on accuracy, completeness,
 * and simplicity — with knowledge gaps and unexplained jargon called out.
 * Finishing an attempt commits the score to the SM-2 review queue via the
 * existing /api/concepts/[id]/review endpoint.
 */
export default function TeachBackMode() {
  const [state, setState] = useState("idle") // idle | picking | writing | grading | results | done
  const [suggestions, setSuggestions] = useState([])
  const [concept, setConcept] = useState(null) // { id?, concept }
  const [customTopic, setCustomTopic] = useState("")
  const [audience, setAudience] = useState("beginner")
  const [explanation, setExplanation] = useState("")
  const [result, setResult] = useState(null) // { session, quality }
  const [attempts, setAttempts] = useState(0)
  const [error, setError] = useState(null)
  const [committing, setCommitting] = useState(false)

  const start = async () => {
    setState("picking")
    setError(null)
    try {
      const res = await fetch("/api/teach-back")
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.suggestions || [])
      }
    } catch {
      // suggestions are optional — free-text topic still works
    }
  }

  const beginWriting = (chosen) => {
    setConcept(chosen)
    setExplanation("")
    setResult(null)
    setAttempts(0)
    setError(null)
    setState("writing")
  }

  const submitExplanation = async () => {
    setState("grading")
    setError(null)
    try {
      const res = await fetch("/api/teach-back", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptMasteryId: concept.id || undefined,
          concept: concept.concept,
          audience,
          explanation,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Grading failed")
      setResult(data)
      setAttempts((n) => n + 1)
      // A free-text topic gets a card created server-side — remember its id
      if (!concept.id && data.session.conceptMasteryId) {
        setConcept((c) => ({ ...c, id: data.session.conceptMasteryId }))
      }
      setState("results")
    } catch (e) {
      setError(e.message)
      setState("writing")
    }
  }

  const lockItIn = async () => {
    setCommitting(true)
    try {
      const conceptId = result.session.conceptMasteryId || concept.id
      if (conceptId) {
        await fetch(`/api/concepts/${conceptId}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quality: result.quality, score: result.session.score }),
        })
      }
    } catch {
      // scheduling is best-effort; the graded session is already saved
    } finally {
      setCommitting(false)
      setState("done")
    }
  }

  /* ---------- idle ---------- */
  if (state === "idle") {
    return (
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              🎓 Teach-Back Mode
            </p>
            <p className="text-lg font-bold leading-snug">
              If you can&apos;t explain it simply, you don&apos;t understand it yet
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Teach a concept in your own words — AI plays the student and grades your explanation
            </p>
          </div>
          <button
            onClick={start}
            className="shrink-0 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all glow-indigo-sm"
          >
            Start teaching →
          </button>
        </div>
      </div>
    )
  }

  /* ---------- picking ---------- */
  if (state === "picking") {
    return (
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <Header subtitle="Pick something you're shaky on — teaching exposes the gaps" onBack={() => setState("idle")} />

        {suggestions.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-2 mb-5">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => beginWriting({ id: s.id, concept: s.concept })}
                className="text-left rounded-xl bg-white/5 hover:bg-indigo-500/10 border border-white/10 hover:border-indigo-500/30 px-4 py-3 transition-all group"
              >
                <p className="text-sm font-semibold truncate group-hover:text-indigo-300 transition-colors">
                  {s.concept}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {Math.round(s.masteryScore)}% mastery
                </p>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && customTopic.trim() && beginWriting({ concept: customTopic.trim() })}
            placeholder="…or type any topic you want to teach"
            maxLength={80}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
          />
          <button
            onClick={() => beginWriting({ concept: customTopic.trim() })}
            disabled={!customTopic.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
          >
            Teach it
          </button>
        </div>
      </div>
    )
  }

  /* ---------- writing / grading ---------- */
  if (state === "writing" || state === "grading") {
    const tooShort = explanation.trim().length < MIN_CHARS
    return (
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <Header subtitle={<>Teaching: <span className="gradient-text font-bold">{concept.concept}</span></>} onBack={() => setState("picking")} />

        {/* Audience picker */}
        <div className="flex flex-wrap gap-2 mb-4">
          {AUDIENCE_OPTIONS.map((a) => (
            <button
              key={a.value}
              onClick={() => setAudience(a.value)}
              disabled={state === "grading"}
              className={`rounded-xl px-3 py-2 text-xs font-semibold border transition-all ${
                audience === a.value
                  ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                  : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
              }`}
            >
              {a.emoji} {a.label}
              <span className="block text-[10px] font-normal text-slate-600">{a.hint}</span>
            </button>
          ))}
        </div>

        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          disabled={state === "grading"}
          placeholder={`Explain ${concept.concept} like you're teaching ${AUDIENCE_OPTIONS.find((a) => a.value === audience)?.label.toLowerCase()}. Use your own words, analogies, and examples — no copy-paste definitions.`}
          className="w-full h-40 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none disabled:opacity-60"
        />

        <div className="flex items-center justify-between mt-3">
          <p className="text-[11px] text-slate-600">
            {tooShort
              ? `${Math.max(MIN_CHARS - explanation.trim().length, 0)} more characters — really try to teach it`
              : `${explanation.trim().length} characters`}
          </p>
          <button
            onClick={submitExplanation}
            disabled={tooShort || state === "grading"}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            {state === "grading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Your student is thinking…
              </>
            ) : (
              "Submit lesson"
            )}
          </button>
        </div>

        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
      </div>
    )
  }

  /* ---------- results ---------- */
  if (state === "results" && result) {
    const s = result.session
    return (
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <Header subtitle={<>Feynman grade for <span className="gradient-text font-bold">{s.concept}</span></>} onBack={() => setState("picking")} />

        {/* Overall + dimensions */}
        <div className="flex flex-col sm:flex-row gap-5 mb-5">
          <div className="shrink-0 text-center sm:text-left">
            <p className={`text-5xl font-black ${scoreColor(s.score)}`}>{s.score}</p>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1">Overall</p>
          </div>
          <div className="flex-1 space-y-2.5">
            {[
              ["Accuracy", s.accuracy],
              ["Completeness", s.completeness],
              ["Simplicity", s.simplicity],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center gap-3">
                <p className="text-xs font-semibold w-24 text-slate-400">{label}</p>
                <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-linear-to-r ${barColor(val)} rounded-full transition-all`}
                    style={{ width: `${Math.max(val, 4)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 w-8 text-right">{val}</p>
              </div>
            ))}
          </div>
        </div>

        {s.feedback && (
          <div className="rounded-xl bg-indigo-500/8 border border-indigo-500/20 p-4 mb-4">
            <p className="text-sm text-slate-300">{s.feedback}</p>
          </div>
        )}

        {s.gaps.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-amber-400/90 uppercase tracking-wider mb-2">🕳️ Knowledge gaps</p>
            <ul className="space-y-1.5">
              {s.gaps.map((g, i) => (
                <li key={i} className="text-sm text-slate-400 flex gap-2">
                  <span className="text-amber-500/70 shrink-0">•</span> {g}
                </li>
              ))}
            </ul>
          </div>
        )}

        {s.jargon.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">🤔 Jargon your student didn&apos;t get</p>
            <div className="flex flex-wrap gap-2">
              {s.jargon.map((j, i) => (
                <span key={i} className="text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-slate-400">
                  {j}
                </span>
              ))}
            </div>
          </div>
        )}

        {s.followUp && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Your student asks:</p>
            <p className="text-sm text-slate-300 italic">&ldquo;{s.followUp}&rdquo;</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setState("writing")}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            ✏️ Revise & teach again
          </button>
          <button
            onClick={lockItIn}
            disabled={committing}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            {committing ? <Loader2 className="w-4 h-4 animate-spin" /> : "✅"} Lock it in
          </button>
        </div>
      </div>
    )
  }

  /* ---------- done ---------- */
  if (state === "done" && result) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-white/10 text-center">
        <p className="text-4xl mb-3">🎓</p>
        <h3 className="text-xl font-black mb-1">Lesson delivered!</h3>
        <p className="text-sm text-slate-500 mb-1">
          <span className="font-semibold text-slate-300">{result.session.concept}</span> scored{" "}
          <span className={`font-bold ${scoreColor(result.session.score)}`}>{result.session.score}</span>
          {attempts > 1 ? ` after ${attempts} attempts` : ""} — added to your review schedule
        </p>
        <p className="text-xs text-slate-600 mb-5">Teaching is the fastest way to find out what you don&apos;t know</p>
        <button
          onClick={() => setState("picking")}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
        >
          Teach another concept
        </button>
      </div>
    )
  }

  return null
}

function Header({ subtitle, onBack }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">🎓 Teach-Back Mode</p>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
      <button
        onClick={onBack}
        className="text-xs text-slate-600 hover:text-slate-400 transition-colors shrink-0"
      >
        ← back
      </button>
    </div>
  )
}
