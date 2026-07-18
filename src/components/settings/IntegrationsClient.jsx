"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const EVENT_DESCRIPTIONS = {
  "review.completed": "A concept was reviewed",
  "concept.mastered": "A concept crossed the mastery bar",
  "teachback.completed": "A teach-back attempt was graded",
  "project.completed": "A project bridge was finished",
  "inbox.processed": "An inbox capture finished processing",
}

/**
 * Integrations hub: calendar feed (study autopilot), Obsidian/Notion/JSON
 * export downloads, and outbound webhook management.
 */
export default function IntegrationsClient() {
  return (
    <div className="space-y-8">
      <CalendarSection />
      <ExportSection />
      <WebhooksSection />
    </div>
  )
}

function Section({ icon, title, subtitle, children }) {
  return (
    <section className="glass-card rounded-2xl p-6 border border-white/10">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
        {icon} {title}
      </p>
      <p className="text-sm text-slate-400 mb-5">{subtitle}</p>
      {children}
    </section>
  )
}

// ---------------------------------------------------------------------------

function CalendarSection() {
  const [feedPath, setFeedPath] = useState(null)
  const [copied, setCopied] = useState(false)
  const [rotating, setRotating] = useState(false)

  useEffect(() => {
    fetch("/api/autopilot")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setFeedPath(d?.feedPath || null))
      .catch(() => {})
  }, [])

  const feedUrl = feedPath && typeof window !== "undefined" ? `${window.location.origin}${feedPath}` : ""

  async function rotate() {
    if (!window.confirm("Rotate the feed token? Calendars using the old URL will stop updating.")) return
    setRotating(true)
    try {
      const res = await fetch("/api/autopilot/token", { method: "POST" })
      const json = await res.json()
      if (res.ok) setFeedPath(json.feedPath)
    } finally {
      setRotating(false)
    }
  }

  return (
    <Section
      icon="🗓️"
      title="Calendar — Study Autopilot"
      subtitle="Subscribe your calendar to this secret URL and LearnAI schedules review slots from your due cards — no planning needed. Configure days and hours on the Learn page."
    >
      {feedUrl ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-indigo-300/90 bg-black/30 rounded-lg px-3 py-2 truncate">{feedUrl}</code>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(feedUrl).catch(() => {})
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg transition-all shrink-0"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>
              Google Calendar: <em>Other calendars → + → From URL</em>. Apple/Outlook: <em>subscribe to calendar</em>.
            </span>
            <button onClick={rotate} disabled={rotating} className="text-slate-500 hover:text-red-400 underline underline-offset-2 disabled:opacity-50">
              Rotate secret URL
            </button>
          </div>
          <Link href="/learn#autopilot" className="inline-block text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
            Adjust study window on the Learn page →
          </Link>
        </div>
      ) : (
        <p className="text-xs text-slate-600">Loading your feed URL…</p>
      )}
    </Section>
  )
}

// ---------------------------------------------------------------------------

function ExportSection() {
  const options = [
    {
      format: "obsidian",
      title: "Obsidian vault",
      desc: "Markdown notes with wikilinks — open the zip as a vault and see your knowledge graph.",
      icon: "🟣",
    },
    {
      format: "notion",
      title: "Notion import",
      desc: "Plain Markdown + concepts.csv for Notion's Markdown & CSV importer.",
      icon: "⬜",
    },
    {
      format: "json",
      title: "JSON backup",
      desc: "Machine-readable dump of everything — for scripts and backups.",
      icon: "🧾",
    },
  ]
  return (
    <Section
      icon="📦"
      title="Export your knowledge"
      subtitle="Concepts with mastery + retention, course notes and highlights, inbox captures, teach-back history, and projects."
    >
      <div className="grid sm:grid-cols-3 gap-3">
        {options.map((o) => (
          <a
            key={o.format}
            href={`/api/export?format=${o.format}`}
            className="rounded-xl bg-white/4 border border-white/10 hover:border-indigo-500/35 p-4 transition-all group"
          >
            <span className="text-xl block mb-2">{o.icon}</span>
            <p className="text-sm font-bold group-hover:text-indigo-300 transition-colors">{o.title}</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{o.desc}</p>
            <p className="text-xs text-indigo-400 font-semibold mt-2">Download ↓</p>
          </a>
        ))}
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------

function WebhooksSection() {
  const [hooks, setHooks] = useState([])
  const [availableEvents, setAvailableEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newSecret, setNewSecret] = useState(null) // { id, secret }
  const [form, setForm] = useState({ url: "", label: "", events: [] })
  const [busy, setBusy] = useState(false)

  async function refresh() {
    const res = await fetch("/api/webhooks")
    if (!res.ok) return
    const json = await res.json()
    setHooks(json.webhooks || [])
    setAvailableEvents(json.availableEvents || [])
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [])

  async function create(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Couldn't create webhook")
      setNewSecret({ id: json.webhook.id, secret: json.webhook.secret })
      setForm({ url: "", label: "", events: [] })
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function patch(id, body) {
    await fetch(`/api/webhooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    await refresh()
  }

  async function remove(id) {
    if (!window.confirm("Delete this webhook?")) return
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" })
    if (newSecret?.id === id) setNewSecret(null)
    await refresh()
  }

  async function test(id) {
    setBusy(true)
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: "POST" })
      const json = await res.json()
      window.alert(json.ok ? `Delivered ✓ (HTTP ${json.status})` : `Failed: ${json.error || "no response"}`)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section
      icon="🪝"
      title="Webhooks"
      subtitle="POST signed JSON to your endpoint on learning events — wire LearnAI into Obsidian plugins, Notion automations, Zapier, n8n, or your own scripts. Payloads are signed with HMAC-SHA256 (X-LearnAI-Signature)."
    >
      {loading ? (
        <p className="text-xs text-slate-600">Loading…</p>
      ) : (
        <div className="space-y-4">
          {newSecret && (
            <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/25 p-3">
              <p className="text-xs font-bold text-emerald-300 mb-1">
                Webhook created — copy the signing secret now, it won&apos;t be shown again:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[11px] text-emerald-200 bg-black/30 rounded-lg px-2.5 py-1.5 break-all">
                  {newSecret.secret}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(newSecret.secret).catch(() => {})}
                  className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg shrink-0"
                >
                  Copy
                </button>
                <button onClick={() => setNewSecret(null)} className="text-xs text-slate-500 hover:text-white shrink-0">
                  Done
                </button>
              </div>
            </div>
          )}

          {hooks.map((h) => (
            <div key={h.id} className="rounded-xl bg-white/4 border border-white/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {h.label || h.url}
                    {!h.active && <span className="ml-2 text-[10px] font-bold text-amber-400 uppercase">disabled</span>}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{h.url}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {h.events.length ? h.events.join(", ") : "all events"}
                    {h.lastTriggeredAt &&
                      ` · last delivery ${new Date(h.lastTriggeredAt).toLocaleString()} ${
                        h.lastError ? `— ${h.lastError}` : h.lastStatus ? `— HTTP ${h.lastStatus}` : ""
                      }`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => test(h.id)} disabled={busy}
                    className="text-xs font-semibold text-slate-300 border border-white/10 hover:border-white/25 px-3 py-1.5 rounded-lg disabled:opacity-50">
                    Test
                  </button>
                  <button onClick={() => patch(h.id, { active: !h.active })}
                    className="text-xs font-semibold text-slate-300 border border-white/10 hover:border-white/25 px-3 py-1.5 rounded-lg">
                    {h.active ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => remove(h.id)}
                    className="text-xs font-semibold text-red-400/80 hover:text-red-300 px-2 py-1.5">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          <form onSubmit={create} className="rounded-xl bg-white/4 border border-white/10 p-4 space-y-3">
            <p className="text-xs font-bold text-slate-400">Add a webhook</p>
            <div className="grid sm:grid-cols-[2fr_1fr] gap-3">
              <input
                type="url"
                required
                placeholder="https://example.com/hooks/learnai"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Label (optional)"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableEvents.map((ev) => {
                const on = form.events.includes(ev)
                return (
                  <button
                    key={ev}
                    type="button"
                    title={EVENT_DESCRIPTIONS[ev] || ev}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        events: on ? f.events.filter((x) => x !== ev) : [...f.events, ev],
                      }))
                    }
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                      on
                        ? "bg-indigo-600/25 border-indigo-500/40 text-indigo-300"
                        : "bg-white/4 border-white/10 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {ev}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-slate-600">Leave all unselected to receive every event.</p>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={busy || !form.url}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all disabled:opacity-50"
            >
              {busy ? "Saving…" : "Create webhook"}
            </button>
          </form>
        </div>
      )}
    </Section>
  )
}
