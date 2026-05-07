import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Link from "next/link"

export default async function CertificatePage({ params }) {
  const { pathId } = await params
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const cert = await prisma.certificate.findUnique({
    where: { userId_pathId: { userId: Number(user.userId), pathId: Number(pathId) } },
    include: {
      path: { select: { title: true, description: true } },
      user: { select: { email: true, profile: { select: { name: true } } } },
    },
  })
  if (!cert) notFound()

  const learnerName = cert.user.profile?.name || cert.user.email.split("@")[0]
  const issueDate = new Date(cert.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Navbar />
      <div className="pt-24 pb-16 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <Link href={`/learn/path/${pathId}`} className="text-slate-500 hover:text-white text-sm transition-colors">← Back to Path</Link>
        </div>

        {/* Certificate card */}
        <div className="relative bg-linear-to-br from-[#0d0d1a] to-[#0a0a14] border border-indigo-500/30 rounded-3xl p-10 text-center overflow-hidden shadow-2xl shadow-indigo-500/10 print:shadow-none">
          {/* Decorative corners */}
          <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-indigo-500/40 rounded-tl-xl" />
          <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-indigo-500/40 rounded-tr-xl" />
          <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-indigo-500/40 rounded-bl-xl" />
          <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-indigo-500/40 rounded-br-xl" />

          <div className="relative z-10 space-y-6">
            <div>
              <span className="text-5xl">🏆</span>
              <p className="text-indigo-400 text-xs tracking-[0.3em] uppercase mt-3">Certificate of Completion</p>
            </div>

            <div>
              <p className="text-slate-400 text-sm">This certifies that</p>
              <h2 className="text-4xl font-black text-white mt-1 mb-1">{learnerName}</h2>
              <p className="text-slate-400 text-sm">has successfully completed</p>
            </div>

            <div className="border-t border-b border-indigo-500/20 py-5 px-8">
              <h3 className="text-2xl font-bold text-indigo-300">{cert.path.title}</h3>
              {cert.path.description && <p className="text-slate-500 text-sm mt-1">{cert.path.description}</p>}
            </div>

            <div className="flex items-center justify-center gap-8">
              <div>
                <p className="text-slate-500 text-xs">Issued on</p>
                <p className="text-white text-sm font-semibold">{issueDate}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-slate-500 text-xs">Platform</p>
                <p className="text-white text-sm font-semibold">LearnAI</p>
              </div>
            </div>

            <div className="text-[10px] text-slate-700 font-mono">
              CERT-{cert.id.toString().padStart(6, "0")}-{cert.userId}-{cert.pathId}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-6">
          <button onClick={() => window.print()} className="bg-white/5 hover:bg-white/10 border border-white/8 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all">
            🖨 Print Certificate
          </button>
          <Link href="/browse" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
            Keep Learning →
          </Link>
        </div>
      </div>
    </main>
  )
}
