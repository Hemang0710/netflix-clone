import Navbar from "@/components/layout/Navbar"
import InboxClient from "@/components/inbox/InboxClient"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Learning Inbox - LearnAI",
  description: "Everything you've captured to learn — articles, videos, PDFs — mined into your review queue",
}

export default async function InboxPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login?next=/inbox")

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Navbar />
      <div className="pt-24 pb-16 px-6 md:px-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight">📥 Learning Inbox</h1>
          <p className="text-slate-500 text-sm mt-1">
            Drop in any article, YouTube video, PDF, or note — AI extracts the concepts and adds
            them to your spaced-repetition queue
          </p>
        </div>
        <InboxClient />
      </div>
    </main>
  )
}
