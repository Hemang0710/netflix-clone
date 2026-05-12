import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import QRCode from 'qrcode.react'
import { Award, Share2, Copy } from 'lucide-react'
import Link from 'next/link'

async function getPassportData(userId) {
  try {
    const numUserId = parseInt(userId)

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: numUserId },
      select: { id: true, email: true },
    })

    if (!user) return null

    // Get mastery records
    const masteryRecords = await prisma.conceptMastery.findMany({
      where: { userId: numUserId },
      orderBy: { masteryScore: 'desc' },
    })

    // Get review sessions
    const reviewSessions = await prisma.reviewSession.findMany({
      where: { userId: numUserId },
    })

    // Calculate statistics
    const totalConcepts = masteryRecords.length
    const totalMastered = masteryRecords.filter((m) => m.masteryScore >= 80).length
    const topConcepts = masteryRecords
      .filter((m) => m.masteryScore >= 80)
      .slice(0, 5)
      .map((m) => m.concept)

    // Tier breakdown
    const tierBreakdown = {
      Mastered: masteryRecords.filter((m) => m.masteryScore >= 80).length,
      Proficient: masteryRecords.filter((m) => m.masteryScore >= 60 && m.masteryScore < 80).length,
      Developing: masteryRecords.filter((m) => m.masteryScore >= 40 && m.masteryScore < 60).length,
      Beginning: masteryRecords.filter((m) => m.masteryScore < 40).length,
    }

    return {
      userId: user.id,
      email: user.email,
      totalConcepts,
      totalMastered,
      topConcepts,
      tierBreakdown,
      totalReviews: reviewSessions.length,
    }
  } catch (error) {
    console.error('Error getting passport data:', error)
    return null
  }
}

export default async function PassportPage({ params }) {
  const passport = await getPassportData(params.userId)

  if (!passport) {
    notFound()
  }

  const passportUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/passport/${params.userId}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-black p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Back Link */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            ← Back to app
          </Link>
        </div>

        {/* Passport Card */}
        <div className="bg-zinc-800/60 rounded-xl border border-zinc-700 overflow-hidden">
          <div className="p-8 bg-gradient-to-br from-zinc-800 to-zinc-900 border-b border-zinc-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Content Section */}
              <div className="md:col-span-2 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-6 h-6 text-red-600" />
                    <h1 className="text-2xl font-bold text-white">Concept Mastery Passport</h1>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Learning Journey Achievement Record
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-700/30 rounded-lg p-4 border border-zinc-600/30">
                    <p className="text-xs text-zinc-400 mb-1">Total Mastered</p>
                    <p className="text-3xl font-bold text-green-400">{passport.totalMastered}</p>
                    <p className="text-xs text-zinc-500 mt-1">/ {passport.totalConcepts}</p>
                  </div>
                  <div className="bg-zinc-700/30 rounded-lg p-4 border border-zinc-600/30">
                    <p className="text-xs text-zinc-400 mb-1">Review Sessions</p>
                    <p className="text-3xl font-bold text-blue-400">{passport.totalReviews}</p>
                  </div>
                </div>

                {/* Top Concepts */}
                {passport.topConcepts.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-zinc-300 uppercase mb-2">Top Mastered Concepts</p>
                    <div className="space-y-2">
                      {passport.topConcepts.map((c, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 bg-zinc-700/20 rounded border border-zinc-600/20">
                          <span className="text-xs text-zinc-300">{c}</span>
                          <span className="text-xs font-bold text-green-400">✓</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tier Breakdown */}
                <div>
                  <p className="text-xs font-semibold text-zinc-300 uppercase mb-2">Mastery Breakdown</p>
                  <div className="space-y-1">
                    {Object.entries(passport.tierBreakdown || {}).map(([tier, count]) => (
                      <div key={tier} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">{tier}</span>
                        <span className="text-zinc-300 font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="flex flex-col items-center gap-4 border-t md:border-t-0 md:border-l border-zinc-700 pt-6 md:pt-0 md:pl-6">
                <p className="text-xs text-zinc-400 font-semibold">Scan to view</p>
                <div className="bg-white p-3 rounded-lg">
                  <QRCode
                    value={passportUrl}
                    size={150}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs text-zinc-500 text-center">
                  Shared Learning Achievement
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-zinc-900/50 border-t border-zinc-700">
            <p className="text-xs text-zinc-500 text-center">
              This passport verifies {passport.email.split('@')[0]}'s learning achievements
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }) {
  const passport = await getPassportData(params.userId)

  if (!passport) {
    return {
      title: 'Passport Not Found',
    }
  }

  return {
    title: `${passport.email.split('@')[0]}'s Concept Mastery Passport`,
    description: `${passport.totalMastered} concepts mastered from ${passport.totalConcepts} total concepts.`,
  }
}
