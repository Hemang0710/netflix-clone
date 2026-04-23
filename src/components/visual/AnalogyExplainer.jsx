"use client"

// Picks a simple emoji icon for common analogy subjects
const ICON_MAP = {
  waiter: "🍽️", restaurant: "🍽️", chef: "👨‍🍳", kitchen: "🍳",
  library: "📚", librarian: "📖", book: "📖",
  post: "📬", postman: "📮", letter: "✉️", package: "📦",
  car: "🚗", road: "🛣️", highway: "🛣️", traffic: "🚦",
  phone: "📱", call: "📞", signal: "📡",
  factory: "🏭", assembly: "⚙️", machine: "⚙️",
  bank: "🏦", money: "💰", vault: "🔐", teller: "🏦",
  puzzle: "🧩", box: "📦", container: "📦",
  water: "💧", pipe: "🚰", pump: "💧",
  train: "🚂", bus: "🚌", station: "🚉",
}

function iconFor(word) {
  const lower = word.toLowerCase()
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (lower.includes(key)) return icon
  }
  return "💡"
}

export default function AnalogyExplainer({
  title,
  realWorldSetup,
  story,
  mapping = [],
  followUpPrompts = [],
  onTryDifferent,
  onFollowUp,
}) {
  return (
    <div className="space-y-3">
      {/* Title */}
      <h4 className="text-white font-bold text-sm leading-tight">{title}</h4>

      {/* Scene setter */}
      {realWorldSetup && (
        <p className="text-zinc-400 text-xs italic border-l-2 border-red-600/50 pl-3">
          {realWorldSetup}
        </p>
      )}

      {/* Story */}
      {story && (
        <p className="text-zinc-200 text-xs leading-relaxed">{story}</p>
      )}

      {/* Mapping table */}
      {mapping.length > 0 && (
        <div className="rounded-lg overflow-hidden border border-zinc-700">
          <div className="grid grid-cols-2 bg-zinc-800 px-3 py-1.5">
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">
              Real world
            </span>
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">
              Concept
            </span>
          </div>
          {mapping.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-2 gap-2 px-3 py-2 border-t border-zinc-800 hover:bg-zinc-800/40 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                <span>{iconFor(row.analogy)}</span>
                <span>{row.analogy}</span>
              </div>
              <div>
                <p className="text-xs text-red-400 font-medium">{row.concept}</p>
                {row.explanation && (
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
                    {row.explanation}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Follow-up prompts */}
      {followUpPrompts.length > 0 && (
        <div>
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
      <div className="flex gap-3 pt-1 border-t border-zinc-800">
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
