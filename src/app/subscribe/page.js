import PricingPlans from "@/components/PricingPlans"
import Navbar from "@/components/Navbar"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

export default async function SubscribePage() {
  const user = await getCurrentUser()

  const subscription = user
    ? await prisma.subscription.findUnique({
        where: { userId: Number(user.userId) },
      })
    : null

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Navbar />

      <div className="pt-28 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-sm font-medium mb-6">
              Flexible plans for every learner
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight">
              Unlock Your Full{" "}
              <span className="gradient-text">Potential</span>
            </h1>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto">
              All plans include AI-generated quizzes, progress tracking, and an AI chat assistant on every lesson.
            </p>
          </div>

          <PricingPlans currentPlan={subscription?.plan} />

          {/* Feature comparison note */}
          <div className="mt-16 glass-card rounded-2xl p-8 text-center">
            <p className="text-slate-400 text-sm mb-4">
              Every plan includes
            </p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-slate-300">
              {[
                "✓ AI quiz generation",
                "✓ Auto transcription",
                "✓ Chapter navigation",
                "✓ Progress tracking",
                "✓ AI chat assistant",
                "✓ Cancel anytime",
              ].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
