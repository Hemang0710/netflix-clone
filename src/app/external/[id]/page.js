import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import Navbar from "@/components/layout/Navbar"
import ExternalWatchClient from "@/components/video/ExternalWatchClient"

export async function generateMetadata({ params }) {
  const { id } = await params
  const content = await prisma.externalContent.findUnique({
    where: { id: Number(id) }
  })

  if (!content) return { title: "Video not found" }

  return {
    title: `${content.title} | stream-ai`,
    description: content.description || content.aiSummary || "Watch this video with AI-generated summaries, chapters, and quizzes",
    openGraph: {
      images: [content.thumbnailUrl]
    }
  }
}

export default async function ExternalWatchPage({ params }) {
  const { id } = await params
  const user = await getCurrentUser()

  const content = await prisma.externalContent.findUnique({
    where: { id: Number(id) },
    include: {
      user: {
        select: { profile: { select: { name: true, avatarUrl: true } } }
      },
      watchProgress: user ? {
        where: { userId: Number(user.userId) },
        select: { timestamp: true, completed: true }
      } : false
    }
  })

  if (!content) notFound()

  // Only authenticated users can view external content
  if (!user) {
    return notFound()
  }

  const chapters = content.chapters ? JSON.parse(content.chapters) : []
  const userProgress = content.watchProgress?.[0]

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Navbar />
      <ExternalWatchClient
        content={content}
        chapters={chapters}
        userProgress={userProgress}
        userId={user?.userId || null}
      />
    </main>
  )
}
