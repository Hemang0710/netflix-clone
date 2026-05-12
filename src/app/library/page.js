import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import LibraryClient from "@/components/library/LibraryClient"

export const metadata = {
  title: "My Learning Library | stream-ai",
  description: "Your personal collection of YouTube videos with AI-generated summaries, chapters, and quizzes"
}

export default async function LibraryPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Navbar />
      <LibraryClient userId={user.userId} />
    </main>
  )
}
