import Navbar from "@/components/Navbar"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import PathEnrollButton from "@/components/PathEnrollButton"

export default async function LearningPathPage({ params }) {
  const { id } = await params
  const user = await getCurrentUser()

  const path = await prisma.learningPath.findUnique({
    where: { id: Number(id) },
    include: {
      creator: { select: { email: true, profile: { select: { name: true } } } },
      _count: { select: { enrollments: true } },
    },
  })
  if (!path || !path.isPublished) notFound()

  const videoIds = JSON.parse(path.videoIds || "[]")
  const videos = videoIds.length
    ? await prisma.content.findMany({ where: { id: { in: videoIds } }, select: { id: true, title: true, thumbnailUrl: true, duration: true, difficulty: true, genre: true, isFree: true } })
    : []
  const ordered = videoIds.map(vid => videos.find(v => v.id === vid)).filter(Boolean)

  const enrollment = user
    ? await prisma.pathEnrollment.findUnique({ where: { userId_pathId: { userId: Number(user.userId), pathId: Number(id) } } })
    : null
  const completedIds = JSON.parse(enrollment?.completedIds || "[]")
  const creatorName = path.creator.profile?.name || path.creator.email.split("@")[0]

  // Drip: compute which videos are unlocked
  const dripSchedule = JSON.parse(path.dripSchedule || "[]")
  function isUnlocked(contentId) {
    if (!path.dripEnabled || !enrollment) return true
    const rule = dripSchedule.find(s => s.contentId === contentId)
    if (!rule) return true
    const daysSinceEnroll = (Date.now() - new Date(enrollment.enrolledAt).getTime()) / 86400000
    return daysSinceEnroll >= rule.unlockAfterDays
  }

  const DIFFICULTY_COLORS = { beginner: "emerald", intermediate: "amber", advanced: "red" }

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Navbar />
      <div className="pt-24 pb-16 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left — path info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-3">
                <Link href="/learn" className="hover:text-white transition-colors">Learning Paths</Link>
                <span>/</span>
                <span className="text-white">{path.title}</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-2">{path.title}</h1>
              {path.description && <p className="text-slate-400 leading-relaxed">{path.description}</p>}
              <div className="flex gap-4 mt-3 text-sm text-slate-500">
                <span>👤 {creatorName}</span>
                <span>🎬 {ordered.length} lessons</span>
                <span>👥 {path._count.enrollments} enrolled</span>
              </div>
            </div>

            {/* Video list */}
            <div className="space-y-2">
              {ordered.map((video, i) => {
                const done = completedIds.includes(video.id)
                const dc = DIFFICULTY_COLORS[video.difficulty] || "slate"
                const unlocked = isUnlocked(video.id)
                const dripRule = dripSchedule.find(s => s.contentId === video.id)
                const Wrapper = unlocked ? Link : "div"
                return (
                  <Wrapper key={video.id} href={unlocked ? `/watch/${video.id}` : undefined}>
                    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      !unlocked ? "border-white/4 bg-white/1 opacity-60 cursor-not-allowed" :
                      done ? "border-emerald-500/30 bg-emerald-500/5 hover:-translate-y-0.5" :
                      "border-white/6 bg-white/2 hover:border-indigo-500/30 hover:-translate-y-0.5"
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${done ? "bg-emerald-500 text-white" : "bg-white/8 text-slate-400"}`}>
                        {done ? "✓" : i + 1}
                      </div>
                      <div className="w-20 h-12 rounded-lg overflow-hidden bg-white/5 shrink-0">
                        {video.thumbnailUrl ? <Image src={video.thumbnailUrl} alt={video.title} width={80} height={48} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🎬</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{video.title}</p>
                        <div className="flex gap-2 mt-0.5">
                          <span className={`text-[10px] text-${dc}-400 bg-${dc}-500/10 px-2 py-0.5 rounded-full capitalize`}>{video.difficulty}</span>
                          {video.duration && <span className="text-slate-600 text-[10px]">{Math.round(video.duration / 60)}m</span>}
                        </div>
                      </div>
                      {!unlocked
                        ? <span className="text-slate-600 text-xs shrink-0">🔒 Day {dripRule?.unlockAfterDays}</span>
                        : <span className="text-slate-600 text-sm shrink-0">▶</span>
                      }
                    </div>
                  </Wrapper>
                )
              })}
            </div>
          </div>

          {/* Right — enroll card */}
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-6 sticky top-24">
              {enrollment ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Progress</span>
                      <span>{completedIds.length}/{ordered.length}</span>
                    </div>
                    <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${ordered.length ? (completedIds.length / ordered.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                  {completedIds.length === ordered.length && ordered.length > 0 && (
                    <Link href={`/learn/certificate/${path.id}`} className="block w-full text-center bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-3 rounded-xl transition-colors text-sm">
                      🏆 View Certificate
                    </Link>
                  )}
                  <Link href={`/watch/${ordered.find(v => !completedIds.includes(v.id))?.id || ordered[0]?.id}`}
                    className="block w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-3 rounded-xl transition-colors text-sm">
                    {completedIds.length === 0 ? "Start Learning" : "Continue →"}
                  </Link>
                </div>
              ) : (
                <PathEnrollButton pathId={path.id} isLoggedIn={!!user} videoCount={ordered.length} />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
