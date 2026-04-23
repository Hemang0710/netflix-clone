import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import Navbar from "@/components/Navbar"
import { redirect } from "next/navigation"
import DeleteVideoButton from "@/components/DeleteVideoButton"

export default async function CreatorDashboard() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [content, credits] = await Promise.all([
    prisma.content.findMany({
      where: { creatorId: Number(user.userId) },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userCredits.findUnique({
      where: { userId: Number(user.userId) },
    }).catch(() => null),
  ])

  const totalViews = content.reduce((sum, c) => sum + c.views, 0)
  const aiProcessed = content.filter((c) => c.transcript).length

  const stats = [
    { label: "Total Lessons", value: content.length, icon: "🎬", color: "text-indigo-400" },
    { label: "Total Views", value: totalViews.toLocaleString(), icon: "👁️", color: "text-violet-400" },
    { label: "AI Processed", value: `${aiProcessed}/${content.length}`, icon: "🤖", color: "text-emerald-400" },
    { label: "AI Credits", value: credits?.credits ?? 0, icon: "⚡", color: "text-amber-400" },
  ]

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Navbar />

      <div className="pt-24 pb-16 px-6 md:px-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Instructor Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your courses and track learner progress</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/creator/studio"
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/8 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
            >
              ✨ AI Studio
            </Link>
            <Link
              href="/creator/upload"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all text-sm glow-indigo-sm"
            >
              + Upload Lesson
            </Link>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className={`text-3xl font-black ${stat.color} mb-1`}>{stat.value}</p>
              <p className="text-slate-500 text-xs font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Content list */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-bold">Your Lessons</h2>
            <span className="text-slate-500 text-sm">{content.length} total</span>
          </div>

          {content.length === 0 ? (
            <div className="p-16 text-center">
              <span className="text-5xl mb-4 block">🎓</span>
              <p className="text-slate-400 font-medium mb-2">No lessons yet</p>
              <p className="text-slate-600 text-sm mb-6">Upload your first lesson or use AI Studio to generate content</p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/creator/studio"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
                >
                  Open AI Studio
                </Link>
                <Link
                  href="/creator/upload"
                  className="bg-white/5 hover:bg-white/10 border border-white/8 text-white px-5 py-2.5 rounded-xl text-sm transition-all"
                >
                  Upload Video
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {content.map((video) => (
                <div key={video.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/2 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-24 h-14 bg-[#0d0d1a] rounded-xl overflow-hidden shrink-0 border border-white/5">
                      {video.thumbnailUrl ? (
                        <Image
                          src={video.thumbnailUrl}
                          alt={video.title}
                          width={96}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">
                          🎬
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <p className="font-semibold text-sm text-white">{video.title}</p>
                      <div className="flex flex-wrap gap-3 text-slate-500 text-xs mt-1.5">
                        <span className="flex items-center gap-1">
                          👁 {video.views.toLocaleString()}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/8">
                          {video.genre}
                        </span>
                        <span className={video.isFree ? "text-emerald-400" : "text-amber-400"}>
                          {video.isFree ? "Free" : `$${video.price}`}
                        </span>
                        <span className={video.transcript ? "text-emerald-400" : "text-slate-600"}>
                          {video.transcript ? "✓ AI processed" : "○ Pending AI"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0 items-center">
                    <Link
                      href={`/watch/${video.id}`}
                      className="text-xs bg-white/5 hover:bg-white/10 border border-white/8 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Preview
                    </Link>
                    <DeleteVideoButton videoId={video.id} videoTitle={video.title} />
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
