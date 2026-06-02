import { useState } from "react";
import { motion } from "motion/react";

const COLORS = {
  yellow: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
  green: "bg-green-500/20 border-green-500/30 text-green-400",
  blue: "bg-blue-500/20 border-blue-500/30 text-blue-400",
  pink: "bg-pink-500/20 border-pink-500/30 text-pink-400",
};

export default function HighlightLibrary({ data }) {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const highlights = data.highlights || [];
  const notes = data.notes || [];

  let filtered = highlights;
  if (filter !== "all") {
    filtered = highlights.filter((h) => h.color === filter);
  }
  if (searchTerm) {
    filtered = filtered.filter(
      (h) =>
        h.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.content?.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-8 border border-white/10">
        <h2 className="text-2xl font-bold mb-6">Notes & Highlights</h2>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatItem label="Total Highlights" value={highlights.length} />
          <StatItem label="Total Notes" value={notes.length} />
          <StatItem label="By Color" value={Object.values(data.stats?.highlightsByColor || {}).length} />
          <StatItem label="Subjects" value={new Set(highlights.map((h) => h.content?.title)).size} />
        </div>

        {/* Search and Filter */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search highlights..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filter === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-white/10 border border-white/20 hover:bg-white/20"
              }`}
            >
              All
            </button>
            {Object.entries(COLORS).map(([color, className]) => (
              <button
                key={color}
                onClick={() => setFilter(color)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  filter === color
                    ? className
                    : "bg-white/10 border border-white/20 hover:bg-white/20"
                }`}
              >
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Highlights */}
      {filtered.length > 0 && (
        <div className="glass-card rounded-2xl p-8 border border-white/10">
          <h3 className="text-xl font-bold mb-6">
            Highlights ({filtered.length})
          </h3>
          <div className="space-y-4">
            {filtered.map((highlight) => (
              <motion.div
                key={highlight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-xl border-l-4 ${COLORS[highlight.color] || COLORS.yellow}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">
                      {highlight.content?.title}
                    </p>
                    {highlight.startTime && (
                      <p className="text-xs text-slate-600">
                        {new Date(highlight.startTime * 1000)
                          .toISOString()
                          .substr(11, 8)}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(highlight.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <p className="text-white mb-3">"{highlight.text}"</p>

                {highlight.summary && (
                  <div className="p-3 rounded bg-white/5 border border-white/10">
                    <p className="text-xs text-slate-400 font-semibold mb-1">
                      Summary
                    </p>
                    <p className="text-sm text-slate-300">{highlight.summary}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {notes.length > 0 && (
        <div className="glass-card rounded-2xl p-8 border border-white/10">
          <h3 className="text-xl font-bold mb-6">Notes ({notes.length})</h3>
          <div className="space-y-3">
            {notes.slice(0, 10).map((note) => (
              <div key={note.id} className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs text-slate-500">{note.content?.title}</p>
                  <p className="text-xs text-slate-600">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm text-white leading-relaxed">{note.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 && notes.length === 0 && (
        <div className="glass-card rounded-2xl p-12 border border-white/10 text-center">
          <p className="text-slate-400">No highlights or notes yet. Start highlighting key concepts while learning!</p>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold gradient-text">{value}</p>
    </div>
  );
}
