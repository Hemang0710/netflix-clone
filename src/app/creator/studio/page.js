import Navbar from "@/components/Navbar"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

const AI_TOOLS = [
  {
    href: "/creator/generate/script",
    icon: "✍️",
    label: "Script Writer",
    description: "Generate a fully structured video script with hook, sections, examples, and CTA.",
    cost: 2,
    costLabel: "2 credits",
    color: "from-indigo-500/15 to-indigo-600/5",
    border: "border-indigo-500/20 hover:border-indigo-500/40",
    badge: "indigo",
    cta: "Write a Script",
  },
  {
    href: "/creator/generate/thumbnail",
    icon: "🎨",
    label: "Thumbnail Generator",
    description: "Create eye-catching 16:9 thumbnails using DALL-E 3. Pick style and mood.",
    cost: 3,
    costLabel: "3 credits",
    color: "from-violet-500/15 to-violet-600/5",
    border: "border-violet-500/20 hover:border-violet-500/40",
    badge: "violet",
    cta: "Generate Thumbnail",
  },
  {
    href: "/creator/generate/outline",
    icon: "🗺️",
    label: "Course Outline",
    description: "Plan a full course with modules, topics, estimated time, and video titles.",
    cost: 1,
    costLabel: "1 credit",
    color: "from-cyan-500/15 to-cyan-600/5",
    border: "border-cyan-500/20 hover:border-cyan-500/40",
    badge: "cyan",
    cta: "Plan a Course",
  },
]

const TYPE_CONFIG = {
  script:    { icon: "✍️", label: "Script",    color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  thumbnail: { icon: "🎨", label: "Thumbnail", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  outline:   { icon: "🗺️", label: "Outline",   color: "bg-cyan-500/10   text-cyan-400   border-cyan-500/20"   },
}

export default async function StudioPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  let credits = 0
  let recentGenerations = []

  try {
    const [userCredits, generations] = await Promise.all([
      prisma.userCredits.findUnique({ where: { userId: Number(user.userId) } }).catch(() => null),
      prisma.aIGeneration.findMany({
        where: { userId: Number(user.userId) },
        orderBy: { createdAt: "desc" },
        take: 5,
      }).catch(() => []),
    ])
    credits = userCredits?.credits ?? 0
    recentGenerations = generations
  } catch {
    credits = 0
  }

  const LOW_CREDITS = credits < 5

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Navbar />

      <div className="pt-24 pb-16 px-6 md:px-8 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              ✨ AI Studio
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Generate scripts, thumbnails, and course outlines with AI
            </p>
          </div>

          {/* Credits widget */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
            LOW_CREDITS
              ? "bg-red-500/8 border-red-500/20"
              : "bg-amber-500/8 border-amber-500/20"
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white">⚡ {credits}</span>
                <span className={`text-xs font-semibold ${LOW_CREDITS ? "text-red-400" : "text-amber-400"}`}>
                  {LOW_CREDITS ? "Low credits!" : "credits"}
                </span>
              </div>
              <p className="text-slate-600 text-xs mt-0.5">AI generation credits</p>
            </div>
            <Link
              href="/subscribe"
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                LOW_CREDITS
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/25"
                  : "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/20"
              }`}
            >
              Buy More →
            </Link>
          </div>
        </div>

        {/* Tool cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {AI_TOOLS.map((tool) => {
            const canAfford = credits >= tool.cost
            return (
              <div
                key={tool.href}
                className={`relative glass-card rounded-2xl p-7 border transition-all group ${tool.border} ${
                  canAfford ? "hover:-translate-y-1" : "opacity-60"
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${tool.color} flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform`}>
                  {tool.icon}
                </div>

                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border mb-4 ${
                  tool.badge === "indigo" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                  tool.badge === "violet" ? "bg-violet-500/10 text-violet-400 border-violet-500/20" :
                                            "bg-cyan-500/10   text-cyan-400   border-cyan-500/20"
                }`}>
                  {tool.costLabel} per use
                </div>

                <h3 className="text-white font-bold text-lg mb-2">{tool.label}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">{tool.description}</p>

                {canAfford ? (
                  <Link
                    href={tool.href}
                    className="block text-center w-full py-2.5 rounded-xl bg-white/6 hover:bg-white/10 border border-white/8 text-white font-semibold text-sm transition-all group-hover:border-white/15"
                  >
                    {tool.cta} →
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-white/3 border border-white/5 text-slate-600 font-semibold text-sm cursor-not-allowed"
                  >
                    Need {tool.cost - credits} more credit{tool.cost - credits !== 1 ? "s" : ""}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Quick tips */}
        <div className="glass-card rounded-2xl p-6 mb-10 flex flex-wrap gap-6">
          {[
            { icon: "💡", text: "Generate a script first, then upload a video and let AI process it for flashcards & debate." },
            { icon: "🃏", text: "Once your video is AI-processed, learners can review it with spaced-repetition flashcards." },
            { icon: "⚔️", text: "The AI Debate feature challenges learners to defend the content — deepens retention." },
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-3 flex-1 min-w-52">
              <span className="text-xl shrink-0">{tip.icon}</span>
              <p className="text-slate-400 text-xs leading-relaxed">{tip.text}</p>
            </div>
          ))}
        </div>

        {/* Recent generations */}
        <div>
          <h2 className="text-lg font-bold mb-4">Recent Generations</h2>

          {recentGenerations.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center">
              <span className="text-4xl mb-3 block">🤖</span>
              <p className="text-slate-400 font-medium mb-1">No generations yet</p>
              <p className="text-slate-600 text-sm">Use one of the AI tools above to get started</p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/4">
              {recentGenerations.map((gen) => {
                const cfg = TYPE_CONFIG[gen.type] || { icon: "🤖", label: gen.type, color: "bg-white/8 text-slate-400 border-white/10" }
                return (
                  <div key={gen.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/2 transition-colors">
                    <span className="text-xl shrink-0">{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
                          {cfg.label.toUpperCase()}
                        </span>
                        <span className="text-slate-600 text-xs">
                          {new Date(gen.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs truncate">{gen.prompt}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-amber-400 text-xs font-semibold">⚡ {gen.creditsUsed}</p>
                      <p className={`text-[10px] mt-0.5 ${gen.status === "completed" ? "text-emerald-500" : "text-slate-600"}`}>
                        {gen.status}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Navigation links */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/creator/upload"    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/8 border border-white/8 text-slate-300 text-sm transition-all">📤 Upload Video</Link>
          <Link href="/creator/dashboard" className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/8 border border-white/8 text-slate-300 text-sm transition-all">📊 My Dashboard</Link>
          <Link href="/learn"             className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/8 border border-white/8 text-slate-300 text-sm transition-all">📚 My Learning</Link>
        </div>
      </div>
    </main>
  )
}
