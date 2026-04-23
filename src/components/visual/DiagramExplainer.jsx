"use client"

import { useState } from "react"

export default function DiagramExplainer({
  title,
  description,
  svgCode,
  keyPoints = [],
  followUpPrompts = [],
  onTryDifferent,
  onFollowUp,
}) {
  // Incrementing key forces SVG to re-mount, restarting CSS animations
  const [replayKey, setReplayKey] = useState(0)

  return (
    <div className="space-y-3">
      {/* Title */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-white font-bold text-sm leading-tight">{title}</h4>
        <button
          onClick={() => setReplayKey(k => k + 1)}
          title="Replay animation"
          className="shrink-0 text-zinc-500 hover:text-zinc-300 text-base transition-colors"
        >
          ↺
        </button>
      </div>

      {/* SVG container */}
      {svgCode && (
        <div
          key={replayKey}
          className="rounded-lg overflow-hidden border border-zinc-700 bg-[#09090b]"
          dangerouslySetInnerHTML={{ __html: svgCode }}
        />
      )}

      {/* Description */}
      {description && (
        <p className="text-zinc-400 text-xs leading-relaxed">{description}</p>
      )}

      {/* Key points */}
      {keyPoints.length > 0 && (
        <ul className="space-y-1.5">
          {keyPoints.map((point, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-zinc-300"
              style={{
                animation: `fadeSlideIn 0.4s ease forwards`,
                animationDelay: `${i * 120}ms`,
                opacity: 0,
              }}
            >
              <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-red-600/20 border border-red-600/40 flex items-center justify-center text-red-400 text-[10px] font-bold">
                {i + 1}
              </span>
              {point}
            </li>
          ))}
        </ul>
      )}

      {/* Follow-up suggestion chips */}
      {followUpPrompts.length > 0 && (
        <div className="pt-1">
          <p className="text-zinc-600 text-[10px] uppercase tracking-wide mb-1.5">
            Ask next
          </p>
          <div className="flex flex-col gap-1">
            {followUpPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => onFollowUp?.(prompt)}
                className="text-left text-xs text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-zinc-800">
        <button
          onClick={onTryDifferent}
          className="text-xs text-zinc-400 hover:text-white transition-colors"
        >
          Try as analogy →
        </button>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
