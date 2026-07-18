"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/**
 * Study autopilot card: shows the review slots LearnAI auto-scheduled from
 * the SM-2 due queue, lets the user tune their study window, and hands out
 * the secret iCal feed URL so Google/Apple/Outlook calendars stay in sync.
 * Data from /api/autopilot.
 */
export default function StudyAutopilot() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch("/api/autopilot")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const feedUrl = useMemo(() => {
    if (!data?.feedPath || typeof window === "undefined") return ""
    return `${window.location.origin}${data.feedPath}`
  }, [data?.feedPath])

  async function save(patch) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/autopilot", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Couldn't save settings")
      setData((prev) => ({ ...prev, ...json }))
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function copyFeed() {
    try {
      await navigator.clipboard.writeText(feedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Couldn't copy — select the URL manually")
    }
  }

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-white/10 animate-pulse">
        <div className="h-4 w-44 bg-white/10 rounded mb-3" />
        <div className="h-3 w-72 bg-white/5 rounded" />
      </div>
    )
  }

  if (!data?.settings) return null
  const { settings, schedule } = data
  const slots = schedule?.slots || []

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/10">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            🗓️ Study Autopilot
          </p>
          {!settings.enabled ? (
            <p className="text-sm text-slate-400">
              Autopilot is off — turn it on and LearnAI schedules review slots for you.
            </p>
          ) : slots.length ? (
            <p className="text-lg font-bold leading-snug">
              {schedule.scheduled} review{schedule.scheduled === 1 ? "" : "s"} planned across{" "}
              <span className="gradient-text">{slots.length} slot{slots.length === 1 ? "" : "s"}</span>
              <span className="block text-sm font-normal text-slate-500 mt-1">
                {WEEKDAYS.filter((_, i) => settings.studyDays.includes(i)).join(" · ")},{" "}
                {settings.startHour}:00–{settings.endHour}:00 ({settings.timezone}) — no planning needed
              </span>
            </p>
          ) : (
            <p className="text-sm text-slate-400">
              Nothing due in the next two weeks — your calendar stays clear. ✨
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowConfig((v) => !v)}
            className="text-xs font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-xl transition-all"
          >
            {showConfig ? "Close" : "⚙️ Configure"}
          </button>
          <button
            onClick={() => save({ enabled: !settings.enabled })}
            disabled={saving}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50 ${
              settings.enabled
                ? "bg-white/8 hover:bg-white/15 text-slate-300"
                : "bg-indigo-600 hover:bg-indigo-500 text-white glow-indigo-sm"
            }`}
          >
            {settings.enabled ? "Pause" : "Turn on"}
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

      {/* Upcoming slots */}
      {settings.enabled && slots.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {slots.slice(0, 4).map((slot) => (
            <div key={`${slot.date}-${slot.start}`} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 min-w-[130px]">
              <p className="text-[11px] font-bold text-indigo-300/90 mb-0.5">
                {new Date(slot.start).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              </p>
              <p className="text-xs text-slate-300">
                {new Date(slot.start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                {" · "}{slot.minutes} min
              </p>
              <p className="text-[11px] text-slate-500 truncate" title={slot.concepts.join(", ")}>
                {slot.conceptCount} concept{slot.conceptCount === 1 ? "" : "s"}
              </p>
            </div>
          ))}
          {slots.length > 4 && (
            <div className="rounded-xl px-3 py-2 text-[11px] text-slate-600 self-center">
              +{slots.length - 4} more slots
            </div>
          )}
        </div>
      )}

      {/* Config panel */}
      {showConfig && (
        <div className="mt-5 pt-5 border-t border-white/8 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">Study days</p>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((label, day) => {
                const on = settings.studyDays.includes(day)
                return (
                  <button
                    key={day}
                    disabled={saving}
                    onClick={() => {
                      const next = on
                        ? settings.studyDays.filter((d) => d !== day)
                        : [...settings.studyDays, day]
                      if (next.length) save({ studyDays: next })
                    }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
                      on
                        ? "bg-indigo-600/25 border-indigo-500/40 text-indigo-300"
                        : "bg-white/4 border-white/10 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ConfigNumber label="From (hour)" value={settings.startHour} min={0} max={23} disabled={saving}
              onChange={(v) => save({ startHour: v })} />
            <ConfigNumber label="Until (hour)" value={settings.endHour} min={1} max={24} disabled={saving}
              onChange={(v) => save({ endHour: v })} />
            <ConfigNumber label="Slot length (min)" value={settings.slotMinutes} min={10} max={120} step={5} disabled={saving}
              onChange={(v) => save({ slotMinutes: v })} />
            <ConfigNumber label="Max slots / day" value={settings.maxSlotsPerDay} min={1} max={6} disabled={saving}
              onChange={(v) => save({ maxSlotsPerDay: v })} />
          </div>

          <button
            onClick={() => save({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })}
            disabled={saving}
            className="text-[11px] text-slate-500 hover:text-slate-300 underline underline-offset-2 disabled:opacity-50"
          >
            Timezone: {settings.timezone} — click to use this device&apos;s timezone
          </button>

          {/* Calendar feed */}
          <div className="rounded-xl bg-white/4 border border-white/10 p-3">
            <p className="text-xs font-semibold text-slate-300 mb-1">📅 Calendar subscription</p>
            <p className="text-[11px] text-slate-500 mb-2">
              Add this secret URL in Google Calendar (“From URL”), Apple Calendar, or Outlook —
              your review slots appear and stay in sync automatically.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] text-indigo-300/90 bg-black/30 rounded-lg px-2.5 py-1.5 truncate">
                {feedUrl}
              </code>
              <button
                onClick={copyFeed}
                className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-all shrink-0"
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-600">
            Want exports and webhooks too?{" "}
            <Link href="/settings/integrations" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Open Integrations →
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}

function ConfigNumber({ label, value, min, max, step = 1, disabled, onChange }) {
  // Uncontrolled + keyed on value: edits stay local until blur, and a saved
  // value coming back from the server resets the field.
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-slate-500 block mb-1">{label}</span>
      <input
        key={value}
        type="number"
        defaultValue={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onBlur={(e) => {
          const n = Number(e.target.value)
          if (Number.isInteger(n) && n >= min && n <= max && n !== value) onChange(n)
          else e.target.value = String(value)
        }}
        className="w-full bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white focus:border-indigo-500/50 focus:outline-none disabled:opacity-50"
      />
    </label>
  )
}
