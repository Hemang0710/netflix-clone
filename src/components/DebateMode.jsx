"use client"

import { useState, useRef, useEffect } from "react"

const MAX_ROUNDS = 5

function parseScore(text) {
  const match = text.match(/\[SCORE:\s*(\d+(?:\.\d+)?)\/10\]/)
  return match ? parseFloat(match[1]) : null
}

function stripScore(text) {
  return text.replace(/\[SCORE:\s*\d+(?:\.\d+)?\/10\]\s*---?\s*/g, "").trim()
}

export default function DebateMode({ contentId, contentTitle }) {
  const [state, setState] = useState("idle") // idle | debating | finished
  const [round, setRound] = useState(1)
  const [input, setInput] = useState("")
  const [history, setHistory] = useState([]) // {role, content, score?}
  const [streaming, setStreaming] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [totalScore, setTotalScore] = useState(0)
  const [roundCount, setRoundCount] = useState(0)
  const [error, setError] = useState("")
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [history, streaming])

  async function submitArgument() {
    if (!input.trim() || isStreaming) return

    const userArg = input.trim()
    setInput("")
    setError("")

    const userMsg = { role: "user", content: userArg }
    const updatedHistory = [...history, userMsg]
    setHistory(updatedHistory)
    setIsStreaming(true)
    setStreaming("")

    // Build history for API (exclude score metadata)
    const apiHistory = updatedHistory.map((h) => ({
      role: h.role,
      content: h.content,
    }))

    try {
      const res = await fetch("/api/ai/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          userArgument: userArg,
          round,
          history: apiHistory.slice(0, -1), // exclude the just-added user message
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message || "Failed to get AI response")
        setIsStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        full += chunk
        setStreaming(full)
      }

      const score = parseScore(full)
      const cleanedContent = stripScore(full)

      if (score !== null) {
        setTotalScore((prev) => prev + score)
        setRoundCount((prev) => prev + 1)
      }

      setHistory((prev) => [
        ...prev,
        { role: "assistant", content: cleanedContent, score },
      ])
      setStreaming("")
      setIsStreaming(false)

      const newRound = round + 1
      if (newRound > MAX_ROUNDS) {
        setState("finished")
      } else {
        setRound(newRound)
      }
    } catch {
      setError("Connection error. Try again.")
      setIsStreaming(false)
    }
  }

  const avgScore = roundCount > 0 ? (totalScore / roundCount).toFixed(1) : null
  const scoreColor =
    avgScore >= 8 ? "text-emerald-400" :
    avgScore >= 6 ? "text-indigo-400" :
    avgScore >= 4 ? "text-amber-400" : "text-red-400"

  if (state === "idle") {
    return (
      <div className="glass-card rounded-2xl border border-violet-500/15 p-8">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-2xl shrink-0">
            ⚔️
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">AI Debate Partner</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Challenge your understanding by defending the video&apos;s content against an AI that argues the opposite.
              The AI will rate your argument quality each round.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-6">
              <span className="flex items-center gap-1.5">🔁 {MAX_ROUNDS} rounds</span>
              <span className="flex items-center gap-1.5">🏆 Scored 1–10 per argument</span>
              <span className="flex items-center gap-1.5">🧠 Socratic method</span>
            </div>
            <button
              onClick={() => setState("debating")}
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
            >
              Start Debate →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (state === "finished") {
    const verdict =
      avgScore >= 8 ? "Excellent debater! Your arguments were well-structured and specific." :
      avgScore >= 6 ? "Good effort! You showed solid understanding with room to go deeper." :
      avgScore >= 4 ? "Decent start. Try using more specific evidence from the content." :
      "Keep practicing! Focus on making one clear, evidence-based point per argument."

    return (
      <div className="glass-card rounded-2xl border border-violet-500/20 p-8 text-center">
        <p className="text-4xl mb-4">🎤</p>
        <h4 className="text-white font-black text-2xl mb-2">Debate Complete</h4>
        <p className="text-slate-400 text-sm mb-6">You completed {MAX_ROUNDS} rounds on &ldquo;{contentTitle}&rdquo;</p>

        <div className={`text-6xl font-black mb-2 ${scoreColor}`}>{avgScore}/10</div>
        <p className="text-slate-500 text-sm mb-6">Average argument score</p>

        <p className="text-slate-300 text-sm leading-relaxed max-w-sm mx-auto mb-8">{verdict}</p>

        <button
          onClick={() => {
            setState("debating")
            setHistory([])
            setRound(1)
            setTotalScore(0)
            setRoundCount(0)
          }}
          className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
        >
          Debate Again
        </button>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl border border-violet-500/15 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚔️</span>
          <div>
            <p className="text-white font-bold text-sm">AI Debate — Round {round}/{MAX_ROUNDS}</p>
            <p className="text-slate-500 text-xs">Defend the video against the AI challenger</p>
          </div>
        </div>
        {avgScore && (
          <div className="text-right">
            <p className={`text-lg font-black ${scoreColor}`}>{avgScore}</p>
            <p className="text-slate-600 text-xs">avg score</p>
          </div>
        )}
      </div>

      {/* Round progress */}
      <div className="h-1 bg-white/5">
        <div
          className="h-full bg-linear-to-r from-violet-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${((round - 1) / MAX_ROUNDS) * 100}%` }}
        />
      </div>

      {/* Chat history */}
      <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
        {history.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">
              Write your argument defending the content of &ldquo;{contentTitle}&rdquo;.
              <br />The AI will argue the opposite position.
            </p>
          </div>
        )}

        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600/20 border border-indigo-500/25 text-slate-200 rounded-br-sm"
                  : "bg-white/4 border border-white/8 text-slate-300 rounded-bl-sm"
              }`}
            >
              {msg.role === "assistant" && msg.score !== null && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/8">
                  <span className="text-xs text-slate-500">Your argument scored</span>
                  <span className={`text-sm font-black ${
                    msg.score >= 8 ? "text-emerald-400" :
                    msg.score >= 6 ? "text-indigo-400" :
                    msg.score >= 4 ? "text-amber-400" : "text-red-400"
                  }`}>{msg.score}/10</span>
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming */}
        {isStreaming && streaming && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed bg-white/4 border border-white/8 text-slate-300">
              {stripScore(streaming)}
              <span className="inline-block w-1.5 h-4 bg-violet-400 ml-1 animate-pulse rounded-sm" />
            </div>
          </div>
        )}

        {isStreaming && !streaming && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-white/4 border border-white/8">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {error && <p className="text-red-400 text-xs px-5 pb-2">{error}</p>}
      <div className="px-5 pb-5">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                submitArgument()
              }
            }}
            placeholder={`Round ${round}: Write your argument... (Enter to submit)`}
            disabled={isStreaming}
            rows={2}
            className="flex-1 bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-violet-500/40 transition-all disabled:opacity-50"
          />
          <button
            onClick={submitArgument}
            disabled={!input.trim() || isStreaming}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-4 rounded-xl transition-all self-end py-3 text-sm"
          >
            →
          </button>
        </div>
        <p className="text-slate-700 text-xs mt-2">Shift+Enter for new line</p>
      </div>
    </div>
  )
}
