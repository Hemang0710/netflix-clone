import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import PathManagerClient from "@/components/PathManagerClient"

export default async function CreatorPathsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [paths, myVideos] = await Promise.all([
    prisma.learningPath.findMany({
      where: { creatorId: Number(user.userId) },
      include: { _count: { select: { enrollments: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.content.findMany({
      where: { creatorId: Number(user.userId) },
      select: { id: true, title: true, thumbnailUrl: true, duration: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Navbar />
      <div className="pt-24 pb-16 px-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Learning Paths</h1>
            <p className="text-slate-500 text-sm mt-1">Group your videos into structured courses</p>
          </div>
          <Link href="/creator/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">← Dashboard</Link>
        </div>

        <PathManagerClient paths={paths} myVideos={myVideos} />
      </div>
    </main>
  )
}
