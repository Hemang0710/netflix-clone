"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"

const SOURCE_META = {
  article: { icon: "📰", label: "Article" },
  youtube: { icon: "▶️", label: "YouTube" },
  pdf: { icon: "📄", label: "PDF" },
  text: { icon: "📝", label: "Note" },
}

const STATUS_META = {
  pending: { label: "Queued", cls: "bg-slate-500/15 text-slate-400 border-slate-500/25" },
  processing: { label: "Extracting…", cls: "bg-indigo-500/15 text-indigo-300 border-indigo-500/25 animate-pulse" },
  ready: { label: "In review queue", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25" },
  failed: { label: "Failed", cls: "bg-red-500/15 text-red-300 border-red-500/25" },
}

export default function InboxClient() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [capture, setCapture] = useState("")
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [sharedBanner, setSharedBanner] = useState(false)
  const processingRef = useRef(false)
  const fileInputRef = useRef(null)

  // Items created by the PWA share sheet arrive as "pending" — run their
  // extraction now, one at a time, updating cards as results land.
  const processPending = useCallback(async (list) => {
    if (processingRef.current) return
    const pending = list.filter((i) => i.status === "pending")
    if (!pending.length) return
    processingRef.current = true

    for (const item of pending) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "processing" } : i)))
      try {
        const res = await fetch(`/api/inbox/${item.id}/process`, { method: "POST" })
        const data = await res.json()
        if (data.item) {
          setItems((prev) => prev.map((i) => (i.id === item.id ? data.item : i)))
        }
      } catch {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "failed", error: "Network error" } : i)))
      }
    }
    processingRef.current = false
  }, [])

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch("/api/inbox")
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        processPending(data.items || [])
      }
    } catch (e) {
      console.error("Failed to load inbox:", e)
    } finally {
      setLoading(false)
    }
  }, [processPending])

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("shared")) {
      setSharedBanner(true)
    }
    loadItems()
  }, [loadItems])

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    setFormError(null)

    const trimmed = capture.trim()
    if (!file && !trimmed) {
      setFormError("Paste a link or some text, or attach a file")
      return
    }
    if (!file && trimmed.length < 80 && !/^https?:\/\//i.test(trimmed)) {
      setFormError("That note is a bit short to mine for concepts — add more detail or share a link")
      return
    }

    setSubmitting(true)

    // Optimistic placeholder while the server fetches + extracts
    const tempId = `temp-${Date.now()}`
    const isUrl = /^https?:\/\/\S+$/i.test(trimmed)
    setItems((prev) => [
      {
        id: tempId,
        sourceType: file ? (file.name?.toLowerCase().endsWith(".pdf") ? "pdf" : "text") : isUrl ? "article" : "text",
        title: file ? file.name : isUrl ? trimmed : "New note",
        status: "processing",
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ])

    try {
      let res
      if (file) {
        const form = new FormData()
        form.append("files", file)
        if (trimmed) form.append("title", trimmed.slice(0, 200))
        res = await fetch("/api/inbox", { method: "POST", body: form })
      } else {
        res = await fetch("/api/inbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isUrl ? { url: trimmed } : { text: trimmed }),
        })
      }

      const data = await res.json()
      if (!res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== tempId))
        setFormError(data.error || "Capture failed — try again")
      } else {
        setItems((prev) => prev.map((i) => (i.id === tempId ? data.item : i)))
        setCapture("")
        setFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    } catch {
      setItems((prev) => prev.filter((i) => i.id !== tempId))
      setFormError("Network error — try again")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRetry(id) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: "processing", error: null } : i)))
    try {
      const res = await fetch(`/api/inbox/${id}/process`, { method: "POST" })
      const data = await res.json()
      if (data.item) setItems((prev) => prev.map((i) => (i.id === id ? data.item : i)))
    } catch {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: "failed", error: "Network error" } : i)))
    }
  }

  async function handleDelete(id) {
    const prev = items
    setItems(items.filter((i) => i.id !== id))
    const res = await fetch(`/api/inbox/${id}`, { method: "DELETE" }).catch(() => null)
    if (!res?.ok) setItems(prev)
  }

  const readyCount = items.filter((i) => i.status === "ready").length
  const newConceptCount = items.reduce((sum, i) => sum + parseConcepts(i).filter((c) => c.isNew).length, 0)

  return (
    <div className="space-y-6">
      {sharedBanner && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-sm font-semibold">
          ✨ Got it! Your share is being mined for concepts below.
        </div>
      )}

      {/* Capture box */}
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 border border-white/10">
        <textarea
          value={capture}
          onChange={(e) => setCapture(e.target.value)}
          placeholder="Paste an article link, YouTube URL, or raw notes… anything you want to actually remember"
          rows={2}
          className="w-full bg-[#0d0d1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none"
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
          <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              {file ? `📎 ${file.name}` : "📎 Attach PDF / notes file"}
            </span>
            {file && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                className="text-slate-600 hover:text-red-400"
              >
                ✕
              </button>
            )}
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all glow-indigo-sm whitespace-nowrap"
          >
            {submitting ? "Extracting concepts…" : "Capture & learn"}
          </button>
        </div>
        {formError && <p className="text-red-400 text-xs mt-2">{formError}</p>}
      </form>

      {/* Stats strip */}
      {items.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            {items.length} capture{items.length === 1 ? "" : "s"} · {readyCount} processed
            {newConceptCount > 0 && (
              <span className="text-indigo-400"> · {newConceptCount} concepts added to your queue</span>
            )}
          </span>
          <Link href="/learn#daily-review" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Review queue →
          </Link>
        </div>
      )}

      {/* Items */}
      {loading ? (
        <div className="glass-card rounded-2xl p-10 text-center text-slate-500 text-sm">Loading your inbox…</div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <InboxItemCard key={item.id} item={item} onRetry={handleRetry} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

function parseConcepts(item) {
  if (!item?.concepts) return []
  try {
    const parsed = JSON.parse(item.concepts)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function InboxItemCard({ item, onRetry, onDelete }) {
  const source = SOURCE_META[item.sourceType] || SOURCE_META.text
  const status = STATUS_META[item.status] || STATUS_META.pending
  const concepts = parseConcepts(item)

  return (
    <div className="glass-card rounded-2xl p-5 border border-white/10 hover:border-indigo-500/25 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-2xl shrink-0 mt-0.5">{source.icon}</span>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">
              {item.url ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-300 transition-colors">
                  {item.title || item.url}
                </a>
              ) : (
                item.title || "Untitled capture"
              )}
            </p>
            <p className="text-slate-600 text-xs mt-0.5">
              {source.label}
              {item.siteName ? ` · ${item.siteName}` : ""} ·{" "}
              {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
        </div>
        <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border ${status.cls}`}>
          {status.label}
        </span>
      </div>

      {item.summary && <p className="text-slate-400 text-xs mt-3 leading-relaxed">{item.summary}</p>}

      {item.status === "failed" && item.error && (
        <p className="text-red-400/80 text-xs mt-3">⚠ {item.error}</p>
      )}

      {concepts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {concepts.map((c) => (
            <span
              key={`${item.id}-${c.name}`}
              title={c.definition}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-default ${
                c.isNew
                  ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                  : "bg-white/5 text-slate-400 border-white/10"
              }`}
            >
              {c.name}
              {!c.isNew && <span className="text-slate-600"> · reinforced</span>}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 mt-4 text-xs">
        {item.status === "failed" && (
          <button onClick={() => onRetry(item.id)} className="text-indigo-400 hover:text-indigo-300 font-semibold">
            ↻ Retry
          </button>
        )}
        {item.status === "ready" && concepts.length > 0 && (
          <Link href="/learn#daily-review" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Review {concepts.length} concept{concepts.length === 1 ? "" : "s"} →
          </Link>
        )}
        <button onClick={() => onDelete(item.id)} className="text-slate-600 hover:text-red-400 font-semibold ml-auto">
          Delete
        </button>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="glass-card rounded-2xl p-10 border border-white/10 text-center">
      <span className="text-4xl block mb-3">📥</span>
      <h3 className="font-bold mb-2">One inbox for everything you learn</h3>
      <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
        Paste an article, a YouTube link, or your own notes above — or install LearnAI as an app
        and use your phone&apos;s <span className="text-slate-300 font-semibold">Share</span> button
        from any browser or PDF reader. AI pulls out the key concepts and schedules them into your
        review queue so they stick.
      </p>
    </div>
  )
}
