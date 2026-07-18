"use client"

import { useEffect, useState } from "react"

/**
 * Forgetting forecast card: shows which concepts are projected to decay and
 * when ("You'll forget Recursion by Friday"), with a one-click path into the
 * daily review session. Data from /api/forecast (SM-2 retention model).
 */
export default function ForgettingForecast() {
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/forecast")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setForecast(data?.forecast || null))
      .catch(() => setForecast(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-white/10 animate-pulse">
        <div className="h-4 w-40 bg-white/10 rounded mb-3" />
        <div className="h-3 w-64 bg-white/5 rounded" />
      </div>
    )
  }

  if (!forecast || forecast.totalTracked === 0) return null

  const { headline, atRiskNow, upcoming, reviewEstimate } = forecast
  const nothingDecaying = !headline && atRiskNow.length === 0 && upcoming.length === 0

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/10">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            🧠 Memory Forecast
          </p>
          {nothingDecaying ? (
            <p className="text-sm text-slate-400">
              Nothing is fading this week — your {forecast.totalTracked} tracked concept
              {forecast.totalTracked === 1 ? " is" : "s are"} holding strong. 💪
            </p>
          ) : headline ? (
            <p className="text-lg font-bold leading-snug">
              You&apos;ll forget <span className="gradient-text">{headline.concept}</span>{" "}
              {headline.when}
              <span className="block text-sm font-normal text-slate-500 mt-1">
                A {Math.max(reviewEstimate.minutes, 1)}-minute review now saves re-learning it later
              </span>
            </p>
          ) : (
            <p className="text-lg font-bold leading-snug">
              {atRiskNow.length + upcoming.reduce((n, d) => n + d.concepts.length, 0)} concepts decay
              in the next {forecast.horizonDays} days
            </p>
          )}
        </div>

        {!nothingDecaying && reviewEstimate.concepts > 0 && (
          <a
            href="#daily-review"
            className="shrink-0 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all glow-indigo-sm"
          >
            ⚡ {Math.max(reviewEstimate.minutes, 1)}-min save
          </a>
        )}
      </div>

      {/* At-risk list */}
      {atRiskNow.length > 0 && (
        <div className="mt-5 space-y-2">
          {atRiskNow.slice(0, 4).map((c) => (
            <RetentionRow key={c.id} entry={c} tone="risk" />
          ))}
          {atRiskNow.length > 4 && (
            <p className="text-xs text-slate-600 pl-1">+ {atRiskNow.length - 4} more already fading</p>
          )}
        </div>
      )}

      {/* Upcoming decay timeline */}
      {upcoming.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {upcoming.slice(0, 4).map((day) => (
            <div key={day.date} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 min-w-[110px]">
              <p className="text-[11px] font-bold text-amber-400/90 mb-1">{day.label}</p>
              {day.concepts.slice(0, 3).map((c) => (
                <p key={c.id} className="text-xs text-slate-300 truncate" title={`${c.retentionNow}% retention`}>
                  {c.concept}
                </p>
              ))}
              {day.concepts.length > 3 && (
                <p className="text-[11px] text-slate-600">+{day.concepts.length - 3} more</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RetentionRow({ entry }) {
  const pct = Math.max(entry.retentionNow, 4)
  const barColor =
    entry.retentionNow < 50 ? "from-red-500 to-orange-500" : "from-amber-500 to-yellow-500"

  return (
    <div className="flex items-center gap-3">
      <p className="text-xs font-semibold w-32 sm:w-44 truncate" title={entry.concept}>
        {entry.concept}
      </p>
      <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div
          className={`h-full bg-linear-to-r ${barColor} rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-500 w-20 text-right shrink-0">
        {entry.retentionNow}% left
      </p>
    </div>
  )
}
