"use client"

import { useState } from "react"

export default function WalkthroughExplainer({
  title,
  steps = [],
  onGotIt,
  onTryDifferent,
}) {
  const [current, setCurrent] = useState(0)
  const total = steps.length
  const step = steps[current]
  const isLast = current === total - 1
  const progress = total > 1 ? ((current + 1) / total) * 100 : 100

  if (!step) return null

  return (
    <div className="space-y-3">
      {/* Title + progress label */}
      <div className="flex items-center justify-between">
        <h4 className="text-white font-bold text-sm leading-tight">{title}</h4>
        <span className="text-zinc-500 text-[10px] shrink-0">
          {current + 1} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-red-600 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step card */}
      <div className="rounded-xl bg-zinc-800/60 border border-zinc-700 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {step.stepNumber || current + 1}
          </span>
          <p className="text-white text-xs font-semibold">{step.title}</p>
        </div>

        <p className="text-zinc-300 text-xs leading-relaxed">{step.explanation}</p>

        {/* Optional mini SVG */}
        {step.svgHighlight && (
          <div
            className="rounded-lg overflow-hidden border border-zinc-700 bg-[#09090b]"
            dangerouslySetInnerHTML={{ __html: step.svgHighlight }}
          />
        )}

        {/* Key point callout */}
        {step.keyPoint && (
          <div className="flex items-start gap-2 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2">
            <span className="text-red-400 text-xs mt-0.5">💡</span>
            <p className="text-red-300 text-xs leading-snug">{step.keyPoint}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
          className="text-xs text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Back
        </button>

        {/* Step dots */}
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${
                i === current
                  ? "w-4 h-2 bg-red-600"
                  : "w-2 h-2 bg-zinc-700 hover:bg-zinc-500"
              }`}
            />
          ))}
        </div>

        {isLast ? (
          <button
            onClick={onGotIt}
            className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-full transition-colors"
          >
            Got it ✓
          </button>
        ) : (
          <button
            onClick={() => setCurrent(c => Math.min(total - 1, c + 1))}
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Next →
          </button>
        )}
      </div>

      {/* Try different */}
      <div className="pt-1 border-t border-zinc-800">
        <button
          onClick={onTryDifferent}
          className="text-xs text-zinc-400 hover:text-white transition-colors"
        >
          Show as diagram →
        </button>
      </div>
    </div>
  )
}
