import Navbar from "@/components/Navbar"
import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"

export default async function LearningPathsPage() {
  const paths = await prisma.learningPath.findMany({
    where: { isPublished: true },
    include: {
      creator: { select: { email: true, profile: { select: { name: true } } } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Navbar />
      <div className="pt-24 pb-16 px-6 max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black tracking-tight">Learning Paths</h1>
          <p className="text-slate-500 text-sm mt-1">Structured courses with progress tracking and certificates</p>
        </div>

        {paths.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl">🎓</span>
            <p className="text-slate-400 mt-4 font-medium">No learning paths yet</p>
            <p className="text-slate-600 text-sm mt-1">Creators can build paths from the creator dashboard</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paths.map(path => {
              const videoIds = JSON.parse(path.videoIds || "[]")
              const creator = path.creator.profile?.name || path.creator.email.split("@")[0]
              return (
                <Link key={path.id} href={`/learn/path/${path.id}`}>
                  <div className="glass-card rounded-2xl overflow-hidden hover:border-indigo-500/30 border border-white/6 transition-all hover:-translate-y-1 cursor-pointer group">
                    <div className="h-36 bg-linear-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                      {path.coverUrl
                        ? <Image src={path.coverUrl} alt={path.title} width={400} height={144} className="w-full h-full object-cover" />
                        : <span className="text-5xl">🎓</span>
                      }
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 mb-1">{path.title}</h3>
                      {path.description && <p className="text-slate-500 text-xs line-clamp-2 mb-3">{path.description}</p>}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>👤 {creator}</span>
                        <span>🎬 {videoIds.length} lessons</span>
                        <span>👥 {path._count.enrollments}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
