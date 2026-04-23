"use client"

import { useState, useEffect } from "react"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

function getIntensity(minutes) {
  if (minutes === 0) return 0
  if (minutes < 5)   return 1
  if (minutes < 20)  return 2
  if (minutes < 45)  return 3
  return 4
}

const INTENSITY_CLASSES = [
  "bg-white/4 border-white/6",
  "bg-indigo-500/20 border-indigo-500/25",
  "bg-indigo-500/40 border-indigo-500/40",
  "bg-indigo-500/65 border-indigo-500/60",
  "bg-indigo-500 border-indigo-500/80",
]

export default function LearningHeatmap() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState(null)

  useEffect(() => {
    fetch("/api/progress/heatmap")
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-pulse">
        <div className="h-4 w-40 bg-white/8 rounded mb-6" />
        <div className="h-28 bg-white/4 rounded-xl" />
      </div>
    )
  }

  if (!data) return null

  const { weeks, stats, last7 } = data
  const maxMinutes = Math.max(...last7.map((d) => d.minutes), 1)

  // Get month labels for top of heatmap
  const monthLabels = []
  let lastMonth = null
  weeks.forEach((week, wi) => {
    const firstDay = week.find((d) => !d.isFuture)
    if (!firstDay) return
    const month = new Date(firstDay.date).getMonth()
    if (month !== lastMonth) {
      monthLabels.push({ index: wi, label: MONTHS[month] })
      lastMonth = month
    }
  })

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      {/* Stats row */}
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="text-3xl font-black text-white flex items-center gap-2">
            {stats.streak > 0 && <span className="text-2xl">{stats.streak >= 7 ? "🔥" : "⚡"}</span>}
            {stats.streak}
          </p>
          <p className="text-slate-500 text-xs mt-0.5">day streak</p>
        </div>
        <div>
          <p className="text-3xl font-black gradient-text">{stats.totalDays}</p>
          <p className="text-slate-500 text-xs mt-0.5">days learned</p>
        </div>
        <div>
          <p className="text-3xl font-black text-violet-400">{stats.totalMinutes}</p>
          <p className="text-slate-500 text-xs mt-0.5">total minutes</p>
        </div>
        <div>
          <p className="text-3xl font-black text-cyan-400">{stats.totalSessions}</p>
          <p className="text-slate-500 text-xs mt-0.5">lessons watched</p>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Month labels */}
          <div className="flex gap-1 mb-1 pl-8">
            {weeks.map((_, wi) => {
              const found = monthLabels.find((m) => m.index === wi)
              return (
                <div key={wi} className="w-3 text-[9px] text-slate-600">
                  {found ? found.label : ""}
                </div>
              )
            })}
          </div>

          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-1">
              {DAYS.map((d, i) => (
                <div key={d} className="h-3 text-[9px] text-slate-600 flex items-center">
                  {i % 2 === 1 ? d : ""}
                </div>
              ))}
            </div>

            {/* Squares */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => {
                  const intensity = day.isFuture ? -1 : getIntensity(day.minutes)
                  return (
                    <div
                      key={di}
                      className={`w-3 h-3 rounded-sm border cursor-pointer transition-all hover:scale-125 ${
                        day.isFuture
                          ? "bg-transparent border-transparent"
                          : INTENSITY_CLASSES[intensity]
                      }`}
                      onMouseEnter={() => !day.isFuture && setTooltip({ day, x: wi, y: di })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div className="mt-2 text-xs text-slate-400 bg-[#0d0d1a] border border-white/8 px-3 py-2 rounded-lg inline-block">
              <span className="text-white font-semibold">
                {new Date(tooltip.day.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              {" · "}
              {tooltip.day.minutes > 0
                ? `${tooltip.day.minutes} min · ${tooltip.day.count} lesson${tooltip.day.count !== 1 ? "s" : ""}`
                : "No activity"}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] text-slate-600">Less</span>
            {INTENSITY_CLASSES.map((cls, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm border ${cls}`} />
            ))}
            <span className="text-[10px] text-slate-600">More</span>
          </div>
        </div>
      </div>

      {/* Weekly velocity bars */}
      <div>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3">Last 7 days</p>
        <div className="flex items-end gap-2 h-16">
          {last7.map((day, i) => {
            const height = maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center h-12">
                  <div
                    className="w-full rounded-t-sm bg-linear-to-t from-indigo-600 to-violet-500 transition-all duration-500 min-h-[2px]"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${day.minutes} min`}
                  />
                </div>
                <span className="text-[9px] text-slate-600">{day.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
