import prisma from "@/lib/prisma";
import { notFound } from "next/navigation"
import Navbar from "@/components/Navbar"
import WatchPageClient from "@/components/WatchPageClient"

export default async function WatchPage({ params }) {
  const { id } = await params

  const content = await prisma.content.findUnique({
    where: { id: Number(id) },
    include: {
      creator: {
        select: {
          email: true,
          profile: { select: { name: true, avatarUrl: true } },
        },
      },
    },
  })

  if (!content) notFound()

  await prisma.content.update({
    where: { id: Number(id) },
    data: { views: { increment: 1 } },
  })

  const chapters = content.chapters ? JSON.parse(content.chapters) : []
  const creatorName = content.creator.profile?.name || content.creator.email

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Navbar />
      <WatchPageClient
        content={content}
        chapters={chapters}
        creatorName={creatorName}
      />
    </main>
  )
}