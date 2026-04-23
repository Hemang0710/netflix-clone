"use client"

import Image from "next/image"
import Link from "next/link"

const GENRE_COLORS = {
  "Web Development": "indigo",
  "AI & ML":         "violet",
  "Data Science":    "cyan",
  "Business":        "amber",
  "Design":          "pink",
  "DevOps":          "emerald",
  "Education":       "blue",
  "General":         "slate",
}

const GENRE_ICONS = {
  "Education":  "🎓", "General": "📚", "Action":  "⚡",
  "Comedy":     "😄", "Drama":   "🎭", "Sci-Fi":  "🚀",
  "Horror":     "👻", "Documentary": "📹",
}

export default function ContentCard({ content, progress }) {
  const pct = progress?.duration > 0
    ? Math.min(Math.round((progress.timestamp / progress.duration) * 100), 100)
    : 0

  const icon = GENRE_ICONS[content.genre] || "🎓"

  return (
    <Link href={`/watch/${content.id}`} className="block">
      <div className="relative shrink-0 w-52 rounded-2xl overflow-hidden border border-white/6 hover:border-indigo-500/30 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 bg-[#0d0d1a] group cursor-pointer">

        {/* Thumbnail */}
        <div className="relative w-full aspect-video bg-[#0a0a14] overflow-hidden">
          {content.thumbnailUrl ? (
            <Image
              src={content.thumbnailUrl}
              alt={content.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="208px"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-linear-to-br from-indigo-500/10 to-violet-500/10">
              <span className="text-4xl">{icon}</span>
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white/90 text-indigo-900 font-bold text-xs px-3 py-1.5 rounded-full">
              ▶ Start Lesson
            </div>
          </div>

          {/* Price badge */}
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              content.isFree
                ? "bg-emerald-500/80 text-white"
                : "bg-amber-500/80 text-white"
            }`}>
              {content.isFree ? "Free" : `$${content.price}`}
            </span>
          </div>

          {/* AI badge */}
          {content.transcript && (
            <div className="absolute top-2 right-2">
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/80 text-white">AI</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {pct > 0 && (
          <div className="h-0.5 bg-white/8">
            <div
              className="h-full bg-linear-to-r from-indigo-500 to-violet-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        {/* Info */}
        <div className="p-3">
          <p className="text-white text-sm font-semibold leading-snug line-clamp-2 mb-2 group-hover:text-indigo-300 transition-colors">
            {content.title}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/6">{content.genre}</span>
            <span>{content.views.toLocaleString()} views</span>
          </div>
          {pct > 0 && (
            <p className="text-indigo-400 text-[10px] mt-1.5 font-medium">{pct}% complete</p>
          )}
        </div>
      </div>
    </Link>
  )
}
