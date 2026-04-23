import Navbar from "@/components/Navbar"
import LearningHeatmap from "@/components/LearningHeatmap"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function LearnPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [dueCards, recentProgress, credits] = await Promise.all([
    prisma.flashcard.count({
      where: { userId: user.userId, dueDate: { lte: new Date() } },
    }).catch(() => 0),
    prisma.watchProgress.findMany({
      where: { userId: user.userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { content: { select: { id: true, title: true, thumbnailUrl: true, genre: true } } },
    }),
    prisma.userCredits.findUnique({ where: { userId: user.userId } }).catch(() => null),
  ])

  const totalWatched = await prisma.watchProgress.count({ where: { userId: user.userId, timestamp: { gt: 30 } } })
  const completed = await prisma.watchProgress.count({ where: { userId: user.userId, completed: true } })

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Navbar />

      <div className="pt-24 pb-16 px-6 md:px-8 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight">My Learning</h1>
            <p className="text-slate-500 text-sm mt-1">Track your progress and review what you&apos;ve learned</p>
          </div>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all glow-indigo-sm"
          >
            + Find Courses
          </Link>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Lessons Started", value: totalWatched, icon: "▶️", color: "text-indigo-400" },
            { label: "Completed", value: completed, icon: "✅", color: "text-emerald-400" },
            { label: "Cards Due", value: dueCards, icon: "🃏", color: dueCards > 0 ? "text-amber-400" : "text-slate-500", link: dueCards > 0 ? "/browse" : null },
            { label: "AI Credits", value: credits?.credits ?? 0, icon: "⚡", color: "text-amber-400", link: "/creator/studio" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-2xl p-5">
              <span className="text-2xl mb-2 block">{stat.icon}</span>
              <p className={`text-3xl font-black ${stat.color} mb-0.5`}>{stat.value}</p>
              <p className="text-slate-500 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Flashcard due notice */}
        {dueCards > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/8 border border-amber-500/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🃏</span>
              <div>
                <p className="text-amber-300 font-semibold text-sm">
                  {dueCards} flashcard{dueCards > 1 ? "s" : ""} due for review
                </p>
                <p className="text-amber-600 text-xs">Review them now to stay ahead of the forgetting curve</p>
              </div>
            </div>
            <Link
              href="/browse"
              className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-semibold px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap"
            >
              Go to lessons →
            </Link>
          </div>
        )}

        {/* Activity Heatmap */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Learning Activity</h2>
          <LearningHeatmap />
        </div>

        {/* Recent lessons */}
        {recentProgress.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4">Continue Watching</h2>
            <div className="space-y-3">
              {recentProgress.map((p) => {
                const pct = p.duration > 0 ? Math.min(Math.round((p.timestamp / p.duration) * 100), 100) : 0
                return (
                  <Link key={p.id} href={`/watch/${p.content.id}`}>
                    <div className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-500/25 transition-all group">
                      <div className="w-16 h-10 rounded-lg bg-[#0d0d1a] border border-white/5 shrink-0 flex items-center justify-center text-lg overflow-hidden">
                        {p.content.thumbnailUrl ? (
                          <img src={p.content.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : "🎓"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate group-hover:text-indigo-300 transition-colors">
                          {p.content.title}
                        </p>
                        <div className="mt-1.5 h-1 bg-white/8 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-slate-600 text-xs mt-1">{pct}% complete</p>
                      </div>
                      <p className="text-indigo-400 text-sm font-bold shrink-0 group-hover:translate-x-1 transition-transform">→</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
