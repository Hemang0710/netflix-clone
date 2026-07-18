"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

const MIN_CHARS = 40

const DIFFICULTY_BADGES = {
  starter: { label: "Starter", cls: "bg-emerald-500/10 border-emerald-500/25 text-emerald-300" },
  intermediate: { label: "Intermediate", cls: "bg-amber-500/10 border-amber-500/25 text-amber-300" },
  ambitious: { label: "Ambitious", cls: "bg-red-500/10 border-red-500/25 text-red-300" },
}

/**
 * Learn-to-do bridges: when a cluster of concepts hits mastery, offer to
 * generate a small real-world project brief with AI-checked checkpoints —
 * so learning turns into something actually built.
 */
export default function ProjectBridges() {
  const [loading, setLoading] = useState(true)
  const [clusters, setClusters] = useState([])
  const [briefs, setBriefs] = useState([])
  const [generatingKey, setGeneratingKey] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/projects/bridges")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        setClusters(data.clusters || [])
        setBriefs(data.briefs || [])
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const generate = async (clusterKey) => {
    setGeneratingKey(clusterKey)
    setError(null)
    try {
      const res = await fetch("/api/projects/bridges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clusterKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Generation failed")
      setBriefs((prev) => [data.brief, ...prev])
      setClusters((prev) => prev.filter((c) => c.key !== clusterKey))
    } catch (e) {
      setError(e.message)
    } finally {
      setGeneratingKey(null)
    }
  }

  const updateBrief = (brief) => {
    setBriefs((prev) => prev.map((b) => (b.id === brief.id ? brief : b)))
  }

  const abandon = async (briefId) => {
    try {
      const res = await fetch(`/api/projects/bridges/${briefId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "abandoned" }),
      })
      const data = await res.json()
      if (res.ok) updateBrief(data.brief)
    } catch {
      // best-effort — the project stays active on failure
    }
  }

  if (loading) return null

  const activeBriefs = briefs.filter((b) => b.status === "active")
  const completedBriefs = briefs.filter((b) => b.status === "completed")

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          🌉 Learn-to-Do Bridges
        </p>
        <p className="text-sm text-slate-500">
          Mastered it in theory? Prove it by building — AI turns your mastered concepts into a
          real project and reviews each step
        </p>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Clusters ready to bridge */}
      {clusters.map((cluster) => (
        <div
          key={cluster.key}
          className="glass-card rounded-2xl p-5 border border-indigo-500/25 bg-indigo-500/5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-bold">
                You&apos;ve mastered {cluster.concepts.length} concepts from{" "}
                <span className="gradient-text">{cluster.label}</span>
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {cluster.concepts.slice(0, 5).map((c) => (
                  <span
                    key={c.id}
                    className="text-[11px] bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-slate-400"
                  >
                    {c.concept}
                  </span>
                ))}
                {cluster.concepts.length > 5 && (
                  <span className="text-[11px] text-slate-600 px-1 py-0.5">
                    +{cluster.concepts.length - 5} more
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => generate(cluster.key)}
              disabled={generatingKey !== null}
              className="shrink-0 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all glow-indigo-sm"
            >
              {generatingKey === cluster.key ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Designing your project…
                </>
              ) : (
                "Bridge it → build something"
              )}
            </button>
          </div>
        </div>
      ))}

      {/* Active projects */}
      {activeBriefs.map((brief) => (
        <ProjectCard key={brief.id} brief={brief} onUpdate={updateBrief} onAbandon={abandon} />
      ))}

      {/* Completed projects */}
      {completedBriefs.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <p className="text-xs font-bold text-emerald-400/90 uppercase tracking-wider mb-3">
            🏆 Built &amp; shipped
          </p>
          <ul className="space-y-2">
            {completedBriefs.map((b) => (
              <li key={b.id} className="flex items-center gap-3 text-sm">
                <span className="text-emerald-400 shrink-0">✓</span>
                <span className="font-semibold text-slate-300 truncate">{b.title}</span>
                <span className="text-[11px] text-slate-600 shrink-0 ml-auto">
                  {b.clusterLabel}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Nothing unlocked yet */}
      {clusters.length === 0 && activeBriefs.length === 0 && completedBriefs.length === 0 && (
        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <p className="text-sm text-slate-500">
            🔒 Master <span className="text-slate-300 font-semibold">3+ concepts</span> from a
            course (65%+ mastery) and a project brief unlocks here. Keep reviewing — building is
            the best part.
          </p>
        </div>
      )}
    </div>
  )
}

function ProjectCard({ brief, onUpdate, onAbandon }) {
  const [openCheckpointId, setOpenCheckpointId] = useState(null)
  const badge = DIFFICULTY_BADGES[brief.difficulty] || DIFFICULTY_BADGES.starter
  const passedCount = brief.checkpoints.filter((cp) => cp.status === "passed").length

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/10">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="text-lg font-black leading-snug">{brief.title}</h3>
            <span className={`text-[10px] font-bold uppercase tracking-wider border rounded-lg px-2 py-0.5 ${badge.cls}`}>
              {badge.label}
            </span>
            {brief.estimatedHours ? (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-slate-400">
                ~{brief.estimatedHours}h
              </span>
            ) : null}
          </div>
          <p className="text-sm text-slate-400">{brief.pitch}</p>
        </div>
        <button
          onClick={() => onAbandon(brief.id)}
          className="text-xs text-slate-600 hover:text-red-400 transition-colors shrink-0"
          title="Abandon this project"
        >
          ✕
        </button>
      </div>

      {brief.deliverable && (
        <div className="rounded-xl bg-indigo-500/8 border border-indigo-500/20 p-3.5 mb-4">
          <p className="text-[11px] font-bold text-indigo-400/90 uppercase tracking-wider mb-1">
            You&apos;ll walk away with
          </p>
          <p className="text-sm text-slate-300">{brief.deliverable}</p>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-indigo-500 to-emerald-400 rounded-full transition-all"
            style={{ width: `${(passedCount / brief.checkpoints.length) * 100}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-500 shrink-0">
          {passedCount}/{brief.checkpoints.length} checkpoints
        </p>
      </div>

      <div className="space-y-2">
        {brief.checkpoints.map((cp) => (
          <Checkpoint
            key={cp.id}
            brief={brief}
            checkpoint={cp}
            open={openCheckpointId === cp.id}
            onToggle={() => setOpenCheckpointId(openCheckpointId === cp.id ? null : cp.id)}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  )
}

function Checkpoint({ brief, checkpoint, open, onToggle, onUpdate }) {
  const [submission, setSubmission] = useState(checkpoint.submission || "")
  const [reviewing, setReviewing] = useState(false)
  const [error, setError] = useState(null)
  const [showHint, setShowHint] = useState(false)

  const passed = checkpoint.status === "passed"
  const tooShort = submission.trim().length < MIN_CHARS

  const submit = async () => {
    setReviewing(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/projects/bridges/${brief.id}/checkpoints/${checkpoint.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submission }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Review failed")

      onUpdate({
        ...brief,
        status: data.projectCompleted ? "completed" : brief.status,
        completedAt: data.projectCompleted ? new Date().toISOString() : brief.completedAt,
        checkpoints: brief.checkpoints.map((cp) =>
          cp.id === checkpoint.id ? { ...cp, ...data.checkpoint } : cp
        ),
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setReviewing(false)
    }
  }

  return (
    <div
      className={`rounded-xl border transition-all ${
        passed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/5 border-white/10"
      }`}
    >
      <button onClick={onToggle} className="w-full text-left px-4 py-3 flex items-center gap-3">
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
            passed ? "bg-emerald-500/20 text-emerald-300" : "bg-white/8 text-slate-400"
          }`}
        >
          {passed ? "✓" : checkpoint.order}
        </span>
        <span className={`text-sm font-semibold flex-1 ${passed ? "text-emerald-300" : ""}`}>
          {checkpoint.title}
        </span>
        {checkpoint.attempts > 0 && !passed && (
          <span className="text-[10px] text-slate-600 shrink-0">
            attempt {checkpoint.attempts}
          </span>
        )}
        <span className="text-slate-600 text-xs shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1">
          <p className="text-sm text-slate-400 mb-2">{checkpoint.task}</p>
          <p className="text-[11px] text-slate-500 mb-3">
            <span className="font-bold uppercase tracking-wider">Done when:</span>{" "}
            {checkpoint.acceptance}
          </p>

          {checkpoint.hint && !passed && (
            <div className="mb-3">
              {showHint ? (
                <p className="text-xs text-amber-300/90 bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2">
                  💡 {checkpoint.hint}
                </p>
              ) : (
                <button
                  onClick={() => setShowHint(true)}
                  className="text-[11px] text-slate-600 hover:text-amber-400 transition-colors"
                >
                  Stuck? Show a hint
                </button>
              )}
            </div>
          )}

          {checkpoint.feedback && (
            <div
              className={`rounded-lg border px-3 py-2 mb-3 text-xs ${
                passed
                  ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-200"
                  : "bg-indigo-500/8 border-indigo-500/20 text-slate-300"
              }`}
            >
              <span className="font-bold">AI review{checkpoint.score != null ? ` · ${checkpoint.score}/100` : ""}:</span>{" "}
              {checkpoint.feedback}
            </div>
          )}

          {!passed && (
            <>
              <textarea
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
                disabled={reviewing}
                placeholder="Describe what you built and how — the specific decisions, what works, what you'd show someone. Paste key snippets if it helps."
                className="w-full h-28 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none disabled:opacity-60"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-slate-600">
                  {tooShort
                    ? `${Math.max(MIN_CHARS - submission.trim().length, 0)} more characters — specifics matter`
                    : `${submission.trim().length} characters`}
                </p>
                <button
                  onClick={submit}
                  disabled={tooShort || reviewing}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all"
                >
                  {reviewing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Reviewing your work…
                    </>
                  ) : (
                    "Submit for review"
                  )}
                </button>
              </div>
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            </>
          )}
        </div>
      )}
    </div>
  )
}
