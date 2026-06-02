'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import PartnerCheckInCard from '@/components/social/PartnerCheckInCard'

export default function AccountabilityPartnersPage() {
  const [partnerships, setPartnerships] = useState([])
  const [receiverEmail, setReceiverEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchPartnerships()
  }, [])

  const fetchPartnerships = async () => {
    try {
      const res = await fetch('/api/partners')
      if (res.ok) {
        const data = await res.json()
        setPartnerships(data.partnerships || [])
      }
    } catch (err) {
      setError('Failed to load partnerships')
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async e => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!receiverEmail) {
      setError('Please enter an email address')
      return
    }

    try {
      const meRes = await fetch('/api/auth/me')
      const meData = await meRes.json()

      const receiverRes = await fetch(`/api/auth/me`)
      const receiver = { userId: 1 }

      const res = await fetch('/api/partners/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: receiver.userId }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to send request')
        return
      }

      setSuccess(true)
      setReceiverEmail('')
      setTimeout(() => setSuccess(false), 3000)
      fetchPartnerships()
    } catch (err) {
      setError('An error occurred. Please try again.')
    }
  }

  const creatorTools = [
    {
      title: '📊 Analytics Hub',
      description: 'Analyze viewer behavior with confusion heatmaps and dropoff analytics',
      href: '/creator/dashboard#analytics',
      color: 'from-blue-500 to-cyan-500',
      features: ['Confusion Heatmap', 'Dropoff Analytics', 'Content Gap Detection'],
    },
    {
      title: '✨ AI Creation Tools',
      description: 'Generate scripts, thumbnails, and course outlines with AI',
      href: '/creator/dashboard#ai_tools',
      color: 'from-purple-500 to-pink-500',
      features: ['Script Writer', 'Thumbnail Generator', 'Course Outline Generator'],
    },
    {
      title: '📹 Video Studio',
      description: 'Upload and manage your video content',
      href: '/creator/studio',
      color: 'from-orange-500 to-red-500',
      features: ['Upload Videos', 'Manage Content', 'Track Progress'],
    },
  ]

  const activePartnerships = partnerships.filter(p => p.status === 'active')
  const pendingPartnerships = partnerships.filter(p => p.status === 'pending')

  return (
    <main className="min-h-screen bg-[#050508]">
      <Navbar />

      {/* ── Header Section ── */}
      <div className="relative px-6 md:px-12 py-12 border-b border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-sm font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Accountability Partners
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
            👥 Find Your Learning Partner
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Stay accountable and motivated with a learning partner. Check in regularly and help each other reach your goals.
          </p>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Partners Section */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Your Partners</h2>
              {loading ? (
                <div className="text-slate-400 py-8 text-center">
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                </div>
              ) : activePartnerships.length === 0 ? (
                <div className="text-slate-400 py-8 text-center">
                  <span className="text-4xl mb-3 block">🤝</span>
                  <p>No active partners yet. Find someone to pair with!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activePartnerships.map(p => (
                    <PartnerCheckInCard
                      key={p.id}
                      partnership={p}
                      onCheckInSuccess={fetchPartnerships}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Find Partner Form */}
          <div>
            <div className="glass-card rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Find a Partner</h2>
              <form onSubmit={handleSendRequest} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Partner&apos;s Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={receiverEmail}
                    onChange={e => setReceiverEmail(e.target.value)}
                    placeholder="partner@example.com"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded p-3">{error}</div>}
                {success && <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded p-3">Request sent!</div>}

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-lg transition-all glow-indigo-sm"
                >
                  Send Partner Request
                </button>
              </form>

              {pendingPartnerships.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h3 className="font-semibold text-slate-300 mb-3">Pending Requests</h3>
                  <div className="space-y-2">
                    {pendingPartnerships.map(p => (
                      <div key={p.id} className="text-sm p-3 bg-indigo-500/10 border border-indigo-500/20 rounded text-slate-300">
                        {p.partnerName}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Creator Tools Section ── */}
        <div className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-3">Creator Tools</h2>
            <p className="text-slate-400">Boost your content with our powerful creator intelligence tools</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creatorTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group"
              >
                <div className={`bg-linear-to-br ${tool.color} rounded-2xl p-6 text-white transition-all hover:scale-105 h-full cursor-pointer border border-white/10 shadow-lg`}>
                  <h3 className="text-xl font-bold mb-2">{tool.title}</h3>
                  <p className="text-white/90 text-sm mb-4">{tool.description}</p>
                  <div className="space-y-2">
                    {tool.features.map((feature, idx) => (
                      <div key={idx} className="text-xs text-white/80 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
                        {feature}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
                    Get Started →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
