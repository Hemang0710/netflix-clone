import Navbar from "@/components/Navbar"
import prisma from "@/lib/prisma"

const MEDALS = ["🥇", "🥈", "🥉"]

async function getLeaderboard() {
  const [quizScores, watchData, flashcardData] = await Promise.all([
    prisma.quizAttempt.groupBy({ by: ["userId"], _avg: { score: true }, _count: { id: true } }),
    prisma.watchProgress.groupBy({ by: ["userId"], _sum: { timestamp: true } }),
    prisma.flashcard.groupBy({ by: ["userId"], _sum: { repetitions: true } }),
  ])

  const scoreMap = {}
  for (const q of quizScores) {
    scoreMap[q.userId] = { userId: q.userId, quizScore: Math.round(q._avg.score ?? 0), quizCount: q._count.id, watchMinutes: 0, flashcardReps: 0 }
  }
  for (const w of watchData) {
    scoreMap[w.userId] = scoreMap[w.userId] || { userId: w.userId, quizScore: 0, quizCount: 0, flashcardReps: 0 }
    scoreMap[w.userId].watchMinutes = Math.round((w._sum.timestamp ?? 0) / 60)
  }
  for (const f of flashcardData) {
    scoreMap[f.userId] = scoreMap[f.userId] || { userId: f.userId, quizScore: 0, quizCount: 0, watchMinutes: 0 }
    scoreMap[f.userId].flashcardReps = f._sum.repetitions ?? 0
  }

  const userIds = Object.keys(scoreMap).map(Number)
  const profiles = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, profile: { select: { name: true } } },
  })
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))

  return Object.values(scoreMap)
    .map(e => ({
      ...e,
      name: profileMap[e.userId]?.profile?.name || profileMap[e.userId]?.email?.split("@")[0] || "Learner",
      totalScore: Math.round(e.quizScore * 0.5 + Math.min(e.watchMinutes, 200) * 0.15 + Math.min(e.flashcardReps, 100) * 0.2),
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 20)
}

export default async function LeaderboardPage() {
  const board = await getLeaderboard()

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Navbar />
      <div className="pt-24 pb-16 px-6 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight">🏆 Leaderboard</h1>
          <p className="text-slate-500 text-sm mt-1">Top learners ranked by quiz score, watch time, and flashcard practice</p>
        </div>

        {/* Score formula legend */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Quiz Score", weight: "50%", icon: "🧠", color: "indigo" },
            { label: "Watch Time", weight: "30%", icon: "⏱", color: "violet" },
            { label: "Flashcards", weight: "20%", icon: "🃏", color: "emerald" },
          ].map(s => (
            <div key={s.label} className="glass-card rounded-xl p-4 text-center">
              <span className="text-2xl">{s.icon}</span>
              <p className="text-white text-xs font-semibold mt-1">{s.label}</p>
              <p className="text-slate-500 text-xs">{s.weight} weight</p>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          {board.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-4xl">📊</span>
              <p className="text-slate-400 mt-3">No data yet. Start learning to appear here!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {board.map((entry, i) => (
                <div key={entry.userId} className={`px-6 py-4 flex items-center gap-4 ${i < 3 ? "bg-white/2" : ""}`}>
                  <div className="w-8 text-center">
                    {i < 3 ? (
                      <span className="text-xl">{MEDALS[i]}</span>
                    ) : (
                      <span className="text-slate-600 font-bold text-sm">#{i + 1}</span>
                    )}
                  </div>

                  <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-black text-white shrink-0">
                    {entry.name[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{entry.name}</p>
                    <div className="flex gap-3 text-[11px] text-slate-500 mt-0.5">
                      <span>🧠 {entry.quizScore}% avg</span>
                      <span>⏱ {entry.watchMinutes}m</span>
                      <span>🃏 {entry.flashcardReps} reps</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-black text-lg ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-white"}`}>
                      {entry.totalScore}
                    </p>
                    <p className="text-slate-600 text-[10px]">pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
