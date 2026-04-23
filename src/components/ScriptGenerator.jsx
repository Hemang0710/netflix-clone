"use client"

import { useState, useRef } from "react"

const DURATION_OPTIONS = [
  { value: "short",  label: "Short",  desc: "~5 min",  cost: 2 },
  { value: "medium", label: "Medium", desc: "~15 min", cost: 2 },
  { value: "long",   label: "Long",   desc: "~30 min", cost: 2 },
]

const STYLE_OPTIONS = [
  { value: "educational",   label: "Educational",   icon: "🎓", desc: "Clear teaching format" },
  { value: "tutorial",      label: "Tutorial",      icon: "🛠️", desc: "Step-by-step how-to" },
  { value: "storytelling",  label: "Storytelling",  icon: "📖", desc: "Narrative-driven" },
  { value: "interview",     label: "Interview",     icon: "🎤", desc: "Q&A format" },
]

export default function ScriptGenerator({ initialCredits }) {
  const [credits, setCredits] = useState(initialCredits)
  const [form, setForm] = useState({ topic: "", duration: "medium", style: "educational", targetAudience: "" })
  const [script, setScript] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const scriptRef = useRef(null)

  const LOW_CREDITS = credits < 3
  const CREDIT_COST = 2

  async function handleGenerate() {
    if (!form.topic.trim()) {
      setError("Please enter a topic")
      return
    }
    if (credits < CREDIT_COST) {
      setError("Not enough credits. Buy more in AI Studio.")
      return
    }

    setError("")
    setScript("")
    setStreaming(true)

    try {
      const res = await fetch("/api/ai/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message || "Generation failed")
        setStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value)
        setScript(full)
        scriptRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
      }

      setCredits((prev) => prev - CREDIT_COST)
    } catch {
      setError("Connection error. Please try again.")
    } finally {
      setStreaming(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Credits bar */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
        LOW_CREDITS
          ? "bg-red-500/8 border-red-500/20"
          : "bg-amber-500/8 border-amber-500/20"
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className={`font-bold ${LOW_CREDITS ? "text-red-400" : "text-amber-400"}`}>
            {credits} credits remaining
          </span>
          {LOW_CREDITS && (
            <span className="text-red-400 text-xs ml-1">— running low!</span>
          )}
        </div>
        <span className="text-slate-500 text-sm">Script generation costs {CREDIT_COST} credits</span>
      </div>

      {/* Form */}
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <h2 className="text-white font-bold text-lg">Configure Your Script</h2>

        {/* Topic */}
        <div>
          <label className="block text-slate-400 text-sm font-medium mb-2">
            Topic <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholder="e.g. How to use React hooks, Python for beginners, SQL joins explained"
            maxLength={200}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
          />
          <p className="text-slate-600 text-xs mt-1 text-right">{form.topic.length}/200</p>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-slate-400 text-sm font-medium mb-2">Duration</label>
          <div className="grid grid-cols-3 gap-3">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm({ ...form, duration: opt.value })}
                className={`p-3 rounded-xl border text-sm transition-all ${
                  form.duration === opt.value
                    ? "bg-indigo-500/15 border-indigo-500/40 text-white"
                    : "bg-white/3 border-white/8 text-slate-400 hover:border-white/15"
                }`}
              >
                <p className="font-semibold">{opt.label}</p>
                <p className="text-xs opacity-60 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="block text-slate-400 text-sm font-medium mb-2">Style</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm({ ...form, style: opt.value })}
                className={`p-3 rounded-xl border text-sm transition-all ${
                  form.style === opt.value
                    ? "bg-indigo-500/15 border-indigo-500/40 text-white"
                    : "bg-white/3 border-white/8 text-slate-400 hover:border-white/15"
                }`}
              >
                <span className="text-xl block mb-1">{opt.icon}</span>
                <p className="font-semibold text-xs">{opt.label}</p>
                <p className="text-[10px] opacity-50 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Audience */}
        <div>
          <label className="block text-slate-400 text-sm font-medium mb-2">
            Target Audience <span className="text-slate-600">(optional)</span>
          </label>
          <input
            type="text"
            value={form.targetAudience}
            onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
            placeholder="e.g. beginner developers, marketing professionals, high school students"
            maxLength={100}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={streaming || !form.topic.trim() || credits < CREDIT_COST}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all glow-indigo-sm flex items-center justify-center gap-2"
        >
          {streaming ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating script...
            </>
          ) : (
            <>
              ✍️ Generate Script
              <span className="text-xs bg-white/15 px-2 py-0.5 rounded-full">{CREDIT_COST} credits</span>
            </>
          )}
        </button>
      </div>

      {/* Output */}
      {(script || streaming) && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📄</span>
              <p className="text-white font-bold">Generated Script</p>
              {streaming && (
                <div className="flex gap-1 ml-2">
                  {[0,1,2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                      style={{ animationDelay: `${i*150}ms` }} />
                  ))}
                </div>
              )}
            </div>
            {script && !streaming && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-slate-300 text-xs transition-all"
                >
                  {copied ? "✓ Copied!" : "📋 Copy"}
                </button>
                <a
                  href={`/creator/upload`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/25 text-indigo-400 text-xs transition-all"
                >
                  ↑ Use this script
                </a>
              </div>
            )}
          </div>

          <div className="p-6 max-h-[600px] overflow-y-auto scrollbar-hide">
            <pre className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans" ref={scriptRef}>
              {script}
              {streaming && <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse align-middle" />}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
