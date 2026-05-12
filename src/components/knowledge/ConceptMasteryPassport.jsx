'use client'

import { useEffect, useState } from 'react'
import { Loader2, Award, Share2, Copy, Check } from 'lucide-react'
import QRCode from 'qrcode.react'
import { getMasteryTier } from '@/lib/masteryHelpers'

export default function ConceptMasteryPassport() {
  const [passport, setPassport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchPassport = async () => {
      try {
        const res = await fetch('/api/user/passport')
        if (res.ok) {
          const data = await res.json()
          setPassport(data)
        }
      } catch (error) {
        console.error('Error fetching passport:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPassport()
  }, [])

  const handleCopy = async () => {
    if (!passport) return
    try {
      await navigator.clipboard.writeText(passport.passportUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('Failed to copy')
    }
  }

  const shareToTwitter = () => {
    if (!passport) return
    const text = `Check out my Concept Mastery Passport! I've mastered ${passport.totalMastered} concepts. 🎓`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(passport.passportUrl)}`
    window.open(url, '_blank')
  }

  const shareToLinkedIn = () => {
    if (!passport) return
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(passport.passportUrl)}`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="bg-zinc-800/60 rounded-xl border border-zinc-700 p-8 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-4" />
        <p className="text-zinc-300 text-sm">Loading your passport...</p>
      </div>
    )
  }

  if (!passport) {
    return (
      <div className="bg-zinc-800/60 rounded-xl border border-zinc-700 p-8">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-zinc-400" />
          <h3 className="font-semibold text-white">Concept Mastery Passport</h3>
        </div>
        <p className="text-zinc-400 text-sm text-center py-12">
          Start learning to create your mastery passport
        </p>
      </div>
    )
  }

  const topConcepts = passport.topConcepts || []

  return (
    <div className="bg-zinc-800/60 rounded-xl border border-zinc-700 overflow-hidden">
      {/* Passport Card */}
      <div className="p-8 bg-gradient-to-br from-zinc-800 to-zinc-900 border-b border-zinc-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Content Section */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-6 h-6 text-red-600" />
                <h3 className="text-2xl font-bold text-white">Concept Mastery Passport</h3>
              </div>
              <p className="text-xs text-zinc-400">
                {passport.email.split('@')[0]}@···
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
            <div>
              <p className="text-xs font-semibold text-zinc-300 uppercase mb-2">Top Mastered Concepts</p>
              <div className="space-y-2">
                {topConcepts.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-zinc-700/20 rounded border border-zinc-600/20">
                    <span className="text-xs text-zinc-300">{c}</span>
                    <span className="text-xs font-bold text-green-400">✓ Mastered</span>
                  </div>
                ))}
              </div>
            </div>

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
            <p className="text-xs text-zinc-400 font-semibold">Scan to verify</p>
            <div className="bg-white p-3 rounded-lg">
              <QRCode
                value={passport.passportUrl}
                size={150}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-xs text-zinc-500 text-center">
              Share your learning achievements
            </p>
          </div>
        </div>
      </div>

      {/* Sharing Controls */}
      <div className="p-6 space-y-4">
        <p className="text-xs font-semibold text-zinc-300 uppercase">Share Your Passport</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-700/40 hover:bg-zinc-700/60 border border-zinc-600/50 text-xs text-zinc-300 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Link
              </>
            )}
          </button>
          <button
            onClick={shareToTwitter}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-700/40 hover:bg-zinc-700/60 border border-zinc-600/50 text-xs text-zinc-300 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Twitter
          </button>
          <button
            onClick={shareToLinkedIn}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-700/40 hover:bg-zinc-700/60 border border-zinc-600/50 text-xs text-zinc-300 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            LinkedIn
          </button>
        </div>
      </div>
    </div>
  )
}
