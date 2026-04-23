import Navbar from "@/components/Navbar"
import ContentRow from "@/components/ContentRow"
import Link from "next/link"
import Image from "next/image"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

const CATEGORY_ICONS = {
  Education: "🎓", General: "📚", Action: "⚡",
  Comedy: "😄", Drama: "🎭", "Sci-Fi": "🚀",
  Horror: "👻", Documentary: "📹",
}

export default async function BrowsePage() {
  const user = await getCurrentUser()

  // Fetch content and user progress in parallel
  const [allContent, userProgress] = await Promise.all([
    prisma.content.findMany({
      orderBy: { views: "desc" },
      include: {
        creator: {
          select: {
            email: true,
            profile: { select: { name: true } },
          },
        },
      },
    }),
    user
      ? prisma.watchProgress.findMany({
          where: { userId: Number(user.userId), timestamp: { gt: 0 } },
          select: { contentId: true, timestamp: true, duration: true, completed: true },
        })
      : Promise.resolve([]),
  ])

  // Build a map of contentId → progress for quick lookup
  const progressMap = {}
  for (const p of userProgress) {
    progressMap[p.contentId] = p
  }

  // Split into sections
  const featured = allContent[0] || null
  const inProgress = allContent.filter(
    (c) => progressMap[c.id] && progressMap[c.id].timestamp > 30 && !progressMap[c.id].completed
  )
  const completed = allContent.filter((c) => progressMap[c.id]?.completed)
  const trending  = allContent.filter((c) => c.views > 0).slice(0, 12)
  const newest    = [...allContent].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 12)

  // Group by genre (skip featured to avoid repetition)
  const byGenre = {}
  for (const c of allContent) {
    if (!byGenre[c.genre]) byGenre[c.genre] = []
    byGenre[c.genre].push(c)
  }

  const creatorName = featured
    ? (featured.creator?.profile?.name || featured.creator?.email?.split("@")[0] || "Creator")
    : ""

  return (
    <main className="min-h-screen bg-[#050508]">
      <Navbar />

      {/* ── Hero ── */}
      {featured ? (
        <div className="relative h-[78vh] flex items-end pb-20 px-6 md:px-12 overflow-hidden">
          {/* Backdrop */}
          {featured.thumbnailUrl ? (
            <div className="absolute inset-0">
              <Image
                src={featured.thumbnailUrl}
                alt={featured.title}
                fill
                className="object-cover scale-105"
                priority
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-indigo-900/40 to-violet-900/40" />
          )}

          {/* Gradients */}
          <div className="absolute inset-0 bg-linear-to-r from-[#050508] via-[#050508]/70 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-[#050508] via-transparent to-[#050508]/50" />

          {/* Badge */}
          <div className="absolute top-24 left-6 md:left-12 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Featured Lesson
            </span>
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-white/8 border border-white/10 text-slate-300 text-xs">
                {featured.genre}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                featured.isFree ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
              }`}>
                {featured.isFree ? "Free" : `$${featured.price}`}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
              {featured.title}
            </h1>

            <div className="flex items-center gap-3 text-slate-400 text-sm mb-3">
              <span className="flex items-center gap-1">👁 {featured.views.toLocaleString()} learners</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>by {creatorName}</span>
              {featured.transcript && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span className="text-indigo-400">✓ AI Ready</span>
                </>
              )}
            </div>

            {featured.description && (
              <p className="text-slate-400 text-sm leading-relaxed mb-7 max-w-lg line-clamp-2">
                {featured.description}
              </p>
            )}

            <div className="flex gap-3">
              <Link
                href={`/watch/${featured.id}`}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-7 py-3 rounded-xl transition-all glow-indigo-sm text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Start Lesson
              </Link>
              <Link
                href={`/watch/${featured.id}`}
                className="flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-white font-semibold px-7 py-3 rounded-xl transition-all text-sm"
              >
                More Info
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state hero */
        <div className="relative flex flex-col items-center justify-center text-center px-6 pt-36 pb-24 overflow-hidden">
          <div className="orb w-80 h-80 bg-indigo-600 top-0 left-1/4 animate-float" />
          <div className="orb w-64 h-64 bg-violet-600 top-10 right-1/4 animate-float-delayed" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              No courses yet — be the first creator
            </div>
            <h1 className="text-5xl font-black mb-4 tracking-tight">
              Your learning hub is <span className="gradient-text">ready</span>
            </h1>
            <p className="text-slate-400 text-xl mb-8">
              Upload your first lesson or let AI generate your entire course.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/creator/studio" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all glow-indigo-sm">
                ✨ Open AI Studio
              </Link>
              <Link href="/creator/upload" className="bg-white/8 hover:bg-white/12 border border-white/10 text-white px-6 py-3 rounded-xl text-sm transition-all font-semibold">
                Upload Lesson
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Content rows ── */}
      <div className="pb-24 space-y-2 relative z-10 mt-4">

        {inProgress.length > 0 && (
          <ContentRow
            title="▶ Continue Learning"
            items={inProgress}
            progressMap={progressMap}
            href="/learn"
          />
        )}

        {completed.length > 0 && (
          <ContentRow
            title="✅ Completed"
            items={completed}
            progressMap={progressMap}
          />
        )}

        {trending.length > 0 && (
          <ContentRow
            title="🔥 Most Popular"
            items={trending}
            progressMap={progressMap}
          />
        )}

        {newest.length > 0 && newest[0]?.id !== trending[0]?.id && (
          <ContentRow
            title="✨ Newly Added"
            items={newest}
            progressMap={progressMap}
          />
        )}

        {/* Per-genre rows */}
        {Object.entries(byGenre).map(([genre, items]) => (
          <ContentRow
            key={genre}
            title={`${CATEGORY_ICONS[genre] || "📚"} ${genre}`}
            items={items}
            progressMap={progressMap}
          />
        ))}

        {/* Empty state rows */}
        {allContent.length === 0 && (
          <div className="px-6 md:px-12 py-8">
            <div className="glass-card rounded-2xl p-12 text-center">
              <span className="text-5xl mb-4 block">🎓</span>
              <h3 className="text-white font-bold text-xl mb-2">No lessons uploaded yet</h3>
              <p className="text-slate-500 text-sm mb-6">
                Use AI Studio to generate content or upload your first video lesson.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/creator/studio" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
                  Open AI Studio
                </Link>
                <Link href="/creator/upload" className="bg-white/5 hover:bg-white/10 border border-white/8 text-white px-5 py-2.5 rounded-xl text-sm transition-all">
                  Upload Video
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
