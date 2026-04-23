import Navbar from "@/components/Navbar"
import ScriptGenerator from "@/components/ScriptGenerator"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function ScriptPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  let credits = 0
  try {
    const userCredits = await prisma.userCredits.findUnique({
      where: { userId: Number(user.userId) },
    })
    credits = userCredits?.credits ?? 0
  } catch {
    credits = 0
  }

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Navbar />

      <div className="pt-24 pb-16 px-6">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
            <Link href="/creator/studio" className="hover:text-indigo-400 transition-colors">AI Studio</Link>
            <span>›</span>
            <span className="text-white">Script Writer</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl shrink-0">
              ✍️
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-1">AI Script Writer</h1>
              <p className="text-slate-400">
                Generate a fully structured video script in seconds. Hook, sections, examples, and CTA — all ready to film.
              </p>
            </div>
          </div>
        </div>

        <ScriptGenerator initialCredits={credits} />
      </div>
    </main>
  )
}
